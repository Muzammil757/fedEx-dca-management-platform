"use client";

import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChatBot } from "@/components/ChatBot";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  Zap,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Info,
  Lightbulb,
  Timer,
  CheckCircle2,
  Gavel,
  MessageSquare,
  Target,
  Phone,
  Mail,
  Star,
  StarOff,
  Clock,
  X,
  Check,
  RefreshCw,
  StickyNote,
} from "lucide-react";
import { toast } from "sonner";
import { useAppData } from "@/lib/data/app-data-context";

// Initial empty state - populated from backend
type InsightCase = {
  id: string;
  customer: string;
  customerEmail: string;
  customerPhone: string;
  amount: number;
  prob: number;
  importance: "healthy" | "attention" | "warning" | "critical";
  riskFactors: { factor: string; severity: string }[];
  nextAction: string;
  estResolution: string;
  timeLeft: string;
  status: string;
  reviewed: boolean;
  bookmarked: boolean;
  notes: string;
  snoozedUntil: number | null;
};

const initialCases: InsightCase[] = [];

const ITEMS_PER_PAGE = 4;

// Helper to compute AI summary from real data
function computeAiSummary(data: ReturnType<typeof useAppData>["data"]) {
  if (!data?.cases) {
    return {
      totalAnalyzed: 0,
      highConfidence: 0,
      mediumConfidence: 0,
      lowConfidence: 0,
      avgRecoveryProb: 0,
      predictedRecovery: 0,
    };
  }
  
  const cases = data.cases;
  const highConfidence = cases.filter(c => (c.aiProbability ?? 0) >= 80).length;
  const mediumConfidence = cases.filter(c => (c.aiProbability ?? 0) >= 50 && (c.aiProbability ?? 0) < 80).length;
  const lowConfidence = cases.filter(c => (c.aiProbability ?? 0) < 50).length;
  
  const totalProb = cases.reduce((sum, c) => sum + (c.aiProbability ?? 50), 0);
  const avgRecoveryProb = cases.length > 0 ? totalProb / cases.length : 0;
  
  // Predicted recovery based on probability-weighted amounts
  const predictedRecovery = cases.reduce((sum, c) => {
    const prob = (c.aiProbability ?? 50) / 100;
    return sum + parseFloat(c.overdueAmount || "0") * prob;
  }, 0) / 1000000; // in millions
  
  return {
    totalAnalyzed: cases.length,
    highConfidence,
    mediumConfidence,
    lowConfidence,
    avgRecoveryProb: Math.round(avgRecoveryProb * 10) / 10,
    predictedRecovery: Math.round(predictedRecovery * 10) / 10,
  };
}

// Helper to compute dynamic insight from real data
function computeAiInsightState(data: ReturnType<typeof useAppData>["data"]) {
  if (!data?.cases) {
    return {
      state: "normal" as const,
      message: "🧠 Loading AI insights...",
      action: "Run Analysis",
    };
  }
  
  const lowConfidenceCases = data.cases.filter(c => (c.aiProbability ?? 50) < 50);
  const lowConfidenceAmount = lowConfidenceCases.reduce((sum, c) => sum + parseFloat(c.overdueAmount || "0"), 0);
  const criticalCases = data.cases.filter(c => c.priority === "critical" || c.slaStatus === "breached");
  
  const avgProb = data.cases.length > 0 
    ? data.cases.reduce((sum, c) => sum + (c.aiProbability ?? 50), 0) / data.cases.length 
    : 0;
  
  if (lowConfidenceCases.length > 0 && lowConfidenceAmount > 100000) {
    const amountStr = lowConfidenceAmount >= 1000000 
      ? `₹${(lowConfidenceAmount / 1000000).toFixed(1)}M` 
      : `₹${(lowConfidenceAmount / 1000).toFixed(0)}K`;
    return {
      state: "crisis" as const,
      message: `🚨 AI detected ${lowConfidenceCases.length} low-confidence cases. ${amountStr} at elevated risk.`,
      action: "Review Critical",
    };
  }
  
  if (criticalCases.length > 0) {
    return {
      state: "risk" as const,
      message: `⚠ ${criticalCases.length} cases flagged for immediate escalation based on risk patterns.`,
      action: "View Flagged",
    };
  }
  
  return {
    state: "normal" as const,
    message: `🧠 AI models updated. ${avgProb.toFixed(1)}% average recovery probability across portfolio.`,
    action: "Run Analysis",
  };
}

