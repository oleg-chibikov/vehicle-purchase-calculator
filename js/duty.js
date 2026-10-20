// Stamp duty on a new passenger car, from each revenue office (SOURCES.dutyNSW to SOURCES.dutyNT).
// Each state keeps its rates in `p`. The formula and its description both read them.
// fn(price, carType, startDate, p) gives the duty. text(carType, startDate, p) describes the rule that applies.
function per(v, step, rate) { return Math.ceil(v / step) * rate; }
// Each band is [up to, rate per step]. A band's rate applies only to the part of the price inside it.
function marginal(v, step, bands) {
  var from = 0, base = 0;
  for (var k = 0; k < bands.length; k++) {
    if (v <= bands[k][0]) return base + per(v - from, step, bands[k][1]);
    base += (bands[k][0] - from) / step * bands[k][1];
    from = bands[k][0];
  }
}
// Bands as text: "$3 per $100 up to $45,000, then $5 per $100 above".
function bandsText(step, bands) {
  return bands.map(function (b, k) {
    return rate$(b[1]) + ' per ' + usd(step) + (b[0] === Infinity ? (k ? ' above' : ' at any price') : ' up to ' + usd(b[0]));
  }).join(', then ');
}
function rate$(x) { return usd(x, x % 1 !== 0); }
var DUTY = {
  NSW: { src: ['dutyNSW'], p: [[45000, 3], [Infinity, 5]],
    fn: function (v, t, d, p) { return marginal(v, 100, p); },
    text: function (t, d, p) { return 'Any car: ' + bandsText(100, p) + ' ' + usd(p[0][0]); } },
  VIC: { src: ['dutyVIC', 'assumeDutyType'], p: { green: [[Infinity, 8.4]], other: [[80809, 8.4], [100000, 10.4], [150000, 14], [Infinity, 18]] },
    fn: function (v, t, d, p) {
      var bands = t === 'ice' ? p.other : p.green;
      for (var k = 0; v > bands[k][0]; k++);
      return per(v, 200, bands[k][1]);
    },
    text: function (t, d, p) {
      return t === 'ice'
        ? 'Other car, on the whole price: ' + bandsText(200, p.other)
        : 'Green car (120 g/km CO2 or less, electric and most plug-in hybrids): ' + bandsText(200, p.green);
    } },
  QLD: { src: ['dutyQLD', 'assumeDutyType'], p: { cut: 100000, ice: [3, 5], other: [2, 4] },
    fn: function (v, t, d, p) { var r = t === 'ice' ? p.ice : p.other; return per(v, 100, v <= p.cut ? r[0] : r[1]); },
    text: function (t, d, p) {
      var r = t === 'ice' ? p.ice : p.other;
      return (t === 'ice' ? '4 cylinders assumed' : 'Electric or hybrid') + ': ' + rate$(r[0]) + ' per $100 up to ' + usd(p.cut) + ', ' + rate$(r[1]) + ' per $100 on the whole price above';
    } },
  SA: { src: ['dutySA'], p: { min: 5, bands: [[1000, 1], [2000, 2], [3000, 3], [Infinity, 4]] },
    fn: function (v, t, d, p) { return Math.max(p.min, marginal(v, 100, p.bands)); },
    text: function (t, d, p) { return 'Non-commercial car, at least ' + usd(p.min) + ': ' + bandsText(100, p.bands); } },
  WA: { src: ['dutyWA'], p: { lo: 2.75, hi: 6.5, from: 25000, to: 50000, step: 6666.66 },
    fn: function (v, t, d, p) {
      if (v <= p.from) return v * p.lo / 100;
      if (v <= p.to) return v * Math.round((p.lo + (v - p.from) / p.step) * 100) / 10000;
      return v * p.hi / 100;
    },
    text: function (t, d, p) {
      return 'Any car: ' + p.lo + '% up to ' + usd(p.from) + '. ' + usd(p.from) + ' to ' + usd(p.to) + ': R% of the whole price, R = ' + p.lo + ' + (price - ' + usd(p.from) + ') / ' + p.step + ', rounded to 2 decimals. ' + p.hi + '% above';
    } },
  TAS: { src: ['dutyTAS'], p: { min: 20, bands: [[35000, 3], [40000, 11]], whole: 4 },
    fn: function (v, t, d, p) { return v > p.bands[1][0] ? per(v, 100, p.whole) : Math.max(p.min, marginal(v, 100, p.bands)); },
    text: function (t, d, p) { return 'Any car, at least ' + usd(p.min) + ': ' + bandsText(100, p.bands) + '. Above that ' + rate$(p.whole) + ' per $100 on the whole price'; } },
  // Rates per emissions category: before and from the date ACT changes them. Category per car type: SOURCES.assumeDutyType
  ACT: { src: ['dutyACT', 'assumeDutyType'], p: { change: '2027-02-01',
      ev: { cat: 'AAA, zero emissions', before: [2.5, 4], from: [2.5, 4] },
      phev: { cat: 'AA, 1 to 65 g/km, usual for a plug-in hybrid', before: [2.67, 4.41], from: [2.67, 4.41] },
      ice: { cat: 'B, 131 to 175 g/km, usual for a small petrol car', before: [3, 5.22], from: [3.25, 5.59] } },
    bands: function (t, d, p) { var r = d >= p.change ? p[t].from : p[t].before; return [[45000, r[0]], [80000, r[1]], [Infinity, 8]]; },
    fn: function (v, t, d, p) { return marginal(v, 100, this.bands(t, d, p)); },
    text: function (t, d, p) {
      var changes = p[t].before.join() !== p[t].from.join();
      var when = !changes ? '' : d >= p.change ? ', from ' + longDate(p.change) : ', to ' + longDate(dayBefore(p.change));
      return 'Category ' + p[t].cat + when + ': ' + bandsText(100, this.bands(t, d, p));
    } },
  NT: { src: ['dutyNT'], p: { rate: 3, free: 50000, end: '2027-06-30' },
    concession: function (t, d, p) { return t !== 'ice' && d <= p.end; },
    fn: function (v, t, d, p) { return (this.concession(t, d, p) ? Math.max(0, v - p.free) : v) * p.rate / 100; },
    text: function (t, d, p) {
      return this.concession(t, d, p)
        ? 'Electric or plug-in hybrid registered by ' + longDate(p.end) + ': ' + p.rate + '% of the price above ' + usd(p.free) + '. Rego is also free, CTP is still paid'
        : 'Other cars: ' + p.rate + '% of the price';
    } }
};
function stampDuty(i) { var s = DUTY[i.state]; return Math.max(0, s.fn(Math.max(i.price, 0), i.carType, i.startDate, s.p)); }
function dutyText(i) { var s = DUTY[i.state]; return s.text(i.carType, i.startDate, s.p); }
// Each state's source lists every rule the page can apply: each car type, before and after any date in the rules.
Object.keys(DUTY).forEach(function (state) {
  var s = DUTY[state], seen = [];
  ['ev', 'phev', 'ice'].forEach(function (t) {
    [RULES_CHECKED, '9999-12-31'].forEach(function (d) {
      var line = s.text(t, d, s.p);
      if (seen.indexOf(line) < 0) seen.push(line);
    });
  });
  SOURCES['duty' + state].value = seen.join('. ');
});
