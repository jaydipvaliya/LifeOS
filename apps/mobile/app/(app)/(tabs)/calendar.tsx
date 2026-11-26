import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  Plus,
  Trash2,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import {
  Badge,
  Button,
  EditorialCard,
  EditorialText,
  EmptyState,
  ErrorState,
  ExpressiveFAB,
  FilterChip,
  LoadingState,
  Screen,
  SectionHeader,
  TextField,
} from '../../../src/components/ui';
import { extractApiErrorMessage } from '../../../src/services/api-client';
import { lifeApi } from '../../../src/services/life-api';
import { vaultApi } from '../../../src/services/vault-api';
import { useTheme } from '../../../src/theme';

type CalendarTabView = 'agenda' | 'week' | 'month' | 'tasks';

export default function CalendarAndTasksScreen() {
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<CalendarTabView>('agenda');
  const [selectedDateIso, setSelectedDateIso] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'overdue'>('all');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createType, setCreateType] = useState<'task' | 'event' | 'reminder'>('task');
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
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

  const monthDays = useMemo(() => {
    const base = new Date(selectedDateIso);
    const year = base.getUTCFullYear();
    const month = base.getUTCMonth();
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const dayNum = i + 1;
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      return { dayNum, iso };
    });
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
      <Screen scroll={false}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={tasksQuery.isRefetching || eventsQuery.isRefetching}
              onRefresh={() => {
                void tasksQuery.refetch();
                void eventsQuery.refetch();
                void remindersQuery.refetch();
              }}
              tintColor={theme.colors.m3.primary}
            />
          }
        >
          <EditorialText variant="editorialEyebrow" tone="secondaryForest" uppercase>
            Life Calendar & Tasks
          </EditorialText>
          <EditorialText
            variant="pageHeadingEditorial"
            tone="primary"
            style={{ marginTop: 4, marginBottom: theme.spacing.md }}
          >
            Schedule & Actions
          </EditorialText>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.chipsRow, { marginBottom: theme.spacing.lg }]}
          >
            <FilterChip
              label="Agenda"
              selected={viewMode === 'agenda'}
              onPress={() => setViewMode('agenda')}
            />
            <FilterChip
              label="Week"
              selected={viewMode === 'week'}
              onPress={() => setViewMode('week')}
            />
            <FilterChip
              label="Month"
              selected={viewMode === 'month'}
              onPress={() => setViewMode('month')}
            />
            <FilterChip
              label={`Tasks (${tasks.length})`}
              selected={viewMode === 'tasks'}
              onPress={() => setViewMode('tasks')}
            />
          </ScrollView>

          {viewMode === 'week' ? (
            <EditorialCard variant="secondary" style={{ marginBottom: theme.spacing.lg }}>
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
                          backgroundColor: selected ? theme.colors.m3.primary : 'transparent',
                          borderRadius: theme.shapes.medium,
                        },
                      ]}
                    >
                      <EditorialText variant="caption" tone={selected ? 'inverse' : 'muted'}>
                        {day.label}
                      </EditorialText>
                      <EditorialText variant="cardHeading" tone={selected ? 'inverse' : 'primary'}>
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
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </EditorialCard>
          ) : null}

          {viewMode === 'month' ? (
            <EditorialCard variant="secondary" style={{ marginBottom: theme.spacing.lg }}>
              <EditorialText
                variant="labelLarge"
                tone="primary"
                style={{ marginBottom: theme.spacing.sm }}
              >
                {new Date(selectedDateIso).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </EditorialText>
              <View style={styles.monthGrid}>
                {monthDays.map((d) => {
                  const selected = d.iso === selectedDateIso;
                  const hasEvent = events.some((e) => e.startAt.slice(0, 10) === d.iso);
                  return (
                    <Pressable
                      key={d.iso}
                      onPress={() => setSelectedDateIso(d.iso)}
                      style={[
                        styles.monthCell,
                        {
                          backgroundColor: selected
                            ? theme.colors.m3.primary
                            : theme.colors.m3.surfaceContainerLowest,
                          borderRadius: theme.shapes.small,
                        },
                      ]}
                    >
                      <EditorialText variant="caption" tone={selected ? 'inverse' : 'primary'}>
                        {d.dayNum}
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
                    icon={<CalendarIcon size={26} color={theme.colors.m3.primary} />}
                    title="No events scheduled"
                    description="Add a deadline, renewal, or appointment to keep your week clear."
                    actionLabel="Add Event"
                    onAction={() => {
                      setCreateType('event');
                      setCreateModalOpen(true);
                    }}
                  />
                ) : (
                  <View style={{ gap: theme.spacing.sm }}>
                    {(viewMode === 'agenda' ? events : eventsForSelectedDay).map((evt) => (
                      <EditorialCard key={evt.id} variant="outlined">
                        <View style={styles.rowBetween}>
                          <View style={{ flex: 1 }}>
                            <EditorialText variant="cardHeading" tone="primary">
                              {evt.title}
                            </EditorialText>
                            <EditorialText variant="caption" tone="muted">
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
                  subtitle="Dispatched via BullMQ background scheduler."
                />
                {reminders.length === 0 ? (
                  <EditorialCard variant="secondary">
                    <EditorialText variant="bodySmall" tone="secondary">
                      No upcoming reminders queued yet.
                    </EditorialText>
                  </EditorialCard>
                ) : (
                  <View style={{ gap: theme.spacing.xs }}>
                    {reminders.map((rem) => (
                      <EditorialCard key={rem.id} variant="tonal">
                        <View style={styles.rowBetween}>
                          <View style={styles.rowGap}>
                            <Bell size={16} color={theme.colors.m3.primary} />
                            <View>
                              <EditorialText variant="bodyMedium" tone="primary">
                                {rem.title}
                              </EditorialText>
                              <EditorialText variant="caption" tone="secondaryForest">
                                {new Date(rem.remindAt).toLocaleString()}
                              </EditorialText>
                            </View>
                          </View>
                          <Badge label={rem.status} tone="sage" />
                        </View>
                      </EditorialCard>
                    ))}
                  </View>
                )}
              </View>
            </View>
          ) : (
            <View>
              <View
                style={[styles.chipsRow, { marginBottom: theme.spacing.md, flexDirection: 'row' }]}
              >
                <FilterChip
                  label="All"
                  selected={taskFilter === 'all'}
                  onPress={() => setTaskFilter('all')}
                />
                <FilterChip
                  label="Pending"
                  selected={taskFilter === 'pending'}
                  onPress={() => setTaskFilter('pending')}
                />
                <FilterChip
                  label="Overdue"
                  selected={taskFilter === 'overdue'}
                  onPress={() => setTaskFilter('overdue')}
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
                  icon={<CheckCircle2 size={26} color={theme.colors.m3.primary} />}
                  title="No tasks here"
                  description="Create a task or link one directly from an important Vault document."
                  actionLabel="Add Task"
                  onAction={() => {
                    setCreateType('task');
                    setCreateModalOpen(true);
                  }}
                />
              ) : (
                <View style={{ gap: theme.spacing.sm }}>
                  {tasks.map((task) => {
                    const isDone = task.status === 'completed';
                    return (
                      <EditorialCard key={task.id} variant="outlined">
                        <View style={styles.taskRow}>
                          <Pressable
                            onPress={() => !isDone && completeTaskMutation.mutate(task.id)}
                            hitSlop={8}
                          >
                            {isDone ? (
                              <CheckCircle2 size={22} color={theme.colors.status.success} />
                            ) : (
                              <Circle size={22} color={theme.colors.m3.primary} />
                            )}
                          </Pressable>
                          <View style={{ flex: 1 }}>
                            <EditorialText
                              variant="cardHeading"
                              tone={isDone ? 'muted' : 'primary'}
                            >
                              {task.title}
                            </EditorialText>
                            <View style={styles.taskMeta}>
                              <Badge
                                label={task.priority}
                                tone={
                                  task.priority === 'urgent' || task.priority === 'high'
                                    ? 'warning'
                                    : 'neutral'
                                }
                              />
                              {task.isOverdue ? <Badge label="Overdue" tone="danger" /> : null}
                              {task.sourceDocumentTitle ? (
                                <View style={styles.rowGap}>
                                  <FileText size={12} color={theme.colors.text.muted} />
                                  <EditorialText variant="caption" tone="muted">
                                    {task.sourceDocumentTitle}
                                  </EditorialText>
                                </View>
                              ) : null}
                            </View>
                          </View>
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
                      </EditorialCard>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          <View style={{ height: 96 }} />
        </ScrollView>
      </Screen>

      <ExpressiveFAB
        icon={<Plus size={24} color={theme.colors.m3.onPrimary} />}
        label="New"
        accessibilityLabel="Create task, event, or reminder"
        onPress={() => setCreateModalOpen(true)}
        style={styles.fabPosition}
      />

      <Modal
        visible={createModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateModalOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setCreateModalOpen(false)}>
          <Pressable
            style={[
              styles.sheet,
              {
                backgroundColor: theme.colors.m3.surfaceContainerLowest,
                borderTopLeftRadius: theme.shapes.extraLarge,
                borderTopRightRadius: theme.shapes.extraLarge,
                padding: theme.spacing.xl,
              },
            ]}
          >
            <EditorialText variant="headlineMedium" tone="primary">
              Add Responsibility
            </EditorialText>

            <View style={[styles.chipsRow, { flexDirection: 'row', marginTop: 12 }]}>
              <FilterChip
                label="Task"
                selected={createType === 'task'}
                onPress={() => setCreateType('task')}
              />
              <FilterChip
                label="Event"
                selected={createType === 'event'}
                onPress={() => setCreateType('event')}
              />
              <FilterChip
                label="Reminder"
                selected={createType === 'reminder'}
                onPress={() => setCreateType('reminder')}
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
              <TextField
                label="Date (YYYY-MM-DD)"
                placeholder="2026-12-01"
                value={formDate}
                onChangeText={setFormDate}
              />

              {createType === 'task' ? (
                <View style={[styles.chipsRow, { flexDirection: 'row', flexWrap: 'wrap' }]}>
                  {(['low', 'medium', 'high', 'urgent'] as const).map((p) => (
                    <FilterChip
                      key={p}
                      label={p}
                      selected={formPriority === p}
                      onPress={() => setFormPriority(p)}
                    />
                  ))}
                </View>
              ) : null}

              {(docsQuery.data?.documents ?? []).length > 0 ? (
                <View>
                  <EditorialText variant="caption" tone="muted" style={{ marginBottom: 6 }}>
                    Link Vault Document (Optional)
                  </EditorialText>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8 }}
                  >
                    {(docsQuery.data?.documents ?? []).map((doc) => (
                      <FilterChip
                        key={doc.id}
                        label={doc.title}
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
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  chipsRow: { gap: 8 },
  weekStrip: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  weekDayCell: { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 4 },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  monthCell: {
    width: '13%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dot: { width: 5, height: 5, borderRadius: 3 },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  taskMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  fabPosition: { position: 'absolute', right: 20, bottom: 20 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(19, 26, 23, 0.38)',
    justifyContent: 'flex-end',
  },
  sheet: { width: '100%' },
});
