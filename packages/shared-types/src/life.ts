import type {
  AssetCategory,
  EventCategory,
  SubscriptionFrequency,
  SubscriptionStatus,
  TaskPriority,
  TaskStatus,
} from './domain';

export interface TaskDto {
  id: string;
  title: string;
  notes: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  category: string | null;
  dueAt: string | null;
  snoozedUntil: string | null;
  completedAt: string | null;
  isRecurring: boolean;
  recurrenceRule: string | null;
  sourceDocumentId: string | null;
  sourceDocumentTitle: string | null;
  linkedEventId: string | null;
  linkedEventTitle: string | null;
  isOverdue: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface EventDto {
  id: string;
  title: string;
  description: string | null;
  category: EventCategory;
  startAt: string;
  endAt: string | null;
  allDay: boolean;
  timezone: string;
  isRecurring: boolean;
  recurrenceRule: string | null;
  sourceDocumentId: string | null;
  sourceAssetId: string | null;
  sourceSubscriptionId: string | null;
  completedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export type ReminderChannel = 'push' | 'email' | 'in_app';
export type ReminderStatus = 'scheduled' | 'sent' | 'snoozed' | 'cancelled' | 'failed';

export interface ReminderDto {
  id: string;
  eventId: string | null;
  taskId: string | null;
  documentId: string | null;
  title: string;
  remindAt: string;
  channel: ReminderChannel;
  status: ReminderStatus;
  sentAt: string | null;
  snoozedUntil: string | null;
  createdAt: string;
}

export interface AssetRepairDto {
  id: string;
  assetId: string;
  repairDate: string;
  providerName: string | null;
  issueSummary: string;
  cost: string | null;
  currency: string;
  notes: string | null;
  createdAt: string;
}

export interface AssetLinkedDocumentDto {
  documentId: string;
  title: string;
  originalFilename: string;
  mimeType: string;
  relationType: string;
}

export interface AssetDto {
  id: string;
  name: string;
  category: AssetCategory;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  purchaseDate: string | null;
  purchasePrice: string | null;
  currency: string;
  warrantyStartDate: string | null;
  warrantyExpirationDate: string | null;
  serviceInfo: string | null;
  notes: string | null;
  linkedDocuments: AssetLinkedDocumentDto[];
  repairsCount: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface AssetDetailDto extends AssetDto {
  repairs: AssetRepairDto[];
}

export interface SubscriptionDto {
  id: string;
  name: string;
  provider: string;
  amount: string;
  currency: string;
  frequency: SubscriptionFrequency;
  startDate: string;
  nextRenewalDate: string;
  paymentMethodLabel: string | null;
  cancellationInfo: string | null;
  status: SubscriptionStatus;
  cancelledAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionSpendingSummary {
  currency: string;
  activeCount: number;
  cancelledCount: number;
  monthlyEquivalentTotal: string;
  annualEquivalentTotal: string;
}

export interface NotificationDto {
  id: string;
  reminderId: string | null;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  snoozedUntil: string | null;
  createdAt: string;
}

export interface NotificationPreferenceDto {
  pushEnabled: boolean;
  emailEnabled: boolean;
  documentExpiryDaysBefore: number;
  warrantyExpiryDaysBefore: number;
  subscriptionRenewalDaysBefore: number;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  privacyHideSensitiveContent: boolean;
}
