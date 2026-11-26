import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  background?: 'primary' | 'secondary';
  edges?: Edge[];
  contentStyle?: ViewStyle;
}

export function Screen({
  children,
  scroll = true,
  background = 'primary',
  edges = ['top', 'left', 'right'],
  contentStyle,
}: ScreenProps) {
  const { theme } = useTheme();
  const bgColor =
    background === 'secondary'
      ? theme.colors.background.secondary
      : theme.colors.background.primary;

  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.md,
          paddingBottom: theme.spacing.xxxl,
        },
        contentStyle,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View
      style={[
        styles.staticContent,
        {
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.md,
        },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]} edges={edges}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  staticContent: {
    flex: 1,
  },
});
