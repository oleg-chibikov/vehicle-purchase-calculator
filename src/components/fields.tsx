// Form fields. Each one reads and writes its value through the form context.
import { createContext, useContext, type ReactNode } from 'react';
import type { FieldId } from '../lib/inputs';
import type { SourceKey } from '../lib/sources';
import type { Form } from '../useForm';
import { Info } from './Info';

export const FormContext = createContext<Form | null>(null);

function useFormContext(): Form {
  const form = useContext(FormContext);
  if (!form) throw new Error('FormContext must be provided');
  return form;
}

interface FieldProps {
  id: FieldId;
  label: string;
  hint?: ReactNode;
  src?: SourceKey[];
  hidden?: boolean;
}

export function NumberField({ step, ...p }: FieldProps & { step: number }) {
  const { values, change } = useFormContext();
  return (
    <Field {...p}>
      <input id={p.id} type="number" inputMode="decimal" step={step} value={values[p.id] as string}
        onChange={(e) => change(p.id, e.target.value)} />
    </Field>
  );
}

export function DateField(p: FieldProps) {
  const { values, change } = useFormContext();
  return (
    <Field {...p}>
      <input id={p.id} type="date" value={values[p.id] as string} onChange={(e) => change(p.id, e.target.value)} />
    </Field>
  );
}

// Each option is [value, label].
export function SelectField({ options, ...p }: FieldProps & { options: readonly (readonly [string, string])[] }) {
  const { values, change } = useFormContext();
  return (
    <Field {...p}>
      <select id={p.id} value={values[p.id] as string} onChange={(e) => change(p.id, e.target.value)}>
        {options.map(([v, text]) => <option key={v} value={v}>{text}</option>)}
      </select>
    </Field>
  );
}

export function CheckField(p: FieldProps) {
  const { values, change } = useFormContext();
  return (
    <Field {...p}>
      <input id={p.id} type="checkbox" checked={values[p.id] as boolean} onChange={(e) => change(p.id, e.target.checked)} />
    </Field>
  );
}

function Field({ id, label, hint, src, hidden, children }: FieldProps & { children: ReactNode }) {
  return (
    <div className="field" hidden={hidden}>
      <label htmlFor={id}>{label}{src && <Info src={src} />}{hint && <small>{hint}</small>}</label>
      {children}
    </div>
  );
}

// A worked-out number next to the fields or under a total.
export function Derived({ label, value }: { label: ReactNode; value: ReactNode }) {
  return <div className="derived"><span>{label}</span><b>{value}</b></div>;
}
