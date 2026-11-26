import type { UserMode, UserSummary } from './domain';

export type DevicePlatform = 'android' | 'ios' | 'web';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

export interface UserProfileDto {
  timezone: string;
  locale: string;
  themePreference: string;
  institutionName: string | null;
  graduationYear: number | null;
  jobTitle: string | null;
  companyName: string | null;
  onboardingCompletedAt: string | null;
}

export interface DeviceSessionDto {
  id: string;
  deviceName: string;
  platform: DevicePlatform;
  biometricEnabled: boolean;
  lastSeenAt: string;
  createdAt: string;
}

export interface AuthSessionResponse {
  user: UserSummary;
  profile: UserProfileDto;
  device: DeviceSessionDto;
  tokens: AuthTokens;
}

export interface UserMeResponse {
  user: UserSummary;
  profile: UserProfileDto;
}

export interface UpdateProfilePayload {
  fullName?: string;
  mode?: UserMode;
  timezone?: string;
  locale?: string;
  themePreference?: 'light' | 'dark' | 'system';
  institutionName?: string | null;
  graduationYear?: number | null;
  jobTitle?: string | null;
  companyName?: string | null;
  completeOnboarding?: boolean;
}
