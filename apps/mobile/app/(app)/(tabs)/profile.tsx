import { useQuery } from '@tanstack/react-query';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import {
  Fingerprint,
  LogOut,
  Palette,
  RefreshCw,
  ShieldCheck,
  Smartphone,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Badge,
  Button,
  Divider,
  EditorialCard,
  EditorialText,
  ExpressiveSwitch,
  Screen,
  SectionHeader,
  SegmentedControl,
} from '../../../src/components/ui';
import { authApi } from '../../../src/services/auth-api';
import { useAuthStore } from '../../../src/stores/auth-store';
import { useTheme } from '../../../src/theme';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
  }
  return (parts[0]?.slice(0, 2) || 'ME').toUpperCase();
}

export default function ProfileTabScreen() {
  const { theme, preference, setMode } = useTheme();
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
    <Screen includeBottomInset={false} bottomSpacing={32}>
      <View style={[styles.header, { marginBottom: theme.spacing.xl }]}>
        <View style={styles.topRow}>
          <EditorialText variant="editorialEyebrow" tone="berryVibrant" uppercase>
            Account & Privacy
          </EditorialText>
          <Badge label={displayMode} tone="berry" />
        </View>

        <View style={[styles.identityRow, { marginTop: theme.spacing.sm }]}>
          <View
            style={[
              styles.avatarCircle,
              {
                backgroundColor: theme.colors.expressive.berry.container,
                borderRadius: theme.shapes.squircle,
              },
            ]}
          >
            <EditorialText variant="titleLarge" tone="berryVibrant">
              {getInitials(displayName)}
            </EditorialText>
          </View>
          <View style={styles.flexText}>
            <EditorialText variant="pageHeadingEditorial" tone="primary" numberOfLines={2}>
              {displayName}
            </EditorialText>
            <EditorialText variant="bodySmall" tone="secondary" numberOfLines={2}>
              {displayEmail}
              {subLabel ? ` · ${subLabel}` : ''}
            </EditorialText>
          </View>
        </View>
      </View>

      <EditorialCard variant="violet" shape="extraLarge" style={{ marginBottom: theme.spacing.xl }}>
        <View style={styles.rowIcon}>
          <View
            style={[
              styles.iconTile,
              {
                backgroundColor: theme.colors.m3.surfaceContainerLowest,
                borderRadius: theme.shapes.medium,
              },
            ]}
          >
            <ShieldCheck size={20} strokeWidth={1.9} color={theme.colors.expressive.violet.base} />
          </View>
          <View style={styles.flexText}>
            <EditorialText variant="cardHeading" tone="violet">
              Preferences
            </EditorialText>
            <EditorialText variant="caption" tone="secondary">
              Appearance & security preferences
            </EditorialText>
          </View>
        </View>

        <Divider style={{ marginVertical: theme.spacing.md }} />

        <View style={{ gap: theme.spacing.md }}>
          <View style={{ gap: theme.spacing.xs }}>
            <View style={styles.rowIcon}>
              <Palette size={17} color={theme.colors.expressive.amber.base} />
              <EditorialText variant="bodyMedium" tone="primary">
                Theme Mode
              </EditorialText>
            </View>
            <SegmentedControl
              value={preference}
              onChange={setMode}
              options={[
                { value: 'light', label: 'Light', accent: 'amber' },
                { value: 'dark', label: 'Dark', accent: 'violet' },
                { value: 'system', label: 'Auto', accent: 'cobalt' },
              ]}
            />
          </View>

          <View style={styles.prefRow}>
            <View style={[styles.rowIcon, styles.flexText]}>
              <Fingerprint size={18} color={theme.colors.expressive.teal.base} />
              <EditorialText variant="bodyMedium" tone="primary" numberOfLines={1}>
                Biometric App Lock
              </EditorialText>
            </View>
            <ExpressiveSwitch
              value={biometricLockEnabled}
              onValueChange={() => void handleToggleBiometric()}
              accent="teal"
              accessibilityLabel="Toggle biometric app lock"
            />
          </View>
        </View>
      </EditorialCard>

      <SectionHeader
        indexLabel="01 · Devices"
        title="Active Sessions"
        actionLabel="Refresh"
        onActionPress={() => void sessionsQuery.refetch()}
        eyebrowTone="cobaltVibrant"
      />

      <EditorialCard variant="surface" padding="sm" style={{ marginBottom: theme.spacing.xl }}>
        {sessionsQuery.isLoading ? (
          <EditorialText variant="bodySmall" tone="muted">
            Loading device sessions...
          </EditorialText>
        ) : sessionsQuery.data && sessionsQuery.data.length > 0 ? (
          sessionsQuery.data.map((session, index) => (
            <View key={session.id}>
              {index > 0 ? <Divider style={{ marginVertical: theme.spacing.sm }} /> : null}
              <View style={styles.prefRow}>
                <View style={[styles.rowIcon, styles.flexText]}>
                  <View
                    style={[
                      styles.sessionIcon,
                      {
                        backgroundColor: theme.colors.expressive.cobalt.container,
                        borderRadius: theme.shapes.small,
                      },
                    ]}
                  >
                    <Smartphone size={17} color={theme.colors.expressive.cobalt.base} />
                  </View>
                  <View style={styles.flexText}>
                    <EditorialText variant="bodyMedium" tone="primary" numberOfLines={1}>
                      {session.deviceName}
                    </EditorialText>
                    <EditorialText variant="caption" tone="muted" numberOfLines={1}>
                      {session.platform.toUpperCase()} ·{' '}
                      {new Date(session.lastSeenAt).toLocaleDateString()}
                    </EditorialText>
                  </View>
                </View>
                <Badge label="Active" tone="teal" />
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
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  flexText: {
    flex: 1,
    minWidth: 0,
  },
  iconTile: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sessionIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    gap: 12,
  },
  rowIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
