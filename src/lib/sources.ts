// Each entry is shown behind an "i" icon and in the table "Sources for every number". Entries without links are assumptions.
import { DUTY } from './duty';
import { dayBefore, longDate, pct, usd } from './format';
import { DEFAULTS, type State } from './inputs';
import {
  CAR_LIMIT, CAR_TYPES, EV_ANNOUNCED, EV_DISCOUNT_RATE, EV_FIRST_USE, EV_FULL_CAP, EV_PHASE2, EV_PHASE3, FBT_RATE, GROSS_UP_TYPE1,
  GROSS_UP_TYPE2, GST, LCT_FUEL_EFFICIENT, MEDICARE, PHEV_CUTOFF, REPORTABLE_OVER, RESIDUAL, RULES_CHECKED, STATUTORY_RATE, TAX_YEAR,
  TIERS, type CarType
} from './rules';

export interface Source {
  name: string;
  value: string;
  // [link text, url]
  links?: [string, string][];
  // Why an entry has no link, in place of the default assumption note.
  note?: string;
}

export const SOURCES = {
  tax: { name: 'Income tax tiers ' + TAX_YEAR, value: TIERS.map((b) => pct(b.rate) + (b.to === Infinity ? ' above' : ' to ' + usd(b.to))).join(', '),
    links: [['ATO: tax rates for Australian residents', 'https://www.ato.gov.au/tax-rates-and-codes/tax-rates-australian-residents']] },
  medicare: { name: 'Medicare levy', value: pct(MEDICARE) + ' of taxable income',
    links: [['ATO: what is the Medicare levy', 'https://www.ato.gov.au/individuals-and-families/medicare-and-private-health-insurance/medicare-levy/what-is-the-medicare-levy']] },
  gst: { name: 'GST', value: pct(GST) + ' of the price without GST, so one eleventh of a price with GST',
    links: [['GSTR 2001/3, paragraph 21', 'https://www.ato.gov.au/law/view/document?docid=GST/GSTR20013/NAT/ATO/00001']] },
  carLimit: { name: 'Car limit ' + TAX_YEAR, value: usd(CAR_LIMIT) + '. The GST credit on a car is capped at one eleventh of it, ' + usd(CAR_LIMIT / 11),
    links: [['ATO: car thresholds from 1 July', 'https://www.ato.gov.au/businesses-and-organisations/small-business-newsroom/car-thresholds-from-1-july']] },
  lct: { name: 'Luxury car tax threshold for fuel-efficient cars ' + TAX_YEAR, value: usd(LCT_FUEL_EFFICIENT),
    links: [['ATO: luxury car tax rate and thresholds', 'https://www.ato.gov.au/tax-rates-and-codes/luxury-car-tax-rate-and-thresholds']] },
  residual: { name: 'Minimum residual for a leased car', value: Object.entries(RESIDUAL).map(([y, r]) => r + '% for ' + y + (y === '1' ? ' year' : ' years')).join(', '),
    links: [['ATO ID 2002/1004: car lease residual values', 'https://www.ato.gov.au/law/view/document?docid=AID/AID20021004/00001']] },
  statutory: { name: 'FBT statutory formula', value: 'Taxable value = base value x ' + pct(STATUTORY_RATE) + ' x days available / days in the year - employee contribution. Base value = the price with GST and dealer delivery, without rego and stamp duty',
    links: [['ATO: taxable value of a car fringe benefit', 'https://www.ato.gov.au/businesses-and-organisations/hiring-and-paying-your-workers/fringe-benefits-tax/types-of-fringe-benefits/fbt-on-cars-other-vehicles-parking-and-tolls/cars-and-fbt/taxable-value-of-a-car-fringe-benefit']] },
  fbtRates: { name: 'FBT rate, gross-up rates, reporting threshold', value: 'FBT ' + pct(FBT_RATE) + '. Gross-up ' + GROSS_UP_TYPE1 + ' with a GST credit, ' + GROSS_UP_TYPE2 + ' without. Reportable once the taxable value is over ' + usd(REPORTABLE_OVER) + ', grossed up at ' + GROSS_UP_TYPE2,
    links: [['ATO: FBT rates and thresholds', 'https://www.ato.gov.au/tax-rates-and-codes/fringe-benefits-tax-rates-and-thresholds']] },
  ecmGst: { name: 'GST on the post-tax contribution', value: 'The contribution is the price of a taxable supply, so the employer pays one eleventh of it as GST',
    links: [['GSTR 2001/3, paragraphs 21 to 23', 'https://www.ato.gov.au/law/view/document?docid=GST/GSTR20013/NAT/ATO/00001']] },
  evExempt: { name: 'Electric car FBT exemption', value: 'Battery electric or hydrogen car, first used on or after ' + longDate(EV_FIRST_USE) + ', priced under the LCT threshold for fuel-efficient cars. Home charging is exempt too',
    links: [['ATO: electric cars exemption', 'https://www.ato.gov.au/businesses-and-organisations/hiring-and-paying-your-workers/fringe-benefits-tax/types-of-fringe-benefits/fbt-on-cars-other-vehicles-parking-and-tolls/electric-cars-exemption']] },
  phev: { name: 'Plug-in hybrids and FBT', value: 'No exemption from ' + longDate(PHEV_CUTOFF) + '. A plug-in hybrid used before then keeps it to the end of the fixed lease term',
    links: [['ATO: FBT on plug-in hybrid electric vehicles', 'https://www.ato.gov.au/businesses-and-organisations/hiring-and-paying-your-workers/fringe-benefits-tax/types-of-fringe-benefits/fbt-on-cars-other-vehicles-parking-and-tolls/fbt-on-plug-in-hybrid-electric-vehicles']] },
  evChange: { name: 'Announced EV FBT changes, not yet law', value: 'Full exemption to ' + longDate(dayBefore(EV_PHASE2)) + '. From ' + longDate(EV_PHASE2) + ' to ' + longDate(dayBefore(EV_PHASE3)) + ': full for a car costing ' + usd(EV_FULL_CAP) + ' or less, a ' + pct(EV_DISCOUNT_RATE) + ' statutory rate above. From ' + longDate(EV_PHASE3) + ': a ' + pct(EV_DISCOUNT_RATE) + ' rate for every electric car under the LCT threshold. Existing leases keep their rules',
    links: [['ATO: electric car discount changes', 'https://www.ato.gov.au/about-ato/new-legislation/in-detail/businesses/electric-car-discount-more-sustainable-fbt-treatment-of-electric-cars'],
      ['Treasury media release, ' + longDate(EV_ANNOUNCED), 'https://ministers.treasury.gov.au/ministers/jim-chalmers-2022/media-releases/fairer-tax-treatment-encourage-affordable-evs']] },
  dutyNSW: { name: 'Stamp duty NSW', value: dutyValue('NSW'),
    links: [['Revenue NSW: motor vehicle duty', 'https://www.revenue.nsw.gov.au/taxes-duties-levies-royalties/motor-vehicle-duty']] },
  dutyVIC: { name: 'Stamp duty VIC from 1 July 2026', value: dutyValue('VIC'),
    links: [['SRO Victoria: motor vehicle duty current rates', 'https://www.sro.vic.gov.au/about-us/rates-and-statistics/current-rates/motor-vehicle-duty-current-rates']] },
  dutyQLD: { name: 'Stamp duty QLD', value: dutyValue('QLD'),
    links: [['Queensland Government: vehicle registration duty rates', 'https://www.qld.gov.au/transport/registration/fees/duty/rates']] },
  dutySA: { name: 'Stamp duty SA', value: dutyValue('SA'),
    links: [['RevenueSA: stamp duty rates for vehicles', 'https://revenuesa.sa.gov.au/stamp-duty-vehicles/rates']] },
  dutyWA: { name: 'Stamp duty WA', value: dutyValue('WA'),
    links: [['WA Government: vehicle licence duty', 'https://www.wa.gov.au/organisation/department-of-treasury-and-finance/vehicle-licence-duty']] },
  dutyTAS: { name: 'Stamp duty TAS', value: dutyValue('TAS'),
    links: [['SRO Tasmania: rates of duty', 'https://www.sro.tas.gov.au/motor-vehicle-duty/rates-of-duty']] },
  dutyACT: { name: 'Stamp duty ACT, by CO2 emissions', value: dutyValue('ACT'),
    links: [['ACT Revenue Office: motor vehicle duty', 'https://www.revenue.act.gov.au/motor-vehicle-duty']] },
  dutyNT: { name: 'Stamp duty NT', value: dutyValue('NT'),
    links: [['NT Government: EV registration and stamp duty concessions', 'https://nt.gov.au/driving/rego/getting-an-nt-registration/get-electric-vehicle-registration-and-stamp-duty-concessions']] },
  rfba: { name: 'What the reportable fringe benefit changes', value: 'It is not taxed. It counts for the Medicare levy surcharge, HELP and other study loan repayments, Division 293 tax, family payments and child support',
    links: [['ATO: consequences of having a reportable fringe benefits amount', 'https://www.ato.gov.au/individuals-and-families/jobs-and-employment-types/working-as-an-employee/reportable-fringe-benefits-for-employees/consequences-of-having-a-reportable-fringe-benefits-amount']] },
  oneThird: { name: 'Base value after 4 years', value: 'The base value drops by a third once the car has been held for 4 years. Not used in the calculation', note: 'Rule from memory, not checked against a source.' },
  assumeRates: { name: 'Interest rates', value: 'Lease ' + DEFAULTS.leaseRate + '%, loan ' + DEFAULTS.loanRate + '%, account ' + DEFAULTS.accountRate + '% are examples. Use the rates on your own quote and account' },
  assumeFuel: { name: 'Fuel and charging cost', value: Object.values(CAR_TYPES).map((c) => c.name + ': ' + c.calc + ', rounded to ' + usd(c.fuel)).join('. ') },
  assumeFuelGst: { name: 'GST on fuel through the lease', value: 'Home charging is reimbursed with no GST credit. Fuel for a plug-in hybrid or petrol car is bought on a fuel card, so the GST is claimed back' },
  assumeDutyType: { name: 'Duty category by car type', value: 'ACT: electric AAA, plug-in hybrid AA, petrol B. QLD petrol: 4 cylinders. VIC: electric and plug-in hybrid count as green cars, petrol does not' }
} satisfies Record<string, Source>;

export type SourceKey = keyof typeof SOURCES;

export function source(key: SourceKey): Source {
  return SOURCES[key] as Source;
}

// Every rule a state's duty can apply: each car type, before and after any date in the rules.
function dutyValue(state: State): string {
  const rule = DUTY[state], seen: string[] = [];
  for (const t of Object.keys(CAR_TYPES) as CarType[]) {
    for (const d of [RULES_CHECKED, '9999-12-31']) {
      const line = rule.text(t, d);
      if (!seen.includes(line)) seen.push(line);
    }
  }
  return seen.join('. ');
}
