import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../theme';
import { EditorialText, type TextColorTone } from './Typography';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ButtonVariant =
  'primary' | 'filled' | 'tonal' | 'secondary' | 'outlined' | 'ghost' | 'text' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: 'squircle' | 'pill';
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
  shape = 'squircle',
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
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const height = size === 'lg' ? 54 : size === 'sm' ? 38 : 46;
  const borderRadius =
    shape === 'pill' ? theme.shapes.full : size === 'lg' ? theme.shapes.medium : theme.shapes.small;

  const getContainerColors = (): ViewStyle => {
    switch (variant) {
      case 'primary':
      case 'filled':
        return {
          backgroundColor: theme.colors.m3.primary,
        };
      case 'tonal':
        return {
          backgroundColor: theme.colors.m3.secondaryContainer,
        };
      case 'secondary':
      case 'outlined':
        return {
          backgroundColor: theme.colors.m3.surfaceContainerLowest,
          borderWidth: theme.borderWidths.hairline,
          borderColor: theme.colors.m3.outlineVariant,
        };
      case 'ghost':
      case 'text':
        return {
          backgroundColor: 'transparent',
        };
      case 'destructive':
        return {
          backgroundColor: theme.colors.m3.errorContainer,
          borderWidth: theme.borderWidths.hairline,
          borderColor: theme.colors.m3.error,
        };
    }
  };

  const textTone: TextColorTone =
    variant === 'primary' || variant === 'filled'
      ? 'inverse'
      : variant === 'destructive'
        ? 'danger'
        : variant === 'tonal'
          ? 'forest'
          : 'primary';

  const spinnerColor =
    variant === 'primary' || variant === 'filled'
      ? theme.colors.m3.onPrimary
      : variant === 'destructive'
        ? theme.colors.m3.error
        : theme.colors.m3.primary;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        if (!isDisabled) {
          scale.value = withSpring(0.97, theme.motion.expressiveEffects);
        }
      }}
      onPressOut={() => {
        scale.value = withSpring(1, theme.motion.expressiveSpatial);
      }}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[
        {
          height,
          borderRadius,
          paddingHorizontal: size === 'sm' ? theme.spacing.md : theme.spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.spacing.xs,
          opacity: isDisabled ? 0.55 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        getContainerColors(),
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <>
          {leftIcon ? <View style={styles.iconSlot}>{leftIcon}</View> : null}
          <EditorialText variant={size === 'sm' ? 'label' : 'bodyMedium'} tone={textTone}>
            {label}
          </EditorialText>
          {rightIcon ? <View style={styles.iconSlot}>{rightIcon}</View> : null}
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  iconSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
