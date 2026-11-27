import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import {
  Camera,
  FileText,
  FolderPlus,
  Image as ImageIcon,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Upload,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
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
  FilterChip,
  LoadingState,
  resolveDocStatusPresentation,
  Screen,
  SearchBar,
  SegmentedControl,
  TextField,
} from '../../../src/components/ui';
import { extractApiErrorMessage } from '../../../src/services/api-client';
import { vaultApi } from '../../../src/services/vault-api';
import { useTheme } from '../../../src/theme';

type VaultScope = 'active' | 'expiring' | 'archived';

export default function DocumentVaultScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [searchText, setSearchText] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [scope, setScope] = useState<VaultScope>('active');

  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => vaultApi.listCategories(),
  });

  const showArchived = scope === 'archived';
  const expiringWithinDays = scope === 'expiring' ? 30 : undefined;

  const documentsQuery = useQuery({
    queryKey: ['documents', { searchText, selectedCategoryId, scope }],
    queryFn: () =>
      vaultApi.listDocuments({
        search: searchText.trim() || undefined,
        categoryId: selectedCategoryId,
        archived: showArchived,
        expiringWithinDays,
        limit: 50,
      }),
  });

  const createCategoryMutation = useMutation({
    mutationFn: (name: string) => vaultApi.createCategory({ name }),
    onSuccess: async (created) => {
      setNewCategoryName('');
      setCategoryModalOpen(false);
      setSelectedCategoryId(created.id);
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const categories = categoriesQuery.data ?? [];

  // Put selected and populated categories first so users immediately see relevant chips
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      if (a.id === selectedCategoryId) return -1;
      if (b.id === selectedCategoryId) return 1;
      const countA = a.documentCount ?? 0;
      const countB = b.documentCount ?? 0;
      if (countA > 0 && countB === 0) return -1;
      if (countB > 0 && countA === 0) return 1;
      return countB - countA;
    });
  }, [categories, selectedCategoryId]);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const hasActiveFilters = Boolean(selectedCategoryId || scope !== 'active' || searchText.trim());
  const filterBadgeCount = (selectedCategoryId ? 1 : 0) + (scope !== 'active' ? 1 : 0);

  const clearAllFilters = () => {
    setSearchText('');
    setSelectedCategoryId(undefined);
    setScope('active');
  };

  const defaultCategoryId =
    selectedCategoryId ?? categories.find((c) => c.slug === 'other')?.id ?? categories[0]?.id;

  const uploadPickedAsset = async (asset: {
    uri: string;
    name: string;
    mimeType: string;
    size: number;
  }) => {
    if (!defaultCategoryId) {
      setUploadError('Categories are still loading. Please try again.');
      return;
    }
    setUploadError(null);
    setUploadProgress(0.05);
    try {
      const title = asset.name.replace(/\.[^.]+$/, '') || 'Uploaded Document';
      const init = await vaultApi.initiateUpload({
        title,
        categoryId: defaultCategoryId,
        originalFilename: asset.name,
        mimeType: asset.mimeType as
          'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp' | 'image/heic',
        fileSizeBytes: Math.max(1, asset.size),
        tags: [],
      });

      await vaultApi.uploadBinaryToSignedUrl(init.uploadUrl, asset.uri, init.headers, (pct) =>
        setUploadProgress(pct),
      );

      await vaultApi.completeUpload(init.documentId);
      setUploadProgress(null);
      setUploadSheetOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['documents'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['categories'] }),
      ]);
      router.push(`/(app)/documents/${init.documentId}`);
    } catch (err) {
      setUploadProgress(null);
      setUploadError(extractApiErrorMessage(err, 'Document upload failed.'));
    }
  };

  const handlePickPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const file = result.assets[0];
    await uploadPickedAsset({
      uri: file.uri,
      name: file.name,
      mimeType: file.mimeType ?? 'application/pdf',
      size: file.size ?? 1024,
    });
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    });
    if (result.canceled || !result.assets[0]) return;
    const img = result.assets[0];
    await uploadPickedAsset({
      uri: img.uri,
      name: img.fileName ?? `photo-${Date.now()}.jpg`,
      mimeType: img.mimeType ?? 'image/jpeg',
      size: img.fileSize ?? 2048,
    });
  };

  const documents = documentsQuery.data?.documents ?? [];

  return (
    <View style={styles.root}>
      <Screen
        includeBottomInset={false}
        bottomSpacing={104}
        refreshControl={
          <RefreshControl
            refreshing={documentsQuery.isRefetching}
            onRefresh={() => void documentsQuery.refetch()}
            tintColor={theme.colors.m3.primary}
          />
        }
      >
        <View style={styles.headerRow}>
          <View style={styles.flexText}>
            <EditorialText variant="editorialEyebrow" tone="forest" uppercase>
              Private Storage
            </EditorialText>
            <EditorialText variant="pageHeadingEditorial" tone="primary" style={{ marginTop: 4 }}>
              Document Vault
            </EditorialText>
          </View>
          <Pressable
            onPress={() => setCategoryModalOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Create custom category"
            style={[
              styles.newCatPill,
              {
                backgroundColor: theme.colors.m3.primaryContainer,
                borderRadius: theme.shapes.full,
              },
            ]}
          >
            <FolderPlus size={15} strokeWidth={2.1} color={theme.colors.m3.onPrimaryContainer} />
            <EditorialText
              variant="caption"
              tone="onPrimaryContainer"
              style={{ fontFamily: theme.fonts.bodySemiBold }}
            >
              Category
            </EditorialText>
          </Pressable>
        </View>

        {/* M3 Search + Filter Bar */}
        <View style={[styles.searchFilterRow, { marginTop: theme.spacing.md }]}>
          <SearchBar
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search titles, filenames, tags..."
            accentColor={theme.colors.m3.primary}
            accessibilityLabel="Search Vault"
            style={styles.searchBarFlex}
          />
          <Pressable
            onPress={() => setFilterSheetOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Open vault filters"
            style={[
              styles.filterBtn,
              {
                backgroundColor:
                  filterBadgeCount > 0
                    ? theme.colors.m3.primaryContainer
                    : theme.colors.m3.surfaceContainerHigh,
                borderRadius: theme.shapes.full,
              },
            ]}
          >
            <SlidersHorizontal
              size={19}
              strokeWidth={2}
              color={
                filterBadgeCount > 0
                  ? theme.colors.m3.onPrimaryContainer
                  : theme.colors.m3.onSurfaceVariant
              }
            />
            {filterBadgeCount > 0 ? (
              <View
                style={[
                  styles.filterCountDot,
                  {
                    backgroundColor: theme.colors.m3.primary,
                    borderRadius: theme.shapes.full,
                  },
                ]}
              >
                <EditorialText
                  variant="caption"
                  tone="onPrimary"
                  style={{ fontSize: 10, lineHeight: 12, fontFamily: theme.fonts.bodySemiBold }}
                >
                  {filterBadgeCount}
                </EditorialText>
              </View>
            ) : null}
          </Pressable>
        </View>

        {/* Connected M3 Segmented View Scope */}
        <View style={{ marginTop: theme.spacing.sm }}>
          <SegmentedControl
            value={scope}
            onChange={setScope}
            options={[
              { value: 'active', label: 'Active', accent: 'primary' },
              { value: 'expiring', label: 'Expiring 30d', accent: 'amber' },
              { value: 'archived', label: 'Archived', accent: 'berry' },
            ]}
          />
        </View>

        {/* Full-bleed Edge-to-Edge Category Chip Strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[
            styles.horizontalStrip,
            { marginHorizontal: -theme.spacing.lg, marginTop: theme.spacing.sm },
          ]}
          contentContainerStyle={[styles.chipsRow, { paddingHorizontal: theme.spacing.lg }]}
        >
          <FilterChip
            label="All"
            accent="primary"
            selected={!selectedCategoryId}
            onPress={() => setSelectedCategoryId(undefined)}
          />
          {sortedCategories.map((cat) => {
            const countLabel =
              cat.documentCount && cat.documentCount > 0
                ? `${cat.name} (${cat.documentCount})`
                : cat.name;
            return (
              <FilterChip
                key={cat.id}
                label={countLabel}
                accent="primary"
                selected={selectedCategoryId === cat.id}
                onPress={() =>
                  setSelectedCategoryId((prev) => (prev === cat.id ? undefined : cat.id))
                }
              />
            );
          })}
        </ScrollView>

        {/* Active Filter Context Bar */}
        {hasActiveFilters ? (
          <View
            style={[
              styles.activeFilterBar,
              {
                backgroundColor: theme.colors.m3.surfaceContainerLow,
                borderRadius: theme.shapes.medium,
                marginTop: theme.spacing.sm,
              },
            ]}
          >
            <EditorialText
              variant="caption"
              tone="secondary"
              numberOfLines={1}
              style={styles.flexText}
            >
              {documents.length} result{documents.length === 1 ? '' : 's'}
              {selectedCategory ? ` · ${selectedCategory.name}` : ''}
              {scope === 'expiring' ? ' · Expiring within 30d' : ''}
              {scope === 'archived' ? ' · Archived' : ''}
            </EditorialText>
            <Pressable
              onPress={clearAllFilters}
              accessibilityRole="button"
              hitSlop={8}
              style={styles.resetPill}
            >
              <RotateCcw size={12} color={theme.colors.expressive.teal.base} />
              <EditorialText
                variant="caption"
                tone="tealVibrant"
                style={{ fontFamily: theme.fonts.bodySemiBold }}
              >
                Reset
              </EditorialText>
            </Pressable>
          </View>
        ) : null}

        <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.sm }}>
          {documentsQuery.isLoading ? (
            <LoadingState message="Opening your encrypted vault..." />
          ) : documentsQuery.isError ? (
            <ErrorState
              message={extractApiErrorMessage(documentsQuery.error)}
              onRetry={() => void documentsQuery.refetch()}
            />
          ) : documents.length === 0 ? (
            <EmptyState
              icon={<FileText size={28} strokeWidth={1.7} color={theme.colors.m3.secondary} />}
              title={
                hasActiveFilters
                  ? 'No matching documents'
                  : scope === 'archived'
                    ? 'No archived documents'
                    : 'Your Vault is empty'
              }
              description={
                hasActiveFilters
                  ? 'No files match the active search or category filter.'
                  : 'Scan with your camera or upload a PDF or image to file it safely.'
              }
              actionLabel={hasActiveFilters ? 'Reset Filters' : 'Scan or Upload'}
              onAction={hasActiveFilters ? clearAllFilters : () => setUploadSheetOpen(true)}
            />
          ) : (
            documents.map((doc) => {
              const statusBadge = resolveDocStatusPresentation(
                doc.processingStatus,
                doc.isArchived,
              );
              return (
                <EditorialCard
                  key={doc.id}
                  variant="primary"
                  padding="sm"
                  onPress={() => router.push(`/(app)/documents/${doc.id}`)}
                >
                  <View style={styles.docCardRow}>
                    <View
                      style={[
                        styles.docIcon,
                        {
                          backgroundColor: theme.colors.m3.primaryContainer,
                          borderRadius: theme.shapes.medium,
                        },
                      ]}
                    >
                      <FileText size={20} strokeWidth={1.9} color={theme.colors.m3.primary} />
                    </View>
                    <View style={styles.flexText}>
                      <EditorialText variant="cardHeading" tone="primary" numberOfLines={1}>
                        {doc.title}
                      </EditorialText>
                      <EditorialText variant="caption" tone="muted" numberOfLines={1}>
                        {doc.category.name} · v{doc.version} ·{' '}
                        {Math.max(1, Math.round(doc.fileSizeBytes / 1024))} KB
                      </EditorialText>
                      {doc.expiryDate ? (
                        <EditorialText
                          variant="caption"
                          tone="amberVibrant"
                          style={{ marginTop: 2 }}
                        >
                          Expires {doc.expiryDate}
                        </EditorialText>
                      ) : null}
                    </View>
                    <Badge label={statusBadge.label} tone={statusBadge.tone} />
                  </View>
                </EditorialCard>
              );
            })
          )}
        </View>
      </Screen>

      <ExpressiveFAB
        icon={(color) => <Plus size={24} strokeWidth={2.2} color={color} />}
        label="Add"
        tone="primary"
        accessibilityLabel="Add document to vault"
        onPress={() => setUploadSheetOpen(true)}
        style={styles.fabPosition}
      />

      {/* Full M3 Filter & Categories Sheet */}
      <ExpressiveSheetModal visible={filterSheetOpen} onClose={() => setFilterSheetOpen(false)}>
        <View style={styles.sheetHeaderRow}>
          <View>
            <EditorialText variant="editorialEyebrow" tone="tealVibrant" uppercase>
              Vault Filters
            </EditorialText>
            <EditorialText variant="headlineMedium" tone="primary" style={{ marginTop: 2 }}>
              Filter & Categories
            </EditorialText>
          </View>
          {hasActiveFilters ? (
            <Button
              label="Reset"
              variant="tonal"
              accent="coral"
              size="sm"
              shape="pill"
              onPress={clearAllFilters}
            />
          ) : null}
        </View>

        <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.md }}>
          <View>
            <EditorialText variant="label" tone="primary" style={{ marginBottom: 8 }}>
              Document Status
            </EditorialText>
            <SegmentedControl
              value={scope}
              onChange={setScope}
              options={[
                { value: 'active', label: 'Active', accent: 'teal' },
                { value: 'expiring', label: 'Expiring 30d', accent: 'amber' },
                { value: 'archived', label: 'Archived', accent: 'violet' },
              ]}
            />
          </View>

          <Divider />

          <View>
            <View style={styles.catHeaderRow}>
              <EditorialText variant="label" tone="primary">
                Categories ({categories.length})
              </EditorialText>
              <Pressable
                onPress={() => {
                  setFilterSheetOpen(false);
                  setCategoryModalOpen(true);
                }}
                hitSlop={8}
              >
                <EditorialText
                  variant="caption"
                  tone="tealVibrant"
                  style={{ fontFamily: theme.fonts.bodySemiBold }}
                >
                  + New Category
                </EditorialText>
              </Pressable>
            </View>
            <View style={styles.sheetChipsWrap}>
              <FilterChip
                label="All Categories"
                accent="primary"
                selected={!selectedCategoryId}
                onPress={() => setSelectedCategoryId(undefined)}
              />
              {categories.map((cat) => (
                <FilterChip
                  key={cat.id}
                  label={
                    cat.documentCount && cat.documentCount > 0
                      ? `${cat.name} (${cat.documentCount})`
                      : cat.name
                  }
                  accent="primary"
                  selected={selectedCategoryId === cat.id}
                  onPress={() =>
                    setSelectedCategoryId((prev) => (prev === cat.id ? undefined : cat.id))
                  }
                />
              ))}
            </View>
          </View>

          <Button
            label={`Show ${documents.length} Document${documents.length === 1 ? '' : 's'}`}
            variant="filled"
            shape="pill"
            fullWidth
            onPress={() => setFilterSheetOpen(false)}
          />
        </View>
      </ExpressiveSheetModal>

      <ExpressiveSheetModal visible={uploadSheetOpen} onClose={() => setUploadSheetOpen(false)}>
        <EditorialText variant="editorialEyebrow" tone="forest" uppercase>
          Add to Vault
        </EditorialText>
        <EditorialText
          variant="headlineMedium"
          tone="primary"
          style={{ marginTop: 4, marginBottom: theme.spacing.md }}
        >
          Capture or Upload
        </EditorialText>

        {uploadError ? (
          <EditorialCard
            shape="medium"
            padding="sm"
            style={{
              marginBottom: theme.spacing.md,
              backgroundColor: theme.colors.m3.errorContainer,
            }}
          >
            <EditorialText variant="bodySmall" tone="danger">
              {uploadError}
            </EditorialText>
          </EditorialCard>
        ) : null}

        {uploadProgress !== null ? (
          <EditorialCard variant="teal" padding="sm" style={{ marginBottom: theme.spacing.md }}>
            <EditorialText variant="label" tone="teal">
              Uploading securely... {Math.round(uploadProgress * 100)}%
            </EditorialText>
          </EditorialCard>
        ) : null}

        <View style={{ gap: theme.spacing.sm }}>
          <Button
            label="Scan Multi-Page Document (Camera)"
            variant="filled"
            shape="pill"
            fullWidth
            leftIcon={<Camera size={18} color={theme.colors.m3.onPrimary} />}
            onPress={() => {
              setUploadSheetOpen(false);
              router.push('/(app)/scanner');
            }}
          />
          <Button
            label="Upload PDF or File"
            variant="tonal"
            shape="pill"
            fullWidth
            leftIcon={<Upload size={18} color={theme.colors.m3.onSecondaryContainer} />}
            onPress={() => void handlePickPdf()}
          />
          <Button
            label="Choose Image from Gallery"
            variant="tertiary"
            shape="pill"
            fullWidth
            leftIcon={<ImageIcon size={18} color={theme.colors.m3.onTertiaryContainer} />}
            onPress={() => void handlePickImage()}
          />
        </View>
      </ExpressiveSheetModal>

      <ExpressiveSheetModal visible={categoryModalOpen} onClose={() => setCategoryModalOpen(false)}>
        <View style={styles.catModalTitle}>
          <FolderPlus size={20} color={theme.colors.m3.primary} />
          <EditorialText variant="headlineMedium" tone="primary">
            New Category
          </EditorialText>
        </View>

        <View style={{ marginTop: theme.spacing.md }}>
          <TextField
            label="Category Name"
            placeholder="e.g. University Housing"
            value={newCategoryName}
            onChangeText={setNewCategoryName}
          />
        </View>

        <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
          <Button
            label="Create Category"
            variant="filled"
            shape="pill"
            fullWidth
            loading={createCategoryMutation.isPending}
            onPress={() => {
              if (newCategoryName.trim().length >= 2) {
                createCategoryMutation.mutate(newCategoryName.trim());
              }
            }}
          />
        </View>
      </ExpressiveSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  flexText: {
    flex: 1,
    minWidth: 0,
  },
  newCatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexShrink: 0,
  },
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchBarFlex: {
    flex: 1,
    minWidth: 0,
  },
  filterBtn: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  filterCountDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontalStrip: {
    flexGrow: 0,
    flexShrink: 0,
  },
  chipsRow: {
    alignItems: 'center',
    gap: 8,
  },
  activeFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 10,
  },
  resetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  docCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  docIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  fabPosition: {
    position: 'absolute',
    right: 20,
    bottom: 16,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  catHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sheetChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catModalTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
