import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import 'react-native-reanimated';

import { Schemes, useResolvedScheme } from '@/constants/theme';
import { AuthProvider } from '@/context/auth-context';
import { ThemePreferenceProvider } from '@/context/theme-preference';

function ThemedStack() {
  const scheme = useResolvedScheme();
  const c = Schemes[scheme];

  const base = scheme === 'dark' ? NavigationDarkTheme : NavigationDefaultTheme;
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      background: c.bg,
      card: c.card,
      border: c.separator,
      primary: c.accent,
      text: c.label,
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  void Notifications;
  return (
    <ThemePreferenceProvider>
      <AuthProvider>
        <ThemedStack />
      </AuthProvider>
    </ThemePreferenceProvider>
  );
}
