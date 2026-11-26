import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordInput } from '@lifeos/validation';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, EditorialCard, EditorialText, Screen, TextField } from '../../src/components/ui';
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
          Choose a new password.
        </EditorialText>
        <EditorialText variant="body" tone="secondary" style={{ marginTop: theme.spacing.xs }}>
          Paste your recovery token and set a strong new password.
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

        {done ? (
          <EditorialCard variant="sage" style={{ marginTop: theme.spacing.xl }}>
            <EditorialText variant="cardHeading" tone="primary">
              Password updated
            </EditorialText>
            <EditorialText
              variant="bodySmall"
              tone="secondaryForest"
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
            size="lg"
            fullWidth
            onPress={() => router.replace('/(auth)/login')}
          />
        ) : (
          <Button
            label="Update Password"
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
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
});
