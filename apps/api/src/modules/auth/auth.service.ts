import { randomUUID } from 'node:crypto';
import type {
  AuthSessionResponse,
  DeviceSessionDto,
  UserProfileDto,
  UserSummary,
} from '@lifeos/shared-types';
import type {
  ForgotPasswordInput,
  LoginInput,
  RefreshTokenInput,
  RegisterInput,
  ResetPasswordInput,
} from '@lifeos/validation';
import { logger } from '../../config/logger';
import { ConflictError, NotFoundError, UnauthorizedError } from '../../shared/errors';
import type {
  DeviceRecord,
  IAuthRepository,
  RequestMeta,
  UserProfileRecord,
  UserRecord,
} from './auth.types';
import type { PasswordService } from './password.service';
import type { TokenService } from './token.service';

function toUserSummary(user: UserRecord): UserSummary {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    mode: user.mode,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt.toISOString(),
  };
}

function toProfileDto(profile: UserProfileRecord): UserProfileDto {
  return {
    timezone: profile.timezone,
    locale: profile.locale,
    themePreference: profile.themePreference,
    institutionName: profile.institutionName,
    graduationYear: profile.graduationYear,
    jobTitle: profile.jobTitle,
    companyName: profile.companyName,
    onboardingCompletedAt: profile.onboardingCompletedAt
      ? profile.onboardingCompletedAt.toISOString()
      : null,
  };
}

function toDeviceDto(device: DeviceRecord): DeviceSessionDto {
  return {
    id: device.id,
    deviceName: device.deviceName,
    platform: device.platform,
    biometricEnabled: device.biometricEnabled,
    lastSeenAt: device.lastSeenAt.toISOString(),
    createdAt: device.createdAt.toISOString(),
  };
}

export class AuthService {
  constructor(
    private readonly repository: IAuthRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
  ) {}

  async register(input: RegisterInput, meta: RequestMeta): Promise<AuthSessionResponse> {
    const existing = await this.repository.findActiveUserByEmail(input.email);
    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    const passwordHash = await this.passwordService.hashPassword(input.password);
    const rawRefreshToken = this.tokenService.generateOpaqueToken();
    const refreshTokenHash = this.tokenService.hashToken(rawRefreshToken);
    const refreshExpiresAt = this.tokenService.getRefreshTokenExpiresAt();
    const familyId = randomUUID();

    const { user, profile, device } = await this.repository.createUserWithDefaults({
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      mode: input.mode,
      privacyConsentAcceptedAt: new Date(),
      deviceName: 'Primary Mobile Device',
      devicePlatform: 'android',
      familyId,
      refreshTokenHash,
      refreshExpiresAt,
      meta,
    });

    const { accessToken, expiresInSeconds } = this.tokenService.signAccessToken({
      userId: user.id,
      email: user.email,
      deviceId: device.id,
    });

    return {
      user: toUserSummary(user),
      profile: toProfileDto(profile),
      device: toDeviceDto(device),
      tokens: {
        accessToken,
        refreshToken: rawRefreshToken,
        expiresInSeconds,
      },
    };
  }

  async login(input: LoginInput, meta: RequestMeta): Promise<AuthSessionResponse> {
    const user = await this.repository.findActiveUserByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValid = await this.passwordService.verifyPassword(user.passwordHash, input.password);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const rawRefreshToken = this.tokenService.generateOpaqueToken();
    const refreshTokenHash = this.tokenService.hashToken(rawRefreshToken);
    const refreshExpiresAt = this.tokenService.getRefreshTokenExpiresAt();
    const familyId = randomUUID();

    const { profile, device } = await this.repository.createLoginSession({
      userId: user.id,
      deviceName: input.deviceName ?? 'Android Device',
      devicePlatform: input.devicePlatform ?? 'android',
      familyId,
      refreshTokenHash,
      refreshExpiresAt,
      meta,
    });

    const { accessToken, expiresInSeconds } = this.tokenService.signAccessToken({
      userId: user.id,
      email: user.email,
      deviceId: device.id,
    });

    return {
      user: toUserSummary(user),
      profile: toProfileDto(profile),
      device: toDeviceDto(device),
      tokens: {
        accessToken,
        refreshToken: rawRefreshToken,
        expiresInSeconds,
      },
    };
  }

