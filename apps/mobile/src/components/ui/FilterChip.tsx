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
  const press = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: press.value * 2 }, { scale: 1 - press.value * 0.05 }],
  }));

  const selectedColors: Record<
    ChipAccent,
    { bg: string; fg: string; bevel: string; textTone: TextColorTone }
  > = {
    primary: {
      bg: theme.colors.m3.primaryContainer,
      fg: theme.colors.m3.onPrimaryContainer,
      bevel: theme.colors.expressive.violet.bevel,
      textTone: 'onPrimaryContainer',
    },
    violet: {
      bg: theme.colors.expressive.violet.container,
      fg: theme.colors.expressive.violet.onContainer,
      bevel: theme.colors.expressive.violet.bevel,
      textTone: 'violet',
    },
    teal: {
      bg: theme.colors.expressive.teal.container,
      fg: theme.colors.expressive.teal.onContainer,
      bevel: theme.colors.expressive.teal.bevel,
      textTone: 'teal',
    },
    coral: {
      bg: theme.colors.expressive.coral.container,
      fg: theme.colors.expressive.coral.onContainer,
      bevel: theme.colors.expressive.coral.bevel,
      textTone: 'coral',
    },
    amber: {
      bg: theme.colors.expressive.amber.container,
      fg: theme.colors.expressive.amber.onContainer,
      bevel: theme.colors.expressive.amber.bevel,
      textTone: 'amber',
    },
    cobalt: {
      bg: theme.colors.expressive.cobalt.container,
      fg: theme.colors.expressive.cobalt.onContainer,
      bevel: theme.colors.expressive.cobalt.bevel,
      textTone: 'cobalt',
    },
    berry: {
      bg: theme.colors.expressive.berry.container,
      fg: theme.colors.expressive.berry.onContainer,
      bevel: theme.colors.expressive.berry.bevel,
      textTone: 'berry',
    },
  };

  const active = selectedColors[accent];

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
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? active.bg : theme.colors.surface.primary,
          borderColor: selected ? active.bevel : theme.colors.border.subtle,
          borderWidth: theme.borderWidths.hairline,
          borderBottomWidth: 3,
          borderBottomColor: selected ? active.bevel : theme.colors.border.bevel,
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
