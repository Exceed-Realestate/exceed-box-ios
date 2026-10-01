import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { c, radius, spacing, statusText, type } from '../theme';
import { useExplainMode } from '../hooks/useExplainMode';
import { pickBilingual, useLanguage, useT } from '../i18n';

/** Small pill for a ScreenHeader's `right` slot — the single global on/off switch. */
export function ExplainModeToggle() {
  const { enabled, toggle } = useExplainMode();
  const t = useT();
  return (
    <Pressable onPress={toggle} style={[s.toggle, enabled && s.toggleActive]} hitSlop={6}>
      <View style={[s.toggleDot, enabled && s.toggleDotActive]} />
      <Text style={[s.toggleText, enabled && s.toggleTextActive]}>{t('explain.toggle')}</Text>
    </Pressable>
  );
}

/**
 * Wraps any element. Off (default): renders children untouched — zero behaviour change, zero
 * extra view in the tree. On: intercepts the tap and shows what the element is and where its
 * number comes from, in the active app language, instead of the element's normal action.
 */
export function Explain({
  en,
  ja,
  formula,
  children,
}: {
  en: string;
  ja?: string;
  formula?: string;
  children: React.ReactNode;
}) {
  const { enabled } = useExplainMode();
  const [open, setOpen] = useState(false);
  const [lang] = useLanguage();
  const t = useT();

  if (!enabled) return <>{children}</>;

  const body = pickBilingual(lang, en, ja);

  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={s.wrap}>
        {children}
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={s.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={s.card} onPress={(e) => e.stopPropagation()}>
            <Text style={s.title}>{t('common.whatIsThis')}</Text>
            <Text style={s.body}>{body}</Text>
            {!!formula && (
              <View style={s.formulaBox}>
                <Text style={s.formulaLabel}>{t('common.whereNumberComesFrom')}</Text>
                <Text style={s.formulaText}>{formula}</Text>
              </View>
            )}
            <Pressable onPress={() => setOpen(false)} style={s.closeBtn}>
              <Text style={s.closeBtnText}>{t('common.close')}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6, marginTop: 4 },
  toggleActive: { borderColor: '#FFD84D66', backgroundColor: '#FFD84D1F' },
  toggleDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.textTertiary },
  toggleDotActive: { backgroundColor: c.yellow },
  toggleText: { color: c.textSecondary, ...type.pill, fontSize: 10 },
  toggleTextActive: { color: statusText.warning },
  wrap: { borderWidth: 1, borderStyle: 'dashed', borderColor: '#FFD84D55', borderRadius: radius.sm },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 380, backgroundColor: c.card, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.card, padding: spacing.card },
  title: { color: c.textPrimary, ...type.sectionTitle },
  body: { color: c.textPrimary, ...type.secondary, marginTop: spacing.card },
  formulaBox: { marginTop: spacing.card, backgroundColor: c.raised, borderRadius: radius.lg, padding: spacing.md },
  formulaLabel: { color: c.micro, ...type.micro },
  formulaText: { color: c.textSecondary, ...type.secondary, marginTop: 6, fontVariant: ['tabular-nums'] },
  closeBtn: { marginTop: spacing.card, alignItems: 'center', paddingVertical: 12, borderRadius: radius.pill, borderWidth: 1, borderColor: c.hairline },
  closeBtnText: { color: c.textPrimary, ...type.pill },
});
