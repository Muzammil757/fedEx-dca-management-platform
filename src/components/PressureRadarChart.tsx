"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  TrendingUp,
  Scale,
  ShieldAlert,
  Activity,
  Target,
  Building2,
} from "lucide-react";

interface DCAPerformance {
  name: string;
  shortName: string;
  slaCompliance: number;
  recoveryRate: number;
  activeBreaches: number;
  atRiskCases: number;
  avgResolutionDays: number;
  status: "healthy" | "warning" | "critical";
  trend: "up" | "down" | "stable";
}

const dcaPerformanceData: DCAPerformance[] = [
  {
    name: "Alpha Recovery Inc",
    shortName: "Alpha",
    slaCompliance: 96,
    recoveryRate: 84,
    activeBreaches: 12,
    atRiskCases: 45,
    avgResolutionDays: 28,
    status: "healthy",
    trend: "up",
  },
  {
    name: "Global Collections",
    shortName: "Global",
    slaCompliance: 91,
    recoveryRate: 79,
    activeBreaches: 28,
    atRiskCases: 89,
    avgResolutionDays: 32,
    status: "warning",
    trend: "stable",
  },
  {
    name: "Prime Debt Solutions",
    shortName: "Prime",
    slaCompliance: 88,
    recoveryRate: 76,
    activeBreaches: 42,
    atRiskCases: 112,
    avgResolutionDays: 35,
    status: "warning",
    trend: "down",
  },
  {
    name: "Rapid Recovery Agency",
    shortName: "Rapid",
    slaCompliance: 85,
    recoveryRate: 72,
    activeBreaches: 67,
    atRiskCases: 156,
    avgResolutionDays: 38,
    status: "critical",
    trend: "down",
  },
  {
    name: "Financial Recovery Group",
    shortName: "Financial",
    slaCompliance: 82,
    recoveryRate: 68,
    activeBreaches: 89,
    atRiskCases: 121,
    avgResolutionDays: 42,
    status: "critical",
    trend: "down",
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "healthy":
      return "#10b981";
    case "warning":
      return "#f59e0b";
    case "critical":
      return "#f43f5e";
    default:
      return "#64748b";
  }
};

const getStatusBg = (status: string) => {
  switch (status) {
    case "healthy":
      return "#10b981";
    case "warning":
      return "#f59e0b";
    case "critical":
      return "#f43f5e";
    default:
      return "#64748b";
  }
};

const getStatusBgLight = (status: string) => {
  switch (status) {
    case "healthy":
      return "bg-emerald-50";
    case "warning":
      return "bg-amber-50";
    case "critical":
      return "bg-rose-50";
    default:
      return "bg-slate-50";
  }
};

