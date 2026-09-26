"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  RotateCcw,
  Sliders,
  Building2,
  MapPin,
  Phone,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  CreditCard,
  FileText,
  Eye,
  Layers,
  X,
  LogOut,
  History,
  Tag
} from "lucide-react";
import {
  BillSettings,
  DEFAULT_BILL_SETTINGS,
  loadBillSettings,
  saveBillSettings
} from "../billing-config";
import { apiGetSettings, apiSaveSettings } from "../lib/api";
import { clearAuthSession } from "../lib/auth";

export default function BillSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<BillSettings>(DEFAULT_BILL_SETTINGS);
  const [isSaved, setIsSaved] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [activeSection, setActiveSection] = useState<"topLeft" | "topRight" | "qrTerms" | "watermark">("topLeft");

  useEffect(() => {
    // 1. Initial fallback load
    setSettings(loadBillSettings());

    // 2. Fetch live settings from MongoDB Atlas
    apiGetSettings().then((dbSettings) => {
      if (dbSettings) {
        setSettings(dbSettings);
      }
    });
  }, []);

  const handleSave = async () => {
    // 1. Save to MongoDB Atlas
    await apiSaveSettings(settings);

    // 2. Save to localStorage
    saveBillSettings(settings);

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleConfirmReset = async () => {
    setSettings(DEFAULT_BILL_SETTINGS);
    await apiSaveSettings(DEFAULT_BILL_SETTINGS);
    saveBillSettings(DEFAULT_BILL_SETTINGS);
    setShowResetModal(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased selection:bg-white selection:text-black">
      {/* Top Header with Back Button */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-md px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/billing"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-semibold transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Billing</span>
            </Link>
            <div className="h-5 w-px bg-zinc-800" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-black text-black text-xs">
                GL
              </div>
              <div>
                <h1 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Bill Template Settings</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                    Customizer
                  </span>
                </h1>
                <p className="text-[11px] text-zinc-400">Configure branding, QR codes, contact details & watermark</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/billing/companies"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Brands</span>
            </Link>

            <Link
              href="/billing/categories"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Categories</span>
            </Link>

            <Link
              href="/billing/history"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition"
            >
              <History className="w-3.5 h-3.5" />
              <span>Invoices</span>
            </Link>

            <button
              onClick={() => setShowResetModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-semibold transition"
              title="Reset all settings to original defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 text-xs font-bold transition shadow-lg shadow-white/5 active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaved ? "Saved!" : "Save"}</span>
            </button>

            <button
              onClick={() => {
                clearAuthSession();
                router.replace('/login');
              }}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition"
              title="Logout from POS"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        {isSaved && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Settings saved successfully! Changes are immediately updated on the `/billing` template.</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Navigation Sidebar */}
          <div className="md:col-span-4 space-y-2">
            <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
              <button
                onClick={() => setActiveSection("topLeft")}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-xs font-bold transition ${
                  activeSection === "topLeft"
                    ? "bg-white text-black shadow"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4" />
                  <span>Top-Left Corner (Brand Details)</span>
                </div>
                <span className="text-[10px] font-mono">01</span>
              </button>

              <button
                onClick={() => setActiveSection("topRight")}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-xs font-bold transition ${
                  activeSection === "topRight"
                    ? "bg-white text-black shadow"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4" />
                  <span>Top-Right Corner (Store & Phones)</span>
                </div>
                <span className="text-[10px] font-mono">02</span>
              </button>

              <button
                onClick={() => setActiveSection("qrTerms")}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-xs font-bold transition ${
                  activeSection === "qrTerms"
                    ? "bg-white text-black shadow"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <QrCode className="w-4 h-4" />
                  <span>Bottom-Left (Dual QR & Terms)</span>
                </div>
                <span className="text-[10px] font-mono">03</span>
              </button>

              <button
                onClick={() => setActiveSection("watermark")}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-xs font-bold transition ${
                  activeSection === "watermark"
                    ? "bg-white text-black shadow"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-4 h-4" />
                  <span>Center Watermark Settings</span>
                </div>
                <span className="text-[10px] font-mono">04</span>
              </button>
            </div>

            {/* Quick Live Preview Card */}
            <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 text-xs space-y-3">
              <div className="flex items-center gap-2 text-zinc-300 font-bold">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>Active Logo Preview</span>
              </div>
              <div className="flex items-center justify-center p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                <div className="w-20 h-20 relative rounded-full overflow-hidden border border-zinc-700">
                  <Image
                    src={settings.topLeft.logoUrl || "/glitch-original.jpeg"}
                    alt="Brand Logo"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <p className="text-[11px] text-zinc-400 text-center">
                Original Logo loaded from <code className="text-zinc-300 font-mono text-[10px]">public/glitch-original.jpeg</code>
              </p>
            </div>
          </div>

          {/* Settings Form Body */}
          <div className="md:col-span-8">
            <div className="p-6 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 backdrop-blur-sm space-y-6">
              
              {/* SECTION 1: TOP LEFT BRAND DETAILS */}
              {activeSection === "topLeft" && (
                <div className="space-y-4">
                  <div className="border-b border-zinc-800 pb-3">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-zinc-300" />
                      Top-Left Corner: Brand & Legal Details
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      This appears in the top-left header of the horizontal invoice slip. If GSTIN is left empty, it will not appear on the bill.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                        Brand Name
                      </label>
                      <input
                        type="text"
                        value={settings.topLeft.brandName}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            topLeft: { ...settings.topLeft, brandName: e.target.value },
                          })
                        }
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white font-bold focus:border-white transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                        Tagline / Subtitle
                      </label>
                      <input
                        type="text"
                        value={settings.topLeft.tagline}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            topLeft: { ...settings.topLeft, tagline: e.target.value },
                          })
                        }
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-white transition"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                        Apparel Categories / Slogan
                      </label>
                      <input
                        type="text"
                        value={settings.topLeft.categories}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            topLeft: { ...settings.topLeft, categories: e.target.value },
                          })
                        }
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:border-white transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                        GSTIN / Tax ID <span className="text-zinc-500 font-normal lowercase">(leave empty if none)</span>
                      </label>
                      <input
                        type="text"
                        value={settings.topLeft.gstin}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            topLeft: { ...settings.topLeft, gstin: e.target.value },
                          })
                        }
                        placeholder="Leave empty to hide GSTIN from bill"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-white transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                        State & Code
                      </label>
                      <input
                        type="text"
                        value={settings.topLeft.state}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            topLeft: { ...settings.topLeft, state: e.target.value },
                          })
                        }
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:border-white transition"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                        Brand Logo Path (in Public folder)
                      </label>
                      <input
                        type="text"
                        value={settings.topLeft.logoUrl}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            topLeft: { ...settings.topLeft, logoUrl: e.target.value },
                          })
                        }
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-white transition"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 2: TOP RIGHT STORE & ADDRESS (3 PHONE NUMBERS) */}
              {activeSection === "topRight" && (
                <div className="space-y-4">
                  <div className="border-b border-zinc-800 pb-3">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-zinc-300" />
                      Top-Right Corner: Store Header & Contact (3 Phone Numbers)
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      All 3 phone numbers will appear in bold text in the top-right corner of the bill.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                        Invoice Badge Title
                      </label>
                      <input
                        type="text"
                        value={settings.topRight.invoiceTitle}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            topRight: { ...settings.topRight, invoiceTitle: e.target.value },
                          })
                        }
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-bold tracking-wider uppercase focus:border-white transition"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                        Address Line 1 (Shop / Street)
                      </label>
                      <input
                        type="text"
                        value={settings.topRight.addressLine1}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            topRight: { ...settings.topRight, addressLine1: e.target.value },
                          })
                        }
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:border-white transition"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                        Address Line 2 (City, Pincode, District)
                      </label>
                      <input
                        type="text"
                        value={settings.topRight.addressLine2}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            topRight: { ...settings.topRight, addressLine2: e.target.value },
                          })
                        }
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:border-white transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                        Phone Number 1 (Bold)
                      </label>
                      <input
                        type="text"
                        value={settings.topRight.phone1}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            topRight: { ...settings.topRight, phone1: e.target.value },
                          })
                        }
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-mono font-bold focus:border-white transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                        Phone Number 2 (Bold)
                      </label>
                      <input
                        type="text"
                        value={settings.topRight.phone2}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            topRight: { ...settings.topRight, phone2: e.target.value },
                          })
                        }
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-mono font-bold focus:border-white transition"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                        Phone Number 3 (Bold)
                      </label>
                      <input
                        type="text"
                        value={settings.topRight.phone3}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            topRight: { ...settings.topRight, phone3: e.target.value },
                          })
                        }
                        placeholder="+91 98259 26615"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-mono font-bold focus:border-white transition"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 3: BOTTOM LEFT DUAL QR CODES & TERMS */}
              {activeSection === "qrTerms" && (
                <div className="space-y-4">
                  <div className="border-b border-zinc-800 pb-3">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-zinc-300" />
                      Bottom-Left: Dual QR Codes & Store Terms
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Configure your Social Media QR, Bank UPI Payment QR, and Terms & Conditions.
                    </p>
                  </div>

                  {/* QR 1: Social Media */}
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                    <span className="text-xs font-bold text-zinc-200 block uppercase tracking-wider">
                      📱 QR #1: Social Media (Instagram / Website)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] text-zinc-400 uppercase mb-1">Label Text</label>
                        <input
                          type="text"
                          value={settings.qrAndTerms.socialLabel}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              qrAndTerms: { ...settings.qrAndTerms, socialLabel: e.target.value },
                            })
                          }
                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-400 uppercase mb-1">Handle Display</label>
                        <input
                          type="text"
                          value={settings.qrAndTerms.socialHandle}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              qrAndTerms: { ...settings.qrAndTerms, socialHandle: e.target.value },
                            })
                          }
                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-400 uppercase mb-1">Target Link URL</label>
                        <input
                          type="text"
                          value={settings.qrAndTerms.socialUrl}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              qrAndTerms: { ...settings.qrAndTerms, socialUrl: e.target.value },
                            })
                          }
                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* QR 2: Bank / UPI Payment */}
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                    <span className="text-xs font-bold text-zinc-200 block uppercase tracking-wider">
                      💳 QR #2: Bank / UPI Payment QR
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] text-zinc-400 uppercase mb-1">Label Text</label>
                        <input
                          type="text"
                          value={settings.qrAndTerms.paymentLabel}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              qrAndTerms: { ...settings.qrAndTerms, paymentLabel: e.target.value },
                            })
                          }
                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-400 uppercase mb-1">UPI ID (VPA)</label>
                        <input
                          type="text"
                          value={settings.qrAndTerms.upiId}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              qrAndTerms: { ...settings.qrAndTerms, upiId: e.target.value },
                            })
                          }
                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-400 uppercase mb-1">Payee Name</label>
                        <input
                          type="text"
                          value={settings.qrAndTerms.payeeName}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              qrAndTerms: { ...settings.qrAndTerms, payeeName: e.target.value },
                            })
                          }
                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Terms Lines */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-zinc-300 uppercase">
                      Terms & Conditions (Printed in footer)
                    </label>
                    <input
                      type="text"
                      value={settings.qrAndTerms.terms1}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          qrAndTerms: { ...settings.qrAndTerms, terms1: e.target.value },
                        })
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300"
                    />
                    <input
                      type="text"
                      value={settings.qrAndTerms.terms2}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          qrAndTerms: { ...settings.qrAndTerms, terms2: e.target.value },
                        })
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300"
                    />
                    <input
                      type="text"
                      value={settings.qrAndTerms.terms3}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          qrAndTerms: { ...settings.qrAndTerms, terms3: e.target.value },
                        })
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300"
                    />
                  </div>
                </div>
              )}

              {/* SECTION 4: CENTER WATERMARK SETTINGS */}
              {activeSection === "watermark" && (
                <div className="space-y-5">
                  <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-zinc-300" />
                        Center Brand Watermark
                      </h2>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Controls the logo watermark placed in the middle of the bill table without clipping from top or bottom.
                      </p>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-xs font-semibold text-zinc-300">Enable Watermark</span>
                      <input
                        type="checkbox"
                        checked={settings.watermark.enabled}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            watermark: { ...settings.watermark, enabled: e.target.checked },
                          })
                        }
                        className="w-4 h-4 accent-white rounded"
                      />
                    </label>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-zinc-300 font-semibold">Watermark Opacity</span>
                        <span className="font-mono text-zinc-400 font-bold">{settings.watermark.opacity}%</span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="40"
                        value={settings.watermark.opacity}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            watermark: { ...settings.watermark, opacity: parseInt(e.target.value) },
                          })
                        }
                        className="w-full accent-white bg-zinc-800 h-2 rounded-lg cursor-pointer"
                      />
                      <p className="text-[11px] text-zinc-500 mt-1">Recommended between 8% to 15% for clear readability.</p>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-zinc-300 font-semibold">Watermark Size / Diameter</span>
                        <span className="font-mono text-zinc-400 font-bold">{settings.watermark.size}px</span>
                      </div>
                      <input
                        type="range"
                        min="160"
                        max="400"
                        value={settings.watermark.size}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            watermark: { ...settings.watermark, size: parseInt(e.target.value) },
                          })
                        }
                        className="w-full accent-white bg-zinc-800 h-2 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                        Watermark Image Path
                      </label>
                      <input
                        type="text"
                        value={settings.watermark.imageUrl}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            watermark: { ...settings.watermark, imageUrl: e.target.value },
                          })
                        }
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Action Footer */}
              <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
                <Link
                  href="/billing"
                  className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-semibold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Return to Bill Generator
                </Link>

                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-extrabold transition shadow-lg shadow-white/10 active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  Save Settings Now
                </button>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* -------------------------------------------------------------------------
          RESET DEFAULTS CONFIRMATION MODAL
         ------------------------------------------------------------------------- */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold">
                <RotateCcw className="w-5 h-5 text-amber-400" />
                <span>Reset Settings to Defaults</span>
              </div>
              <button
                onClick={() => setShowResetModal(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-zinc-300">
              <p>
                Are you sure you want to restore default template settings?
              </p>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed">
                ⚠️ All custom header titles, phone numbers, addresses, QR payment handles, and watermark configurations will be reset to default GLITCH store values and saved to your database.
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmReset}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-400 text-black hover:bg-amber-300 text-xs font-extrabold transition shadow-lg shadow-amber-400/10 active:scale-95"
              >
                <RotateCcw className="w-4 h-4 text-black" />
                <span>Yes, Reset to Defaults</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
