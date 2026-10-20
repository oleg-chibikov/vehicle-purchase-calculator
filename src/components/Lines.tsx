// Lines of text, each followed by the i icon for its sources.
import type { Line } from '../lib/explain';
import { Info } from './Info';

export function Lines({ lines }: { lines: Line[] }) {
  return lines.map((l, k) => (
    <div key={k}>{l.text || '\u00a0'}{l.src?.length ? <Info src={l.src} /> : null}</div>
  ));
}
