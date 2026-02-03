import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activityLogs } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";
import { desc, eq, and, gte, lte } from "drizzle-orm";

// GET activity logs (Admin only)
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const userId = searchParams.get("userId");
    const entityType = searchParams.get("entityType");
    const action = searchParams.get("action");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build query conditions
    const conditions = [];

    if (userId) {
      conditions.push(eq(activityLogs.userId, userId));
    }

    if (entityType) {
      conditions.push(eq(activityLogs.entityType, entityType));
    }

    if (action) {
      conditions.push(eq(activityLogs.action, action));
    }

    if (startDate) {
      conditions.push(gte(activityLogs.createdAt, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(activityLogs.createdAt, new Date(endDate)));
    }

    const logs = await db.query.activityLogs.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(activityLogs.createdAt)],
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

    return NextResponse.json({
      success: true,
      logs,
      total: logs.length,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    console.error("Get activity logs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity logs" },
      { status: 500 }
    );
  }
}
