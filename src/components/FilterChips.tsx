import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { c, radius, spacing, type } from '../theme';
import { useScreenPadding } from './ScreenContainer';

export interface ChipOption {
  key: string;
  label: string;
}

export function FilterChips({
  options,
  selected,
  onSelect,
}: {
  options: ChipOption[];
  selected: string | null;
  onSelect: (key: string | null) => void;
}) {
  const screenPadding = useScreenPadding();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // flexGrow 0: on web a horizontal ScrollView inside a column grows to fill the
      // leftover height, and every chip stretched with it into a ~250px-tall oval.
      style={s.scroller}
      contentContainerStyle={[s.wrap, { paddingHorizontal: screenPadding }]}
    >
      {options.map((opt) => {
        const active = selected === opt.key;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onSelect(active ? null : opt.key)}
            style={[s.chip, active && s.chipActive]}
            hitSlop={4}
          >
            <View style={[s.dot, active && s.dotActive]} />
            <Text style={[s.chipText, active && s.chipTextActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroller: { flexGrow: 0, flexShrink: 0 },
  wrap: { gap: 8, paddingBottom: spacing.md, alignItems: 'center' },
  chip: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'transparent' },
  chipActive: { backgroundColor: c.raised, borderColor: '#FFD84D66' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.micro },
  dotActive: { backgroundColor: c.yellow },
  chipText: { color: c.textSecondary, ...type.pill },
  chipTextActive: { color: c.textPrimary },
});
