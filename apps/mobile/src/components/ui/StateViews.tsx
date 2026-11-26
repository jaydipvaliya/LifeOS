import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { Button } from './Button';
import { EditorialCard } from './EditorialCard';
import { EditorialText } from './Typography';

export function LoadingState({ message = 'Loading your workspace...' }: { message?: string }) {
  const { theme } = useTheme();
  return (
    <EditorialCard variant="secondary" style={styles.centered}>
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
    <EditorialCard variant="secondary" style={styles.centered}>
      {icon ? <View style={{ marginBottom: theme.spacing.sm }}>{icon}</View> : null}
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
        borderWidth: theme.borderWidths.hairline,
      }}
    >
      <EditorialText variant="bodySmall" tone="danger">
        {message}
      </EditorialText>
      {onRetry ? (
        <Button
          label="Try Again"
          variant="outlined"
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
});
