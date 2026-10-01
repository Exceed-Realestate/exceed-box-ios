import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator, NativeStackNavigationOptions, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NavigatorScreenParams, useNavigation } from '@react-navigation/native';
import { useAuth } from '../auth/AuthContext';
import { c } from '../theme';
import {
  AdminIcon,
  AssignIcon,
  BookingIcon,
  DashboardIcon,
  IntegrationsIcon,
  LeadsIcon,
  NurtureIcon,
  PipelineIcon,
  SettingsIcon,
  SnsIcon,
  TeamIcon,
  TodayIcon,
  TrackingIcon,
} from '../components/TabIcons';
import { Sidebar } from '../components/Sidebar';
import { CompactTabBar } from '../components/CompactTabBar';
import { useWidthClass } from '../hooks/useWidthClass';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcuts';
import { DESTINATION_LABEL_KEY } from './destinations';
import { useT } from '../i18n';
import type {
  AdminStackParamList,
  AssignStackParamList,
  BookingStackParamList,
  DashboardStackParamList,
  IntegrationsStackParamList,
  LeadsStackParamList,
  NurtureStackParamList,
  PipelineStackParamList,
  SettingsStackParamList,
  SnsStackParamList,
  TabParamList,
  TeamStackParamList,
  TodayStackParamList,
  TrackingStackParamList,
  RootStackParamList,
} from './types';

import TodayScreen from '../screens/TodayScreen';
import LeadsScreen from '../screens/LeadsScreen';
import LeadDetailScreen from '../screens/LeadDetailScreen';
import PipelineScreen from '../screens/PipelineScreen';
import DashboardScreen from '../screens/DashboardScreen';
import TeamScreen from '../screens/TeamScreen';
import MemberTasksScreen from '../screens/MemberTasksScreen';
import AdminUsersScreen from '../screens/AdminUsersScreen';
import TrackingScreen from '../screens/TrackingScreen';
import NurtureScreen from '../screens/NurtureScreen';
import NurtureSequenceDetailScreen from '../screens/NurtureSequenceDetailScreen';
import SnsScreen from '../screens/SnsScreen';
import BookingScreen from '../screens/BookingScreen';
import AssignScreen from '../screens/AssignScreen';
import IntegrationsScreen from '../screens/IntegrationsScreen';
import CardScanScreen from '../screens/CardScanScreen';
import ImportScreen from '../screens/ImportScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';

const headerOptions: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: c.card },
  headerTintColor: c.textPrimary,
  headerTitleStyle: { color: c.textPrimary, fontWeight: '700' },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: c.page },
};

const TodayStack = createNativeStackNavigator<TodayStackParamList>();
function TodayStackNav() {
  const t = useT();
  return (
    <TodayStack.Navigator screenOptions={headerOptions}>
      <TodayStack.Screen name="Today" component={TodayScreen} options={{ headerShown: false }} />
      <TodayStack.Screen name="LeadDetail" component={LeadDetailScreen} options={{ title: t('nav.lead') }} />
    </TodayStack.Navigator>
  );
}

const LeadsStack = createNativeStackNavigator<LeadsStackParamList>();
function LeadsStackNav() {
  const t = useT();
  return (
    <LeadsStack.Navigator screenOptions={headerOptions}>
      <LeadsStack.Screen name="Leads" component={LeadsScreen} options={{ headerShown: false }} />
      <LeadsStack.Screen name="LeadDetail" component={LeadDetailScreen} options={{ title: t('nav.lead') }} />
      {/* SPEC-V2 §6/§7: card scan and CSV import are actions launched from Leads, not their own tab. */}
      <LeadsStack.Screen name="CardScan" component={CardScanScreen} options={{ title: t('nav.cardScan') }} />
      <LeadsStack.Screen name="Import" component={ImportScreen} options={{ title: t('nav.import') }} />
    </LeadsStack.Navigator>
  );
}

