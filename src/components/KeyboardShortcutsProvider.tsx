import React, { useEffect, useMemo, useRef } from 'react';
import { Platform } from 'react-native';
import {
  KeyboardShortcutsContext,
  normalizeCombo,
  parseComboForNative,
  type ShortcutHandler,
} from '../hooks/useKeyboardShortcuts';

type KeyCommandModule = typeof import('react-native-key-command');

/**
 * Loads `react-native-key-command` on iOS only, lazily and defensively.
 *
 * Why `require()` inside a function rather than a static `import` at the top of this file: the
 * library's own module init (`src/index.js`, run the moment it's evaluated) calls
 * `KeyCommand.getConstants()` against the native module immediately — on a platform/build where the
 * native side isn't linked (Android, or an iOS JS bundle reloaded into a binary built before
 * `plugins/withKeyCommand.js` ran), that throws synchronously (see the library's own
 * `KeyCommand/index.native.js` — an unlinked native module is a `Proxy` whose every property access
 * throws `LINKING_ERROR`). A static import would run that at app-startup module-evaluation time, on
 * every platform, with no way to guard it. Deferring the `require()` until this function actually
 * runs (iOS only, wrapped in try/catch) means an unlinked/JS-only build degrades to "no native
 * shortcuts, web still works" instead of a startup crash.
 */
function loadKeyCommandModule(): KeyCommandModule | null {
  if (Platform.OS !== 'ios') {
    // Android needs its own MainActivity edit (library README) — out of scope for this SPEC-V2 §11
    // iPadOS task. Same no-op Android behaviour this hook already had before native iOS support.
    return null;
  }
  try {
    const mod = require('react-native-key-command');
    return mod?.constants ? mod : null;
  } catch {
    return null;
  }
}

/**
 * Mounts once near the app root (App.tsx) and owns the single global keyboard listener every
 * `useKeyboardShortcut()` call registers against — a DOM `keydown` listener on web, a native
 * `UIKeyCommand` bridge on iOS/iPadOS via `react-native-key-command` (see
 * `src/hooks/useKeyboardShortcuts.ts` for the combo syntax, `plugins/withKeyCommand.js` for the
 * native wiring this needs under this project's CNG setup). Same registry (`combo -> handlers`) both
 * ways, so every existing `useKeyboardShortcut(...)` call site works unchanged on both platforms.
 */
export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  const handlers = useRef(new Map<string, Set<ShortcutHandler>>());
  // Computed at render time (not inside an effect): this value must exist before any child's own
  // effect can call `register()`, and child effects run before a parent's own effects on first
  // mount — render always precedes that, for parent and children alike.
  const KeyCommand = useMemo(loadKeyCommandModule, []);

  // Web — DOM keydown, unchanged from before native support existed.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return undefined;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      const combo = normalizeCombo(e);
      const set = handlers.current.get(combo);
      if (set && set.size > 0) {
        set.forEach((h) => h(e));
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  // iOS/iPadOS — native UIKeyCommand events. Each combo currently registered (see `register` below)
  // was already told to `KeyCommand.registerKeyCommands(...)`; this effect just fans incoming native
  // events back out to the same per-combo handler sets web uses. `ShortcutHandler`'s type says it
  // receives a `KeyboardEvent` — none of today's call sites read the event argument (they all ignore
  // it), so passing the native `{input, modifierFlags}` response through the same slot is safe today;
  // flagged here for whoever adds the first handler that actually inspects `e`.
  useEffect(() => {
    if (!KeyCommand) return undefined;

    const onNativeKeyCommand = (response: { input?: string; modifierFlags?: number }) => {
      const respInput = (response.input ?? '').toLowerCase();
      const respMods = response.modifierFlags ?? 0;
      handlers.current.forEach((set, combo) => {
        if (set.size === 0) return;
        const parsed = parseComboForNative(combo, KeyCommand.constants);
        if (!parsed) return;
        if (parsed.input.toLowerCase() === respInput && parsed.modifierFlags === respMods) {
          set.forEach((h) => h(response as unknown as KeyboardEvent));
        }
      });
    };

    const sub = KeyCommand.eventEmitter.addListener('onKeyCommand', onNativeKeyCommand);
    return () => sub.remove();
  }, [KeyCommand]);

  const value = useMemo(
    () => ({
      register: (combo: string, handler: ShortcutHandler) => {
        const key = combo.toLowerCase();
        const isNewCombo = !handlers.current.has(key);
        if (isNewCombo) handlers.current.set(key, new Set());
        handlers.current.get(key)!.add(handler);

        // First handler for this combo this session — tell UIKit about it. (Web needs no equivalent
        // step: the DOM listener above already receives every keydown regardless of what's
        // registered.) Fire-and-forget: `registerKeyCommands` resolving is not on the critical path
        // for the handler to already be listening for the *next* keydown.
        if (isNewCombo && KeyCommand) {
          const parsed = parseComboForNative(key, KeyCommand.constants);
          if (parsed) KeyCommand.registerKeyCommands([parsed]).catch(() => {});
        }

        return () => {
          const set = handlers.current.get(key);
          set?.delete(handler);
          if (set && set.size === 0) {
            handlers.current.delete(key);
            if (KeyCommand) {
              const parsed = parseComboForNative(key, KeyCommand.constants);
              if (parsed) KeyCommand.unregisterKeyCommands([parsed]).catch(() => {});
            }
          }
        };
      },
    }),
    [KeyCommand]
  );

  return <KeyboardShortcutsContext.Provider value={value}>{children}</KeyboardShortcutsContext.Provider>;
}
