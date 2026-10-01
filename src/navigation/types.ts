import type { NavigatorScreenParams } from '@react-navigation/native';

export type LeadDetailParams = { leadId: string };

export type TodayStackParamList = {
  Today: undefined;
  LeadDetail: LeadDetailParams;
};

export type LeadsStackParamList = {
  Leads: undefined;
  LeadDetail: LeadDetailParams;
  // SPEC-V2 §6/§7: card scan and CSV import are actions launched from Leads, not destinations of
  // their own — pushed onto the same stack so "back" returns to the list.
  CardScan: undefined;
  Import: undefined;
};

export type PipelineStackParamList = {
  Pipeline: undefined;
  LeadDetail: LeadDetailParams;
};

export type DashboardStackParamList = {
  Dashboard: undefined;
  LeadDetail: LeadDetailParams;
};

export type TeamStackParamList = {
  Team: undefined;
  MemberTasks: { userId: string };
  LeadDetail: LeadDetailParams;
};

export type AdminStackParamList = {
  AdminUsers: undefined;
};

// SPEC-V2 §Roles — the 10 previously-unreachable screens, each hosted in its own thin native stack
// so it can gain a pushed detail route later without reshaping TabParamList again.
export type TrackingStackParamList = {
  Tracking: undefined;
  LeadDetail: LeadDetailParams;
};

export type NurtureStackParamList = {
  Nurture: undefined;
  NurtureSequenceDetail: { sequenceId: string };
};

export type SnsStackParamList = {
  Sns: undefined;
};

export type BookingStackParamList = {
  Booking: undefined;
};

export type AssignStackParamList = {
  Assign: undefined;
};

export type IntegrationsStackParamList = {
  Integrations: undefined;
};

export type SettingsStackParamList = {
  NotificationSettings: undefined;
};

export type TabParamList = {
  TodayTab: NavigatorScreenParams<TodayStackParamList>;
  LeadsTab: NavigatorScreenParams<LeadsStackParamList>;
  PipelineTab: NavigatorScreenParams<PipelineStackParamList>;
  TrackingTab: NavigatorScreenParams<TrackingStackParamList>;
  DashboardTab: NavigatorScreenParams<DashboardStackParamList>;
  TeamTab: NavigatorScreenParams<TeamStackParamList>;
  NurtureTab: NavigatorScreenParams<NurtureStackParamList>;
  SnsTab: NavigatorScreenParams<SnsStackParamList>;
  BookingTab: NavigatorScreenParams<BookingStackParamList>;
  AssignTab: NavigatorScreenParams<AssignStackParamList>;
  IntegrationsTab: NavigatorScreenParams<IntegrationsStackParamList>;
  AdminTab: NavigatorScreenParams<AdminStackParamList>;
  SettingsTab: NavigatorScreenParams<SettingsStackParamList>;
};

export type RootStackParamList = {
  Login: undefined;
  Main: NavigatorScreenParams<TabParamList>;
};
