/**
 * One typed fetch wrapper for every SPEC.md endpoint.
 *
 * - Base URL from EXPO_PUBLIC_API_URL — REQUIRED for any non-mock build. There is no
 *   127.0.0.1/localhost fallback: on a real device that would mean the phone calling itself.
 *   If it's missing in a non-mock build, API_URL_CONFIGURED is false and App.tsx renders a
 *   ConfigErrorScreen instead of ever mounting auth/navigation — no silent failure.
 * - Attaches the auth token from AuthContext via setAuthToken().
 * - Parses { error: { code, message } } and throws ApiError.
 * - 401 -> calls the registered unauthorized handler (AuthContext signs the user out).
 * - 403 -> thrown as ApiError with code 'forbidden'; screens render it as a permission message.
 * - EXPO_PUBLIC_USE_MOCKS=1 routes every call to src/api/mocks.ts instead of fetch, so the whole
 *   app is demoable with no backend running.
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  ActivityEvent,
  AppUser,
  AssignmentRule,
  AssignmentRulesPatch,
  AssignmentRulesResponse,
  BookingSettings,
  BookingSettingsPatch,
  BookingSlot,
  CalendarWeekResponse,
  ClassifierAnswer,
  CreateLeadInput,
  CreateTaskInput,
  CreateUserInput,
  CreateVoiceMemoInput,
  DashboardResponse,
  DraftReplyInput,
  GoHighLevelSyncResult,
  ImportAnalyzeInput,
  ImportAnalyzeParsed,
  ImportAnalyzeResult,
  ImportColumn,
  ConsentInfo,
  ConsentState,
  ImportCommitInput,
  ImportCommitResult,
  ImportConsentState,
  ImportQuestion,
  ImportQuestionOption,
  ImportSheetChoice,
  IntegrationsResponse,
  LeadChannel,
  LeadDetail,
  LeadEditPatch,
  LeadReply,
  LeadStage,
  LeadSummary,
  LeadsQuery,
  MeetingType,
  MeResponse,
  NotificationSettingsPatch,
  NotificationSettingsResponse,
  Paginated,
  PipelineResponse,
  ReplyClassifier,
  ScanLeadInput,
  ScanLeadResult,
  ScoreExplain,
  ScoringModel,
  SendReplyInput,
  SequenceDetail,
  SequenceStepPatch,
  SequenceSummary,
  SnsFunnelResponse,
  SnsPatternsResponse,
  Task,
  TaskPatch,
  TeamResponse,
  UserPatch,
  VoiceMemo,
} from './types';
import * as mocks from './mocks';
import { purposeLabel, regionLabel } from './mocks';
import { roleCan } from '../auth/permissions';

const RAW_API_BASE = process.env.EXPO_PUBLIC_API_URL;

/**
 * Whether this build is even *allowed* to serve demo data.
 *
 * Two failures have to be prevented at once, and they pull in opposite directions:
 *
 *  1. A TestFlight build once shipped with `USE_MOCKS = false` baked in and no API URL, which
 *     left both sign-in buttons throwing "not connected" and the app unusable. `EXPO_PUBLIC_*`
 *     values are inlined at bundle time by whichever process runs Metro, and Xcode's "Bundle
 *     React Native code and images" phase does NOT inherit an exported shell variable. So a
 *     dev/preview build must still fall back to demo data when there is no backend to call.
 *
 *  2. The opposite failure is worse: a *release* build that quietly becomes a demo because an
 *     API URL was missing. Real staff would see invented leads and believe them.
 *
 * The gate resolves both. Demo data needs positive permission — the Metro dev server (`__DEV__`)
 * or an explicit `EXPO_PUBLIC_ALLOW_MOCKS=1`, which eas.json sets on development and preview and
 * deliberately omits on production. An unset variable inlines as `undefined`, so a production
 * build that forgot to set anything fails closed: no mocks, and App.tsx mounts ConfigErrorScreen
 * instead of a plausible-looking lie.
 */
const MOCKS_ALLOWED = __DEV__ || process.env.EXPO_PUBLIC_ALLOW_MOCKS === '1';
const USE_MOCKS =
  MOCKS_ALLOWED && (process.env.EXPO_PUBLIC_USE_MOCKS === '1' || !RAW_API_BASE);
const MOCK_EMPTY = process.env.EXPO_PUBLIC_MOCK_EMPTY === '1';
const MOCK_ERROR = process.env.EXPO_PUBLIC_MOCK_ERROR === '1';
const MOCK_DELAY_MS = 380;

/** True only when a non-mock build actually has an API URL to call. App.tsx gates the whole app
 * on this — never fall back to a loopback address that would make a real iPhone call itself. */
export const API_URL_CONFIGURED = !!RAW_API_BASE;
const API_BASE = RAW_API_BASE ?? '';

/** The configured backend origin, for the handful of callers that must build a URL themselves
 * rather than go through `request()` — today only `src/auth/devauth.ts`, which mints a local
 * developer token *before* there is a session for `request()` to authenticate with. Empty string
 * when nothing is configured, which is the same condition that forces `USE_MOCKS` on. */
export const API_BASE_URL = API_BASE;

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export function isForbidden(err: unknown): err is ApiError {
  return err instanceof ApiError && err.status === 403;
}
export function isUnauthorized(err: unknown): err is ApiError {
  return err instanceof ApiError && err.status === 401;
}

let authToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;
let currentMe: MeResponse | null = null; // used by mock mode to scope responses by role

export function setAuthToken(token: string | null) {
  authToken = token;
}
export function setUnauthorizedHandler(fn: (() => void) | null) {
  unauthorizedHandler = fn;
}
export function setMockCurrentUser(me: MeResponse | null) {
  currentMe = me;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_URL_CONFIGURED) {
    // Defence in depth — App.tsx already refuses to mount auth/navigation without an API URL in
    // a non-mock build, so this should be unreachable, but never let a request go to '' + path.
    throw new ApiError(0, 'not_configured', 'No API URL is configured for this build (EXPO_PUBLIC_API_URL).');
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  let body: any = null;
  try {
    body = await res.json();
  } catch {
    // no body (e.g. 204)
  }

  if (!res.ok) {
    const code = body?.error?.code ?? String(res.status);
    const message = body?.error?.message ?? res.statusText ?? 'Request failed';
    if (res.status === 401) unauthorizedHandler?.();
    throw new ApiError(res.status, code, message);
  }
  return body as T;
}

function mockDelay<T>(fn: () => T): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (MOCK_ERROR) {
        reject(new ApiError(500, 'mock_error', 'Simulated error (EXPO_PUBLIC_MOCK_ERROR=1) — this is what a broken backend looks like.'));
        return;
      }
      try {
        resolve(fn());
      } catch (e: any) {
        reject(new ApiError(e.status ?? 500, e.code ?? 'mock_error', e.message ?? 'Mock error'));
      }
    }, MOCK_DELAY_MS);
  });
}

function emptyPage<T>(): Paginated<T> {
  return { data: [], page: 1, page_size: 20, total: 0 };
}

function requireMockUser(): MeResponse {
  if (!currentMe) throw new ApiError(401, 'unauthorized', 'Not signed in');
  return currentMe;
}

function qs(params: Record<string, string | number | undefined>): string {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

/**
 * Every `multipart/form-data` upload (card scan, voice memo) shares this — never set
 * `Content-Type` manually here, RN/fetch must generate the boundary itself.
 */
async function requestMultipart<T>(path: string, form: FormData): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
    body: form,
  });
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    // no body
  }
  if (!res.ok) {
    const code = body?.error?.code ?? String(res.status);
    const message = body?.error?.message ?? res.statusText ?? 'Request failed';
    if (res.status === 401) unauthorizedHandler?.();
    throw new ApiError(res.status, code, message);
  }
  return body as T;
}

