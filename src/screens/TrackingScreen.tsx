import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenContainer, useIsTablet, useScreenPadding } from '../components/ScreenContainer';
import { ScreenHeader } from '../components/ScreenHeader';
import { SectionHeader } from '../components/SectionHeader';
import { EmptyState, ErrorState, SkeletonBar, SkeletonList } from '../components/StateViews';
import { Explain, ExplainModeToggle } from '../components/ExplainMode';
import { LeadDetailContent } from '../components/LeadDetailContent';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcuts';
import { useMasterDetail, useMasterDetailList, useMasterDetailListValue } from '../navigation/MasterDetail';
import { api } from '../api/client';
import { describeApiError } from '../auth/AuthContext';
import { c, MAX_CONTENT_WIDTH, radius, spacing, status, statusText, type } from '../theme';
import type { ActivityEvent, ScoringModel } from '../api/types';
import { relativeFromNow } from '../utils/dates';
import { pickBilingual, useLanguage, useT } from '../i18n';

/** Tracking hosts inside whichever stack the navigation agent wires it into — every existing stack
 * already has a `LeadDetail` route with a `leadId` param, so this is intentionally loosely typed
 * rather than importing from `src/navigation/types` (owned by the navigation agent). */
type LooseNav = { navigate: (screen: 'LeadDetail', params: { leadId: string }) => void };

