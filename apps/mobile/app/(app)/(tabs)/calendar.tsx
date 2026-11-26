import { CalendarClock, CheckSquare } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';
import { EditorialText, EmptyState, Screen, SectionHeader } from '../../../src/components/ui';
import { useTheme } from '../../../src/theme';

export default function CalendarTabScreen() {
  const { theme } = useTheme();

  return (
    <Screen>
      <EditorialText variant="editorialEyebrow" tone="secondaryForest" uppercase>
        Life Calendar & Tasks
      </EditorialText>
      <EditorialText
        variant="pageHeadingEditorial"
        tone="primary"
        style={{ marginTop: 4, marginBottom: theme.spacing.xl }}
      >
        Schedule & Deadlines
      </EditorialText>

      <SectionHeader
        indexLabel="01 · Coming in Day 4"
        title="Calendar, Events & Tasks"
        subtitle="Monthly, weekly, agenda views, and document-linked reminders."
      />

      <EmptyState
        icon={<CalendarClock size={28} strokeWidth={1.75} color={theme.colors.m3.primary} />}
        title="Life Administration Arrives Next"
        description="In Day 4, tasks, recurring events, payment reminders, and document expiry dates connect directly to your Vault."
      />

      <View style={{ marginTop: theme.spacing.md, alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <CheckSquare size={15} color={theme.colors.text.muted} />
          <EditorialText variant="caption" tone="muted">
            Backed by PostgreSQL events, reminders, and BullMQ scheduling.
          </EditorialText>
        </View>
      </View>
    </Screen>
  );
}
