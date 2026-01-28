"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import {
  DollarSign,
  FileText,
  AlertTriangle,
  Clock,
  TrendingUp,
  Brain,
  Shield,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Target,
  Users,
  CheckCircle2,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const kpis = [
  {
    title: "Total Overdue Amount",
    value: "$24.7M",
    change: "+2.3%",
    trend: "up",
    icon: DollarSign,
    color: "bg-primary/10 text-primary",
  },
  {
    title: "Active Cases",
    value: "3,847",
    change: "+127",
    trend: "up",
    icon: FileText,
    color: "bg-sky-100/50 text-sky-600",
  },
  {
    title: "High-Risk Accounts",
    value: "482",
    change: "-18",
    trend: "down",
    icon: AlertTriangle,
    color: "bg-slate-100 text-slate-600",
  },
  {
    title: "SLA Breaches",
    value: "23",
    change: "-7",
    trend: "down",
    icon: Clock,
    color: "bg-rose-100 text-rose-600",
  },
  {
    title: "Expected Recoveries",
    value: "$18.2M",
    change: "+5.8%",
    trend: "up",
    icon: TrendingUp,
    color: "bg-emerald-100 text-emerald-600",
  },
];

const capabilities = [
  {
    title: "Case Management",
    description: "Centralized tracking of all overdue accounts with real-time status updates and automated workflows",
    icon: FileText,
    features: ["Case lifecycle tracking", "Document management", "Automated escalations"],
  },
  {
    title: "AI Insights",
    description: "Machine learning models that predict recovery probability and recommend optimal collection strategies",
    icon: Brain,
    features: ["Recovery predictions", "Risk scoring", "Smart prioritization"],
  },
  {
    title: "DCA Performance",
    description: "Comprehensive analytics on external agency performance with comparative benchmarking",
    icon: BarChart3,
    features: ["Agency scorecards", "Recovery rates", "SLA adherence"],
  },
  {
    title: "Compliance & Governance",
    description: "Built-in SLA enforcement and audit trails ensuring regulatory compliance and accountability",
    icon: Shield,
    features: ["SLA monitoring", "Audit trails", "Role-based access"],
  },
];

const recentActivities = [
  { case: "DCA-2024-3847", action: "Escalated to Senior Recovery", time: "2 min ago", status: "urgent" },
  { case: "DCA-2024-3841", action: "Payment plan approved", time: "15 min ago", status: "success" },
  { case: "DCA-2024-3839", action: "AI flagged high-risk", time: "32 min ago", status: "warning" },
  { case: "DCA-2024-3835", action: "SLA breach warning", time: "1 hour ago", status: "alert" },
  { case: "DCA-2024-3830", action: "Full recovery achieved", time: "2 hours ago", status: "success" },
];

export default function HomePage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-2xl bg-white p-8 border border-border shadow-sm group">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(77,163,255,0.08),transparent_60%)]" />
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl group-hover:bg-primary/10 transition-colors duration-500" />
          
          <div className="relative z-10 max-w-3xl">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
              <Zap className="mr-1.5 h-3 w-3" />
              Enterprise Recovery Solution
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-3">
              Recover<span className="text-primary">IQ</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-4 font-semibold tracking-tight">
              Intelligent Debt Recovery & DCA Governance
            </p>
            <p className="text-sm text-muted-foreground/80 leading-relaxed max-w-2xl font-medium">
              RecoverIQ provides centralized control over the debt recovery lifecycle. 
              Using AI-driven prioritization and automated SLA enforcement, we help large logistics enterprises 
              manage external DCAs efficiently and maximize recovery yields.
            </p>
          </div>

          <div className="absolute right-12 top-1/2 -translate-y-1/2 hidden xl:block">
            <div className="relative h-40 w-40">
              <div className="absolute inset-0 rounded-3xl bg-primary/10 rotate-12 blur-2xl animate-pulse-slow" />
              <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-white shadow-xl border border-primary/10 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                <Shield className="h-16 w-16 text-primary glow" />
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.title} className="bg-white border-border hover:border-primary/40 hover:shadow-md transition-all group shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-sm ${kpi.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
                      kpi.trend === "up" 
                        ? kpi.title.includes("Breach") || kpi.title.includes("Risk") 
                          ? "bg-rose-50 text-rose-600" 
                          : "bg-emerald-50 text-emerald-600"
                        : kpi.title.includes("Breach") || kpi.title.includes("Risk")
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-rose-50 text-rose-600"
                    }`}>
                      {kpi.trend === "up" ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {kpi.change}
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground tracking-tight mb-1">{kpi.value}</p>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{kpi.title}</p>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white border-border shadow-sm overflow-hidden">
            <CardHeader className="pb-4 border-b border-border/50 bg-slate-50/50">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Platform Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {capabilities.map((cap) => {
                const Icon = cap.icon;
                return (
                  <div
                    key={cap.title}
                    className="group rounded-xl p-4 border border-border/50 hover:border-primary/30 hover:bg-primary/[0.02] transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white border border-border shadow-sm group-hover:border-primary/20 transition-colors">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{cap.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3 leading-relaxed font-medium">{cap.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {cap.features.map((feature) => (
                            <Badge key={feature} variant="outline" className="text-[10px] font-bold bg-white text-slate-600 border-border group-hover:border-primary/20 group-hover:text-primary transition-colors">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="bg-white border-border shadow-sm">
              <CardHeader className="pb-4 border-b border-border/50">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="divide-y divide-border/50">
                  {recentActivities.map((activity, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-4 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full shadow-sm animate-pulse ${
                          activity.status === "success" ? "bg-emerald-500" :
                          activity.status === "warning" ? "bg-amber-500" :
                          activity.status === "alert" ? "bg-rose-500" :
                          "bg-primary"
                        }`} />
                        <div>
                          <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{activity.action}</p>
                          <p className="text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-tighter">{activity.case}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground bg-slate-100 px-2 py-1 rounded">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-border shadow-sm">
              <CardHeader className="pb-4 border-b border-border/50">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Top DCA Partners
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-5">
                  {[
                    { name: "Alpha Recovery Inc", rate: 84, cases: 312 },
                    { name: "Global Collections", rate: 79, cases: 287 },
                    { name: "Prime Debt Solutions", rate: 76, cases: 245 },
                  ].map((dca, idx) => (
                    <div key={idx} className="flex items-center gap-4 group">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary border border-primary/20 group-hover:scale-110 transition-transform">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{dca.name}</span>
                          <span className="text-xs font-bold text-primary">{dca.rate}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-primary shadow-sm" 
                            style={{ width: `${dca.rate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white border-emerald-100/50 shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 h-16 w-16 bg-emerald-500/5 blur-2xl" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 border border-emerald-100 group-hover:rotate-6 transition-transform">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground tracking-tight">$4.2M</p>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Recovered This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-primary/20 shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 h-16 w-16 bg-primary/5 blur-2xl" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 group-hover:rotate-6 transition-transform">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground tracking-tight">94.2%</p>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">SLA Compliance Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-blue-100/50 shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 h-16 w-16 bg-blue-500/5 blur-2xl" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-500 border border-blue-100 group-hover:rotate-6 transition-transform">
                  <Brain className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground tracking-tight">89%</p>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">AI Prediction Accuracy</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </DashboardLayout>
  );
}
