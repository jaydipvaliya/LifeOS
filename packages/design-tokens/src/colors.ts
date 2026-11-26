export interface M3ColorScheme {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  surface: string;
  surfaceDim: string;
  surfaceBright: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  inverseSurface: string;
  inverseOnSurface: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
}

export interface ColorPalette {
  background: {
    primary: string;
    secondary: string;
  };
  surface: {
    primary: string;
    secondary: string;
    elevated: string;
  };
  brand: {
    primaryForest: string;
    secondaryForest: string;
    sage: string;
    softSage: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverse: string;
  };
  border: {
    subtle: string;
    strong: string;
  };
  status: {
    success: string;
    successSurface: string;
    warning: string;
    warningSurface: string;
    danger: string;
    dangerSurface: string;
  };
  m3: M3ColorScheme;
}

/**
 * LifeOS Material 3 Expressive x Warm Minimal Light Palette.
 * Preserves the signature forest & sage identity with M3 tonal surface hierarchy.
 */
export const lightColors: ColorPalette = {
  background: {
    primary: '#F7F8F5',
    secondary: '#F1F2EC',
  },
  surface: {
    primary: '#FFFFFF',
    secondary: '#EEF1EA',
    elevated: '#FFFFFF',
  },
  brand: {
    primaryForest: '#253A32',
    secondaryForest: '#526F60',
    sage: '#A5BDA8',
    softSage: '#E6EEE7',
  },
  text: {
    primary: '#25332D',
    secondary: '#7C827D',
    muted: '#78857D',
    inverse: '#F7F8F5',
  },
  border: {
    subtle: '#E6EAE5',
    strong: '#CDD5CE',
  },
  status: {
    success: '#39866B',
    successSurface: '#E6F1EC',
    warning: '#D69A48',
    warningSurface: '#F9F1E3',
    danger: '#D66A64',
    dangerSurface: '#FBECEB',
  },
  m3: {
    primary: '#253A32',
    onPrimary: '#F7F8F5',
    primaryContainer: '#E6EEE7',
    onPrimaryContainer: '#1B2D26',
    secondary: '#526F60',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#DCE7DE',
    onSecondaryContainer: '#1F332A',
    tertiary: '#9C6A23',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#F9F1E3',
    onTertiaryContainer: '#4E3409',
    surface: '#F7F8F5',
    surfaceDim: '#E8EAE3',
    surfaceBright: '#FFFFFF',
    surfaceContainerLowest: '#FFFFFF',
    surfaceContainerLow: '#F1F2EC',
    surfaceContainer: '#EEF1EA',
    surfaceContainerHigh: '#E6EAE2',
    surfaceContainerHighest: '#DDE3D9',
    onSurface: '#25332D',
    onSurfaceVariant: '#5E6C64',
    outline: '#78857D',
    outlineVariant: '#E6EAE5',
    inverseSurface: '#25332D',
    inverseOnSurface: '#F7F8F5',
    error: '#D66A64',
    onError: '#FFFFFF',
    errorContainer: '#FBECEB',
    onErrorContainer: '#641F1B',
  },
};

/**
 * Semantic Material 3 Expressive Dark Palette.
 */
export const darkColors: ColorPalette = {
  background: {
    primary: '#131A17',
    secondary: '#1A231F',
  },
  surface: {
    primary: '#1F2A25',
    secondary: '#26332D',
    elevated: '#293731',
  },
  brand: {
    primaryForest: '#A5BDA8',
    secondaryForest: '#7D9B8A',
    sage: '#526F60',
    softSage: '#24352E',
  },
  text: {
    primary: '#EEF1EA',
    secondary: '#B2BCB5',
    muted: '#88968E',
    inverse: '#131A17',
  },
  border: {
    subtle: '#2B3933',
    strong: '#3B4D45',
  },
  status: {
    success: '#52A88A',
    successSurface: '#1D332B',
    warning: '#E0AA5E',
    warningSurface: '#342A1C',
    danger: '#E2847F',
    dangerSurface: '#382221',
  },
  m3: {
    primary: '#A5BDA8',
    onPrimary: '#13221C',
    primaryContainer: '#283F35',
    onPrimaryContainer: '#D6E8D8',
    secondary: '#8AA996',
    onSecondary: '#16251E',
    secondaryContainer: '#26372F',
    onSecondaryContainer: '#D4E4D9',
    tertiary: '#E0AA5E',
    onTertiary: '#2F1F06',
    tertiaryContainer: '#473315',
    onTertiaryContainer: '#F9E6C8',
    surface: '#131A17',
    surfaceDim: '#0F1512',
    surfaceBright: '#293731',
    surfaceContainerLowest: '#0D1210',
    surfaceContainerLow: '#1A231F',
    surfaceContainer: '#1F2A25',
    surfaceContainerHigh: '#26332D',
    surfaceContainerHighest: '#2F3E37',
    onSurface: '#EEF1EA',
    onSurfaceVariant: '#B2BCB5',
    outline: '#88968E',
    outlineVariant: '#2B3933',
    inverseSurface: '#EEF1EA',
    inverseOnSurface: '#131A17',
    error: '#E2847F',
    onError: '#3A110F',
    errorContainer: '#541E1B',
    onErrorContainer: '#FBECEB',
  },
};
