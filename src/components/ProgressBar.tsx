import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { c, type } from '../theme';

export function ProgressBar({
  value,
  max = 100,
  color,
  label,
  valueLabel,
}: {
  value: number;
  max?: number;
  color: string;
  label?: string;
  valueLabel?: string;
}) {
  const percentage = Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0));

  return (
    <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max, now: value }}>
      {(label || valueLabel) && (
        <View style={s.labelRow}>
          {!!label && <Text style={s.label}>{label}</Text>}
          <View style={{ flex: 1 }} />
          {!!valueLabel && <Text style={s.value}>{valueLabel}</Text>}
        </View>
      )}
      <Svg width="100%" height={4}>
        <Rect x={0} y={0} width="100%" height={4} rx={2} fill={c.hairline} />
        <Rect x={0} y={0} width={`${percentage}%`} height={4} rx={2} fill={color} />
      </Svg>
    </View>
  );
}

const s = StyleSheet.create({
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  label: { color: c.micro, ...type.micro },
  value: { color: c.textSecondary, ...type.pill, fontVariant: ['tabular-nums'] },
});
