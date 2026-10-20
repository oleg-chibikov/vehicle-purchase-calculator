import { calc } from './lib/calc';
import { warnings } from './lib/explain';
import { today } from './lib/format';
import { readInputs } from './lib/inputs';
import { useForm } from './useForm';
import { CarCard } from './components/CarCard';
import { FormContext } from './components/fields';
import { Info } from './components/Info';
import { Results } from './components/Results';
import { SourcesCard } from './components/SourcesCard';
import { Working } from './components/Working';

export function App() {
  const form = useForm();
  const i = readInputs(form.values);
  const r = calc(i);
  const now = today();
  const flags = warnings(i, now);
  return (
    <FormContext value={form}>
      <div className="wrap">
        <header>
          <h1>Vehicle Purchase Calculator</h1>
          <p className="sub">Australia only. Compares a novated lease, a car loan and a cash purchase of the same car over the same term. Defaults are examples, not a quote.</p>
        </header>
        {flags.length > 0 && (
          <div className="flag">
            {flags.map((f, k) => <span key={k}>{k > 0 && ' '}{f.text}{f.src && <Info src={f.src} />}</span>)}
          </div>
        )}
        <CarCard i={i} r={r} onReset={form.reset} />
        <Results i={i} r={r} now={now} />
        <Working i={i} r={r} now={now} />
        <SourcesCard />
      </div>
    </FormContext>
  );
}
