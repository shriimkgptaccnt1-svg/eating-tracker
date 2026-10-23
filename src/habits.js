import { fromKey, monthWeeks, todayKey, weekKeys } from './dates';

let counter = 0;
export const newHabitId = () => `h${Date.now().toString(36)}${(counter++).toString(36)}`;

export const DEFAULT_HABITS = [
  ['Sleep from 12 to 8', 7],
  ['Morning manifest', 7],
  ['Workout', 5],
  ['Reading for 30 mins', 7],
  ['Talk to fam & friends', 5],
  ['Healthy diet', 7],
  ['Goal journaling', 7],
  ['Vitamins', 7],
  ['Pursue hobbies', 1],
].map(([name, target], i) => ({ id: `d${i}`, name, target, archived: false }));

export const isDaily = (h) => h.target >= 7;
export const targetLabel = (h) => (isDaily(h) ? 'Every day' : `${h.target}× a week`);

// Habits that get ticked automatically when a workout is logged.
export const isWorkoutHabit = (h) => /work\s?out|gym/i.test(h.name);

export const doneOn = (log, key, id) => (log[key] || []).includes(id);

// Ticks for a habit in the Mon–Sun week containing `key`.
export const weekCount = (log, key, id) => weekKeys(key).filter((k) => doneOn(log, k, id)).length;

// Per-habit stats for one month, split into Mon–Sun weeks. Only days up to today count.
// Daily habits: target = days elapsed. Weekly habits (N a week): target = N × elapsed days / 7,
// and ticks above the target don't count, so one big week can't hide a missed one.
export function monthStats(habit, log, y, m, today = todayKey()) {
  let got = 0;
  let need = 0;
  const weeks = monthWeeks(y, m).map((days) => {
    const elapsed = days.filter((k) => k <= today);
    const done = elapsed.filter((k) => doneOn(log, k, habit.id)).length;
    if (!elapsed.length) return { fill: null, met: false, current: false };
    const current = days.includes(today);
    if (isDaily(habit)) {
      got += done;
      need += elapsed.length;
      return { fill: done / elapsed.length, met: done === elapsed.length && !current, current };
    }
    const partTarget = (habit.target * elapsed.length) / 7;
    got += Math.min(done, partTarget);
    need += partTarget;
    const weekTarget = Math.max(1, Math.round((habit.target * days.length) / 7));
    return { fill: Math.min(1, done / weekTarget), met: done >= weekTarget, current };
  });
  return { weeks, pct: need ? got / need : null };
}

// Habits to show for a month: active ones, plus deleted ones that still have ticks in it.
export function habitsForMonth(habits, log, y, m) {
  const ticked = new Set();
  Object.entries(log).forEach(([k, ids]) => {
    const d = fromKey(k);
    if (d.getFullYear() === y && d.getMonth() === m) ids.forEach((id) => ticked.add(id));
  });
  return habits.filter((h) => !h.archived || ticked.has(h.id));
}

export function overallPct(habits, log, y, m) {
  const pcts = habits.map((h) => monthStats(h, log, y, m).pct).filter((p) => p != null);
  return pcts.length ? pcts.reduce((a, b) => a + b, 0) / pcts.length : null;
}
