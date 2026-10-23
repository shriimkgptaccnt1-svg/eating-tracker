import { useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import LogScreen from './src/LogScreen';
import DashboardScreen from './src/DashboardScreen';
import { loadAll, saveDay } from './src/storage';
import { todayKey } from './src/dates';

export default function App() {
  const [entries, setEntries] = useState(null);
  const [dateKey, setDateKey] = useState(todayKey);
  const [screen, setScreen] = useState('log');

  useEffect(() => {
    loadAll().then(setEntries);
  }, []);

  // If the app sat open past midnight, jump to the new day when it's reopened.
  const lastToday = useRef(todayKey());
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      const now = todayKey();
      if (now !== lastToday.current) {
        setDateKey((d) => (d === lastToday.current ? now : d));
        lastToday.current = now;
      }
    });
    return () => sub.remove();
  }, []);

  // Android back button on the calendar returns to the log instead of closing the app.
  useEffect(() => {
    if (screen !== 'dashboard') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setScreen('log');
      return true;
    });
    return () => sub.remove();
  }, [screen]);

  const save = async (key, items) => setEntries(await saveDay(key, items));

  return (
    <SafeAreaProvider>
      {/* Each screen pads for the safe area itself so its coloured bar runs under the status bar. */}
      <View style={styles.root}>
        <StatusBar style={screen === 'log' ? 'light' : 'dark'} />
        {entries && (screen === 'log' ? (
          <LogScreen
            dateKey={dateKey}
            items={entries[dateKey] || []}
            onChangeDate={setDateKey}
            onSave={save}
            onOpenDashboard={() => setScreen('dashboard')}
          />
        ) : (
          <DashboardScreen
            entries={entries}
            focusKey={dateKey}
            onOpenDay={(key) => { setDateKey(key); setScreen('log'); }}
            onBack={() => setScreen('log')}
          />
        ))}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
