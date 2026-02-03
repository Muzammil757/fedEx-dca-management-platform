import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cases, customers, dcaAgencies, activityLogs } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, count, sql, desc } from "drizzle-orm";

// GET dashboard stats
export async function GET() {
  try {
    const user = await requireAuth();

    if (user.role === "admin") {
      // Admin dashboard stats
      const [
        totalCases,
        activeCases,
        resolvedCases,
        totalCustomers,
        totalDcaAgencies,
        recentActivity,
        casesByStatus,
        casesByPriority,
      ] = await Promise.all([
        // Total cases
        db.select({ count: count() }).from(cases),

        // Active cases
        db
          .select({ count: count() })
          .from(cases)
          .where(eq(cases.status, "active")),

        // Resolved cases
        db
          .select({ count: count() })
          .from(cases)
          .where(eq(cases.status, "resolved")),

        // Total customers
        db.select({ count: count() }).from(customers),

        // Total DCA agencies
        db.select({ count: count() }).from(dcaAgencies),

        // Recent activity
        db.query.activityLogs.findMany({
          orderBy: [desc(activityLogs.createdAt)],
          limit: 10,
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        }),

        // Cases by status
        db
          .select({
            status: cases.status,
            count: count(),
          })
          .from(cases)
          .groupBy(cases.status),

        // Cases by priority
        db
          .select({
            priority: cases.priority,
            count: count(),
          })
          .from(cases)
          .groupBy(cases.priority),
      ]);

      // Calculate totals
      const totalOverdue = await db
        .select({
          total: sql<string>`COALESCE(SUM(${cases.overdueAmount}), 0)`,
        })
        .from(cases)
        .where(sql`${cases.status} NOT IN ('resolved', 'closed', 'written_off')`);

      const totalRecovered = await db
        .select({
          total: sql<string>`COALESCE(SUM(${cases.paidAmount}), 0)`,
        })
        .from(cases);

      return NextResponse.json({
        success: true,
        dashboard: {
          overview: {
            totalCases: totalCases[0]?.count || 0,
            activeCases: activeCases[0]?.count || 0,
            resolvedCases: resolvedCases[0]?.count || 0,
            totalCustomers: totalCustomers[0]?.count || 0,
            totalDcaAgencies: totalDcaAgencies[0]?.count || 0,
            totalOverdue: parseFloat(totalOverdue[0]?.total || "0"),
            totalRecovered: parseFloat(totalRecovered[0]?.total || "0"),
          },
          casesByStatus: casesByStatus.reduce((acc, item) => {
            acc[item.status] = item.count;
            return acc;
          }, {} as Record<string, number>),
          casesByPriority: casesByPriority.reduce((acc, item) => {
            acc[item.priority] = item.count;
            return acc;
          }, {} as Record<string, number>),
          recentActivity,
        },
      });
    } else {
      // DCA dashboard stats
      const dcaAgency = await db.query.dcaAgencies.findFirst({
        where: eq(dcaAgencies.userId, user.id),
      });

      if (!dcaAgency) {
        return NextResponse.json({
          success: true,
          dashboard: {
            overview: {
              assignedCases: 0,
              activeCases: 0,
              resolvedCases: 0,
            },
            casesByStatus: {},
            casesByPriority: {},
          },
        });
      }

      const [assignedCases, activeCases, resolvedCases, casesByStatus, casesByPriority] =
        await Promise.all([
          db
            .select({ count: count() })
            .from(cases)
            .where(eq(cases.dcaAgencyId, dcaAgency.id)),

          db
            .select({ count: count() })
            .from(cases)
            .where(
              sql`${cases.dcaAgencyId} = ${dcaAgency.id} AND ${cases.status} = 'active'`
            ),

          db
            .select({ count: count() })
            .from(cases)
            .where(
              sql`${cases.dcaAgencyId} = ${dcaAgency.id} AND ${cases.status} = 'resolved'`
            ),

          db
            .select({
              status: cases.status,
              count: count(),
            })
            .from(cases)
            .where(eq(cases.dcaAgencyId, dcaAgency.id))
            .groupBy(cases.status),

          db
            .select({
              priority: cases.priority,
              count: count(),
            })
            .from(cases)
            .where(eq(cases.dcaAgencyId, dcaAgency.id))
            .groupBy(cases.priority),
        ]);

      return NextResponse.json({
        success: true,
        dashboard: {
          overview: {
            assignedCases: assignedCases[0]?.count || 0,
            activeCases: activeCases[0]?.count || 0,
            resolvedCases: resolvedCases[0]?.count || 0,
          },
          casesByStatus: casesByStatus.reduce((acc, item) => {
            acc[item.status] = item.count;
            return acc;
          }, {} as Record<string, number>),
          casesByPriority: casesByPriority.reduce((acc, item) => {
            acc[item.priority] = item.count;
            return acc;
          }, {} as Record<string, number>),
        },
      });
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
    }
    console.error("Get dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
