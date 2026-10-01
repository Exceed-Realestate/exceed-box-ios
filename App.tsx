import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/auth/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import ConfigErrorScreen from './src/screens/ConfigErrorScreen';
import { DemoDataBanner } from './src/components/DemoDataBanner';
import { KeyboardShortcutsProvider } from './src/components/KeyboardShortcutsProvider';
import { MasterDetailProvider } from './src/navigation/MasterDetail';
import { API_URL_CONFIGURED, MOCKS_ENABLED } from './src/api/client';
import { I18nProvider } from './src/i18n';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* I18nProvider sits above everything, including ConfigErrorScreen — the language switch
            must work even before an API is reachable. */}
        <I18nProvider>
          {MOCKS_ENABLED && <DemoDataBanner />}
          {!MOCKS_ENABLED && !API_URL_CONFIGURED ? (
            // Non-mock build with nowhere to call — never mount auth/navigation and silently fail
            // network requests against a wrong/loopback address instead.
            <ConfigErrorScreen />
          ) : (
            <AuthProvider>
              {/* SPEC v2 §11: shell-level providers. KeyboardShortcutsProvider owns the single global
                  keydown listener (web only, see the hook file for why); MasterDetailProvider holds
                  list+detail selection above the width-class branch so it survives a resize or a
                  tab switch. Both are consumed by src/navigation/* and available to any screen. */}
              <KeyboardShortcutsProvider>
                <MasterDetailProvider>
                  <RootNavigator />
                </MasterDetailProvider>
              </KeyboardShortcutsProvider>
            </AuthProvider>
          )}
        </I18nProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
