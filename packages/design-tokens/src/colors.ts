export interface ExpressiveAccentPair {
  base: string;
  container: string;
  onContainer: string;
}

export interface ExpressiveAccents {
  violet: ExpressiveAccentPair;
  teal: ExpressiveAccentPair;
  coral: ExpressiveAccentPair;
  amber: ExpressiveAccentPair;
  cobalt: ExpressiveAccentPair;
  berry: ExpressiveAccentPair;
}

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
  expressive: ExpressiveAccents;
}

/**
 * LifeOS Colorful Material 3 Expressive Light Palette.
 * Triadic vibrant roles (Indigo-Violet, Teal, Coral) with expressive tonal surfaces.
 */
export const lightColors: ColorPalette = {
  background: {
    primary: '#FAF8FF',
    secondary: '#F3F0FA',
  },
  surface: {
    primary: '#FFFFFF',
    secondary: '#ECE7F6',
    elevated: '#FFFFFF',
  },
  brand: {
    primaryForest: '#4F46E5',
    secondaryForest: '#0F9D8A',
    sage: '#9B94F5',
    softSage: '#E3E0FF',
  },
  text: {
    primary: '#1B1926',
    secondary: '#56526A',
    muted: '#736E87',
    inverse: '#FFFFFF',
  },
  border: {
    subtle: '#E6E1F2',
    strong: '#CFC7E4',
  },
  status: {
    success: '#0F9D8A',
    successSurface: '#D2F7F0',
    warning: '#D97706',
    warningSurface: '#FEF1D2',
    danger: '#DC3E55',
    dangerSurface: '#FFE4E8',
  },
  m3: {
    primary: '#4F46E5',
    onPrimary: '#FFFFFF',
    primaryContainer: '#E3E0FF',
    onPrimaryContainer: '#1B1564',
    secondary: '#0F9D8A',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#CCF7EE',
    onSecondaryContainer: '#043831',
    tertiary: '#E85D3F',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#FFE2DA',
    onTertiaryContainer: '#5C180A',
    surface: '#FAF8FF',
    surfaceDim: '#EAE5F5',
    surfaceBright: '#FFFFFF',
    surfaceContainerLowest: '#FFFFFF',
    surfaceContainerLow: '#F4F1FB',
    surfaceContainer: '#ECE7F6',
    surfaceContainerHigh: '#E4DDF1',
    surfaceContainerHighest: '#DBD3EC',
    onSurface: '#1B1926',
    onSurfaceVariant: '#56526A',
    outline: '#7E7894',
    outlineVariant: '#E4DEF1',
    inverseSurface: '#262335',
    inverseOnSurface: '#F5F2FC',
    error: '#DC3E55',
    onError: '#FFFFFF',
    errorContainer: '#FFE4E8',
    onErrorContainer: '#670D1D',
  },
  expressive: {
    violet: { base: '#6D28D9', container: '#EDE5FF', onContainer: '#2E0F66' },
    teal: { base: '#0D9488', container: '#D2F7F2', onContainer: '#083A36' },
    coral: { base: '#EA580C', container: '#FFE8DC', onContainer: '#5A2004' },
    amber: { base: '#D97706', container: '#FEF1D2', onContainer: '#522B02' },
    cobalt: { base: '#2563EB', container: '#DDEAFF', onContainer: '#0E2B6B' },
    berry: { base: '#DB2777', container: '#FCE2EE', onContainer: '#5C0D31' },
  },
};

/**
 * Semantic Colorful Material 3 Expressive Dark Palette.
 */
export const darkColors: ColorPalette = {
  background: {
    primary: '#14121D',
    secondary: '#1D1A29',
  },
  surface: {
    primary: '#231F31',
    secondary: '#2B263D',
    elevated: '#312B47',
  },
  brand: {
    primaryForest: '#B9B4FF',
    secondaryForest: '#6FE3D1',
    sage: '#7A73D9',
    softSage: '#312B72',
  },
  text: {
    primary: '#F3F0FA',
    secondary: '#C6C0D8',
    muted: '#9891AE',
    inverse: '#14121D',
  },
  border: {
    subtle: '#352F4B',
    strong: '#494266',
  },
  status: {
    success: '#5CE1CC',
    successSurface: '#123F38',
    warning: '#FBBF49',
    warningSurface: '#45310E',
    danger: '#FF8697',
    dangerSurface: '#4F1B24',
  },
  m3: {
    primary: '#B9B4FF',
    onPrimary: '#1A1466',
    primaryContainer: '#35308C',
    onPrimaryContainer: '#EAE9FF',
    secondary: '#6FE3D1',
    onSecondary: '#023830',
    secondaryContainer: '#124D44',
    onSecondaryContainer: '#D6FAF3',
    tertiary: '#FFA691',
    onTertiary: '#5C180A',
    tertiaryContainer: '#6E2414',
    onTertiaryContainer: '#FFE8E2',
    surface: '#14121D',
    surfaceDim: '#100E17',
    surfaceBright: '#312B47',
    surfaceContainerLowest: '#0D0B14',
    surfaceContainerLow: '#1D1A29',
    surfaceContainer: '#252136',
    surfaceContainerHigh: '#2E2A42',
    surfaceContainerHighest: '#37324F',
    onSurface: '#F3F0FA',
    onSurfaceVariant: '#C6C0D8',
    outline: '#9891AE',
    outlineVariant: '#352F4B',
    inverseSurface: '#F3F0FA',
    inverseOnSurface: '#14121D',
    error: '#FF8697',
    onError: '#540B17',
    errorContainer: '#691523',
    onErrorContainer: '#FFE4E8',
  },
  expressive: {
    violet: { base: '#C4B5FD', container: '#3B2378', onContainer: '#EFEAFF' },
    teal: { base: '#5EEAD4', container: '#114A43', onContainer: '#D5FCF5' },
    coral: { base: '#FDBA74', container: '#63290B', onContainer: '#FFEBE0' },
    amber: { base: '#FCD34D', container: '#573607', onContainer: '#FFF3D1' },
    cobalt: { base: '#93C5FD', container: '#173775', onContainer: '#E1EDFF' },
    berry: { base: '#F9A8D4', container: '#69193F', onContainer: '#FFE4F1' },
  },
};
