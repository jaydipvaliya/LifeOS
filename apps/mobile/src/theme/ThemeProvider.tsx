import { darkTheme, lightTheme, type LifeOSTheme, type ThemeMode } from '@lifeos/design-tokens';
import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

interface ThemeContextValue {
  theme: LifeOSTheme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode | 'system') => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemeMode | 'system'>('light');

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
      setMode: setPreference,
    }),
    [resolvedMode],
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
