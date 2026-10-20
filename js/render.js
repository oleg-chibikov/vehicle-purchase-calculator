// Draws the result columns, the breakdown under each total and the working.
function render() {
  var i = readInputs();
  var r = calc(i);
  var savings = i.account === 'savings';
  var fbtLines = fbtExplain(i, r, today());

  setText({
    pDuty: usd(r.duty), pGst: usd(r.gstCredit), pFinanced: usd(r.financed), pLease: usd(r.leaseMonthly),
    pFbt: r.fbt.exempt ? 'exempt' : (r.fbtTax > 0.005 ? usd(r.fbtTax) + ' a year' : '$0 after the contribution'),
    pEcm: r.ecm > 0 ? usd(r.ecm) : 'none', pRfba: r.rfba > 0 ? usd(r.rfba) : 'none',
    pRunLease: usd(r.leaseRunningYear), pResidual: usd(r.residual), pBalloon: usd(r.balloon),
    pLoan: usd(r.loanMonthly),
    chargingHint: CAR_TYPES[i.carType].hint,
    resultTitle: 'Total cost of the car over ' + i.years + (i.years === 1 ? ' year' : ' years')
  });
  $('dutyLabel').innerHTML = 'Stamp duty in ' + i.state + info(DUTY[i.state].src);
  $('fbtSrc').innerHTML = info(r.fbt.src);

  var costs = { Lease: r.leaseCost, Loan: r.loanCost, Cash: r.cashCost };
  var cheapest = Math.min(r.leaseCost, r.loanCost, r.cashCost);
  Object.keys(costs).forEach(function (k) {
    var best = costs[k] <= cheapest + 0.5;
    $('c' + k).textContent = usd(costs[k]);
    $('d' + k).textContent = best ? 'Lowest cost' : '+' + usd(costs[k] - cheapest) + ' more than the lowest';
    $('d' + k).classList.toggle('best', best);
    $('s' + k).innerHTML = splitRows(i, r, k.toLowerCase(), costs[k]);
  });
  $('costNote').innerHTML = lines([
    ['Cost = the account with no car (' + usd(r.noCar.end) + ' at the end) minus the account with the car. You own the car in all three cases. Its resale value is not counted.'],
    ['The account earns ' + i.accountRate + '% a year, ' + (savings ? 'taxed as savings interest.' : 'tax free as a mortgage offset.'), ['assumeRates']],
    fbtLines[0]
  ]);

  $('work').innerHTML = workRows(i, r);

  var b = row('Start', usd(i.start), usd(i.start), usd(r.cashStart), 'sub');
  r.lease.years.forEach(function (bal, k) {
    b += row(String(k + 1), usd(bal), usd(r.loan.years[k]), usd(r.cash.years[k]));
  });
  b += row('Balloon paid at the end of the lease', '-' + usd(r.balloon), '-', '-', 'sub');
  b += row('Final balance', usd(r.lease.end), usd(r.loan.end), usd(r.cash.end), 'total');
  $('bal').innerHTML = b;

  $('formula').innerHTML = lines([
    ['Stamp duty, ' + i.state + ': ' + dutyText(i) + ' = ' + usd(r.duty, true), DUTY[i.state].src],
    ['GST credit = min(price / 11, car limit / 11) = min(' + usd(i.price / 11, true) + ', ' + usd(CAR_LIMIT / 11, true) + ') = ' + usd(r.gstCredit, true), ['gst', 'carLimit']],
    ['Financed = price - GST credit + stamp duty = ' + usd(i.price, true) + ' - ' + usd(r.gstCredit, true) + ' + ' + usd(r.duty, true) + ' = ' + usd(r.financed, true), ['carLimit']],
    ['Residual = financed x ' + i.balloonPct + '% = ' + usd(r.residual, true) + ', balloon with GST = residual x ' + (1 + GST).toFixed(2) + ' = ' + usd(r.balloon, true), ['residual', 'gst']],
    ['r = ' + i.leaseRate + '% / 12 = ' + (i.leaseRate / 12).toFixed(4) + '% per month, n = ' + r.n + ' months', ['assumeRates']],
    ['Payment = (Financed - Residual / (1+r)^n) x r / (1 - (1+r)^-n)'],
    ['        = ' + usd(r.leaseMonthly, true) + ' per month, paid at the end of each month']
  ]);
  $('fbtNote').innerHTML = lines(fbtLines);

  var msgs = [];
  if (today() > TAX_YEAR_END) msgs.push(esc('Tax rates, thresholds and FBT rules on this page are for ' + TAX_YEAR + ', checked on ' + RULES_CHECKED + '. Check them for the current year.') + info(['tax', 'fbtRates']));
  if (i.carType !== 'ice' && i.price > LCT_FUEL_EFFICIENT) msgs.push(esc('The price is above the luxury car tax threshold for fuel-efficient cars (' + usd(LCT_FUEL_EFFICIENT) + ' for ' + TAX_YEAR + '). The car gets no FBT exemption, so the lease includes a post-tax contribution.') + info(['lct', 'evExempt']));
  if (i.balloonPct < RESIDUAL[i.years] - 0.005) msgs.push(esc('The ATO minimum balloon for a ' + i.years + '-year lease is ' + RESIDUAL[i.years] + '%. A lower value is not accepted by lenders.') + info('residual'));
  $('flag').hidden = !msgs.length;
  $('flag').innerHTML = msgs.join(' ');
}

