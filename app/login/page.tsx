"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft
} from "lucide-react";
import { apiLoginUser } from "../billing/lib/api";
import { setAuthSession, isAuthenticated } from "../billing/lib/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/billing";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // If user is already authenticated, redirect to /billing
    if (isAuthenticated()) {
      router.push(redirectUrl);
    }
  }, [redirectUrl, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please enter both email address and password.");
      return;
    }

    setLoading(true);
    try {
      const response = await apiLoginUser({
        email: email.trim(),
        password: password.trim(),
      });

      if (response.success && response.data) {
        // Save session in localStorage & cookies
        setAuthSession(response.data);
        // Navigate to billing
        router.push(redirectUrl);
      } else {
        setErrorMsg(response.message || "Invalid email or password. Please try again.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication service is currently unavailable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black flex flex-col justify-between relative overflow-hidden font-sans">
      
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-zinc-800/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-20 left-1/4 w-[350px] h-[350px] bg-zinc-700/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 border-b border-zinc-800/80 px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
            Secure POS Gateway
          </span>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="relative z-10 max-w-md w-full mx-auto px-4 py-8 flex flex-col items-center">
        
        {/* Brand Icon & Heading */}
        <div className="flex flex-col items-center text-center mb-7">
          <div className="w-20 h-20 relative rounded-full overflow-hidden border-2 border-zinc-700/80 shadow-[0_0_30px_rgba(255,255,255,0.15)] mb-4 bg-zinc-900">
            <Image
              src="/glitch-original.jpeg"
              alt="GLITCH Original Logo"
              fill
              className="object-cover"
              priority
            />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <span>GLITCH POS LOGIN</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Authorized Store Admin & Cashier Authentication
          </p>
        </div>

        {/* Form Container */}
        <div className="w-full bg-zinc-950/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-5">
          
          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="leading-snug">
                <strong className="block font-bold">Authentication Failed</strong>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Email Field */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Staff Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  autoComplete="email"
                  className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white font-mono transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white text-black font-extrabold text-xs hover:bg-zinc-200 transition shadow-lg shadow-white/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span>Verifying credentials...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authenticate & Enter POS</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-900 py-4 text-center text-xs text-zinc-600 font-mono">
        GLITCH CLOTHING CO • AUTHENTICATION ENGINE v1.0
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center text-white">
          <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
