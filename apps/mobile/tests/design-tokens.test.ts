import { darkTheme, lightTheme } from '@lifeos/design-tokens';
import { describe, expect, it } from 'vitest';

describe('LifeOS Design System Tokens', () => {
  it('defines the required Warm Minimal x Editorial light palette', () => {
    expect(lightTheme.colors.background.primary).toBe('#F7F8F5');
    expect(lightTheme.colors.background.secondary).toBe('#F1F2EC');
    expect(lightTheme.colors.surface.primary).toBe('#FFFFFF');
    expect(lightTheme.colors.surface.secondary).toBe('#EEF1EA');
    expect(lightTheme.colors.brand.primaryForest).toBe('#253A32');
    expect(lightTheme.colors.brand.secondaryForest).toBe('#526F60');
    expect(lightTheme.colors.brand.sage).toBe('#A5BDA8');
    expect(lightTheme.colors.brand.softSage).toBe('#E6EEE7');
    expect(lightTheme.colors.text.primary).toBe('#25332D');
    expect(lightTheme.colors.text.secondary).toBe('#7C827D');
    expect(lightTheme.colors.text.muted).toBe('#78857D');
    expect(lightTheme.colors.border.subtle).toBe('#E6EAE5');
    expect(lightTheme.colors.status.success).toBe('#39866B');
    expect(lightTheme.colors.status.warning).toBe('#D69A48');
    expect(lightTheme.colors.status.danger).toBe('#D66A64');
  });

  it('provides a semantic dark theme scaffold with identical structure', () => {
    expect(darkTheme.mode).toBe('dark');
    expect(Object.keys(darkTheme.colors)).toEqual(Object.keys(lightTheme.colors));
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
