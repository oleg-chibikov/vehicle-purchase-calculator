// The text around the numbers: notes, the cost breakdown, FBT and the formulas. Each line names its sources.
import type { Option, Result } from './calc';
import { DUTY, dutyText } from './duty';
import { dayBefore, longDate, pct, plural, usd } from './format';
import type { Inputs } from './inputs';
import {
  APRA_BUFFER, CAR_LIMIT, CAR_TYPES, EV_ANNOUNCED, EV_DISCOUNT_RATE, EV_FULL_CAP, EV_PHASE2, EV_PHASE3, FBT_RATE, GROSS_UP_TYPE1, GROSS_UP_TYPE2,
  GST, HOME_DEPOSIT, HOME_LOAN_YEARS, LCT_FUEL_EFFICIENT, PHEV_CUTOFF, RESIDUAL, RULES_CHECKED, STATUTORY_RATE, TAX_YEAR, TAX_YEAR_END
} from './rules';
import type { SourceKey } from './sources';

export interface Line { text: string; src?: SourceKey[] }

// One line of the cost breakdown, in whole dollars. The formula shows the cents.
export interface SplitLine { label: string; value: number; formula: string; src: SourceKey[] }

export function costNote(i: Inputs, r: Result, now: string): Line[] {
  return [
    { text: 'Cost = the account with no car (' + usd(r.noCar.end) + ' at the end) minus the account with the car. You own the car in all three cases. Its resale value is not counted.' },
    { text: 'The account starts with the cash today. Each month all take-home salary goes in, less what the car costs that month. Living costs are not taken out.' },
    ...bonusNote(i, r),
    {
      text: i.account === 'savings'
        ? 'The account earns ' + i.accountRate + '% a year, taxed as savings interest.'
        : 'The offset saves ' + i.accountRate + '% a year, tax free, on the balance up to the mortgage owing of ' + usd(Math.max(i.mortgage, 0)) + '. Cash above that saves no interest. A balance below zero adds to the mortgage at the same rate.',
      src: ['assumeRates']
    },
    fbtExplain(i, r, now)[0]
  ];
}

// Where the cost goes: whole dollars that add up to the total shown.
export function splitLines(i: Inputs, r: Result, k: Option): SplitLine[] {
  const p = r.parts[k], yrs = ' x ' + plural(i.years, 'year');
  const how: Record<keyof typeof p, [string, string, SourceKey[]]> = {
    car: ['The car, price and stamp duty', 'Price ' + usd(i.price, true) + ' + stamp duty ' + usd(r.duty, true) + ' = ' + usd(p.car, true), DUTY[i.state].src],
    finance: k === 'lease'
      ? ['Lease interest and fees', usd(r.leaseMonthly, true) + ' x ' + r.n + ' payments + residual ' + usd(r.residual, true) + ' - amount financed ' + usd(r.financed, true) + (i.fee ? ' + fees ' + usd(i.fee, true) + yrs : '') + ' = ' + usd(p.finance ?? 0, true), ['assumeRates', 'residual']]
      : ['Loan interest', usd(r.loanMonthly, true) + ' x ' + r.n + ' repayments - amount borrowed ' + usd(r.upfront, true) + ' = ' + usd(p.finance ?? 0, true), ['assumeRates']],
    running: ['Running costs', '(rego ' + usd(i.rego, true) + ' + insurance ' + usd(i.insurance, true) + ' + servicing ' + usd(i.service, true) + ' + fuel or charging ' + usd(i.charging, true) + ')' + yrs + ' = ' + usd(p.running, true), ['assumeFuel']],
    gst: [(p.gst ?? 0) > 0 ? 'GST paid, net' : 'GST saved', 'GST credit on the car ' + usd(r.gstCredit, true) + ' - GST on the balloon ' + usd(r.balloon - r.residual, true) + ' + GST saved on running costs ' + usd(r.runningFull - r.leaseRunningYear, true) + yrs + (r.ecmGst ? ' - GST on the post-tax contribution ' + usd(r.ecmGst, true) + yrs : '') + ' = ' + usd(-(p.gst ?? 0), true), ['gst', 'carLimit', 'assumeFuelGst', 'ecmGst']],
    fbt: ['Fringe benefits tax', usd(r.fbtTax, true) + ' a year' + yrs + ' = ' + usd(p.fbt ?? 0, true), ['fbtRates']],
    tax: [(p.tax ?? 0) > 0 ? 'Extra income tax' : 'Income tax saved', 'Tax on the pay ' + usd(r.salaryTax.total, true) + ' - tax with the lease ' + usd(r.leaseTax.total, true) + ' = ' + usd(r.salaryTax.total - r.leaseTax.total, true) + ' a year' + yrs + ' = ' + usd(-(p.tax ?? 0), true), ['tax', 'medicare']]
  };
  const total = Math.round(r.cost[k]), out: SplitLine[] = [];
  let rest = total;
  for (const key of Object.keys(p) as (keyof typeof p)[]) {
    const v = Math.round(p[key] ?? 0);
    rest -= v;
    if (v) out.push({ label: how[key][0], value: v, formula: how[key][1], src: how[key][2] });
  }
  // The rest is what the account would have earned on the money spent, after any tax on that interest.
  if (rest) {
    out.push({
      label: 'Interest the account missed', value: rest, src: ['assumeRates'],
      formula: 'Total ' + usd(total) + ' minus the lines above = ' + usd(rest) + ', in whole dollars. The money spent on the car would have earned ' + i.accountRate + '% a year'
        + (i.account === 'savings' ? ', less tax on that interest.' : ' in the offset, on the part of the balance up to the mortgage owing.')
    });
  }
  return out;
}

