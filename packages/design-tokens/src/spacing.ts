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

/**
 * Material 3 Expressive shape tokens combined with LifeOS card specs.
 */
export const radii = {
  sm: 8,
  md: 14,
  card: 20,
  cardLarge: 28,
  full: 999,
} as const;

export const shapes = {
  extraSmall: 8,
  small: 12,
  medium: 16,
  squircle: 22,
  large: 24,
  extraLarge: 28,
  full: 9999,
} as const;

export const motion = {
  expressiveSpatial: {
    damping: 16,
    stiffness: 220,
    mass: 0.9,
  },
  expressiveEffects: {
    damping: 22,
    stiffness: 320,
    mass: 0.8,
  },
  standardSpatial: {
    damping: 20,
    stiffness: 260,
    mass: 1,
  },
} as const;

export const borderWidths = {
  hairline: 1,
  medium: 1.5,
} as const;

export const shadows = {
  none: {
    shadowColor: '#1B1564',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  subtle: {
    shadowColor: '#1B1564',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  floating: {
    shadowColor: '#1B1564',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 5,
  },
} as const;
