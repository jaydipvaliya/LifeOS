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
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.4,
  },
  display: {
    fontFamily: fontFamilies.headingBold,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.6,
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
  sectionHeading: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  cardHeading: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: -0.1,
  },
  bodyLarge: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
  },
  body: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0,
  },
  bodyMedium: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0,
  },
  bodySmall: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
  },
  label: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  caption: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  editorialEyebrow: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.1,
  },
} as const satisfies Record<string, TypographyScaleToken>;

export type TypographyVariant = keyof typeof typographyScale;
