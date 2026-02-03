"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  DollarSign,
  FileText,
  AlertTriangle,
  Clock,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  UserPlus,
  Users,
  Gavel,
  MessageSquare,
  ShieldAlert,
  AlertCircle,
  Timer,
  Zap,
  Search,
  Calendar,
  X,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import { useAppData } from "@/lib/data/app-data-context";

// Format currency helper
function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `₹${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(0)}K`;
  }
  return `₹${amount.toFixed(0)}`;
}

// Relative time helper
function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

// KPI definitions - values will be computed from real data
function getKPIsFromData(data: ReturnType<typeof useAppData>["data"]) {
  if (!data) {
    return [
      { title: "SLA Breaches", value: "0", change: "0", trend: "up", icon: ShieldAlert, importance: "critical", subtext: "Loading...", tooltip: "" },
      { title: "High-Risk Accounts", value: "0", change: "0", trend: "up", icon: AlertTriangle, importance: "warning", subtext: "Loading...", tooltip: "" },
      { title: "Active Cases", value: "0", change: "0", trend: "up", icon: FileText, importance: "attention", subtext: "Loading...", tooltip: "" },
      { title: "Total Overdue", value: "₹0", change: "0", trend: "up", icon: DollarSign, importance: "neutral", subtext: "Loading...", tooltip: "" },
      { title: "Expected Recoveries", value: "₹0", change: "0", trend: "up", icon: TrendingUp, importance: "healthy", subtext: "Loading...", tooltip: "" },
      { title: "Recovered This Month", value: "₹0", change: "0", trend: "up", icon: CheckCircle2, importance: "healthy", subtext: "Loading...", tooltip: "" },
    ];
  }

  const { dashboardMetrics, slaMetrics, casesByPriority } = data;
  const highRiskCount = (casesByPriority?.high || 0) + (casesByPriority?.critical || 0);

  return [
    {
      title: "SLA Breaches",
      value: String(slaMetrics?.breached || 0),
      change: slaMetrics?.breached ? `+${slaMetrics.breached}` : "0",
      trend: "up" as const,
      icon: ShieldAlert,
      importance: slaMetrics?.breached && slaMetrics.breached > 0 ? "critical" : "healthy",
      subtext: `${slaMetrics?.atRisk || 0} at risk`,
      tooltip: `${slaMetrics?.breached || 0} cases have exceeded their SLA deadline.`,
    },
    {
      title: "High-Risk Accounts",
      value: String(highRiskCount),
      change: `+${highRiskCount}`,
      trend: "up" as const,
      icon: AlertTriangle,
      importance: highRiskCount > 0 ? "warning" : "healthy",
      subtext: `${casesByPriority?.critical || 0} critical priority`,
      tooltip: `${highRiskCount} cases flagged as high or critical priority.`,
    },
    {
      title: "Active Cases",
      value: String(dashboardMetrics?.activeCases || 0),
      change: `+${dashboardMetrics?.activeCases || 0}`,
      trend: "up" as const,
      icon: FileText,
      importance: "attention",
      subtext: `${dashboardMetrics?.unassignedCases || 0} unassigned`,
      tooltip: `Total active recovery cases. ${dashboardMetrics?.unassignedCases || 0} pending assignment.`,
    },
    {
      title: "Total Overdue",
      value: formatCurrency(dashboardMetrics?.totalOverdue || 0),
      change: "+0%",
      trend: "up" as const,
      icon: DollarSign,
      importance: "neutral",
      subtext: `Across ${dashboardMetrics?.totalCases || 0} cases`,
      tooltip: `Total outstanding amount pending recovery.`,
    },
    {
      title: "Expected Recoveries",
      value: formatCurrency((dashboardMetrics?.totalOverdue || 0) * (dashboardMetrics?.recoveryRate || 0) / 100),
      change: `+${(dashboardMetrics?.recoveryRate || 0).toFixed(1)}%`,
      trend: "up" as const,
      icon: TrendingUp,
      importance: "healthy",
      subtext: `${(dashboardMetrics?.recoveryRate || 0).toFixed(1)}% projected rate`,
      tooltip: `Predicted recovery based on current case status.`,
    },
    {
      title: "Recovered This Month",
      value: formatCurrency(dashboardMetrics?.totalRecovered || 0),
      change: "+0%",
      trend: "up" as const,
      icon: CheckCircle2,
      importance: "healthy",
      subtext: `${dashboardMetrics?.resolvedCases || 0} cases resolved`,
      tooltip: `Successfully recovered amount from resolved cases.`,
    },
  ];
}

// Customer type for Priority Queue - populated from backend
interface PriorityCustomer {
  id: number;
  caseId: string;
  name: string;
  amount: string;
  creditScore: number;
  status: string;
  priority: "high" | "medium" | "low" | "critical";
  timeLeft: string;
  daysOverdue: number;
  allocatedTo: string | null;
  createdAt: string;
}

// Empty initial - will be populated from backend
const initialCustomers: PriorityCustomer[] = [];

type Customer = PriorityCustomer;

interface ActivityItem {
  id: string;
  caseId: number;
  caseName: string;
  action: string;
  time: string;
  timestamp: number;
  status: "critical" | "success" | "warning";
}

