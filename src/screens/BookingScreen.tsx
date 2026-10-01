import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer, useScreenPadding } from '../components/ScreenContainer';
import { ScreenHeader } from '../components/ScreenHeader';
import { SectionHeader } from '../components/SectionHeader';
import { ActionErrorBanner, EmptyState, ErrorState, ForbiddenNotice, SkeletonList } from '../components/StateViews';
import { PickerSheet } from '../components/PickerSheet';
import { api } from '../api/client';
import { describeApiError, useAuth } from '../auth/AuthContext';
import { c, radius, spacing, status, statusText, type } from '../theme';
import type { BookingSettings, BookingSlot, MeetingType, TeamMember } from '../api/types';
import { formatDateTime } from '../utils/dates';
import { pickBilingual, useLanguage, useT, type TranslationKey } from '../i18n';

export default function BookingScreen() {
  const screenPadding = useScreenPadding();
  const { can } = useAuth();
  const canManage = can('booking.manage');
  const [lang] = useLanguage();
  const t = useT();

  const EMAIL_CTAS: { emoji: string; textKey: TranslationKey; subKey: TranslationKey }[] = [
    { emoji: '🏠', textKey: 'booking.ctaRelocate', subKey: 'booking.ctaRelocateSub' },
    { emoji: '📈', textKey: 'booking.ctaInvest', subKey: 'booking.ctaInvestSub' },
    { emoji: '🏝', textKey: 'booking.ctaLombok', subKey: 'booking.ctaLombokSub' },
  ];

  const [screenStatus, setScreenStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<BookingSettings | null>(null);
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const [repSheetFor, setRepSheetFor] = useState<MeetingType | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setScreenStatus('loading');
    setError(null);
    try {
      const [s, sl] = await Promise.all([api.getBookingSettings(), api.getBookingSlots()]);
      setSettings(s);
      setSlots(sl);
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

  const openRepPicker = async (mt: MeetingType) => {
    setRepSheetFor(mt);
    setTeamLoading(true);
    setTeamError(null);
    try {
      const res = await api.getTeam(1, 200);
      setTeam(res.data);
    } catch (e) {
      setTeamError(describeApiError(e));
    } finally {
      setTeamLoading(false);
    }
  };

  const assignRep = async (mt: MeetingType, userId: string) => {
    if (!settings) return;
    setRepSheetFor(null);
    setSaving(true);
    setActionError(null);
    try {
      const next = settings.meeting_types.map((m) => (m.type === mt ? { ...m, rep_user_ids: [userId] } : m));
      const updated = await api.patchBookingSettings({ meeting_types: next });
      setSettings(updated);
    } catch (e) {
      setActionError(describeApiError(e));
    } finally {
      setSaving(false);
    }
  };

  if (!can('booking.view')) {
    return (
      <ScreenContainer>
        <ScreenHeader title={t('booking.title')} />
        <ForbiddenNotice message={t('booking.forbidden')} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer wide>
      <ScreenHeader title={t('booking.title')} />

      {screenStatus === 'loading' && <SkeletonList count={4} />}
      {screenStatus === 'error' && <ErrorState message={error ?? t('booking.loadFailed')} onRetry={() => load()} />}

      {screenStatus === 'ready' && settings && (
        <ScrollView
          contentContainerStyle={[s.content, { paddingHorizontal: screenPadding }]}
          refreshControl={<RefreshControl tintColor={c.yellow} refreshing={refreshing} onRefresh={() => load(true)} />}
        >
          {!!actionError && (
            <View style={{ marginBottom: spacing.cardGap }}>
              <ActionErrorBanner message={actionError} onRetry={() => setActionError(null)} onDismiss={() => setActionError(null)} />
            </View>
          )}

          {/* What the client sees */}
          <View style={{ marginBottom: spacing.section }}>
            <SectionHeader title={t('booking.whatClientsSee')} />
            <Text style={s.previewNote}>{t('booking.previewNote')}</Text>
            <View style={s.previewCard}>
              <View style={s.wizardRow}>
                <WizardStep n={1} label={t('booking.stepEmailCta')} active />
                <WizardStep n={2} label={t('booking.stepPickTime')} />
                <WizardStep n={3} label={t('booking.stepConfirmed')} />
              </View>
              <View style={s.emailFrame}>
                <Text style={s.emailHeadline}>{t('booking.emailHeadline')}</Text>
                <Text style={s.emailBody}>{t('booking.emailBody')}</Text>
                {EMAIL_CTAS.map((cta) => (
                  <View key={cta.textKey} style={s.ctaButton}>
                    <Text style={s.ctaEmoji}>{cta.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={s.ctaText}>{t(cta.textKey)}</Text>
                      <Text style={s.ctaSub}>{t(cta.subKey)}</Text>
                    </View>
                  </View>
                ))}
              </View>
              <View style={s.confirmBox}>
                <Text style={s.confirmTick}>✓</Text>
                <Text style={s.confirmTitle}>{t('booking.confirmedTitle')}</Text>
                <Text style={s.confirmBody}>{t('booking.confirmedBody')}</Text>
              </View>
              {settings.public_page_status === 'not_configured' && (
                <View style={s.notConfiguredBox}>
                  <Text style={s.notConfiguredText}>{t('booking.notConfigured')}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Settings */}
          <View style={{ marginBottom: spacing.section }}>
            <SectionHeader title={t('booking.meetingTypes')} count={settings.meeting_types.length} />
            {settings.meeting_types.map((mt) => {
              const rep = team.find((t) => t.user_id === mt.rep_user_ids[0]);
              return (
                <View key={mt.type} style={s.settingRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.settingLabel}>{pickBilingual(lang, mt.label, mt.label_ja)}</Text>
                    <Text style={s.settingMeta}>{t('booking.durationMinutes', { count: mt.duration_minutes })}</Text>
                  </View>
                  <Pressable2 disabled={!canManage || saving} onPress={() => openRepPicker(mt.type)}>
                    <Text style={s.repChipText}>{rep?.name ?? mt.rep_user_ids[0] ?? t('common.unassigned')}</Text>
                    {canManage && <Text style={s.repChipEdit}>{t('booking.change')}</Text>}
                  </Pressable2>
                </View>
              );
            })}

            <View style={s.gapBox}>
              <Text style={s.gapText}>{t('booking.jstGapNote', { hours: settings.jst_gst_gap_hours })}</Text>
            </View>
          </View>

          <View>
            <SectionHeader title={t('booking.openSlots')} count={slots.length} />
            {slots.length === 0 ? (
              <EmptyState title={t('booking.emptySlotsTitle')} body={t('booking.emptySlotsBody')} />
            ) : (
              slots.slice(0, 8).map((slot) => (
                <View key={slot.id} style={s.slotRow}>
                  <Text style={s.slotTime}>{formatDateTime(slot.start_at, lang)}</Text>
                  <Text style={s.slotRep}>{slot.rep_name}</Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      <PickerSheet
        visible={!!repSheetFor}
        title={t('booking.assignRep')}
        options={team.map((m) => ({ key: m.user_id, label: m.name }))}
        onClose={() => setRepSheetFor(null)}
        error={teamError}
        onRetry={() => repSheetFor && openRepPicker(repSheetFor)}
        loading={teamLoading}
        onSelect={(key) => repSheetFor && assignRep(repSheetFor, key)}
      />
    </ScreenContainer>
  );
}

function WizardStep({ n, label, active }: { n: number; label: string; active?: boolean }) {
  return (
    <View style={[s.wizardStep, active && s.wizardStepActive]}>
      <Text style={[s.wizardStepText, active && s.wizardStepTextActive]}>{n} · {label}</Text>
    </View>
  );
}

function Pressable2({ children, onPress, disabled }: { children: React.ReactNode; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [s.repChip, pressed && !disabled && { opacity: 0.8 }, disabled && { opacity: 0.7 }]}>
      {children}
    </Pressable>
  );
}

const s = StyleSheet.create({
  content: { paddingTop: spacing.md, paddingBottom: 60 },
  previewNote: { color: c.textSecondary, ...type.secondary, marginTop: spacing.card, marginBottom: spacing.card },
  previewCard: { backgroundColor: c.card, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.card, padding: spacing.card },
  wizardRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.card },
  wizardStep: { flex: 1, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.pill, paddingVertical: 8, alignItems: 'center' },
  wizardStepActive: { borderColor: '#FFD84D66', backgroundColor: '#FFD84D1F' },
  wizardStepText: { color: c.textTertiary, ...type.pill, fontSize: 10 },
  wizardStepTextActive: { color: statusText.warning },
  emailFrame: { borderWidth: 1, borderColor: c.hairline, borderRadius: radius.lg, padding: spacing.card, backgroundColor: c.raised },
  emailHeadline: { color: c.textPrimary, ...type.primary },
  emailBody: { color: c.textSecondary, ...type.secondary, marginTop: 8 },
  ctaButton: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.cardGap },
  ctaEmoji: { fontSize: 18 },
  ctaText: { color: c.textPrimary, ...type.secondary, fontWeight: '600' },
  ctaSub: { color: c.micro, ...type.micro, textTransform: 'none', letterSpacing: 0, marginTop: 2 },
  confirmBox: { marginTop: spacing.card, alignItems: 'center', backgroundColor: c.raised, borderRadius: radius.lg, padding: spacing.card },
  confirmTick: { color: statusText.success, fontSize: 22, fontWeight: '700' },
  confirmTitle: { color: c.textPrimary, ...type.primary, marginTop: 4 },
  confirmBody: { color: c.textSecondary, ...type.secondary, marginTop: 8, textAlign: 'center' },
  notConfiguredBox: { marginTop: spacing.card, backgroundColor: '#F0B4291A', borderWidth: 1, borderColor: '#F0B42940', borderRadius: radius.lg, padding: spacing.card },
  notConfiguredText: { color: statusText.warning, ...type.secondary },
  settingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.lg, padding: spacing.card, marginTop: spacing.cardGap, gap: spacing.md },
  settingLabel: { color: c.textPrimary, ...type.secondary, fontWeight: '600' },
  settingMeta: { color: c.textTertiary, ...type.micro, textTransform: 'none', letterSpacing: 0, marginTop: 6 },
  repChip: { borderWidth: 1, borderColor: c.hairline, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center' },
  repChipText: { color: c.textPrimary, ...type.pill },
  repChipEdit: { color: statusText.warning, ...type.micro, textTransform: 'none', letterSpacing: 0, marginTop: 2 },
  gapBox: { marginTop: spacing.card, backgroundColor: c.raised, borderRadius: radius.lg, padding: spacing.card },
  gapText: { color: c.textSecondary, ...type.secondary },
  slotRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: c.card, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.cardGap },
  slotTime: { color: c.textPrimary, ...type.secondary, fontVariant: ['tabular-nums'] },
  slotRep: { color: c.textSecondary, ...type.secondary },
});
