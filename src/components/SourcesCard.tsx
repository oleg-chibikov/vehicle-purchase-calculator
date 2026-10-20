// The table "Sources for every number": each fixed number, its value and where it comes from.
import { SOURCES, source, type SourceKey } from '../lib/sources';
import { SourceLinks } from './Info';

export function SourcesCard() {
  return (
    <details className="card fold">
      <summary><h2>Sources for every number</h2></summary>
      <p className="lbl">Each fixed number in the calculation, where it comes from, and when it was checked. The same links sit behind the i icons. A row marked as an assumption has no source: change that input to your own number.</p>
      <div className="scroll"><table className="src">
        <thead><tr><th>What</th><th>Value used</th><th>Source</th></tr></thead>
        <tbody>
          {(Object.keys(SOURCES) as SourceKey[]).map((k) => (
            <tr key={k}><td>{source(k).name}</td><td>{source(k).value}</td><td><SourceLinks k={k} /></td></tr>
          ))}
        </tbody>
      </table></div>
    </details>
  );
}
