import { useEffect, useRef, useState } from 'react';
import {
  Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fmt, parseNum } from '../numbers';
import { workout as t } from '../theme';

const FIELDS = ['exercise', 'sets', 'kg', 'reps'];
const faint = 'rgba(0,29,79,0.32)';

let nextId = 0;
const row = (r = {}) => ({
  id: nextId++,
  exercise: r.exercise || '',
  sets: fmt(r.sets),
  kg: fmt(r.kg),
  reps: fmt(r.reps),
});
const rowsFor = (items) => [...items.map(row), row()];
const isEmpty = (r) => FIELDS.every((f) => !String(r[f]).trim());

// Exercise | Sets | kg | Reps. A row with no exercise name is more sets of the exercise above.
export default function WorkoutPage({ header, active, dateKey, items, onSave }) {
  const [rows, setRows] = useState(() => rowsFor(items));
  const [saved, setSaved] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const insets = useSafeAreaInsets();
  const inputs = useRef({});
  const focusKey = useRef(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const rs = rowsFor(items);
    if (activeRef.current) focusKey.current = `${rs[rs.length - 1].id}:exercise`;
    setRows(rs);
    setSaved(false);
  }, [dateKey]);

  useEffect(() => {
    if (focusKey.current == null) return;
    const key = focusKey.current;
    focusKey.current = null;
    requestAnimationFrame(() => inputs.current[key]?.focus());
  }, [rows]);

  const update = (id, field, value) => {
    setSaved(false);
    setRows((rs) => {
      const next = rs.map((r) => (r.id === id ? { ...r, [field]: value } : r));
      if (!isEmpty(next[next.length - 1])) next.push(row());
      return next;
    });
  };

  // Enter moves along the row: exercise → sets → kg → reps → next row's exercise.
  const onSubmit = (index, field) => {
    const r = rows[index];
    const fi = FIELDS.indexOf(field);
    if (fi < FIELDS.length - 1) return inputs.current[`${r.id}:${FIELDS[fi + 1]}`]?.focus();
    const nextRow = rows[index + 1];
    if (nextRow) return inputs.current[`${nextRow.id}:exercise`]?.focus();
    const nr = row();
    focusKey.current = `${nr.id}:exercise`;
    setRows((rs) => [...rs, nr]);
  };

  const save = async () => {
    const clean = rows
      .filter((r) => !isEmpty(r))
      .map((r) => ({ exercise: r.exercise.trim(), sets: parseNum(r.sets), kg: parseNum(r.kg), reps: parseNum(r.reps) }));
    Keyboard.dismiss();
    await onSave(dateKey, clean);
    setRows(rowsFor(clean));
    setSaved(true);
  };

  const input = (r, i, field, extra) => (
    <TextInput
      ref={(el) => { inputs.current[`${r.id}:${field}`] = el; }}
      value={r[field]}
      onChangeText={(v) => update(r.id, field, v)}
      onSubmitEditing={() => onSubmit(i, field)}
      submitBehavior="submit"
      returnKeyType="next"
      onFocus={() => setActiveId(r.id)}
      onBlur={() => setActiveId((a) => (a === r.id ? null : a))}
      cursorColor={t.blue}
      selectionColor={t.blue}
      placeholderTextColor={faint}
      {...extra}
    />
  );

  return (
    <View style={[styles.flex, { backgroundColor: t.bg }]}>
      {header}
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.cols}>
          <Text style={[styles.colHead, styles.flex, styles.left]}>Exercise</Text>
          <Text style={[styles.colHead, styles.num]}>Sets</Text>
          <Text style={[styles.colHead, styles.kg]}>kg</Text>
          <Text style={[styles.colHead, styles.num]}>Reps</Text>
        </View>

        <ScrollView style={styles.flex} keyboardShouldPersistTaps="handled">
          {rows.map((r, i) => {
            const cont = i > 0 && !r.exercise.trim() && !isEmpty(r);
            const last = i === rows.length - 1;
            return (
              <View key={r.id} style={[styles.row, cont && styles.contRow, r.id === activeId && styles.activeRow]}>
                {input(r, i, 'exercise', {
                  style: [styles.exercise, styles.flex, cont && styles.contText],
                  placeholder: cont ? '↳ same exercise' : last ? 'Add exercise…' : '',
                  autoCapitalize: 'sentences',
                })}
                {input(r, i, 'sets', { style: [styles.cell, styles.num], keyboardType: 'number-pad', placeholder: '–' })}
                {input(r, i, 'kg', { style: [styles.cell, styles.kg], keyboardType: 'decimal-pad', placeholder: '–' })}
                {input(r, i, 'reps', { style: [styles.cell, styles.num], keyboardType: 'number-pad', placeholder: '–' })}
              </View>
            );
          })}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 18 }]}>
          <Text style={styles.savedMsg}>{saved ? 'Saved' : ''}</Text>
          <Pressable testID="save" onPress={save} style={({ pressed }) => [styles.tick, pressed && { opacity: 0.7 }]}>
            <Text style={styles.tickText}>✓</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  cols: { flexDirection: 'row', gap: 6, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6 },
  colHead: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: 'rgba(0,29,79,0.55)', textAlign: 'center' },
  left: { textAlign: 'left' },
  num: { width: 50, textAlign: 'center' },
  kg: { width: 62, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, borderTopWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,29,79,0.12)', borderWidth: 0 },
  contRow: { borderTopWidth: 0 },
  // Margin + padding add up to the normal 18 so text doesn't shift when a row becomes active.
  activeRow: { backgroundColor: '#fff', borderRadius: 12, marginHorizontal: 8, paddingHorizontal: 9, borderWidth: 1.5, borderTopWidth: 1.5, borderColor: t.cyan },
  exercise: { fontSize: 16, color: t.navy, paddingVertical: 13, minWidth: 0, outlineWidth: 0 },
  contText: { fontSize: 14, paddingLeft: 12 },
  cell: { fontSize: 16, fontWeight: '600', color: t.navy, paddingVertical: 13, outlineWidth: 0 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 14, paddingHorizontal: 20, paddingTop: 16 },
  savedMsg: { fontSize: 15, color: 'rgba(0,29,79,0.55)' },
  tick: { width: 64, height: 64, borderRadius: 32, backgroundColor: t.amber, alignItems: 'center', justifyContent: 'center' },
  tickText: { fontSize: 30, color: t.navy, fontWeight: '800' },
});
