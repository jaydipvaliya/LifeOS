import type {
  AssistantCitationDto,
  DocumentTypeClassification,
  ExtractedFieldValue,
  SuggestedExtractionActions,
} from '@lifeos/shared-types';
import { documentClassificationSchema } from '@lifeos/validation';
import { z } from 'zod';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

export interface ClassificationResult {
  documentType: DocumentTypeClassification;
  confidence: number;
  suggestedTitle: string;
  suggestedCategorySlug: string;
}

export interface StructuredExtractionOutput {
  fields: ExtractedFieldValue[];
  suggestedActions: SuggestedExtractionActions;
  confidenceScore: number;
  summary: string;
}

export interface AssistantContextItem {
  entityType: 'document' | 'task' | 'event' | 'asset' | 'subscription';
  entityId: string;
  title: string;
  details: string;
}

export interface AssistantAnswerResult {
  answer: string;
  citations: AssistantCitationDto[];
}

export interface IAiProvider {
  readonly providerName: string;
  readonly modelName: string;
  classifyDocument(input: {
    text: string;
    title: string;
    filename: string;
    mimeType: string;
  }): Promise<ClassificationResult>;
  extractDocumentData(input: {
    text: string;
    documentType: DocumentTypeClassification;
    title: string;
  }): Promise<StructuredExtractionOutput>;
  summarizeDocument(input: {
    text: string;
    documentType: DocumentTypeClassification;
    title: string;
  }): Promise<string>;
  answerLifeQuestion(input: {
    question: string;
    contextItems: AssistantContextItem[];
    history: Array<{ role: 'user' | 'assistant'; content: string }>;
  }): Promise<AssistantAnswerResult>;
}

const llmFieldArraySchema = z.object({
  summary: z.string().min(1).max(500),
  confidenceScore: z.number().min(0).max(1),
  fields: z.array(
    z.object({
      key: z.string().min(1).max(64),
      label: z.string().min(1).max(80),
      value: z.union([z.string(), z.number()]).nullable(),
      confidence: z.number().min(0).max(1),
      sourceLocation: z.string().max(180).nullable().optional(),
    }),
  ),
  suggestedActions: z
    .object({
      assetSuggestion: z
        .object({
          name: z.string().min(1),
          category: z
            .enum([
              'laptop',
              'smartphone',
              'tablet',
              'headphones',
              'electronics',
              'furniture',
              'appliances',
              'other',
            ])
            .default('electronics'),
          brand: z.string().nullable().optional(),
          purchaseDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .nullable()
            .optional(),
          purchasePrice: z.number().nonnegative().nullable().optional(),
          currency: z.string().length(3).default('INR'),
          serialNumber: z.string().nullable().optional(),
          warrantyExpirationDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .nullable()
            .optional(),
        })
        .nullable()
        .optional(),
      eventSuggestion: z
        .object({
          title: z.string().min(1),
          category: z
            .enum([
              'document_expiry',
              'warranty_expiry',
              'subscription_renewal',
              'payment_due',
              'academic_deadline',
              'appointment',
              'custom',
            ])
            .default('document_expiry'),
          startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        })
        .nullable()
        .optional(),
      reminderSuggestion: z
        .object({
          title: z.string().min(1),
          remindDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        })
        .nullable()
        .optional(),
    })
    .default({}),
});

function parseFirstIsoDate(text: string): string | null {
  const isoMatch = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (isoMatch?.[1]) return isoMatch[1];

  const slashMatch = text.match(/\b(\d{2})[/-](\d{2})[/-](20\d{2})\b/);
  if (slashMatch) {
    return `${slashMatch[3]}-${slashMatch[2]}-${slashMatch[1]}`;
  }
  return null;
}

function parseExpiryIsoDate(text: string): string | null {
  const expirySection = text.match(
    /(?:expir\w*|valid\s*(?:thru|until|to)|warranty\s*(?:end|until|expir\w*)|renewal)[^0-9]{0,24}((?:20\d{2}-\d{2}-\d{2})|(?:\d{2}[/-]\d{2}[/-]20\d{2}))/i,
  );
  if (expirySection?.[1]) {
    return parseFirstIsoDate(expirySection[1]);
  }
  return null;
}

