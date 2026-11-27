import { randomUUID } from 'node:crypto';
import type { UpdateProfileInput } from '@lifeos/validation';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import type { IEmailService } from '../src/modules/email/email.service';
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
} from '../src/modules/auth/auth.types';
import type { IUsersRepository } from '../src/modules/users/users.types';
import { NotFoundError } from '../src/shared/errors';

class InMemoryAuthAndUsersRepository implements IAuthRepository, IUsersRepository {
  public users = new Map<
    string,
    UserRecord & { resetHash: string | null; resetExp: Date | null }
  >();
  public profiles = new Map<string, UserProfileRecord>();
  public devices = new Map<string, DeviceRecord>();
  public devicePushTokens = new Map<string, string>();
  public refreshTokens = new Map<string, RefreshTokenRecord>();

  async findActiveUserByEmail(email: string): Promise<UserRecord | null> {
    for (const user of this.users.values()) {
      if (user.email === email && user.deletedAt === null) {
        return user;
      }
    }
    return null;
  }

  async findActiveUserById(
    userId: string,
  ): Promise<(UserRecord & { profile: UserProfileRecord }) | null> {
    const user = this.users.get(userId);
    const profile = this.profiles.get(userId);
    if (!user || !profile || user.deletedAt !== null) {
      return null;
    }
    return { ...user, profile };
  }

  async createUserWithDefaults(params: CreateUserParams) {
    const now = new Date();
    const userId = randomUUID();
    const user: UserRecord & { resetHash: string | null; resetExp: Date | null } = {
      id: userId,
      email: params.email,
      passwordHash: params.passwordHash,
      fullName: params.fullName,
      mode: params.mode,
      emailVerified: false,
      createdAt: now,
      deletedAt: null,
      resetHash: null,
      resetExp: null,
    };
    const profile: UserProfileRecord = {
      timezone: 'Asia/Kolkata',
      locale: 'en-IN',
      themePreference: 'light',
      institutionName: null,
      graduationYear: null,
      jobTitle: null,
      companyName: null,
      onboardingCompletedAt: null,
    };
    const device: DeviceRecord = {
      id: randomUUID(),
      userId,
      deviceName: params.deviceName,
      platform: params.devicePlatform,
      biometricEnabled: false,
      lastSeenAt: now,
      revokedAt: null,
      createdAt: now,
    };
    const refreshToken: RefreshTokenRecord = {
      id: randomUUID(),
      userId,
      deviceId: device.id,
      familyId: params.familyId,
      tokenHash: params.refreshTokenHash,
      expiresAt: params.refreshExpiresAt,
      revokedAt: null,
      replacedByTokenId: null,
    };

    this.users.set(userId, user);
    this.profiles.set(userId, profile);
    this.devices.set(device.id, device);
    this.refreshTokens.set(refreshToken.id, refreshToken);

    return { user, profile, device };
  }

  async createLoginSession(params: CreateLoginSessionParams) {
    const now = new Date();
    const profile = this.profiles.get(params.userId)!;
    const device: DeviceRecord = {
      id: randomUUID(),
      userId: params.userId,
      deviceName: params.deviceName,
      platform: params.devicePlatform,
      biometricEnabled: false,
      lastSeenAt: now,
      revokedAt: null,
      createdAt: now,
    };
    const refreshToken: RefreshTokenRecord = {
      id: randomUUID(),
      userId: params.userId,
      deviceId: device.id,
      familyId: params.familyId,
      tokenHash: params.refreshTokenHash,
      expiresAt: params.refreshExpiresAt,
      revokedAt: null,
      replacedByTokenId: null,
    };

    this.devices.set(device.id, device);
    this.refreshTokens.set(refreshToken.id, refreshToken);

    return { profile, device };
  }

  async findRefreshTokenByHash(tokenHash: string) {
    for (const token of this.refreshTokens.values()) {
      if (token.tokenHash === tokenHash) {
        const user = this.users.get(token.userId);
        if (!user) return null;
        const device = token.deviceId ? (this.devices.get(token.deviceId) ?? null) : null;
        return { ...token, user, device };
      }
    }
    return null;
  }

