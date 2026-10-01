import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { c, radius, spacing, type } from '../theme';
import { DESTINATION_LABEL_KEY, MORE_LABEL_KEY, PRIMARY_TAB_NAMES } from '../navigation/destinations';
import { MoreIcon } from './TabIcons';
import { useT } from '../i18n';

/**
 * SPEC-V2 §Roles / §11: compact-width counterpart to `Sidebar.tsx`. Same contract — it is handed the
 * exact `state`/`descriptors`/`navigation` react-navigation would give the default `BottomTabBar`
 * (see TabNavigator.tsx's `tabBar={(props) => ...}`), so it can never show a route the role-gated
 * `showX &&` conditionals in TabNavigator didn't register in the first place. It only decides how to
 * *lay out* `state.routes`, never which ones exist — that split is what keeps gating identical to the
 * Sidebar's regular-width presentation without forking any permission logic.
 *
 * `PRIMARY_TAB_NAMES` (shared with Sidebar) get their own bottom-bar button; anything else registered
 * for this role collapses behind a single "More" button that opens a sheet, so a 13-destination admin
 * account never renders more than 6 icons across a 400pt-wide iPhone screen.
 */
export function CompactTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const t = useT();

  const primaryRoutes = PRIMARY_TAB_NAMES.map((name) => state.routes.find((r) => r.name === name)).filter(
    (r): r is (typeof state.routes)[number] => !!r
  );
  const primaryKeys = new Set(primaryRoutes.map((r) => r.key));
  const secondaryRoutes = state.routes.filter((r) => !primaryKeys.has(r.key));
  const focusedRoute = state.routes[state.index];
  const moreIsFocused = !primaryKeys.has(focusedRoute.key);

  const go = (routeName: string, routeParams: object | undefined, routeKey: string) => {
    const event = navigation.emit({ type: 'tabPress', target: routeKey, canPreventDefault: true });
    if (!event.defaultPrevented) {
      navigation.dispatch({ ...CommonActions.navigate(routeName, routeParams), target: state.key });
    }
  };

  const labelFor = (route: (typeof state.routes)[number]): string => {
    const key = DESTINATION_LABEL_KEY[route.name];
    if (key) return t(key);
    const { options } = descriptors[route.key];
    return typeof options.title === 'string' ? options.title : route.name;
  };

  return (
    <View style={[s.root, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      <View style={s.row}>
        {primaryRoutes.map((route) => {
          const { options } = descriptors[route.key];
          const focused = route.key === focusedRoute.key;
          const color = focused ? c.yellow : c.greyLabel;
          const label = labelFor(route);
          return (
            <Pressable
              key={route.key}
              onPress={() => go(route.name, route.params, route.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              style={({ pressed }) => [s.btn, pressed && { opacity: 0.75 }, { cursor: 'pointer' }]}
            >
              {options.tabBarIcon?.({ focused, color, size: 22 })}
              <Text style={[s.label, { color }]} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}

        {secondaryRoutes.length > 0 && (
          <Pressable
            onPress={() => setMoreOpen(true)}
            accessibilityRole="tab"
            accessibilityState={{ selected: moreIsFocused }}
            accessibilityLabel={t(MORE_LABEL_KEY)}
            style={({ pressed }) => [s.btn, pressed && { opacity: 0.75 }, { cursor: 'pointer' }]}
          >
            <MoreIcon color={moreIsFocused ? c.yellow : c.greyLabel} size={22} />
            <Text style={[s.label, { color: moreIsFocused ? c.yellow : c.greyLabel }]} numberOfLines={1}>
              {t(MORE_LABEL_KEY)}
            </Text>
          </Pressable>
        )}
      </View>

      <Modal visible={moreOpen} transparent animationType="fade" onRequestClose={() => setMoreOpen(false)}>
        <Pressable style={s.backdrop} onPress={() => setMoreOpen(false)}>
          <Pressable style={[s.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]} onPress={() => {}}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>{t(MORE_LABEL_KEY)}</Text>
            {secondaryRoutes.map((route) => {
              const { options } = descriptors[route.key];
              const focused = route.key === focusedRoute.key;
              const color = focused ? c.yellow : c.textPrimary;
              const label = labelFor(route);
              return (
                <Pressable
                  key={route.key}
                  onPress={() => {
                    setMoreOpen(false);
                    go(route.name, route.params, route.key);
                  }}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: focused }}
                  style={({ pressed }) => [s.sheetRow, focused && s.sheetRowFocused, pressed && { opacity: 0.8 }, { cursor: 'pointer' }]}
                >
                  <View style={s.sheetRowIcon}>{options.tabBarIcon?.({ focused, color, size: 20 })}</View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.sheetRowLabel, { color }]}>{label}</Text>
                  </View>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.border },
  row: { flexDirection: 'row', paddingTop: spacing.sm },
  btn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: 4, minHeight: 44 },
  label: { fontSize: 10, fontWeight: '600' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: c.surface, borderTopLeftRadius: radius.card, borderTopRightRadius: radius.card, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: c.hairline, alignSelf: 'center', marginBottom: spacing.lg },
  sheetTitle: { color: c.textPrimary, ...type.sectionTitle, marginBottom: spacing.md },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, borderRadius: radius.md, paddingHorizontal: spacing.sm },
  sheetRowFocused: { backgroundColor: c.raised },
  sheetRowIcon: { width: 24, alignItems: 'center' },
  sheetRowLabel: { ...type.primary },
});
