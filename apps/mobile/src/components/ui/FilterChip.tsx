import { Check } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../theme';
import { EditorialText, type TextColorTone } from './Typography';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ChipAccent = 'primary' | 'violet' | 'teal' | 'coral' | 'amber' | 'cobalt' | 'berry';

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  showCheck?: boolean;
  accent?: ChipAccent;
}

export function FilterChip({
  label,
  selected,
  onPress,
  showCheck = true,
  accent = 'primary',
}: FilterChipProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const selectedColors: Record<ChipAccent, { bg: string; fg: string; textTone: TextColorTone }> = {
    primary: {
      bg: theme.colors.m3.primaryContainer,
      fg: theme.colors.m3.onPrimaryContainer,
      textTone: 'onPrimaryContainer',
    },
    violet: {
      bg: theme.colors.expressive.violet.container,
      fg: theme.colors.expressive.violet.onContainer,
      textTone: 'violet',
    },
    teal: {
      bg: theme.colors.expressive.teal.container,
      fg: theme.colors.expressive.teal.onContainer,
      textTone: 'teal',
    },
    coral: {
      bg: theme.colors.expressive.coral.container,
      fg: theme.colors.expressive.coral.onContainer,
      textTone: 'coral',
    },
    amber: {
      bg: theme.colors.expressive.amber.container,
      fg: theme.colors.expressive.amber.onContainer,
      textTone: 'amber',
    },
    cobalt: {
      bg: theme.colors.expressive.cobalt.container,
      fg: theme.colors.expressive.cobalt.onContainer,
      textTone: 'cobalt',
    },
    berry: {
      bg: theme.colors.expressive.berry.container,
      fg: theme.colors.expressive.berry.onContainer,
      textTone: 'berry',
    },
  };

  const active = selectedColors[accent];

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.94, theme.motion.expressiveEffects);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, theme.motion.expressiveSpatial);
      }}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? active.bg : theme.colors.m3.surfaceContainerLow,
          borderColor: selected ? active.bg : theme.colors.m3.outlineVariant,
          borderWidth: theme.borderWidths.hairline,
          borderRadius: selected ? theme.shapes.full : theme.shapes.medium,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.xs,
        },
        animatedStyle,
      ]}
    >
      {selected && showCheck ? <Check size={14} strokeWidth={2.4} color={active.fg} /> : null}
      <EditorialText
        variant="label"
        tone={selected ? active.textTone : 'secondary'}
        numberOfLines={1}
        style={styles.label}
      >
        {label}
      </EditorialText>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    height: 38,
    maxWidth: '100%',
    flexShrink: 0,
  },
  label: {
    flexShrink: 1,
  },
});
