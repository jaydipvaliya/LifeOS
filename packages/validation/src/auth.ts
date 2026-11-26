import { z } from 'zod';
import { emailSchema, passwordSchema } from './common';

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

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
