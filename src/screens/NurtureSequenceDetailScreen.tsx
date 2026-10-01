import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { ScreenContainer, useScreenPadding } from '../components/ScreenContainer';
import { ScreenHeader } from '../components/ScreenHeader';
import { ActionErrorBanner, ErrorState, ForbiddenNotice, SkeletonList } from '../components/StateViews';
import { Explain, ExplainModeToggle } from '../components/ExplainMode';
import { SectionHeader } from '../components/SectionHeader';
import { api } from '../api/client';
import { describeApiError, useAuth } from '../auth/AuthContext';
import { c, radius, spacing, status, statusText, type } from '../theme';
import type { SequenceDetail } from '../api/types';
import { pickBilingual, useLanguage, useT } from '../i18n';

export default function NurtureSequenceDetailScreen() {
  const screenPadding = useScreenPadding();
  const route = useRoute<any>();
  const sequenceId: string = route.params?.sequenceId ?? 'seq-dubai-lombok';
  const { can } = useAuth();
  const canEdit = can('nurture.edit');
  const canView = can('nurture.view');
  const [lang] = useLanguage();
  const t = useT();

  const [screenStatus, setScreenStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [seq, setSeq] = useState<SequenceDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [lastFailedStep, setLastFailedStep] = useState<number | null>(null);

  const load = useCallback(async () => {
    setScreenStatus('loading');
    setError(null);
    try {
      const res = await api.getSequence(sequenceId);
      setSeq(res);
      setScreenStatus('ready');
    } catch (e) {
      setError(describeApiError(e));
      setScreenStatus('error');
    }
  }, [sequenceId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleStep = async (step: number, nextActive: boolean) => {
    if (!seq) return;
    setToggling(step);
    setActionError(null);
    try {
      const updated = await api.patchSequenceStep(seq.id, step, { active: nextActive });
      setSeq(updated);
      setLastFailedStep(null);
    } catch (e) {
      setActionError(describeApiError(e));
      setLastFailedStep(step);
    } finally {
      setToggling(null);
    }
  };

  if (!canView) {
    return (
      <ScreenContainer>
        <ScreenHeader title={t('nurtureDetail.title')} />
        <ForbiddenNotice message={t('nurtureDetail.forbidden')} />
      </ScreenContainer>
    );
  }

  if (screenStatus === 'loading') {
    return (
      <ScreenContainer>
        <ScreenHeader title={t('nurtureDetail.title')} />
        <SkeletonList count={4} />
      </ScreenContainer>
    );
  }

  if (screenStatus === 'error' || !seq) {
    return (
      <ScreenContainer>
        <ScreenHeader title={t('nurtureDetail.title')} />
        <ErrorState message={error ?? t('nurtureDetail.loadFailed')} onRetry={load} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={[s.content, { paddingHorizontal: screenPadding }]}>
        <ScreenHeader
          title={pickBilingual(lang, seq.name, seq.name_ja)}
          subtitle={t('nurtureDetail.subtitle', { sent: seq.total_sent.toLocaleString(), steps: seq.step_count })}
          right={<ExplainModeToggle />}
        />

        {!!actionError && (
          <View style={{ marginBottom: spacing.cardGap }}>
            <ActionErrorBanner
              message={actionError}
              onRetry={() => lastFailedStep !== null && toggleStep(lastFailedStep, !seq.steps.find((s2) => s2.step === lastFailedStep)?.active)}
              onDismiss={() => setActionError(null)}
            />
          </View>
        )}

        <View style={s.editorialBanner}>
          <Text style={s.editorialText}>{pickBilingual(lang, seq.editorial_rule, seq.editorial_rule_ja)}</Text>
        </View>

        <Text style={s.dedupeNote}>{t('nurtureDetail.dedupeNote')}</Text>

        <View style={{ marginTop: spacing.section }}>
          <SectionHeader title={t('nurtureDetail.steps')} count={seq.steps.length} />
          {seq.steps.map((step) => (
            <View key={step.step} style={s.stepCard}>
              <View style={s.stepHead}>
                <View style={s.stepBadge}>
                  <Text style={s.stepBadgeText}>{pickBilingual(lang, step.offset_label, step.offset_label_ja)}</Text>
                </View>
                <View style={{ flex: 1 }} />
                <Switch
                  value={step.active}
                  onValueChange={(v) => toggleStep(step.step, v)}
                  disabled={!canEdit || toggling === step.step}
                  trackColor={{ false: c.hairline, true: '#3DD68C77' }}
                  thumbColor={step.active ? status.success : c.textTertiary}
                />
              </View>
              <Text style={s.subject}>{step.subject}</Text>
              <Explain
                en={t('nurtureDetail.questionExplainEn', { question: step.question })}
                ja={t('nurtureDetail.questionExplainJa', { question: step.question_ja ?? '' })}
              >
                <View style={s.questionBox}>
                  <Text style={s.questionMicro}>{t('nurtureDetail.theRealQuestion')}</Text>
                  <Text style={s.question}>{pickBilingual(lang, step.question, step.question_ja)}</Text>
                </View>
              </Explain>
              <Text style={s.cta}>{t('nurtureDetail.cta', { cta: step.cta })}</Text>
              <View style={s.statRow}>
                <Stat label={t('nurtureDetail.statSent')} value={step.sent} />
                <Stat label={t('nurtureDetail.statOpened')} value={`${step.open_rate}`} />
                <Stat label={t('nurtureDetail.statClicked')} value={`${step.click_rate}`} />
              </View>
              {!canEdit && <Text style={s.viewOnly}>{t('nurtureDetail.viewOnly')}</Text>}
            </View>
          ))}
        </View>

        <View style={{ marginTop: spacing.section }}>
          <SectionHeader title={t('nurtureDetail.exitConditions')} count={seq.exit_conditions.length} />
          {seq.exit_conditions.map((ex) => (
            <View key={ex.action} style={s.exitRow}>
              <View style={{ flex: 1 }}>
                <View style={s.exitLabelRow}>
                  <Text style={s.exitLabel}>{pickBilingual(lang, ex.label, ex.label_ja)}</Text>
                  {ex.provisional && (
                    <View style={s.provisionalPill}>
                      <Text style={s.provisionalText}>{t('nurtureDetail.provisional')}</Text>
                    </View>
                  )}
                </View>
                <Text style={s.exitTrigger}>{pickBilingual(lang, ex.trigger, ex.trigger_ja)}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <View style={s.stat}>
      <Text style={s.statValue}>{typeof value === 'number' ? value.toLocaleString() : value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  content: { paddingBottom: 60 },
  editorialBanner: { backgroundColor: c.raised, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.lg, padding: spacing.card },
  editorialText: { color: c.textPrimary, ...type.secondary },
  dedupeNote: { color: c.textTertiary, ...type.micro, textTransform: 'none', letterSpacing: 0, marginTop: spacing.md },
  stepCard: { backgroundColor: c.card, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.card, padding: spacing.card, marginBottom: spacing.cardGap },
  stepHead: { flexDirection: 'row', alignItems: 'center' },
  stepBadge: { backgroundColor: c.raised, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: c.hairline },
  stepBadgeText: { color: c.textPrimary, ...type.pill },
  subject: { color: c.textPrimary, ...type.primary, marginTop: spacing.md },
  questionBox: { marginTop: 10, backgroundColor: c.raised, borderRadius: radius.lg, padding: spacing.md },
  questionMicro: { color: c.micro, ...type.micro },
  question: { color: c.textPrimary, ...type.secondary, marginTop: 6, fontStyle: 'italic' },
  cta: { color: c.textSecondary, ...type.pill, marginTop: 10 },
  statRow: { flexDirection: 'row', gap: 18, marginTop: spacing.md },
  stat: {},
  statValue: { color: c.textPrimary, ...type.primary, fontVariant: ['tabular-nums'] },
  statLabel: { color: c.micro, ...type.micro, marginTop: 2 },
  viewOnly: { color: c.textTertiary, ...type.micro, textTransform: 'none', letterSpacing: 0, marginTop: 10 },
  exitRow: { flexDirection: 'row', backgroundColor: c.card, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.lg, padding: spacing.card, marginBottom: spacing.cardGap },
  exitLabelRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  exitLabel: { color: c.textPrimary, ...type.primary },
  provisionalPill: { borderWidth: 1, borderColor: '#F0B42966', backgroundColor: '#F0B4291A', borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  provisionalText: { color: statusText.warning, ...type.pill, fontSize: 10 },
  exitTrigger: { color: c.textSecondary, ...type.secondary, marginTop: 6 },
});
