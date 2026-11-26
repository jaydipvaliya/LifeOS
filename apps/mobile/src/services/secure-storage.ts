import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEYS = {
  ACCESS_TOKEN: 'lifeos.auth.accessToken',
  REFRESH_TOKEN: 'lifeos.auth.refreshToken',
  BIOMETRIC_LOCK: 'lifeos.auth.biometricEnabled',
} as const;

// Non-persistent in-memory fallback strictly for web preview environments where SecureStore is unavailable.
const webMemoryFallback = new Map<string, string>();

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    webMemoryFallback.set(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return webMemoryFallback.get(key) ?? null;
  }
  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    webMemoryFallback.delete(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export const secureStorage = {
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      setItem(KEYS.ACCESS_TOKEN, accessToken),
      setItem(KEYS.REFRESH_TOKEN, refreshToken),
    ]);
  },

  async getTokens(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
    const [accessToken, refreshToken] = await Promise.all([
      getItem(KEYS.ACCESS_TOKEN),
      getItem(KEYS.REFRESH_TOKEN),
    ]);
    return { accessToken, refreshToken };
  },

  async clearTokens(): Promise<void> {
    await Promise.all([deleteItem(KEYS.ACCESS_TOKEN), deleteItem(KEYS.REFRESH_TOKEN)]);
  },

  async setBiometricLockEnabled(enabled: boolean): Promise<void> {
    await setItem(KEYS.BIOMETRIC_LOCK, enabled ? 'true' : 'false');
  },

  async getBiometricLockEnabled(): Promise<boolean> {
    const val = await getItem(KEYS.BIOMETRIC_LOCK);
    return val === 'true';
  },
};
