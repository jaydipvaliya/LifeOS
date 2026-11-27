import { createHash, randomBytes, randomUUID } from 'node:crypto';
import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';
import { UnauthorizedError } from '../../shared/errors';

export interface AccessTokenPayload {
  userId: string;
  email: string;
  deviceId: string | null;
}

interface RawJwtClaims extends JwtPayload {
  sub: string;
  email: string;
  deviceId: string | null;
}

export class TokenService {
  signAccessToken(payload: AccessTokenPayload): {
    accessToken: string;
    expiresInSeconds: number;
  } {
    const expiresIn = env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'];
    const accessToken = jwt.sign(
      {
        email: payload.email,
        deviceId: payload.deviceId,
      },
      env.JWT_ACCESS_SECRET,
      {
        subject: payload.userId,
        jwtid: randomUUID(),
        issuer: 'lifeos-api',
        audience: 'lifeos-mobile',
        expiresIn,
      },
    );

    return {
      accessToken,
      expiresInSeconds: 15 * 60,
    };
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
        issuer: 'lifeos-api',
        audience: 'lifeos-mobile',
      }) as RawJwtClaims;

      if (!decoded.sub || typeof decoded.email !== 'string') {
        throw new UnauthorizedError('Invalid access token claims');
      }

      return {
        userId: decoded.sub,
        email: decoded.email,
        deviceId: typeof decoded.deviceId === 'string' ? decoded.deviceId : null,
      };
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        throw err;
      }
      throw new UnauthorizedError('Access token is invalid or expired');
    }
  }

  generateOpaqueToken(): string {
    return randomBytes(48).toString('base64url');
  }

  hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  getRefreshTokenExpiresAt(): Date {
    return new Date(Date.now() + env.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
  }

  signEmailVerificationToken(userId: string, email: string): string {
    return jwt.sign({ email, purpose: 'email_verification' }, env.JWT_ACCESS_SECRET, {
      subject: userId,
      jwtid: randomUUID(),
      issuer: 'lifeos-api',
      audience: 'lifeos-email-verify',
      expiresIn: '24h',
    });
  }

  verifyEmailVerificationToken(token: string): { userId: string; email: string } {
    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
        issuer: 'lifeos-api',
        audience: 'lifeos-email-verify',
      }) as JwtPayload & { email?: string; purpose?: string };

      if (
        !decoded.sub ||
        typeof decoded.email !== 'string' ||
        decoded.purpose !== 'email_verification'
      ) {
        throw new UnauthorizedError('Invalid email verification token');
      }
      return { userId: decoded.sub, email: decoded.email };
    } catch (err) {
      if (err instanceof UnauthorizedError) throw err;
      throw new UnauthorizedError('Email verification token is invalid or expired');
    }
  }
}
