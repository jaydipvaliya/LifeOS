import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { File, Paths } from 'expo-file-system';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Clock,
  Edit3,
  ExternalLink,
  FileText,
  History,
  Share2,
  Trash2,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Linking, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import {
  Badge,
  Button,
  Divider,
  EditorialCard,
  EditorialText,
  ErrorState,
  FilterChip,
  LoadingState,
  Screen,
  SectionHeader,
  TextField,
} from '../../../src/components/ui';
import { extractApiErrorMessage } from '../../../src/services/api-client';
import { vaultApi } from '../../../src/services/vault-api';
import { useTheme } from '../../../src/theme';

export default function DocumentDetailScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [editTags, setEditTags] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const detailQuery = useQuery({
    queryKey: ['documents', 'detail', id],
    queryFn: () => vaultApi.getDocumentDetail(id!),
    enabled: Boolean(id),
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => vaultApi.listCategories(),
  });

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['documents'] }),
      queryClient.invalidateQueries({ queryKey: ['documents', 'detail', id] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['categories'] }),
    ]);
  };

  const updateMutation = useMutation({
    mutationFn: () =>
      vaultApi.updateDocument(id!, {
        title: editTitle.trim(),
        categoryId: editCategoryId,
        expiryDate: editExpiryDate.trim() ? editExpiryDate.trim() : null,
        tags: editTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      }),
    onSuccess: async () => {
      setEditModalOpen(false);
      await invalidateAll();
    },
    onError: (err) => setActionError(extractApiErrorMessage(err)),
  });

  const archiveMutation = useMutation({
    mutationFn: (archived: boolean) =>
      archived ? vaultApi.restoreDocument(id!) : vaultApi.archiveDocument(id!),
    onSuccess: async () => {
      await invalidateAll();
    },
    onError: (err) => setActionError(extractApiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => vaultApi.deleteDocument(id!),
    onSuccess: async () => {
      await invalidateAll();
      router.replace('/(app)/(tabs)/vault');
    },
    onError: (err) => setActionError(extractApiErrorMessage(err)),
  });

  const handleOpenOrShare = async (mode: 'preview' | 'share') => {
    const doc = detailQuery.data;
    if (!doc) return;
    setActionError(null);
    setDownloading(true);
    try {
      const signed = await vaultApi.getDownloadUrl(doc.id);
      if (Platform.OS === 'web') {
        await Linking.openURL(signed.downloadUrl);
        return;
      }

      const targetFile = new File(Paths.cache, doc.originalFilename);
      const downloaded = await File.downloadFileAsync(signed.downloadUrl, targetFile, {
        idempotent: true,
      });

      if (mode === 'share') {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(downloaded.uri, {
            mimeType: doc.mimeType,
            dialogTitle: `Share ${doc.title}`,
          });
        } else {
          await downloaded.preview();
        }
      } else {
        await downloaded.preview();
      }

      await queryClient.invalidateQueries({ queryKey: ['documents', 'detail', id] });
    } catch (err) {
      setActionError(extractApiErrorMessage(err, 'Unable to access document file.'));
    } finally {
      setDownloading(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete document?',
      'This removes the document and deletes the private stored file permanently.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(),
        },
      ],
    );
  };

  const openEditModal = () => {
    const doc = detailQuery.data;
    if (!doc) return;
    setEditTitle(doc.title);
    setEditCategoryId(doc.category.id);
    setEditExpiryDate(doc.expiryDate ?? '');
    setEditTags(doc.tags.join(', '));
    setActionError(null);
    setEditModalOpen(true);
  };

  const doc = detailQuery.data;

  return (
    <Screen>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Back to vault"
        hitSlop={10}
        style={styles.backRow}
      >
        <ArrowLeft size={18} strokeWidth={1.75} color={theme.colors.m3.primary} />
        <EditorialText variant="label" tone="forest">
          Back
        </EditorialText>
      </Pressable>

      {detailQuery.isLoading ? (
        <View style={{ marginTop: theme.spacing.lg }}>
          <LoadingState message="Loading document record..." />
        </View>
      ) : detailQuery.isError ? (
        <View style={{ marginTop: theme.spacing.lg }}>
          <ErrorState
            message={extractApiErrorMessage(detailQuery.error)}
            onRetry={() => void detailQuery.refetch()}
          />
        </View>
      ) : doc ? (
        <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.lg }}>
          {/* Title & Category Header */}
          <View>
            <View style={styles.badgeRow}>
              <Badge label={doc.category.name} tone="sage" />
              {doc.isArchived ? <Badge label="Archived" tone="neutral" /> : null}
              {doc.expiryDate ? <Badge label={`Expires ${doc.expiryDate}`} tone="warning" /> : null}
            </View>
            <EditorialText
              variant="pageHeadingEditorial"
              tone="primary"
              style={{ marginTop: theme.spacing.sm }}
            >
              {doc.title}
            </EditorialText>
            <EditorialText variant="bodySmall" tone="muted" style={{ marginTop: 4 }}>
              Uploaded {new Date(doc.createdAt).toLocaleDateString()} · Version {doc.version}
            </EditorialText>
          </View>

          {actionError ? <ErrorState message={actionError} /> : null}

          {/* Primary Preview / Share Actions */}
          <View style={styles.actionRow}>
            <Button
              label="Preview File"
              variant="filled"
              shape="pill"
              loading={downloading}
              leftIcon={<ExternalLink size={16} color={theme.colors.m3.onPrimary} />}
              onPress={() => void handleOpenOrShare('preview')}
              style={{ flex: 1 }}
            />
            <Button
              label="Share"
              variant="tonal"
              shape="pill"
              loading={downloading}
              leftIcon={<Share2 size={16} color={theme.colors.m3.onSecondaryContainer} />}
              onPress={() => void handleOpenOrShare('share')}
            />
            <Button
              label="Edit"
              variant="outlined"
              shape="pill"
              leftIcon={<Edit3 size={16} color={theme.colors.m3.primary} />}
              onPress={openEditModal}
            />
          </View>

          {/* Metadata Card */}
          <EditorialCard variant="secondary">
            <View style={styles.metaTitleRow}>
              <FileText size={18} color={theme.colors.m3.primary} />
              <EditorialText variant="cardHeading" tone="primary">
                File Metadata
              </EditorialText>
            </View>
            <Divider style={{ marginVertical: theme.spacing.sm }} />
            <View style={{ gap: 8 }}>
              <View style={styles.metaLine}>
                <EditorialText variant="caption" tone="muted">
                  Original File
                </EditorialText>
                <EditorialText variant="bodySmall" tone="primary" numberOfLines={1}>
                  {doc.originalFilename}
                </EditorialText>
              </View>
              <View style={styles.metaLine}>
                <EditorialText variant="caption" tone="muted">
                  File Type
                </EditorialText>
                <EditorialText variant="bodySmall" tone="primary">
                  {doc.mimeType}
                </EditorialText>
              </View>
              <View style={styles.metaLine}>
                <EditorialText variant="caption" tone="muted">
                  File Size
                </EditorialText>
                <EditorialText variant="bodySmall" tone="primary">
                  {Math.max(1, Math.round(doc.fileSizeBytes / 1024))} KB
                </EditorialText>
              </View>
              {doc.tags.length > 0 ? (
                <View style={styles.tagsWrap}>
                  {doc.tags.map((tag) => (
                    <Badge key={tag} label={`#${tag}`} tone="neutral" />
                  ))}
                </View>
              ) : null}
            </View>
          </EditorialCard>

          {/* Life Intelligence / Linked Items */}
          <SectionHeader
            indexLabel="01 · Connections"
            title="Extracted & Linked Records"
            subtitle="Events, tasks, and assets linked to this document."
          />
          <EditorialCard variant="outlined">
            <EditorialText variant="bodySmall" tone="secondary">
              {doc.extractedSummary
                ? 'Verified extraction metadata attached.'
                : 'Document stored securely. Automatic AI classification & extraction arrives in Day 5.'}
            </EditorialText>
            <EditorialText variant="caption" tone="muted" style={{ marginTop: 6 }}>
              Linked Events: {doc.relatedEvents.length} · Linked Tasks: {doc.relatedTasks.length} ·
              Linked Assets: {doc.relatedAssets.length}
            </EditorialText>
          </EditorialCard>

          {/* Version & Access History */}
          <SectionHeader
            indexLabel="02 · Security"
            title="Versions & Access History"
            subtitle="Every upload and signed download URL request is audited."
          />
          <EditorialCard variant="outlined" style={{ gap: theme.spacing.sm }}>
            <View style={styles.metaTitleRow}>
              <History size={16} color={theme.colors.m3.primary} />
              <EditorialText variant="labelLarge" tone="primary">
                Versions ({doc.versions.length})
              </EditorialText>
            </View>
            {doc.versions.map((ver) => (
              <View key={ver.id} style={styles.metaLine}>
                <EditorialText variant="bodySmall" tone="primary">
                  v{ver.versionNumber} · {ver.mimeType}
                </EditorialText>
                <EditorialText variant="caption" tone="muted">
                  {new Date(ver.createdAt).toLocaleDateString()}
                </EditorialText>
              </View>
            ))}

            <Divider style={{ marginVertical: theme.spacing.xs }} />

            <View style={styles.metaTitleRow}>
              <Clock size={16} color={theme.colors.m3.primary} />
              <EditorialText variant="labelLarge" tone="primary">
                Recent Access Logs ({doc.accessHistory.length})
              </EditorialText>
            </View>
            {doc.accessHistory.slice(0, 6).map((log) => (
              <View key={log.id} style={styles.metaLine}>
                <EditorialText variant="caption" tone="secondary">
                  {log.action}
                </EditorialText>
                <EditorialText variant="caption" tone="muted">
                  {new Date(log.createdAt).toLocaleString()}
                </EditorialText>
              </View>
            ))}
          </EditorialCard>

          {/* Archive / Delete */}
          <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
            <Button
              label={doc.isArchived ? 'Restore to Active Vault' : 'Archive Document'}
              variant="tonal"
              shape="pill"
              fullWidth
              loading={archiveMutation.isPending}
              leftIcon={
                doc.isArchived ? (
                  <ArchiveRestore size={16} color={theme.colors.m3.onSecondaryContainer} />
                ) : (
                  <Archive size={16} color={theme.colors.m3.onSecondaryContainer} />
                )
              }
              onPress={() => archiveMutation.mutate(doc.isArchived)}
            />
            <Button
              label="Delete Document"
              variant="destructive"
              shape="pill"
              fullWidth
              loading={deleteMutation.isPending}
              leftIcon={<Trash2 size={16} color={theme.colors.m3.error} />}
              onPress={confirmDelete}
            />
          </View>
        </View>
      ) : null}

      {/* Edit Metadata Modal */}
      <Modal
        visible={editModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setEditModalOpen(false)}>
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
              Edit Document Details
            </EditorialText>

            <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.md }}>
              <TextField label="Title" value={editTitle} onChangeText={setEditTitle} />
              <TextField
                label="Expiry Date (YYYY-MM-DD, optional)"
                placeholder="2028-05-31"
                value={editExpiryDate}
                onChangeText={setEditExpiryDate}
              />
              <TextField
                label="Tags (comma-separated)"
                placeholder="laptop, apple, warranty"
                value={editTags}
                onChangeText={setEditTags}
              />

              <View>
                <EditorialText variant="label" tone="primary" style={{ marginBottom: 6 }}>
                  Category
                </EditorialText>
                <View style={styles.catChips}>
                  {(categoriesQuery.data ?? []).map((cat) => (
                    <FilterChip
                      key={cat.id}
                      label={cat.name}
                      selected={editCategoryId === cat.id}
                      onPress={() => setEditCategoryId(cat.id)}
                    />
                  ))}
                </View>
              </View>

              <Button
                label="Save Changes"
                variant="filled"
                shape="pill"
                fullWidth
                loading={updateMutation.isPending}
                onPress={() => updateMutation.mutate()}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(19, 26, 23, 0.38)',
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
  },
  catChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
