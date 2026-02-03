import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dcaAgencies } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/db/activity-logger";
import { eq, desc } from "drizzle-orm";

// GET all DCA agencies
export async function GET() {
  try {
    await requireAdmin();

    const allAgencies = await db.query.dcaAgencies.findMany({
      orderBy: [desc(dcaAgencies.createdAt)],
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            lastLogin: true,
          },
        },
        metrics: {
          orderBy: (m, { desc }) => [desc(m.periodEnd)],
          limit: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      agencies: allAgencies,
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
    console.error("Get DCA agencies error:", error);
    return NextResponse.json(
      { error: "Failed to fetch DCA agencies" },
      { status: 500 }
    );
  }
}

// CREATE new DCA agency (Admin only)
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();

    if (!body.agencyName) {
      return NextResponse.json(
        { error: "Agency name is required" },
        { status: 400 }
      );
    }

    const [newAgency] = await db
      .insert(dcaAgencies)
      .values({
        userId: body.userId || null,
        agencyName: body.agencyName,
        contactEmail: body.contactEmail || null,
        contactPhone: body.contactPhone || null,
        address: body.address || null,
        status: body.status || "active",
        specialization: body.specialization || null,
        performanceTarget: body.performanceTarget?.toString() || "75.00",
        commissionRate: body.commissionRate?.toString() || "10.00",
        notes: body.notes || null,
      })
      .returning();

    await logActivity({
      user: admin,
      action: "create",
      entityType: "dca_agency",
      entityId: newAgency.id,
      entityName: newAgency.agencyName,
      description: `Created DCA agency: ${newAgency.agencyName}`,
      newValues: {
        agencyName: newAgency.agencyName,
        status: newAgency.status,
        specialization: newAgency.specialization,
      },
    });

    return NextResponse.json(
      {
        success: true,
        agency: newAgency,
        message: "DCA agency created successfully",
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
    console.error("Create DCA agency error:", error);
    return NextResponse.json(
      { error: "Failed to create DCA agency" },
      { status: 500 }
    );
  }
}
