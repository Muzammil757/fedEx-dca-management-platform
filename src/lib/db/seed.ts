/**
 * Database Seed Script
 * Run with: npm run db:seed
 * 
 * This script creates the initial Admin and DCA users.
 */

// Load environment variables FIRST before any other imports
import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Starting database seed...\n");

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ DATABASE_URL not found in environment!");
    process.exit(1);
  }

  console.log("🔗 Connecting to database...");
  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client, { schema });

  try {
    // Check if users already exist
    const existingUsers = await db.query.users.findMany();
    
    if (existingUsers.length > 0) {
      console.log("⚠️  Users already exist. Skipping seed.");
      console.log("   Existing users:", existingUsers.map(u => u.email).join(", "));
      process.exit(0);
    }

    // Create Admin user
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";
    const adminPasswordHash = await bcrypt.hash(adminPassword, 12);

    const [adminUser] = await db
      .insert(schema.users)
      .values({
        email: (process.env.ADMIN_EMAIL || "admin@company.com").toLowerCase(),
        passwordHash: adminPasswordHash,
        name: process.env.ADMIN_NAME || "Admin User",
        role: "admin",
        phone: null,
      })
      .returning();

    console.log("✅ Admin user created:");
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Role: ${adminUser.role}\n`);

    // Create DCA user
    const dcaPassword = process.env.DCA_PASSWORD || "Dca@123";
    const dcaPasswordHash = await bcrypt.hash(dcaPassword, 12);

    const [dcaUser] = await db
      .insert(schema.users)
      .values({
        email: (process.env.DCA_EMAIL || "dca@partner.com").toLowerCase(),
        passwordHash: dcaPasswordHash,
        name: process.env.DCA_NAME || "DCA Agent",
        role: "dca",
        phone: null,
      })
      .returning();

    console.log("✅ DCA user created:");
    console.log(`   Email: ${dcaUser.email}`);
    console.log(`   Password: ${dcaPassword}`);
    console.log(`   Role: ${dcaUser.role}\n`);

    // Create DCA Agency profile linked to DCA user
    const [dcaAgency] = await db
      .insert(schema.dcaAgencies)
      .values({
        userId: dcaUser.id,
        agencyName: process.env.DCA_AGENCY_NAME || "Partner Collection Agency",
        contactEmail: dcaUser.email,
        status: "active",
        specialization: "both",
        performanceTarget: "75.00",
        commissionRate: "10.00",
      })
      .returning();

    console.log("✅ DCA Agency created:");
    console.log(`   Name: ${dcaAgency.agencyName}`);
    console.log(`   Linked to: ${dcaUser.email}\n`);

    console.log("🎉 Seed completed successfully!\n");
    console.log("You can now login with:");
    console.log("─────────────────────────────────────");
    console.log("ADMIN:");
    console.log(`  Email: ${adminUser.email}`);
    console.log(`  Password: ${adminPassword}`);
    console.log("");
    console.log("DCA:");
    console.log(`  Email: ${dcaUser.email}`);
    console.log(`  Password: ${dcaPassword}`);
    console.log("─────────────────────────────────────\n");

    await client.end();
  } catch (error) {
    console.error("❌ Seed failed:", error);
    await client.end();
    process.exit(1);
  }

  process.exit(0);
}

seed();
