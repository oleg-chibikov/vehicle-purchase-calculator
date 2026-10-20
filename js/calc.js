// The calculation: tax, loan and lease payments, the account balance month by month, and the total cost of each option.
function pmt(ratePerMonth, n, pv, fv) {
  fv = fv || 0;
  if (ratePerMonth === 0) return (pv - fv) / n;
  var g = Math.pow(1 + ratePerMonth, -n);
  return (pv - fv * g) * ratePerMonth / (1 - g);
}

function taxOn(taxable) {
  var rows = [], total = 0;
  var t = Math.max(taxable, 0);
  for (var k = 0; k < TIERS.length; k++) {
    var b = TIERS[k];
    var inBand = Math.max(0, Math.min(t, b.to) - b.from);
    var tax = inBand * b.rate;
    total += tax;
    rows.push({ from: b.from, to: b.to, rate: b.rate, inBand: inBand, tax: tax });
  }
  var medicare = t * MEDICARE;
  return { taxable: t, rows: rows, incomeTax: total, medicare: medicare, total: total + medicare };
}

function sumTax(list) {
  var s = { taxable: 0, incomeTax: 0, medicare: 0, total: 0 };
  list.forEach(function (t) {
    s.taxable += t.taxable; s.incomeTax += t.incomeTax; s.medicare += t.medicare; s.total += t.total;
  });
  return s;
}

// Month by month: interest on the opening balance, then the month's car money in or out.
// Savings interest is taxed at the end of each year. Offset interest is tax free.
// A negative balance costs the same rate and gives no tax deduction.
function simulate(i, startBalance, yearCash, salaryTaxable, endPayment) {
  var monthlyRate = i.accountRate / 1200, offset = i.account !== 'savings', owing = Math.max(i.mortgage, 0);
  var bal = startBalance, years = [], taxes = [], interestTotal = 0, interestTaxTotal = 0;
  var salaryTax = taxOn(salaryTaxable);
  for (var y = 1; y <= i.years; y++) {
    var interestYear = 0, taxableInterest = 0;
    for (var m = 0; m < 12; m++) {
      // An offset saves interest only on the part of the balance up to the mortgage owing. Below zero the mortgage grows.
      var interest = (offset ? Math.min(bal, owing) : bal) * monthlyRate;
      bal += interest + yearCash / 12;
      interestYear += interest;
      if (interest > 0) taxableInterest += interest;
    }
    var tax = i.account === 'savings' ? taxOn(salaryTaxable + taxableInterest) : salaryTax;
    var interestTax = tax.total - salaryTax.total;
    bal -= interestTax;
    interestTotal += interestYear;
    interestTaxTotal += interestTax;
    taxes.push(tax);
    years.push(bal);
  }
  return { years: years, end: bal - (endPayment || 0), tax: sumTax(taxes),
    interest: interestTotal, interestTax: interestTaxTotal };
}

