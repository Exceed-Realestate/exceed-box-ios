import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { c, spacing, TABLET_BREAKPOINT, type } from '../theme';

export function ScreenHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const { width } = useWindowDimensions();
  const horizontalPadding = width >= TABLET_BREAKPOINT ? spacing.screenTablet : spacing.screen;
  return (
    <View style={[s.wrap, { paddingHorizontal: horizontalPadding }]}>
      <View style={{ flex: 1 }}>
        <Text style={s.title}>{title}</Text>
        {!!subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-start', paddingTop: spacing.xl, paddingBottom: spacing.lg },
  title: { color: c.textPrimary, ...type.screenTitle, letterSpacing: -0.7 },
  subtitle: { color: c.textSecondary, ...type.secondary, marginTop: 10, fontVariant: ['tabular-nums'] },
});
