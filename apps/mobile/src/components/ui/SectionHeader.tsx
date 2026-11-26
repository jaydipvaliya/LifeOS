import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { EditorialText } from './Typography';

interface SectionHeaderProps {
  indexLabel?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export function SectionHeader({
  indexLabel,
  title,
  subtitle,
  actionLabel,
  onActionPress,
}: SectionHeaderProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { marginBottom: theme.spacing.sm }]}>
      <View style={styles.left}>
        {indexLabel ? (
          <EditorialText
            variant="editorialEyebrow"
            tone="secondaryForest"
            uppercase
            style={{ marginBottom: theme.spacing.xxs }}
          >
            {indexLabel}
          </EditorialText>
        ) : null}
        <EditorialText variant="sectionHeading" tone="primary">
          {title}
        </EditorialText>
        {subtitle ? (
          <EditorialText variant="bodySmall" tone="secondary" style={{ marginTop: 2 }}>
            {subtitle}
          </EditorialText>
        ) : null}
      </View>
      {actionLabel && onActionPress ? (
        <Pressable onPress={onActionPress} accessibilityRole="button" hitSlop={8}>
          <EditorialText variant="label" tone="forest">
            {actionLabel}
          </EditorialText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  left: {
    flex: 1,
  },
});
