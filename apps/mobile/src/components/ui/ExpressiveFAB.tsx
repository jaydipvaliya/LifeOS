import React from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../theme';
import { EditorialText } from './Typography';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ExpressiveFABProps {
  icon: React.ReactNode;
  label?: string;
  onPress: () => void;
  tone?: 'primary' | 'container';
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}

export function ExpressiveFAB({
  icon,
  label,
  onPress,
  tone = 'primary',
  accessibilityLabel,
  style,
}: ExpressiveFABProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isPrimary = tone === 'primary';

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.93, theme.motion.expressiveEffects);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, theme.motion.expressiveSpatial);
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.fab,
        {
          backgroundColor: isPrimary ? theme.colors.m3.primary : theme.colors.m3.primaryContainer,
          borderRadius: theme.shapes.squircle,
          paddingHorizontal: label ? theme.spacing.lg : 0,
          width: label ? undefined : 58,
          height: 58,
          ...theme.shadows.floating,
        },
        animatedStyle,
        style,
      ]}
    >
      {icon}
      {label ? (
        <EditorialText variant="labelLarge" tone={isPrimary ? 'inverse' : 'forest'}>
          {label}
        </EditorialText>
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
});
