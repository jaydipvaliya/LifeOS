export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  editorialGap: 48,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  card: 18,
  cardLarge: 22,
  full: 999,
} as const;

export const borderWidths = {
  hairline: 1,
  medium: 1.5,
} as const;

export const shadows = {
  none: {
    shadowColor: '#25332D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  subtle: {
    shadowColor: '#25332D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  floating: {
    shadowColor: '#25332D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
} as const;