// Where the cost goes: whole dollars that add up to the total shown. Each line's tooltip has its formula.
function splitRows(i, r, k, cost) {
  var p = r.parts[k], y = i.years, yrs = ' x ' + y + (y === 1 ? ' year' : ' years');
  var how = {
    car: ['The car, price and stamp duty', 'Price ' + usd(i.price, true) + ' + stamp duty ' + usd(r.duty, true) + ' = ' + usd(p.car, true), DUTY[i.state].src],
    finance: k === 'lease'
      ? ['Lease interest and fees', usd(r.leaseMonthly, true) + ' x ' + r.n + ' payments + residual ' + usd(r.residual, true) + ' - amount financed ' + usd(r.financed, true) + (i.fee ? ' + fees ' + usd(i.fee, true) + yrs : '') + ' = ' + usd(p.finance, true), ['assumeRates', 'residual']]
      : ['Loan interest', usd(r.loanMonthly, true) + ' x ' + r.n + ' repayments - amount borrowed ' + usd(r.upfront, true) + ' = ' + usd(p.finance, true), ['assumeRates']],
    running: ['Running costs', '(rego ' + usd(i.rego, true) + ' + insurance ' + usd(i.insurance, true) + ' + servicing ' + usd(i.service, true) + ' + fuel or charging ' + usd(i.charging, true) + ')' + yrs + ' = ' + usd(p.running, true), ['assumeFuel']],
    gst: [p.gst > 0 ? 'GST paid, net' : 'GST saved', 'GST credit on the car ' + usd(r.gstCredit, true) + ' - GST on the balloon ' + usd(r.balloon - r.residual, true) + ' + GST saved on running costs ' + usd(r.runningFull - r.leaseRunningYear, true) + yrs + (r.ecmGst ? ' - GST on the post-tax contribution ' + usd(r.ecmGst, true) + yrs : '') + ' = ' + usd(-p.gst, true), ['gst', 'carLimit', 'assumeFuelGst', 'ecmGst']],
    fbt: ['Fringe benefits tax', usd(r.fbtTax, true) + ' a year' + yrs + ' = ' + usd(p.fbt, true), ['fbtRates']],
    tax: [p.tax > 0 ? 'Extra income tax' : 'Income tax saved', 'Tax on the salary ' + usd(r.salaryTax.total, true) + ' - tax with the lease ' + usd(r.leaseTax.total, true) + ' = ' + usd(r.salaryTax.total - r.leaseTax.total, true) + ' a year' + yrs + ' = ' + usd(-p.tax, true), ['tax', 'medicare']]
  };
  var total = Math.round(cost), rest = total, out = '';
  Object.keys(p).forEach(function (key) {
    var v = Math.round(p[key]);
    rest -= v;
    if (v) out += splitRow(how[key][0], v, how[key][1], how[key][2]);
  });
  // The rest is what the account would have earned on the money spent, after any tax on that interest.
  if (rest) out += splitRow('Interest the account missed', rest, 'Total ' + usd(total) + ' minus the lines above = ' + usd(rest) + ', in whole dollars. The money spent on the car would have earned ' + i.accountRate + '% a year' + (i.account === 'savings' ? ', less tax on that interest.' : ' in the offset.'), ['assumeRates']);
  return out;
}
function splitRow(label, v, formula, src) {
  return '<dt>' + esc(label) + info(src, formula) + '</dt><dd>' + (v > 0 ? '+' : '') + usd(v) + '</dd>';
}

function setText(map) { Object.keys(map).forEach(function (id) { $(id).textContent = map[id]; }); }

