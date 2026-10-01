/**
 * Realistic fixtures + a mock implementation of every SPEC.md endpoint, so the app is fully
 * demoable and every screen reviewable without exceed-box-app running.
 *
 * Enabled by EXPO_PUBLIC_USE_MOCKS=1 (see src/api/client.ts).
 * Two extra dev-only knobs for exercising the other three screen states:
 *   EXPO_PUBLIC_MOCK_EMPTY=1  — every list responds empty, in the populated shape.
 *   EXPO_PUBLIC_MOCK_ERROR=1  — every call throws, to exercise the error+retry state.
 */
import type {
  ActivityEvent,
  ActivityEventType,
  AppUser,
  AssignmentRule,
  AssignmentRulesPatch,
  AssignmentRulesResponse,
  BookingSettings,
  BookingSettingsPatch,
  BookingSlot,
  CalendarEvent,
  CalendarWeekResponse,
  ConsentInfo,
  CreateLeadInput,
  CreateTaskInput,
  CreateUserInput,
  CreateVoiceMemoInput,
  DashboardResponse,
  DraftReplyInput,
  GoHighLevelSyncResult,
  ImportAnalyzeInput,
  ImportAnalyzeResult,
  ImportColumn,
  ImportCommitInput,
  ImportCommitResult,
  ImportQuestion,
  ImportQuestionOption,
  IntegrationsResponse,
  IntegrationStatus,
  LeadChannel,
  LeadDetail,
  LeadEditPatch,
  LeadPurpose,
  LeadReply,
  LeadRegion,
  LeadRelationship,
  LeadSource,
  LeadStage,
  LeadSummary,
  LeadsQuery,
  MeetingType,
  NotificationSetting,
  NotificationSettingsPatch,
  NotificationSettingsResponse,
  Paginated,
  PipelineResponse,
  ClassifierAnswer,
  ReplyClassifier,
  ScanLeadInput,
  ScanLeadResult,
  ScoreBreakdownItem,
  ScoreExplain,
  ScoringModel,
  SendReplyInput,
  SequenceDetail,
  SequenceStep,
  SequenceStepPatch,
  SequenceSummary,
  SnsFunnelResponse,
  SnsPattern,
  SnsPatternsResponse,
  Task,
  TaskPatch,
  TeamResponse,
  TimelineEvent,
  UserPatch,
  VoiceMemo,
} from './types';

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
export const DEMO_USERS: AppUser[] = [
  {
    id: 'u-teruo',
    email: 'admin@exceed-re.ae',
    display_name: 'Teruo Yamashita',
    role: 'admin',
    office: 'tokyo',
    is_active: true,
    created_at: '2024-01-10T00:00:00.000Z',
  },
  {
    id: 'u-asuka',
    email: 'marketing@exceed-re.ae',
    display_name: 'Asuka Ito',
    role: 'marketing',
    office: 'tokyo',
    is_active: true,
    created_at: '2024-02-01T00:00:00.000Z',
  },
  {
    id: 'u-yupon',
    email: 'manager@exceed-re.ae',
    display_name: 'Yupon Suwanpakdee',
    role: 'office_manager',
    office: 'tokyo',
    is_active: true,
    created_at: '2024-01-15T00:00:00.000Z',
  },
  {
    id: 'u-chiaki',
    email: 'sales@exceed-re.ae',
    display_name: 'Chiaki Nakamura',
    role: 'sales',
    office: 'tokyo',
    is_active: true,
    created_at: '2024-03-01T00:00:00.000Z',
  },
  {
    id: 'u-omar',
    email: 'omar.alfarsi@exceed-re.ae',
    display_name: 'Omar Al Farsi',
    role: 'sales',
    office: 'dubai',
    is_active: true,
    created_at: '2024-03-10T00:00:00.000Z',
  },
  {
    id: 'u-haruto',
    email: 'haruto.kobayashi@exceed-re.ae',
    display_name: 'Haruto Kobayashi',
    role: 'sales',
    office: 'tokyo',
    is_active: false,
    created_at: '2024-04-01T00:00:00.000Z',
  },
];

/** Mock "sign in with email" — any password, email must match a demo account. */
export function findDemoUserByEmail(email: string): AppUser | null {
  const norm = email.trim().toLowerCase();
  return DEMO_USERS.find((u) => u.email.toLowerCase() === norm) ?? null;
}

function userName(id: string | null): string | null {
  if (!id) return null;
  return DEMO_USERS.find((u) => u.id === id)?.display_name ?? null;
}

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------
const STAGE_LABEL: Record<LeadStage, [string, string]> = {
  new: ['New', '新規'],
  nurturing: ['Nurturing', 'ナーチャリング中'],
  engaged: ['Engaged', '反応あり'],
  meeting_booked: ['Meeting booked', '商談予約'],
  in_negotiation: ['In negotiation', '商談中'],
  won: ['Won', '成約'],
};

const REGION_LABEL: Record<LeadRegion, [string, string]> = {
  dubai: ['Dubai', 'ドバイ'],
  lombok: ['Lombok', 'ロンボク'],
  japan: ['Japan showroom', '日本（ショールーム）'],
};

const PURPOSE_LABEL: Record<LeadPurpose, [string, string]> = {
  investment: ['Investment', '投資'],
  relocation: ['Relocation', '移住'],
  second_home: ['Second home', 'セカンドハウス'],
  business_base: ['Corporate base', '法人拠点'],
  unknown: ['Not yet known', '未分類'],
};

const RELATIONSHIP_LABEL: Record<LeadRelationship, [string, string]> = {
  individual: ['Individual', '個人'],
  corporate: ['Corporate', '法人'],
  partner: ['Partner', 'パートナー'],
};

const SOURCE_LABEL: Record<LeadSource, [string, string]> = {
  business_card: ['Business card', '名刺'],
  csv: ['CSV import', 'CSVインポート'],
  gohighlevel: ['GoHighLevel', 'GoHighLevel'],
  lp_form: ['Landing page', 'ランディングページ'],
  sns: ['SNS', 'SNS'],
  gmail: ['Email reply', 'メール返信'],
  referral: ['Referral', '紹介'],
  whatsapp: ['WhatsApp', 'WhatsApp'],
  line: ['LINE', 'LINE'],
  showroom: ['Showroom walk-in', 'ショールーム来店'],
  property_finder: ['Property Finder', 'Property Finder'],
};

/**
 * Look a value up in a label table WITHOUT ever returning undefined.
 *
 * Callers do `pickPair(lang, someLabel(v))`, which indexes the result — so a miss used to
 * throw `Cannot read properties of undefined (reading '0')` and take the whole screen down
 * with it (this is exactly what a real `purpose: 'business_base'` did to the lead drawer).
 * A label table is a presentation detail; it must never be able to break a screen. An
 * unrecognised value now renders as itself, which is both survivable and diagnostic — the
 * unmapped string is visible on screen instead of hidden behind a white page.
 *
 * Deliberately not `as LeadPurpose` casts at the call sites: the point is to survive values
 * the union does NOT contain, i.e. ones the server started sending after this build shipped.
 */
function labelOrRaw<K extends string>(table: Record<K, [string, string]>, value: K | string | null | undefined): [string, string] {
  if (value == null || value === '') return ['—', '—'];
  const hit = (table as Record<string, [string, string] | undefined>)[value];
  return hit ?? [String(value), String(value)];
}

// Every one of these is total — see labelOrRaw() above for why that is not optional.
export function stageLabel(s: LeadStage): [string, string] {
  return labelOrRaw(STAGE_LABEL, s);
}
export function regionLabel(r: LeadRegion): [string, string] {
  return labelOrRaw(REGION_LABEL, r);
}
/** Regions are a multi-select, and "none chosen yet" is a real state a rep needs to see —
 * the backend represents it as an empty array rather than a sentinel value, so the words
 * for it live here, on the display side, where they belong. */
export function regionsLabel(regions: readonly LeadRegion[] | null | undefined, separator = '/'): [string, string] {
  if (!regions || regions.length === 0) return ['Undecided', '未定'];
  const pairs = regions.map(regionLabel);
  return [pairs.map((p) => p[0]).join(separator), pairs.map((p) => p[1]).join(separator)];
}
export function purposeLabel(p: LeadPurpose): [string, string] {
  return labelOrRaw(PURPOSE_LABEL, p);
}
export function relationshipLabel(r: LeadRelationship): [string, string] {
  return labelOrRaw(RELATIONSHIP_LABEL, r);
}
export function sourceLabel(s: LeadSource): [string, string] {
  return labelOrRaw(SOURCE_LABEL, s);
}
export const ALL_STAGES: LeadStage[] = [
  'new',
  'nurturing',
  'engaged',
  'meeting_booked',
  'in_negotiation',
  'won',
];

function iso(daysFromNow: number, hour = 9): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

interface LeadSeed {
  id: string;
  name: string;
  name_ja?: string;
  company?: string;
  email?: string;
  phone?: string;
  score: number;
  stage: LeadStage;
  exit_state: LeadSummary['exit_state'];
  owner_user_id: string | null;
  region: LeadRegion[];
  purpose: LeadPurpose;
  relationship: LeadRelationship;
  source: LeadSource;
  created: number; // days ago
  breakdown: ScoreBreakdownItem[];
}

