import type { TranslationKey } from '../i18n';

/**
 * Translation key for each tab route, shared between the compact bottom tab bar and the regular-
 * width sidebar (TabNavigator.tsx, Sidebar.tsx) so the two presentations of the same destination
 * list can never drift out of sync with each other, and so both stay in the active app language.
 */
export const DESTINATION_LABEL_KEY: Record<string, TranslationKey> = {
  TodayTab: 'nav.today',
  LeadsTab: 'nav.leads',
  PipelineTab: 'nav.pipeline',
  TrackingTab: 'nav.tracking',
  DashboardTab: 'nav.dashboard',
  TeamTab: 'nav.team',
  NurtureTab: 'nav.nurture',
  SnsTab: 'nav.sns',
  BookingTab: 'nav.booking',
  AssignTab: 'nav.assign',
  IntegrationsTab: 'nav.integrations',
  AdminTab: 'nav.admin',
  SettingsTab: 'nav.settings',
};

/**
 * SPEC-V2 §Roles now puts up to 13 destinations behind one role, which is unusable as a flat bottom
 * tab bar at a 400pt (iPhone) width. `PRIMARY_TAB_NAMES` is the one list both presentations read to
 * agree on the split — CompactTabBar renders these directly plus a synthetic "More" button for
 * whatever else `state.routes` contains (see TabNavigator's `showX &&` gating), Sidebar renders the
 * same split as two sections instead of hiding anything, since a 260pt regular-width column has the
 * room to show every permitted destination at once. Five is deliberate: it matches the point at which
 * native iOS's own `UITabBarController` starts collapsing extra tabs into its own "More" tab.
 */
// Balraj, 2026-09-18: "match OneBox exactly" — the demo's first five destinations are
// ダッシュボード · 本日のアクション · リード管理 · 商談パイプライン · ステップメール, so those are
// the five that stay out of "More". A sales user has neither dashboard nor nurture, so their
// bar simply starts at Today; nothing is hidden that they could otherwise reach.
export const PRIMARY_TAB_NAMES: string[] = ['DashboardTab', 'TodayTab', 'LeadsTab', 'PipelineTab', 'NurtureTab'];

export const MORE_LABEL_KEY: TranslationKey = 'common.more';
