import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme';
import { EditorialText } from './Typography';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const { theme } = useTheme();
  const isDisabled = disabled || loading;

  const getContainerStyle = (pressed: boolean): ViewStyle => {
    const height = size === 'lg' ? 52 : 44;
    const base: ViewStyle = {
      height,
      borderRadius: theme.radii.md,
      paddingHorizontal: theme.spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.xs,
      opacity: isDisabled ? 0.55 : pressed ? 0.88 : 1,
      alignSelf: fullWidth ? 'stretch' : 'flex-start',
    };

    switch (variant) {
      case 'primary':
        return {
          ...base,
          backgroundColor: theme.colors.brand.primaryForest,
        };
      case 'secondary':
        return {
          ...base,
          backgroundColor: theme.colors.surface.primary,
          borderWidth: theme.borderWidths.hairline,
          borderColor: theme.colors.border.strong,
        };
      case 'ghost':
        return {
          ...base,
          backgroundColor: 'transparent',
        };
      case 'destructive':
        return {
          ...base,
          backgroundColor: theme.colors.status.dangerSurface,
          borderWidth: theme.borderWidths.hairline,
          borderColor: theme.colors.status.danger,
        };
    }
  };

  const textTone =
    variant === 'primary' ? 'inverse' : variant === 'destructive' ? 'danger' : 'primary';

  const spinnerColor =
    variant === 'primary'
      ? theme.colors.text.inverse
      : variant === 'destructive'
        ? theme.colors.status.danger
        : theme.colors.brand.primaryForest;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [getContainerStyle(pressed), style]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <>
          {leftIcon ? <View style={styles.iconSlot}>{leftIcon}</View> : null}
          <EditorialText variant="bodyMedium" tone={textTone}>
            {label}
          </EditorialText>
          {rightIcon ? <View style={styles.iconSlot}>{rightIcon}</View> : null}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
