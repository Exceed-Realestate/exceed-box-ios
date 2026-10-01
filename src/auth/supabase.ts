/**
 * Real Supabase auth — email/password and Google OAuth, both against the GoTrue REST API
 * directly (`/auth/v1/token`, `/auth/v1/authorize`) rather than `@supabase/supabase-js`.
 *
 * Why a direct fetch instead of the SDK: this app needs exactly three calls (password grant,
 * refresh, and the OAuth authorize redirect) — @supabase/supabase-js additionally pulls in its
 * own realtime websocket client, a session-refresh timer loop, and a storage abstraction this
 * app already has (AsyncStorage, via AuthContext). None of that is used here. A direct fetch
 * against GoTrue's documented REST surface is smaller, has zero new transitive dependencies
 * beyond expo-web-browser/expo-linking (needed for the OAuth redirect regardless of which client
 * library issues the token calls), and matches the fetch-based style `api/client.ts` already
 * uses everywhere else in this app.
 *
 * There is no live Supabase project yet (see FABLE-AUDIT.md C2) — this module cannot be
 * exercised end-to-end until one exists. It fails closed: every exported function throws
 * SupabaseAuthError with a message that names exactly what's missing when the two
 * EXPO_PUBLIC_SUPABASE_* vars are absent, never a silent no-op or a fabricated session.
 */
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { COMPANY_DOMAIN } from '../theme';

const SUPABASE_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '');
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const SUPABASE_CONFIGURED = !!SUPABASE_URL && !!SUPABASE_ANON_KEY;

/** Exact missing config, for a "not configured" message that names what's missing rather than a
 * bare throw (see AuthContext.tsx). */
export function missingSupabaseConfigVars(): string[] {
  const missing: string[] = [];
  if (!SUPABASE_URL) missing.push('EXPO_PUBLIC_SUPABASE_URL');
  if (!SUPABASE_ANON_KEY) missing.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  return missing;
}

export class SupabaseAuthError extends Error {}

export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  /** unix seconds */
  expires_at: number;
  email: string;
}

// --- tiny base64url decode, no Buffer/atob dependency (Hermes has neither by default) ---------
const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function base64UrlDecode(input: string): string {
  const cleaned = input.replace(/-/g, '+').replace(/_/g, '/');
  let output = '';
  let buffer = 0;
  let bits = 0;
  for (const ch of cleaned) {
    const idx = B64_CHARS.indexOf(ch);
    if (idx === -1) continue; // skip '=' padding and anything else
    buffer = (buffer << 6) | idx;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return output;
}

/** Reads the `email` claim out of a JWT's payload without verifying the signature — used only
 * for the client-side domain gate (D20) and as a display fallback; the backend is the real
 * authority on the token's validity via its own signature check on every request. */
function decodeJwtEmail(jwt: string): string | null {
  try {
    const payload = jwt.split('.')[1];
    if (!payload) return null;
    const json = JSON.parse(base64UrlDecode(payload));
    return json.email ?? json.user_metadata?.email ?? null;
  } catch {
    return null;
  }
}

function requireConfigured(): void {
  if (!SUPABASE_CONFIGURED) {
    throw new SupabaseAuthError(`Supabase is not configured for this build — missing: ${missingSupabaseConfigVars().join(', ')}.`);
  }
}

/**
 * D20 hard gate, shared by every sign-in path (round-2 audit N1: this used to exist only on
 * the Google path — `signInWithPassword` applied no domain check at all). The backend is
 * becoming the real authority on domain (see AuthContext's handling of a 403 from the
 * backend), but the client must never present a signed-in state for an out-of-domain
 * account that the backend, or a future backend, would then have to refuse.
 */
function assertCompanyDomain(session: SupabaseSession, method: string): void {
  if (!session.email.toLowerCase().endsWith(`@${COMPANY_DOMAIN.toLowerCase()}`)) {
    throw new SupabaseAuthError(`${method} is restricted to @${COMPANY_DOMAIN} accounts.`);
  }
}

function sessionFromTokenResponse(body: any, fallbackEmail?: string): SupabaseSession {
  const access_token = body?.access_token;
  const refresh_token = body?.refresh_token;
  if (!access_token || !refresh_token) {
    throw new SupabaseAuthError('Supabase did not return a session.');
  }
  const expires_at =
    typeof body.expires_at === 'number' ? body.expires_at : Math.floor(Date.now() / 1000) + Number(body.expires_in ?? 3600);
  const email = body.user?.email ?? decodeJwtEmail(access_token) ?? fallbackEmail ?? '';
  return { access_token, refresh_token, expires_at, email };
}

async function gotrueError(res: Response): Promise<never> {
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    // no body
  }
  const message = body?.error_description || body?.msg || body?.message || body?.error || `Sign-in failed (${res.status}).`;
  throw new SupabaseAuthError(message);
}

