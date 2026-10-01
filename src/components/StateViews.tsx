import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { c, radius, spacing, statusText, type } from '../theme';
import { useScreenPadding } from './ScreenContainer';
import { useT } from '../i18n';

/** Shimmering skeleton bar — used to build skeleton screens, never a bare spinner. */
export function SkeletonBar({ width = '100%', height = 14, style }: { width?: number | `${number}%`; height?: number; style?: any }) {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return <Animated.View style={[{ width, height, borderRadius: 6, backgroundColor: c.hairline, opacity: pulse }, style]} />;
}

export function SkeletonCard() {
  return (
    <View style={s.skeletonCard}>
      <SkeletonBar width="55%" height={13} />
      <SkeletonBar width="35%" height={10} style={{ marginTop: 8 }} />
      <SkeletonBar width="80%" height={10} style={{ marginTop: 14 }} />
    </View>
  );
}

export function SkeletonList({ count = 6 }: { count?: number }) {
  const screenPadding = useScreenPadding();
  return (
    <View style={{ paddingHorizontal: screenPadding, paddingVertical: spacing.screen }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

export function SkeletonTiles({ count = 6 }: { count?: number }) {
  const screenPadding = useScreenPadding();
  return (
    <View style={[s.tileGrid, { paddingHorizontal: screenPadding }]}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={s.tileSkeleton}>
          <SkeletonBar width="60%" height={10} />
          <SkeletonBar width="40%" height={22} style={{ marginTop: 10 }} />
        </View>
      ))}
    </View>
  );
}

/** Empty state written in plain human words, per screen. */
export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { label: string; onPress: () => void };
}) {
  const screenPadding = useScreenPadding();
  return (
    <View style={[s.centerWrap, s.emptyWrap, { marginHorizontal: screenPadding }]}>
      <Text style={s.emptyTitle}>{title}</Text>
      <Text style={s.emptyBody}>{body}</Text>
      {action && (
        <Pressable onPress={action.onPress} style={({ pressed }) => [s.emptyBtn, pressed && { opacity: 0.85 }]}>
          <Text style={s.emptyBtnText}>{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}

/** Error state with a working retry — required on every screen. */
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const screenPadding = useScreenPadding();
  const t = useT();
  return (
    <View style={[s.centerWrap, { marginHorizontal: screenPadding }]}>
      <Text style={s.errorTitle}>{t('common.somethingWentWrong')}</Text>
      <Text style={s.errorBody}>{message}</Text>
      <Pressable onPress={onRetry} style={({ pressed }) => [s.retryBtn, pressed && { opacity: 0.85 }]}>
        <Text style={s.retryBtnText}>{t('common.retry')}</Text>
      </Pressable>
    </View>
  );
}

/**
 * Rule: no empty catch anywhere in the app. Every failed action (complete/snooze/reassign/move
 * stage/etc.) renders one of these — what failed, in the user's language, plus a working retry —
 * instead of silently doing nothing.
 */
export function ActionErrorBanner({
  message,
  onRetry,
  onDismiss,
}: {
  message: string;
  onRetry: () => void;
  onDismiss?: () => void;
}) {
  const t = useT();
  return (
    <View style={s.actionErrorBanner}>
      <View style={{ flex: 1 }}>
        <Text style={s.actionErrorTitle}>{t('common.actionFailed')}</Text>
        <Text style={s.actionErrorText}>{message}</Text>
      </View>
      <View style={s.actionErrorBtnCol}>
        <Pressable onPress={onRetry} style={({ pressed }) => [s.actionErrorRetryBtn, pressed && { opacity: 0.8 }]} hitSlop={6}>
          <Text style={s.actionErrorRetryText}>{t('common.retry')}</Text>
        </Pressable>
        {onDismiss && (
          <Pressable onPress={onDismiss} hitSlop={8} style={s.actionErrorDismiss}>
            <Text style={s.actionErrorDismissText}>{t('common.dismiss')}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

/** 403 from the server — role-gated action the UI still let the user attempt. */
export function ForbiddenNotice({ message }: { message?: string }) {
  const t = useT();
  return (
    <View style={s.forbiddenBox}>
      <Text style={s.forbiddenText}>{message ?? t('common.forbidden')}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  skeletonCard: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.hairline,
    borderRadius: radius.card,
    padding: spacing.card,
    marginBottom: spacing.cardGap,
  },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingVertical: spacing.screen, gap: spacing.cardGap },
  tileSkeleton: {
    width: '47%',
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.hairline,
    borderRadius: radius.card,
    padding: spacing.card,
  },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, marginVertical: spacing.screen },
  emptyWrap: { borderWidth: 1, borderStyle: 'dashed', borderColor: c.hairline, borderRadius: radius.card },
  emptyTitle: { color: c.textPrimary, ...type.primary, textAlign: 'center' },
  emptyBody: { color: c.textSecondary, ...type.secondary, marginTop: 12, textAlign: 'center' },
  emptyBtn: { minHeight: 44, marginTop: 20, backgroundColor: c.yellow, borderRadius: radius.pill, paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  emptyBtnText: { color: c.page, ...type.pill },
  errorTitle: { color: c.textPrimary, ...type.primary },
  errorBody: { color: c.textSecondary, ...type.secondary, marginTop: 12, textAlign: 'center' },
  retryBtn: { minHeight: 44, marginTop: 20, borderWidth: 1, borderColor: c.hairline, borderRadius: radius.pill, paddingHorizontal: 22, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  retryBtnText: { color: c.textPrimary, ...type.pill },
  forbiddenBox: { backgroundColor: '#F45B691A', borderWidth: 1, borderColor: '#F45B6940', borderRadius: radius.lg, padding: spacing.card, margin: spacing.screen },
  forbiddenText: { color: statusText.danger, ...type.secondary },
  actionErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#F45B691A',
    borderWidth: 1,
    borderColor: '#F45B6940',
    borderRadius: radius.lg,
    padding: spacing.card,
  },
  actionErrorTitle: { color: statusText.danger, ...type.pill },
  actionErrorText: { color: c.textSecondary, ...type.secondary, marginTop: 6 },
  actionErrorBtnCol: { alignItems: 'flex-end', gap: 6 },
  actionErrorRetryBtn: { minHeight: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F45B6966', borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 6 },
  actionErrorRetryText: { color: statusText.danger, ...type.pill },
  actionErrorDismiss: { paddingHorizontal: 4, paddingVertical: 2 },
  actionErrorDismissText: { color: c.textTertiary, ...type.micro, textTransform: 'none', letterSpacing: 0 },
});
