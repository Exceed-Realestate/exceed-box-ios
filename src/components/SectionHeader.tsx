import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { c, radius, type } from '../theme';

export function SectionHeader({
  title,
  count,
  style,
}: {
  title: string;
  count?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[s.wrap, style]}>
      <View style={s.glyph}>
        <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
          <Path d="M2 2h8M2 6h5M2 10h8" stroke={c.textTertiary} strokeWidth={1.5} strokeLinecap="round" />
        </Svg>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.title}>{title}</Text>
      </View>
      {typeof count === 'number' && (
        <View style={s.countChip}>
          <Text style={s.count}>{count}</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  glyph: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: c.raised,
    borderWidth: 1,
    borderColor: c.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: c.textPrimary, ...type.sectionTitle, letterSpacing: -0.35 },
  countChip: {
    minWidth: 28,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: c.hairline,
    backgroundColor: c.raised,
    alignItems: 'center',
  },
  count: { color: c.textSecondary, ...type.pill, fontVariant: ['tabular-nums'] },
});
