import type { Role } from '../api/types';

/**
 * Client-side mirror of the SPEC.md permission matrix. This ONLY drives what the UI shows —
 * the server is the real enforcement point (SPEC.md: "the app hides what the role cannot do").
 * A denial here must always also be a real 403 from the server; the app never assumes otherwise.
 */
export type Capability =
  | 'tasks.view_all' // see everyone's tasks
  | 'leads.view_all' // see all leads, not just own
  | 'leads.edit_any' // edit any lead, not just own
  | 'leads.assign' // assign / reassign an owner
  | 'pipeline.move_any' // move any lead's stage
  | 'pipeline.move_own' // move own lead's stage
  | 'signal.meeting_any' // grant +30 wants-to-meet on any lead
  | 'signal.meeting_own' // grant +30 wants-to-meet on own lead
  | 'dashboard.company' // company-wide KPIs
  | 'dashboard.per_rep' // per-rep performance breakdown
  | 'campaigns.manage' // import CSV / create campaigns
  | 'consent.view_detail' // see consent + contact details (subject to ownership below)
  | 'users.manage' // manage users + roles
  | 'team.view' // Team screen
  | 'admin.view' // Admin/Users screen
  // SPEC-V2 §Roles — new screens.
  | 'tracking.view' // Tracking (activity feed + scoring model) — sales sees own leads only
  | 'nurture.view' // Nurture screen — view
  | 'nurture.edit' // Nurture — edit steps/sequences
  | 'sns.view' // SNS screen — view
  | 'sns.edit' // SNS — edit patterns
  | 'booking.view' // Booking settings — view
  | 'booking.manage' // Booking settings — edit
  | 'assignment.view' // Assignment rules + rep calendar — view
  | 'assignment.manage' // Assignment rules — edit
  | 'card_scan.create' // Card scan — create a lead from a scanned card
  | 'import.run' // CSV import wizard
  | 'integrations.view' // Integrations status board — view
  | 'integrations.manage'; // Integrations — trigger a sync

const MATRIX: Record<Capability, Role[]> = {
  'tasks.view_all': ['admin', 'office_manager'],
  'leads.view_all': ['admin', 'marketing', 'office_manager'],
  'leads.edit_any': ['admin', 'office_manager'],
  'leads.assign': ['admin', 'office_manager'],
  'pipeline.move_any': ['admin', 'office_manager'],
  'pipeline.move_own': ['admin', 'office_manager', 'sales'],
  'signal.meeting_any': ['admin', 'office_manager'],
  'signal.meeting_own': ['admin', 'office_manager', 'sales'],
  'dashboard.company': ['admin', 'marketing', 'office_manager'],
  'dashboard.per_rep': ['admin', 'office_manager'],
  'campaigns.manage': ['admin', 'marketing'],
  'consent.view_detail': ['admin', 'office_manager', 'sales'],
  'users.manage': ['admin'],
  'team.view': ['admin', 'office_manager'],
  'admin.view': ['admin'],
  'tracking.view': ['admin', 'marketing', 'office_manager', 'sales'],
  'nurture.view': ['admin', 'marketing', 'office_manager'],
  'nurture.edit': ['admin', 'marketing'],
  'sns.view': ['admin', 'marketing', 'office_manager'],
  'sns.edit': ['admin', 'marketing'],
  'booking.view': ['admin', 'office_manager'],
  'booking.manage': ['admin', 'office_manager'],
  'assignment.view': ['admin', 'office_manager'],
  'assignment.manage': ['admin', 'office_manager'],
  'card_scan.create': ['admin', 'marketing', 'office_manager', 'sales'],
  'import.run': ['admin', 'marketing'],
  'integrations.view': ['admin', 'marketing', 'office_manager'],
  'integrations.manage': ['admin'],
};

export function roleCan(role: Role | null | undefined, capability: Capability): boolean {
  if (!role) return false;
  return MATRIX[capability].includes(role);
}

/** SPEC rule 2: marketing sees a lead's contact details only when they own it. */
export function canSeeLeadContact(role: Role | null | undefined, isOwner: boolean): boolean {
  if (!role) return false;
  if (role === 'admin' || role === 'office_manager') return true;
  if (role === 'sales') return isOwner;
  if (role === 'marketing') return isOwner;
  return false;
}

export function canEditLead(role: Role | null | undefined, isOwner: boolean): boolean {
  if (roleCan(role, 'leads.edit_any')) return true;
  return isOwner; // "edit a lead they own" is ✅ for every role
}

export function canMoveStage(role: Role | null | undefined, isOwner: boolean): boolean {
  if (roleCan(role, 'pipeline.move_any')) return true;
  if (role === 'sales' && isOwner) return true;
  return false;
}

export function canGrantMeetingSignal(role: Role | null | undefined, isOwner: boolean): boolean {
  if (roleCan(role, 'signal.meeting_any')) return true;
  if (role === 'sales' && isOwner) return true;
  return false;
}
