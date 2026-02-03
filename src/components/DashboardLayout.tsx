"use client";

import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { ProtectedRoute } from "@/lib/auth/auth-context";
import type { UserRole } from "@/lib/auth/auth-context";

interface DashboardLayoutProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export function DashboardLayout({ children, requiredRole }: DashboardLayoutProps) {
  return (
    <ProtectedRoute requiredRole={requiredRole}>
      <div className="min-h-screen bg-background relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-primary/5 blur-[100px] rounded-full" />
        
        <Sidebar />
        <div className="ml-64 relative z-10">
          <Header />
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
