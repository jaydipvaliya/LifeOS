import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { File, Paths } from 'expo-file-system';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import {
  Archive,
  ArchiveRestore,
  Clock,
  Edit3,
  ExternalLink,
  FileText,
  History,
  Share2,
  Sparkles,
  Trash2,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Linking, Platform, StyleSheet, View } from 'react-native';
import {
  Badge,
  Button,
  Divider,
  EditorialCard,
  EditorialText,
  ErrorState,
  ExpressiveSheetModal,
  FilterChip,
  LoadingState,
  Screen,
  ScreenTopBar,
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
      <ScreenTopBar
        onBack={() => router.back()}
        badgeLabel={doc ? `v${doc.version}` : undefined}
        badgeTone="teal"
      />

      {detailQuery.isLoading ? (
        <View style={{ marginTop: theme.spacing.md }}>
          <LoadingState message="Loading document record..." />
        </View>
      ) : detailQuery.isError ? (
        <View style={{ marginTop: theme.spacing.md }}>
          <ErrorState
            message={extractApiErrorMessage(detailQuery.error)}
            onRetry={() => void detailQuery.refetch()}
          />
        </View>
      ) : doc ? (
        <View style={{ gap: theme.spacing.lg }}>
          {/* Title & Category Header */}
          <View>
            <View style={styles.badgeRow}>
              <Badge label={doc.category.name} tone="teal" />
              {doc.isArchived ? <Badge label="Archived" tone="neutral" /> : null}
              {doc.expiryDate ? <Badge label={`Expires ${doc.expiryDate}`} tone="amber" /> : null}
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
              style={styles.previewActionBtn}
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
              variant="tertiary"
              shape="pill"
              leftIcon={<Edit3 size={16} color={theme.colors.m3.onTertiaryContainer} />}
              onPress={openEditModal}
            />
          </View>

          {/* Metadata Card */}
          <EditorialCard variant="violet" shape="extraLarge">
            <View style={styles.metaTitleRow}>
              <FileText size={18} color={theme.colors.expressive.violet.base} />
              <EditorialText variant="cardHeading" tone="violet">
                File Metadata
              </EditorialText>
            </View>
            <Divider style={{ marginVertical: theme.spacing.sm }} />
            <View style={{ gap: 8 }}>
              <View style={styles.metaLine}>
                <EditorialText variant="caption" tone="violet" style={styles.metaLabel}>
                  Original File
                </EditorialText>
                <EditorialText
                  variant="bodySmall"
                  tone="primary"
                  numberOfLines={1}
                  style={styles.metaValue}
                >
                  {doc.originalFilename}
                </EditorialText>
              </View>
              <View style={styles.metaLine}>
                <EditorialText variant="caption" tone="violet" style={styles.metaLabel}>
                  File Type
                </EditorialText>
                <EditorialText
                  variant="bodySmall"
                  tone="primary"
                  numberOfLines={1}
                  style={styles.metaValue}
                >
                  {doc.mimeType}
                </EditorialText>
              </View>
              <View style={styles.metaLine}>
                <EditorialText variant="caption" tone="violet" style={styles.metaLabel}>
                  File Size
                </EditorialText>
                <EditorialText variant="bodySmall" tone="primary" style={styles.metaValue}>
                  {Math.max(1, Math.round(doc.fileSizeBytes / 1024))} KB
                </EditorialText>
              </View>
              {doc.tags.length > 0 ? (
                <View style={styles.tagsWrap}>
                  {doc.tags.map((tag) => (
                    <Badge key={tag} label={`#${tag}`} tone="cobalt" />
                  ))}
                </View>
              ) : null}
            </View>
          </EditorialCard>

          {/* Life Intelligence / AI Extraction & Linked Items */}
          <SectionHeader
            indexLabel="01 · Intelligence"
            title="AI Extraction & Connections"
            subtitle="Inspect OCR extraction, verify fields, or ask LifeOS AI."
            eyebrowTone="violetVibrant"
          />
          <EditorialCard variant="violet" shape="extraLarge" style={{ gap: theme.spacing.sm }}>
            <View style={styles.metaTitleRow}>
              <Sparkles size={18} color={theme.colors.expressive.violet.base} />
              <EditorialText variant="cardHeading" tone="violet">
                {doc.processingStatus === 'verified'
                  ? 'Verified Extraction Complete'
                  : doc.processingStatus === 'needs_review'
                    ? 'Ready for Verification'
                    : 'Analyze with LifeOS AI'}
              </EditorialText>
            </View>
            <EditorialText variant="bodySmall" tone="secondary">
              {doc.extractedSummary
                ? 'Extracted fields are attached. Open review to edit fields or link warranties and reminders.'
                : 'Extract key dates, amounts, and product warranties—nothing is saved without your explicit confirmation.'}
            </EditorialText>
            <EditorialText variant="caption" tone="muted">
              Linked Events: {doc.relatedEvents.length} · Linked Tasks: {doc.relatedTasks.length} ·
              Linked Assets: {doc.relatedAssets.length}
            </EditorialText>
            <View style={styles.actionRow}>
              <Button
                label={
                  doc.processingStatus === 'verified' ? 'Review Extraction' : 'Analyze & Review'
                }
                variant="filled"
                accent="violet"
                size="sm"
                shape="pill"
                leftIcon={<Sparkles size={15} color={theme.colors.m3.onPrimary} />}
                onPress={() => router.push(`/(app)/extraction/${doc.id}`)}
              />
              <Button
                label="Ask AI"
                variant="tonal"
                accent="teal"
                size="sm"
                shape="pill"
                onPress={() => router.push(`/(app)/assistant?documentId=${doc.id}` as never)}
              />
            </View>
          </EditorialCard>

          {/* Version & Access History */}
          <SectionHeader
            indexLabel="02 · Security"
            title="Versions & Access History"
            subtitle="Every upload and signed download URL request is audited."
            eyebrowTone="cobaltVibrant"
          />
          <EditorialCard variant="surface" style={{ gap: theme.spacing.sm }}>
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

      <ExpressiveSheetModal visible={editModalOpen} onClose={() => setEditModalOpen(false)}>
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
                  accent="teal"
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
      </ExpressiveSheetModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  previewActionBtn: {
    flexGrow: 1,
    minWidth: 150,
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
  metaLabel: {
    flexShrink: 0,
  },
  metaValue: {
    flex: 1,
    minWidth: 0,
    textAlign: 'right',
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  catChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
