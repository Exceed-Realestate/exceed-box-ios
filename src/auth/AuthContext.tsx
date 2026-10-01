import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MeResponse } from '../api/types';
import { api, ApiError, setAuthToken, setMockCurrentUser, setUnauthorizedHandler, MOCKS_ENABLED } from '../api/client';
import { findDemoUserByEmail } from '../api/mocks';
import { Capability, roleCan } from './permissions';
import { DEV_AUTH_ENABLED, mintDevToken } from './devauth';
import { t } from '../i18n';
import {
  missingSupabaseConfigVars,
  refreshSupabaseSession,
  signInWithGoogleOAuth,
  signInWithPassword,
  signOutSupabase,
  SUPABASE_CONFIGURED,
  SupabaseAuthError,
  type SupabaseSession,
} from './supabase';

type Status = 'loading' | 'signedOut' | 'signedIn';

interface AuthContextValue {
  status: Status;
  me: MeResponse | null;
  authError: string | null;
  can: (capability: Capability) => boolean;
  /** Mock mode + real mode both funnel through here; real mode calls src/auth/supabase.ts and
   * requires EXPO_PUBLIC_SUPABASE_URL/ANON_KEY to be configured for this build. */
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'exceedbox.token';
const MOCK_EMAIL_KEY = 'exceedbox.mockEmail';
const REFRESH_TOKEN_KEY = 'exceedbox.refreshToken';
const TOKEN_EXPIRES_KEY = 'exceedbox.tokenExpiresAt';
const ALL_SESSION_KEYS = [TOKEN_KEY, MOCK_EMAIL_KEY, REFRESH_TOKEN_KEY, TOKEN_EXPIRES_KEY];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [me, setMe] = useState<MeResponse | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  // Kept for signOut()'s best-effort Supabase /logout call — never read for anything security-
  // relevant (the real per-request token lives in api/client.ts's own module state).
  const currentAccessToken = useRef<string | null>(null);

  const applySession = useCallback(async (token: string | null, meResponse: MeResponse | null) => {
    currentAccessToken.current = token;
    setAuthToken(token);
    setMockCurrentUser(meResponse);
    setMe(meResponse);
    setStatus(meResponse ? 'signedIn' : 'signedOut');
  }, []);

  const persistSupabaseSession = useCallback(async (session: SupabaseSession) => {
    await AsyncStorage.multiSet([
      [TOKEN_KEY, session.access_token],
      [REFRESH_TOKEN_KEY, session.refresh_token],
      [TOKEN_EXPIRES_KEY, String(session.expires_at)],
    ]);
  }, []);

  const clearStoredSession = useCallback(async () => {
    await AsyncStorage.multiRemove(ALL_SESSION_KEYS);
  }, []);

