import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Bell, EyeOff } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Badge,
  Divider,
  EditorialCard,
  EditorialText,
  EmptyState,
  ErrorState,
  ExpressiveSwitch,
  LoadingState,
  Screen,
  ScreenTopBar,
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
      <ScreenTopBar onBack={() => router.back()} badgeLabel="Alerts" badgeTone="coral" />

      <EditorialText
        variant="pageHeadingEditorial"
        tone="primary"
        style={{ marginBottom: theme.spacing.lg }}
      >
        Notification Center
      </EditorialText>

      <SectionHeader
        indexLabel="01 · Preferences"
        title="Privacy & Reminder Timing"
        subtitle="Control lock-screen privacy and lead days."
        eyebrowTone="violetVibrant"
      />

      {preferencesQuery.isLoading ? (
        <LoadingState message="Loading notification preferences..." />
      ) : prefs ? (
        <EditorialCard
          variant="violet"
          shape="extraLarge"
          style={{ marginBottom: theme.spacing.xl, gap: 12 }}
        >
          <View style={styles.prefRow}>
            <View style={styles.rowGap}>
              <View
                style={[
                  styles.iconTile,
                  {
                    backgroundColor: theme.colors.surface.elevated,
                    borderRadius: theme.shapes.medium,
                  },
                ]}
              >
                <EyeOff size={18} color={theme.colors.expressive.violet.base} />
              </View>
              <View style={styles.flexText}>
                <EditorialText variant="bodyMedium" tone="violet">
                  Mask Sensitive Details
                </EditorialText>
                <EditorialText variant="caption" tone="secondary">
                  Hide document titles & amounts in push notifications.
                </EditorialText>
              </View>
            </View>
            <ExpressiveSwitch
              value={prefs.privacyHideSensitiveContent}
              onValueChange={(next) =>
                updatePrefMutation.mutate({ privacyHideSensitiveContent: next })
              }
              accent="violet"
              accessibilityLabel="Toggle sensitive notification masking"
            />
          </View>

          <Divider />

          <View style={styles.prefRow}>
            <View style={styles.rowGap}>
              <View
                style={[
                  styles.iconTile,
                  {
                    backgroundColor: theme.colors.surface.elevated,
                    borderRadius: theme.shapes.medium,
                  },
                ]}
              >
                <Bell size={18} color={theme.colors.expressive.teal.base} />
              </View>
              <View style={styles.flexText}>
                <EditorialText variant="bodyMedium" tone="primary">
                  Push Notifications
                </EditorialText>
                <EditorialText variant="caption" tone="secondary">
                  Receive timely reminders on your device.
                </EditorialText>
              </View>
            </View>
            <ExpressiveSwitch
              value={prefs.pushEnabled}
              onValueChange={(next) => updatePrefMutation.mutate({ pushEnabled: next })}
              accent="teal"
              accessibilityLabel="Toggle push notifications"
            />
          </View>

          <Divider />

          <View style={styles.leadRow}>
            <EditorialText variant="caption" tone="secondary">
              Advance Notice Windows
            </EditorialText>
            <View style={styles.leadBadges}>
              <Badge label={`Docs ${prefs.documentExpiryDaysBefore}d`} tone="amber" />
              <Badge label={`Warranty ${prefs.warrantyExpiryDaysBefore}d`} tone="teal" />
              <Badge label={`Subs ${prefs.subscriptionRenewalDaysBefore}d`} tone="berry" />
            </View>
          </View>
        </EditorialCard>
      ) : null}

      <SectionHeader indexLabel="02 · History" title="Recent Alerts" eyebrowTone="coralVibrant" />

      {notificationsQuery.isLoading ? (
        <LoadingState message="Loading notifications..." />
      ) : notificationsQuery.isError ? (
        <ErrorState
          message={extractApiErrorMessage(notificationsQuery.error)}
          onRetry={() => void notificationsQuery.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Bell size={26} color={theme.colors.expressive.coral.base} />}
          title="All caught up"
          description="Scheduled reminders for document expirations, warranties, and renewals appear here."
        />
      ) : (
        <View style={{ gap: theme.spacing.sm }}>
          {items.map((item) => (
            <EditorialCard
              key={item.id}
              variant={item.readAt ? 'surface' : 'coral'}
              padding="sm"
              onPress={() => !item.readAt && markReadMutation.mutate(item.id)}
            >
              <View style={styles.prefRow}>
                <View style={styles.flexText}>
                  <EditorialText variant="cardHeading" tone={item.readAt ? 'primary' : 'coral'}>
                    {item.title}
                  </EditorialText>
                  <EditorialText variant="bodySmall" tone="secondary" style={{ marginTop: 2 }}>
                    {item.body}
                  </EditorialText>
                </View>
                <Badge
                  label={item.readAt ? 'Read' : 'New'}
                  tone={item.readAt ? 'neutral' : 'coral'}
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
  flexText: { flex: 1, minWidth: 0 },
  iconTile: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  prefRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
  leadRow: { gap: 8 },
  leadBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
