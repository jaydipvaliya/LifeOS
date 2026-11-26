import type { VerificationStatus } from '@lifeos/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Bell,
  CalendarClock,
  Check,
  CheckCircle2,
  Laptop,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  Badge,
  Button,
  Divider,
  EditorialCard,
  EditorialText,
  ErrorState,
  ExpressiveSwitch,
  LoadingState,
  Screen,
  ScreenTopBar,
  SectionHeader,
  TextField,
} from '../../../src/components/ui';
import { extractApiErrorMessage } from '../../../src/services/api-client';
import { intelligenceApi } from '../../../src/services/intelligence-api';
import { useTheme } from '../../../src/theme';

interface EditableField {
  key: string;
  label: string;
  value: string;
  confidence: number;
  sourceLocation: string | null;
  verificationStatus: VerificationStatus;
}

export default function ExtractionReviewScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [fields, setFields] = useState<EditableField[]>([]);
  const [createAssetEnabled, setCreateAssetEnabled] = useState(false);
  const [assetName, setAssetName] = useState('');
  const [warrantyDate, setWarrantyDate] = useState('');

  const [createEventEnabled, setCreateEventEnabled] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');

  const [createReminderEnabled, setCreateReminderEnabled] = useState(false);
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDate, setReminderDate] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedSuccess, setConfirmedSuccess] = useState(false);

  const extractionQuery = useQuery({
    queryKey: ['documents', 'extraction', id],
    queryFn: () => intelligenceApi.getDocumentExtraction(id!),
    enabled: Boolean(id),
  });

  useEffect(() => {
    const ext = extractionQuery.data;
    if (!ext) return;

    setFields(
      ext.fields.map((f) => ({
        key: f.key,
        label: f.label,
        value: f.value === null ? '' : String(f.value),
        confidence: f.confidence,
        sourceLocation: f.sourceLocation,
        verificationStatus:
          f.verificationStatus === 'unverified' ? 'confirmed' : f.verificationStatus,
      })),
    );

    const assetSugg = ext.suggestedActions.assetSuggestion;
    if (assetSugg) {
      setAssetName(assetSugg.name);
      setWarrantyDate(assetSugg.warrantyExpirationDate ?? '');
    }

    const evtSugg = ext.suggestedActions.eventSuggestion;
    if (evtSugg) {
      setEventTitle(evtSugg.title);
      setEventDate(evtSugg.startDate);
    }

    const remSugg = ext.suggestedActions.reminderSuggestion;
    if (remSugg) {
      setReminderTitle(remSugg.title);
      setReminderDate(remSugg.remindDate);
    }
  }, [extractionQuery.data]);

  const reanalyzeMutation = useMutation({
    mutationFn: () => intelligenceApi.analyzeDocument(id!),
    onSuccess: (data) => {
      queryClient.setQueryData(['documents', 'extraction', id], data);
      setErrorMsg(null);
    },
    onError: (err) => setErrorMsg(extractApiErrorMessage(err)),
  });

  const confirmMutation = useMutation({
    mutationFn: () => {
      const ext = extractionQuery.data;
      if (!ext) throw new Error('Extraction data is not ready');

      const docTitleField = fields.find((f) => f.key === 'documentTitle');
      const expiryField =
        fields.find((f) => f.key === 'warrantyExpirationDate') ??
        fields.find((f) => f.key === 'expiryDate');

      const assetSugg = ext.suggestedActions.assetSuggestion;
      const evtSugg = ext.suggestedActions.eventSuggestion;

      return intelligenceApi.confirmExtraction(id!, {
        title: docTitleField?.value.trim() || undefined,
        expiryDate: expiryField?.value.trim() || undefined,
        fields: fields.map((f) => ({
          key: f.key,
          label: f.label,
          value: f.value.trim() === '' ? null : f.value.trim(),
          verificationStatus: f.verificationStatus,
        })),
        createAsset:
          createAssetEnabled && assetName.trim()
            ? {
                enabled: true,
                name: assetName.trim(),
                category: assetSugg?.category ?? 'electronics',
                brand: assetSugg?.brand ?? null,
                purchaseDate: assetSugg?.purchaseDate ?? null,
                purchasePrice: assetSugg?.purchasePrice ?? null,
                currency: assetSugg?.currency ?? 'INR',
                serialNumber: assetSugg?.serialNumber ?? null,
                warrantyExpirationDate: warrantyDate.trim() || null,
              }
            : undefined,
        createEvent:
          createEventEnabled && eventTitle.trim() && /^\d{4}-\d{2}-\d{2}$/.test(eventDate.trim())
            ? {
                enabled: true,
                title: eventTitle.trim(),
                category: evtSugg?.category ?? 'document_expiry',
                startDate: eventDate.trim(),
              }
            : undefined,
        createReminder:
          createReminderEnabled &&
          reminderTitle.trim() &&
          /^\d{4}-\d{2}-\d{2}$/.test(reminderDate.trim())
            ? {
                enabled: true,
                title: reminderTitle.trim(),
                remindDate: reminderDate.trim(),
              }
            : undefined,
      });
    },
    onSuccess: async () => {
      setConfirmedSuccess(true);
      setErrorMsg(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['documents'] }),
        queryClient.invalidateQueries({ queryKey: ['documents', 'detail', id] }),
        queryClient.invalidateQueries({ queryKey: ['documents', 'extraction', id] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['assets'] }),
        queryClient.invalidateQueries({ queryKey: ['events'] }),
        queryClient.invalidateQueries({ queryKey: ['reminders'] }),
      ]);
    },
    onError: (err) => setErrorMsg(extractApiErrorMessage(err)),
  });

  const ext = extractionQuery.data;

  return (
    <Screen>
      <ScreenTopBar
        onBack={() => router.back()}
        backLabel="Document"
        badgeLabel="AI Review"
        badgeTone="violet"
      />

      {extractionQuery.isLoading ? (
        <LoadingState message="Analyzing document with LifeOS Intelligence..." />
      ) : extractionQuery.isError ? (
        <ErrorState
          message={extractApiErrorMessage(extractionQuery.error)}
          onRetry={() => void extractionQuery.refetch()}
        />
      ) : ext ? (
        <View style={{ gap: theme.spacing.lg }}>
          <EditorialCard variant="violet" shape="extraLarge">
            <View style={styles.heroHeader}>
              <View style={styles.rowGap}>
                <Sparkles size={18} color={theme.colors.expressive.violet.base} />
                <EditorialText variant="editorialEyebrow" tone="violetVibrant" uppercase>
                  {ext.documentType.replace(/_/g, ' ')}
                </EditorialText>
              </View>
              <Badge
                label={
                  ext.confidenceScore !== null
                    ? `${Math.round(ext.confidenceScore * 100)}% match`
                    : ext.status
                }
                tone={ext.status === 'verified' ? 'teal' : 'violet'}
              />
            </View>

            <EditorialText variant="titleLarge" tone="violet" style={{ marginTop: 8 }}>
              Verify Extracted Information
            </EditorialText>
            <EditorialText variant="bodySmall" tone="secondary" style={{ marginTop: 4 }}>
              {ext.summary}
            </EditorialText>

            <Divider style={{ marginVertical: theme.spacing.sm }} />

            <View style={styles.metaFooter}>
              <EditorialText variant="caption" tone="muted">
                {ext.providerName} · {ext.modelName}
              </EditorialText>
              <Button
                label="Re-analyze"
                variant="tonal"
                accent="violet"
                size="sm"
                shape="pill"
                loading={reanalyzeMutation.isPending}
                leftIcon={
                  <RefreshCw size={14} color={theme.colors.expressive.violet.onContainer} />
                }
                onPress={() => reanalyzeMutation.mutate()}
              />
            </View>
          </EditorialCard>

          {errorMsg ? <ErrorState message={errorMsg} /> : null}

          {confirmedSuccess ? (
            <EditorialCard variant="teal" padding="sm">
              <View style={styles.rowGap}>
                <CheckCircle2 size={18} color={theme.colors.expressive.teal.base} />
                <EditorialText variant="labelLarge" tone="teal">
                  Verified details saved to LifeOS!
                </EditorialText>
              </View>
            </EditorialCard>
          ) : null}

          <View>
            <SectionHeader
              indexLabel="01 · Extracted Fields"
              title="Review & Edit Values"
              subtitle="Confirm or edit each detected field before saving."
              eyebrowTone="violetVibrant"
            />
            <View style={{ gap: theme.spacing.sm }}>
              {fields.map((field, idx) => {
                const isRejected = field.verificationStatus === 'rejected';
                return (
                  <EditorialCard key={field.key} variant="surface" padding="sm">
                    <View style={styles.fieldTop}>
                      <View style={styles.flexText}>
                        <EditorialText variant="caption" tone="muted">
                          {field.sourceLocation ?? 'Detected field'} ·{' '}
                          {Math.round(field.confidence * 100)}%
                        </EditorialText>
                      </View>
                      <View style={styles.verifyPills}>
                        <Pressable
                          onPress={() =>
                            setFields((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, verificationStatus: 'confirmed' } : item,
                              ),
                            )
                          }
                          style={[
                            styles.miniPill,
                            {
                              backgroundColor: !isRejected
                                ? theme.colors.expressive.teal.container
                                : theme.colors.m3.surfaceContainerHigh,
                              borderRadius: theme.shapes.full,
                            },
                          ]}
                        >
                          <Check size={12} color={theme.colors.expressive.teal.onContainer} />
                          <EditorialText variant="caption" tone="teal">
                            Keep
                          </EditorialText>
                        </Pressable>
                        <Pressable
                          onPress={() =>
                            setFields((prev) =>
                              prev.map((item, i) =>
                                i === idx
                                  ? { ...item, value: '', verificationStatus: 'rejected' }
                                  : item,
                              ),
                            )
                          }
                          style={[
                            styles.miniPill,
                            {
                              backgroundColor: isRejected
                                ? theme.colors.m3.errorContainer
                                : theme.colors.m3.surfaceContainerHigh,
                              borderRadius: theme.shapes.full,
                            },
                          ]}
                        >
                          <X size={12} color={theme.colors.m3.error} />
                          <EditorialText variant="caption" tone={isRejected ? 'danger' : 'muted'}>
                            Clear
                          </EditorialText>
                        </Pressable>
                      </View>
                    </View>

                    <View style={{ marginTop: 6 }}>
                      <TextField
                        label={field.label}
                        value={field.value}
                        placeholder="Not detected — enter manually"
                        onChangeText={(text) =>
                          setFields((prev) =>
                            prev.map((item, i) =>
                              i === idx
                                ? {
                                    ...item,
                                    value: text,
                                    verificationStatus: 'edited',
                                  }
                                : item,
                            ),
                          )
                        }
                      />
                    </View>
                  </EditorialCard>
                );
              })}
            </View>
          </View>

          <View>
            <SectionHeader
              indexLabel="02 · Suggested Actions"
              title="Optional Connections"
              subtitle="Records are only created when you explicitly toggle them on."
              eyebrowTone="cobaltVibrant"
            />
            <View style={{ gap: theme.spacing.sm }}>
              <EditorialCard variant="cobalt" padding="sm">
                <View style={styles.actionToggleRow}>
                  <View style={[styles.rowGap, styles.flexText]}>
                    <Laptop size={18} color={theme.colors.expressive.cobalt.base} />
                    <View style={styles.flexText}>
                      <EditorialText variant="cardHeading" tone="cobalt">
                        Track as Asset
                      </EditorialText>
                      <EditorialText variant="caption" tone="secondary">
                        Link this invoice to an asset warranty record.
                      </EditorialText>
                    </View>
                  </View>
                  <ExpressiveSwitch
                    value={createAssetEnabled}
                    onValueChange={setCreateAssetEnabled}
                    accent="cobalt"
                    accessibilityLabel="Create asset from extraction"
                  />
                </View>
                {createAssetEnabled ? (
                  <View style={{ marginTop: 10, gap: 10 }}>
                    <TextField label="Asset Name" value={assetName} onChangeText={setAssetName} />
                    <TextField
                      label="Warranty Expiry (YYYY-MM-DD, optional)"
                      placeholder="2028-11-26"
                      value={warrantyDate}
                      onChangeText={setWarrantyDate}
                    />
                  </View>
                ) : null}
              </EditorialCard>

              <EditorialCard variant="coral" padding="sm">
                <View style={styles.actionToggleRow}>
                  <View style={[styles.rowGap, styles.flexText]}>
                    <CalendarClock size={18} color={theme.colors.expressive.coral.base} />
                    <View style={styles.flexText}>
                      <EditorialText variant="cardHeading" tone="coral">
                        Add Calendar Event
                      </EditorialText>
                      <EditorialText variant="caption" tone="secondary">
                        Mark expiry or deadline on your Life Calendar.
                      </EditorialText>
                    </View>
                  </View>
                  <ExpressiveSwitch
                    value={createEventEnabled}
                    onValueChange={setCreateEventEnabled}
                    accent="coral"
                    accessibilityLabel="Create event from extraction"
                  />
                </View>
                {createEventEnabled ? (
                  <View style={{ marginTop: 10, gap: 10 }}>
                    <TextField
                      label="Event Title"
                      value={eventTitle}
                      onChangeText={setEventTitle}
                    />
                    <TextField
                      label="Event Date (YYYY-MM-DD)"
                      placeholder="2028-11-26"
                      value={eventDate}
                      onChangeText={setEventDate}
                    />
                  </View>
                ) : null}
              </EditorialCard>

              <EditorialCard variant="amber" padding="sm">
                <View style={styles.actionToggleRow}>
                  <View style={[styles.rowGap, styles.flexText]}>
                    <Bell size={18} color={theme.colors.expressive.amber.base} />
                    <View style={styles.flexText}>
                      <EditorialText variant="cardHeading" tone="amber">
                        Schedule Reminder
                      </EditorialText>
                      <EditorialText variant="caption" tone="secondary">
                        Queue an advance notification ahead of the deadline.
                      </EditorialText>
                    </View>
                  </View>
                  <ExpressiveSwitch
                    value={createReminderEnabled}
                    onValueChange={setCreateReminderEnabled}
                    accent="primary"
                    accessibilityLabel="Create reminder from extraction"
                  />
                </View>
                {createReminderEnabled ? (
                  <View style={{ marginTop: 10, gap: 10 }}>
                    <TextField
                      label="Reminder Title"
                      value={reminderTitle}
                      onChangeText={setReminderTitle}
                    />
                    <TextField
                      label="Remind Date (YYYY-MM-DD)"
                      placeholder="2028-11-12"
                      value={reminderDate}
                      onChangeText={setReminderDate}
                    />
                  </View>
                ) : null}
              </EditorialCard>
            </View>
          </View>

          <Button
            label="Confirm & Save Verified Data"
            variant="filled"
            shape="pill"
            size="lg"
            fullWidth
            loading={confirmMutation.isPending}
            leftIcon={<CheckCircle2 size={18} color={theme.colors.m3.onPrimary} />}
            onPress={() => confirmMutation.mutate()}
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  rowGap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flexText: {
    flex: 1,
    minWidth: 0,
  },
  metaFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  fieldTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  verifyPills: {
    flexDirection: 'row',
    gap: 6,
  },
  miniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
});
