export interface ExpressiveAccentPair {
  base: string;
  container: string;
  onContainer: string;
  bevel: string;
  solidBevel: string;
  shadow: string;
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
    bevel: string;
    topHighlight: string;
    primaryBevel: string;
    secondaryBevel: string;
    dangerBevel: string;
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
    bevel: '#D5CCE8',
    topHighlight: 'rgba(255, 255, 255, 0.92)',
    primaryBevel: '#3730A3',
    secondaryBevel: '#0B7567',
    dangerBevel: '#F0BDC5',
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
    violet: {
      base: '#6D28D9',
      container: '#EDE5FF',
      onContainer: '#2E0F66',
      bevel: '#CFC0FA',
      solidBevel: '#521CA8',
      shadow: '#6D28D9',
    },
    teal: {
      base: '#0D9488',
      container: '#D2F7F2',
      onContainer: '#083A36',
      bevel: '#9CE3D8',
      solidBevel: '#0A6E65',
      shadow: '#0D9488',
    },
    coral: {
      base: '#EA580C',
      container: '#FFE8DC',
      onContainer: '#5A2004',
      bevel: '#F7C4AA',
      solidBevel: '#BA4306',
      shadow: '#EA580C',
    },
    amber: {
      base: '#D97706',
      container: '#FEF1D2',
      onContainer: '#522B02',
      bevel: '#F2D08A',
      solidBevel: '#AD5B03',
      shadow: '#D97706',
    },
    cobalt: {
      base: '#2563EB',
      container: '#DDEAFF',
      onContainer: '#0E2B6B',
      bevel: '#B2CEFC',
      solidBevel: '#1B4BB8',
      shadow: '#2563EB',
    },
    berry: {
      base: '#DB2777',
      container: '#FCE2EE',
      onContainer: '#5C0D31',
      bevel: '#F2B8D3',
      solidBevel: '#AD1C5C',
      shadow: '#DB2777',
    },
  },
};

/**
 * Semantic Colorful Material 3 Expressive Dark Palette.
 */
export const darkColors: ColorPalette = {
  background: {
    primary: '#0F0D18',
    secondary: '#171424',
  },
  surface: {
    primary: '#1E1A2E',
    secondary: '#26213A',
    elevated: '#2D2745',
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
    inverse: '#0F0D18',
  },
  border: {
    subtle: '#362F50',
    strong: '#4C436E',
    bevel: '#090810',
    topHighlight: 'rgba(255, 255, 255, 0.10)',
    primaryBevel: '#7D74E8',
    secondaryBevel: '#37B09E',
    dangerBevel: '#450B16',
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
    surface: '#0F0D18',
    surfaceDim: '#0B0912',
    surfaceBright: '#352F52',
    surfaceContainerLowest: '#090810',
    surfaceContainerLow: '#171424',
    surfaceContainer: '#1E1A2E',
    surfaceContainerHigh: '#26213A',
    surfaceContainerHighest: '#302A4A',
    onSurface: '#F3F0FA',
    onSurfaceVariant: '#C6C0D8',
    outline: '#9891AE',
    outlineVariant: '#362F50',
    inverseSurface: '#F3F0FA',
    inverseOnSurface: '#0F0D18',
    error: '#FF8697',
    onError: '#540B17',
    errorContainer: '#691523',
    onErrorContainer: '#FFE4E8',
  },
  expressive: {
    violet: {
      base: '#C4B5FD',
      container: '#331F69',
      onContainer: '#F1ECFF',
      bevel: '#1D1045',
      solidBevel: '#8D7AE0',
      shadow: '#080414',
    },
    teal: {
      base: '#5EEAD4',
      container: '#10443D',
      onContainer: '#DBFDF7',
      bevel: '#072723',
      solidBevel: '#2FB8A3',
      shadow: '#031210',
    },
    coral: {
      base: '#FDBA74',
      container: '#57250C',
      onContainer: '#FFEDE3',
      bevel: '#331405',
      solidBevel: '#D98D45',
      shadow: '#140702',
    },
    amber: {
      base: '#FCD34D',
      container: '#4D3008',
      onContainer: '#FFF4D6',
      bevel: '#2C1B03',
      solidBevel: '#CE9F26',
      shadow: '#120B01',
    },
    cobalt: {
      base: '#93C5FD',
      container: '#153168',
      onContainer: '#E6F0FF',
      bevel: '#0A1B40',
      solidBevel: '#5C96E0',
      shadow: '#040B1A',
    },
    berry: {
      base: '#F9A8D4',
      container: '#5B1637',
      onContainer: '#FFE6F2',
      bevel: '#360A1F',
      solidBevel: '#D472A7',
      shadow: '#17040D',
    },
  },
};
