import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { EditorialText, type TextColorTone } from './Typography';

export type BadgeTone = 'neutral' | 'sage' | 'success' | 'warning' | 'danger';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
}

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  const { theme } = useTheme();

  const styleMap: Record<BadgeTone, { bg: string; textTone: TextColorTone }> = {
    neutral: { bg: theme.colors.surface.secondary, textTone: 'secondary' },
    sage: { bg: theme.colors.brand.softSage, textTone: 'forest' },
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
          borderRadius: theme.radii.sm,
          paddingHorizontal: theme.spacing.xs,
          paddingVertical: theme.spacing.xxs,
        },
      ]}
    >
      <EditorialText variant="caption" tone={selected.textTone}>
        {label}
      </EditorialText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
  },
});
