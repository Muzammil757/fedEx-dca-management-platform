import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { eq } from "drizzle-orm";

async function seedDemoData() {
  console.log("🌱 Seeding demo business data...");

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ DATABASE_URL not found!");
    process.exit(1);
  }

  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client, { schema });

  try {
    const adminUser = await db.query.users.findFirst({
      where: eq(schema.users.role, "admin"),
    });

    const dcaUser = await db.query.users.findFirst({
      where: eq(schema.users.role, "dca"),
    });

    if (!adminUser || !dcaUser) {
      console.error("❌ Admin or DCA user not found. Run npm run db:seed first.");
      process.exit(1);
    }

    let dcaAgency = await db.query.dcaAgencies.findFirst();

    if (!dcaAgency) {
      const [createdAgency] = await db
        .insert(schema.dcaAgencies)
        .values({
          userId: dcaUser.id,
          agencyName: "Partner Collection Agency",
          contactEmail: dcaUser.email,
          status: "active",
          specialization: "both",
          performanceTarget: "75.00",
          commissionRate: "10.00",
        })
        .returning();

      dcaAgency = createdAgency;
    }

    const customerData = [
      {
        name: "Rajesh Kumar",
        email: "rajesh.kumar@example.com",
        phone: "9876543210",
        city: "Hyderabad",
        state: "Telangana",
        pincode: "500081",
        creditScore: 620,
        riskLevel: "high",
        notes: "Repeated missed payments.",
      },
      {
        name: "Priya Sharma",
        email: "priya.sharma@example.com",
        phone: "9876501234",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560001",
        creditScore: 710,
        riskLevel: "medium",
        notes: "Responsive customer, follow-up required.",
      },
      {
        name: "Amit Verma",
        email: "amit.verma@example.com",
        phone: "9123456780",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        creditScore: 540,
        riskLevel: "critical",
        notes: "High-value overdue account.",
      },
      {
        name: "Sneha Reddy",
        email: "sneha.reddy@example.com",
        phone: "9988776655",
        city: "Hyderabad",
        state: "Telangana",
        pincode: "500032",
        creditScore: 680,
        riskLevel: "low",
        notes: "Likely to resolve soon.",
      },
    ];

    const insertedCustomers = await db
      .insert(schema.customers)
      .values(
        customerData.map((customer) => ({
          ...customer,
          createdBy: adminUser.id,
        }))
      )
      .returning();

    const now = new Date();

    const caseData = [
      {
        caseNumber: "DCA-2026-001",
        customerId: insertedCustomers[0].id,
        dcaAgencyId: dcaAgency.id,
        assignedBy: adminUser.id,
        assignedAt: now,
        originalAmount: "125000.00",
        overdueAmount: "98500.00",
        paidAmount: "26500.00",
        status: "active",
        priority: "high",
        agingDays: 45,
        slaDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
        timeRemaining: 48,
        slaStatus: "at-risk",
        stage: "follow-up",
        isEscalated: false,
        aiProbability: 62,
        aiNextAction: "Schedule structured follow-up call and propose payment plan.",
        aiEstResolution: "14 days",
        contactAttempts: 3,
        notes: "Assigned to DCA for priority recovery.",
        tags: ["high-risk", "follow-up"],
      },
      {
        caseNumber: "DCA-2026-002",
        customerId: insertedCustomers[1].id,
        dcaAgencyId: dcaAgency.id,
        assignedBy: adminUser.id,
        assignedAt: now,
        originalAmount: "75000.00",
        overdueAmount: "50000.00",
        paidAmount: "25000.00",
        status: "negotiating",
        priority: "medium",
        agingDays: 28,
        slaDeadline: new Date(Date.now() + 96 * 60 * 60 * 1000),
        timeRemaining: 96,
        slaStatus: "on-track",
        stage: "negotiation",
        isEscalated: false,
        aiProbability: 78,
        aiNextAction: "Offer revised settlement schedule.",
        aiEstResolution: "7 days",
        contactAttempts: 2,
        notes: "Customer is open to partial settlement.",
        tags: ["payment-plan"],
      },
      {
        caseNumber: "DCA-2026-003",
        customerId: insertedCustomers[2].id,
        dcaAgencyId: dcaAgency.id,
        assignedBy: adminUser.id,
        assignedAt: now,
        originalAmount: "240000.00",
        overdueAmount: "240000.00",
        paidAmount: "0.00",
        status: "escalated",
        priority: "critical",
        agingDays: 90,
        slaDeadline: new Date(Date.now() - 24 * 60 * 60 * 1000),
        timeRemaining: -24,
        slaStatus: "breached",
        stage: "legal-review",
        isEscalated: true,
        aiProbability: 34,
        aiNextAction: "Escalate for legal review due to repeated non-response.",
        aiEstResolution: "30+ days",
        contactAttempts: 6,
        notes: "Critical account. SLA breached.",
        tags: ["critical", "sla-breach", "legal-review"],
      },
      {
        caseNumber: "DCA-2026-004",
        customerId: insertedCustomers[3].id,
        dcaAgencyId: null,
        assignedBy: null,
        assignedAt: null,
        originalAmount: "45000.00",
        overdueAmount: "45000.00",
        paidAmount: "0.00",
        status: "unassigned",
        priority: "low",
        agingDays: 12,
        slaDeadline: new Date(Date.now() + 120 * 60 * 60 * 1000),
        timeRemaining: 120,
        slaStatus: "on-track",
        stage: "initial-contact",
        isEscalated: false,
        aiProbability: 85,
        aiNextAction: "Assign to available DCA for first contact.",
        aiEstResolution: "5 days",
        contactAttempts: 0,
        notes: "New case awaiting allocation.",
        tags: ["new"],
      },
    ];

    const insertedCases = await db.insert(schema.cases).values(caseData).returning();

    await db.insert(schema.slaAlerts).values([
      {
        caseId: insertedCases[0].id,
        alertType: "warning",
        message: "Case DCA-2026-001 is approaching SLA deadline.",
      },
      {
        caseId: insertedCases[2].id,
        alertType: "breach",
        message: "Case DCA-2026-003 has breached SLA deadline.",
      },
    ]);

    await db.insert(schema.paymentRecords).values([
      {
        caseId: insertedCases[0].id,
        amount: "26500.00",
        paymentDate: now,
        paymentMethod: "upi",
        referenceNumber: "UPI-DEMO-001",
        recordedBy: dcaUser.id,
        notes: "Partial payment received.",
      },
      {
        caseId: insertedCases[1].id,
        amount: "25000.00",
        paymentDate: now,
        paymentMethod: "bank_transfer",
        referenceNumber: "BANK-DEMO-002",
        recordedBy: dcaUser.id,
        notes: "Initial settlement payment.",
      },
    ]);

    await db.insert(schema.dcaPerformanceMetrics).values({
      dcaAgencyId: dcaAgency.id,
      periodStart: "2026-02-01",
      periodEnd: "2026-02-28",
      totalCases: 18,
      activeCases: 11,
      recoveredCases: 7,
      recoveryRate: "72.50",
      slaCompliance: "84.00",
      avgResolutionDays: 16,
      totalRecovered: "425000.00",
      rank: 1,
      trend: "up",
      weeklyTrend: [
        { week: "Week 1", recovered: 85000 },
        { week: "Week 2", recovered: 110000 },
        { week: "Week 3", recovered: 95000 },
        { week: "Week 4", recovered: 135000 },
      ],
    });

    console.log("✅ Demo customers, cases, alerts, payments, and metrics created.");
    await client.end();
  } catch (error) {
    console.error("❌ Demo seed failed:", error);
    await client.end();
    process.exit(1);
  }

  process.exit(0);
}

seedDemoData();