import type { DevicePlatform, UserMode } from '@lifeos/shared-types';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  mode: UserMode;
  emailVerified: boolean;
  createdAt: Date;
  deletedAt: Date | null;
}

export interface UserProfileRecord {
  timezone: string;
  locale: string;
  themePreference: string;
  institutionName: string | null;
  graduationYear: number | null;
  jobTitle: string | null;
  companyName: string | null;
  onboardingCompletedAt: Date | null;
}

export interface DeviceRecord {
  id: string;
  userId: string;
  deviceName: string;
  platform: DevicePlatform;
  biometricEnabled: boolean;
  lastSeenAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

export interface RefreshTokenRecord {
  id: string;
  userId: string;
  deviceId: string | null;
  familyId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedByTokenId: string | null;
}

export interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

export interface CreateUserParams {
  email: string;
  passwordHash: string;
  fullName: string;
  mode: UserMode;
  privacyConsentAcceptedAt: Date;
  deviceName: string;
  devicePlatform: DevicePlatform;
  familyId: string;
  refreshTokenHash: string;
  refreshExpiresAt: Date;
  meta: RequestMeta;
}

export interface CreateLoginSessionParams {
  userId: string;
  deviceName: string;
  devicePlatform: DevicePlatform;
  familyId: string;
  refreshTokenHash: string;
  refreshExpiresAt: Date;
  meta: RequestMeta;
}

export interface RotateRefreshTokenParams {
  existingTokenId: string;
  userId: string;
  deviceId: string | null;
  familyId: string;
  newTokenHash: string;
  newExpiresAt: Date;
  meta: RequestMeta;
}

export interface IAuthRepository {
  findActiveUserByEmail(email: string): Promise<UserRecord | null>;
  findActiveUserById(userId: string): Promise<(UserRecord & { profile: UserProfileRecord }) | null>;
  createUserWithDefaults(params: CreateUserParams): Promise<{
    user: UserRecord;
    profile: UserProfileRecord;
    device: DeviceRecord;
  }>;
  createLoginSession(params: CreateLoginSessionParams): Promise<{
    profile: UserProfileRecord;
    device: DeviceRecord;
  }>;
  findRefreshTokenByHash(
    tokenHash: string,
  ): Promise<(RefreshTokenRecord & { user: UserRecord; device: DeviceRecord | null }) | null>;
  rotateRefreshToken(params: RotateRefreshTokenParams): Promise<void>;
  revokeTokenFamily(
    familyId: string,
    userId: string,
    reason: string,
    meta: RequestMeta,
  ): Promise<void>;
  revokeRefreshToken(tokenHash: string, userId: string, meta: RequestMeta): Promise<void>;
  listUserDevices(userId: string): Promise<DeviceRecord[]>;
  revokeDeviceSession(userId: string, deviceId: string, meta: RequestMeta): Promise<boolean>;
  setPasswordResetToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
    meta: RequestMeta,
  ): Promise<void>;
  findUserByResetTokenHash(tokenHash: string): Promise<UserRecord | null>;
  completePasswordReset(userId: string, newPasswordHash: string, meta: RequestMeta): Promise<void>;
  softDeleteAccount(userId: string, meta: RequestMeta): Promise<void>;
}
