import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/Header';
import { fromKey, monthName, monthWeeks, shiftMonth } from '../dates';
import { habitsForMonth, isDaily, monthStats, overallPct } from '../habits';
import { habit as t, looks } from '../theme';

const pctText = (p) => `${Math.round(p * 100)}%`;

// Week strips: one row per habit, one bar per Mon–Sun week, filled by how much of that
// week's target was hit (dark = target met), plus the month % on the right.
export default function HabitStats({ habits, log, focusKey, onBack }) {
  const start = fromKey(focusKey);
  const [ym, setYm] = useState({ y: start.getFullYear(), m: start.getMonth() });
  const insets = useSafeAreaInsets();

  const list = habitsForMonth(habits, log, ym.y, ym.m);
  const rows = list.map((h) => ({ h, ...monthStats(h, log, ym.y, ym.m) }));
  const overall = overallPct(list, log, ym.y, ym.m);
  const prev = shiftMonth(ym, -1);
  const prevPct = overallPct(habitsForMonth(habits, log, prev.y, prev.m), log, prev.y, prev.m);
  const scored = rows.filter((r) => r.pct != null);
  const best = scored.length ? scored.reduce((a, b) => (b.pct > a.pct ? b : a)) : null;
  const weekCount = monthWeeks(ym.y, ym.m).length;
  const hasTicks = Object.keys(log).some((k) => {
    const d = fromKey(k);
    return d.getFullYear() === prev.y && d.getMonth() === prev.m;
  });

  return (
    <View style={[styles.flex, { backgroundColor: t.bg }]}>
      <ScreenHeader
        look={looks.habit}
        title={`Habits · ${monthName(ym.m)}`}
        onBack={onBack}
        onPrev={() => setYm((v) => shiftMonth(v, -1))}
        onNext={() => setYm((v) => shiftMonth(v, 1))}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        {overall == null ? (
          <Text style={styles.empty}>Nothing to show for {monthName(ym.m)} yet.</Text>
        ) : (
          <>
            <View style={styles.hero}>
              <Text style={styles.heroNum}>{pctText(overall)}</Text>
              <View style={styles.flex}>
                <Text style={styles.heroTitle}>of habit targets hit in {monthName(ym.m)}</Text>
                {prevPct != null && hasTicks && (
                  <Text style={styles.heroLine}>
                    {overall >= prevPct ? '▲' : '▼'} {Math.abs(Math.round((overall - prevPct) * 100))}% vs {monthName(prev.m)}
                  </Text>
                )}
                {best && <Text style={styles.heroLine}>best: {best.h.name} · {pctText(best.pct)}</Text>}
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.headRow}>
                <Text style={[styles.headText, styles.nameCol]}>Habit</Text>
                <View style={styles.pills}>
                  {Array.from({ length: weekCount }, (_, i) => (
                    <Text key={i} style={[styles.headText, styles.pillHead]}>W{i + 1}</Text>
                  ))}
                </View>
                <Text style={[styles.headText, styles.pctCol]}>{monthName(ym.m).slice(0, 3)}</Text>
              </View>
              {rows.map(({ h, weeks, pct }) => (
                <View key={h.id} style={styles.row}>
                  <View style={styles.nameCol}>
                    <Text style={styles.name} numberOfLines={1}>{h.name}</Text>
                    <Text style={styles.freq}>{isDaily(h) ? 'daily' : `${h.target}× a week`}</Text>
                  </View>
                  <View style={styles.pills}>
                    {weeks.map((w, i) => (
                      <View key={i} style={[styles.pill, w.fill == null && styles.pillFuture, w.current && styles.pillCurrent]}>
                        {w.fill != null && (
                          <View style={[styles.pillFill, { width: `${w.fill * 100}%` }, w.fill >= 1 && styles.pillFull]} />
                        )}
                      </View>
                    ))}
                  </View>
                  <Text style={styles.pct}>{pct == null ? '–' : pctText(pct)}</Text>
                </View>
              ))}
              <View style={styles.legend}>
                <Legend color={t.forest} label="target met" />
                <Legend color={t.sage} label="part of target" />
                <Legend outline label="this week (so far)" />
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const Legend = ({ color, outline, label }) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendSwatch, color ? { backgroundColor: color } : styles.legendOutline]} />
    <Text style={styles.legendText}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  flex: { flex: 1 },
  empty: { textAlign: 'center', marginTop: 40, color: 'rgba(16,47,21,0.5)', fontSize: 14 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 14, margin: 14, marginBottom: 4, backgroundColor: t.forest, borderRadius: 18, padding: 16 },
  heroNum: { fontSize: 36, fontWeight: '800', color: t.lime },
  heroTitle: { fontSize: 13, fontWeight: '700', color: '#fff' },
  heroLine: { fontSize: 12, color: t.lime, opacity: 0.9, marginTop: 2 },
  card: { margin: 14, marginTop: 10, backgroundColor: '#fff', borderRadius: 18, padding: 12 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 6 },
  headText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: 'rgba(16,47,21,0.55)' },
  nameCol: { width: 128 },
  pills: { flex: 1, flexDirection: 'row', gap: 4 },
  pillHead: { flex: 1, textAlign: 'center' },
  pctCol: { width: 40, textAlign: 'right' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderTopWidth: 1, borderColor: t.mint },
  name: { fontSize: 14, fontWeight: '600', color: t.forest },
  freq: { fontSize: 10, color: 'rgba(16,47,21,0.55)', marginTop: 1 },
  pill: { flex: 1, height: 18, borderRadius: 5, backgroundColor: t.mint, overflow: 'hidden' },
  pillFuture: { backgroundColor: 'transparent', borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(16,47,21,0.2)' },
  pillCurrent: { borderWidth: 1.5, borderColor: t.forest },
  pillFill: { height: '100%', backgroundColor: t.sage },
  pillFull: { backgroundColor: t.forest },
  pct: { width: 40, textAlign: 'right', fontSize: 13, fontWeight: '800', color: t.forest },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendSwatch: { width: 10, height: 10, borderRadius: 2 },
  legendOutline: { borderWidth: 1.5, borderColor: t.forest, backgroundColor: '#fff' },
  legendText: { fontSize: 11, color: 'rgba(16,47,21,0.7)' },
});
