/**
 * App Data Context - Single Source of Truth for All Pages
 * 
 * This context provides:
 * - Centralized data fetching
 * - Automatic refresh on mutations
 * - Consistent loading/error states across all pages
 * - Cross-page data coherence
 */

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { AppData, Case, CreateCaseInput } from "@/lib/data/types";

// Update case input - allows partial updates
export interface UpdateCaseInput {
  status?: string;
  priority?: string;
  dcaAgencyId?: string | null;
  stage?: string;
  notes?: string;
  isEscalated?: boolean;
  paidAmount?: string;
}

interface AppDataContextType {
  // Data
  data: AppData | null;
  
  // Loading & Error states
  isLoading: boolean;
  error: string | null;
  
  // Actions
  refresh: () => Promise<void>;
  createCase: (input: CreateCaseInput) => Promise<{ success: boolean; case?: Case; error?: string }>;
  updateCase: (caseId: string, input: UpdateCaseInput) => Promise<{ success: boolean; case?: Case; error?: string }>;
  
  // Derived helpers
  getCaseById: (id: string) => Case | undefined;
  getCustomerById: (id: string) => AppData["customers"][0] | undefined;
  getDcaAgencyById: (id: string) => AppData["dcaAgencies"][0] | undefined;
}

const AppDataContext = createContext<AppDataContextType | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  
  // Skip fetching on login page
  const isLoginPage = pathname === "/login";

  const fetchData = useCallback(async () => {
    // Don't fetch on login page
    if (isLoginPage) {
      setIsLoading(false);
      return;
    }
    
    try {
      setError(null);
      const response = await fetch("/api/app-data", {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated - just set data to null, don't redirect
          // Let the DashboardLayout or individual pages handle the redirect
          setData(null);
          setIsLoading(false);
          return;
        }
        throw new Error("Failed to fetch data");
      }

      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || "Failed to fetch data");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [isLoginPage]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchData();
  }, [fetchData]);

  const createCase = useCallback(async (input: CreateCaseInput): Promise<{ success: boolean; case?: Case; error?: string }> => {
    try {
      const response = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(input),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Refresh all data to ensure cross-page consistency
        await refresh();
        return { success: true, case: result.case };
      } else {
        return { success: false, error: result.error || "Failed to create case" };
      }
    } catch (err) {
      return { success: false, error: "Network error" };
    }
  }, [refresh]);

  // Update existing case - triggers full refresh to update all KPIs
  const updateCase = useCallback(async (caseId: string, input: UpdateCaseInput): Promise<{ success: boolean; case?: Case; error?: string }> => {
    try {
      const response = await fetch(`/api/cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(input),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Refresh all data to ensure cross-page consistency (KPIs, dashboards, etc.)
        await refresh();
        return { success: true, case: result.case };
      } else {
        return { success: false, error: result.error || "Failed to update case" };
      }
    } catch (err) {
      return { success: false, error: "Network error" };
    }
  }, [refresh]);

  // Helper functions to get entities by ID
  const getCaseById = useCallback((id: string) => {
    return data?.cases.find(c => c.id === id);
  }, [data]);

  const getCustomerById = useCallback((id: string) => {
    return data?.customers.find(c => c.id === id);
  }, [data]);

  const getDcaAgencyById = useCallback((id: string) => {
    return data?.dcaAgencies.find(a => a.id === id);
  }, [data]);

  // Initial fetch
  useEffect(() => {
    if (!isLoginPage) {
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, [fetchData, isLoginPage]);

  // Auto-refresh every 30 seconds for real-time feel (only when not on login)
  useEffect(() => {
    if (isLoginPage) return;
    
    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchData, isLoginPage]);

  const value: AppDataContextType = {
    data,
    isLoading,
    error,
    refresh,
    createCase,
    updateCase,
    getCaseById,
    getCustomerById,
    getDcaAgencyById,
  };

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within AppDataProvider");
  }
  return context;
}

// Convenience hooks for specific data slices
export function useCases() {
  const { data, isLoading, error } = useAppData();
  return { 
    cases: data?.cases || [], 
    isLoading, 
    error,
    casesByStatus: data?.casesByStatus,
    casesByPriority: data?.casesByPriority,
  };
}

export function useCustomers() {
  const { data, isLoading, error } = useAppData();
  return { customers: data?.customers || [], isLoading, error };
}

export function useDcaAgencies() {
  const { data, isLoading, error } = useAppData();
  return { 
    agencies: data?.dcaAgencies || [], 
    performance: data?.dcaPerformance || [],
    isLoading, 
    error,
  };
}

export function useDashboardMetrics() {
  const { data, isLoading, error } = useAppData();
  return { 
    metrics: data?.dashboardMetrics, 
    sla: data?.slaMetrics,
    casesByStatus: data?.casesByStatus,
    casesByPriority: data?.casesByPriority,
    isLoading, 
    error,
  };
}

export function useSlaData() {
  const { data, isLoading, error } = useAppData();
  return {
    metrics: data?.slaMetrics,
    breachedCases: data?.slaBreachchedCases || [],
    atRiskCases: data?.atRiskCases || [],
    isLoading,
    error,
  };
}

export function useActivities() {
  const { data, isLoading, error } = useAppData();
  return { activities: data?.activities || [], isLoading, error };
}

export function useCriticalCases() {
  const { data, isLoading, error } = useAppData();
  return { 
    criticalCases: data?.criticalCases || [], 
    isLoading, 
    error,
  };
}

export function useCurrentUser() {
  const { data } = useAppData();
  return data?.user || null;
}
