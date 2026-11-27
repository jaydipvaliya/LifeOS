import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import { Bell, Fingerprint } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Badge,
  Button,
  EditorialCard,
  EditorialText,
  ExpressiveSwitch,
  Screen,
  TextField,
} from '../../src/components/ui';
import { extractApiErrorMessage } from '../../src/services/api-client';
import { authApi } from '../../src/services/auth-api';
import { registerForPushNotificationsAsync } from '../../src/services/push-notifications';
import { useAuthStore } from '../../src/stores/auth-store';
import { useTheme } from '../../src/theme';

export default function OnboardingScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUserAndProfile = useAuthStore((s) => s.setUserAndProfile);
  const setBiometricLockEnabled = useAuthStore((s) => s.setBiometricLockEnabled);

  const [institutionName, setInstitutionName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [enableBiometrics, setEnableBiometrics] = useState(false);
  const [enablePushReminders, setEnablePushReminders] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isStudent = user?.mode === 'student' || user?.mode === 'transitioning';

  const handleToggleBiometrics = async () => {
    setErrorMessage(null);
    if (!enableBiometrics) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) {
        setErrorMessage('Biometric authentication is not configured on this device.');
        return;
      }
      setEnableBiometrics(true);
    } else {
      setEnableBiometrics(false);
    }
  };

  const handleComplete = async (skipFields: boolean) => {
    setSaving(true);
    setErrorMessage(null);
    try {
      const me = await authApi.updateProfile({
        institutionName: !skipFields && institutionName.trim() ? institutionName.trim() : null,
        jobTitle: !skipFields && jobTitle.trim() ? jobTitle.trim() : null,
        completeOnboarding: true,
      });
      setUserAndProfile(me.user, me.profile);
      await setBiometricLockEnabled(enableBiometrics);
      if (enablePushReminders) {
        await registerForPushNotificationsAsync();
      }
      router.replace('/(app)');
    } catch (err) {
      setErrorMessage(extractApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen contentStyle={styles.container}>
      <View>
        <View style={styles.topRow}>
          <EditorialText variant="editorialEyebrow" tone="cobaltVibrant" uppercase>
            Optional Personalization
          </EditorialText>
          <Badge label="Step 1 of 1" tone="cobalt" />
        </View>

        <EditorialText
          variant="pageHeadingEditorial"
          tone="primary"
          style={{ marginTop: theme.spacing.lg }}
        >
          Tailor LifeOS to your stage.
        </EditorialText>
        <EditorialText variant="body" tone="secondary" style={{ marginTop: theme.spacing.xs }}>
          Share only what helps organize your academic or career records. Everything here is
          optional.
        </EditorialText>

        {errorMessage ? (
          <EditorialCard
            shape="medium"
            padding="sm"
            style={{
              marginTop: theme.spacing.lg,
              backgroundColor: theme.colors.m3.errorContainer,
              borderColor: theme.colors.m3.error,
              borderWidth: theme.borderWidths.hairline,
            }}
          >
            <EditorialText variant="bodySmall" tone="danger">
              {errorMessage}
            </EditorialText>
          </EditorialCard>
        ) : null}

        <View style={{ marginTop: theme.spacing.xl, gap: theme.spacing.md }}>
          {isStudent ? (
            <TextField
              label="University or College (Optional)"
              placeholder="e.g. National Institute of Technology"
              value={institutionName}
              onChangeText={setInstitutionName}
            />
          ) : null}

          {!isStudent || user?.mode === 'transitioning' ? (
            <TextField
              label="Role or Title (Optional)"
              placeholder="e.g. Software Engineer"
              value={jobTitle}
              onChangeText={setJobTitle}
            />
          ) : null}

          <EditorialCard variant="teal" shape="extraLarge">
            <View style={styles.biometricRow}>
              <View style={styles.biometricLeft}>
                <View
                  style={[
                    styles.iconTile,
                    {
                      backgroundColor: theme.colors.surface.elevated,
                      borderRadius: theme.shapes.medium,
                    },
                  ]}
                >
                  <Fingerprint
                    size={22}
                    strokeWidth={1.9}
                    color={theme.colors.expressive.teal.base}
                  />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <EditorialText variant="cardHeading" tone="teal">
                    Biometric App Lock
                  </EditorialText>
                  <EditorialText variant="caption" tone="secondary">
                    Protect your vault with device fingerprint or face unlock.
                  </EditorialText>
                </View>
              </View>
              <ExpressiveSwitch
                value={enableBiometrics}
                onValueChange={() => void handleToggleBiometrics()}
                accent="teal"
                accessibilityLabel="Toggle biometric app lock"
              />
            </View>
          </EditorialCard>

          <EditorialCard variant="cobalt" shape="extraLarge">
            <View style={styles.biometricRow}>
              <View style={styles.biometricLeft}>
                <View
                  style={[
                    styles.iconTile,
                    {
                      backgroundColor: theme.colors.surface.elevated,
                      borderRadius: theme.shapes.medium,
                    },
                  ]}
                >
                  <Bell size={22} strokeWidth={1.9} color={theme.colors.expressive.cobalt.base} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <EditorialText variant="cardHeading" tone="cobalt">
                    Reminder Push Alerts
                  </EditorialText>
                  <EditorialText variant="caption" tone="secondary">
                    Receive timely alerts before deadlines, warranties, and renewals.
                  </EditorialText>
                </View>
              </View>
              <ExpressiveSwitch
                value={enablePushReminders}
                onValueChange={setEnablePushReminders}
                accent="cobalt"
                accessibilityLabel="Toggle push reminder alerts"
              />
            </View>
          </EditorialCard>
        </View>
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        <Button
          label="Save & Enter LifeOS"
          variant="filled"
          shape="pill"
          size="lg"
          fullWidth
          loading={saving}
          onPress={() => handleComplete(false)}
        />
        <Button
          label="Skip for now"
          variant="tonal"
          shape="pill"
          fullWidth
          disabled={saving}
          onPress={() => handleComplete(true)}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    gap: 24,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconTile: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  biometricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  biometricLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
});
