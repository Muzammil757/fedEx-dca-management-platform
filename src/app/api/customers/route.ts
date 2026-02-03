import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { requireAdmin, requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/db/activity-logger";
import { desc } from "drizzle-orm";

// GET all customers
export async function GET() {
  try {
    const user = await requireAuth();

    const allCustomers = await db.query.customers.findMany({
      orderBy: [desc(customers.createdAt)],
      with: {
        createdByUser: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      customers: allCustomers,
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
    console.error("Get customers error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

// CREATE new customer (Admin only)
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: "Customer name is required" },
        { status: 400 }
      );
    }

    // Insert customer
    const [newCustomer] = await db
      .insert(customers)
      .values({
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        alternatePhone: body.alternatePhone || null,
        address: body.address || null,
        city: body.city || null,
        state: body.state || null,
        pincode: body.pincode || null,
        creditScore: body.creditScore || null,
        riskLevel: body.riskLevel || null,
        notes: body.notes || null,
        createdBy: admin.id,
      })
      .returning();

    // Log activity
    await logActivity({
      user: admin,
      action: "create",
      entityType: "customer",
      entityId: newCustomer.id,
      entityName: newCustomer.name,
      description: `Created customer: ${newCustomer.name}`,
      newValues: {
        name: newCustomer.name,
        email: newCustomer.email,
        phone: newCustomer.phone,
        riskLevel: newCustomer.riskLevel,
      },
    });

    return NextResponse.json(
      {
        success: true,
        customer: newCustomer,
        message: "Customer created successfully",
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
    console.error("Create customer error:", error);
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}