// ---------------------------------------------------------------------------
// Wire-format <-> app-shape mappers.
//
// types.ts (and mocks.ts, and every screen) is written against the SPEC.md/SPEC-V2.md app-facing
// shape. The FastAPI backend (app/api.py) sometimes names things differently, or nests them in a
// paginated envelope, or splits one app-facing field across several backend columns. Rather than
// letting that drift leak into every screen (which is exactly how C3/C4 in FABLE-AUDIT.md
// happened — the app calling a route/body the backend never had), every non-mock branch below
// goes through one of these mappers, so the *rest* of the app never has to know the backend
// disagrees with it.
// ---------------------------------------------------------------------------

/** backend `verdict_json`: {human, wants_meeting, partnership, high_budget} (app/api.py:2107,
 * app/tracking.py:226) -> app-facing ReplyClassifier: {is_human, wants_to_meet, partnership,
 * has_budget}. Field *names* differ on both sides, not just casing — this was unverified drift. */
function classifierFromVerdict(v: any): ReplyClassifier | null {
  if (!v || typeof v !== 'object') return null;
  const yn = (val: unknown): ClassifierAnswer => (val === true ? 'yes' : val === false ? 'no' : 'unknown');
  return {
    is_human: yn(v.human),
    wants_to_meet: yn(v.wants_meeting),
    partnership: yn(v.partnership),
    has_budget: yn(v.high_budget),
  };
}

/** backend `_reply_out()` (app/api.py:2012) -> app-facing LeadReply. */
function leadReplyFromBackend(r: any): LeadReply {
  const voided = r.status === 'voided';
  const outcome = r.scoring_outcome;
  // The backend only reports the actual point delta at the moment of send
  // (`send_reply`'s response carries `scoring_outcome.score_before/after`); a reply fetched later
  // via GET /leads/{id}/replies has no historical point total stored anywhere on the row. 0 here
  // is the honest "unknown", never a guess — see the report for the backend-side follow-up this
  // implies (persist the delta on the reply row so a re-fetch can show it too).
  const pointsAwarded = voided
    ? 0
    : outcome?.scored && typeof outcome.score_after === 'number' && typeof outcome.score_before === 'number'
      ? Math.max(0, outcome.score_after - outcome.score_before)
      : 0;
  return {
    id: String(r.id),
    lead_id: String(r.lead_id),
    body: r.body ?? '',
    received_at: r.received_at,
    classifier: voided ? null : classifierFromVerdict(r.verdict),
    points_awarded: pointsAwarded,
    voided,
    draft: null, // draftReply() is its own honest "not configured" stub call — never fabricated here.
    draft_available: false, // SPEC-V2 §9: no AI model is wired.
    sent: r.status === 'sent' || voided,
    sent_at: r.sent_at ?? null,
    sent_text: r.human_reply_body ?? null,
  };
}

// --- leads ------------------------------------------------------------------
/**
 * `GET /api/leads` and `GET /api/leads/{id}` used to be cast straight to `LeadSummary` /
 * `LeadDetail` with no translation at all. That worked in mock mode — the mocks were written
 * to the app's own types — and silently produced blank rows against the real API, because the
 * backend names several of these fields differently and models three of them differently again:
 *
 *   app                    backend                          note
 *   ─────────────────────  ───────────────────────────────  ──────────────────────────────────
 *   email / phone          identities[{kind,value,status}]  contact points are rows, not columns
 *   name_ja                name_kana                        it is a reading, not a translation
 *   channels[{type,…}]     identities (contact points)      backend's own `channels` key is the
 *                                                           SOURCE-DOOR list, a different thing
 *   score_breakdown.rule   score_breakdown.label_en/_ja     this is why the drawer showed bare
 *                                                           "+0.4" rows with no text at all
 *   timeline[].label/at    timeline[].kind/occurred_at      raw event rows, unlabelled
 *   consent.email/sms/…    consent.basis (one record)       see consentFromBackend()
 *
 * Everything here is a rename or a derivation from data the backend actually sent. Nothing is
 * invented: a field the backend does not have becomes `null`, never a plausible-looking value.
 */

/** Backend event `kind` -> the words a rep reads. Mirrors `ACTIVITY_LABELS` in app/api.py:1438,
 * extended to the bookkeeping and fact kinds that `/api/leads/{id}`'s timeline also returns and
 * that the tracking feed never had to name. Unknown kinds fall through to the raw kind. */
const EVENT_LABEL: Record<string, [string, string]> = {
  open: ['Opened an email', 'メール開封'],
  click: ['Clicked a link', 'リンククリック'],
  page_view: ['Viewed a page', 'ページ閲覧'],
  booking_page_view: ['Viewed the booking page', '相談ページ閲覧'],
  reply: ['Replied', '返信'],
  booking_completed: ['Booked a consultation', '相談予約完了'],
  wants_meeting: ['Wants to meet in person', '対面希望'],
  corporate_deal: ['Corporate deal signal', '法人取引の兆候'],
  partnership: ['Partnership signal', '提携の兆候'],
  high_budget: ['High budget discussed', '高予算の話題'],
  imported: ['Imported', '取込'],
  merged: ['Merged with a duplicate', '重複を統合'],
  sent: ['Email sent', 'メール送信'],
  bounce: ['Email bounced', 'メール不達'],
  unsubscribe: ['Unsubscribed', '配信停止'],
  stage_change: ['Stage changed', 'ステージ変更'],
};

/**
 * The backend stores ONE consent record per person (`lead_consent`: a single `basis` plus when
 * and how it was obtained), not a per-channel matrix — consent under 特定電子メール法 attaches
 * to the person and the evidence, not to a toggle per messaging app. The app's `ConsentInfo`
 * now says that directly rather than the three identical rows an earlier per-channel shape would
 * have forced, which would have implied a granularity the database cannot store.
 */
function consentFromBackend(raw: any): ConsentInfo | null {
  if (!raw) return null;
  const basis: string = raw.basis ?? 'unknown';
  const withdrawn = !!raw.withdrawn_at || basis === 'withdrawn';
  const state: ConsentState = withdrawn ? 'withdrawn' : basis === 'explicit' || basis === 'implied' ? 'granted' : 'unknown';
  return {
    state,
    basis,
    obtained_at: raw.obtained_at ?? null,
    obtained_via: raw.obtained_via ?? null,
    withdrawn_at: raw.withdrawn_at ?? null,
    updated_at: raw.updated_at ?? null,
  };
}

/** First usable value of a given identity kind. `status` is the backend's own reachability flag
 * (`ok` / `bounced` / `unsubscribed`); a bounced address is still the address, so it is returned
 * — suppressing it would hide from the rep the very fact that it stopped working. */
function identityValue(identities: any[] | undefined, kind: string): string | null {
  const hit = (identities ?? []).find((i) => i?.kind === kind && i?.value);
  return hit ? String(hit.value) : null;
}

function leadChannelsFromIdentities(identities: any[] | undefined, firstTouch: string | null): LeadChannel[] {
  return (identities ?? [])
    .filter((i) => i?.value)
    .map((i) => ({
      type: i.kind as LeadChannel['type'],
      identifier: String(i.value),
      // D11: `first_touch` is the door they came through and never changes. It is a source, not a
      // contact channel, so it only ever matches an identity when the two vocabularies overlap.
      first_touch: firstTouch != null && i.kind === firstTouch,
    }));
}

