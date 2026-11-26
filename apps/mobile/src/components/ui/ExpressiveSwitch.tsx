import { Check } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../theme';

export type SwitchAccent = 'primary' | 'violet' | 'teal' | 'coral' | 'cobalt' | 'berry';

interface ExpressiveSwitchProps {
  value: boolean;
  onValueChange: (next: boolean) => void;
  accent?: SwitchAccent;
  accessibilityLabel: string;
}

/**
 * Material 3 Switch with expressive spring-animated thumb morphing.
 */
export function ExpressiveSwitch({
  value,
  onValueChange,
  accent = 'primary',
  accessibilityLabel,
}: ExpressiveSwitchProps) {
  const { theme } = useTheme();
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(value ? 1 : 0, theme.motion.expressiveSpatial);
  }, [progress, theme.motion.expressiveSpatial, value]);

  const accentColors =
    accent === 'primary'
      ? {
          activeTrack: theme.colors.m3.primary,
          activeThumb: theme.colors.m3.onPrimary,
          checkColor: theme.colors.m3.primary,
        }
      : {
          activeTrack: theme.colors.expressive[accent].base,
          activeThumb: theme.colors.m3.surfaceContainerLowest,
          checkColor: theme.colors.expressive[accent].base,
        };

  const thumbAnimatedStyle = useAnimatedStyle(() => {
    const size = 16 + progress.value * 8;
    const translateX = 6 + progress.value * 18;
    return {
      width: size,
      height: size,
      borderRadius: size / 2,
      transform: [{ translateX }],
    };
  });

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      style={[
        styles.track,
        {
          backgroundColor: value
            ? accentColors.activeTrack
            : theme.colors.m3.surfaceContainerHighest,
          borderColor: value ? accentColors.activeTrack : theme.colors.m3.outline,
          borderWidth: value ? 0 : 1.5,
          borderRadius: theme.shapes.full,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.thumb,
          {
            backgroundColor: value ? accentColors.activeThumb : theme.colors.m3.outline,
          },
          thumbAnimatedStyle,
        ]}
      >
        {value ? <Check size={13} strokeWidth={2.8} color={accentColors.checkColor} /> : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 52,
    height: 32,
    justifyContent: 'center',
    flexShrink: 0,
  },
  thumb: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
