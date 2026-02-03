"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

// ============================================
// TYPES
// ============================================
interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

interface Customer {
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
  riskLevel: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Case {
  id: string;
  caseNumber: string;
  customerId: string;
  dcaAgencyId: string | null;
  assignedBy: string | null;
  assignedAt: string | null;
  originalAmount: string;
  overdueAmount: string;
  paidAmount: string;
  status: string;
  priority: string;
  agingDays: number;
  dueDate: string | null;
  slaDeadline: string | null;
  slaStatus: string;
  stage: string;
  isEscalated: boolean;
  isPaused: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  dcaAgency?: DcaAgency;
}

interface DcaAgency {
  id: string;
  userId: string | null;
  agencyName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  status: string;
  specialization: string | null;
  performanceTarget: string;
  commissionRate: string;
  notes: string | null;
  joinedDate: string;
  createdAt: string;
  updatedAt: string;
}

interface DashboardData {
  overview: {
    totalCases: number;
    activeCases: number;
    resolvedCases: number;
    totalCustomers?: number;
    totalDcaAgencies?: number;
    totalOverdue?: number;
    totalRecovered?: number;
    assignedCases?: number;
  };
  casesByStatus: Record<string, number>;
  casesByPriority: Record<string, number>;
  recentActivity?: ActivityLog[];
}

interface ActivityLog {
  id: string;
  userId: string;
  userEmail: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string;
  description: string;
  createdAt: string;
}

// ============================================
// GENERIC FETCH HOOK
// ============================================
export function useApi<T>(url: string, options?: RequestInit): ApiResponse<T> & { refetch: () => Promise<void> } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(url, {
        credentials: "include",
        ...options,
      });

      const result = await response.json();

      if (response.ok) {
        setData(result);
      } else {
        setError(result.error || "Failed to fetch data");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("API Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [url, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, error, isLoading, refetch: fetchData };
}

// ============================================
// DASHBOARD HOOK
// ============================================
export function useDashboard() {
  const { data, error, isLoading, refetch } = useApi<{ success: boolean; dashboard: DashboardData }>("/api/dashboard");
  
  return {
    dashboard: data?.dashboard || null,
    error,
    isLoading,
    refetch,
  };
}

// ============================================
// CUSTOMERS HOOKS
// ============================================
export function useCustomers() {
  const { data, error, isLoading, refetch } = useApi<{ success: boolean; customers: Customer[] }>("/api/customers");
  
  return {
    customers: data?.customers || [],
    error,
    isLoading,
    refetch,
  };
}

export function useCustomer(id: string) {
  const { data, error, isLoading, refetch } = useApi<{ success: boolean; customer: Customer }>(`/api/customers/${id}`);
  
  return {
    customer: data?.customer || null,
    error,
    isLoading,
    refetch,
  };
}

export function useCreateCustomer() {
  const [isLoading, setIsLoading] = useState(false);

  const createCustomer = async (customerData: Partial<Customer>): Promise<{ success: boolean; customer?: Customer; error?: string }> => {
    try {
      setIsLoading(true);
      
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(customerData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Customer created successfully");
        return { success: true, customer: result.customer };
      } else {
        toast.error(result.error || "Failed to create customer");
        return { success: false, error: result.error };
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
      return { success: false, error: "Network error" };
    } finally {
      setIsLoading(false);
    }
  };

  return { createCustomer, isLoading };
}

export function useUpdateCustomer() {
  const [isLoading, setIsLoading] = useState(false);

  const updateCustomer = async (id: string, customerData: Partial<Customer>): Promise<{ success: boolean; customer?: Customer; error?: string }> => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(customerData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Customer updated successfully");
        return { success: true, customer: result.customer };
      } else {
        toast.error(result.error || "Failed to update customer");
        return { success: false, error: result.error };
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
      return { success: false, error: "Network error" };
    } finally {
      setIsLoading(false);
    }
  };

  return { updateCustomer, isLoading };
}

export function useDeleteCustomer() {
  const [isLoading, setIsLoading] = useState(false);

  const deleteCustomer = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/customers/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Customer deleted successfully");
        return { success: true };
      } else {
        toast.error(result.error || "Failed to delete customer");
        return { success: false, error: result.error };
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
      return { success: false, error: "Network error" };
    } finally {
      setIsLoading(false);
    }
  };

