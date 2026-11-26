import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@lifeos/validation';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, Eye, EyeOff } from 'lucide-react-native';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  Button,
  EditorialCard,
  EditorialText,
  FilterChip,
  Screen,
  TextField,
} from '../../src/components/ui';
import { extractApiErrorMessage } from '../../src/services/api-client';
import { authApi } from '../../src/services/auth-api';
import { useAuthStore } from '../../src/stores/auth-store';
import { useTheme } from '../../src/theme';

const MODES: Array<{ value: 'student' | 'professional' | 'transitioning'; label: string }> = [
  { value: 'student', label: 'Student' },
  { value: 'professional', label: 'Professional' },
  { value: 'transitioning', label: 'Transitioning' },
];

export default function RegisterScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      mode: 'student',
      privacyConsentAccepted: false as unknown as true,
    },
  });

  const onSubmit = async (values: RegisterInput) => {
    setServerError(null);
    try {
      const session = await authApi.register(values);
      await setSession(session);
      router.replace('/(auth)/onboarding');
    } catch (err) {
      setServerError(extractApiErrorMessage(err, 'Unable to create your account.'));
    }
  };

  return (
    <Screen contentStyle={styles.container}>
      <View>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={10}
          style={styles.backRow}
        >
          <ArrowLeft size={18} strokeWidth={1.75} color={theme.colors.brand.primaryForest} />
          <EditorialText variant="label" tone="forest">
            Back
          </EditorialText>
        </Pressable>

        <EditorialText
          variant="pageHeadingEditorial"
          tone="primary"
          style={{ marginTop: theme.spacing.lg }}
        >
          Create your LifeOS.
        </EditorialText>
        <EditorialText variant="body" tone="secondary" style={{ marginTop: theme.spacing.xs }}>
          Only the essentials—start organizing documents, deadlines, and assets in seconds.
        </EditorialText>

        {serverError ? (
          <EditorialCard
            style={{
              marginTop: theme.spacing.lg,
              backgroundColor: theme.colors.status.dangerSurface,
              borderColor: theme.colors.status.danger,
            }}
          >
            <EditorialText variant="bodySmall" tone="danger">
              {serverError}
            </EditorialText>
          </EditorialCard>
        ) : null}

        <View style={[styles.form, { marginTop: theme.spacing.xl, gap: theme.spacing.md }]}>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Full Name"
                placeholder="Aarav Mehta"
                autoComplete="name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                errorText={errors.fullName?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Email Address"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                errorText={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Password"
                placeholder="Min 8 chars, upper, lower & number"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                errorText={errors.password?.message}
                rightAdornment={
                  <Pressable
                    onPress={() => setShowPassword((prev) => !prev)}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    hitSlop={8}
                  >
                    {showPassword ? (
                      <EyeOff size={18} strokeWidth={1.75} color={theme.colors.text.muted} />
                    ) : (
                      <Eye size={18} strokeWidth={1.75} color={theme.colors.text.muted} />
                    )}
                  </Pressable>
                }
              />
            )}
          />

          <View>
            <EditorialText
              variant="label"
              tone="primary"
              style={{ marginBottom: theme.spacing.xs }}
            >
              Current Life Stage
            </EditorialText>
            <Controller
              control={control}
              name="mode"
              render={({ field: { onChange, value } }) => (
                <View style={styles.modeRow}>
                  {MODES.map((option) => (
                    <FilterChip
                      key={option.value}
                      label={option.label}
                      selected={value === option.value}
                      onPress={() => onChange(option.value)}
                    />
                  ))}
                </View>
              )}
            />
          </View>

          <Controller
            control={control}
            name="privacyConsentAccepted"
            render={({ field: { onChange, value } }) => (
              <View>
                <Pressable
                  onPress={() => onChange(!value)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: Boolean(value) }}
                  style={styles.consentRow}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderRadius: 6,
                        borderWidth: theme.borderWidths.medium,
                        borderColor: value
                          ? theme.colors.brand.primaryForest
                          : theme.colors.border.strong,
                        backgroundColor: value
                          ? theme.colors.brand.primaryForest
                          : theme.colors.surface.primary,
                      },
                    ]}
                  >
                    {value ? (
                      <Check size={14} strokeWidth={2.5} color={theme.colors.text.inverse} />
                    ) : null}
                  </View>
                  <EditorialText variant="caption" tone="secondary" style={styles.consentText}>
                    I consent to LifeOS securely storing my documents and profile records under DPDP
                    privacy controls. You can export or delete your data anytime.
                  </EditorialText>
                </Pressable>
                {errors.privacyConsentAccepted?.message ? (
                  <EditorialText variant="caption" tone="danger" style={{ marginTop: 4 }}>
                    {errors.privacyConsentAccepted.message}
                  </EditorialText>
                ) : null}
              </View>
            )}
          />
        </View>
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        <Button
          label="Create Account"
          size="lg"
          fullWidth
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
        />
        <Button
          label="Already have an account? Sign in"
          variant="ghost"
          fullWidth
          onPress={() => router.replace('/(auth)/login')}
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
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  form: {
    width: '100%',
  },
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  consentText: {
    flex: 1,
    lineHeight: 18,
  },
});
