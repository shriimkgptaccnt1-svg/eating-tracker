import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/Header';
import { addDays, dayMonth, fromKey, todayKey } from '../dates';
import { fmt } from '../numbers';
import { food as t, looks } from '../theme';

const RANGES = [['1M', 30], ['3M', 91], ['6M', 182], ['1Y', 365], ['All', null]];
const DAY_MS = 86400000;
const axisInk = '#8A6A74';

// Line chart of weight over time, with the days you ate out marked along the bottom.
export default function WeightGraph({ weights, entries, onBack }) {
  const [range, setRange] = useState('1M');
  const [selected, setSelected] = useState(null);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const today = todayKey();
  const allKeys = Object.keys(weights).sort();
  const days = RANGES.find(([r]) => r === range)[1];
  const startKey = days ? addDays(today, -(days - 1)) : allKeys[0] || today;
  const keys = allKeys.filter((k) => k >= startKey && k <= today);
  const values = keys.map((k) => weights[k]);

  const latest = values[values.length - 1];
  const change = values.length > 1 ? latest - values[0] : null;
  const ateOut = Object.keys(entries).filter((k) => k >= startKey && k <= today && entries[k].length);

  // Chart geometry
  const W = width - 24 - 12;
  const H = 210;
  const L = 34, R = 10, T = 16, B = 36;
  const pw = W - L - R, ph = H - T - B;
  // Round the axis to a tidy step (0.5, 1, 2 or 5 kg) so tick labels are whole-ish numbers.
  const vmin = values.length ? Math.min(...values) : 0;
  const vmax = values.length ? Math.max(...values) : 1;
  const step = [0.5, 1, 2, 5].find((st) => (vmax - vmin) / st <= 4) || 10;
  const lo = Math.floor(vmin / step) * step;
  const hi = Math.max(Math.ceil(vmax / step) * step, lo + step);
  const t0 = fromKey(startKey).getTime();
  const span = Math.max(1, (fromKey(today).getTime() - t0) / DAY_MS);
  const x = (k) => L + ((fromKey(k).getTime() - t0) / DAY_MS / span) * pw;
  const y = (v) => T + ((hi - v) / (hi - lo)) * ph;
  const ticks = Array.from({ length: Math.round((hi - lo) / step) + 1 }, (_, i) => lo + i * step);
  const xLabels = Array.from({ length: 5 }, (_, i) => addDays(startKey, Math.round((span * i) / 4)));
  const path = keys.map((k, i) => `${i ? 'L' : 'M'}${x(k).toFixed(1)} ${y(weights[k]).toFixed(1)}`).join(' ');

  const sel = selected != null && keys[selected] ? keys[selected] : null;

  return (
    <View style={styles.screen}>
      <ScreenHeader look={looks.food} backLabel="‹ Log" onBack={onBack} title="Weight" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.chips}>
          {RANGES.map(([r]) => (
            <Pressable key={r} onPress={() => { setRange(r); setSelected(null); }} style={[styles.chip, r === range && styles.chipOn]}>
              <Text style={[styles.chipText, r === range && styles.chipTextOn]}>{r}</Text>
            </Pressable>
          ))}
        </View>

        {latest != null ? (
          <View style={styles.hero}>
            <Text style={styles.heroNum}>{fmt(latest)} <Text style={styles.heroKg}>kg</Text></Text>
            {change != null && (
              <Text style={[styles.heroChange, change > 0 && styles.up]}>
                {change < 0 ? '▼' : change > 0 ? '▲' : '='} {fmt(Math.abs(change))} kg since {dayMonth(keys[0])}
              </Text>
            )}
          </View>
        ) : (
          <Text style={styles.empty}>No weights logged in this period yet.{'\n'}Add one from the weight box on the Food tab.</Text>
        )}

        {values.length > 1 && (
          <View style={styles.card}>
            <View>
              <Svg width={W} height={H}>
                {ticks.map((v) => (
                  <Line key={`g${v}`} x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke={t.softLine} strokeWidth={1} />
                ))}
                {ticks.map((v) => (
                  <SvgText key={`t${v}`} x={L - 6} y={y(v) + 3} fontSize={9} textAnchor="end" fill={axisInk}>{step < 1 ? v.toFixed(1) : v}</SvgText>
                ))}
                {xLabels.map((k, i) => (
                  <SvgText key={`x${i}`} x={x(k)} y={H - 22} fontSize={9} textAnchor={i === 0 ? 'start' : i === 4 ? 'end' : 'middle'} fill={axisInk}>{dayMonth(k)}</SvgText>
                ))}
                {sel && <Line x1={x(sel)} x2={x(sel)} y1={T} y2={T + ph} stroke={t.ink} strokeOpacity={0.25} strokeDasharray="3 3" />}
                <Path d={path} fill="none" stroke={t.accent} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                {keys.map((k) => {
                  const on = k === sel;
                  return <Circle key={k} cx={x(k)} cy={y(weights[k])} r={on ? 5 : 3.5} fill={on ? t.accent : '#fff'} stroke={on ? '#fff' : t.accent} strokeWidth={2} />;
                })}
                {ateOut.map((k) => (
                  <Rect key={`e${k}`} x={x(k) - 3} y={H - 13} width={6} height={6} rx={1.5} fill={t.peach} stroke={t.peachLine} strokeWidth={1} />
                ))}
                {/* Bigger invisible targets so the dots are easy to tap. */}
                {keys.map((k, i) => (
                  <Circle key={`hit${k}`} cx={x(k)} cy={y(weights[k])} r={14} fill="transparent" onPress={() => setSelected(i === selected ? null : i)} />
                ))}
              </Svg>
              {sel && (
                <View pointerEvents="none" style={[styles.tip, { left: Math.min(Math.max(x(sel) - 48, 0), W - 100), top: Math.max(y(weights[sel]) - 34, 0) }]}>
                  <Text style={styles.tipText}>{dayMonth(sel)} · {fmt(weights[sel])} kg</Text>
                </View>
              )}
            </View>
            <View style={styles.legend}>
              <View style={styles.legendBox} />
              <Text style={styles.legendText}>day you ate out</Text>
            </View>
          </View>
        )}
        {values.length === 1 && <Text style={styles.empty}>Log a few more days to see the graph.</Text>}

        <Summary keys={keys} values={values} weights={weights} entries={entries} bottom={insets.bottom} />
      </ScrollView>
    </View>
  );
}