  return { deleteCustomer, isLoading };
}

// ============================================
// CASES HOOKS
// ============================================
export function useCases(filters?: { status?: string; priority?: string }) {
  const queryParams = new URLSearchParams();
  if (filters?.status) queryParams.set("status", filters.status);
  if (filters?.priority) queryParams.set("priority", filters.priority);
  
  const url = `/api/cases${queryParams.toString() ? `?${queryParams}` : ""}`;
  const { data, error, isLoading, refetch } = useApi<{ success: boolean; cases: Case[]; total: number }>(url);
  
  return {
    cases: data?.cases || [],
    total: data?.total || 0,
    error,
    isLoading,
    refetch,
  };
}

export function useCase(id: string) {
  const { data, error, isLoading, refetch } = useApi<{ success: boolean; case: Case }>(`/api/cases/${id}`);
  
  return {
    caseData: data?.case || null,
    error,
    isLoading,
    refetch,
  };
}

export function useCreateCase() {
  const [isLoading, setIsLoading] = useState(false);

  const createCase = async (caseData: Partial<Case>): Promise<{ success: boolean; case?: Case; error?: string }> => {
    try {
      setIsLoading(true);
      
      const response = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(caseData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Case created successfully");
        return { success: true, case: result.case };
      } else {
        toast.error(result.error || "Failed to create case");
        return { success: false, error: result.error };
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
      return { success: false, error: "Network error" };
    } finally {
      setIsLoading(false);
    }
  };

  return { createCase, isLoading };
}

export function useUpdateCase() {
  const [isLoading, setIsLoading] = useState(false);

  const updateCase = async (id: string, caseData: Partial<Case>): Promise<{ success: boolean; case?: Case; error?: string }> => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/cases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(caseData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Case updated successfully");
        return { success: true, case: result.case };
      } else {
        toast.error(result.error || "Failed to update case");
        return { success: false, error: result.error };
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
      return { success: false, error: "Network error" };
    } finally {
      setIsLoading(false);
    }
  };

  return { updateCase, isLoading };
}

// ============================================
// DCA AGENCIES HOOKS
// ============================================
export function useDcaAgencies() {
  const { data, error, isLoading, refetch } = useApi<{ success: boolean; agencies: DcaAgency[] }>("/api/dca-agencies");
  
  return {
    agencies: data?.agencies || [],
    error,
    isLoading,
    refetch,
  };
}

export function useDcaAgency(id: string) {
  const { data, error, isLoading, refetch } = useApi<{ success: boolean; agency: DcaAgency }>(`/api/dca-agencies/${id}`);
  
  return {
    agency: data?.agency || null,
    error,
    isLoading,
    refetch,
  };
}

// ============================================
// ACTIVITY LOGS HOOKS
// ============================================
export function useActivityLogs(filters?: { userId?: string; entityType?: string; limit?: number }) {
  const queryParams = new URLSearchParams();
  if (filters?.userId) queryParams.set("userId", filters.userId);
  if (filters?.entityType) queryParams.set("entityType", filters.entityType);
  if (filters?.limit) queryParams.set("limit", filters.limit.toString());
  
  const url = `/api/activity-logs${queryParams.toString() ? `?${queryParams}` : ""}`;
  const { data, error, isLoading, refetch } = useApi<{ success: boolean; logs: ActivityLog[] }>(url);
  
  return {
    logs: data?.logs || [],
    error,
    isLoading,
    refetch,
  };
}