// The per-year table: pay, tax by tier, what is left, then totals over the term. Whole dollars, the formulas show cents.
function workRows(i, r) {
  var L = r.leaseTax, S = r.salaryTax, savings = i.account === 'savings';
  var w = head('Pay');
  w += row('Gross salary', usd(i.salary), usd(i.salary), usd(i.salary));
  w += row('Lease payments, fees and running costs, without GST' + info(['gst', 'assumeFuelGst']), '-' + usd(r.packageYear), '-', '-', 'sub');
  if (!r.fbt.exempt) {
    w += row('Less the post-tax contribution, without its GST' + info(['statutory', 'ecmGst']), '+' + usd(r.ecm - r.ecmGst), '-', '-', 'sub');
    if (r.fbtTax > 0.005) w += row('FBT on the taxable value left, charged pre-tax' + info('fbtRates'), '-' + usd(r.fbtTax), '-', '-', 'sub');
  }
  w += row('Taxable income from salary', usd(L.taxable), usd(S.taxable), usd(S.taxable), 'total');
  w += head('Income tax on salary by tier, ' + TAX_YEAR + info('tax'));
  L.rows.forEach(function (lr, k) {
    w += row(tierLabel(lr), tierCell(lr), tierCell(S.rows[k]), tierCell(S.rows[k]));
  });
  w += row('Medicare levy, ' + pct(MEDICARE) + info('medicare'), usd(L.medicare), usd(S.medicare), usd(S.medicare), 'sub');
  w += row('Total tax on salary', usd(L.total), usd(S.total), usd(S.total), 'total');
  w += head('What is left');
  w += row('Take-home pay', usd(i.salary - r.leasePretaxYear - L.total), usd(r.takeHome), usd(r.takeHome));
  w += row('Loan repayments, after tax', '-', '-' + usd(r.loanMonthly * 12), '-', 'sub');
  if (r.ecm > 0) w += row('Post-tax contribution to the lease, with GST' + info(['statutory', 'ecmGst']), '-' + usd(r.ecm), '-', '-', 'sub');
  w += row('Running costs paid from take-home pay', r.leaseRunningPost > 0 ? '-' + usd(r.leaseRunningPost) : '-', '-' + usd(r.runningFull), '-' + usd(r.runningFull), 'sub');
  w += row('Cash added to the account per year, before interest', usd(r.leaseYearCash), usd(r.loanYearCash), usd(r.cashYearCash), 'total');
  w += head('Over the whole term');
  w += row('Paid up front, price and stamp duty', '-', '-', usd(r.upfront), 'sub');
  w += row('Balloon paid at the end, with GST' + info(['residual', 'gst']), usd(r.balloon), '-', '-', 'sub');
  w += row('Tax saved per year compared with the loan', usd(S.total - L.total), '-', '-', 'sub');
  w += row('Running costs over the term', usd(r.leaseRunningYear * i.years), usd(r.runningFull * i.years), usd(r.runningFull * i.years), 'sub');
  if (!r.fbt.exempt) w += row('GST on the post-tax contribution and FBT, over the term' + info(['ecmGst', 'fbtRates']), usd((r.ecmGst + r.fbtTax) * i.years), '-', '-', 'sub');
  w += row('Total paid for the car and running it, before tax savings', usd(r.leaseTotalPaid), usd(r.loanTotalPaid), usd(r.cashTotalPaid), 'total');
  w += row('Income tax over the term' + info(['tax', 'medicare']), usd(r.lease.tax.total), usd(r.loan.tax.total), usd(r.cash.tax.total), 'sub');
  w += row('Interest on the account', usd(r.lease.interest), usd(r.loan.interest), usd(r.cash.interest), 'sub');
  w += row('Tax on that interest', savings ? usd(r.lease.interestTax) : 'tax free', savings ? usd(r.loan.interestTax) : 'tax free', savings ? usd(r.cash.interestTax) : 'tax free', 'sub');
  return w;
}
function row(label, a, b, c, cls) {
  var cells = [a, b, c].map(function (v) { return '<td class="n">' + v + '</td>'; }).join('');
  return '<tr' + (cls ? ' class="' + cls + '"' : '') + '><td>' + label + '</td>' + cells + '</tr>';
}
function head(label) { return '<tr class="head"><td colspan="4">' + label + '</td></tr>'; }
function tierCell(t) { return usd(t.tax) + '<small>on ' + usd(t.inBand) + ' at ' + pct(t.rate) + '</small>'; }
function tierLabel(b) {
  return b.to === Infinity ? usd(b.from + 1) + ' and over' : usd(b.from === 0 ? 0 : b.from + 1) + ' to ' + usd(b.to);
}

