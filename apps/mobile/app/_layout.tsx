import {
  DMSerifDisplay_400Regular,
  DMSerifDisplay_400Regular_Italic,
} from '@expo-google-fonts/dm-serif-display';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import {
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import * as LocalAuthentication from 'expo-local-authentication';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Lock } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Button, EditorialCard, EditorialText, Screen } from '../src/components/ui';
import { authApi } from '../src/services/auth-api';
import { useAuthStore } from '../src/stores/auth-store';
import { ThemeProvider, useTheme } from '../src/theme';

void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function RootNavigator() {
  const { mode, theme } = useTheme();
  const router = useRouter();
  const segments = useSegments();

  const {
    isHydrated,
    isAuthenticated,
    biometricLockEnabled,
    isBiometricUnlocked,
    hydrateFromStorage,
    setUserAndProfile,
    clearSession,
    markHydrated,
    setBiometricUnlocked,
  } = useAuthStore();

  useEffect(() => {
    let active = true;

    async function bootstrapSession() {
      try {
        const { accessToken, refreshToken } = await hydrateFromStorage();
        if (!accessToken && !refreshToken) {
          if (active) markHydrated();
          return;
        }

        const me = await authApi.getMe();
        if (active) {
          setUserAndProfile(me.user, me.profile);
          markHydrated();
        }
      } catch {
        if (active) {
          await clearSession();
        }
      }
    }

    void bootstrapSession();
    return () => {
      active = false;
    };
  }, [clearSession, hydrateFromStorage, markHydrated, setUserAndProfile]);

  useEffect(() => {
    if (!isHydrated) return;

    const segmentList = segments as string[];
    const inAuthGroup = segmentList[0] === '(auth)';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    } else if (isAuthenticated && inAuthGroup && segmentList[1] !== 'onboarding') {
      router.replace('/(app)');
    }
  }, [isAuthenticated, isHydrated, router, segments]);

  const handleBiometricUnlock = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock LifeOS',
      fallbackLabel: 'Use passcode',
    });
    if (result.success) {
      setBiometricUnlocked(true);
    }
  };

  if (isHydrated && isAuthenticated && biometricLockEnabled && !isBiometricUnlocked) {
    return (
      <Screen scroll={false} contentStyle={styles.lockScreen}>
        <EditorialCard variant="violet" shape="extraLarge" padding="lg" style={styles.lockIconCard}>
          <Lock size={34} strokeWidth={1.9} color={theme.colors.expressive.violet.base} />
        </EditorialCard>
        <EditorialText
          variant="pageHeadingEditorial"
          tone="primary"
          style={{ marginTop: theme.spacing.lg }}
        >
          LifeOS is locked.
        </EditorialText>
        <EditorialText
          variant="body"
          tone="secondary"
          style={{ marginTop: theme.spacing.xs, textAlign: 'center' }}
        >
          Verify your identity to access your personal documents and responsibilities.
        </EditorialText>
        <Button
          label="Unlock with Biometrics"
          variant="filled"
          shape="pill"
          size="lg"
          onPress={() => void handleBiometricUnlock()}
          style={{ marginTop: theme.spacing.xl, alignSelf: 'center' }}
        />
      </Screen>
    );
  }

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background.primary },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    DMSerifDisplay_400Regular,
    DMSerifDisplay_400Regular_Italic,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <RootNavigator />
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  lockScreen: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  lockIconCard: {
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
});
