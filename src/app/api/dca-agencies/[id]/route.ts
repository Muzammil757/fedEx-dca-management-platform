import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dcaAgencies } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/db/activity-logger";
import { eq } from "drizzle-orm";

type RouteParams = { params: Promise<{ id: string }> };

// GET single DCA agency
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;

    const agency = await db.query.dcaAgencies.findFirst({
      where: eq(dcaAgencies.id, id),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            phone: true,
            lastLogin: true,
          },
        },
        cases: {
          with: {
            customer: {
              columns: {
                id: true,
                name: true,
              },
            },
          },
        },
        metrics: {
          orderBy: (m, { desc }) => [desc(m.periodEnd)],
          limit: 12, // Last 12 periods
        },
      },
    });

    if (!agency) {
      return NextResponse.json(
        { error: "DCA agency not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      agency,
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
    console.error("Get DCA agency error:", error);
    return NextResponse.json(
      { error: "Failed to fetch DCA agency" },
      { status: 500 }
    );
  }
}

// UPDATE DCA agency
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    const existingAgency = await db.query.dcaAgencies.findFirst({
      where: eq(dcaAgencies.id, id),
    });

    if (!existingAgency) {
      return NextResponse.json(
        { error: "DCA agency not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    const allowedFields = [
      "agencyName",
      "contactEmail",
      "contactPhone",
      "address",
      "status",
      "specialization",
      "performanceTarget",
      "commissionRate",
      "notes",
    ];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    const [updatedAgency] = await db
      .update(dcaAgencies)
      .set(updateData)
      .where(eq(dcaAgencies.id, id))
      .returning();

    await logActivity({
      user: admin,
      action: "update",
      entityType: "dca_agency",
      entityId: id,
      entityName: updatedAgency.agencyName,
      description: `Updated DCA agency: ${updatedAgency.agencyName}`,
      oldValues: {
        agencyName: existingAgency.agencyName,
        status: existingAgency.status,
      },
      newValues: updateData,
    });

    return NextResponse.json({
      success: true,
      agency: updatedAgency,
      message: "DCA agency updated successfully",
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
    console.error("Update DCA agency error:", error);
    return NextResponse.json(
      { error: "Failed to update DCA agency" },
      { status: 500 }
    );
  }
}

// DELETE DCA agency
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const existingAgency = await db.query.dcaAgencies.findFirst({
      where: eq(dcaAgencies.id, id),
    });

    if (!existingAgency) {
      return NextResponse.json(
        { error: "DCA agency not found" },
        { status: 404 }
      );
    }

    await db.delete(dcaAgencies).where(eq(dcaAgencies.id, id));

    await logActivity({
      user: admin,
      action: "delete",
      entityType: "dca_agency",
      entityId: id,
      entityName: existingAgency.agencyName,
      description: `Deleted DCA agency: ${existingAgency.agencyName}`,
      oldValues: {
        agencyName: existingAgency.agencyName,
        status: existingAgency.status,
      },
    });

    return NextResponse.json({
      success: true,
      message: "DCA agency deleted successfully",
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
    console.error("Delete DCA agency error:", error);
    return NextResponse.json(
      { error: "Failed to delete DCA agency" },
      { status: 500 }
    );
  }
}
