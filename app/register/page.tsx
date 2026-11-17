"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { apiClient } from "@/lib/api";
import { CONFIG } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();
  const { isChecking } = useAuthGuard({ requireAuth: false });

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phone_number: "",
  });

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await apiClient("/customer", {
        method: "POST",
        body: JSON.stringify({
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          phone_number: formData.phone_number.trim(),
        }),
      });

      router.push(CONFIG.ROUTES.LOGIN);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please verify your details and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Left Brand Showcase Panel (Consistent with Login & Dashboard) */}
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
        <div className="absolute -left-24 -bottom-24 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl" />

        {/* Top Brand Mark */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 px-3 rounded-xl bg-white text-slate-900 flex items-center justify-center shadow-sm font-extrabold text-sm tracking-wider">
            ECDC
          </div>
          <div>
            <p className="font-bold text-lg tracking-tight leading-none">
              ECDC Online Shopping Center
            </p>
            <p className="text-xs text-slate-400 mt-1">Customer Membership & Storefront</p>
          </div>
        </div>

        {/* Middle Value Proposition */}
        <div className="relative z-10 max-w-lg space-y-6 my-auto">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full bg-white/10 text-emerald-200 border border-white/15">
            New Member Registration
          </span>

          <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight">
            Create Your Account & Start Shopping in Seconds.
          </h1>

          <p className="text-slate-300 text-sm xl:text-base leading-relaxed">
            Join ECDC Online Shopping Center to browse curated collections, enjoy fast doorstep
            delivery, and track every order from checkout to arrival.
          </p>

          {/* Member Perks */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">Fast Checkout</p>
              <p className="text-xs text-slate-400">GCash, Maya, Card & COD support</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">Order History</p>
              <p className="text-xs text-slate-400">Live status updates on all purchases</p>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 border-t border-white/10 pt-6">
          <span>© {new Date().getFullYear()} ECDC Online Shopping Center</span>
          <span>Safe & Private Registration</span>
        </div>
      </div>

      {/* Right Registration Form Panel */}
      <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center items-center p-6 sm:p-12 bg-white lg:border-l border-slate-200/80">
        <div className="w-full max-w-md space-y-7">
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
              Create an account
            </h2>
            <p className="text-sm text-slate-500">
              Fill in your details below to register as a customer.
            </p>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleRegister} className="space-y-4">
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

            {/* First & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="first_name" className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  First Name
                </Label>
                <Input
                  id="first_name"
                  autoComplete="given-name"
                  placeholder="Juan"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-colors"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="last_name" className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Last Name
                </Label>
                <Input
                  id="last_name"
                  autoComplete="family-name"
                  placeholder="Dela Cruz"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-colors"
                  required
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="juan@example.com"
                value={formData.email}
                onChange={handleChange}
                className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-colors"
                required
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <Label htmlFor="phone_number" className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Mobile Number
              </Label>
              <Input
                id="phone_number"
                type="tel"
                autoComplete="tel"
                placeholder="0917 123 4567"
                value={formData.phone_number}
                onChange={handleChange}
                className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-colors"
                required
              />
            </div>

            {/* Password with Show/Hide Toggle */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
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

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-sm transition-all"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creating account...
                  </span>
                ) : (
                  "Create Account"
                )}
              </Button>
            </div>
          </form>

          {/* Footer Link */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              Already have an ECDC account?{" "}
              <Link
                href={CONFIG.ROUTES.LOGIN}
                className="font-semibold text-slate-900 hover:underline underline-offset-4"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}