import { describe, expect, it } from 'vitest';
import { PasswordService } from '../src/modules/auth/password.service';
import { TokenService } from '../src/modules/auth/token.service';

describe('PasswordService & TokenService', () => {
  it('hashes and verifies passwords with Argon2id', async () => {
    const passwordService = new PasswordService();
    const hash = await passwordService.hashPassword('StrongLifeOS#2026');

    expect(hash.startsWith('$argon2id$')).toBe(true);
    expect(await passwordService.verifyPassword(hash, 'StrongLifeOS#2026')).toBe(true);
    expect(await passwordService.verifyPassword(hash, 'WrongPassword')).toBe(false);
  });

  it('signs and verifies JWT access tokens and hashes opaque refresh tokens', () => {
    const tokenService = new TokenService();
    const { accessToken, expiresInSeconds } = tokenService.signAccessToken({
      userId: '11111111-1111-4111-8111-111111111111',
      email: 'user@lifeos.app',
      deviceId: '22222222-2222-4222-8222-222222222222',
    });

    expect(expiresInSeconds).toBe(900);
    const verified = tokenService.verifyAccessToken(accessToken);
    expect(verified.userId).toBe('11111111-1111-4111-8111-111111111111');
    expect(verified.email).toBe('user@lifeos.app');
    expect(verified.deviceId).toBe('22222222-2222-4222-8222-222222222222');

    const opaque = tokenService.generateOpaqueToken();
    const hashA = tokenService.hashToken(opaque);
    const hashB = tokenService.hashToken(opaque);
    expect(hashA).toBe(hashB);
    expect(hashA).not.toBe(opaque);
  });
});