const PipelineStack = createNativeStackNavigator<PipelineStackParamList>();
function PipelineStackNav() {
  const t = useT();
  return (
    <PipelineStack.Navigator screenOptions={headerOptions}>
      <PipelineStack.Screen name="Pipeline" component={PipelineScreen} options={{ headerShown: false }} />
      <PipelineStack.Screen name="LeadDetail" component={LeadDetailScreen} options={{ title: t('nav.lead') }} />
    </PipelineStack.Navigator>
  );
}

const DashboardStack = createNativeStackNavigator<DashboardStackParamList>();
function DashboardStackNav() {
  const t = useT();
  return (
    <DashboardStack.Navigator screenOptions={headerOptions}>
      <DashboardStack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
      <DashboardStack.Screen name="LeadDetail" component={LeadDetailScreen} options={{ title: t('nav.lead') }} />
    </DashboardStack.Navigator>
  );
}

const TeamStack = createNativeStackNavigator<TeamStackParamList>();
function TeamStackNav() {
  const t = useT();
  return (
    <TeamStack.Navigator screenOptions={headerOptions}>
      <TeamStack.Screen name="Team" component={TeamScreen} options={{ headerShown: false }} />
      <TeamStack.Screen name="MemberTasks" component={MemberTasksScreen} options={{ title: t('nav.repTasks') }} />
      <TeamStack.Screen name="LeadDetail" component={LeadDetailScreen} options={{ title: t('nav.lead') }} />
    </TeamStack.Navigator>
  );
}

const AdminStack = createNativeStackNavigator<AdminStackParamList>();
function AdminStackNav() {
  return (
    <AdminStack.Navigator screenOptions={headerOptions}>
      <AdminStack.Screen name="AdminUsers" component={AdminUsersScreen} options={{ headerShown: false }} />
    </AdminStack.Navigator>
  );
}

// SPEC-V2 §Roles — the 10 previously dead-code screens, each hosted in the same thin-stack pattern
// as the seven screens above so the compact/regular split and role gating cover them for free.
const TrackingStack = createNativeStackNavigator<TrackingStackParamList>();
function TrackingStackNav() {
  const t = useT();
  return (
    <TrackingStack.Navigator screenOptions={headerOptions}>
      <TrackingStack.Screen name="Tracking" component={TrackingScreen} options={{ headerShown: false }} />
      <TrackingStack.Screen name="LeadDetail" component={LeadDetailScreen} options={{ title: t('nav.lead') }} />
    </TrackingStack.Navigator>
  );
}

const NurtureStack = createNativeStackNavigator<NurtureStackParamList>();
function NurtureStackNav() {
  const t = useT();
  return (
    <NurtureStack.Navigator screenOptions={headerOptions}>
      <NurtureStack.Screen name="Nurture" component={NurtureScreen} options={{ headerShown: false }} />
      <NurtureStack.Screen name="NurtureSequenceDetail" component={NurtureSequenceDetailScreen} options={{ title: t('nav.sequence') }} />
    </NurtureStack.Navigator>
  );
}

const SnsStack = createNativeStackNavigator<SnsStackParamList>();
function SnsStackNav() {
  return (
    <SnsStack.Navigator screenOptions={headerOptions}>
      <SnsStack.Screen name="Sns" component={SnsScreen} options={{ headerShown: false }} />
    </SnsStack.Navigator>
  );
}

const BookingStack = createNativeStackNavigator<BookingStackParamList>();
function BookingStackNav() {
  return (
    <BookingStack.Navigator screenOptions={headerOptions}>
      <BookingStack.Screen name="Booking" component={BookingScreen} options={{ headerShown: false }} />
    </BookingStack.Navigator>
  );
}

const AssignStack = createNativeStackNavigator<AssignStackParamList>();
function AssignStackNav() {
  return (
    <AssignStack.Navigator screenOptions={headerOptions}>
      <AssignStack.Screen name="Assign" component={AssignScreen} options={{ headerShown: false }} />
    </AssignStack.Navigator>
  );
}

