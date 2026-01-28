"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Bell,
  Calendar,
  ChevronRight,
  Timer,
  TrendingUp,
  Shield,
  Workflow,
  AlertCircle,
  Activity,
} from "lucide-react";

const slaOverview = [
  { label: "On Track", count: 2847, percentage: 74, color: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: CheckCircle2 },
  { label: "At Risk", count: 523, percentage: 14, color: "bg-amber-50 text-amber-600 border-amber-100", icon: AlertTriangle },
  { label: "Breached", count: 312, percentage: 8, color: "bg-rose-50 text-rose-600 border-rose-100", icon: XCircle },
  { label: "Resolved", count: 165, percentage: 4, color: "bg-sky-50 text-sky-600 border-sky-100", icon: Shield },
];

const workflowStages = [
  { stage: "Initial Contact", cases: 847, avgDays: 3, slaLimit: 5, status: "healthy" },
  { stage: "Follow-up", cases: 623, avgDays: 8, slaLimit: 10, status: "healthy" },
  { stage: "Negotiation", cases: 412, avgDays: 14, slaLimit: 15, status: "warning" },
  { stage: "Payment Plan", cases: 287, avgDays: 7, slaLimit: 7, status: "critical" },
  { stage: "Escalation", cases: 156, avgDays: 4, slaLimit: 5, status: "healthy" },
  { stage: "Legal Review", cases: 89, avgDays: 18, slaLimit: 20, status: "warning" },
];

const casesAtRisk = [
  {
    id: "DCA-2024-3845",
    customer: "FastTrack Deliveries",
    stage: "Negotiation",
    daysInStage: 14,
    slaLimit: 15,
    daysRemaining: 1,
    dca: "Global Collections",
    status: "at-risk",
  },
  {
    id: "DCA-2024-3841",
    customer: "Harbor Logistics",
    stage: "Payment Plan",
    daysInStage: 6,
    slaLimit: 7,
    daysRemaining: 1,
    dca: "Alpha Recovery Inc",
    status: "at-risk",
  },
  {
    id: "DCA-2024-3838",
    customer: "Metro Express",
    stage: "Follow-up",
    daysInStage: 9,
    slaLimit: 10,
    daysRemaining: 1,
    dca: "Prime Debt Solutions",
    status: "at-risk",
  },
];

const escalationPath = [
  { level: 1, name: "DCA Agent", timeLimit: "5 days", auto: true },
  { level: 2, name: "DCA Supervisor", timeLimit: "3 days", auto: true },
  { level: 3, name: "Enterprise Recovery Team", timeLimit: "5 days", auto: true },
  { level: 4, name: "Senior Management", timeLimit: "7 days", auto: false },
  { level: 5, name: "Legal Department", timeLimit: "As needed", auto: false },
];

export default function SLAMonitoringPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Clock className="h-6 w-6 text-primary" />
              SLA Monitoring
            </h1>
            <p className="text-sm text-muted-foreground">
              Real-time tracking of recovery timelines and automated escalation stages
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-border bg-white">
              <Calendar className="mr-2 h-4 w-4" />
              SLA Report
            </Button>
            <Button className="bg-primary hover:bg-primary/90">
              <Bell className="mr-2 h-4 w-4" />
              Alert Settings
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {slaOverview.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.label} className="bg-white border-border shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className={`font-bold ${item.color} border-none`}>
                      {item.percentage}%
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{item.count.toLocaleString()}</p>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{item.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white border-border shadow-sm">
              <CardHeader className="pb-3 border-b border-border bg-secondary/10">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Workflow className="h-5 w-5 text-primary" />
                  Workflow Stage Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {workflowStages.map((stage) => (
                    <div key={stage.stage} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`h-2 w-2 rounded-full ${
                            stage.status === "healthy" ? "bg-emerald-500" :
                            stage.status === "warning" ? "bg-amber-500" : "bg-rose-500"
                          }`} />
                          <span className="text-sm font-bold text-foreground">{stage.stage}</span>
                          <Badge variant="secondary" className="text-[10px] font-semibold bg-slate-100 text-slate-600">
                            {stage.cases} cases
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                          <span>Avg: <span className="text-foreground">{stage.avgDays}d</span></span>
                          <span className="text-slate-300">|</span>
                          <span>Limit: <span className="text-foreground">{stage.slaLimit}d</span></span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            stage.status === "healthy" ? "bg-emerald-500" :
                            stage.status === "warning" ? "bg-amber-500" : "bg-rose-500"
                          }`}
                          style={{ width: `${Math.min((stage.avgDays / stage.slaLimit) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-border shadow-sm">
              <CardHeader className="pb-3 border-b border-border bg-amber-50/50">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="h-5 w-5" />
                  Cases Nearing SLA Breach
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {casesAtRisk.map((caseItem) => (
                    <div key={caseItem.id} className="p-4 flex items-center justify-between hover:bg-amber-50/20 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                          <Timer className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground text-sm">{caseItem.customer}</p>
                          <p className="text-[10px] font-mono text-muted-foreground">{caseItem.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Current Stage</p>
                          <p className="text-xs font-semibold text-foreground">{caseItem.stage}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Time Left</p>
                          <Badge className="bg-rose-100 text-rose-700 border-none font-bold text-[10px]">
                            {caseItem.daysRemaining} DAY
                          </Badge>
                        </div>
                        <Button size="sm" className="bg-primary hover:bg-primary/90 text-xs h-8 px-4">
                          Action <ChevronRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-white border-border shadow-sm">
              <CardHeader className="pb-3 border-b border-border bg-secondary/10">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Escalation Stages
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {escalationPath.map((level, idx) => (
                    <div key={level.level} className="relative">
                      {idx < escalationPath.length - 1 && (
                        <div className="absolute left-[15px] top-8 h-full w-[2px] bg-slate-100" />
                      )}
                      <div className="flex items-start gap-4">
                        <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-50 text-xs font-bold text-primary border border-sky-100 shadow-sm">
                          {level.level}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-bold text-foreground">{level.name}</p>
                            {level.auto && (
                              <Badge className="bg-emerald-50 text-emerald-600 border-none text-[9px] font-bold uppercase tracking-tighter">
                                Automated
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Max Wait: <span className="font-bold text-foreground">{level.timeLimit}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-sky-50/50 border-sky-100 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-sky-100 shadow-sm">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Compliance Rate</p>
                    <p className="text-3xl font-bold text-foreground">94.2%</p>
                  </div>
                </div>
                <Progress value={94.2} className="h-1.5" />
                <p className="text-[10px] text-muted-foreground mt-3 italic">
                  Overall platform SLA adherence is up <span className="font-bold text-emerald-600">+2.1%</span> this month.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
