import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ScreenContainer, useScreenPadding } from '../components/ScreenContainer';
import { ScreenHeader } from '../components/ScreenHeader';
import { SectionHeader } from '../components/SectionHeader';
import { ErrorState, ForbiddenNotice, SkeletonList } from '../components/StateViews';
import { Explain, ExplainModeToggle } from '../components/ExplainMode';
import { api } from '../api/client';
import { describeApiError, useAuth } from '../auth/AuthContext';
import { c, radius, spacing, status, statusText, type } from '../theme';
import type { SnsFunnelResponse, SnsPatternsResponse } from '../api/types';
import { pickBilingual, useLanguage, useT } from '../i18n';

const PATTERN_COLOR: Record<string, string> = { A: '#3DBFB0', B: status.info, C: status.success, D: status.warning };
const PATTERN_TEXT_COLOR: Record<string, string> = { A: '#1E7A6E', B: statusText.info, C: statusText.success, D: statusText.warning };

export default function SnsScreen() {
  const screenPadding = useScreenPadding();
  const { can } = useAuth();
  const [lang] = useLanguage();
  const t = useT();

  const [screenStatus, setScreenStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [patterns, setPatterns] = useState<SnsPatternsResponse | null>(null);
  const [funnel, setFunnel] = useState<SnsFunnelResponse | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setScreenStatus('loading');
    setError(null);
    try {
      const [p, f] = await Promise.all([api.getSnsPatterns(), api.getSnsFunnel()]);
      setPatterns(p);
      setFunnel(f);
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

  if (!can('sns.view')) {
    return (
      <ScreenContainer>
        <ScreenHeader title={t('sns.title')} />
        <ForbiddenNotice message={t('sns.forbidden')} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer wide>
      <ScreenHeader title={t('sns.title')} right={<ExplainModeToggle />} />

      {screenStatus === 'loading' && <SkeletonList count={4} />}
      {screenStatus === 'error' && <ErrorState message={error ?? t('sns.loadFailed')} onRetry={() => load()} />}

      {screenStatus === 'ready' && patterns && funnel && (
        <ScrollView
          contentContainerStyle={[s.content, { paddingHorizontal: screenPadding }]}
          refreshControl={<RefreshControl tintColor={c.yellow} refreshing={refreshing} onRefresh={() => load(true)} />}
        >
          {/* Funnel diagram */}
          <View style={s.funnelCard}>
            <SectionHeader title={t('sns.funnel')} />
            <View style={s.funnelRow}>
              {funnel.steps.map((step, i) => {
                const label = pickBilingual(lang, step.label, step.label_ja);
                return (
                  <React.Fragment key={step.key}>
                    <Explain
                      en={t('sns.funnelExplainEn', { label: step.label, count: step.count })}
                      ja={t('sns.funnelExplainJa', { label: step.label_ja, count: step.count })}
                    >
                      <View style={s.funnelStep}>
                        <Text style={s.funnelCount}>{step.count}</Text>
                        <Text style={s.funnelLabel}>{label}</Text>
                        {/* An untracked step's number was typed in by a person, not measured.
                            Without this marker a hand-entered 148 sits beside a measured 7 and
                            reads exactly as trustworthy. */}
                        {!step.tracked && <Text style={s.funnelUntracked}>{t('sns.notTracked')}</Text>}
                      </View>
                    </Explain>
                    {i < funnel.steps.length - 1 && (
                      <Svg width={16} height={12} viewBox="0 0 16 12" style={{ marginTop: 8 }}>
                        <Path d="M1 6h13m0 0-4-4m4 4-4 4" stroke={c.textTertiary} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    )}
                  </React.Fragment>
                );
              })}
            </View>
          </View>

          {/* Pattern cards A-D */}
          {patterns.patterns.map((p) => (
            <View key={p.key} style={s.patternCard}>
              <View style={s.patternHead}>
                <View style={[s.patternBadge, { backgroundColor: `${PATTERN_COLOR[p.key]}1F`, borderColor: `${PATTERN_COLOR[p.key]}55` }]}>
                  <Text style={[s.patternBadgeText, { color: PATTERN_TEXT_COLOR[p.key] }]}>{t('sns.pattern', { key: p.key })}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.patternName}>{pickBilingual(lang, p.name, p.name_ja)}</Text>
                </View>
              </View>
              {p.ideas.map((idea, i) => (
                <View key={i} style={s.ideaRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.ideaTitle}>{pickBilingual(lang, idea.title, idea.title_ja)}</Text>
                    <Text style={s.ideaHook}>{pickBilingual(lang, idea.hook, idea.hook_ja)}</Text>
                  </View>
                  <View style={s.ctaPill}>
                    <Text style={s.ctaPillText}>{pickBilingual(lang, idea.cta, idea.cta_ja)}</Text>
                  </View>
                </View>
              ))}
              <Text style={s.patternNote}>{pickBilingual(lang, p.note, p.note_ja)}</Text>
              <Text style={s.leadsProduced}>
                {p.leads_produced === null ? t('sns.leadsProducedUnknown') : t('sns.leadsProduced', { count: p.leads_produced })}
              </Text>
            </View>
          ))}

          <View style={s.attributionBox}>
            <Text style={s.attributionText}>
              {t('sns.totalLeads', { count: patterns.total_sns_leads, s: patterns.total_sns_leads === 1 ? '' : 's' })}
            </Text>
            <Text style={s.attributionNote}>{pickBilingual(lang, patterns.attribution_note, patterns.attribution_note_ja)}</Text>
          </View>
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  content: { paddingTop: spacing.md, paddingBottom: 60 },
  funnelCard: { backgroundColor: c.card, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.card, padding: spacing.card, marginBottom: spacing.section },
  funnelRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: spacing.card, gap: 4 },
  funnelStep: { alignItems: 'center', width: 82 },
  funnelCount: { color: c.textPrimary, fontSize: 20, fontWeight: '700', fontVariant: ['tabular-nums'] },
  funnelLabel: { color: c.textSecondary, ...type.micro, textTransform: 'none', letterSpacing: 0, marginTop: 4, textAlign: 'center' },
  funnelUntracked: { color: c.textTertiary, fontSize: 9, fontWeight: '600', marginTop: 3, textAlign: 'center', fontStyle: 'italic' },
  patternCard: { backgroundColor: c.card, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.card, padding: spacing.card, marginBottom: spacing.cardGap },
  patternHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  patternBadge: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  patternBadgeText: { ...type.pill },
  patternName: { color: c.textPrimary, ...type.primary },
  ideaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingVertical: 8, borderTopWidth: 1, borderTopColor: c.hairline },
  ideaTitle: { color: c.textPrimary, ...type.secondary, fontWeight: '600' },
  ideaHook: { color: c.textSecondary, ...type.micro, textTransform: 'none', letterSpacing: 0, marginTop: 4 },
  ctaPill: { borderWidth: 1, borderColor: c.hairline, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: c.raised },
  ctaPillText: { color: c.textSecondary, ...type.pill, fontSize: 10 },
  patternNote: { color: c.textSecondary, ...type.micro, textTransform: 'none', letterSpacing: 0, marginTop: spacing.md },
  leadsProduced: { color: c.textTertiary, ...type.micro, textTransform: 'none', letterSpacing: 0, marginTop: 8 },
  attributionBox: { borderWidth: 1, borderStyle: 'dashed', borderColor: c.hairline, borderRadius: radius.lg, padding: spacing.card },
  attributionText: { color: c.textPrimary, ...type.secondary },
  attributionNote: { color: c.textSecondary, ...type.micro, textTransform: 'none', letterSpacing: 0, marginTop: 8 },
});
