import { describe, expect, it } from 'vitest';
import { calc } from './calc';
import { defaultValues, readInputs, type FormValues } from './inputs';

// The start date is fixed, because the electric car FBT rules change by date.
function costs(changes: Partial<FormValues> = {}) {
  const r = calc(readInputs({ ...defaultValues(), startDate: '2026-10-20', ...changes }));
  return [r.cost.lease, r.cost.loan, r.cost.cash].map(Math.round);
}

describe('calc', () => {
  it('gives the known totals for the defaults', () => {
    expect(costs()).toEqual([52960, 91546, 86141]);
  });

  it('pays all take-home pay into the account each month', () => {
    const r = calc(readInputs({ ...defaultValues(), startDate: '2026-10-20', start: '0', accountRate: '0' }));
    expect(r.noCar.end).toBeCloseTo(r.takeHome * r.n / 12, 6);
    expect(r.account.loan.end).toBeCloseTo(r.flow.loan * r.n / 12, 6);
  });

  it('costs less once pay takes the offset past the mortgage owing sooner', () => {
    expect(costs({ start: '100000' })).toEqual([51951, 88981, 82837]);
  });

  it('loses no offset interest while the balance stays above the mortgage owing', () => {
    expect(costs({ start: '600000', mortgage: '500000' })).toEqual([50428, 85093, 72425]);
    expect(costs({ start: '600000', mortgage: '570000' })).toEqual([50428, 85093, 72571]);
  });

  it('taxes savings interest', () => {
    expect(costs({ start: '600000', account: 'savings' })).toEqual([52106, 92187, 83165]);
  });

  it('works out NSW stamp duty on a $50,000 car', () => {
    expect(calc(readInputs(defaultValues())).duty).toBe(1600);
  });

  it('splits each cost into parts that add up to it, plus the interest the account missed', () => {
    const r = calc(readInputs({ ...defaultValues(), startDate: '2026-10-20', accountRate: '0' }));
    for (const k of ['lease', 'loan', 'cash'] as const) {
      const sum = Object.values(r.parts[k]).reduce((a, b) => a + (b ?? 0), 0);
      expect(sum).toBeCloseTo(r.cost[k], 6);
    }
  });
});
