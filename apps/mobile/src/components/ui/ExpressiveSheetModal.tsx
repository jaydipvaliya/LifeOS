import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';

interface ExpressiveSheetModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function ExpressiveSheetModal({ visible, onClose, children }: ExpressiveSheetModalProps) {
  const { theme, mode } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable
          style={[
            styles.backdrop,
            {
              backgroundColor: mode === 'dark' ? 'rgba(5, 4, 12, 0.74)' : 'rgba(20, 18, 29, 0.44)',
            },
          ]}
          onPress={onClose}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.sheet,
              {
                backgroundColor: theme.colors.surface.elevated,
                borderTopColor: theme.colors.border.topHighlight,
                borderLeftColor: theme.colors.border.subtle,
                borderRightColor: theme.colors.border.subtle,
                borderTopWidth: theme.borderWidths.hairline,
                borderLeftWidth: mode === 'dark' ? theme.borderWidths.hairline : 0,
                borderRightWidth: mode === 'dark' ? theme.borderWidths.hairline : 0,
                borderTopLeftRadius: theme.shapes.extraLarge,
                borderTopRightRadius: theme.shapes.extraLarge,
                paddingBottom: Math.max(insets.bottom, theme.spacing.lg),
              },
            ]}
          >
            <View style={styles.handleRow}>
              <View
                style={[
                  styles.handle,
                  {
                    backgroundColor: theme.colors.m3.outlineVariant,
                    borderRadius: theme.shapes.full,
                  },
                ]}
              />
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces={false}
              contentContainerStyle={{
                paddingHorizontal: theme.spacing.xl,
                paddingTop: theme.spacing.xs,
                paddingBottom: theme.spacing.sm,
              }}
            >
              {children}
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 18, 29, 0.44)',
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    maxHeight: '86%',
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 6,
  },
  handle: {
    width: 38,
    height: 4,
  },
});
