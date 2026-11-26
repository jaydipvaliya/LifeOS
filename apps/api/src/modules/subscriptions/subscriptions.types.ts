import type { SubscriptionFrequency, SubscriptionStatus } from '@lifeos/shared-types';
import type { CreateSubscriptionInput, UpdateSubscriptionInput } from '@lifeos/validation';

export interface SubscriptionRecord {
  id: string;
  userId: string;
  name: string;
  provider: string;
  amount: string;
  currency: string;
  frequency: SubscriptionFrequency;
  startDate: Date;
  nextRenewalDate: Date;
  paymentMethodLabel: string | null;
  cancellationInfo: string | null;
  status: SubscriptionStatus;
  cancelledAt: Date | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubscriptionsRepository {
  listForUser(userId: string, status?: SubscriptionStatus): Promise<SubscriptionRecord[]>;
  createForUser(userId: string, input: CreateSubscriptionInput): Promise<SubscriptionRecord>;
  updateForUser(
    subscriptionId: string,
    userId: string,
    input: UpdateSubscriptionInput,
  ): Promise<SubscriptionRecord | null>;
  cancelForUser(subscriptionId: string, userId: string): Promise<SubscriptionRecord | null>;
  deleteForUser(subscriptionId: string, userId: string): Promise<boolean>;
}
