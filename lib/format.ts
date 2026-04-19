/** Formats a nullable number as a string, returning `fallback` for null/undefined. */
export function fmt(value: number | null | undefined, fallback = '—'): string {
  if (value == null) return fallback;
  return String(value);
}

/** Formats a nullable accuracy value as "85.1%". */
export function fmtAccuracy(value: number | null | undefined): string {
  if (value == null) return '—';
  return `${value.toFixed(1)}%`;
}

/** Formats a nullable duration in seconds as "5 min 30 sec". */
export function fmtDuration(seconds: number | null | undefined): string {
  if (seconds == null) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m} min ${s} sec`;
}

/** Formats an ISO date string as "19 Apr 2026" (date only, GB locale). */
export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Formats an ISO date string as "19 Apr 2026 14:30" (date + time, GB locale). */
export function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const time = d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${date} ${time}`;
}
