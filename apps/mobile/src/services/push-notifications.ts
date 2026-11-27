import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { authApi } from './auth-api';

let foregroundConfigured = false;

export function configureForegroundNotifications(): void {
  if (foregroundConfigured || Platform.OS === 'web') return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    foregroundConfigured = true;
  } catch {
    // Ignore in unsupported runtimes.
  }
}

export interface PushRegistrationOutcome {
  granted: boolean;
  token: string | null;
  syncedWithServer: boolean;
}

/**
 * Requests notification permission, configures the Android channel, obtains an Expo push token,
 * and registers it with the authenticated user's active device record.
 */
export async function registerForPushNotificationsAsync(): Promise<PushRegistrationOutcome> {
  if (Platform.OS === 'web') {
    return { granted: false, token: null, syncedWithServer: false };
  }

  configureForegroundNotifications();

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('lifeos-reminders', {
        name: 'LifeOS Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 200, 150, 200],
        lightColor: '#5B4AE6',
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    let finalStatus = existing.status;
    if (finalStatus !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      finalStatus = requested.status;
    }

    if (finalStatus !== 'granted') {
      return { granted: false, token: null, syncedWithServer: false };
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const tokenResult = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId: String(projectId) } : undefined,
    );
    const pushToken = tokenResult.data;
    if (!pushToken) {
      return { granted: true, token: null, syncedWithServer: false };
    }

    await authApi.registerPushToken({ pushToken });
    return { granted: true, token: pushToken, syncedWithServer: true };
  } catch {
    // Simulators or Expo Go runtimes without push capability fail gracefully here.
    return { granted: false, token: null, syncedWithServer: false };
  }
}
