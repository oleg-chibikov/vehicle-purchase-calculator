// localStorage keeps only the fields the person changed. An untouched start date stays today on the next visit.
import { defaultValues, OPTIONS, type FieldId, type FormValues } from './inputs';

const STORE_KEY = 'vehicle-purchase-calculator.inputs';

export type Saved = Partial<FormValues>;

// A saved value of the wrong kind, or one a select does not offer, is dropped.
export function loadSaved(): Saved {
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}') ?? {};
  } catch {
    return {};
  }
  const defaults = defaultValues(), out: Record<string, unknown> = {};
  for (const id of Object.keys(defaults) as FieldId[]) {
    const v = raw[id];
    if (typeof v !== typeof defaults[id]) continue;
    if (OPTIONS[id] && !OPTIONS[id].includes(v as string)) continue;
    out[id] = v;
  }
  return out as Saved;
}

export function writeSaved(saved: Saved): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(saved));
  } catch {
    // Storage is off. The values last until the page closes.
  }
}

export function clearSaved(): void {
  try {
    localStorage.removeItem(STORE_KEY);
  } catch {
    // Storage is off. The page has no saved values to clear.
  }
}
