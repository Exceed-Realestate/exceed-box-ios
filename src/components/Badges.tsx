import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { c, radius, status, statusText, type } from '../theme';
import type { EscalationLevel, LeadStage, Role } from '../api/types';
import { stageLabel } from '../api/mocks';
import { ProgressBar } from './ProgressBar';
import { pickPair, useLanguage, useT, type TranslationKey } from '../i18n';

export function ScoreBadge({ score }: { score: number }) {
  // Bright colour is for the fill only (decorative) — the number itself stays ink, matching the
  // client reference's own .score-pill (only the small dot is coloured, the digits are plain text).
  const fill = score >= 70 ? status.danger : score >= 40 ? status.warning : c.textTertiary;
  return (
    <View style={s.scoreBadge} accessibilityLabel={`Lead score ${score} out of 100`}>
      <View style={s.scoreTrack}>
        <ProgressBar value={score} color={fill} />
      </View>
      <Text style={s.scoreText}>{score}</Text>
    </View>
  );
}

/** Bright dot colour + dark, readable-on-white text colour per stage — same fill/text split as
 * `status`/`statusText` in theme.ts. */
const STAGE_COLOR: Record<LeadStage, string> = {
  new: '#9AA0AC',
  nurturing: '#3E7CB1',
  engaged: '#7A5FB8',
  meeting_booked: '#F0B429',
  in_negotiation: '#F07B3F',
  won: '#1FA36B',
};
const STAGE_TEXT_COLOR: Record<LeadStage, string> = {
  new: '#5C6773',
  nurturing: statusText.info,
  engaged: '#5B4691',
  meeting_booked: statusText.warning,
  in_negotiation: '#B4501B',
  won: statusText.success,
};

export function StageBadge({ stage }: { stage: LeadStage }) {
  const [lang] = useLanguage();
  const label = pickPair(lang, stageLabel(stage));
  const dot = STAGE_COLOR[stage];
  const text = STAGE_TEXT_COLOR[stage];
  return (
    <View style={[s.stageBadge, { backgroundColor: `${dot}1F`, borderColor: `${dot}40` }]}>
      <View style={[s.stageDot, { backgroundColor: dot }]} />
      <Text style={[s.stageText, { color: text }]}>{label}</Text>
    </View>
  );
}

const EXIT_KEY: Record<string, TranslationKey> = {
  lost: 'badge.exitLost',
  too_early: 'badge.exitTooEarly',
  unreachable: 'badge.exitUnreachable',
  unsubscribed: 'badge.exitUnsubscribed',
};

export function ExitBadge({ exit }: { exit: string }) {
  const t = useT();
  const key = EXIT_KEY[exit];
  const label = key ? t(key) : exit;
  return (
    <View style={s.exitBadge}>
      <View style={s.exitDot} />
      <Text style={s.exitText}>{label}</Text>
    </View>
  );
}

const ROLE_KEY: Record<Role, TranslationKey> = {
  admin: 'badge.roleAdmin',
  marketing: 'badge.roleMarketing',
  office_manager: 'badge.roleOfficeManager',
  sales: 'badge.roleSales',
};

export function RoleBadge({ role }: { role: Role }) {
  const t = useT();
  return (
    <View style={s.roleBadge}>
      <View style={s.roleDot} />
      <Text style={s.roleText}>{t(ROLE_KEY[role])}</Text>
    </View>
  );
}

/** Non-hook variant for call sites outside a render (or that already have `t` in hand) — e.g.
 * Sidebar's user footer, which needs the label as plain text rather than a rendered badge. */
export function roleLabel(role: Role, t: (key: TranslationKey) => string): string {
  return t(ROLE_KEY[role]);
}

export function EscalationDot({ level }: { level: EscalationLevel }) {
  if (level === 0) return null;
  const color = level >= 3 ? statusText.danger : level === 2 ? statusText.warning : statusText.info;
  return (
    <View style={s.escalationWrap}>
      {Array.from({ length: level }).map((_, i) => (
        <Text key={i} style={[s.escalationMark, { color }]}>
          !
        </Text>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  scoreBadge: { width: 92, flexDirection: 'row', alignItems: 'center', gap: 8 },
  scoreTrack: { flex: 1 },
  scoreText: { ...type.pill, color: c.textPrimary, width: 24, textAlign: 'right', fontVariant: ['tabular-nums'] },
  stageBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  stageDot: { width: 6, height: 6, borderRadius: 3 },
  stageText: { ...type.pill },
  exitBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#F45B6940', backgroundColor: '#F45B691A', borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  exitDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: status.danger },
  exitText: { ...type.pill, color: statusText.danger },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  roleDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.textTertiary },
  roleText: { ...type.pill, color: c.textPrimary },
  escalationWrap: { flexDirection: 'row' },
  escalationMark: { ...type.pill },
});
