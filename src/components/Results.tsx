// The three result columns: each total, where it goes, the account at the end, and that option's own settings.
import { Fragment, type ReactNode } from 'react';
import type { Option, Result } from '../lib/calc';
import { borrowText, costNote, endFormula, splitLines } from '../lib/explain';
import { pct, plural, usd } from '../lib/format';
import type { Inputs } from '../lib/inputs';
import { STATUTORY_RATE } from '../lib/rules';
import { CheckField, Derived, NumberField } from './fields';
import { Info } from './Info';
import { Lines } from './Lines';

interface ResultsProps {
  i: Inputs;
  r: Result;
  now: string;
}

export function Results({ i, r, now }: ResultsProps) {
  const cheapest = Math.min(r.cost.lease, r.cost.loan, r.cost.cash);
  const col = { i, r, cheapest };
  return (
    <section className="card" aria-live="polite">
      <h2>Total cost of the car over {plural(i.years, 'year')}</h2>
      <div className="cols">
        <Column k="lease" title="Novated lease" desc="Paid from salary before tax. Balloon at the end." {...col}>
          <Derived label="Monthly payment, before tax" value={usd(r.leaseMonthly)} />
          <Derived label={<>Fringe benefits tax<Info src={r.fbt.src} /></>}
            value={r.fbt.exempt ? 'exempt' : r.fbtTax > 0.005 ? usd(r.fbtTax) + ' a year' : '$0 after the contribution'} />
          <details className="more">
            <summary>Lease settings</summary>
            <div className="stack">
              <NumberField id="leaseRate" label="Lease interest, % p.a." hint="Financier rate on the quote" src={['assumeRates']} step={0.05} />
              <NumberField id="balloonPct" label="Lease balloon, %" hint="ATO minimum for the term" src={['residual']} step={0.01} />
              <NumberField id="fee" label="Lease provider fees per year" hint="Pre-tax" step={10} />
              <CheckField id="chargingInLease" label="Fuel or charging paid through the lease" hint="Paid pre-tax by the provider" src={['assumeFuelGst']} />
              <CheckField id="noExemption" label="Lease without the FBT exemption" hint={'Compare with the full ' + pct(STATUTORY_RATE) + ' FBT rule'} src={['statutory']} />
            </div>
          </details>
          <details className="more">
            <summary>All lease numbers</summary>
            <Derived label={<>GST credit claimed by the employer<Info src={['carLimit', 'gst']} /></>} value={usd(r.gstCredit)} />
            <Derived label={<>Amount financed, without GST, with stamp duty<Info src="carLimit" /></>} value={usd(r.financed)} />
            <Derived label={<>Post-tax contribution per year<Info src={['statutory', 'ecmGst']} /></>} value={r.ecm > 0 ? usd(r.ecm) : 'none'} />
            <Derived label={<>Reportable fringe benefit per year<Info src={['fbtRates', 'rfba']} /></>} value={r.rfba > 0 ? usd(r.rfba) : 'none'} />
            <Derived label={<>Running costs per year, pre-tax<Info src={['gst', 'assumeFuelGst']} /></>} value={usd(r.leaseRunningYear)} />
            <Derived label={<>Residual, without GST<Info src="residual" /></>} value={usd(r.residual)} />
            <Derived label={<>Balloon at the end, with GST<Info src="gst" /></>} value={usd(r.balloon)} />
          </details>
        </Column>
        <Column k="loan" title="Car loan" desc="Price and stamp duty borrowed, repaid from take-home pay." {...col}>
          <Derived label="Monthly repayment, after tax" value={usd(r.loanMonthly)} />
          <details className="more">
            <summary>Loan settings</summary>
            <div className="stack">
              <NumberField id="loanRate" label="Loan interest, % p.a." src={['assumeRates']} step={0.01} />
            </div>
          </details>
        </Column>
        <Column k="cash" title="Cash purchase" desc="Price and stamp duty leave the account on day one." {...col} />
      </div>
      <div className="lbl note"><Lines lines={costNote(i, r, now)} /></div>
    </section>
  );
}

interface ColumnProps {
  k: Option;
  title: string;
  desc: string;
  i: Inputs;
  r: Result;
  cheapest: number;
  children?: ReactNode;
}

function Column({ k, title, desc, i, r, cheapest, children }: ColumnProps) {
  const cost = r.cost[k], best = cost <= cheapest + 0.5, borrow = borrowText(i, r, k);
  return (
    <div className={'col ' + k}>
      <h3>{title}</h3>
      <p className="desc">{desc}</p>
      <div className="big">{usd(cost)}</div>
      <div className={best ? 'lbl best' : 'lbl'}>{best ? 'Lowest cost' : '+' + usd(cost - cheapest) + ' more than the lowest'}</div>
      <dl className="split">
        {splitLines(i, r, k).map((l) => (
          <Fragment key={l.label}>
            <dt>{l.label}<Info src={l.src} formula={l.formula} /></dt>
            <dd>{(l.value > 0 ? '+' : '') + usd(l.value)}</dd>
          </Fragment>
        ))}
      </dl>
      <Derived label={<>Account after {plural(i.years, 'year')}<Info src="assumeRates" formula={endFormula(i, r, k)} /></>} value={usd(r.account[k].end)} />
      <Derived label={<>Less to borrow for a home<Info src={['buffer', 'assumeLender']} formula={borrow.formula} /></>} value={borrow.value} />
      {children}
    </div>
  );
}
