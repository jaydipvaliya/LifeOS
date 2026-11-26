import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { File } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Camera,
  Check,
  Crop,
  Image as ImageIcon,
  RotateCw,
  Trash2,
  Zap,
  ZapOff,
} from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  Badge,
  Button,
  EditorialCard,
  EditorialText,
  ErrorState,
  FilterChip,
  Screen,
  TextField,
} from '../../src/components/ui';
import { extractApiErrorMessage } from '../../src/services/api-client';
import { vaultApi } from '../../src/services/vault-api';
import { useTheme } from '../../src/theme';

interface ScannedPage {
  id: string;
  uri: string;
  width: number;
  height: number;
}

export default function DocumentScannerScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const cameraRef = useRef<CameraView | null>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [reviewMode, setReviewMode] = useState(false);

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState('');
  const [exportAsPdf, setExportAsPdf] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusLabel, setStatusLabel] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => vaultApi.listCategories(),
  });

  const categories = categoriesQuery.data ?? [];
  const activeCategoryId =
    categoryId ||
    categories.find((c) => c.slug === 'purchase-receipts')?.id ||
    categories[0]?.id ||
    '';

  const optimizeCapturedImage = async (uri: string): Promise<ScannedPage> => {
    const manipulated = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 1600 } }], {
      compress: 0.86,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    return {
      id: `${Date.now()}-${Math.random()}`,
      uri: manipulated.uri,
      width: manipulated.width,
      height: manipulated.height,
    };
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    setErrorText(null);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
      });
      if (!photo?.uri) return;
      const optimized = await optimizeCapturedImage(photo.uri);
      setPages((prev) => {
        const next = [...prev, optimized];
        setSelectedIndex(next.length - 1);
        return next;
      });
    } catch (err) {
      setErrorText(extractApiErrorMessage(err, 'Camera capture failed.'));
    }
  };

  const handlePickFromGallery = async () => {
    setErrorText(null);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.9,
    });
    if (result.canceled || result.assets.length === 0) return;
    const processed: ScannedPage[] = [];
    for (const asset of result.assets) {
      processed.push(await optimizeCapturedImage(asset.uri));
    }
    setPages((prev) => {
      const next = [...prev, ...processed];
      setSelectedIndex(next.length - 1);
      return next;
    });
    setReviewMode(true);
  };

  const handleRotatePage = async () => {
    const current = pages[selectedIndex];
    if (!current) return;
    const rotated = await ImageManipulator.manipulateAsync(current.uri, [{ rotate: 90 }], {
      compress: 0.88,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    setPages((prev) =>
      prev.map((p, idx) =>
        idx === selectedIndex
          ? { ...p, uri: rotated.uri, width: rotated.width, height: rotated.height }
          : p,
      ),
    );
  };

  const handleCropCenterPage = async () => {
    const current = pages[selectedIndex];
    if (!current) return;
    const marginX = Math.floor(current.width * 0.06);
    const marginY = Math.floor(current.height * 0.06);
    const cropped = await ImageManipulator.manipulateAsync(
      current.uri,
      [
        {
          crop: {
            originX: marginX,
            originY: marginY,
            width: Math.max(100, current.width - marginX * 2),
            height: Math.max(100, current.height - marginY * 2),
          },
        },
      ],
      { compress: 0.88, format: ImageManipulator.SaveFormat.JPEG },
    );
    setPages((prev) =>
      prev.map((p, idx) =>
        idx === selectedIndex
          ? { ...p, uri: cropped.uri, width: cropped.width, height: cropped.height }
          : p,
      ),
    );
  };

  const handleRemovePage = () => {
    setPages((prev) => {
      const next = prev.filter((_, idx) => idx !== selectedIndex);
      setSelectedIndex(Math.max(0, next.length - 1));
      if (next.length === 0) setReviewMode(false);
      return next;
    });
  };

  const generatePdfFromPages = async (scanPages: ScannedPage[]): Promise<string> => {
    const pageHtmlSections: string[] = [];
    for (const page of scanPages) {
      const base64 = await new File(page.uri).base64();
      pageHtmlSections.push(
        `<div style="page-break-after: always; display:flex; align-items:center; justify-content:center; width:100%; height:100%;">
          <img src="data:image/jpeg;base64,${base64}" style="max-width:100%; max-height:100%; object-fit:contain;" />
        </div>`,
      );
    }
    const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;">${pageHtmlSections.join('')}</body></html>`;
    const result = await Print.printToFileAsync({ html });
    return result.uri;
  };

  const handleSaveAndUpload = async () => {
    if (pages.length === 0) return;
    if (!activeCategoryId) {
      setErrorText('Please choose a document category.');
      return;
    }

    setErrorText(null);
    setUploading(true);
    setUploadProgress(0.05);

    try {
      const shouldCreatePdf = exportAsPdf || pages.length > 1;
      let uploadUri = pages[0]!.uri;
      let mimeType: 'application/pdf' | 'image/jpeg' = 'image/jpeg';
      let ext = 'jpg';

      if (shouldCreatePdf) {
        setStatusLabel('Generating multi-page PDF...');
        uploadUri = await generatePdfFromPages(pages);
        mimeType = 'application/pdf';
        ext = 'pdf';
      }

      const fileSizeBytes = Math.max(1024, new File(uploadUri).size ?? 4096);
      const docTitle = title.trim() || `Scanned Document ${new Date().toLocaleDateString()}`;
      const filename = `${docTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.${ext}`;

      setStatusLabel('Requesting encrypted upload URL...');
      const init = await vaultApi.initiateUpload({
        title: docTitle,
        categoryId: activeCategoryId,
        originalFilename: filename,
        mimeType,
        fileSizeBytes,
        expiryDate: expiryDate.trim() ? expiryDate.trim() : null,
        tags: ['scanned'],
      });

      setStatusLabel('Uploading to private storage...');
      await vaultApi.uploadBinaryToSignedUrl(init.uploadUrl, uploadUri, init.headers, (pct) =>
        setUploadProgress(pct),
      );

      setStatusLabel('Finalizing vault record & OCR queue...');
      await vaultApi.completeUpload(init.documentId);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['documents'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['categories'] }),
      ]);

      router.replace(`/(app)/documents/${init.documentId}`);
    } catch (err) {
      setErrorText(extractApiErrorMessage(err, 'Failed to save scanned document.'));
    } finally {
      setUploading(false);
      setStatusLabel(null);
    }
  };

  if (reviewMode && pages.length > 0) {
    const activePage = pages[selectedIndex] ?? pages[0]!;
    return (
      <Screen>
        <View style={styles.reviewHeader}>
          <Pressable
            onPress={() => setReviewMode(false)}
            accessibilityRole="button"
            style={styles.backRow}
          >
            <ArrowLeft size={18} color={theme.colors.m3.primary} />
            <EditorialText variant="label" tone="forest">
              Camera
            </EditorialText>
          </Pressable>
          <Badge label={`${pages.length} page${pages.length > 1 ? 's' : ''}`} tone="sage" />
        </View>

        <EditorialText
          variant="pageHeadingEditorial"
          tone="primary"
          style={{ marginTop: theme.spacing.md }}
        >
          Review & Prepare
        </EditorialText>

        {errorText ? (
          <View style={{ marginTop: theme.spacing.md }}>
            <ErrorState message={errorText} />
          </View>
        ) : null}

        <EditorialCard variant="secondary" style={{ marginTop: theme.spacing.md, padding: 12 }}>
          <Image
            source={{ uri: activePage.uri }}
            resizeMode="contain"
            style={[styles.previewImage, { borderRadius: theme.shapes.medium }]}
          />
          <View style={[styles.editToolbar, { marginTop: theme.spacing.sm }]}>
            <Button
              label="Rotate"
              variant="outlined"
              size="sm"
              leftIcon={<RotateCw size={15} color={theme.colors.m3.primary} />}
              onPress={() => void handleRotatePage()}
            />
            <Button
              label="Trim Margins"
              variant="outlined"
              size="sm"
              leftIcon={<Crop size={15} color={theme.colors.m3.primary} />}
              onPress={() => void handleCropCenterPage()}
            />
            <Button
              label="Retake"
              variant="destructive"
              size="sm"
              leftIcon={<Trash2 size={15} color={theme.colors.m3.error} />}
              onPress={handleRemovePage}
            />
          </View>
        </EditorialCard>

        {/* Multi-page thumbnails */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, marginTop: theme.spacing.md }}
        >
          {pages.map((p, idx) => (
            <Pressable
              key={p.id}
              onPress={() => setSelectedIndex(idx)}
              style={[
                styles.thumbWrap,
                {
                  borderColor:
                    idx === selectedIndex
                      ? theme.colors.m3.primary
                      : theme.colors.m3.outlineVariant,
                  borderWidth: idx === selectedIndex ? 2 : 1,
                  borderRadius: theme.shapes.small,
                },
              ]}
            >
              <Image source={{ uri: p.uri }} style={styles.thumbImg} />
            </Pressable>
          ))}
        </ScrollView>

        <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.md }}>
          <TextField
            label="Document Title"
            placeholder="e.g. Laptop Purchase Invoice"
            value={title}
            onChangeText={setTitle}
          />
          <TextField
            label="Expiry Date (Optional, YYYY-MM-DD)"
            placeholder="2028-11-26"
            value={expiryDate}
            onChangeText={setExpiryDate}
          />

          <View>
            <EditorialText variant="label" tone="primary" style={{ marginBottom: 6 }}>
              Output Format
            </EditorialText>
            <View style={styles.chipWrap}>
              <FilterChip
                label="PDF Document"
                selected={exportAsPdf || pages.length > 1}
                onPress={() => setExportAsPdf(true)}
              />
              {pages.length === 1 ? (
                <FilterChip
                  label="Optimized JPEG"
                  selected={!exportAsPdf}
                  onPress={() => setExportAsPdf(false)}
                />
              ) : null}
            </View>
          </View>

          <View>
            <EditorialText variant="label" tone="primary" style={{ marginBottom: 6 }}>
              Category
            </EditorialText>
            <View style={styles.chipWrap}>
              {categories.map((cat) => (
                <FilterChip
                  key={cat.id}
                  label={cat.name}
                  selected={activeCategoryId === cat.id}
                  onPress={() => setCategoryId(cat.id)}
                />
              ))}
            </View>
          </View>

          {uploading ? (
            <EditorialCard variant="tonal">
              <EditorialText variant="label" tone="forest">
                {statusLabel ?? 'Uploading...'} ({Math.round(uploadProgress * 100)}%)
              </EditorialText>
            </EditorialCard>
          ) : null}

          <Button
            label="Save to Private Vault"
            variant="filled"
            shape="pill"
            size="lg"
            fullWidth
            loading={uploading}
            leftIcon={<Check size={18} color={theme.colors.m3.onPrimary} />}
            onPress={() => void handleSaveAndUpload()}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={false} contentStyle={styles.cameraContainer}>
      <View style={styles.cameraTopBar}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" style={styles.backRow}>
          <ArrowLeft size={20} color={theme.colors.m3.primary} />
          <EditorialText variant="labelLarge" tone="forest">
            Close
          </EditorialText>
        </Pressable>

        <View style={styles.cameraTopRight}>
          {pages.length > 0 ? (
            <Button
              label={`Review (${pages.length})`}
              variant="tonal"
              size="sm"
              shape="pill"
              onPress={() => setReviewMode(true)}
            />
          ) : null}
          <Pressable
            onPress={() => setFlashEnabled((prev) => !prev)}
            accessibilityRole="button"
            accessibilityLabel="Toggle flash"
            style={[
              styles.flashBtn,
              {
                backgroundColor: theme.colors.m3.surfaceContainer,
                borderRadius: theme.shapes.medium,
              },
            ]}
          >
            {flashEnabled ? (
              <Zap size={18} color={theme.colors.m3.primary} />
            ) : (
              <ZapOff size={18} color={theme.colors.text.muted} />
            )}
          </Pressable>
        </View>
      </View>

      {!permission ? (
        <EditorialCard variant="secondary" style={{ marginTop: theme.spacing.xl }}>
          <EditorialText variant="body" tone="secondary">
            Checking camera permissions...
          </EditorialText>
        </EditorialCard>
      ) : !permission.granted ? (
        <EditorialCard variant="tonal" style={{ marginTop: theme.spacing.xl, gap: 12 }}>
          <EditorialText variant="headlineMedium" tone="primary">
            Camera access needed
          </EditorialText>
          <EditorialText variant="bodySmall" tone="secondaryForest">
            Allow camera access to scan receipts, certificates, and IDs directly on your Android
            device—or pick an existing image from your gallery.
          </EditorialText>
          <Button
            label="Grant Camera Permission"
            variant="filled"
            shape="pill"
            fullWidth
            onPress={() => void requestPermission()}
          />
          <Button
            label="Choose from Gallery"
            variant="outlined"
            shape="pill"
            fullWidth
            leftIcon={<ImageIcon size={16} color={theme.colors.m3.primary} />}
            onPress={() => void handlePickFromGallery()}
          />
        </EditorialCard>
      ) : (
        <>
          <View
            style={[
              styles.cameraViewport,
              {
                borderRadius: theme.shapes.extraLarge,
                borderColor: theme.colors.m3.outlineVariant,
                borderWidth: 1,
              },
            ]}
          >
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing="back"
              enableTorch={flashEnabled}
            />
          </View>

          {errorText ? (
            <View style={{ marginTop: theme.spacing.sm }}>
              <ErrorState message={errorText} />
            </View>
          ) : null}

          <View style={styles.shutterBar}>
            <Button
              label="Gallery"
              variant="tonal"
              shape="pill"
              leftIcon={<ImageIcon size={16} color={theme.colors.m3.onSecondaryContainer} />}
              onPress={() => void handlePickFromGallery()}
            />

            <Pressable
              onPress={() => void handleCapture()}
              accessibilityRole="button"
              accessibilityLabel="Capture document page"
              style={[
                styles.shutterOuter,
                {
                  borderColor: theme.colors.m3.primary,
                },
              ]}
            >
              <View style={[styles.shutterInner, { backgroundColor: theme.colors.m3.primary }]}>
                <Camera size={24} color={theme.colors.m3.onPrimary} />
              </View>
            </Pressable>

            <Button
              label={pages.length > 0 ? `Next (${pages.length})` : 'Skip'}
              variant={pages.length > 0 ? 'filled' : 'ghost'}
              shape="pill"
              disabled={pages.length === 0}
              onPress={() => setReviewMode(true)}
            />
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cameraContainer: {
    flex: 1,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  cameraTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cameraTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flashBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cameraViewport: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#131A17',
  },
  shutterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 18,
  },
  shutterOuter: {
    width: 74,
    height: 74,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewImage: {
    width: '100%',
    height: 280,
    backgroundColor: '#131A17',
  },
  editToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  thumbWrap: {
    width: 58,
    height: 74,
    overflow: 'hidden',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
