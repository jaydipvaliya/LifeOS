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
import { AppState, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Button, EditorialCard, EditorialText, Screen } from '../src/components/ui';
import { flushSyncOutbox } from '../src/offline/sync-engine';
import { authApi } from '../src/services/auth-api';
import {
  configureForegroundNotifications,
  registerForPushNotificationsAsync,
} from '../src/services/push-notifications';
import { captureMobileException, initMobileSentry } from '../src/services/sentry';
import { useAuthStore } from '../src/stores/auth-store';
import { ThemeProvider, useTheme } from '../src/theme';

void SplashScreen.preventAutoHideAsync();
initMobileSentry();
configureForegroundNotifications();

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
          void flushSyncOutbox();
          void registerForPushNotificationsAsync();
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
    if (!isAuthenticated) return;
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void flushSyncOutbox();
      }
    });
    return () => sub.remove();
  }, [isAuthenticated]);

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

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  const isDark = useColorScheme() === 'dark';

  useEffect(() => {
    captureMobileException(error, { boundary: 'RootLayout' });
  }, [error]);

  return (
    <SafeAreaView style={[styles.errorRoot, { backgroundColor: isDark ? '#101312' : '#F7F4EE' }]}>
      <View
        style={[
          styles.errorCard,
          {
            backgroundColor: isDark ? '#1A201E' : '#FFFFFF',
            borderColor: isDark ? '#2B3531' : '#E7E1D6',
            borderBottomColor: isDark ? '#090C0B' : '#DDD5C5',
          },
        ]}
      >
        <Text style={[styles.errorTitle, { color: isDark ? '#F2F4F2' : '#191917' }]}>
          Something went wrong
        </Text>
        <Text style={[styles.errorBody, { color: isDark ? '#B8C2BD' : '#57544D' }]}>
          LifeOS encountered an unexpected screen error. Your saved documents and offline queue
          remain safe.
        </Text>
        <Pressable
          onPress={retry}
          accessibilityRole="button"
          style={[
            styles.errorBtn,
            {
              backgroundColor: isDark ? '#5ED3A8' : '#1E6B52',
              borderBottomColor: isDark ? '#3AA37D' : '#134937',
            },
          ]}
        >
          <Text style={[styles.errorBtnText, { color: isDark ? '#082E20' : '#FFFFFF' }]}>
            Reload App
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
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
  errorRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorCard: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 4,
    padding: 24,
    gap: 12,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  errorBody: {
    fontSize: 15,
    lineHeight: 22,
  },
  errorBtn: {
    marginTop: 8,
    height: 48,
    borderRadius: 999,
    borderBottomWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
