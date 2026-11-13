import { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, View } from 'react-native';

const SHOW = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
const HIDE = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

// A flex container that lifts its content above the keyboard.
// Android apps now always draw edge-to-edge, so the window no longer shrinks when the keyboard
// opens. Instead this measures how much of the view the keyboard covers and pads the bottom by
// exactly that much, so whatever sits at the bottom (inputs, buttons) stays visible.
export default function KeyboardSafeView({ style, children, onKeyboardChange }) {
  const ref = useRef(null);
  const [pad, setPad] = useState(0);
  const cb = useRef(onKeyboardChange);
  cb.current = onKeyboardChange;

  useEffect(() => {
    const apply = (keyboardTop) => {
      if (keyboardTop == null) {
        setPad(0);
        cb.current?.(false);
        return;
      }
      ref.current?.measureInWindow((x, y, w, h) => {
        setPad(Math.max(0, y + h - keyboardTop));
        cb.current?.(true);
      });
    };
    const subs = [
      Keyboard.addListener(SHOW, (e) => apply(e.endCoordinates.screenY)),
      Keyboard.addListener(HIDE, () => apply(null)),
    ];
    // Browser previews have no on-screen keyboard; tests can fake one with this event.
    const fake = (e) => apply(e.detail == null ? null : window.innerHeight - e.detail);
    if (Platform.OS === 'web') window.addEventListener('fake-keyboard', fake);
    return () => {
      subs.forEach((s) => s.remove());
      if (Platform.OS === 'web') window.removeEventListener('fake-keyboard', fake);
    };
  }, []);

  return (
    <View ref={ref} style={[{ flex: 1 }, style, { paddingBottom: pad }]}>
      {children}
    </View>
  );
}

// Keeps the focused row of a ScrollView in sight: call `track(id)` as a row's onLayout,
// `scrollProps` on the ScrollView, and `reveal(id)` when a row gets focus or the view resizes.
export function useRevealRow() {
  const scroll = useRef(null);
  const rows = useRef({});
  const offset = useRef(0);
  const viewH = useRef(0);
  const want = useRef(null);

  const reveal = (id = want.current) => {
    want.current = id;
    const r = rows.current[id];
    if (!r || !viewH.current) return;
    const top = offset.current;
    const bottom = top + viewH.current;
    if (r.y + r.h + 8 > bottom) scroll.current?.scrollTo({ y: r.y + r.h + 8 - viewH.current, animated: true });
    else if (r.y < top) scroll.current?.scrollTo({ y: Math.max(0, r.y - 8), animated: true });
  };

  return {
    reveal,
    forget: () => { want.current = null; },
    track: (id) => (e) => {
      rows.current[id] = e.nativeEvent.layout;
      if (id === want.current) reveal(id);
    },
    scrollProps: {
      ref: scroll,
      scrollEventThrottle: 16,
      onScroll: (e) => { offset.current = e.nativeEvent.contentOffset.y; },
      // The view shrinks when the keyboard opens; bring the focused row back into sight.
      onLayout: (e) => { viewH.current = e.nativeEvent.layout.height; requestAnimationFrame(() => reveal()); },
    },
  };
}
