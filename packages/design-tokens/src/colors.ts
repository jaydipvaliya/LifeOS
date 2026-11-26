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
}

/**
 * LifeOS Warm Minimal x Editorial Light Palette.
 * All hex tokens are strictly aligned with the product visual identity.
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
};

/**
 * Semantic dark theme scaffold for future Dark Mode support.
 * Preserves deep forest calm without neon glare.
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
};