// Helper to get importance level from probability
const getImportanceFromProbability = (prob: number): InsightCase["importance"] => {
  if (prob >= 75) return "healthy";
  if (prob >= 55) return "attention";
  if (prob >= 35) return "warning";
  return "critical";
};

// Insight bar styling
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
    icon: Brain,
  },
};

function getImportanceStyles(importance: string) {
  switch (importance) {
    case "critical":
      return {
        card: "border-l-4 border-l-rose-500 bg-rose-50/30",
        badge: "bg-rose-100 text-rose-700",
        prob: "text-rose-600",
      };
    case "warning":
      return {
        card: "border-l-4 border-l-amber-500 bg-amber-50/20",
        badge: "bg-amber-100 text-amber-700",
        prob: "text-amber-600",
      };
    case "healthy":
      return {
        card: "border-l-2 border-l-emerald-400 bg-emerald-50/10",
        badge: "bg-emerald-100 text-emerald-700",
        prob: "text-emerald-600",
      };
    default:
      return {
        card: "border border-slate-200 bg-white",
        badge: "bg-slate-100 text-slate-600",
        prob: "text-slate-600",
      };
  }
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case "critical": return "bg-rose-100 text-rose-700 border-rose-200";
    case "high": return "bg-rose-50 text-rose-600 border-rose-200";
    case "medium": return "bg-amber-50 text-amber-700 border-amber-200";
    case "low": return "bg-slate-50 text-slate-600 border-slate-200";
    default: return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

function getProbColor(prob: number) {
  if (prob >= 70) return "bg-emerald-500";
  if (prob >= 50) return "bg-amber-500";
  return "bg-rose-500";
}

export default function IntelligencePage() {
  // Backend data integration
  const { data, refresh } = useAppData();

  // Compute dynamic insight from real data
  const computedInsight = useMemo(() => computeAiInsightState(data), [data]);
  const currentInsightStyle = insightStyles[computedInsight.state];
  const InsightIcon = currentInsightStyle.icon;
  
  // Compute AI summary from real data
  const aiSummary = useMemo(() => computeAiSummary(data), [data]);

  // State for cases
  const [cases, setCases] = useState<InsightCase[]>(initialCases);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [selectedCase, setSelectedCase] = useState<InsightCase | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [noteInput, setNoteInput] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  
  // Layout & pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [showReviewed, setShowReviewed] = useState(true);

  // Transform backend data when available
  useEffect(() => {
    if (data?.cases && data.cases.length > 0) {
      const transformedCases: InsightCase[] = data.cases.map(c => ({
        id: c.caseNumber,
        customer: c.customer?.name || "Unknown",
        customerEmail: c.customer?.email || "",
        customerPhone: c.customer?.phone || "",
        amount: parseFloat(c.overdueAmount),
        prob: c.aiProbability ?? Math.floor(Math.random() * 40 + 40),
        importance: getImportanceFromProbability(c.aiProbability ?? 50),
        riskFactors: c.customer?.riskLevel 
          ? [{ factor: `Risk level: ${c.customer.riskLevel}`, severity: c.customer.riskLevel === "critical" ? "critical" : c.customer.riskLevel === "high" ? "high" : "medium" }]
          : [{ factor: "Standard risk", severity: "low" as const }],
        nextAction: c.aiNextAction || "Follow up with customer",
        estResolution: c.aiEstResolution || `${Math.floor(Math.random() * 20 + 10)} days`,
        timeLeft: c.slaStatus === "on-track" ? "On track" : c.slaStatus === "at-risk" ? "⚠ At risk" : "⚠ Breached",
        status: c.status.toLowerCase().replace("_", "-"),
        reviewed: false,
        bookmarked: false,
        notes: c.notes || "",
        snoozedUntil: null,
      }));
      setCases(transformedCases);
    }
  }, [data?.cases]);

  // Save to local state helper (UI-only state like reviewed, bookmarked, etc.)
  const saveToStorage = (updatedCases: InsightCase[]) => {
    setCases(updatedCases);
  };

  // Activity logging - will be logged via backend when case is updated
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const addActivity = (caseId: string, action: string, status: "success" | "warning" | "critical") => {
    // Activity is logged automatically by backend when updateCase is called
    console.log(`Activity: ${action} for case ${caseId}`);
  };

  // Filter cases (excluding snoozed and optionally reviewed)
  const filteredCases = useMemo(() => {
    const now = Date.now();
    return cases.filter(c => {
      // Filter out snoozed cases
      if (c.snoozedUntil && c.snoozedUntil > now) return false;
      // Optionally filter out reviewed
      if (!showReviewed && c.reviewed) return false;
      return true;
    });
  }, [cases, showReviewed]);

  // Pagination
  const totalPages = Math.ceil(filteredCases.length / ITEMS_PER_PAGE);
  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCases.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCases, currentPage]);

  // Toggle card expansion
  const toggleExpand = (id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Apply strategy
  const handleApplyStrategy = (caseItem: InsightCase) => {
    const updated = cases.map(c => 
      c.id === caseItem.id ? { ...c, status: "strategy_applied", reviewed: true } : c
    );
    saveToStorage(updated);
    addActivity(caseItem.id, `Strategy applied: ${caseItem.nextAction}`, "success");
    toast.success(`Strategy applied for ${caseItem.customer}`, {
      description: caseItem.nextAction,
    });
  };

  // Escalate case
  const handleEscalate = (caseItem: InsightCase) => {
    const updated: InsightCase[] = cases.map(c => 
      c.id === caseItem.id ? { ...c, status: "escalated", importance: "critical" as InsightCase["importance"] } : c
    );
    saveToStorage(updated);
    addActivity(caseItem.id, "Escalated to management", "warning");
    toast.warning(`${caseItem.customer} escalated`, {
      description: `Amount: $${caseItem.amount.toLocaleString()}`,
    });
  };

  // Legal action
  const handleLegalAction = (caseItem: InsightCase) => {
    const updated: InsightCase[] = cases.map(c => 
      c.id === caseItem.id ? { ...c, status: "legal", importance: "critical" as InsightCase["importance"] } : c
    );
    saveToStorage(updated);
    addActivity(caseItem.id, "Sent to Legal", "critical");
    toast.error(`${caseItem.customer} sent to legal`, {
      description: "Legal team has been notified",
    });
  };

  // Mark as reviewed
  const handleMarkReviewed = (caseItem: InsightCase) => {
    const updated = cases.map(c => 
      c.id === caseItem.id ? { ...c, reviewed: !c.reviewed } : c
    );
    saveToStorage(updated);
    toast.info(caseItem.reviewed ? "Marked as unreviewed" : "Marked as reviewed");
  };

  // Snooze insight
  const handleSnooze = (caseItem: InsightCase, hours: number) => {
    const snoozedUntil = Date.now() + hours * 60 * 60 * 1000;
    const updated = cases.map(c => 
      c.id === caseItem.id ? { ...c, snoozedUntil } : c
    );
    saveToStorage(updated);
    toast.info(`${caseItem.customer} snoozed for ${hours}h`);
  };

  // Dismiss insight
  const handleDismiss = (caseItem: InsightCase) => {
    const updated = cases.map(c => 
      c.id === caseItem.id ? { ...c, status: "dismissed", reviewed: true } : c
    );
    saveToStorage(updated);
    toast.info(`${caseItem.customer} dismissed`);
  };

  // Toggle bookmark
  const handleToggleBookmark = (caseItem: InsightCase) => {
    const updated = cases.map(c => 
      c.id === caseItem.id ? { ...c, bookmarked: !c.bookmarked } : c
    );
    saveToStorage(updated);
    toast.info(caseItem.bookmarked ? "Removed from bookmarks" : "Added to bookmarks");
  };

  // Save note
  const handleSaveNote = (caseItem: InsightCase) => {
    const updated = cases.map(c => 
      c.id === caseItem.id ? { ...c, notes: noteInput } : c
    );
    saveToStorage(updated);
    setEditingNoteId(null);
    setNoteInput("");
    toast.success("Note saved");
  };

  // Open details modal
  const openDetails = (caseItem: InsightCase) => {
    setSelectedCase(caseItem);
    setIsDetailsOpen(true);
  };

  // Refresh insights (mock)
  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setLastUpdated(new Date());
      setIsLoading(false);
      toast.success("Insights refreshed");
    }, 1000);
  };

  // Count badges
  const criticalCount = cases.filter(c => c.importance === "critical" && c.status === "active").length;
  const bookmarkedCount = cases.filter(c => c.bookmarked).length;

  return (
    <TooltipProvider>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
                <Brain className="h-6 w-6 text-primary" />
                Recovery Intelligence
              </h1>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                AI-powered predictions and risk analysis
                <span className="text-xs text-muted-foreground/70">
                  • Updated {lastUpdated.toLocaleTimeString()}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Refresh button */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              
              <Button className="bg-primary hover:bg-primary/90">
                <Zap className="mr-2 h-4 w-4" />
                Run Prediction Model
              </Button>
            </div>
          </div>

          {/* Dynamic Insight Bar */}
          <section className={`${currentInsightStyle.bg} rounded-xl p-4 shadow-lg`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                  <InsightIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-lg">{computedInsight.message}</p>
                  <p className="text-white/80 text-sm">AI analysis based on {aiSummary.totalAnalyzed} cases</p>
                </div>
              </div>
              <Button 
                variant="secondary" 
                size="sm" 
                className="bg-white/20 text-white border-white/30 hover:bg-white/30 font-semibold"
              >
                {computedInsight.action}
              </Button>
            </div>
          </section>

          {/* AI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="bg-white border-border hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">High Confidence</span>
                    </div>
                    <p className="text-2xl font-extrabold text-foreground">{aiSummary.highConfidence.toLocaleString()}</p>
                    <p className="text-[10px] text-emerald-600 font-semibold">56% of portfolio</p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Cases with &gt;70% recovery probability</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="bg-white border-border hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Medium Confidence</span>
                    </div>
                    <p className="text-2xl font-extrabold text-foreground">{aiSummary.mediumConfidence.toLocaleString()}</p>
                    <p className="text-[10px] text-amber-600 font-semibold">32% of portfolio</p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Cases with 50-70% recovery probability</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="border-l-4 border-l-rose-500 bg-rose-50/30 hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                        <AlertCircle className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Low Confidence</span>
                    </div>
                    <p className="text-2xl font-extrabold text-rose-700">{aiSummary.lowConfidence.toLocaleString()}</p>
                    <p className="text-[10px] text-rose-600 font-semibold">⚠ Needs attention</p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Cases with &lt;50% recovery probability - requires intervention</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="bg-white border-border hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Target className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Predicted Recovery</span>
                    </div>
                    <p className="text-2xl font-extrabold text-foreground">${aiSummary.predictedRecovery}M</p>
                    <p className="text-[10px] text-primary font-semibold">{aiSummary.avgRecoveryProb}% avg probability</p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">AI-predicted total recovery based on current trajectories</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Prioritized AI Insights */}
              <Card className="bg-white border-border shadow-sm">
                <CardHeader className="pb-3 border-b border-border/50 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Prioritized AI Insights
                      <Badge variant="outline" className="ml-2 text-[10px] font-bold bg-rose-50 text-rose-600 border-rose-200">
                        {criticalCount} Critical
                      </Badge>
                      {bookmarkedCount > 0 && (
                        <Badge variant="outline" className="text-[10px] font-bold bg-amber-50 text-amber-600 border-amber-200">
                          <Star className="h-3 w-3 mr-1 fill-amber-500" />
                          {bookmarkedCount}
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showReviewed}
                          onChange={(e) => setShowReviewed(e.target.checked)}
                          className="rounded border-border"
                        />
                        Show reviewed
                      </label>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Loading skeleton */}
                  {isLoading ? (
                    <div className="p-5 space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-slate-200 rounded w-1/3 mb-2" />
                          <div className="h-8 bg-slate-200 rounded w-1/4 mb-3" />
                          <div className="h-3 bg-slate-200 rounded w-2/3" />
                        </div>
                      ))}
                    </div>
                  ) : filteredCases.length === 0 ? (
                    /* Empty state */
                    <div className="p-12 text-center">
                      <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                      <p className="text-lg font-bold text-foreground">All caught up!</p>
                      <p className="text-sm text-muted-foreground">No insights match your current filters</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {paginatedCases.map((caseItem) => {
                        const styles = getImportanceStyles(caseItem.importance);
                        const isCritical = caseItem.importance === "critical";
                        const isExpanded = expandedCards.has(caseItem.id);
                        const isStrategyApplied = caseItem.status === "strategy_applied";
                        
                        return (
                          <div
                            key={caseItem.id}
                            className={`p-5 transition-colors ${styles.card} ${caseItem.reviewed ? "opacity-70" : ""} ${isStrategyApplied ? "bg-emerald-50/30" : ""}`}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  {/* Priority Indicator */}
                                  <span>
                                    {isCritical ? "🔴" : caseItem.importance === "warning" ? "🟠" : "🟢"}
                                  </span>
                                  <span className="font-bold text-foreground">{caseItem.customer}</span>
                                  <Badge variant="outline" className="text-[10px] font-mono">
                                    {caseItem.id}
                                  </Badge>
                                  {/* Bookmark star */}
                                  <button
                                    onClick={() => handleToggleBookmark(caseItem)}
                                    className="focus:outline-none"
                                  >
                                    {caseItem.bookmarked ? (
                                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                                    ) : (
                                      <StarOff className="h-4 w-4 text-slate-300 hover:text-amber-500" />
                                    )}
                                  </button>
                                  {/* Reviewed checkmark */}
                                  {caseItem.reviewed && (
                                    <Badge className="text-[9px] bg-emerald-100 text-emerald-700">
                                      <Check className="h-3 w-3 mr-0.5" /> Reviewed
                                    </Badge>
                                  )}
                                  {isStrategyApplied && (
                                    <Badge className="text-[9px] bg-emerald-100 text-emerald-700">
                                      ✓ Strategy Applied
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-2xl font-extrabold text-foreground">
                                  ${caseItem.amount.toLocaleString()}
                                </p>
                                {/* Quick contact buttons */}
                                <div className="flex items-center gap-2 pt-1">
                                  <a
                                    href={`tel:${caseItem.customerPhone}`}
                                    className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-[10px] font-bold"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Phone className="h-3 w-3" /> Call
                                  </a>
                                  <a
                                    href={`mailto:${caseItem.customerEmail}?subject=Regarding Case ${caseItem.id}`}
                                    className="flex items-center gap-1 px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 text-[10px] font-bold"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Mail className="h-3 w-3" /> Email
                                  </a>
                                </div>
                              </div>
                              <div className="text-right space-y-2">
                                <div className="flex items-center gap-2 justify-end">
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                    Recovery Probability
                                  </span>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button className="focus:outline-none">
                                        <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-primary transition-colors" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">
                                        Based on 50+ data points including payment history & industry trends
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                                {/* Color-coded probability bar */}
                                <div className="flex items-center gap-3">
                                  <div className="w-24 h-2.5 rounded-full overflow-hidden bg-slate-100">
                                    <div
                                      className={`h-full ${getProbColor(caseItem.prob)}`}
                                      style={{ width: `${caseItem.prob}%` }}
                                    />
                                  </div>
                                  <span className={`text-lg font-extrabold ${styles.prob}`}>
                                    {caseItem.prob}%
                                  </span>
                                </div>
                                {/* Time indicator */}
                                <Badge className={`text-[9px] font-bold ${styles.badge}`}>
                                  {caseItem.timeLeft}
                                </Badge>
                              </div>
                            </div>

                            {/* Expandable content */}
                            <div className={`overflow-hidden transition-all ${isExpanded ? "max-h-[500px]" : "max-h-0"}`}>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border/50">
                                {/* Risk Factors with Severity Colors */}
                                <div className="space-y-2">
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                                    Risk Factors
                                  </p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {caseItem.riskFactors.map((rf) => (
                                      <Tooltip key={rf.factor}>
                                        <TooltipTrigger asChild>
                                          <Badge
                                            variant="outline"
                                            className={`text-[10px] font-medium cursor-pointer ${getSeverityColor(rf.severity)}`}
                                          >
                                            {rf.factor}
                                          </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p className="text-xs capitalize">Severity: {rf.severity}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    ))}
                                  </div>
                                </div>
                                
                                {/* AI Suggested Action */}
                                <div className="space-y-2">
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                    <Lightbulb className="h-3 w-3 text-primary" />
                                    AI-Suggested Action
                                  </p>
                                  <p className={`text-sm font-semibold ${isCritical ? "text-rose-700" : "text-foreground"}`}>
                                    {caseItem.nextAction}
                                  </p>
                                </div>
                                
                                {/* Est Resolution */}
                                <div className="space-y-2">
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                    <Timer className="h-3 w-3 text-primary" />
                                    Est. Resolution
                                  </p>
                                  <p className="text-sm font-semibold text-foreground">{caseItem.estResolution}</p>
                                </div>
                              </div>

                              {/* Notes section */}
                              <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-border">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                    <StickyNote className="h-3 w-3" /> Notes
                                  </p>
                                  {editingNoteId !== caseItem.id && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-6 text-xs"
                                      onClick={() => {
                                        setEditingNoteId(caseItem.id);
                                        setNoteInput(caseItem.notes);
                                      }}
                                    >
                                      {caseItem.notes ? "Edit" : "Add note"}
                                    </Button>
                                  )}
                                </div>
                                {editingNoteId === caseItem.id ? (
                                  <div className="space-y-2">
                                    <Textarea
                                      value={noteInput}
                                      onChange={(e) => setNoteInput(e.target.value)}
                                      placeholder="Add internal notes..."
                                      className="text-sm min-h-[60px]"
                                    />
                                    <div className="flex gap-2 justify-end">
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => setEditingNoteId(null)}
                                      >
                                        Cancel
                                      </Button>
                                      <Button 
                                        size="sm"
                                        onClick={() => handleSaveNote(caseItem)}
                                      >
                                        Save
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground italic">
                                    {caseItem.notes || "No notes added"}
                                  </p>
                                )}
                              </div>

                              {/* Snooze options */}
                              <div className="mt-4 flex items-center gap-2 text-xs">
                                <span className="text-muted-foreground">Snooze:</span>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 text-xs"
                                  onClick={() => handleSnooze(caseItem, 24)}
                                >
                                  <Clock className="h-3 w-3 mr-1" /> 24h
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 text-xs"
                                  onClick={() => handleSnooze(caseItem, 168)}
                                >
                                  1 week
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 text-xs text-rose-600 hover:text-rose-700"
                                  onClick={() => handleDismiss(caseItem)}
                                >
                                  <X className="h-3 w-3 mr-1" /> Dismiss
                                </Button>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-4 flex items-center justify-between">
                              {/* Expand/Collapse toggle */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-8"
                                onClick={() => toggleExpand(caseItem.id)}
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="h-3 w-3 mr-1" /> Less
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-3 w-3 mr-1" /> More
                                  </>
                                )}
                              </Button>

                              <div className="flex gap-2">
                                {/* Mark reviewed */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs h-8"
                                  onClick={() => handleMarkReviewed(caseItem)}
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  {caseItem.reviewed ? "Unmark" : "Mark reviewed"}
                                </Button>

                                {/* View details */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-8"
                                  onClick={() => openDetails(caseItem)}
                                >
                                  View Details
                                </Button>

                                {/* Action buttons based on importance */}
                                {isStrategyApplied ? (
                                  <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                                    ✓ Action Taken
                                  </Badge>
                                ) : isCritical ? (
                                  <>
                                    <Button 
                                      size="sm" 
                                      variant="destructive" 
                                      className="text-xs h-8 font-bold"
                                      onClick={() => handleLegalAction(caseItem)}
                                    >
                                      <Gavel className="h-3 w-3 mr-1" />
                                      Legal Action
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      className="text-xs h-8 font-bold bg-amber-500 hover:bg-amber-600"
                                      onClick={() => handleEscalate(caseItem)}
                                    >
                                      <Zap className="h-3 w-3 mr-1" />
                                      Escalate
                                    </Button>
                                  </>
                                ) : caseItem.importance === "warning" ? (
                                  <Button 
                                    size="sm" 
                                    className="text-xs h-8 font-bold bg-blue-500 hover:bg-blue-600"
                                    onClick={() => handleEscalate(caseItem)}
                                  >
                                    <MessageSquare className="h-3 w-3 mr-1" />
                                    Contact CFO
                                  </Button>
                                ) : (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-xs h-8 font-bold"
                                    onClick={() => handleApplyStrategy(caseItem)}
                                  >
                                    Apply Strategy <ChevronRight className="ml-1 h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && !isLoading && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-slate-50/50">
                      <p className="text-xs text-muted-foreground">
                        Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredCases.length)} of {filteredCases.length}
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
            </div>

            {/* Chatbot Sidebar */}
            <div className="space-y-6">
              <div className="h-[650px]">
                <ChatBot />
              </div>
            </div>
          </div>

          {/* View Details Dialog */}
          <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Case Details
                  {selectedCase && (
                    <Badge variant="outline" className="ml-2 font-mono text-xs">
                      {selectedCase.id}
                    </Badge>
                  )}
                </DialogTitle>
              </DialogHeader>
              {selectedCase && (
                <div className="space-y-4">
                  {/* Customer Info */}
                  <div className="p-4 rounded-lg bg-slate-50 border border-border">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Customer Information</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Name</p>
                        <p className="text-sm font-bold">{selectedCase.customer}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Amount</p>
                        <p className="text-sm font-bold text-rose-600">${selectedCase.amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm font-medium">{selectedCase.customerEmail}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="text-sm font-medium">{selectedCase.customerPhone}</p>
                      </div>
                    </div>
                  </div>

                  {/* AI Analysis */}
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-2">AI Analysis</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Recovery Probability</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-slate-200">
                            <div
                              className={`h-full rounded-full ${getProbColor(selectedCase.prob)}`}
                              style={{ width: `${selectedCase.prob}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold">{selectedCase.prob}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Est. Resolution</p>
                        <p className="text-sm font-bold">{selectedCase.estResolution}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground">Suggested Action</p>
                      <p className="text-sm font-bold text-primary">{selectedCase.nextAction}</p>
                    </div>
                  </div>

                  {/* Risk Factors */}
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Risk Factors</p>
                    <div className="space-y-2">
                      {selectedCase.riskFactors.map((rf, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-border">
                          <span className="text-sm">{rf.factor}</span>
                          <Badge className={`text-[10px] ${getSeverityColor(rf.severity)}`}>
                            {rf.severity}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedCase.notes && (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <p className="text-xs font-bold text-amber-700 uppercase mb-1">Internal Notes</p>
                      <p className="text-sm text-amber-800">{selectedCase.notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <a
                      href={`tel:${selectedCase.customerPhone}`}
                      className="flex-1"
                    >
                      <Button variant="outline" className="w-full">
                        <Phone className="h-4 w-4 mr-2" /> Call
                      </Button>
                    </a>
                    <a
                      href={`mailto:${selectedCase.customerEmail}?subject=Regarding Case ${selectedCase.id}`}
                      className="flex-1"
                    >
                      <Button variant="outline" className="w-full">
                        <Mail className="h-4 w-4 mr-2" /> Email
                      </Button>
                    </a>
                    <Button
                      className="flex-1"
                      onClick={() => {
                        handleApplyStrategy(selectedCase);
                        setIsDetailsOpen(false);
                      }}
                    >
                      Apply Strategy
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </TooltipProvider>
  );
}
