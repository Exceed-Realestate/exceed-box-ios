import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer, useScreenPadding } from '../components/ScreenContainer';
import { ScreenHeader } from '../components/ScreenHeader';
import { ErrorState, SkeletonList } from '../components/StateViews';
import { ScoreBadge } from '../components/Badges';
import { PickerSheet } from '../components/PickerSheet';
import { SectionHeader } from '../components/SectionHeader';
import { api } from '../api/client';
import { describeApiError, useAuth } from '../auth/AuthContext';
import { canMoveStage } from '../auth/permissions';
import { ALL_STAGES, stageLabel } from '../api/mocks';
import { c, radius, spacing, type } from '../theme';
import { pickBilingual, pickPair, useLanguage, useT } from '../i18n';
import type { PipelineStackParamList } from '../navigation/types';
import type { LeadStage, LeadSummary, PipelineResponse } from '../api/types';
import Svg, { Path } from 'react-native-svg';

type Nav = NativeStackNavigationProp<PipelineStackParamList, 'Pipeline'>;

const COLUMN_WIDTH = 300;

export default function PipelineScreen() {
  const screenPadding = useScreenPadding();
  const nav = useNavigation<Nav>();
  const { me, can } = useAuth();
  const [lang] = useLanguage();
  const t = useT();
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [data, setData] = useState<PipelineResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [moveTarget, setMoveTarget] = useState<LeadSummary | null>(null);
  const [moving, setMoving] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [lastStage, setLastStage] = useState<LeadStage | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setStatus('loading');
    setError(null);
    try {
      const res = await api.getPipeline();
      setData(res);
      setStatus('ready');
    } catch (e) {
      setError(describeApiError(e));
      setStatus('error');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const total = data?.buckets.reduce((a, b) => a + b.count, 0) ?? 0;
  const scopeNote = can('leads.view_all') ? t('pipeline.scopeAll') : t('pipeline.scopeMine');

  const isOwnerOf = (lead: LeadSummary) => !!(me && lead.owner_user_id === me.id);

  const doMove = async (stage: LeadStage) => {
    if (!moveTarget) return;
    setMoving(true);
    setMoveError(null);
    setLastStage(stage);
    try {
      await api.setLeadStage(moveTarget.id, stage);
      setMoveTarget(null);
      setMoveError(null);
      await load(true);
    } catch (e) {
      // Keep the sheet's target and show what failed — a 403, 422, or network outage all get a
      // real message and a working retry, not a silently-closed picker.
      setMoveError(describeApiError(e));
    } finally {
      setMoving(false);
    }
  };

  return (
    <ScreenContainer wide>
      <ScreenHeader title={t('pipeline.title')} subtitle={t('pipeline.subtitle', { count: total, scope: scopeNote })} />

      {status === 'loading' && <SkeletonList />}
      {status === 'error' && <ErrorState message={error ?? t('pipeline.loadFailed')} onRetry={() => load()} />}

      {/* The buckets stay mounted even when the pipeline is entirely empty, so every column keeps
          its own pull-to-refresh — an empty pipeline must still be refreshable. */}
      {status === 'ready' && data && (
        <View style={{ flex: 1 }}>
          {total === 0 && (
            <View style={[s.emptyBanner, { marginHorizontal: screenPadding }]}>
              <Text style={s.emptyBannerTitle}>{t('pipeline.emptyTitle')}</Text>
              <Text style={s.emptyBannerBody}>{t('pipeline.emptyBody')}</Text>
            </View>
          )}
          <FlatList
            horizontal
            data={data.buckets}
            keyExtractor={(b) => b.stage}
            contentContainerStyle={{ paddingHorizontal: screenPadding }}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item: bucket }) => (
              <View style={s.column}>
                <View style={s.columnHeader}>
                  <SectionHeader title={pickBilingual(lang, bucket.label, bucket.label_ja)} count={bucket.count} />
                </View>
                <FlatList
                  data={bucket.leads}
                  keyExtractor={(l) => l.id}
                  refreshControl={<RefreshControl tintColor={c.yellow} refreshing={refreshing} onRefresh={() => load(true)} />}
                  contentContainerStyle={{ padding: spacing.sm, paddingTop: 0 }}
                  ListEmptyComponent={<Text style={s.columnEmpty}>{t('pipeline.noLeadsAtStage')}</Text>}
                  renderItem={({ item: lead }) => (
                    <Pressable
                      onPress={() => nav.navigate('LeadDetail', { leadId: lead.id })}
                      style={({ pressed }) => [s.card, pressed && { opacity: 0.85 }]}
                    >
                      <View style={s.cardTop}>
                        <Text style={s.cardName} numberOfLines={1}>
                          {lead.name}
                        </Text>
                        <ScoreBadge score={lead.score} />
                      </View>
                      <Text style={s.cardActivity} numberOfLines={2}>
                        {pickBilingual(lang, lead.activity_note, lead.activity_note_ja) || t('pipeline.noActivity')}
                      </Text>
                      <Text style={s.cardOwner}>{t('pipeline.ownerLine', { name: lead.owner_name ?? t('common.unassigned') })}</Text>
                      {canMoveStage(me?.role, isOwnerOf(lead)) && (
                        <Pressable onPress={() => { setMoveError(null); setMoveTarget(lead); }} style={s.moveBtn} hitSlop={6}>
                          <View style={s.moveDot} />
                          <Text style={s.moveBtnText}>{t('pipeline.moveStage')}</Text>
                          <Svg width={10} height={10} viewBox="0 0 10 10" fill="none">
                            <Path d="m2.5 4 2.5 2.5L7.5 4" stroke={c.textTertiary} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
                          </Svg>
                        </Pressable>
                      )}
                    </Pressable>
                  )}
                />
              </View>
            )}
          />
        </View>
      )}

      <PickerSheet
        visible={!!moveTarget}
        title={moveTarget ? t('pipeline.moveTitle', { name: moveTarget.name }) : ''}
        options={ALL_STAGES.filter((st) => st !== moveTarget?.stage).map((st) => ({ key: st, label: pickPair(lang, stageLabel(st)) }))}
        onClose={() => { setMoveTarget(null); setMoveError(null); }}
        onSelect={(key) => doMove(key as LeadStage)}
        error={moveError}
        onRetry={lastStage ? () => doMove(lastStage) : undefined}
        loading={moving}
      />
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  column: { width: COLUMN_WIDTH, marginRight: spacing.cardGap, backgroundColor: c.card, borderRadius: radius.card, borderWidth: 1, borderColor: c.hairline, maxHeight: '100%' },
  columnHeader: { padding: spacing.card },
  columnEmpty: { color: c.textTertiary, ...type.secondary, textAlign: 'center', paddingVertical: 20, marginBottom: spacing.cardGap, borderWidth: 1, borderStyle: 'dashed', borderColor: c.hairline, borderRadius: radius.lg },
  card: { backgroundColor: c.raised, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.lg, padding: spacing.card, marginBottom: spacing.cardGap },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardName: { color: c.textPrimary, ...type.primary, flex: 1 },
  cardActivity: { color: c.textSecondary, ...type.secondary, marginTop: 8 },
  cardOwner: { color: c.micro, ...type.micro, marginTop: 8 },
  moveBtn: { minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, alignSelf: 'flex-start', borderWidth: 1, borderColor: c.hairline, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 5 },
  moveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.yellow },
  moveBtnText: { color: c.textPrimary, ...type.pill },
  emptyBanner: { borderWidth: 1, borderStyle: 'dashed', borderColor: c.hairline, borderRadius: radius.card, padding: spacing.card, marginBottom: spacing.cardGap },
  emptyBannerTitle: { color: c.textPrimary, ...type.primary },
  emptyBannerBody: { color: c.textSecondary, ...type.secondary, marginTop: 8 },
});
