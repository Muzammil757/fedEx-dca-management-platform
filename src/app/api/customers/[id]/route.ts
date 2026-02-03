import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { requireAdmin, requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/db/activity-logger";
import { eq } from "drizzle-orm";

type RouteParams = { params: Promise<{ id: string }> };

// GET single customer
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;

    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, id),
      with: {
        cases: {
          with: {
            dcaAgency: {
              columns: {
                id: true,
                agencyName: true,
              },
            },
          },
        },
        createdByUser: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      customer,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
    }
    console.error("Get customer error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer" },
      { status: 500 }
    );
  }
}

// UPDATE customer (Admin only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    // Get existing customer for logging
    const existingCustomer = await db.query.customers.findFirst({
      where: eq(customers.id, id),
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    const allowedFields = [
      "name",
      "email",
      "phone",
      "alternatePhone",
      "address",
      "city",
      "state",
      "pincode",
      "creditScore",
      "riskLevel",
      "notes",
    ];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    // Update customer
    const [updatedCustomer] = await db
      .update(customers)
      .set(updateData)
      .where(eq(customers.id, id))
      .returning();

    // Log activity
    await logActivity({
      user: admin,
      action: "update",
      entityType: "customer",
      entityId: id,
      entityName: updatedCustomer.name,
      description: `Updated customer: ${updatedCustomer.name}`,
      oldValues: {
        name: existingCustomer.name,
        email: existingCustomer.email,
        phone: existingCustomer.phone,
        riskLevel: existingCustomer.riskLevel,
      },
      newValues: updateData,
    });

    return NextResponse.json({
      success: true,
      customer: updatedCustomer,
      message: "Customer updated successfully",
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
    console.error("Update customer error:", error);
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
}

// DELETE customer (Admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    // Get existing customer for logging
    const existingCustomer = await db.query.customers.findFirst({
      where: eq(customers.id, id),
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Delete customer (will cascade to cases)
    await db.delete(customers).where(eq(customers.id, id));

    // Log activity
    await logActivity({
      user: admin,
      action: "delete",
      entityType: "customer",
      entityId: id,
      entityName: existingCustomer.name,
      description: `Deleted customer: ${existingCustomer.name}`,
      oldValues: {
        name: existingCustomer.name,
        email: existingCustomer.email,
        phone: existingCustomer.phone,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Customer deleted successfully",
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
    console.error("Delete customer error:", error);
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  }
}
