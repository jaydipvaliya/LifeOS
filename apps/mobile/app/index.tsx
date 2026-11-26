import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { EditorialText, Screen } from '../src/components/ui';
import { useAuthStore } from '../src/stores/auth-store';
import { useTheme } from '../src/theme';

export default function IndexGateScreen() {
  const { theme } = useTheme();
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isHydrated) {
    return (
      <Screen scroll={false} contentStyle={styles.center}>
        <EditorialText variant="displayEditorial" tone="primary">
          LifeOS
        </EditorialText>
        <EditorialText variant="bodySmall" tone="muted" style={{ marginTop: 6 }}>
          Your life, organized.
        </EditorialText>
        <ActivityIndicator
          size="small"
          color={theme.colors.brand.primaryForest}
          style={{ marginTop: 24 }}
        />
      </Screen>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(app)" />;
  }

  return <Redirect href="/(auth)/welcome" />;
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
