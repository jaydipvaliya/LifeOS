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
 * LifeOS Archival Ivory & Deep Pine Light Palette (Warm Minimal x Tactile Editorial).
 * 85% neutral archival surfaces, 12% Deep Botanical Pine signature accent, 3% ochre/crimson alerts.
 */
export const lightColors: ColorPalette = {
  background: {
    primary: '#F7F4EE',
    secondary: '#EFEAE0',
  },
  surface: {
    primary: '#FFFFFF',
    secondary: '#F1EDE3',
    elevated: '#FFFFFF',
  },
  brand: {
    primaryForest: '#1E6B52',
    secondaryForest: '#28665B',
    sage: '#7BA896',
    softSage: '#E2EEE9',
  },
  text: {
    primary: '#191917',
    secondary: '#57544D',
    muted: '#7E7970',
    inverse: '#FFFFFF',
  },
  border: {
    subtle: '#E7E1D6',
    strong: '#CFC7B8',
    bevel: '#DDD5C5',
    topHighlight: 'rgba(255, 255, 255, 0.94)',
    primaryBevel: '#134937',
    secondaryBevel: '#19473F',
    dangerBevel: '#E8B8BE',
  },
  status: {
    success: '#1E6B52',
    successSurface: '#E2EEE9',
    warning: '#B86E22',
    warningSurface: '#F9EFE0',
    danger: '#C83E4D',
    dangerSurface: '#FCE8EB',
  },
  m3: {
    primary: '#1E6B52',
    onPrimary: '#FFFFFF',
    primaryContainer: '#E2EEE9',
    onPrimaryContainer: '#0D3528',
    secondary: '#28665B',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#E5EFEA',
    onSecondaryContainer: '#10352E',
    tertiary: '#B86E22',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#F9EFE0',
    onTertiaryContainer: '#4D2C09',
    surface: '#F7F4EE',
    surfaceDim: '#EAE4D8',
    surfaceBright: '#FFFFFF',
    surfaceContainerLowest: '#FFFFFF',
    surfaceContainerLow: '#F1EDE3',
    surfaceContainer: '#EAE4D8',
    surfaceContainerHigh: '#E3DCCD',
    surfaceContainerHighest: '#DBD3C2',
    onSurface: '#191917',
    onSurfaceVariant: '#57544D',
    outline: '#7E7970',
    outlineVariant: '#E2DCCF',
    inverseSurface: '#212422',
    inverseOnSurface: '#F7F4EE',
    error: '#C83E4D',
    onError: '#FFFFFF',
    errorContainer: '#FCE8EB',
    onErrorContainer: '#5E131C',
  },
  expressive: {
    violet: {
      base: '#1E6B52',
      container: '#E2EEE9',
      onContainer: '#0D3528',
      bevel: '#B7D4C9',
      solidBevel: '#134937',
      shadow: '#1E6B52',
    },
    teal: {
      base: '#28665B',
      container: '#E5EFEA',
      onContainer: '#10352E',
      bevel: '#BDD5CA',
      solidBevel: '#19473F',
      shadow: '#28665B',
    },
    coral: {
      base: '#B85435',
      container: '#F8EAE3',
      onContainer: '#4E1F11',
      bevel: '#E7C5B5',
      solidBevel: '#8D3C23',
      shadow: '#B85435',
    },
    amber: {
      base: '#B86E22',
      container: '#F9EFE0',
      onContainer: '#4D2C09',
      bevel: '#E7CEA9',
      solidBevel: '#8F5214',
      shadow: '#B86E22',
    },
    cobalt: {
      base: '#345573',
      container: '#E8EEF4',
      onContainer: '#162839',
      bevel: '#C4D2DF',
      solidBevel: '#223A51',
      shadow: '#345573',
    },
    berry: {
      base: '#4C4740',
      container: '#EEEAE2',
      onContainer: '#26231F',
      bevel: '#D6CFC2',
      solidBevel: '#332F2A',
      shadow: '#4C4740',
    },
  },
};

