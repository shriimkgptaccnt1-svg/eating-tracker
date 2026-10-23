import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fromKey, monthCells, monthTitle, todayKey, WEEKDAYS } from './dates';
import { colors } from './theme';

const MAX_LINES = 3;

export default function DashboardScreen({ entries, focusKey, onOpenDay, onBack }) {
  const start = fromKey(focusKey);
  const [ym, setYm] = useState({ y: start.getFullYear(), m: start.getMonth() });
  const cells = monthCells(ym.y, ym.m);
  const today = todayKey();
  const insets = useSafeAreaInsets();

  const shift = (n) => setYm(({ y, m }) => {
    const d = new Date(y, m + n, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  // Month summary
  const days = cells.filter((k) => k && entries[k]?.length);
  const allItems = days.flatMap((k) => entries[k]);
  const costs = allItems.map((it) => it.cost).filter((c) => c != null);
  const total = costs.reduce((a, b) => a + b, 0);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={colors.monthGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: insets.top + 14 }]}
      >
        <Pressable hitSlop={12} onPress={onBack}>
          <Text style={styles.link}>‹ Log</Text>
        </Pressable>
        <View style={styles.monthNav}>
          <Pressable hitSlop={12} onPress={() => shift(-1)}>
            <Text style={styles.arrow}>‹</Text>
          </Pressable>
          <Text style={styles.month}>{monthTitle(ym.y, ym.m)}</Text>
          <Pressable hitSlop={12} onPress={() => shift(1)}>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
        </View>
        <View style={styles.headerSpacer} />
      </LinearGradient>

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
                    <Text style={styles.dayNum}>{fromKey(key).getDate()}</Text>
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
                <Text style={styles.statNum}>{formatCost(total)}</Text>
                <Text style={styles.statLabel}>spent</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const formatCost = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(2));

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.summaryBg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16 },
  link: { fontSize: 16, color: colors.monthInk, fontWeight: '600', width: 60 },
  headerSpacer: { width: 60 },
  monthNav: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  arrow: { fontSize: 28, color: colors.monthInk, lineHeight: 30 },
  month: { fontSize: 19, fontWeight: '700', color: colors.monthInk },
  scrollContent: { flexGrow: 1 },
  calendar: { backgroundColor: colors.calendarBg, paddingHorizontal: 4, paddingBottom: 8 },
  weekRow: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', fontSize: 11, color: colors.muted, paddingVertical: 6 },
  cell: {
    flex: 1, minHeight: 86, padding: 3, margin: 1, borderRadius: 6,
    backgroundColor: colors.cell, borderWidth: 1, borderColor: colors.cellLine,
  },
  blankCell: { backgroundColor: 'transparent', borderColor: 'transparent' },
  todayCell: { backgroundColor: colors.todayBg, borderColor: colors.todayLine },
  dayNum: { fontSize: 12, fontWeight: '600', color: colors.muted, marginBottom: 2 },
  item: { fontSize: 10, color: colors.text, lineHeight: 13 },
  more: { fontSize: 9, color: colors.muted, marginTop: 1 },
  summary: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 24, backgroundColor: colors.summaryBg },
  summaryBig: { fontSize: 20, fontWeight: '700', color: '#fff' },
  stats: { flexDirection: 'row', gap: 10, marginTop: 12 },
  stat: { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '700', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.85)' },
});
