import type { Job } from 'bullmq';
import { workerEnv } from '../config/env';
import { logger } from '../config/logger';

export interface ExtractionJobPayload {
  documentId: string;
  userId: string;
  title?: string;
}

export interface ExtractionJobResult {
  documentId: string;
  status: 'queued_for_ai_review' | 'extracted';
  processedAt: string;
}

function normalizeApiBaseUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim().replace(/\/+$/, '');
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `http://${trimmed}`;
}

/**
 * Dispatches async OCR & AI extraction either via internal API callback or logs queued state.
 */
export async function dispatchExtractionJob(
  payload: ExtractionJobPayload,
  jobId?: string,
  fetchFn?: typeof fetch,
  internalConfig?: { apiUrl?: string; workerSecret?: string },
): Promise<ExtractionJobResult> {
  const { documentId, userId } = payload;
  const apiUrl = internalConfig?.apiUrl ?? workerEnv.API_INTERNAL_URL;
  const workerSecret = internalConfig?.workerSecret ?? workerEnv.INTERNAL_WORKER_SECRET;

  if (apiUrl && workerSecret && (fetchFn !== undefined || process.env.NODE_ENV !== 'test')) {
    const activeFetch = fetchFn ?? fetch;
    const baseUrl = normalizeApiBaseUrl(apiUrl);
    const targetUrl = `${baseUrl}/api/v1/internal/documents/${encodeURIComponent(documentId)}/extract`;
    const response = await activeFetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${workerSecret}`,
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Internal extraction callback returned HTTP ${response.status}: ${errText}`);
    }

    logger.info({ jobId, documentId, userId }, 'Completed background document extraction via API');
    return {
      documentId,
      status: 'extracted',
      processedAt: new Date().toISOString(),
    };
  }

  logger.info({ jobId, documentId, userId }, 'Processing document extraction job');
  return {
    documentId,
    status: 'queued_for_ai_review',
    processedAt: new Date().toISOString(),
  };
}

export async function processExtractionJob(
  job: Job<ExtractionJobPayload>,
): Promise<ExtractionJobResult> {
  return dispatchExtractionJob(job.data, job.id);
}
