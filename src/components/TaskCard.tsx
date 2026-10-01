import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { c, radius, spacing, status, statusText, type } from '../theme';
import type { Task } from '../api/types';
import { formatDue } from '../utils/dates';
import { EscalationDot, ScoreBadge } from './Badges';
import { pickBilingual, useLanguage, useT, type TranslationKey } from '../i18n';

const TYPE_KEY: Record<Task['type'], TranslationKey> = {
  call: 'task.typeCall',
  email: 'task.typeEmail',
  meeting: 'task.typeMeeting',
  follow_up: 'task.typeFollowUp',
  showroom_visit: 'task.typeShowroomVisit',
  other: 'task.typeOther',
};

export function TaskCard({
  task,
  onPressLead,
  onComplete,
  onSnooze,
  onReassign,
  busy,
}: {
  task: Task;
  onPressLead: () => void;
  onComplete: () => void;
  onSnooze: () => void;
  onReassign?: () => void;
  busy?: boolean;
}) {
  const [lang] = useLanguage();
  const t = useT();
  const due = formatDue(task.due_at, lang);
  const typeLabel = t(TYPE_KEY[task.type]);
  const leadName = pickBilingual(lang, task.lead_name, task.lead_name_ja);
  const reason = pickBilingual(lang, task.reason, task.reason_ja);

  return (
    <View style={s.card}>
      <Pressable onPress={onPressLead} style={s.top} hitSlop={4}>
        <View style={{ flex: 1 }}>
          <View style={s.typeRow}>
            <Text style={s.typeText}>{typeLabel}</Text>
            <EscalationDot level={task.escalation_level} />
          </View>
          <Text style={s.leadName} numberOfLines={1}>
            {leadName}
          </Text>
          <Text style={s.reason} numberOfLines={2}>
            {reason}
          </Text>
        </View>
        <ScoreBadge score={task.lead_score} />
      </Pressable>

      <View style={s.footer}>
        <Text style={[s.due, due.overdue && s.dueOverdue]}>{due.text}</Text>
        <View style={{ flex: 1 }} />
        {onReassign && (
          <Pressable onPress={onReassign} disabled={busy} style={({ pressed }) => [s.actionBtn, pressed && s.pressed]} hitSlop={6}>
            <Text style={s.actionText}>{t('task.reassign')}</Text>
          </Pressable>
        )}
        <Pressable onPress={onSnooze} disabled={busy} style={({ pressed }) => [s.actionBtn, pressed && s.pressed]} hitSlop={6}>
          <Text style={s.actionText}>{t('task.snooze')}</Text>
        </Pressable>
        <Pressable onPress={onComplete} disabled={busy} style={({ pressed }) => [s.actionBtn, s.actionBtnPrimary, pressed && s.pressed]} hitSlop={6}>
          <Text style={s.actionTextPrimary}>{t('task.done')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: c.card, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.card, marginBottom: spacing.cardGap, overflow: 'hidden' },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.card, padding: spacing.card },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  typeText: { color: c.micro, ...type.micro },
  leadName: { color: c.textPrimary, ...type.primary, marginTop: 6 },
  reason: { color: c.textSecondary, ...type.secondary, marginTop: 8 },
  footer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.card, paddingBottom: spacing.card, gap: 8 },
  due: { color: c.textSecondary, ...type.pill, fontVariant: ['tabular-nums'] },
  dueOverdue: { color: statusText.danger },
  actionBtn: { minHeight: 32, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 7, justifyContent: 'center' },
  actionBtnPrimary: { backgroundColor: c.yellow, borderColor: c.yellow },
  actionText: { color: c.textPrimary, ...type.pill },
  actionTextPrimary: { color: c.page, ...type.pill },
  pressed: { opacity: 0.7 },
});