  async rotateRefreshToken(params: RotateRefreshTokenParams) {
    const nextId = randomUUID();
    this.refreshTokens.set(nextId, {
      id: nextId,
      userId: params.userId,
      deviceId: params.deviceId,
      familyId: params.familyId,
      tokenHash: params.newTokenHash,
      expiresAt: params.newExpiresAt,
      revokedAt: null,
      replacedByTokenId: null,
    });
    const existing = this.refreshTokens.get(params.existingTokenId);
    if (existing) {
      existing.revokedAt = new Date();
      existing.replacedByTokenId = nextId;
    }
  }

  async revokeTokenFamily(familyId: string) {
    const now = new Date();
    for (const token of this.refreshTokens.values()) {
      if (token.familyId === familyId && token.revokedAt === null) {
        token.revokedAt = now;
      }
    }
  }

  async revokeRefreshToken(tokenHash: string, userId: string) {
    const now = new Date();
    for (const token of this.refreshTokens.values()) {
      if (token.tokenHash === tokenHash && token.userId === userId && token.revokedAt === null) {
        token.revokedAt = now;
        if (token.deviceId) {
          const device = this.devices.get(token.deviceId);
          if (device) device.revokedAt = now;
        }
      }
    }
  }

  async listUserDevices(userId: string): Promise<DeviceRecord[]> {
    return Array.from(this.devices.values()).filter(
      (device) => device.userId === userId && device.revokedAt === null,
    );
  }

  async revokeDeviceSession(userId: string, deviceId: string, _meta: RequestMeta) {
    const device = this.devices.get(deviceId);
    if (!device || device.userId !== userId || device.revokedAt !== null) {
      return false;
    }
    const now = new Date();
    device.revokedAt = now;
    for (const token of this.refreshTokens.values()) {
      if (token.deviceId === deviceId && token.revokedAt === null) {
        token.revokedAt = now;
      }
    }
    return true;
  }

  async setPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date) {
    const user = this.users.get(userId);
    if (user) {
      user.resetHash = tokenHash;
      user.resetExp = expiresAt;
    }
  }

  async findUserByResetTokenHash(tokenHash: string): Promise<UserRecord | null> {
    const now = Date.now();
    for (const user of this.users.values()) {
      if (
        user.resetHash === tokenHash &&
        user.resetExp &&
        user.resetExp.getTime() > now &&
        user.deletedAt === null
      ) {
        return user;
      }
    }
    return null;
  }

  async completePasswordReset(userId: string, newPasswordHash: string) {
    const user = this.users.get(userId);
    if (user) {
      user.passwordHash = newPasswordHash;
      user.resetHash = null;
      user.resetExp = null;
    }
    const now = new Date();
    for (const token of this.refreshTokens.values()) {
      if (token.userId === userId && token.revokedAt === null) {
        token.revokedAt = now;
      }
    }
  }

  async markEmailVerified(userId: string) {
    const user = this.users.get(userId);
    if (user) {
      user.emailVerified = true;
    }
  }

  async softDeleteAccount(userId: string) {
    const now = new Date();
    const user = this.users.get(userId);
    if (user) user.deletedAt = now;
    for (const device of this.devices.values()) {
      if (device.userId === userId) device.revokedAt = now;
    }
    for (const token of this.refreshTokens.values()) {
      if (token.userId === userId) token.revokedAt = now;
    }
  }

  async findUserWithProfile(userId: string) {
    return this.findActiveUserById(userId);
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const record = await this.findActiveUserById(userId);
    if (!record) {
      throw new NotFoundError('User not found');
    }
    const user = this.users.get(userId)!;
    const profile = this.profiles.get(userId)!;

    if (input.fullName !== undefined) user.fullName = input.fullName;
    if (input.mode !== undefined) user.mode = input.mode;
    if (input.timezone !== undefined) profile.timezone = input.timezone;
    if (input.locale !== undefined) profile.locale = input.locale;
    if (input.themePreference !== undefined) profile.themePreference = input.themePreference;
    if (input.institutionName !== undefined) profile.institutionName = input.institutionName;
    if (input.graduationYear !== undefined) profile.graduationYear = input.graduationYear;
    if (input.jobTitle !== undefined) profile.jobTitle = input.jobTitle;
    if (input.companyName !== undefined) profile.companyName = input.companyName;
    if (input.completeOnboarding) profile.onboardingCompletedAt = new Date();

    return { ...user, profile };
  }

  async savePushToken(
    userId: string,
    pushToken: string,
    deviceId?: string,
  ): Promise<{ updated: boolean }> {
    const activeDevices = Array.from(this.devices.values())
      .filter((d) => d.userId === userId && d.revokedAt === null)
      .sort((a, b) => b.lastSeenAt.getTime() - a.lastSeenAt.getTime());

    const target = deviceId ? activeDevices.find((d) => d.id === deviceId) : activeDevices[0];

    if (!target) {
      return { updated: false };
    }

    this.devicePushTokens.set(target.id, pushToken);
    return { updated: true };
  }
}

