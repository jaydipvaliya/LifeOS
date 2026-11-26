import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  Bell,
  CalendarClock,
  Camera,
  CheckSquare,
  FileText,
  Laptop,
  Plus,
  Repeat,
  Search,
  Sparkles,
  Upload,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import {
  Badge,
  Button,
  Divider,
  EditorialCard,
  EditorialText,
  EmptyState,
  ErrorState,
  ExpressiveFAB,
  LoadingState,
  Screen,
  SectionHeader,
} from '../../../src/components/ui';
import { extractApiErrorMessage } from '../../../src/services/api-client';
import { vaultApi } from '../../../src/services/vault-api';
import { useAuthStore } from '../../../src/stores/auth-store';
import { useTheme } from '../../../src/theme';

export default function HomeDashboardScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [quickSheetOpen, setQuickSheetOpen] = useState(false);

  const dashboardQuery = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => vaultApi.getDashboard(),
  });

  const todayLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  const firstName = user?.fullName?.split(' ')[0] ?? 'there';
  const data = dashboardQuery.data;

  return (
    <View style={styles.root}>
      <Screen>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={dashboardQuery.isRefetching}
              onRefresh={() => void dashboardQuery.refetch()}
              tintColor={theme.colors.m3.primary}
            />
          }
        >
          {/* Editorial M3 Top App Bar */}
          <View style={[styles.topBar, { marginBottom: theme.spacing.lg }]}>
            <View style={{ flex: 1 }}>
              <EditorialText variant="editorialEyebrow" tone="secondaryForest" uppercase>
                {todayLabel}
              </EditorialText>
              <EditorialText variant="displayEditorial" tone="primary" style={{ marginTop: 4 }}>
                Hello, {firstName}.
              </EditorialText>
            </View>

            <View style={styles.topActions}>
              <Pressable
                onPress={() => router.push('/(app)/(tabs)/vault')}
                accessibilityRole="button"
                accessibilityLabel="Search LifeOS"
                style={[
                  styles.iconBtn,
                  {
                    backgroundColor: theme.colors.m3.surfaceContainer,
                    borderRadius: theme.shapes.medium,
                  },
                ]}
              >
                <Search size={20} strokeWidth={1.75} color={theme.colors.m3.onSurface} />
              </Pressable>
              <Pressable
                onPress={() => setQuickSheetOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Notifications and alerts"
                style={[
                  styles.iconBtn,
                  {
                    backgroundColor: theme.colors.m3.surfaceContainer,
                    borderRadius: theme.shapes.medium,
                  },
                ]}
              >
                <Bell size={20} strokeWidth={1.75} color={theme.colors.m3.onSurface} />
              </Pressable>
            </View>
          </View>

          {/* Expressive Quick Actions Strip */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.quickStrip, { marginBottom: theme.spacing.xl }]}
          >
            <Button
              label="Scan Document"
              variant="filled"
              size="sm"
              shape="pill"
              leftIcon={<Camera size={16} strokeWidth={2} color={theme.colors.m3.onPrimary} />}
              onPress={() => router.push('/(app)/scanner')}
            />
            <Button
              label="Upload File"
              variant="tonal"
              size="sm"
              shape="pill"
              leftIcon={
                <Upload size={16} strokeWidth={2} color={theme.colors.m3.onSecondaryContainer} />
              }
              onPress={() => router.push('/(app)/(tabs)/vault')}
            />
            <Button
              label="All Quick Actions"
              variant="outlined"
              size="sm"
              shape="pill"
              leftIcon={<Plus size={16} strokeWidth={2} color={theme.colors.m3.primary} />}
              onPress={() => setQuickSheetOpen(true)}
            />
          </ScrollView>

          {dashboardQuery.isLoading ? (
            <LoadingState message="Gathering your documents, tasks, and reminders..." />
          ) : dashboardQuery.isError ? (
            <ErrorState
              message={extractApiErrorMessage(dashboardQuery.error)}
              onRetry={() => void dashboardQuery.refetch()}
            />
          ) : data ? (
            <View style={{ gap: theme.spacing.xl }}>
              {/* M3 Expressive Hero Metrics Surface */}
              <EditorialCard variant="tonal">
                <View style={styles.heroHeader}>
                  <View style={styles.heroTitleGroup}>
                    <Sparkles size={18} strokeWidth={1.75} color={theme.colors.m3.primary} />
                    <EditorialText variant="editorialEyebrow" tone="forest" uppercase>
                      Life Intelligence
                    </EditorialText>
                  </View>
                  <Badge label={`${data.summaryCounts.totalDocuments} in Vault`} tone="sage" />
                </View>

                <EditorialText
                  variant="headlineMedium"
                  tone="primary"
                  style={{ marginTop: theme.spacing.sm }}
                >
                  {data.insights[0]?.title ?? 'Everything looks calm today.'}
                </EditorialText>
                <EditorialText variant="bodySmall" tone="secondaryForest" style={{ marginTop: 4 }}>
                  {data.insights[0]?.description ??
                    'Your documents, upcoming deadlines, and warranties are organized in one place.'}
                </EditorialText>

                <Divider style={{ marginVertical: theme.spacing.md }} />

                <View style={styles.metricsRow}>
                  <View style={styles.metricCell}>
                    <EditorialText variant="headlineMedium" tone="forest">
                      {data.summaryCounts.expiringDocumentsSoon}
                    </EditorialText>
                    <EditorialText variant="caption" tone="muted">
                      Expiring soon
                    </EditorialText>
                  </View>
                  <View style={styles.metricCell}>
                    <EditorialText variant="headlineMedium" tone="forest">
                      {data.summaryCounts.pendingTasksToday}
                    </EditorialText>
                    <EditorialText variant="caption" tone="muted">
                      Tasks today
                    </EditorialText>
                  </View>
                  <View style={styles.metricCell}>
                    <EditorialText variant="headlineMedium" tone="forest">
                      {data.summaryCounts.activeAssetsCount}
                    </EditorialText>
                    <EditorialText variant="caption" tone="muted">
                      Assets
                    </EditorialText>
                  </View>
                  <View style={styles.metricCell}>
                    <EditorialText variant="headlineMedium" tone="forest">
                      {data.summaryCounts.activeSubscriptionsCount}
                    </EditorialText>
                    <EditorialText variant="caption" tone="muted">
                      Renewals
                    </EditorialText>
                  </View>
                </View>
              </EditorialCard>

              {/* Recent Documents */}
              <View>
                <SectionHeader
                  indexLabel="01 · Vault"
                  title="Recent Documents"
                  subtitle="Private files stored with short-lived access control."
                  actionLabel="Open Vault"
                  onActionPress={() => router.push('/(app)/(tabs)/vault')}
                />

                {data.recentDocuments.length === 0 ? (
                  <EmptyState
                    icon={<FileText size={26} strokeWidth={1.6} color={theme.colors.m3.primary} />}
                    title="Your Vault is ready"
                    description="Scan a receipt, upload an ID, or save an academic certificate to start."
                    actionLabel="Scan First Document"
                    onAction={() => router.push('/(app)/scanner')}
                  />
                ) : (
                  <View style={{ gap: theme.spacing.sm }}>
                    {data.recentDocuments.map((doc) => (
                      <EditorialCard
                        key={doc.id}
                        variant="outlined"
                        onPress={() => router.push(`/(app)/documents/${doc.id}`)}
                      >
                        <View style={styles.docRow}>
                          <View
                            style={[
                              styles.docIconBox,
                              {
                                backgroundColor: theme.colors.m3.surfaceContainer,
                                borderRadius: theme.shapes.small,
                              },
                            ]}
                          >
                            <FileText
                              size={18}
                              strokeWidth={1.75}
                              color={theme.colors.m3.primary}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <EditorialText variant="cardHeading" tone="primary" numberOfLines={1}>
                              {doc.title}
                            </EditorialText>
                            <EditorialText variant="caption" tone="muted" numberOfLines={1}>
                              {doc.category.name} ·{' '}
                              {Math.max(1, Math.round(doc.fileSizeBytes / 1024))} KB
                            </EditorialText>
                          </View>
                          <Badge label={doc.processingStatus.replace('_', ' ')} tone="sage" />
                        </View>
                      </EditorialCard>
                    ))}
                  </View>
                )}
              </View>

              {/* Upcoming & Expiring Snapshot */}
              <View>
                <SectionHeader
                  indexLabel="02 · Attention"
                  title="Deadlines & Expiring Items"
                  subtitle="Upcoming dates surfaced from your records."
                />
                {data.expiringDocuments.length === 0 &&
                data.todaysTasks.length === 0 &&
                !data.upcomingEvent &&
                data.warrantyReminders.length === 0 &&
                data.subscriptionRenewals.length === 0 ? (
                  <EditorialCard variant="secondary">
                    <EditorialText variant="bodySmall" tone="secondary">
                      No urgent expirations, tasks, or renewals right now.
                    </EditorialText>
                  </EditorialCard>
                ) : (
                  <EditorialCard variant="outlined" style={{ gap: theme.spacing.sm }}>
                    {data.expiringDocuments.map((doc) => (
                      <Pressable
                        key={doc.id}
                        onPress={() => router.push(`/(app)/documents/${doc.id}`)}
                        style={styles.attentionRow}
                      >
                        <CalendarClock
                          size={18}
                          strokeWidth={1.75}
                          color={theme.colors.status.warning}
                        />
                        <View style={{ flex: 1 }}>
                          <EditorialText variant="bodyMedium" tone="primary">
                            {doc.title}
                          </EditorialText>
                          <EditorialText variant="caption" tone="muted">
                            Expires {doc.expiryDate}
                          </EditorialText>
                        </View>
                        <Badge label="Expiring" tone="warning" />
                      </Pressable>
                    ))}
                  </EditorialCard>
                )}
              </View>

              {/* Weekly Activity Overview */}
              {data.weeklyActivity.length > 0 ? (
                <View>
                  <SectionHeader
                    indexLabel="03 · Rhythm"
                    title="Weekly Activity"
                    subtitle="Documents filed and tasks completed over the past 7 days."
                  />
                  <EditorialCard variant="secondary">
                    <View style={styles.weekGrid}>
                      {data.weeklyActivity.map((day) => {
                        const total = day.documentsAdded + day.tasksCompleted;
                        const barHeight = Math.min(48, 8 + total * 12);
                        return (
                          <View key={day.date} style={styles.weekCol}>
                            <View style={styles.barTrack}>
                              <View
                                style={[
                                  styles.barFill,
                                  {
                                    height: barHeight,
                                    backgroundColor:
                                      total > 0
                                        ? theme.colors.m3.primary
                                        : theme.colors.m3.outlineVariant,
                                    borderRadius: theme.shapes.extraSmall,
                                  },
                                ]}
                              />
                            </View>
                            <EditorialText variant="caption" tone="muted">
                              {day.label}
                            </EditorialText>
                          </View>
                        );
                      })}
                    </View>
                  </EditorialCard>
                </View>
              ) : null}
            </View>
          ) : null}

          <View style={{ height: 84 }} />
        </ScrollView>
      </Screen>

      <ExpressiveFAB
        icon={<Camera size={22} strokeWidth={2} color={theme.colors.m3.onPrimary} />}
        label="Scan"
        accessibilityLabel="Scan document"
        onPress={() => router.push('/(app)/scanner')}
        style={styles.fabPosition}
      />

      {/* Quick Actions Modal Sheet */}
      <Modal
        visible={quickSheetOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setQuickSheetOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setQuickSheetOpen(false)}>
          <Pressable
            style={[
              styles.modalSheet,
              {
                backgroundColor: theme.colors.m3.surfaceContainerLowest,
                borderTopLeftRadius: theme.shapes.extraLarge,
                borderTopRightRadius: theme.shapes.extraLarge,
                padding: theme.spacing.xl,
              },
            ]}
          >
            <EditorialText variant="editorialEyebrow" tone="secondaryForest" uppercase>
              Quick Actions
            </EditorialText>
            <EditorialText
              variant="headlineMedium"
              tone="primary"
              style={{ marginTop: 4, marginBottom: theme.spacing.lg }}
            >
              Add to LifeOS
            </EditorialText>

            <View style={{ gap: theme.spacing.sm }}>
              <Button
                label="Scan Document with Camera"
                variant="filled"
                fullWidth
                leftIcon={<Camera size={18} color={theme.colors.m3.onPrimary} />}
                onPress={() => {
                  setQuickSheetOpen(false);
                  router.push('/(app)/scanner');
                }}
              />
              <Button
                label="Upload PDF or Image to Vault"
                variant="tonal"
                fullWidth
                leftIcon={<Upload size={18} color={theme.colors.m3.onSecondaryContainer} />}
                onPress={() => {
                  setQuickSheetOpen(false);
                  router.push('/(app)/(tabs)/vault');
                }}
              />
              <View style={styles.sheetNoteGrid}>
                <Button
                  label="Tasks (Day 4)"
                  variant="outlined"
                  size="sm"
                  leftIcon={<CheckSquare size={15} color={theme.colors.m3.primary} />}
                  onPress={() => {
                    setQuickSheetOpen(false);
                    router.push('/(app)/(tabs)/calendar');
                  }}
                />
                <Button
                  label="Assets (Day 4)"
                  variant="outlined"
                  size="sm"
                  leftIcon={<Laptop size={15} color={theme.colors.m3.primary} />}
                  onPress={() => {
                    setQuickSheetOpen(false);
                    router.push('/(app)/(tabs)/assets');
                  }}
                />
                <Button
                  label="Subscriptions (Day 4)"
                  variant="outlined"
                  size="sm"
                  leftIcon={<Repeat size={15} color={theme.colors.m3.primary} />}
                  onPress={() => {
                    setQuickSheetOpen(false);
                    router.push('/(app)/(tabs)/assets');
                  }}
                />
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  topActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStrip: {
    gap: 8,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricCell: {
    alignItems: 'flex-start',
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  docIconBox: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attentionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weekGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 8,
  },
  weekCol: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  barTrack: {
    height: 52,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFill: {
    width: 14,
  },
  fabPosition: {
    position: 'absolute',
    right: 20,
    bottom: 20,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(19, 26, 23, 0.36)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    width: '100%',
  },
  sheetNoteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
});