  async refresh(
    input: RefreshTokenInput,
    meta: RequestMeta,
  ): Promise<{ accessToken: string; refreshToken: string; expiresInSeconds: number }> {
    const incomingHash = this.tokenService.hashToken(input.refreshToken);
    const stored = await this.repository.findRefreshTokenByHash(incomingHash);

    if (!stored || stored.user.deletedAt !== null) {
      throw new UnauthorizedError('Refresh token is invalid');
    }

    // Reuse detection: if an already-revoked token is re-presented, revoke the entire session family.
    if (stored.revokedAt !== null) {
      await this.repository.revokeTokenFamily(
        stored.familyId,
        stored.userId,
        'refresh_token_reuse_detected',
        meta,
      );
      throw new UnauthorizedError('Session invalidated due to token reuse');
    }

    if (stored.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedError('Refresh token has expired');
    }

    if (stored.device && stored.device.revokedAt !== null) {
      throw new UnauthorizedError('Device session has been revoked');
    }

    const nextRawRefreshToken = this.tokenService.generateOpaqueToken();
    const nextTokenHash = this.tokenService.hashToken(nextRawRefreshToken);
    const nextExpiresAt = this.tokenService.getRefreshTokenExpiresAt();

    await this.repository.rotateRefreshToken({
      existingTokenId: stored.id,
      userId: stored.userId,
      deviceId: stored.deviceId,
      familyId: stored.familyId,
      newTokenHash: nextTokenHash,
      newExpiresAt: nextExpiresAt,
      meta,
    });

    const { accessToken, expiresInSeconds } = this.tokenService.signAccessToken({
      userId: stored.user.id,
      email: stored.user.email,
      deviceId: stored.deviceId,
    });

    return {
      accessToken,
      refreshToken: nextRawRefreshToken,
      expiresInSeconds,
    };
  }

  async logout(
    userId: string,
    refreshToken: string | undefined,
    meta: RequestMeta,
  ): Promise<{ loggedOut: true }> {
    if (refreshToken) {
      const tokenHash = this.tokenService.hashToken(refreshToken);
      await this.repository.revokeRefreshToken(tokenHash, userId, meta);
    }
    return { loggedOut: true };
  }

  async forgotPassword(
    input: ForgotPasswordInput,
    meta: RequestMeta,
  ): Promise<{ accepted: true; message: string }> {
    const user = await this.repository.findActiveUserByEmail(input.email);
    if (user) {
      const rawToken = this.tokenService.generateOpaqueToken();
      const tokenHash = this.tokenService.hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      await this.repository.setPasswordResetToken(user.id, tokenHash, expiresAt, meta);
      logger.info({ userId: user.id }, 'Password reset token generated for user');
    }

    return {
      accepted: true,
      message: 'If an account matches that email, password reset instructions have been queued.',
    };
  }

  async resetPassword(
    input: ResetPasswordInput,
    meta: RequestMeta,
  ): Promise<{ passwordReset: true }> {
    const tokenHash = this.tokenService.hashToken(input.token);
    const user = await this.repository.findUserByResetTokenHash(tokenHash);
    if (!user) {
      throw new UnauthorizedError('Password reset token is invalid or expired');
    }

    const newPasswordHash = await this.passwordService.hashPassword(input.newPassword);
    await this.repository.completePasswordReset(user.id, newPasswordHash, meta);

    return { passwordReset: true };
  }

  async listSessions(userId: string): Promise<DeviceSessionDto[]> {
    const devices = await this.repository.listUserDevices(userId);
    return devices.map(toDeviceDto);
  }

  async revokeSession(
    userId: string,
    deviceId: string,
    meta: RequestMeta,
  ): Promise<{ revoked: true }> {
    const revoked = await this.repository.revokeDeviceSession(userId, deviceId, meta);
    if (!revoked) {
      throw new NotFoundError('Device session not found');
    }
    return { revoked: true };
  }

  async deleteAccount(
    userId: string,
    password: string,
    meta: RequestMeta,
  ): Promise<{ deleted: true }> {
    const userWithProfile = await this.repository.findActiveUserById(userId);
    if (!userWithProfile) {
      throw new NotFoundError('User account not found');
    }

    const isValid = await this.passwordService.verifyPassword(
      userWithProfile.passwordHash,
      password,
    );
    if (!isValid) {
      throw new UnauthorizedError('Invalid password confirmation');
    }

    await this.repository.softDeleteAccount(userId, meta);
    return { deleted: true };
  }
}
