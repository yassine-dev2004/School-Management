/**
 * Safe calendar date formatting utility to prevent UTC off-by-one day bugs.
 * Standardizes parsing of 'YYYY-MM-DD' strings directly into local calendar dates.
 */

export const formatDateSafe = (dateVal, options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' }) => {
  if (!dateVal) return '—';
  const str = String(dateVal).trim();
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const year = Number(match[1]);
    const monthIndex = Number(match[2]) - 1;
    const day = Number(match[3]);
    const localDate = new Date(year, monthIndex, day);
    return localDate.toLocaleDateString('ar-TN-u-nu-latn', options);
  }
  try {
    return new Date(dateVal).toLocaleDateString('ar-TN-u-nu-latn', options);
  } catch {
    return str;
  }
};

export const formatDateShortSafe = (dateVal) => {
  if (!dateVal) return '—';
  const str = String(dateVal).trim();
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  return str.length >= 10 ? str.substring(0, 10) : str;
};

export const getTodayIsoDate = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
