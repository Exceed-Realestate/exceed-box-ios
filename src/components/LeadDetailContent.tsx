import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { c, radius, spacing, status, statusText, type } from '../theme';
import { api } from '../api/client';
import { describeApiError, useAuth } from '../auth/AuthContext';
import { canEditLead, canGrantMeetingSignal, canMoveStage, roleCan } from '../auth/permissions';
import type { LeadDetail, LeadReply, LeadStage, TeamMember } from '../api/types';
import { ALL_STAGES, purposeLabel, regionsLabel, relationshipLabel, sourceLabel, stageLabel } from '../api/mocks';
import { ErrorState, ForbiddenNotice } from './StateViews';
import { SkeletonBar } from './StateViews';
import { ExitBadge, ScoreBadge, StageBadge } from './Badges';
import { PickerSheet } from './PickerSheet';
import { SectionHeader } from './SectionHeader';
import { useScreenPadding } from './ScreenContainer';
import { formatDateTime } from '../utils/dates';
import { isForbidden } from '../api/client';
import { AiReplyModal } from './AiReplyModal';
import { VoiceMemoSection } from './VoiceMemoSection';
import { pickBilingual, pickPair, useLanguage, useT, type TranslationKey } from '../i18n';
import type { ConsentState } from '../api/types';

const CONSENT_KEY: Record<ConsentState, TranslationKey> = {
  granted: 'leadDetail.consentGranted',
  withdrawn: 'leadDetail.consentWithdrawn',
  unknown: 'leadDetail.consentUnknown',
};

/** `lead_consent.basis` — the five values the backend's CHECK constraint allows. Deliberately a
 * plain Record<string,…> with a `??` fallback at the call site rather than an exhaustive union:
 * a basis the server adds later must show up as "not recorded", never crash the drawer. */
const CONSENT_BASIS_KEY: Record<string, TranslationKey> = {
  explicit: 'leadDetail.consentBasisExplicit',
  implied: 'leadDetail.consentBasisImplied',
  ambiguous: 'leadDetail.consentBasisAmbiguous',
  unknown: 'leadDetail.consentBasisUnknown',
  withdrawn: 'leadDetail.consentBasisWithdrawn',
};

