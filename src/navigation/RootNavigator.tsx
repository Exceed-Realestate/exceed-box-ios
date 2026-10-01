import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { c } from '../theme';
import LoginScreen from '../screens/LoginScreen';
import TabNavigator from './TabNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

// The app is light everywhere except the Login screen and the sidebar/tab-bar brand block, both of
// which set their own full-bleed dark background directly — this theme only governs the
// NavigationContainer's own default background (screen-transition edges) and native-stack chrome.
const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: c.page,
    card: c.card,
    text: c.textPrimary,
    border: c.hairline,
    primary: c.gold,
  },
};

export default function RootNavigator() {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: c.charcoal, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={c.yellow} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {status === 'signedIn' ? (
          <Stack.Screen name="Main" component={TabNavigator} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
