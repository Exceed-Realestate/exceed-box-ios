import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { en, type TranslationKey } from './en';
import { ja } from './ja';

export type Lang = 'en' | 'ja';
export type { TranslationKey };

const DICTS: Record<Lang, Record<TranslationKey, string>> = { en, ja };

const STORAGE_KEY = 'exceedbox.language';

/**
 * Simple `{token}` interpolation — good enough for counts/names, no plural-rules library.
 * `{s}` is handled specially by callers passing `''` or `'s'` themselves (English plural suffix);
 * Japanese strings never contain `{s}` since Japanese nouns don't inflect for count.
 */
function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const v = vars[key];
    return v === undefined ? match : String(v);
  });
}

export function translate(lang: Lang, key: TranslationKey, vars?: Record<string, string | number>): string {
  const template = DICTS[lang][key];
  return interpolate(template, vars);
}

/** Picks the current-language half of a server-supplied bilingual pair (e.g. `label`/`label_ja`),
 * falling back to whichever half is present — a lead with no `name_ja` still renders in Japanese
 * mode instead of going blank. */
export function pickBilingual(lang: Lang, en_: string | null | undefined, ja_: string | null | undefined): string {
  if (lang === 'ja') return ja_ ?? en_ ?? '';
  return en_ ?? ja_ ?? '';
}

/** Same idea for the app's own `[en, ja]` label tuples (stageLabel(), roleLabel(), etc. in
 * src/api/mocks.ts and src/components/Badges.tsx). */
export function pickPair(lang: Lang, pair: readonly [string, string]): string {
  return lang === 'ja' ? pair[1] : pair[0];
}

/**
 * Device-locale default. `expo-localization` is not installed (per project constraints), so this
 * uses the two locale signals actually available in this Expo/RN version: `Intl` on web, and RN's
 * own `NativeModules` locale fields on iOS/Android. If neither yields a confident answer, this
 * defaults to Japanese — the Japan office is the primary user of this app.
 */
function detectDeviceLanguage(): Lang {
  try {
    if (Platform.OS === 'web' && typeof Intl !== 'undefined') {
      const locale = Intl.DateTimeFormat().resolvedOptions().locale;
      if (locale) return locale.toLowerCase().startsWith('ja') ? 'ja' : 'en';
    }
    // iOS: NativeModules.SettingsManager.settings.AppleLocale / AppleLanguages[0].
    const iosLocale =
      NativeModules.SettingsManager?.settings?.AppleLocale ||
      NativeModules.SettingsManager?.settings?.AppleLanguages?.[0];
    if (typeof iosLocale === 'string' && iosLocale.length > 0) {
      return iosLocale.toLowerCase().startsWith('ja') ? 'ja' : 'en';
    }
    // Android: NativeModules.I18nManager.localeIdentifier.
    const androidLocale = NativeModules.I18nManager?.localeIdentifier;
    if (typeof androidLocale === 'string' && androidLocale.length > 0) {
      return androidLocale.toLowerCase().startsWith('ja') ? 'ja' : 'en';
    }
  } catch {
    // Fall through to the Japan-office default below.
  }
  return 'ja';
}

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

// Module-level mirror of the current language, for the handful of call sites that run outside a
// React render (e.g. `describeApiError()` in AuthContext, called from catch blocks). Kept in sync
// by I18nProvider on every change; components should use `useT()`/`useLanguage()` instead so they
// re-render on a language switch.
let currentLangRef: Lang = 'ja';
export function getCurrentLanguage(): Lang {
  return currentLangRef;
}
/** Non-hook translate for the same handful of call sites — always reflects the live language. */
export function t(key: TranslationKey, vars?: Record<string, string | number>): string {
  return translate(currentLangRef, key, vars);
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectDeviceLanguage());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === 'en' || stored === 'ja') {
          currentLangRef = stored;
          setLangState(stored);
        } else {
          currentLangRef = detectDeviceLanguage();
        }
      })
      .catch(() => {
        // Keep the device-locale default already set above — a broken AsyncStorage read must
        // never crash the app or silently freeze it on the wrong language.
      })
      .finally(() => setHydrated(true));
  }, []);

  const setLang = useCallback((next: Lang) => {
    currentLangRef = next;
    setLangState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
      // Best-effort persistence — the in-memory switch above already applied instantly either way.
    });
  }, []);

  const tBound = useCallback((key: TranslationKey, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);

  const value = useMemo<I18nContextValue>(() => ({ lang, setLang, t: tBound }), [lang, setLang, tBound]);

  // Render immediately with the device-locale guess rather than blocking the whole app behind the
  // one-time AsyncStorage read — `hydrated` only exists so a stored preference can override that
  // guess a frame later without a visible flash for most users (default already matches).
  void hydrated;

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider (mounted in App.tsx)');
  return ctx;
}

/** `const t = useT();  t('leads.title')` */
export function useT() {
  return useI18n().t;
}

export function useLanguage(): [Lang, (lang: Lang) => void] {
  const { lang, setLang } = useI18n();
  return [lang, setLang];
}
