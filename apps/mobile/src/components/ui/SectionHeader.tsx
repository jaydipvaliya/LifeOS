import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { EditorialText, type TextColorTone } from './Typography';

interface SectionHeaderProps {
  indexLabel?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  eyebrowTone?: TextColorTone;
}

export function SectionHeader({
  indexLabel,
  title,
  subtitle,
  actionLabel,
  onActionPress,
  eyebrowTone = 'secondaryForest',
}: SectionHeaderProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { marginBottom: theme.spacing.sm }]}>
      <View style={styles.left}>
        {indexLabel ? (
          <EditorialText
            variant="editorialEyebrow"
            tone={eyebrowTone}
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
        <Pressable
          onPress={onActionPress}
          accessibilityRole="button"
          hitSlop={8}
          style={[
            styles.actionPill,
            {
              backgroundColor: theme.colors.m3.primaryContainer,
              borderRadius: theme.shapes.full,
            },
          ]}
        >
          <EditorialText
            variant="caption"
            tone="onPrimaryContainer"
            style={{ fontFamily: theme.fonts.bodySemiBold }}
          >
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
    minWidth: 0,
  },
  actionPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexShrink: 0,
  },
});
