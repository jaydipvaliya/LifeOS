import type { UpdateProfileInput } from '@lifeos/validation';
import type { PrismaClient } from '@prisma/client';
import { NotFoundError } from '../../shared/errors';
import type { UserProfileRecord, UserRecord } from '../auth/auth.types';
import type { IUsersRepository } from './users.types';

export class PrismaUsersRepository implements IUsersRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findUserWithProfile(
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

  async updateProfile(
    userId: string,
    input: UpdateProfileInput,
  ): Promise<UserRecord & { profile: UserProfileRecord }> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.user.findFirst({
        where: { id: userId, deletedAt: null },
        include: { profile: true },
      });

      if (!existing) {
        throw new NotFoundError('User not found');
      }

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
          ...(input.mode !== undefined ? { mode: input.mode } : {}),
        },
      });

      const updatedProfile = await tx.userProfile.upsert({
        where: { userId },
        create: {
          userId,
          timezone: input.timezone ?? 'Asia/Kolkata',
          locale: input.locale ?? 'en-IN',
          themePreference: input.themePreference ?? 'light',
          institutionName: input.institutionName ?? null,
          graduationYear: input.graduationYear ?? null,
          jobTitle: input.jobTitle ?? null,
          companyName: input.companyName ?? null,
          onboardingCompletedAt: input.completeOnboarding ? new Date() : null,
        },
        update: {
          ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
          ...(input.locale !== undefined ? { locale: input.locale } : {}),
          ...(input.themePreference !== undefined
            ? { themePreference: input.themePreference }
            : {}),
          ...(input.institutionName !== undefined
            ? { institutionName: input.institutionName }
            : {}),
          ...(input.graduationYear !== undefined ? { graduationYear: input.graduationYear } : {}),
          ...(input.jobTitle !== undefined ? { jobTitle: input.jobTitle } : {}),
          ...(input.companyName !== undefined ? { companyName: input.companyName } : {}),
          ...(input.completeOnboarding ? { onboardingCompletedAt: new Date() } : {}),
        },
      });

      return {
        ...updatedUser,
        profile: updatedProfile,
      };
    });
  }
}
