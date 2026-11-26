import { darkTheme, lightTheme } from '@lifeos/design-tokens';
import { describe, expect, it } from 'vitest';

describe('LifeOS Design System Tokens', () => {
  it('defines a colorful Material 3 Expressive triadic palette and tonal containers', () => {
    expect(lightTheme.colors.m3.primary).toBe('#4F46E5');
    expect(lightTheme.colors.m3.primaryContainer).toBe('#E3E0FF');
    expect(lightTheme.colors.m3.secondary).toBe('#0F9D8A');
    expect(lightTheme.colors.m3.secondaryContainer).toBe('#CCF7EE');
    expect(lightTheme.colors.m3.tertiary).toBe('#E85D3F');
    expect(lightTheme.colors.m3.tertiaryContainer).toBe('#FFE2DA');
    expect(lightTheme.colors.background.primary).toBe('#FAF8FF');
    expect(lightTheme.colors.surface.primary).toBe('#FFFFFF');
  });

  it('provides expressive multi-hue accent containers across light and dark themes', () => {
    const accentKeys = ['violet', 'teal', 'coral', 'amber', 'cobalt', 'berry'] as const;
    for (const key of accentKeys) {
      expect(lightTheme.colors.expressive[key].base).toBeTruthy();
      expect(lightTheme.colors.expressive[key].container).toBeTruthy();
      expect(darkTheme.colors.expressive[key].base).toBeTruthy();
      expect(darkTheme.colors.expressive[key].container).toBeTruthy();
    }
  });

  it('provides a semantic dark theme scaffold with identical structure', () => {
    expect(darkTheme.mode).toBe('dark');
    expect(Object.keys(darkTheme.colors)).toEqual(Object.keys(lightTheme.colors));
    expect(Object.keys(darkTheme.colors.m3)).toEqual(Object.keys(lightTheme.colors.m3));
  });

  it('provides Material 3 Expressive shapes and spring motion presets', () => {
    expect(lightTheme.shapes.large).toBe(24);
    expect(lightTheme.shapes.extraLarge).toBe(28);
    expect(lightTheme.motion.expressiveSpatial.stiffness).toBe(220);
  });

  it('maintains typography hierarchy within editorial specifications', () => {
    expect(lightTheme.typography.display.fontSize).toBeGreaterThanOrEqual(34);
    expect(lightTheme.typography.display.fontSize).toBeLessThanOrEqual(40);
    expect(lightTheme.typography.pageHeading.fontSize).toBeGreaterThanOrEqual(28);
    expect(lightTheme.typography.pageHeading.fontSize).toBeLessThanOrEqual(32);
    expect(lightTheme.typography.sectionHeading.fontSize).toBeGreaterThanOrEqual(20);
    expect(lightTheme.typography.sectionHeading.fontSize).toBeLessThanOrEqual(24);
    expect(lightTheme.typography.cardHeading.fontSize).toBeGreaterThanOrEqual(16);
    expect(lightTheme.typography.cardHeading.fontSize).toBeLessThanOrEqual(18);
    expect(lightTheme.typography.body.fontSize).toBeGreaterThanOrEqual(14);
    expect(lightTheme.typography.body.fontSize).toBeLessThanOrEqual(16);
    expect(lightTheme.typography.caption.fontSize).toBeGreaterThanOrEqual(12);
    expect(lightTheme.typography.caption.fontSize).toBeLessThanOrEqual(13);
  });
});
