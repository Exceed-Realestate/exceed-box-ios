import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * SPEC v2 §11 "master-detail everywhere it earns it": Leads/Pipeline/Team/Tracking/Nurture each get a
 * list pane + a detail pane at regular width. This is the shared selection store for that pattern.
 *
 * Why a context that lives here (mounted once in App.tsx) rather than local `useState` inside each
 * screen: local state already survives width changes on its own (the screen component doesn't
 * unmount when `useWindowDimensions` flips compact/regular — only its returned JSX shape changes), so
 * this isn't fixing a bug. It exists so every master-detail screen shares one *documented* selection
 * API instead of five bespoke implementations, and so selection can outlive a tab switch too: routes
 * inside the tab navigator stay mounted once visited (react-navigation's default `detachInactiveScreens`
 * behaviour keeps them alive, just hidden), and this context sits above that navigator entirely, so a
 * lead selected on Leads is still selected if you flip to Team and back.
 *
 * Usage in a screen (screens agent, not this task):
 *   const [selectedId, setSelectedId] = useMasterDetail('leads');
 *   ...
 *   useMasterDetailList('leads', list.items.map((i) => i.id)); // enables ↑/↓ shortcuts, see below
 */

export type MasterDetailKey = 'leads' | 'pipeline' | 'team' | 'tracking' | 'nurture';

interface MasterDetailContextValue {
  getSelected: (key: MasterDetailKey) => string | null;
  select: (key: MasterDetailKey, id: string | null) => void;
  getList: (key: MasterDetailKey) => string[];
  setList: (key: MasterDetailKey, ids: string[]) => void;
}

const MasterDetailContext = createContext<MasterDetailContextValue | null>(null);

export function MasterDetailProvider({ children }: { children: React.ReactNode }) {
  const [selection, setSelection] = useState<Partial<Record<MasterDetailKey, string | null>>>({});
  const [lists, setLists] = useState<Partial<Record<MasterDetailKey, string[]>>>({});

  const select = useCallback((key: MasterDetailKey, id: string | null) => {
    setSelection((s) => (s[key] === id ? s : { ...s, [key]: id }));
  }, []);

  const getSelected = useCallback((key: MasterDetailKey) => selection[key] ?? null, [selection]);

  const setList = useCallback((key: MasterDetailKey, ids: string[]) => {
    setLists((s) => (sameIds(s[key], ids) ? s : { ...s, [key]: ids }));
  }, []);

  const getList = useCallback((key: MasterDetailKey) => lists[key] ?? [], [lists]);

  const value = useMemo(
    () => ({ getSelected, select, getList, setList }),
    [getSelected, select, getList, setList]
  );

  return <MasterDetailContext.Provider value={value}>{children}</MasterDetailContext.Provider>;
}

function sameIds(a: string[] | undefined, b: string[]): boolean {
  if (!a) return b.length === 0;
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

function useMasterDetailContext(): MasterDetailContextValue {
  const ctx = useContext(MasterDetailContext);
  if (!ctx) throw new Error('useMasterDetail must be used within MasterDetailProvider (mounted in App.tsx)');
  return ctx;
}

/**
 * Per-screen selected-id state, keyed so Leads/Pipeline/Team/Tracking/Nurture don't collide.
 * Selection persists across width-class changes and tab switches (see file header).
 */
export function useMasterDetail(key: MasterDetailKey): [string | null, (id: string | null) => void] {
  const ctx = useMasterDetailContext();
  const id = ctx.getSelected(key);
  const set = useCallback((next: string | null) => ctx.select(key, next), [ctx, key]);
  return [id, set];
}

/**
 * Optional: a screen reports its currently-visible, ordered list of ids here so the navigation
 * shell's ↑/↓/↵ shortcuts (SPEC §11) can move the selection without reaching into that screen's
 * FlatList. Call on every data change, e.g. `useMasterDetailList('leads', list.items.map(i => i.id))`.
 * Until a screen calls this, ↑/↓/↵ for that key have nothing to move through — see the navigation
 * report for exactly which shortcuts are load-bearing today vs. plumbing waiting for adoption.
 */
export function useMasterDetailList(key: MasterDetailKey, ids: string[]): void {
  const ctx = useMasterDetailContext();
  // Effect, not a render-time call: writing into MasterDetailProvider's state synchronously during
  // a screen's render would be updating a different component while it renders.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- ids is a fresh array each render; compare by content via setList's own sameIds guard
  useEffect(() => {
    ctx.setList(key, ids);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx, key, JSON.stringify(ids)]);
}

export function useMasterDetailListValue(key: MasterDetailKey): string[] {
  const ctx = useMasterDetailContext();
  return ctx.getList(key);
}
