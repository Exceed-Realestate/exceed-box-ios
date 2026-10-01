export const c = {
  // Locked Login/Sidebar palette — the app's one deliberately-dark surface (brand block: sidebar,
  // compact tab bar, Login screen). Everything else in the app is light (see "Signed-in application
  // surfaces" below). Keep these values stable: LoginScreen/Sidebar/CompactTabBar consume them directly.
  charcoal: '#15171C',
  surface: '#1C1F26',
  border: '#2F3340',
  yellow: '#FFD84D',
  gold: '#F0B429',
  light: '#F6F7F9',
  soft: '#EEEFF2',
  muted: '#C9CDD6',
  greyLabel: '#8D929E',
  greyNote: '#8F95A2',
  greyLegal: '#747A86',
  greyVersion: '#777D88',
  outline: '#555B69',

  // Signed-in application surfaces — LIGHT theme, matching the client reference exactly
  // (design/dashboard/target-dashboard.png + the demo's index.html :root palette).
  page: '#F4F5F7',
  card: '#FFFFFF',
  raised: '#F6F7F9',
  hairline: '#EEEFF2',
  textPrimary: '#15171C',
  textSecondary: '#6E7480',
  textTertiary: '#9AA0AC',
  micro: '#8D929E',
};

export const COMPANY_DOMAIN = 'exceed-re.ae';
export const VERSION = 'v1.0.0';

// Additive tokens for the screens behind Login. LoginScreen.tsx itself is untouched.
export const spacing = {
  xs: 4,
  sm: 8,
  cardGap: 10,
  md: 12,
  card: 14,
  lg: 16,
  xl: 24,
  section: 28,
  xxl: 32,
  screen: 16,
  screenTablet: 24,
};
export const radius = { sm: 8, md: 12, lg: 12, card: 12, xl: 16, pill: 999 };

/** The only typography sizes used by the signed-in app. */
export const type = {
  screenTitle: { fontSize: 28, fontWeight: '700' as const, lineHeight: 31 },
  sectionTitle: { fontSize: 20, fontWeight: '700' as const, lineHeight: 22 },
  primary: { fontSize: 15, fontWeight: '600' as const, lineHeight: 20 },
  secondary: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18 },
  pill: { fontSize: 11, fontWeight: '700' as const, lineHeight: 15 },
  micro: {
    fontSize: 10,
    fontWeight: '800' as const,
    lineHeight: 14,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
};

/**
 * Bright/saturated colours — for dots, chart lines, progress-bar fills, translucent tint
 * backgrounds. Decorative graphic elements, not text, so WCAG text-contrast rules don't apply to
 * them the way they do to `statusText` below. Values match the client reference's own palette
 * (index.html :root — --red/--amber/--green/--blue/--orange/--violet).
 */
export const status = {
  danger: '#DD5B5B',
  warning: '#F0B429',
  success: '#1FA36B',
  info: '#3E7CB1',
};

/**
 * Dark, readable-on-white counterparts of `status` — use these for any TEXT rendered directly on
 * `c.page`/`c.card` or on one of the translucent tint backgrounds below. Never render `status.*`
 * (or `c.yellow`/`c.gold`) as text on a light surface — that's the one contrast failure the client
 * brief calls out explicitly for yellow, and it is equally true of the other bright hues.
 */
export const statusText = {
  danger: '#B23A46',
  warning: '#8A6A00', // pairs with c.yellow/c.gold — same value as index.html's --teal-dark
  success: '#137A4E',
  info: '#2A5E8C',
};

/** Extra hues the dashboard needs beyond the four `status` ones (source/region breakdown bars,
 * AI chip, hot-lead score dots) — bright fill + dark readable-text pair, same convention. */
export const palette = {
  orange: { fill: '#F07B3F', text: '#B4501B', soft: '#FDEEE5' },
  amber: { fill: '#E8A23D', text: '#9A6A1B', soft: '#FBF1DF' },
  violet: { fill: '#7A5FB8', text: '#5B4691', soft: '#EFEAF9' },
  teal: { fill: '#FFD84D', text: '#8A6A00', soft: '#FFF4CC' },
};

/** Subtle card shadow used across the light theme (client brief: "very subtle shadow"). */
export const shadow = {
  shadowColor: '#13283C',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.06,
  shadowRadius: 10,
  elevation: 2,
} as const;

/** Content never stretches past this on iPad — cap + centre. */
export const MAX_CONTENT_WIDTH = 560;
/** Dashboard is data-dense (tile grid, funnel, per-rep rows), so it gets a wider cap than a form —
 * still capped (never stretches across a 13" display), but wide enough for more responsive columns. */
export const MAX_DASHBOARD_WIDTH = 1120;
export const TABLET_BREAKPOINT = 768;
