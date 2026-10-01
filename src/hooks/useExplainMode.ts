import { useCallback, useEffect, useState } from 'react';

/**
 * SPEC-V2 §10 — 解説モード / Explain mode. A single global toggle (module-level singleton, not a
 * React context) so it stays on as the user moves between screens without needing a provider
 * mounted at the app root — `App.tsx` is owned by the navigation agent and is not touched here.
 */
let enabledState = false;
const listeners = new Set<(v: boolean) => void>();

function setEnabled(v: boolean) {
  enabledState = v;
  listeners.forEach((l) => l(v));
}

export function useExplainMode(): { enabled: boolean; toggle: () => void } {
  const [enabled, setLocal] = useState(enabledState);
  useEffect(() => {
    listeners.add(setLocal);
    return () => {
      listeners.delete(setLocal);
    };
  }, []);
  const toggle = useCallback(() => setEnabled(!enabledState), []);
  return { enabled, toggle };
}
