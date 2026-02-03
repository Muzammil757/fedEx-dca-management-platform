/**
 * Sample Data Seed Script
 * Run with: npx tsx src/lib/db/seed-data.ts
 * 
 * This script creates sample customers and cases for demonstration.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { eq } from "drizzle-orm";

async function seedData() {
  console.log("🌱 Starting sample data seed...\n");

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ DATABASE_URL not found in environment!");
    process.exit(1);
  }

  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client, { schema });

  try {
    // Get existing DCA agency
    const dcaAgency = await db.query.dcaAgencies.findFirst();
    
    // Get admin user for assigning cases
    const adminUser = await db.query.users.findFirst({
      where: eq(schema.users.role, "admin"),
    });

    if (!dcaAgency || !adminUser) {
      console.error("❌ Please run npm run db:seed first to create users and DCA agency");
      process.exit(1);
    }

    // Check existing data
    let customers = await db.query.customers.findMany();
    const existingCases = await db.query.cases.findMany();
    
    // If both exist, skip
    if (customers.length > 0 && existingCases.length > 0) {
      console.log("⚠️  Sample data already exists. Skipping...");
      console.log(`   ${customers.length} customers found`);
      console.log(`   ${existingCases.length} cases found`);
      await client.end();
      process.exit(0);
    }

    // Create customers if needed
    if (customers.length === 0) {
      console.log("📦 Creating sample customers...\n");

      const customerData = [
        { name: "Acme Logistics Corp", email: "j.mitchell@acmelogistics.com", phone: "+1 (555) 234-5678", city: "Chicago", state: "IL", creditScore: 680, riskLevel: "medium" as const },
        { name: "Global Shipping Ltd", email: "contact@globalshipping.com", phone: "+1 (555) 345-6789", city: "New York", state: "NY", creditScore: 720, riskLevel: "low" as const },
        { name: "FastTrack Deliveries", email: "billing@fasttrack.com", phone: "+1 (555) 456-7890", city: "Los Angeles", state: "CA", creditScore: 520, riskLevel: "critical" as const },
        { name: "Metro Transport Inc", email: "finance@metrotransport.com", phone: "+1 (555) 567-8901", city: "Houston", state: "TX", creditScore: 750, riskLevel: "low" as const },
        { name: "Continental Freight", email: "accounts@continental.com", phone: "+1 (555) 678-9012", city: "Phoenix", state: "AZ", creditScore: 480, riskLevel: "critical" as const },
        { name: "Express Logistics Co", email: "billing@expresslog.com", phone: "+1 (555) 789-0123", city: "Philadelphia", state: "PA", creditScore: 650, riskLevel: "medium" as const },
        { name: "Harbor Shipping Inc", email: "ar@harborshipping.com", phone: "+1 (555) 890-1234", city: "San Diego", state: "CA", creditScore: 590, riskLevel: "high" as const },
        { name: "Prime Movers LLC", email: "finance@primemovers.com", phone: "+1 (555) 901-2345", city: "Dallas", state: "TX", creditScore: 800, riskLevel: "low" as const },
        { name: "Summit Cargo Services", email: "billing@summitcargo.com", phone: "+1 (555) 012-3456", city: "Denver", state: "CO", creditScore: 620, riskLevel: "medium" as const },
        { name: "Atlantic Freight Corp", email: "accounts@atlanticfreight.com", phone: "+1 (555) 123-4567", city: "Miami", state: "FL", creditScore: 540, riskLevel: "high" as const },
      ];

      customers = await db.insert(schema.customers).values(customerData).returning();
      console.log(`✅ Created ${customers.length} customers\n`);
    } else {
      console.log(`📦 Using existing ${customers.length} customers\n`);
    }

    // Create cases if needed
    let cases = existingCases;
    if (existingCases.length === 0) {
      console.log("📋 Creating sample cases...\n");

      const caseData = customers.map((customer, index) => {
        const statuses = ["active", "contacted", "negotiating", "payment-plan", "escalated", "legal", "resolved", "active", "negotiating", "active"] as const;
        const priorities = ["critical", "high", "medium", "low", "critical", "high", "medium", "low", "medium", "high"] as const;
        const slaStatuses = ["on-track", "at-risk", "breached", "on-track", "breached", "at-risk", "on-track", "on-track", "at-risk", "on-track"] as const;
        const stages = ["initial-contact", "follow-up", "negotiation", "payment-arrangement", "legal-review", "escalated", "resolution", "initial-contact", "negotiation", "follow-up"] as const;
        
        const agingDays = [45, 32, 67, 21, 78, 28, 52, 15, 38, 55][index];
        const amounts = [125000, 87500, 234000, 56000, 178500, 45000, 92000, 38000, 65000, 115000][index];
        
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() - agingDays);
        // Format as YYYY-MM-DD string for date column
        const dueDateStr = dueDate.toISOString().split('T')[0];
        
        const slaDeadline = new Date();
        slaDeadline.setDate(slaDeadline.getDate() + (slaStatuses[index] === "breached" ? -5 : slaStatuses[index] === "at-risk" ? 2 : 7));
        
        return {
          caseNumber: `CASE-${String(1000 + index + 1).padStart(5, '0')}`,
          customerId: customer.id,
          dcaAgencyId: dcaAgency.id,
          assignedBy: adminUser.id,
          assignedAt: new Date(Date.now() - agingDays * 24 * 60 * 60 * 1000),
          originalAmount: (amounts * 1.2).toFixed(2),
          overdueAmount: amounts.toFixed(2),
          paidAmount: (amounts * 0.2).toFixed(2),
          status: statuses[index],
          priority: priorities[index],
          agingDays,
          dueDate: dueDateStr,
          slaDeadline,
          timeRemaining: Math.floor((slaDeadline.getTime() - Date.now()) / (1000 * 60 * 60)),
          slaStatus: slaStatuses[index],
          stage: stages[index],
          isEscalated: statuses[index] === "escalated" || statuses[index] === "legal",
          isPaused: false,
          aiProbability: [78, 85, 42, 92, 35, 88, 65, 95, 72, 58][index],
          aiNextAction: [
            "Propose structured 15% settlement",
            "Schedule payment plan discussion",
            "Direct legal intervention recommended",
            "First contact follow-up",
            "Escalate to legal department",
            "Await customer response",
            "Negotiate partial payment",
            "Initial contact pending",
            "Review payment history",
            "Contact for status update",
          ][index],
          aiEstResolution: `${14 + index * 3} days`,
          lastContact: new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000),
          nextFollowUp: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000),
          contactAttempts: [5, 3, 8, 1, 10, 2, 4, 0, 3, 6][index],
          notes: [
            "Customer requested payment extension",
            "Payment plan discussion scheduled",
            "Legal action under review",
            "First contact made, responsive",
            "Sent to legal department",
            "Awaiting response from customer",
            "Partial payment received",
            "New case, initial contact pending",
            "Reviewing financials",
            "Multiple contact attempts made",
          ][index],
          tags: [["vip", "priority"], ["commercial"], ["legal", "dispute"], ["new"], ["legal"], ["pending"], ["partial"], ["new"], ["review"], ["follow-up"]][index],
        };
      });

      cases = await db.insert(schema.cases).values(caseData).returning();
      console.log(`✅ Created ${cases.length} cases\n`);

      // Create some activity logs
      console.log("📝 Creating sample activity logs...\n");

      const activityData = cases.slice(0, 5).flatMap((c, i) => [
        {
          userId: adminUser.id,
          userEmail: adminUser.email,
          userRole: adminUser.role,
          action: "case_assigned",
          entityType: "case",
          entityId: c.id,
          entityName: c.caseNumber,
          description: `Case ${c.caseNumber} assigned to ${dcaAgency.agencyName}`,
        },
        {
          userId: adminUser.id,
          userEmail: adminUser.email,
          userRole: adminUser.role,
          action: "status_updated",
          entityType: "case",
          entityId: c.id,
          entityName: c.caseNumber,
          description: `Case ${c.caseNumber} status updated to ${c.status}`,
        },
      ]);

      await db.insert(schema.activityLogs).values(activityData);
      console.log(`✅ Created ${activityData.length} activity logs\n`);
    }

    console.log("🎉 Sample data seed completed successfully!\n");
    console.log("Summary:");
    console.log("─────────────────────────────────────");
    console.log(`   Customers: ${customers.length}`);
    console.log(`   Cases: ${cases.length}`);
    console.log("─────────────────────────────────────\n");

  } catch (error) {
    console.error("❌ Seed error:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedData();
