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
