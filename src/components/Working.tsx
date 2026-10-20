// "How it is worked out": the per-year table, the account year by year, FBT, the formulas and the assumptions.
import type { ReactNode } from 'react';
import type { Result, TierTax } from '../lib/calc';
import { fbtExplain, formulaLines } from '../lib/explain';
import { pct, usd } from '../lib/format';
import type { Inputs } from '../lib/inputs';
import { MEDICARE, TAX_YEAR } from '../lib/rules';
import { Info } from './Info';
import { Lines } from './Lines';

interface WorkingProps {
  i: Inputs;
  r: Result;
  now: string;
}

export function Working({ i, r, now }: WorkingProps) {
  return (
    <details className="card fold">
      <summary><h2>How it is worked out</h2></summary>
      <h3 className="sec">Per year</h3>
      <OptionTable first="Line"><WorkRows i={i} r={r} /></OptionTable>
      <h3 className="sec">Account balance year by year</h3>
      <OptionTable first="End of year"><BalanceRows i={i} r={r} /></OptionTable>
      <h3 className="sec">Fringe benefits tax for this car</h3>
      <div className="formula"><Lines lines={fbtExplain(i, r, now)} /></div>
      <h3 className="sec">Stamp duty and lease payment</h3>
      <div className="formula"><Lines lines={formulaLines(i, r)} /></div>
      <h3 className="sec">Assumptions and what is left out</h3>
      <ul className="notes">
        <li>Australian tax resident, no HELP debt, no other income. Salary and running costs stay flat for the whole term.</li>
        <li>Salary, payments and running costs are paid at the end of each month. Some lease providers charge in advance, which makes the payment slightly lower.</li>
        <li>The account holds the cash today and the money the car takes out or gives back. Salary and living costs are the same in every option, so they stay out of it.</li>
        <li>The account earns interest every month. Offset interest is tax free and only counts on the balance up to the mortgage owing. Savings interest is taxed at the end of each year. A balance below zero costs the same rate with no tax deduction.<Info src="assumeRates" /></li>
        <li>The mortgage owing stays the same for the whole term. In real life repayments lower it, so a large offset balance can pass it sooner.</li>
        <li>Left out: super, early termination fees, car resale value, road user charges, stamp duty inside insurance premiums and the base value drop after 4 years.<Info src="oneThird" /></li>
        <li>This is not tax or financial advice. Check real numbers with a lease quote and a tax professional.</li>
      </ul>
    </details>
  );
}

function OptionTable({ first, children }: { first: string; children: ReactNode }) {
  return (
    <div className="scroll"><table>
      <thead><tr><th>{first}</th><th className="lease">Novated lease</th><th className="loan">Car loan</th><th className="cash">Cash purchase</th></tr></thead>
      <tbody>{children}</tbody>
    </table></div>
  );
}

