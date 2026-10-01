import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer, useScreenPadding } from '../components/ScreenContainer';
import { ScreenHeader } from '../components/ScreenHeader';
import { SectionHeader } from '../components/SectionHeader';
import { ErrorState, ForbiddenNotice, SkeletonList } from '../components/StateViews';
import { api } from '../api/client';
import { describeApiError, useAuth } from '../auth/AuthContext';
import { c, radius, spacing, status, statusText, type } from '../theme';
import type { IntegrationStatus } from '../api/types';
import { formatDateTime } from '../utils/dates';
import { pickBilingual, useLanguage, useT } from '../i18n';

export default function IntegrationsScreen() {
  const screenPadding = useScreenPadding();
  const { can } = useAuth();
  const canSync = can('integrations.manage');
  const [lang] = useLanguage();
  const t = useT();

  const [screenStatus, setScreenStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ ok: boolean; text: string; textJa?: string | null } | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setScreenStatus('loading');
    setError(null);
    try {
      const res = await api.getIntegrations();
      setIntegrations(res.integrations);
      setScreenStatus('ready');
    } catch (e) {
      setError(describeApiError(e));
      setScreenStatus('error');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runSync = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await api.syncGoHighLevel();
      setSyncMessage({ ok: res.ok, text: res.message, textJa: res.message_ja });
    } catch (e) {
      setSyncMessage({ ok: false, text: describeApiError(e) });
    } finally {
      setSyncing(false);
    }
  };

  if (!can('integrations.view')) {
    return (
      <ScreenContainer>
        <ScreenHeader title={t('integrations.title')} />
        <ForbiddenNotice message={t('integrations.forbidden')} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScreenHeader title={t('integrations.title')} />

      {screenStatus === 'loading' && <SkeletonList count={6} />}
      {screenStatus === 'error' && <ErrorState message={error ?? t('integrations.loadFailed')} onRetry={() => load()} />}

      {screenStatus === 'ready' && (
        <ScrollView
          contentContainerStyle={[s.content, { paddingHorizontal: screenPadding }]}
          refreshControl={<RefreshControl tintColor={c.yellow} refreshing={refreshing} onRefresh={() => load(true)} />}
        >
          <SectionHeader title={t('integrations.connectedTools')} count={integrations.length} />
          {integrations.map((i) => (
            <View key={i.key} style={s.row}>
              <View style={[s.dot, { backgroundColor: i.connected ? status.success : c.textTertiary }]} />
              <View style={{ flex: 1 }}>
                <View style={s.nameRow}>
                  <Text style={s.name}>{pickBilingual(lang, i.name, i.name_ja)}</Text>
                  {i.read_only && (
                    <View style={s.roPill}>
                      <Text style={s.roPillText}>{t('integrations.readOnly')}</Text>
                    </View>
                  )}
                </View>
                <Text style={s.statusNote}>{pickBilingual(lang, i.status_note, i.status_note_ja)}</Text>
                {/* "Not connected" is a state, not an instruction. The backend already knows the
                    specific thing that is missing — an API key, an OAuth grant — so show it, and
                    this screen becomes a to-do list instead of a list of red dots. */}
                {!i.connected && !!i.what_is_needed && (
                  <Text style={s.needed}>{t('integrations.needs', { what: i.what_is_needed })}</Text>
                )}
                {i.connected && (
                  <Text style={s.syncMeta}>
                    {i.record_count !== null ? t('integrations.recordsCount', { count: i.record_count.toLocaleString() }) : ''}
                    {i.last_sync_at ? t('integrations.lastSynced', { date: formatDateTime(i.last_sync_at, lang) }) : t('integrations.neverSynced')}
                  </Text>
                )}
              </View>
              <View style={[s.statusPill, i.connected ? s.statusPillOn : s.statusPillOff]}>
                <Text style={[s.statusPillText, i.connected ? { color: statusText.success } : { color: c.textTertiary }]}>
                  {i.connected ? t('integrations.connected') : t('integrations.notConnected')}
                </Text>
              </View>
            </View>
          ))}

          <View style={{ marginTop: spacing.section }}>
            <SectionHeader title={t('integrations.syncTitle')} />
            <View style={s.syncCard}>
              <Text style={s.syncCardText}>{t('integrations.syncNote')}</Text>
              {!!syncMessage && (
                <View style={[s.syncMessageBox, syncMessage.ok ? s.syncMessageOk : s.syncMessageWarn]}>
                  <Text style={[s.syncMessageText, syncMessage.ok ? { color: statusText.success } : { color: statusText.warning }]}>
                    {lang === 'ja' && syncMessage.textJa ? syncMessage.textJa : syncMessage.text}
                  </Text>
                </View>
              )}
              {canSync ? (
                <Pressable onPress={runSync} disabled={syncing} style={[s.syncBtn, syncing && { opacity: 0.6 }]}>
                  <Text style={s.syncBtnText}>{syncing ? t('integrations.syncing') : t('integrations.syncNow')}</Text>
                </Pressable>
              ) : (
                <Text style={s.syncGated}>{t('integrations.syncGated')}</Text>
              )}
            </View>
          </View>
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  content: { paddingTop: spacing.md, paddingBottom: 60 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, backgroundColor: c.card, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.card, padding: spacing.card, marginTop: spacing.cardGap },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { color: c.textPrimary, ...type.primary },
  roPill: { borderWidth: 1, borderColor: c.hairline, borderRadius: radius.pill, paddingHorizontal: 6, paddingVertical: 1 },
  roPillText: { color: c.textTertiary, ...type.micro, fontSize: 9 },
  statusNote: { color: c.textSecondary, ...type.secondary, marginTop: 8 },
  needed: { color: statusText.warning, ...type.micro, textTransform: 'none', letterSpacing: 0, marginTop: 4 },
  syncMeta: { color: c.textTertiary, ...type.micro, textTransform: 'none', letterSpacing: 0, marginTop: 8, fontVariant: ['tabular-nums'] },
  statusPill: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 4 },
  statusPillOn: { borderColor: '#3DD68C40', backgroundColor: '#3DD68C1F' },
  statusPillOff: { borderColor: c.hairline, backgroundColor: c.raised },
  statusPillText: { ...type.pill, fontSize: 10 },
  syncCard: { backgroundColor: c.card, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.card, padding: spacing.card },
  syncCardText: { color: c.textSecondary, ...type.secondary },
  syncMessageBox: { marginTop: spacing.card, borderRadius: radius.lg, padding: spacing.card, borderWidth: 1 },
  syncMessageOk: { backgroundColor: '#3DD68C1F', borderColor: '#3DD68C40' },
  syncMessageWarn: { backgroundColor: '#F0B4291F', borderColor: '#F0B42940' },
  syncMessageText: { ...type.secondary },
  syncBtn: { minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, backgroundColor: c.yellow, marginTop: spacing.card },
  syncBtnText: { color: c.page, ...type.pill },
  syncGated: { color: c.textTertiary, ...type.micro, textTransform: 'none', letterSpacing: 0, marginTop: spacing.card, textAlign: 'center' },
});
