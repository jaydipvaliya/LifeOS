import { z } from 'zod';
import { emailSchema, passwordSchema, uuidSchema } from './common';

export const userModeSchema = z.enum(['student', 'professional', 'transitioning']);

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(120),
  mode: userModeSchema.default('student'),
  privacyConsentAccepted: z.literal(true, {
    errorMap: () => ({ message: 'Privacy consent must be accepted to create an account' }),
  }),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(128),
  deviceName: z.string().trim().max(120).optional(),
  devicePlatform: z.enum(['android', 'ios', 'web']).optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(20, 'Refresh token is required'),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20),
  newPassword: passwordSchema,
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(20).optional(),
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password confirmation is required').max(128),
});

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  mode: userModeSchema.optional(),
  timezone: z.string().trim().min(2).max(64).optional(),
  locale: z.string().trim().min(2).max(16).optional(),
  themePreference: z.enum(['light', 'dark', 'system']).optional(),
  institutionName: z.string().trim().max(160).nullable().optional(),
  graduationYear: z.number().int().min(1980).max(2040).nullable().optional(),
  jobTitle: z.string().trim().max(120).nullable().optional(),
  companyName: z.string().trim().max(160).nullable().optional(),
  completeOnboarding: z.boolean().optional(),
});

export const confirmEmailVerificationSchema = z.object({
  token: z.string().min(20, 'Verification token is required'),
});

export const registerPushTokenSchema = z.object({
  pushToken: z.string().trim().min(10).max(255),
  deviceId: uuidSchema.optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ConfirmEmailVerificationInput = z.infer<typeof confirmEmailVerificationSchema>;
export type RegisterPushTokenInput = z.infer<typeof registerPushTokenSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