function parseAmountAndCurrency(text: string): { amount: number | null; currency: string } {
  const inrMatch = text.match(/(?:INR|Rs\.?|₹)\s*([0-9][0-9,]*(?:\.\d{1,2})?)/i);
  if (inrMatch?.[1]) {
    const num = Number(inrMatch[1].replace(/,/g, ''));
    if (Number.isFinite(num)) return { amount: num, currency: 'INR' };
  }
  const usdMatch = text.match(/(?:USD|\$)\s*([0-9][0-9,]*(?:\.\d{1,2})?)/i);
  if (usdMatch?.[1]) {
    const num = Number(usdMatch[1].replace(/,/g, ''));
    if (Number.isFinite(num)) return { amount: num, currency: 'USD' };
  }
  return { amount: null, currency: 'INR' };
}

function subtractDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/**
 * Deterministic fallback AI provider that parses text conservatively using structured heuristics
 * and never invents unsupported values.
 */
export class HeuristicAiProvider implements IAiProvider {
  readonly providerName = 'lifeos-heuristic';
  readonly modelName = 'deterministic-v1';

  async classifyDocument(input: {
    text: string;
    title: string;
    filename: string;
    mimeType: string;
  }): Promise<ClassificationResult> {
    const combined = `${input.title} ${input.filename} ${input.text}`.toLowerCase();

    const rules: Array<{
      keywords: string[];
      type: DocumentTypeClassification;
      slug: string;
    }> = [
      {
        keywords: [
          'invoice',
          'receipt',
          'warranty',
          'macbook',
          'laptop',
          'purchase',
          'bill',
          'gst',
        ],
        type: 'purchase_invoice',
        slug: 'purchase-receipts',
      },
      {
        keywords: [
          'certificate',
          'degree',
          'transcript',
          'university',
          'college',
          'semester',
          'marksheet',
        ],
        type: 'academic_certificate',
        slug: 'education',
      },
      {
        keywords: ['insurance', 'policy', 'premium', 'coverage', 'claim'],
        type: 'insurance_policy',
        slug: 'insurance',
      },
      {
        keywords: ['passport', 'aadhaar', 'license', 'licence', 'pan', 'id card', 'visa'],
        type: 'identity_document',
        slug: 'identity',
      },
      {
        keywords: ['medical', 'prescription', 'lab', 'hospital', 'clinic', 'diagnosis'],
        type: 'medical_record',
        slug: 'medical',
      },
      {
        keywords: ['bank', 'tax', 'statement', 'itr', 'salary', 'payslip'],
        type: 'financial_statement',
        slug: 'financial',
      },
      {
        keywords: ['flight', 'hotel', 'ticket', 'boarding', 'itinerary', 'travel'],
        type: 'travel_booking',
        slug: 'travel',
      },
      {
        keywords: ['lease', 'rent', 'agreement', 'property', 'deed'],
        type: 'property_document',
        slug: 'property',
      },
      {
        keywords: ['offer letter', 'employment', 'experience', 'joining'],
        type: 'employment_record',
        slug: 'employment',
      },
    ];

    for (const rule of rules) {
      if (rule.keywords.some((kw) => combined.includes(kw))) {
        return {
          documentType: rule.type,
          confidence: 0.84,
          suggestedTitle: input.title,
          suggestedCategorySlug: rule.slug,
        };
      }
    }

    return {
      documentType: 'other',
      confidence: 0.55,
      suggestedTitle: input.title,
      suggestedCategorySlug: 'other',
    };
  }

