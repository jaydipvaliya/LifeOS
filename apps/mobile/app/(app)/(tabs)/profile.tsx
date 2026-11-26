import { useQuery } from '@tanstack/react-query';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import {
  Fingerprint,
  LogOut,
  Moon,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sun,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  Badge,
  Button,
  Divider,
  EditorialCard,
  EditorialText,
  Screen,
  SectionHeader,
} from '../../../src/components/ui';
import { authApi } from '../../../src/services/auth-api';
import { useAuthStore } from '../../../src/stores/auth-store';
import { useTheme } from '../../../src/theme';

export default function ProfileTabScreen() {
  const { theme, mode, setMode } = useTheme();
  const router = useRouter();
  const {
    user,
    profile,
    refreshToken,
    biometricLockEnabled,
    setBiometricLockEnabled,
    clearSession,
    setUserAndProfile,
  } = useAuthStore();
  const [signingOut, setSigningOut] = useState(false);

  const meQuery = useQuery({
    queryKey: ['users', 'me'],
    queryFn: async () => {
      const data = await authApi.getMe();
      setUserAndProfile(data.user, data.profile);
      return data;
    },
  });

  const sessionsQuery = useQuery({
    queryKey: ['auth', 'sessions'],
    queryFn: () => authApi.listSessions(),
  });

  const handleToggleBiometric = async () => {
    if (!biometricLockEnabled) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !enrolled) return;
      await setBiometricLockEnabled(true);
    } else {
      await setBiometricLockEnabled(false);
    }
  };

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await authApi.logout(refreshToken ?? undefined);
    } catch {
      // Ignore remote revocation errors on sign out.
    } finally {
      await clearSession();
      setSigningOut(false);
      router.replace('/(auth)/welcome');
    }
  };

  const displayName = meQuery.data?.user.fullName ?? user?.fullName ?? 'Member';
  const displayEmail = meQuery.data?.user.email ?? user?.email ?? '';
  const displayMode = meQuery.data?.user.mode ?? user?.mode ?? 'student';
  const subLabel =
    meQuery.data?.profile.institutionName ??
    profile?.institutionName ??
    meQuery.data?.profile.jobTitle ??
    profile?.jobTitle;

  return (
    <Screen>
      <View style={[styles.header, { marginBottom: theme.spacing.xl }]}>
        <View style={styles.topRow}>
          <EditorialText variant="editorialEyebrow" tone="secondaryForest" uppercase>
            Account & Privacy
          </EditorialText>
          <Badge label={displayMode} tone="sage" />
        </View>
        <EditorialText variant="pageHeadingEditorial" tone="primary" style={{ marginTop: 4 }}>
          {displayName}
        </EditorialText>
        <EditorialText variant="bodySmall" tone="secondary">
          {displayEmail}
          {subLabel ? ` · ${subLabel}` : ''}
        </EditorialText>
      </View>

      <EditorialCard variant="tonal" style={{ marginBottom: theme.spacing.xl }}>
        <View style={styles.rowBetween}>
          <View style={styles.rowIcon}>
            <ShieldCheck size={20} strokeWidth={1.75} color={theme.colors.m3.primary} />
            <View style={{ flex: 1 }}>
              <EditorialText variant="cardHeading" tone="primary">
                Preferences
              </EditorialText>
              <EditorialText variant="caption" tone="secondaryForest">
                Material 3 Expressive theme & biometric protection
              </EditorialText>
            </View>
          </View>
        </View>

        <Divider style={{ marginVertical: theme.spacing.md }} />

        <View style={{ gap: theme.spacing.sm }}>
          <Pressable
            onPress={() => setMode(mode === 'light' ? 'dark' : 'light')}
            accessibilityRole="button"
            style={styles.prefRow}
          >
            <View style={styles.rowIcon}>
              {mode === 'light' ? (
                <Sun size={18} color={theme.colors.m3.primary} />
              ) : (
                <Moon size={18} color={theme.colors.m3.primary} />
              )}
              <EditorialText variant="bodyMedium" tone="primary">
                Appearance
              </EditorialText>
            </View>
            <Badge label={mode === 'light' ? 'Warm Light' : 'Forest Dark'} tone="sage" />
          </Pressable>

          <Pressable
            onPress={() => void handleToggleBiometric()}
            accessibilityRole="switch"
            accessibilityState={{ checked: biometricLockEnabled }}
            style={styles.prefRow}
          >
            <View style={styles.rowIcon}>
              <Fingerprint size={18} color={theme.colors.m3.primary} />
              <EditorialText variant="bodyMedium" tone="primary">
                Biometric App Lock
              </EditorialText>
            </View>
            <Badge
              label={biometricLockEnabled ? 'Enabled' : 'Off'}
              tone={biometricLockEnabled ? 'success' : 'neutral'}
            />
          </Pressable>
        </View>
      </EditorialCard>

      <SectionHeader
        indexLabel="01 · Devices"
        title="Active Sessions"
        actionLabel="Refresh"
        onActionPress={() => void sessionsQuery.refetch()}
      />

      <EditorialCard variant="outlined" style={{ marginBottom: theme.spacing.xl }}>
        {sessionsQuery.isLoading ? (
          <EditorialText variant="bodySmall" tone="muted">
            Loading device sessions...
          </EditorialText>
        ) : sessionsQuery.data && sessionsQuery.data.length > 0 ? (
          sessionsQuery.data.map((session, index) => (
            <View key={session.id}>
              {index > 0 ? <Divider style={{ marginVertical: theme.spacing.sm }} /> : null}
              <View style={styles.prefRow}>
                <View style={[styles.rowIcon, { flex: 1 }]}>
                  <Smartphone size={18} color={theme.colors.m3.secondary} />
                  <View style={{ flex: 1 }}>
                    <EditorialText variant="bodyMedium" tone="primary">
                      {session.deviceName}
                    </EditorialText>
                    <EditorialText variant="caption" tone="muted">
                      {session.platform.toUpperCase()} ·{' '}
                      {new Date(session.lastSeenAt).toLocaleDateString()}
                    </EditorialText>
                  </View>
                </View>
                <Badge label="Active" tone="success" />
              </View>
            </View>
          ))
        ) : (
          <EditorialText variant="bodySmall" tone="muted">
            No active sessions found.
          </EditorialText>
        )}
      </EditorialCard>

      <View style={{ gap: theme.spacing.sm }}>
        <Button
          label="Sync Profile"
          variant="tonal"
          shape="pill"
          fullWidth
          leftIcon={<RefreshCw size={16} color={theme.colors.m3.onSecondaryContainer} />}
          onPress={() => void meQuery.refetch()}
        />
        <Button
          label="Sign Out"
          variant="destructive"
          shape="pill"
          fullWidth
          loading={signingOut}
          leftIcon={<LogOut size={16} color={theme.colors.m3.error} />}
          onPress={handleLogout}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  rowIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
