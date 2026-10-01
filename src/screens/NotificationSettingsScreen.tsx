import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { ScreenContainer, useScreenPadding } from '../components/ScreenContainer';
import { ScreenHeader } from '../components/ScreenHeader';
import { SectionHeader } from '../components/SectionHeader';
import { ActionErrorBanner, ErrorState, SkeletonList } from '../components/StateViews';
import { api } from '../api/client';
import { describeApiError } from '../auth/AuthContext';
import { c, radius, spacing, status, statusText, type } from '../theme';
import { pickBilingual, useLanguage, useT, type Lang } from '../i18n';
import type { NotificationSettingsResponse } from '../api/types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Settings' own Language section — also mirrored on the Login screen (SPEC: someone should be able
 * to switch before signing in too). Applies instantly, no restart, and persists via AsyncStorage
 * (see src/i18n/index.tsx). */
export function LanguageSwitcher() {
  const [lang, setLang] = useLanguage();
  const t = useT();
  const options: { key: Lang; labelKey: 'settings.languageEnglish' | 'settings.languageJapanese' }[] = [
    { key: 'en', labelKey: 'settings.languageEnglish' },
    { key: 'ja', labelKey: 'settings.languageJapanese' },
  ];
  return (
    <View style={ls.row}>
      {options.map((opt) => {
        const active = lang === opt.key;
        return (
          <Pressable
            key={opt.key}
            onPress={() => setLang(opt.key)}
            style={[ls.chip, active && ls.chipActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[ls.chipText, active && ls.chipTextActive]}>{t(opt.labelKey)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const ls = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  chip: { minHeight: 40, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1, borderColor: c.hairline, backgroundColor: c.card },
  chipActive: { backgroundColor: c.yellow, borderColor: c.yellow },
  chipText: { color: c.textPrimary, ...type.pill },
  chipTextActive: { color: c.page },
});

export default function NotificationSettingsScreen() {
  const screenPadding = useScreenPadding();
  const [lang] = useLanguage();
  const t = useT();
  const [screenStatus, setScreenStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<NotificationSettingsResponse | null>(null);
  const [registering, setRegistering] = useState(false);
  const [registerMessage, setRegisterMessage] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [sendingTest, setSendingTest] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setScreenStatus('loading');
    setError(null);
    try {
      const res = await api.getNotificationSettings();
      setData(res);
      setScreenStatus('ready');
    } catch (e) {
      setError(describeApiError(e));
      setScreenStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const register = async () => {
    setRegistering(true);
    setRegisterMessage(null);
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', { name: 'Exceed Box', importance: Notifications.AndroidImportance.MAX });
      }
      const existing = await Notifications.getPermissionsAsync();
      let finalStatus = existing.status;
      if (finalStatus !== 'granted') {
        const req = await Notifications.requestPermissionsAsync();
        finalStatus = req.status;
      }
      if (finalStatus !== 'granted') {
        setRegisterMessage(t('settings.permissionDenied'));
        return;
      }
      const projectId = (Constants.expoConfig?.extra as any)?.eas?.projectId;
      if (!projectId) {
        setRegisterMessage(t('settings.noProjectId'));
        return;
      }
      const tokenRes = await Notifications.getExpoPushTokenAsync({ projectId });
      const updated = await api.registerPushToken(tokenRes.data);
      setData(updated);
      setRegisterMessage(t('settings.registerSuccess'));
    } catch (e) {
      setRegisterMessage(t('settings.registerFailed', { error: describeApiError(e) }));
    } finally {
      setRegistering(false);
    }
  };

  const sendTest = async () => {
    setSendingTest(true);
    setTestMessage(null);
    try {
      const perm = await Notifications.getPermissionsAsync();
      if (perm.status !== 'granted') {
        setTestMessage(t('settings.permissionNotGranted'));
        return;
      }
      // A genuine local notification — this actually fires, unlike a remote push (which needs
      // EAS push credentials that are not configured for this build).
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Exceed Box test notification', body: 'If you can see this, local notifications work on this device.' },
        trigger: null,
      });
      setTestMessage(t('settings.testSent'));
    } catch (e) {
      setTestMessage(t('settings.testSendFailed', { error: describeApiError(e) }));
    } finally {
      setSendingTest(false);
    }
  };

  const toggleSetting = async (key: string, enabled: boolean) => {
    if (!data) return;
    setSavingKey(key);
    setActionError(null);
    try {
      const updated = await api.patchNotificationSettings({ settings: [{ key: key as any, enabled }] });
      setData(updated);
    } catch (e) {
      setActionError(describeApiError(e));
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <ScreenContainer>
      <ScreenHeader title={t('settings.notificationsTitle')} />

      <ScrollView contentContainerStyle={[s.content, { paddingHorizontal: screenPadding }]}>
        {/* Language — also on the Login screen for switching before sign-in. */}
        <View style={{ marginBottom: spacing.section }}>
          <SectionHeader title={t('settings.language')} />
          <Text style={s.languageNote}>{t('settings.languageNote')}</Text>
          <View style={{ marginTop: spacing.card }}>
            <LanguageSwitcher />
          </View>
        </View>

        {screenStatus === 'loading' && <SkeletonList count={3} />}
        {screenStatus === 'error' && <ErrorState message={error ?? t('settings.loadFailed')} onRetry={load} />}

        {screenStatus === 'ready' && data && (
          <>
            <View style={s.regCard}>
              <View style={s.regRow}>
                <View style={[s.dot, { backgroundColor: data.push_registered ? status.success : c.textTertiary }]} />
                <Text style={s.regText}>{data.push_registered ? t('settings.registered') : t('settings.notRegistered')}</Text>
              </View>
              {!!registerMessage && <Text style={s.regMessage}>{registerMessage}</Text>}
              <Pressable onPress={register} disabled={registering} style={[s.secondaryBtn, registering && { opacity: 0.6 }]}>
                <Text style={s.secondaryBtnText}>{registering ? t('settings.registering') : t('settings.registerDevice')}</Text>
              </Pressable>
            </View>

            {!!actionError && (
              <View style={{ marginTop: spacing.cardGap }}>
                <ActionErrorBanner message={actionError} onRetry={() => setActionError(null)} onDismiss={() => setActionError(null)} />
              </View>
            )}

            <View style={{ marginTop: spacing.section }}>
              <SectionHeader title={t('settings.eventsThatNotify')} count={data.settings.length} />
              {data.settings.map((setting) => (
                <View key={setting.key} style={s.settingRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.settingLabel}>
                      {pickBilingual(lang, setting.label, setting.label_ja)}
                      {setting.manager_only ? t('settings.managerOnly') : ''}
                    </Text>
                  </View>
                  <Switch
                    value={setting.enabled}
                    onValueChange={(v) => toggleSetting(setting.key, v)}
                    disabled={savingKey === setting.key}
                    trackColor={{ false: c.hairline, true: '#3DD68C77' }}
                    thumbColor={setting.enabled ? status.success : c.textTertiary}
                  />
                </View>
              ))}
            </View>

            <View style={{ marginTop: spacing.section }}>
              <SectionHeader title={t('settings.test')} />
              <Text style={s.testNote}>{t('settings.testNote')}</Text>
              {!!testMessage && <Text style={s.testMessage}>{testMessage}</Text>}
              <Pressable onPress={sendTest} disabled={sendingTest} style={[s.primaryBtn, sendingTest && { opacity: 0.6 }]}>
                <Text style={s.primaryBtnText}>{sendingTest ? t('settings.sending') : t('settings.sendTest')}</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  content: { paddingTop: spacing.md, paddingBottom: 60 },
  languageNote: { color: c.textSecondary, ...type.secondary, marginTop: 8 },
  regCard: { backgroundColor: c.card, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.card, padding: spacing.card },
  regRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  regText: { color: c.textPrimary, ...type.secondary },
  regMessage: { color: c.textSecondary, ...type.micro, textTransform: 'none', letterSpacing: 0, marginTop: spacing.card },
  secondaryBtn: { minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1, borderColor: c.hairline, marginTop: spacing.card },
  secondaryBtnText: { color: c.textPrimary, ...type.pill },
  settingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.lg, padding: spacing.card, marginTop: spacing.cardGap, gap: spacing.md },
  settingLabel: { color: c.textPrimary, ...type.secondary },
  testNote: { color: c.textSecondary, ...type.secondary, marginTop: spacing.card },
  testMessage: { color: statusText.success, ...type.secondary, marginTop: spacing.card },
  primaryBtn: { minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, backgroundColor: c.yellow, marginTop: spacing.card },
  primaryBtnText: { color: c.page, ...type.pill },
});
