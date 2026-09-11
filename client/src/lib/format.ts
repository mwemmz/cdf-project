export function fmtZmk(amount: number): string {
  return `K${Math.round(amount).toLocaleString('en-US')}`;
}

export function fmtDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function fmtDateTime(value: string | Date): string {
  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function fmtPct(value: number): string {
  return `${value.toFixed(1)}%`;
}