import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_HABITS } from './habits';

// Each kind of data lives under its own key, keyed by date where it makes sense:
//   food     { "2026-10-23": [{ food, cost }] }
//   weights  { "2026-10-23": 72.4 }
//   habits   [{ id, name, target, archived }]   target = days per week (7 = every day)
//   habitLog { "2026-10-23": [habitId, ...] }
//   workouts { "2026-10-23": [{ exercise, sets, kg, reps }] }   exercise "" = more sets of the row above
const KEYS = {
  food: 'eatout:entries',
  weights: 'eatout:weights',
  habits: 'eatout:habits',
  habitLog: 'eatout:habitLog',
  workouts: 'eatout:workouts',
};

async function read(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export async function loadAll() {
  const [food, weights, habits, habitLog, workouts] = await Promise.all([
    read(KEYS.food, {}),
    read(KEYS.weights, {}),
    read(KEYS.habits, null),
    read(KEYS.habitLog, {}),
    read(KEYS.workouts, {}),
  ]);
  return { food, weights, habits: habits || DEFAULT_HABITS, habitLog, workouts };
}

export const save = (kind, value) => AsyncStorage.setItem(KEYS[kind], JSON.stringify(value));

// Returns a copy of a date-keyed map with `key` set, or removed when the value is empty.
export function withDay(map, key, value) {
  const next = { ...map };
  const empty = value == null || (Array.isArray(value) && value.length === 0);
  if (empty) delete next[key];
  else next[key] = value;
  return next;
}