const IntegrationsStack = createNativeStackNavigator<IntegrationsStackParamList>();
function IntegrationsStackNav() {
  return (
    <IntegrationsStack.Navigator screenOptions={headerOptions}>
      <IntegrationsStack.Screen name="Integrations" component={IntegrationsScreen} options={{ headerShown: false }} />
    </IntegrationsStack.Navigator>
  );
}

const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();
function SettingsStackNav() {
  return (
    <SettingsStack.Navigator screenOptions={headerOptions}>
      <SettingsStack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{ headerShown: false }} />
    </SettingsStack.Navigator>
  );
}

const Tab = createBottomTabNavigator<TabParamList>();

type DestinationName = keyof TabParamList;

/** Single-language tab label — reads the live app language via `useT()` so switching language in
 * Settings relabels the tab bar/sidebar instantly, with no remount. */
function TabLabelText({ name, color }: { name: DestinationName; color: string }) {
  const t = useT();
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ color, fontSize: 10, fontWeight: '600', lineHeight: 12 }}>{t(DESTINATION_LABEL_KEY[name])}</Text>
    </View>
  );
}
function tabLabel(name: DestinationName) {
  return ({ color }: { color: string; focused: boolean }) => <TabLabelText name={name} color={color} />;
}

/** ⌘1…⌘6 (SPEC §11): jump to the Nth *currently visible* destination, in the same order they're
 * registered below (Today/Leads/Pipeline/Tracking/Dashboard first — matching CompactTabBar's primary
 * row — then whatever else the role can see). A fixed 6 calls, not a loop — `visible[index]` is
 * undefined (no-op) for a role with fewer destinations, which is how `sales` (4 destinations) safely
 * no-ops on ⌘5–⌘6 without a 5th/6th destination ever existing for them. Destinations beyond the 6th
 * (e.g. Integrations, Admin for an admin account) are reachable via ⌘K → Leads, the sidebar, or the
 * compact "More" sheet, just not their own ⌘N shortcut — SPEC §11 only specifies ⌘1…⌘6. */
function useDestinationShortcut(index: number, visible: DestinationName[], jump: (name: DestinationName) => void) {
  useKeyboardShortcut(`mod+${index + 1}`, () => {
    const name = visible[index];
    if (name) jump(name);
  });
}

/**
 * The tab bar itself is role-derived (SPEC non-negotiable #1): a role that cannot see a screen
 * gets no tab at all, not a disabled one. The server still enforces every capability independently.
 *
 * SPEC v2 §11: the same navigator now drives two presentations of the identical route list — a
 * bottom tab bar at compact width, a permanent left sidebar at regular width — switched live via
 * `useWidthClass()`. Because it's one `Tab.Navigator` instance rather than two separate component
 * trees, role gating (the `showX &&` conditionals below) only has to be written once and applies to
 * both, and the currently-focused route/nested-stack state is never reset by a resize.
 *
 * SPEC-V2 §Roles adds 7 more gated destinations (Tracking/Nurture/SNS/Booking/Assign/Integrations)
 * plus one ungated one (Settings) on top of the original 6, which is too many to render flat on a
 * compact bottom bar — `CompactTabBar` and `Sidebar` both read `PRIMARY_TAB_NAMES` (destinations.ts)
 * to split "always on the bar" from "behind More/sectioned", but neither of them changes *which*
 * routes exist: that's still only the conditionals immediately below.
 */
