"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Shield, Eye, EyeOff, ArrowRight, Lock, Mail, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/auth-context";
import { toast } from "sonner";

export default function LoginPage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [persona, setPersona] = useState<"admin" | "dca">("admin");
  const [formData, setFormData] = useState({ email: "", password: "" });
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Parallax effect for background
  const y1 = useTransform(scrollY, [0, 500], [0, 150]);
  const y2 = useTransform(scrollY, [0, 500], [0, -100]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0.7]);
  
  // Hero images
  const heroImages = Array.from({ length: 80 }, (_, i) => ({
    url: `/images/A_dark_cinematic_202601311605_2luzz_${String(i).padStart(3, "0")}.jpg`,
    alt: `Background ${i + 1}`,
  }));

  // Auto-rotate images slowly for Ken Burns effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  // Handle form submission with real API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      toast.success("Login successful!", {
        description: "Redirecting to dashboard...",
      });
      // Router push is handled by auth context
    } else {
      setError(result.error || "Invalid email or password");
      toast.error("Login failed", {
        description: result.error || "Please check your credentials",
      });
    }
    
    setIsLoading(false);
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div
            className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-white/60">Loading...</p>
        </motion.div>
      </div>
    );
  }

  // Already authenticated - show redirect message
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <h1 className="text-xl font-semibold text-white mb-2">Already logged in</h1>
          <p className="text-white/60">Redirecting to dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen relative overflow-hidden bg-slate-900">
      {/* Full-screen Cinematic Background */}
      <motion.div 
        className="absolute inset-0 z-0"
        style={{ opacity }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentImageIndex}
            className="absolute inset-0 relative"
            initial={{ scale: 1, opacity: 0 }}
            animate={{ 
              scale: 1.15, 
              opacity: 1,
              transition: { 
                duration: 8, 
                ease: "easeInOut" 
              }
            }}
            exit={{ 
              opacity: 0,
              transition: { duration: 1.5 }
            }}
          >
            <img
              src={heroImages[currentImageIndex].url}
              alt="Background"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px] mix-blend-screen opacity-50 pointer-events-none" />
          </motion.div>
        </AnimatePresence>

        {/* Parallax floating elements */}
        <motion.div 
          className="absolute inset-0 pointer-events-none"
          style={{ y: y1 }}
        >
          <motion.div
            className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
        
        <motion.div 
          className="absolute inset-0 pointer-events-none"
          style={{ y: y2 }}
        >
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px]"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.1, 0.15, 0.1],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
        </motion.div>

        {/* Overlays */}
        <div className="absolute inset-0 bg-slate-950/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-slate-950/30 to-slate-950/80" />
      </motion.div>

      {/* Login Content */}
      <div className="relative z-20 flex min-h-screen items-center justify-center p-6">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Brand Logo */}
          <motion.div
            className="flex items-center justify-center gap-3 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <motion.div
              className="relative"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-white/[0.35] backdrop-blur-xl border border-white/25 shadow-lg">
                <Shield className="h-7 w-7 text-white" />
              </div>
            </motion.div>
            <span className="text-2xl font-bold text-white tracking-tight">
              Recover<span className="text-primary">IQ</span>
            </span>
          </motion.div>

          {/* Hero Text Section */}
          <motion.div
            className="mb-8 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h1 className="text-3xl font-bold text-white mb-1">
              RecoverIQ
            </h1>
            <p className="text-lg text-white/80 mb-3">
              Intelligent Debt Recovery & DCA Governance
            </p>
            <p className="text-sm text-white/60 max-w-sm mx-auto">
              Centralized, AI-driven control to manage DCAs, enforce SLAs, and maximize recovery.
            </p>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center gap-2"
            >
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span className="text-sm text-red-200">{error}</span>
            </motion.div>
          )}

          {/* Login Card */}
          <motion.div
            className="bg-slate-950/65 backdrop-blur-2xl rounded-2xl border border-white/20 p-8 shadow-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              <motion.div
                className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/5 border border-white/10"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.55 }}
              >
                {[{ key: "admin", label: "Admin" }, { key: "dca", label: "DCA / Agency" }].map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => {
                      setPersona(option.key as "admin" | "dca");
                      setError(null);
                      setFormData({
                        email: option.key === "admin" ? "admin@company.com" : "dca@partner.com",
                        password: option.key === "admin" ? "Admin@123" : "Dca@123",
                      });
                    }}
                    className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-all ${
                      persona === option.key
                        ? "bg-white/20 text-white shadow-inner"
                        : "text-white/70 hover:bg-white/10"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </motion.div>
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-white/80"
                >
                  Email
                </label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-primary transition-colors">
                    <Mail className="h-4 w-4" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    className="pl-10 bg-white/[0.08] border-white/15 text-white placeholder:text-white/40 focus:border-primary/50 focus:ring-primary/20 focus:bg-white/[0.12]"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
              </motion.div>

              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-white/80"
                >
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-primary transition-colors">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="pl-10 pr-10 bg-white/[0.08] border-white/15 text-white placeholder:text-white/40 focus:border-primary/50 focus:ring-primary/20 focus:bg-white/[0.12]"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
              >
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <motion.div
                      className="flex items-center gap-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <motion.div
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                      <span>Signing in...</span>
                    </motion.div>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Sign in
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </motion.div>
            </form>
          </motion.div>
        </motion.div>
      </div>

      {/* Image Progress Indicator */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-1.5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.3 }}
      >
        {heroImages.slice(0, 10).map((_, index) => (
          <motion.div
            key={index}
            className={`w-1.5 h-1.5 rounded-full ${
              index === Math.floor(currentImageIndex / 8) ? "bg-white" : "bg-white/30"
            }`}
            animate={{
              scale: index === Math.floor(currentImageIndex / 8) ? 1.3 : 1,
              opacity: index === Math.floor(currentImageIndex / 8) ? 1 : 0.5,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}
