"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Filter,
  Search,
  Phone,
  Mail,
  MessageSquare,
  MoreVertical,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Bell,
  BellOff,
  Scale,
  Calendar,
  FileText,
  Send,
  Eye,
  Pause,
  Play,
  ArrowUpCircle,
  History,
  Users,
  Target,
  Zap,
  Shield,
  X,
  Check,
  AlertCircle,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { useAppData } from "@/lib/data/app-data-context";

// Helper to map backend stage to UI stage
const mapStage = (stage: string): SLACase["stage"] => {
  const stageMap: Record<string, SLACase["stage"]> = {
    INITIAL_CONTACT: "initial-contact",
    NEGOTIATION: "negotiation",
    PAYMENT_PLAN: "payment-plan",
    LEGAL_REVIEW: "legal-review",
    ESCALATED: "escalated",
  };
  return stageMap[stage] || "initial-contact";
};

// Types
interface SLACase {
  id: string;
  caseNumber: string;
  debtorName: string;
  debtorPhone: string;
  debtorEmail: string;
  amount: number;
  dueDate: string;
  slaDeadline: string;
  timeRemaining: number; // in hours
  status: "on-track" | "at-risk" | "breached" | "resolved";
  priority: "critical" | "high" | "medium" | "low";
  stage: "initial-contact" | "negotiation" | "payment-plan" | "legal-review" | "escalated";
  assignedTo: string;
  lastContact: string;
  attempts: number;
  notes: string;
  dcaName: string;
  isEscalated: boolean;
  isPaused: boolean;
  extendedDeadline?: string;
}

interface WorkflowStage {
  id: string;
  name: string;
  count: number;
  avgTime: string;
  status: "healthy" | "warning" | "critical";
}

interface SLAAlert {
  id: string;
  type: "breach" | "warning" | "info";
  message: string;
  caseId: string;
  timestamp: string;
  isRead: boolean;
}

interface ActivityLog {
  id: string;
  action: string;
  caseId: string;
  user: string;
  timestamp: string;
}

// Initial empty state - populated from backend
const initialCases: SLACase[] = [];

// Empty initial - computed from backend data
const initialWorkflowStages: WorkflowStage[] = [];

const initialAlerts: SLAAlert[] = [];

// Loading Skeleton Component
function LoadingSkeleton() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>

        <div className="flex gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 w-48" />
          ))}
        </div>

        <Skeleton className="h-12 w-full" />

        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

// Empty State Component
function EmptyState({ message, onRefresh }: { message: string; onRefresh: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No Cases Found</h3>
      <p className="text-muted-foreground mb-4 max-w-md">{message}</p>
      <Button onClick={onRefresh} variant="outline">
        <RefreshCw className="h-4 w-4 mr-2" />
        Refresh Data
      </Button>
    </div>
  );
}