// The sum that gives the account at the end of the term.
export function endFormula(i: Inputs, r: Result, k: Option): string {
  const s = r.account[k];
  const start = k === 'cash' ? 'cash today ' + usd(i.start, true) + ' - price and stamp duty ' + usd(r.upfront, true) : 'cash today ' + usd(i.start, true);
  return start + ' + take-home pay left after the car ' + usd(r.flow[k], true) + ' a year x ' + plural(i.years, 'year')
    + (i.account === 'savings' ? ' + interest ' : ' + mortgage interest saved ') + usd(s.interest, true)
    + (s.interestTax ? ' - tax on it ' + usd(s.interestTax, true) : '')
    + (k === 'lease' ? ' - balloon ' + usd(r.balloon, true) : '') + ' = ' + usd(s.end, true)
    + '. With no car, take-home pay ' + usd(r.noCarYearCash, true) + ' a year goes in and the account ends at ' + usd(r.noCar.end, true) + '.';
}

// The bonus goes in once a year, so it earns interest for less time than the same money paid as salary.
// How much less a bank would lend for a home while the car is being paid off, and how that is worked out.
export function borrowText(i: Inputs, r: Result, k: Option): { value: string; formula: string } {
  const less = r.borrowLess[k], m = r.borrowMonthly[k];
  const test = 'The bank tests a new mortgage at ' + i.homeRate + '% + ' + APRA_BUFFER * 100 + '% buffer over ' + HOME_LOAN_YEARS + ' years: '
    + usd(r.homeMonthlyPer1 * 100000, true) + ' a month for every ' + usd(100000) + ' borrowed.';
  const per = (x: number) => usd(x, true) + ' a month / ' + usd(r.homeMonthlyPer1 * 100000, true) + ' x ' + usd(100000) + ' = ' + usd(x / r.homeMonthlyPer1);
  if (k === 'cash') {
    return {
      value: usd(0) + ' from the pay',
      formula: 'No repayment, so the pay the bank sees stays the same. The account holds ' + usd(r.upfront) + ' less for a deposit. '
        + 'If the deposit is what limits the loan, that is ' + usd(r.upfront / HOME_DEPOSIT) + ' less home price with a ' + pct(HOME_DEPOSIT) + ' deposit.'
    };
  }
  const ends = ' It lasts while the car is paid off, ' + plural(i.years, 'year') + '.';
  if (k === 'loan') return { value: usd(less[0]), formula: test + ' Repayment ' + per(m[0]) + '.' + ends };
  return {
    value: usd(Math.min(...less)) + ' to ' + usd(Math.max(...less)),
    formula: test + ' Banks count a novated lease in one of two ways.'
      + ' Payslip as it is, take-home pay drops by ' + per(m[0]) + '.'
      + ' Salary sacrifice added back and the whole lease payment taken off, ' + per(m[1]) + '.'
      + ' That payment holds ' + usd(r.leaseRunningYear / 12, true) + ' a month of running costs. The bank already counts living costs, so these may count twice.' + ends
      + ' The balloon of ' + usd(r.balloon) + ' is due at the end.'
  };
}

