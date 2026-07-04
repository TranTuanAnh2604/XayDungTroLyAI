import React, { createContext, useEffect, useState, useMemo } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LIGHT_COLORS, DARK_COLORS, ThemeColors, getShadows } from '../constants/theme';

export type ThemeMode = 'system' | 'light' | 'dark';

export type ThemeContextType = {
  theme: ThemeMode;
  colors: ThemeColors;
  shadows: ReturnType<typeof getShadows>;
  setTheme: (mode: ThemeMode) => void;
  isDark: boolean;
};

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  colors: LIGHT_COLORS,
  shadows: getShadows(LIGHT_COLORS),
  setTheme: () => {},
  isDark: false,
});

const THEME_STORAGE_KEY = '@theme_preference';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const systemColorScheme = useColorScheme();

  useEffect(() => {
    (async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme === 'dark' || savedTheme === 'light' || savedTheme === 'system') {
          setThemeState(savedTheme as ThemeMode);
        }
      } catch (err) {
        console.error('Failed to load theme preference', err);
      }
    })();
  }, []);

  const setTheme = async (mode: ThemeMode) => {
    setThemeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (err) {
      console.error('Failed to save theme preference', err);
    }
  };

  const value = useMemo(() => {
    const isDark = theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';
    const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
    return {
      theme,
      colors,
      shadows: getShadows(colors),
      setTheme,
      isDark,
    };
  }, [theme, systemColorScheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
