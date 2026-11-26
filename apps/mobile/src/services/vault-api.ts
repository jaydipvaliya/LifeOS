import type {
  ApiSuccessResponse,
  CategoryDto,
  DashboardDataDto,
  DocumentDetailDto,
  DocumentListItemDto,
  PaginationMeta,
  SignedDownloadUrlResponse,
  UploadInitResponse,
} from '@lifeos/shared-types';
import type {
  CreateCategoryInput,
  DocumentUploadInitInput,
  UpdateDocumentInput,
} from '@lifeos/validation';
import { offlineStore } from '../offline/sqlite-store';
import { useAppUiStore } from '../stores/app-store';
import { apiClient } from './api-client';

export interface ListDocumentsParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  archived?: boolean;
  expiringWithinDays?: number;
}

export const vaultApi = {
  async getDashboard(): Promise<DashboardDataDto> {
    try {
      const res = await apiClient.get<ApiSuccessResponse<DashboardDataDto>>('/dashboard');
      useAppUiStore.getState().setOffline(false);
      await offlineStore.putCache('dashboard', res.data.data);
      return res.data.data;
    } catch (err) {
      const cached = await offlineStore.getCache<DashboardDataDto>('dashboard');
      if (cached) {
        useAppUiStore.getState().setOffline(true);
        return cached;
      }
      throw err;
    }
  },

  async listCategories(): Promise<CategoryDto[]> {
    const res =
      await apiClient.get<ApiSuccessResponse<{ categories: CategoryDto[] }>>('/categories');
    return res.data.data.categories;
  },

  async createCategory(input: CreateCategoryInput): Promise<CategoryDto> {
    const res = await apiClient.post<ApiSuccessResponse<{ category: CategoryDto }>>(
      '/categories',
      input,
    );
    return res.data.data.category;
  },

  async listDocuments(params: ListDocumentsParams = {}): Promise<{
    documents: DocumentListItemDto[];
    pagination: PaginationMeta | undefined;
  }> {
    const cacheKey = `documents:${JSON.stringify(params)}`;
    try {
      const res = await apiClient.get<ApiSuccessResponse<{ documents: DocumentListItemDto[] }>>(
        '/documents',
        {
          params: {
            ...params,
            archived: params.archived !== undefined ? String(params.archived) : undefined,
          },
        },
      );
      const payload = {
        documents: res.data.data.documents,
        pagination: res.data.meta.pagination,
      };
      useAppUiStore.getState().setOffline(false);
      await offlineStore.putCache(cacheKey, payload);
      return payload;
    } catch (err) {
      const cached = await offlineStore.getCache<{
        documents: DocumentListItemDto[];
        pagination: PaginationMeta | undefined;
      }>(cacheKey);
      if (cached) {
        useAppUiStore.getState().setOffline(true);
        return cached;
      }
      throw err;
    }
  },

  async getDocumentDetail(id: string): Promise<DocumentDetailDto> {
    const res = await apiClient.get<ApiSuccessResponse<{ document: DocumentDetailDto }>>(
      `/documents/${id}`,
    );
    return res.data.data.document;
  },

  async initiateUpload(input: DocumentUploadInitInput): Promise<UploadInitResponse> {
    const res = await apiClient.post<ApiSuccessResponse<UploadInitResponse>>(
      '/documents/upload-init',
      input,
    );
    return res.data.data;
  },

  async completeUpload(id: string, checksumSha256?: string): Promise<DocumentListItemDto> {
    const res = await apiClient.post<ApiSuccessResponse<{ document: DocumentListItemDto }>>(
      `/documents/${id}/upload-complete`,
      checksumSha256 ? { checksumSha256 } : {},
    );
    return res.data.data.document;
  },

  async updateDocument(id: string, input: UpdateDocumentInput): Promise<DocumentListItemDto> {
    const res = await apiClient.patch<ApiSuccessResponse<{ document: DocumentListItemDto }>>(
      `/documents/${id}`,
      input,
    );
    return res.data.data.document;
  },

  async archiveDocument(id: string): Promise<DocumentListItemDto> {
    const res = await apiClient.post<ApiSuccessResponse<{ document: DocumentListItemDto }>>(
      `/documents/${id}/archive`,
    );
    return res.data.data.document;
  },

  async restoreDocument(id: string): Promise<DocumentListItemDto> {
    const res = await apiClient.post<ApiSuccessResponse<{ document: DocumentListItemDto }>>(
      `/documents/${id}/restore`,
    );
    return res.data.data.document;
  },

  async deleteDocument(id: string): Promise<void> {
    await apiClient.delete(`/documents/${id}`);
  },

  async getDownloadUrl(id: string): Promise<SignedDownloadUrlResponse> {
    const res = await apiClient.get<ApiSuccessResponse<SignedDownloadUrlResponse>>(
      `/documents/${id}/download-url`,
    );
    return res.data.data;
  },

  async uploadBinaryToSignedUrl(
    uploadUrl: string,
    fileUri: string,
    headers: Record<string, string>,
    onProgress?: (progress: number) => void,
  ): Promise<void> {
    const fileResp = await fetch(fileUri);
    const blob = await fileResp.blob();

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);
      for (const [key, value] of Object.entries(headers)) {
        xhr.setRequestHeader(key, value);
      }
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress(Math.min(1, event.loaded / event.total));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress?.(1);
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };
      xhr.onerror = () => reject(new Error('Network error while uploading document'));
      xhr.send(blob);
    });
  },
};