function bonusNote(i: Inputs, r: Result): Line[] {
  if (i.bonus <= 0) return [];
  return [{
    text: i.bonusKind === 'cash'
      ? 'The bonus of ' + usd(i.bonus) + ' is taxed with the salary. After its tax, ' + usd(r.lump) + ' goes in once a year, at the end of each year of the term.'
      : 'The shares worth ' + usd(i.bonus) + ' are taxed with the salary but stay out of the account. Their tax of ' + usd(-r.lump) + ' comes out once a year, at the end of each year of the term.',
    src: ['bonus', 'tax']
  }];
}

export function formulaLines(i: Inputs, r: Result): Line[] {
  return [
    { text: 'Stamp duty, ' + i.state + ': ' + dutyText(i) + ' = ' + usd(r.duty, true), src: DUTY[i.state].src },
    { text: 'GST credit = min(price / 11, car limit / 11) = min(' + usd(i.price / 11, true) + ', ' + usd(CAR_LIMIT / 11, true) + ') = ' + usd(r.gstCredit, true), src: ['gst', 'carLimit'] },
    { text: 'Financed = price - GST credit + stamp duty = ' + usd(i.price, true) + ' - ' + usd(r.gstCredit, true) + ' + ' + usd(r.duty, true) + ' = ' + usd(r.financed, true), src: ['carLimit'] },
    { text: 'Residual = financed x ' + i.balloonPct + '% = ' + usd(r.residual, true) + ', balloon with GST = residual x ' + (1 + GST).toFixed(2) + ' = ' + usd(r.balloon, true), src: ['residual', 'gst'] },
    { text: 'r = ' + i.leaseRate + '% / 12 = ' + (i.leaseRate / 12).toFixed(4) + '% per month, n = ' + r.n + ' months', src: ['assumeRates'] },
    { text: 'Payment = (Financed - Residual / (1+r)^n) x r / (1 - (1+r)^-n)' },
    { text: '        = ' + usd(r.leaseMonthly, true) + ' per month, paid at the end of each month' }
  ];
}

export function warnings(i: Inputs, now: string): Line[] {
  const out: Line[] = [];
  if (now > TAX_YEAR_END) {
    out.push({ text: 'Tax rates, thresholds and FBT rules on this page are for ' + TAX_YEAR + ', checked on ' + RULES_CHECKED + '. Check them for the current year.', src: ['tax', 'fbtRates'] });
  }
  if (i.carType !== 'ice' && i.price > LCT_FUEL_EFFICIENT) {
    out.push({ text: 'The price is above the luxury car tax threshold for fuel-efficient cars (' + usd(LCT_FUEL_EFFICIENT) + ' for ' + TAX_YEAR + '). The car gets no FBT exemption, so the lease includes a post-tax contribution.', src: ['lct', 'evExempt'] });
  }
  if (i.balloonPct < RESIDUAL[i.years] - 0.005) {
    out.push({ text: 'The ATO minimum balloon for a ' + i.years + '-year lease is ' + RESIDUAL[i.years] + '%. A lower value is not accepted by lenders.', src: ['residual'] });
  }
  return out;
}