  const restore = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) {
        // No-login mode (backend EXCEEDBOX_OPEN_ACCESS_EMAIL, 2026-10-01): a server that
        // answers /api/me without a token has sign-in switched off, so go straight in.
        // A normal server 401s here and we fall through to the sign-in screen as before.
        if (!MOCKS_ENABLED) {
          try {
            setAuthToken(null);
            const openMe = await api.getMe();
            await applySession(null, openMe);
            return;
          } catch {
            // login required — fall through
          }
        }
        await applySession(null, null);
        return;
      }
      if (MOCKS_ENABLED) {
        const email = await AsyncStorage.getItem(MOCK_EMAIL_KEY);
        const user = email ? findDemoUserByEmail(email) : null;
        if (!user) {
          await applySession(null, null);
          return;
        }
        const meResponse: MeResponse = {
          id: user.id,
          email: user.email,
          name: user.display_name,
          role: user.role,
          office: user.office,
          permissions: [],
        };
        await applySession(token, meResponse);
        return;
      }

      let accessToken = token;
      if (SUPABASE_CONFIGURED) {
        // Proactively refresh a session that's expired or about to (60s guard) — this both keeps
        // long-idle app opens from immediately 401'ing, and reduces how often the "sign out on
        // 401" unauthorizedHandler below fires for a merely-stale token rather than a truly
        // invalid one.
        const [refreshToken, expiresAtRaw] = await Promise.all([
          AsyncStorage.getItem(REFRESH_TOKEN_KEY),
          AsyncStorage.getItem(TOKEN_EXPIRES_KEY),
        ]);
        const expiresAt = expiresAtRaw ? Number(expiresAtRaw) : 0;
        if (refreshToken && Date.now() / 1000 > expiresAt - 60) {
          try {
            const session = await refreshSupabaseSession(refreshToken);
            await persistSupabaseSession(session);
            accessToken = session.access_token;
          } catch {
            await clearStoredSession();
            await applySession(null, null);
            return;
          }
        }
      }
      setAuthToken(accessToken);
      const meResponse = await api.getMe();
      await applySession(accessToken, meResponse);
    } catch (e) {
      // The backend is the source of truth on whether this identity is still allowed in at
      // all (round-2 audit N1) — a 403 resolving "who am I" (not a feature-scoped permission
      // check, which never happens here) means the server has rejected this token/account
      // outright, e.g. an out-of-domain email or a deactivated account. Sitting on a token
      // that will just be refused again is a half-authenticated state: clear it and surface
      // why, rather than silently bouncing to the sign-in screen with no explanation and
      // retrying the same rejected token on every future launch.
      if (e instanceof ApiError && e.status === 403) {
        await clearStoredSession();
        setAuthError(e.message);
      }
      await applySession(null, null);
    }
  }, [applySession, clearStoredSession, persistSupabaseSession]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearStoredSession().finally(() => applySession(null, null));
    });
    restore();
    return () => setUnauthorizedHandler(null);
  }, [restore, applySession, clearStoredSession]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      setAuthError(null);
      if (!password.trim()) {
        setAuthError(t('auth.enterPassword'));
        throw new Error('missing password');
      }
      if (MOCKS_ENABLED) {
        const user = findDemoUserByEmail(email);
        if (!user) {
          setAuthError(t('auth.unknownDemoUser', { email }));
          throw new Error('unknown demo user');
        }
        const token = `mock-token-${user.id}`;
        await AsyncStorage.setItem(TOKEN_KEY, token);
        await AsyncStorage.setItem(MOCK_EMAIL_KEY, user.email);
        const meResponse: MeResponse = {
          id: user.id,
          email: user.email,
          name: user.display_name,
          role: user.role,
          office: user.office,
          permissions: [],
        };
        await applySession(token, meResponse);
        return;
      }
      // Local developer sign-in (src/auth/devauth.ts) — only when this build asked for it AND
      // Supabase is genuinely absent. Deliberately ordered *after* the Supabase check would
      // otherwise fail and *before* the error it would raise, so it is impossible for dev auth
      // to shadow a real configured Supabase project: if SUPABASE_CONFIGURED is true, this
      // branch is never reached. The token comes from the backend's own signer, and the
      // backend still refuses to verify it unless it was started with EXCEEDBOX_DEV_AUTH=1.
      if (!SUPABASE_CONFIGURED && DEV_AUTH_ENABLED) {
        try {
          const token = await mintDevToken(email);
          await AsyncStorage.setItem(TOKEN_KEY, token);
          setAuthToken(token);
          const meResponse = await api.getMe();
          await applySession(token, meResponse);
          return;
        } catch (e) {
          await clearStoredSession();
          await applySession(null, null);
          setAuthError(e instanceof Error ? e.message : t('common.genericError'));
          throw e;
        }
      }
      if (!SUPABASE_CONFIGURED) {
        // Never a bare throw — name exactly what's missing so whoever built this release knows
        // what to set (mirrors ConfigErrorScreen's own approach for EXPO_PUBLIC_API_URL).
        setAuthError(t('auth.emailNotConnected', { vars: missingSupabaseConfigVars().join(', ') }));
        throw new Error('supabase not configured');
      }
      try {
        const session = await signInWithPassword(email.trim(), password);
        await persistSupabaseSession(session);
        setAuthToken(session.access_token);
        const meResponse = await api.getMe();
        await applySession(session.access_token, meResponse);
      } catch (e) {
        await clearStoredSession();
        await applySession(null, null);
        setAuthError(e instanceof SupabaseAuthError ? e.message : e instanceof Error ? e.message : t('common.genericError'));
        throw e;
      }
    },
    [applySession, clearStoredSession, persistSupabaseSession]
  );

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    if (MOCKS_ENABLED) {
      // Google SSO is domain-locked to @exceed-re.ae (D20) — mock signs in as the admin demo
      // account, the same role Balraj/Teruo will actually get via Google.
      const user = findDemoUserByEmail('admin@exceed-re.ae')!;
      const token = `mock-token-${user.id}`;
      await AsyncStorage.setItem(TOKEN_KEY, token);
      await AsyncStorage.setItem(MOCK_EMAIL_KEY, user.email);
      const meResponse: MeResponse = {
        id: user.id,
        email: user.email,
        name: user.display_name,
        role: user.role,
        office: user.office,
        permissions: [],
      };
      await applySession(token, meResponse);
      return;
    }
    if (!SUPABASE_CONFIGURED) {
      setAuthError(t('auth.googleNotConnected', { vars: missingSupabaseConfigVars().join(', ') }));
      throw new Error('supabase not configured');
    }
    try {
      const session = await signInWithGoogleOAuth();
      await persistSupabaseSession(session);
      setAuthToken(session.access_token);
      const meResponse = await api.getMe();
      await applySession(session.access_token, meResponse);
    } catch (e) {
      await clearStoredSession();
      await applySession(null, null);
      setAuthError(e instanceof SupabaseAuthError ? e.message : e instanceof Error ? e.message : t('common.genericError'));
      throw e;
    }
  }, [applySession, clearStoredSession, persistSupabaseSession]);

  const signOut = useCallback(async () => {
    if (!MOCKS_ENABLED && SUPABASE_CONFIGURED && currentAccessToken.current) {
      void signOutSupabase(currentAccessToken.current);
    }
    await clearStoredSession();
    await applySession(null, null);
  }, [applySession, clearStoredSession]);

  const can = useCallback((capability: Capability) => roleCan(me?.role, capability), [me]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, me, authError, can, signInWithGoogle, signInWithEmail, signOut }),
    [status, me, authError, can, signInWithGoogle, signInWithEmail, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function describeApiError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 403) return t('common.forbidden');
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return t('common.genericError');
}
