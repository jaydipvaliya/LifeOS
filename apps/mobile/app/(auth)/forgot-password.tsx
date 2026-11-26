import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@lifeos/validation';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, EditorialCard, EditorialText, Screen, TextField } from '../../src/components/ui';
import { extractApiErrorMessage } from '../../src/services/api-client';
import { authApi } from '../../src/services/auth-api';
import { useTheme } from '../../src/theme';

export default function ForgotPasswordScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotPasswordInput) => {
    setServerError(null);
    try {
      const res = await authApi.forgotPassword(values);
      setSubmittedMessage(res.message);
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
          Reset your password.
        </EditorialText>
        <EditorialText variant="body" tone="secondary" style={{ marginTop: theme.spacing.xs }}>
          Enter the email associated with your LifeOS account to request reset instructions.
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

        {submittedMessage ? (
          <EditorialCard variant="sage" style={{ marginTop: theme.spacing.xl }}>
            <View style={styles.successHeader}>
              <CheckCircle2 size={20} strokeWidth={1.75} color={theme.colors.status.success} />
              <EditorialText variant="cardHeading" tone="primary">
                Request received
              </EditorialText>
            </View>
            <EditorialText
              variant="bodySmall"
              tone="secondaryForest"
              style={{ marginTop: theme.spacing.xs }}
            >
              {submittedMessage}
            </EditorialText>
          </EditorialCard>
        ) : (
          <View style={{ marginTop: theme.spacing.xl }}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="Email Address"
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  errorText={errors.email?.message}
                />
              )}
            />
          </View>
        )}
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        {submittedMessage ? (
          <Button
            label="I have a reset token"
            size="lg"
            fullWidth
            onPress={() => router.push('/(auth)/reset-password')}
          />
        ) : (
          <Button
            label="Send Reset Instructions"
            size="lg"
            fullWidth
            loading={isSubmitting}
            onPress={handleSubmit(onSubmit)}
          />
        )}
        <Button
          label="Return to Sign In"
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
  successHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
