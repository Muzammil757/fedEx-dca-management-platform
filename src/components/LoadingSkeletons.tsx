"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * Skeleton loader for KPI cards
 */
export function KPICardSkeleton() {
  return (
    <Card className="border border-slate-200 bg-white">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        <Skeleton className="h-8 w-24 mb-2" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-2.5 w-16 mt-1" />
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loader for a grid of KPI cards
 */
export function KPIGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <KPICardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton loader for the Dynamic Insight Bar
 */
export function InsightBarSkeleton() {
  return (
    <div className="bg-slate-200 rounded-xl p-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div>
            <Skeleton className="h-5 w-64 mb-1" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
    </div>
  );
}

/**
 * Skeleton loader for table rows
 */
export function TableRowSkeleton({ columns = 6 }: { columns?: number }) {
  return (
    <tr className="border-b border-border/50">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-3">
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

/**
 * Skeleton loader for the Priority Queue Table
 */
export function PriorityQueueTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card className="bg-white border-border shadow-sm">
      <CardHeader className="pb-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-16 rounded-full ml-2" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80 border-b border-border/50">
                {["Priority", "Customer", "Amount", "Time Pressure", "Status", "Actions"].map(
                  (header) => (
                    <th
                      key={header}
                      className="text-left p-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="p-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </td>
                  <td className="p-3">
                    <Skeleton className="h-4 w-28 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </td>
                  <td className="p-3">
                    <Skeleton className="h-4 w-20" />
                  </td>
                  <td className="p-3">
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </td>
                  <td className="p-3">
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Skeleton className="h-7 w-16 rounded-md" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loader for the Escalation Radar chart
 */
export function EscalationRadarSkeleton() {
  return (
    <Card className="bg-white border-border shadow-sm">
      <CardHeader className="pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-28" />
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[200px] w-full flex items-center justify-center">
          <Skeleton className="h-32 w-32 rounded-full" />
        </div>
        <div className="mt-3 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-8" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loader for a card with chart
 */
export function ChartCardSkeleton({ height = 200 }: { height?: number }) {
  return (
    <Card className="bg-white border-border shadow-sm">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-32" />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <Skeleton className="w-full rounded-lg" style={{ height }} />
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loader for activity items
 */
export function ActivityListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <Card className="bg-white border-border shadow-sm">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-28" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/50">
          {Array.from({ length: items }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-2.5 w-2.5 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Full dashboard skeleton for initial page load
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <InsightBarSkeleton />
      <KPIGridSkeleton count={6} />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <PriorityQueueTableSkeleton rows={5} />
        </div>
        <EscalationRadarSkeleton />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityListSkeleton items={5} />
        <ChartCardSkeleton height={180} />
      </div>
    </div>
  );
}
