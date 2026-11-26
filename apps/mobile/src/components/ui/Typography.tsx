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
  | 'onPrimary'
  | 'onSecondary'
  | 'onTertiary'
  | 'onPrimaryContainer'
  | 'onSecondaryContainer'
  | 'onTertiaryContainer'
  | 'violet'
  | 'teal'
  | 'coral'
  | 'amber'
  | 'cobalt'
  | 'berry'
  | 'violetVibrant'
  | 'tealVibrant'
  | 'coralVibrant'
  | 'amberVibrant'
  | 'cobaltVibrant'
  | 'berryVibrant'
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
    forest: theme.colors.m3.primary,
    secondaryForest: theme.colors.m3.secondary,
    onPrimary: theme.colors.m3.onPrimary,
    onSecondary: theme.colors.m3.onSecondary,
    onTertiary: theme.colors.m3.onTertiary,
    onPrimaryContainer: theme.colors.m3.onPrimaryContainer,
    onSecondaryContainer: theme.colors.m3.onSecondaryContainer,
    onTertiaryContainer: theme.colors.m3.onTertiaryContainer,
    violet: theme.colors.expressive.violet.onContainer,
    teal: theme.colors.expressive.teal.onContainer,
    coral: theme.colors.expressive.coral.onContainer,
    amber: theme.colors.expressive.amber.onContainer,
    cobalt: theme.colors.expressive.cobalt.onContainer,
    berry: theme.colors.expressive.berry.onContainer,
    violetVibrant: theme.colors.expressive.violet.base,
    tealVibrant: theme.colors.expressive.teal.base,
    coralVibrant: theme.colors.expressive.coral.base,
    amberVibrant: theme.colors.expressive.amber.base,
    cobaltVibrant: theme.colors.expressive.cobalt.base,
    berryVibrant: theme.colors.expressive.berry.base,
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
