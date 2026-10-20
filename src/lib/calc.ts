// The calculation: tax, loan and lease payments, the account balance month by month, and the total cost of each option.
import { stampDuty } from './duty';
import { fbtStatus } from './fbt';
import type { Inputs } from './inputs';
import {
  CAR_LIMIT, CAR_TYPES, FBT_RATE, GROSS_UP_TYPE1, GROSS_UP_TYPE2, GST, MEDICARE, REPORTABLE_OVER, STATUTORY_RATE, TIERS, type Tier
} from './rules';

export type Option = 'lease' | 'loan' | 'cash';
export type Result = ReturnType<typeof calc>;

export interface TierTax extends Tier { inBand: number; tax: number }
export interface Tax { taxable: number; rows: TierTax[]; incomeTax: number; medicare: number; total: number }
export interface Account { years: number[]; end: number; tax: Omit<Tax, 'rows'>; interest: number; interestTax: number }

// What each option spends over the term, by kind. The rest of the cost is interest the account did not earn.
export interface Parts { car: number; finance?: number; running: number; gst?: number; fbt?: number; tax?: number }

export function calc(i: Inputs) {
  const n = i.years * 12;
  const duty = stampDuty(i);
  const upfront = i.price + duty;

  // Novated lease: the employer claims the GST back, capped by the car limit. Stamp duty has no GST and is financed.
  const gstCredit = Math.min(i.price / 11, CAR_LIMIT / 11);
  const financed = i.price - gstCredit + duty;
  // The ATO residual is a share of the amount financed without GST. GST is added when the car is bought at the end.
  const residual = financed * i.balloonPct / 100;
  const balloon = residual * (1 + GST);
  const leaseMonthly = pmt(i.leaseRate / 1200, n, financed, residual);
  // Running costs paid through the lease: GST is recovered on insurance, servicing and fuel bought on a card.
  // Home charging is reimbursed with no GST saving, so only the petrol share of the fuel budget drops.
  const runningFull = i.rego + i.insurance + i.service + i.charging;
  const fuelWithGst = i.charging * CAR_TYPES[i.carType].fuelGstShare;
  const fuelPre = i.charging - fuelWithGst + fuelWithGst / (1 + GST);
  const leaseRunningPre = i.rego + (i.insurance + i.service) / (1 + GST) + (i.chargingInLease ? fuelPre : 0);
  const leaseRunningPost = i.chargingInLease ? 0 : i.charging;
  const packageYear = leaseMonthly * 12 + i.fee + leaseRunningPre;

  // FBT, statutory formula: a share of the base value a year. The base value is the price with GST, without stamp duty and rego.
  const fbt = fbtStatus(i);
  const statutory = fbt.rate * i.price;
  let ecm = 0, ecmGst = 0, fbtTax = 0, rfba = 0, reportableValue = 0;
  if (fbt.exempt) {
    // Under current law the exempt benefit is still valued at 20% and reported once over $2,000.
    // The announced 0% rate leaves no taxable value to report.
    reportableValue = fbt.announced ? 0 : STATUTORY_RATE * i.price;
    rfba = reportableValue > REPORTABLE_OVER ? reportableValue * GROSS_UP_TYPE2 : 0;
  } else {
    // A post-tax contribution equal to the taxable value takes it to zero. The employer pays one eleventh of it as GST.
    ecm = Math.min(statutory, packageYear * (1 + GST));
    ecmGst = ecm / 11;
    // Any taxable value left after the contribution is taxed and charged to the package.
    fbtTax = (statutory - ecm) * GROSS_UP_TYPE1 * FBT_RATE;
  }
  // A bonus is taxed with the salary. Shares the person keeps are taxed too, but no cash from them reaches the account.
  const income = i.salary + i.bonus;
  const kept = i.bonusKind === 'shares' ? i.bonus : 0;
  const leasePretaxYear = packageYear - (ecm - ecmGst) + fbtTax;
  const leaseTaxable = income - leasePretaxYear;
  const leaseTax = taxOn(leaseTaxable);
  const leaseTakeHome = leaseTaxable - leaseTax.total;
  const leaseYearCash = leaseTakeHome - kept - leaseRunningPost - ecm;

  // Loan: price and stamp duty borrowed, repayments come out of take-home pay.
  const loanMonthly = pmt(i.loanRate / 1200, n, upfront, 0);
  const salaryTax = taxOn(income);
  const takeHome = income - salaryTax.total;
  const noCarYearCash = takeHome - kept;
  const loanYearCash = noCarYearCash - loanMonthly * 12 - runningFull;

  // Cash purchase: price and stamp duty leave the account on day one.
  const cashYearCash = noCarYearCash - runningFull;
  const cashStart = i.start - upfront;

  // Take-home salary goes into the account once a month. Each option pays its car costs out of it first.
  // The bonus after its own tax goes in once a year. With shares kept, only their tax comes out.
  const flow: Record<Option, number> = { lease: leaseYearCash, loan: loanYearCash, cash: cashYearCash };
  const leaseLump = bonusLump(i, leaseTaxable), lump = bonusLump(i, income);
  const lease = simulate(i, i.start, flow.lease, leaseLump, leaseTaxable, balloon);
  const loan = simulate(i, i.start, flow.loan, lump, income, 0);
  const cash = simulate(i, cashStart, flow.cash, lump, income, 0);
  // Baseline: same pay, same tax, same account, no car at all.
  const noCar = simulate(i, i.start, noCarYearCash, lump, income, 0);

  const running = runningFull * i.years;
  const gstSaved = gstCredit - residual * GST + (runningFull - leaseRunningPre - leaseRunningPost - ecmGst) * i.years;
  const parts: Record<Option, Parts> = {
    lease: {
      car: upfront, finance: leaseMonthly * n + residual - financed + i.fee * i.years, running,
      gst: -gstSaved, fbt: fbtTax * i.years, tax: -(salaryTax.total - leaseTax.total) * i.years
    },
    loan: { car: upfront, finance: loanMonthly * n - upfront, running },
    cash: { car: upfront, running }
  };

  return {
    parts, n, duty, upfront, gstCredit, financed, residual, balloon,
    income, kept, leaseLump, lump, noCarYearCash,
    leaseMonthly, leasePretaxYear, leaseTax, leaseTakeHome, leaseYearCash,
    loanMonthly, salaryTax, takeHome, loanYearCash,
    cashYearCash, cashStart, flow,
    account: { lease, loan, cash } as Record<Option, Account>, noCar,
    cost: { lease: noCar.end - lease.end, loan: noCar.end - loan.end, cash: noCar.end - cash.end } as Record<Option, number>,
    totalPaid: {
      lease: leaseMonthly * n + i.fee * i.years + balloon + (leaseRunningPre + leaseRunningPost + ecmGst + fbtTax) * i.years,
      loan: loanMonthly * n + runningFull * i.years,
      cash: upfront + runningFull * i.years
    } as Record<Option, number>,
    runningFull, leaseRunningPost, leaseRunningYear: leaseRunningPre + leaseRunningPost,
    fbt, statutory, reportableValue, ecm, ecmGst, fbtTax, rfba, packageYear
  };
}

