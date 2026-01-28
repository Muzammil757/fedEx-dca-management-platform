"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Brain,
  Clock,
  BarChart3,
  MessageSquare,
  Shield,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/cases", label: "Cases", icon: FileText },
  { href: "/ai-insights", label: "Intelligence", icon: Brain },
  { href: "/sla-monitoring", label: "SLAs", icon: Clock },
  { href: "/dca-performance", label: "DCA Performance", icon: BarChart3 },
  { href: "/collaboration", label: "Collaboration", icon: MessageSquare },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground tracking-tight">RecoverIQ</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Intelligent Recovery</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                <span className="flex-1">{item.label}</span>
                {isActive && (
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="rounded-xl bg-secondary p-4 border border-primary/10">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Efficiency Score</p>
            <div className="flex items-end justify-between mb-2">
              <p className="text-2xl font-bold text-foreground">94.2%</p>
                <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">+2.4%</span>
            </div>
            <div className="h-1.5 rounded-full bg-background overflow-hidden">
              <div className="h-full w-[94%] rounded-full bg-primary" />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
