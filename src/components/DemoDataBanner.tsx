import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useT } from '../i18n';

/**
 * Unmistakable, persistent — shown above every screen (Login included) whenever
 * EXPO_PUBLIC_USE_MOCKS is on. Mock mode accepts any password and serves invented fixture data;
 * this is the one thing standing between that and someone mistaking it for the real backend.
 */
export function DemoDataBanner() {
  const t = useT();
  return (
    <View style={s.bar}>
      <View style={s.dot} />
      <Text style={s.text} numberOfLines={1}>
        {t('demo.banner')}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    backgroundColor: '#F0B429',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#15171C' },
  text: { color: '#15171C', fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
});
