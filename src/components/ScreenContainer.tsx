import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { c, MAX_CONTENT_WIDTH, spacing, TABLET_BREAKPOINT } from '../theme';

/**
 * Caps content width on iPad so forms/lists never stretch full-width (SPEC rule 5).
 * `wide` opts out of the cap for screens that use the extra width deliberately
 * (Pipeline's kanban, Leads' master/detail split).
 */
export function ScreenContainer({
  children,
  wide = false,
  scroll = false,
}: {
  children: React.ReactNode;
  wide?: boolean;
  scroll?: boolean;
}) {
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;
  const Wrapper = scroll ? View : View;

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <Wrapper style={[s.inner, isTablet && !wide && { maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', width: '100%' }]}>
        {children}
      </Wrapper>
    </SafeAreaView>
  );
}

export function useIsTablet(): boolean {
  const { width } = useWindowDimensions();
  return width >= TABLET_BREAKPOINT;
}

export function useScreenPadding(): number {
  return useIsTablet() ? spacing.screenTablet : spacing.screen;
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.page },
  inner: { flex: 1 },
});
