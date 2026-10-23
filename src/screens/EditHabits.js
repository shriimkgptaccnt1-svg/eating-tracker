import { useRef, useState } from 'react';
import {
  Alert, Animated, KeyboardAvoidingView, Modal, PanResponder, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/Header';
import { isDaily, newHabitId, targetLabel } from '../habits';
import { common, habit as t, looks } from '../theme';

const ROW_H = 62; // row height + vertical margins, used for drag-to-reorder

// Add, rename, change target, delete (−) and drag (≡) to reorder.
export default function EditHabits({ habits, onChange, onBack }) {
  const insets = useSafeAreaInsets();
  const [sheet, setSheet] = useState(null); // null | { habit? } – habit missing = adding
  const [drag, setDrag] = useState(null); // { from, over }
  const dy = useRef(new Animated.Value(0)).current;
  const list = habits.filter((h) => !h.archived);

  const confirmDelete = (h) => Alert.alert(
    `Delete “${h.name}”?`,
    'It disappears from your list. Past ticks are kept, so old months still show it.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onChange(habits.map((x) => (x.id === h.id ? { ...x, archived: true } : x))) },
    ],
  );

  const saveSheet = ({ name, target }) => {
    const existing = sheet.habit;
    onChange(existing
      ? habits.map((x) => (x.id === existing.id ? { ...x, name, target } : x))
      : [...habits, { id: newHabitId(), name, target, archived: false }]);
    setSheet(null);
  };

  const dragRef = useRef(null);
  const setDragState = (v) => { dragRef.current = v; setDrag(v); };
  const dragHandlers = {
    start: (from) => { dy.setValue(0); setDragState({ from, over: from }); },
    move: (from, d) => {
      dy.setValue(d);
      const over = Math.max(0, Math.min(list.length - 1, from + Math.round(d / ROW_H)));
      if (dragRef.current && dragRef.current.over !== over) setDragState({ ...dragRef.current, over });
    },
    end: () => {
      const s = dragRef.current;
      setDragState(null);
      dy.setValue(0);
      if (s && s.from !== s.over) {
        const moved = [...list];
        const [h] = moved.splice(s.from, 1);
        moved.splice(s.over, 0, h);
        onChange([...moved, ...habits.filter((x) => x.archived)]);
      }
    },
  };

  // While dragging, rows between the start and the hover position slide out of the way.
  const shiftFor = (i) => {
    if (!drag || i === drag.from) return 0;
    if (drag.from < drag.over && i > drag.from && i <= drag.over) return -ROW_H;
    if (drag.from > drag.over && i >= drag.over && i < drag.from) return ROW_H;
    return 0;
  };

  return (
    <View style={[styles.flex, { backgroundColor: t.bg }]}>
      <ScreenHeader look={looks.habit} title="Edit habits" onBack={onBack} right={<Text style={styles.done} onPress={onBack}>Done</Text>} />
      <ScrollView scrollEnabled={!drag} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <Text style={styles.tip}>Drag ≡ to reorder · tap a habit to rename it or change its target</Text>
        {list.map((h, i) => (
          <HabitRow
            key={h.id}
            habit={h}
            index={i}
            dragging={drag?.from === i}
            dy={dy}
            shift={shiftFor(i)}
            handlers={dragHandlers}
            onEdit={() => setSheet({ habit: h })}
            onDelete={() => confirmDelete(h)}
          />
        ))}
        <Pressable onPress={() => setSheet({})} style={({ pressed }) => [styles.add, pressed && { opacity: 0.7 }]}>
          <Text style={styles.addText}>+ Add habit</Text>
        </Pressable>
      </ScrollView>
      {sheet && <HabitSheet habit={sheet.habit} onSave={saveSheet} onClose={() => setSheet(null)} />}
    </View>
  );
}

function HabitRow({ habit, index, dragging, dy, shift, handlers, onEdit, onDelete }) {
  // Keep the latest index/handlers for the responder, which is created once.
  const live = useRef({});
  live.current = { index, handlers };
  const responder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => live.current.handlers.start(live.current.index),
    onPanResponderMove: (_, g) => live.current.handlers.move(live.current.index, g.dy),
    onPanResponderRelease: () => live.current.handlers.end(),
    onPanResponderTerminate: () => live.current.handlers.end(),
  })).current;

  const transform = [{ translateY: dragging ? dy : shift }];
  return (
    <Animated.View style={[styles.row, { transform }, dragging && styles.rowDragging]}>
      <Pressable hitSlop={8} onPress={onDelete} style={styles.del}>
        <Text style={styles.delText}>−</Text>
      </Pressable>
      <Pressable onPress={onEdit} style={styles.rowMain}>
        <Text style={styles.name} numberOfLines={1}>{habit.name}</Text>
        <View style={styles.target}><Text style={styles.targetText}>{targetLabel(habit)}</Text></View>
      </Pressable>
      <View {...responder.panHandlers} hitSlop={10} style={styles.grip}>
        <Text style={styles.gripText}>≡</Text>
      </View>
    </Animated.View>
  );
}

