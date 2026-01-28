"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow } from
"@/components/ui/table";
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
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  Download,
  Shield,
  Zap } from
"lucide-react";

const dcaPerformance = [
{
  name: "Alpha Recovery Inc",
  totalCases: 312,
  recovered: 262,
  recoveryRate: 84,
  slaCompliance: 96,
  avgResolutionDays: 28,
  totalRecovered: 4.2,
  trend: "up",
  rank: 1
},
{
  name: "Global Collections",
  totalCases: 287,
  recovered: 227,
  recoveryRate: 79,
  slaCompliance: 91,
  avgResolutionDays: 32,
  totalRecovered: 3.8,
  trend: "up",
  rank: 2
},
{
  name: "Prime Debt Solutions",
  totalCases: 245,
  recovered: 186,
  recoveryRate: 76,
  slaCompliance: 88,
  avgResolutionDays: 35,
  totalRecovered: 3.1,
  trend: "down",
  rank: 3
}];


const performanceMetrics = [
  { label: "Total DCAs Active", value: "5", icon: Users, color: "bg-primary/10 text-primary" },
  { label: "Avg Recovery Rate", value: "78.4%", icon: Target, color: "bg-sky-100 text-sky-600" },
  { label: "Total Recovered (MTD)", value: "$15.4M", icon: DollarSign, color: "bg-emerald-100 text-emerald-600" },
  { label: "Avg SLA Compliance", value: "88.4%", icon: Clock, color: "bg-slate-100 text-slate-600" }
];

export default function DCAPerformancePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              DCA Performance
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              Comparative analysis of external debt collection agency performance
            </p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 shadow-sm shadow-primary/20 transition-all">
            <Download className="mr-2 h-4 w-4" />
            Download Scorecards
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {performanceMetrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Card key={metric.label} className="bg-white border-border shadow-sm hover:border-primary/20 transition-all">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-sm ${metric.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground tracking-tight">{metric.value}</p>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{metric.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-white border-border shadow-sm overflow-hidden">
            <CardHeader className="pb-4 border-b border-border bg-slate-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Agency Performance Matrix
                </CardTitle>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold">
                  Last 30 Days
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-extrabold text-[10px] uppercase tracking-wider py-4">Agency</TableHead>
                    <TableHead className="text-muted-foreground font-extrabold text-[10px] uppercase tracking-wider py-4 text-center">Recovery Rate</TableHead>
                    <TableHead className="text-muted-foreground font-extrabold text-[10px] uppercase tracking-wider py-4 text-center">SLA Adherence</TableHead>
                    <TableHead className="text-muted-foreground font-extrabold text-[10px] uppercase tracking-wider py-4 text-center">Avg Days</TableHead>
                    <TableHead className="text-muted-foreground font-extrabold text-[10px] uppercase tracking-wider py-4 text-right">Total Vol.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dcaPerformance.map((dca) => (
                    <TableRow key={dca.name} className="border-border hover:bg-primary/[0.02] transition-colors group">
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary border border-primary/10 group-hover:scale-105 transition-transform">
                            {dca.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">{dca.name}</p>
                            <p className="text-[10px] font-medium text-muted-foreground">{dca.totalCases} active cases</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="text-sm font-bold text-foreground">{dca.recoveryRate}%</span>
                          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full shadow-sm ${dca.recoveryRate >= 80 ? "bg-emerald-500" : "bg-primary"}`}
                              style={{ width: `${dca.recoveryRate}%` }} 
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <div className="flex items-center justify-center gap-2">
                          {dca.slaCompliance >= 90 ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          )}
                          <span className={`text-sm font-bold ${dca.slaCompliance >= 90 ? "text-emerald-600" : "text-amber-600"}`}>
                            {dca.slaCompliance}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-4 text-sm font-bold text-foreground">
                        {dca.avgResolutionDays}d
                      </TableCell>
                      <TableCell className="text-right py-4 font-extrabold text-foreground">
                        ${dca.totalRecovered}M
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="bg-white border-border shadow-sm">
              <CardHeader className="pb-4 border-b border-border bg-slate-50/50">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {[
                    { title: "Highest Recovery", dca: "Alpha Recovery Inc", value: "84%", icon: Zap, color: "text-blue-500 bg-blue-50" },
                    { title: "SLA Champion", dca: "Global Collections", value: "96%", icon: Award, color: "text-emerald-500 bg-emerald-50" },
                    { title: "Volume Leader", dca: "Alpha Recovery Inc", value: "312 Cases", icon: TrendingUp, color: "text-sky-500 bg-sky-50" },
                  ].map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div key={idx} className="flex items-center gap-4 group">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${item.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{item.title}</p>
                          <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{item.dca}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-extrabold text-primary">{item.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-8 p-4 rounded-xl bg-slate-50 border border-border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Target className="h-3 w-3 text-primary" /> AI Performance Note
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    Alpha Recovery Inc shows high proficiency in <span className="font-bold text-foreground">Tier 2 logistics claims</span>, with a 15% higher success rate than average.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/10 shadow-sm relative overflow-hidden group">
              <div className="absolute right-0 top-0 h-24 w-24 bg-primary/10 blur-3xl" />
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-primary/10 shadow-sm group-hover:rotate-6 transition-transform">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Avg Recovery Yield</p>
                    <p className="text-3xl font-extrabold text-foreground">78.4%</p>
                  </div>
                </div>
                <Progress value={78.4} className="h-2 bg-white/50" />
                <p className="text-[10px] text-muted-foreground mt-3 italic font-medium">
                  Overall DCA recovery rate has increased by <span className="font-bold text-emerald-600">+1.2%</span> since last quarter.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
