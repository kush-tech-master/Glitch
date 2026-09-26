"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Receipt, Printer, QrCode, Sparkles, ShieldCheck, LogOut, User } from "lucide-react";
import { isAuthenticated, getAuthUser, clearAuthSession } from "./billing/lib/auth";

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    if (isAuthenticated()) {
      setLoggedIn(true);
      const user = getAuthUser();
      if (user?.name) setUserName(user.name);
    }
  }, []);

  const handleLogout = () => {
    clearAuthSession();
    setLoggedIn(false);
    setUserName("");
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black flex flex-col justify-between font-sans">
      {/* Navigation */}
      <header className="border-b border-zinc-800/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 relative bg-black rounded-full overflow-hidden border border-zinc-700 shadow-sm">
            <Image
              src="/glitch-original.jpeg"
              alt="GLITCH Original Logo"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-wider block leading-tight">GLITCH</span>
            <span className="text-[10px] text-zinc-400 font-bold tracking-widest block">
              GEN Z MENSWEAR
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {loggedIn ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-medium text-white">{userName || "Admin"}</span>
              </div>

              <Link
                href="/billing"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition active:scale-95 shadow-lg shadow-white/10"
              >
                <Receipt className="w-4 h-4" />
                <span>Open POS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <button
                onClick={handleLogout}
                className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login?redirect=/billing"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition active:scale-95 shadow-lg shadow-white/10"
            >
              <Receipt className="w-4 h-4" />
              <span>Open Billing POS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-16 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Invoice Architecture • Gen-Z Menswear Edition</span>
        </div>

        {/* Central Logo Emblem with original uploaded image */}
        <div className="w-28 h-28 relative mb-6 rounded-full overflow-hidden border-2 border-zinc-700 shadow-[0_0_40px_rgba(255,255,255,0.15)] bg-black">
          <Image
            src="/glitch-original.jpeg"
            alt="GLITCH Brand Emblem"
            fill
            className="object-cover"
            priority
          />
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight max-w-3xl bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
          GLITCH RETAIL BILLING ENGINE
        </h1>
        <p className="mt-4 text-base sm:text-lg text-zinc-400 max-w-2xl leading-relaxed">
          High-precision horizontal bill template with central brand watermark, dual QR codes (Social & UPI Payment), customer tracking, and print-ready landscape slips.
        </p>

        {/* Action Button */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href={loggedIn ? "/billing" : "/login?redirect=/billing"}
            className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-white text-black font-black text-sm hover:bg-zinc-200 transition duration-200 shadow-xl shadow-white/10 active:scale-95"
          >
            <Receipt className="w-4 h-4" />
            <span>Launch Bill Generator</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left w-full max-w-5xl">
          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center mb-3 text-white border border-zinc-800">
              <Receipt className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white">Horizontal Slip Format</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Landscape retail layout styled exactly like authentic garment boutique invoices with top-left GLITCH branding.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center mb-3 text-white border border-zinc-800">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white">Logo Watermark</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Translucent GLITCH brush logo watermark centered without upper cut.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center mb-3 text-white border border-zinc-800">
              <QrCode className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white">Dual QR Code System</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Dynamic Social Media QR code for Instagram/TikTok and Instant Scan & Pay UPI QR code with real-time bill amount.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-500">
        GLITCH — GEN Z MENSWEAR • Retail Billing Suite • Modasa, Gujarat
      </footer>
    </div>
  );
}