const HERO_LEADS: LeadSeed[] = [
  {
    id: 'lead-001',
    name: 'James Whitfield',
    company: undefined,
    email: 'j.whitfield@example.com',
    phone: '+971 50 111 2233',
    score: 92,
    stage: 'meeting_booked',
    exit_state: null,
    owner_user_id: 'u-chiaki',
    region: ['dubai'],
    purpose: 'relocation',
    relationship: 'individual',
    source: 'lp_form',
    created: -34,
    breakdown: [
      { rule: 'Email opened', rule_ja: '開封', points: 1, active: true, at: iso(-30) },
      { rule: 'Link clicked', rule_ja: 'クリック', points: 3, active: true, at: iso(-28) },
      { rule: 'Landing page viewed', rule_ja: 'LP閲覧', points: 3, active: true, at: iso(-27) },
      { rule: 'Booking page viewed', rule_ja: '予約ページ閲覧', points: 5, active: true, at: iso(-20) },
      { rule: 'Replied', rule_ja: '返信', points: 10, active: true, at: iso(-18) },
      {
        rule: 'Wants to meet in person',
        rule_ja: '対面希望',
        points: 30,
        active: true,
        at: iso(-15),
      },
      { rule: 'Booking completed', rule_ja: '予約完了', points: 20, active: true, at: iso(-3) },
    ],
  },
  {
    id: 'lead-002',
    name: 'Aoyama Shoji K.K.',
    name_ja: '青山商事株式会社',
    company: 'Aoyama Shoji K.K.',
    email: 'contact@aoyama-shoji.example.jp',
    phone: '+81 3 1234 5678',
    score: 88,
    stage: 'in_negotiation',
    exit_state: null,
    owner_user_id: 'u-yupon',
    region: ['dubai'],
    purpose: 'business_base',
    relationship: 'corporate',
    source: 'gmail',
    created: -52,
    breakdown: [
      { rule: 'Email opened', rule_ja: '開封', points: 1, active: true, at: iso(-50) },
      { rule: 'Link clicked', rule_ja: 'クリック', points: 3, active: true, at: iso(-49) },
      { rule: 'Replied', rule_ja: '返信', points: 10, active: true, at: iso(-45) },
      {
        rule: 'Corporate buyer — 役員数名の移転を検討',
        rule_ja: '法人案件',
        points: 30,
        active: true,
        at: iso(-40),
      },
      { rule: 'High budget discussed', rule_ja: '高予算', points: 30, active: true, at: iso(-30) },
      { rule: 'Booking page viewed', rule_ja: '予約ページ閲覧', points: 5, active: true, at: iso(-25) },
    ],
  },
  {
    id: 'lead-003',
    name: 'Fatima Al Mazrouei',
    email: 'fatima.am@example.com',
    phone: '+971 55 222 9981',
    score: 45,
    stage: 'engaged',
    exit_state: null,
    owner_user_id: null,
    region: ['dubai'],
    purpose: 'investment',
    relationship: 'individual',
    source: 'sns',
    created: -12,
    breakdown: [
      { rule: 'Email opened', rule_ja: '開封', points: 1, active: true, at: iso(-10) },
      { rule: 'Link clicked', rule_ja: 'クリック', points: 3, active: true, at: iso(-9) },
      { rule: 'Landing page viewed', rule_ja: 'LP閲覧', points: 3, active: true, at: iso(-9) },
      { rule: 'Replied', rule_ja: '返信', points: 10, active: false, faded: true, at: iso(-30) },
    ],
  },
  {
    id: 'lead-004',
    name: 'Haruki Sato',
    name_ja: '佐藤 陽輝',
    email: 'h.sato@example.jp',
    phone: '+81 90 1111 2222',
    score: 76,
    stage: 'meeting_booked',
    exit_state: null,
    owner_user_id: 'u-chiaki',
    region: ['japan', 'dubai'],
    purpose: 'second_home',
    relationship: 'individual',
    source: 'showroom',
    created: -6,
    breakdown: [
      { rule: 'Showroom walk-in, consent captured', rule_ja: 'ショールーム来店', points: 5, active: true, at: iso(-6) },
      { rule: 'Wants to meet in person', rule_ja: '対面希望', points: 30, active: true, at: iso(-6) },
      { rule: 'Booking page viewed', rule_ja: '予約ページ閲覧', points: 5, active: true, at: iso(-5) },
      { rule: 'Replied', rule_ja: '返信', points: 10, active: true, at: iso(-4) },
      { rule: 'Link clicked', rule_ja: 'クリック', points: 3, active: true, at: iso(-3) },
    ],
  },
  {
    id: 'lead-005',
    name: 'Made Wirawan',
    email: 'made.w@example.co.id',
    phone: '+62 812 3344 5566',
    score: 61,
    stage: 'nurturing',
    exit_state: null,
    owner_user_id: null,
    region: ['lombok'],
    purpose: 'unknown',
    relationship: 'partner',
    source: 'referral',
    created: -21,
    breakdown: [
      { rule: 'Email opened', rule_ja: '開封', points: 1, active: true, at: iso(-19) },
      { rule: 'Partnership intent in reply', rule_ja: 'パートナー案件', points: 30, active: true, at: iso(-15) },
      { rule: 'Link clicked', rule_ja: 'クリック', points: 3, active: true, at: iso(-14) },
    ],
  },
  {
    id: 'lead-006',
    name: 'Ryo Nakagawa',
    name_ja: '中川 諒',
    email: 'ryo.n@example.jp',
    score: 12,
    stage: 'nurturing',
    exit_state: null,
    owner_user_id: null,
    region: [],
    purpose: 'unknown',
    relationship: 'individual',
    source: 'csv',
    created: -70,
    breakdown: [{ rule: 'Email opened', rule_ja: '開封', points: 1, active: true, at: iso(-68) }],
  },
  {
    id: 'lead-007',
    name: 'Priya Nair',
    email: 'priya.nair@example.com',
    phone: '+971 52 777 4433',
    score: 100,
    stage: 'won',
    exit_state: null,
    owner_user_id: 'u-omar',
    region: ['dubai'],
    purpose: 'investment',
    relationship: 'individual',
    source: 'lp_form',
    created: -95,
    breakdown: [
      { rule: 'Email opened', rule_ja: '開封', points: 1, active: true, at: iso(-90) },
      { rule: 'Link clicked', rule_ja: 'クリック', points: 3, active: true, at: iso(-88) },
      { rule: 'Landing page viewed', rule_ja: 'LP閲覧', points: 3, active: true, at: iso(-85) },
      { rule: 'Booking page viewed', rule_ja: '予約ページ閲覧', points: 5, active: true, at: iso(-80) },
      { rule: 'Replied', rule_ja: '返信', points: 10, active: true, at: iso(-75) },
      { rule: 'Wants to meet in person', rule_ja: '対面希望', points: 30, active: true, at: iso(-70) },
      { rule: 'Booking completed', rule_ja: '予約完了', points: 20, active: true, at: iso(-60) },
      { rule: 'High budget discussed', rule_ja: '高予算', points: 28, active: true, at: iso(-58) },
    ],
  },
  {
    id: 'lead-008',
    name: 'Kenji Morita',
    name_ja: '森田 賢治',
    email: 'k.morita@example.jp',
    phone: '+81 80 5555 1212',
    score: 8,
    stage: 'new',
    exit_state: 'too_early',
    owner_user_id: null,
    region: [],
    purpose: 'unknown',
    relationship: 'individual',
    source: 'business_card',
    created: -3,
    breakdown: [],
  },
];

