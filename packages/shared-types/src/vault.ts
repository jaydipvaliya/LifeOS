import type { DocumentProcessingStatus } from './domain';

export interface CategoryDto {
  id: string;
  slug: string;
  name: string;
  isSystem: boolean;
  iconName: string | null;
  documentCount?: number;
}

export interface DocumentListItemDto {
  id: string;
  title: string;
  category: CategoryDto;
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: number;
  expiryDate: string | null;
  processingStatus: DocumentProcessingStatus;
  tags: string[];
  isArchived: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersionDto {
  id: string;
  versionNumber: number;
  mimeType: string;
  fileSizeBytes: number;
  checksumSha256: string | null;
  createdAt: string;
}

export interface DocumentAccessEventDto {
  id: string;
  action: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface LinkedSummaryItem {
  id: string;
  title: string;
  subtitle: string | null;
  date: string | null;
}

export interface DocumentDetailDto extends DocumentListItemDto {
  archivedAt: string | null;
  checksumSha256: string | null;
  versions: DocumentVersionDto[];
  accessHistory: DocumentAccessEventDto[];
  extractedSummary: Record<string, unknown> | null;
  relatedEvents: LinkedSummaryItem[];
  relatedTasks: LinkedSummaryItem[];
  relatedAssets: LinkedSummaryItem[];
}

export interface UploadInitResponse {
  documentId: string;
  storageKey: string;
  uploadUrl: string;
  method: 'PUT';
  headers: Record<string, string>;
  expiresAt: string;
}

export interface SignedDownloadUrlResponse {
  downloadUrl: string;
  expiresAt: string;
}

export interface DashboardSummaryCounts {
  totalDocuments: number;
  expiringDocumentsSoon: number;
  pendingTasksToday: number;
  upcomingDeadlinesCount: number;
  activeAssetsCount: number;
  activeSubscriptionsCount: number;
}

export interface DashboardWeeklyActivityDay {
  date: string;
  label: string;
  documentsAdded: number;
  tasksCompleted: number;
}

export interface DashboardInsight {
  id: string;
  title: string;
  description: string;
  tone: 'sage' | 'warning' | 'neutral';
  actionRoute: string;
}

export interface DashboardDataDto {
  generatedAt: string;
  summaryCounts: DashboardSummaryCounts;
  upcomingEvent: LinkedSummaryItem | null;
  todaysTasks: LinkedSummaryItem[];
  upcomingDeadlines: LinkedSummaryItem[];
  expiringDocuments: DocumentListItemDto[];
  recentDocuments: DocumentListItemDto[];
  warrantyReminders: LinkedSummaryItem[];
  subscriptionRenewals: LinkedSummaryItem[];
  weeklyActivity: DashboardWeeklyActivityDay[];
  insights: DashboardInsight[];
}
