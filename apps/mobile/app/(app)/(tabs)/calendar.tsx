import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  FileText,
  Plus,
  Trash2,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import {
  Badge,
  Button,
  EditorialCard,
  EditorialText,
  EmptyState,
  ErrorState,
  ExpressiveFAB,
  ExpressiveSheetModal,
  FilterChip,
  LoadingState,
  Screen,
  SectionHeader,
  SegmentedControl,
  TextField,
} from '../../../src/components/ui';
import { extractApiErrorMessage } from '../../../src/services/api-client';
import { lifeApi } from '../../../src/services/life-api';
import { vaultApi } from '../../../src/services/vault-api';
import { useTheme } from '../../../src/theme';

type CalendarTabView = 'agenda' | 'week' | 'month' | 'tasks';
const WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function addDaysIso(baseIso: string, days: number): string {
  const date = new Date(`${baseIso}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export default function CalendarAndTasksScreen() {
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const todayIso = new Date().toISOString().slice(0, 10);
  const [viewMode, setViewMode] = useState<CalendarTabView>('agenda');
  const [selectedDateIso, setSelectedDateIso] = useState<string>(todayIso);
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'overdue'>('all');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createType, setCreateType] = useState<'task' | 'event' | 'reminder'>('task');
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState(todayIso);
  const [formPriority, setFormPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [formDocId, setFormDocId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const tasksQuery = useQuery({
    queryKey: ['tasks', taskFilter],
    queryFn: () =>
      lifeApi.listTasks({
        status: taskFilter === 'pending' ? 'pending' : undefined,
        overdueOnly: taskFilter === 'overdue' ? true : undefined,
      }),
  });

  const eventsQuery = useQuery({
    queryKey: ['events'],
    queryFn: () => lifeApi.listEvents(),
  });

  const remindersQuery = useQuery({
    queryKey: ['reminders'],
    queryFn: () => lifeApi.listReminders(),
  });

  const docsQuery = useQuery({
    queryKey: ['documents', 'for-linking'],
    queryFn: () => vaultApi.listDocuments({ limit: 15 }),
  });

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['tasks'] }),
      queryClient.invalidateQueries({ queryKey: ['events'] }),
      queryClient.invalidateQueries({ queryKey: ['reminders'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ]);
  };

  const completeTaskMutation = useMutation({
    mutationFn: (id: string) => lifeApi.completeTask(id),
    onSuccess: invalidateAll,
  });

  const snoozeTaskMutation = useMutation({
    mutationFn: (id: string) =>
      lifeApi.snoozeTask(id, new Date(Date.now() + 24 * 3600 * 1000).toISOString()),
    onSuccess: invalidateAll,
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => lifeApi.deleteTask(id),
    onSuccess: invalidateAll,
  });

  const completeEventMutation = useMutation({
    mutationFn: (id: string) => lifeApi.completeEvent(id),
    onSuccess: invalidateAll,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const cleanTitle = formTitle.trim();
      if (!cleanTitle) throw new Error('Title is required');
      const isoDateTime = `${formDate.trim()}T09:00:00.000Z`;

      if (createType === 'task') {
        await lifeApi.createTask({
          title: cleanTitle,
          priority: formPriority,
          dueAt: isoDateTime,
          isRecurring: false,
          sourceDocumentId: formDocId,
        });
      } else if (createType === 'event') {
        await lifeApi.createEvent({
          title: cleanTitle,
          category: 'custom',
          startAt: isoDateTime,
          allDay: false,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
          isRecurring: false,
          sourceDocumentId: formDocId,
        });
      } else {
        await lifeApi.createReminder({
          title: cleanTitle,
          remindAt: isoDateTime,
          channel: 'push',
          documentId: formDocId,
        });
      }
    },
    onSuccess: async () => {
      setFormTitle('');
      setFormDocId(null);
      setFormError(null);
      setCreateModalOpen(false);
      await invalidateAll();
    },
    onError: (err) => setFormError(extractApiErrorMessage(err)),
  });

  const events = eventsQuery.data ?? [];
  const tasks = tasksQuery.data ?? [];
  const reminders = remindersQuery.data ?? [];

  const shiftMonth = (delta: number) => {
    const base = new Date(`${selectedDateIso}T00:00:00.000Z`);
    const next = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + delta, 1));
    setSelectedDateIso(next.toISOString().slice(0, 10));
  };

  // Exact 7-column calendar weeks with blank lead/trailing padding so rows stay uniform
  const monthWeeks = useMemo(() => {
    const base = new Date(`${selectedDateIso}T00:00:00.000Z`);
    const year = base.getUTCFullYear();
    const month = base.getUTCMonth();
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();

    const flatCells: Array<{ dayNum: number; iso: string } | null> = [];
    for (let b = 0; b < firstWeekday; b++) flatCells.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      flatCells.push({ dayNum: i, iso });
    }
    while (flatCells.length % 7 !== 0) flatCells.push(null);

    const weeks: Array<Array<{ dayNum: number; iso: string } | null>> = [];
    for (let w = 0; w < flatCells.length; w += 7) {
      weeks.push(flatCells.slice(w, w + 7));
    }
    return weeks;
  }, [selectedDateIso]);

  const weekDays = useMemo(() => {
    const start = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start.getTime() + i * 86_400_000);
      return {
        iso: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
      };
    });
  }, []);

  const eventsForSelectedDay = events.filter((e) => e.startAt.slice(0, 10) === selectedDateIso);

  return (
    <View style={styles.root}>
      <Screen
        includeBottomInset={false}
        bottomSpacing={104}
        refreshControl={
          <RefreshControl
            refreshing={tasksQuery.isRefetching || eventsQuery.isRefetching}
            onRefresh={() => {
              void tasksQuery.refetch();
              void eventsQuery.refetch();
              void remindersQuery.refetch();
            }}
            tintColor={theme.colors.m3.tertiary}
          />
        }
      >
        <EditorialText variant="editorialEyebrow" tone="coralVibrant" uppercase>
          Life Calendar & Tasks
        </EditorialText>
        <EditorialText
          variant="pageHeadingEditorial"
          tone="primary"
          style={{ marginTop: 4, marginBottom: theme.spacing.md }}
        >
          Schedule & Actions
        </EditorialText>

        <View style={{ marginBottom: theme.spacing.lg }}>
          <SegmentedControl
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: 'agenda', label: 'Agenda', accent: 'coral' },
              { value: 'week', label: 'Week', accent: 'violet' },
              { value: 'month', label: 'Month', accent: 'cobalt' },
              { value: 'tasks', label: `Tasks (${tasks.length})`, accent: 'teal' },
            ]}
          />
        </View>

        {viewMode === 'week' ? (
          <EditorialCard
            variant="violet"
            shape="extraLarge"
            style={{ marginBottom: theme.spacing.lg }}
          >
            <View style={styles.weekStrip}>
              {weekDays.map((day) => {
                const selected = day.iso === selectedDateIso;
                const hasEvent = events.some((e) => e.startAt.slice(0, 10) === day.iso);
                return (
                  <Pressable
                    key={day.iso}
                    onPress={() => setSelectedDateIso(day.iso)}
                    style={[
                      styles.weekDayCell,
                      {
                        backgroundColor: selected
                          ? theme.colors.m3.primary
                          : theme.colors.m3.surfaceContainerLowest,
                        borderRadius: theme.shapes.large,
                      },
                    ]}
                  >
                    <EditorialText variant="caption" tone={selected ? 'onPrimary' : 'muted'}>
                      {day.label}
                    </EditorialText>
                    <EditorialText variant="cardHeading" tone={selected ? 'onPrimary' : 'primary'}>
                      {day.dayNum}
                    </EditorialText>
                    {hasEvent ? (
                      <View
                        style={[
                          styles.dot,
                          {
                            backgroundColor: selected
                              ? theme.colors.m3.onPrimary
                              : theme.colors.m3.tertiary,
                          },
                        ]}
                      />
                    ) : (
                      <View style={styles.dotPlaceholder} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </EditorialCard>
        ) : null}

        {viewMode === 'month' ? (
          <EditorialCard
            variant="cobalt"
            shape="extraLarge"
            style={{ marginBottom: theme.spacing.lg }}
          >
            <View style={[styles.monthHeaderRow, { marginBottom: theme.spacing.sm }]}>
              <EditorialText variant="titleMedium" tone="cobalt">
                {new Date(`${selectedDateIso}T00:00:00.000Z`).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                  timeZone: 'UTC',
                })}
              </EditorialText>
              <View style={styles.monthNavGroup}>
                <Pressable
                  onPress={() => shiftMonth(-1)}
                  accessibilityRole="button"
                  accessibilityLabel="Previous month"
                  hitSlop={6}
                  style={[
                    styles.monthNavBtn,
                    {
                      backgroundColor: theme.colors.m3.surfaceContainerLowest,
                      borderRadius: theme.shapes.full,
                    },
                  ]}
                >
                  <ChevronLeft size={16} color={theme.colors.expressive.cobalt.base} />
                </Pressable>
                <Pressable
                  onPress={() => shiftMonth(1)}
                  accessibilityRole="button"
                  accessibilityLabel="Next month"
                  hitSlop={6}
                  style={[
                    styles.monthNavBtn,
                    {
                      backgroundColor: theme.colors.m3.surfaceContainerLowest,
                      borderRadius: theme.shapes.full,
                    },
                  ]}
                >
                  <ChevronRight size={16} color={theme.colors.expressive.cobalt.base} />
                </Pressable>
              </View>
            </View>

            <View style={styles.weekRow}>
              {WEEKDAY_HEADERS.map((weekday) => (
                <View key={weekday} style={styles.monthHeaderCell}>
                  <EditorialText variant="caption" tone="cobalt">
                    {weekday}
                  </EditorialText>
                </View>
              ))}
            </View>

            <View style={{ gap: 6, marginTop: 6 }}>
              {monthWeeks.map((week, wIdx) => (
                <View key={`week-${wIdx}`} style={styles.weekRow}>
                  {week.map((cell, cIdx) => {
                    if (!cell) {
                      return <View key={`empty-${wIdx}-${cIdx}`} style={styles.monthCellSpacer} />;
                    }
                    const selected = cell.iso === selectedDateIso;
                    const isToday = cell.iso === todayIso;
                    const hasEvent = events.some((e) => e.startAt.slice(0, 10) === cell.iso);
                    return (
                      <Pressable
                        key={cell.iso}
                        onPress={() => setSelectedDateIso(cell.iso)}
                        style={[
                          styles.monthCell,
                          {
                            backgroundColor: selected
                              ? theme.colors.expressive.cobalt.base
                              : theme.colors.m3.surfaceContainerLowest,
                            borderColor:
                              isToday && !selected
                                ? theme.colors.expressive.cobalt.base
                                : 'transparent',
                            borderWidth: isToday && !selected ? 1.5 : 0,
                            borderRadius: theme.shapes.full,
                          },
                        ]}
                      >
                        <EditorialText
                          variant="caption"
                          tone={selected ? 'onPrimary' : 'primary'}
                          style={{
                            fontFamily:
                              selected || isToday
                                ? theme.fonts.bodySemiBold
                                : theme.fonts.bodyRegular,
                          }}
                        >
                          {cell.dayNum}
                        </EditorialText>
                        {hasEvent ? (
                          <View
                            style={[
                              styles.dot,
                              {
                                backgroundColor: selected
                                  ? theme.colors.m3.onPrimary
                                  : theme.colors.m3.tertiary,
                              },
                            ]}
                          />
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </EditorialCard>
        ) : null}

        {viewMode !== 'tasks' ? (
          <View style={{ gap: theme.spacing.lg }}>
            <View>
              <SectionHeader
                indexLabel="01 · Events"
                title={
                  viewMode === 'agenda' ? 'Upcoming Schedule' : `Schedule · ${selectedDateIso}`
                }
                eyebrowTone="cobaltVibrant"
              />
              {eventsQuery.isLoading ? (
                <LoadingState message="Loading calendar events..." />
              ) : eventsQuery.isError ? (
                <ErrorState
                  message={extractApiErrorMessage(eventsQuery.error)}
                  onRetry={() => void eventsQuery.refetch()}
                />
              ) : (viewMode === 'agenda' ? events : eventsForSelectedDay).length === 0 ? (
                <EmptyState
                  icon={<CalendarIcon size={26} color={theme.colors.m3.tertiary} />}
                  title="No events scheduled"
                  description="Add a deadline, renewal, or appointment to keep your week clear."
                  actionLabel="Add Event"
                  onAction={() => {
                    setCreateType('event');
                    setCreateModalOpen(true);
                  }}
                />
              ) : (
                <View style={{ gap: theme.spacing.xs }}>
                  {(viewMode === 'agenda' ? events : eventsForSelectedDay).map((evt) => (
                    <EditorialCard key={evt.id} variant="surface" padding="sm">
                      <View style={styles.rowBetween}>
                        <View style={styles.flexText}>
                          <EditorialText variant="cardHeading" tone="primary" numberOfLines={2}>
                            {evt.title}
                          </EditorialText>
                          <EditorialText variant="caption" tone="muted" numberOfLines={1}>
                            {new Date(evt.startAt).toLocaleString()} · {evt.timezone}
                          </EditorialText>
                        </View>
                        <Button
                          label="Done"
                          variant="tonal"
                          size="sm"
                          shape="pill"
                          onPress={() => completeEventMutation.mutate(evt.id)}
                        />
                      </View>
                    </EditorialCard>
                  ))}
                </View>
              )}
            </View>

            <View>
              <SectionHeader
                indexLabel="02 · Reminders"
                title="Scheduled Queue"
                subtitle="Timely alerts before deadlines arrive."
                eyebrowTone="coralVibrant"
              />
              {reminders.length === 0 ? (
                <EditorialCard variant="surface">
                  <EditorialText variant="bodySmall" tone="secondary">
                    No upcoming reminders queued yet.
                  </EditorialText>
                </EditorialCard>
              ) : (
                <View style={{ gap: theme.spacing.xs }}>
                  {reminders.map((rem) => (
                    <EditorialCard key={rem.id} variant="coral" padding="sm">
                      <View style={styles.rowBetween}>
                        <View style={[styles.rowGap, styles.flexText]}>
                          <View
                            style={[
                              styles.remIconBox,
                              {
                                backgroundColor: theme.colors.m3.surfaceContainerLowest,
                                borderRadius: theme.shapes.small,
                              },
                            ]}
                          >
                            <Bell size={16} color={theme.colors.expressive.coral.base} />
                          </View>
                          <View style={styles.flexText}>
                            <EditorialText variant="bodyMedium" tone="coral" numberOfLines={2}>
                              {rem.title}
                            </EditorialText>
                            <EditorialText variant="caption" tone="secondary" numberOfLines={1}>
                              {new Date(rem.remindAt).toLocaleString()}
                            </EditorialText>
                          </View>
                        </View>
                        <Badge label={rem.status} tone="coral" />
                      </View>
                    </EditorialCard>
                  ))}
                </View>
              )}
            </View>
          </View>
        ) : (
          <View>
            <View style={{ marginBottom: theme.spacing.md }}>
              <SegmentedControl
                value={taskFilter}
                onChange={setTaskFilter}
                options={[
                  { value: 'all', label: 'All', accent: 'violet' },
                  { value: 'pending', label: 'Pending', accent: 'teal' },
                  { value: 'overdue', label: 'Overdue', accent: 'coral' },
                ]}
              />
            </View>

            {tasksQuery.isLoading ? (
              <LoadingState message="Loading tasks..." />
            ) : tasksQuery.isError ? (
              <ErrorState
                message={extractApiErrorMessage(tasksQuery.error)}
                onRetry={() => void tasksQuery.refetch()}
              />
            ) : tasks.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 size={26} color={theme.colors.m3.secondary} />}
                title="No tasks here"
                description="Create a task or link one directly from an important Vault document."
                actionLabel="Add Task"
                onAction={() => {
                  setCreateType('task');
                  setCreateModalOpen(true);
                }}
              />
            ) : (
              <View style={{ gap: theme.spacing.xs }}>
                {tasks.map((task) => {
                  const isDone = task.status === 'completed';
                  return (
                    <EditorialCard key={task.id} variant="surface" padding="sm">
                      <View style={styles.taskRow}>
                        <Pressable
                          onPress={() => !isDone && completeTaskMutation.mutate(task.id)}
                          hitSlop={8}
                          style={styles.flexShrinkNone}
                        >
                          {isDone ? (
                            <CheckCircle2 size={22} color={theme.colors.status.success} />
                          ) : (
                            <Circle size={22} color={theme.colors.m3.primary} />
                          )}
                        </Pressable>
                        <View style={styles.flexText}>
                          <EditorialText
                            variant="cardHeading"
                            tone={isDone ? 'muted' : 'primary'}
                            numberOfLines={2}
                          >
                            {task.title}
                          </EditorialText>
                          <View style={styles.taskMeta}>
                            <Badge
                              label={task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                              tone={
                                task.priority === 'urgent' || task.priority === 'high'
                                  ? 'coral'
                                  : 'violet'
                              }
                            />
                            {task.isOverdue ? <Badge label="Overdue" tone="danger" /> : null}
                            {task.sourceDocumentTitle ? (
                              <View style={[styles.rowGap, styles.docLinkMeta]}>
                                <FileText size={12} color={theme.colors.text.muted} />
                                <EditorialText
                                  variant="caption"
                                  tone="muted"
                                  numberOfLines={1}
                                  style={{ flexShrink: 1 }}
                                >
                                  {task.sourceDocumentTitle}
                                </EditorialText>
                              </View>
                            ) : null}
                          </View>
                        </View>
                        <View style={styles.taskActions}>
                          {!isDone ? (
                            <Pressable
                              onPress={() => snoozeTaskMutation.mutate(task.id)}
                              accessibilityLabel="Snooze 24h"
                              hitSlop={8}
                            >
                              <Clock size={18} color={theme.colors.m3.secondary} />
                            </Pressable>
                          ) : null}
                          <Pressable
                            onPress={() => deleteTaskMutation.mutate(task.id)}
                            accessibilityLabel="Delete task"
                            hitSlop={8}
                          >
                            <Trash2 size={18} color={theme.colors.status.danger} />
                          </Pressable>
                        </View>
                      </View>
                    </EditorialCard>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </Screen>

      <ExpressiveFAB
        icon={(color) => <Plus size={24} color={color} />}
        label="New"
        tone="tertiary"
        accessibilityLabel="Create task, event, or reminder"
        onPress={() => setCreateModalOpen(true)}
        style={styles.fabPosition}
      />

      <ExpressiveSheetModal visible={createModalOpen} onClose={() => setCreateModalOpen(false)}>
        <EditorialText variant="headlineMedium" tone="primary">
          Add Responsibility
        </EditorialText>

        <View style={{ marginTop: 12 }}>
          <SegmentedControl
            value={createType}
            onChange={setCreateType}
            options={[
              { value: 'task', label: 'Task', accent: 'violet' },
              { value: 'event', label: 'Event', accent: 'cobalt' },
              { value: 'reminder', label: 'Reminder', accent: 'coral' },
            ]}
          />
        </View>

        {formError ? (
          <View style={{ marginTop: 12 }}>
            <ErrorState message={formError} />
          </View>
        ) : null}

        <View style={{ marginTop: 14, gap: 12 }}>
          <TextField
            label="Title"
            placeholder="e.g. Renew student transit pass"
            value={formTitle}
            onChangeText={setFormTitle}
          />

          <View style={{ gap: 8 }}>
            <TextField
              label="Date (YYYY-MM-DD)"
              placeholder="2026-12-01"
              value={formDate}
              onChangeText={setFormDate}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flexGrow: 0, flexShrink: 0 }}
              contentContainerStyle={styles.chipsRow}
            >
              {[
                { label: 'Today', offset: 0 },
                { label: 'Tomorrow', offset: 1 },
                { label: '+7 days', offset: 7 },
                { label: '+30 days', offset: 30 },
              ].map((preset) => {
                const target = addDaysIso(todayIso, preset.offset);
                return (
                  <FilterChip
                    key={preset.label}
                    label={preset.label}
                    accent="cobalt"
                    selected={formDate === target}
                    onPress={() => setFormDate(target)}
                  />
                );
              })}
            </ScrollView>
          </View>

          {createType === 'task' ? (
            <View>
              <EditorialText variant="label" tone="primary" style={{ marginBottom: 6 }}>
                Priority
              </EditorialText>
              <View style={[styles.chipsRow, { flexDirection: 'row', flexWrap: 'wrap' }]}>
                {(['low', 'medium', 'high', 'urgent'] as const).map((p) => (
                  <FilterChip
                    key={p}
                    label={p.charAt(0).toUpperCase() + p.slice(1)}
                    accent={p === 'urgent' || p === 'high' ? 'coral' : 'violet'}
                    selected={formPriority === p}
                    onPress={() => setFormPriority(p)}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {(docsQuery.data?.documents ?? []).length > 0 ? (
            <View>
              <EditorialText variant="label" tone="primary" style={{ marginBottom: 6 }}>
                Link Vault Document (Optional)
              </EditorialText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ flexGrow: 0, flexShrink: 0 }}
                contentContainerStyle={{ gap: 8, alignItems: 'center' }}
              >
                {(docsQuery.data?.documents ?? []).map((doc) => (
                  <FilterChip
                    key={doc.id}
                    label={doc.title}
                    accent="teal"
                    selected={formDocId === doc.id}
                    onPress={() => setFormDocId((prev) => (prev === doc.id ? null : doc.id))}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}

          <Button
            label="Save"
            variant="filled"
            shape="pill"
            fullWidth
            loading={createMutation.isPending}
            onPress={() => createMutation.mutate()}
          />
        </View>
      </ExpressiveSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flexText: { flex: 1, minWidth: 0 },
  flexShrinkNone: { flexShrink: 0 },
  chipsRow: { gap: 8, paddingRight: 4 },
  weekStrip: { flexDirection: 'row', gap: 6 },
  weekDayCell: { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 4 },
  monthHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthNavGroup: { flexDirection: 'row', gap: 8 },
  monthNavBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekRow: { flexDirection: 'row', gap: 6 },
  monthHeaderCell: { flex: 1, alignItems: 'center' },
  monthCellSpacer: { flex: 1, height: 40 },
  monthCell: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dot: { width: 5, height: 5, borderRadius: 3 },
  dotPlaceholder: { width: 5, height: 5 },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  remIconBox: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  docLinkMeta: { flexShrink: 1, maxWidth: '100%' },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  taskMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  taskActions: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 0 },
  fabPosition: { position: 'absolute', right: 20, bottom: 16 },
});
