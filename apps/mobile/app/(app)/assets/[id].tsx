import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FileText, Link2, Plus, ShieldCheck, Wrench } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
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
      <ScreenTopBar
        onBack={() => router.back()}
        badgeLabel={asset ? asset.category : undefined}
        badgeTone="cobalt"
      />

      {detailQuery.isLoading ? (
        <View style={{ marginTop: theme.spacing.md }}>
          <LoadingState message="Loading asset record..." />
        </View>
      ) : detailQuery.isError ? (
        <View style={{ marginTop: theme.spacing.md }}>
          <ErrorState
            message={extractApiErrorMessage(detailQuery.error)}
            onRetry={() => void detailQuery.refetch()}
          />
        </View>
      ) : asset ? (
        <View style={{ gap: theme.spacing.lg }}>
          <View>
            <View style={styles.badgeRow}>
              <Badge label={asset.category} tone="cobalt" />
              {asset.warrantyExpirationDate ? (
                <Badge label={`Warranty until ${asset.warrantyExpirationDate}`} tone="teal" />
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

          <EditorialCard variant="cobalt" shape="extraLarge">
            <View style={styles.rowGap}>
              <ShieldCheck size={18} color={theme.colors.expressive.cobalt.base} />
              <EditorialText variant="cardHeading" tone="cobalt">
                Purchase & Warranty Summary
              </EditorialText>
            </View>
            <Divider style={{ marginVertical: theme.spacing.sm }} />
            <View style={{ gap: 8 }}>
              <View style={styles.metaLine}>
                <EditorialText variant="caption" tone="cobalt">
                  Purchase Price
                </EditorialText>
                <EditorialText variant="bodySmall" tone="primary">
                  {asset.purchasePrice
                    ? `${asset.currency} ${asset.purchasePrice}`
                    : 'Not recorded'}
                </EditorialText>
              </View>
              <View style={styles.metaLine}>
                <EditorialText variant="caption" tone="cobalt">
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
            eyebrowTone="tealVibrant"
          />
          <EditorialCard variant="surface" padding="sm" style={{ gap: theme.spacing.sm }}>
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
                  <View style={[styles.rowGap, styles.flexText]}>
                    <FileText size={16} color={theme.colors.expressive.teal.base} />
                    <EditorialText
                      variant="bodyMedium"
                      tone="primary"
                      numberOfLines={1}
                      style={{ flexShrink: 1 }}
                    >
                      {doc.title}
                    </EditorialText>
                  </View>
                  <Badge label={doc.relationType} tone="teal" />
                </Pressable>
              ))
            )}
          </EditorialCard>

          <SectionHeader
            indexLabel="02 · Service"
            title="Repair History"
            actionLabel="Add Repair"
            onActionPress={() => setRepairModalOpen(true)}
            eyebrowTone="amberVibrant"
          />
          <EditorialCard variant="surface" padding="sm" style={{ gap: theme.spacing.sm }}>
            {asset.repairs.length === 0 ? (
              <EditorialText variant="bodySmall" tone="muted">
                No repairs recorded for this asset.
              </EditorialText>
            ) : (
              asset.repairs.map((r) => (
                <View key={r.id} style={styles.repairItem}>
                  <View style={styles.rowGap}>
                    <Wrench size={15} color={theme.colors.expressive.amber.base} />
                    <EditorialText variant="bodyMedium" tone="primary" style={styles.flexText}>
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

      <ExpressiveSheetModal visible={repairModalOpen} onClose={() => setRepairModalOpen(false)}>
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
      </ExpressiveSheetModal>

      <ExpressiveSheetModal visible={linkModalOpen} onClose={() => setLinkModalOpen(false)}>
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
                  accent="teal"
                  selected={false}
                  showCheck={false}
                  onPress={() => linkDocMutation.mutate(doc.id)}
                />
              ))}
            </View>
          )}
        </View>
      </ExpressiveSheetModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  flexText: { flex: 1, minWidth: 0 },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  repairItem: { gap: 4 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
