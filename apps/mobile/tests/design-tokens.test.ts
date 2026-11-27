import { darkTheme, lightTheme } from '@lifeos/design-tokens';
import { describe, expect, it } from 'vitest';

describe('LifeOS Design System Tokens', () => {
  it('defines the Archival Ivory and Deep Pine tonal palette across light and dark modes', () => {
    expect(lightTheme.colors.m3.primary).toBe('#1E6B52');
    expect(lightTheme.colors.m3.primaryContainer).toBe('#E2EEE9');
    expect(lightTheme.colors.m3.secondary).toBe('#28665B');
    expect(lightTheme.colors.m3.secondaryContainer).toBe('#E5EFEA');
    expect(lightTheme.colors.m3.tertiary).toBe('#B86E22');
    expect(lightTheme.colors.m3.tertiaryContainer).toBe('#F9EFE0');
    expect(lightTheme.colors.background.primary).toBe('#F7F4EE');
    expect(lightTheme.colors.surface.primary).toBe('#FFFFFF');
    expect(darkTheme.colors.background.primary).toBe('#101312');
    expect(darkTheme.colors.m3.primary).toBe('#5ED3A8');
  });

  it('provides expressive multi-hue accent containers across light and dark themes', () => {
    const accentKeys = ['violet', 'teal', 'coral', 'amber', 'cobalt', 'berry'] as const;
    for (const key of accentKeys) {
      expect(lightTheme.colors.expressive[key].base).toBeTruthy();
      expect(lightTheme.colors.expressive[key].container).toBeTruthy();
      expect(lightTheme.colors.expressive[key].bevel).toBeTruthy();
      expect(lightTheme.colors.expressive[key].solidBevel).toBeTruthy();
      expect(darkTheme.colors.expressive[key].base).toBeTruthy();
      expect(darkTheme.colors.expressive[key].container).toBeTruthy();
      expect(darkTheme.colors.expressive[key].bevel).toBeTruthy();
      expect(darkTheme.colors.expressive[key].solidBevel).toBeTruthy();
    }
    expect(lightTheme.borderWidths.tactileLip).toBe(4);
    expect(darkTheme.shadows.tactile.elevation).toBe(4);
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
