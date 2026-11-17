"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { apiClient } from "@/lib/api";
import { setTokens } from "@/lib/auth";
import { CONFIG } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  userType: "customer" | "admin";
}

export default function LoginPage() {
  const router = useRouter();
  const { isChecking } = useAuthGuard({ requireAuth: false });
  const [userType, setUserType] = useState<"customer" | "admin">("customer");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-t-transparent" />
          <p className="text-sm font-medium text-slate-600">Loading ECDC Portal...</p>
        </div>
      </div>
    );
  }

  const handleRoleSwitch = (role: "customer" | "admin") => {
    if (role === userType) return;
    setUserType(role);
    setIdentifier("");
    setPassword("");
    setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = userType === "customer" ? "/auth/customer/login" : "/auth/login";
      const payload =
        userType === "customer"
          ? { email: identifier.trim(), password }
          : { username: identifier.trim(), password };

      const data = await apiClient<LoginResponse>(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setTokens(data.accessToken, data.refreshToken, data.userType || userType);
      router.push(CONFIG.ROUTES.DASHBOARD);
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please check your details and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Left Brand Showcase Panel (Matches Dashboard Aesthetic) */}
      <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 relative overflow-hidden bg-linear-to-br from-slate-900 via-slate-900 to-indigo-950 text-white p-12 xl:p-16 flex-col justify-between">
        {/* Subtle Architectural Dot Pattern & Ambient Glows */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -left-24 -bottom-24 h-96 w-96 rounded-full bg-sky-500/15 blur-3xl" />

        {/* Top Brand Mark */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 px-3 rounded-xl bg-white text-slate-900 flex items-center justify-center shadow-sm font-extrabold text-sm tracking-wider">
            ECDC
          </div>
          <div>
            <p className="font-bold text-lg tracking-tight leading-none">
              ECDC Online Shopping Center
            </p>
            <p className="text-xs text-slate-400 mt-1">Unified Commerce & Order Management</p>
          </div>
        </div>

        {/* Middle Value Proposition */}
        <div className="relative z-10 max-w-lg space-y-6 my-auto">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full bg-white/10 text-indigo-200 border border-white/15">
            {userType === "customer" ? "Customer Store" : "Administrative Workspace"}
          </span>

          <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight">
            {userType === "customer"
              ? "Curated Products, Seamless Checkout & Real-Time Tracking."
              : "Complete Control Over Catalog, Inventory & Order Fulfillment."}
          </h1>

          <p className="text-slate-300 text-sm xl:text-base leading-relaxed">
            {userType === "customer"
              ? "Sign in to explore collections, manage your shopping bag, and monitor every step of your delivery."
              : "Access your administrative console to manage product listings, track gross revenue, and process customer transactions."}
          </p>

          {/* Feature Highlights */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">Real-Time Sync</p>
              <p className="text-xs text-slate-400">Live inventory & order status updates</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">Flexible Payments</p>
              <p className="text-xs text-slate-400">GCash, Maya, Card & Cash on Delivery</p>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 border-t border-white/10 pt-6">
          <span>© {new Date().getFullYear()} ECDC Online Shopping Center</span>
          <span>Secure Encrypted Session</span>
        </div>
      </div>

      {/* Right Authentication Form Panel */}
      <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center items-center p-6 sm:p-12 bg-white lg:border-l border-slate-200/80">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile-Only Brand Header */}
          <div className="flex lg:hidden items-center gap-3 justify-center">
            <div className="h-10 px-3 rounded-xl bg-slate-900 text-white flex items-center justify-center font-extrabold text-sm tracking-wider">
              ECDC
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900">
              ECDC Online Shopping Center
            </span>
          </div>

          {/* Form Header */}
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Welcome back
            </h2>
            <p className="text-sm text-slate-500">
              Choose your portal below and enter your credentials to continue.
            </p>
          </div>

          {/* Segmented Role Switcher */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 border border-slate-200/80">
            <button
              type="button"
              onClick={() => handleRoleSwitch("customer")}
              className={`py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                userType === "customer"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
              </svg>
              Customer
            </button>
            <button
              type="button"
              onClick={() => handleRoleSwitch("admin")}
              className={`py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                userType === "admin"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              Admin / Staff
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3.5 text-sm text-rose-700 bg-rose-50 rounded-xl border border-rose-200 flex items-start gap-2.5">
                <svg
                  className="h-5 w-5 text-rose-600 shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                {userType === "customer" ? "Email Address" : "Admin Username"}
              </Label>
              <Input
                id="identifier"
                type={userType === "customer" ? "email" : "text"}
                autoComplete={userType === "customer" ? "email" : "username"}
                placeholder={userType === "customer" ? "name@example.com" : "Enter admin username"}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Password
                </Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pr-16 bg-slate-50/50 border-slate-200 focus:bg-white transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-slate-900 px-1.5 py-1"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-sm transition-all"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Signing in...
                </span>
              ) : (
                `Sign In to ${userType === "customer" ? "Store" : "Admin"}`
              )}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="pt-2 border-t border-slate-100 text-center">
            {userType === "customer" ? (
              <p className="text-sm text-slate-600">
                New to ECDC Online Shopping Center?{" "}
                <Link
                  href={CONFIG.ROUTES.REGISTER}
                  className="font-semibold text-slate-900 hover:underline underline-offset-4"
                >
                  Create an account
                </Link>
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                Authorized personnel only. All administrative actions are logged.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}