import type { ApiErrorResponse, ApiSuccessResponse } from '@lifeos/shared-types';
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/auth-store';

const baseURL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:4000/api/v1';

export const apiClient = axios.create({
  baseURL,
  timeout: 45_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;

async function performTokenRefresh(): Promise<string | null> {
  const { refreshToken, updateTokens, clearSession } = useAuthStore.getState();
  if (!refreshToken) {
    await clearSession();
    return null;
  }

  try {
    const response = await axios.post<
      ApiSuccessResponse<{ accessToken: string; refreshToken: string; expiresInSeconds: number }>
    >(
      `${baseURL}/auth/refresh`,
      { refreshToken },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: 45_000,
      },
    );

    const nextTokens = response.data.data;
    await updateTokens(nextTokens.accessToken, nextTokens.refreshToken);
    return nextTokens.accessToken;
  } catch {
    await clearSession();
    return null;
  }
}

apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;
    const url = originalRequest?.url ?? '';

    const isAuthBypassRoute =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh');

    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthBypassRoute) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = performTokenRefresh().finally(() => {
          refreshPromise = null;
        });
      }

      const nextAccessToken = await refreshPromise;
      if (nextAccessToken) {
        originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
        return apiClient(originalRequest);
      }
    }

    return Promise.reject(error);
  },
);

export function extractApiErrorMessage(err: unknown, fallback = 'Something went wrong.'): string {
  if (axios.isAxiosError<ApiErrorResponse>(err)) {
    const apiError = err.response?.data?.error;
    if (apiError?.details && apiError.details.length > 0 && apiError.details[0]?.message) {
      return apiError.details[0].message;
    }
    if (apiError?.message) {
      return apiError.message;
    }
    if (err.code === 'ECONNABORTED' || err.message === 'Network Error') {
      return 'Unable to reach LifeOS server. Check your connection and try again.';
    }
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}
