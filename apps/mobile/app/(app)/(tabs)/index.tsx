import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  Bell,
  CalendarClock,
  Camera,
  CheckSquare,
  ChevronRight,
  FileText,
  Laptop,
  Plus,
  Repeat,
  Search,
  Sparkles,
  Upload,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import {
  Badge,
  Button,
  Divider,
  EditorialCard,
  EditorialText,
  EmptyState,
  ErrorState,
  ExpressiveFAB,
  ExpressiveSheetModal,
  LoadingState,
  Screen,
  SectionHeader,
} from '../../../src/components/ui';
import { extractApiErrorMessage } from '../../../src/services/api-client';
import { vaultApi } from '../../../src/services/vault-api';
import { flushSyncOutbox } from '../../../src/offline/sync-engine';
import { useAppUiStore } from '../../../src/stores/app-store';
import { useAuthStore } from '../../../src/stores/auth-store';
import { useTheme } from '../../../src/theme';

const DOC_ACCENTS = ['violet', 'teal', 'cobalt', 'coral', 'berry', 'amber'] as const;

function formatDocStatus(status: string): string {
  switch (status) {
    case 'completed':
      return 'Indexed';
    case 'uploaded':
      return 'Saved';
    case 'pending_extraction':
      return 'Queued';
    case 'processing':
      return 'Analyzing';
    case 'failed':
      return 'Failed';
    default:
      return status.replace(/_/g, ' ');
  }
}

