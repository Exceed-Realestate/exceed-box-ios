import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View, FlatList } from 'react-native';
import { c, radius, spacing, statusText, type } from '../theme';
import { useT } from '../i18n';

export interface PickerOption {
  key: string;
  label: string;
  destructive?: boolean;
}

export function PickerSheet({
  visible,
  title,
  options,
  onSelect,
  onClose,
  /** A failed load (e.g. /api/team) or a failed selection — shown inline, sheet stays open,
   * a retry is always offered. Never translate a failed request into a silent empty list. */
  error,
  onRetry,
  loading,
}: {
  visible: boolean;
  title: string;
  options: PickerOption[];
  onSelect: (key: string) => void;
  onClose: () => void;
  error?: string | null;
  onRetry?: () => void;
  loading?: boolean;
}) {
  const t = useT();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={s.title}>{title}</Text>
          {!!error && (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
              {!!onRetry && (
                <Pressable onPress={onRetry} style={({ pressed }) => [s.errorRetryBtn, pressed && { opacity: 0.8 }]} hitSlop={6}>
                  <Text style={s.errorRetryText}>{loading ? t('common.retrying') : t('common.retry')}</Text>
                </Pressable>
              )}
            </View>
          )}
          {!error && (
            <FlatList
              data={options}
              keyExtractor={(o) => o.key}
              style={{ maxHeight: 420, marginTop: spacing.md }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => onSelect(item.key)}
                  style={({ pressed }) => [s.option, pressed && { backgroundColor: c.raised }]}
                >
                  <Text style={[s.optionText, item.destructive && { color: statusText.danger }]}>{item.label}</Text>
                </Pressable>
              )}
              ListEmptyComponent={<Text style={s.empty}>{loading ? t('common.loading') : t('common.noOptionsAvailable')}</Text>}
            />
          )}
          <Pressable onPress={onClose} style={({ pressed }) => [s.cancel, pressed && { opacity: 0.8 }]}>
            <Text style={s.cancelText}>{t('common.cancel')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: c.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.screen, paddingBottom: spacing.xl, borderWidth: 1, borderColor: c.hairline, borderBottomWidth: 0 },
  title: { color: c.textPrimary, ...type.sectionTitle },
  option: { minHeight: 52, justifyContent: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.hairline },
  optionText: { color: c.textPrimary, ...type.primary },
  empty: { color: c.textTertiary, ...type.secondary, paddingVertical: 20, textAlign: 'center' },
  cancel: { minHeight: 44, marginTop: spacing.md, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: radius.pill, borderWidth: 1, borderColor: c.hairline },
  cancelText: { color: c.textPrimary, ...type.pill },
  errorBox: { marginTop: spacing.md, backgroundColor: '#F45B691A', borderWidth: 1, borderColor: '#F45B6940', borderRadius: radius.lg, padding: spacing.card },
  errorText: { color: c.textSecondary, ...type.secondary },
  errorRetryBtn: { minHeight: 36, alignSelf: 'flex-start', alignItems: 'center', justifyContent: 'center', marginTop: 12, borderWidth: 1, borderColor: '#F45B6966', borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 6 },
  errorRetryText: { color: statusText.danger, ...type.pill },
});
