import React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type CardVariant =
  | 'primary'
  | 'secondary'
  | 'surface'
  | 'sage'
  | 'elevated'
  | 'tonal'
  | 'outlined'
  | 'tertiary'
  | 'violet'
  | 'teal'
  | 'coral'
  | 'amber'
  | 'cobalt'
  | 'berry';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';
export type CardShape = 'medium' | 'large' | 'extraLarge';

interface EditorialCardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  shape?: CardShape;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function EditorialCard({
  children,
  variant = 'primary',
  padding = 'md',
  shape = 'large',
  onPress,
  style,
  accessibilityLabel,
}: EditorialCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const backgroundColor = (() => {
    switch (variant) {
      case 'sage':
      case 'tonal':
        return theme.colors.m3.primaryContainer;
      case 'surface':
        return theme.colors.m3.surfaceContainerLow;
      case 'secondary':
        return theme.colors.m3.surfaceContainer;
      case 'tertiary':
        return theme.colors.m3.tertiaryContainer;
      case 'violet':
        return theme.colors.expressive.violet.container;
      case 'teal':
        return theme.colors.expressive.teal.container;
      case 'coral':
        return theme.colors.expressive.coral.container;
      case 'amber':
        return theme.colors.expressive.amber.container;
      case 'cobalt':
        return theme.colors.expressive.cobalt.container;
      case 'berry':
        return theme.colors.expressive.berry.container;
      case 'elevated':
      case 'primary':
      case 'outlined':
      default:
        return theme.colors.m3.surfaceContainerLowest;
    }
  })();

  const paddingValue =
    padding === 'none'
      ? 0
      : padding === 'sm'
        ? theme.spacing.md
        : padding === 'lg'
          ? theme.spacing.xl
          : theme.spacing.lg;

  const borderRadius =
    shape === 'medium'
      ? theme.shapes.medium
      : shape === 'extraLarge'
        ? theme.shapes.extraLarge
        : theme.shapes.large;

  const hasBorder = variant === 'outlined' || variant === 'primary';
  const cardShadow =
    variant === 'elevated'
      ? theme.shadows.floating
      : hasBorder
        ? theme.shadows.none
        : theme.shadows.none;

  const cardStyle: ViewStyle = {
    backgroundColor,
    borderColor: theme.colors.m3.outlineVariant,
    borderWidth: hasBorder ? theme.borderWidths.hairline : 0,
    borderRadius,
    padding: paddingValue,
    overflow: 'hidden',
    ...cardShadow,
  };

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.98, theme.motion.expressiveEffects);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, theme.motion.expressiveSpatial);
        }}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={[cardStyle, animatedStyle, style]}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
}
