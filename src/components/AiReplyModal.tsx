import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { c, radius, spacing, status, statusText, type } from '../theme';
import { api } from '../api/client';
import { describeApiError } from '../auth/AuthContext';
import type { ClassifierAnswer, LeadReply, ReplyClassifierInput } from '../api/types';
import { formatDateTime } from '../utils/dates';
import { useLanguage, useT } from '../i18n';

const answerToBool = (v: ClassifierAnswer | undefined): boolean => v === 'yes';

/** SPEC-V2 §9 — ✨ AI reply modal. No model is wired: the draft area says so plainly and always
 * accepts a typed reply. Approve-and-send always requires human action; "this wasn't real"
 * removes the classifier's points without deleting the underlying reply. */
export function AiReplyModal({
  visible,
  reply,
  onClose,
  onUpdated,
}: {
  visible: boolean;
  reply: LeadReply | null;
  onClose: () => void;
  onUpdated: (r: LeadReply) => void;
}) {
  const [draftText, setDraftText] = useState('');
  const [busy, setBusy] = useState<'draft' | 'send' | 'void' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lang] = useLanguage();
  const t = useT();

  // D7: the approver's own answers to the four-question classifier — the backend scores nothing
  // unless these are sent with the send action (verdict.human falsy = "not human, nothing
  // scored"), so this is required input, not decoration. Seeded from any existing classifier
  // (e.g. a mock-demo reply) and otherwise defaults to "yes, this is a genuine human reply" —
  // the same assumption implied by choosing "approve and send" over "this wasn't real".
  const [verdict, setVerdict] = useState<ReplyClassifierInput>({
    is_human: true,
    wants_to_meet: false,
    partnership: false,
    has_budget: false,
  });

  useEffect(() => {
    if (visible && reply) {
      setDraftText(reply.draft ?? '');
      setError(null);
      setVerdict({
        is_human: reply.classifier ? answerToBool(reply.classifier.is_human) : true,
        wants_to_meet: reply.classifier ? answerToBool(reply.classifier.wants_to_meet) : false,
        partnership: reply.classifier ? answerToBool(reply.classifier.partnership) : false,
        has_budget: reply.classifier ? answerToBool(reply.classifier.has_budget) : false,
      });
    }
  }, [visible, reply?.id, reply?.draft, reply?.classifier]);

  if (!reply) return null;
  const classify = reply.sent ? reply.classifier : null; // pre-send, the toggle row below is the source of truth

  const saveDraft = async () => {
    if (!draftText.trim()) {
      setError(t('aiReply.nothingToSave'));
      return;
    }
    setBusy('draft');
    setError(null);
    try {
      const updated = await api.draftReply(reply.id, { manual_text: draftText });
      onUpdated(updated);
    } catch (e) {
      setError(describeApiError(e));
    } finally {
      setBusy(null);
    }
  };

  const send = async () => {
    if (!draftText.trim()) {
      setError(t('aiReply.typeBeforeSend'));
      return;
    }
    setBusy('send');
    setError(null);
    try {
      const updated = await api.sendReply(reply.id, { text: draftText.trim(), classifier: verdict });
      onUpdated(updated);
      onClose();
    } catch (e) {
      setError(describeApiError(e));
    } finally {
      setBusy(null);
    }
  };

  const voidIt = async () => {
    setBusy('void');
    setError(null);
    try {
      const updated = await api.voidReply(reply.id);
      onUpdated(updated);
      onClose();
    } catch (e) {
      setError(describeApiError(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={s.headRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.title}>{t('aiReply.title')}</Text>
              </View>
              <View style={s.notConnectedPill}>
                <Text style={s.notConnectedPillText}>{t('aiReply.modelNotConnected')}</Text>
              </View>
            </View>
            <Text style={s.meta}>
              {t('aiReply.received', {
                date: formatDateTime(reply.received_at, lang),
                voided: reply.voided ? t('aiReply.markedNotReal') : '',
              })}
            </Text>

            <View style={s.replyBox}>
              <Text style={s.replyBody}>{reply.body}</Text>
            </View>

            {reply.sent ? (
              classify && (
                <View style={s.chipRow}>
                  <ClassifierChip label={t('aiReply.isHuman')} value={classify.is_human} />
                  <ClassifierChip label={t('aiReply.wantsToMeet')} value={classify.wants_to_meet} />
                  <ClassifierChip label={t('aiReply.partnership')} value={classify.partnership} />
                  <ClassifierChip label={t('aiReply.hasBudget')} value={classify.has_budget} />
                </View>
              )
            ) : (
              // D7: answered here, not displayed from the (nonexistent) AI — the backend scores
              // exactly what's toggled on when "Approve and send" is pressed.
              <View style={s.chipRow}>
                <VerdictToggle label={t('aiReply.isHuman')} value={verdict.is_human} onToggle={(v) => setVerdict((s) => ({ ...s, is_human: v }))} />
                <VerdictToggle label={t('aiReply.wantsToMeet')} value={verdict.wants_to_meet} onToggle={(v) => setVerdict((s) => ({ ...s, wants_to_meet: v }))} />
                <VerdictToggle label={t('aiReply.partnership')} value={verdict.partnership} onToggle={(v) => setVerdict((s) => ({ ...s, partnership: v }))} />
                <VerdictToggle label={t('aiReply.hasBudget')} value={verdict.has_budget} onToggle={(v) => setVerdict((s) => ({ ...s, has_budget: v }))} />
              </View>
            )}

            <View style={s.draftSection}>
              <Text style={s.draftLabel}>{t('aiReply.draftLabel')}</Text>
              <View style={s.notConnectedBox}>
                <Text style={s.notConnectedText}>{t('aiReply.notConnectedNote')}</Text>
              </View>
              <TextInput
                value={draftText}
                onChangeText={setDraftText}
                placeholder={t('aiReply.placeholder')}
                placeholderTextColor={c.textTertiary}
                multiline
                style={s.draftInput}
                editable={!reply.sent}
              />
            </View>

            {!!error && <Text style={s.error}>{error}</Text>}

            {reply.sent ? (
              <View style={s.sentBox}>
                <Text style={s.sentText}>{t('aiReply.sentLabel', { text: reply.sent_text ?? '' })}</Text>
              </View>
            ) : (
              <View style={s.actionsRow}>
                <Pressable onPress={saveDraft} disabled={busy !== null} style={[s.ghostBtn, busy === 'draft' && { opacity: 0.6 }]}>
                  <Text style={s.ghostBtnText}>{busy === 'draft' ? t('aiReply.saving') : t('aiReply.saveDraft')}</Text>
                </Pressable>
                <Pressable onPress={send} disabled={busy !== null} style={[s.primaryBtn, busy === 'send' && { opacity: 0.6 }]}>
                  <Text style={s.primaryBtnText}>{busy === 'send' ? t('aiReply.sending') : t('aiReply.approveAndSend')}</Text>
                </Pressable>
              </View>
            )}

            {!reply.voided ? (
              <Pressable onPress={voidIt} disabled={busy !== null} style={s.voidBtn}>
                <Text style={s.voidBtnText}>{busy === 'void' ? t('aiReply.removing') : t('aiReply.notReal')}</Text>
              </Pressable>
            ) : (
              <Text style={s.voidedNote}>{t('aiReply.voidedNote')}</Text>
            )}
          </ScrollView>
          <Pressable onPress={onClose} style={s.closeBtn}>
            <Text style={s.closeBtnText}>{t('common.close')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ClassifierChip({ label, value }: { label: string; value: ClassifierAnswer }) {
  const fill = value === 'yes' ? status.success : value === 'no' ? status.danger : c.textTertiary;
  const text = value === 'yes' ? statusText.success : value === 'no' ? statusText.danger : c.textTertiary;
  return (
    <View style={[s.classifierChip, { borderColor: `${fill}55`, backgroundColor: `${fill}1A` }]}>
      <Text style={[s.classifierChipText, { color: text }]}>
        {label} · {value}
      </Text>
    </View>
  );
}

/** D7's pre-send answer to one of the four classifier questions — a tappable two-state version
 * of ClassifierChip above (the backend's verdict is boolean, not tri-state). */
function VerdictToggle({ label, value, onToggle }: { label: string; value: boolean; onToggle: (v: boolean) => void }) {
  const fill = value ? status.success : c.textTertiary;
  const text = value ? statusText.success : c.textTertiary;
  return (
    <Pressable
      onPress={() => onToggle(!value)}
      style={[s.classifierChip, { borderColor: `${fill}55`, backgroundColor: `${fill}1A` }]}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
    >
      <Text style={[s.classifierChipText, { color: text }]}>
        {label} · {value ? 'yes' : 'no'}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '88%', backgroundColor: c.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.screen, borderWidth: 1, borderColor: c.hairline, borderBottomWidth: 0 },
  headRow: { flexDirection: 'row', alignItems: 'flex-start' },
  title: { color: c.textPrimary, ...type.sectionTitle },
  notConnectedPill: { borderWidth: 1, borderColor: '#F0B42955', backgroundColor: '#F0B4291A', borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 4 },
  notConnectedPillText: { color: statusText.warning, ...type.pill, fontSize: 10 },
  meta: { color: c.micro, ...type.micro, textTransform: 'none', letterSpacing: 0, marginTop: 8 },
  replyBox: { marginTop: spacing.card, backgroundColor: c.raised, borderRadius: radius.lg, padding: spacing.card },
  replyBody: { color: c.textPrimary, ...type.secondary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.card },
  classifierChip: { borderWidth: 1, borderRadius: radius.lg, paddingHorizontal: 10, paddingVertical: 8, minWidth: '47%' },
  classifierChipText: { ...type.pill },
  draftSection: { marginTop: spacing.section },
  draftLabel: { color: c.micro, ...type.micro },
  notConnectedBox: { marginTop: 8, backgroundColor: '#F0B4291A', borderWidth: 1, borderColor: '#F0B42940', borderRadius: radius.lg, padding: spacing.md },
  notConnectedText: { color: statusText.warning, ...type.micro, textTransform: 'none', letterSpacing: 0 },
  draftInput: { marginTop: spacing.md, minHeight: 100, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.lg, backgroundColor: c.raised, color: c.textPrimary, padding: spacing.md, ...type.secondary, textAlignVertical: 'top' },
  error: { color: statusText.danger, ...type.pill, marginTop: spacing.card },
  sentBox: { marginTop: spacing.card, backgroundColor: '#1FA36B1A', borderWidth: 1, borderColor: '#1FA36B40', borderRadius: radius.lg, padding: spacing.card },
  sentText: { color: statusText.success, ...type.secondary },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: spacing.card },
  ghostBtn: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1, borderColor: c.hairline },
  ghostBtnText: { color: c.textPrimary, ...type.pill },
  primaryBtn: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, backgroundColor: c.yellow },
  primaryBtnText: { color: c.page, ...type.pill },
  voidBtn: { marginTop: spacing.card, alignItems: 'center', paddingVertical: 10 },
  voidBtnText: { color: statusText.danger, ...type.pill },
  voidedNote: { color: c.textTertiary, ...type.micro, textTransform: 'none', letterSpacing: 0, marginTop: spacing.card, textAlign: 'center' },
  closeBtn: { marginTop: spacing.md, alignItems: 'center', paddingVertical: 12, borderRadius: radius.pill, borderWidth: 1, borderColor: c.hairline },
  closeBtnText: { color: c.textPrimary, ...type.pill },
});
