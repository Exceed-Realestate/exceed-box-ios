import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { c, radius, spacing, type } from '../theme';
import { useT } from '../i18n';

/**
 * A non-mock build with no EXPO_PUBLIC_API_URL cannot reach a server — historically the fallback
 * was http://127.0.0.1:8912, which on a real iPhone means the phone calling itself, failing
 * silently on every request. This screen replaces that silent failure: the app refuses to mount
 * auth/navigation at all until a real API URL is configured (or mock mode is explicitly on).
 */
export default function ConfigErrorScreen() {
  const t = useT();
  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom', 'left', 'right']}>
      <View style={s.card}>
        <Text style={s.title}>{t('configError.title')}</Text>
        <Text style={s.body}>{t('configError.body')}</Text>
        <Text style={s.bodySecondary}>{t('configError.bodySecondary')}</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.page, alignItems: 'center', justifyContent: 'center', padding: spacing.screen },
  card: { maxWidth: 420, width: '100%', backgroundColor: c.card, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.card, padding: spacing.xl },
  title: { color: c.textPrimary, ...type.sectionTitle },
  body: { color: c.textSecondary, ...type.secondary, marginTop: spacing.card },
  bodySecondary: { color: c.textTertiary, ...type.secondary, marginTop: spacing.card },
});
