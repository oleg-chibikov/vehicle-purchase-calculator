// Formatting helpers: money, percent and dates. Dates are ISO strings, so they compare as text.
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function usd(x: number, cents = false): string {
  const d = cents ? 2 : 0;
  const s = Math.abs(x).toLocaleString('en-AU', { minimumFractionDigits: d, maximumFractionDigits: d });
  return (x < -0.5 ? '-$' : '$') + s;
}

export function pct(x: number): string {
  return Math.round(x * 10000) / 100 + '%';
}

export function longDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return +d + ' ' + MONTHS[+m - 1] + ' ' + y;
}

export function dayBefore(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function today(): string {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function plural(n: number, word: string): string {
  return n + ' ' + word + (n === 1 ? '' : 's');
}
