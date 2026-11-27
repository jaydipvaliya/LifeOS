import type { PrismaClient } from '@prisma/client';
import type {
  CreateLoginSessionParams,
  CreateUserParams,
  DeviceRecord,
  IAuthRepository,
  RefreshTokenRecord,
  RequestMeta,
  RotateRefreshTokenParams,
  UserProfileRecord,
  UserRecord,
} from './auth.types';

export class PrismaAuthRepository implements IAuthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findActiveUserByEmail(email: string): Promise<UserRecord | null> {
    return this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
  }

  async findActiveUserById(
    userId: string,
  ): Promise<(UserRecord & { profile: UserProfileRecord }) | null> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: { profile: true },
    });

    if (!user || !user.profile) {
      return null;
    }

    return {
      ...user,
      profile: user.profile,
    };
  }

  async createUserWithDefaults(params: CreateUserParams): Promise<{
    user: UserRecord;
    profile: UserProfileRecord;
    device: DeviceRecord;
  }> {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: params.email,
          passwordHash: params.passwordHash,
          fullName: params.fullName,
          mode: params.mode,
          privacyConsentAcceptedAt: params.privacyConsentAcceptedAt,
        },
      });

      const profile = await tx.userProfile.create({
        data: {
          userId: user.id,
        },
      });

      await tx.notificationPreference.create({
        data: {
          userId: user.id,
        },
      });

      const device = await tx.device.create({
        data: {
          userId: user.id,
          deviceName: params.deviceName,
          platform: params.devicePlatform,
        },
      });

      await tx.refreshToken.create({
        data: {
          userId: user.id,
          deviceId: device.id,
          familyId: params.familyId,
          tokenHash: params.refreshTokenHash,
          expiresAt: params.refreshExpiresAt,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'auth.register',
          resourceType: 'user',
          resourceId: user.id,
          ipAddress: params.meta.ipAddress,
          userAgent: params.meta.userAgent,
          metadata: { platform: params.devicePlatform, mode: params.mode },
        },
      });

      return { user, profile, device };
    });
  }

  async createLoginSession(params: CreateLoginSessionParams): Promise<{
    profile: UserProfileRecord;
    device: DeviceRecord;
  }> {
    return this.prisma.$transaction(async (tx) => {
      let profile = await tx.userProfile.findUnique({ where: { userId: params.userId } });
      if (!profile) {
        profile = await tx.userProfile.create({ data: { userId: params.userId } });
      }

      const device = await tx.device.create({
        data: {
          userId: params.userId,
          deviceName: params.deviceName,
          platform: params.devicePlatform,
        },
      });

      await tx.refreshToken.create({
        data: {
          userId: params.userId,
          deviceId: device.id,
          familyId: params.familyId,
          tokenHash: params.refreshTokenHash,
          expiresAt: params.refreshExpiresAt,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: params.userId,
          action: 'auth.login',
          resourceType: 'device',
          resourceId: device.id,
          ipAddress: params.meta.ipAddress,
          userAgent: params.meta.userAgent,
        },
      });

      return { profile, device };
    });
  }

  async findRefreshTokenByHash(
    tokenHash: string,
  ): Promise<(RefreshTokenRecord & { user: UserRecord; device: DeviceRecord | null }) | null> {
    return this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: true,
        device: true,
      },
    });
  }

  async rotateRefreshToken(params: RotateRefreshTokenParams): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const nextToken = await tx.refreshToken.create({
        data: {
          userId: params.userId,
          deviceId: params.deviceId,
          familyId: params.familyId,
          tokenHash: params.newTokenHash,
          expiresAt: params.newExpiresAt,
        },
      });

      await tx.refreshToken.update({
        where: { id: params.existingTokenId },
        data: {
          revokedAt: new Date(),
          replacedByTokenId: nextToken.id,
        },
      });

      if (params.deviceId) {
        await tx.device.update({
          where: { id: params.deviceId },
          data: { lastSeenAt: new Date() },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: params.userId,
          action: 'auth.refresh',
          resourceType: 'refresh_token',
          resourceId: nextToken.id,
          ipAddress: params.meta.ipAddress,
          userAgent: params.meta.userAgent,
        },
      });
    });
  }

  async revokeTokenFamily(
    familyId: string,
    userId: string,
    reason: string,
    meta: RequestMeta,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.refreshToken.updateMany({
        where: { familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'auth.token_family_revoked',
          resourceType: 'refresh_token_family',
          resourceId: familyId,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
          metadata: { reason },
        },
      });
    });
  }

  async revokeRefreshToken(tokenHash: string, userId: string, meta: RequestMeta): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const token = await tx.refreshToken.findFirst({
        where: { tokenHash, userId, revokedAt: null },
      });

      if (token) {
        await tx.refreshToken.update({
          where: { id: token.id },
          data: { revokedAt: new Date() },
        });

        if (token.deviceId) {
          await tx.device.updateMany({
            where: { id: token.deviceId, userId, revokedAt: null },
            data: { revokedAt: new Date() },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: 'auth.logout',
          resourceType: 'user',
          resourceId: userId,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
      });
    });
  }

  async listUserDevices(userId: string): Promise<DeviceRecord[]> {
    return this.prisma.device.findMany({
      where: { userId, revokedAt: null },
      orderBy: { lastSeenAt: 'desc' },
    });
  }

  async revokeDeviceSession(userId: string, deviceId: string, meta: RequestMeta): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const device = await tx.device.findFirst({
        where: { id: deviceId, userId, revokedAt: null },
      });

      if (!device) {
        return false;
      }

      const now = new Date();
      await tx.device.update({
        where: { id: device.id },
        data: { revokedAt: now },
      });

      await tx.refreshToken.updateMany({
        where: { deviceId: device.id, userId, revokedAt: null },
        data: { revokedAt: now },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'auth.session_revoked',
          resourceType: 'device',
          resourceId: deviceId,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
      });

      return true;
    });
  }

  async setPasswordResetToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
    meta: RequestMeta,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          passwordResetTokenHash: tokenHash,
          passwordResetExpiresAt: expiresAt,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'auth.password_reset_requested',
          resourceType: 'user',
          resourceId: userId,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
      });
    });
  }

  async findUserByResetTokenHash(tokenHash: string): Promise<UserRecord | null> {
    return this.prisma.user.findFirst({
      where: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { gt: new Date() },
        deletedAt: null,
      },
    });
  }

  async completePasswordReset(
    userId: string,
    newPasswordHash: string,
    meta: RequestMeta,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const now = new Date();
      await tx.user.update({
        where: { id: userId },
        data: {
          passwordHash: newPasswordHash,
          passwordResetTokenHash: null,
          passwordResetExpiresAt: null,
        },
      });

      await tx.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'auth.password_reset_completed',
          resourceType: 'user',
          resourceId: userId,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
      });
    });
  }

  async markEmailVerified(userId: string, meta: RequestMeta): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'auth.email_verified',
          resourceType: 'user',
          resourceId: userId,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
      });
    });
  }

  async softDeleteAccount(userId: string, meta: RequestMeta): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const now = new Date();
      await tx.user.update({
        where: { id: userId },
        data: { deletedAt: now },
      });

      await tx.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now },
      });

      await tx.device.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'user.account_deleted',
          resourceType: 'user',
          resourceId: userId,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
      });
    });
  }
}
