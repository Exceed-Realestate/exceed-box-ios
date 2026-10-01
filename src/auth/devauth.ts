/**
 * Local developer sign-in — the app half of the backend's `GET /api/devtoken`
 * (`exceed-box-app/app/devauth.py` + `app/api.py:153`).
 *
 * Why this exists: until a real Supabase project is provisioned, `signInWithEmail()` in a
 * non-mock build has nowhere to authenticate against, so the entire "app talking to its own
 * backend" path was unrunnable — the two halves of the product had only ever been exercised
 * separately (mock data in the app, curl against the API). This closes that gap on a laptop
 * with no cloud account at all, without inventing a second auth system: it asks the backend
 * for a token minted by the backend's own signer, then hands it to the same
 * `setAuthToken()` / `api.getMe()` path a real Supabase session uses. Everything downstream
 * — RBAC, redaction, 403s — is unchanged and still decided server-side.
 *
 * Three independent gates keep it out of anything real:
 *   1. This build must set `EXPO_PUBLIC_DEV_AUTH=1`. Without it nothing here is ever called.
 *   2. The backend must have `EXCEEDBOX_DEV_AUTH=1` set, or `/api/devtoken` 404s.
 *   3. If the backend has a real `SUPABASE_JWT_SECRET`, it verifies against that and never
 *      against the dev signer — so a dev token is refused even if one is somehow presented.
 *
 * Gate 1 alone is not trusted: gates 2 and 3 live on the server, where this app cannot reach.
 */
import { API_BASE_URL, ApiError } from '../api/client';

/** Whether this build offers the developer sign-in path at all. */
export const DEV_AUTH_ENABLED = process.env.EXPO_PUBLIC_DEV_AUTH === '1' && !!API_BASE_URL;

/**
 * Ask the backend to mint a local developer token for `email`.
 *
 * The backend derives a deterministic `sub` (uuid5) per email, so signing in twice as the
 * same person keeps working rather than tripping the account-takeover guard that rejects a
 * second, different `sub` for an already-bound email (FABLE-AUDIT-R2 N1).
 *
 * Throws an `ApiError` whose message names the exact reason — a 404 here means the backend
 * is running *without* dev auth, which is a configuration answer, not a credentials one, and
 * a rep must never see it phrased as "wrong password".
 */
export async function mintDevToken(email: string): Promise<string> {
  const url = `${API_BASE_URL}/api/devtoken?email=${encodeURIComponent(email.trim())}`;
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new ApiError(0, 'network', `Could not reach the backend at ${API_BASE_URL}.`);
  }
  if (res.status === 404) {
    throw new ApiError(
      404,
      'dev_auth_disabled',
      'This backend has developer sign-in turned off. Start it with EXCEEDBOX_DEV_AUTH=1, or configure Supabase for real sign-in.'
    );
  }
  if (!res.ok) {
    throw new ApiError(res.status, 'devtoken_failed', `The backend refused to mint a developer token (HTTP ${res.status}).`);
  }
  const body = (await res.json()) as { token?: string };
  if (!body.token) {
    throw new ApiError(502, 'devtoken_malformed', 'The backend returned no token.');
  }
  return body.token;
}
