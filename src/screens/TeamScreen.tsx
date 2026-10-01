import React, { useCallback } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer, useScreenPadding } from '../components/ScreenContainer';
import { ScreenHeader } from '../components/ScreenHeader';
import { EmptyState, ErrorState, SkeletonList } from '../components/StateViews';
import { roleLabel } from '../components/Badges';
import { ProgressBar } from '../components/ProgressBar';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { api } from '../api/client';
import { c, radius, spacing, status, statusText, type } from '../theme';
import { useT } from '../i18n';
import type { TeamStackParamList } from '../navigation/types';
import type { TeamMember } from '../api/types';

type Nav = NativeStackNavigationProp<TeamStackParamList, 'Team'>;

export default function TeamScreen() {
  const screenPadding = useScreenPadding();
  const nav = useNavigation<Nav>();
  const t = useT();

  const fetchPage = useCallback((page: number) => api.getTeam(page, 20), []);
  const list = usePaginatedList<TeamMember>(fetchPage, []);

  return (
    <ScreenContainer>
      <ScreenHeader title={t('team.title')} subtitle={t('team.subtitle', { count: list.total, s: list.total === 1 ? '' : 's' })} />

      {list.status === 'loading' && <SkeletonList />}
      {list.status === 'error' && <ErrorState message={list.error ?? t('team.loadFailed')} onRetry={list.reload} />}

      {list.status === 'ready' && (
        <FlatList
          data={list.items}
          keyExtractor={(m) => m.user_id}
          contentContainerStyle={[s.content, { paddingHorizontal: screenPadding, flexGrow: 1 }]}
          refreshControl={<RefreshControl tintColor={c.yellow} refreshing={list.refreshing} onRefresh={list.refresh} />}
          onEndReachedThreshold={0.4}
          onEndReached={list.loadMore}
          ListEmptyComponent={<EmptyState title={t('team.emptyTitle')} body={t('team.emptyBody')} />}
          ListFooterComponent={list.loadingMore ? <Text style={s.loadingMore}>{t('common.loadingMore')}</Text> : null}
          renderItem={({ item: m }) => {
            const role = roleLabel(m.role, t);
            return (
              <Pressable
                onPress={() => nav.navigate('MemberTasks', { userId: m.user_id })}
                style={({ pressed }) => [s.card, pressed && { opacity: 0.85 }, !m.is_active && { opacity: 0.55 }]}
              >
                <View style={s.headRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.name}>{m.name}</Text>
                    <Text style={s.meta}>
                      {role} · {m.office === 'tokyo' ? t('team.officeTokyo') : t('team.officeDubai')}
                      {!m.is_active ? t('team.inactive') : ''}
                    </Text>
                  </View>
                  {m.tasks_escalated > 0 && (
                    <View style={s.escalatedPill}>
                      <Text style={s.escalatedPillText}>{t('team.escalated', { count: m.tasks_escalated })}</Text>
                    </View>
                  )}
                </View>
                <View style={s.statRow}>
                  <Stat label={t('team.statLeads')} value={m.leads_owned} />
                  <Stat label={t('team.statOpenTasks')} value={m.tasks_open} />
                  <Stat label={t('team.statOverdue')} value={m.tasks_overdue} danger={m.tasks_overdue > 0} />
                  <Stat label={t('team.statBooked')} value={m.meetings_booked} />
                  <Stat label={t('team.statWon')} value={m.won} />
                </View>
                <View style={s.progressWrap}>
                  <ProgressBar
                    value={m.won}
                    max={m.leads_owned}
                    color={status.success}
                    label={t('team.wonOverOwned')}
                    valueLabel={`${m.won}/${m.leads_owned}`}
                  />
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </ScreenContainer>
  );
}

function Stat({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <View style={s.stat}>
      <Text style={[s.statValue, danger && { color: statusText.danger }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  content: { paddingTop: 4, paddingBottom: 60 },
  loadingMore: { color: c.micro, ...type.micro, textAlign: 'center', paddingVertical: 16 },
  card: { backgroundColor: c.card, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.card, padding: spacing.card, marginBottom: spacing.cardGap },
  headRow: { flexDirection: 'row', alignItems: 'flex-start' },
  name: { color: c.textPrimary, ...type.primary },
  meta: { color: c.textSecondary, ...type.secondary, marginTop: 3 },
  escalatedPill: { backgroundColor: '#F45B691A', borderColor: '#F45B6940', borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  escalatedPillText: { color: statusText.danger, ...type.pill, fontVariant: ['tabular-nums'] },
  statRow: { flexDirection: 'row', marginTop: spacing.card, gap: 8 },
  stat: { flex: 1, alignItems: 'flex-start' },
  statValue: { color: c.textPrimary, ...type.primary, fontVariant: ['tabular-nums'] },
  statLabel: { color: c.micro, ...type.micro, marginTop: 2 },
  progressWrap: { marginTop: spacing.card },
});
