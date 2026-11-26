import type { UniversalSearchHitDto } from '@lifeos/shared-types';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  CalendarClock,
  CheckSquare,
  ChevronRight,
  FileText,
  Laptop,
  Repeat,
  Search as SearchIcon,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Badge,
  EditorialCard,
  EditorialText,
  EmptyState,
  ErrorState,
  FilterChip,
  LoadingState,
  Screen,
  ScreenTopBar,
  SearchBar,
} from '../../src/components/ui';
import { extractApiErrorMessage } from '../../src/services/api-client';
import { intelligenceApi } from '../../src/services/intelligence-api';
import { useTheme } from '../../src/theme';

type EntityFilter = 'all' | 'document' | 'task' | 'event' | 'asset' | 'subscription';

const TYPE_META = {
  document: { label: 'Vault', accent: 'teal' as const, icon: FileText },
  task: { label: 'Task', accent: 'violet' as const, icon: CheckSquare },
  event: { label: 'Event', accent: 'coral' as const, icon: CalendarClock },
  asset: { label: 'Asset', accent: 'cobalt' as const, icon: Laptop },
  subscription: { label: 'Subscription', accent: 'berry' as const, icon: Repeat },
} as const;

export default function UniversalSearchScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [queryText, setQueryText] = useState('');
  const [filter, setFilter] = useState<EntityFilter>('all');

  const trimmed = queryText.trim();
  const searchQuery = useQuery({
    queryKey: ['universal-search', trimmed],
    queryFn: () => intelligenceApi.universalSearch(trimmed, 10),
    enabled: trimmed.length >= 2,
  });

  const hits: UniversalSearchHitDto[] = (() => {
    const data = searchQuery.data;
    if (!data) return [];
    const merged = [
      ...data.documents,
      ...data.tasks,
      ...data.events,
      ...data.assets,
      ...data.subscriptions,
    ];
    return filter === 'all' ? merged : merged.filter((item) => item.entityType === filter);
  })();

  return (
    <Screen>
      <ScreenTopBar onBack={() => router.back()} badgeLabel="Universal Search" badgeTone="cobalt" />

      <EditorialText variant="pageHeadingEditorial" tone="primary">
        Find anything.
      </EditorialText>
      <EditorialText variant="bodySmall" tone="secondary" style={{ marginTop: 4 }}>
        Search across Vault files, OCR text, tasks, calendar events, assets, and subscriptions.
      </EditorialText>

      <View style={{ marginTop: theme.spacing.md }}>
        <SearchBar
          value={queryText}
          onChangeText={setQueryText}
          placeholder="Search laptop, warranty, certificate..."
          accentColor={theme.colors.expressive.cobalt.base}
          accessibilityLabel="Universal Search Input"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{
          flexGrow: 0,
          flexShrink: 0,
          marginHorizontal: -theme.spacing.lg,
          marginTop: theme.spacing.sm,
        }}
        contentContainerStyle={[styles.chipsRow, { paddingHorizontal: theme.spacing.lg }]}
      >
        {(
          [
            { key: 'all', label: 'All', accent: 'primary' },
            { key: 'document', label: 'Vault', accent: 'teal' },
            { key: 'task', label: 'Tasks', accent: 'violet' },
            { key: 'event', label: 'Events', accent: 'coral' },
            { key: 'asset', label: 'Assets', accent: 'cobalt' },
            { key: 'subscription', label: 'Subs', accent: 'berry' },
          ] as const
        ).map((item) => (
          <FilterChip
            key={item.key}
            label={item.label}
            accent={item.accent}
            selected={filter === item.key}
            onPress={() => setFilter(item.key)}
          />
        ))}
      </ScrollView>

      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.xs }}>
        {trimmed.length < 2 ? (
          <EmptyState
            icon={<SearchIcon size={26} color={theme.colors.expressive.cobalt.base} />}
            title="Start typing to search"
            description="Enter at least 2 characters to search across your entire personal LifeOS."
          />
        ) : searchQuery.isLoading ? (
          <LoadingState message="Searching across LifeOS..." />
        ) : searchQuery.isError ? (
          <ErrorState
            message={extractApiErrorMessage(searchQuery.error)}
            onRetry={() => void searchQuery.refetch()}
          />
        ) : hits.length === 0 ? (
          <EmptyState
            icon={<SearchIcon size={26} color={theme.colors.expressive.cobalt.base} />}
            title="No matches found"
            description="Try a different keyword, product name, or category."
          />
        ) : (
          hits.map((hit) => {
            const meta = TYPE_META[hit.entityType];
            const Icon = meta.icon;
            const accent = theme.colors.expressive[meta.accent];
            return (
              <EditorialCard
                key={`${hit.entityType}-${hit.id}`}
                variant="surface"
                padding="sm"
                onPress={() => router.push(hit.route as never)}
              >
                <View style={styles.hitRow}>
                  <View
                    style={[
                      styles.iconBox,
                      {
                        backgroundColor: accent.container,
                        borderRadius: theme.shapes.medium,
                      },
                    ]}
                  >
                    <Icon size={18} strokeWidth={1.9} color={accent.base} />
                  </View>
                  <View style={styles.flexText}>
                    <EditorialText variant="cardHeading" tone="primary" numberOfLines={1}>
                      {hit.title}
                    </EditorialText>
                    <EditorialText variant="caption" tone="muted" numberOfLines={1}>
                      {hit.subtitle}
                      {hit.date ? ` · ${hit.date}` : ''}
                    </EditorialText>
                  </View>
                  <Badge label={meta.label} tone={meta.accent} />
                  <ChevronRight size={16} color={theme.colors.text.muted} />
                </View>
              </EditorialCard>
            );
          })
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chipsRow: {
    gap: 8,
    alignItems: 'center',
  },
  hitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  flexText: {
    flex: 1,
    minWidth: 0,
  },
});