// Lines for the FBT card: the result, the reason, the formula and the rules by start date. Each line names its sources.
function fbtExplain(i, r, now) {
  var f = r.fbt, out = [];
  var verdict = f.exempt ? 'exempt from FBT.' : f.rate < STATUTORY_RATE ? 'FBT at a ' + pct(f.rate) + ' statutory rate.' : 'no FBT exemption.';
  out.push([CAR_TYPES[i.carType].name + ', first used ' + longDate(i.startDate) + ', ' + usd(i.price) + ': ' + verdict + ' ' + f.why, f.src]);
  out.push(['']);
  if (f.exempt && r.reportableValue > 0) {
    out.push(['Value for reporting = ' + pct(STATUTORY_RATE) + ' x base value ' + usd(i.price, true) + ' = ' + usd(r.reportableValue, true) + ' per year', ['statutory', 'evExempt']]);
    out.push(['Reportable fringe benefit = ' + usd(r.reportableValue, true) + ' x ' + GROSS_UP_TYPE2 + ' = ' + usd(r.rfba, true) + ' per year', ['fbtRates']]);
    out.push(['It is not taxed. It counts for the Medicare levy surcharge, HELP repayments, family payments and child support.', ['rfba']]);
  } else if (f.exempt) {
    out.push(['The announced 0% statutory rate leaves a taxable value of $0, so there is nothing to report. Not yet law.', ['evChange', 'fbtRates']]);
  } else {
    out.push(['Taxable value = ' + pct(f.rate) + ' x base value ' + usd(i.price, true) + ' = ' + usd(r.statutory, true) + ' per year', f.rate < STATUTORY_RATE ? ['statutory', 'evChange'] : ['statutory']]);
    out.push(['Base value = the price with GST and dealer delivery, without stamp duty and rego', ['statutory']]);
    out.push(['Post-tax contribution = ' + usd(r.ecm, true) + ' per year from take-home pay. The taxable value left is ' + usd(r.statutory - r.ecm, true), ['statutory']]);
    out.push(['GST the employer pays on it = ' + usd(r.ecm, true) + ' / 11 = ' + usd(r.ecmGst, true) + '. The pre-tax part drops by ' + usd(r.ecm - r.ecmGst, true), ['ecmGst']]);
    if (r.fbtTax > 0.005) {
      out.push(['The contribution is capped at the yearly package with GST. FBT on the rest = ' + usd(r.statutory - r.ecm, true) + ' x ' + GROSS_UP_TYPE1 + ' x ' + pct(FBT_RATE) + ' = ' + usd(r.fbtTax, true) + ' per year, charged pre-tax', ['fbtRates']]);
    }
    out.push(['Not modelled: the base value drops by a third after 4 years. A 5-year lease would need a smaller contribution near the end.', ['oneThird']]);
  }
  out.push(['']);
  if (i.carType === 'ev') {
    var phase = i.startDate < EV_PHASE2 ? 1 : i.startDate < EV_PHASE3 ? 2 : 3;
    var here = function (p) { return p === phase ? '   <- this start date' : ''; };
    out.push(['Electric car FBT by start date. Announced ' + longDate(EV_ANNOUNCED) + ', not yet law on ' + longDate(RULES_CHECKED), ['evChange']]);
    out.push(['- Start before ' + longDate(EV_PHASE2) + ': full exemption for the whole lease' + here(1), ['evExempt', 'evChange']]);
    out.push(['- Start ' + longDate(EV_PHASE2) + ' to ' + longDate(dayBefore(EV_PHASE3)) + ': full exemption at ' + usd(EV_FULL_CAP) + ' or less, ' + pct(EV_DISCOUNT_RATE) + ' statutory rate above' + here(2), ['evChange']]);
    out.push(['- Start from ' + longDate(EV_PHASE3) + ': ' + pct(EV_DISCOUNT_RATE) + ' statutory rate at any price under the LCT threshold' + here(3), ['evChange', 'lct']]);
    out.push(['- A lease keeps the rules it started with. Refinancing or a new lease starts again under the rules of that day.', ['evChange']]);
    out.push(['- The announcement does not define the ' + usd(EV_FULL_CAP) + ' price. The page compares it with the car price input.', ['evChange']]);
    out.push([now < EV_PHASE2
      ? '- Today is ' + longDate(now) + '. A lease that starts by ' + longDate(dayBefore(EV_PHASE2)) + ' keeps the full exemption.'
      : '- Today is ' + longDate(now) + ', after ' + longDate(EV_PHASE2) + '. Check on ato.gov.au whether the change became law and in what form.', ['evChange']]);
  } else if (i.carType === 'phev') {
    out.push(['Plug-in hybrids: no exemption for a car first used from ' + longDate(PHEV_CUTOFF) + '. One used before then keeps it to the end of the fixed lease term, without optional extensions.', ['phev']]);
  } else {
    out.push(['Petrol, diesel and regular hybrid cars have no FBT concession. Only the full ' + pct(STATUTORY_RATE) + ' rule applies.', ['statutory', 'evExempt']]);
  }
  return out;
}

// One line per item: escaped text, then the i icon for its sources.
function lines(list) {
  return list.map(function (l) { return '<div>' + (esc(l[0]) || '&nbsp;') + (l[1] && l[1].length ? info(l[1]) : '') + '</div>'; }).join('');
}
