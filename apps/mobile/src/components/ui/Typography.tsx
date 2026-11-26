import type { TypographyVariant } from '@lifeos/design-tokens';
import React from 'react';
import { Text, type TextProps } from 'react-native';
import { useTheme } from '../../theme';

export type TextColorTone =
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'inverse'
  | 'forest'
  | 'secondaryForest'
  | 'success'
  | 'warning'
  | 'danger';

export interface EditorialTextProps extends TextProps {
  variant?: TypographyVariant;
  tone?: TextColorTone;
  uppercase?: boolean;
}

export function EditorialText({
  variant = 'body',
  tone = 'primary',
  uppercase = false,
  style,
  children,
  ...rest
}: EditorialTextProps) {
  const { theme } = useTheme();
  const typographyToken = theme.typography[variant];

  const colorMap: Record<TextColorTone, string> = {
    primary: theme.colors.text.primary,
    secondary: theme.colors.text.secondary,
    muted: theme.colors.text.muted,
    inverse: theme.colors.text.inverse,
    forest: theme.colors.brand.primaryForest,
    secondaryForest: theme.colors.brand.secondaryForest,
    success: theme.colors.status.success,
    warning: theme.colors.status.warning,
    danger: theme.colors.status.danger,
  };

  return (
    <Text
      style={[
        {
          fontFamily: typographyToken.fontFamily,
          fontSize: typographyToken.fontSize,
          lineHeight: typographyToken.lineHeight,
          letterSpacing: typographyToken.letterSpacing,
          color: colorMap[tone],
          textTransform: uppercase ? 'uppercase' : 'none',
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}
