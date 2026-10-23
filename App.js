import { useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, Keyboard, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Header from './src/components/Header';
import { CalendarIcon, GraphIcon, StatsIcon, WorkoutCalendarIcon } from './src/components/Icons';
import FoodPage from './src/pages/FoodPage';
import HabitsPage from './src/pages/HabitsPage';
import WorkoutPage from './src/pages/WorkoutPage';
import FoodCalendar from './src/screens/FoodCalendar';
import WeightGraph from './src/screens/WeightGraph';
import EditHabits from './src/screens/EditHabits';
import HabitStats from './src/screens/HabitStats';
import WorkoutCalendar from './src/screens/WorkoutCalendar';
import { loadAll, save, withDay } from './src/storage';
import { doneOn, isWorkoutHabit } from './src/habits';
import { todayKey } from './src/dates';
import { looks } from './src/theme';

const FOOD = 0, HABITS = 1, WORKOUT = 2;

export default function App() {
  const [db, setDb] = useState(null);
  const dbRef = useRef(null);
  const [dateKey, setDateKey] = useState(todayKey);
  const [page, setPage] = useState(FOOD);
  const [overlay, setOverlay] = useState(null); // 'foodCal' | 'weight' | 'editHabits' | 'habitStats' | 'workoutCal'
  const pager = useRef(null);
  const { width } = useWindowDimensions();
  const [pageHeight, setPageHeight] = useState(0);

  useEffect(() => {
    loadAll().then((d) => { dbRef.current = d; setDb(d); });
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

  const goTo = (i, animated = true) => {
    Keyboard.dismiss();
    setPage(i);
    pager.current?.scrollTo({ x: i * width, animated });
  };

  // Android back: close a dashboard first, then return to the Food tab, then leave the app.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (overlay) { setOverlay(null); return true; }
      if (page !== FOOD) { goTo(FOOD); return true; }
      return false;
    });
    return () => sub.remove();
  }, [overlay, page, width]);

  const update = (kind, value) => {
    dbRef.current = { ...dbRef.current, [kind]: value };
    setDb(dbRef.current);
    return save(kind, value);
  };

  const saveFood = (key, items) => update('food', withDay(dbRef.current.food, key, items));
  const saveWeight = (key, value) => update('weights', withDay(dbRef.current.weights, key, value));
  const saveHabits = (habits) => update('habits', habits);

  const setTicks = (key, ids) => update('habitLog', withDay(dbRef.current.habitLog, key, ids));
  const toggleHabit = (key, id) => {
    const ids = dbRef.current.habitLog[key] || [];
    return setTicks(key, ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
  };

  // Logging a workout ticks the Workout habit; clearing a logged workout unticks it.
  const saveWorkout = async (key, rows) => {
    const hadWorkout = !!dbRef.current.workouts[key]?.length;
    await update('workouts', withDay(dbRef.current.workouts, key, rows));
    const linked = dbRef.current.habits.filter((h) => !h.archived && isWorkoutHabit(h)).map((h) => h.id);
    if (!linked.length) return;
    const ids = dbRef.current.habitLog[key] || [];
    if (rows.length) await setTicks(key, [...new Set([...ids, ...linked])]);
    else if (hadWorkout) await setTicks(key, ids.filter((x) => !linked.includes(x)));
  };

  const openDay = (key, tab) => {
    setDateKey(key);
    setOverlay(null);
    goTo(tab, false);
  };

  if (!db) return <View style={styles.root} />;

  const activeHabits = db.habits.filter((h) => !h.archived);
  const habitCount = `${activeHabits.filter((h) => doneOn(db.habitLog, dateKey, h.id)).length}/${activeHabits.length}`;
  const header = (i, look, icons) => (
    <Header look={look} dateKey={dateKey} onChangeDate={setDateKey} icons={icons} active={i} onTab={goTo} habitCount={habitCount} />
  );

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <StatusBar style="dark" />
        <ScrollView
          ref={pager}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={styles.root}
          onLayout={(e) => setPageHeight(e.nativeEvent.layout.height)}
          onMomentumScrollEnd={(e) => {
            const i = Math.round(e.nativeEvent.contentOffset.x / width);
            if (i !== page) { Keyboard.dismiss(); setPage(i); }
          }}
        >
          <View style={{ width, height: pageHeight }}>
            <FoodPage
              header={header(FOOD, looks.food, [
                { Icon: CalendarIcon, onPress: () => setOverlay('foodCal') },
                { Icon: GraphIcon, onPress: () => setOverlay('weight') },
              ])}
              active={page === FOOD}
              dateKey={dateKey}
              items={db.food[dateKey] || []}
              weight={db.weights[dateKey]}
              onSave={saveFood}
              onSaveWeight={saveWeight}
            />
          </View>
          <View style={{ width, height: pageHeight }}>
            <HabitsPage
              header={header(HABITS, looks.habit, [{ Icon: StatsIcon, onPress: () => setOverlay('habitStats') }])}
              dateKey={dateKey}
              habits={db.habits}
              log={db.habitLog}
              onToggle={toggleHabit}
              onEdit={() => setOverlay('editHabits')}
            />
          </View>
          <View style={{ width, height: pageHeight }}>
            <WorkoutPage
              header={header(WORKOUT, looks.workout, [{ Icon: WorkoutCalendarIcon, onPress: () => setOverlay('workoutCal') }])}
              active={page === WORKOUT}
              dateKey={dateKey}
              items={db.workouts[dateKey] || []}
              onSave={saveWorkout}
            />
          </View>
        </ScrollView>

        {/* Dashboards sit on top so the tabs (and anything half-typed) stay as they were. */}
        {overlay && (
          <View style={StyleSheet.absoluteFill}>
            {overlay === 'foodCal' && (
              <FoodCalendar entries={db.food} weights={db.weights} focusKey={dateKey} onOpenDay={(k) => openDay(k, FOOD)} onBack={() => setOverlay(null)} />
            )}
            {overlay === 'weight' && <WeightGraph weights={db.weights} entries={db.food} onBack={() => setOverlay(null)} />}
            {overlay === 'editHabits' && <EditHabits habits={db.habits} onChange={saveHabits} onBack={() => setOverlay(null)} />}
            {overlay === 'habitStats' && <HabitStats habits={db.habits} log={db.habitLog} focusKey={dateKey} onBack={() => setOverlay(null)} />}
            {overlay === 'workoutCal' && (
              <WorkoutCalendar workouts={db.workouts} focusKey={dateKey} onOpenDay={(k) => openDay(k, WORKOUT)} onBack={() => setOverlay(null)} />
            )}
          </View>
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FCF1F0' },
});