// The FBT card: the result, the reason, the formula and the rules by start date.
export function fbtExplain(i: Inputs, r: Result, now: string): Line[] {
  const f = r.fbt, out: Line[] = [], blank = { text: '' };
  const verdict = f.exempt ? 'exempt from FBT.' : f.rate < STATUTORY_RATE ? 'FBT at a ' + pct(f.rate) + ' statutory rate.' : 'no FBT exemption.';
  out.push({ text: CAR_TYPES[i.carType].name + ', first used ' + longDate(i.startDate) + ', ' + usd(i.price) + ': ' + verdict + ' ' + f.why, src: f.src });
  out.push(blank);
  if (f.exempt && r.reportableValue > 0) {
    out.push({ text: 'Value for reporting = ' + pct(STATUTORY_RATE) + ' x base value ' + usd(i.price, true) + ' = ' + usd(r.reportableValue, true) + ' per year', src: ['statutory', 'evExempt'] });
    out.push({ text: 'Reportable fringe benefit = ' + usd(r.reportableValue, true) + ' x ' + GROSS_UP_TYPE2 + ' = ' + usd(r.rfba, true) + ' per year', src: ['fbtRates'] });
    out.push({ text: 'It is not taxed. It counts for the Medicare levy surcharge, HELP repayments, family payments and child support.', src: ['rfba'] });
  } else if (f.exempt) {
    out.push({ text: 'The announced 0% statutory rate leaves a taxable value of $0, so there is nothing to report. Not yet law.', src: ['evChange', 'fbtRates'] });
  } else {
    out.push({ text: 'Taxable value = ' + pct(f.rate) + ' x base value ' + usd(i.price, true) + ' = ' + usd(r.statutory, true) + ' per year', src: f.rate < STATUTORY_RATE ? ['statutory', 'evChange'] : ['statutory'] });
    out.push({ text: 'Base value = the price with GST and dealer delivery, without stamp duty and rego', src: ['statutory'] });
    out.push({ text: 'Post-tax contribution = ' + usd(r.ecm, true) + ' per year from take-home pay. The taxable value left is ' + usd(r.statutory - r.ecm, true), src: ['statutory'] });
    out.push({ text: 'GST the employer pays on it = ' + usd(r.ecm, true) + ' / 11 = ' + usd(r.ecmGst, true) + '. The pre-tax part drops by ' + usd(r.ecm - r.ecmGst, true), src: ['ecmGst'] });
    if (r.fbtTax > 0.005) {
      out.push({ text: 'The contribution is capped at the yearly package with GST. FBT on the rest = ' + usd(r.statutory - r.ecm, true) + ' x ' + GROSS_UP_TYPE1 + ' x ' + pct(FBT_RATE) + ' = ' + usd(r.fbtTax, true) + ' per year, charged pre-tax', src: ['fbtRates'] });
    }
    out.push({ text: 'Not modelled: the base value drops by a third after 4 years. A 5-year lease would need a smaller contribution near the end.', src: ['oneThird'] });
  }
  out.push(blank);
  if (i.carType === 'ev') {
    const phase = i.startDate < EV_PHASE2 ? 1 : i.startDate < EV_PHASE3 ? 2 : 3;
    const here = (p: number) => (p === phase ? '   <- this start date' : '');
    out.push({ text: 'Electric car FBT by start date. Announced ' + longDate(EV_ANNOUNCED) + ', not yet law on ' + longDate(RULES_CHECKED), src: ['evChange'] });
    out.push({ text: '- Start before ' + longDate(EV_PHASE2) + ': full exemption for the whole lease' + here(1), src: ['evExempt', 'evChange'] });
    out.push({ text: '- Start ' + longDate(EV_PHASE2) + ' to ' + longDate(dayBefore(EV_PHASE3)) + ': full exemption at ' + usd(EV_FULL_CAP) + ' or less, ' + pct(EV_DISCOUNT_RATE) + ' statutory rate above' + here(2), src: ['evChange'] });
    out.push({ text: '- Start from ' + longDate(EV_PHASE3) + ': ' + pct(EV_DISCOUNT_RATE) + ' statutory rate at any price under the LCT threshold' + here(3), src: ['evChange', 'lct'] });
    out.push({ text: '- A lease keeps the rules it started with. Refinancing or a new lease starts again under the rules of that day.', src: ['evChange'] });
    out.push({ text: '- The announcement does not define the ' + usd(EV_FULL_CAP) + ' price. The page compares it with the car price input.', src: ['evChange'] });
    out.push({
      text: now < EV_PHASE2
        ? '- Today is ' + longDate(now) + '. A lease that starts by ' + longDate(dayBefore(EV_PHASE2)) + ' keeps the full exemption.'
        : '- Today is ' + longDate(now) + ', after ' + longDate(EV_PHASE2) + '. Check on ato.gov.au whether the change became law and in what form.',
      src: ['evChange']
    });
  } else if (i.carType === 'phev') {
    out.push({ text: 'Plug-in hybrids: no exemption for a car first used from ' + longDate(PHEV_CUTOFF) + '. One used before then keeps it to the end of the fixed lease term, without optional extensions.', src: ['phev'] });
  } else {
    out.push({ text: 'Petrol, diesel and regular hybrid cars have no FBT concession. Only the full ' + pct(STATUTORY_RATE) + ' rule applies.', src: ['statutory', 'evExempt'] });
  }
  return out;
}
