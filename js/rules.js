// Every fixed number is a constant here. Its comment names the SOURCES entry that proves it,
// and every text on the page that mentions the number is built from the constant.
// Dates are ISO strings, so they compare as text.
var RULES_CHECKED = '2026-10-20';
var TAX_YEAR = '2026-27'; // SOURCES.tax
var TAX_YEAR_END = '2027-06-30'; // SOURCES.tax
var TIERS = [ // SOURCES.tax
  { from: 0, to: 18200, rate: 0 },
  { from: 18200, to: 45000, rate: 0.15 },
  { from: 45000, to: 135000, rate: 0.30 },
  { from: 135000, to: 190000, rate: 0.37 },
  { from: 190000, to: Infinity, rate: 0.45 }
];
var MEDICARE = 0.02; // SOURCES.medicare
var GST = 0.10; // SOURCES.gst
var CAR_LIMIT = 69883; // SOURCES.carLimit
var LCT_FUEL_EFFICIENT = 91661; // SOURCES.lct
var RESIDUAL = { 1: 65.63, 2: 56.25, 3: 46.88, 4: 37.5, 5: 28.13 }; // SOURCES.residual
var STATUTORY_RATE = 0.20; // SOURCES.statutory
var FBT_RATE = 0.47; // SOURCES.fbtRates
var GROSS_UP_TYPE1 = 2.0802; // SOURCES.fbtRates
var GROSS_UP_TYPE2 = 1.8868; // SOURCES.fbtRates
var REPORTABLE_OVER = 2000; // SOURCES.fbtRates
var EV_FIRST_USE = '2022-07-01'; // SOURCES.evExempt
var PHEV_CUTOFF = '2025-04-01'; // SOURCES.phev
var EV_ANNOUNCED = '2026-05-05'; // SOURCES.evChange
var EV_PHASE2 = '2027-04-01'; // SOURCES.evChange
var EV_PHASE3 = '2029-04-01'; // SOURCES.evChange
var EV_FULL_CAP = 75000; // SOURCES.evChange
var EV_DISCOUNT_RATE = 0.15; // SOURCES.evChange
var FUEL_KM = 15000; // SOURCES.assumeFuel
var KWH_PRICE = 0.30; // SOURCES.assumeFuel
var LITRE_PRICE = 2.00; // SOURCES.assumeFuel
// `electric` is the share of the distance driven on power. SOURCES.assumeFuel
var CAR_TYPES = {
  ev: { name: 'Electric', electric: 1, kWh: 17, litres: 0 },
  phev: { name: 'Plug-in hybrid', electric: 0.5, kWh: 17, litres: 6.5 },
  ice: { name: 'Petrol, diesel or regular hybrid', electric: 0, kWh: 0, litres: 7 }
};
Object.keys(CAR_TYPES).forEach(function (k) {
  var c = CAR_TYPES[k], parts = [];
  if (c.electric > 0) parts.push(km(c.electric) + ' at ' + c.kWh + ' kWh per 100 km and ' + usd(KWH_PRICE, true) + ' per kWh');
  if (c.electric < 1) parts.push(km(1 - c.electric) + ' at ' + c.litres + ' L per 100 km and ' + usd(LITRE_PRICE, true) + ' per litre');
  var cost = FUEL_KM * (c.electric * c.kWh / 100 * KWH_PRICE + (1 - c.electric) * c.litres / 100 * LITRE_PRICE);
  c.fuel = Math.round(cost / 5) * 5;
  c.calc = parts.join(' plus ');
  c.hint = c.calc + '. Rounded to $5. Example only';
});
function km(share) { return (FUEL_KM * share).toLocaleString('en-AU') + ' km'; }
