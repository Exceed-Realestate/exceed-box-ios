import { useCallback, useEffect, useRef, useState } from 'react';
import type { Paginated } from '../api/types';
import { describeApiError } from '../auth/AuthContext';

type Status = 'loading' | 'error' | 'ready';

/**
 * Shared list-loading behaviour for every SPEC.md list screen:
 * initial load (skeleton), pull-to-refresh, "load more" pagination against
 * { data, page, page_size, total }, and a retryable error state.
 */
export function usePaginatedList<T>(fetchPage: (page: number) => Promise<Paginated<T>>, deps: React.DependencyList) {
  const [status, setStatus] = useState<Status>('loading');
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const requestId = useRef(0);

  const load = useCallback(
    async (targetPage: number, mode: 'initial' | 'refresh' | 'more') => {
      const id = ++requestId.current;
      if (mode === 'initial') setStatus('loading');
      if (mode === 'refresh') setRefreshing(true);
      if (mode === 'more') setLoadingMore(true);
      try {
        const res = await fetchPage(targetPage);
        if (id !== requestId.current) return;
        setItems((prev) => (mode === 'more' ? [...prev, ...res.data] : res.data));
        setPage(res.page);
        setTotal(res.total);
        setPageSize(res.page_size);
        setStatus('ready');
        setError(null);
      } catch (e) {
        if (id !== requestId.current) return;
        setError(describeApiError(e));
        setStatus('error');
      } finally {
        if (id === requestId.current) {
          setRefreshing(false);
          setLoadingMore(false);
        }
      }
    },
    [fetchPage]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    load(1, 'initial');
  }, deps);

  const refresh = useCallback(() => load(1, 'refresh'), [load]);
  const hasMore = items.length < total;
  const loadMore = useCallback(() => {
    if (loadingMore || refreshing || status !== 'ready' || !hasMore) return;
    load(page + 1, 'more');
  }, [loadingMore, refreshing, status, hasMore, page, load]);

  /** Optimistic local mutations after a write, so a single "complete" doesn't re-skeleton the list. */
  const removeItem = useCallback((predicate: (item: T) => boolean) => {
    setItems((prev) => prev.filter((i) => !predicate(i)));
    setTotal((t) => Math.max(0, t - 1));
  }, []);
  const updateItem = useCallback((predicate: (item: T) => boolean, next: T) => {
    setItems((prev) => prev.map((i) => (predicate(i) ? next : i)));
  }, []);
  /** A create action (e.g. invite user) — show it immediately without a full reload. */
  const prependItem = useCallback((item: T) => {
    setItems((prev) => [item, ...prev]);
    setTotal((t) => t + 1);
  }, []);

  return {
    status,
    items,
    total,
    pageSize,
    error,
    refreshing,
    loadingMore,
    hasMore,
    refresh,
    loadMore,
    reload: () => load(1, 'initial'),
    removeItem,
    updateItem,
    prependItem,
  };
}
