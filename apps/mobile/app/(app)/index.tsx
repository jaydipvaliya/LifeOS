import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { LogOut, RefreshCw, ShieldCheck, Smartphone } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Badge,
  Button,
  Divider,
  EditorialCard,
  EditorialText,
  Screen,
  SectionHeader,
} from '../../src/components/ui';
import { extractApiErrorMessage } from '../../src/services/api-client';
import { authApi } from '../../src/services/auth-api';
import { useAuthStore } from '../../src/stores/auth-store';
import { useTheme } from '../../src/theme';

export default function AuthenticatedDashboardShellScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user, profile, refreshToken, clearSession, setUserAndProfile } = useAuthStore();
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

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await authApi.logout(refreshToken ?? undefined);
    } catch {
      // Clear local credentials even if server session was already revoked.
    } finally {
      await clearSession();
      setSigningOut(false);
      router.replace('/(auth)/welcome');
    }
  };

  const displayName = meQuery.data?.user.fullName ?? user?.fullName ?? 'Member';
  const displayMode = meQuery.data?.user.mode ?? user?.mode ?? 'student';
  const institutionOrRole =
    meQuery.data?.profile.institutionName ??
    profile?.institutionName ??
    meQuery.data?.profile.jobTitle ??
    profile?.jobTitle;

  return (
    <Screen>
      <View style={[styles.header, { marginBottom: theme.spacing.xl }]}>
        <View style={styles.topRow}>
          <EditorialText variant="editorialEyebrow" tone="secondaryForest" uppercase>
            {todayFormatted}
          </EditorialText>
          <Badge label={displayMode} tone="sage" />
        </View>

        <EditorialText
          variant="displayEditorial"
          tone="primary"
          style={{ marginTop: theme.spacing.xs }}
        >
          Good day, {displayName.split(' ')[0]}.
        </EditorialText>

        <EditorialText variant="body" tone="secondary" style={{ marginTop: theme.spacing.xxs }}>
          {institutionOrRole
            ? `${institutionOrRole} · Authenticated LifeOS Workspace`
            : 'Authenticated LifeOS Workspace'}
        </EditorialText>
      </View>

      {meQuery.isError ? (
        <EditorialCard
          style={{
            marginBottom: theme.spacing.lg,
            backgroundColor: theme.colors.status.dangerSurface,
            borderColor: theme.colors.status.danger,
          }}
        >
          <EditorialText variant="bodySmall" tone="danger">
            {extractApiErrorMessage(meQuery.error)}
          </EditorialText>
          <Button
            label="Retry"
            variant="secondary"
            onPress={() => void meQuery.refetch()}
            style={{ marginTop: theme.spacing.sm }}
          />
        </EditorialCard>
      ) : null}

      <EditorialCard variant="sage" style={{ marginBottom: theme.spacing.xl }}>
        <View style={styles.cardTitleRow}>
          <ShieldCheck size={20} strokeWidth={1.75} color={theme.colors.brand.primaryForest} />
          <EditorialText variant="cardHeading" tone="primary">
            Day 2 Authentication Active
          </EditorialText>
        </View>
        <EditorialText
          variant="bodySmall"
          tone="secondaryForest"
          style={{ marginTop: theme.spacing.xs }}
        >
          Your session is secured with Argon2id credentials, rotating refresh tokens, and Expo
          SecureStore persistence. Full 5-tab navigation, Vault, and Life Administration modules
          arrive in Day 3–4.
        </EditorialText>
      </EditorialCard>

      <SectionHeader
        indexLabel="01 · Security"
        title="Active Device Sessions"
        subtitle="Devices authorized to access your LifeOS account."
        actionLabel="Refresh"
        onActionPress={() => void sessionsQuery.refetch()}
      />

      <EditorialCard style={{ marginBottom: theme.spacing.xl }}>
        {sessionsQuery.isLoading ? (
          <EditorialText variant="bodySmall" tone="muted">
            Loading active sessions...
          </EditorialText>
        ) : sessionsQuery.data && sessionsQuery.data.length > 0 ? (
          sessionsQuery.data.map((session, index) => (
            <View key={session.id}>
              {index > 0 ? <Divider style={{ marginVertical: theme.spacing.sm }} /> : null}
              <View style={styles.sessionRow}>
                <View style={styles.sessionInfo}>
                  <Smartphone
                    size={18}
                    strokeWidth={1.75}
                    color={theme.colors.brand.secondaryForest}
                  />
                  <View style={{ flex: 1 }}>
                    <EditorialText variant="bodyMedium" tone="primary">
                      {session.deviceName}
                    </EditorialText>
                    <EditorialText variant="caption" tone="muted">
                      {session.platform.toUpperCase()} · Last active{' '}
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
          label="Sync Profile Status"
          variant="secondary"
          fullWidth
          leftIcon={
            <RefreshCw size={16} strokeWidth={1.75} color={theme.colors.brand.primaryForest} />
          }
          onPress={() => void meQuery.refetch()}
        />
        <Button
          label="Sign Out"
          variant="destructive"
          fullWidth
          loading={signingOut}
          leftIcon={<LogOut size={16} strokeWidth={1.75} color={theme.colors.status.danger} />}
          onPress={handleLogout}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sessionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
});
