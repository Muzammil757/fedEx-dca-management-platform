"use client";

import React, { useState, useMemo, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  Filter,
  Search,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  MessageSquare,
  Download,
  CheckCheck,
  File,
  Phone,
  Mail,
  Gavel,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { useAppData } from "@/lib/data/app-data-context";

// Helper to get relative time string
const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
};

// Status options for dropdown
const statusOptions = [
  { value: "active", label: "Active", color: "bg-blue-100 text-blue-700" },
  { value: "contacted", label: "Contacted", color: "bg-sky-100 text-sky-700" },
  { value: "negotiating", label: "Negotiating", color: "bg-amber-100 text-amber-700" },
  { value: "payment_plan", label: "Payment Plan", color: "bg-emerald-100 text-emerald-700" },
  { value: "escalated", label: "Escalated", color: "bg-orange-100 text-orange-700" },
  { value: "legal", label: "Legal", color: "bg-rose-100 text-rose-700" },
  { value: "resolved", label: "Resolved", color: "bg-green-100 text-green-700" },
];

// DCA partners - loaded from backend via useAppData hook
const dcaPartnersFallback: { id: number; name: string; rate: number; specialisation: string }[] = [];

// Initial empty state - populated from backend
type CaseItem = {
  id: string;
  customer: string;
  customerEmail: string;
  customerPhone: string;
  overdueAmount: number;
  agingDays: number;
  dca: string;
  aiProbability: number;
  priority: "critical" | "high" | "medium" | "low";
  slaStatus: string;
  caseStatus: string;
  notes: string;
  lastUpdate: string;
};

const initialCases: CaseItem[] = [];

const completedCases = [
  {
    id: "CMP-2024-001",
    customer: "Tech Solutions Inc",
    dca: "Alpha Recovery Inc",
    experience: "good",
    loanAmount: 45000,
    paidAmount: 45000,
    clearedDate: "Jan 15, 2024",
  },
  {
    id: "CMP-2024-002",
    customer: "Green Valley Farms",
    dca: "Global Collections",
    experience: "average",
    loanAmount: 28000,
    paidAmount: 28000,
    clearedDate: "Jan 10, 2024",
  },
  {
    id: "CMP-2024-003",
    customer: "Sunrise Industries",
    dca: "Prime Debt Solutions",
    experience: "poor",
    loanAmount: 67000,
    paidAmount: 52000,
    clearedDate: "Jan 5, 2024",
  },
  {
    id: "CMP-2024-004",
    customer: "Atlas Manufacturing",
    dca: "Alpha Recovery Inc",
    experience: "good",
    loanAmount: 89000,
    paidAmount: 89000,
    clearedDate: "Dec 28, 2023",
  },
];

const initialSelectedCase = {
  id: "DCA-2024-3847",
  customer: {
    name: "Acme Logistics Corp",
    contact: "John Mitchell",
    email: "j.mitchell@acmelogistics.com",
    phone: "+1 (555) 234-5678",
    address: "123 Industrial Blvd, Chicago, IL 60601",
  },
  financial: {
    totalOverdue: 125000,
    originalInvoice: 150000,
    paidAmount: 25000,
  },
  dca: "Alpha Recovery Inc",
  agingDays: 45,
  slaStatus: "on-track",
  caseStatus: "active",
  notes: "Customer requested payment extension. Waiting for revised schedule.",
  lastUpdate: "2024-03-20 14:30",
};

type SortKey = "overdueAmount" | "agingDays" | "priority" | "aiProbability";
type SortDirection = "asc" | "desc";

const ITEMS_PER_PAGE = 5;

