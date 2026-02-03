/**
 * Core Data Types - Single Source of Truth
 * All pages consume these types for consistency
 */

// ============================================
// CORE ENTITIES
// ============================================

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  alternatePhone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  creditScore: number | null;
  riskLevel: "low" | "medium" | "high" | "critical" | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DcaAgency {
  id: string;
  userId: string | null;
  agencyName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  status: "active" | "inactive" | "suspended";
  specialization: string | null;
  performanceTarget: string;
  commissionRate: string;
  notes: string | null;
  joinedDate: string;
  createdAt: string;
}

export interface Case {
  id: string;
  caseNumber: string;
  customerId: string;
  dcaAgencyId: string | null;
  assignedBy: string | null;
  assignedAt: string | null;
  originalAmount: string;
  overdueAmount: string;
  paidAmount: string;
  status: CaseStatus;
  priority: CasePriority;
  agingDays: number;
  dueDate: string | null;
  slaDeadline: string | null;
  timeRemaining: number | null;
  slaStatus: SlaStatus;
  stage: CaseStage;
  isEscalated: boolean;
  isPaused: boolean;
  pauseReason: string | null;
  aiProbability: number | null;
  aiNextAction: string | null;
  aiEstResolution: string | null;
  lastContact: string | null;
  nextFollowUp: string | null;
  contactAttempts: number;
  notes: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  // Joined data
  customer?: Customer;
  dcaAgency?: DcaAgency;
}

export interface Activity {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userRole: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  entityName: string | null;
  description: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  createdAt: string;
}

export interface CaseNote {
  id: string;
  caseId: string;
  authorId: string;
  content: string;
  noteType: "general" | "call" | "email" | "payment" | "escalation";
  isPrivate: boolean;
  createdAt: string;
  author?: {
    name: string;
    email: string;
    role: string;
  };
}

// ============================================
// ENUMS
// ============================================

export type CaseStatus = 
  | "unassigned" 
  | "active" 
  | "negotiating" 
  | "payment-plan" 
  | "legal" 
  | "resolved" 
  | "closed" 
  | "written-off";

export type CasePriority = "low" | "medium" | "high" | "critical";

export type SlaStatus = "on-track" | "at-risk" | "breached";

export type CaseStage = 
  | "initial-contact" 
  | "follow-up" 
  | "negotiation" 
  | "payment-arrangement" 
  | "legal-review" 
  | "resolution";

// ============================================
// COMPUTED / AGGREGATED DATA
// ============================================

export interface DashboardMetrics {
  totalCases: number;
  activeCases: number;
  resolvedCases: number;
  unassignedCases: number;
  totalOverdue: number;
  totalRecovered: number;
  recoveryRate: number;
  avgAgingDays: number;
}

export interface SlaMetrics {
  onTrack: number;
  atRisk: number;
  breached: number;
  totalAlerts: number;
  breachRate: number;
}

export interface DcaPerformanceData {
  agency: DcaAgency;
  totalCases: number;
  activeCases: number;
  resolvedCases: number;
  recoveryRate: number;
  avgResolutionDays: number;
  slaCompliance: number;
  totalRecovered: number;
  rank: number;
  trend: "up" | "down" | "stable";
}

export interface CasesByStatus {
  unassigned: number;
  active: number;
  negotiating: number;
  "payment-plan": number;
  legal: number;
  resolved: number;
  closed: number;
  "written-off": number;
}

export interface CasesByPriority {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

// ============================================
// UNIFIED APP DATA
// ============================================

export interface AppData {
  // Core entities
  cases: Case[];
  customers: Customer[];
  dcaAgencies: DcaAgency[];
  activities: Activity[];
  
  // Computed metrics
  dashboardMetrics: DashboardMetrics;
  slaMetrics: SlaMetrics;
  casesByStatus: CasesByStatus;
  casesByPriority: CasesByPriority;
  dcaPerformance: DcaPerformanceData[];
  
  // Filtered views (derived from cases)
  criticalCases: Case[];
  slaBreachchedCases: Case[];
  atRiskCases: Case[];
  recentlyUpdatedCases: Case[];
  recentActivities: Activity[];
  
  // User info
  user: {
    id: string;
    email: string;
    name: string;
    role: "admin" | "dca";
  } | null;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CreateCaseInput {
  customerId: string;
  originalAmount: number;
  overdueAmount: number;
  priority?: CasePriority;
  dcaAgencyId?: string;
  dueDate?: string;
  notes?: string;
}
