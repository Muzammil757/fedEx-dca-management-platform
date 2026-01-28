"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Clock,
  Zap,
  ChevronRight,
  Info,
  Lightbulb,
  Timer,
  BarChart3,
  Target,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const prioritizedCases = [
  {
    id: "DCA-2024-3847",
    customer: "Acme Logistics Corp",
    amount: 125000,
    prob: 78,
    riskFactors: ["Market downturn", "Payment delay history"],
    nextAction: "Propose structured 15% settlement",
    estResolution: "14 days",
  },
  {
    id: "DCA-2024-3845",
    customer: "FastTrack Deliveries",
    amount: 234000,
    prob: 42,
    riskFactors: ["Declining revenue", "Incomplete documentation"],
    nextAction: "Direct legal intervention recommended",
    estResolution: "45 days",
  },
  {
    id: "DCA-2024-3841",
    customer: "Harbor Logistics",
    amount: 98700,
    prob: 61,
    riskFactors: ["Communication gap", "Senior mgmt change"],
    nextAction: "Escalate to CFO level contact",
    estResolution: "22 days",
  },
];

const agingBuckets = [
  { range: "0-30 Days", amount: 12.4, color: "bg-emerald-500" },
  { range: "31-60 Days", amount: 8.2, color: "bg-primary" },
  { range: "60+ Days", amount: 4.1, color: "bg-amber-500" },
];

export default function IntelligencePage() {
  return (
    <DashboardLayout>
      <TooltipProvider>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Brain className="h-6 w-6 text-primary" />
                Recovery Intelligence
              </h1>
              <p className="text-sm text-muted-foreground">
                AI-powered predictions and risk analysis for the recovery portfolio
              </p>
            </div>
            <Button className="bg-primary hover:bg-primary/90">
              <Zap className="mr-2 h-4 w-4" />
              Run Prediction Model
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-white border-border shadow-sm">
                <CardHeader className="pb-3 border-b border-border bg-secondary/10">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Prioritized AI Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/50">
                    {prioritizedCases.map((caseItem) => (
                      <div key={caseItem.id} className="p-6 hover:bg-secondary/10 transition-colors group">
                        <div className="flex items-start justify-between mb-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground">{caseItem.customer}</span>
                              <Badge variant="outline" className="text-[10px] font-mono text-primary border-primary/20 bg-primary/5">
                                {caseItem.id}
                              </Badge>
                            </div>
                            <p className="text-2xl font-bold text-foreground">
                              ${caseItem.amount.toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right space-y-2">
                            <div className="flex items-center gap-2 justify-end">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Recovery Probability</span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button className="focus:outline-none">
                                    <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-primary transition-colors" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-white text-foreground border-border shadow-md">
                                  <p className="text-[10px]">Calculated based on 50+ data points including payment history & industry trends</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${caseItem.prob > 70 ? "bg-emerald-500" : caseItem.prob > 50 ? "bg-primary" : "bg-amber-500"}`}
                                  style={{ width: `${caseItem.prob}%` }}
                                />
                              </div>
                              <span className={`text-sm font-bold ${caseItem.prob > 70 ? "text-emerald-600" : caseItem.prob > 50 ? "text-primary" : "text-amber-600"}`}>
                                {caseItem.prob}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3 text-amber-500" /> Recovery Risk Factors
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {caseItem.riskFactors.map((f) => (
                                <Badge key={f} variant="outline" className="text-[10px] font-medium bg-white text-muted-foreground border-border">
                                  {f}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                              <Lightbulb className="h-3 w-3 text-primary" /> AI-Suggested Next Action
                            </p>
                            <p className="text-sm font-semibold text-foreground">{caseItem.nextAction}</p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                              <Timer className="h-3 w-3 text-primary" /> Est. Resolution Time
                            </p>
                            <p className="text-sm font-semibold text-foreground">{caseItem.estResolution}</p>
                          </div>
                        </div>
                        
                        <div className="mt-4 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" className="text-primary text-xs font-bold hover:bg-primary/5 h-8">
                            Apply Strategy <ChevronRight className="ml-1 h-3 w-3" />
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
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Aging Bucket Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {agingBuckets.map((bucket) => (
                      <div key={bucket.range} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-foreground">{bucket.range}</span>
                          <span className="text-sm font-bold text-primary">${bucket.amount}M</span>
                        </div>
                        <div className="h-3 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${bucket.color}`}
                            style={{ width: `${(bucket.amount / 12.4) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="flex gap-3">
                      <Brain className="h-5 w-5 text-primary shrink-0" />
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        AI projection: Implementing suggested strategies could increase recovery efficiency by <span className="font-bold text-primary">12.4%</span> for cases in the 31-60 day bucket.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-border shadow-sm">
                <CardHeader className="pb-3 border-b border-border bg-secondary/10">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Model Confidence
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="relative h-32 w-32 flex items-center justify-center">
                      <svg className="h-full w-full -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="58"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          className="text-secondary"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="58"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          strokeDasharray={364.4}
                          strokeDashoffset={364.4 * (1 - 0.94)}
                          className="text-primary transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-foreground">94.2%</span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Accuracy</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium text-foreground mb-1 tracking-tight">Enterprise Standard Model</p>
                      <p className="text-[10px] text-muted-foreground italic leading-tight">
                        Based on analysis of over 12,500<br />historical recovery cases.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </TooltipProvider>
    </DashboardLayout>
  );
}
