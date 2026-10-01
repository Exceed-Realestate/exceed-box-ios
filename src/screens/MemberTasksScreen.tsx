import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer, useScreenPadding } from '../components/ScreenContainer';
import { ScreenHeader } from '../components/ScreenHeader';
import { ActionErrorBanner, EmptyState, ErrorState, SkeletonList } from '../components/StateViews';
import { TaskCard } from '../components/TaskCard';
import { PickerSheet } from '../components/PickerSheet';
import { api } from '../api/client';
import { describeApiError } from '../auth/AuthContext';
import { c, spacing } from '../theme';
import { useT } from '../i18n';
import type { TeamStackParamList } from '../navigation/types';
import type { Task, TeamMember } from '../api/types';

type Nav = NativeStackNavigationProp<TeamStackParamList, 'MemberTasks'>;
type Rt = RouteProp<TeamStackParamList, 'MemberTasks'>;

export default function MemberTasksScreen() {
  const screenPadding = useScreenPadding();
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { userId } = route.params;
  const t = useT();

  const [screenStatus, setScreenStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [member, setMember] = useState<TeamMember | null>(null);
  const [allMembers, setAllMembers] = useState<TeamMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reassignTask, setReassignTask] = useState<Task | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [lastFailed, setLastFailed] = useState<{ kind: 'complete' | 'snooze'; task: Task } | null>(null);
  const [reassignError, setReassignError] = useState<string | null>(null);
  const [lastReassignOwnerId, setLastReassignOwnerId] = useState<string | null>(null);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setScreenStatus('loading');
      setError(null);
      try {
        // The reassign picker needs the whole roster, not one page of it — the office is
        // ~10-15 people (SPEC), so one generous page covers it.
        const res = await api.getTeam(1, 200);
        setAllMembers(res.data);
        const found = res.data.find((m) => m.user_id === userId) ?? null;
        setMember(found);
        setScreenStatus('ready');
      } catch (e) {
        setError(describeApiError(e));
        setScreenStatus('error');
      } finally {
        setRefreshing(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    load();
  }, [load]);

  const complete = async (task: Task) => {
    setBusyId(task.id);
    setActionError(null);
    try {
      await api.patchTask(task.id, { action: 'complete' });
      await load(true);
      setLastFailed(null);
    } catch (e) {
      setActionError(describeApiError(e));
      setLastFailed({ kind: 'complete', task });
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
      await load(true);
      setLastFailed(null);
    } catch (e) {
      setActionError(describeApiError(e));
      setLastFailed({ kind: 'snooze', task });
    } finally {
      setBusyId(null);
    }
  };

  const reassign = async (ownerId: string) => {
    if (!reassignTask) return;
    const task = reassignTask;
    setBusyId(task.id);
    setReassignError(null);
    setLastReassignOwnerId(ownerId);
    try {
      await api.patchTask(task.id, { action: 'reassign', owner_user_id: ownerId });
      setReassignTask(null);
      setReassignError(null);
      await load(true);
    } catch (e) {
      // Preserve list and picker state — the sheet stays open on the same task, error shown inline.
      setReassignError(describeApiError(e));
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
        title={member?.name ?? t('memberTasks.title')}
        subtitle={member ? t('memberTasks.subtitle', { count: member.tasks.length, s: member.tasks.length === 1 ? '' : 's' }) : undefined}
      />

      {!!actionError && (
        <View style={{ paddingHorizontal: screenPadding, marginBottom: spacing.cardGap }}>
          <ActionErrorBanner message={actionError} onRetry={retryLastAction} onDismiss={() => setActionError(null)} />
        </View>
      )}

      {screenStatus === 'loading' && <SkeletonList />}
      {screenStatus === 'error' && <ErrorState message={error ?? t('memberTasks.loadFailed')} onRetry={() => load()} />}

      {screenStatus === 'ready' && !member && <ErrorState message={t('memberTasks.notFound')} onRetry={() => load()} />}

      {screenStatus === 'ready' && member && (
        <FlatList
          data={member.tasks}
          keyExtractor={(t) => t.id}
          contentContainerStyle={[s.listContent, { paddingHorizontal: screenPadding, flexGrow: 1 }]}
          refreshControl={<RefreshControl tintColor={c.yellow} refreshing={refreshing} onRefresh={() => load(true)} />}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              busy={busyId === item.id}
              onPressLead={() => nav.navigate('LeadDetail', { leadId: item.lead_id })}
              onComplete={() => complete(item)}
              onSnooze={() => snooze(item)}
              onReassign={() => { setReassignError(null); setReassignTask(item); }}
            />
          )}
          ListEmptyComponent={
            <EmptyState title={t('memberTasks.emptyTitle')} body={t('memberTasks.emptyBody', { name: member.name })} />
          }
        />
      )}

      <PickerSheet
        visible={!!reassignTask}
        title={t('memberTasks.reassignTo')}
        options={allMembers.filter((m) => m.user_id !== userId).map((m) => ({ key: m.user_id, label: m.name }))}
        onClose={() => { setReassignTask(null); setReassignError(null); }}
        onSelect={reassign}
        error={reassignError}
        onRetry={lastReassignOwnerId ? () => reassign(lastReassignOwnerId) : undefined}
        loading={!!busyId && !!reassignTask}
      />
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  listContent: { paddingTop: 4 },
});