export default function TabNavigator() {
  const { can } = useAuth();
  const t = useT();
  const widthClass = useWidthClass();
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Main'>>();
  const showTracking = can('tracking.view');
  const showDashboard = can('dashboard.company');
  const showTeam = can('team.view');
  const showNurture = can('nurture.view');
  const showSns = can('sns.view');
  const showBooking = can('booking.view');
  const showAssign = can('assignment.view');
  const showIntegrations = can('integrations.view');
  const showAdmin = can('admin.view');
  const showCardScan = can('card_scan.create');

  const visibleDestinations = useMemo<DestinationName[]>(
    () => [
      'TodayTab',
      'LeadsTab',
      'PipelineTab',
      ...(showTracking ? (['TrackingTab'] as const) : []),
      ...(showDashboard ? (['DashboardTab'] as const) : []),
      ...(showTeam ? (['TeamTab'] as const) : []),
      ...(showNurture ? (['NurtureTab'] as const) : []),
      ...(showSns ? (['SnsTab'] as const) : []),
      ...(showBooking ? (['BookingTab'] as const) : []),
      ...(showAssign ? (['AssignTab'] as const) : []),
      ...(showIntegrations ? (['IntegrationsTab'] as const) : []),
      ...(showAdmin ? (['AdminTab'] as const) : []),
      'SettingsTab',
    ],
    [showTracking, showDashboard, showTeam, showNurture, showSns, showBooking, showAssign, showIntegrations, showAdmin]
  );

  // Deliberately `{ screen: name }` only — not deep-linking into each stack's root screen. ⌘1…⌘6
  // should return to whatever that tab was last showing (react-navigation's normal tab-press
  // behaviour), not reset it. `NavigatorScreenParams<TabParamList>` requires a concrete nested
  // `params` object at the type level even though `{ screen: name }` alone is the documented,
  // valid runtime call for "switch to this tab" — hence the one narrow, local cast below.
  const jumpTo = (name: DestinationName) =>
    rootNav.navigate('Main', { screen: name } as NavigatorScreenParams<TabParamList>);
  useDestinationShortcut(0, visibleDestinations, jumpTo);
  useDestinationShortcut(1, visibleDestinations, jumpTo);
  useDestinationShortcut(2, visibleDestinations, jumpTo);
  useDestinationShortcut(3, visibleDestinations, jumpTo);
  useDestinationShortcut(4, visibleDestinations, jumpTo);
  useDestinationShortcut(5, visibleDestinations, jumpTo);

  // SPEC §11: ⌘N → new lead. There's no bare "new lead" form (leads are only ever created through
  // dedupe-aware paths — SPEC-V2 D13), so this points at card scan, the one flow that exists to
  // *create* a lead rather than edit one. `card_scan.create` is granted to all four roles today, but
  // the check stays here rather than assuming that, matching every other capability-gated shortcut.
  useKeyboardShortcut('mod+n', () => {
    if (!showCardScan) return;
    rootNav.navigate('Main', { screen: 'LeadsTab', params: { screen: 'CardScan' } } as NavigatorScreenParams<TabParamList>);
  });

  // SPEC §11: ⌘K → the one search surface that exists (Leads' inline search field). There is no
  // dedicated command-palette/search screen to jump into instead — jumping to Leads is the honest
  // version of "go to search" today. (LeadsScreen additionally focuses its own search input on the
  // same combo once mounted — see src/screens/LeadsScreen.tsx.)
  useKeyboardShortcut('mod+k', () => {
    rootNav.navigate('Main', { screen: 'LeadsTab', params: { screen: 'Leads' } } as NavigatorScreenParams<TabParamList>);
  });

  return (
    <Tab.Navigator
      initialRouteName="TodayTab"
      screenOptions={{
        headerShown: false,
        tabBarPosition: widthClass === 'regular' ? 'left' : 'bottom',
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.border },
        tabBarActiveTintColor: c.yellow,
        tabBarInactiveTintColor: c.greyLabel,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
      tabBar={(props) => (widthClass === 'regular' ? <Sidebar {...props} /> : <CompactTabBar {...props} />)}
    >
      {/* Order matches JAI's OneBox demo exactly (Balraj, 2026-09-18): ダッシュボード ·
          本日のアクション · リード管理 · 商談パイプライン · ステップメール · 反応検知・スコア ·
          予約フロー · 自動アサイン, then the destinations OneBox has no equivalent for.
          `initialRouteName` still lands everyone on Today — sales has no dashboard at all, and
          a rep's first screen is their actions (the proposal's own 入力ではなく、行動を通知). */}
      {showDashboard && (
        <Tab.Screen
          name="DashboardTab"
          component={DashboardStackNav}
          options={{ title: t('nav.dashboard'), tabBarLabel: tabLabel('DashboardTab'), tabBarIcon: ({ color }) => <DashboardIcon color={color} /> }}
        />
      )}
      <Tab.Screen
        name="TodayTab"
        component={TodayStackNav}
        options={{ title: t('nav.today'), tabBarLabel: tabLabel('TodayTab'), tabBarIcon: ({ color }) => <TodayIcon color={color} /> }}
      />
      <Tab.Screen
        name="LeadsTab"
        component={LeadsStackNav}
        options={{ title: t('nav.leads'), tabBarLabel: tabLabel('LeadsTab'), tabBarIcon: ({ color }) => <LeadsIcon color={color} /> }}
      />
      <Tab.Screen
        name="PipelineTab"
        component={PipelineStackNav}
        options={{ title: t('nav.pipeline'), tabBarLabel: tabLabel('PipelineTab'), tabBarIcon: ({ color }) => <PipelineIcon color={color} /> }}
      />
      {showNurture && (
        <Tab.Screen
          name="NurtureTab"
          component={NurtureStackNav}
          options={{ title: t('nav.nurture'), tabBarLabel: tabLabel('NurtureTab'), tabBarIcon: ({ color }) => <NurtureIcon color={color} /> }}
        />
      )}
      {showTracking && (
        <Tab.Screen
          name="TrackingTab"
          component={TrackingStackNav}
          options={{ title: t('nav.tracking'), tabBarLabel: tabLabel('TrackingTab'), tabBarIcon: ({ color }) => <TrackingIcon color={color} /> }}
        />
      )}
      {showBooking && (
        <Tab.Screen
          name="BookingTab"
          component={BookingStackNav}
          options={{ title: t('nav.booking'), tabBarLabel: tabLabel('BookingTab'), tabBarIcon: ({ color }) => <BookingIcon color={color} /> }}
        />
      )}
      {showAssign && (
        <Tab.Screen
          name="AssignTab"
          component={AssignStackNav}
          options={{ title: t('nav.assign'), tabBarLabel: tabLabel('AssignTab'), tabBarIcon: ({ color }) => <AssignIcon color={color} /> }}
        />
      )}
      {showTeam && (
        <Tab.Screen
          name="TeamTab"
          component={TeamStackNav}
          options={{ title: t('nav.team'), tabBarLabel: tabLabel('TeamTab'), tabBarIcon: ({ color }) => <TeamIcon color={color} /> }}
        />
      )}
      {showSns && (
        <Tab.Screen
          name="SnsTab"
          component={SnsStackNav}
          options={{ title: t('nav.sns'), tabBarLabel: tabLabel('SnsTab'), tabBarIcon: ({ color }) => <SnsIcon color={color} /> }}
        />
      )}
      {showIntegrations && (
        <Tab.Screen
          name="IntegrationsTab"
          component={IntegrationsStackNav}
          options={{ title: t('nav.integrations'), tabBarLabel: tabLabel('IntegrationsTab'), tabBarIcon: ({ color }) => <IntegrationsIcon color={color} /> }}
        />
      )}
      {showAdmin && (
        <Tab.Screen
          name="AdminTab"
          component={AdminStackNav}
          options={{ title: t('nav.admin'), tabBarLabel: tabLabel('AdminTab'), tabBarIcon: ({ color }) => <AdminIcon color={color} /> }}
        />
      )}
      {/* Ungated: personal notification preferences, not a role-scoped screen (SPEC-V2 §10). Reachable
          from the sidebar's signed-in-user footer at regular width, and CompactTabBar's "More" sheet
          at compact width — see Sidebar.tsx / CompactTabBar.tsx. */}
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStackNav}
        options={{ title: t('nav.settings'), tabBarLabel: tabLabel('SettingsTab'), tabBarIcon: ({ color }) => <SettingsIcon color={color} /> }}
      />
    </Tab.Navigator>
  );
}