function calc(i) {
  var n = i.years * 12;
  var duty = stampDuty(i);
  var upfront = i.price + duty;

  // Novated lease: the employer claims the GST back, capped by the car limit. Stamp duty has no GST and is financed.
  var gstCredit = Math.min(i.price / 11, CAR_LIMIT / 11);
  var financed = i.price - gstCredit + duty;
  // The ATO residual is a share of the amount financed without GST. GST is added when the car is bought at the end.
  var residual = financed * i.balloonPct / 100;
  var balloon = residual * (1 + GST);
  var leaseMonthly = pmt(i.leaseRate / 1200, n, financed, residual);
  // Running costs paid through the lease: GST is recovered on insurance, servicing and bought fuel.
  // Home charging of an electric car is reimbursed with no GST saving.
  var runningFull = i.rego + i.insurance + i.service + i.charging;
  var fuelPre = i.carType === 'ev' ? i.charging : i.charging / (1 + GST);
  var leaseRunningPre = i.rego + (i.insurance + i.service) / (1 + GST) + (i.chargingInLease ? fuelPre : 0);
  var leaseRunningPost = i.chargingInLease ? 0 : i.charging;
  var packageYear = leaseMonthly * 12 + i.fee + leaseRunningPre;

  // FBT, statutory formula: a share of the base value a year. The base value is the price with GST, without stamp duty and rego.
  var fbt = fbtStatus(i);
  var statutory = fbt.rate * i.price;
  var ecm = 0, ecmGst = 0, fbtTax = 0, rfba = 0, reportableValue = 0;
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
  var leasePretaxYear = packageYear - (ecm - ecmGst) + fbtTax;
  var leaseTaxable = i.salary - leasePretaxYear;
  var leaseTax = taxOn(leaseTaxable);
  var leaseYearCash = i.salary - leasePretaxYear - leaseTax.total - leaseRunningPost - ecm;

  // Loan: price and stamp duty borrowed, repayments come out of take-home pay.
  var loanMonthly = pmt(i.loanRate / 1200, n, upfront, 0);
  var salaryTax = taxOn(i.salary);
  var takeHome = i.salary - salaryTax.total;
  var loanYearCash = takeHome - loanMonthly * 12 - runningFull;

  // Cash purchase: price and stamp duty leave the account on day one.
  var cashYearCash = takeHome - runningFull;
  var cashStart = i.start - upfront;

  // The account holds the cash today and what the car changes. Take-home pay with no car is the same in every option, so it stays out.
  var flow = { lease: leaseYearCash - takeHome, loan: loanYearCash - takeHome, cash: cashYearCash - takeHome };
  var lease = simulate(i, i.start, flow.lease, leaseTaxable, balloon);
  var loan = simulate(i, i.start, flow.loan, i.salary, 0);
  var cash = simulate(i, cashStart, flow.cash, i.salary, 0);
  // Baseline: same salary, same tax, same account, no car at all.
  var noCar = simulate(i, i.start, 0, i.salary, 0);

  // What each option spends over the term, by kind. The rest of the cost is interest the account did not earn.
  var running = runningFull * i.years;
  var gstSaved = gstCredit - residual * GST + (runningFull - leaseRunningPre - leaseRunningPost - ecmGst) * i.years;
  var parts = {
    lease: { car: upfront, finance: leaseMonthly * n + residual - financed + i.fee * i.years, running: running,
      gst: -gstSaved, fbt: fbtTax * i.years, tax: -(salaryTax.total - leaseTax.total) * i.years },
    loan: { car: upfront, finance: loanMonthly * n - upfront, running: running },
    cash: { car: upfront, running: running }
  };

  return {
    parts: parts,
    n: n, duty: duty, upfront: upfront, gstCredit: gstCredit, financed: financed, residual: residual, balloon: balloon,
    leaseMonthly: leaseMonthly, leasePretaxYear: leasePretaxYear, leaseTax: leaseTax, leaseYearCash: leaseYearCash,
    loanMonthly: loanMonthly, salaryTax: salaryTax, takeHome: takeHome, loanYearCash: loanYearCash,
    cashYearCash: cashYearCash, cashStart: cashStart, flow: flow,
    lease: lease, loan: loan, cash: cash, noCar: noCar,
    leaseCost: noCar.end - lease.end, loanCost: noCar.end - loan.end, cashCost: noCar.end - cash.end,
    leaseTotalPaid: leaseMonthly * n + i.fee * i.years + balloon + (leaseRunningPre + leaseRunningPost + ecmGst + fbtTax) * i.years,
    loanTotalPaid: loanMonthly * n + runningFull * i.years,
    cashTotalPaid: upfront + runningFull * i.years,
    runningFull: runningFull, leaseRunningPost: leaseRunningPost, leaseRunningYear: leaseRunningPre + leaseRunningPost,
    fbt: fbt, statutory: statutory, reportableValue: reportableValue, ecm: ecm, ecmGst: ecmGst, fbtTax: fbtTax, rfba: rfba, packageYear: packageYear
  };
}
