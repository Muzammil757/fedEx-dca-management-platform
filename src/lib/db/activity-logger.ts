import { db } from "@/lib/db";
import { activityLogs } from "@/lib/db/schema";
import type { AuthUser } from "@/lib/auth";

// ============================================
// TYPES
// ============================================
export type ActivityAction =
  | "create"
  | "update"
  | "delete"
  | "assign"
  | "unassign"
  | "login"
  | "logout"
  | "view"
  | "export"
  | "payment"
  | "status_change"
  | "escalate"
  | "pause"
  | "resume";

export type EntityType =
  | "customer"
  | "case"
  | "dca_agency"
  | "user"
  | "payment"
  | "note";

export interface LogActivityParams {
  user: AuthUser;
  action: ActivityAction;
  entityType: EntityType;
  entityId?: string;
  entityName?: string;
  description?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

// ============================================
// LOG ACTIVITY
// ============================================
export async function logActivity(params: LogActivityParams): Promise<void> {
  await db.insert(activityLogs).values({
    userId: params.user.id,
    userEmail: params.user.email,
    userRole: params.user.role,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    entityName: params.entityName,
    description: params.description,
    oldValues: params.oldValues,
    newValues: params.newValues,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });
}

// ============================================
// GET RECENT ACTIVITIES
// ============================================
export async function getRecentActivities(limit: number = 50) {
  return await db.query.activityLogs.findMany({
    orderBy: (logs, { desc }) => [desc(logs.createdAt)],
    limit,
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
}

// ============================================
// GET USER ACTIVITIES
// ============================================
export async function getUserActivities(userId: string, limit: number = 50) {
  return await db.query.activityLogs.findMany({
    where: (logs, { eq }) => eq(logs.userId, userId),
    orderBy: (logs, { desc }) => [desc(logs.createdAt)],
    limit,
  });
}

// ============================================
// GET ENTITY ACTIVITIES
// ============================================
export async function getEntityActivities(
  entityType: EntityType,
  entityId: string,
  limit: number = 50
) {
  return await db.query.activityLogs.findMany({
    where: (logs, { and, eq }) =>
      and(eq(logs.entityType, entityType), eq(logs.entityId, entityId)),
    orderBy: (logs, { desc }) => [desc(logs.createdAt)],
    limit,
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
}

// ============================================
// GET ACTIVITIES BY DATE RANGE
// ============================================
export async function getActivitiesByDateRange(
  startDate: Date,
  endDate: Date,
  limit: number = 100
) {
  return await db.query.activityLogs.findMany({
    where: (logs, { and, gte, lte }) =>
      and(gte(logs.createdAt, startDate), lte(logs.createdAt, endDate)),
    orderBy: (logs, { desc }) => [desc(logs.createdAt)],
    limit,
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
}

// ============================================
// GET ACTIVITY SUMMARY
// ============================================
export async function getActivitySummary(userId?: string) {
  // This would be a raw SQL query for aggregation
  // For now, return basic counts
  const activities = await db.query.activityLogs.findMany({
    where: userId ? (logs, { eq }) => eq(logs.userId, userId) : undefined,
    columns: {
      action: true,
      entityType: true,
    },
  });

  const summary = {
    totalActivities: activities.length,
    byAction: {} as Record<string, number>,
    byEntityType: {} as Record<string, number>,
  };

  activities.forEach((activity) => {
    summary.byAction[activity.action] =
      (summary.byAction[activity.action] || 0) + 1;
    summary.byEntityType[activity.entityType] =
      (summary.byEntityType[activity.entityType] || 0) + 1;
  });

  return summary;
}
