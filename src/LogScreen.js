import { useEffect, useRef, useState } from 'react';
import {
  Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addDays, prettyDate, todayKey } from './dates';
import { colors } from './theme';

let nextId = 0;
const row = (food = '', cost = '') => ({ id: nextId++, food, cost });

function rowsFor(items) {
  return [...items.map((it) => row(it.food, it.cost == null ? '' : String(it.cost))), row()];
}

export default function LogScreen({ dateKey, items, onChangeDate, onSave, onOpenDashboard }) {
  const [rows, setRows] = useState(() => rowsFor(items));
  const [saved, setSaved] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const insets = useSafeAreaInsets();
  const inputs = useRef({});
  const focusId = useRef(null);

  // Switching days loads that day's list fresh, cursor ready on the empty row.
  useEffect(() => {
    const rs = rowsFor(items);
    focusId.current = rs[rs.length - 1].id;
    setRows(rs);
    setSaved(false);
  }, [dateKey]);

  // Focus a row that was just added (after it has rendered).
  useEffect(() => {
    if (focusId.current == null) return;
    const id = focusId.current;
    focusId.current = null;
    requestAnimationFrame(() => inputs.current[id]?.focus());
  }, [rows]);

  const update = (id, field, value) => {
    setSaved(false);
    setRows((rs) => {
      const next = rs.map((r) => (r.id === id ? { ...r, [field]: value } : r));
      // Always keep one empty row at the bottom to type into.
      const last = next[next.length - 1];
      if (last.food.trim() || last.cost.trim()) next.push(row());
      return next;
    });
  };

  const onSubmitFood = (index) => {
    const nextRow = rows[index + 1];
    if (nextRow) inputs.current[nextRow.id]?.focus();
    else {
      const r = row();
      focusId.current = r.id;
      setRows((rs) => [...rs, r]);
    }
  };

  const save = async () => {
    const clean = rows
      .filter((r) => r.food.trim())
      .map((r) => {
        const cost = parseFloat(r.cost.replace(',', '.'));
        return { food: r.food.trim(), cost: Number.isFinite(cost) ? cost : null };
      });
    Keyboard.dismiss();
    await onSave(dateKey, clean);
    setRows(rowsFor(clean));
    setSaved(true);
  };

  const isToday = dateKey === todayKey();
  const lastIndex = rows.length - 1;

  return (
    <LinearGradient colors={colors.logGradient} style={styles.flex}>
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Pressable hitSlop={12} onPress={() => onChangeDate(addDays(dateKey, -1))}>
          <Text style={styles.arrow}>‹</Text>
        </Pressable>
        <Pressable onPress={() => onChangeDate(todayKey())} style={styles.dateBox}>
          <Text style={styles.date}>{prettyDate(dateKey)}</Text>
          {!isToday && <Text style={styles.backToday}>tap for today</Text>}
        </Pressable>
        <Pressable hitSlop={12} onPress={() => onChangeDate(addDays(dateKey, 1))}>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
        <View style={styles.flex} />
        <Pressable hitSlop={12} onPress={onOpenDashboard}>
          <Text style={styles.link}>Calendar</Text>
        </Pressable>
      </View>

      <View style={styles.colHeads}>
        <Text style={[styles.colHead, styles.flex]}>What I ate</Text>
        <Text style={[styles.colHead, styles.costCol]}>Cost</Text>
      </View>

      <ScrollView style={styles.flex} keyboardShouldPersistTaps="handled">
        {rows.map((r, i) => (
          <View key={r.id} style={[styles.row, r.id === activeId && styles.activeRow]}>
            <TextInput
              ref={(el) => { inputs.current[r.id] = el; }}
              style={[styles.food, styles.flex]}
              value={r.food}
              onChangeText={(t) => update(r.id, 'food', t)}
              onSubmitEditing={() => onSubmitFood(i)}
              onFocus={() => setActiveId(r.id)}
              onBlur={() => setActiveId((a) => (a === r.id ? null : a))}
              cursorColor={colors.cursor}
              selectionColor={colors.cursor}
              submitBehavior="submit"
              returnKeyType="next"
              placeholder={i === lastIndex ? 'Add food…' : ''}
              placeholderTextColor={colors.faint}
              autoCapitalize="sentences"
            />
            <TextInput
              style={styles.cost}
              value={r.cost}
              onChangeText={(t) => update(r.id, 'cost', t)}
              keyboardType="decimal-pad"
              onFocus={() => setActiveId(r.id)}
              onBlur={() => setActiveId((a) => (a === r.id ? null : a))}
              cursorColor={colors.cursor}
              selectionColor={colors.cursor}
              placeholder="optional"
              placeholderTextColor={colors.faint}
            />
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <Text style={styles.savedMsg}>{saved ? 'Saved' : ''}</Text>
        <Pressable
          onPress={save}
          style={({ pressed }) => [styles.tick, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.tickText}>✓</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, gap: 14, backgroundColor: colors.dateBar },
  arrow: { fontSize: 30, color: 'rgba(255,255,255,0.75)', lineHeight: 32 },
  dateBox: { alignItems: 'center' },
  date: { fontSize: 20, fontWeight: '700', color: '#fff' },
  backToday: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 1 },
  link: { fontSize: 16, color: '#fff', fontWeight: '600' },
  colHeads: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.line },
  colHead: { fontSize: 12, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.line },
  // Margin + padding add up to the normal 20 so text doesn't shift when a row becomes active.
  activeRow: { backgroundColor: colors.activeRow, borderRadius: 12, marginHorizontal: 10, paddingHorizontal: 10, borderColor: 'transparent' },
  food: { fontSize: 18, color: colors.text, paddingVertical: 14, minWidth: 0, outlineWidth: 0 },
  costCol: { width: 80, textAlign: 'right' },
  cost: { width: 80, fontSize: 16, color: colors.muted, textAlign: 'right', paddingVertical: 14, outlineWidth: 0 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 20, paddingTop: 20, gap: 14 },
  savedMsg: { fontSize: 15, color: colors.muted },
  tick: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.tick, alignItems: 'center', justifyContent: 'center' },
  tickText: { fontSize: 30, color: '#fff', fontWeight: '700' },
});