// DCA agencies - will be populated from backend if available
const dcasFallback = [
  { id: 1, name: "Alpha Recovery Inc", rate: 84, specialisation: "High Value Cases" },
  { id: 2, name: "Global Collections", rate: 79, specialisation: "Commercial Debt" },
  { id: 3, name: "Prime Debt Solutions", rate: 76, specialisation: "Consumer Debt" },
  { id: 4, name: "Swift Recovery Services", rate: 82, specialisation: "Fast Track" },
  { id: 5, name: "National Collections", rate: 71, specialisation: "Medical Debt" },
];

// Helper to compute radar chart data from real metrics
function computeRadarData(data: ReturnType<typeof useAppData>["data"]) {
  if (!data || !data.dashboardMetrics?.totalCases) {
    return [
      { metric: "SLA Breaches", value: 0, fullMark: 100 },
      { metric: "Legal Escalations", value: 0, fullMark: 100 },
      { metric: "Negotiations", value: 0, fullMark: 100 },
      { metric: "High-Risk", value: 0, fullMark: 100 },
    ];
  }
  
  const totalCases = data.dashboardMetrics.totalCases || 1;
  const slaBreaches = data.slaMetrics?.breached || 0;
  const legalCases = data.casesByStatus?.legal || 0;
  const negotiatingCases = data.casesByStatus?.negotiating || 0;
  const highRiskCases = (data.casesByPriority?.high || 0) + (data.casesByPriority?.critical || 0);
  
  return [
    { metric: "SLA Breaches", value: Math.round((slaBreaches / totalCases) * 100), fullMark: 100 },
    { metric: "Legal Escalations", value: Math.round((legalCases / totalCases) * 100), fullMark: 100 },
    { metric: "Negotiations", value: Math.round((negotiatingCases / totalCases) * 100), fullMark: 100 },
    { metric: "High-Risk", value: Math.round((highRiskCases / totalCases) * 100), fullMark: 100 },
  ];
}

// Helper to compute dynamic insight from real data
function computeInsightState(data: ReturnType<typeof useAppData>["data"]) {
  if (!data) {
    return {
      state: "normal" as const,
      message: "📊 Loading dashboard data...",
      action: "View Dashboard",
    };
  }
  
  const breachedCount = data.slaMetrics?.breached || 0;
  const atRiskCount = data.slaMetrics?.atRisk || 0;
  const legalAmount = data.cases
    ?.filter(c => c.status === "legal" || c.isEscalated)
    .reduce((sum, c) => sum + parseFloat(c.overdueAmount || "0"), 0) || 0;
  
  if (breachedCount > 0) {
    const amountStr = legalAmount >= 1000000 
      ? `₹${(legalAmount / 1000000).toFixed(1)}M` 
      : legalAmount >= 1000 
        ? `₹${(legalAmount / 1000).toFixed(0)}K`
        : `₹${legalAmount.toFixed(0)}`;
    return {
      state: "crisis" as const,
      message: `🚨 ${breachedCount} SLA ${breachedCount === 1 ? 'penalty' : 'penalties'} triggered. ${amountStr} at legal escalation risk.`,
      action: "View Critical Cases",
    };
  }
  
  if (atRiskCount > 0) {
    return {
      state: "risk" as const,
      message: `⚠ ${atRiskCount} ${atRiskCount === 1 ? 'account' : 'accounts'} nearing SLA breach within 24 hours.`,
      action: "Review At-Risk",
    };
  }
  
  return {
    state: "normal" as const,
    message: "📊 Recovery performance stable. No immediate action required.",
    action: "View Dashboard",
  };
}

