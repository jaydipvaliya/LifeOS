import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { EditorialText, type TextColorTone } from './Typography';

export type BadgeTone =
  | 'neutral'
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'sage'
  | 'violet'
  | 'teal'
  | 'coral'
  | 'amber'
  | 'cobalt'
  | 'berry'
  | 'success'
  | 'warning'
  | 'danger';

export function resolveDocStatusPresentation(
  status: string,
  isArchived = false,
): { label: string; tone: BadgeTone } {
  if (isArchived) return { label: 'Archived', tone: 'neutral' };
  switch (status) {
    case 'completed':
      return { label: 'Indexed', tone: 'success' };
    case 'uploaded':
      return { label: 'Saved', tone: 'primary' };
    case 'pending_extraction':
      return { label: 'Queued', tone: 'warning' };
    case 'processing':
      return { label: 'Analyzing', tone: 'warning' };
    case 'failed':
      return { label: 'Failed', tone: 'danger' };
    default:
      return { label: status.replace(/_/g, ' '), tone: 'neutral' };
  }
}

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
}

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  const { theme } = useTheme();

  const styleMap: Record<BadgeTone, { bg: string; textTone: TextColorTone }> = {
    neutral: { bg: theme.colors.m3.surfaceContainerHigh, textTone: 'secondary' },
    primary: { bg: theme.colors.m3.primaryContainer, textTone: 'onPrimaryContainer' },
    secondary: { bg: theme.colors.m3.secondaryContainer, textTone: 'onSecondaryContainer' },
    tertiary: { bg: theme.colors.m3.tertiaryContainer, textTone: 'onTertiaryContainer' },
    sage: { bg: theme.colors.m3.primaryContainer, textTone: 'onPrimaryContainer' },
    violet: { bg: theme.colors.expressive.violet.container, textTone: 'violet' },
    teal: { bg: theme.colors.expressive.teal.container, textTone: 'teal' },
    coral: { bg: theme.colors.expressive.coral.container, textTone: 'coral' },
    amber: { bg: theme.colors.expressive.amber.container, textTone: 'amber' },
    cobalt: { bg: theme.colors.expressive.cobalt.container, textTone: 'cobalt' },
    berry: { bg: theme.colors.expressive.berry.container, textTone: 'berry' },
    success: { bg: theme.colors.status.successSurface, textTone: 'success' },
    warning: { bg: theme.colors.status.warningSurface, textTone: 'warning' },
    danger: { bg: theme.colors.status.dangerSurface, textTone: 'danger' },
  };

  const selected = styleMap[tone];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: selected.bg,
          borderRadius: theme.shapes.full,
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xxs,
        },
      ]}
    >
      <EditorialText variant="caption" tone={selected.textTone} numberOfLines={1}>
        {label}
      </EditorialText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
});
