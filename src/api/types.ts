/**
 * Types mirroring every SPEC.md response shape.
 * SPEC.md is the source of truth — if the running backend disagrees, this file wins.
 */

export type Role = 'admin' | 'marketing' | 'office_manager' | 'sales';
export type Office = 'tokyo' | 'dubai';

export interface MeResponse {
  id: string;
  email: string;
  name: string;
  role: Role;
  office: Office;
  permissions: string[];
}

// ---------------------------------------------------------------------------
// Pagination — every list endpoint returns this shape.
// ---------------------------------------------------------------------------
export interface Paginated<T> {
  data: T[];
  page: number;
  page_size: number;
  total: number;
}

// ---------------------------------------------------------------------------
// Tasks — D12: type, owner, due, state, created_by, reason, escalation.
// ---------------------------------------------------------------------------
export type TaskType = 'call' | 'email' | 'meeting' | 'follow_up' | 'showroom_visit' | 'other';
export type TaskState = 'open' | 'done' | 'snoozed';
export type TaskCreatedBy = 'ai' | 'rule' | 'human';
/** D12b: escalation level, driven by score x lateness. */
export type EscalationLevel = 0 | 1 | 2 | 3;

export interface Task {
  id: string;
  type: TaskType;
  owner_user_id: string;
  owner_name: string;
  lead_id: string;
  lead_name: string;
  lead_name_ja?: string | null;
  lead_score: number;
  due_at: string; // ISO 8601
  state: TaskState;
  reason: string;
  reason_ja?: string | null;
  escalation_level: EscalationLevel;
  created_by: TaskCreatedBy;
  created_at: string;
}

export interface CreateTaskInput {
  type: TaskType;
  owner_user_id: string;
  lead_id?: string;
  due_at: string;
  reason: string;
}

export type TaskPatch =
  | { action: 'complete' }
  | { action: 'snooze'; until: string }
  | { action: 'reassign'; owner_user_id: string }
  | { action: 'change_due'; due_at: string };

// ---------------------------------------------------------------------------
// Leads — D9 categories, D10 stages, D13 dedupe/channels.
// ---------------------------------------------------------------------------

/** D10: six forward stages. */
export type LeadStage =
  | 'new'
  | 'nurturing'
  | 'engaged'
  | 'meeting_booked'
  | 'in_negotiation'
  | 'won';

/** D10: four exit states — schema has them, Balraj never explicitly ratified them. Flagged in UI. */
export type LeadExitState = 'lost' | 'too_early' | 'unreachable' | 'unsubscribed';

// ---------------------------------------------------------------------------
// Lead vocabularies
//
// Every union below is the BACKEND's vocabulary, verbatim — the values in
// `exceed-box-app/schema.sql`'s CHECK constraints and `app/api.py`'s REGIONS /
// PURPOSES / FORWARD_STAGES / EXIT_STATES tuples. The database refuses to store
// anything else, so the database is what these have to agree with.
//
// They did not agree before 2026-08-31, and the app had never been run against
// the real API, so nothing caught it: the app said `corporate_base` where the
// backend says `business_base`, `japan_showroom` for `japan`, `csv_import` for
// `csv`, `landing_page` for `lp_form`, `email_reply` for `gmail`, and invented
// `undecided` / `uncategorized` / `unclassified` values the backend never emits.
// The first real lead carrying any of them white-screened the lead drawer, via
// a label lookup that returned `undefined` and was then indexed. Both halves of
// that are fixed: these names now match, AND the label functions in mocks.ts are
// total, so a future addition on the server degrades to showing the raw value
// instead of crashing the screen.
// ---------------------------------------------------------------------------

/** D9 ① 地域 WHERE — multi-select. Backend `app/api.py:REGIONS`. An empty array is
 * how "not decided yet" is represented; there is no sentinel value for it. */
export type LeadRegion = 'dubai' | 'lombok' | 'japan';

/** D9 ② 目的 WHY — single value, discovered over time. Backend `app/api.py:PURPOSES`
 * and the `leads.purpose` CHECK constraint. `unknown` is a real answer (D9), not a gap. */
export type LeadPurpose =
  | 'investment'
  | 'relocation'
  | 'second_home'
  | 'business_base'
  | 'unknown';

