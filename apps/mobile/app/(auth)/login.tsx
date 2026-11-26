import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@lifeos/validation';
import { useRouter } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import {
  Button,
  EditorialCard,
  EditorialText,
  Screen,
  ScreenTopBar,
  TextField,
} from '../../src/components/ui';
import { extractApiErrorMessage } from '../../src/services/api-client';
import { authApi } from '../../src/services/auth-api';
import { useAuthStore } from '../../src/stores/auth-store';
import { useTheme } from '../../src/theme';

export default function LoginScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      deviceName: Platform.OS === 'android' ? 'Android Device' : 'Mobile Device',
      devicePlatform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'web' ? 'web' : 'android',
    },
  });

  const onSubmit = async (values: LoginInput) => {
    setServerError(null);
    try {
      const session = await authApi.login(values);
      await setSession(session);
      if (!session.profile.onboardingCompletedAt) {
        router.replace('/(auth)/onboarding');
      } else {
        router.replace('/(app)');
      }
    } catch (err) {
      setServerError(extractApiErrorMessage(err, 'Unable to sign in. Please check your details.'));
    }
  };

  return (
    <Screen contentStyle={styles.container}>
      <View>
        <ScreenTopBar onBack={() => router.back()} badgeLabel="Sign In" badgeTone="violet" />

        <EditorialText variant="pageHeadingEditorial" tone="primary">
          Welcome back.
        </EditorialText>
        <EditorialText variant="body" tone="secondary" style={{ marginTop: theme.spacing.xs }}>
          Sign in to access your documents, assets, and upcoming reminders.
        </EditorialText>

        {serverError ? (
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
              {serverError}
            </EditorialText>
          </EditorialCard>
        ) : null}

        <View style={[styles.form, { marginTop: theme.spacing.xl, gap: theme.spacing.md }]}>
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
                placeholder="Enter your password"
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
                      <EyeOff size={18} strokeWidth={1.9} color={theme.colors.text.muted} />
                    ) : (
                      <Eye size={18} strokeWidth={1.9} color={theme.colors.text.muted} />
                    )}
                  </Pressable>
                }
              />
            )}
          />

          <Pressable
            onPress={() => router.push('/(auth)/forgot-password')}
            accessibilityRole="button"
            style={styles.forgotLink}
          >
            <EditorialText variant="label" tone="forest">
              Forgot password?
            </EditorialText>
          </Pressable>
        </View>
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        <Button
          label="Sign In"
          variant="filled"
          shape="pill"
          size="lg"
          fullWidth
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
        />
        <Button
          label="Create a new account"
          variant="tonal"
          shape="pill"
          fullWidth
          onPress={() => router.replace('/(auth)/register')}
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
  form: {
    width: '100%',
  },
  forgotLink: {
    alignSelf: 'flex-end',
  },
});
