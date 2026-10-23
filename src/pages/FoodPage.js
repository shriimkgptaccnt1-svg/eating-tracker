import { useEffect, useRef, useState } from 'react';
import {
  Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fmt, parseNum } from '../numbers';
import { common, food as t } from '../theme';

let nextId = 0;
const row = (name = '', cost = '') => ({ id: nextId++, food: name, cost });

function rowsFor(items) {
  return [...items.map((it) => row(it.food, it.cost == null ? '' : String(it.cost))), row()];
}

export default function FoodPage({ header, active, dateKey, items, weight, onSave, onSaveWeight }) {
  const [rows, setRows] = useState(() => rowsFor(items));
  const [weightText, setWeightText] = useState(fmt(weight));
  const [saved, setSaved] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [weightFocused, setWeightFocused] = useState(false);
  const insets = useSafeAreaInsets();
  const inputs = useRef({});
  const focusId = useRef(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  // Switching days loads that day's list fresh, cursor ready on the empty row
  // (only when this tab is on screen, so the keyboard doesn't pop up on another tab).
  useEffect(() => {
    const rs = rowsFor(items);
    if (activeRef.current) focusId.current = rs[rs.length - 1].id;
    setRows(rs);
    setWeightText(fmt(weight));
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

  const saveWeight = () => onSaveWeight(dateKey, parseNum(weightText));

  const save = async () => {
    const clean = rows
      .filter((r) => r.food.trim())
      .map((r) => ({ food: r.food.trim(), cost: parseNum(r.cost) }));
    Keyboard.dismiss();
    await Promise.all([onSave(dateKey, clean), saveWeight()]);
    setRows(rowsFor(clean));
    setSaved(true);
  };

  const lastIndex = rows.length - 1;
  const focusProps = (id) => ({
    onFocus: () => setActiveId(id),
    onBlur: () => setActiveId((a) => (a === id ? null : a)),
    cursorColor: t.accent,
    selectionColor: t.accent,
  });

  return (
    <View style={[styles.flex, { backgroundColor: t.bg }]}>
      {header}
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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
                onChangeText={(v) => update(r.id, 'food', v)}
                onSubmitEditing={() => onSubmitFood(i)}
                submitBehavior="submit"
                returnKeyType="next"
                placeholder={i === lastIndex ? 'Add food…' : ''}
                placeholderTextColor={common.faint}
                autoCapitalize="sentences"
                {...focusProps(r.id)}
              />
              <TextInput
                style={styles.cost}
                value={r.cost}
                onChangeText={(v) => update(r.id, 'cost', v)}
                keyboardType="decimal-pad"
                placeholder="optional"
                placeholderTextColor={common.faint}
                {...focusProps(r.id)}
              />
            </View>
          ))}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 18 }]}>
          <Pressable
            onPress={() => inputs.current.weight?.focus()}
            style={[styles.weightBox, weightFocused && styles.weightBoxOn]}
          >
            <Text style={styles.weightLabel}>Weight</Text>
            <View style={styles.weightLine}>
              <TextInput
                ref={(el) => { inputs.current.weight = el; }}
                style={[styles.weightInput, !weightText && !weightFocused && styles.weightEmpty]}
                value={weightText}
                onChangeText={(v) => { setWeightText(v); setSaved(false); }}
                onFocus={() => setWeightFocused(true)}
                onBlur={() => { setWeightFocused(false); saveWeight(); }}
                keyboardType="decimal-pad"
                placeholder={weightFocused ? '' : '+ Add'}
                placeholderTextColor={t.accent}
                cursorColor={t.accent}
                selectionColor={t.accent}
              />
              {(!!weightText || weightFocused) && <Text style={styles.kg}>kg</Text>}
            </View>
          </Pressable>
          <View style={styles.flex} />
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
  colHeads: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: common.line },
  colHead: { fontSize: 12, color: common.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: common.line },
  // Margin + padding add up to the normal 20 so text doesn't shift when a row becomes active.
  activeRow: { backgroundColor: t.activeRow, borderRadius: 12, marginHorizontal: 10, paddingHorizontal: 10, borderColor: 'transparent' },
  food: { fontSize: 18, color: t.text, paddingVertical: 14, minWidth: 0, outlineWidth: 0 },
  costCol: { width: 80, textAlign: 'right' },
  cost: { width: 80, fontSize: 16, color: common.muted, textAlign: 'right', paddingVertical: 14, outlineWidth: 0 },
  footer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, gap: 14 },
  weightBox: { minWidth: 112, borderRadius: 16, backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: t.softLine },
  weightBoxOn: { minWidth: 160, borderWidth: 2, borderColor: t.accent },
  weightLabel: { fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase', color: common.muted },
  weightLine: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  weightInput: { fontSize: 20, fontWeight: '700', color: t.weight, padding: 0, width: 58, outlineWidth: 0 },
  weightEmpty: { fontSize: 16 },
  kg: { fontSize: 13, fontWeight: '600', color: common.muted },
  savedMsg: { fontSize: 15, color: common.muted },
  tick: { width: 64, height: 64, borderRadius: 32, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' },
  tickText: { fontSize: 30, color: '#fff', fontWeight: '700' },
});
