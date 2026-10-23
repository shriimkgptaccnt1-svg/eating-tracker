export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pad = (n) => String(n).padStart(2, '0');

export const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export const todayKey = () => toKey(new Date());

export function addDays(key, n) {
  const d = fromKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

// "Fri, 23 Oct" – short enough to share the bar with the icons.
export function shortDate(key) {
  const d = fromKey(key);
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

export const dayMonth = (key) => {
  const d = fromKey(key);
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
};

export const monthName = (m) => MONTHS[m];
export const monthTitle = (y, m) => `${MONTHS[m]} ${y}`;

export function shiftMonth({ y, m }, n) {
  const d = new Date(y, m + n, 1);
  return { y: d.getFullYear(), m: d.getMonth() };
}

export const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();

// Monday of the week containing `key`.
export function weekStart(key) {
  const d = fromKey(key);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return toKey(d);
}

export const weekKeys = (key) => {
  const start = weekStart(key);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
};

// Cells for a Monday-first month grid; null = blank cell before day 1 / after last day.
export function monthCells(y, m) {
  const offset = (new Date(y, m, 1).getDay() + 6) % 7;
  const count = daysInMonth(y, m);
  const cells = Array(offset).fill(null);
  for (let day = 1; day <= count; day++) cells.push(toKey(new Date(y, m, day)));
  while (cells.length % 7) cells.push(null);
  return cells;
}

// The Mon–Sun weeks touching a month, each as the list of that month's day keys in it.
export function monthWeeks(y, m) {
  const cells = monthCells(y, m);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7).filter(Boolean));
  return weeks;
}
