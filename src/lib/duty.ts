// Stamp duty on a new passenger car, from each revenue office (SOURCES.dutyNSW to SOURCES.dutyNT).
// Each state keeps its rates in one object. The formula and its description both read them.
import { dayBefore, longDate, usd } from './format';
import type { Inputs, State } from './inputs';
import type { CarType } from './rules';
import type { SourceKey } from './sources';

type Band = [upTo: number, ratePerStep: number];

export interface DutyRule {
  src: SourceKey[];
  // The duty on a price for a car type and a start date.
  fn(price: number, t: CarType, date: string): number;
  // The rule that applies, in words.
  text(t: CarType, date: string): string;
}

const NSW: Band[] = [[45000, 3], [Infinity, 5]];
const VIC = { green: [[Infinity, 8.4]] as Band[], other: [[80809, 8.4], [100000, 10.4], [150000, 14], [Infinity, 18]] as Band[] };
const QLD = { cut: 100000, ice: [3, 5], other: [2, 4] };
const SA = { min: 5, bands: [[1000, 1], [2000, 2], [3000, 3], [Infinity, 4]] as Band[] };
const WA = { lo: 2.75, hi: 6.5, from: 25000, to: 50000, step: 6666.66 };
const TAS = { min: 20, bands: [[35000, 3], [40000, 11]] as Band[], whole: 4 };
// Rates per emissions category: before and from the date ACT changes them. Category per car type: SOURCES.assumeDutyType
const ACT: { change: string } & Record<CarType, { cat: string; before: number[]; from: number[] }> = {
  change: '2027-02-01',
  ev: { cat: 'AAA, zero emissions', before: [2.5, 4], from: [2.5, 4] },
  phev: { cat: 'AA, 1 to 65 g/km, usual for a plug-in hybrid', before: [2.67, 4.41], from: [2.67, 4.41] },
  ice: { cat: 'B, 131 to 175 g/km, usual for a small petrol car', before: [3, 5.22], from: [3.25, 5.59] }
};
const NT = { rate: 3, free: 50000, end: '2027-06-30' };

export const DUTY: Record<State, DutyRule> = {
  NSW: {
    src: ['dutyNSW'],
    fn: (v) => marginal(v, 100, NSW),
    text: () => 'Any car: ' + bandsText(100, NSW) + ' ' + usd(NSW[0][0])
  },
  VIC: {
    src: ['dutyVIC', 'assumeDutyType'],
    fn: (v, t) => {
      const bands = t === 'ice' ? VIC.other : VIC.green;
      const band = bands.find((b) => v <= b[0])!;
      return per(v, 200, band[1]);
    },
    text: (t) => t === 'ice'
      ? 'Other car, on the whole price: ' + bandsText(200, VIC.other)
      : 'Green car (120 g/km CO2 or less, electric and most plug-in hybrids): ' + bandsText(200, VIC.green)
  },
  QLD: {
    src: ['dutyQLD', 'assumeDutyType'],
    fn: (v, t) => {
      const r = t === 'ice' ? QLD.ice : QLD.other;
      return per(v, 100, v <= QLD.cut ? r[0] : r[1]);
    },
    text: (t) => {
      const r = t === 'ice' ? QLD.ice : QLD.other;
      return (t === 'ice' ? '4 cylinders assumed' : 'Electric or hybrid') + ': ' + rate$(r[0]) + ' per $100 up to ' + usd(QLD.cut) + ', ' + rate$(r[1]) + ' per $100 on the whole price above';
    }
  },
  SA: {
    src: ['dutySA'],
    fn: (v) => Math.max(SA.min, marginal(v, 100, SA.bands)),
    text: () => 'Non-commercial car, at least ' + usd(SA.min) + ': ' + bandsText(100, SA.bands)
  },
  WA: {
    src: ['dutyWA'],
    fn: (v) => {
      if (v <= WA.from) return v * WA.lo / 100;
      if (v <= WA.to) return v * Math.round((WA.lo + (v - WA.from) / WA.step) * 100) / 10000;
      return v * WA.hi / 100;
    },
    text: () => 'Any car: ' + WA.lo + '% up to ' + usd(WA.from) + '. ' + usd(WA.from) + ' to ' + usd(WA.to) + ': R% of the whole price, R = ' + WA.lo + ' + (price - ' + usd(WA.from) + ') / ' + WA.step + ', rounded to 2 decimals. ' + WA.hi + '% above'
  },
  TAS: {
    src: ['dutyTAS'],
    fn: (v) => v > TAS.bands[1][0] ? per(v, 100, TAS.whole) : Math.max(TAS.min, marginal(v, 100, TAS.bands)),
    text: () => 'Any car, at least ' + usd(TAS.min) + ': ' + bandsText(100, TAS.bands) + '. Above that ' + rate$(TAS.whole) + ' per $100 on the whole price'
  },
  ACT: {
    src: ['dutyACT', 'assumeDutyType'],
    fn: (v, t, d) => marginal(v, 100, actBands(t, d)),
    text: (t, d) => {
      const changes = ACT[t].before.join() !== ACT[t].from.join();
      const when = !changes ? '' : d >= ACT.change ? ', from ' + longDate(ACT.change) : ', to ' + longDate(dayBefore(ACT.change));
      return 'Category ' + ACT[t].cat + when + ': ' + bandsText(100, actBands(t, d));
    }
  },
  NT: {
    src: ['dutyNT'],
    fn: (v, t, d) => (ntConcession(t, d) ? Math.max(0, v - NT.free) : v) * NT.rate / 100,
    text: (t, d) => ntConcession(t, d)
      ? 'Electric or plug-in hybrid registered by ' + longDate(NT.end) + ': ' + NT.rate + '% of the price above ' + usd(NT.free) + '. Rego is also free, CTP is still paid'
      : 'Other cars: ' + NT.rate + '% of the price'
  }
};

export function stampDuty(i: Inputs): number {
  return Math.max(0, DUTY[i.state].fn(Math.max(i.price, 0), i.carType, i.startDate));
}

export function dutyText(i: Inputs): string {
  return DUTY[i.state].text(i.carType, i.startDate);
}

function per(v: number, step: number, rate: number): number {
  return Math.ceil(v / step) * rate;
}

// A band's rate applies only to the part of the price inside it.
function marginal(v: number, step: number, bands: Band[]): number {
  let from = 0, base = 0;
  for (const [upTo, rate] of bands) {
    if (v <= upTo) return base + per(v - from, step, rate);
    base += (upTo - from) / step * rate;
    from = upTo;
  }
  return base;
}

// Bands as text: "$3 per $100 up to $45,000, then $5 per $100 above".
function bandsText(step: number, bands: Band[]): string {
  return bands.map(([upTo, rate], k) =>
    rate$(rate) + ' per ' + usd(step) + (upTo === Infinity ? (k ? ' above' : ' at any price') : ' up to ' + usd(upTo))
  ).join(', then ');
}

function rate$(x: number): string {
  return usd(x, x % 1 !== 0);
}

function actBands(t: CarType, d: string): Band[] {
  const r = d >= ACT.change ? ACT[t].from : ACT[t].before;
  return [[45000, r[0]], [80000, r[1]], [Infinity, 8]];
}

function ntConcession(t: CarType, d: string): boolean {
  return t !== 'ice' && d <= NT.end;
}
