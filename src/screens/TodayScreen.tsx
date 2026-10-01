import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer, useScreenPadding } from '../components/ScreenContainer';
import { ScreenHeader } from '../components/ScreenHeader';
import { SkeletonList } from '../components/StateViews';
import { ActionErrorBanner, EmptyState, ErrorState } from '../components/StateViews';
import { TaskCard } from '../components/TaskCard';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { api } from '../api/client';
import { describeApiError, useAuth } from '../auth/AuthContext';
import { c, spacing, type } from '../theme';
import { useT } from '../i18n';
import type { TodayStackParamList } from '../navigation/types';
import type { Task } from '../api/types';

type Nav = NativeStackNavigationProp<TodayStackParamList, 'Today'>;
type FailedAction = { task: Task; kind: 'complete' | 'snooze' };

export default function TodayScreen() {
  const screenPadding = useScreenPadding();
  const nav = useNavigation<Nav>();
  const { me } = useAuth();
  const t = useT();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [lastFailed, setLastFailed] = useState<FailedAction | null>(null);

  const fetchPage = useCallback((page: number) => api.getToday(page, 20), []);
  const list = usePaginatedList<Task>(fetchPage, [me?.id]);

  const complete = async (task: Task) => {
    setBusyId(task.id);
    setActionError(null);
    try {
      await api.patchTask(task.id, { action: 'complete' });
      list.removeItem((t) => t.id === task.id);
      setLastFailed(null);
    } catch (e) {
      // The card stays, the failure is shown, and the same action can be retried.
      setActionError(describeApiError(e));
      setLastFailed({ task, kind: 'complete' });
    } finally {
      setBusyId(null);
    }
  };

  const snooze = async (task: Task) => {
    setBusyId(task.id);
    setActionError(null);
    try {
      const until = new Date();
      until.setDate(until.getDate() + 1);
      await api.patchTask(task.id, { action: 'snooze', until: until.toISOString() });
      list.removeItem((t) => t.id === task.id);
      setLastFailed(null);
    } catch (e) {
      setActionError(describeApiError(e));
      setLastFailed({ task, kind: 'snooze' });
    } finally {
      setBusyId(null);
    }
  };

  const retryLastAction = () => {
    if (!lastFailed) return;
    if (lastFailed.kind === 'complete') complete(lastFailed.task);
    else snooze(lastFailed.task);
  };

  return (
    <ScreenContainer>
      <ScreenHeader
        title={t('today.title')}
        subtitle={me ? t('today.subtitle', { count: list.total, name: me.name }) : undefined}
      />

      {!!actionError && (
        <View style={{ paddingHorizontal: screenPadding, marginBottom: spacing.cardGap }}>
          <ActionErrorBanner message={actionError} onRetry={retryLastAction} onDismiss={() => setActionError(null)} />
        </View>
      )}

      {list.status === 'loading' && <SkeletonList />}

      {list.status === 'error' && <ErrorState message={list.error ?? t('today.loadFailed')} onRetry={list.reload} />}

      {list.status === 'ready' && (
        <FlatList
          data={list.items}
          keyExtractor={(t) => t.id}
          contentContainerStyle={[s.listContent, { paddingHorizontal: screenPadding }]}
          refreshControl={<RefreshControl tintColor={c.yellow} refreshing={list.refreshing} onRefresh={list.refresh} />}
          onEndReachedThreshold={0.4}
          onEndReached={list.loadMore}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              busy={busyId === item.id}
              onPressLead={() => nav.navigate('LeadDetail', { leadId: item.lead_id })}
              onComplete={() => complete(item)}
              onSnooze={() => snooze(item)}
            />
          )}
          ListEmptyComponent={<EmptyState title={t('today.emptyTitle')} body={t('today.emptyBody')} />}
          ListFooterComponent={list.loadingMore ? <Text style={s.loadingMore}>{t('common.loadingMore')}</Text> : null}
        />
      )}
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  listContent: { paddingTop: 4, flexGrow: 1 },
  loadingMore: { color: c.micro, ...type.micro, textAlign: 'center', paddingVertical: 16 },
});
