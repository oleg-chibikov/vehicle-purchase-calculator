// The form state: defaults with the saved changes on top. Each change is saved as it happens.
import { useMemo, useState } from 'react';
import { defaultValues, type FieldId, type FormValues } from './lib/inputs';
import { CAR_TYPES, RESIDUAL, type CarType } from './lib/rules';
import { clearSaved, loadSaved, writeSaved, type Saved } from './lib/storage';

export interface Form {
  values: FormValues;
  change<K extends FieldId>(id: K, value: FormValues[K]): void;
  reset(): void;
}

export function useForm(): Form {
  const [saved, setSaved] = useState<Saved>(loadSaved);
  const values = useMemo(() => ({ ...defaultValues(), ...saved }), [saved]);

  function change<K extends FieldId>(id: K, value: FormValues[K]) {
    const next: Saved = { ...saved, [id]: value };
    // Picking a car type or a term fills in its default fuel cost or the ATO minimum balloon.
    if (id === 'carType') next.charging = String(CAR_TYPES[value as CarType].fuel);
    if (id === 'years') next.balloonPct = String(RESIDUAL[+value]);
    setSaved(next);
    writeSaved(next);
  }

  function reset() {
    setSaved({});
    clearSaved();
  }

  return { values, change, reset };
}