/** Email/password sign-in — `POST /auth/v1/token?grant_type=password`. D20 (round-2 audit
 * N1): applies the same @exceed-re.ae domain gate as the Google path — this is the client
 * half of closing the gap; the backend must not be the only thing enforcing it either. */
export async function signInWithPassword(email: string, password: string): Promise<SupabaseSession> {
  requireConfigured();
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) await gotrueError(res);
  const session = sessionFromTokenResponse(await res.json(), email);
  assertCompanyDomain(session, 'Sign-in');
  return session;
}

/** Refreshes an expiring/expired session — `POST /auth/v1/token?grant_type=refresh_token`. */
export async function refreshSupabaseSession(refresh_token: string): Promise<SupabaseSession> {
  requireConfigured();
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ refresh_token }),
  });
  if (!res.ok) await gotrueError(res);
  return sessionFromTokenResponse(await res.json());
}

/**
 * Google OAuth (D20: domain-restricted to @exceed-re.ae) via Supabase's `/auth/v1/authorize`
 * implicit-flow redirect, opened in a real browser tab (`WebBrowser.openAuthSessionAsync`) so the
 * Google account chooser and any 2FA the workspace requires work exactly as in Safari/Chrome.
 *
 * `hd=exceed-re.ae` is passed straight through to Google's consent screen to restrict the account
 * picker to the workspace domain — but that is a UX nicety Google offers, not a guarantee (a
 * misconfigured client could still return a token for a different domain). The hard gate is
 * below: the returned token's own `email` claim is checked, and anything outside the domain is
 * discarded before it ever reaches setAuthToken/AsyncStorage.
 */
export async function signInWithGoogleOAuth(): Promise<SupabaseSession> {
  requireConfigured();
  const redirectUri = Linking.createURL('auth-callback');
  const authUrl =
    `${SUPABASE_URL}/auth/v1/authorize?provider=google` +
    `&redirect_to=${encodeURIComponent(redirectUri)}` +
    `&hd=${encodeURIComponent(COMPANY_DOMAIN)}`;

  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
  if (result.type !== 'success' || !result.url) {
    throw new SupabaseAuthError('Google sign-in was cancelled.');
  }

  const [beforeHash, afterHash] = result.url.split('#');
  const queryParams = new URLSearchParams(beforeHash.split('?')[1] ?? '');
  const fragmentParams = new URLSearchParams(afterHash ?? '');
  const errorDescription = fragmentParams.get('error_description') || queryParams.get('error_description');
  if (errorDescription) throw new SupabaseAuthError(errorDescription);

  const session = sessionFromTokenResponse({
    access_token: fragmentParams.get('access_token'),
    refresh_token: fragmentParams.get('refresh_token'),
    expires_in: fragmentParams.get('expires_in'),
  });

  // D20 hard gate — never accept a session for an account outside the workspace domain, even if
  // `hd` above was bypassed (e.g. a personal Gmail account with access to the OAuth client).
  assertCompanyDomain(session, 'Google sign-in');
  return session;
}

/** Best-effort remote sign-out — the local session is always cleared by the caller regardless of
 * whether this succeeds (e.g. offline, or the refresh token was already revoked). */
export async function signOutSupabase(access_token: string): Promise<void> {
  if (!SUPABASE_CONFIGURED || !access_token) return;
  try {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${access_token}` },
    });
  } catch {
    // best-effort only
  }
}
