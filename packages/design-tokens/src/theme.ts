import { darkColors, lightColors, type ColorPalette } from './colors';
import { borderWidths, motion, radii, shadows, shapes, spacing } from './spacing';
import { fontFamilies, typographyScale } from './typography';

export type ThemeMode = 'light' | 'dark';

export interface LifeOSTheme {
  mode: ThemeMode;
  colors: ColorPalette;
  typography: typeof typographyScale;
  fonts: typeof fontFamilies;
  spacing: typeof spacing;
  radii: typeof radii;
  shapes: typeof shapes;
  motion: typeof motion;
  borderWidths: typeof borderWidths;
  shadows: typeof shadows;
}

export const lightTheme: LifeOSTheme = {
  mode: 'light',
  colors: lightColors,
  typography: typographyScale,
  fonts: fontFamilies,
  spacing,
  radii,
  shapes,
  motion,
  borderWidths,
  shadows,
};

export const darkTheme: LifeOSTheme = {
  mode: 'dark',
  colors: darkColors,
  typography: typographyScale,
  fonts: fontFamilies,
  spacing,
  radii,
  shapes,
  motion,
  borderWidths,
  shadows,
};
