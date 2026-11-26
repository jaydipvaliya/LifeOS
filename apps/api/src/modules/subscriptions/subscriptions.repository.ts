import type { SubscriptionStatus } from '@lifeos/shared-types';
import type { CreateSubscriptionInput, UpdateSubscriptionInput } from '@lifeos/validation';
import type { Prisma, PrismaClient } from '@prisma/client';
import type { ISubscriptionsRepository, SubscriptionRecord } from './subscriptions.types';

function mapSubscriptionRow(row: Prisma.SubscriptionGetPayload<object>): SubscriptionRecord {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    provider: row.provider,
    amount: row.amount.toString(),
    currency: row.currency,
    frequency: row.frequency,
    startDate: row.startDate,
    nextRenewalDate: row.nextRenewalDate,
    paymentMethodLabel: row.paymentMethodLabel,
    cancellationInfo: row.cancellationInfo,
    status: row.status,
    cancelledAt: row.cancelledAt,
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaSubscriptionsRepository implements ISubscriptionsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listForUser(userId: string, status?: SubscriptionStatus): Promise<SubscriptionRecord[]> {
    const rows = await this.prisma.subscription.findMany({
      where: {
        userId,
        ...(status ? { status } : {}),
      },
      orderBy: [{ status: 'asc' }, { nextRenewalDate: 'asc' }],
    });
    return rows.map(mapSubscriptionRow);
  }

  async createForUser(userId: string, input: CreateSubscriptionInput): Promise<SubscriptionRecord> {
    const created = await this.prisma.subscription.create({
      data: {
        userId,
        name: input.name,
        provider: input.provider,
        amount: input.amount,
        currency: input.currency.toUpperCase(),
        frequency: input.frequency,
        startDate: new Date(input.startDate),
        nextRenewalDate: new Date(input.nextRenewalDate),
        paymentMethodLabel: input.paymentMethodLabel ?? null,
        cancellationInfo: input.cancellationInfo ?? null,
      },
    });
    return mapSubscriptionRow(created);
  }

  async updateForUser(
    subscriptionId: string,
    userId: string,
    input: UpdateSubscriptionInput,
  ): Promise<SubscriptionRecord | null> {
    const existing = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, userId },
    });
    if (!existing) return null;

    const updated = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.provider !== undefined ? { provider: input.provider } : {}),
        ...(input.amount !== undefined ? { amount: input.amount } : {}),
        ...(input.currency !== undefined ? { currency: input.currency.toUpperCase() } : {}),
        ...(input.frequency !== undefined ? { frequency: input.frequency } : {}),
        ...(input.startDate !== undefined ? { startDate: new Date(input.startDate) } : {}),
        ...(input.nextRenewalDate !== undefined
          ? { nextRenewalDate: new Date(input.nextRenewalDate) }
          : {}),
        ...(input.paymentMethodLabel !== undefined
          ? { paymentMethodLabel: input.paymentMethodLabel }
          : {}),
        ...(input.cancellationInfo !== undefined
          ? { cancellationInfo: input.cancellationInfo }
          : {}),
        ...(input.status !== undefined
          ? {
              status: input.status,
              cancelledAt: input.status === 'cancelled' ? new Date() : null,
            }
          : {}),
        version: { increment: 1 },
      },
    });

    return mapSubscriptionRow(updated);
  }

  async cancelForUser(subscriptionId: string, userId: string): Promise<SubscriptionRecord | null> {
    const existing = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, userId },
    });
    if (!existing) return null;

    const updated = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        version: { increment: 1 },
      },
    });
    return mapSubscriptionRow(updated);
  }

  async deleteForUser(subscriptionId: string, userId: string): Promise<boolean> {
    const existing = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, userId },
    });
    if (!existing) return false;
    await this.prisma.subscription.delete({ where: { id: subscriptionId } });
    return true;
  }
}
