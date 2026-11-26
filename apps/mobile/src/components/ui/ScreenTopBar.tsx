import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../theme';
import { Badge, type BadgeTone } from './Badge';
import { EditorialText } from './Typography';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ScreenTopBarProps {
  onBack: () => void;
  backLabel?: string;
  badgeLabel?: string;
  badgeTone?: BadgeTone;
  rightSlot?: React.ReactNode;
}

/**
 * Shared Material 3 Expressive top bar with a tonal circular back action.
 */
export function ScreenTopBar({
  onBack,
  backLabel = 'Back',
  badgeLabel,
  badgeTone = 'primary',
  rightSlot,
}: ScreenTopBarProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={[styles.bar, { marginBottom: theme.spacing.md }]}>
      <AnimatedPressable
        onPress={onBack}
        onPressIn={() => {
          scale.value = withSpring(0.93, theme.motion.expressiveEffects);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, theme.motion.expressiveSpatial);
        }}
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        hitSlop={8}
        style={[
          styles.backPill,
          {
            backgroundColor: theme.colors.m3.surfaceContainer,
            borderRadius: theme.shapes.full,
          },
          animatedStyle,
        ]}
      >
        <ArrowLeft size={18} strokeWidth={2.1} color={theme.colors.m3.onSurface} />
        <EditorialText variant="label" tone="primary">
          {backLabel}
        </EditorialText>
      </AnimatedPressable>

      <View style={styles.right}>
        {badgeLabel ? <Badge label={badgeLabel} tone={badgeTone} /> : null}
        {rightSlot}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    gap: 12,
  },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingLeft: 12,
    paddingRight: 16,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
});
