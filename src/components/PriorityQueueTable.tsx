"use client";

import { UserPlus, Timer, Gavel, Zap, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface CustomerData {
  id: number;
  name: string;
  amount: string;
  creditScore: number;
  status: string;
  priority: "high" | "medium" | "low";
  timeLeft: string;
  daysOverdue: number;
}

interface PriorityQueueTableProps {
  customers: CustomerData[];
  onAllocate?: (customer: CustomerData) => void;
  criticalCount?: number;
}

export function PriorityQueueTable({
  customers,
  onAllocate,
  criticalCount = 0,
}: PriorityQueueTableProps) {
  return (
    <Card className="bg-white border-border shadow-sm">
      <CardHeader className="pb-4 border-b border-border/50">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          Priority Queue
          {criticalCount > 0 && (
            <Badge
              variant="outline"
              className="ml-2 text-[10px] font-bold bg-rose-50 text-rose-600 border-rose-200"
            >
              {criticalCount} Critical
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80 border-b border-border/50">
                <th className="text-left p-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-16">
                  Priority
                </th>
                <th className="text-left p-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Customer
                </th>
                <th className="text-left p-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Amount
                </th>
                <th className="text-left p-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Time Pressure
                </th>
                <th className="text-left p-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right p-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {customers.map((customer) => (
                <Tooltip key={customer.id}>
                  <TooltipTrigger asChild>
                    <tr
                      className={`group transition-colors cursor-pointer ${
                        customer.priority === "high"
                          ? "bg-rose-50/30 hover:bg-rose-50/50"
                          : customer.priority === "medium"
                            ? "hover:bg-amber-50/30"
                            : "hover:bg-slate-50/50"
                      }`}
                    >
                      <td className="p-3">
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                            customer.priority === "high"
                              ? "bg-rose-100 text-rose-700"
                              : customer.priority === "medium"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {customer.priority === "high"
                            ? "🔴"
                            : customer.priority === "medium"
                              ? "🟠"
                              : "🔵"}
                        </div>
                      </td>
                      <td className="p-3">
                        <p className="text-sm font-bold text-foreground">
                          {customer.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Score: {customer.creditScore}
                        </p>
                      </td>
                      <td className="p-3">
                        <p className="text-sm font-bold text-foreground">
                          {customer.amount}
                        </p>
                      </td>
                      <td className="p-3">
                        <div
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${
                            customer.timeLeft === "Breached"
                              ? "bg-rose-100 text-rose-700 animate-pulse"
                              : customer.timeLeft.includes("h")
                                ? "bg-amber-100 text-amber-700"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <Timer className="h-3 w-3" />
                          {customer.timeLeft}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge
                          className={`text-[10px] font-bold ${
                            customer.status === "Critical"
                              ? "bg-rose-100 text-rose-700 border-rose-200"
                              : customer.status === "High Risk"
                                ? "bg-amber-100 text-amber-700 border-amber-200"
                                : customer.status === "Medium Risk"
                                  ? "bg-sky-100 text-sky-700 border-sky-200"
                                  : "bg-emerald-100 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {customer.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {customer.priority === "high" ? (
                            <>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="text-[10px] h-7 px-2 font-bold"
                              >
                                <Gavel className="h-3 w-3 mr-1" />
                                Legal
                              </Button>
                              <Button
                                size="sm"
                                className="text-[10px] h-7 px-2 font-bold bg-amber-500 hover:bg-amber-600"
                              >
                                <Zap className="h-3 w-3 mr-1" />
                                Best DCA
                              </Button>
                            </>
                          ) : customer.priority === "medium" ? (
                            <Button
                              size="sm"
                              className="text-[10px] h-7 px-2 font-bold bg-blue-500 hover:bg-blue-600"
                            >
                              <MessageSquare className="h-3 w-3 mr-1" />
                              Negotiate
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onAllocate?.(customer)}
                              className="text-[10px] h-7 px-2 font-bold"
                            >
                              Allocate
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs">
                    <div className="space-y-1">
                      <p className="font-bold">{customer.status}</p>
                      <p className="text-xs text-muted-foreground">
                        {customer.status === "Critical"
                          ? "Immediate action required. SLA breached or imminent."
                          : customer.status === "High Risk"
                            ? "Payment behavior deteriorating. Escalation recommended."
                            : "Standard recovery workflow in progress."}
                      </p>
                      <p className="text-xs">Days Overdue: {customer.daysOverdue}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
