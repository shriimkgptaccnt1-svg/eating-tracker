import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { doneOn, isDaily, weekCount } from '../habits';
import { habit as t } from '../theme';

// Tap a habit to tick it for the shown date; it saves straight away.
export default function HabitsPage({ header, dateKey, habits, log, onToggle, onEdit }) {
  const insets = useSafeAreaInsets();
  const list = habits.filter((h) => !h.archived);
  const doneCount = list.filter((h) => doneOn(log, dateKey, h.id)).length;
  const groups = [
    ['Daily', list.filter(isDaily)],
    ['Weekly', list.filter((h) => !isDaily(h))],
  ].filter(([, hs]) => hs.length);

  return (
    <View style={[styles.flex, { backgroundColor: t.bg }]}>
      {header}
      <View style={styles.progress}>
        <Text style={styles.progressText}>{doneCount} of {list.length} today</Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${list.length ? (doneCount / list.length) * 100 : 0}%` }]} />
        </View>
        <Pressable onPress={onEdit} style={({ pressed }) => [styles.edit, pressed && { opacity: 0.7 }]}>
          <Text style={styles.editText}>✎ Edit</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        {groups.map(([title, hs]) => (
          <View key={title}>
            <Text style={styles.section}>{title}</Text>
            {hs.map((h) => {
              const done = doneOn(log, dateKey, h.id);
              const count = isDaily(h) ? null : weekCount(log, dateKey, h.id);
              const met = count != null && count >= h.target;
              return (
                <Pressable
                  key={h.id}
                  onPress={() => onToggle(dateKey, h.id)}
                  style={({ pressed }) => [styles.row, done ? styles.rowDone : met && styles.rowMet, pressed && { opacity: 0.85 }]}
                >
                  <Text style={[styles.name, done && styles.nameDone]} numberOfLines={2}>{h.name}</Text>
                  {count != null && (
                    <Text style={[styles.meta, done && styles.nameDone]}>
                      {met ? 'done this week ✓' : `${count}/${h.target} this week`}
                    </Text>
                  )}
                  <View style={[styles.check, done && styles.checkDone]}>
                    {done && <Text style={styles.checkMark}>✓</Text>}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
        {!list.length && <Text style={styles.empty}>No habits yet. Tap ✎ Edit to add some.</Text>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  progress: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 4 },
  progressText: { fontSize: 14, fontWeight: '700', color: t.forest },
  track: { flex: 1, height: 9, borderRadius: 5, backgroundColor: 'rgba(16,47,21,0.12)', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5, backgroundColor: t.sage },
  edit: { backgroundColor: t.forest, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 999 },
  editText: { color: t.lime, fontSize: 13, fontWeight: '700' },
  section: { fontSize: 11, letterSpacing: 0.7, textTransform: 'uppercase', fontWeight: '600', color: 'rgba(16,47,21,0.55)', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 14, marginVertical: 4, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16, backgroundColor: '#fff' },
  rowDone: { backgroundColor: t.forest },
  rowMet: { backgroundColor: t.lime },
  name: { flex: 1, fontSize: 16, fontWeight: '600', color: t.forest },
  nameDone: { color: t.lime },
  meta: { fontSize: 12, fontWeight: '600', color: 'rgba(16,47,21,0.65)' },
  check: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: t.sage, alignItems: 'center', justifyContent: 'center' },
  checkDone: { backgroundColor: t.sage },
  checkMark: { color: t.lime, fontSize: 15, fontWeight: '800' },
  empty: { textAlign: 'center', marginTop: 40, color: 'rgba(16,47,21,0.5)', fontSize: 14 },
});
