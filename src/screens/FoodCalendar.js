import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/Header';
import { fromKey, monthCells, monthTitle, shiftMonth, todayKey, WEEKDAYS } from '../dates';
import { fmt } from '../numbers';
import { common, food as t, looks } from '../theme';

const MAX_LINES = 3;

// Month view of what was eaten each day, with that day's weight in green at the top-right.
export default function FoodCalendar({ entries, weights, focusKey, onOpenDay, onBack }) {
  const start = fromKey(focusKey);
  const [ym, setYm] = useState({ y: start.getFullYear(), m: start.getMonth() });
  const cells = monthCells(ym.y, ym.m);
  const today = todayKey();
  const insets = useSafeAreaInsets();

  const days = cells.filter((k) => k && entries[k]?.length);
  const allItems = days.flatMap((k) => entries[k]);
  const costs = allItems.map((it) => it.cost).filter((c) => c != null);
  const total = costs.reduce((a, b) => a + b, 0);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <View style={styles.screen}>
      <ScreenHeader
        look={looks.food}
        backLabel="‹ Log"
        onBack={onBack}
        title={monthTitle(ym.y, ym.m)}
        onPrev={() => setYm((v) => shiftMonth(v, -1))}
        onNext={() => setYm((v) => shiftMonth(v, 1))}
      />

      {/* flexGrow lets the pink summary fill whatever space the grid leaves. */}
      <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent}>
        <View style={styles.calendar}>
          <View style={styles.weekRow}>
            {WEEKDAYS.map((w) => (
              <Text key={w} style={styles.weekday}>{w}</Text>
            ))}
          </View>
          {weeks.map((week, wi) => (
            <View key={wi} style={styles.weekRow}>
              {week.map((key, ci) => {
                if (!key) return <View key={ci} style={[styles.cell, styles.blankCell]} />;
                const items = entries[key] || [];
                const extra = items.length - MAX_LINES;
                return (
                  <Pressable
                    key={key}
                    onPress={() => onOpenDay(key)}
                    style={[styles.cell, key === today && styles.todayCell]}
                  >
                    <View style={styles.cellTop}>
                      <Text style={styles.dayNum}>{fromKey(key).getDate()}</Text>
                      {weights[key] != null && <Text style={styles.weight}>{fmt(weights[key])}</Text>}
                    </View>
                    {items.slice(0, MAX_LINES).map((it, i) => (
                      <Text key={i} style={styles.item} numberOfLines={1}>{it.food}</Text>
                    ))}
                    {extra > 0 && <Text style={styles.more}>+{extra} more</Text>}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        <View style={[styles.summary, { paddingBottom: insets.bottom + 24 }]}>
          <Text style={styles.summaryBig}>
            {days.length} {days.length === 1 ? 'day' : 'days'} eating out
          </Text>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{allItems.length}</Text>
              <Text style={styles.statLabel}>{allItems.length === 1 ? 'item' : 'items'}</Text>
            </View>
            {costs.length > 0 && (
              <View style={styles.stat}>
                <Text style={styles.statNum}>{fmt(total)}</Text>
                <Text style={styles.statLabel}>spent</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: t.dark },
  scrollContent: { flexGrow: 1 },
  calendar: { backgroundColor: t.bg, paddingHorizontal: 4, paddingBottom: 8 },
  weekRow: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', fontSize: 11, color: common.muted, paddingVertical: 6 },
  cell: {
    flex: 1, minHeight: 86, padding: 3, margin: 1, borderRadius: 6,
    backgroundColor: t.cell, borderWidth: 1, borderColor: t.cellLine,
  },
  blankCell: { backgroundColor: 'transparent', borderColor: 'transparent' },
  todayCell: { backgroundColor: t.todayBg, borderColor: t.peachLine },
  cellTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 },
  dayNum: { fontSize: 12, fontWeight: '600', color: common.muted },
  weight: { fontSize: 10, fontWeight: '800', color: t.weight, letterSpacing: -0.2 },
  item: { fontSize: 10, color: t.text, lineHeight: 13 },
  more: { fontSize: 9, color: common.muted, marginTop: 1 },
  summary: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 24, backgroundColor: t.dark },
  summaryBig: { fontSize: 20, fontWeight: '700', color: '#fff' },
  stats: { flexDirection: 'row', gap: 10, marginTop: 12 },
  stat: { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '700', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.85)' },
});
