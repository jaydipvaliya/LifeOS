import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Laptop, Plus, Repeat, Search, ShieldCheck } from 'lucide-react-native';
import React, { useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import {
  Badge,
  Button,
  Divider,
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
import { lifeApi } from '../../../src/services/life-api';
import { useTheme } from '../../../src/theme';

export default function AssetsAndSubscriptionsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [section, setSection] = useState<'assets' | 'subscriptions'>('assets');
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [secondaryField, setSecondaryField] = useState('');
  const [amountField, setAmountField] = useState('');
  const [dateField, setDateField] = useState('2027-12-31');
  const [formError, setFormError] = useState<string | null>(null);

  const assetsQuery = useQuery({
    queryKey: ['assets', searchText],
    queryFn: () => lifeApi.listAssets(searchText.trim() || undefined),
  });

  const subsQuery = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => lifeApi.listSubscriptions(),
  });

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['assets'] }),
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error('Name is required');
      if (section === 'assets') {
        await lifeApi.createAsset({
          name: name.trim(),
          category: 'laptop',
          brand: secondaryField.trim() || null,
          purchasePrice: amountField ? Number(amountField) : null,
          currency: 'INR',
          warrantyExpirationDate: dateField.trim() || null,
          linkedDocumentIds: [],
        });
      } else {
        await lifeApi.createSubscription({
          name: name.trim(),
          provider: secondaryField.trim() || 'Provider',
          amount: Number(amountField || 199),
          currency: 'INR',
          frequency: 'monthly',
          startDate: new Date().toISOString().slice(0, 10),
          nextRenewalDate: dateField.trim() || new Date().toISOString().slice(0, 10),
        });
      }
    },
    onSuccess: async () => {
      setName('');
      setSecondaryField('');
      setAmountField('');
      setFormError(null);
      setModalOpen(false);
      await invalidateAll();
    },
    onError: (err) => setFormError(extractApiErrorMessage(err)),
  });

  const cancelSubMutation = useMutation({
    mutationFn: (id: string) => lifeApi.cancelSubscription(id),
    onSuccess: invalidateAll,
  });

  const assets = assetsQuery.data ?? [];
  const subs = subsQuery.data?.subscriptions ?? [];
  const spendSummary = subsQuery.data?.summary;

  return (
    <View style={styles.root}>
      <Screen scroll={false}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={assetsQuery.isRefetching || subsQuery.isRefetching}
              onRefresh={() => {
                void assetsQuery.refetch();
                void subsQuery.refetch();
              }}
              tintColor={theme.colors.m3.primary}
            />
          }
        >
          <EditorialText variant="editorialEyebrow" tone="secondaryForest" uppercase>
            Ownership & Spend
          </EditorialText>
          <EditorialText
            variant="pageHeadingEditorial"
            tone="primary"
            style={{ marginTop: 4, marginBottom: theme.spacing.md }}
          >
            Assets & Subscriptions
          </EditorialText>

          <View style={[styles.chipsRow, { marginBottom: theme.spacing.lg }]}>
            <FilterChip
              label={`Assets (${assets.length})`}
              selected={section === 'assets'}
              onPress={() => setSection('assets')}
            />
            <FilterChip
              label={`Subscriptions (${subs.length})`}
              selected={section === 'subscriptions'}
              onPress={() => setSection('subscriptions')}
            />
          </View>

          {section === 'assets' ? (
            <View style={{ gap: theme.spacing.md }}>
              <TextField
                label="Search Assets"
                placeholder="Search laptops, phones, serials..."
                value={searchText}
                onChangeText={setSearchText}
                leftAdornment={<Search size={18} color={theme.colors.text.muted} />}
              />

              {assetsQuery.isLoading ? (
                <LoadingState message="Loading assets and warranties..." />
              ) : assetsQuery.isError ? (
                <ErrorState
                  message={extractApiErrorMessage(assetsQuery.error)}
                  onRetry={() => void assetsQuery.refetch()}
                />
              ) : assets.length === 0 ? (
                <EmptyState
                  icon={<Laptop size={28} color={theme.colors.m3.primary} />}
                  title="No assets tracked yet"
                  description="Add your laptop, smartphone, or appliances and attach purchase invoices from your Vault."
                  actionLabel="Add Asset"
                  onAction={() => setModalOpen(true)}
                />
              ) : (
                assets.map((asset) => (
                  <EditorialCard
                    key={asset.id}
                    variant="outlined"
                    onPress={() => router.push(`/(app)/assets/${asset.id}`)}
                  >
                    <View style={styles.rowBetween}>
                      <View style={{ flex: 1 }}>
                        <EditorialText variant="cardHeading" tone="primary">
                          {asset.name}
                        </EditorialText>
                        <EditorialText variant="caption" tone="muted">
                          {asset.brand ?? asset.category} · {asset.linkedDocuments.length} doc(s) ·{' '}
                          {asset.repairsCount} repair(s)
                        </EditorialText>
                      </View>
                      {asset.warrantyExpirationDate ? (
                        <Badge label={`Warranty ${asset.warrantyExpirationDate}`} tone="sage" />
                      ) : (
                        <Badge label={asset.category} tone="neutral" />
                      )}
                    </View>
                  </EditorialCard>
                ))
              )}
            </View>
          ) : (
            <View style={{ gap: theme.spacing.md }}>
              {spendSummary ? (
                <EditorialCard variant="tonal">
                  <View style={styles.rowGap}>
                    <ShieldCheck size={18} color={theme.colors.m3.primary} />
                    <EditorialText variant="editorialEyebrow" tone="forest" uppercase>
                      Recurring Spend Summary
                    </EditorialText>
                  </View>
                  <Divider style={{ marginVertical: theme.spacing.sm }} />
                  <View style={styles.spendRow}>
                    <View>
                      <EditorialText variant="headlineMedium" tone="forest">
                        {spendSummary.currency} {spendSummary.monthlyEquivalentTotal}
                      </EditorialText>
                      <EditorialText variant="caption" tone="secondaryForest">
                        Monthly equivalent
                      </EditorialText>
                    </View>
                    <View>
                      <EditorialText variant="headlineMedium" tone="forest">
                        {spendSummary.currency} {spendSummary.annualEquivalentTotal}
                      </EditorialText>
                      <EditorialText variant="caption" tone="secondaryForest">
                        Annual equivalent ({spendSummary.activeCount} active)
                      </EditorialText>
                    </View>
                  </View>
                </EditorialCard>
              ) : null}

              {subsQuery.isLoading ? (
                <LoadingState message="Loading subscriptions..." />
              ) : subsQuery.isError ? (
                <ErrorState
                  message={extractApiErrorMessage(subsQuery.error)}
                  onRetry={() => void subsQuery.refetch()}
                />
              ) : subs.length === 0 ? (
                <EmptyState
                  icon={<Repeat size={28} color={theme.colors.m3.primary} />}
                  title="No subscriptions tracked"
                  description="Track recurring services, billing amounts, and renewal dates in one place."
                  actionLabel="Add Subscription"
                  onAction={() => setModalOpen(true)}
                />
              ) : (
                subs.map((sub) => (
                  <EditorialCard key={sub.id} variant="outlined">
                    <View style={styles.rowBetween}>
                      <View style={{ flex: 1 }}>
                        <EditorialText variant="cardHeading" tone="primary">
                          {sub.name}
                        </EditorialText>
                        <EditorialText variant="caption" tone="muted">
                          {sub.provider} · {sub.currency} {sub.amount} / {sub.frequency} · Renews{' '}
                          {sub.nextRenewalDate}
                        </EditorialText>
                      </View>
                      {sub.status === 'active' ? (
                        <Button
                          label="Mark Cancelled"
                          variant="outlined"
                          size="sm"
                          shape="pill"
                          onPress={() => cancelSubMutation.mutate(sub.id)}
                        />
                      ) : (
                        <Badge label={sub.status} tone="neutral" />
                      )}
                    </View>
                  </EditorialCard>
                ))
              )}
            </View>
          )}

          <View style={{ height: 96 }} />
        </ScrollView>
      </Screen>

      <ExpressiveFAB
        icon={<Plus size={24} color={theme.colors.m3.onPrimary} />}
        label={section === 'assets' ? 'Asset' : 'Sub'}
        accessibilityLabel="Add asset or subscription"
        onPress={() => setModalOpen(true)}
        style={styles.fabPosition}
      />

      <Modal
        visible={modalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setModalOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setModalOpen(false)}>
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
              {section === 'assets' ? 'Add Asset' : 'Add Subscription'}
            </EditorialText>

            {formError ? (
              <View style={{ marginTop: 12 }}>
                <ErrorState message={formError} />
              </View>
            ) : null}

            <View style={{ marginTop: 14, gap: 12 }}>
              <TextField
                label={section === 'assets' ? 'Asset Name' : 'Subscription Name'}
                placeholder={section === 'assets' ? 'MacBook Air M3' : 'iCloud+'}
                value={name}
                onChangeText={setName}
              />
              <TextField
                label={section === 'assets' ? 'Brand (Optional)' : 'Provider'}
                placeholder="Apple"
                value={secondaryField}
                onChangeText={setSecondaryField}
              />
              <TextField
                label={section === 'assets' ? 'Purchase Price (INR)' : 'Monthly Amount (INR)'}
                placeholder={section === 'assets' ? '114900' : '219'}
                keyboardType="numeric"
                value={amountField}
                onChangeText={setAmountField}
              />
              <TextField
                label={
                  section === 'assets'
                    ? 'Warranty Expiration (YYYY-MM-DD)'
                    : 'Next Renewal Date (YYYY-MM-DD)'
                }
                placeholder="2027-12-31"
                value={dateField}
                onChangeText={setDateField}
              />
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
  chipsRow: { flexDirection: 'row', gap: 8 },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  spendRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  fabPosition: { position: 'absolute', right: 20, bottom: 20 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(19, 26, 23, 0.38)',
    justifyContent: 'flex-end',
  },
  sheet: { width: '100%' },
});
