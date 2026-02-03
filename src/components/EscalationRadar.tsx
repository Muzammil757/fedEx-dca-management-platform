"use client";

import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

export interface RadarDataPoint {
  metric: string;
  value: number;
  fullMark: number;
}

interface EscalationRadarProps {
  data: RadarDataPoint[];
  title?: string;
  height?: number;
  strokeColor?: string;
  fillColor?: string;
}

export function EscalationRadar({
  data,
  title = "Escalation Radar",
  height = 200,
  strokeColor = "#f43f5e",
  fillColor = "#f43f5e",
}: EscalationRadarProps) {
  return (
    <Card className="bg-white border-border shadow-sm">
      <CardHeader className="pb-2 border-b border-border/50">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="w-full" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fontSize: 9, fill: "#64748b", fontWeight: 600 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fontSize: 8 }}
                tickCount={4}
              />
              <Radar
                name="Risk Level"
                dataKey="value"
                stroke={strokeColor}
                fill={fillColor}
                fillOpacity={0.3}
                strokeWidth={2}
                animationBegin={0}
                animationDuration={1500}
                animationEasing="ease-out"
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 space-y-2">
          {data.map((item) => (
            <Tooltip key={item.metric}>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 p-1 rounded transition-colors">
                  <span className="text-muted-foreground font-medium">
                    {item.metric}
                  </span>
                  <span
                    className={`font-bold ${
                      item.value >= 80
                        ? "text-rose-600"
                        : item.value >= 60
                          ? "text-amber-600"
                          : "text-emerald-600"
                    }`}
                  >
                    {item.value}%
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  {item.value >= 80
                    ? "Critical pressure - immediate action needed"
                    : item.value >= 60
                      ? "Elevated risk - monitor closely"
                      : "Within acceptable range"}
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
