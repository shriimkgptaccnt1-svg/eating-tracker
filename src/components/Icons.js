import Svg, { Path, Rect } from 'react-native-svg';

const base = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };

export const CalendarIcon = ({ color }) => (
  <Svg {...base} stroke={color}>
    <Rect x="3" y="4.5" width="18" height="16" rx="3" />
    <Path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
  </Svg>
);

export const WorkoutCalendarIcon = ({ color }) => (
  <Svg {...base} stroke={color}>
    <Rect x="3" y="4.5" width="18" height="16" rx="3" />
    <Path d="M3 9.5h18M8 2.5v4M16 2.5v4M9 14.5l2 2 4-4" />
  </Svg>
);

export const GraphIcon = ({ color }) => (
  <Svg {...base} stroke={color}>
    <Path d="M3 3v18h18" />
    <Path d="M7 15l4-5 3 3 5-6" />
  </Svg>
);

export const StatsIcon = ({ color }) => (
  <Svg {...base} stroke={color} strokeWidth={2.2}>
    <Path d="M5 20V13M10 20V7M15 20v-9M20 20V4" />
  </Svg>
);
