import type { AuthSessionResponse, UserProfileDto, UserSummary } from '@lifeos/shared-types';
import { create } from 'zustand';
import { secureStorage } from '../services/secure-storage';

interface AuthState {
  user: UserSummary | null;
  profile: UserProfileDto | null;
  accessToken: string | null;
  refreshToken: string | null;
  isHydrated: boolean;
  isAuthenticated: boolean;
  biometricLockEnabled: boolean;
  isBiometricUnlocked: boolean;

  setSession: (session: AuthSessionResponse) => Promise<void>;
  updateTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  setUserAndProfile: (user: UserSummary, profile: UserProfileDto) => void;
  setBiometricLockEnabled: (enabled: boolean) => Promise<void>;
  setBiometricUnlocked: (unlocked: boolean) => void;
  clearSession: () => Promise<void>;
  hydrateFromStorage: () => Promise<{ accessToken: string | null; refreshToken: string | null }>;
  markHydrated: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  accessToken: null,
  refreshToken: null,
  isHydrated: false,
  isAuthenticated: false,
  biometricLockEnabled: false,
  isBiometricUnlocked: true,

  setSession: async (session) => {
    await secureStorage.saveTokens(session.tokens.accessToken, session.tokens.refreshToken);
    set({
      user: session.user,
      profile: session.profile,
      accessToken: session.tokens.accessToken,
      refreshToken: session.tokens.refreshToken,
      isAuthenticated: true,
      isHydrated: true,
      isBiometricUnlocked: true,
    });
  },

  updateTokens: async (accessToken, refreshToken) => {
    await secureStorage.saveTokens(accessToken, refreshToken);
    set({ accessToken, refreshToken });
  },

  setUserAndProfile: (user, profile) => {
    set({ user, profile, isAuthenticated: true });
  },

  setBiometricLockEnabled: async (enabled) => {
    await secureStorage.setBiometricLockEnabled(enabled);
    set({ biometricLockEnabled: enabled });
  },

  setBiometricUnlocked: (unlocked) => {
    set({ isBiometricUnlocked: unlocked });
  },

  clearSession: async () => {
    await secureStorage.clearTokens();
    set({
      user: null,
      profile: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isHydrated: true,
      isBiometricUnlocked: true,
    });
  },

  hydrateFromStorage: async () => {
    const [{ accessToken, refreshToken }, biometricLockEnabled] = await Promise.all([
      secureStorage.getTokens(),
      secureStorage.getBiometricLockEnabled(),
    ]);
    set({
      accessToken,
      refreshToken,
      biometricLockEnabled,
      isBiometricUnlocked: !biometricLockEnabled || !refreshToken,
    });
    return { accessToken, refreshToken };
  },

  markHydrated: () => {
    set({ isHydrated: true });
  },
}));
