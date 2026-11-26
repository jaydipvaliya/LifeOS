import type {
  AiConversationDetailDto,
  AiConversationSummaryDto,
  AiMessageDto,
  AssistantCitationDto,
  DocumentExtractionDto,
  DocumentTypeClassification,
  SyncBatchOperationResultDto,
  UniversalSearchHitDto,
  UniversalSearchResponseDto,
} from '@lifeos/shared-types';
import type { Prisma, PrismaClient } from '@prisma/client';
import type { ConfirmExtractionInput, SyncOperationItemInput } from '@lifeos/validation';
import type { AssistantContextItem } from '../ai/ai-provider';
import type { RequestMeta } from '../auth/auth.types';
import type {
  ExtractionStructuredBlob,
  IIntelligenceRepository,
  SaveExtractionParams,
} from './extraction.types';

function toExtractionDto(row: {
  id: string;
  documentId: string;
  documentType: string;
  providerName: string | null;
  modelName: string | null;
  rawText: string | null;
  structuredPayload: unknown;
  confidenceScore: { toNumber(): number } | number | null;
  processingDurationMs: number | null;
  status: 'pending' | 'completed' | 'verified' | 'failed';
  verifiedAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}): DocumentExtractionDto {
  const blob = (row.structuredPayload ?? {}) as Partial<ExtractionStructuredBlob>;
  const confidenceScore =
    row.confidenceScore === null
      ? null
      : typeof row.confidenceScore === 'number'
        ? row.confidenceScore
        : row.confidenceScore.toNumber();

  return {
    id: row.id,
    documentId: row.documentId,
    documentType: row.documentType as DocumentTypeClassification,
    suggestedTitle: blob.suggestedTitle ?? 'Document',
    suggestedCategorySlug: blob.suggestedCategorySlug ?? 'other',
    summary: blob.summary ?? '',
    providerName: row.providerName ?? 'lifeos-heuristic',
    modelName: row.modelName ?? 'deterministic-v1',
    rawTextPreview: row.rawText ? row.rawText.slice(0, 600) : null,
    fields: Array.isArray(blob.fields) ? blob.fields : [],
    suggestedActions: blob.suggestedActions ?? {},
    confidenceScore,
    processingDurationMs: row.processingDurationMs,
    status: row.status,
    verifiedAt: row.verifiedAt ? row.verifiedAt.toISOString() : null,
    errorMessage: row.errorMessage,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class PrismaIntelligenceRepository implements IIntelligenceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveExtractionResult(params: SaveExtractionParams): Promise<DocumentExtractionDto> {
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.extractedData.create({
        data: {
          documentId: params.documentId,
          documentType: params.documentType,
          providerName: params.providerName,
          modelName: params.modelName,
          rawText: params.rawText,
          structuredPayload: params.payload as unknown as Prisma.InputJsonValue,
          confidenceScore: params.confidenceScore,
          processingDurationMs: params.processingDurationMs,
          status: params.status,
        },
      });

      await tx.document.updateMany({
        where: { id: params.documentId, userId: params.userId, deletedAt: null },
        data: { processingStatus: 'needs_review' },
      });

      return toExtractionDto(created);
    });
  }

  async findLatestExtraction(
    documentId: string,
    userId: string,
  ): Promise<DocumentExtractionDto | null> {
    const row = await this.prisma.extractedData.findFirst({
      where: {
        documentId,
        document: { userId, deletedAt: null },
      },
      orderBy: { createdAt: 'desc' },
    });
    return row ? toExtractionDto(row) : null;
  }

  async confirmExtractionAndCreateActions(params: {
    userId: string;
    documentId: string;
    extractionId: string;
    input: ConfirmExtractionInput;
    existingPayload: ExtractionStructuredBlob;
    meta: RequestMeta;
  }): Promise<{
    extraction: DocumentExtractionDto;
    createdAssetId: string | null;
    createdEventId: string | null;
    createdReminderId: string | null;
  }> {
    return this.prisma.$transaction(async (tx) => {
      const nextPayload: ExtractionStructuredBlob = {
        ...params.existingPayload,
        fields: params.input.fields.map((f) => ({
          key: f.key,
          label: f.label,
          value: f.value,
          confidence: 1,
          sourceLocation: 'User verified',
          verificationStatus: f.verificationStatus,
        })),
      };

      const verifiedAt = new Date();
      const updatedExtraction = await tx.extractedData.update({
        where: { id: params.extractionId },
        data: {
          structuredPayload: nextPayload as unknown as Prisma.InputJsonValue,
          status: 'verified',
          verifiedAt,
        },
      });

      await tx.document.update({
        where: { id: params.documentId },
        data: {
          processingStatus: 'verified',
          ...(params.input.title ? { title: params.input.title } : {}),
          ...(params.input.expiryDate !== undefined
            ? { expiryDate: params.input.expiryDate ? new Date(params.input.expiryDate) : null }
            : {}),
        },
      });

      let createdAssetId: string | null = null;
      if (params.input.createAsset?.enabled) {
        const a = params.input.createAsset;
        const asset = await tx.asset.create({
          data: {
            userId: params.userId,
            name: a.name,
            category: a.category,
            brand: a.brand ?? null,
            serialNumber: a.serialNumber ?? null,
            purchaseDate: a.purchaseDate ? new Date(a.purchaseDate) : null,
            purchasePrice: a.purchasePrice ?? null,
            currency: a.currency,
            warrantyExpirationDate: a.warrantyExpirationDate
              ? new Date(a.warrantyExpirationDate)
              : null,
          },
        });
        await tx.assetDocument.create({
          data: {
            assetId: asset.id,
            documentId: params.documentId,
            relationType: 'invoice',
          },
        });
        createdAssetId = asset.id;
      }

      let createdEventId: string | null = null;
      if (params.input.createEvent?.enabled) {
        const e = params.input.createEvent;
        const event = await tx.event.create({
          data: {
            userId: params.userId,
            title: e.title,
            category: e.category,
            startAt: new Date(`${e.startDate}T09:00:00.000Z`),
            allDay: true,
            sourceDocumentId: params.documentId,
            sourceAssetId: createdAssetId,
          },
        });
        createdEventId = event.id;
      }

      let createdReminderId: string | null = null;
      if (params.input.createReminder?.enabled) {
        const r = params.input.createReminder;
        const reminder = await tx.reminder.create({
          data: {
            userId: params.userId,
            title: r.title,
            remindAt: new Date(`${r.remindDate}T09:00:00.000Z`),
            channel: 'push',
            status: 'scheduled',
            documentId: params.documentId,
            eventId: createdEventId,
          },
        });
        createdReminderId = reminder.id;
      }

      await tx.auditLog.create({
        data: {
          userId: params.userId,
          action: 'document.extraction_verified',
          resourceType: 'document',
          resourceId: params.documentId,
          ipAddress: params.meta.ipAddress,
          userAgent: params.meta.userAgent,
          metadata: {
            extractionId: params.extractionId,
            createdAssetId,
            createdEventId,
            createdReminderId,
          },
        },
      });

      return {
        extraction: toExtractionDto(updatedExtraction),
        createdAssetId,
        createdEventId,
        createdReminderId,
      };
    });
  }

  async universalSearch(
    userId: string,
    query: string,
    limit: number,
  ): Promise<UniversalSearchResponseDto> {
    const q = query.trim();

    const [docs, tasks, events, assets, subs] = await Promise.all([
      this.prisma.document.findMany({
        where: {
          userId,
          deletedAt: null,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { originalFilename: { contains: q, mode: 'insensitive' } },
            { tags: { has: q.toLowerCase() } },
            { extractedData: { some: { rawText: { contains: q, mode: 'insensitive' } } } },
          ],
        },
        include: { category: true },
        orderBy: { updatedAt: 'desc' },
        take: limit,
      }),
      this.prisma.task.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { notes: { contains: q, mode: 'insensitive' } },
          ],
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
      }),
      this.prisma.event.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        orderBy: { startAt: 'asc' },
        take: limit,
      }),
      this.prisma.asset.findMany({
        where: {
          userId,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { brand: { contains: q, mode: 'insensitive' } },
            { model: { contains: q, mode: 'insensitive' } },
            { serialNumber: { contains: q, mode: 'insensitive' } },
          ],
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
      }),
      this.prisma.subscription.findMany({
        where: {
          userId,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { provider: { contains: q, mode: 'insensitive' } },
          ],
        },
        orderBy: { nextRenewalDate: 'asc' },
        take: limit,
      }),
    ]);

    const docHits: UniversalSearchHitDto[] = docs.map((d) => ({
      id: d.id,
      entityType: 'document',
      title: d.title,
      subtitle: `${d.category.name} · ${d.originalFilename}`,
      date: d.expiryDate ? d.expiryDate.toISOString().slice(0, 10) : null,
      route: `/(app)/documents/${d.id}`,
    }));

    const taskHits: UniversalSearchHitDto[] = tasks.map((t) => ({
      id: t.id,
      entityType: 'task',
      title: t.title,
      subtitle: `${t.priority} · ${t.status}`,
      date: t.dueAt ? t.dueAt.toISOString().slice(0, 10) : null,
      route: '/(app)/(tabs)/calendar',
    }));

    const eventHits: UniversalSearchHitDto[] = events.map((e) => ({
      id: e.id,
      entityType: 'event',
      title: e.title,
      subtitle: e.category.replace(/_/g, ' '),
      date: e.startAt.toISOString().slice(0, 10),
      route: '/(app)/(tabs)/calendar',
    }));

    const assetHits: UniversalSearchHitDto[] = assets.map((a) => ({
      id: a.id,
      entityType: 'asset',
      title: a.name,
      subtitle: a.brand ?? a.category,
      date: a.warrantyExpirationDate ? a.warrantyExpirationDate.toISOString().slice(0, 10) : null,
      route: `/(app)/assets/${a.id}`,
    }));

    const subHits: UniversalSearchHitDto[] = subs.map((s) => ({
      id: s.id,
      entityType: 'subscription',
      title: s.name,
      subtitle: `${s.provider} · ${s.currency} ${s.amount.toNumber()}/${s.frequency}`,
      date: s.nextRenewalDate.toISOString().slice(0, 10),
      route: '/(app)/(tabs)/assets',
    }));

    return {
      query: q,
      totalCount:
        docHits.length + taskHits.length + eventHits.length + assetHits.length + subHits.length,
      documents: docHits,
      tasks: taskHits,
      events: eventHits,
      assets: assetHits,
      subscriptions: subHits,
    };
  }

  async gatherAssistantContext(
    userId: string,
    documentId?: string | null,
  ): Promise<AssistantContextItem[]> {
    const [docs, tasks, events, assets, subs] = await Promise.all([
      this.prisma.document.findMany({
        where: {
          userId,
          deletedAt: null,
          ...(documentId ? { id: documentId } : {}),
        },
        include: {
          category: true,
          extractedData: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { updatedAt: 'desc' },
        take: documentId ? 1 : 20,
      }),
      this.prisma.task.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 15,
      }),
      this.prisma.event.findMany({
        where: { userId },
        orderBy: { startAt: 'asc' },
        take: 15,
      }),
      this.prisma.asset.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 15,
      }),
      this.prisma.subscription.findMany({
        where: { userId },
        orderBy: { nextRenewalDate: 'asc' },
        take: 15,
      }),
    ]);

    const items: AssistantContextItem[] = [];

    for (const d of docs) {
      const ext = d.extractedData[0];
      const payload = (ext?.structuredPayload ?? {}) as Partial<ExtractionStructuredBlob>;
      const fieldsSummary = (payload.fields ?? [])
        .filter((f) => f.value !== null)
        .map((f) => `${f.label}: ${f.value}`)
        .join(', ');
      items.push({
        entityType: 'document',
        entityId: d.id,
        title: d.title,
        details: [
          `Category: ${d.category.name}`,
          d.expiryDate ? `Expires: ${d.expiryDate.toISOString().slice(0, 10)}` : null,
          payload.summary || fieldsSummary || ext?.rawText?.slice(0, 200) || d.originalFilename,
        ]
          .filter(Boolean)
          .join(' · '),
      });
    }

    for (const t of tasks) {
      items.push({
        entityType: 'task',
        entityId: t.id,
        title: t.title,
        details: `Priority ${t.priority}, status ${t.status}${t.dueAt ? `, due ${t.dueAt.toISOString().slice(0, 10)}` : ''}`,
      });
    }

    for (const e of events) {
      items.push({
        entityType: 'event',
        entityId: e.id,
        title: e.title,
        details: `${e.category.replace(/_/g, ' ')} on ${e.startAt.toISOString().slice(0, 10)}`,
      });
    }

    for (const a of assets) {
      items.push({
        entityType: 'asset',
        entityId: a.id,
        title: a.name,
        details: [
          a.brand ?? a.category,
          a.purchasePrice ? `${a.currency} ${a.purchasePrice.toNumber()}` : null,
          a.warrantyExpirationDate
            ? `Warranty expires ${a.warrantyExpirationDate.toISOString().slice(0, 10)}`
            : 'No warranty date',
        ]
          .filter(Boolean)
          .join(' · '),
      });
    }

    for (const s of subs) {
      items.push({
        entityType: 'subscription',
        entityId: s.id,
        title: s.name,
        details: `${s.provider} · ${s.currency} ${s.amount.toNumber()}/${s.frequency} · status ${s.status} · renews ${s.nextRenewalDate.toISOString().slice(0, 10)}`,
      });
    }

    return items;
  }

  async listConversations(userId: string): Promise<AiConversationSummaryDto[]> {
    const rows = await this.prisma.aiConversation.findMany({
      where: { userId },
      include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      updatedAt: r.updatedAt.toISOString(),
      lastMessagePreview: r.messages[0]?.content.slice(0, 120) ?? null,
    }));
  }

  async getConversationDetail(
    userId: string,
    conversationId: string,
  ): Promise<AiConversationDetailDto | null> {
    const row = await this.prisma.aiConversation.findFirst({
      where: { id: conversationId, userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!row) return null;

    return {
      id: row.id,
      title: row.title,
      updatedAt: row.updatedAt.toISOString(),
      messages: row.messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({
          id: m.id,
          conversationId: m.conversationId,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          citations: Array.isArray(m.citations)
            ? (m.citations as unknown as AssistantCitationDto[])
            : [],
          createdAt: m.createdAt.toISOString(),
        })),
    };
  }

  async appendConversationTurn(params: {
    userId: string;
    conversationId?: string | null;
    question: string;
    answer: string;
    citations: AssistantCitationDto[];
  }): Promise<{
    conversationId: string;
    conversationTitle: string;
    userMessage: AiMessageDto;
    assistantMessage: AiMessageDto;
  }> {
    return this.prisma.$transaction(async (tx) => {
      let conv = params.conversationId
        ? await tx.aiConversation.findFirst({
            where: { id: params.conversationId, userId: params.userId },
          })
        : null;

      if (!conv) {
        conv = await tx.aiConversation.create({
          data: {
            userId: params.userId,
            title: params.question.slice(0, 80),
          },
        });
      }

      const userMsg = await tx.aiMessage.create({
        data: {
          conversationId: conv.id,
          userId: params.userId,
          role: 'user',
          content: params.question,
        },
      });

      const assistantMsg = await tx.aiMessage.create({
        data: {
          conversationId: conv.id,
          userId: params.userId,
          role: 'assistant',
          content: params.answer,
          citations: params.citations as unknown as Prisma.InputJsonValue,
        },
      });

      await tx.aiConversation.update({
        where: { id: conv.id },
        data: { updatedAt: new Date() },
      });

      return {
        conversationId: conv.id,
        conversationTitle: conv.title,
        userMessage: {
          id: userMsg.id,
          conversationId: conv.id,
          role: 'user',
          content: userMsg.content,
          citations: [],
          createdAt: userMsg.createdAt.toISOString(),
        },
        assistantMessage: {
          id: assistantMsg.id,
          conversationId: conv.id,
          role: 'assistant',
          content: assistantMsg.content,
          citations: params.citations,
          createdAt: assistantMsg.createdAt.toISOString(),
        },
      };
    });
  }

  async processSyncBatch(params: {
    userId: string;
    deviceId: string | null;
    operations: SyncOperationItemInput[];
  }): Promise<SyncBatchOperationResultDto[]> {
    const results: SyncBatchOperationResultDto[] = [];

    for (const op of params.operations) {
      try {
        if (op.entityType === 'task') {
          if (op.operationType === 'create') {
            const existing = await this.prisma.task.findUnique({ where: { id: op.entityId } });
            if (existing) {
              results.push({
                clientOperationId: op.clientOperationId,
                entityType: op.entityType,
                entityId: op.entityId,
                status: 'synced',
                serverVersion: existing.version,
              });
              continue;
            }
            const created = await this.prisma.task.create({
              data: {
                id: op.entityId,
                userId: params.userId,
                title: String(op.payload.title ?? 'Offline Task'),
                priority: (op.payload.priority as 'low' | 'medium' | 'high' | 'urgent') ?? 'medium',
                dueAt: op.payload.dueAt ? new Date(String(op.payload.dueAt)) : null,
              },
            });
            results.push({
              clientOperationId: op.clientOperationId,
              entityType: op.entityType,
              entityId: op.entityId,
              status: 'synced',
              serverVersion: created.version,
            });
          } else if (op.operationType === 'update') {
            const existing = await this.prisma.task.findFirst({
              where: { id: op.entityId, userId: params.userId },
            });
            if (!existing) {
              results.push({
                clientOperationId: op.clientOperationId,
                entityType: op.entityType,
                entityId: op.entityId,
                status: 'failed',
                errorMessage: 'Task not found',
              });
              continue;
            }
            if (existing.version > op.clientVersion) {
              await this.prisma.syncOperation.create({
                data: {
                  userId: params.userId,
                  deviceId: params.deviceId,
                  entityType: op.entityType,
                  entityId: op.entityId,
                  operationType: op.operationType,
                  clientVersion: op.clientVersion,
                  payload: op.payload as Prisma.InputJsonValue,
                  status: 'conflict',
                  errorMessage: 'Server version is newer than client version',
                  processedAt: new Date(),
                },
              });
              results.push({
                clientOperationId: op.clientOperationId,
                entityType: op.entityType,
                entityId: op.entityId,
                status: 'conflict',
                serverVersion: existing.version,
                errorMessage: 'Version conflict detected',
              });
              continue;
            }

            const updated = await this.prisma.task.update({
              where: { id: existing.id },
              data: {
                ...(op.payload.title !== undefined ? { title: String(op.payload.title) } : {}),
                ...(op.payload.status !== undefined
                  ? {
                      status: String(op.payload.status) as
                        'pending' | 'in_progress' | 'completed' | 'snoozed' | 'cancelled',
                      completedAt: op.payload.status === 'completed' ? new Date() : null,
                    }
                  : {}),
                version: { increment: 1 },
              },
            });
            results.push({
              clientOperationId: op.clientOperationId,
              entityType: op.entityType,
              entityId: op.entityId,
              status: 'synced',
              serverVersion: updated.version,
            });
          } else if (op.operationType === 'delete') {
            await this.prisma.task.deleteMany({
              where: { id: op.entityId, userId: params.userId },
            });
            results.push({
              clientOperationId: op.clientOperationId,
              entityType: op.entityType,
              entityId: op.entityId,
              status: 'synced',
            });
          }
        } else {
          results.push({
            clientOperationId: op.clientOperationId,
            entityType: op.entityType,
            entityId: op.entityId,
            status: 'synced',
          });
        }

        await this.prisma.syncOperation.create({
          data: {
            userId: params.userId,
            deviceId: params.deviceId,
            entityType: op.entityType,
            entityId: op.entityId,
            operationType: op.operationType,
            clientVersion: op.clientVersion,
            payload: op.payload as Prisma.InputJsonValue,
            status: 'synced',
            processedAt: new Date(),
          },
        });
      } catch (err) {
        results.push({
          clientOperationId: op.clientOperationId,
          entityType: op.entityType,
          entityId: op.entityId,
          status: 'failed',
          errorMessage: err instanceof Error ? err.message : 'Sync operation failed',
        });
      }
    }

    return results;
  }

  async getPendingSyncCount(userId: string): Promise<number> {
    return this.prisma.syncOperation.count({
      where: { userId, status: { in: ['pending', 'conflict'] } },
    });
  }
}
