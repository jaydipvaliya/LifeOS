import { ArrowRight, CalendarCheck, FileText, ShieldCheck, Sparkles } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Badge,
  Button,
  Divider,
  EditorialCard,
  EditorialText,
  Screen,
  SectionHeader,
  TextField,
} from '../src/components/ui';
import { useTheme } from '../src/theme';

export default function FoundationPreviewScreen() {
  const { theme, mode, setMode } = useTheme();
  const [quickNote, setQuickNote] = useState('');

  return (
    <Screen>
      <View style={[styles.headerBlock, { marginBottom: theme.spacing.xl }]}>
        <View style={styles.topRow}>
          <EditorialText variant="editorialEyebrow" tone="secondaryForest" uppercase>
            LifeOS Foundation
          </EditorialText>
          <Badge label="Design System v0.1" tone="sage" />
        </View>

        <EditorialText
          variant="displayEditorial"
          tone="primary"
          style={{ marginTop: theme.spacing.sm }}
        >
          Your life, organized.
        </EditorialText>

        <EditorialText variant="bodyLarge" tone="secondary" style={{ marginTop: theme.spacing.sm }}>
          A calm editorial workspace connecting your important documents, warranties, deadlines, and
          daily responsibilities.
        </EditorialText>
      </View>

      <EditorialCard variant="sage" style={{ marginBottom: theme.spacing.xl }}>
        <EditorialText variant="editorialEyebrow" tone="forest" uppercase>
          01 · Core Principle
        </EditorialText>
        <EditorialText variant="cardHeading" tone="primary" style={{ marginTop: theme.spacing.xs }}>
          Document to Action Workflow
        </EditorialText>
        <EditorialText
          variant="bodySmall"
          tone="secondaryForest"
          style={{ marginTop: theme.spacing.xxs }}
        >
          Document → Understand → Connect → Remind → Act
        </EditorialText>

        <Divider style={{ marginVertical: theme.spacing.md }} />

        <View style={[styles.flowRow, { gap: theme.spacing.sm }]}>
          <View style={styles.flowItem}>
            <FileText size={18} strokeWidth={1.75} color={theme.colors.brand.primaryForest} />
            <EditorialText variant="caption" tone="primary">
              Vault
            </EditorialText>
          </View>
          <View style={styles.flowItem}>
            <Sparkles size={18} strokeWidth={1.75} color={theme.colors.brand.primaryForest} />
            <EditorialText variant="caption" tone="primary">
              Extract
            </EditorialText>
          </View>
          <View style={styles.flowItem}>
            <CalendarCheck size={18} strokeWidth={1.75} color={theme.colors.brand.primaryForest} />
            <EditorialText variant="caption" tone="primary">
              Remind
            </EditorialText>
          </View>
          <View style={styles.flowItem}>
            <ShieldCheck size={18} strokeWidth={1.75} color={theme.colors.brand.primaryForest} />
            <EditorialText variant="caption" tone="primary">
              Verify
            </EditorialText>
          </View>
        </View>
      </EditorialCard>

      <SectionHeader
        indexLabel="02 · Interactive Primitives"
        title="Editorial Components"
        subtitle="Typography, forms, surfaces, and semantic theme switching."
      />

      <EditorialCard style={{ marginBottom: theme.spacing.lg }}>
        <TextField
          label="Quick Responsibility Note"
          placeholder="e.g. MacBook Air invoice & warranty"
          value={quickNote}
          onChangeText={setQuickNote}
          helperText="Full database persistence and auth arrive in Day 2."
        />

        <View style={[styles.buttonGroup, { marginTop: theme.spacing.lg, gap: theme.spacing.sm }]}>
          <Button
            label="Primary Forest Action"
            onPress={() => setMode(mode === 'light' ? 'dark' : 'light')}
            rightIcon={<ArrowRight size={16} strokeWidth={2} color={theme.colors.text.inverse} />}
            fullWidth
          />
          <Button
            label={mode === 'light' ? 'Preview Dark Theme Scaffold' : 'Return to Warm Light Theme'}
            variant="secondary"
            onPress={() => setMode(mode === 'light' ? 'dark' : 'light')}
            fullWidth
          />
        </View>
      </EditorialCard>

      <View style={styles.footerMeta}>
        <EditorialText variant="caption" tone="muted">
          Warm Minimal × Editorial · Android-First Expo Architecture
        </EditorialText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerBlock: {
    paddingTop: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  flowItem: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  buttonGroup: {
    width: '100%',
  },
  footerMeta: {
    alignItems: 'center',
    paddingVertical: 12,
  },
});