export function PressureRadarChart() {
  const [selectedDCA, setSelectedDCA] = useState<string | null>(null);
  
  // Calculate radar chart data based on DCA metrics
  const radarMetrics = [
    { label: "SLA Compliance", key: "slaCompliance", maxValue: 100 },
    { label: "Recovery Rate", key: "recoveryRate", maxValue: 100 },
    { label: "Resolution Speed", key: "resolutionSpeed", maxValue: 100 },
    { label: "Risk Management", key: "riskManagement", maxValue: 100 },
    { label: "Breach Control", key: "breachControl", maxValue: 100 },
  ];
  
  const centerX = 150;
  const centerY = 150;
  const radius = 100;
  const numPoints = radarMetrics.length;
  const angleStep = (2 * Math.PI) / numPoints;

  // Get point coordinates for a DCA
  const getPointCoordinates = (index: number, value: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const distance = (value / 100) * radius;
    return {
      x: centerX + distance * Math.cos(angle),
      y: centerY + distance * Math.sin(angle),
    };
  };

  // Calculate derived metrics for radar
  const getDCARadarValues = (dca: DCAPerformance) => {
    return [
      dca.slaCompliance,
      dca.recoveryRate,
      Math.max(0, 100 - (dca.avgResolutionDays - 20) * 3), // Resolution speed (lower days = higher score)
      Math.max(0, 100 - (dca.atRiskCases / 2)), // Risk management
      Math.max(0, 100 - (dca.activeBreaches * 1.5)), // Breach control
    ];
  };

  const labels = radarMetrics.map((metric, index) => {
    const angle = angleStep * index - Math.PI / 2;
    const labelRadius = radius + 35;
    return {
      x: centerX + labelRadius * Math.cos(angle),
      y: centerY + labelRadius * Math.sin(angle),
      text: metric.label,
    };
  });

  // Calculate critical DCAs count
  const criticalCount = dcaPerformanceData.filter(d => d.status === "critical").length;
  const warningCount = dcaPerformanceData.filter(d => d.status === "warning").length;

  return (
    <Card className="bg-white border-border shadow-sm">
      <CardHeader className="pb-3 border-b border-border/50 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <Building2 className="h-5 w-5 text-primary" />
              DCA Operational Pressure
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Performance metrics by Debt Collection Agency
            </p>
          </div>
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <Badge className="bg-rose-100 text-rose-700 border-rose-200 text-[10px] font-bold">
                {criticalCount} Critical
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] font-bold">
                {warningCount} Warning
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Radar Chart */}
          <div className="flex-shrink-0">
            <svg width="340" height="340" className="overflow-visible">
              {/* Grid circles */}
              {[0.25, 0.5, 0.75, 1].map((ratio, i) => (
                <circle
                  key={i}
                  cx={centerX}
                  cy={centerY}
                  r={radius * ratio}
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
              ))}

              {/* Grid lines */}
              {radarMetrics.map((_, i) => {
                const angle = angleStep * i - Math.PI / 2;
                return (
                  <line
                    key={i}
                    x1={centerX}
                    y1={centerY}
                    x2={centerX + radius * Math.cos(angle)}
                    y2={centerY + radius * Math.sin(angle)}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Data polygons for each DCA */}
              {dcaPerformanceData.map((dca, dcaIndex) => {
                const values = getDCARadarValues(dca);
                const points = values.map((val, i) => getPointCoordinates(i, val));
                const polygonPoints = points.map((p) => `${p.x},${p.y}`).join(" ");
                const isSelected = selectedDCA === dca.name;
                const opacity = selectedDCA ? (isSelected ? 0.4 : 0.05) : 0.15;
                
                return (
                  <polygon
                    key={dca.name}
                    points={polygonPoints}
                    fill={getStatusBg(dca.status)}
                    fillOpacity={opacity}
                    stroke={getStatusBg(dca.status)}
                    strokeWidth={isSelected ? 3 : 1.5}
                    strokeOpacity={selectedDCA ? (isSelected ? 1 : 0.2) : 0.6}
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setSelectedDCA(dca.name)}
                    onMouseLeave={() => setSelectedDCA(null)}
                  />
                );
              })}

              {/* Data points for selected DCA */}
              {selectedDCA && dcaPerformanceData
                .filter(dca => dca.name === selectedDCA)
                .map((dca) => {
                  const values = getDCARadarValues(dca);
                  return values.map((val, i) => {
                    const point = getPointCoordinates(i, val);
                    return (
                      <circle
                        key={i}
                        cx={point.x}
                        cy={point.y}
                        r="5"
                        fill={getStatusBg(dca.status)}
                        stroke="white"
                        strokeWidth="2"
                      />
                    );
                  });
                })}

              {/* Labels */}
              {labels.map((label, i) => (
                <g key={i}>
                  <text
                    x={label.x}
                    y={label.y}
                    textAnchor="middle"
                    className="text-[10px] font-bold"
                    fill="#334155"
                  >
                    {label.text}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* DCA Performance Details */}
          <div className="flex-1 space-y-3">
            {dcaPerformanceData.map((dca) => {
              const isSelected = selectedDCA === dca.name;
              const isCritical = dca.status === "critical";
              
              return (
                <div
                  key={dca.name}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected 
                      ? `border-2 ${isCritical ? "border-rose-400 bg-rose-50" : dca.status === "warning" ? "border-amber-400 bg-amber-50" : "border-emerald-400 bg-emerald-50"}` 
                      : `border-border/50 ${getStatusBgLight(dca.status)} hover:border-primary/30`
                  } ${isCritical ? "animate-pulse-subtle" : ""}`}
                  onMouseEnter={() => setSelectedDCA(dca.name)}
                  onMouseLeave={() => setSelectedDCA(null)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: getStatusBg(dca.status) }}
                    />
                    <div>
                      <p className={`text-sm font-bold ${isCritical ? "text-rose-700" : "text-foreground"}`}>
                        {dca.name}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>SLA: <span className={`font-bold ${dca.slaCompliance >= 90 ? "text-emerald-600" : dca.slaCompliance >= 85 ? "text-amber-600" : "text-rose-600"}`}>{dca.slaCompliance}%</span></span>
                        <span>•</span>
                        <span>Recovery: <span className="font-bold">{dca.recoveryRate}%</span></span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs font-bold text-rose-600">
                        {dca.activeBreaches} breaches
                      </p>
                      <p className="text-[10px] text-amber-600 font-semibold">
                        {dca.atRiskCases} at risk
                      </p>
                    </div>
                    <Badge
                      className="text-[9px] font-bold"
                      style={{
                        backgroundColor: dca.trend === "up" ? "#dcfce7" : dca.trend === "down" ? "#fce7f3" : "#f1f5f9",
                        color: dca.trend === "up" ? "#166534" : dca.trend === "down" ? "#be185d" : "#475569",
                        borderColor: dca.trend === "up" ? "#bbf7d0" : dca.trend === "down" ? "#fbcfe8" : "#e2e8f0",
                      }}
                    >
                      {dca.trend === "up" ? "↑" : dca.trend === "down" ? "↓" : "→"}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 rounded-xl border border-border/50 bg-slate-50/50">
          <div className="flex items-start gap-3">
            <Activity className="h-5 w-5 shrink-0 mt-0.5 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-bold mb-1 text-foreground">
                DCA Performance Overview
              </p>
              <div className="flex items-center gap-4 mb-2">
                <div className="flex-1 h-2 rounded-full overflow-hidden bg-slate-200">
                  <div
                    className="h-full bg-amber-500"
                    style={{ width: "72%" }}
                  />
                </div>
                <span className="text-sm font-bold text-amber-600">72% avg</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {criticalCount > 0 && (
                  <span className="text-rose-600 font-semibold">{criticalCount} DCAs require immediate intervention. </span>
                )}
                Consider reallocating cases from underperforming agencies to top performers.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
