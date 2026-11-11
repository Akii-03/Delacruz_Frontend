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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isChecking) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = userType === "customer" ? "/auth/customer/login" : "/auth/login";
      const payload = userType === "customer"
        ? { email: identifier, password }
        : { username: identifier, password };

      const data = await apiClient<LoginResponse>(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      // Save the access token, refresh token, and selected role in localStorage
      setTokens(data.accessToken, data.refreshToken, data.userType || userType);
      router.push(CONFIG.ROUTES.DASHBOARD);
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>Select account type and enter your details.</CardDescription>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant={userType === "customer" ? "default" : "outline"}
              className="w-1/2"
              onClick={() => { setUserType("customer"); setError(""); }}
            >
              Customer
            </Button>
            <Button
              type="button"
              variant={userType === "admin" ? "default" : "outline"}
              className="w-1/2"
              onClick={() => { setUserType("admin"); setError(""); }}
            >
              Admin / Staff
            </Button>
          </div>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 rounded-md border border-red-200 dark:border-red-900">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="identifier">
                {userType === "customer" ? "Email Address" : "Username"}
              </Label>
              <Input
                id="identifier"
                type={userType === "customer" ? "email" : "text"}
                placeholder={userType === "customer" ? "your@example.com" : "admin_user"}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : `Sign In as ${userType === "customer" ? "Customer" : "Admin"}`}
            </Button>
            {userType === "customer" && (
              <p className="text-sm text-center text-muted-foreground">
                Don't have a customer account?{" "}
                <Link href={CONFIG.ROUTES.REGISTER} className="text-primary underline">
                  Register here
                </Link>
              </p>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
