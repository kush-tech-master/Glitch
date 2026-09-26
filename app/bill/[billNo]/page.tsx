"use client";

import React, { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import {
  Download,
  Printer,
  Share2,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  Building2,
  Phone,
  QrCode,
  Calendar,
  User,
  MapPin,
  Sparkles
} from "lucide-react";
import { BillSettings, DEFAULT_BILL_SETTINGS } from "../../billing/billing-config";
import { apiGetSettings } from "../../billing/lib/api";
import { exportElementToPdf } from "../../billing/lib/pdfGenerator";

// Inline Instagram SVG Icon
function InstagramIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

// Number to Words in Indian Currency format
function numberToWords(num: number): string {
  if (num === 0) return "Rupees Zero Only";
  const a = [
    "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ",
    "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const formatTens = (n: number) => {
    if (n < 20) return a[n];
    return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : " ");
  };

  const integerPart = Math.floor(Math.abs(num));
  const decimalPart = Math.round((Math.abs(num) - integerPart) * 100);

  let str = "";
  const crore = Math.floor(integerPart / 10000000);
  const lakh = Math.floor((integerPart % 10000000) / 100000);
  const thousand = Math.floor((integerPart % 100000) / 1000);
  const hundred = Math.floor((integerPart % 1000) / 100);
  const rest = integerPart % 100;

  if (crore > 0) str += formatTens(crore) + "Crore ";
  if (lakh > 0) str += formatTens(lakh) + "Lakh ";
  if (thousand > 0) str += formatTens(thousand) + "Thousand ";
  if (hundred > 0) str += formatTens(hundred) + "Hundred ";
  if (rest > 0) str += (str !== "" ? "and " : "") + formatTens(rest);

  let result = "Rupees " + (str.trim() || "Zero");
  if (decimalPart > 0) {
    result += ` and ${formatTens(decimalPart).trim()} Paise`;
  }
  return result + " Only";
}

interface BillData {
  _id: string;
  billNo: string;
  billDate: string;
  customer: {
    name: string;
    mobile: string;
    city: string;
  };
  paymentMode: string;
  paymentStatus: string;
  items: Array<{
    code: string;
    company: string;
    category: string;
    size: string;
    qty: number;
    rate: number;
    amount: number;
  }>;
  totalQty: number;
  grossSubTotal: number;
  discountPercent: number;
  discountAmount: number;
  grandTotal: number;
  notes?: string;
  createdAt: string;
}