function leadSummaryFromBackend(raw: any): LeadSummary {
  return {
    id: String(raw.id),
    name: raw.name ?? '',
    name_ja: raw.name_kana ?? null,
    company: raw.company ?? null,
    email: raw.email ?? identityValue(raw.identities, 'email'),
    phone: raw.phone ?? identityValue(raw.identities, 'phone'),
    score: Number(raw.score ?? 0),
    stage: raw.stage,
    exit_state: raw.exit_state ?? null,
    owner_user_id: raw.owner_user_id ?? null,
    owner_name: raw.owner_name ?? null,
    region: Array.isArray(raw.region) ? raw.region : [],
    purpose: raw.purpose,
    relationship: raw.relationship,
    source: raw.source ?? raw.first_touch,
    activity_note: raw.activity_note ?? null,
    activity_note_ja: raw.activity_note_ja ?? null,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

function leadDetailFromBackend(raw: any): LeadDetail {
  const firstTouch: string | null = raw.source ?? raw.first_touch ?? null;
  return {
    ...leadSummaryFromBackend(raw),
    channels: leadChannelsFromIdentities(raw.identities, firstTouch),
    consent: consentFromBackend(raw.consent),
    score_breakdown: (raw.score_breakdown ?? []).map((b: any) => {
      const [en, ja] = EVENT_LABEL[b.kind] ?? [b.kind, b.kind];
      return {
        rule: b.label_en ?? en,
        rule_ja: b.label_ja ?? ja,
        points: Number(b.points ?? 0),
        active: true,
        at: b.occurred_at ?? null,
        // D8 made visible: a behaviour event whose decay has worn it down is dimmed rather than
        // hidden, so a rep can see *why* a score fell without opening the scoring model.
        faded: typeof b.decay_factor === 'number' && b.decay_factor < 0.9,
      };
    }),
    timeline: (raw.timeline ?? [])
      .filter((e: any) => !e.voided_at) // D7: a rep's "this wasn't real" removes it from the story.
      .map((e: any, i: number) => {
        const [en, ja] = EVENT_LABEL[e.kind] ?? [e.kind, e.kind];
        return {
          // The backend's timeline rows carry no id of their own, and (kind, occurred_at) is not
          // unique — a lead merged twice in the same second produced two identical React keys.
          // The array index is the only thing guaranteed distinct here.
          id: String(e.id ?? `${raw.id}-${i}-${e.kind}`),
          type: e.kind,
          label: e.detail ? `${en} — ${e.detail}` : en,
          label_ja: e.detail ? `${ja} — ${e.detail}` : ja,
          at: e.occurred_at,
          points: typeof e.points === 'number' ? e.points : null,
        };
      }),
  };
}

// --- booking -----------------------------------------------------------------
/** `GET /api/booking/settings` -> app-facing BookingSettings. `key`/`label_en` naming again, and
 * the assigned reps arrive as `[{user_id, name}]` objects where the app wants a plain id list —
 * `mt.rep_user_ids[0]` on an undefined array is what took the Booking screen down. */
function bookingSettingsFromBackend(raw: any): BookingSettings {
  return {
    meeting_types: (raw.meeting_types ?? []).map((mt: any) => ({
      type: mt.key ?? mt.type,
      label: mt.label_en ?? mt.label ?? mt.key,
      label_ja: mt.label_ja ?? mt.label_en ?? mt.key,
      duration_minutes: Number(mt.duration_minutes ?? 0),
      rep_user_ids: (mt.reps ?? mt.rep_user_ids ?? []).map((r: any) => (typeof r === 'string' ? r : r.user_id)),
    })),
    jst_gst_gap_hours: Number(raw.jst_gst_gap_hours ?? 0),
    // SPEC-V2 §4: the public booking page needs a domain and hosting that do not exist yet, so
    // this is the only value it can honestly take — the backend has no field for it at all.
    public_page_status: 'not_configured',
  };
}

// --- integrations ------------------------------------------------------------
/** `GET /api/integrations` -> app-facing IntegrationsResponse. Bare `{data: [...]}` envelope with
 * `label_en`/`status_detail` names; the app expects `{integrations: [...]}` with `name`/`status_note`.
 * `integrations` arriving `undefined` crashed the screen on `.length`. */
function integrationsFromBackend(raw: any): IntegrationsResponse {
  return {
    integrations: (raw.data ?? raw.integrations ?? []).map((i: any) => ({
      key: i.key,
      name: i.label_en ?? i.name ?? i.key,
      name_ja: i.label_ja ?? i.label_en ?? i.key,
      connected: !!i.connected,
      status_note: i.status_detail ?? i.status_note ?? '',
      status_note_ja: i.status_detail_ja ?? i.status_note_ja ?? null,
      what_is_needed: i.what_is_needed ?? null,
      last_sync_at: i.last_sync_at ?? null,
      record_count: typeof i.record_count === 'number' ? i.record_count : null,
      read_only: !!i.read_only,
    })),
  };
}

// --- SNS ---------------------------------------------------------------------
/**
 * `GET /api/sns/patterns` -> app-facing SnsPatternsResponse. The backend returns a bare
 * `{data: [...]}` envelope with `title_en`/`description_en` field names; the app expects
 * `{patterns: [...]}` with `name`/`note`. `patterns` arriving `undefined` is what threw
 * "Cannot read properties of undefined (reading 'map')" and blanked the SNS screen.
 */
function snsPatternsFromBackend(raw: any): SnsPatternsResponse {
  const rows: any[] = raw.data ?? raw.patterns ?? [];
  const counted = rows.filter((p) => typeof p.leads_count === 'number');
  return {
    patterns: rows.map((p) => ({
      key: p.key,
      name: p.title_en ?? p.name ?? '',
      name_ja: p.title_ja ?? p.name_ja ?? '',
      note: p.description_en ?? p.note ?? '',
      note_ja: p.description_ja ?? p.note_ja ?? null,
      // No backend field exists for post ideas — an empty list, never fabricated copy.
      ideas: [],
      leads_produced: typeof p.leads_count === 'number' ? p.leads_count : null,
    })),
    total_sns_leads: counted.reduce((n, p) => n + p.leads_count, 0),
    attribution_note:
      'Attributed by the content tag on each pattern. Leads that arrived through SNS without a tag are counted in Leads but not against any pattern here.',
    attribution_note_ja:
      'パターンごとのコンテンツタグで紐付けています。タグのないSNS経由リードはリード一覧には入りますが、ここではどのパターンにも計上されません。',
  };
}

function snsFunnelFromBackend(raw: any): SnsFunnelResponse {
  return {
    steps: (raw.steps ?? []).map((s: any) => ({
      key: s.step ?? s.key,
      label: s.label_en ?? s.label ?? '',
      label_ja: s.label_ja ?? s.label_en ?? '',
      count: Number(s.count ?? 0),
      tracked: s.tracked !== false,
    })),
  };
}

// --- pipeline + scoring model ------------------------------------------------
/**
 * `GET /api/pipeline` -> app-facing PipelineResponse. The backend calls a column's stage `key`;
 * the app calls it `stage`. Because the field simply arrived `undefined`, every column rendered
 * with the same missing React key and the nested lead rows lost their identity across updates.
 */
function pipelineFromBackend(raw: any): PipelineResponse {
  return {
    buckets: (raw.buckets ?? []).map((b: any) => ({
      stage: b.key ?? b.stage,
      label: b.label ?? '',
      label_ja: b.label_ja ?? b.label ?? '',
      count: Number(b.count ?? 0),
      leads: (b.leads ?? []).map(leadSummaryFromBackend),
    })),
  };
}

/**
 * `GET /api/scoring/model` -> app-facing ScoringModel. The backend names a rule's event
 * `event_kind` and splits the decay copy into a nested `decay` object with `explanation_en` /
 * `explanation_ja`; the app expects `kind` and a flat `decay_note`. `key={r.kind}` on every rule
 * row was therefore `undefined` for all of them — React's duplicate-key warning on the Tracking
 * screen was pointing at exactly this.
 */
function scoringModelFromBackend(raw: any): ScoringModel {
  return {
    rules: (raw.rules ?? []).map((r: any) => ({
      kind: r.event_kind ?? r.kind,
      label: r.label_en ?? r.label ?? r.event_kind,
      label_ja: r.label_ja ?? r.label_en ?? r.event_kind,
      points: Number(r.points ?? 0),
      group: r.group === 'fact' ? 'fact' : 'behaviour',
    })),
    threshold: Number(raw.threshold ?? 0),
    decay_note: raw.decay?.explanation_en ?? raw.decay_note ?? '',
    decay_note_ja: raw.decay?.explanation_ja ?? raw.decay_note_ja ?? null,
    crossed_this_week: Number(raw.crossed_this_week ?? 0),
  };
}

// --- nurture sequences -------------------------------------------------------
/**
 * `GET /api/sequences[/{id}]` -> app-facing SequenceSummary/SequenceDetail. Same untranslated-cast
 * problem the lead endpoints had, with the same symptom class: `status` is `active: boolean` on
 * the wire, per-step counters live under a nested `stats` object rather than flat, and the
 * exit-condition labels are `label_en`/`trigger_en` rather than `label`/`trigger`.
 *
 * `offset_label` has no backend field at all — the backend stores `offset_days`, an integer — so
 * it is formatted here (0 → "Immediately", 7 → "Week 1") rather than left blank.
 */
function sequenceSummaryFromBackend(raw: any): SequenceSummary {
  return {
    id: String(raw.id),
    name: raw.name ?? '',
    name_ja: raw.name_ja ?? null,
    status: raw.active ? 'active' : 'paused',
    total_sent: Number(raw.total_sent ?? 0),
    step_count: Number(raw.step_count ?? 0),
  };
}

function offsetLabel(days: number): [string, string] {
  if (days <= 0) return ['Immediately', '即時'];
  if (days % 7 === 0) return [`Week ${days / 7}`, `${days / 7}週目`];
  return [`Day ${days}`, `${days}日目`];
}

function pct(v: unknown): string {
  return typeof v === 'number' ? `${(v * 100).toFixed(1)}%` : '—';
}

function sequenceDetailFromBackend(raw: any): SequenceDetail {
  return {
    ...sequenceSummaryFromBackend(raw),
    editorial_rule: raw.editorial_rule?.en ?? '',
    editorial_rule_ja: raw.editorial_rule?.ja ?? null,
    steps: (raw.steps ?? []).map((st: any) => {
      const [en, ja] = offsetLabel(Number(st.offset_days ?? 0));
      const stats = st.stats ?? {};
      return {
        step: Number(st.step_no ?? 0),
        offset_label: en,
        offset_label_ja: ja,
        subject: st.subject ?? '',
        question: st.question ?? '',
        question_ja: st.question_ja ?? null,
        cta: st.cta ?? '',
        sent: Number(stats.sent ?? 0),
        opened: Number(stats.opened ?? 0),
        clicked: Number(stats.clicked ?? 0),
        open_rate: pct(stats.open_rate),
        click_rate: pct(stats.click_rate),
        active: !!st.active,
      };
    }),
    exit_conditions: (raw.exit_conditions ?? []).map((x: any) => ({
      action: x.action,
      label: x.label_en ?? x.action,
      label_ja: x.label_ja ?? x.label_en ?? x.action,
      trigger: x.trigger_en ?? '',
      trigger_ja: x.trigger_ja ?? x.trigger_en ?? '',
      // D17: these exits are proposed, never ratified — the flag must survive to the UI, which
      // renders them as "provisional" so nobody reads a proposal as a decision.
      provisional: !!x.provisional,
    })),
  };
}

/** backend `_note_out()` (app/api.py:2125) -> app-facing VoiceMemo. */
function voiceMemoFromNote(n: any): VoiceMemo {
  return {
    id: String(n.id),
    lead_id: String(n.lead_id),
    author_user_id: String(n.author_user_id),
    author_name: n.author_name ?? '',
    duration_seconds: n.duration_seconds ?? 0,
    recorded_at: n.created_at,
    transcription_available: false, // SPEC-V2 §10: never wired, matches backend's own honesty stub.
  };
}

// --- push settings/register ------------------------------------------------
const PUSH_TOKEN_STORAGE_KEY = 'exceedbox.registeredPushToken';
/** app/api.py §10b: `push_settings` has exactly these 4 real columns. `notify_task_escalation_level`
 * is an int threshold (D12b), not a per-user boolean list — `task_escalated` below is a lossy but
 * honest boolean view of it (on = level 2, off = level 0), never a field the backend can't store. */
function pushSettingsFromBackend(row: any, registeredToken: string | null): NotificationSettingsResponse {
  const level = Number(row.notify_task_escalation_level ?? 0);
  return {
    push_registered: !!registeredToken,
    push_token: registeredToken,
    settings: [
      { key: 'new_lead', label: 'A new lead arrives', label_ja: '新規リードが入った', enabled: !!row.notify_new_lead, manager_only: false },
      { key: 'hot_lead', label: 'Lead crosses the hot threshold', label_ja: 'リードがしきい値を超過', enabled: !!row.notify_hot_lead, manager_only: false },
      { key: 'reply_received', label: 'A lead replies', label_ja: 'リードから返信があった', enabled: !!row.notify_reply, manager_only: false },
      { key: 'task_escalated', label: 'A task escalates to level 2+', label_ja: 'タスクがレベル2以上にエスカレーション', enabled: level >= 2, manager_only: true },
    ],
  };
}
function pushSettingsPatchToBackend(patch: NotificationSettingsPatch): Record<string, boolean | number> {
  const body: Record<string, boolean | number> = {};
  for (const s of patch.settings) {
    if (s.key === 'new_lead') body.notify_new_lead = s.enabled;
    else if (s.key === 'hot_lead') body.notify_hot_lead = s.enabled;
    else if (s.key === 'reply_received') body.notify_reply = s.enabled;
    else if (s.key === 'task_escalated') body.notify_task_escalation_level = s.enabled ? 2 : 0;
  }
  return body;
}
/** iPadOS has its own `Platform.OS === 'ios'` value in RN — `Platform.isPad` is the only signal
 * that distinguishes it, and app/api.py's `/push/register` only accepts the 4 literal platform
 * strings below (422 on anything else, e.g. the JSON body's previously-missing `platform` field). */
function currentPlatform(): 'ios' | 'ipados' | 'android' | 'web' {
  if (Platform.OS === 'ios') return (Platform as any).isPad ? 'ipados' : 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'web';
}

// --- assignment rules --------------------------------------------------------
/** The backend's PUT replaces the *entire* rule set and needs every rule's match_field/match_value/
 * is_fallback (app/api.py:1796) — fields the app-facing AssignmentRule type doesn't carry at all
 * (it only has id/priority/topic/owner). This cache — populated by every GET — lets putAssignmentRules
 * reconstruct a full, valid backend payload from a patch that only changed an owner. */
let lastAssignmentRulesRaw: any[] | null = null;

function assignmentRuleTopic(matchField: string, matchValue: string | null): [string, string] {
  const raw = matchValue ?? '';
  if (matchField === 'region') {
    const pair = (regionLabel as any)(raw);
    if (pair) return pair;
  }
  if (matchField === 'purpose') {
    const pair = (purposeLabel as any)(raw);
    if (pair) return pair;
  }
  const fieldLabel: Record<string, [string, string]> = {
    region: ['Region', '地域'],
    purpose: ['Purpose', '目的'],
    language: ['Language', '言語'],
    topic: ['Topic', 'トピック'],
  };
  const [fEn, fJa] = fieldLabel[matchField] ?? [matchField, matchField];
  return [`${fEn}: ${raw}`, `${fJa}：${raw}`];
}

function assignmentRulesResponseFromBackend(rows: any[]): AssignmentRulesResponse {
  lastAssignmentRulesRaw = rows;
  const fallback = rows.find((r) => r.is_fallback);
  const rules: AssignmentRule[] = rows
    .filter((r) => !r.is_fallback)
    .map((r) => {
      const [topic, topic_ja] = assignmentRuleTopic(r.match_field, r.match_value);
      return {
        id: String(r.id),
        priority: r.priority,
        topic,
        topic_ja,
        owner_user_id: r.owner_user_id,
        owner_name: r.owner_name ?? r.owner_user_id,
      };
    });
  return {
    rules,
    fallback_owner_user_id: fallback?.owner_user_id ?? '',
    fallback_owner_name: fallback?.owner_name ?? '',
    fallback_note: 'No other rule matched this lead — assigned to the fallback owner.',
    fallback_note_ja: '他のルールに一致しなかったリードは、フォールバック担当者に割り当てられます。',
  };
}

// --- import (CSV / .xlsx) ----------------------------------------------------
/** Backend `POST /api/import/analyze` (app/csvimport.py `analyze()`) reads a real, typed field
 * set — `token`, `columns` (a flat header array), `guessed_mapping` (header -> one of
 * name/company/title/email/phone/null), `questions` (session-level, not per-column),
 * `sample_rows`, `rows_seen`, `preview_new`, `preview_duplicate` — not the app-facing
 * `ImportAnalyzeParsed` shape (`import_id`, `columns: ImportColumn[]`, `questions:
 * ImportQuestion[]` with per-column options). This builds the same per-column
 * "what does this ambiguous column mean" wizard UI the mock/demo build already has, from the
 * backend's real guessed_mapping + sample_rows, so ImportScreen.tsx never has to know the
 * difference between mock and live. */
const IMPORT_FIELD_OPTIONS: ImportQuestionOption[] = [
  { key: 'name', label: 'Name', label_ja: '氏名' },
  { key: 'email', label: 'Email', label_ja: 'メール' },
  { key: 'phone', label: 'Phone', label_ja: '電話' },
  { key: 'company', label: 'Company', label_ja: '会社名' },
  { key: 'title', label: 'Title', label_ja: '役職' },
  { key: 'ignore', label: 'Ignore this column', label_ja: 'このカラムを無視' },
];

function importAnalyzeResultFromBackend(raw: any, fileName: string): ImportAnalyzeResult {
  if (raw.needs_sheet_selection) {
    const choice: ImportSheetChoice = { needs_sheet_selection: true, file_name: raw.filename ?? fileName, sheets: raw.sheets ?? [] };
    return choice;
  }
  const headers: string[] = raw.columns ?? [];
  const guessed: Record<string, string | null> = raw.guessed_mapping ?? {};
  const sampleRows: Record<string, string>[] = raw.sample_rows ?? [];
  const columns: ImportColumn[] = headers.map((h) => ({
    key: h,
    header: h,
    sample_values: sampleRows.slice(0, 3).map((r) => r[h] ?? ''),
    guess: guessed[h] ?? null,
  }));
  const questions: ImportQuestion[] = columns
    .filter((col) => col.guess === null)
    .map((col) => ({
      column_key: col.key,
      question: `What does "${col.header}" mean?`,
      question_ja: `「${col.header}」は何を表していますか？`,
      options: IMPORT_FIELD_OPTIONS,
    }));
  const parsed: ImportAnalyzeParsed = {
    import_id: raw.token,
    file_name: fileName,
    row_count: raw.rows_seen ?? 0,
    columns,
    questions,
    preview_rows: sampleRows.slice(0, 5),
    new_count: raw.preview_new ?? 0,
    duplicate_count: raw.preview_duplicate ?? 0,
  };
  return parsed;
}

/** app-facing `ImportConsentState` ('unknown'|'granted'|'withdrawn') <-> backend
 * `answers.consent_basis` (csvimport.CONSENT_BASES: 'explicit'|'implied'|'ambiguous'|'unknown') —
 * different vocabularies for the same D13/SPEC-V2 §7 consent step. 'withdrawn' has no import-time
 * equivalent on the backend (you don't import someone who already withdrew) — sent as 'unknown'
 * and the real applied basis the backend reports is what gets shown back, never the raw input, so
 * the completion screen is always honest about what was actually recorded. */
function consentStateToBasis(state: ImportConsentState): string {
  if (state === 'granted') return 'explicit';
  return 'unknown';
}
function consentBasisToState(basis: string): ImportConsentState {
  if (basis === 'explicit' || basis === 'implied') return 'granted';
  return 'unknown';
}

function guessMimeType(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.xlsx') || lower.endsWith('.xlsm')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (lower.endsWith('.csv')) return 'text/csv';
  return 'text/plain';
}

export const api = {
  async getMe(): Promise<MeResponse> {
    if (USE_MOCKS) return mockDelay(() => requireMockUser());
    return request<MeResponse>('/api/me');
  },

  async getToday(page?: number, page_size?: number): Promise<Paginated<Task>> {
    if (USE_MOCKS) {
      if (MOCK_EMPTY) return mockDelay(() => emptyPage<Task>());
      return mockDelay(() => {
        const me = requireMockUser();
        return mocks.mockGetToday(me.id, page, page_size);
      });
    }
    return request<Paginated<Task>>(`/api/today${qs({ page, page_size })}`);
  },

  async createTask(input: CreateTaskInput): Promise<Task> {
    if (USE_MOCKS) return mockDelay(() => mocks.mockCreateTask(input));
    return request<Task>('/api/tasks', { method: 'POST', body: JSON.stringify(input) });
  },

  async patchTask(id: string, patch: TaskPatch): Promise<Task> {
    if (USE_MOCKS) return mockDelay(() => mocks.mockPatchTask(id, patch));
    return request<Task>(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
  },

  async getLeads(query: LeadsQuery): Promise<Paginated<LeadSummary>> {
    if (USE_MOCKS) {
      if (MOCK_EMPTY) return mockDelay(() => emptyPage<LeadSummary>());
      return mockDelay(() => {
        const me = requireMockUser();
        const scoped = roleCan(me.role, 'leads.view_all') ? query : { ...query, owner: me.id };
        return mocks.mockGetLeads(scoped);
      });
    }
    const res = await request<Paginated<any>>(
      `/api/leads${qs({ stage: query.stage, owner: query.owner, q: query.q, region: query.region, purpose: query.purpose, page: query.page, page_size: query.page_size })}`
    );
    return { ...res, data: res.data.map(leadSummaryFromBackend) };
  },

  async getLead(id: string): Promise<LeadDetail> {
    if (USE_MOCKS) return mockDelay(() => mocks.mockGetLeadDetail(id));
    return leadDetailFromBackend(await request<any>(`/api/leads/${id}`));
  },

  async createLead(input: CreateLeadInput): Promise<LeadDetail> {
    if (USE_MOCKS) return mockDelay(() => mocks.mockCreateLead(input));
    return leadDetailFromBackend(await request<any>('/api/leads', { method: 'POST', body: JSON.stringify(input) }));
  },

  async patchLead(id: string, patch: LeadEditPatch): Promise<LeadDetail> {
    if (USE_MOCKS) return mockDelay(() => mocks.mockPatchLead(id, patch));
    return leadDetailFromBackend(await request<any>(`/api/leads/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }));
  },

  async assignLead(id: string, owner_user_id: string): Promise<LeadDetail> {
    if (USE_MOCKS) {
      const me = requireMockUser();
      if (!roleCan(me.role, 'leads.assign')) return mockDelay(() => { throw Object.assign(new Error('Not allowed to assign leads'), { status: 403, code: 'forbidden' }); });
      return mockDelay(() => mocks.mockAssignLead(id, owner_user_id));
    }
    return leadDetailFromBackend(await request<any>(`/api/leads/${id}/assign`, { method: 'POST', body: JSON.stringify({ owner_user_id }) }));
  },

  async setLeadStage(id: string, stage: LeadStage): Promise<LeadDetail> {
    if (USE_MOCKS) return mockDelay(() => mocks.mockSetStage(id, stage));
    return leadDetailFromBackend(await request<any>(`/api/leads/${id}/stage`, { method: 'POST', body: JSON.stringify({ stage }) }));
  },

  async sendMeetingSignal(id: string, note?: string): Promise<LeadDetail> {
    if (USE_MOCKS) {
      const me = requireMockUser();
      return mockDelay(() => mocks.mockSendSignal(id, me.name, note));
    }
    return leadDetailFromBackend(
      await request<any>(`/api/leads/${id}/signal`, {
        method: 'POST',
        body: JSON.stringify({ type: 'wants_meeting', note }),
      })
    );
  },

  async getScore(id: string): Promise<ScoreExplain> {
    if (USE_MOCKS) return mockDelay(() => mocks.mockGetScore(id));
    return request<ScoreExplain>(`/api/leads/${id}/score`);
  },

  async getPipeline(): Promise<PipelineResponse> {
    if (USE_MOCKS) {
      return mockDelay(() => {
        const me = requireMockUser();
        return mocks.mockGetPipeline(roleCan(me.role, 'leads.view_all') ? null : me.id);
      });
    }
    return pipelineFromBackend(await request<any>('/api/pipeline'));
  },

  async getDashboard(): Promise<DashboardResponse> {
    if (USE_MOCKS) {
      return mockDelay(() => {
        const me = requireMockUser();
        return mocks.mockGetDashboard(roleCan(me.role, 'dashboard.per_rep'));
      });
    }
    return request<DashboardResponse>('/api/dashboard');
  },

  async getTeam(page?: number, page_size?: number): Promise<TeamResponse> {
    if (USE_MOCKS) return mockDelay(() => mocks.mockGetTeam(page, page_size));
    return request<TeamResponse>(`/api/team${qs({ page, page_size })}`);
  },

  async getUsers(page?: number, page_size?: number): Promise<Paginated<AppUser>> {
    if (USE_MOCKS) return mockDelay(() => mocks.mockGetUsers(page, page_size));
    return request<Paginated<AppUser>>(`/api/users${qs({ page, page_size })}`);
  },

  async createUser(input: CreateUserInput): Promise<AppUser> {
    if (USE_MOCKS) return mockDelay(() => mocks.mockCreateUser(input));
    return request<AppUser>('/api/users', { method: 'POST', body: JSON.stringify(input) });
  },

  async patchUser(id: string, patch: UserPatch): Promise<AppUser> {
    if (USE_MOCKS) return mockDelay(() => mocks.mockPatchUser(id, patch));
    return request<AppUser>(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
  },

  // -------------------------------------------------------------------------
  // SPEC-V2 §1 — Tracking
  // -------------------------------------------------------------------------
  async getActivity(page?: number, page_size?: number): Promise<Paginated<ActivityEvent>> {
    if (USE_MOCKS) {
      if (MOCK_EMPTY) return mockDelay(() => emptyPage<ActivityEvent>());
      return mockDelay(() => {
        const me = requireMockUser();
        return mocks.mockGetActivity(roleCan(me.role, 'leads.view_all') ? null : me.id, page, page_size);
      });
    }
    return request<Paginated<ActivityEvent>>(`/api/activity${qs({ page, page_size })}`);
  },

  async getScoringModel(): Promise<ScoringModel> {
    if (USE_MOCKS) return mockDelay(() => mocks.mockGetScoringModel());
    return scoringModelFromBackend(await request<any>('/api/scoring/model'));
  },

  // -------------------------------------------------------------------------
  // SPEC-V2 §2 — Nurture
  // -------------------------------------------------------------------------
  async getSequences(page?: number, page_size?: number): Promise<Paginated<SequenceSummary>> {
    if (USE_MOCKS) return mockDelay(() => mocks.mockGetSequences(page, page_size));
    const res = await request<Paginated<any>>(`/api/sequences${qs({ page, page_size })}`);
    return { ...res, data: res.data.map(sequenceSummaryFromBackend) };
  },

  async getSequence(id: string): Promise<SequenceDetail> {
    if (USE_MOCKS) return mockDelay(() => mocks.mockGetSequenceDetail(id));
    return sequenceDetailFromBackend(await request<any>(`/api/sequences/${id}`));
  },

  async patchSequenceStep(id: string, step: number, patch: SequenceStepPatch): Promise<SequenceDetail> {
    if (USE_MOCKS) {
      const me = requireMockUser();
      if (!roleCan(me.role, 'nurture.edit')) {
        return mockDelay(() => { throw Object.assign(new Error('Not allowed to edit sequences'), { status: 403, code: 'forbidden' }); });
      }
      return mockDelay(() => mocks.mockPatchSequenceStep(id, step, patch));
    }
    return sequenceDetailFromBackend(await request<any>(`/api/sequences/${id}/steps/${step}`, { method: 'PATCH', body: JSON.stringify(patch) }));
  },

  // -------------------------------------------------------------------------
  // SPEC-V2 §3 — SNS
  // -------------------------------------------------------------------------
  async getSnsPatterns(): Promise<SnsPatternsResponse> {
    if (USE_MOCKS) return mockDelay(() => mocks.mockGetSnsPatterns());
    return snsPatternsFromBackend(await request<any>('/api/sns/patterns'));
  },

  async getSnsFunnel(): Promise<SnsFunnelResponse> {
    if (USE_MOCKS) return mockDelay(() => mocks.mockGetSnsFunnel());
    return snsFunnelFromBackend(await request<any>('/api/sns/funnel'));
  },

  // -------------------------------------------------------------------------
  // SPEC-V2 §4 — Booking
  // -------------------------------------------------------------------------
  async getBookingSettings(): Promise<BookingSettings> {
    if (USE_MOCKS) return mockDelay(() => mocks.mockGetBookingSettings());
    return bookingSettingsFromBackend(await request<any>('/api/booking/settings'));
  },

  async patchBookingSettings(patch: BookingSettingsPatch): Promise<BookingSettings> {
    if (USE_MOCKS) {
      const me = requireMockUser();
      if (!roleCan(me.role, 'booking.manage')) {
        return mockDelay(() => { throw Object.assign(new Error('Not allowed to edit booking settings'), { status: 403, code: 'forbidden' }); });
      }
      return mockDelay(() => mocks.mockPatchBookingSettings(patch));
    }
    return bookingSettingsFromBackend(await request<any>('/api/booking/settings', { method: 'PATCH', body: JSON.stringify(patch) }));
  },

  /** Backend `GET /api/booking/slots` (app/api.py:1689) returns ONE object for ONE
   * `meeting_type` — `{meeting_type, duration_minutes, week_start, week_end, timezone,
   * jst_gst_gap_hours, slots:[{starts_at, ends_at, available_rep_user_ids}]}` — not the flat
   * `BookingSlot[]` the app renders, and it names owners only by id. This fetches all 3 meeting
   * types plus the roster (for names) and flattens each (meeting_type, slot, rep) into one row,
   * matching the shape BookingScreen already expects. */
  async getBookingSlots(): Promise<BookingSlot[]> {
    if (USE_MOCKS) return mockDelay(() => mocks.mockGetBookingSlots());
    const types: MeetingType[] = ['consult_30', 'site_inspection', 'showroom_visit'];
    const [teamRes, ...slotResults] = await Promise.all([
      request<Paginated<{ user_id: string; name: string }>>('/api/team?page=1&page_size=200'),
      ...types.map((mt) => request<any>(`/api/booking/slots${qs({ meeting_type: mt })}`)),
    ]);
    const nameByUser = new Map(teamRes.data.map((m) => [m.user_id, m.name]));
    const out: BookingSlot[] = [];
    types.forEach((mt, i) => {
      const slots: any[] = slotResults[i]?.slots ?? [];
      for (const slot of slots) {
        for (const repId of (slot.available_rep_user_ids ?? []) as string[]) {
          out.push({
            id: `${mt}-${slot.starts_at}-${repId}`,
            meeting_type: mt,
            rep_user_id: repId,
            rep_name: nameByUser.get(repId) ?? repId,
            start_at: slot.starts_at,
            end_at: slot.ends_at,
          });
        }
      }
    });
    return out;
  },

  // -------------------------------------------------------------------------
  // SPEC-V2 §5 — Assign
  // -------------------------------------------------------------------------
  /** Backend `GET /api/assignment/rules` (app/api.py:1773) returns a paginated envelope of rows
   * shaped `{id, priority, match_field, match_value, owner_user_id, owner_name, is_fallback,
   * active}` — the fallback is one of those rows (`is_fallback:true`), not a separate
   * `fallback_*` set of fields, and there is no `topic`/`topic_ja` at all. Mapped via
   * assignmentRulesResponseFromBackend(), which also caches the raw rows for putAssignmentRules. */
  async getAssignmentRules(): Promise<AssignmentRulesResponse> {
    if (USE_MOCKS) return mockDelay(() => mocks.mockGetAssignmentRules());
    const res = await request<{ data: any[] }>('/api/assignment/rules');
    return assignmentRulesResponseFromBackend(res.data);
  },

  /** Backend `PUT /api/assignment/rules` (app/api.py:1796) replaces the whole rule set and
   * requires every rule's match_field/match_value/is_fallback — fields the app-facing
   * AssignmentRulesPatch (id/priority/owner_user_id only) doesn't carry. Reconstructed here from
   * the raw rows getAssignmentRules() cached; if that cache is empty (put called before any get)
   * this fails loudly rather than sending a malformed rule set. */
  async putAssignmentRules(patch: AssignmentRulesPatch): Promise<AssignmentRulesResponse> {
    if (USE_MOCKS) {
      const me = requireMockUser();
      if (!roleCan(me.role, 'assignment.manage')) {
        return mockDelay(() => { throw Object.assign(new Error('Not allowed to edit assignment rules'), { status: 403, code: 'forbidden' }); });
      }
      return mockDelay(() => mocks.mockPutAssignmentRules(patch));
    }
    if (!lastAssignmentRulesRaw) {
      throw new ApiError(0, 'stale_rules', 'Assignment rules must be loaded (getAssignmentRules) before they can be saved.');
    }
    const byId = new Map(lastAssignmentRulesRaw.map((r) => [String(r.id), r]));
    const fallbackRaw = lastAssignmentRulesRaw.find((r) => r.is_fallback);
    const rules = patch.rules.map((p) => {
      const raw = byId.get(String(p.id));
      const isFallback = raw ? !!raw.is_fallback : fallbackRaw ? String(p.id) === String(fallbackRaw.id) : false;
      return {
        priority: p.priority,
        match_field: isFallback ? null : (raw?.match_field ?? null),
        match_value: isFallback ? null : (raw?.match_value ?? null),
        owner_user_id: p.owner_user_id,
        is_fallback: isFallback,
      };
    });
    const res = await request<{ data: any[] }>('/api/assignment/rules', { method: 'PUT', body: JSON.stringify({ rules }) });
    return assignmentRulesResponseFromBackend(res.data);
  },

  async getCalendarWeek(user: string, week?: string): Promise<CalendarWeekResponse> {
    if (USE_MOCKS) return mockDelay(() => mocks.mockGetCalendarWeek(user, week));
    return request<CalendarWeekResponse>(`/api/calendar${qs({ user, week })}`);
  },

  // -------------------------------------------------------------------------
  // SPEC-V2 §6 — Card scan
  // -------------------------------------------------------------------------
  /** Backend `POST /api/leads/scan` (app/api.py:1874) reads individual multipart `Form` fields
   * (`name` required, `consent_given`) — not a JSON `fields` blob + `consent` boolean field, which
   * always 422'd with "name is required" even when a name was typed. It also returns the lead
   * detail directly (plus an `extraction` stub), not `{lead, deduped, matched_on}` — `deduped`/
   * `matched_on` are computed internally by `ingest.upsert_lead()` but never put on the HTTP
   * response, so this honestly reports `deduped:false` rather than guessing; see the report for
   * the one-line backend addition that would close that gap. */
  async scanLead(input: ScanLeadInput): Promise<ScanLeadResult> {
    if (USE_MOCKS) return mockDelay(() => mocks.mockScanLead(input));
    if (!input.image_uri) {
      throw new ApiError(422, 'missing_image', 'An image is required to scan a business card.');
    }
    const form = new FormData();
    form.append('image', { uri: input.image_uri, name: 'card.jpg', type: 'image/jpeg' } as any);
    form.append('name', (input.fields.name ?? '').trim());
    if (input.fields.reading) form.append('name_kana', input.fields.reading);
    if (input.fields.company) form.append('company', input.fields.company);
    if (input.fields.title) form.append('title', input.fields.title);
    if (input.fields.email) form.append('email', input.fields.email);
    if (input.fields.phone) form.append('phone', input.fields.phone);
    if (input.fields.address) form.append('address', input.fields.address);
    form.append('consent_given', String(input.consent));
    const lead = await requestMultipart<LeadDetail>('/api/leads/scan', form);
    return { lead, deduped: false, matched_on: null };
  },

  // -------------------------------------------------------------------------
  // SPEC-V2 §7 — Import
  // -------------------------------------------------------------------------
  /** Backend `POST /api/import/analyze` (app/csvimport.py) is a real multipart file upload —
   * `file: UploadFile`, optional `sheet_name: Form` — parsed server-side (CSV via the stdlib,
   * .xlsx via openpyxl), never JSON rows the app pre-parsed itself. Mapped through
   * importAnalyzeResultFromBackend() above. */
  async analyzeImport(input: ImportAnalyzeInput): Promise<ImportAnalyzeResult> {
    if (USE_MOCKS) return mockDelay(() => mocks.mockAnalyzeImport(input));
    const form = new FormData();
    form.append('file', { uri: input.file_uri, name: input.file_name, type: input.mime_type || guessMimeType(input.file_name) } as any);
    if (input.sheet_name) form.append('sheet_name', input.sheet_name);
    const raw = await requestMultipart<any>('/api/import/analyze', form);
    return importAnalyzeResultFromBackend(raw, input.file_name);
  },

  /** Backend `POST /api/import/commit` (app/csvimport.py) takes `{token, mapping, answers}` — not
   * `{import_id, mapping, consent_state}`. `import_id` here IS the backend's `token` (see
   * importAnalyzeResultFromBackend()); `consent_state` is translated to `answers.consent_basis`
   * via consentStateToBasis()/consentBasisToState() above, and the RESULT reports back whatever
   * basis the backend actually applied — never just echoing what was sent. */
  async commitImport(input: ImportCommitInput): Promise<ImportCommitResult> {
    if (USE_MOCKS) return mockDelay(() => mocks.mockCommitImport(input));
    const raw = await request<any>('/api/import/commit', {
      method: 'POST',
      body: JSON.stringify({ token: input.import_id, mapping: input.mapping, answers: { consent_basis: consentStateToBasis(input.consent_state) } }),
    });
    return { new_leads: raw.rows_created, duplicate_leads: raw.rows_merged, consent_state: consentBasisToState(raw.consent_basis_applied) };
  },

  // -------------------------------------------------------------------------
  // SPEC-V2 §8 — Integrations
  // -------------------------------------------------------------------------
  async getIntegrations(): Promise<IntegrationsResponse> {
    if (USE_MOCKS) return mockDelay(() => mocks.mockGetIntegrations());
    return integrationsFromBackend(await request<any>('/api/integrations'));
  },

  async syncGoHighLevel(): Promise<GoHighLevelSyncResult> {
    if (USE_MOCKS) {
      const me = requireMockUser();
      if (!roleCan(me.role, 'integrations.manage')) {
        return mockDelay(() => { throw Object.assign(new Error('Not allowed to trigger a sync'), { status: 403, code: 'forbidden' }); });
      }
      return mockDelay(() => mocks.mockSyncGoHighLevel());
    }
    return request<GoHighLevelSyncResult>('/api/integrations/gohighlevel/sync', { method: 'POST' });
  },

  // -------------------------------------------------------------------------
  // SPEC-V2 §9 — AI reply
  // -------------------------------------------------------------------------
  /** Backend `GET /api/leads/{id}/replies` (app/api.py:2023) returns a paginated envelope
   * (`{data,page,page_size,total}`), not a bare array — unwrapped + mapped here via
   * leadReplyFromBackend(). */
  async getLeadReplies(leadId: string): Promise<LeadReply[]> {
    if (USE_MOCKS) return mockDelay(() => mocks.mockGetLeadReplies(leadId));
    const res = await request<{ data: any[] }>(`/api/leads/${leadId}/replies`);
    return res.data.map(leadReplyFromBackend);
  },

  /** Backend `POST /api/replies/{id}/draft` (app/api.py:2040) takes no body and never stores
   * anything — it is purely the honest `{configured:false, reason, manual_path}` "no model
   * wired" stub (SPEC-V2 §9), with no field anywhere to persist a manually-typed draft server
   * side. There is nothing to map into a LeadReply here, so this surfaces that reason as a
   * thrown ApiError exactly like every other "not configured" provider in this file, rather than
   * inventing a LeadReply the backend never returned. The typed draft text the caller already
   * holds in local state is the only place it lives — see AiReplyModal, which sends it straight
   * through sendReply() instead. */
  async draftReply(replyId: string, _input: DraftReplyInput): Promise<LeadReply> {
    if (USE_MOCKS) return mockDelay(() => mocks.mockDraftReply(replyId, _input));
    const res = await request<{ configured: boolean; reason: string; manual_path: string }>(
      `/api/replies/${replyId}/draft`,
      { method: 'POST' }
    );
    throw new ApiError(0, 'not_configured', res.reason || 'No AI model is wired to draft replies — type the reply yourself and send it.');
  },

  /** Backend `POST /api/replies/{id}/send` (app/api.py:2060) takes `{action:'send', text, verdict}`
   * where `verdict` is `{human, wants_meeting, partnership, high_budget}` (app/tracking.py:226) —
   * different field names than the app-facing ReplyClassifierInput this collects from the
   * approve-and-send UI. */
  async sendReply(replyId: string, input: SendReplyInput): Promise<LeadReply> {
    if (USE_MOCKS) return mockDelay(() => mocks.mockSendReply(replyId, input));
    const body = {
      action: 'send',
      text: input.text,
      verdict: {
        human: input.classifier.is_human,
        wants_meeting: input.classifier.wants_to_meet,
        partnership: input.classifier.partnership,
        high_budget: input.classifier.has_budget,
      },
    };
    const r = await request<any>(`/api/replies/${replyId}/send`, { method: 'POST', body: JSON.stringify(body) });
    return leadReplyFromBackend(r);
  },

  /** D7's "this wasn't real" has no dedicated route — `POST /api/replies/{id}/void` 404s, it
   * does not exist anywhere in app/api.py. The real path is the SAME route sendReply() uses,
   * `POST /api/replies/{id}/send`, with `{action:'not_real'}` (app/api.py:2084-2095). If a
   * dedicated `/void` route is ever added server-side this is the one call site to repoint. */
  async voidReply(replyId: string): Promise<LeadReply> {
    if (USE_MOCKS) return mockDelay(() => mocks.mockVoidReply(replyId));
    const r = await request<any>(`/api/replies/${replyId}/send`, { method: 'POST', body: JSON.stringify({ action: 'not_real' }) });
    return leadReplyFromBackend(r);
  },

  // -------------------------------------------------------------------------
  // SPEC-V2 §10 — voice memo, push notifications
  // -------------------------------------------------------------------------
  /** Backend route is `/api/leads/{id}/notes` (app/api.py:2140,2166), not `/voice-memos` — that
   * path 404s. GET also returns a paginated envelope, not a bare array. */
  async getVoiceMemos(leadId: string): Promise<VoiceMemo[]> {
    if (USE_MOCKS) return mockDelay(() => mocks.mockGetVoiceMemos(leadId));
    const res = await request<{ data: any[] }>(`/api/leads/${leadId}/notes`);
    return res.data.map(voiceMemoFromNote);
  },

  /** Backend `POST /api/leads/{id}/notes` wants multipart (`audio: UploadFile`,
   * `duration_seconds: Form`), not the JSON `{duration_seconds, local_uri}` body this used to
   * send — which would 422 (missing required `audio` file) even at the right path. */
  async createVoiceMemo(leadId: string, input: CreateVoiceMemoInput): Promise<VoiceMemo> {
    if (USE_MOCKS) {
      const me = requireMockUser();
      return mockDelay(() => mocks.mockCreateVoiceMemo(leadId, input, me.id, me.name));
    }
    const form = new FormData();
    form.append('audio', { uri: input.local_uri, name: 'note.m4a', type: 'audio/m4a' } as any);
    form.append('duration_seconds', String(input.duration_seconds));
    const note = await requestMultipart<any>(`/api/leads/${leadId}/notes`, form);
    return voiceMemoFromNote(note);
  },

  /** Backend route is `/api/push/settings` (app/api.py:2214), not `/api/notifications/settings`.
   * The response shape also differs completely — see pushSettingsFromBackend(). */
  async getNotificationSettings(): Promise<NotificationSettingsResponse> {
    if (USE_MOCKS) return mockDelay(() => mocks.mockGetNotificationSettings());
    const [row, registeredToken] = await Promise.all([
      request<any>('/api/push/settings'),
      AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY),
    ]);
    return pushSettingsFromBackend(row, registeredToken);
  },

  async patchNotificationSettings(patch: NotificationSettingsPatch): Promise<NotificationSettingsResponse> {
    if (USE_MOCKS) return mockDelay(() => mocks.mockPatchNotificationSettings(patch));
    const body = pushSettingsPatchToBackend(patch);
    const [row, registeredToken] = await Promise.all([
      request<any>('/api/push/settings', { method: 'PATCH', body: JSON.stringify(body) }),
      AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY),
    ]);
    return pushSettingsFromBackend(row, registeredToken);
  },

  /** Backend route is `/api/push/register` (app/api.py:2189), not `/api/notifications/register`,
   * and requires a `platform` field the app never sent (`token` alone always 422'd: "token and a
   * valid platform are required"). The backend has no "am I registered" read endpoint, so the
   * registered flag is tracked locally (AsyncStorage) the moment a register call actually
   * succeeds — never assumed. */
  async registerPushToken(token: string): Promise<NotificationSettingsResponse> {
    if (USE_MOCKS) return mockDelay(() => mocks.mockRegisterPushToken(token));
    const platform = currentPlatform();
    await request<any>('/api/push/register', { method: 'POST', body: JSON.stringify({ token, platform }) });
    await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
    const row = await request<any>('/api/push/settings');
    return pushSettingsFromBackend(row, token);
  },
};

export const MOCKS_ENABLED = USE_MOCKS;
