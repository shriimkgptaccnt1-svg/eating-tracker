import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addDays, shortDate, todayKey } from '../dates';

export const TABS = ['Food', 'Habits', 'Workout'];

// The gradient bar on top of each tab: date with ‹ ›, that tab's icons, and the tab switch.
// `look` = { gradient, ink, iconInk, iconBg, track, tabInk, tabOnInk, underline }
export default function Header({ look, dateKey, onChangeDate, icons, active, onTab, habitCount }) {
  const insets = useSafeAreaInsets();
  const isToday = dateKey === todayKey();
  return (
    <View>
      <LinearGradient
        colors={look.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ paddingTop: insets.top + 10 }}
      >
        <View style={styles.bar}>
          <Pressable hitSlop={12} onPress={() => onChangeDate(addDays(dateKey, -1))}>
            <Text style={[styles.arrow, { color: look.ink }]}>‹</Text>
          </Pressable>
          <Pressable onPress={() => onChangeDate(todayKey())} style={styles.dateBox}>
            <Text style={[styles.date, { color: look.ink }]}>{shortDate(dateKey)}</Text>
            {!isToday && <Text style={[styles.backToday, { color: look.ink }]}>tap for today</Text>}
          </Pressable>
          <Pressable hitSlop={12} onPress={() => onChangeDate(addDays(dateKey, 1))}>
            <Text style={[styles.arrow, { color: look.ink }]}>›</Text>
          </Pressable>
          <View style={styles.icons}>
            {icons.map(({ Icon, onPress }, i) => (
              <Pressable
                key={i}
                onPress={onPress}
                style={({ pressed }) => [styles.icon, { backgroundColor: look.iconBg }, pressed && styles.pressed]}
              >
                <Icon color={look.iconInk || look.ink} />
              </Pressable>
            ))}
          </View>
        </View>
        <View style={[styles.tabs, { backgroundColor: look.track }]}>
          {TABS.map((name, i) => {
            const on = i === active;
            return (
              <Pressable key={name} onPress={() => onTab(i)} style={[styles.tab, on && styles.tabOn]}>
                <Text style={[styles.tabText, { color: on ? look.tabOnInk : look.tabInk }]}>
                  {name}
                  {name === 'Habits' && habitCount ? <Text style={styles.count}>  {habitCount}</Text> : null}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </LinearGradient>
      {look.underline && <View style={{ height: 3, backgroundColor: look.underline }} />}
    </View>
  );
}

// Plain top bar for the dashboards: back link, title, optional month arrows.
export function ScreenHeader({ look, title, onBack, backLabel = '‹ Back', onPrev, onNext, right }) {
  const insets = useSafeAreaInsets();
  return (
    <View>
      <LinearGradient
        colors={look.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.screenBar, { paddingTop: insets.top + 14 }]}
      >
        <Pressable hitSlop={12} onPress={onBack} style={styles.side}>
          <Text style={[styles.back, { color: look.ink }]}>{backLabel}</Text>
        </Pressable>
        <View style={styles.titleRow}>
          {onPrev && (
            <Pressable hitSlop={12} onPress={onPrev}>
              <Text style={[styles.arrow, { color: look.ink }]}>‹</Text>
            </Pressable>
          )}
          <Text style={[styles.title, { color: look.ink }]}>{title}</Text>
          {onNext && (
            <Pressable hitSlop={12} onPress={onNext}>
              <Text style={[styles.arrow, { color: look.ink }]}>›</Text>
            </Pressable>
          )}
        </View>
        <View style={[styles.side, styles.right]}>{right}</View>
      </LinearGradient>
      {look.underline && <View style={{ height: 3, backgroundColor: look.underline }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 12 },
  arrow: { fontSize: 28, lineHeight: 30, opacity: 0.8 },
  dateBox: { alignItems: 'center' },
  date: { fontSize: 19, fontWeight: '700' },
  backToday: { fontSize: 10, opacity: 0.75, marginTop: 1 },
  icons: { flexDirection: 'row', gap: 8, marginLeft: 'auto' },
  icon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
  tabs: { flexDirection: 'row', gap: 3, marginHorizontal: 14, marginBottom: 12, padding: 3, borderRadius: 12 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 9 },
  tabOn: { backgroundColor: '#fff' },
  tabText: { fontSize: 14, fontWeight: '700' },
  count: { fontSize: 12, fontWeight: '600', opacity: 0.65 },
  screenBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 14 },
  side: { width: 70 },
  right: { alignItems: 'flex-end' },
  back: { fontSize: 15, fontWeight: '600' },
  titleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14 },
  title: { fontSize: 18, fontWeight: '700' },
});
