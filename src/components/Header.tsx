"use client";

import { useState } from "react";
import { Bell, Search, User, ChevronDown, LogOut, Shield, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth/auth-context";

export function Header() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout, isAdmin, isDca } = useAuth();

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-[#8ABCE8]/90 shadow-sm rounded-bl-xl backdrop-blur-sm">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search cases, customers, DCAs..."
              className="h-10 w-80 rounded-lg border border-border bg-secondary/50 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white">
              5
            </span>
          </Button>

          <div className="h-8 w-px bg-border" />

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-secondary"
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isAdmin ? "bg-primary/10" : "bg-blue-500/10"}`}>
                {isAdmin ? (
                  <Shield className="h-4 w-4 text-primary" />
                ) : (
                  <Building2 className="h-4 w-4 text-blue-500" />
                )}
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold text-foreground">{user?.name || "User"}</span>
                <span className="text-[10px] text-muted-foreground capitalize">{user?.role || "Guest"}</span>
              </div>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showUserMenu ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-white border border-border shadow-lg overflow-hidden"
                >
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-medium text-foreground">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                    <span className={`inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      isAdmin ? "bg-primary/10 text-primary" : "bg-blue-500/10 text-blue-600"
                    }`}>
                      {isAdmin ? "Administrator" : "DCA Agent"}
                    </span>
                  </div>
                  
                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
