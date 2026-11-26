import { Laptop, Repeat } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';
import { EditorialText, EmptyState, Screen, SectionHeader } from '../../../src/components/ui';
import { useTheme } from '../../../src/theme';

export default function AssetsTabScreen() {
  const { theme } = useTheme();

  return (
    <Screen>
      <EditorialText variant="editorialEyebrow" tone="secondaryForest" uppercase>
        Ownership & Continuity
      </EditorialText>
      <EditorialText
        variant="pageHeadingEditorial"
        tone="primary"
        style={{ marginTop: 4, marginBottom: theme.spacing.xl }}
      >
        Assets & Subscriptions
      </EditorialText>

      <SectionHeader
        indexLabel="01 · Coming in Day 4"
        title="Warranties, Repairs & Renewals"
        subtitle="Track laptops, electronics, invoices, repair logs, and recurring bills."
      />

      <EmptyState
        icon={<Laptop size={28} strokeWidth={1.75} color={theme.colors.m3.primary} />}
        title="Asset & Subscription Managers Next"
        description="In Day 4, link purchase invoices from your Vault to track warranty expiry dates, repairs, and annual subscription spend."
      />

      <View style={{ marginTop: theme.spacing.md, alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Repeat size={15} color={theme.colors.text.muted} />
          <EditorialText variant="caption" tone="muted">
            Upload invoices to your Vault today so they are ready to link.
          </EditorialText>
        </View>
      </View>
    </Screen>
  );
}
