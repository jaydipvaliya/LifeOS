import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app';
import { GeminiAiProvider, OpenAiCompatibleAiProvider } from '../src/modules/ai/ai-provider';
import { DocumentsService } from '../src/modules/documents/documents.service';
import { LoggedEmailService, ResendEmailService } from '../src/modules/email/email.service';

describe('Multimodal Vision AI & Email Delivery Integrations', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('attaches Gemini inlineData for scanned images and PDFs with HEIC normalization', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      documentType: 'academic_certificate',
                      confidence: 0.94,
                      suggestedTitle: 'University Transcript Scan',
                      suggestedCategorySlug: 'academic',
                    }),
                  },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    globalThis.fetch = fetchMock;

    const provider = new GeminiAiProvider('test-gemini-key', 'gemini-2.5-flash');
    const classification = await provider.classifyDocument({
      text: '',
      title: 'Receipt Scan',
      filename: 'scan.heic',
      mimeType: 'image/heic',
      binaryData: {
        mimeType: 'image/heic',
        base64: Buffer.from('fake-image-bytes').toString('base64'),
      },
    });

    expect(classification.documentType).toBe('academic_certificate');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0]!;
    const payload = JSON.parse(String(init?.body)) as {
      contents: Array<{
        parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
      }>;
    };
    const inlinePart = payload.contents[0].parts.find((p) => p.inlineData);
    expect(inlinePart?.inlineData?.mimeType).toBe('image/jpeg');
    expect(inlinePart?.inlineData?.data).toBeTruthy();

    // Also verifies PDF binary attachment passes through as application/pdf.
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      summary: 'PDF Warranty Certificate',
                      confidenceScore: 0.91,
                      fields: [{ key: 'vendor', label: 'Vendor', value: 'Apple', confidence: 0.9 }],
                      suggestedActions: {},
                    }),
                  },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const extracted = await provider.extractDocumentData({
      text: '',
      documentType: 'purchase_invoice',
      title: 'AppleCare PDF',
      binaryData: {
        mimeType: 'application/pdf',
        base64: Buffer.from('%PDF-1.4 fake').toString('base64'),
      },
    });

    expect(extracted.summary).toBe('PDF Warranty Certificate');
    const [, secondInit] = fetchMock.mock.calls[1]!;
    const secondPayload = JSON.parse(String(secondInit?.body)) as {
      contents: Array<{ parts: Array<{ inlineData?: { mimeType: string } }> }>;
    };
    expect(secondPayload.contents[0].parts.find((p) => p.inlineData)?.inlineData?.mimeType).toBe(
      'application/pdf',
    );
  });

  it('attaches OpenAI image_url content block for image scans', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  documentType: 'medical_record',
                  confidence: 0.89,
                  suggestedTitle: 'Lab Report Scan',
                  suggestedCategorySlug: 'health',
                }),
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    globalThis.fetch = fetchMock;

    const provider = new OpenAiCompatibleAiProvider('test-openai-key', 'gpt-4o-mini');
    const result = await provider.classifyDocument({
      text: '',
      title: 'Phone Bill',
      filename: 'bill.png',
      mimeType: 'image/png',
      binaryData: {
        mimeType: 'image/png',
        base64: Buffer.from('png-bytes').toString('base64'),
      },
    });

    expect(result.documentType).toBe('medical_record');
    const [, init] = fetchMock.mock.calls[0]!;
    const payload = JSON.parse(String(init?.body)) as {
      messages: Array<{ role: string; content: unknown }>;
    };
    const userMsg = payload.messages.find((m) => m.role === 'user');
    expect(Array.isArray(userMsg?.content)).toBe(true);
    const imagePart = (
      userMsg?.content as Array<{ type: string; image_url?: { url: string } }>
    ).find((part) => part.type === 'image_url');
    expect(imagePart?.image_url?.url.startsWith('data:image/png;base64,')).toBe(true);
  });

  it('dispatches Resend transactional emails and falls back cleanly on non-2xx or dev mode', async () => {
    const logged = new LoggedEmailService();
    const logRes = await logged.sendEmail({
      to: 'user@lifeos.app',
      subject: 'Test',
      text: 'Hello',
    });
    expect(logRes.delivered).toBe(false);

    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'resend_123' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    globalThis.fetch = fetchMock;

    const resend = new ResendEmailService('re_test_key', 'LifeOS <no-reply@lifeos.app>');
    const okRes = await resend.sendEmail({
      to: 'user@lifeos.app',
      subject: 'Verify email',
      text: 'Token: abc',
    });
    expect(okRes).toEqual({ delivered: true, messageId: 'resend_123' });

    fetchMock.mockResolvedValueOnce(new Response('Bad key', { status: 401 }));
    const failRes = await resend.sendEmail({
      to: 'user@lifeos.app',
      subject: 'Verify email',
      text: 'Token: abc',
    });
    expect(failRes.delivered).toBe(false);
  });

  it('enqueues background extraction upon document completion and guards internal worker route', async () => {
    const docId = '11111111-1111-4111-8111-111111111111';
    const userId = '22222222-2222-4222-8222-222222222222';
    const enqueued: Array<{ documentId: string; userId: string }> = [];

    const service = new DocumentsService(
      {
        findOwnedById: async () => ({
          id: docId,
          userId,
          categoryId: 'cat-1',
          category: {
            id: 'cat-1',
            userId: null,
            slug: 'receipts',
            name: 'Receipts',
            isSystem: true,
            iconName: null,
          },
          title: 'Warranty PDF',
          originalFilename: 'warranty.pdf',
          mimeType: 'application/pdf',
          fileSizeBytes: 1200,
          storageKey: 'users/test/warranty.pdf',
          checksumSha256: null,
          expiryDate: null,
          processingStatus: 'pending_upload',
          tags: [],
          isArchived: false,
          archivedAt: null,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        markUploadComplete: async () => ({
          id: docId,
          userId,
          categoryId: 'cat-1',
          category: {
            id: 'cat-1',
            userId: null,
            slug: 'receipts',
            name: 'Receipts',
            isSystem: true,
            iconName: null,
          },
          title: 'Warranty PDF',
          originalFilename: 'warranty.pdf',
          mimeType: 'application/pdf',
          fileSizeBytes: 1200,
          storageKey: 'users/test/warranty.pdf',
          checksumSha256: null,
          expiryDate: null,
          processingStatus: 'uploaded',
          tags: [],
          isArchived: false,
          archivedAt: null,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      } as never,
      {} as never,
      {
        headObject: async () => ({ exists: true, sizeBytes: 1200 }),
      } as never,
      {
        enqueueExtraction: async (payload) => {
          enqueued.push(payload);
          return `job-${payload.documentId}`;
        },
      },
    );

    const dto = await service.completeUpload(
      userId,
      docId,
      { checksumSha256: undefined },
      { ipAddress: '127.0.0.1', userAgent: 'vitest' },
    );
    expect(dto.processingStatus).toBe('uploaded');
    expect(enqueued).toEqual([{ documentId: docId, userId }]);

    const app = createApp({ internalWorkerSecret: 'worker-secret-test-32-characters!!' });
    const unauth = await request(app)
      .post(`/api/v1/internal/documents/${docId}/extract`)
      .send({ userId });
    expect(unauth.status).toBe(401);

    const badSecret = await request(app)
      .post(`/api/v1/internal/documents/${docId}/extract`)
      .set('Authorization', 'Bearer wrong-secret')
      .send({ userId });
    expect(badSecret.status).toBe(401);
  });
});
