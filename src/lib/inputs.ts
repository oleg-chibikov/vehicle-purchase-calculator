// The form: its values as typed, their defaults, and the numbers the calculation reads from them.
import { today } from './format';
import { CAR_TYPES, type CarType } from './rules';

export const STATES = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT'] as const;
export type State = (typeof STATES)[number];
export type Account = 'offset' | 'savings';
export type BonusKind = 'cash' | 'shares';

export interface Inputs {
  salary: number;
  bonus: number;
  bonusKind: BonusKind;
  price: number;
  carType: CarType;
  state: State;
  years: number;
  startDate: string;
  rego: number;
  insurance: number;
  service: number;
  charging: number;
  start: number;
  account: Account;
  mortgage: number;
  accountRate: number;
  leaseRate: number;
  balloonPct: number;
  fee: number;
  chargingInLease: boolean;
  noExemption: boolean;
  loanRate: number;
  homeRate: number;
}

// The form holds text as typed, so a half-typed number stays on screen. Checkboxes hold booleans.
export type FieldId = keyof Inputs;
export type FormValues = { [K in FieldId]: Inputs[K] extends boolean ? boolean : string };

export const DEFAULTS: Omit<FormValues, 'startDate' | 'charging'> = {
  salary: '200000',
  bonus: '0',
  bonusKind: 'cash',
  price: '50000',
  carType: 'ev',
  state: 'NSW',
  years: '5',
  rego: '1000',
  insurance: '1800',
  service: '600',
  start: '0',
  account: 'offset',
  mortgage: '500000',
  accountRate: '6',
  leaseRate: '7.5',
  balloonPct: '28.13',
  fee: '0',
  chargingInLease: true,
  noExemption: false,
  loanRate: '9',
  homeRate: '6'
};

// The start date defaults to today and the fuel cost to the default car type, so both are worked out on each visit.
export function defaultValues(): FormValues {
  return { ...DEFAULTS, startDate: today(), charging: String(CAR_TYPES[DEFAULTS.carType as CarType].fuel) };
}

// The values a select accepts. A saved value outside them is dropped.
export const OPTIONS: Partial<Record<FieldId, readonly string[]>> = {
  carType: Object.keys(CAR_TYPES),
  state: STATES,
  years: ['1', '2', '3', '4', '5'],
  account: ['offset', 'savings'],
  bonusKind: ['cash', 'shares']
};

export function readInputs(v: FormValues): Inputs {
  const n = (s: string) => {
    const x = parseFloat(s);
    return Number.isFinite(x) ? x : 0;
  };
  return {
    salary: n(v.salary), bonus: Math.max(0, n(v.bonus)), bonusKind: v.bonusKind as BonusKind, price: n(v.price), carType: v.carType as CarType, state: v.state as State,
    years: Math.max(1, Math.min(5, Math.round(n(v.years)))), startDate: v.startDate || today(),
    rego: n(v.rego), insurance: n(v.insurance), service: n(v.service), charging: n(v.charging),
    start: n(v.start), account: v.account as Account, mortgage: n(v.mortgage), accountRate: n(v.accountRate),
    leaseRate: n(v.leaseRate), balloonPct: n(v.balloonPct), fee: n(v.fee),
    chargingInLease: v.chargingInLease, noExemption: v.noExemption, loanRate: n(v.loanRate), homeRate: n(v.homeRate)
  };
}
