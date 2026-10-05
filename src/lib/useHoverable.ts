import { useCallback, useState } from 'react';

/**
 * react-native-web's Pressable tracks hover internally but doesn't expose it
 * through the typed `style` callback (only `pressed` is typed upstream) — see
 * node_modules/react-native/.../Pressable.d.ts vs. the web implementation.
 * This re-derives it from the typed onHoverIn/onHoverOut props instead, which
 * are no-ops on touch devices, so the same code path is safe everywhere.
 */
export function useHoverable() {
  const [hovered, setHovered] = useState(false);
  const onHoverIn = useCallback(() => setHovered(true), []);
  const onHoverOut = useCallback(() => setHovered(false), []);
  return { hovered, onHoverIn, onHoverOut };
}
