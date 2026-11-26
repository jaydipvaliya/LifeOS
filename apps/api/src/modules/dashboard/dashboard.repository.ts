import type {
  DashboardDataDto,
  DashboardInsight,
  DashboardWeeklyActivityDay,
  DocumentListItemDto,
} from '@lifeos/shared-types';
import type { PrismaClient } from '@prisma/client';
import type { IDashboardRepository } from './dashboard.types';

export class PrismaDashboardRepository implements IDashboardRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getDashboardData(userId: string): Promise<DashboardDataDto> {
    const now = new Date();
    const todayDateOnly = new Date(now.toISOString().slice(0, 10));
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);
    const in30Days = new Date(now.getTime() + 30 * 86_400_000);
    const in7Days = new Date(now.getTime() + 7 * 86_400_000);
    const sevenDaysAgo = new Date(now.getTime() - 6 * 86_400_000);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [
      totalDocuments,
      expiringDocsRows,
      recentDocsRows,
      todaysTasksRows,
      upcomingEventsRows,
      warrantyAssetsRows,
      subscriptionRows,
      activeAssetsCount,
      activeSubscriptionsCount,
      weeklyDocRows,
      weeklyTaskRows,
    ] = await this.prisma.$transaction([
      this.prisma.document.count({
        where: { userId, deletedAt: null, isArchived: false },
      }),
      this.prisma.document.findMany({
        where: {
          userId,
          deletedAt: null,
          isArchived: false,
          expiryDate: { gte: todayDateOnly, lte: in30Days },
        },
        include: { category: true },
        orderBy: { expiryDate: 'asc' },
        take: 5,
      }),
      this.prisma.document.findMany({
        where: { userId, deletedAt: null, isArchived: false },
        include: { category: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.task.findMany({
        where: {
          userId,
          status: { in: ['pending', 'in_progress'] },
          OR: [{ dueAt: null }, { dueAt: { lte: endOfToday } }],
        },
        orderBy: [{ priority: 'desc' }, { dueAt: 'asc' }],
        take: 5,
      }),
      this.prisma.event.findMany({
        where: {
          userId,
          completedAt: null,
          startAt: { gte: now, lte: in30Days },
        },
        orderBy: { startAt: 'asc' },
        take: 6,
      }),
      this.prisma.asset.findMany({
        where: {
          userId,
          warrantyExpirationDate: { gte: todayDateOnly, lte: in30Days },
        },
        orderBy: { warrantyExpirationDate: 'asc' },
        take: 5,
      }),
      this.prisma.subscription.findMany({
        where: {
          userId,
          status: 'active',
          nextRenewalDate: { gte: todayDateOnly, lte: in7Days },
        },
        orderBy: { nextRenewalDate: 'asc' },
        take: 5,
      }),
      this.prisma.asset.count({ where: { userId } }),
      this.prisma.subscription.count({ where: { userId, status: 'active' } }),
      this.prisma.document.findMany({
        where: { userId, deletedAt: null, createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true },
      }),
      this.prisma.task.findMany({
        where: { userId, completedAt: { gte: sevenDaysAgo } },
        select: { completedAt: true },
      }),
    ]);

    const mapDoc = (row: (typeof recentDocsRows)[number]): DocumentListItemDto => ({
      id: row.id,
      title: row.title,
      category: {
        id: row.category.id,
        slug: row.category.slug,
        name: row.category.name,
        isSystem: row.category.isSystem,
        iconName: row.category.iconName,
      },
      originalFilename: row.originalFilename,
      mimeType: row.mimeType,
      fileSizeBytes: row.fileSizeBytes,
      expiryDate: row.expiryDate ? row.expiryDate.toISOString().slice(0, 10) : null,
      processingStatus: row.processingStatus,
      tags: row.tags,
      isArchived: row.isArchived,
      version: row.version,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    });

    const weeklyActivity: DashboardWeeklyActivityDay[] = [];
    for (let offset = 6; offset >= 0; offset--) {
      const day = new Date(now.getTime() - offset * 86_400_000);
      const isoDay = day.toISOString().slice(0, 10);
      const label = day.toLocaleDateString('en-US', { weekday: 'short' });
      const documentsAdded = weeklyDocRows.filter(
        (d) => d.createdAt.toISOString().slice(0, 10) === isoDay,
      ).length;
      const tasksCompleted = weeklyTaskRows.filter(
        (t) => t.completedAt && t.completedAt.toISOString().slice(0, 10) === isoDay,
      ).length;
      weeklyActivity.push({
        date: isoDay,
        label,
        documentsAdded,
        tasksCompleted,
      });
    }

    const insights: DashboardInsight[] = [];
    if (expiringDocsRows.length > 0) {
      insights.push({
        id: 'expiring-docs',
        title: `${expiringDocsRows.length} document${expiringDocsRows.length > 1 ? 's' : ''} expiring within 30 days`,
        description: `Nearest expiry: ${expiringDocsRows[0]?.title}`,
        tone: 'warning',
        actionRoute: '/(app)/(tabs)/vault',
      });
    }
    if (totalDocuments === 0) {
      insights.push({
        id: 'empty-vault',
        title: 'Start your Document Vault',
        description: 'Scan or upload your first receipt, ID, or certificate to unlock reminders.',
        tone: 'sage',
        actionRoute: '/(app)/scanner',
      });
    }

    const upcomingEvent = upcomingEventsRows[0]
      ? {
          id: upcomingEventsRows[0].id,
          title: upcomingEventsRows[0].title,
          subtitle: upcomingEventsRows[0].category,
          date: upcomingEventsRows[0].startAt.toISOString(),
        }
      : null;

    return {
      generatedAt: now.toISOString(),
      summaryCounts: {
        totalDocuments,
        expiringDocumentsSoon: expiringDocsRows.length,
        pendingTasksToday: todaysTasksRows.length,
        upcomingDeadlinesCount: upcomingEventsRows.length,
        activeAssetsCount,
        activeSubscriptionsCount,
      },
      upcomingEvent,
      todaysTasks: todaysTasksRows.map((t) => ({
        id: t.id,
        title: t.title,
        subtitle: t.priority,
        date: t.dueAt ? t.dueAt.toISOString() : null,
      })),
      upcomingDeadlines: upcomingEventsRows.map((e) => ({
        id: e.id,
        title: e.title,
        subtitle: e.category,
        date: e.startAt.toISOString(),
      })),
      expiringDocuments: expiringDocsRows.map(mapDoc),
      recentDocuments: recentDocsRows.map(mapDoc),
      warrantyReminders: warrantyAssetsRows.map((a) => ({
        id: a.id,
        title: a.name,
        subtitle: a.brand ?? a.category,
        date: a.warrantyExpirationDate ? a.warrantyExpirationDate.toISOString().slice(0, 10) : null,
      })),
      subscriptionRenewals: subscriptionRows.map((s) => ({
        id: s.id,
        title: s.name,
        subtitle: `${s.currency} ${s.amount.toString()}`,
        date: s.nextRenewalDate.toISOString().slice(0, 10),
      })),
      weeklyActivity,
      insights,
    };
  }
}