describe('Authentication & User Profile Flows', () => {
  it('registers a user, enforces consent, rejects duplicates, and accesses protected profile', async () => {
    const repo = new InMemoryAuthAndUsersRepository();
    const app = createApp({ authRepository: repo, usersRepository: repo });

    const invalidConsent = await request(app).post('/api/v1/auth/register').send({
      email: 'ananya@example.com',
      password: 'Password123',
      fullName: 'Ananya Rao',
      privacyConsentAccepted: false,
    });
    expect(invalidConsent.status).toBe(400);

    const registered = await request(app).post('/api/v1/auth/register').send({
      email: 'Ananya@Example.com',
      password: 'Password123',
      fullName: 'Ananya Rao',
      mode: 'student',
      privacyConsentAccepted: true,
    });
    expect(registered.status).toBe(201);
    expect(registered.body.data.user.email).toBe('ananya@example.com');
    expect(registered.body.data.tokens.accessToken).toBeTruthy();
    expect(registered.body.data.tokens.refreshToken).toBeTruthy();

    const duplicate = await request(app).post('/api/v1/auth/register').send({
      email: 'ananya@example.com',
      password: 'Password123',
      fullName: 'Ananya Rao',
      privacyConsentAccepted: true,
    });
    expect(duplicate.status).toBe(409);

    const unauthMe = await request(app).get('/api/v1/users/me');
    expect(unauthMe.status).toBe(401);

    const me = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${registered.body.data.tokens.accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.data.user.fullName).toBe('Ananya Rao');

    const updatedProfile = await request(app)
      .patch('/api/v1/users/me/profile')
      .set('Authorization', `Bearer ${registered.body.data.tokens.accessToken}`)
      .send({
        institutionName: 'IIT Bombay',
        graduationYear: 2027,
        completeOnboarding: true,
      });
    expect(updatedProfile.status).toBe(200);
    expect(updatedProfile.body.data.profile.institutionName).toBe('IIT Bombay');
    expect(updatedProfile.body.data.profile.onboardingCompletedAt).toBeTruthy();
  });

  it('logs in, rotates refresh tokens, and revokes token family upon reuse detection', async () => {
    const repo = new InMemoryAuthAndUsersRepository();
    const app = createApp({ authRepository: repo, usersRepository: repo });

    await request(app).post('/api/v1/auth/register').send({
      email: 'rohan@example.com',
      password: 'Password123',
      fullName: 'Rohan Sharma',
      privacyConsentAccepted: true,
    });

    const badLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'rohan@example.com',
      password: 'WrongPassword1',
    });
    expect(badLogin.status).toBe(401);

    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'rohan@example.com',
      password: 'Password123',
      deviceName: 'Pixel 8',
      devicePlatform: 'android',
    });
    expect(login.status).toBe(200);

    const firstRefresh = login.body.data.tokens.refreshToken;
    const rotated = await request(app).post('/api/v1/auth/refresh').send({
      refreshToken: firstRefresh,
    });
    expect(rotated.status).toBe(200);
    const secondRefresh = rotated.body.data.refreshToken;
    expect(secondRefresh).not.toBe(firstRefresh);

    // Reusing the already-rotated token triggers family revocation.
    const reuseAttempt = await request(app).post('/api/v1/auth/refresh').send({
      refreshToken: firstRefresh,
    });
    expect(reuseAttempt.status).toBe(401);

    const revokedSecondAttempt = await request(app).post('/api/v1/auth/refresh').send({
      refreshToken: secondRefresh,
    });
    expect(revokedSecondAttempt.status).toBe(401);
  });

  it('supports session listing, logout, and soft account deletion', async () => {
    const repo = new InMemoryAuthAndUsersRepository();
    const app = createApp({ authRepository: repo, usersRepository: repo });

    const reg = await request(app).post('/api/v1/auth/register').send({
      email: 'meera@example.com',
      password: 'Password123',
      fullName: 'Meera Nair',
      privacyConsentAccepted: true,
    });
    const accessToken = reg.body.data.tokens.accessToken;

    const sessions = await request(app)
      .get('/api/v1/auth/sessions')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(sessions.status).toBe(200);
    expect(sessions.body.data.sessions).toHaveLength(1);

    const delBad = await request(app)
      .delete('/api/v1/auth/account')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ password: 'WrongPassword1' });
    expect(delBad.status).toBe(401);

    const delOk = await request(app)
      .delete('/api/v1/auth/account')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ password: 'Password123' });
    expect(delOk.status).toBe(200);

    const loginAfterDelete = await request(app).post('/api/v1/auth/login').send({
      email: 'meera@example.com',
      password: 'Password123',
    });
    expect(loginAfterDelete.status).toBe(401);
  });

  it('verifies email, dispatches password reset emails, and registers Expo push tokens', async () => {
    const repo = new InMemoryAuthAndUsersRepository();
    const sentEmails: Array<{ to: string; subject: string; text: string }> = [];
    const emailService: IEmailService = {
      providerName: 'test-spy',
      async sendEmail(message) {
        sentEmails.push({ to: message.to, subject: message.subject, text: message.text });
        return { delivered: true, messageId: `msg-${sentEmails.length}` };
      },
    };
    const app = createApp({ authRepository: repo, usersRepository: repo, emailService });

    const reg = await request(app).post('/api/v1/auth/register').send({
      email: 'kiran@example.com',
      password: 'Password123',
      fullName: 'Kiran Patel',
      privacyConsentAccepted: true,
    });
    expect(reg.status).toBe(201);
    const accessToken = reg.body.data.tokens.accessToken as string;
    const userId = reg.body.data.user.id as string;

    const reqVerify = await request(app)
      .post('/api/v1/auth/verify-email/request')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(reqVerify.status).toBe(200);
    expect(reqVerify.body.data.sent).toBe(true);
    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0].to).toBe('kiran@example.com');

    // Extract the signed JWT verification token from the verification email body.
    const tokenMatch = sentEmails[0].text.match(/eyJ[\w-]+\.[\w-]+\.[\w-]+/);
    expect(tokenMatch?.[0]).toBeTruthy();

    const badConfirm = await request(app)
      .post('/api/v1/auth/verify-email/confirm')
      .send({ token: 'invalid-token-value-12345' });
    expect(badConfirm.status).toBe(401);

    const okConfirm = await request(app)
      .post('/api/v1/auth/verify-email/confirm')
      .send({ token: tokenMatch![0] });
    expect(okConfirm.status).toBe(200);
    expect(okConfirm.body.data.emailVerified).toBe(true);
    expect(repo.users.get(userId)?.emailVerified).toBe(true);

    const forgotRes = await request(app).post('/api/v1/auth/forgot-password').send({
      email: 'kiran@example.com',
    });
    expect(forgotRes.status).toBe(200);
    expect(sentEmails).toHaveLength(2);
    expect(sentEmails[1].subject.toLowerCase()).toContain('reset');

    const badPushRes = await request(app)
      .post('/api/v1/users/me/push-token')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ pushToken: 'short' });
    expect(badPushRes.status).toBe(400);

    const pushRes = await request(app)
      .post('/api/v1/users/me/push-token')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ pushToken: 'ExponentPushToken[test-device-token-123]' });
    expect(pushRes.status).toBe(200);
    expect(pushRes.body.data.updated).toBe(true);
    expect(Array.from(repo.devicePushTokens.values())).toContain(
      'ExponentPushToken[test-device-token-123]',
    );
  });
});
