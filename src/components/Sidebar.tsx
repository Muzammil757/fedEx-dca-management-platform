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
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cases", label: "Cases", icon: FileText },
  { href: "/ai-insights", label: "AI Insights", icon: Brain },
  { href: "/sla-monitoring", label: "SLA Monitoring", icon: Clock },
  { href: "/dca-performance", label: "DCA Performance", icon: BarChart3 },
  { href: "/collaboration", label: "Collaboration", icon: MessageSquare },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-slate-950/90 text-white border-r border-white/10 shadow-2xl rounded-br-2xl backdrop-blur-xl">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-6 bg-white/5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight">RecoverIQ</span>
            <span className="text-[10px] font-medium text-white/60 uppercase tracking-wider">Intelligent Recovery</span>
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
                className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-white/10 text-white shadow-inner"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-white/70"}`} />
                <span className="flex-1">{item.label}</span>
                {isActive && (
                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
