import type { UserMeResponse } from '@lifeos/shared-types';
import type { UpdateProfileInput } from '@lifeos/validation';
import { NotFoundError } from '../../shared/errors';
import type { IUsersRepository } from './users.types';

export class UsersService {
  constructor(private readonly repository: IUsersRepository) {}

  async getMe(userId: string): Promise<UserMeResponse> {
    const record = await this.repository.findUserWithProfile(userId);
    if (!record) {
      throw new NotFoundError('User account not found');
    }

    return {
      user: {
        id: record.id,
        email: record.email,
        fullName: record.fullName,
        mode: record.mode,
        emailVerified: record.emailVerified,
        createdAt: record.createdAt.toISOString(),
      },
      profile: {
        timezone: record.profile.timezone,
        locale: record.profile.locale,
        themePreference: record.profile.themePreference,
        institutionName: record.profile.institutionName,
        graduationYear: record.profile.graduationYear,
        jobTitle: record.profile.jobTitle,
        companyName: record.profile.companyName,
        onboardingCompletedAt: record.profile.onboardingCompletedAt
          ? record.profile.onboardingCompletedAt.toISOString()
          : null,
      },
    };
  }

  async updateMyProfile(userId: string, input: UpdateProfileInput): Promise<UserMeResponse> {
    const updated = await this.repository.updateProfile(userId, input);
    return {
      user: {
        id: updated.id,
        email: updated.email,
        fullName: updated.fullName,
        mode: updated.mode,
        emailVerified: updated.emailVerified,
        createdAt: updated.createdAt.toISOString(),
      },
      profile: {
        timezone: updated.profile.timezone,
        locale: updated.profile.locale,
        themePreference: updated.profile.themePreference,
        institutionName: updated.profile.institutionName,
        graduationYear: updated.profile.graduationYear,
        jobTitle: updated.profile.jobTitle,
        companyName: updated.profile.companyName,
        onboardingCompletedAt: updated.profile.onboardingCompletedAt
          ? updated.profile.onboardingCompletedAt.toISOString()
          : null,
      },
    };
  }

  async registerPushToken(
    userId: string,
    pushToken: string,
    deviceId?: string,
  ): Promise<{ updated: boolean }> {
    return this.repository.savePushToken(userId, pushToken, deviceId);
  }
}
