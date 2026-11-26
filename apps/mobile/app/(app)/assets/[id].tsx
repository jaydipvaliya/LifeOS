import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, FileText, Link2, Plus, ShieldCheck, Wrench } from 'lucide-react-native';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
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
import { lifeApi } from '../../../src/services/life-api';
import { vaultApi } from '../../../src/services/vault-api';
import { useTheme } from '../../../src/theme';

export default function AssetDetailScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [repairModalOpen, setRepairModalOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [issueSummary, setIssueSummary] = useState('');
  const [providerName, setProviderName] = useState('');
  const [repairDate, setRepairDate] = useState(new Date().toISOString().slice(0, 10));
  const [repairCost, setRepairCost] = useState('');

  const detailQuery = useQuery({
    queryKey: ['assets', 'detail', id],
    queryFn: () => lifeApi.getAssetDetail(id!),
    enabled: Boolean(id),
  });

  const docsQuery = useQuery({
    queryKey: ['documents', 'for-asset-linking'],
    queryFn: () => vaultApi.listDocuments({ limit: 30 }),
  });

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['assets'] }),
      queryClient.invalidateQueries({ queryKey: ['assets', 'detail', id] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ]);
  };

  const addRepairMutation = useMutation({
    mutationFn: () =>
      lifeApi.addAssetRepair(id!, {
        repairDate,
        providerName: providerName.trim() || null,
        issueSummary: issueSummary.trim(),
        cost: repairCost ? Number(repairCost) : null,
        currency: 'INR',
      }),
    onSuccess: async () => {
      setIssueSummary('');
      setProviderName('');
      setRepairCost('');
      setRepairModalOpen(false);
      await invalidateAll();
    },
  });

  const linkDocMutation = useMutation({
    mutationFn: (documentId: string) => lifeApi.linkAssetDocument(id!, documentId),
    onSuccess: async () => {
      setLinkModalOpen(false);
      await invalidateAll();
    },
  });

  const asset = detailQuery.data;

  return (
    <Screen>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        hitSlop={10}
        style={styles.backRow}
      >
        <ArrowLeft size={18} color={theme.colors.m3.primary} />
        <EditorialText variant="label" tone="forest">
          Back
        </EditorialText>
      </Pressable>

      {detailQuery.isLoading ? (
        <View style={{ marginTop: theme.spacing.lg }}>
          <LoadingState message="Loading asset record..." />
        </View>
      ) : detailQuery.isError ? (
        <View style={{ marginTop: theme.spacing.lg }}>
          <ErrorState
            message={extractApiErrorMessage(detailQuery.error)}
            onRetry={() => void detailQuery.refetch()}
          />
        </View>
      ) : asset ? (
        <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.lg }}>
          <View>
            <View style={styles.badgeRow}>
              <Badge label={asset.category} tone="sage" />
              {asset.warrantyExpirationDate ? (
                <Badge label={`Warranty until ${asset.warrantyExpirationDate}`} tone="success" />
              ) : null}
            </View>
            <EditorialText
              variant="pageHeadingEditorial"
              tone="primary"
              style={{ marginTop: theme.spacing.sm }}
            >
              {asset.name}
            </EditorialText>
            <EditorialText variant="bodySmall" tone="secondary" style={{ marginTop: 4 }}>
              {[asset.brand, asset.model, asset.serialNumber].filter(Boolean).join(' · ') ||
                'Personal Asset'}
            </EditorialText>
          </View>

          <EditorialCard variant="tonal">
            <View style={styles.rowGap}>
              <ShieldCheck size={18} color={theme.colors.m3.primary} />
              <EditorialText variant="cardHeading" tone="primary">
                Purchase & Warranty Summary
              </EditorialText>
            </View>
            <Divider style={{ marginVertical: theme.spacing.sm }} />
            <View style={{ gap: 6 }}>
              <View style={styles.metaLine}>
                <EditorialText variant="caption" tone="secondaryForest">
                  Purchase Price
                </EditorialText>
                <EditorialText variant="bodySmall" tone="primary">
                  {asset.purchasePrice
                    ? `${asset.currency} ${asset.purchasePrice}`
                    : 'Not recorded'}
                </EditorialText>
              </View>
              <View style={styles.metaLine}>
                <EditorialText variant="caption" tone="secondaryForest">
                  Warranty Expires
                </EditorialText>
                <EditorialText variant="bodySmall" tone="primary">
                  {asset.warrantyExpirationDate ?? 'Not recorded'}
                </EditorialText>
              </View>
            </View>
          </EditorialCard>

          <SectionHeader
            indexLabel="01 · Vault Links"
            title="Linked Invoices & Documents"
            actionLabel="Link Document"
            onActionPress={() => setLinkModalOpen(true)}
          />
          <EditorialCard variant="outlined" style={{ gap: theme.spacing.sm }}>
            {asset.linkedDocuments.length === 0 ? (
              <EditorialText variant="bodySmall" tone="muted">
                No documents linked yet. Attach the purchase invoice from your Vault.
              </EditorialText>
            ) : (
              asset.linkedDocuments.map((doc) => (
                <Pressable
                  key={doc.documentId}
                  onPress={() => router.push(`/(app)/documents/${doc.documentId}`)}
                  style={styles.metaLine}
                >
                  <View style={styles.rowGap}>
                    <FileText size={16} color={theme.colors.m3.primary} />
                    <EditorialText variant="bodyMedium" tone="primary">
                      {doc.title}
                    </EditorialText>
                  </View>
                  <Badge label={doc.relationType} tone="sage" />
                </Pressable>
              ))
            )}
          </EditorialCard>

          <SectionHeader
            indexLabel="02 · Service"
            title="Repair History"
            actionLabel="Add Repair"
            onActionPress={() => setRepairModalOpen(true)}
          />
          <EditorialCard variant="outlined" style={{ gap: theme.spacing.sm }}>
            {asset.repairs.length === 0 ? (
              <EditorialText variant="bodySmall" tone="muted">
                No repairs recorded for this asset.
              </EditorialText>
            ) : (
              asset.repairs.map((r) => (
                <View key={r.id} style={styles.repairItem}>
                  <View style={styles.rowGap}>
                    <Wrench size={15} color={theme.colors.m3.secondary} />
                    <EditorialText variant="bodyMedium" tone="primary">
                      {r.issueSummary}
                    </EditorialText>
                  </View>
                  <EditorialText variant="caption" tone="muted">
                    {r.repairDate} · {r.providerName ?? 'Service Center'}
                    {r.cost ? ` · ${r.currency} ${r.cost}` : ''}
                  </EditorialText>
                </View>
              ))
            )}
          </EditorialCard>
        </View>
      ) : null}

      {/* Add Repair Modal */}
      <Modal
        visible={repairModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setRepairModalOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setRepairModalOpen(false)}>
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
              Record Repair
            </EditorialText>
            <View style={{ marginTop: 14, gap: 12 }}>
              <TextField
                label="Issue / Service Summary"
                placeholder="Battery replacement"
                value={issueSummary}
                onChangeText={setIssueSummary}
              />
              <TextField
                label="Service Provider"
                placeholder="Authorized Service Center"
                value={providerName}
                onChangeText={setProviderName}
              />
              <TextField
                label="Repair Date (YYYY-MM-DD)"
                value={repairDate}
                onChangeText={setRepairDate}
              />
              <TextField
                label="Cost (INR, optional)"
                keyboardType="numeric"
                value={repairCost}
                onChangeText={setRepairCost}
              />
              <Button
                label="Save Repair"
                variant="filled"
                shape="pill"
                fullWidth
                leftIcon={<Plus size={16} color={theme.colors.m3.onPrimary} />}
                loading={addRepairMutation.isPending}
                onPress={() => {
                  if (issueSummary.trim()) addRepairMutation.mutate();
                }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Link Vault Document Modal */}
      <Modal
        visible={linkModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setLinkModalOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setLinkModalOpen(false)}>
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
            <View style={styles.rowGap}>
              <Link2 size={18} color={theme.colors.m3.primary} />
              <EditorialText variant="headlineMedium" tone="primary">
                Link Vault Document
              </EditorialText>
            </View>
            <View style={{ marginTop: 14, gap: 8 }}>
              {(docsQuery.data?.documents ?? []).length === 0 ? (
                <EditorialText variant="bodySmall" tone="muted">
                  Upload an invoice to your Vault first.
                </EditorialText>
              ) : (
                <View style={styles.chipsWrap}>
                  {(docsQuery.data?.documents ?? []).map((doc) => (
                    <FilterChip
                      key={doc.id}
                      label={doc.title}
                      selected={false}
                      showCheck={false}
                      onPress={() => linkDocMutation.mutate(doc.id)}
                    />
                  ))}
                </View>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  repairItem: { gap: 4 },
  backdrop: { flex: 1, backgroundColor: 'rgba(19, 26, 23, 0.38)', justifyContent: 'flex-end' },
  sheet: { width: '100%' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
