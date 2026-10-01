import { useWindowDimensions } from 'react-native';
import { TABLET_BREAKPOINT } from '../theme';

export type WidthClass = 'compact' | 'regular';

/**
 * SPEC v2 §11: drive the shell off the *current* window width, not `Platform.isPad`. `Platform.isPad`
 * is a static device fact — it never changes while the app is running, so it cannot tell the
 * difference between an iPad at full-screen and the same iPad pinned to a 320pt Split View pane, or
 * catch the user dragging the Split View divider live. `useWindowDimensions()` re-renders on every
 * one of those changes (Split View resize, Stage Manager, rotation), so this hook re-evaluates live.
 *
 * Breakpoint: reuses `TABLET_BREAKPOINT` (768pt) from theme.ts rather than introducing a second
 * threshold. Several screens already key their own single-column/split-view switch off that same
 * constant (see `useIsTablet` in `src/components/ScreenContainer.tsx`, used today by LeadsScreen's
 * master-detail split). Using a different number here would risk the sidebar appearing while a
 * screen underneath still renders its single-column phone layout, or vice versa — the shell and the
 * screens must agree on exactly where "regular" starts.
 */
export function useWidthClass(): WidthClass {
  const { width } = useWindowDimensions();
  return width >= TABLET_BREAKPOINT ? 'regular' : 'compact';
}

export function useIsRegularWidth(): boolean {
  return useWidthClass() === 'regular';
}
