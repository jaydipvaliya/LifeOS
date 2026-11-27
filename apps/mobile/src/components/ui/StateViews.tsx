import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { Button } from './Button';
import { EditorialCard } from './EditorialCard';
import { EditorialText } from './Typography';

export function LoadingState({ message = 'Loading your workspace...' }: { message?: string }) {
  const { theme } = useTheme();
  return (
    <EditorialCard variant="surface" style={styles.centered}>
      <ActivityIndicator size="small" color={theme.colors.m3.primary} />
      <EditorialText variant="bodySmall" tone="secondary" style={{ marginTop: theme.spacing.sm }}>
        {message}
      </EditorialText>
    </EditorialCard>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { theme } = useTheme();
  return (
    <EditorialCard variant="surface" style={styles.centered}>
      {icon ? (
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: theme.colors.surface.elevated,
              borderColor: theme.colors.border.subtle,
              borderWidth: theme.borderWidths.hairline,
              borderBottomWidth: 3,
              borderBottomColor: theme.colors.border.bevel,
              borderRadius: theme.shapes.squircle,
              marginBottom: theme.spacing.md,
            },
          ]}
        >
          {icon}
        </View>
      ) : null}
      <EditorialText variant="cardHeading" tone="primary" style={{ textAlign: 'center' }}>
        {title}
      </EditorialText>
      <EditorialText
        variant="bodySmall"
        tone="secondary"
        style={{ marginTop: theme.spacing.xxs, textAlign: 'center' }}
      >
        {description}
      </EditorialText>
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          variant="tonal"
          shape="pill"
          size="sm"
          onPress={onAction}
          style={{ marginTop: theme.spacing.md }}
        />
      ) : null}
    </EditorialCard>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { theme } = useTheme();
  return (
    <EditorialCard
      style={{
        backgroundColor: theme.colors.m3.errorContainer,
        borderColor: theme.colors.m3.error,
        borderBottomColor: theme.colors.border.dangerBevel,
        borderBottomWidth: theme.borderWidths.tactileLip,
      }}
    >
      <EditorialText variant="bodySmall" tone="danger">
        {message}
      </EditorialText>
      {onRetry ? (
        <Button
          label="Try Again"
          variant="outlined"
          shape="pill"
          size="sm"
          onPress={onRetry}
          style={{ marginTop: theme.spacing.sm }}
        />
      ) : null}
    </EditorialCard>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
  },
  iconCircle: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
