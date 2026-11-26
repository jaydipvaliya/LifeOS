export interface ApiMeta {
  requestId: string;
  timestamp: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta: ApiMeta;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
  meta: ApiMeta;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface HealthStatus {
  status: 'ok' | 'degraded';
  service: string;
  version: string;
  uptimeSeconds: number;
  timestamp: string;
  checks: {
    database: 'configured' | 'connected' | 'disconnected' | 'unconfigured';
    redis: 'configured' | 'connected' | 'disconnected' | 'unconfigured';
    storage: 'configured' | 'unconfigured';
  };
}
