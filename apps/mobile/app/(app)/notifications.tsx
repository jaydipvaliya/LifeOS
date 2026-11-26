import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, EyeOff } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  Badge,
  Divider,
  EditorialCard,
  EditorialText,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  SectionHeader,
} from '../../src/components/ui';
import { extractApiErrorMessage } from '../../src/services/api-client';
import { lifeApi } from '../../src/services/life-api';
import { useTheme } from '../../src/theme';

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: () => lifeApi.listNotifications(),
  });

  const preferencesQuery = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => lifeApi.getNotificationPreferences(),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => lifeApi.markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const updatePrefMutation = useMutation({
    mutationFn: (patch: Parameters<typeof lifeApi.updateNotificationPreferences>[0]) =>
      lifeApi.updateNotificationPreferences(patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notification-preferences'] }),
  });

  const prefs = preferencesQuery.data;
  const items = notificationsQuery.data ?? [];

  return (
    <Screen>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        hitSlop={10}
        style={styles.backRow}
      >
        <ArrowLeft size={18} color={theme.colors.m3.primary} />
        <EditorialText variant="label" tone="forest">
          Back
        </EditorialText>
      </Pressable>

      <EditorialText
        variant="pageHeadingEditorial"
        tone="primary"
        style={{ marginTop: theme.spacing.md, marginBottom: theme.spacing.lg }}
      >
        Notification Center
      </EditorialText>

      <SectionHeader
        indexLabel="01 · Preferences"
        title="Privacy & Reminder Timing"
        subtitle="Control lock-screen privacy and lead days."
      />

      {preferencesQuery.isLoading ? (
        <LoadingState message="Loading notification preferences..." />
      ) : prefs ? (
        <EditorialCard variant="tonal" style={{ marginBottom: theme.spacing.xl, gap: 12 }}>
          <Pressable
            onPress={() =>
              updatePrefMutation.mutate({
                privacyHideSensitiveContent: !prefs.privacyHideSensitiveContent,
              })
            }
            style={styles.prefRow}
          >
            <View style={styles.rowGap}>
              <EyeOff size={18} color={theme.colors.m3.primary} />
              <View style={{ flex: 1 }}>
                <EditorialText variant="bodyMedium" tone="primary">
                  Mask Sensitive Details
                </EditorialText>
                <EditorialText variant="caption" tone="secondaryForest">
                  Hide document titles & amounts in push notifications.
                </EditorialText>
              </View>
            </View>
            <Badge
              label={prefs.privacyHideSensitiveContent ? 'Private' : 'Visible'}
              tone={prefs.privacyHideSensitiveContent ? 'success' : 'warning'}
            />
          </Pressable>

          <Divider />

          <Pressable
            onPress={() => updatePrefMutation.mutate({ pushEnabled: !prefs.pushEnabled })}
            style={styles.prefRow}
          >
            <EditorialText variant="bodyMedium" tone="primary">
              Push Notifications
            </EditorialText>
            <Badge
              label={prefs.pushEnabled ? 'Enabled' : 'Paused'}
              tone={prefs.pushEnabled ? 'success' : 'neutral'}
            />
          </Pressable>

          <View style={styles.prefRow}>
            <EditorialText variant="caption" tone="secondaryForest">
              Lead Days (Docs / Warranty / Subs)
            </EditorialText>
            <EditorialText variant="label" tone="forest">
              {prefs.documentExpiryDaysBefore}d / {prefs.warrantyExpiryDaysBefore}d /{' '}
              {prefs.subscriptionRenewalDaysBefore}d
            </EditorialText>
          </View>
        </EditorialCard>
      ) : null}

      <SectionHeader indexLabel="02 · History" title="Recent Alerts" />

      {notificationsQuery.isLoading ? (
        <LoadingState message="Loading notifications..." />
      ) : notificationsQuery.isError ? (
        <ErrorState
          message={extractApiErrorMessage(notificationsQuery.error)}
          onRetry={() => void notificationsQuery.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Bell size={26} color={theme.colors.m3.primary} />}
          title="All caught up"
          description="Scheduled reminders for document expirations, warranties, and renewals appear here."
        />
      ) : (
        <View style={{ gap: theme.spacing.sm }}>
          {items.map((item) => (
            <EditorialCard
              key={item.id}
              variant={item.readAt ? 'outlined' : 'secondary'}
              onPress={() => !item.readAt && markReadMutation.mutate(item.id)}
            >
              <View style={styles.prefRow}>
                <View style={{ flex: 1 }}>
                  <EditorialText variant="cardHeading" tone="primary">
                    {item.title}
                  </EditorialText>
                  <EditorialText variant="bodySmall" tone="secondary">
                    {item.body}
                  </EditorialText>
                </View>
                <Badge
                  label={item.readAt ? 'Read' : 'New'}
                  tone={item.readAt ? 'neutral' : 'sage'}
                />
              </View>
            </EditorialCard>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  prefRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
});