/**
 * Semantic Archival Forest-Obsidian & Mint-Sage Dark Palette.
 */
export const darkColors: ColorPalette = {
  background: {
    primary: '#101312',
    secondary: '#161B19',
  },
  surface: {
    primary: '#1A201E',
    secondary: '#212926',
    elevated: '#262F2B',
  },
  brand: {
    primaryForest: '#5ED3A8',
    secondaryForest: '#79C9B6',
    sage: '#4EA685',
    softSage: '#183C2F',
  },
  text: {
    primary: '#F2F4F2',
    secondary: '#B8C2BD',
    muted: '#84908B',
    inverse: '#101312',
  },
  border: {
    subtle: '#2B3531',
    strong: '#3D4B45',
    bevel: '#090C0B',
    topHighlight: 'rgba(255, 255, 255, 0.09)',
    primaryBevel: '#3AA37D',
    secondaryBevel: '#4A9C8A',
    dangerBevel: '#3D1016',
  },
  status: {
    success: '#5ED3A8',
    successSurface: '#183C2F',
    warning: '#F0B66A',
    warningSurface: '#3A2912',
    danger: '#F28B95',
    dangerSurface: '#45181F',
  },
  m3: {
    primary: '#5ED3A8',
    onPrimary: '#082E20',
    primaryContainer: '#183C2F',
    onPrimaryContainer: '#D7F5EA',
    secondary: '#79C9B6',
    onSecondary: '#0A2E26',
    secondaryContainer: '#183831',
    onSecondaryContainer: '#D7F2EB',
    tertiary: '#F0B66A',
    onTertiary: '#3D2306',
    tertiaryContainer: '#3A2912',
    onTertiaryContainer: '#FCEAD2',
    surface: '#101312',
    surfaceDim: '#0B0E0D',
    surfaceBright: '#2F3A35',
    surfaceContainerLowest: '#090C0B',
    surfaceContainerLow: '#161B19',
    surfaceContainer: '#1A201E',
    surfaceContainerHigh: '#212926',
    surfaceContainerHighest: '#28322E',
    onSurface: '#F2F4F2',
    onSurfaceVariant: '#B8C2BD',
    outline: '#84908B',
    outlineVariant: '#2B3531',
    inverseSurface: '#F2F4F2',
    inverseOnSurface: '#101312',
    error: '#F28B95',
    onError: '#450B12',
    errorContainer: '#4E161E',
    onErrorContainer: '#FFE4E7',
  },
  expressive: {
    violet: {
      base: '#5ED3A8',
      container: '#183C2F',
      onContainer: '#D7F5EA',
      bevel: '#0E241C',
      solidBevel: '#3AA37D',
      shadow: '#040A08',
    },
    teal: {
      base: '#79C9B6',
      container: '#183831',
      onContainer: '#D7F2EB',
      bevel: '#0D211D',
      solidBevel: '#4A9C8A',
      shadow: '#040A08',
    },
    coral: {
      base: '#EA9677',
      container: '#3B1E14',
      onContainer: '#FCE4DB',
      bevel: '#22100A',
      solidBevel: '#BD6E51',
      shadow: '#0C0503',
    },
    amber: {
      base: '#F0B66A',
      container: '#3A2912',
      onContainer: '#FCEAD2',
      bevel: '#211709',
      solidBevel: '#BF8A44',
      shadow: '#0B0702',
    },
    cobalt: {
      base: '#95B8DC',
      container: '#182A3B',
      onContainer: '#DFECF8',
      bevel: '#0D1822',
      solidBevel: '#6388AE',
      shadow: '#04080C',
    },
    berry: {
      base: '#C9C3B8',
      container: '#262927',
      onContainer: '#EBE7DF',
      bevel: '#151716',
      solidBevel: '#948E84',
      shadow: '#070807',
    },
  },
};
