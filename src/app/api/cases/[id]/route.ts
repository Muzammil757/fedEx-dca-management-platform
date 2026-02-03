import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cases, dcaAgencies } from "@/lib/db/schema";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/db/activity-logger";
import { eq } from "drizzle-orm";

type RouteParams = { params: Promise<{ id: string }> };

// GET single case
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const caseData = await db.query.cases.findFirst({
      where: eq(cases.id, id),
      with: {
        customer: true,
        dcaAgency: true,
        assignedByUser: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        notes: {
          with: {
            author: {
              columns: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
          orderBy: (notes, { desc }) => [desc(notes.createdAt)],
        },
        payments: {
          orderBy: (payments, { desc }) => [desc(payments.paymentDate)],
        },
        alerts: {
          orderBy: (alerts, { desc }) => [desc(alerts.createdAt)],
          limit: 10,
        },
      },
    });

    if (!caseData) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // DCA can only view their assigned cases
    if (user.role === "dca") {
      const dcaAgency = await db.query.dcaAgencies.findFirst({
        where: eq(dcaAgencies.userId, user.id),
      });

      if (!dcaAgency || caseData.dcaAgencyId !== dcaAgency.id) {
        return NextResponse.json(
          { error: "Forbidden: You can only view your assigned cases" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      case: caseData,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
    }
    console.error("Get case error:", error);
    return NextResponse.json(
      { error: "Failed to fetch case" },
      { status: 500 }
    );
  }
}

// UPDATE case
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    // Get existing case
    const existingCase = await db.query.cases.findFirst({
      where: eq(cases.id, id),
    });

    if (!existingCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Check permissions for DCA
    if (user.role === "dca") {
      const dcaAgency = await db.query.dcaAgencies.findFirst({
        where: eq(dcaAgencies.userId, user.id),
      });

      if (!dcaAgency || existingCase.dcaAgencyId !== dcaAgency.id) {
        return NextResponse.json(
          { error: "Forbidden: You can only update your assigned cases" },
          { status: 403 }
        );
      }

      // DCA can only update certain fields
      const dcaAllowedFields = [
        "status",
        "stage",
        "lastContact",
        "nextFollowUp",
        "contactAttempts",
        "notes",
        "paidAmount",
      ];

      const invalidFields = Object.keys(body).filter(
        (key) => !dcaAllowedFields.includes(key)
      );

      if (invalidFields.length > 0) {
        return NextResponse.json(
          { error: `DCA cannot update fields: ${invalidFields.join(", ")}` },
          { status: 403 }
        );
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    const allowedFields = [
      "status",
      "priority",
      "stage",
      "slaStatus",
      "slaDeadline",
      "dueDate",
      "agingDays",
      "overdueAmount",
      "paidAmount",
      "isEscalated",
      "isPaused",
      "pauseReason",
      "lastContact",
      "nextFollowUp",
      "contactAttempts",
      "notes",
      "tags",
      "dcaAgencyId",
    ];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    // Handle assignment
    if (body.dcaAgencyId !== undefined && body.dcaAgencyId !== existingCase.dcaAgencyId) {
      if (body.dcaAgencyId) {
        updateData.assignedBy = user.id;
        updateData.assignedAt = new Date();
        updateData.status = existingCase.status === "unassigned" ? "active" : existingCase.status;
      } else {
        updateData.assignedBy = null;
        updateData.assignedAt = null;
        updateData.status = "unassigned";
      }
    }

    // Update case
    const [updatedCase] = await db
      .update(cases)
      .set(updateData)
      .where(eq(cases.id, id))
      .returning();

    // Determine action type for logging
    let action: "update" | "assign" | "unassign" | "status_change" | "escalate" | "pause" | "resume" = "update";
    let description = `Updated case: ${existingCase.caseNumber}`;

    if (body.dcaAgencyId !== undefined && body.dcaAgencyId !== existingCase.dcaAgencyId) {
      action = body.dcaAgencyId ? "assign" : "unassign";
      description = body.dcaAgencyId
        ? `Assigned case ${existingCase.caseNumber} to DCA`
        : `Unassigned case ${existingCase.caseNumber}`;
    } else if (body.status && body.status !== existingCase.status) {
      action = "status_change";
      description = `Changed case ${existingCase.caseNumber} status from ${existingCase.status} to ${body.status}`;
    } else if (body.isEscalated && !existingCase.isEscalated) {
      action = "escalate";
      description = `Escalated case: ${existingCase.caseNumber}`;
    } else if (body.isPaused !== undefined && body.isPaused !== existingCase.isPaused) {
      action = body.isPaused ? "pause" : "resume";
      description = body.isPaused
        ? `Paused case: ${existingCase.caseNumber}`
        : `Resumed case: ${existingCase.caseNumber}`;
    }

    // Log activity
    await logActivity({
      user,
      action,
      entityType: "case",
      entityId: id,
      entityName: existingCase.caseNumber,
      description,
      oldValues: {
        status: existingCase.status,
        priority: existingCase.priority,
        dcaAgencyId: existingCase.dcaAgencyId,
        isEscalated: existingCase.isEscalated,
        isPaused: existingCase.isPaused,
      },
      newValues: updateData,
    });

    return NextResponse.json({
      success: true,
      case: updatedCase,
      message: "Case updated successfully",
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
    console.error("Update case error:", error);
    return NextResponse.json(
      { error: "Failed to update case" },
      { status: 500 }
    );
  }
}

// DELETE case (Admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const existingCase = await db.query.cases.findFirst({
      where: eq(cases.id, id),
    });

    if (!existingCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Delete case (cascades to notes, payments, alerts)
    await db.delete(cases).where(eq(cases.id, id));

    // Log activity
    await logActivity({
      user: admin,
      action: "delete",
      entityType: "case",
      entityId: id,
      entityName: existingCase.caseNumber,
      description: `Deleted case: ${existingCase.caseNumber}`,
      oldValues: {
        caseNumber: existingCase.caseNumber,
        status: existingCase.status,
        customerId: existingCase.customerId,
        originalAmount: existingCase.originalAmount,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Case deleted successfully",
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
    console.error("Delete case error:", error);
    return NextResponse.json(
      { error: "Failed to delete case" },
      { status: 500 }
    );
  }
}
