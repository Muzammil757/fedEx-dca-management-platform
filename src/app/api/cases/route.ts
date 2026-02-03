import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cases, dcaAgencies } from "@/lib/db/schema";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/db/activity-logger";
import { eq, desc } from "drizzle-orm";

// GET cases (Admin sees all, DCA sees only assigned)
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    let allCases;

    if (user.role === "admin") {
      // Admin sees all cases
      allCases = await db.query.cases.findMany({
        with: {
          customer: true,
          dcaAgency: {
            columns: {
              id: true,
              agencyName: true,
              status: true,
            },
          },
          assignedByUser: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [desc(cases.createdAt)],
      });
    } else {
      // DCA sees only their assigned cases
      const dcaAgency = await db.query.dcaAgencies.findFirst({
        where: eq(dcaAgencies.userId, user.id),
      });

      if (!dcaAgency) {
        return NextResponse.json({
          success: true,
          cases: [],
        });
      }

      allCases = await db.query.cases.findMany({
        where: eq(cases.dcaAgencyId, dcaAgency.id),
        with: {
          customer: true,
        },
        orderBy: [desc(cases.createdAt)],
      });
    }

    // Apply filters if provided
    let filteredCases = allCases;
    if (status) {
      filteredCases = filteredCases.filter((c) => c.status === status);
    }
    if (priority) {
      filteredCases = filteredCases.filter((c) => c.priority === priority);
    }

    return NextResponse.json({
      success: true,
      cases: filteredCases,
      total: filteredCases.length,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
    }
    console.error("Get cases error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cases" },
      { status: 500 }
    );
  }
}

// CREATE new case (Admin only)
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();

    // Validate required fields
    if (!body.customerId || !body.originalAmount || !body.overdueAmount) {
      return NextResponse.json(
        { error: "Customer ID, original amount, and overdue amount are required" },
        { status: 400 }
      );
    }

    // Generate unique case number
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const caseNumber = `DCA-${new Date().getFullYear()}-${timestamp}-${random}`;

    // Determine initial status based on assignment
    const initialStatus = body.dcaAgencyId ? "active" : "unassigned";

    // Insert case
    const [newCase] = await db
      .insert(cases)
      .values({
        caseNumber,
        customerId: body.customerId,
        dcaAgencyId: body.dcaAgencyId || null,
        assignedBy: body.dcaAgencyId ? admin.id : null,
        assignedAt: body.dcaAgencyId ? new Date() : null,
        originalAmount: body.originalAmount.toString(),
        overdueAmount: body.overdueAmount.toString(),
        paidAmount: "0",
        interestRate: body.interestRate?.toString() || null,
        penaltyAmount: body.penaltyAmount?.toString() || null,
        status: initialStatus,
        priority: body.priority || "medium",
        agingDays: body.agingDays || 0,
        dueDate: body.dueDate || null,
        slaDeadline: body.slaDeadline ? new Date(body.slaDeadline) : null,
        slaStatus: "on-track",
        stage: "initial-contact",
        notes: body.notes || null,
        tags: body.tags || [],
      })
      .returning();

    // Log activity
    await logActivity({
      user: admin,
      action: "create",
      entityType: "case",
      entityId: newCase.id,
      entityName: caseNumber,
      description: `Created case: ${caseNumber}`,
      newValues: {
        caseNumber,
        customerId: body.customerId,
        dcaAgencyId: body.dcaAgencyId,
        originalAmount: body.originalAmount,
        overdueAmount: body.overdueAmount,
        status: initialStatus,
        priority: body.priority,
      },
    });

    // If assigned, log assignment as well
    if (body.dcaAgencyId) {
      await logActivity({
        user: admin,
        action: "assign",
        entityType: "case",
        entityId: newCase.id,
        entityName: caseNumber,
        description: `Assigned case ${caseNumber} to DCA`,
        newValues: {
          dcaAgencyId: body.dcaAgencyId,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        case: newCase,
        message: "Case created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    console.error("Create case error:", error);
    return NextResponse.json(
      { error: "Failed to create case" },
      { status: 500 }
    );
  }
}
