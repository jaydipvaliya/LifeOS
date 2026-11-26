import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordInput } from '@lifeos/validation';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
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
import { useTheme } from '../../src/theme';

export default function ResetPasswordScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: '', newPassword: '' },
  });

  const onSubmit = async (values: ResetPasswordInput) => {
    setServerError(null);
    try {
      await authApi.resetPassword(values);
      setDone(true);
    } catch (err) {
      setServerError(extractApiErrorMessage(err));
    }
  };

  return (
    <Screen contentStyle={styles.container}>
      <View>
        <ScreenTopBar onBack={() => router.back()} badgeLabel="New Password" badgeTone="violet" />

        <EditorialText variant="pageHeadingEditorial" tone="primary">
          Choose a new password.
        </EditorialText>
        <EditorialText variant="body" tone="secondary" style={{ marginTop: theme.spacing.xs }}>
          Paste your recovery token and set a strong new password.
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

        {done ? (
          <EditorialCard variant="teal" style={{ marginTop: theme.spacing.xl }}>
            <EditorialText variant="cardHeading" tone="teal">
              Password updated
            </EditorialText>
            <EditorialText
              variant="bodySmall"
              tone="secondary"
              style={{ marginTop: theme.spacing.xs }}
            >
              All previous sessions have been revoked. You can now sign in with your new password.
            </EditorialText>
          </EditorialCard>
        ) : (
          <View style={{ marginTop: theme.spacing.xl, gap: theme.spacing.md }}>
            <Controller
              control={control}
              name="token"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="Recovery Token"
                  placeholder="Paste reset token"
                  autoCapitalize="none"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  errorText={errors.token?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="newPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="New Password"
                  placeholder="Min 8 chars, upper, lower & number"
                  secureTextEntry
                  autoCapitalize="none"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  errorText={errors.newPassword?.message}
                />
              )}
            />
          </View>
        )}
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        {done ? (
          <Button
            label="Sign In"
            variant="filled"
            shape="pill"
            size="lg"
            fullWidth
            onPress={() => router.replace('/(auth)/login')}
          />
        ) : (
          <Button
            label="Update Password"
            variant="filled"
            shape="pill"
            size="lg"
            fullWidth
            loading={isSubmitting}
            onPress={handleSubmit(onSubmit)}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    gap: 24,
  },
});