// Pay, tax by tier, what is left, then totals over the term. Whole dollars, the formulas show cents.
function WorkRows({ i, r }: { i: Inputs; r: Result }) {
  const L = r.leaseTax, S = r.salaryTax, savings = i.account === 'savings', a = r.account;
  const interestTax = (k: 'lease' | 'loan' | 'cash') => (savings ? usd(a[k].interestTax) : 'tax free');
  return (
    <>
      <Head>Pay</Head>
      <Row label="Gross salary" cells={[usd(i.salary), usd(i.salary), usd(i.salary)]} />
      <Row cls="sub" label={<>Lease payments, fees and running costs, without GST<Info src={['gst', 'assumeFuelGst']} /></>} cells={['-' + usd(r.packageYear), '-', '-']} />
      {!r.fbt.exempt && <Row cls="sub" label={<>Less the post-tax contribution, without its GST<Info src={['statutory', 'ecmGst']} /></>} cells={['+' + usd(r.ecm - r.ecmGst), '-', '-']} />}
      {!r.fbt.exempt && r.fbtTax > 0.005 && <Row cls="sub" label={<>FBT on the taxable value left, charged pre-tax<Info src="fbtRates" /></>} cells={['-' + usd(r.fbtTax), '-', '-']} />}
      <Row cls="total" label="Taxable income from salary" cells={[usd(L.taxable), usd(S.taxable), usd(S.taxable)]} />
      <Head>Income tax on salary by tier, {TAX_YEAR}<Info src="tax" /></Head>
      {L.rows.map((lr, k) => (
        <Row key={k} label={tierLabel(lr)} cells={[<TierCell t={lr} />, <TierCell t={S.rows[k]} />, <TierCell t={S.rows[k]} />]} />
      ))}
      <Row cls="sub" label={<>Medicare levy, {pct(MEDICARE)}<Info src="medicare" /></>} cells={[usd(L.medicare), usd(S.medicare), usd(S.medicare)]} />
      <Row cls="total" label="Total tax on salary" cells={[usd(L.total), usd(S.total), usd(S.total)]} />
      <Head>What is left</Head>
      <Row label="Take-home pay" cells={[usd(i.salary - r.leasePretaxYear - L.total), usd(r.takeHome), usd(r.takeHome)]} />
      <Row cls="sub" label="Loan repayments, after tax" cells={['-', '-' + usd(r.loanMonthly * 12), '-']} />
      {r.ecm > 0 && <Row cls="sub" label={<>Post-tax contribution to the lease, with GST<Info src={['statutory', 'ecmGst']} /></>} cells={['-' + usd(r.ecm), '-', '-']} />}
      <Row cls="sub" label="Running costs paid from take-home pay" cells={[r.leaseRunningPost > 0 ? '-' + usd(r.leaseRunningPost) : '-', '-' + usd(r.runningFull), '-' + usd(r.runningFull)]} />
      <Row cls="total" label="Take-home pay left after the car, paid into the account per year" cells={[usd(r.flow.lease), usd(r.flow.loan), usd(r.flow.cash)]} />
      <Row cls="sub" label="With no car, all take-home pay goes in" cells={[usd(r.takeHome), usd(r.takeHome), usd(r.takeHome)]} />
      <Head>Over the whole term</Head>
      <Row cls="sub" label="Paid up front, price and stamp duty" cells={['-', '-', usd(r.upfront)]} />
      <Row cls="sub" label={<>Balloon paid at the end, with GST<Info src={['residual', 'gst']} /></>} cells={[usd(r.balloon), '-', '-']} />
      <Row cls="sub" label="Tax saved per year compared with the loan" cells={[usd(S.total - L.total), '-', '-']} />
      <Row cls="sub" label="Running costs over the term" cells={[usd(r.leaseRunningYear * i.years), usd(r.runningFull * i.years), usd(r.runningFull * i.years)]} />
      {!r.fbt.exempt && <Row cls="sub" label={<>GST on the post-tax contribution and FBT, over the term<Info src={['ecmGst', 'fbtRates']} /></>} cells={[usd((r.ecmGst + r.fbtTax) * i.years), '-', '-']} />}
      <Row cls="total" label="Total paid for the car and running it, before tax savings" cells={[usd(r.totalPaid.lease), usd(r.totalPaid.loan), usd(r.totalPaid.cash)]} />
      <Row cls="sub" label={<>Income tax over the term<Info src={['tax', 'medicare']} /></>} cells={[usd(a.lease.tax.total), usd(a.loan.tax.total), usd(a.cash.tax.total)]} />
      <Row cls="sub" label="Interest on the account" cells={[usd(a.lease.interest), usd(a.loan.interest), usd(a.cash.interest)]} />
      <Row cls="sub" label="Tax on that interest" cells={[interestTax('lease'), interestTax('loan'), interestTax('cash')]} />
    </>
  );
}

function BalanceRows({ i, r }: { i: Inputs; r: Result }) {
  const a = r.account;
  return (
    <>
      <Row cls="sub" label="Start" cells={[usd(i.start), usd(i.start), usd(r.cashStart)]} />
      {a.lease.years.map((bal, k) => <Row key={k} label={String(k + 1)} cells={[usd(bal), usd(a.loan.years[k]), usd(a.cash.years[k])]} />)}
      <Row cls="sub" label="Balloon paid at the end of the lease" cells={['-' + usd(r.balloon), '-', '-']} />
      <Row cls="total" label="Final balance" cells={[usd(a.lease.end), usd(a.loan.end), usd(a.cash.end)]} />
    </>
  );
}

interface RowProps {
  label: ReactNode;
  cells: [ReactNode, ReactNode, ReactNode];
  cls?: 'sub' | 'total';
}

function Row({ label, cells, cls }: RowProps) {
  return <tr className={cls}><td>{label}</td>{cells.map((c, k) => <td key={k} className="n">{c}</td>)}</tr>;
}

function Head({ children }: { children: ReactNode }) {
  return <tr className="head"><td colSpan={4}>{children}</td></tr>;
}

function TierCell({ t }: { t: TierTax }) {
  return <>{usd(t.tax)}<small>on {usd(t.inBand)} at {pct(t.rate)}</small></>;
}

function tierLabel(b: TierTax): string {
  return b.to === Infinity ? usd(b.from + 1) + ' and over' : usd(b.from === 0 ? 0 : b.from + 1) + ' to ' + usd(b.to);
}
