import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import { Fingerprint } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  Badge,
  Button,
  EditorialCard,
  EditorialText,
  Screen,
  TextField,
} from '../../src/components/ui';
import { extractApiErrorMessage } from '../../src/services/api-client';
import { authApi } from '../../src/services/auth-api';
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
          <EditorialText variant="editorialEyebrow" tone="secondaryForest" uppercase>
            Optional Personalization
          </EditorialText>
          <Badge label="Step 1 of 1" tone="sage" />
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
            style={{
              marginTop: theme.spacing.lg,
              backgroundColor: theme.colors.status.dangerSurface,
              borderColor: theme.colors.status.danger,
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

          <EditorialCard variant="secondary">
            <Pressable
              onPress={handleToggleBiometrics}
              accessibilityRole="switch"
              accessibilityState={{ checked: enableBiometrics }}
              style={styles.biometricRow}
            >
              <View style={styles.biometricLeft}>
                <Fingerprint
                  size={20}
                  strokeWidth={1.75}
                  color={theme.colors.brand.primaryForest}
                />
                <View style={{ flex: 1 }}>
                  <EditorialText variant="cardHeading" tone="primary">
                    Biometric App Lock
                  </EditorialText>
                  <EditorialText variant="caption" tone="secondary">
                    Protect your vault with device fingerprint or face unlock.
                  </EditorialText>
                </View>
              </View>
              <Badge
                label={enableBiometrics ? 'Enabled' : 'Off'}
                tone={enableBiometrics ? 'success' : 'neutral'}
              />
            </Pressable>
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
          variant="ghost"
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
  },
});
