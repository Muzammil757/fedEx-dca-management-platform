"use client";

import { useState } from "react";
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
  FileText,
  Filter,
  Search,
  ChevronRight,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Brain,
  Building2,
  DollarSign,
  User,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  History,
  TrendingUp,
  Download,
  Shield,
} from "lucide-react";

const cases = [
  {
    id: "DCA-2024-3847",
    customer: "Acme Logistics Corp",
    overdueAmount: 125000,
    agingDays: 45,
    dca: "Alpha Recovery Inc",
    aiProbability: 78,
    priority: "high",
    slaStatus: "on-track",
    caseStatus: "active",
    notes: "Customer requested payment extension",
    lastUpdate: "2 hours ago",
  },
  {
    id: "DCA-2024-3846",
    customer: "Global Shipping Ltd",
    overdueAmount: 87500,
    agingDays: 32,
    dca: "Prime Debt Solutions",
    aiProbability: 85,
    priority: "medium",
    slaStatus: "on-track",
    caseStatus: "negotiating",
    notes: "Payment plan discussion scheduled",
    lastUpdate: "4 hours ago",
  },
  {
    id: "DCA-2024-3845",
    customer: "FastTrack Deliveries",
    overdueAmount: 234000,
    agingDays: 67,
    dca: "Global Collections",
    aiProbability: 42,
    priority: "critical",
    slaStatus: "at-risk",
    caseStatus: "escalated",
    notes: "Legal action under review",
    lastUpdate: "1 day ago",
  },
  {
    id: "DCA-2024-3844",
    customer: "Metro Transport Inc",
    overdueAmount: 56000,
    agingDays: 21,
    dca: "Alpha Recovery Inc",
    aiProbability: 92,
    priority: "low",
    slaStatus: "on-track",
    caseStatus: "active",
    notes: "First contact made, responsive",
    lastUpdate: "6 hours ago",
  },
  {
    id: "DCA-2024-3843",
    customer: "Continental Freight",
    overdueAmount: 178500,
    agingDays: 78,
    dca: "Prime Debt Solutions",
    aiProbability: 35,
    priority: "critical",
    slaStatus: "breached",
    caseStatus: "legal",
    notes: "Sent to legal department",
    lastUpdate: "3 days ago",
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
  notes: "Customer requested payment extension. Waiting for revised schedule.",
  lastUpdate: "2024-03-20 14:30",
};

export default function CasesPage() {
  const [selectedCase, setSelectedCase] = useState(initialSelectedCase);

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
          <Button className="bg-primary hover:bg-primary/90">
            <Download className="mr-2 h-4 w-4" />
            Export Portfolio
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border border-border shadow-sm">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by Case ID, Customer, or DCA..."
              className="h-10 w-full rounded-lg border border-border bg-slate-50 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <Select defaultValue="all">
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
            <Select defaultValue="all">
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
            <Button variant="outline" size="icon" className="border-border hover:bg-slate-50">
              <Filter className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2 bg-white border-border shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border bg-secondary/10 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Active Recovery Cases
                </CardTitle>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-bold">
                  {cases.length} Total Cases
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider py-4">Case ID</TableHead>
                    <TableHead className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider py-4">Customer</TableHead>
                    <TableHead className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider py-4 text-right">Amount</TableHead>
                    <TableHead className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider py-4 text-center">Aging</TableHead>
                    <TableHead className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider py-4">Agency</TableHead>
                    <TableHead className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider py-4 text-center">AI Prob.</TableHead>
                    <TableHead className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider py-4 text-center">Priority</TableHead>
                    <TableHead className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider py-4 text-center">SLA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cases.map((caseItem) => {
                    const sla = getSlaStatusBadge(caseItem.slaStatus);
                    const SlaIcon = sla.icon;
                    const isSelected = selectedCase.id === caseItem.id;
                    return (
                      <TableRow
                        key={caseItem.id}
                        className={`border-border cursor-pointer transition-colors hover:bg-slate-50 ${isSelected ? "bg-sky-50/50" : ""}`}
                        onClick={() => setSelectedCase({ ...initialSelectedCase, id: caseItem.id, customer: { ...initialSelectedCase.customer, name: caseItem.customer }, overdueAmount: caseItem.overdueAmount, agingDays: caseItem.agingDays, dca: caseItem.dca, slaStatus: caseItem.slaStatus } as any)}
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
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Overdue Amount</p>
                      <p className="text-lg font-bold text-rose-600">${selectedCase.financial?.totalOverdue?.toLocaleString() || selectedCase.overdueAmount?.toLocaleString()}</p>
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

                <div className="pt-4 border-t border-border">
                  <div className="bg-sky-50/50 rounded-xl p-4 border border-sky-100">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Brain className="h-3.5 w-3.5" /> AI Recovery Insight
                    </p>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-muted-foreground">Recovery Probability</span>
                      <span className="text-sm font-bold text-emerald-600">High (78%)</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: "78%" }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-3 italic leading-tight font-medium">
                      “Case details update dynamically based on selected record (enterprise demo)”
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1 bg-primary hover:bg-primary/90 text-[10px] font-bold uppercase tracking-wider h-9">
                    Full History
                  </Button>
                  <Button variant="outline" className="flex-1 border-border text-[10px] font-bold uppercase tracking-wider h-9 hover:bg-slate-50">
                    Contact Agency
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-border shadow-sm">
              <CardHeader className="pb-2 border-b border-border bg-slate-50">
                <CardTitle className="text-xs font-bold flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  Audit Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 px-4 pb-4">
                <div className="space-y-4">
                  {[
                    { event: "Demand letter dispatched", date: "Mar 18, 2024", icon: FileText },
                    { event: "Settlement offer proposed", date: "Mar 15, 2024", icon: MessageSquare },
                    { event: "Internal risk validation", date: "Mar 10, 2024", icon: Shield },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="h-7 w-7 rounded-lg bg-sky-50 flex items-center justify-center shrink-0 border border-sky-100">
                        <item.icon className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{item.event}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase">{item.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
