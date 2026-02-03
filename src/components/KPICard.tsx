"use client";

import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface KPIData {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: LucideIcon;
  importance: "critical" | "warning" | "attention" | "healthy" | "neutral";
  subtext?: string;
  tooltip: string;
}

interface KPICardProps {
  kpi: KPIData;
}

function getImportanceStyles(importance: string) {
  switch (importance) {
    case "critical":
      return {
        card: "border-l-4 border-l-rose-500 bg-rose-50/30",
        icon: "bg-rose-100 text-rose-600",
        badge: "bg-rose-100 text-rose-700",
        value: "text-rose-700",
      };
    case "warning":
      return {
        card: "border-l-4 border-l-amber-500 bg-amber-50/20",
        icon: "bg-amber-100 text-amber-600",
        badge: "bg-amber-100 text-amber-700",
        value: "text-foreground",
      };
    case "attention":
      return {
        card: "border-l-2 border-l-blue-300 bg-blue-50/10",
        icon: "bg-blue-50 text-blue-600",
        badge: "bg-blue-50 text-blue-600",
        value: "text-foreground",
      };
    case "healthy":
      return {
        card: "border-l-2 border-l-emerald-300 bg-emerald-50/10",
        icon: "bg-emerald-50 text-emerald-600",
        badge: "bg-emerald-50 text-emerald-600",
        value: "text-foreground",
      };
    default:
      return {
        card: "border border-slate-200 bg-white",
        icon: "bg-slate-100 text-slate-500",
        badge: "bg-slate-100 text-slate-600",
        value: "text-foreground",
      };
  }
}

export function KPICard({ kpi }: KPICardProps) {
  const Icon = kpi.icon;
  const styles = getImportanceStyles(kpi.importance);
  const isCritical = kpi.importance === "critical";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Card
          className={`${styles.card} hover:shadow-md transition-all cursor-pointer group relative overflow-hidden`}
        >
          {isCritical && (
            <div className="absolute top-0 right-0 w-0 h-0 border-t-[24px] border-t-rose-500 border-l-[24px] border-l-transparent" />
          )}
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${styles.icon}`}
              >
                <Icon className={`h-4 w-4 ${isCritical ? "animate-pulse" : ""}`} />
              </div>
              <div
                className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${styles.badge}`}
              >
                {kpi.trend === "up" ? (
                  <ArrowUpRight className="h-2.5 w-2.5" />
                ) : (
                  <ArrowDownRight className="h-2.5 w-2.5" />
                )}
                {kpi.change}
              </div>
            </div>
            <p
              className={`text-2xl font-extrabold tracking-tight ${styles.value}`}
            >
              {kpi.value}
            </p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">
              {kpi.title}
            </p>
            {kpi.subtext && (
              <p
                className={`text-[9px] mt-1 font-semibold ${
                  isCritical
                    ? "text-rose-600"
                    : kpi.importance === "warning"
                      ? "text-amber-600"
                      : "text-muted-foreground"
                }`}
              >
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
}

interface KPIGridProps {
  kpis: KPIData[];
  columns?: number;
}

export function KPIGrid({ kpis, columns = 6 }: KPIGridProps) {
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
    6: "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
  };

  return (
    <section className={`grid ${gridCols[columns as keyof typeof gridCols] || gridCols[6]} gap-3`}>
      {kpis.map((kpi) => (
        <KPICard key={kpi.title} kpi={kpi} />
      ))}
    </section>
  );
}
