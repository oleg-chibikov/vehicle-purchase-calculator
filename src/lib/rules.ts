// Every fixed number is a constant here. Its comment names the SOURCES entry that proves it,
// and every text on the page that mentions the number is built from the constant.
import { usd } from './format';

export const RULES_CHECKED = '2026-10-20';
export const TAX_YEAR = '2026-27'; // SOURCES.tax
export const TAX_YEAR_END = '2027-06-30'; // SOURCES.tax

export interface Tier { from: number; to: number; rate: number }
export const TIERS: Tier[] = [ // SOURCES.tax
  { from: 0, to: 18200, rate: 0 },
  { from: 18200, to: 45000, rate: 0.15 },
  { from: 45000, to: 135000, rate: 0.30 },
  { from: 135000, to: 190000, rate: 0.37 },
  { from: 190000, to: Infinity, rate: 0.45 }
];
export const MEDICARE = 0.02; // SOURCES.medicare
export const GST = 0.10; // SOURCES.gst
export const CAR_LIMIT = 69883; // SOURCES.carLimit
export const LCT_FUEL_EFFICIENT = 91661; // SOURCES.lct
export const RESIDUAL: Record<number, number> = { 1: 65.63, 2: 56.25, 3: 46.88, 4: 37.5, 5: 28.13 }; // SOURCES.residual
export const STATUTORY_RATE = 0.20; // SOURCES.statutory
export const FBT_RATE = 0.47; // SOURCES.fbtRates
export const GROSS_UP_TYPE1 = 2.0802; // SOURCES.fbtRates
export const GROSS_UP_TYPE2 = 1.8868; // SOURCES.fbtRates
export const REPORTABLE_OVER = 2000; // SOURCES.fbtRates
export const EV_FIRST_USE = '2022-07-01'; // SOURCES.evExempt
export const PHEV_CUTOFF = '2025-04-01'; // SOURCES.phev
export const EV_ANNOUNCED = '2026-05-05'; // SOURCES.evChange
export const EV_PHASE2 = '2027-04-01'; // SOURCES.evChange
export const EV_PHASE3 = '2029-04-01'; // SOURCES.evChange
export const EV_FULL_CAP = 75000; // SOURCES.evChange
export const EV_DISCOUNT_RATE = 0.15; // SOURCES.evChange
const FUEL_KM = 15000; // SOURCES.assumeFuel
const KWH_PRICE = 0.30; // SOURCES.assumeFuel
const LITRE_PRICE = 2.00; // SOURCES.assumeFuel

export type CarType = 'ev' | 'phev' | 'ice';
export interface CarTypeInfo {
  name: string;
  // The share of the distance driven on power. SOURCES.assumeFuel
  electric: number;
  kWh: number;
  litres: number;
  // The yearly fuel or charging cost, rounded to $5, and how it is worked out.
  fuel: number;
  // The share of that cost spent on fuel with GST in it. Home charging carries no GST credit. SOURCES.assumeFuelGst
  fuelGstShare: number;
  calc: string;
  hint: string;
}

export const CAR_TYPES: Record<CarType, CarTypeInfo> = {
  ev: carType('Electric', 1, 17, 0),
  phev: carType('Plug-in hybrid', 0.5, 17, 6.5),
  ice: carType('Petrol, diesel or regular hybrid', 0, 0, 7)
};

function carType(name: string, electric: number, kWh: number, litres: number): CarTypeInfo {
  const parts = [];
  if (electric > 0) parts.push(km(electric) + ' at ' + kWh + ' kWh per 100 km and ' + usd(KWH_PRICE, true) + ' per kWh');
  if (electric < 1) parts.push(km(1 - electric) + ' at ' + litres + ' L per 100 km and ' + usd(LITRE_PRICE, true) + ' per litre');
  const chargeCost = electric * kWh / 100 * KWH_PRICE;
  const fuelCost = (1 - electric) * litres / 100 * LITRE_PRICE;
  const cost = FUEL_KM * (chargeCost + fuelCost);
  const calc = parts.join(' plus ');
  return {
    name, electric, kWh, litres, fuel: Math.round(cost / 5) * 5,
    fuelGstShare: cost > 0 ? fuelCost / (chargeCost + fuelCost) : 0,
    calc, hint: calc + '. Rounded to $5. Example only'
  };
}

function km(share: number): string {
  return (FUEL_KM * share).toLocaleString('en-AU') + ' km';
}
