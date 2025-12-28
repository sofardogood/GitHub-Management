export function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('ja-JP', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelative(value) {
  if (!value) return '';
  const date = new Date(value);
  const diff = date.getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat('ja-JP', { numeric: 'auto' });
  const units = [
    { unit: 'day', ms: 86400000 },
    { unit: 'hour', ms: 3600000 },
    { unit: 'minute', ms: 60000 },
  ];

  for (const { unit, ms } of units) {
    const value = Math.round(diff / ms);
    if (Math.abs(value) >= 1) {
      return rtf.format(value, unit);
    }
  }

  return 'たった今';
}
