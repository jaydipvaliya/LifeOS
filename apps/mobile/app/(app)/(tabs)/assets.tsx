import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Laptop, Plus, Repeat, ShieldCheck } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, RefreshControl, StyleSheet, View } from 'react-native';
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
  Screen,
  SearchBar,
  SegmentedControl,
  TextField,
} from '../../../src/components/ui';
import { extractApiErrorMessage } from '../../../src/services/api-client';
import { lifeApi } from '../../../src/services/life-api';
import { useTheme } from '../../../src/theme';

const ASSET_CATEGORIES = [
  { value: 'laptop', label: 'Laptop' },
  { value: 'smartphone', label: 'Phone' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'appliances', label: 'Appliance' },
  { value: 'other', label: 'Other' },
] as const;

const SUB_FREQUENCIES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annual', label: 'Annual' },
] as const;

export default function AssetsAndSubscriptionsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [section, setSection] = useState<'assets' | 'subscriptions'>('assets');
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [assetCategory, setAssetCategory] =
    useState<(typeof ASSET_CATEGORIES)[number]['value']>('laptop');
  const [subFrequency, setSubFrequency] =
    useState<(typeof SUB_FREQUENCIES)[number]['value']>('monthly');
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
          category: assetCategory,
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
          frequency: subFrequency,
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
      <Screen
        includeBottomInset={false}
        bottomSpacing={104}
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
        <EditorialText variant="editorialEyebrow" tone="forest" uppercase>
          Ownership & Spend
        </EditorialText>
        <EditorialText
          variant="pageHeadingEditorial"
          tone="primary"
          style={{ marginTop: 4, marginBottom: theme.spacing.md }}
        >
          Assets & Subscriptions
        </EditorialText>

        <View style={{ marginBottom: theme.spacing.lg }}>
          <SegmentedControl
            value={section}
            onChange={setSection}
            options={[
              { value: 'assets', label: `Assets (${assets.length})`, accent: 'primary' },
              { value: 'subscriptions', label: `Subscriptions (${subs.length})`, accent: 'berry' },
            ]}
          />
        </View>

        {section === 'assets' ? (
          <View style={{ gap: theme.spacing.md }}>
            <SearchBar
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search laptops, phones, serials..."
              accentColor={theme.colors.m3.primary}
              accessibilityLabel="Search Assets"
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
              <View style={{ gap: theme.spacing.sm }}>
                {assets.map((asset) => (
                  <EditorialCard
                    key={asset.id}
                    variant="primary"
                    padding="sm"
                    onPress={() => router.push(`/(app)/assets/${asset.id}`)}
                  >
                    <View style={styles.rowBetween}>
                      <View
                        style={[
                          styles.iconBox,
                          {
                            backgroundColor: theme.colors.m3.primaryContainer,
                            borderRadius: theme.shapes.medium,
                          },
                        ]}
                      >
                        <Laptop size={20} strokeWidth={1.9} color={theme.colors.m3.primary} />
                      </View>
                      <View style={styles.flexText}>
                        <EditorialText variant="cardHeading" tone="primary" numberOfLines={1}>
                          {asset.name}
                        </EditorialText>
                        <EditorialText variant="caption" tone="muted" numberOfLines={1}>
                          {asset.brand ?? asset.category} · {asset.linkedDocuments.length} doc(s) ·{' '}
                          {asset.repairsCount} repair(s)
                        </EditorialText>
                      </View>
                      {asset.warrantyExpirationDate ? (
                        <Badge label={asset.warrantyExpirationDate} tone="warning" />
                      ) : (
                        <Badge label={asset.category} tone="neutral" />
                      )}
                    </View>
                  </EditorialCard>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={{ gap: theme.spacing.md }}>
            {spendSummary ? (
              <EditorialCard variant="berry" shape="extraLarge" depth="hero">
                <View style={styles.rowGap}>
                  <ShieldCheck size={18} color={theme.colors.expressive.berry.base} />
                  <EditorialText variant="editorialEyebrow" tone="berryVibrant" uppercase>
                    Recurring Spend Summary
                  </EditorialText>
                </View>
                <Divider style={{ marginVertical: theme.spacing.sm }} />
                <View style={styles.spendRow}>
                  <View style={styles.spendTile}>
                    <EditorialText variant="headlineMedium" tone="berryVibrant">
                      {spendSummary.currency} {spendSummary.monthlyEquivalentTotal}
                    </EditorialText>
                    <EditorialText variant="caption" tone="berry">
                      Monthly equivalent
                    </EditorialText>
                  </View>
                  <View style={styles.spendTile}>
                    <EditorialText variant="headlineMedium" tone="berryVibrant">
                      {spendSummary.currency} {spendSummary.annualEquivalentTotal}
                    </EditorialText>
                    <EditorialText variant="caption" tone="berry">
                      Annual ({spendSummary.activeCount} active)
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
              <View style={{ gap: theme.spacing.sm }}>
                {subs.map((sub) => (
                  <EditorialCard key={sub.id} variant="primary" padding="sm">
                    <View style={styles.rowBetween}>
                      <View
                        style={[
                          styles.iconBox,
                          {
                            backgroundColor: theme.colors.expressive.berry.container,
                            borderRadius: theme.shapes.medium,
                          },
                        ]}
                      >
                        <Repeat
                          size={18}
                          strokeWidth={1.9}
                          color={theme.colors.expressive.berry.base}
                        />
                      </View>
                      <View style={styles.flexText}>
                        <EditorialText variant="cardHeading" tone="primary" numberOfLines={1}>
                          {sub.name}
                        </EditorialText>
                        <EditorialText variant="caption" tone="muted" numberOfLines={2}>
                          {sub.provider} · {sub.currency} {sub.amount}/{sub.frequency} · Renews{' '}
                          {sub.nextRenewalDate}
                        </EditorialText>
                      </View>
                      {sub.status === 'active' ? (
                        <Button
                          label="Cancel"
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
                ))}
              </View>
            )}
          </View>
        )}
      </Screen>

      <ExpressiveFAB
        icon={(color) => <Plus size={24} color={color} />}
        label={section === 'assets' ? 'Asset' : 'Sub'}
        tone="primary"
        accessibilityLabel="Add asset or subscription"
        onPress={() => setModalOpen(true)}
        style={styles.fabPosition}
      />

      <ExpressiveSheetModal visible={modalOpen} onClose={() => setModalOpen(false)}>
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

          <View>
            <EditorialText variant="label" tone="primary" style={{ marginBottom: 6 }}>
              {section === 'assets' ? 'Category' : 'Billing Cycle'}
            </EditorialText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flexGrow: 0, flexShrink: 0 }}
              contentContainerStyle={styles.chipsRow}
            >
              {section === 'assets'
                ? ASSET_CATEGORIES.map((cat) => (
                    <FilterChip
                      key={cat.value}
                      label={cat.label}
                      accent="cobalt"
                      selected={assetCategory === cat.value}
                      onPress={() => setAssetCategory(cat.value)}
                    />
                  ))
                : SUB_FREQUENCIES.map((freq) => (
                    <FilterChip
                      key={freq.value}
                      label={freq.label}
                      accent="berry"
                      selected={subFrequency === freq.value}
                      onPress={() => setSubFrequency(freq.value)}
                    />
                  ))}
            </ScrollView>
          </View>

          <TextField
            label={section === 'assets' ? 'Brand (Optional)' : 'Provider'}
            placeholder="Apple"
            value={secondaryField}
            onChangeText={setSecondaryField}
          />
          <TextField
            label={section === 'assets' ? 'Purchase Price (INR)' : 'Amount (INR)'}
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
      </ExpressiveSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flexText: { flex: 1, minWidth: 0 },
  chipsRow: { flexDirection: 'row', gap: 8, paddingRight: 4 },
  iconBox: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  spendRow: { flexDirection: 'row', gap: 12 },
  spendTile: { flex: 1, minWidth: 0 },
  fabPosition: { position: 'absolute', right: 20, bottom: 16 },
});
