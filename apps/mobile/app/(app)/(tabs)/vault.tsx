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
  Search,
  Upload,
} from 'lucide-react-native';
import React, { useState } from 'react';
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
  TextField,
} from '../../../src/components/ui';
import { extractApiErrorMessage } from '../../../src/services/api-client';
import { vaultApi } from '../../../src/services/vault-api';
import { useTheme } from '../../../src/theme';

export default function DocumentVaultScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [searchText, setSearchText] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [showArchived, setShowArchived] = useState(false);

  const [uploadSheetOpen, setUploadSheetOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => vaultApi.listCategories(),
  });

  const documentsQuery = useQuery({
    queryKey: ['documents', { searchText, selectedCategoryId, showArchived }],
    queryFn: () =>
      vaultApi.listDocuments({
        search: searchText.trim() || undefined,
        categoryId: selectedCategoryId,
        archived: showArchived,
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

  const defaultCategoryId =
    selectedCategoryId ??
    categoriesQuery.data?.find((c) => c.slug === 'other')?.id ??
    categoriesQuery.data?.[0]?.id;

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

  const categories = categoriesQuery.data ?? [];
  const documents = documentsQuery.data?.documents ?? [];

  return (
    <View style={styles.root}>
      <Screen scroll={false}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={documentsQuery.isRefetching}
              onRefresh={() => void documentsQuery.refetch()}
              tintColor={theme.colors.m3.primary}
            />
          }
        >
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <EditorialText variant="editorialEyebrow" tone="secondaryForest" uppercase>
                Private Storage
              </EditorialText>
              <EditorialText variant="pageHeadingEditorial" tone="primary" style={{ marginTop: 4 }}>
                Document Vault
              </EditorialText>
            </View>
            <Button
              label={showArchived ? 'Archived' : 'Active'}
              variant={showArchived ? 'tonal' : 'outlined'}
              size="sm"
              shape="pill"
              onPress={() => setShowArchived((prev) => !prev)}
            />
          </View>

          <View style={{ marginTop: theme.spacing.md }}>
            <TextField
              label="Search Vault"
              placeholder="Search titles, filenames, or tags..."
              value={searchText}
              onChangeText={setSearchText}
              leftAdornment={<Search size={18} color={theme.colors.text.muted} />}
            />
          </View>

          {/* M3 Expressive Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.chipsRow, { marginTop: theme.spacing.md }]}
          >
            <FilterChip
              label="All"
              selected={!selectedCategoryId}
              onPress={() => setSelectedCategoryId(undefined)}
            />
            {categories.map((cat) => (
              <FilterChip
                key={cat.id}
                label={cat.documentCount ? `${cat.name} (${cat.documentCount})` : cat.name}
                selected={selectedCategoryId === cat.id}
                onPress={() =>
                  setSelectedCategoryId((prev) => (prev === cat.id ? undefined : cat.id))
                }
              />
            ))}
            <FilterChip
              label="+ Category"
              selected={false}
              showCheck={false}
              onPress={() => setCategoryModalOpen(true)}
            />
          </ScrollView>

          <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
            {documentsQuery.isLoading ? (
              <LoadingState message="Opening your encrypted vault..." />
            ) : documentsQuery.isError ? (
              <ErrorState
                message={extractApiErrorMessage(documentsQuery.error)}
                onRetry={() => void documentsQuery.refetch()}
              />
            ) : documents.length === 0 ? (
              <EmptyState
                icon={<FileText size={28} strokeWidth={1.6} color={theme.colors.m3.primary} />}
                title={showArchived ? 'No archived documents' : 'No documents found'}
                description={
                  searchText
                    ? 'Try clearing your search or switching categories.'
                    : 'Scan with your camera or upload a PDF or image to file it safely.'
                }
                actionLabel="Scan or Upload"
                onAction={() => setUploadSheetOpen(true)}
              />
            ) : (
              documents.map((doc) => (
                <EditorialCard
                  key={doc.id}
                  variant="outlined"
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
                      <FileText size={20} strokeWidth={1.75} color={theme.colors.m3.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <EditorialText variant="cardHeading" tone="primary" numberOfLines={1}>
                        {doc.title}
                      </EditorialText>
                      <EditorialText variant="caption" tone="muted" numberOfLines={1}>
                        {doc.category.name} · v{doc.version} ·{' '}
                        {Math.max(1, Math.round(doc.fileSizeBytes / 1024))} KB
                      </EditorialText>
                      {doc.expiryDate ? (
                        <EditorialText variant="caption" tone="warning" style={{ marginTop: 2 }}>
                          Expires {doc.expiryDate}
                        </EditorialText>
                      ) : null}
                    </View>
                    <Badge
                      label={doc.isArchived ? 'Archived' : doc.processingStatus.replace('_', ' ')}
                      tone={doc.isArchived ? 'neutral' : 'sage'}
                    />
                  </View>
                </EditorialCard>
              ))
            )}
          </View>

          <View style={{ height: 96 }} />
        </ScrollView>
      </Screen>

      <ExpressiveFAB
        icon={<Plus size={24} strokeWidth={2.2} color={theme.colors.m3.onPrimary} />}
        label="Add"
        accessibilityLabel="Add document to vault"
        onPress={() => setUploadSheetOpen(true)}
        style={styles.fabPosition}
      />

      {/* Upload / Scan Action Sheet */}
      <Modal
        visible={uploadSheetOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setUploadSheetOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setUploadSheetOpen(false)}>
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
            <EditorialText variant="editorialEyebrow" tone="secondaryForest" uppercase>
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
              <EditorialCard variant="tonal" style={{ marginBottom: theme.spacing.md }}>
                <EditorialText variant="label" tone="forest">
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
                variant="outlined"
                shape="pill"
                fullWidth
                leftIcon={<ImageIcon size={18} color={theme.colors.m3.primary} />}
                onPress={() => void handlePickImage()}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Custom Category Modal */}
      <Modal
        visible={categoryModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCategoryModalOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setCategoryModalOpen(false)}>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  chipsRow: {
    gap: 8,
    paddingVertical: 2,
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
  },
  fabPosition: {
    position: 'absolute',
    right: 20,
    bottom: 20,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(19, 26, 23, 0.38)',
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
  },
  catModalTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
