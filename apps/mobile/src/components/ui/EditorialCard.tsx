import React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

interface EditorialCardProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'sage';
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

  const backgroundColor =
    variant === 'sage'
      ? theme.colors.brand.softSage
      : variant === 'secondary'
        ? theme.colors.surface.secondary
        : theme.colors.surface.primary;

  const cardStyle: ViewStyle = {
    backgroundColor,
    borderColor: theme.colors.border.subtle,
    borderWidth: theme.borderWidths.hairline,
    borderRadius: theme.radii.card,
    padding: theme.spacing.lg,
    ...theme.shadows.subtle,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [cardStyle, { opacity: pressed ? 0.92 : 1 }, style]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
}
