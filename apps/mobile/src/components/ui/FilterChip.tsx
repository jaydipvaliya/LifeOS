import { Check } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../theme';
import { EditorialText } from './Typography';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  showCheck?: boolean;
}

export function FilterChip({ label, selected, onPress, showCheck = true }: FilterChipProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.95, theme.motion.expressiveEffects);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, theme.motion.expressiveSpatial);
      }}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        {
          backgroundColor: selected
            ? theme.colors.m3.secondaryContainer
            : theme.colors.m3.surfaceContainerLowest,
          borderColor: selected
            ? theme.colors.m3.secondaryContainer
            : theme.colors.m3.outlineVariant,
          borderWidth: theme.borderWidths.hairline,
          borderRadius: selected ? theme.shapes.full : theme.shapes.small,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.xs,
        },
        animatedStyle,
      ]}
    >
      {selected && showCheck ? (
        <Check size={14} strokeWidth={2.25} color={theme.colors.m3.onSecondaryContainer} />
      ) : null}
      <EditorialText variant="label" tone={selected ? 'forest' : 'secondary'}>
        {label}
      </EditorialText>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
  },
});