// The monthly payment that takes `pv` down to `fv` over `n` months, paid at the end of each month.
export function pmt(ratePerMonth: number, n: number, pv: number, fv = 0): number {
  if (ratePerMonth === 0) return (pv - fv) / n;
  const g = Math.pow(1 + ratePerMonth, -n);
  return (pv - fv * g) * ratePerMonth / (1 - g);
}

export function taxOn(taxable: number): Tax {
  const t = Math.max(taxable, 0);
  let incomeTax = 0;
  const rows = TIERS.map((b) => {
    const inBand = Math.max(0, Math.min(t, b.to) - b.from);
    const tax = inBand * b.rate;
    incomeTax += tax;
    return { ...b, inBand, tax };
  });
  const medicare = t * MEDICARE;
  return { taxable: t, rows, incomeTax, medicare, total: incomeTax + medicare };
}

// What the bonus adds to the account once a year: the cash bonus less the extra tax it brings.
function bonusLump(i: Inputs, taxable: number): number {
  const kept = i.bonusKind === 'shares' ? i.bonus : 0;
  return i.bonus - kept - (taxOn(taxable).total - taxOn(taxable - i.bonus).total);
}

// Month by month: interest on the opening balance, then the month's pay left after the car.
// `yearCash` holds the whole year, `lump` included. The lump goes in after the twelfth month.
// Savings interest is taxed at the end of each year. Offset interest is tax free.
// A negative balance costs the same rate and gives no tax deduction.
function simulate(i: Inputs, startBalance: number, yearCash: number, lump: number, salaryTaxable: number, endPayment: number): Account {
  const monthlyRate = i.accountRate / 1200, offset = i.account !== 'savings', owing = Math.max(i.mortgage, 0);
  const salaryTax = taxOn(salaryTaxable);
  const years: number[] = [], taxes: Tax[] = [];
  let bal = startBalance, interestTotal = 0, interestTaxTotal = 0;
  for (let y = 1; y <= i.years; y++) {
    let interestYear = 0, taxableInterest = 0;
    for (let m = 0; m < 12; m++) {
      // An offset saves interest only on the part of the balance up to the mortgage owing. Below zero the mortgage grows.
      const interest = (offset ? Math.min(bal, owing) : bal) * monthlyRate;
      bal += interest + (yearCash - lump) / 12;
      interestYear += interest;
      if (interest > 0) taxableInterest += interest;
    }
    bal += lump;
    const tax = i.account === 'savings' ? taxOn(salaryTaxable + taxableInterest) : salaryTax;
    const interestTax = tax.total - salaryTax.total;
    bal -= interestTax;
    interestTotal += interestYear;
    interestTaxTotal += interestTax;
    taxes.push(tax);
    years.push(bal);
  }
  return { years, end: bal - endPayment, tax: sumTax(taxes), interest: interestTotal, interestTax: interestTaxTotal };
}

function sumTax(list: Tax[]): Omit<Tax, 'rows'> {
  const s = { taxable: 0, incomeTax: 0, medicare: 0, total: 0 };
  for (const t of list) {
    s.taxable += t.taxable; s.incomeTax += t.incomeTax; s.medicare += t.medicare; s.total += t.total;
  }
  return s;
}
