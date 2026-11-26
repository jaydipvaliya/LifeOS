import React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type CardVariant =
  'primary' | 'secondary' | 'sage' | 'elevated' | 'tonal' | 'outlined' | 'tertiary';

interface EditorialCardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function EditorialCard({
  children,
  variant = 'primary',
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
      case 'secondary':
        return theme.colors.m3.surfaceContainer;
      case 'tertiary':
        return theme.colors.m3.tertiaryContainer;
      case 'elevated':
      case 'primary':
      case 'outlined':
      default:
        return theme.colors.m3.surfaceContainerLowest;
    }
  })();

  const hasBorder = variant === 'outlined' || variant === 'primary';
  const cardStyle: ViewStyle = {
    backgroundColor,
    borderColor: theme.colors.m3.outlineVariant,
    borderWidth: hasBorder ? theme.borderWidths.hairline : 0,
    borderRadius: theme.shapes.large,
    padding: theme.spacing.lg,
    ...(variant === 'elevated' ? theme.shadows.floating : theme.shadows.subtle),
  };

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.985, theme.motion.expressiveEffects);
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
