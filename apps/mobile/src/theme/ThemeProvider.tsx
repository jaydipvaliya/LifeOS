import { darkTheme, lightTheme, type LifeOSTheme, type ThemeMode } from '@lifeos/design-tokens';
import * as SecureStore from 'expo-secure-store';
import * as SystemUI from 'expo-system-ui';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

export type ThemePreference = ThemeMode | 'system';

const THEME_STORAGE_KEY = 'lifeos.theme_preference';

interface ThemeContextValue {
  theme: LifeOSTheme;
  mode: ThemeMode;
  preference: ThemePreference;
  setMode: (mode: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>('system');

  useEffect(() => {
    let active = true;
    void SecureStore.getItemAsync(THEME_STORAGE_KEY)
      .then((stored) => {
        if (!active) return;
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setPreference(stored);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const setMode = useCallback((next: ThemePreference) => {
    setPreference(next);
    void SecureStore.setItemAsync(THEME_STORAGE_KEY, next).catch(() => undefined);
  }, []);

  const resolvedMode: ThemeMode = useMemo(() => {
    if (preference === 'system') {
      return systemScheme === 'dark' ? 'dark' : 'light';
    }
    return preference;
  }, [preference, systemScheme]);

  const activeTheme = useMemo(
    () => (resolvedMode === 'dark' ? darkTheme : lightTheme),
    [resolvedMode],
  );

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(activeTheme.colors.background.primary).catch(
      () => undefined,
    );
  }, [activeTheme.colors.background.primary]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: activeTheme,
      mode: resolvedMode,
      preference,
      setMode,
    }),
    [activeTheme, preference, resolvedMode, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
