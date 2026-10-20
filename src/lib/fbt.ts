// The statutory rate for this lease, why, and which sources say so. A rate of 0 means exempt.
import { dayBefore, longDate, pct, usd } from './format';
import type { Inputs } from './inputs';
import {
  EV_DISCOUNT_RATE, EV_FIRST_USE, EV_FULL_CAP, EV_PHASE2, EV_PHASE3, LCT_FUEL_EFFICIENT, PHEV_CUTOFF, STATUTORY_RATE, TAX_YEAR
} from './rules';
import type { SourceKey } from './sources';

export interface FbtStatus {
  rate: number;
  exempt: boolean;
  // The rule comes from the announced changes, not yet law.
  announced: boolean;
  why: string;
  src: SourceKey[];
}

export function fbtStatus(i: Inputs): FbtStatus {
  const full = (why: string, src: SourceKey[]): FbtStatus => ({ rate: STATUTORY_RATE, exempt: false, announced: false, why, src });
  const exempt = (why: string, src: SourceKey[], announced = false): FbtStatus => ({ rate: 0, exempt: true, announced, why, src });
  if (i.noExemption) return full('The box "Lease without the FBT exemption" is ticked.', ['statutory']);
  if (i.carType === 'ice') return full('Only battery electric and hydrogen fuel cell cars qualify for the electric car exemption.', ['evExempt', 'statutory']);
  if (i.startDate < EV_FIRST_USE) return full('The exemption covers cars first used on or after ' + longDate(EV_FIRST_USE) + '.', ['evExempt']);
  if (i.price > LCT_FUEL_EFFICIENT) {
    return full('The price is above the luxury car tax threshold for fuel-efficient cars (' + usd(LCT_FUEL_EFFICIENT) + ' for ' + TAX_YEAR + '). A car above it does not qualify.', ['evExempt', 'lct']);
  }
  if (i.carType === 'phev') {
    if (i.startDate >= PHEV_CUTOFF) return full('Plug-in hybrids lost the exemption on ' + longDate(PHEV_CUTOFF) + '. A plug-in hybrid first used from that day pays FBT.', ['phev']);
    return exempt('A plug-in hybrid first used before ' + longDate(PHEV_CUTOFF) + ' keeps the exemption to the end of the lease signed then. An optional extension loses it.', ['phev']);
  }
  if (i.startDate < EV_PHASE2) {
    return exempt('An electric car first used on or after ' + longDate(EV_FIRST_USE) + ', priced under the LCT threshold, is exempt. A lease that starts before ' + longDate(EV_PHASE2) + ' keeps the full exemption for its whole term under the announced changes.', ['evExempt', 'evChange']);
  }
  if (i.startDate < EV_PHASE3 && i.price <= EV_FULL_CAP) {
    return exempt('Announced, not yet law: a lease that starts from ' + longDate(EV_PHASE2) + ' to ' + longDate(dayBefore(EV_PHASE3)) + ' on an electric car costing ' + usd(EV_FULL_CAP) + ' or less keeps the full exemption, through a 0% statutory rate.', ['evChange'], true);
  }
  const discount = pct(1 - EV_DISCOUNT_RATE / STATUTORY_RATE) + ' FBT discount, through a ' + pct(EV_DISCOUNT_RATE) + ' statutory rate.';
  return {
    rate: EV_DISCOUNT_RATE, exempt: false, announced: true, src: ['evChange'],
    why: i.startDate < EV_PHASE3
      ? 'Announced, not yet law: from ' + longDate(EV_PHASE2) + ' an electric car costing more than ' + usd(EV_FULL_CAP) + ' gets a ' + discount
      : 'Announced, not yet law: from ' + longDate(EV_PHASE3) + ' every electric car under the LCT threshold gets a ' + discount
  };
}
