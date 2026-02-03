"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  BarChart3,
  TrendingUp,
  TrendingDown,
  Trophy,
  Target,
  Clock,
  DollarSign,
  Users,
  Award,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Download,
  Shield,
  ArrowRight,
  Star,
  Info,
  Zap,
  XCircle,
  Search,
  Filter,
  MoreVertical,
  Phone,
  Mail,
  Eye,
  RefreshCw,
  Pause,
  Play,
  FileText,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  Send,
  Flag,
  MessageSquare,
  Settings,
  Printer,
  Share2,
  Copy,
  Scale,
  LayoutGrid,
  LayoutList,
  Minus,
  ArrowUpDown,
  ExternalLink,
  History,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import { useAppData } from "@/lib/data/app-data-context";

// Types
interface DCA {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalCases: number;
  activeCases: number;
  recovered: number;
  recoveryRate: number;
  slaCompliance: number;
  avgResolutionDays: number;
  totalRecovered: number;
  trend: "up" | "down" | "stable";
  rank: number;
  importance: "healthy" | "attention" | "warning" | "critical";
  status: "active" | "paused" | "flagged";
  specialization: "commercial" | "consumer" | "both";
  performanceTarget: number;
  notes: string;
  joinedDate: string;
  lastContact: string;
  weeklyTrend: number[];
  improvementDeadline?: string;
}

interface FunnelStage {
  id: string;
  stage: string;
  name: string;
  cases: number;
  recovered: number;
  value: string;
  valueNum: number;
  importance: "healthy" | "attention" | "warning" | "critical";
}

interface ActivityLog {
  id: string;
  action: string;
  dcaId: string;
  dcaName: string;
  user: string;
  timestamp: string;
}

// Initial empty state - populated from backend
const initialDCAs: DCA[] = [];

// Empty initial - computed from backend data
const initialFunnelStages: FunnelStage[] = [];

// Priority cases loaded from backend
const initialPriorityCases: { id: string; debtor: string; amount: number; type: string; priority: string }[] = [];

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

        <Skeleton className="h-20 w-full" />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>

        <Skeleton className="h-12 w-full" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
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
        <Users className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No DCAs Found</h3>
      <p className="text-muted-foreground mb-4 max-w-md">{message}</p>
      <Button onClick={onRefresh} variant="outline">
        <RefreshCw className="h-4 w-4 mr-2" />
        Refresh Data
      </Button>
    </div>
  );
}

// Mini Sparkline Component
function Sparkline({ data, color = "text-primary" }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  return (
    <div className="flex items-end gap-0.5 h-6">
      {data.map((value, i) => (
        <div
          key={i}
          className={`w-1 rounded-sm ${color.replace("text-", "bg-")}`}
          style={{ height: `${((value - min) / range) * 100}%`, minHeight: "4px" }}
        />
      ))}
    </div>
  );
}

// Helper Functions
function getImportanceStyles(importance: string) {
  switch (importance) {
    case "critical":
      return {
        row: "bg-rose-50/50 border-l-4 border-l-rose-500",
        badge: "bg-rose-100 text-rose-700 border-rose-200",
        indicator: "🔴",
      };
    case "warning":
      return {
        row: "bg-amber-50/30 border-l-4 border-l-amber-500",
        badge: "bg-amber-100 text-amber-700 border-amber-200",
        indicator: "🟠",
      };
    case "attention":
      return {
        row: "bg-blue-50/20 border-l-2 border-l-blue-400",
        badge: "bg-blue-100 text-blue-700 border-blue-200",
        indicator: "🔵",
      };
    case "healthy":
      return {
        row: "bg-emerald-50/10 border-l-2 border-l-emerald-400",
        badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
        indicator: "🟢",
      };
    default:
      return {
        row: "bg-white",
        badge: "bg-slate-100 text-slate-600 border-slate-200",
        indicator: "⚪",
      };
  }
}

function getRecoveryColor(rate: number) {
  if (rate >= 80) return { bg: "bg-emerald-500", text: "text-emerald-600" };
  if (rate >= 75) return { bg: "bg-blue-500", text: "text-blue-600" };
  if (rate >= 70) return { bg: "bg-amber-500", text: "text-amber-600" };
  return { bg: "bg-rose-500", text: "text-rose-600" };
}

function getSlaColor(rate: number) {
  if (rate >= 90) return { icon: CheckCircle2, color: "text-emerald-600" };
  if (rate >= 85) return { icon: AlertTriangle, color: "text-amber-600" };
  return { icon: XCircle, color: "text-rose-600" };
}

