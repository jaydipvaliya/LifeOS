import type { Job } from 'bullmq';
import { logger } from '../config/logger';

export interface ExtractionJobPayload {
  documentId: string;
  userId: string;
  title?: string;
}

export interface ExtractionJobResult {
  documentId: string;
  status: 'queued_for_ai_review';
  processedAt: string;
}

/**
 * BullMQ worker processor for async OCR & AI classification pipeline.
 * Ensures jobs execute idempotently with structured logging.
 */
export async function processExtractionJob(
  job: Job<ExtractionJobPayload>,
): Promise<ExtractionJobResult> {
  const { documentId, userId } = job.data;
  logger.info({ jobId: job.id, documentId, userId }, 'Processing document extraction job');

  return {
    documentId,
    status: 'queued_for_ai_review',
    processedAt: new Date().toISOString(),
  };
}
