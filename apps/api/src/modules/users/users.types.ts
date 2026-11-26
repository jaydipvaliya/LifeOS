import type { UpdateProfileInput } from '@lifeos/validation';
import type { UserProfileRecord, UserRecord } from '../auth/auth.types';

export interface IUsersRepository {
  findUserWithProfile(
    userId: string,
  ): Promise<(UserRecord & { profile: UserProfileRecord }) | null>;
  updateProfile(
    userId: string,
    input: UpdateProfileInput,
  ): Promise<UserRecord & { profile: UserProfileRecord }>;
}
