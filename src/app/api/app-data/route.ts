/**
 * Unified API Endpoint - Single Source of Truth
 * Returns ALL data needed by all pages in one request
 * This ensures data coherence across the entire app
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { 
  cases, 
  customers, 
  dcaAgencies, 
  activityLogs,
  users,
  authSessions 
} from "@/lib/db/schema";
import { eq, desc, and, gt, sql, count } from "drizzle-orm";
import { cookies } from "next/headers";
import type { 
  AppData, 
  DashboardMetrics, 
  SlaMetrics, 
  CasesByStatus, 
  CasesByPriority,
  DcaPerformanceData,
  Case,
  Customer,
  DcaAgency,
  Activity
} from "@/lib/data/types";

// Retry helper for database queries with connection timeout
async function withRetry<T>(fn: () => Promise<T>, retries = 2, delay = 500): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const isTimeout = error instanceof Error && 
        (error.message.includes('CONNECT_TIMEOUT') || 
         (error.cause as Error | undefined)?.message?.includes?.('CONNECT_TIMEOUT'));
      
      if (isTimeout && i < retries) {
        console.log(`Database timeout, retrying... (attempt ${i + 2}/${retries + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        continue;
      }
      throw error;
    }
  }
  throw new Error('All retries failed');
}

// Get current user from session
async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    
    if (!token) return null;
    
    const session = await db.query.authSessions.findFirst({
      where: and(
        eq(authSessions.token, token),
        gt(authSessions.expiresAt, new Date())
      ),
    });
    
    if (!session) return null;
    
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.userId),
    });
    
    if (!user || !user.isActive) return null;
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "admin" | "dca",
    };
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch all core entities in parallel with retry for transient errors
    const [
      allCases,
      allCustomers,
      allDcaAgencies,
      recentActivities,
    ] = await withRetry(() => Promise.all([
      db.query.cases.findMany({
        orderBy: [desc(cases.updatedAt)],
        with: {
          customer: true,
          dcaAgency: true,
        },
      }),
      db.query.customers.findMany({
        orderBy: [desc(customers.createdAt)],
      }),
      db.query.dcaAgencies.findMany({
        orderBy: [desc(dcaAgencies.createdAt)],
      }),
      db.query.activityLogs.findMany({
        orderBy: [desc(activityLogs.createdAt)],
        limit: 50,
      }),
    ]));

    // Filter cases based on user role
    const filteredCases = user.role === "admin" 
      ? allCases 
      : allCases.filter(c => {
          // DCA users see only their assigned cases
          const agency = allDcaAgencies.find(a => a.userId === user.id);
          return agency && c.dcaAgencyId === agency.id;
        });

    // Transform to API types
    const casesData: Case[] = filteredCases.map(c => ({
      id: c.id,
      caseNumber: c.caseNumber,
      customerId: c.customerId,
      dcaAgencyId: c.dcaAgencyId,
      assignedBy: c.assignedBy,
      assignedAt: c.assignedAt?.toISOString() || null,
      originalAmount: c.originalAmount,
      overdueAmount: c.overdueAmount,
      paidAmount: c.paidAmount || "0",
      status: c.status as Case["status"],
      priority: c.priority as Case["priority"],
      agingDays: c.agingDays || 0,
      dueDate: c.dueDate || null,
      slaDeadline: c.slaDeadline?.toISOString() || null,
      timeRemaining: c.timeRemaining || null,
      slaStatus: c.slaStatus as Case["slaStatus"],
      stage: c.stage as Case["stage"],
      isEscalated: c.isEscalated || false,
      isPaused: c.isPaused || false,
      pauseReason: c.pauseReason || null,
      aiProbability: c.aiProbability || null,
      aiNextAction: c.aiNextAction || null,
      aiEstResolution: c.aiEstResolution || null,
      lastContact: c.lastContact?.toISOString() || null,
      nextFollowUp: c.nextFollowUp?.toISOString() || null,
      contactAttempts: c.contactAttempts || 0,
      notes: c.notes || null,
      tags: (c.tags as string[]) || [],
      createdAt: c.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: c.updatedAt?.toISOString() || new Date().toISOString(),
      customer: c.customer ? {
        id: c.customer.id,
        name: c.customer.name,
        email: c.customer.email,
        phone: c.customer.phone,
        alternatePhone: c.customer.alternatePhone,
        address: c.customer.address,
        city: c.customer.city,
        state: c.customer.state,
        pincode: c.customer.pincode,
        creditScore: c.customer.creditScore,
        riskLevel: c.customer.riskLevel as Customer["riskLevel"],
        notes: c.customer.notes,
        createdAt: c.customer.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: c.customer.updatedAt?.toISOString() || new Date().toISOString(),
      } : undefined,
      dcaAgency: c.dcaAgency ? {
        id: c.dcaAgency.id,
        userId: c.dcaAgency.userId,
        agencyName: c.dcaAgency.agencyName,
        contactEmail: c.dcaAgency.contactEmail,
        contactPhone: c.dcaAgency.contactPhone,
        status: c.dcaAgency.status as DcaAgency["status"],
        specialization: c.dcaAgency.specialization,
        performanceTarget: c.dcaAgency.performanceTarget || "75.00",
        commissionRate: c.dcaAgency.commissionRate || "10.00",
        notes: c.dcaAgency.notes,
        joinedDate: c.dcaAgency.joinedDate || new Date().toISOString().split("T")[0],
        createdAt: c.dcaAgency.createdAt?.toISOString() || new Date().toISOString(),
      } : undefined,
    }));

    const customersData: Customer[] = allCustomers.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      alternatePhone: c.alternatePhone,
      address: c.address,
      city: c.city,
      state: c.state,
      pincode: c.pincode,
      creditScore: c.creditScore,
      riskLevel: c.riskLevel as Customer["riskLevel"],
      notes: c.notes,
      createdAt: c.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: c.updatedAt?.toISOString() || new Date().toISOString(),
    }));

    const dcaAgenciesData: DcaAgency[] = allDcaAgencies.map(a => ({
      id: a.id,
      userId: a.userId,
      agencyName: a.agencyName,
      contactEmail: a.contactEmail,
      contactPhone: a.contactPhone,
      status: a.status as DcaAgency["status"],
      specialization: a.specialization,
      performanceTarget: a.performanceTarget || "75.00",
      commissionRate: a.commissionRate || "10.00",
      notes: a.notes,
      joinedDate: a.joinedDate || new Date().toISOString().split("T")[0],
      createdAt: a.createdAt?.toISOString() || new Date().toISOString(),
    }));

    const activitiesData: Activity[] = recentActivities.map(a => ({
      id: a.id,
      userId: a.userId,
      userEmail: a.userEmail,
      userRole: a.userRole,
      action: a.action,
      entityType: a.entityType,
      entityId: a.entityId,
      entityName: a.entityName,
      description: a.description,
      oldValues: a.oldValues as Record<string, unknown> | null,
      newValues: a.newValues as Record<string, unknown> | null,
      createdAt: a.createdAt?.toISOString() || new Date().toISOString(),
    }));

    // Compute dashboard metrics
    const totalOverdue = casesData.reduce((sum, c) => sum + parseFloat(c.overdueAmount || "0"), 0);
    const totalRecovered = casesData.reduce((sum, c) => sum + parseFloat(c.paidAmount || "0"), 0);
    const resolvedCases = casesData.filter(c => c.status === "resolved" || c.status === "closed");
    const activeCases = casesData.filter(c => !["resolved", "closed", "written-off"].includes(c.status));
    
    const dashboardMetrics: DashboardMetrics = {
      totalCases: casesData.length,
      activeCases: activeCases.length,
      resolvedCases: resolvedCases.length,
      unassignedCases: casesData.filter(c => c.status === "unassigned").length,
      totalOverdue,
      totalRecovered,
      recoveryRate: totalOverdue > 0 ? (totalRecovered / totalOverdue) * 100 : 0,
      avgAgingDays: casesData.length > 0 
        ? Math.round(casesData.reduce((sum, c) => sum + c.agingDays, 0) / casesData.length)
        : 0,
    };

    // Compute SLA metrics
    const slaMetrics: SlaMetrics = {
      onTrack: casesData.filter(c => c.slaStatus === "on-track").length,
      atRisk: casesData.filter(c => c.slaStatus === "at-risk").length,
      breached: casesData.filter(c => c.slaStatus === "breached").length,
      totalAlerts: casesData.filter(c => c.slaStatus !== "on-track").length,
      breachRate: casesData.length > 0 
        ? (casesData.filter(c => c.slaStatus === "breached").length / casesData.length) * 100 
        : 0,
    };

    // Cases by status
    const casesByStatus: CasesByStatus = {
      unassigned: casesData.filter(c => c.status === "unassigned").length,
      active: casesData.filter(c => c.status === "active").length,
      negotiating: casesData.filter(c => c.status === "negotiating").length,
      "payment-plan": casesData.filter(c => c.status === "payment-plan").length,
      legal: casesData.filter(c => c.status === "legal").length,
      resolved: casesData.filter(c => c.status === "resolved").length,
      closed: casesData.filter(c => c.status === "closed").length,
      "written-off": casesData.filter(c => c.status === "written-off").length,
    };

    // Cases by priority
    const casesByPriority: CasesByPriority = {
      low: casesData.filter(c => c.priority === "low").length,
      medium: casesData.filter(c => c.priority === "medium").length,
      high: casesData.filter(c => c.priority === "high").length,
      critical: casesData.filter(c => c.priority === "critical").length,
    };

    // DCA Performance data
    const dcaPerformance: DcaPerformanceData[] = dcaAgenciesData.map((agency, index) => {
      const agencyCases = casesData.filter(c => c.dcaAgencyId === agency.id);
      const agencyResolved = agencyCases.filter(c => c.status === "resolved" || c.status === "closed");
      const agencyActive = agencyCases.filter(c => !["resolved", "closed", "written-off"].includes(c.status));
      const agencyRecovered = agencyCases.reduce((sum, c) => sum + parseFloat(c.paidAmount || "0"), 0);
      const slaCompliant = agencyCases.filter(c => c.slaStatus === "on-track").length;
      
      return {
        agency,
        totalCases: agencyCases.length,
        activeCases: agencyActive.length,
        resolvedCases: agencyResolved.length,
        recoveryRate: agencyCases.length > 0 
          ? (agencyResolved.length / agencyCases.length) * 100 
          : 0,
        avgResolutionDays: agencyResolved.length > 0
          ? Math.round(agencyResolved.reduce((sum, c) => sum + c.agingDays, 0) / agencyResolved.length)
          : 0,
        slaCompliance: agencyCases.length > 0
          ? (slaCompliant / agencyCases.length) * 100
          : 100,
        totalRecovered: agencyRecovered,
        rank: index + 1,
        trend: "stable" as const,
      };
    }).sort((a, b) => b.recoveryRate - a.recoveryRate)
      .map((p, i) => ({ ...p, rank: i + 1 }));

    // Filtered views
    const criticalCases = casesData.filter(c => c.priority === "critical" || c.slaStatus === "breached");
    const slaBreachedCases = casesData.filter(c => c.slaStatus === "breached");
    const atRiskCases = casesData.filter(c => c.slaStatus === "at-risk");
    const recentlyUpdatedCases = [...casesData]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10);
    const recentActivityList = [...activitiesData]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20);

    const appData: AppData = {
      cases: casesData,
      customers: customersData,
      dcaAgencies: dcaAgenciesData,
      activities: activitiesData,
      dashboardMetrics,
      slaMetrics,
      casesByStatus,
      casesByPriority,
      dcaPerformance,
      criticalCases,
      slaBreachchedCases: slaBreachedCases,
      atRiskCases,
      recentlyUpdatedCases,
      recentActivities: recentActivityList,
      user,
    };

    return NextResponse.json({ success: true, data: appData });
  } catch (error) {
    console.error("App data fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch app data" },
      { status: 500 }
    );
  }
}
