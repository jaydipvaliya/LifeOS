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
export type CardDepth = 'tactile' | 'hero' | 'flat';

interface EditorialCardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  shape?: CardShape;
  depth?: CardDepth;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function EditorialCard({
  children,
  variant = 'primary',
  padding = 'md',
  shape = 'large',
  depth,
  onPress,
  style,
  accessibilityLabel,
}: EditorialCardProps) {
  const { theme, mode } = useTheme();
  const press = useSharedValue(0);

  const resolvedDepth: CardDepth =
    depth ??
    (variant === 'elevated'
      ? 'hero'
      : variant === 'secondary' || (variant === 'surface' && !onPress)
        ? 'flat'
        : 'tactile');

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: press.value * (resolvedDepth === 'flat' ? 1.5 : 3.5) },
      { scale: 1 - press.value * (resolvedDepth === 'flat' ? 0.012 : 0.024) },
    ],
  }));

  const palette = (() => {
    switch (variant) {
      case 'sage':
      case 'tonal':
        return {
          bg: theme.colors.m3.primaryContainer,
          border:
            mode === 'dark' ? theme.colors.expressive.violet.bevel : theme.colors.border.subtle,
          bevel: theme.colors.expressive.violet.bevel,
          shadow: theme.colors.expressive.violet.shadow,
        };
      case 'surface':
        return {
          bg: theme.colors.m3.surfaceContainerLow,
          border: theme.colors.border.subtle,
          bevel: theme.colors.border.bevel,
          shadow: theme.shadows.none.shadowColor,
        };
      case 'secondary':
        return {
          bg: theme.colors.m3.surfaceContainer,
          border: theme.colors.border.subtle,
          bevel: theme.colors.border.bevel,
          shadow: theme.shadows.none.shadowColor,
        };
      case 'tertiary':
        return {
          bg: theme.colors.m3.tertiaryContainer,
          border: theme.colors.expressive.coral.bevel,
          bevel: theme.colors.expressive.coral.bevel,
          shadow: theme.colors.expressive.coral.shadow,
        };
      case 'violet':
      case 'teal':
      case 'coral':
      case 'amber':
      case 'cobalt':
      case 'berry': {
        const pair = theme.colors.expressive[variant];
        return {
          bg: pair.container,
          border: mode === 'dark' ? pair.bevel : theme.colors.border.subtle,
          bevel: pair.bevel,
          shadow: pair.shadow,
        };
      }
      case 'elevated':
        return {
          bg: theme.colors.surface.elevated,
          border: theme.colors.border.subtle,
          bevel: theme.colors.border.bevel,
          shadow: theme.shadows.floating.shadowColor,
        };
      case 'primary':
      case 'outlined':
      default:
        return {
          bg: theme.colors.surface.primary,
          border: theme.colors.border.subtle,
          bevel: theme.colors.border.bevel,
          shadow: theme.shadows.tactile.shadowColor,
        };
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

  const isFlat = resolvedDepth === 'flat';
  const baseShadow = isFlat
    ? theme.shadows.none
    : resolvedDepth === 'hero'
      ? theme.shadows.floating
      : theme.shadows.tactile;

  const cardShadow: ViewStyle = isFlat
    ? baseShadow
    : {
        ...baseShadow,
        shadowColor: palette.shadow,
        shadowOpacity: mode === 'dark' ? 0.36 : baseShadow.shadowOpacity,
      };

  const cardStyle: ViewStyle = {
    backgroundColor: palette.bg,
    borderColor: palette.border,
    borderTopColor: mode === 'dark' && !isFlat ? theme.colors.border.topHighlight : palette.border,
    borderWidth: theme.borderWidths.hairline,
    borderBottomWidth: isFlat ? theme.borderWidths.hairline : theme.borderWidths.tactileLip,
    borderBottomColor: isFlat ? palette.border : palette.bevel,
    borderRadius,
    padding: paddingValue,
    ...cardShadow,
  };

  const innerContent =
    padding === 'none' ? (
      <View style={{ borderRadius: Math.max(0, borderRadius - 2), overflow: 'hidden' }}>
        {children}
      </View>
    ) : (
      children
    );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => {
          press.value = withSpring(1, theme.motion.expressiveEffects);
        }}
        onPressOut={() => {
          press.value = withSpring(0, theme.motion.expressiveSpatial);
        }}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={[cardStyle, animatedStyle, style]}
      >
        {innerContent}
      </AnimatedPressable>
    );
  }

  return <View style={[cardStyle, style]}>{innerContent}</View>;
}
