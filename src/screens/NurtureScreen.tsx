import React, { useCallback, useEffect } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenContainer, useIsTablet, useScreenPadding } from '../components/ScreenContainer';
import { ScreenHeader } from '../components/ScreenHeader';
import { EmptyState, ErrorState, ForbiddenNotice, SkeletonList } from '../components/StateViews';
import { NurtureSequenceDetailContent } from '../components/NurtureSequenceDetailContent';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcuts';
import { useMasterDetail, useMasterDetailList, useMasterDetailListValue } from '../navigation/MasterDetail';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { c, MAX_CONTENT_WIDTH, radius, spacing, status, type } from '../theme';
import type { SequenceSummary } from '../api/types';
import { pickBilingual, useLanguage, useT } from '../i18n';

type LooseNav = { navigate: (screen: 'NurtureSequenceDetail', params: { sequenceId: string }) => void };

export default function NurtureScreen() {
  const screenPadding = useScreenPadding();
  const isTablet = useIsTablet();
  const isFocused = useIsFocused();
  const nav = useNavigation() as unknown as LooseNav;
  const { can } = useAuth();
  const [lang] = useLanguage();
  const t = useT();

  // SPEC-V2 §11 master-detail — 'nurture' is the key MasterDetail.tsx reserves for exactly this
  // screen, so selection survives a width-class resize and a tab switch (see that file's header).
  const [selectedId, setSelectedId] = useMasterDetail('nurture');

  const fetchPage = useCallback((page: number) => api.getSequences(page, 20), []);
  const list = usePaginatedList<SequenceSummary>(fetchPage, []);

  // Feeds the shared ↑/↓ list-navigation shortcuts (below) an ordered id list to move through —
  // see src/navigation/MasterDetail.tsx.
  useMasterDetailList('nurture', list.status === 'ready' ? list.items.map((i) => i.id) : []);
  const orderedIds = useMasterDetailListValue('nurture');

  useEffect(() => {
    if (isTablet && !selectedId && list.items.length > 0) {
      setSelectedId(list.items[0].id);
    }
  }, [isTablet, selectedId, list.items, setSelectedId]);

  const openSequence = (id: string) => {
    if (isTablet) setSelectedId(id);
    else nav.navigate('NurtureSequenceDetail', { sequenceId: id });
  };

  // SPEC §11 ↑/↓ move selection, ↵ open. Gated to this screen actually being focused — routes stay
  // mounted when tabbed away (react-navigation's detachInactiveScreens default), so without this
  // guard Nurture's arrow-key handling would still fire while, say, Leads is on screen.
  const moveSelection = (delta: number) => {
    if (!orderedIds.length) return;
    const currentIndex = selectedId ? orderedIds.indexOf(selectedId) : -1;
    const nextIndex = Math.min(orderedIds.length - 1, Math.max(0, currentIndex + delta));
    setSelectedId(orderedIds[nextIndex]);
  };
  useKeyboardShortcut('arrowdown', () => moveSelection(1), isFocused && isTablet);
  useKeyboardShortcut('arrowup', () => moveSelection(-1), isFocused && isTablet);
  useKeyboardShortcut('enter', () => selectedId && openSequence(selectedId), isFocused);
  // Esc "closes" the detail pane back to empty — the master-detail equivalent of closing a sheet on
  // this screen, since Nurture has no modal sheet of its own to close.
  useKeyboardShortcut('escape', () => setSelectedId(null), isFocused && isTablet && !!selectedId);

  if (!can('nurture.view')) {
    return (
      <ScreenContainer>
        <ScreenHeader title={t('nurture.title')} />
        <ForbiddenNotice message={t('nurture.forbidden')} />
      </ScreenContainer>
    );
  }

  const body = (
    <>
      <ScreenHeader title={t('nurture.title')} subtitle={t('nurture.subtitle', { count: list.total, s: list.total === 1 ? '' : 's' })} />

      {list.status === 'loading' && <SkeletonList count={3} />}
      {list.status === 'error' && <ErrorState message={list.error ?? t('nurture.loadFailed')} onRetry={list.reload} />}

      {list.status === 'ready' && (
        <FlatList
          data={list.items}
          keyExtractor={(seq) => seq.id}
          contentContainerStyle={[s.content, { paddingHorizontal: screenPadding }]}
          refreshControl={<RefreshControl tintColor={c.yellow} refreshing={list.refreshing} onRefresh={list.refresh} />}
          onEndReachedThreshold={0.4}
          onEndReached={list.loadMore}
          ListEmptyComponent={<EmptyState title={t('nurture.emptyTitle')} body={t('nurture.emptyBody')} />}
          renderItem={({ item }) => {
            const selected = isTablet && item.id === selectedId;
            return (
              <Pressable onPress={() => openSequence(item.id)} style={({ pressed }) => [s.card, selected && s.cardSelected, pressed && { opacity: 0.85 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{pickBilingual(lang, item.name, item.name_ja)}</Text>
                  <Text style={s.meta}>{t('nurture.stepsSent', { steps: item.step_count, sent: item.total_sent.toLocaleString() })}</Text>
                </View>
                <View style={[s.statusPill, item.status === 'active' ? s.statusActive : s.statusPaused]}>
                  <View style={[s.statusDot, { backgroundColor: item.status === 'active' ? status.success : c.textTertiary }]} />
                  <Text style={s.statusText}>{item.status === 'active' ? t('nurture.active') : t('nurture.paused')}</Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </>
  );

  if (!isTablet) {
    return <ScreenContainer>{body}</ScreenContainer>;
  }

  // iPad regular width: list + detail, same split pattern as LeadsScreen.
  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <View style={s.splitRow}>
        <View style={s.splitList}>{body}</View>
        <View style={[s.splitDetail, { paddingHorizontal: screenPadding }]}>
          {selectedId ? (
            <NurtureSequenceDetailContent sequenceId={selectedId} />
          ) : (
            <EmptyState title={t('nurture.selectSequence')} body={t('nurture.selectSequenceBody')} />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.page },
  content: { paddingTop: 4, paddingBottom: 60 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.card, padding: spacing.card, marginBottom: spacing.cardGap, gap: spacing.md },
  cardSelected: { borderColor: c.yellow },
  name: { color: c.textPrimary, ...type.primary },
  meta: { color: c.textSecondary, ...type.secondary, marginTop: 8, fontVariant: ['tabular-nums'] },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 4 },
  statusActive: { borderColor: '#3DD68C40', backgroundColor: '#3DD68C1F' },
  statusPaused: { borderColor: c.hairline, backgroundColor: c.raised },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { color: c.textPrimary, ...type.pill },
  splitRow: { flex: 1, flexDirection: 'row' },
  splitList: { width: MAX_CONTENT_WIDTH, borderRightWidth: 1, borderRightColor: c.hairline },
  splitDetail: { flex: 1, paddingVertical: spacing.screen },
});
