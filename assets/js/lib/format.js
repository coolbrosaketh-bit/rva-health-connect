/** Formatting and small string helpers. */

/** Escape text for safe insertion into HTML. */
export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** "(804) 358-6343" → "tel:+18043586343"; short codes like "988" stay as-is. */
export function telHref(phone) {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length <= 4) return `tel:${digits}`;
  const national = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  return `tel:+1${national}`;
}

export function smsHref(number) {
  return `sms:${String(number).replace(/\D/g, '')}`;
}

export function fullAddress(location) {
  return [location.street, `${location.city}, VA ${location.zip}`].filter(Boolean).join(', ');
}

/** Google Maps directions link (opens the app on phones). */
export function directionsUrl(location) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress(location))}`;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "2026-11-19" → "November 19, 2026" (no time-zone shifting). */
export function formatDate(iso, { short = false } = {}) {
  const [y, m, d] = iso.split('-').map(Number);
  const month = MONTHS[m - 1];
  return `${short ? month.slice(0, 3) + '.' : month} ${d}, ${y}`.replace('May.', 'May');
}

export function formatMiles(miles) {
  if (miles == null) return '';
  if (miles < 0.1) return 'Less than 0.1 mi';
  return `${miles < 10 ? miles.toFixed(1) : Math.round(miles)} mi`;
}

export function formatMoney(n) {
  return `$${n.toLocaleString('en-US')}`;
}

export function pluralize(n, one, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}