// "Weight was X kg higher the day after eating out", plus lowest / highest / average.
function Summary({ keys, values, weights, entries, bottom }) {
  if (!values.length) return null;
  const after = [], other = [];
  keys.forEach((k) => (entries[addDays(k, -1)]?.length ? after : other).push(weights[k]));
  const avg = (a) => a.reduce((s, v) => s + v, 0) / a.length;
  let insight = null;
  if (after.length >= 3 && other.length >= 3) {
    const diff = avg(after) - avg(other);
    insight = Math.abs(diff) < 0.05
      ? 'Weight was about the same the day after eating out'
      : `Weight was ${fmt(Math.abs(diff))} kg ${diff > 0 ? 'higher' : 'lower'}, on average, the day after eating out`;
  }
  return (
    <View style={[styles.summary, { paddingBottom: bottom + 28 }]}>
      {insight && <Text style={styles.insight}>{insight}</Text>}
      <View style={styles.stats}>
        {[['lowest', Math.min(...values)], ['highest', Math.max(...values)], ['average', avg(values)]].map(([l, v]) => (
          <View key={l} style={styles.stat}>
            <Text style={styles.statNum}>{fmt(v)}</Text>
            <Text style={styles.statLabel}>{l}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.bg },
  scroll: { flexGrow: 1 },
  chips: { flexDirection: 'row', gap: 8, justifyContent: 'center', paddingTop: 16, paddingBottom: 6 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: t.cellLine },
  chipOn: { backgroundColor: t.accent, borderColor: t.accent },
  chipText: { fontSize: 13, fontWeight: '600', color: t.ink },
  chipTextOn: { color: '#fff' },
  hero: { alignItems: 'center', paddingTop: 6 },
  heroNum: { fontSize: 40, fontWeight: '800', color: '#1C1C1E' },
  heroKg: { fontSize: 18, fontWeight: '600', color: 'rgba(0,0,0,0.5)' },
  heroChange: { fontSize: 14, fontWeight: '700', color: t.weight },
  up: { color: '#C93A72' },
  empty: { textAlign: 'center', color: 'rgba(0,0,0,0.5)', fontSize: 14, lineHeight: 20, marginTop: 28, marginHorizontal: 24 },
  card: { marginHorizontal: 12, marginTop: 12, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: t.softLine, padding: 6 },
  tip: { position: 'absolute', backgroundColor: t.ink, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  tipText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  legend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 4 },
  legendBox: { width: 9, height: 9, borderRadius: 2, backgroundColor: t.peach, borderWidth: 1, borderColor: t.peachLine },
  legendText: { fontSize: 11, color: t.ink, opacity: 0.8 },
  summary: { flexGrow: 1, marginTop: 14, backgroundColor: t.dark, alignItems: 'center', justifyContent: 'center', paddingTop: 28, paddingHorizontal: 22 },
  insight: { color: '#fff', fontSize: 15, fontWeight: '600', textAlign: 'center', marginBottom: 14 },
  stats: { flexDirection: 'row', gap: 10 },
  stat: { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 14, alignItems: 'center', minWidth: 76 },
  statNum: { fontSize: 18, fontWeight: '700', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.85)' },
});
