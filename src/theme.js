// Three sections, three palettes: pink (food & weight), green (habits), blue (workout).
export const food = {
  gradient: ['#F3A8BB', '#F8BF80'],
  ink: '#5A1530',
  bg: '#FCF1F0',
  text: '#3A0F20',
  accent: '#ED4D8B',
  activeRow: '#FBD9B4',
  peach: '#F8BF80',
  peachLine: '#E08A3C',
  todayBg: '#FBD9B4',
  cell: '#FFFFFF',
  cellLine: '#F3A8BB',
  softLine: '#F6D3DC',
  dark: '#ED4D8B',
  weight: '#1E8E45',
};

export const habit = {
  gradient: ['#EAF1B1', '#728C5A', '#102F15'],
  ink: '#102F15',
  bg: '#EBFADC',
  forest: '#102F15',
  sage: '#728C5A',
  lime: '#EAF1B1',
  mint: '#EBFADC',
};

export const workout = {
  gradient: ['#DDF5FF', '#17C2FF'],
  ink: '#001D4F',
  bg: '#DDF5FF',
  navy: '#001D4F',
  blue: '#0A6CF2',
  cyan: '#17C2FF',
  amber: '#FFB703',
};

export const common = {
  muted: 'rgba(0,0,0,0.55)',
  faint: 'rgba(0,0,0,0.32)',
  line: 'rgba(0,0,0,0.1)',
  danger: '#C7432F',
};

// Header bar looks for each tab (see components/Header.js).
export const looks = {
  food: {
    gradient: food.gradient, ink: food.ink, iconBg: 'rgba(255,255,255,0.45)',
    track: 'rgba(255,255,255,0.35)', tabInk: food.ink, tabOnInk: food.accent,
  },
  // Light on the left where the date sits, dark on the right under the icons.
  habit: {
    gradient: habit.gradient, ink: habit.forest, iconInk: '#fff', iconBg: 'rgba(255,255,255,0.22)',
    track: 'rgba(255,255,255,0.55)', tabInk: habit.forest, tabOnInk: habit.forest,
  },
  workout: {
    gradient: workout.gradient, ink: workout.navy, iconBg: 'rgba(255,255,255,0.55)',
    track: 'rgba(255,255,255,0.45)', tabInk: workout.navy, tabOnInk: workout.blue, underline: workout.amber,
  },
};
