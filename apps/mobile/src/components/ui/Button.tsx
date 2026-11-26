import React from 'react';
import { ActivityIndicator, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../theme';
import { EditorialText, type TextColorTone } from './Typography';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ButtonVariant =
  | 'primary'
  | 'filled'
  | 'tonal'
  | 'tertiary'
  | 'elevated'
  | 'secondary'
  | 'outlined'
  | 'ghost'
  | 'text'
  | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonAccent = 'primary' | 'violet' | 'teal' | 'coral' | 'amber' | 'cobalt' | 'berry';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  accent?: ButtonAccent;
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
  accent,
  size = 'md',
  shape = 'pill',
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

  const height = size === 'lg' ? 54 : size === 'sm' ? 38 : 48;
  const borderRadius =
    shape === 'pill' ? theme.shapes.full : size === 'lg' ? theme.shapes.medium : theme.shapes.small;

  const accentPair = accent && accent !== 'primary' ? theme.colors.expressive[accent] : undefined;

  const getContainerColors = (): ViewStyle => {
    switch (variant) {
      case 'primary':
      case 'filled':
        return {
          backgroundColor: accentPair ? accentPair.base : theme.colors.m3.primary,
        };
      case 'tonal':
        return {
          backgroundColor: accentPair ? accentPair.container : theme.colors.m3.secondaryContainer,
        };
      case 'tertiary':
        return {
          backgroundColor: theme.colors.m3.tertiaryContainer,
        };
      case 'elevated':
        return {
          backgroundColor: theme.colors.m3.surfaceContainerLow,
          ...theme.shadows.subtle,
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
        };
    }
  };

  const textTone: TextColorTone = (() => {
    if (variant === 'primary' || variant === 'filled') return 'onPrimary';
    if (variant === 'destructive') return 'danger';
    if (variant === 'tonal') {
      if (accent && accent !== 'primary') return accent;
      return 'onSecondaryContainer';
    }
    if (variant === 'tertiary') return 'onTertiaryContainer';
    if (variant === 'elevated' || variant === 'ghost' || variant === 'text') return 'forest';
    return 'primary';
  })();

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
          scale.value = withSpring(0.96, theme.motion.expressiveEffects);
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
          paddingHorizontal: size === 'sm' ? 14 : theme.spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: size === 'sm' ? 6 : theme.spacing.xs,
          opacity: isDisabled ? 0.55 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          flexShrink: 0,
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
          {leftIcon ? <View style={{ flexShrink: 0 }}>{leftIcon}</View> : null}
          <EditorialText
            variant={size === 'sm' ? 'label' : 'labelLarge'}
            tone={textTone}
            numberOfLines={1}
            style={{ flexShrink: 1 }}
          >
            {label}
          </EditorialText>
          {rightIcon ? <View style={{ flexShrink: 0 }}>{rightIcon}</View> : null}
        </>
      )}
    </AnimatedPressable>
  );
}