// Helper to compute KPI breakdowns from real data
function computeKpiBreakdowns(data: ReturnType<typeof useAppData>["data"]): Record<string, { label: string; value: string; trend?: string }[]> {
  if (!data) return {};
  
  const formatAmount = (amount: number) => {
    return amount >= 1000000 ? `₹${(amount / 1000000).toFixed(1)}M` : amount >= 1000 ? `₹${(amount / 1000).toFixed(0)}K` : `₹${amount.toFixed(0)}`;
  };
  
  // SLA Breaches breakdown by DCA
  const slaBreachesByDca = data.dcaPerformance?.map(dca => {
    const breaches = data.cases?.filter(c => c.dcaAgencyId === dca.agency.id && c.slaStatus === "breached").length || 0;
    return { label: dca.agency.agencyName, value: `${breaches} breaches`, trend: breaches > 0 ? `+${breaches}` : "0" };
  }).filter(d => d.value !== "0 breaches") || [];
  
  // High-Risk breakdown
  const criticalCases = data.cases?.filter(c => c.priority === "critical") || [];
  const highCases = data.cases?.filter(c => c.priority === "high") || [];
  const breachedCases = data.cases?.filter(c => c.slaStatus === "breached") || [];
  
  // Active cases breakdown by status
  const activeCasesBreakdown = [
    { label: "In Progress", value: `${data.casesByStatus?.active || 0} cases` },
    { label: "Negotiating", value: `${data.casesByStatus?.negotiating || 0} cases` },
    { label: "Payment Plan", value: `${data.casesByStatus?.["payment-plan"] || 0} cases` },
    { label: "Legal", value: `${data.casesByStatus?.legal || 0} cases` },
  ].filter(d => d.value !== "0 cases");
  
  // Total overdue breakdown by amount range
  const casesByAmount = {
    over100k: data.cases?.filter(c => parseFloat(c.overdueAmount) >= 100000) || [],
    "50k_100k": data.cases?.filter(c => parseFloat(c.overdueAmount) >= 50000 && parseFloat(c.overdueAmount) < 100000) || [],
    "20k_50k": data.cases?.filter(c => parseFloat(c.overdueAmount) >= 20000 && parseFloat(c.overdueAmount) < 50000) || [],
    under20k: data.cases?.filter(c => parseFloat(c.overdueAmount) < 20000) || [],
  };
  
  const sumAmount = (cases: typeof casesByAmount.over100k) => cases.reduce((sum, c) => sum + parseFloat(c.overdueAmount), 0);
  
  const overdueBreakdown: { label: string; value: string }[] = [];
  if (casesByAmount.over100k.length > 0) overdueBreakdown.push({ label: "> ₹100K", value: formatAmount(sumAmount(casesByAmount.over100k)) });
  if (casesByAmount["50k_100k"].length > 0) overdueBreakdown.push({ label: "₹50K - ₹100K", value: formatAmount(sumAmount(casesByAmount["50k_100k"])) });
  if (casesByAmount["20k_50k"].length > 0) overdueBreakdown.push({ label: "₹20K - ₹50K", value: formatAmount(sumAmount(casesByAmount["20k_50k"])) });
  if (casesByAmount.under20k.length > 0) overdueBreakdown.push({ label: "< ₹20K", value: formatAmount(sumAmount(casesByAmount.under20k)) });
  
  // Expected recoveries by probability
  const highProbCases = data.cases?.filter(c => (c.aiProbability ?? 0) >= 80) || [];
  const medProbCases = data.cases?.filter(c => (c.aiProbability ?? 0) >= 50 && (c.aiProbability ?? 0) < 80) || [];
  const lowProbCases = data.cases?.filter(c => (c.aiProbability ?? 0) < 50) || [];
  
  const totalRecovered = data.dashboardMetrics?.totalRecovered || 0;
  
  return {
    "SLA Breaches": slaBreachesByDca.length > 0 ? slaBreachesByDca : [{ label: "No SLA breaches", value: "0" }],
    "High-Risk Accounts": [
      { label: "Critical Priority", value: `${criticalCases.length} accounts` },
      { label: "High Priority", value: `${highCases.length} accounts` },
      { label: "SLA Breached", value: `${breachedCases.length} accounts` },
    ].filter(d => d.value !== "0 accounts"),
    "Active Cases": activeCasesBreakdown.length > 0 ? activeCasesBreakdown : [{ label: "No active cases", value: "0" }],
    "Total Overdue": overdueBreakdown.length > 0 ? overdueBreakdown : [{ label: "No overdue", value: "₹0" }],
    "Expected Recoveries": [
      { label: "High Probability (>80%)", value: formatAmount(sumAmount(highProbCases)) },
      { label: "Medium (50-80%)", value: formatAmount(sumAmount(medProbCases)) },
      { label: "Low (<50%)", value: formatAmount(sumAmount(lowProbCases)) },
    ],
    "Recovered This Month": [{ label: "Total Recovered", value: formatAmount(totalRecovered) }],
  };
}

// Insight bar styling based on state
const insightStyles = {
  crisis: {
    bg: "bg-gradient-to-r from-rose-600 to-rose-500",
    icon: AlertCircle,
  },
  risk: {
    bg: "bg-gradient-to-r from-amber-500 to-amber-400",
    icon: AlertTriangle,
  },
  normal: {
    bg: "bg-gradient-to-r from-blue-600 to-blue-500",
    icon: CheckCircle2,
  },
};

// Initial activities - empty, will be populated from backend
const initialActivities: ActivityItem[] = [];

