import type {
  SubscriptionDto,
  SubscriptionFrequency,
  SubscriptionSpendingSummary,
  SubscriptionStatus,
} from '@lifeos/shared-types';
import type { CreateSubscriptionInput, UpdateSubscriptionInput } from '@lifeos/validation';
import { NotFoundError } from '../../shared/errors';
import type { ISubscriptionsRepository, SubscriptionRecord } from './subscriptions.types';

function toSubscriptionDto(record: SubscriptionRecord): SubscriptionDto {
  return {
    id: record.id,
    name: record.name,
    provider: record.provider,
    amount: Number(record.amount).toFixed(2),
    currency: record.currency,
    frequency: record.frequency,
    startDate: record.startDate.toISOString().slice(0, 10),
    nextRenewalDate: record.nextRenewalDate.toISOString().slice(0, 10),
    paymentMethodLabel: record.paymentMethodLabel,
    cancellationInfo: record.cancellationInfo,
    status: record.status,
    cancelledAt: record.cancelledAt ? record.cancelledAt.toISOString() : null,
    version: record.version,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function annualMultiplier(frequency: SubscriptionFrequency): number {
  switch (frequency) {
    case 'weekly':
      return 52;
    case 'monthly':
      return 12;
    case 'quarterly':
      return 4;
    case 'annual':
      return 1;
    case 'custom':
    default:
      return 12;
  }
}

export function computeSpendingSummary(records: SubscriptionRecord[]): SubscriptionSpendingSummary {
  const active = records.filter((r) => r.status === 'active');
  const cancelled = records.filter((r) => r.status === 'cancelled');

  let annualTotalCents = 0;
  for (const item of active) {
    const cents = Math.round(Number(item.amount) * 100);
    annualTotalCents += cents * annualMultiplier(item.frequency);
  }
  const monthlyTotalCents = Math.round(annualTotalCents / 12);

  return {
    currency: active[0]?.currency ?? records[0]?.currency ?? 'INR',
    activeCount: active.length,
    cancelledCount: cancelled.length,
    monthlyEquivalentTotal: (monthlyTotalCents / 100).toFixed(2),
    annualEquivalentTotal: (annualTotalCents / 100).toFixed(2),
  };
}

export class SubscriptionsService {
  constructor(private readonly repository: ISubscriptionsRepository) {}

  async list(
    userId: string,
    status?: SubscriptionStatus,
  ): Promise<{ subscriptions: SubscriptionDto[]; summary: SubscriptionSpendingSummary }> {
    const all = await this.repository.listForUser(userId);
    const filtered = status ? all.filter((s) => s.status === status) : all;
    return {
      subscriptions: filtered.map(toSubscriptionDto),
      summary: computeSpendingSummary(all),
    };
  }

  async create(userId: string, input: CreateSubscriptionInput): Promise<SubscriptionDto> {
    const created = await this.repository.createForUser(userId, input);
    return toSubscriptionDto(created);
  }

  async update(
    userId: string,
    subscriptionId: string,
    input: UpdateSubscriptionInput,
  ): Promise<SubscriptionDto> {
    const updated = await this.repository.updateForUser(subscriptionId, userId, input);
    if (!updated) throw new NotFoundError('Subscription not found');
    return toSubscriptionDto(updated);
  }

  async cancel(userId: string, subscriptionId: string): Promise<SubscriptionDto> {
    const updated = await this.repository.cancelForUser(subscriptionId, userId);
    if (!updated) throw new NotFoundError('Subscription not found');
    return toSubscriptionDto(updated);
  }

  async delete(userId: string, subscriptionId: string): Promise<{ deleted: true }> {
    const deleted = await this.repository.deleteForUser(subscriptionId, userId);
    if (!deleted) throw new NotFoundError('Subscription not found');
    return { deleted: true };
  }
}