export default function CasesPage() {
  // Backend data integration
  const { data, isLoading, refresh, createCase, updateCase } = useAppData();
  
  const [cases, setCases] = useState(initialCases);
  const [selectedCase, setSelectedCase] = useState(initialSelectedCase);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  
  // New state for features
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [slaFilter, setSlaFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAllocationDialogOpen, setIsAllocationDialogOpen] = useState(false);
  const [selectedDCA, setSelectedDCA] = useState<typeof dcaPartnersFallback[0] | null>(null);
  
  // Create Case modal state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    customerId: "",
    originalAmount: "",
    overdueAmount: "",
    priority: "medium" as "low" | "medium" | "high" | "critical",
    dcaAgencyId: "",
    notes: "",
  });

  // Transform backend data to existing format when available
  useEffect(() => {
    if (data?.cases && data.cases.length > 0) {
      const transformedCases = data.cases.map(c => ({
        id: c.caseNumber,
        customer: c.customer?.name || "Unknown Customer",
        customerEmail: c.customer?.email || "",
        customerPhone: c.customer?.phone || "",
        overdueAmount: parseFloat(c.overdueAmount),
        agingDays: c.agingDays,
        dca: c.dcaAgency?.agencyName || "Unassigned",
        aiProbability: c.aiProbability ?? Math.floor(Math.random() * 40 + 50),
        priority: c.priority.toLowerCase() as "critical" | "high" | "medium" | "low",
        slaStatus: c.slaStatus?.toLowerCase().replace("_", "-") || "on-track",
        caseStatus: c.status.toLowerCase().replace("_", "-"),
        notes: c.notes || "No notes available",
        lastUpdate: getRelativeTime(new Date(c.updatedAt)),
      }));
      setCases(transformedCases);
    }
  }, [data?.cases]);

  // Derive DCA partners from backend or fallback to static
  const activeDcaPartners = useMemo(() => {
    if (data?.dcaAgencies && data.dcaAgencies.length > 0) {
      return data.dcaAgencies.map(d => ({
        id: d.id,
        name: d.agencyName,
        rate: parseInt(d.performanceTarget) || 75,
        specialisation: d.specialization || "General Collections",
      }));
    }
    return [];
  }, [data?.dcaAgencies]);

  // Reset page when filters change

  // Filter and sort cases
  const filteredAndSortedCases = useMemo(() => {
    let filtered = [...cases];
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.id.toLowerCase().includes(query) ||
        c.customer.toLowerCase().includes(query) ||
        c.dca.toLowerCase().includes(query)
      );
    }
    
    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter(c => c.priority === priorityFilter);
    }
    
    // SLA filter
    if (slaFilter !== "all") {
      filtered = filtered.filter(c => c.slaStatus === slaFilter);
    }
    
    // Sorting
    if (sortConfig) {
      filtered.sort((a, b) => {
        let aVal: number | string = a[sortConfig.key];
        let bVal: number | string = b[sortConfig.key];
        
        // Handle priority sorting (critical > high > medium > low)
        if (sortConfig.key === "priority") {
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          aVal = priorityOrder[a.priority as keyof typeof priorityOrder];
          bVal = priorityOrder[b.priority as keyof typeof priorityOrder];
        }
        
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
        }
        return 0;
      });
    }
    
    return filtered;
  }, [cases, searchQuery, priorityFilter, slaFilter, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedCases.length / ITEMS_PER_PAGE);
  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedCases.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSortedCases, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, priorityFilter, slaFilter]);

  // Handle sort
  const handleSort = (key: SortKey) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "desc" };
    });
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["Case ID", "Customer", "Amount", "Aging Days", "DCA", "AI Probability", "Priority", "SLA Status", "Case Status"];
    const rows = filteredAndSortedCases.map(c => [
      c.id,
      c.customer,
      c.overdueAmount,
      c.agingDays,
      c.dca,
      `${c.aiProbability}%`,
      c.priority,
      c.slaStatus,
      c.caseStatus,
    ]);
    
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `cases_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success(`Exported ${filteredAndSortedCases.length} cases to CSV`);
  };

  // Handle case status change - persists to database via centralized context
  const handleStatusChange = async (caseId: string, newStatus: string) => {
    // Find the database case ID from the case number
    const dbCase = data?.cases?.find(c => c.caseNumber === caseId);
    if (!dbCase) {
      toast.error("Case not found");
      return;
    }

    // Convert display status to database format
    const dbStatus = newStatus.replace("-", "_");
    
    const result = await updateCase(dbCase.id, { status: dbStatus });
    
    if (result.success) {
      toast.success(`Case ${caseId} status updated to ${newStatus}`);
    } else {
      toast.error(result.error || "Failed to update status");
    }
  };

  // Handle escalate - sets status to legal and isEscalated flag
  const handleEscalate = async (caseId: string) => {
    const dbCase = data?.cases?.find(c => c.caseNumber === caseId);
    if (!dbCase) {
      toast.error("Case not found");
      return;
    }

    const result = await updateCase(dbCase.id, { status: "legal", isEscalated: true });
    
    if (result.success) {
      toast.error(`Case ${caseId} escalated to legal`, {
        description: "Legal team has been notified",
      });
    } else {
      toast.error(result.error || "Failed to escalate case");
    }
  };

  // Handle DCA allocation - persists to database
  const handleConfirmAllocation = async () => {
    if (!selectedDCA) {
      toast.error("Please select a DCA partner");
      return;
    }
    
    // Find the database case by case number
    const dbCase = data?.cases?.find(c => c.caseNumber === selectedCase.id);
    if (!dbCase) {
      toast.error("Case not found in database");
      return;
    }

    const result = await updateCase(dbCase.id, { dcaAgencyId: selectedDCA.id });
    
    if (result.success) {
      toast.success(`Case allocated to ${selectedDCA.name}`, {
        description: `Recovery rate: ${selectedDCA.rate}%`,
      });
      setIsAllocationDialogOpen(false);
      setSelectedDCA(null);
    } else {
      toast.error(result.error || "Failed to allocate case");
    }
  };

  // Handle create case submission
  const handleCreateCase = async () => {
    if (!createForm.customerId) {
      toast.error("Please select a customer");
      return;
    }
    if (!createForm.originalAmount || !createForm.overdueAmount) {
      toast.error("Please enter amount details");
      return;
    }

    setIsCreating(true);
    
    const result = await createCase({
      customerId: createForm.customerId,
      originalAmount: parseFloat(createForm.originalAmount),
      overdueAmount: parseFloat(createForm.overdueAmount),
      priority: createForm.priority,
      dcaAgencyId: createForm.dcaAgencyId || undefined,
      notes: createForm.notes || undefined,
    });

    setIsCreating(false);

    if (result.success) {
      toast.success("Case created successfully", {
        description: `Case ${result.case?.caseNumber} has been created`,
      });
      setIsCreateDialogOpen(false);
      setCreateForm({
        customerId: "",
        originalAmount: "",
        overdueAmount: "",
        priority: "medium",
        dcaAgencyId: "",
        notes: "",
      });
    } else {
      toast.error(result.error || "Failed to create case");
    }
  };

  // Get sort icon
  const getSortIcon = (key: SortKey) => {
    if (sortConfig?.key !== key) return null;
    return sortConfig.direction === "asc" ? 
      <ChevronUp className="h-3 w-3 ml-1" /> : 
      <ChevronDown className="h-3 w-3 ml-1" />;
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      critical: "bg-rose-50 text-rose-600 border-rose-100",
      high: "bg-amber-50 text-amber-600 border-amber-100",
      medium: "bg-sky-50 text-sky-600 border-sky-100",
      low: "bg-emerald-50 text-emerald-600 border-emerald-100",
    };
    return styles[priority as keyof typeof styles] || styles.medium;
  };

  const getSlaStatusBadge = (status: string) => {
    const configs = {
      "on-track": { style: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: CheckCircle2 },
      "at-risk": { style: "bg-amber-50 text-amber-600 border-amber-100", icon: AlertTriangle },
      breached: { style: "bg-rose-50 text-rose-600 border-rose-100", icon: XCircle },
    };
    return configs[status as keyof typeof configs] || configs["on-track"];
  };

  const getExperienceBadge = (experience: string) => {
    const styles = {
      good: "bg-emerald-50 text-emerald-600 border-emerald-100",
      average: "bg-amber-50 text-amber-600 border-amber-100",
      poor: "bg-rose-50 text-rose-600 border-rose-100",
    };
    return styles[experience as keyof typeof styles] || styles.average;
  };

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Case Management</h1>
            <p className="text-sm text-muted-foreground">
              Manage and track all overdue account cases across DCAs
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              className="bg-primary hover:bg-primary/90" 
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Case
            </Button>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export ({filteredAndSortedCases.length})
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border border-border shadow-sm">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by Case ID, Customer, or DCA..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-slate-50 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[140px] bg-white border-border">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={slaFilter} onValueChange={setSlaFilter}>
              <SelectTrigger className="w-[140px] bg-white border-border">
                <SelectValue placeholder="SLA Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All SLAs</SelectItem>
                <SelectItem value="on-track">On Track</SelectItem>
                <SelectItem value="at-risk">At Risk</SelectItem>
                <SelectItem value="breached">Breached</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="icon" 
              className="border-border hover:bg-slate-50"
              onClick={() => {
                setSearchQuery("");
                setPriorityFilter("all");
                setSlaFilter("all");
                setSortConfig(null);
              }}
            >
              <Filter className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 p-4" style={{ backgroundColor: '#76ABDF' }}>
          <Card className="xl:col-span-2 bg-white border-border shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border bg-secondary/10 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Active Recovery Cases
                </CardTitle>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-bold">
                  {filteredAndSortedCases.length} Total Cases
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider py-4">Case ID</TableHead>
                    <TableHead className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider py-4">Customer</TableHead>
                    <TableHead 
                      className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider py-4 text-right cursor-pointer hover:text-primary"
                      onClick={() => handleSort("overdueAmount")}
                    >
                      <span className="flex items-center justify-end">
                        Amount {getSortIcon("overdueAmount")}
                      </span>
                    </TableHead>
                    <TableHead 
                      className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider py-4 text-center cursor-pointer hover:text-primary"
                      onClick={() => handleSort("agingDays")}
                    >
                      <span className="flex items-center justify-center">
                        Aging {getSortIcon("agingDays")}
                      </span>
                    </TableHead>
                    <TableHead className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider py-4">Agency</TableHead>
                    <TableHead 
                      className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider py-4 text-center cursor-pointer hover:text-primary"
                      onClick={() => handleSort("aiProbability")}
                    >
                      <span className="flex items-center justify-center">
                        AI Prob. {getSortIcon("aiProbability")}
                      </span>
                    </TableHead>
                    <TableHead 
                      className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider py-4 text-center cursor-pointer hover:text-primary"
                      onClick={() => handleSort("priority")}
                    >
                      <span className="flex items-center justify-center">
                        Priority {getSortIcon("priority")}
                      </span>
                    </TableHead>
                    <TableHead className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider py-4 text-center">SLA</TableHead>
                    <TableHead className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider py-4 text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCases.map((caseItem) => {
                    const sla = getSlaStatusBadge(caseItem.slaStatus);
                    const SlaIcon = sla.icon;
                    const isSelected = selectedCase.id === caseItem.id;
                    const statusConfig = statusOptions.find(s => s.value === caseItem.caseStatus);
                    return (
                      <TableRow
                        key={caseItem.id}
                        className={`border-border cursor-pointer transition-colors hover:bg-slate-50 ${isSelected ? "bg-sky-50/50" : ""}`}
                        onClick={() => setSelectedCase({ 
                          ...initialSelectedCase, 
                          id: caseItem.id, 
                          customer: { ...initialSelectedCase.customer, name: caseItem.customer, email: caseItem.customerEmail, phone: caseItem.customerPhone }, 
                          financial: { ...initialSelectedCase.financial, totalOverdue: caseItem.overdueAmount },
                          agingDays: caseItem.agingDays, 
                          dca: caseItem.dca, 
                          slaStatus: caseItem.slaStatus,
                          caseStatus: caseItem.caseStatus,
                          notes: caseItem.notes,
                        } as typeof initialSelectedCase)}
                      >
                        <TableCell className="font-bold text-primary py-4 text-xs">{caseItem.id}</TableCell>
                        <TableCell className="font-bold text-foreground py-4 text-xs">{caseItem.customer}</TableCell>
                        <TableCell className="text-right font-bold text-foreground py-4 text-xs">
                          ${caseItem.overdueAmount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center py-4">
                          <span className={`text-xs font-bold ${caseItem.agingDays > 60 ? "text-rose-600" : caseItem.agingDays > 30 ? "text-amber-600" : "text-emerald-600"}`}>
                            {caseItem.agingDays}d
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-semibold py-4">{caseItem.dca}</TableCell>
                        <TableCell className="text-center py-4">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`text-[10px] font-bold ${caseItem.aiProbability > 70 ? "text-emerald-600" : "text-amber-600"}`}>
                              {caseItem.aiProbability}%
                            </span>
                            <div className="w-10 h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full ${caseItem.aiProbability > 70 ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${caseItem.aiProbability}%` }} />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-4">
                          <Badge variant="outline" className={`text-[9px] font-bold uppercase tracking-tighter ${getPriorityBadge(caseItem.priority)}`}>
                            {caseItem.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center py-4">
                          <Badge variant="outline" className={`text-[9px] font-bold uppercase tracking-tighter ${sla.style}`}>
                            <SlaIcon className="mr-1 h-3 w-3" />
                            {caseItem.slaStatus.replace("-", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center py-4" onClick={(e) => e.stopPropagation()}>
                          <Select 
                            value={caseItem.caseStatus} 
                            onValueChange={(val) => handleStatusChange(caseItem.id, val)}
                          >
                            <SelectTrigger className={`h-7 w-[100px] text-[9px] font-bold border-0 ${statusConfig?.color || "bg-slate-100"}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${opt.color}`}>
                                    {opt.label}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-slate-50/50">
                  <p className="text-xs text-muted-foreground">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedCases.length)} of {filteredAndSortedCases.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => p - 1)}
                      className="h-8 px-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Prev
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="h-8 w-8 p-0"
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => p + 1)}
                      className="h-8 px-2"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="bg-white border-primary/10 shadow-md ring-1 ring-primary/5">
              <CardHeader className="pb-3 border-b border-border bg-secondary/10">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Selected Case Details
                  </CardTitle>
                  <Badge variant="outline" className="font-mono text-[10px] bg-primary/5 text-primary border-primary/20">
                    {selectedCase.id}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Customer Name</p>
                      <p className="text-sm font-bold text-foreground">{selectedCase.customer.name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Assigned Agency</p>
                      <p className="text-sm font-bold text-foreground">{selectedCase.dca}</p>
                    </div>
                  </div>

                  {/* Contact Actions */}
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-border">
                    <a 
                      href={`tel:${selectedCase.customer.phone}`}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.info(`Calling ${selectedCase.customer.phone}`);
                      }}
                    >
                      <Phone className="h-4 w-4" />
                      <span className="text-xs font-bold">Call</span>
                    </a>
                    <a 
                      href={`mailto:${selectedCase.customer.email}?subject=Regarding Case ${selectedCase.id}`}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.info(`Opening email to ${selectedCase.customer.email}`);
                      }}
                    >
                      <Mail className="h-4 w-4" />
                      <span className="text-xs font-bold">Email</span>
                    </a>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Overdue Amount</p>
                      <p className="text-lg font-bold text-rose-600">${selectedCase.financial?.totalOverdue?.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Aging Days</p>
                      <p className="text-lg font-bold text-foreground">{selectedCase.agingDays} Days</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">SLA Performance</p>
                    <Badge variant="outline" className={`font-bold uppercase tracking-wider text-[10px] ${getSlaStatusBadge(selectedCase.slaStatus).style}`}>
                      {selectedCase.slaStatus.replace("-", " ")}
                    </Badge>
                  </div>

                  <div className="space-y-1 p-3 rounded-xl bg-slate-50 border border-border">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                      <MessageSquare className="h-3 w-3 text-primary" /> Latest Case Update
                    </p>
                    <p className="text-xs text-foreground leading-relaxed font-medium">
                      {selectedCase.notes}
                    </p>
                    <p className="text-[9px] text-muted-foreground mt-3 italic flex items-center gap-1 font-semibold">
                      <Clock className="h-2.5 w-2.5" /> Last synced: {selectedCase.lastUpdate}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    className="flex-1 bg-primary hover:bg-primary/90 text-[10px] font-bold uppercase tracking-wider h-9"
                    onClick={() => setIsAllocationDialogOpen(true)}
                  >
                    <UserPlus className="h-3 w-3 mr-1" />
                    Allocate
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="flex-1 text-[10px] font-bold uppercase tracking-wider h-9"
                    onClick={() => handleEscalate(selectedCase.id)}
                  >
                    <Gavel className="h-3 w-3 mr-1" />
                    Escalate
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Completed Cases Table */}
        <Card className="bg-white border-border shadow-sm overflow-hidden">
          <CardHeader className="border-b border-border bg-emerald-50/50 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <CheckCheck className="h-5 w-5 text-emerald-600" />
                Completed Cases
              </CardTitle>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200 font-bold">
                {completedCases.length} Cleared
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider py-4">Case ID</TableHead>
                  <TableHead className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider py-4">Customer Name</TableHead>
                  <TableHead className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider py-4">DCA Handled</TableHead>
                  <TableHead className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider py-4 text-center">Experience</TableHead>
                  <TableHead className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider py-4 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedCases.map((completed) => (
                  <React.Fragment key={completed.id}>
                    <TableRow className="border-border hover:bg-slate-50 transition-colors">
                      <TableCell className="font-bold text-emerald-600 py-4 text-xs">{completed.id}</TableCell>
                      <TableCell className="font-bold text-foreground py-4 text-xs">{completed.customer}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-semibold py-4">{completed.dca}</TableCell>
                      <TableCell className="text-center py-4">
                        <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-tighter ${getExperienceBadge(completed.experience)}`}>
                          {completed.experience}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => toggleRow(completed.id)}
                          className="text-xs font-bold text-primary hover:text-primary hover:bg-primary/10"
                        >
                          {expandedRow === completed.id ? "Hide" : "View Details"}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedRow === completed.id && (
                      <TableRow>
                        <TableCell colSpan={5} className="p-4 bg-emerald-50/30 border-b border-emerald-100">
                          <div className="p-4 rounded-lg bg-white border border-emerald-100 shadow-sm">
                            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                              <CheckCheck className="h-4 w-4" /> Payment Details
                            </p>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Loan Amount</p>
                                <p className="text-sm font-bold text-foreground">${completed.loanAmount.toLocaleString()}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Amount Paid</p>
                                <p className="text-sm font-bold text-emerald-600">${completed.paidAmount.toLocaleString()}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cleared Date</p>
                                <p className="text-sm font-bold text-foreground">{completed.clearedDate}</p>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-border">
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                                  <CheckCheck className="h-3 w-3" />
                                  Case cleared - No further action required
                                </p>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="text-xs font-bold border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                  onClick={() => window.open('#', '_blank')}
                                >
                                  <File className="h-3 w-3 mr-1" />
                                  View Receipt
                                </Button>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Allocation Dialog */}
        <Dialog open={isAllocationDialogOpen} onOpenChange={setIsAllocationDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Allocate Case to DCA
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-50 border border-border/50">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Case Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Case ID</p>
                    <p className="text-sm font-bold text-primary">{selectedCase.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Customer</p>
                    <p className="text-sm font-bold text-foreground">{selectedCase.customer.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="text-sm font-bold text-rose-600">${selectedCase.financial?.totalOverdue?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Current DCA</p>
                    <p className="text-sm font-bold text-foreground">{selectedCase.dca}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Select DCA Partner</p>
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                  {activeDcaPartners.map((dca) => (
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
                <Button variant="outline" className="flex-1" onClick={() => setIsAllocationDialogOpen(false)}>
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
          </DialogContent>
        </Dialog>

        {/* Create Case Modal */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Create New Case
              </DialogTitle>
              <DialogDescription>
                Create a new debt collection case. All fields marked with * are required.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {/* Customer Selection */}
              <div className="space-y-2">
                <Label htmlFor="customer">Customer *</Label>
                <Select
                  value={createForm.customerId}
                  onValueChange={(value) => setCreateForm(prev => ({ ...prev, customerId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {data?.customers?.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} {customer.email ? `(${customer.email})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="originalAmount">Original Amount (₹) *</Label>
                  <Input
                    id="originalAmount"
                    type="number"
                    placeholder="e.g., 100000"
                    value={createForm.originalAmount}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, originalAmount: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="overdueAmount">Overdue Amount (₹) *</Label>
                  <Input
                    id="overdueAmount"
                    type="number"
                    placeholder="e.g., 75000"
                    value={createForm.overdueAmount}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, overdueAmount: e.target.value }))}
                  />
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={createForm.priority}
                  onValueChange={(value: "low" | "medium" | "high" | "critical") => 
                    setCreateForm(prev => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* DCA Assignment (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="dcaAgency">Assign to DCA (Optional)</Label>
                <Select
                  value={createForm.dcaAgencyId || "none"}
                  onValueChange={(value) => setCreateForm(prev => ({ ...prev, dcaAgencyId: value === "none" ? "" : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Leave unassigned or select DCA" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {data?.dcaAgencies?.filter(d => d.status === "active").map((dca) => (
                      <SelectItem key={dca.id} value={dca.id}>
                        {dca.agencyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes about this case..."
                  value={createForm.notes}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handleCreateCase}
                  disabled={isCreating || !createForm.customerId || !createForm.originalAmount || !createForm.overdueAmount}
                >
                  {isCreating ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Case
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