export function LeadDetailContent({ leadId, onLeadChange }: { leadId: string; onLeadChange?: (lead: LeadDetail) => void }) {
  const screenPadding = useScreenPadding();
  const { me, can } = useAuth();
  const [lang] = useLanguage();
  const t = useT();
  const [status_, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [stageSheet, setStageSheet] = useState(false);
  const [ownerSheet, setOwnerSheet] = useState(false);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [teamLoading, setTeamLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [signalNote, setSignalNote] = useState('');
  const [signalOpen, setSignalOpen] = useState(false);

  // SPEC-V2 §10 — lead drawer actions, AI reply.
  const [taskBusy, setTaskBusy] = useState<string | null>(null);
  const [contactDateOpen, setContactDateOpen] = useState(false);
  const [replies, setReplies] = useState<LeadReply[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [repliesError, setRepliesError] = useState<string | null>(null);
  const [openReply, setOpenReply] = useState<LeadReply | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const detail = await api.getLead(leadId);
      setLead(detail);
      setStatus('ready');
      onLeadChange?.(detail);
    } catch (e) {
      setError(describeApiError(e));
      setStatus('error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  useEffect(() => {
    load();
  }, [load]);

  const loadReplies = useCallback(async () => {
    setRepliesLoading(true);
    setRepliesError(null);
    try {
      const res = await api.getLeadReplies(leadId);
      setReplies(res);
    } catch (e) {
      setRepliesError(describeApiError(e));
    } finally {
      setRepliesLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  useEffect(() => {
    loadReplies();
  }, [loadReplies]);

  const isOwner = !!(lead && me && lead.owner_user_id === me.id);

  const runAction = async (fn: () => Promise<LeadDetail>, successMsg: string) => {
    setBusy(true);
    setBanner(null);
    try {
      const updated = await fn();
      setLead(updated);
      onLeadChange?.(updated);
      setBanner(successMsg);
      setTimeout(() => setBanner(null), 2500);
    } catch (e) {
      if (isForbidden(e)) setBanner(describeApiError(e));
      else setBanner(describeApiError(e));
    } finally {
      setBusy(false);
    }
  };

  /** SPEC-V2 §10 lead drawer actions — each creates a real task via the existing /api/tasks
   * endpoint (not decorative). `reason` is required by SPEC.md's createTask contract. */
  const runQuickTask = async (
    key: string,
    type: 'call' | 'meeting' | 'follow_up' | 'showroom_visit' | 'other',
    reason: string,
    dueAt: Date,
    successMsg: string
  ) => {
    if (!lead || !me) return;
    setTaskBusy(key);
    setBanner(null);
    try {
      await api.createTask({
        type,
        owner_user_id: lead.owner_user_id ?? me.id,
        lead_id: lead.id,
        due_at: dueAt.toISOString(),
        reason,
      });
      setBanner(successMsg);
      setTimeout(() => setBanner(null), 2500);
    } catch (e) {
      setBanner(describeApiError(e));
    } finally {
      setTaskBusy(null);
    }
  };

  const loadTeamForPicker = async () => {
    setTeamLoading(true);
    setTeamError(null);
    try {
      // Assign-owner needs the whole roster, not one page — office is ~10-15 people (SPEC).
      const res = await api.getTeam(1, 200);
      setTeam(res.data);
    } catch (e) {
      // Keep whatever roster we already had (if any) rather than turning a failed reload into an
      // unexplained empty picker; the sheet shows the error and a retry either way.
      setTeamError(describeApiError(e));
    } finally {
      setTeamLoading(false);
    }
  };

  if (status_ === 'loading') {
    return (
      <View style={{ padding: spacing.lg }}>
        <SkeletonBar width="60%" height={22} />
        <SkeletonBar width="40%" height={12} style={{ marginTop: 10 }} />
        <SkeletonBar width="90%" height={80} style={{ marginTop: 24 }} />
        <SkeletonBar width="90%" height={120} style={{ marginTop: 16 }} />
      </View>
    );
  }

  if (status_ === 'error' || !lead) {
    return <ErrorState message={error ?? t('leadDetail.loadFailed')} onRetry={load} />;
  }

  const editable = canEditLead(me?.role, isOwner);
  const canStage = canMoveStage(me?.role, isOwner);
  const canSignal = canGrantMeetingSignal(me?.role, isOwner);
  const canAssign = roleCan(me?.role, 'leads.assign');
  const showContact = me?.role === 'admin' || me?.role === 'office_manager' || isOwner;
  const leadName = pickBilingual(lang, lead.name, lead.name_ja);

  return (
    <ScrollView contentContainerStyle={[s.content, { paddingHorizontal: screenPadding }]}>
      {!!banner && (
        <View style={s.banner}>
          <Text style={s.bannerText}>{banner}</Text>
        </View>
      )}

      <View style={s.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.name}>{leadName}</Text>
          {!!lead.company && <Text style={s.company}>{lead.company}</Text>}
        </View>
        <ScoreBadge score={lead.score} />
      </View>

      <View style={s.badgeRow}>
        <StageBadge stage={lead.stage} />
        {lead.exit_state && <ExitBadge exit={lead.exit_state} />}
      </View>

      {/* Contact + consent — hidden per SPEC rule 2 unless the caller owns the lead or is admin/office_manager. */}
      <Section title={t('leadDetail.contact')}>
        {showContact ? (
          <>
            <Row label={t('leadDetail.email')} value={lead.email ?? '—'} />
            <Row label={t('leadDetail.phone')} value={lead.phone ?? '—'} />
            {lead.consent && (
              <>
                {/* One consent record, not a per-channel matrix — see ConsentInfo in api/types.ts.
                    `state` answers "may I contact them"; `basis` is the ground that answer rests
                    on, which is the half that has to survive a 特定電子メール法 challenge. */}
                <Row label={t('leadDetail.consentState')} value={t(CONSENT_KEY[lead.consent.state])} />
                <Row label={t('leadDetail.consentBasis')} value={t(CONSENT_BASIS_KEY[lead.consent.basis] ?? 'leadDetail.consentBasisUnknown')} />
                {!!lead.consent.obtained_via && <Row label={t('leadDetail.consentObtainedVia')} value={lead.consent.obtained_via} />}
                {!!lead.consent.obtained_at && (
                  <Row label={t('leadDetail.consentObtainedAt')} value={formatDateTime(lead.consent.obtained_at, lang)} />
                )}
              </>
            )}
          </>
        ) : (
          <Text style={s.aggregateNote}>{t('leadDetail.contactHidden')}</Text>
        )}
      </Section>

      <Section title={t('leadDetail.categories')}>
        <Row label={t('leadDetail.region')} value={pickPair(lang, regionsLabel(lead.region, ', '))} />
        <Row label={t('leadDetail.purpose')} value={pickPair(lang, purposeLabel(lead.purpose))} />
        <Row label={t('leadDetail.relationship')} value={pickPair(lang, relationshipLabel(lead.relationship))} />
        <Row label={t('leadDetail.source')} value={pickPair(lang, sourceLabel(lead.source))} />
        <Row label={t('leadDetail.owner')} value={lead.owner_name ?? t('common.unassigned')} />
      </Section>

      <Section title={t('leadDetail.scoreBreakdown')}>
        {lead.score_breakdown.length === 0 && <Text style={s.aggregateNote}>{t('leadDetail.noScoringSignals')}</Text>}
        {lead.score_breakdown.map((b, i) => (
          <View key={i} style={s.scoreRow}>
            <View style={{ flex: 1 }}>
              <Text style={[s.scoreRuleText, b.faded && { opacity: 0.5 }]}>{pickBilingual(lang, b.rule, b.rule_ja)}</Text>
            </View>
            <Text style={[s.scorePoints, b.faded && { opacity: 0.5 }]}>+{b.points}</Text>
          </View>
        ))}
      </Section>

      <Section title={t('leadDetail.timeline')}>
        {lead.timeline.map((ev) => (
          <View key={ev.id} style={s.timelineRow}>
            <View style={s.timelineDot} />
            <View style={{ flex: 1 }}>
              <Text style={s.timelineLabel}>{pickBilingual(lang, ev.label, ev.label_ja)}</Text>
              <Text style={s.timelineDate}>{formatDateTime(ev.at, lang)}</Text>
            </View>
          </View>
        ))}
      </Section>

      <Section title={t('leadDetail.channels')}>
        {lead.channels.length === 0 && <Text style={s.aggregateNote}>{t('leadDetail.noChannels')}</Text>}
        {lead.channels.map((ch, i) => (
          <Row key={i} label={ch.type} value={showContact ? ch.identifier : '••••••'} note={ch.first_touch ? t('leadDetail.firstTouch') : undefined} />
        ))}
      </Section>

      {/* AI reply — SPEC-V2 §9. Only shown when there is at least one captured reply. */}
      {(repliesLoading || repliesError || replies.length > 0) && (
        <Section title={t('leadDetail.replies')}>
          {repliesLoading && <Text style={s.aggregateNote}>{t('leadDetail.loadingReplies')}</Text>}
          {!!repliesError && <Text style={[s.aggregateNote, { color: statusText.danger }]}>{repliesError}</Text>}
          {replies.map((r) => (
            <Pressable key={r.id} onPress={() => setOpenReply(r)} style={s.replyRow}>
              <Text style={s.replyBody} numberOfLines={2}>
                {r.body}
              </Text>
              <Text style={s.replyMeta}>
                {formatDateTime(r.received_at, lang)}
                {r.voided ? ` · ${t('leadDetail.notReal')}` : r.sent ? ` · ${t('leadDetail.replied')}` : ` · ${t('leadDetail.aiReply')}`}
              </Text>
            </Pressable>
          ))}
        </Section>
      )}

      {/* Voice memo — SPEC-V2 §10. */}
      <Section title={t('leadDetail.voiceNotes')}>
        <View style={{ width: '100%' }}>
          <VoiceMemoSection leadId={lead.id} />
        </View>
      </Section>

      {/* Actions — every button here is role-gated and does something real. */}
      <Section title={t('leadDetail.actions')}>
        <View style={s.actionsWrap}>
          {editable && <ActionButton label={t('leadDetail.editDetails')} onPress={() => setEditOpen(true)} disabled={busy} />}
          {canStage && <ActionButton label={t('leadDetail.moveStage')} onPress={() => setStageSheet(true)} disabled={busy} />}
          {canSignal && <ActionButton label={t('leadDetail.markWantsToMeet')} onPress={() => setSignalOpen(true)} disabled={busy} />}
          {canAssign && (
            <ActionButton
              label={t('leadDetail.assignOwner')}
              onPress={() => {
                loadTeamForPicker();
                setOwnerSheet(true);
              }}
              disabled={busy}
            />
          )}
        </View>
        {!editable && !canStage && !canSignal && !canAssign && <ForbiddenNotice message={t('leadDetail.noActions')} />}

        {/* SPEC-V2 §10 — the five lead-drawer actions. Each creates a real task. */}
        {editable && (
          <View style={[s.actionsWrap, { marginTop: spacing.cardGap }]}>
            <ActionButton
              label={t('leadDetail.notifyRep')}
              onPress={() => runQuickTask('notify', 'other', t('leadDetail.notifyRepReason', { name: leadName }), new Date(), t('leadDetail.notifyRepSuccess'))}
              disabled={taskBusy !== null}
            />
            <ActionButton
              label={t('leadDetail.showroomVisit')}
              onPress={() =>
                runQuickTask(
                  'showroom',
                  'showroom_visit',
                  t('leadDetail.showroomVisitReason', { name: leadName }),
                  new Date(),
                  t('leadDetail.showroomVisitSuccess')
                )
              }
              disabled={taskBusy !== null}
            />
            <ActionButton
              label={t('leadDetail.siteInspection')}
              onPress={() => {
                const due = new Date();
                due.setDate(due.getDate() + 1);
                runQuickTask('inspection', 'meeting', t('leadDetail.siteInspectionReason', { name: leadName }), due, t('leadDetail.siteInspectionSuccess'));
              }}
              disabled={taskBusy !== null}
            />
            <ActionButton label={t('leadDetail.setContactDate')} onPress={() => setContactDateOpen(true)} disabled={taskBusy !== null} />
            <ActionButton
              label={t('leadDetail.follow')}
              onPress={() => {
                const due = new Date();
                due.setDate(due.getDate() + 3);
                runQuickTask('follow', 'follow_up', t('leadDetail.followReason', { name: leadName }), due, t('leadDetail.followSuccess'));
              }}
              disabled={taskBusy !== null}
            />
          </View>
        )}
      </Section>

      {/* Stage picker */}
      <PickerSheet
        visible={stageSheet}
        title={t('leadDetail.moveToStage')}
        options={ALL_STAGES.map((st) => ({ key: st, label: pickPair(lang, stageLabel(st)) }))}
        onClose={() => setStageSheet(false)}
        onSelect={(key) => {
          setStageSheet(false);
          runAction(() => api.setLeadStage(lead.id, key as LeadStage), t('leadDetail.stageChanged', { stage: pickPair(lang, stageLabel(key as LeadStage)) }));
        }}
      />

      {/* Owner picker, sourced from the Team roster (available to admin/office_manager alike). */}
      <PickerSheet
        visible={ownerSheet}
        title={t('leadDetail.assignTo')}
        options={team.map((m) => ({ key: m.user_id, label: m.name }))}
        onClose={() => { setOwnerSheet(false); setTeamError(null); }}
        error={teamError}
        onRetry={loadTeamForPicker}
        loading={teamLoading}
        onSelect={(key) => {
          setOwnerSheet(false);
          const target = team.find((m) => m.user_id === key);
          runAction(() => api.assignLead(lead.id, key), t('leadDetail.assignedTo', { name: target?.name ?? key }));
        }}
      />

      {/* Edit modal */}
      <EditLeadModal visible={editOpen} lead={lead} onClose={() => setEditOpen(false)} onSaved={(l) => { setLead(l); onLeadChange?.(l); setEditOpen(false); }} />

      {/* Wants-to-meet signal modal */}
      <Modal visible={signalOpen} transparent animationType="fade" onRequestClose={() => setSignalOpen(false)}>
        <Pressable style={s.modalBackdrop} onPress={() => setSignalOpen(false)}>
          <Pressable style={s.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={s.modalTitle}>{t('leadDetail.wantsToMeetTitle')}</Text>
            <Text style={s.modalBody}>{t('leadDetail.wantsToMeetBody')}</Text>
            <TextInput
              value={signalNote}
              onChangeText={setSignalNote}
              placeholder={t('leadDetail.wantsToMeetPlaceholder')}
              placeholderTextColor="#7B818D"
              style={s.modalInput}
              multiline
            />
            <View style={s.modalActions}>
              <Pressable onPress={() => setSignalOpen(false)} style={s.modalCancelBtn}>
                <Text style={s.modalCancelText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setSignalOpen(false);
                  const note = signalNote;
                  setSignalNote('');
                  runAction(() => api.sendMeetingSignal(lead.id, note || undefined), t('leadDetail.wantsToMeetSuccess'));
                }}
                style={s.modalConfirmBtn}
              >
                <Text style={s.modalConfirmText}>{t('leadDetail.record30')}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Set contact date */}
      <Modal visible={contactDateOpen} transparent animationType="fade" onRequestClose={() => setContactDateOpen(false)}>
        <Pressable style={s.modalBackdrop} onPress={() => setContactDateOpen(false)}>
          <Pressable style={s.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={s.modalTitle}>{t('leadDetail.setContactDateTitle')}</Text>
            <View style={s.contactDateRow}>
              {[
                { label: t('leadDetail.today'), days: 0 },
                { label: t('leadDetail.tomorrow'), days: 1 },
                { label: t('leadDetail.plus3Days'), days: 3 },
                { label: t('leadDetail.plus1Week'), days: 7 },
              ].map((opt) => (
                <Pressable
                  key={opt.days}
                  onPress={() => {
                    setContactDateOpen(false);
                    const due = new Date();
                    due.setDate(due.getDate() + opt.days);
                    runQuickTask('contact_date', 'follow_up', t('leadDetail.contactDateReason', { label: opt.label }), due, t('leadDetail.contactDateSuccess'));
                  }}
                  style={s.contactDateChip}
                >
                  <Text style={s.contactDateChipText}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={() => setContactDateOpen(false)} style={s.modalCancelBtn}>
              <Text style={s.modalCancelText}>{t('common.cancel')}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <AiReplyModal
        visible={!!openReply}
        reply={openReply}
        onClose={() => setOpenReply(null)}
        onUpdated={(r) => {
          setReplies((prev) => prev.map((x) => (x.id === r.id ? r : x)));
          setOpenReply(r);
        }}
      />
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <SectionHeader title={title} />
      <View style={s.sectionBody}>{children}</View>
    </View>
  );
}

function Row({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>
        {label}
        {!!note && <Text style={s.rowLabelNote}> · {note}</Text>}
      </Text>
      <Text style={s.rowValue}>{value}</Text>
    </View>
  );
}

function ActionButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [s.actionBtn, pressed && { opacity: 0.8 }, disabled && { opacity: 0.5 }]}>
      <Text style={s.actionBtnText}>{label}</Text>
    </Pressable>
  );
}

function EditLeadModal({
  visible,
  lead,
  onClose,
  onSaved,
}: {
  visible: boolean;
  lead: LeadDetail;
  onClose: () => void;
  onSaved: (l: LeadDetail) => void;
}) {
  const t = useT();
  const [name, setName] = useState(lead.name);
  const [email, setEmail] = useState(lead.email ?? '');
  const [phone, setPhone] = useState(lead.phone ?? '');
  const [company, setCompany] = useState(lead.company ?? '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setName(lead.name);
      setEmail(lead.email ?? '');
      setPhone(lead.phone ?? '');
      setCompany(lead.company ?? '');
      setErr(null);
    }
  }, [visible, lead]);

  const save = async () => {
    if (!name.trim()) {
      setErr(t('leadDetail.nameRequired'));
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const updated = await api.patchLead(lead.id, { name: name.trim(), email: email.trim() || undefined, phone: phone.trim() || undefined, company: company.trim() || undefined });
      onSaved(updated);
    } catch (e) {
      setErr(describeApiError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.modalBackdrop} onPress={onClose}>
        <Pressable style={s.modalCard} onPress={(e) => e.stopPropagation()}>
          <Text style={s.modalTitle}>{t('leadDetail.editLead')}</Text>
          <FieldInput label={t('leadDetail.name')} value={name} onChangeText={setName} />
          <FieldInput label={t('leadDetail.email')} value={email} onChangeText={setEmail} keyboardType="email-address" />
          <FieldInput label={t('leadDetail.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <FieldInput label={t('leadDetail.company')} value={company} onChangeText={setCompany} />
          {!!err && <Text style={s.modalError}>{err}</Text>}
          <View style={s.modalActions}>
            <Pressable onPress={onClose} style={s.modalCancelBtn} disabled={saving}>
              <Text style={s.modalCancelText}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable onPress={save} style={[s.modalConfirmBtn, saving && { opacity: 0.6 }]} disabled={saving}>
              <Text style={s.modalConfirmText}>{saving ? t('common.saving') : t('common.save')}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function FieldInput(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
}) {
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={s.fieldLabel}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        keyboardType={props.keyboardType ?? 'default'}
        placeholderTextColor="#7B818D"
        autoCapitalize="none"
        style={s.fieldInput}
      />
    </View>
  );
}

const s = StyleSheet.create({
  content: { paddingVertical: spacing.screen, paddingBottom: 60 },
  banner: { backgroundColor: '#1FA36B1A', borderColor: '#1FA36B40', borderWidth: 1, borderRadius: radius.lg, padding: spacing.card, marginBottom: spacing.cardGap },
  bannerText: { color: statusText.success, ...type.secondary },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.card },
  name: { color: c.textPrimary, ...type.screenTitle },
  company: { color: c.textSecondary, ...type.secondary, marginTop: 6 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.card },
  section: { marginTop: spacing.section },
  sectionBody: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.cardGap, marginTop: spacing.card },
  row: { flexBasis: '47%', flexGrow: 1, minWidth: 140, backgroundColor: c.raised, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.lg, padding: spacing.md },
  rowLabel: { color: c.micro, ...type.micro },
  rowLabelNote: { color: c.micro, ...type.micro, textTransform: 'none', letterSpacing: 0 },
  rowValue: { color: c.textPrimary, ...type.primary, marginTop: 8, fontVariant: ['tabular-nums'] },
  aggregateNote: { width: '100%', color: c.textSecondary, ...type.secondary },
  scoreRow: { width: '100%', flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.hairline },
  scoreRuleText: { color: c.textPrimary, ...type.secondary },
  scorePoints: { color: statusText.warning, ...type.pill, marginLeft: 10, fontVariant: ['tabular-nums'] },
  timelineRow: { width: '100%', flexDirection: 'row', gap: 10, marginBottom: 12 },
  timelineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: status.info, marginTop: 5 },
  timelineLabel: { color: c.textPrimary, ...type.secondary },
  timelineDate: { color: c.micro, ...type.micro, marginTop: 2, fontVariant: ['tabular-nums'] },
  actionsWrap: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionBtn: { minHeight: 44, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8, justifyContent: 'center' },
  actionBtnText: { color: c.textPrimary, ...type.pill },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 420, backgroundColor: c.card, borderRadius: radius.card, borderWidth: 1, borderColor: c.hairline, padding: spacing.card },
  modalTitle: { color: c.textPrimary, ...type.sectionTitle },
  modalBody: { color: c.textSecondary, ...type.secondary, marginTop: 10 },
  modalInput: { marginTop: 12, minHeight: 70, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.lg, backgroundColor: c.raised, color: c.textPrimary, padding: 12, ...type.secondary, textAlignVertical: 'top' },
  modalError: { color: statusText.danger, ...type.pill, marginTop: 10 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  modalCancelBtn: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: radius.pill, borderWidth: 1, borderColor: c.hairline },
  modalCancelText: { color: c.textPrimary, ...type.pill },
  modalConfirmBtn: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: radius.pill, backgroundColor: c.yellow },
  modalConfirmText: { color: c.page, ...type.pill },
  fieldLabel: { color: c.micro, ...type.micro },
  fieldInput: { marginTop: 6, height: 44, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.lg, backgroundColor: c.raised, color: c.textPrimary, paddingHorizontal: 12, ...type.secondary },
  replyRow: { width: '100%', backgroundColor: c.raised, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.cardGap },
  replyBody: { color: c.textPrimary, ...type.secondary },
  replyMeta: { color: c.micro, ...type.micro, textTransform: 'none', letterSpacing: 0, marginTop: 6 },
  contactDateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  contactDateChip: { borderWidth: 1, borderColor: c.hairline, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: c.raised },
  contactDateChipText: { color: c.textPrimary, ...type.pill },
});
