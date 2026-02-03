"use client";

import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface InsightState {
  bg: string;
  icon: LucideIcon;
  message: string;
  action: string;
}

interface DynamicInsightBarProps {
  state: InsightState;
  subtitle?: string;
  onActionClick?: () => void;
}

export function DynamicInsightBar({
  state,
  subtitle,
  onActionClick,
}: DynamicInsightBarProps) {
  const InsightIcon = state.icon;

  return (
    <section className={`${state.bg} rounded-xl p-4 shadow-lg`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
            <InsightIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg">{state.message}</p>
            {subtitle && <p className="text-white/80 text-sm">{subtitle}</p>}
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="bg-white/20 text-white border-white/30 hover:bg-white/30 font-semibold"
          onClick={onActionClick}
        >
          {state.action}
        </Button>
      </div>
    </section>
  );
}

// Predefined insight states for common scenarios
export const insightStatePresets = {
  crisis: {
    bg: "bg-gradient-to-r from-rose-600 to-rose-500",
    message: "🚨 Critical issues detected. Immediate action required.",
    action: "View Critical",
  },
  risk: {
    bg: "bg-gradient-to-r from-amber-500 to-amber-400",
    message: "⚠ Elevated risk levels. Monitor closely.",
    action: "Review At-Risk",
  },
  normal: {
    bg: "bg-gradient-to-r from-blue-600 to-blue-500",
    message: "📊 Operations stable. No immediate action required.",
    action: "View Dashboard",
  },
  success: {
    bg: "bg-gradient-to-r from-emerald-600 to-emerald-500",
    message: "✅ All targets on track. Great performance!",
    action: "View Report",
  },
};
