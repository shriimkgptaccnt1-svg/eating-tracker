import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/Header';
import { fromKey, monthCells, monthTitle, shiftMonth, todayKey, weekKeys } from '../dates';
import { looks, workout as t } from '../theme';

// Longest run of consecutive days (in order) that pass `test`.
function longestRun(keys, test) {
  let best = 0, run = 0;
  keys.forEach((k) => { run = test(k) ? run + 1 : 0; best = Math.max(best, run); });
  return best;
}

// Just shows which days had a workout. Tap a day to open it on the Workout tab.
export default function WorkoutCalendar({ workouts, focusKey, onOpenDay, onBack }) {
  const start = fromKey(focusKey);
  const [ym, setYm] = useState({ y: start.getFullYear(), m: start.getMonth() });
  const insets = useSafeAreaInsets();
  const today = todayKey();
  const cells = monthCells(ym.y, ym.m);
  const worked = (k) => !!workouts[k]?.length;

  const past = cells.filter((k) => k && k <= today);
  const count = past.filter(worked).length;
  const streak = longestRun(past, worked);
  const rest = longestRun(past, (k) => !worked(k));
  const thisMonth = cells.includes(today);
  const thisWeek = weekKeys(today).filter(worked).length;

  return (
    <View style={[styles.flex, { backgroundColor: t.bg }]}>
      <ScreenHeader
        look={looks.workout}
        title={monthTitle(ym.y, ym.m)}
        onBack={onBack}
        onPrev={() => setYm((v) => shiftMonth(v, -1))}
        onNext={() => setYm((v) => shiftMonth(v, 1))}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <View style={styles.stats}>
          <Stat big n={count} label={count === 1 ? 'workout this month' : 'workouts this month'} />
          <Stat n={streak} label="days in a row (best)" />
          <Stat n={rest} label="rest days in a row (max)" />
        </View>

        <View style={styles.card}>
          <View style={styles.grid}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <Text key={i} style={styles.weekday}>{d}</Text>
            ))}
            {cells.map((k, i) => (
              <View key={k || `b${i}`} style={styles.cellBox}>
                {k && (
                  <Pressable
                    onPress={() => onOpenDay(k)}
                    style={[styles.day, worked(k) && styles.dayWorked, k === today && styles.dayToday]}
                  >
                    <Text style={[styles.dayText, k > today && styles.dayFuture]}>{fromKey(k).getDate()}</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
          <View style={styles.legend}>
            <View style={[styles.dot, { backgroundColor: t.amber }]} />
            <Text style={styles.legendText}>worked out</Text>
            <View style={[styles.dot, styles.dotToday]} />
            <Text style={styles.legendText}>today</Text>
          </View>
        </View>

        {thisMonth && (
          <View style={styles.list}>
            <Text style={styles.listLabel}>This week</Text>
            <Text style={styles.listValue}>{thisWeek} {thisWeek === 1 ? 'workout' : 'workouts'} so far</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const Stat = ({ n, label, big }) => (
  <View style={[styles.stat, big && styles.statBig]}>
    <Text style={[styles.statNum, big && styles.statNumBig]}>{n}</Text>
    <Text style={[styles.statLabel, big && styles.statLabelBig]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  flex: { flex: 1 },
  stats: { flexDirection: 'row', gap: 8, marginHorizontal: 14, marginTop: 14 },
  stat: { flex: 1, backgroundColor: '#fff', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 6, alignItems: 'center' },
  statBig: { backgroundColor: t.navy },
  statNum: { fontSize: 24, fontWeight: '800', color: t.blue },
  statNumBig: { color: t.amber },
  statLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(0,29,79,0.6)', textAlign: 'center' },
  statLabelBig: { color: 'rgba(255,255,255,0.85)' },
  card: { margin: 14, marginBottom: 0, backgroundColor: '#fff', borderRadius: 18, padding: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cellBox: { width: `${100 / 7}%`, aspectRatio: 1, padding: 3, alignItems: 'center', justifyContent: 'center' },
  weekday: { width: `${100 / 7}%`, paddingVertical: 6, textAlign: 'center', fontSize: 11, fontWeight: '700', color: 'rgba(0,29,79,0.5)' },
  day: { width: '100%', height: '100%', borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  dayWorked: { backgroundColor: t.amber },
  dayToday: { borderWidth: 2, borderColor: t.blue },
  dayText: { fontSize: 14, fontWeight: '700', color: 'rgba(0,29,79,0.75)' },
  dayFuture: { color: 'rgba(0,29,79,0.25)' },
  legend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8, marginBottom: 2 },
  dot: { width: 11, height: 11, borderRadius: 6, marginLeft: 6 },
  dotToday: { borderWidth: 2, borderColor: t.blue },
  legendText: { fontSize: 11, color: 'rgba(0,29,79,0.7)' },
  list: { flexDirection: 'row', justifyContent: 'space-between', margin: 14, backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14 },
  listLabel: { fontSize: 14, fontWeight: '600', color: t.navy },
  listValue: { fontSize: 14, fontWeight: '700', color: t.blue },
});