/** Fill out volume for realistic list/pagination behaviour beyond the 8 hero leads. */
function generateMore(count: number): LeadSeed[] {
  const firstNames = ['Aiko', 'Kenta', 'Mei', 'Sora', 'Yui', 'Ren', 'Hana', 'Daichi', 'Noa', 'Riku'];
  const lastNames = ['Suzuki', 'Takahashi', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi'];
  const owners = [null, null, 'u-chiaki', 'u-omar', null, 'u-haruto', null];
  const regions: LeadRegion[][] = [['dubai'], ['lombok'], ['japan'], [], ['dubai', 'lombok']];
  const purposes: LeadPurpose[] = ['investment', 'relocation', 'second_home', 'business_base', 'unknown'];
  const relationships: LeadRelationship[] = ['individual', 'corporate', 'partner'];
  const sources: LeadSource[] = [
    'csv',
    'gohighlevel',
    'sns',
    'lp_form',
    'business_card',
    'property_finder',
    'whatsapp',
    'line',
  ];
  const stages: LeadStage[] = ['new', 'nurturing', 'nurturing', 'engaged', 'engaged', 'meeting_booked', 'in_negotiation'];

  const out: LeadSeed[] = [];
  for (let i = 0; i < count; i++) {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[(i * 3 + 1) % lastNames.length];
    const stage = stages[i % stages.length];
    const score = stage === 'new' ? 2 + (i % 15) : stage === 'nurturing' ? 15 + (i % 25) : stage === 'engaged' ? 35 + (i % 20) : 65 + (i % 30);
    const breakdown: ScoreBreakdownItem[] = [
      { rule: 'Email opened', rule_ja: '開封', points: 1, active: true, at: iso(-(i % 40) - 1) },
    ];
    if (score > 15) breakdown.push({ rule: 'Link clicked', rule_ja: 'クリック', points: 3, active: true, at: iso(-(i % 30)) });
    if (score > 40) breakdown.push({ rule: 'Replied', rule_ja: '返信', points: 10, active: true, at: iso(-(i % 20)) });
    out.push({
      id: `lead-${String(9 + i).padStart(3, '0')}`,
      name: `${fn} ${ln}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@example.com`,
      phone: `+81 90 ${1000 + i}${2000 + i}`,
      score,
      stage,
      exit_state: null,
      owner_user_id: owners[i % owners.length],
      region: regions[i % regions.length],
      purpose: purposes[i % purposes.length],
      relationship: relationships[i % relationships.length],
      source: sources[i % sources.length],
      created: -(5 + i * 2),
      breakdown,
    });
  }
  return out;
}

// A few exit-state leads beyond the one hero, so Leads/filters have real coverage.
const EXIT_LEADS: LeadSeed[] = [
  {
    id: 'lead-901',
    name: 'Daniel Cross',
    email: 'daniel.cross@example.com',
    score: 3,
    stage: 'nurturing',
    exit_state: 'unsubscribed',
    owner_user_id: null,
    region: ['dubai'],
    purpose: 'unknown',
    relationship: 'individual',
    source: 'csv',
    created: -110,
    breakdown: [],
  },
  {
    id: 'lead-902',
    name: 'Sana Ahmed',
    email: 'bounced@invalid.example',
    score: 0,
    stage: 'new',
    exit_state: 'unreachable',
    owner_user_id: null,
    region: [],
    purpose: 'unknown',
    relationship: 'individual',
    source: 'gohighlevel',
    created: -80,
    breakdown: [],
  },
  {
    id: 'lead-903',
    name: 'Tomoya Endo',
    name_ja: '遠藤 智也',
    email: 't.endo@example.jp',
    score: 22,
    stage: 'engaged',
    exit_state: 'lost',
    owner_user_id: 'u-chiaki',
    region: ['dubai'],
    purpose: 'investment',
    relationship: 'individual',
    source: 'lp_form',
    created: -60,
    breakdown: [{ rule: 'Replied — chose a competitor', rule_ja: '返信（他社決定）', points: 0, active: false, at: iso(-40) }],
  },
];

const LEAD_SEEDS: LeadSeed[] = [...HERO_LEADS, ...generateMore(23), ...EXIT_LEADS];

function activityNote(seed: LeadSeed): [string, string] | [null, null] {
  const last = seed.breakdown[seed.breakdown.length - 1];
  if (seed.exit_state === 'unsubscribed') return ['Unsubscribed from all mail', '配信停止'];
  if (seed.exit_state === 'unreachable') return ['Email bounced — unreachable', '連絡不可'];
  if (seed.exit_state === 'lost') return ['Lost — chose another agency', '失注'];
  if (!last) return [null, null];
  if (last.rule.startsWith('Booking completed')) return ['Booking completed', '予約完了'];
  if (last.rule.startsWith('Replied')) return ['Replied to last send', '返信あり'];
  if (last.rule.startsWith('Wants to meet')) return ['Asked to meet in person', '対面希望あり'];
  if (last.rule.startsWith('Link clicked')) return ['Clicked ×2 in last send', 'クリック×2'];
  if (last.rule.startsWith('Landing') || last.rule.startsWith('Showroom')) return ['Viewed landing page', 'LP閲覧'];
  return ['Opened last send', '開封'];
}

function toSummary(seed: LeadSeed): LeadSummary {
  const [note, noteJa] = activityNote(seed);
  return {
    id: seed.id,
    name: seed.name,
    name_ja: seed.name_ja ?? null,
    company: seed.company ?? null,
    email: seed.email ?? null,
    phone: seed.phone ?? null,
    score: seed.score,
    stage: seed.stage,
    exit_state: seed.exit_state,
    owner_user_id: seed.owner_user_id,
    owner_name: userName(seed.owner_user_id),
    region: seed.region,
    purpose: seed.purpose,
    relationship: seed.relationship,
    source: seed.source,
    activity_note: note,
    activity_note_ja: noteJa,
    created_at: iso(seed.created),
    updated_at: seed.breakdown.length ? (seed.breakdown[seed.breakdown.length - 1].at ?? iso(seed.created)) : iso(seed.created),
  };
}

function toTimeline(seed: LeadSeed): TimelineEvent[] {
  const events: TimelineEvent[] = [
    { id: `${seed.id}-created`, type: 'created', label: `Lead created via ${sourceLabel(seed.source)[0]}`, label_ja: sourceLabel(seed.source)[1], at: iso(seed.created) },
  ];
  seed.breakdown.forEach((b, i) => {
    events.push({ id: `${seed.id}-ev-${i}`, type: 'signal', label: b.rule, label_ja: b.rule_ja, at: b.at ?? iso(seed.created), points: b.points });
  });
  return events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

function toChannels(seed: LeadSeed): LeadChannel[] {
  const channels: LeadChannel[] = [];
  if (seed.email) channels.push({ type: 'email', identifier: seed.email, first_touch: true });
  if (seed.phone) channels.push({ type: 'phone', identifier: seed.phone, first_touch: false });
  if (seed.source === 'whatsapp') channels.push({ type: 'whatsapp', identifier: seed.phone ?? seed.email ?? '—', first_touch: false });
  if (seed.source === 'line') channels.push({ type: 'line', identifier: 'LINE ID on file', first_touch: false });
  return channels;
}

/** Mirrors `lead_consent` — one record per person, a basis and its evidence, not a per-channel
 * matrix. See ConsentInfo in api/types.ts for why the app models it this way. */
function toConsent(seed: LeadSeed): ConsentInfo | null {
  if (seed.exit_state === 'unreachable') return null;
  const withdrawn = seed.exit_state === 'unsubscribed';
  const basis = withdrawn ? 'withdrawn' : seed.source === 'lp_form' ? 'explicit' : seed.email ? 'implied' : 'unknown';
  return {
    state: withdrawn ? 'withdrawn' : basis === 'explicit' || basis === 'implied' ? 'granted' : 'unknown',
    basis,
    obtained_at: withdrawn || basis === 'unknown' ? null : iso(seed.created),
    obtained_via:
      basis === 'explicit' ? 'Landing-page form checkbox' : basis === 'implied' ? 'Existing business relationship' : null,
    withdrawn_at: withdrawn ? iso(seed.created) : null,
    updated_at: iso(seed.created),
  };
}

let leadStore: LeadSummary[] = LEAD_SEEDS.map(toSummary);
const leadSeedById = new Map(LEAD_SEEDS.map((s) => [s.id, s]));

function findLead(id: string): LeadSummary {
  const lead = leadStore.find((l) => l.id === id);
  if (!lead) {
    const err: any = new Error('Lead not found');
    err.status = 404;
    err.code = 'not_found';
    throw err;
  }
  return lead;
}

export function mockGetLeads(query: LeadsQuery): Paginated<LeadSummary> {
  let list = leadStore.slice();
  if (query.stage) list = list.filter((l) => l.stage === query.stage);
  if (query.owner) list = list.filter((l) => l.owner_user_id === query.owner);
  if (query.region) list = list.filter((l) => l.region.includes(query.region as LeadRegion));
  if (query.purpose) list = list.filter((l) => l.purpose === query.purpose);
  if (query.q) {
    const q = query.q.toLowerCase();
    list = list.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        (l.name_ja ?? '').includes(query.q!) ||
        (l.email ?? '').toLowerCase().includes(q) ||
        (l.company ?? '').toLowerCase().includes(q)
    );
  }
  list.sort((a, b) => b.score - a.score);
  return paginate(list, query.page, query.page_size);
}

export function mockGetLeadDetail(id: string): LeadDetail {
  const summary = findLead(id);
  const seed = leadSeedById.get(id)!;
  return {
    ...summary,
    timeline: toTimeline(seed),
    channels: toChannels(seed),
    consent: toConsent(seed),
    score_breakdown: seed.breakdown,
  };
}

export function mockGetScore(id: string): ScoreExplain {
  const summary = findLead(id);
  const seed = leadSeedById.get(id)!;
  return {
    lead_id: id,
    score: summary.score,
    threshold: 40,
    breakdown: seed.breakdown,
    decay_note: 'Behaviour points (open/click/LP/booking/reply) halve after 60 days of silence, reach zero at 120. Facts (corporate, partnership, high budget, wants-to-meet, booking completed) never fade.',
  };
}

export function mockCreateLead(input: CreateLeadInput): LeadDetail {
  const id = `lead-${Date.now()}`;
  const seed: LeadSeed = {
    id,
    name: input.name,
    email: input.email,
    phone: input.phone,
    company: input.company,
    score: 0,
    stage: 'new',
    exit_state: null,
    owner_user_id: null,
    region: input.region ?? [],
    purpose: input.purpose ?? 'unknown',
    relationship: 'individual',
    source: input.source,
    created: 0,
    breakdown: [],
  };
  leadSeedById.set(id, seed);
  const summary = toSummary(seed);
  leadStore = [summary, ...leadStore];
  return mockGetLeadDetail(id);
}

export function mockPatchLead(id: string, patch: LeadEditPatch): LeadDetail {
  const idx = leadStore.findIndex((l) => l.id === id);
  if (idx === -1) findLead(id); // throws 404
  leadStore[idx] = { ...leadStore[idx], ...patch, updated_at: new Date().toISOString() };
  return mockGetLeadDetail(id);
}

export function mockAssignLead(id: string, owner_user_id: string): LeadDetail {
  const idx = leadStore.findIndex((l) => l.id === id);
  if (idx === -1) findLead(id);
  leadStore[idx] = {
    ...leadStore[idx],
    owner_user_id,
    owner_name: userName(owner_user_id),
    updated_at: new Date().toISOString(),
  };
  return mockGetLeadDetail(id);
}

export function mockSetStage(id: string, stage: LeadStage): LeadDetail {
  const idx = leadStore.findIndex((l) => l.id === id);
  if (idx === -1) findLead(id);
  leadStore[idx] = { ...leadStore[idx], stage, exit_state: null, updated_at: new Date().toISOString() };
  const seed = leadSeedById.get(id);
  if (seed) seed.stage = stage;
  return mockGetLeadDetail(id);
}

export function mockSendSignal(id: string, actorName: string, note?: string): LeadDetail {
  const idx = leadStore.findIndex((l) => l.id === id);
  if (idx === -1) findLead(id);
  const seed = leadSeedById.get(id);
  if (seed) {
    seed.breakdown = [
      ...seed.breakdown,
      {
        rule: `Wants to meet in person (set by ${actorName}${note ? `: "${note}"` : ''})`,
        rule_ja: '対面希望（手動設定）',
        points: 30,
        active: true,
        at: new Date().toISOString(),
      },
    ];
    seed.score = Math.min(100, seed.score + 30);
  }
  leadStore[idx] = { ...leadStore[idx], score: Math.min(100, leadStore[idx].score + 30), updated_at: new Date().toISOString() };
  return mockGetLeadDetail(id);
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------
interface TaskSeed {
  id: string;
  type: Task['type'];
  owner_user_id: string;
  lead_id: string;
  due: number; // days from now, fractional allowed
  state: Task['state'];
  reason: string;
  reason_ja: string;
  escalation_level: Task['escalation_level'];
  created_by: Task['created_by'];
}

const TASK_SEEDS: TaskSeed[] = [
  { id: 'task-001', type: 'call', owner_user_id: 'u-chiaki', lead_id: 'lead-001', due: -0.5, state: 'open', reason: 'Score 92 · viewed booking page 3x, no reply yet', reason_ja: 'スコア92・予約ページ閲覧3回・未返信', escalation_level: 3, created_by: 'ai' },
  { id: 'task-002', type: 'follow_up', owner_user_id: 'u-chiaki', lead_id: 'lead-004', due: 0.1, state: 'open', reason: 'Meeting booked tomorrow — confirm details', reason_ja: '明日商談予約・詳細確認', escalation_level: 1, created_by: 'rule' },
  { id: 'task-003', type: 'email', owner_user_id: 'u-chiaki', lead_id: 'lead-009', due: 0.3, state: 'open', reason: 'Nurture step 3 stalled — send manual nudge', reason_ja: 'ナーチャリング停滞・手動フォロー', escalation_level: 0, created_by: 'ai' },
  { id: 'task-004', type: 'call', owner_user_id: 'u-omar', lead_id: 'lead-007', due: -1.2, state: 'open', reason: 'Won — schedule handover call with ops', reason_ja: '成約・引き継ぎ電話', escalation_level: 2, created_by: 'human' },
  { id: 'task-005', type: 'meeting', owner_user_id: 'u-yupon', lead_id: 'lead-002', due: 0.6, state: 'open', reason: 'Negotiation — corporate relocation terms review', reason_ja: '商談中・法人移転条件レビュー', escalation_level: 1, created_by: 'human' },
  { id: 'task-006', type: 'follow_up', owner_user_id: 'u-yupon', lead_id: 'lead-005', due: -2.1, state: 'open', reason: 'Partnership intent flagged — needs manager review', reason_ja: 'パートナー案件・要マネージャー確認', escalation_level: 2, created_by: 'ai' },
  { id: 'task-007', type: 'showroom_visit', owner_user_id: 'u-chiaki', lead_id: 'lead-004', due: 1.2, state: 'open', reason: 'Showroom visit follow-up call', reason_ja: 'ショールーム来店フォロー', escalation_level: 0, created_by: 'rule' },
  { id: 'task-008', type: 'call', owner_user_id: 'u-haruto', lead_id: 'lead-012', due: -3.4, state: 'open', reason: 'No contact in 10 days — escalating', reason_ja: '10日間未接触・エスカレーション', escalation_level: 3, created_by: 'ai' },
  { id: 'task-009', type: 'email', owner_user_id: 'u-omar', lead_id: 'lead-014', due: 2.0, state: 'open', reason: 'Nurture step 2 due', reason_ja: 'ナーチャリング2通目', escalation_level: 0, created_by: 'rule' },
  { id: 'task-010', type: 'other', owner_user_id: 'u-chiaki', lead_id: 'lead-003', due: -5, state: 'done', reason: 'Reviewed SNS reply for intent', reason_ja: 'SNS返信内容確認', escalation_level: 0, created_by: 'human' },
];

function toTask(seed: TaskSeed): Task {
  const lead = leadStore.find((l) => l.id === seed.lead_id);
  return {
    id: seed.id,
    type: seed.type,
    owner_user_id: seed.owner_user_id,
    owner_name: userName(seed.owner_user_id) ?? '—',
    lead_id: seed.lead_id,
    lead_name: lead?.name ?? 'Unknown lead',
    lead_name_ja: lead?.name_ja ?? null,
    lead_score: lead?.score ?? 0,
    due_at: iso(seed.due),
    state: seed.state,
    reason: seed.reason,
    reason_ja: seed.reason_ja,
    escalation_level: seed.escalation_level,
    created_by: seed.created_by,
    created_at: iso(seed.due - 2),
  };
}

let taskStore: Task[] = TASK_SEEDS.map(toTask);
let taskSeqCounter = 100;

function urgency(t: Task): number {
  const lateness = (Date.now() - new Date(t.due_at).getTime()) / (1000 * 60 * 60); // hours
  return t.lead_score * Math.max(1, lateness);
}

/** SPEC.md: "the caller's tasks" — Today is always personal, for every role. Seeing everyone's
 * tasks (tasks.view_all) is a Team-screen capability, not a Today one. */
export function mockGetToday(ownerId: string, page?: number, pageSize?: number): Paginated<Task> {
  const list = taskStore
    .filter((t) => t.state === 'open' && t.owner_user_id === ownerId)
    .slice()
    .sort((a, b) => urgency(b) - urgency(a));
  return paginate(list, page, pageSize);
}

export function mockCreateTask(input: CreateTaskInput): Task {
  const id = `task-${++taskSeqCounter}`;
  const lead = input.lead_id ? leadStore.find((l) => l.id === input.lead_id) : undefined;
  const task: Task = {
    id,
    type: input.type,
    owner_user_id: input.owner_user_id,
    owner_name: userName(input.owner_user_id) ?? '—',
    lead_id: input.lead_id ?? '',
    lead_name: lead?.name ?? '—',
    lead_name_ja: lead?.name_ja ?? null,
    lead_score: lead?.score ?? 0,
    due_at: input.due_at,
    state: 'open',
    reason: input.reason,
    reason_ja: null,
    escalation_level: 0,
    created_by: 'human',
    created_at: new Date().toISOString(),
  };
  taskStore = [task, ...taskStore];
  return task;
}

export function mockPatchTask(id: string, patch: TaskPatch): Task {
  const idx = taskStore.findIndex((t) => t.id === id);
  if (idx === -1) {
    const err: any = new Error('Task not found');
    err.status = 404;
    err.code = 'not_found';
    throw err;
  }
  const t = taskStore[idx];
  let next: Task = t;
  if (patch.action === 'complete') next = { ...t, state: 'done' };
  if (patch.action === 'snooze') next = { ...t, state: 'snoozed', due_at: patch.until };
  if (patch.action === 'reassign') next = { ...t, owner_user_id: patch.owner_user_id, owner_name: userName(patch.owner_user_id) ?? '—' };
  if (patch.action === 'change_due') next = { ...t, due_at: patch.due_at };
  taskStore[idx] = next;
  return next;
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------
export function mockGetPipeline(scopeOwnerId: string | null): PipelineResponse {
  const scoped = scopeOwnerId ? leadStore.filter((l) => l.owner_user_id === scopeOwnerId) : leadStore;
  const forward = scoped.filter((l) => !l.exit_state);
  return {
    buckets: ALL_STAGES.map((stage) => {
      const [label, label_ja] = stageLabel(stage);
      const leads = forward.filter((l) => l.stage === stage).sort((a, b) => b.score - a.score);
      return { stage, label, label_ja, count: leads.length, leads };
    }),
  };
}

// ---------------------------------------------------------------------------
// Dashboard — D15/D16
// ---------------------------------------------------------------------------
export function mockGetDashboard(includePerRep: boolean): DashboardResponse {
  const forward = leadStore.filter((l) => !l.exit_state);
  const totalLeads = leadStore.length;
  const meetingsBooked = forward.filter((l) => l.stage === 'meeting_booked').length;
  const inNegotiation = forward.filter((l) => l.stage === 'in_negotiation').length;
  const won = forward.filter((l) => l.stage === 'won').length;
  // Honest fixture derivation, not an invented formula: "first sends" = leads with at least one
  // recorded outbound touch (an email channel — see toChannels()), i.e. every lead that has
  // actually been contacted at least once.
  const firstSends = leadStore.filter((l) => !!l.email).length;

  // Every point below is counted from real fixture timestamps (lead.created_at, score-breakdown
  // event .at), not generated — no modular-arithmetic placeholder data.
  const trend = Array.from({ length: 14 }).map((_, i) => {
    const day = -13 + i;
    const d = new Date();
    d.setDate(d.getDate() + day);
    const dateStr = d.toISOString().slice(0, 10);
    const leadsOnDay = LEAD_SEEDS.filter((s) => iso(s.created).slice(0, 10) === dateStr).length;
    const meetingsOnDay = LEAD_SEEDS.reduce(
      (n, s) =>
        n + s.breakdown.filter((b) => !!b.at && b.at.slice(0, 10) === dateStr && /wants to meet|booking completed/i.test(b.rule)).length,
      0
    );
    const negotiationOnDay = LEAD_SEEDS.reduce(
      (n, s) =>
        n + s.breakdown.filter((b) => !!b.at && b.at.slice(0, 10) === dateStr && /high budget|corporate buyer/i.test(b.rule)).length,
      0
    );
    return { date: dateStr, leads: leadsOnDay, meetings_booked: meetingsOnDay, in_negotiation: negotiationOnDay };
  });

  const gap = meetingsBooked - inNegotiation;
  const trend_flag =
    gap >= 3
      ? {
          message: `${gap} meetings booked never became a negotiation`,
          message_ja: `${gap}件の商談予約が商談化していません`,
          detail:
            'This gap usually means the meeting happened but no next step was logged, or the meeting was a no-show. Check the affected leads under Pipeline → Meeting booked.',
          detail_ja: '商談実施後に次のアクションが記録されていないか、無断キャンセルの可能性があります。',
        }
      : null;

  const funnel = ALL_STAGES.map((stage) => {
    const [label, label_ja] = stageLabel(stage);
    return { stage, label, label_ja, count: forward.filter((l) => l.stage === stage).length };
  });

  const regions: LeadRegion[] = ['dubai', 'lombok', 'japan'];
  const by_region = regions.map((region) => {
    const [label, label_ja] = regionLabel(region);
    return { region, label, label_ja, count: leadStore.filter((l) => l.region.includes(region)).length };
  });

  const sourcesUsed = Array.from(new Set(leadStore.map((l) => l.source)));
  const by_source = sourcesUsed
    .map((source) => {
      const [label, label_ja] = sourceLabel(source);
      return { source, label, label_ja, count: leadStore.filter((l) => l.source === source).length };
    })
    .sort((a, b) => b.count - a.count);

  const hot_leads = leadStore
    .filter((l) => l.score >= 70 && !l.exit_state)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const by_rep = includePerRep
    ? DEMO_USERS.filter((u) => u.role !== 'admin').map((u) => {
        const owned = leadStore.filter((l) => l.owner_user_id === u.id);
        const tasksForUser = taskStore.filter((t) => t.owner_user_id === u.id);
        return {
          user_id: u.id,
          name: u.display_name,
          office: u.office,
          leads_owned: owned.length,
          tasks_open: tasksForUser.filter((t) => t.state === 'open').length,
          tasks_overdue: tasksForUser.filter((t) => t.state === 'open' && new Date(t.due_at).getTime() < Date.now()).length,
          meetings_booked: owned.filter((l) => l.stage === 'meeting_booked').length,
          won: owned.filter((l) => l.stage === 'won').length,
        };
      })
    : null;

  return {
    tiles: [
      { key: 'total_leads', label: 'Total leads', label_ja: '総リード数', value: totalLeads },
      { key: 'first_sends', label: 'First sends', label_ja: '初回配信数', value: Math.max(0, firstSends) },
      { key: 'meetings_booked', label: 'Meetings booked', label_ja: '商談予約', value: meetingsBooked },
      { key: 'in_negotiation', label: 'In negotiation', label_ja: '商談中', value: inNegotiation },
      { key: 'won', label: 'Won', label_ja: '成約', value: won },
      {
        key: 'expected_revenue',
        label: 'Expected revenue',
        label_ja: '見込み売上',
        value: null,
        unavailable_reason:
          'No stage close-probability table exists yet (D15) — needs the 商談予約/商談中/見積/成約 percentages from Balraj before this can be computed honestly.',
      },
    ],
    trend,
    trend_flag,
    funnel,
    by_region,
    by_source,
    hot_leads,
    by_rep,
  };
}

// ---------------------------------------------------------------------------
// Team — D12a
// ---------------------------------------------------------------------------
export function mockGetTeam(page?: number, pageSize?: number): TeamResponse {
  const members = DEMO_USERS.filter((u) => u.role !== 'admin').map((u) => {
    const owned = leadStore.filter((l) => l.owner_user_id === u.id);
    const tasks = taskStore.filter((t) => t.owner_user_id === u.id && t.state === 'open').sort((a, b) => urgency(b) - urgency(a));
    return {
      user_id: u.id,
      name: u.display_name,
      role: u.role,
      office: u.office,
      is_active: u.is_active,
      tasks_open: tasks.length,
      tasks_overdue: tasks.filter((t) => new Date(t.due_at).getTime() < Date.now()).length,
      tasks_escalated: tasks.filter((t) => t.escalation_level >= 2).length,
      leads_owned: owned.length,
      meetings_booked: owned.filter((l) => l.stage === 'meeting_booked').length,
      won: owned.filter((l) => l.stage === 'won').length,
      tasks,
    };
  });
  // SPEC: every list endpoint is paginated, { data, page, page_size, total } — Team is no exception.
  return paginate(members, page, pageSize);
}

// ---------------------------------------------------------------------------
// Admin users
// ---------------------------------------------------------------------------
let userStore: AppUser[] = DEMO_USERS.slice();

export function mockGetUsers(page?: number, pageSize?: number): Paginated<AppUser> {
  return paginate(userStore, page, pageSize);
}

export function mockCreateUser(input: CreateUserInput): AppUser {
  const user: AppUser = {
    id: `u-${Date.now()}`,
    email: input.email,
    display_name: input.display_name,
    role: input.role,
    office: input.office,
    is_active: true,
    created_at: new Date().toISOString(),
  };
  userStore = [...userStore, user];
  return user;
}

export function mockPatchUser(id: string, patch: UserPatch): AppUser {
  const idx = userStore.findIndex((u) => u.id === id);
  if (idx === -1) {
    const err: any = new Error('User not found');
    err.status = 404;
    err.code = 'not_found';
    throw err;
  }
  userStore[idx] = { ...userStore[idx], ...patch };
  return userStore[idx];
}

// ---------------------------------------------------------------------------
// SPEC-V2 §1 — Tracking: live activity feed + scoring model
// ---------------------------------------------------------------------------
function inferActivityType(rule: string): ActivityEventType {
  const r = rule.toLowerCase();
  if (r.startsWith('email opened')) return 'open';
  if (r.startsWith('link clicked')) return 'click';
  if (r.startsWith('landing page') || r.startsWith('showroom walk-in')) return 'page_view';
  if (r.startsWith('booking page')) return 'booking_page_view';
  if (r.startsWith('replied')) return 'reply';
  if (r.startsWith('booking completed')) return 'booking_completed';
  return 'manual_signal';
}

const BEHAVIOUR_ACTIVITY_TYPES: ActivityEventType[] = ['open', 'click', 'page_view', 'booking_page_view'];

/** Built from the same LEAD_SEEDS.breakdown fixtures as lead detail and Dashboard — never a second,
 * separately-invented dataset, so a lead's Tracking rows and its own score breakdown always agree. */
function buildActivityFeed(): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  LEAD_SEEDS.forEach((seed) => {
    let running = 0;
    seed.breakdown.forEach((b, i) => {
      running = Math.min(100, running + b.points);
      const evType = inferActivityType(b.rule);
      const isBehaviour = BEHAVIOUR_ACTIVITY_TYPES.includes(evType);
      events.push({
        id: `${seed.id}-act-${i}`,
        lead_id: seed.id,
        lead_name: seed.name,
        lead_name_ja: seed.name_ja ?? null,
        type: evType,
        label: b.rule,
        label_ja: b.rule_ja ?? null,
        points: b.points,
        score_after: running,
        campaign: isBehaviour ? 'Dubai · Lombok re-activation sequence' : null,
        campaign_ja: isBehaviour ? 'ドバイ・ロンボク再活性シーケンス' : null,
        at: b.at ?? iso(seed.created),
      });
    });
  });
  return events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

export function mockGetActivity(scopeOwnerId: string | null, page?: number, pageSize?: number): Paginated<ActivityEvent> {
  let list = buildActivityFeed();
  if (scopeOwnerId) {
    list = list.filter((e) => leadStore.find((l) => l.id === e.lead_id)?.owner_user_id === scopeOwnerId);
  }
  return paginate(list, page, pageSize);
}

/** D2/D5/D6/D4 — the ten rules from app/scoring.py, point values from the live demo. */
export function mockGetScoringModel(): ScoringModel {
  const rules: ScoringModel['rules'] = [
    { kind: 'open', label: 'Email opened', label_ja: '開封', points: 1, group: 'behaviour' },
    { kind: 'click', label: 'Link clicked', label_ja: 'クリック', points: 3, group: 'behaviour' },
    { kind: 'page_view', label: 'Landing page viewed', label_ja: 'LP閲覧', points: 3, group: 'behaviour' },
    { kind: 'booking_page_view', label: 'Booking page viewed', label_ja: '相談ページ閲覧', points: 5, group: 'behaviour' },
    { kind: 'reply', label: 'Replied', label_ja: '返信', points: 10, group: 'behaviour' },
    { kind: 'booking_completed', label: 'Booking completed', label_ja: '予約完了', points: 20, group: 'fact' },
    {
      kind: 'wants_meeting',
      label: 'Wants to meet in person (incl. Lombok inspection)',
      label_ja: '対面希望（ロンボク視察を含む）',
      points: 30,
      group: 'fact',
    },
    { kind: 'corporate_deal', label: 'Corporate buyer', label_ja: '法人案件', points: 30, group: 'fact' },
    { kind: 'partnership', label: 'Partnership intent', label_ja: 'パートナーシップ意向', points: 30, group: 'fact' },
    { kind: 'high_budget', label: 'High budget discussed', label_ja: '高予算', points: 30, group: 'fact' },
  ];
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const crossed_this_week = leadStore.filter((l) => l.score >= 40 && new Date(l.updated_at).getTime() >= weekAgo).length;
  return {
    rules,
    threshold: 40,
    decay_note:
      'Behaviour points (open, click, LP view, booking-page view, reply) halve at 60 days of no new activity and reach zero at 120. Facts (booking completed, wants to meet, corporate, partnership, high budget) never fade.',
    decay_note_ja:
      '行動データ（開封・クリック・LP閲覧・相談ページ閲覧・返信）は60日で半減、120日でゼロに。事実（予約完了・対面希望・法人・パートナー・高予算）は減衰しません。',
    crossed_this_week,
  };
}

// ---------------------------------------------------------------------------
// SPEC-V2 §2 — Nurture: ステップメール（自動ナーチャリング）
// ---------------------------------------------------------------------------
interface StepSeed {
  n: number;
  subject_en: string;
  subject_ja: string;
  question_en: string;
  question_ja: string;
  cta_en: string;
  cta_ja: string;
  sent: number;
  open_rate: string;
  click_rate: string;
}

const NURTURE_STEPS: StepSeed[] = [
  { n: 1, subject_en: 'Is Dubai really that expensive?', subject_ja: 'ドバイは本当に高いのか？', question_en: 'Do you actually believe "Dubai is expensive"?', question_ja: '先入観を崩す', cta_en: 'Read the article', cta_ja: '記事を読む', sent: 9800, open_rate: '24.6%', click_rate: '4.1%' },
  { n: 2, subject_en: 'How to live in Dubai for less', subject_ja: 'ドバイで安く生活する方法', question_en: 'Could you actually afford to live here?', question_ja: '興味を喚起', cta_en: 'Cost-of-living checklist', cta_ja: '生活費チェックリスト', sent: 9540, open_rate: '21.9%', click_rate: '5.2%' },
  { n: 3, subject_en: 'Why Japanese nomads & founders choose Dubai', subject_ja: '日本人・ノマド・経営者がドバイを選ぶ理由', question_en: "Are you the type who'd actually relocate?", question_ja: '移住ニーズを特定', cta_en: 'Free consultation', cta_ja: '無料相談', sent: 9350, open_rate: '19.4%', click_rate: '3.8%' },
  { n: 4, subject_en: 'What to know before you look at property', subject_ja: 'ドバイ不動産を見る前に知るべきこと', question_en: "Do you understand what you'd be buying into?", question_ja: '投資教育', cta_en: 'Property consultation', cta_ja: '物件相談', sent: 9120, open_rate: '17.2%', click_rate: '3.1%' },
  { n: 5, subject_en: 'Lombok — where the development is headed', subject_ja: 'ロンボク開発の将来性', question_en: 'Would you get on a plane to see it?', question_ja: '視察ニーズを特定', cta_en: 'Inspection consultation', cta_ja: '視察相談', sent: 8930, open_rate: '18.8%', click_rate: '4.6%' },
  { n: 6, subject_en: 'What overseas property buyers get wrong', subject_ja: '海外不動産で失敗する人の共通点', question_en: "What's actually stopping you?", question_ja: '不安を解消', cta_en: '30-min consultation', cta_ja: '30分相談', sent: 8760, open_rate: '16.1%', click_rate: '2.9%' },
  { n: 7, subject_en: 'How past buyers actually decided', subject_ja: '相談事例・購入パターン', question_en: 'Are you ready to talk numbers?', question_ja: '商談化', cta_en: 'Book on the calendar', cta_ja: 'カレンダー予約', sent: 8600, open_rate: '15.4%', click_rate: '3.4%' },
];

let sequenceStepActive: Record<number, boolean> = Object.fromEntries(NURTURE_STEPS.map((s) => [s.n, true]));

function toStep(s: StepSeed): SequenceStep {
  const opened = Math.round(s.sent * (parseFloat(s.open_rate) / 100));
  const clicked = Math.round(s.sent * (parseFloat(s.click_rate) / 100));
  return {
    step: s.n,
    offset_label: `Week ${s.n}`,
    offset_label_ja: `第${s.n}週`,
    subject: s.subject_en,
    question: s.question_en,
    question_ja: s.question_ja,
    cta: s.cta_en,
    sent: s.sent,
    opened,
    clicked,
    open_rate: s.open_rate,
    click_rate: s.click_rate,
    active: sequenceStepActive[s.n],
  };
}

const SEQUENCE_ID = 'seq-dubai-lombok';

function buildSequenceDetail(): SequenceDetail {
  return {
    id: SEQUENCE_ID,
    name: 'Dubai · Lombok re-activation',
    name_ja: 'ドバイ・ロンボク再活性',
    status: 'active',
    total_sent: 432,
    step_count: NURTURE_STEPS.length,
    editorial_rule:
      'Not "Want to buy property in Dubai?" — "Dubai is surprisingly easy to live in." Content earns the interest; the CTA converts it.',
    editorial_rule_ja: '「ドバイの不動産を買いませんか？」ではなく「ドバイは意外と住みやすい」と思わせる導線。',
    steps: NURTURE_STEPS.map(toStep),
    exit_conditions: [
      { action: 'stop', label: 'Stop', label_ja: '配信停止', trigger: 'Unsubscribed or bounced', trigger_ja: '配信停止・バウンス', provisional: true },
      { action: 'pause', label: 'Pause', label_ja: '一時停止', trigger: 'Replied · meeting booked · score ≥ 40', trigger_ja: '返信・予約完了・スコア40以上', provisional: true },
      { action: 'dormant', label: 'Dormant', label_ja: '休眠', trigger: 'Finished step 7 with no reaction', trigger_ja: '第7週配信後、反応なし', provisional: true },
    ],
  };
}

export function mockGetSequences(page?: number, pageSize?: number): Paginated<SequenceSummary> {
  const d = buildSequenceDetail();
  const summary: SequenceSummary = { id: d.id, name: d.name, name_ja: d.name_ja, status: d.status, total_sent: d.total_sent, step_count: d.step_count };
  return paginate([summary], page, pageSize);
}

export function mockGetSequenceDetail(id: string): SequenceDetail {
  if (id !== SEQUENCE_ID) {
    const err: any = new Error('Sequence not found');
    err.status = 404;
    err.code = 'not_found';
    throw err;
  }
  return buildSequenceDetail();
}

export function mockPatchSequenceStep(id: string, step: number, patch: SequenceStepPatch): SequenceDetail {
  if (id !== SEQUENCE_ID || !(step in sequenceStepActive)) {
    const err: any = new Error('Sequence step not found');
    err.status = 404;
    err.code = 'not_found';
    throw err;
  }
  sequenceStepActive[step] = patch.active;
  return buildSequenceDetail();
}

// ---------------------------------------------------------------------------
// SPEC-V2 §3 — SNS: SNS企画・コンテンツ導線
// ---------------------------------------------------------------------------
const SNS_PATTERNS: SnsPattern[] = [
  {
    key: 'A',
    name: 'Break assumptions about Dubai life',
    name_ja: 'ドバイの思い込みを壊す生活情報',
    note: 'Breaks the "Dubai is expensive" assumption as a wide-net entry point. Prices are verified at filming time and stated in the post.',
    note_ja: '「ドバイ＝高い」という認識を崩し、広い層に興味を持ってもらう入口。数字や価格は撮影時点で確認し、投稿内で明示します。',
    leads_produced: null,
    ideas: [
      { title: 'Dubai is expensive — half wrong', title_ja: 'ドバイは高い は半分間違い', hook: "Tourist prices aren't resident prices — the gap surprises people", hook_ja: '観光客価格と生活者価格は違う、という切り口で意外性を作る', cta: 'Download the cost-of-living checklist', cta_ja: '生活費チェックリストDL' },
      { title: 'Lunch under ¥1,000 map', title_ja: '1,000円以下ランチMAP', hook: 'Cheap, real local lunch spots, not just the luxury ones, as short video', hook_ja: '高級店だけでなく、安くて使える現地ランチをショート動画化', cta: 'Save · link to LP', cta_ja: '保存・LP誘導' },
      { title: '2-for-1 app hacks', title_ja: '2 for 1アプリ活用術', hook: 'Apps that give one person free or 50% off for two', hook_ja: '2人で行くと1人無料、50%OFFなどのアプリ活用を紹介', cta: 'App round-up guide', cta_ja: 'アプリまとめ資料' },
      { title: 'What taxis and trains really cost', title_ja: 'タクシー・電車のリアル', hook: 'Compares transport cost to Japan to show how livable it is', hook_ja: '移動費の感覚を日本と比較し、生活のしやすさを伝える', cta: 'First-visit consultation', cta_ja: '初回渡航相談' },
      { title: 'Life with a gym and pool included', title_ja: 'ジム・プール付き生活', hook: 'Daily life where housing/hotel already includes facilities, changing how you see fixed costs', hook_ja: '住居やホテルに設備が含まれる日常を見せ、固定費の見方を変える', cta: 'Relocation consultation', cta_ja: '移住相談' },
    ],
  },
  {
    key: 'B',
    name: 'Nomad & founder relocation funnel',
    name_ja: 'ノマド・経営者向け移住導線',
    note: 'Creates a touchpoint even with people not directly interested in property, through life, relocation and business-base framing. Tax/visa content stays non-definitive, pointing to a specialist-checked checklist.',
    note_ja: '不動産に直接興味がない層にも、生活・移住・事業拠点の文脈で接点を作ります。税務・ビザなど専門性が高い内容は断定せず、専門家確認前提のチェックリストに接続。',
    leads_produced: null,
    ideas: [
      { title: '"Moving to Dubai to save money" — the contrarian take', title_ja: '「節約しにドバイへ行く」という逆張り', hook: 'Flips the luxury-city image to show the real cost of living', hook_ja: '高級都市のイメージを逆手に取り、生活コストの実態を見せる', cta: 'Cost-of-living diagnostic', cta_ja: '生活費診断' },
      { title: 'Dubai as a hotel-living option', title_ja: 'ホテル暮らし候補としてのドバイ', hook: 'How season, area and hotel choice change your stay cost', hook_ja: 'シーズン・エリア・ホテル選びで滞在費が変わることを紹介', cta: 'Stay-cost model doc', cta_ja: '滞在モデル資料' },
      { title: 'Monthly costs after paying rent upfront', title_ja: '家賃一括払い後の月次固定費', hook: 'Shows concretely what you pay for, month to month', hook_ja: '月々何にお金がかかるのかを具体的に見せる', cta: 'Relocation prep checklist', cta_ja: '移住準備リスト' },
      { title: 'The overseas base founders actually weigh', title_ja: '経営者が検討する海外拠点', hook: 'Separates business, banking, residency and family life as distinct questions', hook_ja: '事業・口座・居住地・家族生活を分けて論点整理する', cta: 'Corporate consultation', cta_ja: '法人相談' },
      { title: 'First-time Dubai living checklist', title_ja: '初めてのドバイ生活チェックリスト', hook: 'Food, transport, phone/internet, housing and gotchas on one page', hook_ja: '食事、移動、通信、住居、注意点を1枚にまとめる', cta: 'Free consultation', cta_ja: '無料相談' },
    ],
  },
  {
    key: 'C',
    name: 'Lombok inspection & development story',
    name_ja: 'ロンボク視察・開発ストーリー',
    note: 'Framing Lombok as a development story worth seeing in person — not a plain listing — converts better into a booked inspection.',
    note_ja: 'ロンボクは単なる物件紹介ではなく、視察したくなる開発ストーリーとして見せると相談予約につながりやすくなります。',
    leads_produced: null,
    ideas: [
      { title: 'Is Lombok the next Bali?', title_ja: 'バリの次に来るロンボク？', hook: 'Close to Bali but still under-covered — builds curiosity', hook_ja: 'バリから近いが、まだ情報が少ないエリアとして興味を作る', cta: 'Lombok intro pack', cta_ja: 'ロンボク入門資料' },
      { title: "What's being built next to the special economic zone", title_ja: '経済特区の隣で起きている開発', hook: 'Shows the surrounding development with on-site footage and maps', hook_ja: '周辺開発・リゾート化の流れを、現地映像と地図で見せる', cta: 'Inspection deck', cta_ja: '視察資料' },
      { title: 'The beachfront five-star hotel plan', title_ja: '海沿いファイブスターホテル構想', hook: 'Tells the completed vision and surroundings as a story', hook_ja: '完成予想や周辺環境をストーリーとして見せる', cta: 'Request the brochure', cta_ja: '資料請求' },
      { title: 'What to watch in the golf & resort plan', title_ja: 'ゴルフ場・リゾート構想の見どころ', hook: 'Frames it as golf + hotel + tourism + investment together', hook_ja: 'ゴルフ、ホテル、観光、投資の複合テーマとして発信する', cta: 'Inspection consultation', cta_ja: '視察相談' },
      { title: 'What to actually check on an inspection visit', title_ja: '現地視察で見るべきポイント', hook: 'Location, access, surrounding development, management, exit — as a checklist', hook_ja: '立地、アクセス、周辺開発、管理体制、出口をチェックリスト化', cta: '30-min consultation', cta_ja: '30分相談' },
    ],
  },
  {
    key: 'D',
    name: 'Avoid the mistakes of overseas property',
    name_ja: '海外不動産の失敗回避・相談導線',
    note: 'Builds recognition as the failure-avoidance advisor before ever pitching the property.',
    note_ja: '不動産を売り込む前に、失敗回避の相談相手として認知される導線を作ります。',
    leads_produced: null,
    ideas: [
      { title: 'The 5 things to check first in overseas property', title_ja: '海外不動産で最初に見るべき5項目', hook: 'Not price first — location, management, exit, remittance, local support', hook_ja: '価格ではなく、立地・管理・出口・送金・現地体制を先に見る', cta: 'Download the diagnostic sheet', cta_ja: '診断シートDL' },
      { title: 'Check the management company before the yield', title_ja: '利回りより先に見る管理会社', hook: 'Surfaces the problems that show up after purchase, early', hook_ja: '買った後に困る論点を先回りして伝える', cta: 'Property consultation', cta_ja: '物件相談' },
      { title: 'Dubai vs. Lombok', title_ja: 'ドバイとロンボクの違い', hook: 'Compares who each one actually suits — stay, relocate, invest, inspect', hook_ja: '短期滞在、移住、投資、視察で向く人を比較する', cta: 'Comparison sheet', cta_ja: '比較資料' },
      { title: 'Remittance, registration, tax and visa — what to watch', title_ja: '送金・登記・税務・ビザの注意点', hook: 'Organizes the points that need a specialist, leads to consultation', hook_ja: '専門家確認が必要な論点を整理し、相談につなげる', cta: '1:1 consultation', cta_ja: '個別相談' },
      { title: 'Why a 30-minute chat before you buy', title_ja: '買う前に30分だけ相談する理由', hook: 'Makes the case for pre-purchase consultation as failure-avoidance', hook_ja: '失敗回避のために、購入前相談の価値を訴求する', cta: 'Book on the calendar', cta_ja: 'カレンダー予約' },
    ],
  },
];

export function mockGetSnsPatterns(): SnsPatternsResponse {
  const total_sns_leads = leadStore.filter((l) => l.source === 'sns').length;
  return {
    patterns: SNS_PATTERNS,
    total_sns_leads,
    attribution_note: 'Per-pattern lead counts need a content/UTM tag that does not exist in the data model yet — only source = sns is tracked.',
    attribution_note_ja: 'パターン別のリード数には未実装のコンテンツタグが必要です。現在は source = sns のみ記録されています。',
  };
}

export function mockGetSnsFunnel(): SnsFunnelResponse {
  const snsLeads = leadStore.filter((l) => l.source === 'sns');
  const withPageView = snsLeads.filter((l) => leadSeedById.get(l.id)?.breakdown.some((b) => inferActivityType(b.rule) === 'page_view'));
  const nurturing = snsLeads.filter((l) => l.stage !== 'new');
  const booked = snsLeads.filter((l) => ['meeting_booked', 'in_negotiation', 'won'].includes(l.stage));
  return {
    steps: [
      // `tracked` mirrors the backend: the first two steps are hand-entered, the rest are measured.
      { key: 'sns_post', label: 'SNS post', label_ja: 'SNS投稿', count: snsLeads.length, tracked: false },
      { key: 'lp_doc', label: 'LP / free doc', label_ja: 'LP / 無料資料', count: withPageView.length, tracked: false },
      { key: 'email_captured', label: 'Email captured', label_ja: 'メール取得', count: snsLeads.filter((l) => !!l.email).length, tracked: true },
      { key: 'step_mail', label: 'Step-mail nurture', label_ja: 'ステップメール', count: nurturing.length, tracked: true },
      { key: 'booking', label: 'Booking', label_ja: '相談予約', count: booked.length, tracked: true },
    ],
  };
}

// ---------------------------------------------------------------------------
// SPEC-V2 §4 — Booking: 予約フロー
// ---------------------------------------------------------------------------
let bookingSettingsStore: BookingSettings = {
  meeting_types: [
    { type: 'consult_30', label: 'Free 30-min consultation', label_ja: '無料30分相談', duration_minutes: 30, rep_user_ids: ['u-yupon'] },
    { type: 'site_inspection', label: 'Lombok inspection', label_ja: '視察', duration_minutes: 60, rep_user_ids: ['u-omar'] },
    { type: 'showroom_visit', label: 'Showroom visit', label_ja: '来店', duration_minutes: 45, rep_user_ids: ['u-chiaki'] },
  ],
  // JST (UTC+9) is 5 hours ahead of GST/Dubai (UTC+4) — corrected here from the "4-hour gap"
  // wording in SPEC-V2 §4's own prose; flagged back to Balraj rather than repeated as fact.
  jst_gst_gap_hours: 5,
  public_page_status: 'not_configured',
};

export function mockGetBookingSettings(): BookingSettings {
  return bookingSettingsStore;
}

export function mockPatchBookingSettings(patch: BookingSettingsPatch): BookingSettings {
  bookingSettingsStore = { ...bookingSettingsStore, ...patch };
  return bookingSettingsStore;
}

export function mockGetBookingSlots(): BookingSlot[] {
  const slots: BookingSlot[] = [];
  let id = 0;
  bookingSettingsStore.meeting_types.forEach((mt) => {
    for (let d = 1; d <= 5; d++) {
      const start = new Date();
      start.setDate(start.getDate() + d);
      start.setHours(10 + (d % 4) * 2, 0, 0, 0);
      const end = new Date(start.getTime() + mt.duration_minutes * 60000);
      const rep = DEMO_USERS.find((u) => u.id === mt.rep_user_ids[0]);
      slots.push({
        id: `slot-${++id}`,
        meeting_type: mt.type,
        rep_user_id: mt.rep_user_ids[0] ?? '',
        rep_name: rep?.display_name ?? 'Unassigned',
        start_at: start.toISOString(),
        end_at: end.toISOString(),
      });
    }
  });
  return slots;
}

// ---------------------------------------------------------------------------
// SPEC-V2 §5 — Assign: 自動アサイン・営業カレンダー
// ---------------------------------------------------------------------------
interface RuleSeed {
  id: string;
  priority: number;
  topic: string;
  topic_ja: string;
  owner_user_id: string;
}

let assignmentRuleStore: RuleSeed[] = [
  { id: 'rule-1', priority: 1, topic: 'Free 30-min consultation', topic_ja: 'まずは30分相談', owner_user_id: 'u-yupon' },
  { id: 'rule-2', priority: 2, topic: 'Dubai relocation', topic_ja: 'ドバイ移住', owner_user_id: 'u-chiaki' },
  { id: 'rule-3', priority: 3, topic: 'Property investment', topic_ja: '不動産投資', owner_user_id: 'u-omar' },
  { id: 'rule-4', priority: 4, topic: 'Lombok inspection', topic_ja: 'ロンボク視察', owner_user_id: 'u-omar' },
];

export function mockGetAssignmentRules(): AssignmentRulesResponse {
  const rules: AssignmentRule[] = assignmentRuleStore
    .slice()
    .sort((a, b) => a.priority - b.priority)
    .map((r) => ({ id: r.id, priority: r.priority, topic: r.topic, topic_ja: r.topic_ja, owner_user_id: r.owner_user_id, owner_name: userName(r.owner_user_id) ?? '—' }));
  return {
    rules,
    fallback_owner_user_id: 'u-yupon',
    fallback_owner_name: userName('u-yupon') ?? '—',
    fallback_note: 'If the assigned rep has no opening within 5 business days, overflow automatically to the next available rep.',
    fallback_note_ja: '担当者の空きが5営業日以内にない場合、次に空いているメンバーへ自動オーバーフロー。',
  };
}

export function mockPutAssignmentRules(patch: AssignmentRulesPatch): AssignmentRulesResponse {
  patch.rules.forEach((p) => {
    const idx = assignmentRuleStore.findIndex((r) => r.id === p.id);
    if (idx !== -1) assignmentRuleStore[idx] = { ...assignmentRuleStore[idx], priority: p.priority, owner_user_id: p.owner_user_id };
  });
  return mockGetAssignmentRules();
}

export function mockGetCalendarWeek(userId: string, weekStart?: string): CalendarWeekResponse {
  const user = DEMO_USERS.find((u) => u.id === userId);
  if (!user) {
    const err: any = new Error('Team member not found');
    err.status = 404;
    err.code = 'not_found';
    throw err;
  }
  const start = weekStart ? new Date(weekStart) : new Date();
  const events: CalendarEvent[] = taskStore
    .filter((t) => t.owner_user_id === userId && (t.type === 'meeting' || t.type === 'showroom_visit') && t.state !== 'done')
    .map((t) => {
      const startAt = new Date(t.due_at);
      const endAt = new Date(startAt.getTime() + 30 * 60000);
      return { id: t.id, lead_id: t.lead_id || null, lead_name: t.lead_name || null, title: t.reason, start_at: startAt.toISOString(), end_at: endAt.toISOString() };
    });
  return {
    user_id: user.id,
    user_name: user.display_name,
    week_start: start.toISOString().slice(0, 10),
    events,
    // SPEC-V2 §5: no Google Calendar connection exists — always false, never implied otherwise.
    google_calendar_connected: false,
  };
}

// ---------------------------------------------------------------------------
// SPEC-V2 §6 — Card scan: 名刺スキャン (AI-OCR)
// ---------------------------------------------------------------------------
export function mockScanLead(input: ScanLeadInput): ScanLeadResult {
  const email = input.fields.email?.trim().toLowerCase();
  const phone = input.fields.phone?.trim();
  const existing = leadStore.find((l) => (!!email && l.email?.toLowerCase() === email) || (!!phone && l.phone === phone));
  if (existing) {
    const matched_on = email && existing.email?.toLowerCase() === email ? 'email' : 'phone';
    return { lead: mockGetLeadDetail(existing.id), deduped: true, matched_on };
  }
  const created = mockCreateLead({
    name: input.fields.name?.trim() || 'Unnamed (business card)',
    email: input.fields.email?.trim() || undefined,
    phone: input.fields.phone?.trim() || undefined,
    company: input.fields.company?.trim() || undefined,
    source: 'business_card',
  });
  return { lead: created, deduped: false, matched_on: null };
}

// ---------------------------------------------------------------------------
// SPEC-V2 §7 — Import: CSV / Excel 取込
// ---------------------------------------------------------------------------
const IMPORT_FIELD_OPTIONS: ImportQuestionOption[] = [
  { key: 'name', label: 'Name', label_ja: '氏名' },
  { key: 'email', label: 'Email', label_ja: 'メール' },
  { key: 'phone', label: 'Phone', label_ja: '電話' },
  { key: 'company', label: 'Company', label_ja: '会社名' },
  { key: 'region', label: 'Region', label_ja: '地域' },
  { key: 'purpose', label: 'Purpose', label_ja: '目的' },
  { key: 'ignore', label: 'Ignore this column', label_ja: 'このカラムを無視' },
];

const HEADER_SYNONYMS: Record<string, string[]> = {
  name: ['name', 'full name', '氏名', 'お名前', 'contact name'],
  email: ['email', 'e-mail', 'email address', 'メール', 'メールアドレス'],
  phone: ['phone', 'tel', 'telephone', 'phone number', '電話', '電話番号'],
  company: ['company', 'company name', '会社', '会社名', 'organization', 'organisation'],
  region: ['region', '地域', 'area', 'location'],
  purpose: ['purpose', '目的', 'category', 'interest'],
};

function guessColumn(header: string): string | null {
  const norm = header.trim().toLowerCase();
  for (const [field, synonyms] of Object.entries(HEADER_SYNONYMS)) {
    if (synonyms.includes(norm)) return field;
  }
  return null;
}

interface StoredImport {
  import_id: string;
  file_name: string;
  rows: Record<string, string>[];
  columns: ImportColumn[];
}
const importStore: Map<string, StoredImport> = new Map();
let importCounter = 0;

export function mockAnalyzeImport(input: ImportAnalyzeInput): ImportAnalyzeResult {
  // Real .xlsx parsing (SPEC-V2 §7) is deliberately server-side only (app/csvimport.py +
  // openpyxl) — there is no client-side workbook parser in this demo/mock build, and faking one
  // would mean fabricating rows that were never actually in the file. Honest error, not a fake
  // success: connect EXPO_PUBLIC_API_URL to a live backend (EXPO_PUBLIC_USE_MOCKS unset/0) to
  // exercise .xlsx import for real.
  if (!input.rows) {
    const err: any = new Error(
      'Excel (.xlsx) import needs the live backend to parse it — this demo/mock build has no client-side workbook parser. Connect a backend (EXPO_PUBLIC_API_URL, EXPO_PUBLIC_USE_MOCKS=0) to import .xlsx files.'
    );
    err.status = 501;
    err.code = 'xlsx_requires_backend';
    throw err;
  }
  if (input.rows.length === 0) {
    const err: any = new Error('The file has no data rows.');
    err.status = 400;
    err.code = 'empty_file';
    throw err;
  }
  const headers = Object.keys(input.rows[0]);
  const columns: ImportColumn[] = headers.map((h) => ({
    key: h,
    header: h,
    sample_values: input.rows!.slice(0, 3).map((r) => r[h] ?? ''),
    guess: guessColumn(h),
  }));
  const questions: ImportQuestion[] = columns
    .filter((c) => c.guess === null)
    .map((c) => ({
      column_key: c.key,
      question: `What does "${c.header}" mean?`,
      question_ja: `「${c.header}」は何を表していますか？`,
      options: IMPORT_FIELD_OPTIONS,
    }));
  const import_id = `import-${++importCounter}`;
  importStore.set(import_id, { import_id, file_name: input.file_name, rows: input.rows, columns });
  // Dedupe-on-import preview (D13) — same email-match rule mockCommitImport() applies for real,
  // just counted ahead of commit so "how many are new vs duplicates" is answered at the mapping
  // step, matching what the live backend's preview_new/preview_duplicate already do.
  const emailKey = Object.entries(guessed_map(columns)).find(([, v]) => v === 'email')?.[0];
  let new_count = 0;
  let duplicate_count = 0;
  input.rows.forEach((row) => {
    const email = emailKey ? row[emailKey]?.trim().toLowerCase() : undefined;
    if (email && leadStore.some((l) => l.email?.toLowerCase() === email)) duplicate_count++;
    else new_count++;
  });
  return {
    import_id,
    file_name: input.file_name,
    row_count: input.rows.length,
    columns,
    questions,
    preview_rows: input.rows.slice(0, 5),
    new_count,
    duplicate_count,
  };
}

function guessed_map(columns: ImportColumn[]): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  columns.forEach((c) => { out[c.key] = c.guess; });
  return out;
}

export function mockCommitImport(input: ImportCommitInput): ImportCommitResult {
  const stored = importStore.get(input.import_id);
  if (!stored) {
    const err: any = new Error('This import has expired — start over.');
    err.status = 404;
    err.code = 'not_found';
    throw err;
  }
  const emailKey = Object.entries(input.mapping).find(([, v]) => v === 'email')?.[0];
  const nameKey = Object.entries(input.mapping).find(([, v]) => v === 'name')?.[0];
  let newCount = 0;
  let dupCount = 0;
  stored.rows.forEach((row) => {
    const email = emailKey ? row[emailKey]?.trim().toLowerCase() : undefined;
    const isDupe = !!email && leadStore.some((l) => l.email?.toLowerCase() === email);
    if (isDupe) {
      dupCount++;
      return;
    }
    newCount++;
    mockCreateLead({
      name: (nameKey ? row[nameKey]?.trim() : '') || 'Unnamed import row',
      email: email || undefined,
      source: 'csv',
    });
  });
  importStore.delete(input.import_id);
  return { new_leads: newCount, duplicate_leads: dupCount, consent_state: input.consent_state };
}

// ---------------------------------------------------------------------------
// SPEC-V2 §8 — Integrations: システム連携
// ---------------------------------------------------------------------------
const integrationsStore: IntegrationStatus[] = [
  { key: 'gohighlevel', name: 'GoHighLevel', name_ja: 'GoHighLevel', connected: false, status_note: 'No API credentials are configured. Even once connected, sync is read-only until an audit and a conflict rule exist (D11).', status_note_ja: 'API認証情報が未設定です。接続後も、監査と競合ルールが確定するまではread-onlyです。', what_is_needed: 'A GoHighLevel API key, plus an audit of existing records and a conflict rule (D11).', last_sync_at: null, record_count: null, read_only: true },
  { key: 'hubspot', name: 'HubSpot', name_ja: 'HubSpot', connected: false, status_note: 'Not connected — candidate CRM if a GoHighLevel migration is needed.', status_note_ja: '未接続。GoHighLevelからの移行先候補です。', what_is_needed: 'A decision to migrate off GoHighLevel, then a HubSpot private-app token.', last_sync_at: null, record_count: null, read_only: true },
  { key: 'gmail', name: 'Gmail', name_ja: 'Gmail', connected: false, status_note: 'Not connected — needed for inbound reply capture.', status_note_ja: '未接続。返信の取得に必要です。', what_is_needed: 'A Google Workspace OAuth grant for the shared inbox.', last_sync_at: null, record_count: null, read_only: true },
  { key: 'google_calendar', name: 'Google Calendar', name_ja: 'Google Calendar', connected: false, status_note: 'Not connected — bookings are stored in our own database only (SPEC-V2 §5).', status_note_ja: '未接続。予約は自社データベースのみに保存されます。', what_is_needed: 'A Google Workspace OAuth grant with calendar scope.', last_sync_at: null, record_count: null, read_only: true },
  { key: 'whatsapp', name: 'WhatsApp', name_ja: 'WhatsApp', connected: false, status_note: 'Not connected — no WhatsApp Business API credentials exist yet.', status_note_ja: '未接続。WhatsApp Business APIの認証情報がありません。', what_is_needed: 'WhatsApp Business API credentials via a Meta business account.', last_sync_at: null, record_count: null, read_only: true },
  { key: 'google_drive', name: 'Google Drive', name_ja: 'Google Drive', connected: false, status_note: 'Not connected.', status_note_ja: '未接続。', what_is_needed: 'A Google Workspace OAuth grant with Drive scope.', last_sync_at: null, record_count: null, read_only: true },
];

export function mockGetIntegrations(): IntegrationsResponse {
  return { integrations: integrationsStore };
}

export function mockSyncGoHighLevel(): GoHighLevelSyncResult {
  return {
    ok: false,
    message: 'GoHighLevel is not connected — no API credentials are configured for this workspace. Connect it before syncing.',
    message_ja: 'GoHighLevelは未接続です。このワークスペースにはAPI認証情報が設定されていません。接続後に同期できます。',
  };
}

// ---------------------------------------------------------------------------
// SPEC-V2 §9 — AI reply: ✨ AI返信案
// ---------------------------------------------------------------------------
interface ReplySeed {
  id: string;
  lead_id: string;
  body: string;
  received: number; // days ago
  classifier: ReplyClassifier | null;
  points_awarded: number;
  voided: boolean;
  draft: string | null;
  sent: boolean;
  sent_at: number | null; // days ago
  sent_text: string | null;
}

const replyStore: ReplySeed[] = [
  {
    id: 'reply-001',
    lead_id: 'lead-001',
    body: "Thanks for reaching out — I'd like to see the villa in person if possible. What are the next steps?",
    received: -18,
    classifier: { is_human: 'yes', wants_to_meet: 'yes', partnership: 'no', has_budget: 'unknown' },
    points_awarded: 10,
    voided: false,
    draft: null,
    sent: false,
    sent_at: null,
    sent_text: null,
  },
  {
    id: 'reply-002',
    lead_id: 'lead-002',
    body: '我々は役員数名の移転を検討しています。法人契約の場合の条件を教えてください。',
    received: -45,
    classifier: { is_human: 'yes', wants_to_meet: 'unknown', partnership: 'no', has_budget: 'yes' },
    points_awarded: 10,
    voided: false,
    draft: null,
    sent: false,
    sent_at: null,
    sent_text: null,
  },
];

function toReply(r: ReplySeed): LeadReply {
  return {
    id: r.id,
    lead_id: r.lead_id,
    body: r.body,
    received_at: iso(r.received),
    classifier: r.voided ? null : r.classifier,
    points_awarded: r.voided ? 0 : r.points_awarded,
    voided: r.voided,
    draft: r.draft,
    draft_available: false, // SPEC-V2 §9: no model is wired — the screen must offer the typed path.
    sent: r.sent,
    sent_at: r.sent_at !== null ? iso(r.sent_at) : null,
    sent_text: r.sent_text,
  };
}

export function mockGetLeadReplies(leadId: string): LeadReply[] {
  return replyStore.filter((r) => r.lead_id === leadId).map(toReply);
}

export function mockDraftReply(replyId: string, input: DraftReplyInput): LeadReply {
  const r = replyStore.find((x) => x.id === replyId);
  if (!r) {
    const err: any = new Error('Reply not found');
    err.status = 404;
    err.code = 'not_found';
    throw err;
  }
  if (!input.manual_text || !input.manual_text.trim()) {
    const err: any = new Error('No AI model is connected — type the reply yourself.');
    err.status = 409;
    err.code = 'model_not_connected';
    throw err;
  }
  r.draft = input.manual_text.trim();
  return toReply(r);
}

export function mockSendReply(replyId: string, input: SendReplyInput): LeadReply {
  const r = replyStore.find((x) => x.id === replyId);
  if (!r) {
    const err: any = new Error('Reply not found');
    err.status = 404;
    err.code = 'not_found';
    throw err;
  }
  if (!input.text.trim()) {
    const err: any = new Error('Reply text is empty.');
    err.status = 400;
    err.code = 'validation';
    throw err;
  }
  // D7: the approver's own answers to the four-question classifier, same as the real backend
  // requires — recorded as-given rather than overwriting the seeded demo classifier's points.
  const yn = (v: boolean): ClassifierAnswer => (v ? 'yes' : 'no');
  r.classifier = {
    is_human: yn(input.classifier.is_human),
    wants_to_meet: yn(input.classifier.wants_to_meet),
    partnership: yn(input.classifier.partnership),
    has_budget: yn(input.classifier.has_budget),
  };
  r.sent = true;
  r.sent_text = input.text.trim();
  r.sent_at = 0;
  return toReply(r);
}

/** D7: the rep's one-tap "this wasn't real" — removes the points without deleting the history. */
export function mockVoidReply(replyId: string): LeadReply {
  const r = replyStore.find((x) => x.id === replyId);
  if (!r) {
    const err: any = new Error('Reply not found');
    err.status = 404;
    err.code = 'not_found';
    throw err;
  }
  r.voided = true;
  const idx = leadStore.findIndex((l) => l.id === r.lead_id);
  if (idx !== -1) leadStore[idx] = { ...leadStore[idx], score: Math.max(0, leadStore[idx].score - r.points_awarded) };
  return toReply(r);
}

// ---------------------------------------------------------------------------
// SPEC-V2 §10 — voice memo, push notification settings
// ---------------------------------------------------------------------------
let voiceMemoStore: VoiceMemo[] = [];

export function mockGetVoiceMemos(leadId: string): VoiceMemo[] {
  return voiceMemoStore
    .filter((m) => m.lead_id === leadId)
    .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
}

export function mockCreateVoiceMemo(leadId: string, input: CreateVoiceMemoInput, actorId: string, actorName: string): VoiceMemo {
  const memo: VoiceMemo = {
    id: `memo-${Date.now()}`,
    lead_id: leadId,
    author_user_id: actorId,
    author_name: actorName,
    duration_seconds: Math.round(input.duration_seconds),
    recorded_at: new Date().toISOString(),
    transcription_available: false,
  };
  voiceMemoStore = [memo, ...voiceMemoStore];
  return memo;
}

/** Mirrors exactly the 4 columns `app/api.py` §10b's `push_settings` table has — see the
 * `NotificationEventKey` doc comment in api/types.ts. `task_escalated` stands in for the
 * backend's single `notify_task_escalation_level` int (D12b: level 2-3 notifies a manager). */
const NOTIFICATION_DEFAULTS: NotificationSetting[] = [
  { key: 'new_lead', label: 'A new lead arrives', label_ja: '新規リードが入った', enabled: true, manager_only: false },
  { key: 'hot_lead', label: 'Lead crosses the hot threshold (40+)', label_ja: 'リードがしきい値（40点）を超過', enabled: true, manager_only: false },
  { key: 'reply_received', label: 'A lead replies', label_ja: 'リードから返信があった', enabled: true, manager_only: false },
  { key: 'task_escalated', label: 'A task escalates to level 2+', label_ja: 'タスクがレベル2以上にエスカレーション', enabled: true, manager_only: true },
];
let notificationSettingsStore: NotificationSetting[] = NOTIFICATION_DEFAULTS.map((s) => ({ ...s }));
let pushTokenStore: string | null = null;

export function mockGetNotificationSettings(): NotificationSettingsResponse {
  return { push_registered: !!pushTokenStore, push_token: pushTokenStore, settings: notificationSettingsStore };
}

export function mockPatchNotificationSettings(patch: NotificationSettingsPatch): NotificationSettingsResponse {
  patch.settings.forEach((p) => {
    const idx = notificationSettingsStore.findIndex((s) => s.key === p.key);
    if (idx !== -1) notificationSettingsStore[idx] = { ...notificationSettingsStore[idx], enabled: p.enabled };
  });
  return mockGetNotificationSettings();
}

export function mockRegisterPushToken(token: string): NotificationSettingsResponse {
  pushTokenStore = token;
  return mockGetNotificationSettings();
}

// ---------------------------------------------------------------------------
// Pagination helper
// ---------------------------------------------------------------------------
function paginate<T>(list: T[], page = 1, pageSize = 20): Paginated<T> {
  const p = Math.max(1, page);
  const ps = Math.max(1, Math.min(100, pageSize));
  const start = (p - 1) * ps;
  return { data: list.slice(start, start + ps), page: p, page_size: ps, total: list.length };
}
