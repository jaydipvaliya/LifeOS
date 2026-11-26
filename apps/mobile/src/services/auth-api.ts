import type {
  ApiSuccessResponse,
  AuthSessionResponse,
  DeviceSessionDto,
  UpdateProfilePayload,
  UserMeResponse,
} from '@lifeos/shared-types';
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from '@lifeos/validation';
import { apiClient } from './api-client';

export const authApi = {
  async register(input: RegisterInput): Promise<AuthSessionResponse> {
    const res = await apiClient.post<ApiSuccessResponse<AuthSessionResponse>>(
      '/auth/register',
      input,
    );
    return res.data.data;
  },

  async login(input: LoginInput): Promise<AuthSessionResponse> {
    const res = await apiClient.post<ApiSuccessResponse<AuthSessionResponse>>('/auth/login', input);
    return res.data.data;
  },

  async logout(refreshToken?: string): Promise<void> {
    await apiClient.post('/auth/logout', { refreshToken });
  },

  async forgotPassword(
    input: ForgotPasswordInput,
  ): Promise<{ accepted: boolean; message: string }> {
    const res = await apiClient.post<ApiSuccessResponse<{ accepted: boolean; message: string }>>(
      '/auth/forgot-password',
      input,
    );
    return res.data.data;
  },

  async resetPassword(input: ResetPasswordInput): Promise<{ passwordReset: boolean }> {
    const res = await apiClient.post<ApiSuccessResponse<{ passwordReset: boolean }>>(
      '/auth/reset-password',
      input,
    );
    return res.data.data;
  },

  async getMe(): Promise<UserMeResponse> {
    const res = await apiClient.get<ApiSuccessResponse<UserMeResponse>>('/users/me');
    return res.data.data;
  },

  async updateProfile(input: UpdateProfilePayload): Promise<UserMeResponse> {
    const res = await apiClient.patch<ApiSuccessResponse<UserMeResponse>>(
      '/users/me/profile',
      input,
    );
    return res.data.data;
  },

  async listSessions(): Promise<DeviceSessionDto[]> {
    const res =
      await apiClient.get<ApiSuccessResponse<{ sessions: DeviceSessionDto[] }>>('/auth/sessions');
    return res.data.data.sessions;
  },

  async revokeSession(deviceId: string): Promise<void> {
    await apiClient.delete(`/auth/sessions/${deviceId}`);
  },

  async deleteAccount(password: string): Promise<void> {
    await apiClient.delete('/auth/account', { data: { password } });
  },
};
