/**
 * localStorage that never throws (private browsing, disabled storage,
 * sandboxed frames). Saved places live only on this device.
 */
const KEY = 'rvahc:saved:v1';

export function loadSaved() {
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(list) ? list.filter((x) => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

export function persistSaved(set) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify([...set]));
    return true;
  } catch {
    return false;
  }
}