export default function DCAPerformancePage() {
  // Backend data integration
  const { data, isLoading: isDataLoading, refresh: refreshData } = useAppData();

  // Loading State
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Data State
  const [dcas, setDcas] = useState<DCA[]>(initialDCAs);
  const [funnelStages, setFunnelStages] = useState<FunnelStage[]>(initialFunnelStages);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);

  // Compute funnel stages from cases
  useEffect(() => {
    if (data?.cases && data.cases.length > 0) {
      const cases = data.cases;
      
      // Group by aging days to create funnel stages
      const early = cases.filter(c => c.agingDays <= 30);
      const intensive = cases.filter(c => c.agingDays > 30 && c.agingDays <= 60);
      const legal = cases.filter(c => c.agingDays > 60 && c.agingDays <= 90);
      const final = cases.filter(c => c.agingDays > 90);
      
      const sumAmount = (arr: typeof cases) => arr.reduce((sum, c) => sum + parseFloat(c.overdueAmount), 0);
      const formatValue = (amount: number) => amount >= 1000000 ? `$${(amount / 1000000).toFixed(1)}M` : `$${(amount / 1000).toFixed(0)}K`;
      const countResolved = (arr: typeof cases) => arr.filter(c => c.status === "resolved").length;
      
      const computedFunnel: FunnelStage[] = [
        { id: "1", stage: "Stage 1", name: "Early Recovery (0-30 days)", cases: early.length, recovered: countResolved(early), value: formatValue(sumAmount(early)), valueNum: sumAmount(early), importance: "healthy" as const },
        { id: "2", stage: "Stage 2", name: "Intensive Recovery (31-60 days)", cases: intensive.length, recovered: countResolved(intensive), value: formatValue(sumAmount(intensive)), valueNum: sumAmount(intensive), importance: "attention" as const },
        { id: "3", stage: "Stage 3", name: "Legal Recovery (61-90 days)", cases: legal.length, recovered: countResolved(legal), value: formatValue(sumAmount(legal)), valueNum: sumAmount(legal), importance: "warning" as const },
        { id: "4", stage: "Stage 4", name: "Final Recovery (90+ days)", cases: final.length, recovered: countResolved(final), value: formatValue(sumAmount(final)), valueNum: sumAmount(final), importance: "critical" as const },
      ];
      
      setFunnelStages(computedFunnel);
    }
  }, [data?.cases]);

  // Compute priority cases from backend
  const priorityCases = useMemo(() => {
    if (!data?.cases) return initialPriorityCases;
    return data.cases
      .filter(c => c.priority === "critical" || c.priority === "high")
      .slice(0, 10)
      .map(c => ({
        id: c.caseNumber,
        debtor: c.customer?.name || "Unknown",
        amount: parseFloat(c.overdueAmount),
        type: parseFloat(c.overdueAmount) > 50000 ? "commercial" : "consumer",
        priority: c.priority.toLowerCase(),
      }));
  }, [data?.cases]);

  // Transform backend data when available
  useEffect(() => {
    if (data?.dcaPerformance && data.dcaPerformance.length > 0) {
      const transformedDcas: DCA[] = data.dcaPerformance.map((d, index) => ({
        id: d.agency.id.toString(),
        name: d.agency.agencyName,
        email: d.agency.contactEmail || "",
        phone: d.agency.contactPhone || "",
        totalCases: d.totalCases,
        activeCases: d.activeCases,
        recovered: d.resolvedCases,
        recoveryRate: d.recoveryRate,
        slaCompliance: d.slaCompliance,
        avgResolutionDays: d.avgResolutionDays,
        totalRecovered: d.totalRecovered,
        trend: d.trend,
        rank: d.rank,
        importance: d.recoveryRate > 80 ? "healthy" as const : d.recoveryRate > 60 ? "attention" as const : d.recoveryRate > 40 ? "warning" as const : "critical" as const,
        status: d.agency.status === "active" ? "active" as const : d.agency.status === "suspended" ? "flagged" as const : "paused" as const,
        specialization: (d.agency.specialization?.toLowerCase() || "both") as "commercial" | "consumer" | "both",
        performanceTarget: parseFloat(d.agency.performanceTarget || "80"),
        notes: d.agency.notes || "",
        joinedDate: d.agency.joinedDate || d.agency.createdAt,
        isFlagged: d.agency.status === "suspended",
        flagReason: d.agency.status === "suspended" ? "Under review" : undefined,
        priorityCases: [],
        lastContact: new Date().toISOString().split("T")[0],
        weeklyTrend: [d.recoveryRate * 0.9, d.recoveryRate * 0.95, d.recoveryRate * 0.98, d.recoveryRate, d.recoveryRate * 1.02],
      }));
      setDcas(transformedDcas);
    }
  }, [data?.dcaPerformance]);

  // Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [specializationFilter, setSpecializationFilter] = useState<string>("all");

  // Sort State
  const [sortField, setSortField] = useState<keyof DCA>("rank");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Selection State
  const [selectedDCAs, setSelectedDCAs] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // View State
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [compactMode, setCompactMode] = useState(false);

  // Dialog State
  const [selectedDCA, setSelectedDCA] = useState<DCA | null>(null);
  const [showDCADetails, setShowDCADetails] = useState(false);
  const [showReallocateDialog, setShowReallocateDialog] = useState(false);
  const [showTargetDialog, setShowTargetDialog] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showFlagDialog, setShowFlagDialog] = useState(false);
  const [showDeadlineDialog, setShowDeadlineDialog] = useState(false);
  const [showCompareDialog, setShowCompareDialog] = useState(false);
  const [showAssignCasesDialog, setShowAssignCasesDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showHistorySheet, setShowHistorySheet] = useState(false);
  const [showFunnelDetailDialog, setShowFunnelDetailDialog] = useState(false);
  const [showLeaderboardSheet, setShowLeaderboardSheet] = useState(false);
  const [showWorkloadDialog, setShowWorkloadDialog] = useState(false);
  const [showCardDrillDown, setShowCardDrillDown] = useState<string | null>(null);

  // Form State
  const [reallocateTarget, setReallocateTarget] = useState("");
  const [reallocateCases, setReallocateCases] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactType, setContactType] = useState<"email" | "phone">("email");
  const [flagReason, setFlagReason] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [compareDCAs, setCompareDCAs] = useState<string[]>([]);
  const [selectedPriorityCases, setSelectedPriorityCases] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<"csv" | "xlsx" | "pdf">("csv");
  const [selectedFunnelStage, setSelectedFunnelStage] = useState<FunnelStage | null>(null);
  const [funnelDcaFilter, setFunnelDcaFilter] = useState<string>("all");
  const [dcaNote, setDcaNote] = useState("");

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
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Add activity log entry
  const addActivity = useCallback((action: string, dcaId: string, dcaName: string) => {
    const newActivity: ActivityLog = {
      id: Date.now().toString(),
      action,
      dcaId,
      dcaName,
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
  const handleSort = (field: keyof DCA) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter DCAs
  const filteredDCAs = dcas.filter((dca) => {
    const matchesSearch =
      searchQuery === "" ||
      dca.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dca.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTier = tierFilter === "all" || 
      (tierFilter === "top" && dca.recoveryRate >= 80) ||
      (tierFilter === "average" && dca.recoveryRate >= 70 && dca.recoveryRate < 80) ||
      (tierFilter === "underperformer" && dca.recoveryRate < 70);
    
    const matchesStatus = statusFilter === "all" || dca.status === statusFilter;
    const matchesSpec = specializationFilter === "all" || dca.specialization === specializationFilter;

    return matchesSearch && matchesTier && matchesStatus && matchesSpec;
  });

  // Sort DCAs
  const sortedDCAs = [...filteredDCAs].sort((a, b) => {
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
  const totalPages = Math.ceil(sortedDCAs.length / itemsPerPage);
  const paginatedDCAs = sortedDCAs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Selection handlers
  const handleSelectDCA = (dcaId: string) => {
    setSelectedDCAs((prev) =>
      prev.includes(dcaId) ? prev.filter((id) => id !== dcaId) : [...prev, dcaId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedDCAs([]);
    } else {
      setSelectedDCAs(paginatedDCAs.map((d) => d.id));
    }
    setSelectAll(!selectAll);
  };

  // Action handlers
  const handleViewDetails = (dca: DCA) => {
    setSelectedDCA(dca);
    setShowDCADetails(true);
  };

  const handleReallocate = () => {
    if (!selectedDCA || !reallocateTarget || !reallocateCases) return;
    
    const targetDCA = dcas.find(d => d.id === reallocateTarget);
    if (!targetDCA) return;

    const casesToMove = parseInt(reallocateCases);
    
    setDcas(prev => prev.map(d => {
      if (d.id === selectedDCA.id) {
        return { ...d, activeCases: d.activeCases - casesToMove };
      }
      if (d.id === reallocateTarget) {
        return { ...d, activeCases: d.activeCases + casesToMove };
      }
      return d;
    }));

    addActivity(`Reallocated ${casesToMove} cases to ${targetDCA.name}`, selectedDCA.id, selectedDCA.name);
    toast.success(`${casesToMove} cases reallocated to ${targetDCA.name}`);
    setShowReallocateDialog(false);
    setReallocateTarget("");
    setReallocateCases("");
    setSelectedDCA(null);
  };

  const handleSetTarget = () => {
    if (!selectedDCA || !newTarget) return;
    
    setDcas(prev => prev.map(d => 
      d.id === selectedDCA.id ? { ...d, performanceTarget: parseInt(newTarget) } : d
    ));
    
    addActivity(`Set performance target to ${newTarget}%`, selectedDCA.id, selectedDCA.name);
    toast.success(`Performance target set to ${newTarget}% for ${selectedDCA.name}`);
    setShowTargetDialog(false);
    setNewTarget("");
    setSelectedDCA(null);
  };

  const handleContact = () => {
    if (!selectedDCA) return;
    
    if (contactType === "email") {
      window.location.href = `mailto:${selectedDCA.email}?subject=DCA Performance Review&body=${encodeURIComponent(contactMessage)}`;
    } else {
      window.location.href = `tel:${selectedDCA.phone}`;
    }
    
    setDcas(prev => prev.map(d => 
      d.id === selectedDCA.id ? { ...d, lastContact: new Date().toISOString().split("T")[0] } : d
    ));
    
    addActivity(`Contacted via ${contactType}`, selectedDCA.id, selectedDCA.name);
    toast.success(`Contact initiated with ${selectedDCA.name}`);
    setShowContactDialog(false);
    setContactMessage("");
    setSelectedDCA(null);
  };

  const handleFlag = () => {
    if (!selectedDCA || !flagReason) return;
    
    setDcas(prev => prev.map(d => 
      d.id === selectedDCA.id ? { ...d, status: "flagged" as const, notes: d.notes + `\nFlagged: ${flagReason}` } : d
    ));
    
    addActivity(`Flagged for review: ${flagReason}`, selectedDCA.id, selectedDCA.name);
    toast.success(`${selectedDCA.name} flagged for review`);
    setShowFlagDialog(false);
    setFlagReason("");
    setSelectedDCA(null);
  };

  const handleSetDeadline = () => {
    if (!selectedDCA || !deadlineDate) return;
    
    setDcas(prev => prev.map(d => 
      d.id === selectedDCA.id ? { ...d, improvementDeadline: deadlineDate } : d
    ));
    
    addActivity(`Improvement deadline set: ${deadlineDate}`, selectedDCA.id, selectedDCA.name);
    toast.success(`Improvement deadline set for ${selectedDCA.name}`);
    setShowDeadlineDialog(false);
    setDeadlineDate("");
    setSelectedDCA(null);
  };

  const handlePauseResume = (dca: DCA) => {
    const newStatus = dca.status === "paused" ? "active" : "paused";
    
    setDcas(prev => prev.map(d => 
      d.id === dca.id ? { ...d, status: newStatus as "active" | "paused" | "flagged" } : d
    ));
    
    addActivity(`${newStatus === "paused" ? "Paused" : "Resumed"} case assignments`, dca.id, dca.name);
    toast.success(`${dca.name} ${newStatus === "paused" ? "paused" : "resumed"}`);
  };

  const handleRemoveFromRotation = (dca: DCA) => {
    setDcas(prev => prev.map(d => 
      d.id === dca.id ? { ...d, status: "paused" as const } : d
    ));
    
    addActivity("Removed from case rotation", dca.id, dca.name);
    toast.success(`${dca.name} removed from rotation`);
  };

  const handleAssignPriorityCases = () => {
    if (!selectedDCA || selectedPriorityCases.length === 0) return;
    
    setDcas(prev => prev.map(d => 
      d.id === selectedDCA.id ? { ...d, activeCases: d.activeCases + selectedPriorityCases.length } : d
    ));
    
    addActivity(`Assigned ${selectedPriorityCases.length} priority cases`, selectedDCA.id, selectedDCA.name);
    toast.success(`${selectedPriorityCases.length} priority cases assigned to ${selectedDCA.name}`);
    setShowAssignCasesDialog(false);
    setSelectedPriorityCases([]);
    setSelectedDCA(null);
  };

  const handleAddNote = () => {
    if (!selectedDCA || !dcaNote) return;
    
    setDcas(prev => prev.map(d => 
      d.id === selectedDCA.id ? { ...d, notes: d.notes + `\n${new Date().toLocaleDateString()}: ${dcaNote}` } : d
    ));
    
    addActivity(`Added note: ${dcaNote.substring(0, 50)}...`, selectedDCA.id, selectedDCA.name);
    toast.success("Note added successfully");
    setDcaNote("");
  };

  const handleExport = () => {
    const dataToExport = selectedDCAs.length > 0 
      ? dcas.filter(d => selectedDCAs.includes(d.id))
      : filteredDCAs;

    const headers = ["Name", "Recovery Rate", "SLA Compliance", "Active Cases", "Total Recovered", "Status", "Specialization"];
    const csvContent = [
      headers.join(","),
      ...dataToExport.map(d =>
        [d.name, `${d.recoveryRate}%`, `${d.slaCompliance}%`, d.activeCases, `$${d.totalRecovered}M`, d.status, d.specialization].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dca-performance-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    addActivity(`Exported ${dataToExport.length} DCAs to ${exportFormat.toUpperCase()}`, "system", "System");
    toast.success(`Exported ${dataToExport.length} DCAs`);
    setShowExportDialog(false);
  };

  const handlePrint = () => {
    window.print();
    toast.success("Print dialog opened");
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  const clearFilters = () => {
    setSearchQuery("");
    setTierFilter("all");
    setStatusFilter("all");
    setSpecializationFilter("all");
    setCurrentPage(1);
  };

  // Statistics
  const stats = {
    totalDCAs: dcas.length,
    activeDCAs: dcas.filter(d => d.status === "active").length,
    avgRecoveryRate: Math.round(dcas.reduce((sum, d) => sum + d.recoveryRate, 0) / dcas.length * 10) / 10,
    totalRecovered: dcas.reduce((sum, d) => sum + d.totalRecovered, 0).toFixed(1),
    avgSLA: Math.round(dcas.reduce((sum, d) => sum + d.slaCompliance, 0) / dcas.length * 10) / 10,
    criticalCount: dcas.filter(d => d.importance === "critical").length,
    warningCount: dcas.filter(d => d.importance === "warning").length,
    topPerformers: dcas.filter(d => d.recoveryRate >= 80).length,
    underperformers: dcas.filter(d => d.recoveryRate < 70).length,
  };

  // Get best DCA for case type
  const getBestForType = (type: "commercial" | "consumer") => {
    return dcas
      .filter(d => d.specialization === type || d.specialization === "both")
      .sort((a, b) => b.recoveryRate - a.recoveryRate)[0];
  };

  // Efficiency score calculation
  const getEfficiencyScore = (dca: DCA) => {
    const recoveryWeight = 0.4;
    const slaWeight = 0.3;
    const speedWeight = 0.3;
    const speedScore = Math.max(0, 100 - (dca.avgResolutionDays - 25) * 2);
    return Math.round(dca.recoveryRate * recoveryWeight + dca.slaCompliance * slaWeight + speedScore * speedWeight);
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <TooltipProvider>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                DCA Performance
              </h1>
              <p className="text-sm text-muted-foreground font-medium">
                Comparative analysis • Last updated: {lastRefresh.toLocaleTimeString()}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLeaderboardSheet(true)}
              >
                <Trophy className="h-4 w-4 mr-2" />
                Leaderboard
              </Button>
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
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrint}
              >
                <Printer className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="flex gap-4 overflow-x-auto pb-2 bg-muted/30 rounded-lg p-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-background rounded-md">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{stats.activeDCAs} Active DCAs</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-background rounded-md">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{stats.avgRecoveryRate}% Avg Recovery</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-background rounded-md">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium">${stats.totalRecovered}M Recovered</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-background rounded-md">
              <CheckCircle2 className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">{stats.avgSLA}% SLA</span>
            </div>
            {stats.criticalCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-100 rounded-md">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-red-700">{stats.criticalCount} Critical</span>
              </div>
            )}
          </div>

          {/* Performance Overview Cards with Drill-Down */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card 
              className="bg-white border-border hover:shadow-md transition-all cursor-pointer"
              onClick={() => setShowCardDrillDown("dcas")}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-green-500 font-medium">+2</span>
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-foreground">{stats.totalDCAs}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Total DCAs Active</p>
                <div className="mt-2">
                  <Sparkline data={[4, 4, 5, 5, 5, 6, 6]} color="text-slate-400" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="bg-white border-border hover:shadow-md transition-all cursor-pointer"
              onClick={() => setShowCardDrillDown("recovery")}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Target className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-green-500 font-medium">+1.2%</span>
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-foreground">{stats.avgRecoveryRate}%</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Avg Recovery Rate</p>
                <div className="mt-2">
                  <Sparkline data={[72, 73, 74, 74, 75, 75.5, 75.8]} color="text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="border-l-4 border-l-emerald-500 bg-emerald-50/30 hover:shadow-md transition-all cursor-pointer"
              onClick={() => setShowCardDrillDown("recovered")}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-green-500 font-medium">+$1.2M</span>
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-emerald-700">${stats.totalRecovered}M</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Recovered (MTD)</p>
                <div className="mt-2">
                  <Sparkline data={[12, 13, 13.5, 14, 14.5, 15, 15.4]} color="text-emerald-500" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`hover:shadow-md transition-all cursor-pointer ${
                stats.warningCount + stats.criticalCount > 0 
                  ? "border-l-4 border-l-amber-500 bg-amber-50/30" 
                  : "bg-white border-border"
              }`}
              onClick={() => setShowCardDrillDown("sla")}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    stats.warningCount + stats.criticalCount > 0 
                      ? "bg-amber-100 text-amber-600" 
                      : "bg-slate-100 text-slate-600"
                  }`}>
                    <Clock className="h-5 w-5" />
                  </div>
                  {(stats.warningCount + stats.criticalCount) > 0 && (
                    <Badge className="bg-amber-100 text-amber-700 text-[10px] font-bold">
                      {stats.warningCount + stats.criticalCount} Below Target
                    </Badge>
                  )}
                </div>
                <p className={`text-2xl font-extrabold ${
                  stats.warningCount + stats.criticalCount > 0 ? "text-amber-700" : "text-foreground"
                }`}>{stats.avgSLA}%</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Avg SLA Compliance</p>
                <div className="mt-2">
                  <Sparkline data={[86, 87, 87.5, 88, 88, 88.5, 88.4]} color="text-amber-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search DCAs by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Select value={tierFilter} onValueChange={setTierFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Performance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tiers</SelectItem>
                      <SelectItem value="top">Top Performers (≥80%)</SelectItem>
                      <SelectItem value="average">Average (70-79%)</SelectItem>
                      <SelectItem value="underperformer">Underperformers (&lt;70%)</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="flagged">Flagged</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={specializationFilter} onValueChange={setSpecializationFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="consumer">Consumer</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-1 border rounded-md">
                    <Button
                      variant={viewMode === "table" ? "secondary" : "ghost"}
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setViewMode("table")}
                    >
                      <LayoutList className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "grid" ? "secondary" : "ghost"}
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setViewMode("grid")}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                  </div>

                  <Button
                    variant={compactMode ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setCompactMode(!compactMode)}
                  >
                    <Minus className="h-4 w-4 mr-1" />
                    Compact
                  </Button>

                  <Button variant="outline" size="icon" onClick={clearFilters}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Active Filters */}
              {(tierFilter !== "all" || statusFilter !== "all" || specializationFilter !== "all" || searchQuery) && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {searchQuery && (
                    <Badge variant="secondary" className="gap-1">
                      Search: {searchQuery}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery("")} />
                    </Badge>
                  )}
                  {tierFilter !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      Tier: {tierFilter}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setTierFilter("all")} />
                    </Badge>
                  )}
                  {statusFilter !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      Status: {statusFilter}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setStatusFilter("all")} />
                    </Badge>
                  )}
                  {specializationFilter !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      Type: {specializationFilter}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setSpecializationFilter("all")} />
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bulk Actions Bar */}
          {selectedDCAs.length > 0 && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={selectAll} onCheckedChange={handleSelectAll} />
                    <span className="font-medium">{selectedDCAs.length} DCA(s) selected</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCompareDCAs(selectedDCAs.slice(0, 3));
                        setShowCompareDialog(true);
                      }}
                      disabled={selectedDCAs.length < 2 || selectedDCAs.length > 3}
                    >
                      <Scale className="h-4 w-4 mr-2" />
                      Compare
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)}>
                      <Download className="h-4 w-4 mr-2" />
                      Export Selected
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setSelectedDCAs([]); setSelectAll(false); }}>
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Agency Performance Matrix */}
            <Card className="lg:col-span-2 bg-white border-border shadow-sm overflow-hidden">
              <CardHeader className="pb-4 border-b border-border/50 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Agency Performance Matrix
                    {stats.criticalCount > 0 && (
                      <Badge className="bg-rose-100 text-rose-700 border-rose-200 text-[10px] font-bold ml-2">
                        {stats.criticalCount} Critical
                      </Badge>
                    )}
                  </CardTitle>
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold">
                    Last 30 Days
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {paginatedDCAs.length === 0 ? (
                  <EmptyState
                    message="No DCAs match your current filters. Try adjusting your search criteria."
                    onRefresh={clearFilters}
                  />
                ) : viewMode === "table" ? (
                  <>
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow className="border-border hover:bg-transparent">
                          <TableHead className="w-10">
                            <Checkbox checked={selectAll} onCheckedChange={handleSelectAll} />
                          </TableHead>
                          <TableHead className="text-muted-foreground font-extrabold text-[10px] uppercase py-4 w-12">
                            Status
                          </TableHead>
                          <TableHead 
                            className="text-muted-foreground font-extrabold text-[10px] uppercase py-4 cursor-pointer hover:bg-slate-100"
                            onClick={() => handleSort("name")}
                          >
                            <div className="flex items-center gap-1">
                              Agency
                              {sortField === "name" && (sortDirection === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="text-muted-foreground font-extrabold text-[10px] uppercase py-4 text-center cursor-pointer hover:bg-slate-100"
                            onClick={() => handleSort("recoveryRate")}
                          >
                            <div className="flex items-center justify-center gap-1">
                              Recovery
                              {sortField === "recoveryRate" && (sortDirection === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                            </div>
                          </TableHead>
                          <TableHead className="text-muted-foreground font-extrabold text-[10px] uppercase py-4 text-center">
                            SLA
                          </TableHead>
                          <TableHead className="text-muted-foreground font-extrabold text-[10px] uppercase py-4 text-center">
                            Efficiency
                          </TableHead>
                          <TableHead className="text-muted-foreground font-extrabold text-[10px] uppercase py-4 text-center">
                            Trend
                          </TableHead>
                          <TableHead className="text-muted-foreground font-extrabold text-[10px] uppercase py-4 text-right">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedDCAs.map((dca, idx) => {
                          const styles = getImportanceStyles(dca.importance);
                          const recoveryColor = getRecoveryColor(dca.recoveryRate);
                          const slaStatus = getSlaColor(dca.slaCompliance);
                          const SlaIcon = slaStatus.icon;
                          const efficiencyScore = getEfficiencyScore(dca);

                          return (
                            <TableRow 
                              key={dca.id} 
                              className={`border-border hover:bg-slate-50/50 transition-colors ${styles.row} ${
                                selectedDCAs.includes(dca.id) ? "bg-primary/5" : ""
                              } ${compactMode ? "h-12" : ""}`}
                            >
                              <TableCell className={compactMode ? "py-2" : "py-4"}>
                                <Checkbox
                                  checked={selectedDCAs.includes(dca.id)}
                                  onCheckedChange={() => handleSelectDCA(dca.id)}
                                />
                              </TableCell>
                              <TableCell className={compactMode ? "py-2" : "py-4"}>
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{styles.indicator}</span>
                                  {dca.rank === 1 && <Trophy className="h-4 w-4 text-amber-500" />}
                                  {dca.status === "paused" && <Pause className="h-3 w-3 text-muted-foreground" />}
                                  {dca.status === "flagged" && <Flag className="h-3 w-3 text-red-500" />}
                                </div>
                              </TableCell>
                              <TableCell className={compactMode ? "py-2" : "py-4"}>
                                <button
                                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                                  onClick={() => handleViewDetails(dca)}
                                >
                                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold border ${
                                    dca.importance === "critical" 
                                      ? "bg-rose-100 text-rose-700 border-rose-200" 
                                      : dca.importance === "warning"
                                        ? "bg-amber-100 text-amber-700 border-amber-200"
                                        : "bg-primary/10 text-primary border-primary/10"
                                  }`}>
                                    {dca.name.charAt(0)}
                                  </div>
                                  <div className="text-left">
                                    <p className={`text-sm font-bold ${dca.importance === "critical" ? "text-rose-700" : "text-foreground"}`}>
                                      {dca.name}
                                    </p>
                                    {!compactMode && (
                                      <p className="text-[10px] font-medium text-muted-foreground">
                                        {dca.activeCases} active • ${dca.totalRecovered}M recovered
                                      </p>
                                    )}
                                  </div>
                                </button>
                              </TableCell>
                              <TableCell className={`text-center ${compactMode ? "py-2" : "py-4"}`}>
                                <div className="flex flex-col items-center gap-1">
                                  <span className={`text-sm font-extrabold ${recoveryColor.text}`}>
                                    {dca.recoveryRate}%
                                  </span>
                                  {!compactMode && (
                                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                      <div className={`h-full ${recoveryColor.bg}`} style={{ width: `${dca.recoveryRate}%` }} />
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className={`text-center ${compactMode ? "py-2" : "py-4"}`}>
                                <div className="flex items-center justify-center gap-1">
                                  <SlaIcon className={`h-4 w-4 ${slaStatus.color}`} />
                                  <span className={`text-sm font-bold ${slaStatus.color}`}>
                                    {dca.slaCompliance}%
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className={`text-center ${compactMode ? "py-2" : "py-4"}`}>
                                <Badge variant="outline" className={`text-xs font-bold ${
                                  efficiencyScore >= 85 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                  efficiencyScore >= 75 ? "bg-blue-50 text-blue-700 border-blue-200" :
                                  efficiencyScore >= 65 ? "bg-amber-50 text-amber-700 border-amber-200" :
                                  "bg-red-50 text-red-700 border-red-200"
                                }`}>
                                  {efficiencyScore}
                                </Badge>
                              </TableCell>
                              <TableCell className={`text-center ${compactMode ? "py-2" : "py-4"}`}>
                                <Sparkline data={dca.weeklyTrend} color={
                                  dca.trend === "up" ? "text-green-500" :
                                  dca.trend === "down" ? "text-red-500" : "text-gray-400"
                                } />
                              </TableCell>
                              <TableCell className={`text-right ${compactMode ? "py-2" : "py-4"}`}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleViewDetails(dca)}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => {
                                      setSelectedDCA(dca);
                                      setShowContactDialog(true);
                                    }}>
                                      <Mail className="h-4 w-4 mr-2" />
                                      Contact DCA
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => {
                                      setSelectedDCA(dca);
                                      setShowReallocateDialog(true);
                                    }}>
                                      <ArrowUpDown className="h-4 w-4 mr-2" />
                                      Reallocate Cases
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => {
                                      setSelectedDCA(dca);
                                      setShowAssignCasesDialog(true);
                                    }}>
                                      <Briefcase className="h-4 w-4 mr-2" />
                                      Assign Priority Cases
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => {
                                      setSelectedDCA(dca);
                                      setNewTarget(dca.performanceTarget.toString());
                                      setShowTargetDialog(true);
                                    }}>
                                      <Target className="h-4 w-4 mr-2" />
                                      Set Target
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handlePauseResume(dca)}>
                                      {dca.status === "paused" ? (
                                        <>
                                          <Play className="h-4 w-4 mr-2" />
                                          Resume
                                        </>
                                      ) : (
                                        <>
                                          <Pause className="h-4 w-4 mr-2" />
                                          Pause
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => {
                                      setSelectedDCA(dca);
                                      setShowFlagDialog(true);
                                    }}>
                                      <Flag className="h-4 w-4 mr-2" />
                                      Flag for Review
                                    </DropdownMenuItem>
                                    {(dca.importance === "warning" || dca.importance === "critical") && (
                                      <DropdownMenuItem onClick={() => {
                                        setSelectedDCA(dca);
                                        setShowDeadlineDialog(true);
                                      }}>
                                        <Calendar className="h-4 w-4 mr-2" />
                                        Set Deadline
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    <div className="flex items-center justify-between p-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                        {Math.min(currentPage * itemsPerPage, sortedDCAs.length)} of {sortedDCAs.length} DCAs
                      </p>
                      <div className="flex items-center gap-2">
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
                      </div>
                    </div>
                  </>
                ) : (
                  /* Grid View */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                    {paginatedDCAs.map((dca) => {
                      const styles = getImportanceStyles(dca.importance);
                      const recoveryColor = getRecoveryColor(dca.recoveryRate);
                      const efficiencyScore = getEfficiencyScore(dca);

                      return (
                        <Card 
                          key={dca.id}
                          className={`cursor-pointer hover:shadow-md transition-all ${styles.row} ${
                            selectedDCAs.includes(dca.id) ? "ring-2 ring-primary" : ""
                          }`}
                          onClick={() => handleViewDetails(dca)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={selectedDCAs.includes(dca.id)}
                                  onCheckedChange={() => {
                                    handleSelectDCA(dca.id);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold border ${
                                  dca.importance === "critical" 
                                    ? "bg-rose-100 text-rose-700 border-rose-200" 
                                    : "bg-primary/10 text-primary border-primary/10"
                                }`}>
                                  {dca.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold">{dca.name}</p>
                                  <p className="text-xs text-muted-foreground">{dca.specialization}</p>
                                </div>
                              </div>
                              <span className="text-xl">{styles.indicator}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-4">
                              <div className="text-center p-2 bg-muted/50 rounded">
                                <p className={`text-lg font-bold ${recoveryColor.text}`}>{dca.recoveryRate}%</p>
                                <p className="text-[10px] text-muted-foreground">Recovery</p>
                              </div>
                              <div className="text-center p-2 bg-muted/50 rounded">
                                <p className="text-lg font-bold">{dca.slaCompliance}%</p>
                                <p className="text-[10px] text-muted-foreground">SLA</p>
                              </div>
                              <div className="text-center p-2 bg-muted/50 rounded">
                                <p className="text-lg font-bold">{efficiencyScore}</p>
                                <p className="text-[10px] text-muted-foreground">Efficiency</p>
                              </div>
                            </div>
                            <div className="mt-3">
                              <Sparkline data={dca.weeklyTrend} color={
                                dca.trend === "up" ? "text-green-500" :
                                dca.trend === "down" ? "text-red-500" : "text-gray-400"
                              } />
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Top Performers */}
              <Card className="bg-slate-900 border-slate-800 shadow-sm">
                <CardHeader className="pb-4 border-b border-slate-800">
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-400" />
                    Top Performers
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {dcas.sort((a, b) => b.recoveryRate - a.recoveryRate).slice(0, 3).map((performer, idx) => (
                      <div
                        key={performer.id}
                        className={`flex items-center gap-4 p-3 rounded-xl transition-all cursor-pointer hover:opacity-90 ${
                          idx === 0
                            ? "bg-amber-500/20 border border-amber-500/30"
                            : "bg-slate-800/50 border border-slate-700"
                        }`}
                        onClick={() => handleViewDetails(performer)}
                      >
                        <div className="flex items-center justify-center h-10 w-10 rounded-xl shrink-0">
                          {idx === 0 && <Trophy className="h-6 w-6 text-amber-400" />}
                          {idx === 1 && <Award className="h-6 w-6 text-slate-400" />}
                          {idx === 2 && <Star className="h-6 w-6 text-slate-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{performer.name}</p>
                          <p className="text-[10px] text-slate-400">${performer.totalRecovered}M recovered</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-extrabold text-emerald-400">{performer.recoveryRate}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <p className="text-xs text-slate-400 mb-2">Best for case types:</p>
                    <div className="flex gap-2">
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                        Commercial: {getBestForType("commercial")?.name.split(" ")[0]}
                      </Badge>
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                        Consumer: {getBestForType("consumer")?.name.split(" ")[0]}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Underperformers Alert */}
              {(stats.criticalCount + stats.warningCount) > 0 && (
                <Card className="border-l-4 border-l-rose-500 bg-rose-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold text-rose-700 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Underperforming DCAs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dcas
                      .filter(d => d.importance === "critical" || d.importance === "warning")
                      .map((dca) => (
                        <div
                          key={dca.id}
                          className={`p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-all ${
                            dca.importance === "critical" 
                              ? "bg-rose-100 border-rose-200" 
                              : "bg-amber-100 border-amber-200"
                          }`}
                          onClick={() => handleViewDetails(dca)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className={`text-sm font-bold ${
                                dca.importance === "critical" ? "text-rose-700" : "text-amber-700"
                              }`}>
                                {dca.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {dca.recoveryRate}% recovery • {dca.slaCompliance}% SLA
                              </p>
                            </div>
                            <Badge className={
                              dca.importance === "critical" 
                                ? "bg-rose-200 text-rose-800 text-[9px] font-bold" 
                                : "bg-amber-200 text-amber-800 text-[9px] font-bold"
                            }>
                              {dca.importance === "critical" ? "CRITICAL" : "AT RISK"}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-7 text-xs flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDCA(dca);
                                setShowReallocateDialog(true);
                              }}
                            >
                              Reallocate
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-7 text-xs flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDCA(dca);
                                setShowContactDialog(true);
                              }}
                            >
                              Contact
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-7 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFromRotation(dca);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          {dca.improvementDeadline && (
                            <p className="text-[10px] text-muted-foreground mt-2">
                              Deadline: {new Date(dca.improvementDeadline).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ))}
                    <Button 
                      className="w-full mt-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                      onClick={() => setShowWorkloadDialog(true)}
                    >
                      View Workload Balance
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Recovery Trend */}
              <Card className="bg-white border-border shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100">
                      <TrendingUp className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-muted-foreground uppercase">Avg Recovery Yield</p>
                      <p className="text-3xl font-extrabold text-foreground">{stats.avgRecoveryRate}%</p>
                    </div>
                  </div>
                  <Progress value={stats.avgRecoveryRate} className="h-2 bg-slate-100" />
                  <p className="text-[10px] text-muted-foreground mt-3 font-medium">
                    <span className="font-bold text-emerald-600">+1.2%</span> improvement since last quarter
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* DCA Recovery Funnel */}
          <Card className="bg-white border-border shadow-sm">
            <CardHeader className="pb-4 border-b border-border/50 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <ArrowRight className="h-5 w-5 text-primary" />
                  Recovery Funnel by Stage
                </CardTitle>
                <Select value={funnelDcaFilter} onValueChange={setFunnelDcaFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by DCA" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All DCAs</SelectItem>
                    {dcas.map(dca => (
                      <SelectItem key={dca.id} value={dca.id}>{dca.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {funnelStages.map((stage, idx) => {
                  const rate = (stage.recovered / stage.cases) * 100;
                  const rateColor = getRecoveryColor(rate);
                  const prevStage = idx > 0 ? funnelStages[idx - 1] : null;
                  const conversionRate = prevStage ? ((stage.cases / prevStage.cases) * 100).toFixed(1) : "100";
                  
                  return (
                    <Tooltip key={stage.id}>
                      <TooltipTrigger asChild>
                        <div
                          className={`relative p-4 rounded-xl border cursor-pointer hover:shadow-md transition-all ${
                            stage.importance === "critical" 
                              ? "border-l-4 border-l-rose-500 bg-rose-50/30" 
                              : stage.importance === "warning"
                                ? "border-l-4 border-l-amber-500 bg-amber-50/20"
                                : "border-border bg-white hover:border-primary/30"
                          }`}
                          onClick={() => {
                            setSelectedFunnelStage(stage);
                            setShowFunnelDetailDialog(true);
                          }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant="outline" className="text-[10px] font-bold">
                              {stage.stage}
                            </Badge>
                            <span className="text-sm">{idx === 3 ? "🔴" : idx === 2 ? "🟠" : "🔵"}</span>
                          </div>
                          <p className="text-sm font-bold text-foreground mb-3">{stage.name}</p>
                          
                          {/* Conversion Rate from previous stage */}
                          {idx > 0 && (
                            <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 bg-background border rounded-full px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                              {conversionRate}%
                            </div>
                          )}
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase">Active</span>
                              <span className="text-sm font-bold text-foreground">{stage.cases}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase">Recovered</span>
                              <span className={`text-sm font-bold ${rateColor.text}`}>{stage.recovered}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase">Value</span>
                              <span className="text-sm font-bold text-primary">{stage.value}</span>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${rateColor.bg} transition-all duration-1000`} 
                                style={{ width: `${rate}%` }} 
                              />
                            </div>
                            <p className={`text-[10px] mt-1 text-center font-bold ${rateColor.text}`}>
                              {rate.toFixed(1)}% recovery
                            </p>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          {stage.recovered} of {stage.cases} cases recovered at this stage
                          <br />
                          Click for detailed breakdown
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* DCA Details Sheet */}
          <Sheet open={showDCADetails} onOpenChange={setShowDCADetails}>
            <SheetContent className="w-[500px] sm:w-[600px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>DCA Profile - {selectedDCA?.name}</SheetTitle>
                <SheetDescription>
                  Complete agency information and performance history
                </SheetDescription>
              </SheetHeader>
              {selectedDCA && (
                <div className="space-y-6 mt-6">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-16 w-16 items-center justify-center rounded-xl text-xl font-bold border ${
                      selectedDCA.importance === "critical" 
                        ? "bg-rose-100 text-rose-700 border-rose-200" 
                        : "bg-primary/10 text-primary border-primary/10"
                    }`}>
                      {selectedDCA.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{selectedDCA.name}</h3>
                      <div className="flex gap-2 mt-1">
                        <Badge className={getImportanceStyles(selectedDCA.importance).badge}>
                          {selectedDCA.importance}
                        </Badge>
                        <Badge variant="outline">{selectedDCA.status}</Badge>
                        <Badge variant="outline">{selectedDCA.specialization}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Recovery Rate</p>
                      <p className={`text-2xl font-bold ${getRecoveryColor(selectedDCA.recoveryRate).text}`}>
                        {selectedDCA.recoveryRate}%
                      </p>
                      <p className="text-xs text-muted-foreground">Target: {selectedDCA.performanceTarget}%</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">SLA Compliance</p>
                      <p className="text-2xl font-bold">{selectedDCA.slaCompliance}%</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Active Cases</p>
                      <p className="text-2xl font-bold">{selectedDCA.activeCases}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Recovered</p>
                      <p className="text-2xl font-bold text-emerald-600">${selectedDCA.totalRecovered}M</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3">Weekly Performance Trend</h4>
                    <div className="h-16">
                      <Sparkline data={selectedDCA.weeklyTrend} color={
                        selectedDCA.trend === "up" ? "text-green-500" :
                        selectedDCA.trend === "down" ? "text-red-500" : "text-gray-400"
                      } />
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3">Contact Information</h4>
                    <div className="space-y-2">
                      <p className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${selectedDCA.email}`} className="text-primary hover:underline">
                          {selectedDCA.email}
                        </a>
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${selectedDCA.phone}`} className="text-primary hover:underline">
                          {selectedDCA.phone}
                        </a>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Last contacted: {selectedDCA.lastContact}
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3">Notes</h4>
                    <p className="text-sm whitespace-pre-wrap">{selectedDCA.notes}</p>
                    <div className="mt-3 flex gap-2">
                      <Input
                        placeholder="Add a note..."
                        value={dcaNote}
                        onChange={(e) => setDcaNote(e.target.value)}
                      />
                      <Button onClick={handleAddNote} disabled={!dcaNote}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="border-t pt-4 flex flex-wrap gap-2">
                    <Button onClick={() => {
                      setShowDCADetails(false);
                      setShowReallocateDialog(true);
                    }}>
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      Reallocate Cases
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setShowDCADetails(false);
                      setShowAssignCasesDialog(true);
                    }}>
                      <Briefcase className="h-4 w-4 mr-2" />
                      Assign Priority Cases
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setShowDCADetails(false);
                      setNewTarget(selectedDCA.performanceTarget.toString());
                      setShowTargetDialog(true);
                    }}>
                      <Target className="h-4 w-4 mr-2" />
                      Set Target
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setShowDCADetails(false);
                      setShowContactDialog(true);
                    }}>
                      <Mail className="h-4 w-4 mr-2" />
                      Contact
                    </Button>
                  </div>
                </div>
              )}
            </SheetContent>
          </Sheet>

          {/* Reallocate Dialog */}
          <Dialog open={showReallocateDialog} onOpenChange={setShowReallocateDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reallocate Cases</DialogTitle>
                <DialogDescription>
                  Move cases from {selectedDCA?.name} to another DCA
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium">Number of Cases to Reallocate</label>
                  <Input
                    type="number"
                    placeholder="Enter number of cases"
                    value={reallocateCases}
                    onChange={(e) => setReallocateCases(e.target.value)}
                    max={selectedDCA?.activeCases}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Available: {selectedDCA?.activeCases} cases
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Target DCA</label>
                  <Select value={reallocateTarget} onValueChange={setReallocateTarget}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select target DCA" />
                    </SelectTrigger>
                    <SelectContent>
                      {dcas.filter(d => d.id !== selectedDCA?.id && d.status === "active").map(dca => (
                        <SelectItem key={dca.id} value={dca.id}>
                          {dca.name} ({dca.recoveryRate}% recovery)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowReallocateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleReallocate} disabled={!reallocateTarget || !reallocateCases}>
                  Reallocate Cases
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Set Target Dialog */}
          <Dialog open={showTargetDialog} onOpenChange={setShowTargetDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Performance Target</DialogTitle>
                <DialogDescription>
                  Set a recovery rate target for {selectedDCA?.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium">Target Recovery Rate (%)</label>
                  <Input
                    type="number"
                    placeholder="Enter target percentage"
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value)}
                    min={0}
                    max={100}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Current rate: {selectedDCA?.recoveryRate}% | Previous target: {selectedDCA?.performanceTarget}%
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowTargetDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSetTarget} disabled={!newTarget}>
                  <Target className="h-4 w-4 mr-2" />
                  Set Target
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Contact Dialog */}
          <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Contact DCA</DialogTitle>
                <DialogDescription>
                  Reach out to {selectedDCA?.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex gap-2">
                  <Button
                    variant={contactType === "email" ? "default" : "outline"}
                    onClick={() => setContactType("email")}
                    className="flex-1"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                  <Button
                    variant={contactType === "phone" ? "default" : "outline"}
                    onClick={() => setContactType("phone")}
                    className="flex-1"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Phone
                  </Button>
                </div>
                {contactType === "email" && (
                  <div>
                    <label className="text-sm font-medium">Message</label>
                    <Textarea
                      placeholder="Enter your message..."
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      className="mt-2"
                      rows={4}
                    />
                  </div>
                )}
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm">
                    <strong>Email:</strong> {selectedDCA?.email}
                  </p>
                  <p className="text-sm">
                    <strong>Phone:</strong> {selectedDCA?.phone}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowContactDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleContact}>
                  <Send className="h-4 w-4 mr-2" />
                  {contactType === "email" ? "Send Email" : "Call Now"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Flag Dialog */}
          <Dialog open={showFlagDialog} onOpenChange={setShowFlagDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Flag for Review</DialogTitle>
                <DialogDescription>
                  Flag {selectedDCA?.name} for management review
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium">Reason for Flagging</label>
                  <Textarea
                    placeholder="Enter reason..."
                    value={flagReason}
                    onChange={(e) => setFlagReason(e.target.value)}
                    className="mt-2"
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowFlagDialog(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleFlag} disabled={!flagReason}>
                  <Flag className="h-4 w-4 mr-2" />
                  Flag DCA
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Deadline Dialog */}
          <Dialog open={showDeadlineDialog} onOpenChange={setShowDeadlineDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Improvement Deadline</DialogTitle>
                <DialogDescription>
                  Set a deadline for {selectedDCA?.name} to improve performance
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium">Deadline Date</label>
                  <Input
                    type="date"
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeadlineDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSetDeadline} disabled={!deadlineDate}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Set Deadline
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Assign Priority Cases Dialog */}
          <Dialog open={showAssignCasesDialog} onOpenChange={setShowAssignCasesDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Assign Priority Cases</DialogTitle>
                <DialogDescription>
                  Assign high-priority cases to {selectedDCA?.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
                {priorityCases.map((c) => (
                  <div
                    key={c.id}
                    className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedPriorityCases.includes(c.id) ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                    }`}
                    onClick={() => {
                      setSelectedPriorityCases(prev =>
                        prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id]
                      );
                    }}
                  >
                    <Checkbox checked={selectedPriorityCases.includes(c.id)} />
                    <div className="flex-1">
                      <p className="font-medium">{c.debtor}</p>
                      <p className="text-xs text-muted-foreground">Case: {c.id} • {c.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${c.amount.toLocaleString()}</p>
                      <Badge variant={c.priority === "critical" ? "destructive" : "secondary"} className="text-xs">
                        {c.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAssignCasesDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAssignPriorityCases} disabled={selectedPriorityCases.length === 0}>
                  <Briefcase className="h-4 w-4 mr-2" />
                  Assign {selectedPriorityCases.length} Case(s)
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Compare Dialog */}
          <Dialog open={showCompareDialog} onOpenChange={setShowCompareDialog}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>DCA Comparison</DialogTitle>
                <DialogDescription>
                  Side-by-side comparison of selected DCAs
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="grid grid-cols-3 gap-4">
                  {compareDCAs.map(id => {
                    const dca = dcas.find(d => d.id === id);
                    if (!dca) return null;
                    const styles = getImportanceStyles(dca.importance);
                    
                    return (
                      <Card key={dca.id} className={styles.row}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-4">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold ${
                              dca.importance === "critical" ? "bg-rose-100 text-rose-700" : "bg-primary/10 text-primary"
                            }`}>
                              {dca.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold">{dca.name}</p>
                              <Badge className={styles.badge}>{dca.importance}</Badge>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Recovery Rate</span>
                              <span className={`font-bold ${getRecoveryColor(dca.recoveryRate).text}`}>{dca.recoveryRate}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">SLA Compliance</span>
                              <span className="font-bold">{dca.slaCompliance}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Efficiency Score</span>
                              <span className="font-bold">{getEfficiencyScore(dca)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Avg Resolution</span>
                              <span className="font-bold">{dca.avgResolutionDays} days</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Active Cases</span>
                              <span className="font-bold">{dca.activeCases}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Total Recovered</span>
                              <span className="font-bold text-emerald-600">${dca.totalRecovered}M</span>
                            </div>
                          </div>
                          <div className="mt-4">
                            <p className="text-xs text-muted-foreground mb-1">Weekly Trend</p>
                            <Sparkline data={dca.weeklyTrend} color={
                              dca.trend === "up" ? "text-green-500" : dca.trend === "down" ? "text-red-500" : "text-gray-400"
                            } />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCompareDialog(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Export Dialog */}
          <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Export DCA Report</DialogTitle>
                <DialogDescription>
                  Export {selectedDCAs.length > 0 ? `${selectedDCAs.length} selected` : filteredDCAs.length} DCA(s)
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
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Funnel Detail Dialog */}
          <Dialog open={showFunnelDetailDialog} onOpenChange={setShowFunnelDetailDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{selectedFunnelStage?.name}</DialogTitle>
                <DialogDescription>
                  Detailed breakdown for {selectedFunnelStage?.stage}
                </DialogDescription>
              </DialogHeader>
              {selectedFunnelStage && (
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Active Cases</p>
                      <p className="text-2xl font-bold">{selectedFunnelStage.cases}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Recovered</p>
                      <p className="text-2xl font-bold text-emerald-600">{selectedFunnelStage.recovered}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Value</p>
                      <p className="text-2xl font-bold">{selectedFunnelStage.value}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Recovery Rate</p>
                      <p className="text-2xl font-bold">
                        {((selectedFunnelStage.recovered / selectedFunnelStage.cases) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Cases by DCA</h4>
                    <div className="space-y-2">
                      {dcas.slice(0, 3).map(dca => (
                        <div key={dca.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                          <span className="text-sm font-medium">{dca.name}</span>
                          <span className="text-sm">{Math.floor(selectedFunnelStage.cases / 3)} cases</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowFunnelDetailDialog(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Leaderboard Sheet */}
          <Sheet open={showLeaderboardSheet} onOpenChange={setShowLeaderboardSheet}>
            <SheetContent className="w-[400px] sm:w-[500px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  Performance Leaderboard
                </SheetTitle>
                <SheetDescription>
                  Ranked by recovery rate
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-3">
                {[...dcas].sort((a, b) => b.recoveryRate - a.recoveryRate).map((dca, idx) => {
                  const styles = getImportanceStyles(dca.importance);
                  const prevRank = dcas.findIndex(d => d.id === dca.id) + 1;
                  const rankChange = prevRank - (idx + 1);
                  
                  return (
                    <div 
                      key={dca.id}
                      className={`flex items-center gap-4 p-3 rounded-lg border ${styles.row} cursor-pointer hover:shadow-sm`}
                      onClick={() => {
                        setSelectedDCA(dca);
                        setShowLeaderboardSheet(false);
                        setShowDCADetails(true);
                      }}
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                        idx === 0 ? "bg-amber-100 text-amber-700" :
                        idx === 1 ? "bg-gray-100 text-gray-700" :
                        idx === 2 ? "bg-orange-100 text-orange-700" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold">{dca.name}</p>
                        <p className="text-xs text-muted-foreground">{dca.specialization}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${getRecoveryColor(dca.recoveryRate).text}`}>
                          {dca.recoveryRate}%
                        </p>
                        {rankChange !== 0 && (
                          <div className={`flex items-center justify-end gap-1 text-xs ${
                            rankChange > 0 ? "text-green-500" : "text-red-500"
                          }`}>
                            {rankChange > 0 ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            {Math.abs(rankChange)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>

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
                          {activity.dcaName} • {activity.user} • {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* Workload Balance Dialog */}
          <Dialog open={showWorkloadDialog} onOpenChange={setShowWorkloadDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Workload Balance</DialogTitle>
                <DialogDescription>
                  Case distribution across all DCAs
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                {dcas.map(dca => {
                  const percentage = (dca.activeCases / dcas.reduce((sum, d) => sum + d.activeCases, 0)) * 100;
                  return (
                    <div key={dca.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{dca.name}</span>
                        <span className="text-sm text-muted-foreground">{dca.activeCases} cases ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getRecoveryColor(dca.recoveryRate).bg}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowWorkloadDialog(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Card Drill-Down Dialog */}
          <Dialog open={!!showCardDrillDown} onOpenChange={() => setShowCardDrillDown(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {showCardDrillDown === "dcas" && "DCA Breakdown"}
                  {showCardDrillDown === "recovery" && "Recovery Rate by DCA"}
                  {showCardDrillDown === "recovered" && "Amount Recovered by DCA"}
                  {showCardDrillDown === "sla" && "SLA Compliance Details"}
                </DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-3 max-h-[400px] overflow-y-auto">
                {dcas.map(dca => {
                  const styles = getImportanceStyles(dca.importance);
                  return (
                    <div 
                      key={dca.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${styles.row} cursor-pointer hover:shadow-sm`}
                      onClick={() => {
                        setShowCardDrillDown(null);
                        handleViewDetails(dca);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{styles.indicator}</span>
                        <div>
                          <p className="font-medium">{dca.name}</p>
                          <p className="text-xs text-muted-foreground">{dca.status} • {dca.specialization}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {showCardDrillDown === "dcas" && (
                          <p className="font-bold">{dca.activeCases} cases</p>
                        )}
                        {showCardDrillDown === "recovery" && (
                          <p className={`font-bold ${getRecoveryColor(dca.recoveryRate).text}`}>{dca.recoveryRate}%</p>
                        )}
                        {showCardDrillDown === "recovered" && (
                          <p className="font-bold text-emerald-600">${dca.totalRecovered}M</p>
                        )}
                        {showCardDrillDown === "sla" && (
                          <p className={`font-bold ${dca.slaCompliance >= 90 ? "text-emerald-600" : dca.slaCompliance >= 85 ? "text-amber-600" : "text-red-600"}`}>
                            {dca.slaCompliance}%
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCardDrillDown(null)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </TooltipProvider>
  );
}
