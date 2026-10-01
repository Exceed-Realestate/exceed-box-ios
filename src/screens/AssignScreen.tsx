import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer, useScreenPadding } from '../components/ScreenContainer';
import { ScreenHeader } from '../components/ScreenHeader';
import { SectionHeader } from '../components/SectionHeader';
import { ActionErrorBanner, EmptyState, ErrorState, ForbiddenNotice, SkeletonList } from '../components/StateViews';
import { PickerSheet } from '../components/PickerSheet';
import { api } from '../api/client';
import { describeApiError, useAuth } from '../auth/AuthContext';
import { c, radius, spacing, status, type } from '../theme';
import { pickBilingual, useLanguage, useT } from '../i18n';
import type { AssignmentRulesResponse, CalendarWeekResponse, TeamMember } from '../api/types';
import { formatDateTime } from '../utils/dates';

export default function AssignScreen() {
  const screenPadding = useScreenPadding();
  const { can } = useAuth();
  const canManage = can('assignment.manage');
  const [lang] = useLanguage();
  const t = useT();

  const [screenStatus, setScreenStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [rules, setRules] = useState<AssignmentRulesResponse | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const [calUserId, setCalUserId] = useState<string | null>(null);
  const [cal, setCal] = useState<CalendarWeekResponse | null>(null);
  const [calStatus, setCalStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [calError, setCalError] = useState<string | null>(null);
  const [repSheetOpen, setRepSheetOpen] = useState(false);
  const [pickerRuleId, setPickerRuleId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setScreenStatus('loading');
    setError(null);
    try {
      const [r, t] = await Promise.all([api.getAssignmentRules(), api.getTeam(1, 200)]);
      setRules(r);
      setTeam(t.data);
      const firstRep = t.data.find((m) => m.role === 'sales') ?? t.data[0];
      if (!calUserId && firstRep) setCalUserId(firstRep.user_id);
      setScreenStatus('ready');
    } catch (e) {
      setError(describeApiError(e));
      setScreenStatus('error');
    } finally {
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadCalendar = useCallback(async (userId: string) => {
    setCalStatus('loading');
    setCalError(null);
    try {
      const res = await api.getCalendarWeek(userId);
      setCal(res);
      setCalStatus('ready');
    } catch (e) {
      setCalError(describeApiError(e));
      setCalStatus('error');
    }
  }, []);

  useEffect(() => {
    if (calUserId) loadCalendar(calUserId);
  }, [calUserId, loadCalendar]);

  const reassignRule = async (ruleId: string, ownerId: string) => {
    if (!rules) return;
    setPickerRuleId(null);
    setSaving(true);
    setActionError(null);
    try {
      const patchRules = rules.rules.map((r) => ({ id: r.id, priority: r.priority, owner_user_id: r.id === ruleId ? ownerId : r.owner_user_id }));
      const updated = await api.putAssignmentRules({ rules: patchRules });
      setRules(updated);
    } catch (e) {
      setActionError(describeApiError(e));
    } finally {
      setSaving(false);
    }
  };

  if (!can('assignment.view')) {
    return (
      <ScreenContainer>
        <ScreenHeader title={t('assign.subtitleShort')} />
        <ForbiddenNotice message={t('assign.forbidden')} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer wide>
      <ScreenHeader title={t('assign.subtitleFull')} />

      {screenStatus === 'loading' && <SkeletonList count={4} />}
      {screenStatus === 'error' && <ErrorState message={error ?? t('assign.loadFailed')} onRetry={() => load()} />}

      {screenStatus === 'ready' && rules && (
        <ScrollView
          contentContainerStyle={[s.content, { paddingHorizontal: screenPadding }]}
          refreshControl={<RefreshControl tintColor={c.yellow} refreshing={refreshing} onRefresh={() => load(true)} />}
        >
          {!!actionError && (
            <View style={{ marginBottom: spacing.cardGap }}>
              <ActionErrorBanner message={actionError} onRetry={() => setActionError(null)} onDismiss={() => setActionError(null)} />
            </View>
          )}

          <SectionHeader title={t('assign.rulesTitle')} count={rules.rules.length} />
          {rules.rules.length === 0 ? (
            <EmptyState title={t('assign.emptyTitle')} body={t('assign.emptyBody')} />
          ) : (
            rules.rules.map((r) => (
              <View key={r.id} style={s.ruleRow}>
                <Text style={s.rulePriority}>{r.priority}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.ruleTopic}>{pickBilingual(lang, r.topic, r.topic_ja)}</Text>
                </View>
                <Text style={s.arrow}>→</Text>
                <Pressable
                  disabled={!canManage || saving}
                  onPress={() => setPickerRuleId(r.id)}
                  style={({ pressed }) => [s.ownerChip, pressed && !saving && { opacity: 0.8 }]}
                >
                  <Text style={s.ownerChipText}>{r.owner_name}</Text>
                </Pressable>
              </View>
            ))
          )}
          <View style={s.fallbackBox}>
            <Text style={s.fallbackText}>{pickBilingual(lang, rules.fallback_note, rules.fallback_note_ja)}</Text>
            <Text style={s.fallbackOwner}>{t('assign.fallbackRep', { name: rules.fallback_owner_name })}</Text>
          </View>

          <View style={{ marginTop: spacing.section }}>
            <View style={s.calHeadRow}>
              <SectionHeader title={t('assign.calendarTitle', { name: cal?.user_name ?? '…' })} />
              <Pressable onPress={() => setRepSheetOpen(true)} style={s.calSwitchBtn}>
                <Text style={s.calSwitchText}>{t('assign.switchRep')}</Text>
              </Pressable>
            </View>
            {calStatus === 'loading' && <SkeletonList count={3} />}
            {calStatus === 'error' && <ErrorState message={calError ?? t('assign.loadCalendarFailed')} onRetry={() => calUserId && loadCalendar(calUserId)} />}
            {calStatus === 'ready' && cal && (
              <>
                <View style={s.gcalBadge}>
                  <View style={[s.gcalDot, { backgroundColor: cal.google_calendar_connected ? status.success : c.textTertiary }]} />
                  <Text style={s.gcalText}>{cal.google_calendar_connected ? t('assign.gcalSynced') : t('assign.gcalNotConnected')}</Text>
                </View>
                {cal.events.length === 0 ? (
                  <EmptyState title={t('assign.emptyWeekTitle')} body={t('assign.emptyWeekBody')} />
                ) : (
                  cal.events.map((ev) => (
                    <View key={ev.id} style={s.eventRow}>
                      <Text style={s.eventTime}>{formatDateTime(ev.start_at, lang)}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={s.eventTitle}>{ev.title}</Text>
                        {!!ev.lead_name && <Text style={s.eventLead}>{ev.lead_name}</Text>}
                      </View>
                    </View>
                  ))
                )}
              </>
            )}
          </View>
        </ScrollView>
      )}

      <PickerSheet
        visible={!!pickerRuleId}
        title={t('assign.assignTo')}
        options={team.map((m) => ({ key: m.user_id, label: m.name }))}
        onClose={() => setPickerRuleId(null)}
        onSelect={(key) => pickerRuleId && reassignRule(pickerRuleId, key)}
      />

      <PickerSheet
        visible={repSheetOpen}
        title={t('assign.viewCalendarFor')}
        options={team.map((m) => ({ key: m.user_id, label: m.name }))}
        onClose={() => setRepSheetOpen(false)}
        onSelect={(key) => {
          setRepSheetOpen(false);
          setCalUserId(key);
        }}
      />
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  content: { paddingTop: spacing.md, paddingBottom: 60 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.lg, padding: spacing.card, marginTop: spacing.cardGap, gap: spacing.md },
  rulePriority: { color: c.micro, ...type.pill, width: 18, textAlign: 'center' },
  ruleTopic: { color: c.textPrimary, ...type.secondary, fontWeight: '600' },
  arrow: { color: c.textTertiary },
  ownerChip: { borderWidth: 1, borderColor: c.hairline, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: c.raised },
  ownerChipText: { color: c.textPrimary, ...type.pill },
  fallbackBox: { marginTop: spacing.card, backgroundColor: c.raised, borderRadius: radius.lg, padding: spacing.card },
  fallbackText: { color: c.textSecondary, ...type.secondary },
  fallbackOwner: { color: c.textPrimary, ...type.pill, marginTop: 10 },
  calHeadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  calSwitchBtn: { borderWidth: 1, borderColor: c.hairline, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  calSwitchText: { color: c.textPrimary, ...type.pill },
  gcalBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.card, marginBottom: spacing.card },
  gcalDot: { width: 6, height: 6, borderRadius: 3 },
  gcalText: { color: c.textSecondary, ...type.micro, textTransform: 'none', letterSpacing: 0 },
  eventRow: { flexDirection: 'row', gap: spacing.md, backgroundColor: c.card, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.lg, padding: spacing.card, marginBottom: spacing.cardGap },
  eventTime: { color: c.textSecondary, ...type.pill, fontVariant: ['tabular-nums'], width: 96 },
  eventTitle: { color: c.textPrimary, ...type.secondary },
  eventLead: { color: c.micro, ...type.micro, textTransform: 'none', letterSpacing: 0, marginTop: 3 },
});
