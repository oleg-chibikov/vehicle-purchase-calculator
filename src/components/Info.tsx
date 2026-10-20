// The "i" icon. Its tooltip shows the formula when given, then names each source, the value used, and links to the page it came from.
import { Fragment, useRef, type MouseEvent } from 'react';
import { RULES_CHECKED } from '../lib/rules';
import { source, type SourceKey } from '../lib/sources';

interface InfoProps {
  src: SourceKey | SourceKey[];
  formula?: string;
}

export function Info({ src, formula }: InfoProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const keys = ([] as SourceKey[]).concat(src);
  const place = () => ref.current && placeTip(ref.current);
  // A click on an icon inside a label or a summary opens the tooltip. The input and the fold stay as they are.
  const click = (e: MouseEvent) => {
    if ((e.target as Element).closest('a')) return;
    e.preventDefault();
    ref.current?.focus();
    place();
  };
  const blocks = [
    ...(formula ? [<Fragment key="formula">{formula}</Fragment>] : []),
    ...keys.map((k) => (
      <Fragment key={k}>
        <b>{source(k).name}</b><br />{source(k).value}<br /><SourceLinks k={k} />
      </Fragment>
    ))
  ];
  return (
    <span className="i" tabIndex={0} role="button" aria-label={'Source: ' + keys.map((k) => source(k).name).join(', ')}
      ref={ref} onMouseEnter={place} onFocus={place} onClick={click}>
      i
      <span className="tip" role="tooltip">
        {blocks.map((b, k) => <Fragment key={k}>{k > 0 && <hr />}{b}</Fragment>)}
      </span>
    </span>
  );
}

// Where a source comes from: its links and the check date, or why it has none.
export function SourceLinks({ k }: { k: SourceKey }) {
  const s = source(k);
  if (!s.links) return <span className="assume">{s.note ?? 'Assumption, no source. Change the input to your own number.'}</span>;
  return (
    <>
      {s.links.map(([text, url], n) => (
        <Fragment key={url}>{n > 0 && <br />}<a href={url} target="_blank" rel="noopener">{text}</a></Fragment>
      ))}
      <br /><small className="lbl">Checked on {RULES_CHECKED}</small>
    </>
  );
}

// Tooltips use fixed positioning so tables and formula boxes with scrollbars do not clip them.
function placeTip(icon: HTMLElement) {
  const tip = icon.querySelector<HTMLElement>('.tip');
  if (!tip) return;
  const r = icon.getBoundingClientRect(), w = Math.min(340, window.innerWidth - 16);
  tip.style.width = w + 'px';
  tip.style.left = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), window.innerWidth - w - 8) + 'px';
  const below = r.bottom + 2;
  tip.style.top = below + 'px';
  const h = tip.offsetHeight;
  if (h && below + h > window.innerHeight - 8 && r.top - h - 2 > 8) tip.style.top = r.top - h - 2 + 'px';
}