export default function HomeDashboardScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { isOffline, pendingSyncCount } = useAppUiStore();
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
      <Screen
        includeBottomInset={false}
        bottomSpacing={104}
        refreshControl={
          <RefreshControl
            refreshing={dashboardQuery.isRefetching}
            onRefresh={() => void dashboardQuery.refetch()}
            tintColor={theme.colors.m3.primary}
          />
        }
      >
        {/* Expressive Top App Bar */}
        <View style={[styles.topBar, { marginBottom: theme.spacing.lg }]}>
          <View style={styles.titleColumn}>
            <EditorialText variant="editorialEyebrow" tone="forest" uppercase>
              {todayLabel}
            </EditorialText>
            <EditorialText
              variant="displayEditorial"
              tone="primary"
              numberOfLines={1}
              style={{ marginTop: 4 }}
            >
              Hello, {firstName}.
            </EditorialText>
          </View>

          <View style={styles.topActions}>
            <Pressable
              onPress={() => router.push('/(app)/search')}
              accessibilityRole="button"
              accessibilityLabel="Search LifeOS"
              style={[
                styles.iconBtn,
                {
                  backgroundColor: theme.colors.expressive.teal.container,
                  borderRadius: theme.shapes.full,
                },
              ]}
            >
              <Search size={20} strokeWidth={2} color={theme.colors.expressive.teal.onContainer} />
            </Pressable>
            <Pressable
              onPress={() => router.push('/(app)/notifications')}
              accessibilityRole="button"
              accessibilityLabel="Notifications and alerts"
              style={[
                styles.iconBtn,
                {
                  backgroundColor: theme.colors.expressive.coral.container,
                  borderRadius: theme.shapes.full,
                },
              ]}
            >
              <Bell size={20} strokeWidth={2} color={theme.colors.expressive.coral.onContainer} />
            </Pressable>
          </View>
        </View>

        {/* Colorful Expressive Quick Actions Strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0, flexShrink: 0, marginBottom: theme.spacing.lg }}
          contentContainerStyle={styles.quickStrip}
        >
          <Button
            label="Upload File"
            variant="tonal"
            accent="teal"
            size="sm"
            shape="pill"
            leftIcon={
              <Upload size={15} strokeWidth={2} color={theme.colors.expressive.teal.onContainer} />
            }
            onPress={() => router.push('/(app)/(tabs)/vault')}
          />
          <Button
            label="Tasks"
            variant="tonal"
            accent="violet"
            size="sm"
            shape="pill"
            leftIcon={
              <CheckSquare
                size={15}
                strokeWidth={2}
                color={theme.colors.expressive.violet.onContainer}
              />
            }
            onPress={() => router.push('/(app)/(tabs)/calendar')}
          />
          <Button
            label="Assets"
            variant="tonal"
            accent="cobalt"
            size="sm"
            shape="pill"
            leftIcon={
              <Laptop
                size={15}
                strokeWidth={2}
                color={theme.colors.expressive.cobalt.onContainer}
              />
            }
            onPress={() => router.push('/(app)/(tabs)/assets')}
          />
          <Button
            label="More"
            variant="tertiary"
            size="sm"
            shape="pill"
            leftIcon={
              <Plus size={15} strokeWidth={2.2} color={theme.colors.m3.onTertiaryContainer} />
            }
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
            {/* Expressive Hero Intelligence Card */}
            <EditorialCard variant="violet" shape="extraLarge" depth="hero">
              <View style={styles.heroHeader}>
                <View style={styles.heroTitleGroup}>
                  <View
                    style={[
                      styles.heroIconPill,
                      {
                        backgroundColor: theme.colors.surface.elevated,
                        borderRadius: theme.shapes.small,
                      },
                    ]}
                  >
                    <Sparkles
                      size={16}
                      strokeWidth={2}
                      color={theme.colors.expressive.violet.base}
                    />
                  </View>
                  <EditorialText variant="editorialEyebrow" tone="violetVibrant" uppercase>
                    Life Intelligence
                  </EditorialText>
                </View>
                <View
                  style={[
                    styles.heroCountPill,
                    {
                      backgroundColor: theme.colors.surface.elevated,
                      borderRadius: theme.shapes.full,
                    },
                  ]}
                >
                  <EditorialText
                    variant="caption"
                    tone="violet"
                    style={{ fontFamily: theme.fonts.bodySemiBold }}
                  >
                    {data.summaryCounts.totalDocuments} in Vault
                  </EditorialText>
                </View>
              </View>

              <EditorialText
                variant="headlineMedium"
                tone="violet"
                style={{ marginTop: theme.spacing.md }}
              >
                {data.insights[0]?.title ?? 'Everything looks calm today.'}
              </EditorialText>
              <EditorialText variant="bodySmall" tone="secondary" style={{ marginTop: 6 }}>
                {data.insights[0]?.description ??
                  'Your documents, upcoming deadlines, and warranties are organized in one place.'}
              </EditorialText>

              <View style={[styles.heroActionsRow, { marginTop: theme.spacing.md }]}>
                <Button
                  label="Ask LifeOS AI"
                  variant="filled"
                  accent="violet"
                  size="sm"
                  shape="pill"
                  leftIcon={<Sparkles size={14} color={theme.colors.m3.onPrimary} />}
                  onPress={() => router.push('/(app)/assistant')}
                />
                <Button
                  label="Search All"
                  variant="tonal"
                  accent="cobalt"
                  size="sm"
                  shape="pill"
                  leftIcon={<Search size={14} color={theme.colors.expressive.cobalt.onContainer} />}
                  onPress={() => router.push('/(app)/search')}
                />
                {isOffline || pendingSyncCount > 0 ? (
                  <Button
                    label={isOffline ? 'Offline Mode' : `Sync (${pendingSyncCount})`}
                    variant="tonal"
                    accent="amber"
                    size="sm"
                    shape="pill"
                    onPress={() => void flushSyncOutbox()}
                  />
                ) : null}
              </View>
            </EditorialCard>

            {/* Symmetric 2x2 Colorful Bento Metrics Grid */}
            <View style={{ gap: theme.spacing.sm }}>
              <View style={styles.bentoRow}>
                <EditorialCard
                  variant="coral"
                  shape="extraLarge"
                  onPress={() => router.push('/(app)/(tabs)/vault')}
                  style={styles.bentoTile}
                >
                  <View style={styles.bentoTop}>
                    <View
                      style={[
                        styles.bentoIcon,
                        {
                          backgroundColor: theme.colors.surface.elevated,
                          borderRadius: theme.shapes.small,
                        },
                      ]}
                    >
                      <CalendarClock size={16} color={theme.colors.expressive.coral.base} />
                    </View>
                    <ChevronRight size={16} color={theme.colors.expressive.coral.base} />
                  </View>
                  <EditorialText variant="display" tone="coralVibrant" style={{ marginTop: 12 }}>
                    {data.summaryCounts.expiringDocumentsSoon}
                  </EditorialText>
                  <EditorialText variant="label" tone="coral" style={{ marginTop: 2 }}>
                    Expiring Soon
                  </EditorialText>
                </EditorialCard>

                <EditorialCard
                  variant="cobalt"
                  shape="extraLarge"
                  onPress={() => router.push('/(app)/(tabs)/calendar')}
                  style={styles.bentoTile}
                >
                  <View style={styles.bentoTop}>
                    <View
                      style={[
                        styles.bentoIcon,
                        {
                          backgroundColor: theme.colors.surface.elevated,
                          borderRadius: theme.shapes.small,
                        },
                      ]}
                    >
                      <CheckSquare size={16} color={theme.colors.expressive.cobalt.base} />
                    </View>
                    <ChevronRight size={16} color={theme.colors.expressive.cobalt.base} />
                  </View>
                  <EditorialText variant="display" tone="cobaltVibrant" style={{ marginTop: 12 }}>
                    {data.summaryCounts.pendingTasksToday}
                  </EditorialText>
                  <EditorialText variant="label" tone="cobalt" style={{ marginTop: 2 }}>
                    Tasks Today
                  </EditorialText>
                </EditorialCard>
              </View>

              <View style={styles.bentoRow}>
                <EditorialCard
                  variant="teal"
                  shape="extraLarge"
                  onPress={() => router.push('/(app)/(tabs)/assets')}
                  style={styles.bentoTile}
                >
                  <View style={styles.bentoTop}>
                    <View
                      style={[
                        styles.bentoIcon,
                        {
                          backgroundColor: theme.colors.surface.elevated,
                          borderRadius: theme.shapes.small,
                        },
                      ]}
                    >
                      <Laptop size={16} color={theme.colors.expressive.teal.base} />
                    </View>
                    <ChevronRight size={16} color={theme.colors.expressive.teal.base} />
                  </View>
                  <EditorialText variant="display" tone="tealVibrant" style={{ marginTop: 12 }}>
                    {data.summaryCounts.activeAssetsCount}
                  </EditorialText>
                  <EditorialText variant="label" tone="teal" style={{ marginTop: 2 }}>
                    Tracked Assets
                  </EditorialText>
                </EditorialCard>

                <EditorialCard
                  variant="berry"
                  shape="extraLarge"
                  onPress={() => router.push('/(app)/(tabs)/assets')}
                  style={styles.bentoTile}
                >
                  <View style={styles.bentoTop}>
                    <View
                      style={[
                        styles.bentoIcon,
                        {
                          backgroundColor: theme.colors.surface.elevated,
                          borderRadius: theme.shapes.small,
                        },
                      ]}
                    >
                      <Repeat size={16} color={theme.colors.expressive.berry.base} />
                    </View>
                    <ChevronRight size={16} color={theme.colors.expressive.berry.base} />
                  </View>
                  <EditorialText variant="display" tone="berryVibrant" style={{ marginTop: 12 }}>
                    {data.summaryCounts.activeSubscriptionsCount}
                  </EditorialText>
                  <EditorialText variant="label" tone="berry" style={{ marginTop: 2 }}>
                    Active Renewals
                  </EditorialText>
                </EditorialCard>
              </View>
            </View>

            {/* Recent Documents */}
            <View>
              <SectionHeader
                indexLabel="01 · Vault"
                title="Recent Documents"
                subtitle="Private files stored with short-lived access control."
                actionLabel="Open Vault"
                onActionPress={() => router.push('/(app)/(tabs)/vault')}
                eyebrowTone="tealVibrant"
              />

              {data.recentDocuments.length === 0 ? (
                <EmptyState
                  icon={<FileText size={26} strokeWidth={1.7} color={theme.colors.m3.primary} />}
                  title="Your Vault is ready"
                  description="Scan a receipt, upload an ID, or save an academic certificate to start."
                  actionLabel="Scan First Document"
                  onAction={() => router.push('/(app)/scanner')}
                />
              ) : (
                <View style={{ gap: theme.spacing.xs }}>
                  {data.recentDocuments.map((doc, idx) => {
                    const accentKey = DOC_ACCENTS[idx % DOC_ACCENTS.length]!;
                    const accent = theme.colors.expressive[accentKey];
                    return (
                      <EditorialCard
                        key={doc.id}
                        variant="surface"
                        padding="sm"
                        shape="large"
                        onPress={() => router.push(`/(app)/documents/${doc.id}`)}
                      >
                        <View style={styles.docRow}>
                          <View
                            style={[
                              styles.docIconBox,
                              {
                                backgroundColor: accent.container,
                                borderRadius: theme.shapes.medium,
                              },
                            ]}
                          >
                            <FileText size={19} strokeWidth={1.9} color={accent.base} />
                          </View>
                          <View style={styles.flexText}>
                            <EditorialText variant="cardHeading" tone="primary" numberOfLines={1}>
                              {doc.title}
                            </EditorialText>
                            <EditorialText variant="caption" tone="muted" numberOfLines={1}>
                              {doc.category.name} ·{' '}
                              {Math.max(1, Math.round(doc.fileSizeBytes / 1024))} KB
                            </EditorialText>
                          </View>
                          <Badge label={formatDocStatus(doc.processingStatus)} tone={accentKey} />
                        </View>
                      </EditorialCard>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Upcoming & Expiring Snapshot */}
            <View>
              <SectionHeader
                indexLabel="02 · Attention"
                title="Deadlines & Expiring Items"
                subtitle="Upcoming dates surfaced from your records."
                eyebrowTone="coralVibrant"
              />
              {data.expiringDocuments.length === 0 &&
              data.todaysTasks.length === 0 &&
              !data.upcomingEvent &&
              data.warrantyReminders.length === 0 &&
              data.subscriptionRenewals.length === 0 ? (
                <EditorialCard variant="surface">
                  <EditorialText variant="bodySmall" tone="secondary">
                    No urgent expirations, tasks, or renewals right now.
                  </EditorialText>
                </EditorialCard>
              ) : (
                <EditorialCard variant="surface" padding="sm" style={{ gap: theme.spacing.sm }}>
                  {data.expiringDocuments.map((doc, i) => (
                    <View key={doc.id}>
                      {i > 0 ? <Divider style={{ marginBottom: theme.spacing.sm }} /> : null}
                      <Pressable
                        onPress={() => router.push(`/(app)/documents/${doc.id}`)}
                        style={styles.attentionRow}
                      >
                        <View
                          style={[
                            styles.miniDotIcon,
                            {
                              backgroundColor: theme.colors.expressive.amber.container,
                              borderRadius: theme.shapes.small,
                            },
                          ]}
                        >
                          <CalendarClock
                            size={16}
                            strokeWidth={1.9}
                            color={theme.colors.expressive.amber.base}
                          />
                        </View>
                        <View style={styles.flexText}>
                          <EditorialText variant="bodyMedium" tone="primary" numberOfLines={1}>
                            {doc.title}
                          </EditorialText>
                          <EditorialText variant="caption" tone="muted" numberOfLines={1}>
                            Expires {doc.expiryDate}
                          </EditorialText>
                        </View>
                        <Badge label="Expiring" tone="amber" />
                      </Pressable>
                    </View>
                  ))}
                  {data.todaysTasks.map((task) => (
                    <Pressable
                      key={task.id}
                      onPress={() => router.push('/(app)/(tabs)/calendar')}
                      style={styles.attentionRow}
                    >
                      <View
                        style={[
                          styles.miniDotIcon,
                          {
                            backgroundColor: theme.colors.expressive.violet.container,
                            borderRadius: theme.shapes.small,
                          },
                        ]}
                      >
                        <CheckSquare
                          size={16}
                          strokeWidth={1.9}
                          color={theme.colors.expressive.violet.base}
                        />
                      </View>
                      <View style={styles.flexText}>
                        <EditorialText variant="bodyMedium" tone="primary" numberOfLines={1}>
                          {task.title}
                        </EditorialText>
                        <EditorialText variant="caption" tone="muted" numberOfLines={1}>
                          Priority: {task.subtitle ?? 'medium'}
                        </EditorialText>
                      </View>
                      <Badge label="Task" tone="violet" />
                    </Pressable>
                  ))}
                  {data.warrantyReminders.map((asset) => (
                    <Pressable
                      key={asset.id}
                      onPress={() => router.push(`/(app)/assets/${asset.id}`)}
                      style={styles.attentionRow}
                    >
                      <View
                        style={[
                          styles.miniDotIcon,
                          {
                            backgroundColor: theme.colors.expressive.teal.container,
                            borderRadius: theme.shapes.small,
                          },
                        ]}
                      >
                        <Laptop
                          size={16}
                          strokeWidth={1.9}
                          color={theme.colors.expressive.teal.base}
                        />
                      </View>
                      <View style={styles.flexText}>
                        <EditorialText variant="bodyMedium" tone="primary" numberOfLines={1}>
                          {asset.title}
                        </EditorialText>
                        <EditorialText variant="caption" tone="muted" numberOfLines={1}>
                          Warranty expires {asset.date}
                        </EditorialText>
                      </View>
                      <Badge label="Warranty" tone="teal" />
                    </Pressable>
                  ))}
                  {data.subscriptionRenewals.map((sub) => (
                    <Pressable
                      key={sub.id}
                      onPress={() => router.push('/(app)/(tabs)/assets')}
                      style={styles.attentionRow}
                    >
                      <View
                        style={[
                          styles.miniDotIcon,
                          {
                            backgroundColor: theme.colors.expressive.berry.container,
                            borderRadius: theme.shapes.small,
                          },
                        ]}
                      >
                        <Repeat
                          size={16}
                          strokeWidth={1.9}
                          color={theme.colors.expressive.berry.base}
                        />
                      </View>
                      <View style={styles.flexText}>
                        <EditorialText variant="bodyMedium" tone="primary" numberOfLines={1}>
                          {sub.title}
                        </EditorialText>
                        <EditorialText variant="caption" tone="muted" numberOfLines={1}>
                          {sub.subtitle} · Renews {sub.date}
                        </EditorialText>
                      </View>
                      <Badge label="Renewal" tone="berry" />
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
                  eyebrowTone="cobaltVibrant"
                />
                <EditorialCard variant="surface">
                  <View style={styles.weekGrid}>
                    {data.weeklyActivity.map((day, idx) => {
                      const total = day.documentsAdded + day.tasksCompleted;
                      const barHeight = total > 0 ? Math.min(54, 14 + total * 12) : 10;
                      const barAccent =
                        theme.colors.expressive[DOC_ACCENTS[idx % DOC_ACCENTS.length]!].base;
                      const isToday = idx === data.weeklyActivity.length - 1;
                      return (
                        <View key={day.date} style={styles.weekCol}>
                          <EditorialText
                            variant="caption"
                            tone={total > 0 ? 'primary' : 'muted'}
                            style={{ fontSize: 11 }}
                          >
                            {total > 0 ? String(total) : ' '}
                          </EditorialText>
                          <View
                            style={[
                              styles.barTrack,
                              {
                                backgroundColor: theme.colors.m3.surfaceContainerHigh,
                                borderRadius: theme.shapes.full,
                              },
                            ]}
                          >
                            <View
                              style={[
                                styles.barFill,
                                {
                                  height: barHeight,
                                  backgroundColor:
                                    total > 0 ? barAccent : theme.colors.m3.outlineVariant,
                                  borderRadius: theme.shapes.full,
                                },
                              ]}
                            />
                          </View>
                          <EditorialText
                            variant="caption"
                            tone={isToday ? 'forest' : 'muted'}
                            style={{
                              fontFamily: isToday
                                ? theme.fonts.bodySemiBold
                                : theme.fonts.bodyRegular,
                            }}
                          >
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
      </Screen>

      <ExpressiveFAB
        icon={(color) => <Camera size={22} strokeWidth={2} color={color} />}
        label="Scan"
        accessibilityLabel="Scan document"
        onPress={() => router.push('/(app)/scanner')}
        style={styles.fabPosition}
      />

      <ExpressiveSheetModal visible={quickSheetOpen} onClose={() => setQuickSheetOpen(false)}>
        <EditorialText variant="editorialEyebrow" tone="forest" uppercase>
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
            shape="pill"
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
            accent="teal"
            shape="pill"
            fullWidth
            leftIcon={<Upload size={18} color={theme.colors.expressive.teal.onContainer} />}
            onPress={() => {
              setQuickSheetOpen(false);
              router.push('/(app)/(tabs)/vault');
            }}
          />

          {/* Symmetric 2x2 Action Tiles */}
          <View style={styles.sheetTileRow}>
            <EditorialCard
              variant="violet"
              padding="sm"
              shape="medium"
              onPress={() => {
                setQuickSheetOpen(false);
                router.push('/(app)/(tabs)/calendar');
              }}
              style={styles.sheetTile}
            >
              <CheckSquare size={18} color={theme.colors.expressive.violet.base} />
              <EditorialText variant="label" tone="violet" style={{ marginTop: 6 }}>
                Tasks & Events
              </EditorialText>
            </EditorialCard>

            <EditorialCard
              variant="cobalt"
              padding="sm"
              shape="medium"
              onPress={() => {
                setQuickSheetOpen(false);
                router.push('/(app)/(tabs)/assets');
              }}
              style={styles.sheetTile}
            >
              <Laptop size={18} color={theme.colors.expressive.cobalt.base} />
              <EditorialText variant="label" tone="cobalt" style={{ marginTop: 6 }}>
                Assets & Warranty
              </EditorialText>
            </EditorialCard>
          </View>

          <View style={styles.sheetTileRow}>
            <EditorialCard
              variant="berry"
              padding="sm"
              shape="medium"
              onPress={() => {
                setQuickSheetOpen(false);
                router.push('/(app)/(tabs)/assets');
              }}
              style={styles.sheetTile}
            >
              <Repeat size={18} color={theme.colors.expressive.berry.base} />
              <EditorialText variant="label" tone="berry" style={{ marginTop: 6 }}>
                Subscriptions
              </EditorialText>
            </EditorialCard>

            <EditorialCard
              variant="coral"
              padding="sm"
              shape="medium"
              onPress={() => {
                setQuickSheetOpen(false);
                router.push('/(app)/notifications');
              }}
              style={styles.sheetTile}
            >
              <Bell size={18} color={theme.colors.expressive.coral.base} />
              <EditorialText variant="label" tone="coral" style={{ marginTop: 6 }}>
                Notifications
              </EditorialText>
            </EditorialCard>
          </View>
        </View>
      </ExpressiveSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleColumn: {
    flex: 1,
    minWidth: 0,
  },
  topActions: {
    flexDirection: 'row',
    gap: 8,
    flexShrink: 0,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStrip: {
    gap: 8,
    paddingRight: 4,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  heroTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  heroIconPill: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCountPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  bentoTile: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  bentoTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bentoIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  docIconBox: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  miniDotIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  flexText: {
    flex: 1,
    minWidth: 0,
  },
  attentionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  weekGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  weekCol: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  barTrack: {
    width: 16,
    height: 58,
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
  },
  barFill: {
    width: 16,
  },
  fabPosition: {
    position: 'absolute',
    right: 20,
    bottom: 16,
  },
  sheetTileRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sheetTile: {
    flex: 1,
    minWidth: 0,
  },
});