  async extractDocumentData(input: {
    text: string;
    documentType: DocumentTypeClassification;
    title: string;
  }): Promise<StructuredExtractionOutput> {
    const text = input.text.trim();
    const detectedDate = parseFirstIsoDate(text);
    const detectedExpiry = parseExpiryIsoDate(text);
    const { amount, currency } = parseAmountAndCurrency(text);
    const serialMatch = text.match(/(?:serial(?:\s*no\.?)?|s\/n)\s*[:#-]?\s*([A-Z0-9-]{5,32})/i);
    const warrantyMonthsMatch = text.match(/(\d{1,2})\s*(?:month|months|mo)\s*warranty/i);
    const warrantyYearsMatch = text.match(/(\d)\s*(?:year|years|yr)\s*warranty/i);

    let warrantyEnd = detectedExpiry;
    const warrantyMonths = warrantyMonthsMatch?.[1]
      ? Number(warrantyMonthsMatch[1])
      : warrantyYearsMatch?.[1]
        ? Number(warrantyYearsMatch[1]) * 12
        : null;

    if (!warrantyEnd && detectedDate && warrantyMonths) {
      const start = new Date(`${detectedDate}T00:00:00.000Z`);
      start.setUTCMonth(start.getUTCMonth() + warrantyMonths);
      warrantyEnd = start.toISOString().slice(0, 10);
    }

    const fields: ExtractedFieldValue[] = [
      {
        key: 'documentTitle',
        label: 'Document Title',
        value: input.title,
        confidence: 0.92,
        sourceLocation: 'Document metadata',
        verificationStatus: 'unverified',
      },
    ];

    const suggestedActions: SuggestedExtractionActions = {};

    if (input.documentType === 'purchase_invoice') {
      const productName =
        input.title.replace(/\b(invoice|receipt|bill)\b/gi, '').trim() || input.title;
      const lower = `${input.title} ${text}`.toLowerCase();
      const assetCategory =
        lower.includes('macbook') || lower.includes('laptop')
          ? 'laptop'
          : lower.includes('phone') || lower.includes('iphone') || lower.includes('pixel')
            ? 'smartphone'
            : lower.includes('headphone') || lower.includes('airpods')
              ? 'headphones'
              : lower.includes('tablet') || lower.includes('ipad')
                ? 'tablet'
                : 'electronics';

      fields.push(
        {
          key: 'productName',
          label: 'Product Name',
          value: productName,
          confidence: 0.78,
          sourceLocation: 'Title / header',
          verificationStatus: 'unverified',
        },
        {
          key: 'purchaseDate',
          label: 'Purchase Date',
          value: detectedDate,
          confidence: detectedDate ? 0.85 : 0.2,
          sourceLocation: detectedDate ? 'OCR date match' : null,
          verificationStatus: 'unverified',
        },
        {
          key: 'purchaseAmount',
          label: 'Purchase Amount',
          value: amount,
          confidence: amount !== null ? 0.82 : 0.2,
          sourceLocation: amount !== null ? `Detected ${currency}` : null,
          verificationStatus: 'unverified',
        },
        {
          key: 'serialNumber',
          label: 'Serial Number',
          value: serialMatch?.[1] ?? null,
          confidence: serialMatch ? 0.88 : 0.1,
          sourceLocation: serialMatch ? 'Serial number field' : null,
          verificationStatus: 'unverified',
        },
        {
          key: 'warrantyExpirationDate',
          label: 'Warranty Expiration',
          value: warrantyEnd,
          confidence: warrantyEnd ? 0.8 : 0.15,
          sourceLocation: warrantyEnd ? 'Warranty / expiry text' : null,
          verificationStatus: 'unverified',
        },
      );

      suggestedActions.assetSuggestion = {
        name: productName,
        category: assetCategory,
        brand: null,
        purchaseDate: detectedDate,
        purchasePrice: amount,
        currency,
        serialNumber: serialMatch?.[1] ?? null,
        warrantyExpirationDate: warrantyEnd,
      };

      if (warrantyEnd) {
        suggestedActions.eventSuggestion = {
          title: `${productName} warranty expires`,
          category: 'warranty_expiry',
          startDate: warrantyEnd,
        };
        suggestedActions.reminderSuggestion = {
          title: `Check ${productName} before warranty expires`,
          remindDate: subtractDays(warrantyEnd, 14),
        };
      }
    } else {
      fields.push(
        {
          key: 'effectiveDate',
          label: 'Detected Date',
          value: detectedDate,
          confidence: detectedDate ? 0.8 : 0.2,
          sourceLocation: detectedDate ? 'OCR text' : null,
          verificationStatus: 'unverified',
        },
        {
          key: 'expiryDate',
          label: 'Expiry / Renewal Date',
          value: detectedExpiry,
          confidence: detectedExpiry ? 0.82 : 0.2,
          sourceLocation: detectedExpiry ? 'Expiry pattern' : null,
          verificationStatus: 'unverified',
        },
        {
          key: 'amount',
          label: 'Amount',
          value: amount,
          confidence: amount !== null ? 0.78 : 0.15,
          sourceLocation: amount !== null ? `Detected ${currency}` : null,
          verificationStatus: 'unverified',
        },
      );

      if (detectedExpiry) {
        suggestedActions.eventSuggestion = {
          title: `${input.title} expires / renews`,
          category:
            input.documentType === 'academic_certificate' ? 'academic_deadline' : 'document_expiry',
          startDate: detectedExpiry,
        };
        suggestedActions.reminderSuggestion = {
          title: `Review ${input.title} ahead of ${detectedExpiry}`,
          remindDate: subtractDays(detectedExpiry, 14),
        };
      }
    }

    const summary = await this.summarizeDocument({
      text,
      documentType: input.documentType,
      title: input.title,
    });

    const populatedCount = fields.filter((f) => f.value !== null).length;
    const confidenceScore = Number(
      Math.min(0.95, 0.45 + (populatedCount / Math.max(1, fields.length)) * 0.45).toFixed(3),
    );

    return {
      fields,
      suggestedActions,
      confidenceScore,
      summary,
    };
  }

  async summarizeDocument(input: {
    text: string;
    documentType: DocumentTypeClassification;
    title: string;
  }): Promise<string> {
    const label = input.documentType.replace(/_/g, ' ');
    const detectedExpiry = parseExpiryIsoDate(input.text);
    const { amount, currency } = parseAmountAndCurrency(input.text);
    const parts = [`Classified "${input.title}" as ${label}.`];
    if (amount !== null) parts.push(`Detected amount: ${currency} ${amount}.`);
    if (detectedExpiry) parts.push(`Detected expiry/renewal date: ${detectedExpiry}.`);
    if (parts.length === 1) {
      parts.push('Review the extracted fields below to confirm or add missing details.');
    }
    return parts.join(' ');
  }

  async answerLifeQuestion(input: {
    question: string;
    contextItems: AssistantContextItem[];
    history: Array<{ role: 'user' | 'assistant'; content: string }>;
  }): Promise<AssistantAnswerResult> {
    const q = input.question.toLowerCase();
    const tokens = q.split(/\s+/).filter((t) => t.length > 2);

    const scored = input.contextItems
      .map((item) => {
        const hay = `${item.title} ${item.details}`.toLowerCase();
        let score = 0;
        for (const tok of tokens) {
          if (hay.includes(tok)) score += 2;
        }
        if (q.includes('warrant') && (item.entityType === 'asset' || hay.includes('warranty'))) {
          score += 3;
        }
        if (
          (q.includes('sub') || q.includes('spend') || q.includes('renew')) &&
          item.entityType === 'subscription'
        ) {
          score += 3;
        }
        if (
          (q.includes('task') || q.includes('todo') || q.includes('due')) &&
          item.entityType === 'task'
        ) {
          score += 3;
        }
        if (
          (q.includes('expir') ||
            q.includes('doc') ||
            q.includes('invoice') ||
            q.includes('cert')) &&
          item.entityType === 'document'
        ) {
          score += 2;
        }
        if (q.includes('event') || q.includes('calendar') || q.includes('schedule')) {
          if (item.entityType === 'event') score += 3;
        }
        return { item, score };
      })
      .sort((a, b) => b.score - a.score);

    const relevant = scored.filter((s) => s.score > 0).slice(0, 5);
    const fallbackItems = relevant.length > 0 ? relevant : scored.slice(0, 3);

    if (fallbackItems.length === 0) {
      return {
        answer:
          "I checked your LifeOS vault, tasks, events, assets, and subscriptions, and there aren't any matching records yet. Upload a document or add a task/asset first, and I can track dates and summarize everything for you.",
        citations: [],
      };
    }

    const bullets = fallbackItems.map(
      ({ item }) => `• ${item.title} (${item.entityType}): ${item.details}`,
    );

    const intro =
      relevant.length > 0
        ? `Based on your personal LifeOS records, here is what I found:`
        : `I didn't find an exact keyword match, so here are your most recent LifeOS records:`;

    return {
      answer: `${intro}\n\n${bullets.join('\n')}`,
      citations: fallbackItems.map(({ item }) => ({
        entityType: item.entityType,
        entityId: item.entityId,
        title: item.title,
        excerpt: item.details.slice(0, 140),
      })),
    };
  }
}

function normalizeSuggestedActions(
  raw: z.input<typeof llmFieldArraySchema>['suggestedActions'] | undefined,
): SuggestedExtractionActions {
  if (!raw) return {};
  return {
    assetSuggestion: raw.assetSuggestion
      ? {
          name: raw.assetSuggestion.name,
          category: raw.assetSuggestion.category ?? 'electronics',
          brand: raw.assetSuggestion.brand ?? null,
          purchaseDate: raw.assetSuggestion.purchaseDate ?? null,
          purchasePrice: raw.assetSuggestion.purchasePrice ?? null,
          currency: raw.assetSuggestion.currency ?? 'INR',
          serialNumber: raw.assetSuggestion.serialNumber ?? null,
          warrantyExpirationDate: raw.assetSuggestion.warrantyExpirationDate ?? null,
        }
      : null,
    eventSuggestion: raw.eventSuggestion
      ? {
          title: raw.eventSuggestion.title,
          category: raw.eventSuggestion.category ?? 'document_expiry',
          startDate: raw.eventSuggestion.startDate,
        }
      : null,
    reminderSuggestion: raw.reminderSuggestion ?? null,
  };
}

abstract class BaseLlmAiProvider implements IAiProvider {
  abstract readonly providerName: string;
  abstract readonly modelName: string;
  protected readonly fallback = new HeuristicAiProvider();

  protected abstract requestStructuredJson<T>(
    systemPrompt: string,
    userPrompt: string,
    schema: z.ZodType<T>,
  ): Promise<T>;

  async classifyDocument(input: {
    text: string;
    title: string;
    filename: string;
    mimeType: string;
  }): Promise<ClassificationResult> {
    try {
      return await this.requestStructuredJson(
        'Classify the personal document into strict JSON matching {documentType, confidence, suggestedTitle, suggestedCategorySlug}. Never invent unsupported facts.',
        `Title: ${input.title}\nFilename: ${input.filename}\nMIME: ${input.mimeType}\nText:\n${input.text.slice(0, 4000)}`,
        documentClassificationSchema,
      );
    } catch (err) {
      logger.warn({ err, provider: this.providerName }, 'classifyDocument failed; using fallback');
      return this.fallback.classifyDocument(input);
    }
  }

  async extractDocumentData(input: {
    text: string;
    documentType: DocumentTypeClassification;
    title: string;
  }): Promise<StructuredExtractionOutput> {
    try {
      const parsed = await this.requestStructuredJson(
        'Extract structured JSON fields strictly as {summary, confidenceScore, fields:[{key,label,value,confidence,sourceLocation}], suggestedActions:{assetSuggestion,eventSuggestion,reminderSuggestion}}. Set unknown values to null.',
        `Document Type: ${input.documentType}\nTitle: ${input.title}\nText:\n${input.text.slice(0, 6000)}`,
        llmFieldArraySchema,
      );
      return {
        summary: parsed.summary,
        confidenceScore: parsed.confidenceScore,
        fields: parsed.fields.map((f) => ({
          ...f,
          sourceLocation: f.sourceLocation ?? null,
          verificationStatus: 'unverified' as const,
        })),
        suggestedActions: normalizeSuggestedActions(parsed.suggestedActions),
      };
    } catch (err) {
      logger.warn(
        { err, provider: this.providerName },
        'extractDocumentData failed; using fallback',
      );
      return this.fallback.extractDocumentData(input);
    }
  }

  async summarizeDocument(input: {
    text: string;
    documentType: DocumentTypeClassification;
    title: string;
  }): Promise<string> {
    return this.fallback.summarizeDocument(input);
  }

  async answerLifeQuestion(input: {
    question: string;
    contextItems: AssistantContextItem[];
    history: Array<{ role: 'user' | 'assistant'; content: string }>;
  }): Promise<AssistantAnswerResult> {
    try {
      const contextBlock = input.contextItems
        .slice(0, 25)
        .map((c) => `[${c.entityType}:${c.entityId}] ${c.title} — ${c.details}`)
        .join('\n');

      const schema = z.object({
        answer: z.string().min(1),
        citedIds: z.array(z.string()).default([]),
      });

      const res = await this.requestStructuredJson(
        'You are LifeOS Assistant. Answer strictly using the provided user records and return JSON {answer, citedIds}. Never fabricate dates, amounts, or warranty terms.',
        `Records:\n${contextBlock}\n\nQuestion: ${input.question}`,
        schema,
      );

      const citedSet = new Set(res.citedIds ?? []);
      const citations = input.contextItems
        .filter((c) => citedSet.has(c.entityId))
        .map((c) => ({
          entityType: c.entityType,
          entityId: c.entityId,
          title: c.title,
          excerpt: c.details.slice(0, 140),
        }));

      return { answer: res.answer, citations };
    } catch (err) {
      logger.warn(
        { err, provider: this.providerName },
        'answerLifeQuestion failed; using fallback',
      );
      return this.fallback.answerLifeQuestion(input);
    }
  }
}

class OpenAiCompatibleAiProvider extends BaseLlmAiProvider {
  readonly providerName = 'openai';
  readonly modelName: string;

  constructor(
    private readonly apiKey: string,
    model?: string,
    private readonly baseUrl = 'https://api.openai.com/v1',
  ) {
    super();
    this.modelName = model || 'gpt-4o-mini';
  }

  protected async requestStructuredJson<T>(
    systemPrompt: string,
    userPrompt: string,
    schema: z.ZodType<T>,
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.modelName,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`AI provider returned HTTP ${response.status}`);
    }
    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = payload.choices?.[0]?.message?.content;
    if (!raw) throw new Error('Empty AI completion response');
    return schema.parse(JSON.parse(raw));
  }
}

class GeminiAiProvider extends BaseLlmAiProvider {
  readonly providerName = 'gemini';
  readonly modelName: string;

  constructor(
    private readonly apiKey: string,
    model?: string,
  ) {
    super();
    this.modelName = model || 'gemini-2.5-flash';
  }

  protected async requestStructuredJson<T>(
    systemPrompt: string,
    userPrompt: string,
    schema: z.ZodType<T>,
  ): Promise<T> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
    });
    if (!response.ok) throw new Error(`Gemini HTTP ${response.status}`);
    const body = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = body.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty Gemini response');
    return schema.parse(JSON.parse(text));
  }
}

export function createAiProvider(): IAiProvider {
  if (env.NODE_ENV === 'test' || env.AI_PROVIDER === 'none' || !env.AI_API_KEY) {
    return new HeuristicAiProvider();
  }
  if (env.AI_PROVIDER === 'openai') {
    return new OpenAiCompatibleAiProvider(env.AI_API_KEY, env.AI_MODEL, env.AI_BASE_URL);
  }
  if (env.AI_PROVIDER === 'gemini') {
    return new GeminiAiProvider(env.AI_API_KEY, env.AI_MODEL);
  }
  return new HeuristicAiProvider();
}