export default function TrackingScreen() {
  const screenPadding = useScreenPadding();
  const isTablet = useIsTablet();
  const isFocused = useIsFocused();
  const nav = useNavigation() as unknown as LooseNav;
  const [lang] = useLanguage();
  const t = useT();

  // SPEC-V2 §11 master-detail — 'tracking' is the key MasterDetail.tsx reserves for exactly this
  // screen ("feed + selected lead"). The detail pane reuses `LeadDetailContent` — the same component
  // LeadDetailScreen pushes — rather than a second lead-detail implementation.
  const [selectedId, setSelectedId] = useMasterDetail('tracking');

  const [modelStatus, setModelStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [model, setModel] = useState<ScoringModel | null>(null);
  const [modelError, setModelError] = useState<string | null>(null);

  const loadModel = useCallback(async () => {
    setModelStatus('loading');
    setModelError(null);
    try {
      const res = await api.getScoringModel();
      setModel(res);
      setModelStatus('ready');
    } catch (e) {
      setModelError(describeApiError(e));
      setModelStatus('error');
    }
  }, []);

  useEffect(() => {
    loadModel();
  }, [loadModel]);

  const fetchPage = useCallback((page: number) => api.getActivity(page, 20), []);
  const feed = usePaginatedList<ActivityEvent>(fetchPage, []);

  // Feeds the shared ↑/↓ shortcuts an ordered id list — one entry per feed row (not de-duplicated by
  // lead: several rows can point at the same lead, and arrow-key navigation should move row by row,
  // matching what's actually on screen). See src/navigation/MasterDetail.tsx.
  useMasterDetailList('tracking', feed.status === 'ready' ? feed.items.map((e) => e.lead_id) : []);
  const orderedIds = useMasterDetailListValue('tracking');

  useEffect(() => {
    if (isTablet && !selectedId && feed.status === 'ready' && feed.items.length > 0) {
      setSelectedId(feed.items[0].lead_id);
    }
  }, [isTablet, selectedId, feed.status, feed.items, setSelectedId]);

  const openLead = (leadId: string) => {
    if (isTablet) setSelectedId(leadId);
    else nav.navigate('LeadDetail', { leadId });
  };

  const moveSelection = (delta: number) => {
    if (!orderedIds.length) return;
    const currentIndex = selectedId ? orderedIds.indexOf(selectedId) : -1;
    const nextIndex = Math.min(orderedIds.length - 1, Math.max(0, currentIndex + delta));
    setSelectedId(orderedIds[nextIndex]);
  };
  // SPEC §11 ↑/↓ move selection, ↵ open. Gated on this screen being focused — routes stay mounted
  // when tabbed away (react-navigation's detachInactiveScreens default), so without this guard
  // Tracking's arrow-key handling would still fire while another tab is on screen.
  useKeyboardShortcut('arrowdown', () => moveSelection(1), isFocused && isTablet);
  useKeyboardShortcut('arrowup', () => moveSelection(-1), isFocused && isTablet);
  useKeyboardShortcut('enter', () => selectedId && openLead(selectedId), isFocused);
  useKeyboardShortcut('escape', () => setSelectedId(null), isFocused && isTablet && !!selectedId);

  const behaviourRules = model?.rules.filter((r) => r.group === 'behaviour') ?? [];
  const factRules = model?.rules.filter((r) => r.group === 'fact') ?? [];

  const body = (
    <>
      <ScreenHeader
        title={t('tracking.title')}
        subtitle={model ? t('tracking.subtitle', { count: model.crossed_this_week }) : undefined}
        right={<ExplainModeToggle />}
      />

      <FlatList
        data={feed.status === 'ready' ? feed.items : []}
        keyExtractor={(e) => e.id}
        contentContainerStyle={[s.listContent, { paddingHorizontal: screenPadding }]}
        refreshControl={<RefreshControl tintColor={c.yellow} refreshing={feed.refreshing} onRefresh={feed.refresh} />}
        onEndReachedThreshold={0.4}
        onEndReached={feed.loadMore}
        ListHeaderComponent={
          <View>
            {/* Threshold marker */}
            <Explain en={t('tracking.thresholdExplainEn')} ja={t('tracking.thresholdExplainJa')} formula="threshold = 40 (tunable, app/scoring.py: threshold())">
              <View style={s.thresholdCard}>
                <Text style={s.thresholdMicro}>{t('tracking.thresholdLabel')}</Text>
                <View style={s.thresholdRow}>
                  <Text style={s.thresholdValue}>{model?.threshold ?? 40}</Text>
                  <Text style={s.thresholdNote}>
                    {t('tracking.thresholdNote', {
                      extra: model
                        ? t('tracking.thresholdNoteExtra', { count: model.crossed_this_week, s: model.crossed_this_week === 1 ? '' : 's' })
                        : '',
                    })}
                  </Text>
                </View>
              </View>
            </Explain>

            {/* Scoring model panel */}
            <View style={{ marginTop: spacing.section }}>
              <SectionHeader title={t('tracking.scoringModel')} count={model?.rules.length} />
              {modelStatus === 'loading' && (
                <View style={s.modelSkeleton}>
                  <SkeletonBar width="70%" height={12} />
                  <SkeletonBar width="90%" height={12} style={{ marginTop: 10 }} />
                  <SkeletonBar width="60%" height={12} style={{ marginTop: 10 }} />
                </View>
              )}
              {modelStatus === 'error' && <ErrorState message={modelError ?? t('tracking.loadModelFailed')} onRetry={loadModel} />}
              {modelStatus === 'ready' && model && (
                <View style={s.modelCard}>
                  <Text style={s.groupLabel}>{t('tracking.behaviourGroup')}</Text>
                  {behaviourRules.map((r) => (
                    <RuleRow key={r.kind} label={pickBilingual(lang, r.label, r.label_ja)} points={r.points} group="behaviour" />
                  ))}
                  <Text style={[s.groupLabel, { marginTop: spacing.md }]}>{t('tracking.factGroup')}</Text>
                  {factRules.map((r) => (
                    <RuleRow key={r.kind} label={pickBilingual(lang, r.label, r.label_ja)} points={r.points} group="fact" />
                  ))}
                  <View style={s.decayNote}>
                    <Text style={s.decayNoteText}>{pickBilingual(lang, model.decay_note, model.decay_note_ja)}</Text>
                  </View>
                </View>
              )}
            </View>

            <View style={{ marginTop: spacing.section, marginBottom: spacing.card }}>
              <SectionHeader title={t('tracking.liveActivity')} count={feed.status === 'ready' ? feed.total : undefined} />
            </View>
          </View>
        }
        ListEmptyComponent={
          feed.status === 'loading' ? (
            <SkeletonList />
          ) : feed.status === 'error' ? (
            <ErrorState message={feed.error ?? t('tracking.loadFeedFailed')} onRetry={feed.reload} />
          ) : (
            <EmptyState title={t('tracking.noActivityYet')} body={t('tracking.noActivityBody')} />
          )
        }
        ListFooterComponent={feed.loadingMore ? <Text style={s.loadingMore}>{t('common.loadingMore')}</Text> : null}
        renderItem={({ item }) => {
          const selected = isTablet && item.lead_id === selectedId;
          return (
            <Pressable onPress={() => openLead(item.lead_id)} style={({ pressed }) => [s.feedRow, selected && s.feedRowSelected, pressed && { opacity: 0.8 }]}>
              <View style={{ flex: 1 }}>
                <Text style={s.feedName}>{pickBilingual(lang, item.lead_name, item.lead_name_ja)}</Text>
                <Text style={s.feedLabel}>{pickBilingual(lang, item.label, item.label_ja)}</Text>
                <Text style={s.feedMeta}>
                  {relativeFromNow(item.at, lang)}
                  {item.campaign ? ` · ${pickBilingual(lang, item.campaign, item.campaign_ja)}` : ''}
                </Text>
              </View>
              <View style={s.feedScoreCol}>
                <Text style={[s.feedPoints, item.points >= 20 && { color: statusText.warning }]}>+{item.points}</Text>
                <Text style={s.feedScoreAfter}>→ {item.score_after}</Text>
              </View>
            </Pressable>
          );
        }}
      />
    </>
  );

  if (!isTablet) {
    return <ScreenContainer>{body}</ScreenContainer>;
  }

  // iPad regular width: feed + selected lead, same split pattern as LeadsScreen.
  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <View style={s.splitRow}>
        <View style={s.splitList}>{body}</View>
        <View style={[s.splitDetail, { paddingHorizontal: screenPadding }]}>
          {selectedId ? (
            <LeadDetailContent leadId={selectedId} />
          ) : (
            <EmptyState title={t('tracking.selectLead')} body={t('tracking.selectLeadBody')} />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

function RuleRow({ label, points, group }: { label: string; points: number; group: 'behaviour' | 'fact' }) {
  const t = useT();
  return (
    <Explain
      en={t('tracking.ruleExplainEn', { label, points, decay: t(group === 'behaviour' ? 'tracking.ruleExplainDecayBehaviour' : 'tracking.ruleExplainDecayFact') })}
      ja={t('tracking.ruleExplainJa', { label, points, decay: t(group === 'behaviour' ? 'tracking.ruleExplainDecayBehaviourJa' : 'tracking.ruleExplainDecayFactJa') })}
    >
      <View style={s.ruleRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.ruleLabel}>{label}</Text>
        </View>
        <Text style={s.rulePoints}>+{points}</Text>
      </View>
    </Explain>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.page },
  listContent: { paddingTop: spacing.md, paddingBottom: 60, flexGrow: 1 },
  thresholdCard: { backgroundColor: c.card, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.card, padding: spacing.card },
  thresholdMicro: { color: c.micro, ...type.micro },
  thresholdRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: 8 },
  thresholdValue: { color: statusText.warning, fontSize: 34, fontWeight: '700', fontVariant: ['tabular-nums'] },
  thresholdNote: { flex: 1, color: c.textSecondary, ...type.secondary },
  modelSkeleton: { backgroundColor: c.card, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.card, padding: spacing.card, marginTop: spacing.card },
  modelCard: { backgroundColor: c.card, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.card, padding: spacing.card, marginTop: spacing.card },
  groupLabel: { color: c.textSecondary, ...type.pill, marginBottom: 8 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.hairline },
  ruleLabel: { color: c.textPrimary, ...type.secondary },
  rulePoints: { color: c.textPrimary, ...type.pill, fontVariant: ['tabular-nums'] },
  decayNote: { marginTop: spacing.md, backgroundColor: c.raised, borderRadius: radius.lg, padding: spacing.md },
  decayNoteText: { color: c.textSecondary, ...type.secondary },
  feedRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.lg, padding: spacing.card, marginBottom: spacing.cardGap, gap: spacing.md },
  feedRowSelected: { borderColor: c.yellow },
  feedName: { color: c.textPrimary, ...type.primary },
  feedLabel: { color: c.textSecondary, ...type.secondary, marginTop: 4 },
  feedMeta: { color: c.micro, ...type.micro, textTransform: 'none', letterSpacing: 0, marginTop: 4 },
  feedScoreCol: { alignItems: 'flex-end' },
  feedPoints: { color: c.textPrimary, ...type.pill, fontVariant: ['tabular-nums'] },
  feedScoreAfter: { color: c.micro, ...type.micro, textTransform: 'none', letterSpacing: 0, marginTop: 3, fontVariant: ['tabular-nums'] },
  loadingMore: { color: c.micro, ...type.micro, textAlign: 'center', paddingVertical: 16 },
  splitRow: { flex: 1, flexDirection: 'row' },
  splitList: { width: MAX_CONTENT_WIDTH, borderRightWidth: 1, borderRightColor: c.hairline },
  splitDetail: { flex: 1, paddingVertical: spacing.screen },
});
