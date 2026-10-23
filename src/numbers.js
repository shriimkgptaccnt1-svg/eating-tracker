// Parse a typed number ("72,4" works too); null when empty or invalid.
export function parseNum(text) {
  const n = parseFloat(String(text).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export const fmt = (n) => (n == null ? '' : Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10));
