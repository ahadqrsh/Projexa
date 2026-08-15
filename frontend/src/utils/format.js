const RELATIVE = [
  [60, 'second', 1],
  [3600, 'minute', 60],
  [86400, 'hour', 3600],
  [604800, 'day', 86400],
  [2592000, 'week', 604800],
  [31536000, 'month', 2592000],
  [Infinity, 'year', 31536000],
];

export const timeAgo = (value) => {
  if (!value) return '';
  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 5) return 'just now';
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  for (const [limit, unit, divisor] of RELATIVE) {
    if (seconds < limit) return formatter.format(-Math.floor(seconds / divisor), unit);
  }
  return '';
};

export const formatDate = (value, options = {}) =>
  value
    ? new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        ...options,
      }).format(new Date(value))
    : '';

export const formatNumber = (value) => new Intl.NumberFormat('en').format(value ?? 0);

export const titleCase = (value = '') =>
  String(value)
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

export const initialsOf = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

export const daysUntil = (date) =>
  date ? Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000) : null;
