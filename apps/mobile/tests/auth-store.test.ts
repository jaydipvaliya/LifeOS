import { beforeEach, describe, expect, it, vi } from 'vitest';

const secureMap = new Map<string, string>();

vi.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

vi.mock('expo-secure-store', () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  setItemAsync: vi.fn(async (key: string, value: string) => {
    secureMap.set(key, value);
  }),
  getItemAsync: vi.fn(async (key: string) => secureMap.get(key) ?? null),
  deleteItemAsync: vi.fn(async (key: string) => {
    secureMap.delete(key);
  }),
}));

import { useAuthStore } from '../src/stores/auth-store';

describe('useAuthStore & SecureStore persistence', () => {
  beforeEach(async () => {
    secureMap.clear();
    await useAuthStore.getState().clearSession();
  });

  it('persists session tokens and hydrates them cleanly', async () => {
    await useAuthStore.getState().setSession({
      user: {
        id: '11111111-1111-4111-8111-111111111111',
        email: 'aarav@lifeos.app',
        fullName: 'Aarav Mehta',
        mode: 'student',
        emailVerified: false,
        createdAt: '2026-11-26T09:00:00.000Z',
      },
      profile: {
        timezone: 'Asia/Kolkata',
        locale: 'en-IN',
        themePreference: 'light',
        institutionName: null,
        graduationYear: null,
        jobTitle: null,
        companyName: null,
        onboardingCompletedAt: null,
      },
      device: {
        id: '22222222-2222-4222-8222-222222222222',
        deviceName: 'Pixel 8',
        platform: 'android',
        biometricEnabled: false,
        lastSeenAt: '2026-11-26T09:00:00.000Z',
        createdAt: '2026-11-26T09:00:00.000Z',
      },
      tokens: {
        accessToken: 'access-1',
        refreshToken: 'refresh-1',
        expiresInSeconds: 900,
      },
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(secureMap.get('lifeos.auth.accessToken')).toBe('access-1');
    expect(secureMap.get('lifeos.auth.refreshToken')).toBe('refresh-1');

    await useAuthStore.getState().updateTokens('access-2', 'refresh-2');
    expect(useAuthStore.getState().accessToken).toBe('access-2');
    expect(secureMap.get('lifeos.auth.refreshToken')).toBe('refresh-2');

    await useAuthStore.getState().clearSession();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(secureMap.size).toBe(0);
  });
});