// Bottom panel for adding or editing a habit: a name, plus "Every day" or "N days a week".
function HabitSheet({ habit, onSave, onClose }) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(habit?.name || '');
  const [daily, setDaily] = useState(habit ? isDaily(habit) : true);
  const [perWeek, setPerWeek] = useState(habit && !isDaily(habit) ? habit.target : 3);
  const canSave = name.trim().length > 0;

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.dim} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.grab} />
          <Text style={styles.sheetTitle}>{habit ? 'Edit habit' : 'New habit'}</Text>
          <TextInput
            style={styles.field}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Drink 3L water"
            placeholderTextColor={common.faint}
            autoFocus={!habit}
            cursorColor={t.forest}
            selectionColor={t.sage}
          />
          <Text style={styles.label}>How often</Text>
          <View style={styles.seg}>
            {[['Every day', true], ['Days a week', false]].map(([l, v]) => (
              <Pressable key={l} onPress={() => setDaily(v)} style={[styles.segItem, daily === v && styles.segOn]}>
                <Text style={[styles.segText, daily === v && styles.segTextOn]}>{l}</Text>
              </Pressable>
            ))}
          </View>
          {!daily && (
            <View style={styles.stepper}>
              <Pressable hitSlop={8} onPress={() => setPerWeek((n) => Math.max(1, n - 1))} style={styles.pm}><Text style={styles.pmText}>−</Text></Pressable>
              <Text style={styles.stepNum}>{perWeek}</Text>
              <Pressable hitSlop={8} onPress={() => setPerWeek((n) => Math.min(6, n + 1))} style={styles.pm}><Text style={styles.pmText}>+</Text></Pressable>
              <Text style={styles.stepLabel}>{perWeek === 1 ? 'day a week' : 'days a week'}</Text>
            </View>
          )}
          <Pressable
            disabled={!canSave}
            onPress={() => onSave({ name: name.trim(), target: daily ? 7 : perWeek })}
            style={({ pressed }) => [styles.btn, !canSave && { opacity: 0.4 }, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.btnText}>{habit ? 'Save' : 'Add habit'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  done: { fontSize: 15, fontWeight: '700', color: t.lime },
  tip: { fontSize: 12, color: 'rgba(16,47,21,0.6)', paddingHorizontal: 18, paddingTop: 12, paddingBottom: 6 },
  row: { height: ROW_H - 8, marginVertical: 4, marginHorizontal: 14, borderRadius: 14, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 10 },
  rowDragging: { zIndex: 10, elevation: 6, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  del: { width: 24, height: 24, borderRadius: 12, backgroundColor: common.danger, alignItems: 'center', justifyContent: 'center' },
  delText: { color: '#fff', fontSize: 18, fontWeight: '800', lineHeight: 20 },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'stretch' },
  name: { flex: 1, fontSize: 15, fontWeight: '600', color: t.forest },
  target: { backgroundColor: t.lime, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  targetText: { fontSize: 12, fontWeight: '700', color: t.forest },
  grip: { paddingHorizontal: 6, alignSelf: 'stretch', justifyContent: 'center' },
  gripText: { fontSize: 20, color: 'rgba(16,47,21,0.35)' },
  add: { marginHorizontal: 14, marginTop: 10, paddingVertical: 14, borderRadius: 14, borderWidth: 2, borderStyle: 'dashed', borderColor: t.sage, alignItems: 'center' },
  addText: { fontSize: 15, fontWeight: '700', color: t.sage },
  dim: { flex: 1, backgroundColor: 'rgba(16,47,21,0.45)' },
  sheet: { backgroundColor: t.mint, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 20, paddingTop: 12 },
  grab: { width: 38, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.18)', alignSelf: 'center', marginBottom: 12 },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: t.forest, textAlign: 'center', marginBottom: 14 },
  field: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 2, borderColor: t.sage, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, fontWeight: '600', color: t.forest, outlineWidth: 0 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: 'rgba(16,47,21,0.6)', marginTop: 16, marginBottom: 8 },
  seg: { flexDirection: 'row', gap: 8 },
  segItem: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 10, backgroundColor: '#fff' },
  segOn: { backgroundColor: t.forest },
  segText: { fontSize: 14, fontWeight: '700', color: t.forest },
  segTextOn: { color: t.lime },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, marginTop: 14 },
  pm: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  pmText: { fontSize: 24, color: t.sage, fontWeight: '600' },
  stepNum: { fontSize: 32, fontWeight: '800', color: t.forest, minWidth: 24, textAlign: 'center' },
  stepLabel: { fontSize: 15, fontWeight: '600', color: 'rgba(16,47,21,0.6)' },
  btn: { marginTop: 20, backgroundColor: t.forest, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  btnText: { color: t.lime, fontSize: 16, fontWeight: '700' },
});