export default function SLAMonitoringPage() {
  // Get URL search params for pre-filtering
  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter");
  
  // Backend data integration
  const { data, isLoading: isDataLoading, refresh: refreshData } = useAppData();
  
  // Loading State
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Data State
  const [cases, setCases] = useState<SLACase[]>(initialCases);
  const [alerts, setAlerts] = useState<SLAAlert[]>(initialAlerts);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);

  // Compute workflow stages from cases
  const workflowStages = useMemo<WorkflowStage[]>(() => {
    if (cases.length === 0) return initialWorkflowStages;
    
    const stageMap: Record<string, { count: number; totalDays: number }> = {
      "initial-contact": { count: 0, totalDays: 0 },
      "negotiation": { count: 0, totalDays: 0 },
      "payment-plan": { count: 0, totalDays: 0 },
      "legal-review": { count: 0, totalDays: 0 },
      "escalated": { count: 0, totalDays: 0 },
    };
    
    cases.forEach(c => {
      if (stageMap[c.stage]) {
        stageMap[c.stage].count++;
        // Estimate days in stage based on attempts
        stageMap[c.stage].totalDays += Math.max(1, c.attempts * 1.5);
      }
    });
    
    const stageNames: Record<string, string> = {
      "initial-contact": "Initial Contact",
      "negotiation": "Negotiation",
      "payment-plan": "Payment Plan",
      "legal-review": "Legal Review",
      "escalated": "Escalated",
    };
    
    return Object.entries(stageMap).map(([stage, data], idx) => {
      const avgDays = data.count > 0 ? (data.totalDays / data.count).toFixed(1) : "0";
      const status: WorkflowStage["status"] = 
        parseFloat(avgDays) > 7 ? "critical" : 
        parseFloat(avgDays) > 4 ? "warning" : "healthy";
      return {
        id: (idx + 1).toString(),
        name: stageNames[stage],
        count: data.count,
        avgTime: `${avgDays} days`,
        status,
      };
    });
  }, [cases]);

  // Compute alerts from cases
  useEffect(() => {
    if (cases.length > 0) {
      const now = new Date();
      const computedAlerts: SLAAlert[] = [];
      
      cases.forEach(c => {
        if (c.status === "breached") {
          computedAlerts.push({
            id: `breach-${c.id}`,
            type: "breach",
            message: `${c.caseNumber} has breached the SLA deadline`,
            caseId: c.id,
            timestamp: now.toISOString(),
            isRead: false,
          });
        } else if (c.status === "at-risk") {
          computedAlerts.push({
            id: `warning-${c.id}`,
            type: "warning",
            message: `${c.caseNumber} is at risk - ${Math.abs(c.timeRemaining)} hours remaining`,
            caseId: c.id,
            timestamp: now.toISOString(),
            isRead: false,
          });
        }
      });
      
      // Add resolved cases as info
      cases.filter(c => c.status === "resolved").slice(0, 2).forEach(c => {
        computedAlerts.push({
          id: `resolved-${c.id}`,
          type: "info",
          message: `${c.caseNumber} has been resolved successfully`,
          caseId: c.id,
          timestamp: now.toISOString(),
          isRead: true,
        });
      });
      
      setAlerts(computedAlerts);
    }
  }, [cases]);

  // Transform backend data when available
  useEffect(() => {
    if (data?.cases && data.cases.length > 0) {
      const transformedCases: SLACase[] = data.cases.map(c => {
        const dueDate = new Date(c.dueDate || c.createdAt);
        const slaDeadline = new Date(c.slaDeadline || dueDate.getTime() + 14 * 24 * 60 * 60 * 1000);
        const now = new Date();
        const timeRemaining = Math.round((slaDeadline.getTime() - now.getTime()) / (1000 * 60 * 60)); // hours
        
        return {
          id: c.id.toString(),
          caseNumber: c.caseNumber,
          debtorName: c.customer?.name || "Unknown",
          debtorPhone: c.customer?.phone || "",
          debtorEmail: c.customer?.email || "",
          amount: parseFloat(c.overdueAmount),
          dueDate: dueDate.toISOString().split("T")[0],
          slaDeadline: slaDeadline.toISOString().split("T")[0],
          timeRemaining,
          status: (c.slaStatus?.toLowerCase().replace("_", "-") || "on-track") as SLACase["status"],
          priority: c.priority.toLowerCase() as SLACase["priority"],
          stage: mapStage(c.stage || "INITIAL_CONTACT"),
          assignedTo: c.dcaAgency?.contactPhone ? `Agent (${c.dcaAgency.contactPhone})` : "Unassigned",
          lastContact: c.lastContact ? new Date(c.lastContact).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
          attempts: c.contactAttempts || 0,
          notes: c.notes || "",
          dcaName: c.dcaAgency?.agencyName || "Unassigned",
          isEscalated: c.isEscalated,
          isPaused: c.isPaused,
        };
      });
      setCases(transformedCases);
    }
  }, [data?.cases]);

  // Compute SLA metrics from data
  const slaMetrics = useMemo(() => {
    if (data?.slaMetrics) return data.slaMetrics;
    return {
      onTrack: cases.filter(c => c.status === "on-track").length,
      atRisk: cases.filter(c => c.status === "at-risk").length,
      breached: cases.filter(c => c.status === "breached").length,
      resolved: cases.filter(c => c.status === "resolved").length,
      complianceRate: 0,
      avgResolutionTime: 0,
    };
  }, [data?.slaMetrics, cases]);

  // Filter State - initialize from URL params if present
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(filterParam || "all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [dcaFilter, setDcaFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");

  // Update filter when URL param changes
  useEffect(() => {
    if (filterParam) {
      setStatusFilter(filterParam);
    }
  }, [filterParam]);

  // Sort State
  const [sortField, setSortField] = useState<keyof SLACase>("timeRemaining");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Selection State
  const [selectedCases, setSelectedCases] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Dialog State
  const [selectedCase, setSelectedCase] = useState<SLACase | null>(null);
  const [showCaseDetails, setShowCaseDetails] = useState(false);
  const [showEscalateDialog, setShowEscalateDialog] = useState(false);
  const [showLegalDialog, setShowLegalDialog] = useState(false);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [showBulkActionDialog, setShowBulkActionDialog] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHistorySheet, setShowHistorySheet] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Form State
  const [escalationReason, setEscalationReason] = useState("");
  const [legalNotes, setLegalNotes] = useState("");
  const [extensionDays, setExtensionDays] = useState("7");
  const [extensionReason, setExtensionReason] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");
  const [reminderType, setReminderType] = useState<"email" | "sms" | "both">("email");
  const [bulkAction, setBulkAction] = useState("");
  const [exportFormat, setExportFormat] = useState<"csv" | "xlsx" | "pdf">("csv");

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      handleRefresh();
    }, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Add activity log entry
  const addActivity = useCallback((action: string, caseId: string) => {
    const newActivity: ActivityLog = {
      id: Date.now().toString(),
      action,
      caseId,
      user: "Current User",
      timestamp: new Date().toISOString(),
    };
    setActivityLog((prev) => [newActivity, ...prev].slice(0, 100));
  }, []);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    refreshData(); // Refresh backend data
    setTimeout(() => {
      setLastRefresh(new Date());
      setIsRefreshing(false);
      toast.success("Data refreshed successfully");
    }, 1000);
  }, [refreshData]);

  // Sort handler
  const handleSort = (field: keyof SLACase) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter cases
  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      searchQuery === "" ||
      c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.debtorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.assignedTo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || c.priority === priorityFilter;
    const matchesStage = stageFilter === "all" || c.stage === stageFilter;
    const matchesDca = dcaFilter === "all" || c.dcaName === dcaFilter;
    const matchesAssignee = assigneeFilter === "all" || c.assignedTo === assigneeFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesStage && matchesDca && matchesAssignee;
  });

  // Sort cases
  const sortedCases = [...filteredCases].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    const modifier = sortDirection === "asc" ? 1 : -1;

    if (typeof aVal === "number" && typeof bVal === "number") {
      return (aVal - bVal) * modifier;
    }
    if (typeof aVal === "string" && typeof bVal === "string") {
      return aVal.localeCompare(bVal) * modifier;
    }
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedCases.length / itemsPerPage);
  const paginatedCases = sortedCases.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Selection handlers
  const handleSelectCase = (caseId: string) => {
    setSelectedCases((prev) =>
      prev.includes(caseId) ? prev.filter((id) => id !== caseId) : [...prev, caseId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedCases([]);
    } else {
      setSelectedCases(paginatedCases.map((c) => c.id));
    }
    setSelectAll(!selectAll);
  };

  // Action handlers
  const handleEscalate = () => {
    if (!selectedCase) return;
    setCases((prev) =>
      prev.map((c) =>
        c.id === selectedCase.id
          ? { ...c, isEscalated: true, stage: "escalated" as const, notes: c.notes + `\nEscalated: ${escalationReason}` }
          : c
      )
    );
    addActivity(`Escalated case: ${escalationReason}`, selectedCase.id);
    toast.success(`Case ${selectedCase.caseNumber} has been escalated`);
    setShowEscalateDialog(false);
    setEscalationReason("");
    setSelectedCase(null);
  };

  const handleLegalAction = () => {
    if (!selectedCase) return;
    setCases((prev) =>
      prev.map((c) =>
        c.id === selectedCase.id
          ? { ...c, stage: "legal-review" as const, notes: c.notes + `\nLegal action initiated: ${legalNotes}` }
          : c
      )
    );
    addActivity(`Legal action initiated: ${legalNotes}`, selectedCase.id);
    toast.success(`Legal action initiated for ${selectedCase.caseNumber}`);
    setShowLegalDialog(false);
    setLegalNotes("");
    setSelectedCase(null);
  };

  const handleExtendSla = () => {
    if (!selectedCase) return;
    const newDeadline = new Date();
    newDeadline.setDate(newDeadline.getDate() + parseInt(extensionDays));
    
    setCases((prev) =>
      prev.map((c) =>
        c.id === selectedCase.id
          ? { 
              ...c, 
              extendedDeadline: newDeadline.toISOString().split("T")[0],
              timeRemaining: parseInt(extensionDays) * 24,
              status: "on-track" as const,
              notes: c.notes + `\nSLA Extended by ${extensionDays} days: ${extensionReason}` 
            }
          : c
      )
    );
    addActivity(`SLA extended by ${extensionDays} days: ${extensionReason}`, selectedCase.id);
    toast.success(`SLA extended for ${selectedCase.caseNumber}`);
    setShowExtendDialog(false);
    setExtensionDays("7");
    setExtensionReason("");
    setSelectedCase(null);
  };

  const handleResolve = () => {
    if (!selectedCase) return;
    setCases((prev) =>
      prev.map((c) =>
        c.id === selectedCase.id
          ? { ...c, status: "resolved" as const, notes: c.notes + `\nResolved: ${resolutionNotes}` }
          : c
      )
    );
    addActivity(`Case resolved: ${resolutionNotes}`, selectedCase.id);
    toast.success(`Case ${selectedCase.caseNumber} marked as resolved`);
    setShowResolveDialog(false);
    setResolutionNotes("");
    setSelectedCase(null);
  };

  const handleSendReminder = () => {
    if (!selectedCase) return;
    const channel = reminderType === "both" ? "Email and SMS" : reminderType.toUpperCase();
    setCases((prev) =>
      prev.map((c) =>
        c.id === selectedCase.id
          ? { ...c, attempts: c.attempts + 1, lastContact: new Date().toISOString().split("T")[0] }
          : c
      )
    );
    addActivity(`Reminder sent via ${channel}: ${reminderMessage}`, selectedCase.id);
    toast.success(`Reminder sent to ${selectedCase.debtorName} via ${channel}`);
    setShowReminderDialog(false);
    setReminderMessage("");
    setReminderType("email");
    setSelectedCase(null);
  };

  const handlePauseResume = (caseItem: SLACase) => {
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseItem.id ? { ...c, isPaused: !c.isPaused } : c
      )
    );
    const action = caseItem.isPaused ? "resumed" : "paused";
    addActivity(`SLA ${action}`, caseItem.id);
    toast.success(`SLA ${action} for ${caseItem.caseNumber}`);
  };

  const handleBulkAction = () => {
    if (selectedCases.length === 0 || !bulkAction) return;

    switch (bulkAction) {
      case "escalate":
        setCases((prev) =>
          prev.map((c) =>
            selectedCases.includes(c.id)
              ? { ...c, isEscalated: true, stage: "escalated" as const }
              : c
          )
        );
        toast.success(`${selectedCases.length} cases escalated`);
        break;
      case "extend":
        setCases((prev) =>
          prev.map((c) =>
            selectedCases.includes(c.id)
              ? { ...c, timeRemaining: c.timeRemaining + 48, status: "on-track" as const }
              : c
          )
        );
        toast.success(`SLA extended for ${selectedCases.length} cases`);
        break;
      case "pause":
        setCases((prev) =>
          prev.map((c) =>
            selectedCases.includes(c.id) ? { ...c, isPaused: true } : c
          )
        );
        toast.success(`${selectedCases.length} cases paused`);
        break;
      case "assign":
        toast.success(`${selectedCases.length} cases reassigned`);
        break;
    }

    selectedCases.forEach((id) => addActivity(`Bulk action: ${bulkAction}`, id));
    setShowBulkActionDialog(false);
    setBulkAction("");
    setSelectedCases([]);
    setSelectAll(false);
  };

  const handleExportCSV = () => {
    const dataToExport = selectedCases.length > 0 
      ? cases.filter((c) => selectedCases.includes(c.id))
      : filteredCases;

    const headers = ["Case Number", "Debtor Name", "Amount", "Status", "Priority", "Stage", "Time Remaining", "Assigned To", "DCA"];
    const csvContent = [
      headers.join(","),
      ...dataToExport.map((c) =>
        [c.caseNumber, c.debtorName, c.amount, c.status, c.priority, c.stage, `${c.timeRemaining}h`, c.assignedTo, c.dcaName].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sla-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    addActivity(`Exported ${dataToExport.length} cases to ${exportFormat.toUpperCase()}`, "system");
    toast.success(`Exported ${dataToExport.length} cases to ${exportFormat.toUpperCase()}`);
    setShowExportDialog(false);
  };

  const handleMarkAlertRead = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, isRead: true } : a))
    );
  };

  const handleDismissAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    toast.success("Alert dismissed");
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setStageFilter("all");
    setDcaFilter("all");
    setAssigneeFilter("all");
    setCurrentPage(1);
  };

  // Statistics
  const stats = {
    total: cases.length,
    onTrack: cases.filter((c) => c.status === "on-track").length,
    atRisk: cases.filter((c) => c.status === "at-risk").length,
    breached: cases.filter((c) => c.status === "breached").length,
    resolved: cases.filter((c) => c.status === "resolved").length,
    unreadAlerts: alerts.filter((a) => !a.isRead).length,
  };

  const getStatusColor = (status: SLACase["status"]) => {
    switch (status) {
      case "on-track": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "at-risk": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "breached": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "resolved": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }
  };

  const getPriorityColor = (priority: SLACase["priority"]) => {
    switch (priority) {
      case "critical": return "bg-red-600 text-white";
      case "high": return "bg-orange-500 text-white";
      case "medium": return "bg-yellow-500 text-black";
      case "low": return "bg-gray-500 text-white";
    }
  };

  const getStageStatusColor = (status: WorkflowStage["status"]) => {
    switch (status) {
      case "healthy": return "border-green-500 bg-green-500/10";
      case "warning": return "border-yellow-500 bg-yellow-500/10";
      case "critical": return "border-red-500 bg-red-500/10";
    }
  };

  const formatTimeRemaining = (hours: number) => {
    if (hours < 0) return `${Math.abs(hours)}h overdue`;
    if (hours < 24) return `${hours}h remaining`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h remaining`;
  };

  // Get unique values for filters
  const uniqueDcas = Array.from(new Set(cases.map((c) => c.dcaName)));
  const uniqueAssignees = Array.from(new Set(cases.map((c) => c.assignedTo)));

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">SLA Monitoring</h1>
            <p className="text-muted-foreground">
              Track and manage SLA compliance in real-time • Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? "bg-green-500/10 border-green-500" : ""}
            >
              {autoRefresh ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              Auto-Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="h-4 w-4" />
                {stats.unreadAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                    {stats.unreadAlerts}
                  </span>
                )}
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistorySheet(true)}
            >
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportDialog(true)}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Notifications Panel */}
        {showNotifications && (
          <Card className="border-2 border-primary/20">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Notifications</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowNotifications(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 max-h-64 overflow-y-auto">
              {alerts.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No notifications</p>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      !alert.isRead ? "bg-primary/5 border-primary/20" : "bg-muted/50"
                    }`}
                  >
                    {alert.type === "breach" && <XCircle className="h-5 w-5 text-red-500 mt-0.5" />}
                    {alert.type === "warning" && <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />}
                    {alert.type === "info" && <Info className="h-5 w-5 text-blue-500 mt-0.5" />}
                    <div className="flex-1">
                      <p className={`text-sm ${!alert.isRead ? "font-medium" : ""}`}>{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{alert.timestamp}</p>
                    </div>
                    <div className="flex gap-1">
                      {!alert.isRead && (
                        <Button variant="ghost" size="sm" onClick={() => handleMarkAlertRead(alert.id)}>
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleDismissAlert(alert.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("all")}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Cases</p>
                  <p className="text-3xl font-bold mt-1">{stats.total}</p>
                </div>
                <div className="p-3 rounded-full bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-500">+12% from last week</span>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-green-500" onClick={() => setStatusFilter("on-track")}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">On Track</p>
                  <p className="text-3xl font-bold mt-1 text-green-500">{stats.onTrack}</p>
                </div>
                <div className="p-3 rounded-full bg-green-500/10">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <div className="mt-4">
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${(stats.onTrack / stats.total) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-yellow-500" onClick={() => setStatusFilter("at-risk")}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">At Risk</p>
                  <p className="text-3xl font-bold mt-1 text-yellow-500">{stats.atRisk}</p>
                </div>
                <div className="p-3 rounded-full bg-yellow-500/10">
                  <AlertTriangle className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-muted-foreground">Requires attention</span>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-red-500" onClick={() => setStatusFilter("breached")}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Breached</p>
                  <p className="text-3xl font-bold mt-1 text-red-500">{stats.breached}</p>
                </div>
                <div className="p-3 rounded-full bg-red-500/10">
                  <XCircle className="h-6 w-6 text-red-500" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-500">Immediate action needed</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Workflow Stages */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Workflow Stages
            </CardTitle>
            <CardDescription>Current case distribution across recovery stages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {workflowStages.map((stage) => (
                <div
                  key={stage.id}
                  className={`min-w-[180px] p-4 rounded-lg border-2 ${getStageStatusColor(stage.status)} cursor-pointer hover:shadow-md transition-all`}
                  onClick={() => setStageFilter(stage.name.toLowerCase().replace(" ", "-"))}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-sm">{stage.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {stage.count}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold mt-2">{stage.count}</p>
                  <p className="text-xs text-muted-foreground mt-1">Avg: {stage.avgTime}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filters and Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search cases, debtors, or agents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="on-track">On Track</SelectItem>
                    <SelectItem value="at-risk">At Risk</SelectItem>
                    <SelectItem value="breached">Breached</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={stageFilter} onValueChange={setStageFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    <SelectItem value="initial-contact">Initial Contact</SelectItem>
                    <SelectItem value="negotiation">Negotiation</SelectItem>
                    <SelectItem value="payment-plan">Payment Plan</SelectItem>
                    <SelectItem value="legal-review">Legal Review</SelectItem>
                    <SelectItem value="escalated">Escalated</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={dcaFilter} onValueChange={setDcaFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="DCA" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All DCAs</SelectItem>
                    {uniqueDcas.map((dca) => (
                      <SelectItem key={dca} value={dca}>{dca}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Agents</SelectItem>
                    {uniqueAssignees.map((assignee) => (
                      <SelectItem key={assignee} value={assignee}>{assignee}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="outline" size="icon" onClick={clearFilters}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Active Filters Display */}
            {(statusFilter !== "all" || priorityFilter !== "all" || stageFilter !== "all" || dcaFilter !== "all" || assigneeFilter !== "all" || searchQuery) && (
              <div className="flex flex-wrap gap-2 mt-4">
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    Search: {searchQuery}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery("")} />
                  </Badge>
                )}
                {statusFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Status: {statusFilter}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setStatusFilter("all")} />
                  </Badge>
                )}
                {priorityFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Priority: {priorityFilter}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setPriorityFilter("all")} />
                  </Badge>
                )}
                {stageFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Stage: {stageFilter}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setStageFilter("all")} />
                  </Badge>
                )}
                {dcaFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    DCA: {dcaFilter}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setDcaFilter("all")} />
                  </Badge>
                )}
                {assigneeFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Agent: {assigneeFilter}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setAssigneeFilter("all")} />
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bulk Actions Bar */}
        {selectedCases.length > 0 && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox checked={selectAll} onCheckedChange={handleSelectAll} />
                  <span className="font-medium">{selectedCases.length} case(s) selected</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowBulkActionDialog(true)}>
                    <Zap className="h-4 w-4 mr-2" />
                    Bulk Actions
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setSelectedCases([]); setSelectAll(false); }}>
                    Clear Selection
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cases Table */}
        <Card>
          <CardContent className="pt-6">
            {paginatedCases.length === 0 ? (
              <EmptyState
                message="No cases match your current filters. Try adjusting your search criteria or clear all filters."
                onRefresh={clearFilters}
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 w-10">
                          <Checkbox checked={selectAll} onCheckedChange={handleSelectAll} />
                        </th>
                        <th
                          className="text-left p-3 cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort("caseNumber")}
                        >
                          <div className="flex items-center gap-2">
                            Case #
                            {sortField === "caseNumber" && (
                              sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </th>
                        <th
                          className="text-left p-3 cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort("debtorName")}
                        >
                          <div className="flex items-center gap-2">
                            Debtor
                            {sortField === "debtorName" && (
                              sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </th>
                        <th
                          className="text-left p-3 cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort("amount")}
                        >
                          <div className="flex items-center gap-2">
                            Amount
                            {sortField === "amount" && (
                              sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-left p-3">Priority</th>
                        <th
                          className="text-left p-3 cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort("timeRemaining")}
                        >
                          <div className="flex items-center gap-2">
                            Time Remaining
                            {sortField === "timeRemaining" && (
                              sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </th>
                        <th className="text-left p-3">Assigned To</th>
                        <th className="text-left p-3">Contact</th>
                        <th className="text-left p-3 w-10">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedCases.map((caseItem) => (
                        <tr
                          key={caseItem.id}
                          className={`border-b hover:bg-muted/50 transition-colors ${
                            caseItem.isPaused ? "opacity-60" : ""
                          } ${selectedCases.includes(caseItem.id) ? "bg-primary/5" : ""}`}
                        >
                          <td className="p-3">
                            <Checkbox
                              checked={selectedCases.includes(caseItem.id)}
                              onCheckedChange={() => handleSelectCase(caseItem.id)}
                            />
                          </td>
                          <td className="p-3">
                            <button
                              className="font-medium text-primary hover:underline"
                              onClick={() => {
                                setSelectedCase(caseItem);
                                setShowCaseDetails(true);
                              }}
                            >
                              {caseItem.caseNumber}
                            </button>
                            {caseItem.isPaused && (
                              <Badge variant="outline" className="ml-2 text-xs">Paused</Badge>
                            )}
                            {caseItem.isEscalated && (
                              <Badge variant="destructive" className="ml-2 text-xs">Escalated</Badge>
                            )}
                          </td>
                          <td className="p-3">
                            <div>
                              <p className="font-medium">{caseItem.debtorName}</p>
                              <p className="text-xs text-muted-foreground">{caseItem.dcaName}</p>
                            </div>
                          </td>
                          <td className="p-3 font-medium">${caseItem.amount.toLocaleString()}</td>
                          <td className="p-3">
                            <Badge className={getStatusColor(caseItem.status)}>
                              {caseItem.status.replace("-", " ")}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge className={getPriorityColor(caseItem.priority)}>
                              {caseItem.priority}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className={`flex items-center gap-2 ${
                              caseItem.timeRemaining < 0 ? "text-red-500" :
                              caseItem.timeRemaining < 24 ? "text-yellow-500" :
                              "text-green-500"
                            }`}>
                              <Clock className="h-4 w-4" />
                              <span className="font-medium">{formatTimeRemaining(caseItem.timeRemaining)}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              {caseItem.assignedTo}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  window.location.href = `tel:${caseItem.debtorPhone}`;
                                  toast.success(`Calling ${caseItem.debtorName}...`);
                                }}
                              >
                                <Phone className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  window.location.href = `mailto:${caseItem.debtorEmail}`;
                                  toast.success(`Opening email to ${caseItem.debtorName}...`);
                                }}
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setSelectedCase(caseItem);
                                  setShowReminderDialog(true);
                                }}
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                          <td className="p-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setSelectedCase(caseItem);
                                  setShowCaseDetails(true);
                                }}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => {
                                  setSelectedCase(caseItem);
                                  setShowEscalateDialog(true);
                                }}>
                                  <ArrowUpCircle className="h-4 w-4 mr-2" />
                                  Escalate
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedCase(caseItem);
                                  setShowLegalDialog(true);
                                }}>
                                  <Scale className="h-4 w-4 mr-2" />
                                  Legal Action
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedCase(caseItem);
                                  setShowExtendDialog(true);
                                }}>
                                  <Calendar className="h-4 w-4 mr-2" />
                                  Extend SLA
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePauseResume(caseItem)}>
                                  {caseItem.isPaused ? (
                                    <>
                                      <Play className="h-4 w-4 mr-2" />
                                      Resume SLA
                                    </>
                                  ) : (
                                    <>
                                      <Pause className="h-4 w-4 mr-2" />
                                      Pause SLA
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => {
                                  setSelectedCase(caseItem);
                                  setShowResolveDialog(true);
                                }}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mark Resolved
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(currentPage * itemsPerPage, sortedCases.length)} of {sortedCases.length} cases
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(1)}
                    >
                      First
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm px-2">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(totalPages)}
                    >
                      Last
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Case Details Sheet */}
        <Sheet open={showCaseDetails} onOpenChange={setShowCaseDetails}>
          <SheetContent className="w-[500px] sm:w-[600px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Case Details - {selectedCase?.caseNumber}</SheetTitle>
              <SheetDescription>
                Complete information and history for this case
              </SheetDescription>
            </SheetHeader>
            {selectedCase && (
              <div className="space-y-6 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={getStatusColor(selectedCase.status)}>
                      {selectedCase.status.replace("-", " ")}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Priority</p>
                    <Badge className={getPriorityColor(selectedCase.priority)}>
                      {selectedCase.priority}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-bold text-lg">${selectedCase.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Time Remaining</p>
                    <p className={`font-medium ${
                      selectedCase.timeRemaining < 0 ? "text-red-500" :
                      selectedCase.timeRemaining < 24 ? "text-yellow-500" :
                      "text-green-500"
                    }`}>
                      {formatTimeRemaining(selectedCase.timeRemaining)}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Debtor Information</h4>
                  <div className="space-y-2">
                    <p><span className="text-muted-foreground">Name:</span> {selectedCase.debtorName}</p>
                    <p><span className="text-muted-foreground">Phone:</span> 
                      <a href={`tel:${selectedCase.debtorPhone}`} className="text-primary hover:underline ml-1">
                        {selectedCase.debtorPhone}
                      </a>
                    </p>
                    <p><span className="text-muted-foreground">Email:</span> 
                      <a href={`mailto:${selectedCase.debtorEmail}`} className="text-primary hover:underline ml-1">
                        {selectedCase.debtorEmail}
                      </a>
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Case Information</h4>
                  <div className="space-y-2">
                    <p><span className="text-muted-foreground">Stage:</span> {selectedCase.stage.replace("-", " ")}</p>
                    <p><span className="text-muted-foreground">Assigned To:</span> {selectedCase.assignedTo}</p>
                    <p><span className="text-muted-foreground">DCA:</span> {selectedCase.dcaName}</p>
                    <p><span className="text-muted-foreground">Due Date:</span> {selectedCase.dueDate}</p>
                    <p><span className="text-muted-foreground">SLA Deadline:</span> {selectedCase.slaDeadline}</p>
                    <p><span className="text-muted-foreground">Contact Attempts:</span> {selectedCase.attempts}</p>
                    <p><span className="text-muted-foreground">Last Contact:</span> {selectedCase.lastContact}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Notes</h4>
                  <p className="text-sm whitespace-pre-wrap">{selectedCase.notes}</p>
                </div>

                <div className="border-t pt-4 flex flex-wrap gap-2">
                  <Button onClick={() => {
                    setShowCaseDetails(false);
                    setShowEscalateDialog(true);
                  }}>
                    <ArrowUpCircle className="h-4 w-4 mr-2" />
                    Escalate
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setShowCaseDetails(false);
                    setShowExtendDialog(true);
                  }}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Extend SLA
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setShowCaseDetails(false);
                    setShowReminderDialog(true);
                  }}>
                    <Send className="h-4 w-4 mr-2" />
                    Send Reminder
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Escalate Dialog */}
        <Dialog open={showEscalateDialog} onOpenChange={setShowEscalateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Escalate Case</DialogTitle>
              <DialogDescription>
                Escalate {selectedCase?.caseNumber} to senior management for review
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Escalation Reason</label>
                <Textarea
                  placeholder="Enter reason for escalation..."
                  value={escalationReason}
                  onChange={(e) => setEscalationReason(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEscalateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleEscalate} disabled={!escalationReason}>
                <ArrowUpCircle className="h-4 w-4 mr-2" />
                Escalate Case
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Legal Action Dialog */}
        <Dialog open={showLegalDialog} onOpenChange={setShowLegalDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Initiate Legal Action</DialogTitle>
              <DialogDescription>
                Send {selectedCase?.caseNumber} to legal review
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-500">Warning</p>
                    <p className="text-sm text-muted-foreground">
                      Initiating legal action is a significant step. Ensure all other recovery options have been exhausted.
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Legal Notes</label>
                <Textarea
                  placeholder="Document reasons and relevant details for legal review..."
                  value={legalNotes}
                  onChange={(e) => setLegalNotes(e.target.value)}
                  className="mt-2"
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowLegalDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleLegalAction} disabled={!legalNotes}>
                <Scale className="h-4 w-4 mr-2" />
                Initiate Legal Action
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Extend SLA Dialog */}
        <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Extend SLA Deadline</DialogTitle>
              <DialogDescription>
                Extend the SLA deadline for {selectedCase?.caseNumber}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Extension Period</label>
                <Select value={extensionDays} onValueChange={setExtensionDays}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 Days</SelectItem>
                    <SelectItem value="7">7 Days</SelectItem>
                    <SelectItem value="14">14 Days</SelectItem>
                    <SelectItem value="30">30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Reason for Extension</label>
                <Textarea
                  placeholder="Enter reason for extension..."
                  value={extensionReason}
                  onChange={(e) => setExtensionReason(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowExtendDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleExtendSla} disabled={!extensionReason}>
                <Calendar className="h-4 w-4 mr-2" />
                Extend Deadline
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Resolve Dialog */}
        <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark Case as Resolved</DialogTitle>
              <DialogDescription>
                Mark {selectedCase?.caseNumber} as resolved
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Resolution Notes</label>
                <Textarea
                  placeholder="Document how the case was resolved..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="mt-2"
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowResolveDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleResolve} disabled={!resolutionNotes} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Resolved
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Send Reminder Dialog */}
        <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Reminder</DialogTitle>
              <DialogDescription>
                Send a reminder to {selectedCase?.debtorName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Send Via</label>
                <Select value={reminderType} onValueChange={(v) => setReminderType(v as "email" | "sms" | "both")}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="both">Both Email & SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  placeholder="Enter reminder message..."
                  value={reminderMessage}
                  onChange={(e) => setReminderMessage(e.target.value)}
                  className="mt-2"
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReminderDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendReminder} disabled={!reminderMessage}>
                <Send className="h-4 w-4 mr-2" />
                Send Reminder
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Action Dialog */}
        <Dialog open={showBulkActionDialog} onOpenChange={setShowBulkActionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Actions</DialogTitle>
              <DialogDescription>
                Apply action to {selectedCases.length} selected case(s)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Select Action</label>
                <Select value={bulkAction} onValueChange={setBulkAction}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Choose an action..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="escalate">Escalate All</SelectItem>
                    <SelectItem value="extend">Extend SLA (48 hours)</SelectItem>
                    <SelectItem value="pause">Pause SLA</SelectItem>
                    <SelectItem value="assign">Reassign Cases</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBulkActionDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkAction} disabled={!bulkAction}>
                <Zap className="h-4 w-4 mr-2" />
                Apply to {selectedCases.length} Case(s)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Export Dialog */}
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Export SLA Report</DialogTitle>
              <DialogDescription>
                Export {selectedCases.length > 0 ? `${selectedCases.length} selected` : filteredCases.length} case(s) to file
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Export Format</label>
                <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as "csv" | "xlsx" | "pdf")}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV (Comma Separated)</SelectItem>
                    <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                    <SelectItem value="pdf">PDF Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Included data:</strong> Case Number, Debtor Name, Amount, Status, Priority, Stage, Time Remaining, Assigned To, DCA
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export {exportFormat.toUpperCase()}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* History Sheet */}
        <Sheet open={showHistorySheet} onOpenChange={setShowHistorySheet}>
          <SheetContent className="w-[400px] sm:w-[500px]">
            <SheetHeader>
              <SheetTitle>Activity History</SheetTitle>
              <SheetDescription>
                Recent actions and changes
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
              {activityLog.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No activity recorded yet</p>
              ) : (
                activityLog.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border">
                    <div className="p-2 rounded-full bg-primary/10">
                      <History className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.caseId !== "system" && `Case: ${activity.caseId} • `}
                        {activity.user} • {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </DashboardLayout>
  );
}