function getUserDisplayName(email: string): string {
  if (!email) return "User";
  const namePart = email.split("@")[0];
  return namePart
    .split(/[._]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function getImportanceStyles(importance: string) {
  switch (importance) {
    case "critical":
      return {
        card: "border-l-4 border-l-rose-500 bg-rose-50/30",
        icon: "bg-rose-100 text-rose-600",
        badge: "bg-rose-100 text-rose-700",
      };
    case "warning":
      return {
        card: "border-l-4 border-l-amber-500 bg-amber-50/20",
        icon: "bg-amber-100 text-amber-600",
        badge: "bg-amber-100 text-amber-700",
      };
    case "attention":
      return {
        card: "border-l-2 border-l-blue-300 bg-blue-50/10",
        icon: "bg-blue-50 text-blue-600",
        badge: "bg-blue-50 text-blue-600",
      };
    case "healthy":
      return {
        card: "border-l-2 border-l-emerald-300 bg-emerald-50/10",
        icon: "bg-emerald-50 text-emerald-600",
        badge: "bg-emerald-50 text-emerald-600",
      };
    default:
      return {
        card: "border border-slate-200 bg-white",
        icon: "bg-slate-100 text-slate-500",
        badge: "bg-slate-100 text-slate-600",
      };
  }
}

export default function HomePage() {
  const router = useRouter();
  const { data, isLoading: isDataLoading, refresh } = useAppData();
  const [userName, setUserName] = useState("");
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedDCA, setSelectedDCA] = useState<{ id: number; name: string; rate: number; specialisation: string } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // New state for features
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [activities, setActivities] = useState<ActivityItem[]>(initialActivities);
  const [selectedKPI, setSelectedKPI] = useState<ReturnType<typeof getKPIsFromData>[0] | null>(null);
  const [isKPISheetOpen, setIsKPISheetOpen] = useState(false);

  // Compute KPIs from real data
  const kpis = useMemo(() => getKPIsFromData(data), [data]);

  // Transform backend cases to Priority Queue format
  useEffect(() => {
    if (data?.cases && data.cases.length > 0) {
      // Sort by priority (critical first, then high, medium, low) and by aging days
      const sortedCases = [...data.cases].sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2;
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return b.agingDays - a.agingDays; // Higher aging days first
      });
      
      const transformedCustomers: Customer[] = sortedCases.map((c, index) => {
        // Compute time left based on SLA
        let timeLeft = `${c.agingDays}d`;
        if (c.slaStatus === "breached") {
          timeLeft = "Breached";
        } else if (c.slaStatus === "at-risk") {
          const hoursLeft = c.timeRemaining || 0;
          if (hoursLeft <= 0) timeLeft = "Breached";
          else if (hoursLeft < 24) timeLeft = `${hoursLeft}h left`;
          else timeLeft = `${Math.ceil(hoursLeft / 24)}d left`;
        } else {
          const hoursLeft = c.timeRemaining || 168;
          if (hoursLeft < 24) timeLeft = `${hoursLeft}h left`;
          else timeLeft = `${Math.ceil(hoursLeft / 24)}d left`;
        }
        
        // Determine status text
        let status = "Low Risk";
        if (c.slaStatus === "breached" || c.priority === "critical") {
          status = "Critical";
        } else if (c.slaStatus === "at-risk" || c.priority === "high") {
          status = "High Risk";
        } else if (c.priority === "medium") {
          status = "Medium Risk";
        }
        
        return {
          id: index + 1,
          caseId: c.caseNumber,
          name: c.customer?.name || "Unknown Customer",
          amount: `₹${parseFloat(c.overdueAmount || "0").toLocaleString()}`,
          creditScore: c.customer?.creditScore || 600,
          status,
          priority: (c.priority === "critical" ? "high" : c.priority) as "high" | "medium" | "low",
          timeLeft,
          daysOverdue: c.agingDays,
          allocatedTo: c.dcaAgency?.agencyName || null,
          createdAt: c.createdAt.split("T")[0],
        };
      });
      setCustomers(transformedCustomers);
    }
  }, [data?.cases]);

  // Transform backend activities
  useEffect(() => {
    if (data?.activities && data.activities.length > 0) {
      const transformedActivities: ActivityItem[] = data.activities.slice(0, 10).map((a, index) => ({
        id: a.id,
        caseId: index + 1,
        caseName: a.entityName || `Case ${index + 1}`,
        action: a.action,
        time: getRelativeTime(a.createdAt),
        timestamp: new Date(a.createdAt).getTime(),
        status: a.action.includes("escalat") ? "critical" : a.action.includes("resolv") || a.action.includes("payment") ? "success" : "warning",
      }));
      setActivities(transformedActivities);
    }
  }, [data?.activities]);

  // Get user from context
  useEffect(() => {
    if (data?.user) {
      setUserName(data.user.name || getUserDisplayName(data.user.email));
    }
  }, [data?.user]);

  // Local state update helper (dashboard uses local state for customer actions)
  // These changes are UI-only and don't persist - actual case changes should be done on Cases page
  const saveToStorage = (key: string, updatedData: unknown) => {
    // No-op: Dashboard is primarily for viewing, mutations go through Cases page
    console.log(`Dashboard action: ${key}`, updatedData);
  };

  // Activity logging helper for dashboard actions
  const addActivity = (caseId: number, caseName: string, action: string, status: ActivityItem["status"]) => {
    const newActivity: ActivityItem = {
      id: `act-${Date.now()}`,
      caseId,
      caseName: `DCA-2024-${3800 + caseId}`,
      action,
      time: "Just now",
      timestamp: Date.now(),
      status,
    };
    setActivities(prev => [newActivity, ...prev].slice(0, 10));
  };

  // Filter customers based on search and date
  const filteredCustomers = useMemo(() => {
    let filtered = [...customers];
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.id.toString().includes(query) ||
        c.status.toLowerCase().includes(query)
      );
    }
    
    // Date filter (simplified - using createdAt)
    if (dateFilter.start) {
      filtered = filtered.filter(c => c.createdAt >= dateFilter.start);
    }
    if (dateFilter.end) {
      filtered = filtered.filter(c => c.createdAt <= dateFilter.end);
    }
    
    return filtered;
  }, [customers, searchQuery, dateFilter]);

  // Handle allocate - opens dialog
  const handleAllocate = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSelectedDCA(null);
    setIsDialogOpen(true);
  };

  // Handle confirm allocation
  const handleConfirmAllocation = () => {
    if (!selectedCustomer || !selectedDCA) {
      toast.error("Please select a DCA partner");
      return;
    }
    
    const updatedCustomers = customers.map(c => 
      c.id === selectedCustomer.id 
        ? { ...c, allocatedTo: selectedDCA.name, status: "Allocated" }
        : c
    );
    
    setCustomers(updatedCustomers);
    saveToStorage("customers_data", updatedCustomers);
    addActivity(selectedCustomer.id, selectedCustomer.name, `Allocated to ${selectedDCA.name}`, "success");
    
    toast.success(`${selectedCustomer.name} allocated to ${selectedDCA.name}`, {
      description: `Recovery rate: ${selectedDCA.rate}%`,
    });
    
    setIsDialogOpen(false);
    setSelectedCustomer(null);
    setSelectedDCA(null);
  };

  // Handle escalate to legal
  const handleEscalateToLegal = (customer: Customer) => {
    const updatedCustomers = customers.map(c => 
      c.id === customer.id 
        ? { ...c, status: "Legal Escalation", priority: "high" as const }
        : c
    );
    
    setCustomers(updatedCustomers);
    saveToStorage("customers_data", updatedCustomers);
    addActivity(customer.id, customer.name, "Escalated to Legal", "critical");
    
    toast.error(`${customer.name} escalated to legal`, {
      description: `Amount: ${customer.amount} | Legal team notified`,
    });
  };

  // Handle best DCA - auto-allocate to highest rate DCA
  const handleBestDCA = (customer: Customer) => {
    const bestDCA = dcas.reduce((prev, curr) => prev.rate > curr.rate ? prev : curr);
    
    const updatedCustomers = customers.map(c => 
      c.id === customer.id 
        ? { ...c, allocatedTo: bestDCA.name, status: "Fast Track" }
        : c
    );
    
    setCustomers(updatedCustomers);
    saveToStorage("customers_data", updatedCustomers);
    addActivity(customer.id, customer.name, `Auto-allocated to ${bestDCA.name} (Best DCA)`, "success");
    
    toast.success(`${customer.name} assigned to ${bestDCA.name}`, {
      description: `Highest recovery rate: ${bestDCA.rate}% | Fast-track enabled`,
    });
  };

  // Handle trigger negotiation
  const handleTriggerNegotiation = (customer: Customer) => {
    const updatedCustomers = customers.map(c => 
      c.id === customer.id 
        ? { ...c, status: "Negotiating" }
        : c
    );
    
    setCustomers(updatedCustomers);
    saveToStorage("customers_data", updatedCustomers);
    addActivity(customer.id, customer.name, "Negotiation initiated", "warning");
    
    toast.info(`Negotiation started for ${customer.name}`, {
      description: `Amount: ${customer.amount} | Awaiting customer response`,
    });
  };

  // Handle activity click - navigate to cases
  const handleActivityClick = (activity: ActivityItem) => {
    router.push(`/cases?id=${activity.caseId}`);
    toast.info(`Navigating to case ${activity.caseName}`);
  };

  // Handle KPI card click - open drill-down sheet
  const handleKPIClick = (kpi: typeof kpis[0]) => {
    setSelectedKPI(kpi);
    setIsKPISheetOpen(true);
  };

  // Clear date filter
  const clearDateFilter = () => {
    setDateFilter({ start: "", end: "" });
  };

  // Compute dynamic insight from real data
  const computedInsight = useMemo(() => computeInsightState(data), [data]);
  const currentInsightStyle = insightStyles[computedInsight.state];
  const InsightIcon = currentInsightStyle.icon;
  
  // Compute radar data from real metrics
  const radarData = useMemo(() => computeRadarData(data), [data]);
  
  // Compute KPI breakdowns from real data
  const kpiBreakdowns = useMemo(() => computeKpiBreakdowns(data), [data]);
  
  // Get DCA agencies from backend or use fallback
  const dcas = useMemo(() => {
    if (data?.dcaAgencies && data.dcaAgencies.length > 0) {
      return data.dcaAgencies.map((agency, idx) => ({
        id: idx + 1,
        name: agency.agencyName,
        rate: data.dcaPerformance?.find(p => p.agency.id === agency.id)?.recoveryRate || 75,
        specialisation: agency.specialization || "General",
      }));
    }
    return dcasFallback;
  }, [data?.dcaAgencies, data?.dcaPerformance]);

  return (
    <TooltipProvider>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Dynamic Insight Bar - Replaces Welcome Section */}
          <section className={`${currentInsightStyle.bg} rounded-xl p-4 shadow-lg`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                  <InsightIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-lg">{computedInsight.message}</p>
                  <p className="text-white/80 text-sm">Welcome back, {userName}</p>
                </div>
              </div>
              <Button 
                variant="secondary" 
                size="sm" 
                className="bg-white/20 text-white border-white/30 hover:bg-white/30 font-semibold"
                onClick={() => {
                  if (computedInsight.state === "crisis") {
                    router.push("/sla-monitoring?filter=breached");
                  } else if (computedInsight.state === "risk") {
                    router.push("/sla-monitoring?filter=at-risk");
                  } else {
                    router.push("/cases");
                  }
                }}
              >
                {computedInsight.action}
              </Button>
            </div>
          </section>

          {/* KPIs - Semantic importance hierarchy */}
          <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {kpis.map((kpi) => {
              const Icon = kpi.icon;
              const styles = getImportanceStyles(kpi.importance);
              const isCritical = kpi.importance === "critical";
              
              return (
                <Tooltip key={kpi.title}>
                  <TooltipTrigger asChild>
                    <Card 
                      onClick={() => handleKPIClick(kpi)}
                      className={`${styles.card} hover:shadow-md transition-all cursor-pointer group relative overflow-hidden hover:scale-[1.02]`}
                    >
                      {isCritical && (
                        <div className="absolute top-0 right-0 w-0 h-0 border-t-[24px] border-t-rose-500 border-l-[24px] border-l-transparent" />
                      )}
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${styles.icon}`}>
                            <Icon className={`h-4 w-4 ${isCritical ? "animate-pulse" : ""}`} />
                          </div>
                          <div className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${styles.badge}`}>
                            {kpi.trend === "up" ? (
                              <ArrowUpRight className="h-2.5 w-2.5" />
                            ) : (
                              <ArrowDownRight className="h-2.5 w-2.5" />
                            )}
                            {kpi.change}
                          </div>
                        </div>
                        <p className={`text-2xl font-extrabold tracking-tight ${isCritical ? "text-rose-700" : "text-foreground"}`}>
                          {kpi.value}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">
                          {kpi.title}
                        </p>
                        {kpi.subtext && (
                          <p className={`text-[9px] mt-1 font-semibold ${
                            isCritical ? "text-rose-600" : 
                            kpi.importance === "warning" ? "text-amber-600" : 
                            "text-muted-foreground"
                          }`}>
                            {kpi.subtext}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="text-sm">{kpi.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </section>

          {/* Allocation Table + Escalation Radar */}
          <section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Priority Queue Table */}
            <Card className="lg:col-span-3 bg-white border-border shadow-sm">
              <CardHeader className="pb-4 border-b border-border/50">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <UserPlus className="h-5 w-5 text-primary" />
                      Priority Queue
                      <Badge variant="outline" className="ml-2 text-[10px] font-bold bg-rose-50 text-rose-600 border-rose-200">
                        {filteredCustomers.filter(c => c.priority === "high").length} Critical
                      </Badge>
                    </CardTitle>
                  </div>
                  
                  {/* Search and Date Filter */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search by name, ID, or status..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 h-9 text-sm"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="date"
                        value={dateFilter.start}
                        onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                        className="h-9 text-sm w-[130px]"
                        placeholder="Start date"
                      />
                      <span className="text-muted-foreground text-sm">to</span>
                      <Input
                        type="date"
                        value={dateFilter.end}
                        onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                        className="h-9 text-sm w-[130px]"
                        placeholder="End date"
                      />
                      {(dateFilter.start || dateFilter.end) && (
                        <Button variant="ghost" size="sm" onClick={clearDateFilter} className="h-9 px-2">
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-border/50">
                        <th className="text-left p-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-16">Priority</th>
                        <th className="text-left p-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Customer</th>
                        <th className="text-left p-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Amount</th>
                        <th className="text-left p-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Time Pressure</th>
                        <th className="text-left p-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="text-right p-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {isDataLoading ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-muted-foreground">
                            <div className="flex items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                              Loading cases from database...
                            </div>
                          </td>
                        </tr>
                      ) : filteredCustomers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-muted-foreground">
                            {data?.cases?.length === 0 ? "No cases found in the database" : "No customers match your search criteria"}
                          </td>
                        </tr>
                      ) : (
                        filteredCustomers.map((customer) => (
                        <Tooltip key={customer.id}>
                          <TooltipTrigger asChild>
                            <tr className={`group transition-colors cursor-pointer ${
                              customer.priority === "high" ? "bg-rose-50/30 hover:bg-rose-50/50" :
                              customer.priority === "medium" ? "hover:bg-amber-50/30" :
                              "hover:bg-slate-50/50"
                            }`}>
                              <td className="p-3">
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                                  customer.priority === "high" ? "bg-rose-100 text-rose-700" :
                                  customer.priority === "medium" ? "bg-amber-100 text-amber-700" :
                                  "bg-blue-100 text-blue-700"
                                }`}>
                                  {customer.priority === "high" ? "🔴" : customer.priority === "medium" ? "🟠" : "🔵"}
                                </div>
                              </td>
                              <td className="p-3">
                                <p className="text-sm font-bold text-foreground">{customer.name}</p>
                                <p className="text-[10px] text-muted-foreground">Score: {customer.creditScore}</p>
                                {customer.allocatedTo && (
                                  <p className="text-[10px] text-primary font-medium">→ {customer.allocatedTo}</p>
                                )}
                              </td>
                              <td className="p-3">
                                <p className="text-sm font-bold text-foreground">{customer.amount}</p>
                              </td>
                              <td className="p-3">
                                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${
                                  customer.timeLeft === "Breached" ? "bg-rose-100 text-rose-700 animate-pulse" :
                                  customer.timeLeft.includes("h") ? "bg-amber-100 text-amber-700" :
                                  "bg-slate-100 text-slate-600"
                                }`}>
                                  <Timer className="h-3 w-3" />
                                  {customer.timeLeft}
                                </div>
                              </td>
                              <td className="p-3">
                                <Badge className={`text-[10px] font-bold ${
                                  customer.status === "Critical" || customer.status === "Legal Escalation" ? "bg-rose-100 text-rose-700 border-rose-200" :
                                  customer.status === "High Risk" ? "bg-amber-100 text-amber-700 border-amber-200" :
                                  customer.status === "Medium Risk" || customer.status === "Negotiating" ? "bg-sky-100 text-sky-700 border-sky-200" :
                                  customer.status === "Allocated" || customer.status === "Fast Track" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                                  "bg-emerald-100 text-emerald-700 border-emerald-200"
                                }`}>
                                  {customer.status}
                                </Badge>
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {customer.status === "Legal Escalation" || customer.status === "Allocated" || customer.status === "Fast Track" ? (
                                    <span className="text-[10px] text-muted-foreground italic">Action taken</span>
                                  ) : customer.priority === "high" ? (
                                    <>
                                      <Button 
                                        size="sm" 
                                        variant="destructive" 
                                        className="text-[10px] h-7 px-2 font-bold"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEscalateToLegal(customer);
                                        }}
                                      >
                                        <Gavel className="h-3 w-3 mr-1" />
                                        Legal
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        className="text-[10px] h-7 px-2 font-bold bg-amber-500 hover:bg-amber-600"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleBestDCA(customer);
                                        }}
                                      >
                                        <Zap className="h-3 w-3 mr-1" />
                                        Best DCA
                                      </Button>
                                    </>
                                  ) : customer.priority === "medium" ? (
                                    <Button 
                                      size="sm" 
                                      className="text-[10px] h-7 px-2 font-bold bg-blue-500 hover:bg-blue-600"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleTriggerNegotiation(customer);
                                      }}
                                    >
                                      <MessageSquare className="h-3 w-3 mr-1" />
                                      Negotiate
                                    </Button>
                                  ) : (
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAllocate(customer);
                                      }}
                                      className="text-[10px] h-7 px-2 font-bold"
                                    >
                                      Allocate
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-xs">
                            <div className="space-y-1">
                              <p className="font-bold">{customer.status}</p>
                              <p className="text-xs text-muted-foreground">
                                {customer.status === "Critical" 
                                  ? "Immediate action required. SLA breached or imminent." 
                                  : customer.status === "High Risk"
                                  ? "Payment behavior deteriorating. Escalation recommended."
                                  : customer.status === "Legal Escalation"
                                  ? "Case escalated to legal team for action."
                                  : customer.status === "Allocated" || customer.status === "Fast Track"
                                  ? `Assigned to ${customer.allocatedTo}`
                                  : "Standard recovery workflow in progress."}
                              </p>
                              <p className="text-xs">Days Overdue: {customer.daysOverdue}</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Escalation Radar */}
            <Card className="bg-white border-border shadow-sm">
              <CardHeader className="pb-2 border-b border-border/50">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Escalation Radar
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis 
                        dataKey="metric" 
                        tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }}
                      />
                      <PolarRadiusAxis 
                        angle={30} 
                        domain={[0, 100]} 
                        tick={{ fontSize: 8 }}
                        tickCount={4}
                      />
                      <Radar
                        name="Risk Level"
                        dataKey="value"
                        stroke="#f43f5e"
                        fill="#f43f5e"
                        fillOpacity={0.3}
                        strokeWidth={2}
                        animationBegin={0}
                        animationDuration={1500}
                        animationEasing="ease-out"
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 space-y-2">
                  {radarData.map((item) => (
                    <Tooltip key={item.metric}>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 p-1 rounded transition-colors">
                          <span className="text-muted-foreground font-medium">{item.metric}</span>
                          <span className={`font-bold ${
                            item.value >= 80 ? "text-rose-600" :
                            item.value >= 60 ? "text-amber-600" :
                            "text-emerald-600"
                          }`}>{item.value}%</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          {item.value >= 80 ? "Critical pressure - immediate action needed" :
                           item.value >= 60 ? "Elevated risk - monitor closely" :
                           "Within acceptable range"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Recent Activity and Top DCA Partners */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-border shadow-sm">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Recent Activity
                  <Badge variant="outline" className="ml-auto text-[10px] font-medium">
                    Live
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {activities.slice(0, 5).map((activity) => (
                    <Tooltip key={activity.id}>
                      <TooltipTrigger asChild>
                        <div 
                          onClick={() => handleActivityClick(activity)}
                          className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors group ${
                            activity.status === "critical" ? "bg-rose-50/50 hover:bg-rose-50" :
                            "hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`h-2.5 w-2.5 rounded-full ${
                              activity.status === "success" ? "bg-emerald-500" :
                              activity.status === "warning" ? "bg-amber-500" :
                              "bg-rose-500 animate-pulse"
                            }`} />
                            <div>
                              <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{activity.action}</p>
                              <p className="text-[10px] font-mono text-muted-foreground">{activity.caseName}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-muted-foreground">{activity.time}</span>
                            <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Click to view case details</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-border shadow-sm">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Top DCA Partners
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {(data?.dcaPerformance?.slice(0, 3).map(d => ({
                  name: d.agency.agencyName,
                  rate: d.recoveryRate,
                  cases: d.activeCases,
                })) || []).map((dca, idx) => (
                  <Tooltip key={idx}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 -mx-2 rounded-lg transition-colors">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-bold text-foreground">{dca.name}</span>
                            <span className="text-xs font-bold text-primary">{dca.rate}%</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden bg-slate-100">
                            <div 
                              className="h-full rounded-full bg-primary transition-all duration-1000" 
                              style={{ width: `${dca.rate}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{dca.cases} active cases</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
                {(!data?.dcaPerformance || data.dcaPerformance.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">No DCA partners data available</p>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Allocation Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" />
                  Allocate Customer
                </DialogTitle>
              </DialogHeader>
              {selectedCustomer && (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-slate-50 border border-border/50">
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Customer Details</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Name</p>
                        <p className="text-sm font-bold text-foreground">{selectedCustomer.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Amount</p>
                        <p className="text-sm font-bold text-foreground">{selectedCustomer.amount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Credit Score</p>
                        <p className="text-sm font-bold text-foreground">{selectedCustomer.creditScore}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Status</p>
                        <p className="text-sm font-bold text-foreground">{selectedCustomer.status}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Select DCA Partner</p>
                    <div className="space-y-2">
                      {dcas.map((dca) => (
                        <div 
                          key={dca.id}
                          onClick={() => setSelectedDCA(dca)}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all group ${
                            selectedDCA?.id === dca.id 
                              ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                              : "border-border/50 hover:border-primary/30 hover:bg-primary/[0.02]"
                          }`}
                        >
                          <div>
                            <p className={`text-sm font-bold transition-colors ${
                              selectedDCA?.id === dca.id ? "text-primary" : "text-foreground group-hover:text-primary"
                            }`}>{dca.name}</p>
                            <p className="text-xs text-muted-foreground">{dca.specialisation}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-primary">{dca.rate}%</span>
                            <div className="h-2 w-8 rounded-full bg-slate-100 overflow-hidden">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${dca.rate}%` }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      className="flex-1" 
                      onClick={handleConfirmAllocation}
                      disabled={!selectedDCA}
                    >
                      {selectedDCA ? `Allocate to ${selectedDCA.name}` : "Select a DCA"}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* KPI Drill-Down Sheet */}
          <Sheet open={isKPISheetOpen} onOpenChange={setIsKPISheetOpen}>
            <SheetContent className="sm:max-w-md">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {selectedKPI && (
                    <>
                      <selectedKPI.icon className={`h-5 w-5 ${
                        selectedKPI.importance === "critical" ? "text-rose-600" :
                        selectedKPI.importance === "warning" ? "text-amber-600" :
                        selectedKPI.importance === "healthy" ? "text-emerald-600" :
                        "text-primary"
                      }`} />
                      {selectedKPI.title}
                    </>
                  )}
                </SheetTitle>
              </SheetHeader>
              {selectedKPI && (
                <div className="mt-6 space-y-6">
                  {/* KPI Summary */}
                  <div className={`p-4 rounded-lg ${
                    selectedKPI.importance === "critical" ? "bg-rose-50 border border-rose-200" :
                    selectedKPI.importance === "warning" ? "bg-amber-50 border border-amber-200" :
                    selectedKPI.importance === "healthy" ? "bg-emerald-50 border border-emerald-200" :
                    "bg-slate-50 border border-slate-200"
                  }`}>
                    <p className={`text-3xl font-extrabold ${
                      selectedKPI.importance === "critical" ? "text-rose-700" :
                      selectedKPI.importance === "warning" ? "text-amber-700" :
                      selectedKPI.importance === "healthy" ? "text-emerald-700" :
                      "text-foreground"
                    }`}>{selectedKPI.value}</p>
                    <p className="text-sm text-muted-foreground mt-1">{selectedKPI.tooltip}</p>
                    <div className={`inline-flex items-center gap-1 mt-2 text-sm font-bold ${
                      selectedKPI.importance === "critical" ? "text-rose-600" :
                      selectedKPI.importance === "warning" ? "text-amber-600" :
                      "text-emerald-600"
                    }`}>
                      {selectedKPI.trend === "up" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                      {selectedKPI.change} from last period
                    </div>
                  </div>

                  {/* Breakdown */}
                  <div>
                    <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Breakdown</h4>
                    <div className="space-y-3">
                      {kpiBreakdowns[selectedKPI.title]?.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-border/50">
                          <span className="text-sm font-medium text-foreground">{item.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">{item.value}</span>
                            {item.trend && (
                              <span className={`text-xs font-bold ${
                                item.trend.startsWith("+") ? "text-rose-600" : 
                                item.trend.startsWith("-") ? "text-emerald-600" : 
                                "text-slate-500"
                              }`}>{item.trend}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      setIsKPISheetOpen(false);
                      if (selectedKPI.importance === "critical") {
                        router.push("/sla-monitoring");
                      } else if (selectedKPI.title.includes("Risk")) {
                        router.push("/ai-insights");
                      } else {
                        router.push("/dca-performance");
                      }
                    }}
                  >
                    View Full Report
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </DashboardLayout>
    </TooltipProvider>
  );
}
