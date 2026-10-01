import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { c, MAX_CONTENT_WIDTH, radius, spacing, type } from '../theme';
import { ScreenHeader } from '../components/ScreenHeader';
import { EmptyState, ErrorState, SkeletonList } from '../components/StateViews';
import { LeadListItem } from '../components/LeadListItem';
import { FilterChips } from '../components/FilterChips';
import { LeadDetailContent } from '../components/LeadDetailContent';
import { useIsTablet } from '../components/ScreenContainer';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcuts';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { ALL_STAGES, stageLabel } from '../api/mocks';
import { pickPair, useLanguage, useT } from '../i18n';
import type { LeadsStackParamList } from '../navigation/types';
import type { LeadStage, LeadSummary } from '../api/types';

type Nav = NativeStackNavigationProp<LeadsStackParamList, 'Leads'>;

export default function LeadsScreen() {
  const nav = useNavigation<Nav>();
  const { me, can } = useAuth();
  const isTablet = useIsTablet();
  const screenPadding = isTablet ? spacing.screenTablet : spacing.screen;
  const [lang] = useLanguage();
  const t = useT();

  const STAGE_OPTIONS = [
    { key: 'all', label: t('leads.filterAll') },
    ...ALL_STAGES.map((st) => ({ key: st, label: pickPair(lang, stageLabel(st)) })),
  ];

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [stage, setStage] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  // SPEC §11 ⌘K: TabNavigator brings Leads into view from anywhere; once this screen is the one
  // mounted/focused, the same combo also focuses the actual search field rather than just landing on
  // the tab. Screens stay mounted when tabbed away (react-navigation's detachInactiveScreens default),
  // so this listener is live even before the user has visited Leads once this session.
  useKeyboardShortcut('mod+k', () => searchInputRef.current?.focus());

  const fetchPage = useCallback(
    (page: number) =>
      api.getLeads({
        page,
        page_size: 20,
        q: debouncedQuery || undefined,
        stage: stage && stage !== 'all' ? (stage as LeadStage) : undefined,
      }),
    [debouncedQuery, stage]
  );

  const list = usePaginatedList<LeadSummary>(fetchPage, [debouncedQuery, stage, me?.id]);

  useEffect(() => {
    if (isTablet && !selectedId && list.items.length > 0) {
      setSelectedId(list.items[0].id);
    }
  }, [isTablet, selectedId, list.items]);

  const openLead = (id: string) => {
    if (isTablet) setSelectedId(id);
    else nav.navigate('LeadDetail', { leadId: id });
  };

  const scopeNote = can('leads.view_all') ? t('leads.scopeAll') : t('leads.scopeMine');
  const showScan = can('card_scan.create');
  const showImport = can('import.run');
  const hasFilter = !!(debouncedQuery || stage);

  const body = (
    <>
      <ScreenHeader
        title={t('leads.title')}
        subtitle={t('leads.subtitle', { count: list.total, s: list.total === 1 ? '' : 's', scope: scopeNote })}
        right={
          showScan || showImport ? (
            <View style={s.headerActions}>
              {showImport && (
                <Pressable onPress={() => nav.navigate('Import')} style={({ pressed }) => [s.headerBtn, pressed && { opacity: 0.75 }]}>
                  <Text style={s.headerBtnText}>{t('leads.import')}</Text>
                </Pressable>
              )}
              {showScan && (
                <Pressable onPress={() => nav.navigate('CardScan')} style={({ pressed }) => [s.headerBtnPrimary, pressed && { opacity: 0.75 }]}>
                  <Text style={s.headerBtnPrimaryText}>{t('leads.scan')}</Text>
                </Pressable>
              )}
            </View>
          ) : undefined
        }
      />
      <View style={[s.searchWrap, { paddingHorizontal: screenPadding }]}>
        <TextInput
          ref={searchInputRef}
          value={query}
          onChangeText={setQuery}
          placeholder={t('leads.searchPlaceholder')}
          placeholderTextColor="#7B818D"
          style={s.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      <FilterChips options={STAGE_OPTIONS} selected={stage ?? 'all'} onSelect={(k) => setStage(k === 'all' ? null : k)} />

      {list.status === 'loading' && <SkeletonList />}

      {list.status === 'error' && <ErrorState message={list.error ?? t('leads.loadFailed')} onRetry={list.reload} />}

      {list.status === 'ready' && (
        <FlatList
          data={list.items}
          keyExtractor={(l) => l.id}
          contentContainerStyle={[s.listContent, { paddingHorizontal: screenPadding, flexGrow: 1 }]}
          refreshControl={<RefreshControl tintColor={c.yellow} refreshing={list.refreshing} onRefresh={list.refresh} />}
          onEndReachedThreshold={0.4}
          onEndReached={list.loadMore}
          renderItem={({ item }) => <LeadListItem lead={item} selected={item.id === selectedId && isTablet} onPress={() => openLead(item.id)} />}
          ListEmptyComponent={
            <EmptyState
              title={hasFilter ? t('leads.emptyFilteredTitle') : t('leads.emptyTitle')}
              body={hasFilter ? t('leads.emptyFilteredBody') : t('leads.emptyBody')}
              action={
                hasFilter
                  ? { label: t('leads.clearFilters'), onPress: () => { setQuery(''); setStage(null); } }
                  : undefined
              }
            />
          }
          ListFooterComponent={list.loadingMore ? <Text style={s.loadingMore}>{t('common.loadingMore')}</Text> : null}
        />
      )}
    </>
  );

  if (!isTablet) {
    return <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>{body}</SafeAreaView>;
  }

  // iPad: two-column master/detail rather than a stretched single column.
  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <View style={s.splitRow}>
        <View style={s.splitList}>{body}</View>
        <View style={s.splitDetail}>
          {selectedId ? (
            <LeadDetailContent leadId={selectedId} />
          ) : (
            <EmptyState title={t('leads.selectLead')} body={t('leads.selectLeadBody')} />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.page },
  headerActions: { flexDirection: 'row', gap: spacing.sm, marginTop: 4 },
  headerBtn: { minHeight: 40, paddingHorizontal: spacing.card, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1, borderColor: c.hairline },
  headerBtnText: { color: c.textPrimary, ...type.pill },
  headerBtnPrimary: { minHeight: 40, paddingHorizontal: spacing.card, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, backgroundColor: c.yellow },
  headerBtnPrimaryText: { color: c.page, ...type.pill },
  searchWrap: { marginBottom: spacing.sm },
  searchInput: { height: 44, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.lg, color: c.textPrimary, paddingHorizontal: 14, ...type.secondary, backgroundColor: c.raised },
  listContent: { paddingTop: 4 },
  loadingMore: { color: c.micro, ...type.micro, textAlign: 'center', paddingVertical: 16 },
  splitRow: { flex: 1, flexDirection: 'row' },
  splitList: { width: MAX_CONTENT_WIDTH, borderRightWidth: 1, borderRightColor: c.hairline },
  splitDetail: { flex: 1 },
});
