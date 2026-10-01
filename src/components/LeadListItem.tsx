import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { c, radius, spacing, type } from '../theme';
import type { LeadSummary } from '../api/types';
import { regionsLabel } from '../api/mocks';
import { ExitBadge, ScoreBadge, StageBadge } from './Badges';
import { pickBilingual, pickPair, useLanguage, useT } from '../i18n';

export function LeadListItem({ lead, onPress, selected }: { lead: LeadSummary; onPress: () => void; selected?: boolean }) {
  const [lang] = useLanguage();
  const t = useT();
  const activity = pickBilingual(lang, lead.activity_note, lead.activity_note_ja) || t('lead.noActivity');
  const regions = pickPair(lang, regionsLabel(lead.region));

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.card, selected && s.cardSelected, pressed && { opacity: 0.85 }]}>
      <View style={{ flex: 1 }}>
        <View style={s.nameRow}>
          <Text style={s.name} numberOfLines={1}>
            {lead.name}
          </Text>
          {!lead.owner_name && <Text style={s.unassigned}>{t('lead.unassigned')}</Text>}
        </View>
        <View style={s.badgeRow}>
          <StageBadge stage={lead.stage} />
          {lead.exit_state && <ExitBadge exit={lead.exit_state} />}
        </View>
        <Text style={s.activity} numberOfLines={1}>
          {activity}
          {regions ? ` · ${regions}` : ''}
        </Text>
        <Text style={s.owner}>{lead.owner_name ? t('lead.ownerLine', { name: lead.owner_name }) : t('lead.ownerUnassigned')}</Text>
      </View>
      <ScoreBadge score={lead.score} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.card, backgroundColor: c.card, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.card, padding: spacing.card, marginBottom: spacing.cardGap },
  cardSelected: { borderColor: c.yellow },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { color: c.textPrimary, ...type.primary, flexShrink: 1 },
  unassigned: { color: c.micro, ...type.micro },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  activity: { color: c.textSecondary, ...type.secondary, marginTop: 10 },
  owner: { color: c.micro, ...type.micro, marginTop: 6 },
});