export default function PublicDigitalBillPage({
  params,
}: {
  params: Promise<{ billNo: string }>;
}) {
  const resolvedParams = use(params);
  const billNo = resolvedParams.billNo;

  const [bill, setBill] = useState<BillData | null>(null);
  const [settings, setSettings] = useState<BillSettings>(DEFAULT_BILL_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // 1. Fetch live bill from backend
        const res = await fetch(`http://localhost:5000/api/bills/${billNo}`, {
          cache: "no-store",
        });
        const result = await res.json();
        if (result.success && result.data) {
          setBill(result.data);
        } else {
          setError(result.message || `Invoice ${billNo} not found`);
        }

        // 2. Fetch live settings
        const dbSettings = await apiGetSettings();
        if (dbSettings) setSettings(dbSettings);
      } catch (err: any) {
        setError(err.message || "Failed to load invoice from store server");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [billNo]);

  // Download PDF Handler
  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    const success = await exportElementToPdf(
      "printable-bill",
      `GLITCH-INVOICE-${billNo}.pdf`
    );
    setDownloadingPdf(false);
  };

  // Dynamic UPI Payment QR Payload
  const grandTotal = bill?.grandTotal || 0;
  const upiQrPayload = `upi://pay?pa=${encodeURIComponent(
    settings.qrAndTerms.upiId
  )}&pn=${encodeURIComponent(settings.qrAndTerms.payeeName)}&am=${grandTotal}&cu=INR&tn=Invoice%20${billNo}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white space-y-4 font-sans">
        <div className="w-16 h-16 relative rounded-full overflow-hidden border border-zinc-700 animate-pulse bg-zinc-900">
          <Image
            src="/glitch-original.jpeg"
            alt="GLITCH Logo"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="text-center space-y-1">
          <p className="text-xs font-bold text-white">GLITCH DIGITAL INVOICE PORTAL</p>
          <p className="text-[10px] font-mono text-zinc-400">Fetching invoice {billNo} from MongoDB...</p>
        </div>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4 font-sans">
        <div className="max-w-md w-full p-8 rounded-2xl bg-zinc-950 border border-zinc-800 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Invoice Not Found</h1>
            <p className="text-xs text-zinc-400 mt-1">{error || `No invoice found matching ${billNo}`}</p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black font-extrabold text-xs hover:bg-zinc-200 transition"
          >
            Go to GLITCH Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans print:bg-white print:text-black antialiased selection:bg-white selection:text-black">
      
      {/* Top Customer Action Bar (Hidden during print) */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-4 lg:px-8 py-3.5 print:hidden">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-black overflow-hidden ring-1 ring-zinc-700 relative flex-shrink-0">
              <Image
                src={settings.topLeft.logoUrl || "/glitch-original.jpeg"}
                alt="Brand Logo"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs tracking-wider text-white">
                  {settings.topLeft.brandName}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 font-semibold border border-emerald-800 font-mono">
                  {bill.billNo} • PAID
                </span>
              </div>
              <p className="text-[10px] text-zinc-400">Official Customer E-Invoice Slip</p>
            </div>
          </div>

          {/* Action Buttons for Customer */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-black transition shadow-lg shadow-white/10 active:scale-95 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloadingPdf ? "Generating PDF..." : "Download PDF Bill"}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-bold transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-6 print:p-0 print:max-w-none flex flex-col items-center">
        
        {/* Customer Thank You Banner (Hidden in Print) */}
        <div className="w-full mb-4 p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-300 print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              Thank you for shopping at <strong className="text-white">{settings.topLeft.brandName}</strong>! Your digital receipt is ready below.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={settings.qrAndTerms.socialUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white underline"
            >
              <InstagramIcon className="w-3 h-3 text-pink-400" />
              <span>{settings.qrAndTerms.socialHandle}</span>
            </a>
          </div>
        </div>

        {/* =========================================================================
            THE HORIZONTAL INVOICE SLIP (Rendered for Download & Print)
           ========================================================================= */}
        <div
          id="printable-bill"
          className="w-full bg-white text-zinc-900 rounded-lg shadow-2xl border border-zinc-300 overflow-hidden relative print:shadow-none print:border-none print:m-0 print:w-full print:rounded-none"
          style={{
            fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          }}
        >
          <div className="relative z-10 flex flex-col justify-between p-4 sm:p-5 text-zinc-900 text-xs min-h-[480px]">
            
            {/* 1. TOP HEADER */}
            <div className="border-b-2 border-zinc-900 pb-2.5">
              <div className="flex items-start justify-between gap-4">
                
                {/* Brand Details */}
                <div className="flex items-start gap-3">
                  <div className="w-13 h-13 relative flex-shrink-0 bg-black rounded-full overflow-hidden border border-zinc-800 shadow-sm">
                    <Image
                      src={settings.topLeft.logoUrl || "/glitch-original.jpeg"}
                      alt="GLITCH Logo"
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div>
                    <div className="flex items-baseline gap-2">
                      <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-zinc-950 leading-none">
                        {settings.topLeft.brandName}
                      </h1>
                      <span className="text-[10px] font-extrabold tracking-widest text-zinc-800 uppercase">
                        — {settings.topLeft.tagline} —
                      </span>
                    </div>

                    <p className="text-[9px] font-bold tracking-wider text-zinc-600 mt-0.5 uppercase">
                      {settings.topLeft.categories}
                    </p>

                    <div className="flex items-center gap-2 mt-1 text-[9px] font-mono font-semibold text-zinc-700">
                      {settings.topLeft.gstin && settings.topLeft.gstin.trim() !== "" && (
                        <>
                          <span>
                            GSTIN: <strong className="text-zinc-950 font-bold">{settings.topLeft.gstin}</strong>
                          </span>
                          <span>•</span>
                        </>
                      )}
                      <span>STATE: {settings.topLeft.state}</span>
                    </div>
                  </div>
                </div>

                {/* Top Right Store Info & 3 Bold Phone Numbers */}
                <div className="text-right">
                  <div className="inline-block bg-zinc-950 text-white px-3 py-0.5 rounded text-[10px] font-black tracking-widest uppercase mb-1">
                    {settings.topRight.invoiceTitle}
                  </div>
                  <p className="text-[10px] font-bold text-zinc-900 leading-tight">
                    {settings.topRight.addressLine1}
                  </p>
                  <p className="text-[9.5px] text-zinc-700 leading-tight">
                    {settings.topRight.addressLine2}
                  </p>
                  <p className="text-[9.5px] font-mono text-zinc-900 mt-0.5">
                    Mo: <strong className="font-extrabold text-zinc-950">{settings.topRight.phone1}</strong>
                    {settings.topRight.phone2 ? (
                      <>, <strong className="font-extrabold text-zinc-950">{settings.topRight.phone2}</strong></>
                    ) : null}
                    {settings.topRight.phone3 ? (
                      <>, <strong className="font-extrabold text-zinc-950">{settings.topRight.phone3}</strong></>
                    ) : null}
                  </p>
                </div>

              </div>
            </div>

            {/* 2. CUSTOMER & INVOICE DETAILS */}
            <div className="bg-zinc-100/90 border-b border-zinc-300 py-1.5 px-2.5 my-1.5 rounded text-[10px] leading-tight">
              <div className="grid grid-cols-12 gap-2 items-center">
                
                <div className="col-span-12 sm:col-span-7 flex flex-wrap items-center gap-3">
                  <div>
                    <span className="text-zinc-500 font-bold uppercase text-[9px]">Buyer: </span>
                    <strong className="text-zinc-950 font-black uppercase text-[11px]">
                      {bill.customer?.name || "Walk-in Customer"}
                    </strong>
                  </div>

                  <div>
                    <span className="text-zinc-500 font-bold uppercase text-[9px]">Mo: </span>
                    <span className="font-mono font-bold text-zinc-900 text-[10px]">
                      {bill.customer?.mobile || "N/A"}
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-500 font-bold uppercase text-[9px]">City: </span>
                    <span className="font-bold uppercase text-zinc-900 text-[10px]">
                      {bill.customer?.city || "Modasa"}
                    </span>
                  </div>
                </div>

                <div className="col-span-12 sm:col-span-5 flex items-center justify-start sm:justify-end gap-3 text-right">
                  <div>
                    <span className="text-zinc-500 font-bold uppercase text-[9px]">Bill No: </span>
                    <span className="font-mono font-black text-zinc-950 px-1.5 py-0.5 bg-zinc-200 rounded">
                      {bill.billNo}
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-500 font-bold uppercase text-[9px]">Date: </span>
                    <span className="font-mono font-bold text-zinc-900 text-[10px]">
                      {bill.billDate.split("-").reverse().join("/")}
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-500 font-bold uppercase text-[9px]">Mode: </span>
                    <span className="font-bold text-zinc-900 text-[10px] px-1 py-0.5 bg-zinc-200 rounded">
                      {bill.paymentMode || "Cash"}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* 3. PRODUCT DETAILS TABLE WITH UNCLIPPED WATERMARK */}
            <div className="flex-1 my-1 relative">
              
              {/* Unclipped Center Watermark */}
              {settings.watermark.enabled && (
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-visible"
                  style={{
                    opacity: settings.watermark.opacity / 100,
                  }}
                >
                  <div
                    className="relative rounded-full overflow-hidden shadow-none"
                    style={{
                      width: `${settings.watermark.size}px`,
                      height: `${settings.watermark.size}px`,
                      maxWidth: "280px",
                      maxHeight: "280px",
                    }}
                  >
                    <Image
                      src={settings.watermark.imageUrl || "/glitch-original.jpeg"}
                      alt="Brand Watermark"
                      fill
                      className="object-contain grayscale contrast-125"
                      priority
                    />
                  </div>
                </div>
              )}

              <table className="w-full text-left border-collapse relative z-10">
                <thead>
                  <tr className="border-b-2 border-t border-zinc-900 bg-zinc-200/90 text-[9.5px] font-black uppercase text-zinc-900 tracking-wider">
                    <th className="py-1 px-1.5 w-7 text-center">S.N.</th>
                    <th className="py-1 px-1.5 w-28">Item Code</th>
                    <th className="py-1 px-1.5">Description (Company & Category)</th>
                    <th className="py-1 px-1.5 w-20 text-center">Size</th>
                    <th className="py-1 px-1.5 w-14 text-center">Qty</th>
                    <th className="py-1 px-1.5 w-20 text-right">Rate (₹)</th>
                    <th className="py-1 px-1.5 w-24 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 text-[10px]">
                  {bill.items.map((item, index) => (
                    <tr key={index} className="hover:bg-zinc-50/60">
                      <td className="py-1.5 px-1.5 text-center font-mono font-bold text-zinc-700">
                        {index + 1}.
                      </td>
                      <td className="py-1.5 px-1.5 font-mono font-bold text-zinc-900">
                        {item.code}
                      </td>
                      <td className="py-1.5 px-1.5 font-bold text-zinc-950">
                        <span className="font-extrabold">{item.company}</span>
                        <span className="text-zinc-400 mx-1">—</span>
                        <span>{item.category}</span>
                      </td>
                      <td className="py-1.5 px-1.5 text-center font-extrabold text-zinc-900">
                        {item.size || "L"}
                      </td>
                      <td className="py-1.5 px-1.5 text-center font-mono font-bold text-zinc-900">
                        {item.qty || 1}
                      </td>
                      <td className="py-1.5 px-1.5 text-right font-mono font-bold text-zinc-900">
                        ₹{(item.rate || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-1.5 px-1.5 text-right font-mono font-black text-zinc-950">
                        ₹{(item.amount || 0).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 4. TOTALS & FOOTER */}
            <div className="border-t-2 border-zinc-900 pt-2 mt-2">
              <div className="grid grid-cols-12 gap-3 items-end">
                
                {/* Bottom Left: Dual QR Codes & Terms */}
                <div className="col-span-12 sm:col-span-7 flex items-start gap-4">
                  
                  {/* QR 1: Instagram */}
                  <div className="flex flex-col items-center bg-zinc-50 border border-zinc-300 rounded p-1 shadow-xs">
                    <QRCodeSVG
                      value={settings.qrAndTerms.socialUrl}
                      size={60}
                      level="M"
                      includeMargin={false}
                    />
                    <div className="flex items-center gap-1 mt-1 text-[7.5px] font-black tracking-tight text-zinc-900 uppercase">
                      <InstagramIcon className="w-2.5 h-2.5 text-pink-600" />
                      <span>{settings.qrAndTerms.socialLabel}</span>
                    </div>
                  </div>

                  {/* QR 2: UPI Payment */}
                  <div className="flex flex-col items-center bg-zinc-50 border border-zinc-300 rounded p-1 shadow-xs">
                    <QRCodeSVG
                      value={upiQrPayload}
                      size={60}
                      level="M"
                      includeMargin={false}
                    />
                    <div className="text-[7.5px] font-black tracking-tight text-zinc-900 uppercase mt-1">
                      💳 {settings.qrAndTerms.paymentLabel}
                    </div>
                  </div>

                  {/* Terms & Conditions */}
                  <div className="flex-1 text-[8.5px] leading-tight text-zinc-700 space-y-0.5">
                    <strong className="block text-[9px] font-extrabold text-zinc-900 uppercase">
                      Terms & Conditions:
                    </strong>
                    <p>{settings.qrAndTerms.terms1}</p>
                    <p>{settings.qrAndTerms.terms2}</p>
                    <p>{settings.qrAndTerms.terms3}</p>
                  </div>
                </div>

                {/* Bottom Right: Amount Summary */}
                <div className="col-span-12 sm:col-span-5 flex flex-col justify-end text-right">
                  <div className="space-y-1 text-[10px]">
                    <div className="flex justify-between text-zinc-600">
                      <span>Total Qty:</span>
                      <span className="font-mono font-bold text-zinc-900">{bill.totalQty || 1} pcs</span>
                    </div>

                    <div className="flex justify-between text-zinc-700">
                      <span>Sub Total:</span>
                      <span className="font-mono font-bold text-zinc-900">
                        ₹{(bill.grossSubTotal || 0).toLocaleString("en-IN")}
                      </span>
                    </div>

                    {bill.discountPercent > 0 && (
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span>Discount ({bill.discountPercent}%):</span>
                        <span className="font-mono">-₹{(bill.discountAmount || 0).toLocaleString("en-IN")}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-zinc-950 font-black text-sm pt-1 border-t border-zinc-900">
                      <span>Grand Total:</span>
                      <span className="font-mono text-base">₹{(bill.grandTotal || 0).toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  {/* Amount in words */}
                  <div className="mt-1.5 pt-1 border-t border-dashed border-zinc-300 text-[8.5px] text-zinc-600 italic">
                    {numberToWords(bill.grandTotal || 0)}
                  </div>
                </div>

              </div>
            </div>

            {/* Vertical Left Micro Strip */}
            <div className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 origin-center pointer-events-none text-[6.5px] font-black tracking-[0.25em] text-zinc-400 uppercase whitespace-nowrap opacity-60">
              ⚡ {settings.topLeft.brandName} ORIGINAL GARMENTS • {settings.topLeft.state} ⚡
            </div>

          </div>
        </div>

      </main>

      {/* Global CSS for Landscape Print Output */}
      <style jsx global>{`
        @media print {
          @page {
            size: A5 landscape;
            margin: 4mm;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header,
          footer,
          .print\\:hidden {
            display: none !important;
          }
          #printable-bill {
            box-shadow: none !important;
            border: 1px solid #18181b !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
