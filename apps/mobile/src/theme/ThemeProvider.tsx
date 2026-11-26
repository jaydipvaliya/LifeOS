import { darkTheme, lightTheme, type LifeOSTheme, type ThemeMode } from '@lifeos/design-tokens';
import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

export type ThemePreference = ThemeMode | 'system';

interface ThemeContextValue {
  theme: LifeOSTheme;
  mode: ThemeMode;
  preference: ThemePreference;
  setMode: (mode: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>('light');

  const resolvedMode: ThemeMode = useMemo(() => {
    if (preference === 'system') {
      return systemScheme === 'dark' ? 'dark' : 'light';
    }
    return preference;
  }, [preference, systemScheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: resolvedMode === 'dark' ? darkTheme : lightTheme,
      mode: resolvedMode,
      preference,
      setMode: setPreference,
    }),
    [preference, resolvedMode],
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
