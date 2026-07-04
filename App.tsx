import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { useTheme } from './src/hooks/useTheme';
import { initializeNotifications } from './src/services/notifications';

SplashScreen.preventAutoHideAsync().catch(() => { });

function AppContent() {
  const [appIsReady, setAppIsReady] = useState(false);
  const { colors: COLORS } = useTheme();

  useEffect(() => {
    (async () => {
      await SystemUI.setBackgroundColorAsync(COLORS.bg);
      await initializeNotifications();
      setAppIsReady(true);
    })();
  }, [COLORS.bg]);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