/** D9 ③ 関係 WHO — derived from scoring, never hand-picked. Backend `leads.relationship`
 * CHECK constraint: exactly these three, with `individual` as the default. */
export type LeadRelationship = 'individual' | 'corporate' | 'partner';

/** D11: every source door that exists or is planned. Backend `lead_channels.channel`
 * CHECK constraint — the same vocabulary serves `first_touch` (which never changes)
 * and each per-channel row. */
export type LeadSource =
  | 'business_card'
  | 'csv'
  | 'gohighlevel'
  | 'lp_form'
  | 'sns'
  | 'gmail'
  | 'referral'
  | 'whatsapp'
  | 'line'
  | 'showroom'
  | 'property_finder';

export interface LeadSummary {
  id: string;
  name: string;
  name_ja?: string | null;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  score: number;
  stage: LeadStage;
  exit_state: LeadExitState | null;
  owner_user_id: string | null;
  owner_name: string | null;
  region: LeadRegion[];
  purpose: LeadPurpose;
  relationship: LeadRelationship;
  source: LeadSource;
  /** D10: generated activity note, never hand-typed. */
  activity_note: string | null;
  activity_note_ja?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimelineEvent {
  id: string;
  type: string;
  label: string;
  label_ja?: string | null;
  at: string;
  points?: number | null;
}

export interface LeadChannel {
  type: 'email' | 'sms' | 'whatsapp' | 'line' | 'phone';
  identifier: string;
  first_touch: boolean;
}

export type ConsentState = 'granted' | 'withdrawn' | 'unknown';

/**
 * One consent record per person — the shape of `lead_consent` in the backend schema, which is
 * a single `basis` plus the evidence for it, NOT a per-channel matrix. Consent under
 * 特定電子メール法 attaches to the person and to how it was obtained; there is no toggle per
 * messaging app to store, so the app does not pretend there is one.
 *
 * `state` is the derived answer to the only question a rep actually asks — may I contact this
 * person — and `basis` is the raw legal ground it was derived from ('explicit' | 'implied' |
 * 'ambiguous' | 'unknown' | 'withdrawn'). Both are shown: the first is what to do now, the
 * second is what would have to be defended later.
 */
export interface ConsentInfo {
  state: ConsentState;
  basis: string;
  obtained_at: string | null;
  obtained_via: string | null;
  withdrawn_at: string | null;
  updated_at: string | null;
}

export interface ScoreBreakdownItem {
  rule: string;
  rule_ja?: string | null;
  points: number;
  active: boolean;
  at?: string | null;
  faded?: boolean;
}

export interface ScoreExplain {
  lead_id: string;
  score: number;
  threshold: number;
  breakdown: ScoreBreakdownItem[];
  decay_note?: string | null;
}

export interface LeadDetail extends LeadSummary {
  timeline: TimelineEvent[];
  channels: LeadChannel[];
  consent: ConsentInfo | null;
  score_breakdown: ScoreBreakdownItem[];
}

export interface LeadsQuery {
  stage?: LeadStage;
  owner?: string;
  q?: string;
  region?: LeadRegion;
  purpose?: LeadPurpose;
  page?: number;
  page_size?: number;
}

export interface CreateLeadInput {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source: LeadSource;
  region?: LeadRegion[];
  purpose?: LeadPurpose;
}

export type LeadEditPatch = Partial<
  Pick<LeadSummary, 'name' | 'email' | 'phone' | 'company' | 'region' | 'purpose'>
>;

// ---------------------------------------------------------------------------
// Pipeline — D10 kanban.
// ---------------------------------------------------------------------------
export interface PipelineBucket {
  stage: LeadStage;
  label: string;
  label_ja: string;
  count: number;
  leads: LeadSummary[];
}

export interface PipelineResponse {
  buckets: PipelineBucket[];
}

// ---------------------------------------------------------------------------
// Dashboard — D15/D16.
// ---------------------------------------------------------------------------
export interface DashboardTile {
  key: 'total_leads' | 'first_sends' | 'meetings_booked' | 'in_negotiation' | 'won' | 'expected_revenue';
  label: string;
  label_ja: string;
  value: number | null;
  unavailable_reason?: string | null;
  /** Japanese half of the same sentence (app/api.py dashboard()); older servers omit it. */
  unavailable_reason_ja?: string | null;
}

export interface TrendPoint {
  date: string;
  leads: number;
  meetings_booked: number;
  in_negotiation: number;
}

export interface TrendFlag {
  message: string;
  message_ja?: string | null;
  detail: string;
  detail_ja?: string | null;
}

export interface FunnelStep {
  stage: LeadStage;
  label: string;
  label_ja: string;
  count: number;
}

export interface RegionBreakdownItem {
  region: LeadRegion;
  label: string;
  label_ja: string;
  count: number;
}

export interface SourceBreakdownItem {
  source: LeadSource;
  label: string;
  label_ja: string;
  count: number;
}

export interface RepPerformance {
  user_id: string;
  name: string;
  office: Office;
  leads_owned: number;
  tasks_open: number;
  tasks_overdue: number;
  meetings_booked: number;
  won: number;
}

export interface DashboardResponse {
  tiles: DashboardTile[];
  trend: TrendPoint[];
  trend_flag: TrendFlag | null;
  funnel: FunnelStep[];
  by_region: RegionBreakdownItem[];
  by_source: SourceBreakdownItem[];
  hot_leads: LeadSummary[];
  by_rep: RepPerformance[] | null; // null when caller lacks dashboard.per_rep
}

// ---------------------------------------------------------------------------
// Team — D12a per-rep accountability.
// ---------------------------------------------------------------------------
export interface TeamMember {
  user_id: string;
  name: string;
  role: Role;
  office: Office;
  is_active: boolean;
  tasks_open: number;
  tasks_overdue: number;
  tasks_escalated: number;
  leads_owned: number;
  meetings_booked: number;
  won: number;
  tasks: Task[];
}

/** SPEC.md: "Every list endpoint is paginated and returns { data, page, page_size, total }." */
export type TeamResponse = Paginated<TeamMember>;

// ---------------------------------------------------------------------------
// Users — admin only.
// ---------------------------------------------------------------------------
export interface AppUser {
  id: string;
  email: string;
  display_name: string;
  role: Role;
  office: Office;
  is_active: boolean;
  created_at: string;
}

export interface CreateUserInput {
  email: string;
  display_name: string;
  role: Role;
  office: Office;
}

export interface UserPatch {
  role?: Role;
  is_active?: boolean;
}

// ---------------------------------------------------------------------------
// SPEC-V2 §1 — Tracking: 反応検知・興味スコアリング
// ---------------------------------------------------------------------------
export type ActivityEventType =
  | 'open'
  | 'click'
  | 'page_view'
  | 'booking_page_view'
  | 'reply'
  | 'booking_completed'
  | 'manual_signal';

export interface ActivityEvent {
  id: string;
  lead_id: string;
  lead_name: string;
  lead_name_ja?: string | null;
  type: ActivityEventType;
  label: string;
  label_ja?: string | null;
  points: number;
  score_after: number;
  campaign: string | null;
  campaign_ja?: string | null;
  at: string;
}

/** D8: behaviour fades, facts are permanent. */
export type ScoringRuleGroup = 'behaviour' | 'fact';

export interface ScoringRule {
  kind: string;
  label: string;
  label_ja: string;
  points: number;
  group: ScoringRuleGroup;
}

export interface ScoringModel {
  rules: ScoringRule[];
  threshold: number;
  decay_note: string;
  decay_note_ja?: string | null;
  crossed_this_week: number;
}

// ---------------------------------------------------------------------------
// SPEC-V2 §2 — Nurture: ステップメール
// ---------------------------------------------------------------------------
export type SequenceStatus = 'active' | 'paused';

export interface SequenceSummary {
  id: string;
  name: string;
  name_ja?: string | null;
  status: SequenceStatus;
  /**
   * How many emails this sequence has actually sent — `sequences.total_sent` on the backend.
   *
   * This used to be `enrolled`, a headcount of people in the sequence. Nothing in the schema
   * counts that: enrolment is implied by `offset_days` being relative to a start the sends
   * table never records as its own row, so there was no number behind the demo's "10,000
   * enrolled" and the field arrived `undefined` from the real API (it crashed the screen on
   * `.toLocaleString()`). Sends are counted for real, so sends are what this reports.
   */
  total_sent: number;
  step_count: number;
}

export interface SequenceStep {
  step: number;
  offset_label: string;
  offset_label_ja: string;
  subject: string;
  /** D9: every mail is a question in disguise. */
  question: string;
  question_ja?: string | null;
  cta: string;
  sent: number;
  opened: number;
  clicked: number;
  open_rate: string;
  click_rate: string;
  active: boolean;
}

export type SequenceExitAction = 'stop' | 'pause' | 'dormant';

export interface SequenceExitCondition {
  action: SequenceExitAction;
  label: string;
  label_ja: string;
  trigger: string;
  trigger_ja: string;
  /** D17: proposed, not ratified by Balraj — must render as "provisional" in the UI. */
  provisional: boolean;
}

export interface SequenceDetail extends SequenceSummary {
  editorial_rule: string;
  editorial_rule_ja?: string | null;
  steps: SequenceStep[];
  exit_conditions: SequenceExitCondition[];
}

export type SequenceStepPatch = { active: boolean };

// ---------------------------------------------------------------------------
// SPEC-V2 §3 — SNS: SNS企画・コンテンツ導線
// ---------------------------------------------------------------------------
export interface SnsPatternIdea {
  title: string;
  title_ja?: string | null;
  hook: string;
  hook_ja?: string | null;
  cta: string;
  cta_ja?: string | null;
}

export type SnsPatternKey = 'A' | 'B' | 'C' | 'D';

export interface SnsPattern {
  key: SnsPatternKey;
  name: string;
  name_ja: string;
  note: string;
  note_ja?: string | null;
  /** Post ideas per pattern. The backend has no field for these — they were written into the
   * demo by hand — so a live build gets an empty list rather than invented copy. */
  ideas: SnsPatternIdea[];
  /** `leads_count` on the backend. This used to be documented as permanently null ("attribution
   * needs a content tag that does not exist yet"); the backend now attributes leads per pattern,
   * so the real count is carried through. Still nullable for the case where it is genuinely absent. */
  leads_produced: number | null;
}

export interface SnsPatternsResponse {
  patterns: SnsPattern[];
  total_sns_leads: number;
  attribution_note: string;
  attribution_note_ja?: string | null;
}

export interface SnsFunnelStep {
  key: string;
  label: string;
  label_ja: string;
  count: number;
  /**
   * Whether this number was measured or typed in. The first two steps of the SNS funnel (posts
   * published, LP views) have no tracking behind them — the backend marks them `tracked: false,
   * source: 'manual'`. Showing 148 posts next to a measured 7 email captures, with nothing to
   * distinguish them, would present a hand-entered figure as instrumentation.
   */
  tracked: boolean;
}

export interface SnsFunnelResponse {
  steps: SnsFunnelStep[];
}

// ---------------------------------------------------------------------------
// SPEC-V2 §4 — Booking: 予約フロー
// ---------------------------------------------------------------------------
/** `booking_meeting_types.key` on the backend, verbatim. The app previously used shortened
 * names ('inspection', 'showroom') that the API rejected with 422 — two of the three booking
 * calendars simply failed to load and the screen showed one meeting type instead of three. */
export type MeetingType = 'consult_30' | 'site_inspection' | 'showroom_visit';

export interface BookingMeetingTypeSetting {
  type: MeetingType;
  label: string;
  label_ja: string;
  duration_minutes: number;
  rep_user_ids: string[];
}

export interface BookingSettings {
  meeting_types: BookingMeetingTypeSetting[];
  jst_gst_gap_hours: number;
  /** SPEC-V2 §4: the public booking page needs its own domain/hosting — always 'not_configured'. */
  public_page_status: 'not_configured';
}

export type BookingSettingsPatch = Partial<Pick<BookingSettings, 'meeting_types'>>;

export interface BookingSlot {
  id: string;
  meeting_type: MeetingType;
  rep_user_id: string;
  rep_name: string;
  start_at: string;
  end_at: string;
}

// ---------------------------------------------------------------------------
// SPEC-V2 §5 — Assign: 自動アサイン・営業カレンダー
// ---------------------------------------------------------------------------
export interface AssignmentRule {
  id: string;
  priority: number;
  topic: string;
  topic_ja: string;
  owner_user_id: string;
  owner_name: string;
}

export interface AssignmentRulesResponse {
  rules: AssignmentRule[];
  fallback_owner_user_id: string;
  fallback_owner_name: string;
  fallback_note: string;
  fallback_note_ja?: string | null;
}

export type AssignmentRulesPatch = { rules: Pick<AssignmentRule, 'id' | 'priority' | 'owner_user_id'>[] };

export interface CalendarEvent {
  id: string;
  lead_id: string | null;
  lead_name: string | null;
  title: string;
  start_at: string;
  end_at: string;
}

export interface CalendarWeekResponse {
  user_id: string;
  user_name: string;
  week_start: string;
  events: CalendarEvent[];
  /** SPEC-V2 §5: no Google Calendar connection exists — always false. */
  google_calendar_connected: boolean;
}

// ---------------------------------------------------------------------------
// SPEC-V2 §6 — Card scan: 名刺スキャン
// ---------------------------------------------------------------------------
export interface CardScanFields {
  name: string;
  reading: string;
  company: string;
  title: string;
  email: string;
  phone: string;
  address: string;
}

export interface ScanLeadInput {
  /** Local device URI of the captured/picked image — never sent as invented OCR text. */
  image_uri: string | null;
  fields: Partial<CardScanFields>;
  consent: boolean;
}

export interface ScanLeadResult {
  lead: LeadDetail;
  deduped: boolean;
  matched_on: string | null;
}

// ---------------------------------------------------------------------------
// SPEC-V2 §7 — Import: CSV / Excel 取込
// ---------------------------------------------------------------------------
export interface ImportColumn {
  key: string;
  header: string;
  sample_values: string[];
  guess: string | null;
}

export interface ImportQuestionOption {
  key: string;
  label: string;
  label_ja?: string | null;
}

export interface ImportQuestion {
  column_key: string;
  question: string;
  question_ja?: string | null;
  options: ImportQuestionOption[];
}

/** SPEC-V2 §7: parsed server-side (Python — csvimport.py + openpyxl for .xlsx) so the app never
 * has to know CSV from Excel — it just uploads the raw file. `rows` is a legacy mock-mode-only
 * convenience (see mocks.ts): the app pre-parses CSV text client-side ONLY so the demo build can
 * fabricate a response with no backend running; a real (non-mock) build always uploads `file_uri`
 * untouched, for both formats, and never reads the file itself. */
export interface ImportAnalyzeInput {
  file_name: string;
  file_uri: string;
  mime_type?: string;
  /** Which sheet to parse, once a multi-sheet .xlsx workbook has asked and the human answered. */
  sheet_name?: string;
  /** Mock-mode-only pre-parsed CSV rows — see the interface doc above. Never set for .xlsx. */
  rows?: Record<string, string>[];
}

/** A multi-sheet .xlsx workbook is interrogated for which sheet BEFORE a single row is parsed
 * (D11) — `analyzeImport()` returns this instead of `ImportAnalyzeParsed` until the human answers,
 * then the same file is re-sent with `sheet_name` set. */
export interface ImportSheetChoice {
  needs_sheet_selection: true;
  file_name: string;
  sheets: string[];
}

export interface ImportAnalyzeParsed {
  needs_sheet_selection?: false;
  import_id: string;
  file_name: string;
  row_count: number;
  columns: ImportColumn[];
  questions: ImportQuestion[];
  preview_rows: Record<string, string>[];
  /** SPEC-V2 §7 D13 — dedupe runs on import; this is the real preview count from the backend's
   * scan of (up to the first 500) rows, shown before commit so "how many are new vs duplicates"
   * is answered at the mapping step, not only after committing. */
  new_count: number;
  duplicate_count: number;
}

export type ImportAnalyzeResult = ImportSheetChoice | ImportAnalyzeParsed;

export type ImportMapping = Record<string, string>;
export type ImportConsentState = 'unknown' | 'granted' | 'withdrawn';

export interface ImportCommitInput {
  import_id: string;
  mapping: ImportMapping;
  consent_state: ImportConsentState;
}

export interface ImportCommitResult {
  new_leads: number;
  duplicate_leads: number;
  consent_state: ImportConsentState;
}

// ---------------------------------------------------------------------------
// SPEC-V2 §8 — Integrations: システム連携
// ---------------------------------------------------------------------------
export type IntegrationKey = 'gohighlevel' | 'hubspot' | 'gmail' | 'google_calendar' | 'whatsapp' | 'google_drive';

export interface IntegrationStatus {
  key: IntegrationKey;
  name: string;
  name_ja: string;
  connected: boolean;
  status_note: string;
  status_note_ja?: string | null;
  /** `what_is_needed` on the backend — the concrete thing still missing for this connection
   * (an API key, an OAuth grant). Worth surfacing: "not connected" tells nobody what to do. */
  what_is_needed: string | null;
  last_sync_at: string | null;
  record_count: number | null;
  read_only: boolean;
}

export interface IntegrationsResponse {
  integrations: IntegrationStatus[];
}

export interface GoHighLevelSyncResult {
  ok: boolean;
  message: string;
  message_ja?: string | null;
}

// ---------------------------------------------------------------------------
// SPEC-V2 §9 — AI reply: ✨ AI返信案
// ---------------------------------------------------------------------------
export type ClassifierAnswer = 'yes' | 'no' | 'unknown';

/** D7: the four-question classifier. */
export interface ReplyClassifier {
  is_human: ClassifierAnswer;
  wants_to_meet: ClassifierAnswer;
  partnership: ClassifierAnswer;
  has_budget: ClassifierAnswer;
}

export interface LeadReply {
  id: string;
  lead_id: string;
  body: string;
  received_at: string;
  classifier: ReplyClassifier | null;
  points_awarded: number;
  voided: boolean;
  draft: string | null;
  /** false = no model is wired (SPEC-V2 §9) — the UI must say so and allow a typed reply. */
  draft_available: boolean;
  sent: boolean;
  sent_at: string | null;
  sent_text: string | null;
}

export interface DraftReplyInput {
  manual_text?: string;
}

/** D7's four-question classifier, answered by the human approving the reply (the backend calls
 * this `verdict`: `{human, wants_meeting, partnership, high_budget}` — client.ts translates
 * between these UI-facing names and the backend's wire names). */
export interface ReplyClassifierInput {
  is_human: boolean;
  wants_to_meet: boolean;
  partnership: boolean;
  has_budget: boolean;
}

export interface SendReplyInput {
  text: string;
  /** Required — without it the backend scores nothing (`verdict.human` falsy = "not human,
   * nothing scored"). The approve-and-send UI must collect this before calling sendReply. */
  classifier: ReplyClassifierInput;
}

// ---------------------------------------------------------------------------
// SPEC-V2 §10 — smaller items
// ---------------------------------------------------------------------------
export interface VoiceMemo {
  id: string;
  lead_id: string;
  author_user_id: string;
  author_name: string;
  duration_seconds: number;
  recorded_at: string;
  /** SPEC-V2 §10: transcription is not wired — always false. */
  transcription_available: false;
}

export interface CreateVoiceMemoInput {
  duration_seconds: number;
  local_uri: string;
}

/** Backend `push_settings` only has 4 real columns (`app/api.py` §10b): `notify_new_lead`,
 * `notify_hot_lead`, `notify_reply`, `notify_task_escalation_level` (an int, not a per-level
 * flag). These keys are the app-facing 1:1 (or, for `task_escalated`, best-effort boolean)
 * mirror of exactly those columns — client.ts maps both directions. No key here may exist that
 * the backend cannot actually store (SPEC-V2 §10 honesty rule). */
export type NotificationEventKey = 'new_lead' | 'hot_lead' | 'reply_received' | 'task_escalated';

export interface NotificationSetting {
  key: NotificationEventKey;
  label: string;
  label_ja: string;
  enabled: boolean;
  /** D12b: escalation level 2-3 notifies a manager, not the owning rep alone. */
  manager_only: boolean;
}

export interface NotificationSettingsResponse {
  push_registered: boolean;
  push_token: string | null;
  settings: NotificationSetting[];
}

export type NotificationSettingsPatch = { settings: Pick<NotificationSetting, 'key' | 'enabled'>[] };

export interface RegisterPushTokenInput {
  token: string;
}

// ---------------------------------------------------------------------------
// Errors — { error: { code, message } } with correct HTTP status.
// ---------------------------------------------------------------------------
export interface ApiErrorBody {
  error: { code: string; message: string };
}
