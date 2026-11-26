export const fontFamilies = {
  editorial: 'DMSerifDisplay_400Regular',
  editorialItalic: 'DMSerifDisplay_400Regular_Italic',
  headingRegular: 'Manrope_500Medium',
  headingSemiBold: 'Manrope_600SemiBold',
  headingBold: 'Manrope_700Bold',
  bodyRegular: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
} as const;

export interface TypographyScaleToken {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
}

export const typographyScale = {
  displayEditorial: {
    fontFamily: fontFamilies.editorial,
    fontSize: 38,
    lineHeight: 44,
    letterSpacing: -0.4,
  },
  display: {
    fontFamily: fontFamilies.headingBold,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.7,
  },
  headlineLarge: {
    fontFamily: fontFamilies.headingBold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  pageHeading: {
    fontFamily: fontFamilies.headingBold,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.4,
  },
  pageHeadingEditorial: {
    fontFamily: fontFamilies.editorial,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.2,
  },
  headlineMedium: {
    fontFamily: fontFamilies.headingBold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  sectionHeading: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  titleLarge: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.1,
  },
  cardHeading: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: -0.1,
  },
  titleMedium: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0,
  },
  bodyLarge: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.1,
  },
  body: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  bodyMedium: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  bodySmall: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.15,
  },
  label: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.25,
  },
  labelLarge: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.15,
  },
  caption: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.3,
  },
  editorialEyebrow: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1.2,
  },
} as const satisfies Record<string, TypographyScaleToken>;

export type TypographyVariant = keyof typeof typographyScale;
