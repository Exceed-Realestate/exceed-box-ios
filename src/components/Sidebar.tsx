import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useAuth } from '../auth/AuthContext';
import { roleLabel } from './Badges';
import { c, radius, spacing, type } from '../theme';
import { DESTINATION_LABEL_KEY, MORE_LABEL_KEY, PRIMARY_TAB_NAMES } from '../navigation/destinations';
import { useT } from '../i18n';

export const SIDEBAR_WIDTH = 260;

/**
 * SPEC v2 §11: permanent left sidebar at regular width. Exceed wordmark top, the same role-derived
 * destinations as the compact tab bar, signed-in user at the bottom.
 *
 * This is rendered as the `tabBar` for the existing bottom-tab navigator (see TabNavigator.tsx),
 * receiving the exact same `state`/`descriptors`/`navigation` react-navigation would otherwise hand
 * to the default `BottomTabBar`. That is what keeps role gating identical between presentations for
 * free: `state.routes` only ever contains the `<Tab.Screen>`s TabNavigator actually registered (the
 * `showDashboard && <Tab.Screen ... />` conditionals there), so a `sales` user's sidebar can only ever
 * list Today/Leads/Pipeline — there is no separate gating list here to fall out of sync.
 */
export function Sidebar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const { me } = useAuth();
  const t = useT();

  // SPEC-V2 §Roles / §11: same split CompactTabBar uses (PRIMARY_TAB_NAMES), but a 260pt regular-width
  // column has room to show every permitted destination directly rather than hiding the rest behind a
  // sheet — so both sections render, just visually grouped under a "More" heading. Nothing here decides
  // *which* routes exist; that's still only the `showX &&` gating in TabNavigator's `state.routes`.
  const primaryRoutes = PRIMARY_TAB_NAMES.map((name) => state.routes.find((r) => r.name === name)).filter(
    (r): r is (typeof state.routes)[number] => !!r
  );
  const primaryKeys = new Set(primaryRoutes.map((r) => r.key));
  const secondaryRoutes = state.routes.filter((r) => !primaryKeys.has(r.key));

  const goTo = (route: (typeof state.routes)[number], focused: boolean) => {
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!focused && !event.defaultPrevented) {
      navigation.dispatch({
        ...CommonActions.navigate(route.name, route.params),
        target: state.key,
      });
    }
  };

  const renderRow = (route: (typeof state.routes)[number], index: number) => {
    const { options } = descriptors[route.key];
    const focused = index === state.index;
    const key = DESTINATION_LABEL_KEY[route.name];
    const label = key ? t(key) : typeof options.title === 'string' ? options.title : route.name;
    return (
      <SidebarRow
        key={route.key}
        focused={focused}
        label={label}
        icon={options.tabBarIcon}
        onPress={() => goTo(route, focused)}
      />
    );
  };

  const settingsRoute = state.routes.find((r) => r.name === 'SettingsTab');
  const settingsIndex = settingsRoute ? state.routes.indexOf(settingsRoute) : -1;

  return (
    <View
      style={[
        s.root,
        {
          paddingTop: insets.top + spacing.xl,
          paddingBottom: Math.max(insets.bottom, spacing.md),
          paddingLeft: insets.left,
        },
      ]}
    >
      <View style={s.wordmarkWrap}>
        <Text style={s.wordmarkExceed}>EXCEED</Text>
        <Text style={s.wordmarkBox}>BOX</Text>
      </View>

      <View style={s.destinations} role="tablist">
        {primaryRoutes.map((route) => renderRow(route, state.routes.indexOf(route)))}

        {secondaryRoutes.length > 0 && (
          <>
            <Text style={s.sectionLabel}>{t(MORE_LABEL_KEY)}</Text>
            {secondaryRoutes.map((route) => renderRow(route, state.routes.indexOf(route)))}
          </>
        )}
      </View>

      <View style={s.spacer} />

      {me && (
        <Pressable
          onPress={() => settingsRoute && goTo(settingsRoute, settingsIndex === state.index)}
          style={({ pressed }) => [s.userFooter, pressed && settingsRoute && { opacity: 0.75 }, settingsRoute && { cursor: 'pointer' }]}
          accessibilityRole={settingsRoute ? 'button' : undefined}
          accessibilityLabel={settingsRoute ? t('sidebar.openSettings', { name: me.name }) : me.name}
        >
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials(me.name)}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={s.userName} numberOfLines={1}>
              {me.name}
            </Text>
            <Text style={s.userRole} numberOfLines={1}>
              {roleLabel(me.role, t)}
            </Text>
          </View>
        </Pressable>
      )}
    </View>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function SidebarRow({
  focused,
  label,
  icon,
  onPress,
}: {
  focused: boolean;
  label: string;
  icon?: (props: { focused: boolean; color: string; size: number }) => React.ReactNode;
  onPress: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [keyboardFocused, setKeyboardFocused] = useState(false);
  const color = focused ? c.yellow : hovered ? c.textPrimary : c.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onFocus={() => setKeyboardFocused(true)}
      onBlur={() => setKeyboardFocused(false)}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        s.row,
        focused && s.rowFocused,
        hovered && !focused && s.rowHovered,
        pressed && { opacity: 0.85 },
        keyboardFocused && s.rowKeyboardFocused,
        { cursor: 'pointer' },
      ]}
    >
      <View style={s.rowIcon}>{icon?.({ focused, color, size: 20 })}</View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[s.rowLabel, { color: focused ? c.textPrimary : color }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  root: { width: SIDEBAR_WIDTH, backgroundColor: c.surface, borderRightWidth: 1, borderRightColor: c.hairline, paddingHorizontal: spacing.md },
  wordmarkWrap: { flexDirection: 'row', alignItems: 'baseline', gap: 6, paddingHorizontal: spacing.sm, marginBottom: spacing.section },
  wordmarkExceed: { color: c.yellow, fontSize: 15, fontWeight: '800', letterSpacing: 3 },
  wordmarkBox: { color: c.greyLabel, fontSize: 8, fontWeight: '800', letterSpacing: 1.8 },
  destinations: { gap: 2 },
  sectionLabel: { color: c.micro, ...type.micro, marginTop: spacing.lg, marginBottom: spacing.xs, paddingHorizontal: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44, paddingHorizontal: spacing.sm, borderRadius: radius.md },
  rowFocused: { backgroundColor: c.raised },
  rowHovered: { backgroundColor: c.card },
  rowKeyboardFocused: { outlineStyle: 'solid', outlineWidth: 2, outlineColor: c.yellow, outlineOffset: 2 },
  rowIcon: { width: 22, alignItems: 'center' },
  rowLabel: { ...type.primary },
  spacer: { flex: 1 },
  userFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: c.hairline,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: c.raised, borderWidth: 1, borderColor: c.hairline, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: c.textPrimary, ...type.pill },
  // c.light, not c.textPrimary: the sidebar is the dark `surface` (#1C1F26) and
  // textPrimary is #15171C, so the signed-in name was near-invisible on it.
  userName: { color: c.light, ...type.secondary, fontWeight: '600' },
  userRole: { color: c.micro, ...type.micro, marginTop: 1 },
});
