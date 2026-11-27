import React from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../theme';
import { EditorialText, type TextColorTone } from './Typography';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ExpressiveFABProps {
  icon: React.ReactNode | ((color: string) => React.ReactNode);
  label?: string;
  onPress: () => void;
  tone?: 'primary' | 'secondary' | 'tertiary' | 'container';
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
  const { theme, mode } = useTheme();
  const press = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: press.value * 3.5 }, { scale: 1 - press.value * 0.06 }],
  }));

  const fabLip =
    tone === 'secondary'
      ? theme.colors.border.secondaryBevel
      : tone === 'tertiary'
        ? theme.colors.expressive.coral.solidBevel
        : tone === 'container'
          ? theme.colors.expressive.violet.bevel
          : theme.colors.border.primaryBevel;

  const bgColor =
    tone === 'secondary'
      ? theme.colors.m3.secondary
      : tone === 'tertiary'
        ? theme.colors.m3.tertiary
        : tone === 'container'
          ? theme.colors.m3.primaryContainer
          : theme.colors.m3.primary;

  const fgColor =
    tone === 'secondary'
      ? theme.colors.m3.onSecondary
      : tone === 'tertiary'
        ? theme.colors.m3.onTertiary
        : tone === 'container'
          ? theme.colors.m3.onPrimaryContainer
          : theme.colors.m3.onPrimary;

  const textTone: TextColorTone =
    tone === 'secondary'
      ? 'onSecondary'
      : tone === 'tertiary'
        ? 'onTertiary'
        : tone === 'container'
          ? 'onPrimaryContainer'
          : 'onPrimary';

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
      style={[
        styles.fab,
        {
          backgroundColor: bgColor,
          borderRadius: theme.shapes.squircle,
          paddingHorizontal: label ? theme.spacing.lg : 0,
          width: label ? undefined : 56,
          height: 58,
          borderWidth: theme.borderWidths.hairline,
          borderColor: fabLip,
          borderTopColor:
            mode === 'dark' ? theme.colors.border.topHighlight : 'rgba(255,255,255,0.28)',
          borderBottomWidth: theme.borderWidths.tactileLip,
          borderBottomColor: fabLip,
          ...theme.shadows.floating,
          shadowColor: bgColor,
        },
        animatedStyle,
        style,
      ]}
    >
      {typeof icon === 'function' ? icon(fgColor) : icon}
      {label ? (
        <EditorialText variant="labelLarge" tone={textTone}>
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
