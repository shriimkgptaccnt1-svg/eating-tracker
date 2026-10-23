import AsyncStorage from '@react-native-async-storage/async-storage';

// All entries live under one key: { "2026-10-23": [{ food, cost }], ... }
const KEY = 'eatout:entries';

export async function loadAll() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function saveDay(dateKey, items) {
  const all = await loadAll();
  if (items.length) all[dateKey] = items;
  else delete all[dateKey];
  await AsyncStorage.setItem(KEY, JSON.stringify(all));
  return all;
}
