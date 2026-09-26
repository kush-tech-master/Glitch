"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import {
  Printer,
  Plus,
  Trash2,
  RefreshCw,
  QrCode,
  User,
  Phone,
  MapPin,
  FileText,
  Percent,
  CheckCircle2,
  Sliders,
  Share2,
  CreditCard,
  Building2,
  Calendar,
  Layers,
  ArrowLeft,
  Settings,
  AlertTriangle,
  Smartphone,
  Tag,
  History,
  Check,
  X,
  LogOut,
  Download
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { clearAuthSession, getAuthUser } from "./lib/auth";
import { exportElementToPdf } from "./lib/pdfGenerator";
import {
  BillSettings,
  DEFAULT_BILL_SETTINGS,
  COMPANY_OPTIONS,
  CATEGORY_OPTIONS,
  SIZE_OPTIONS,
  loadBillSettings,
  saveBillToHistory,
  getSavedBills,
  SavedBill
} from "./billing-config";
import {
  apiGetNextBillNumber,
  apiSaveBill,
  apiGetBillById,
  apiGetCompanies,
  apiGetCategories,
  apiGetSettings
} from "./lib/api";

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

interface ProductItem {
  id: string;
  code: string;
  company: string;
  category: string;
  size: string;
  qty: number;
  rate: number;
  amount: number;
}

function BillingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editQuery = searchParams ? searchParams.get("edit") || searchParams.get("billNo") : null;

  // Loaded Settings from Bill Settings Page / MongoDB
  const [settings, setSettings] = useState<BillSettings>(DEFAULT_BILL_SETTINGS);
  const [companies, setCompanies] = useState<string[]>(COMPANY_OPTIONS);
  const [categories, setCategories] = useState<string[]>(CATEGORY_OPTIONS);

  // Customer Details Inputs (Empty for every new bill, mobile is strictly required)
  const [customer, setCustomer] = useState({
    name: "",
    mobile: "",
    city: "Modasa",
  });

  // Invoice Details Inputs
  const [invoiceMeta, setInvoiceMeta] = useState({
    invoiceNo: `GL-00001`,
    date: new Date().toISOString().split("T")[0],
    paymentMode: "Cash",
  });

  // Editing existing invoice state
  const [isEditingInvoice, setIsEditingInvoice] = useState<boolean>(false);
  const [currentShareToken, setCurrentShareToken] = useState<string>("");

  // Validation modal state (Replaces default browser alert)
  const [validationModal, setValidationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    fieldToFocus?: string;
  } | null>(null);

  const mobileInputRef = useRef<HTMLInputElement>(null);

  // Helper to generate unique item code in same bill
  const generateUniqueCode = (existingItems: ProductItem[] = []) => {
    let newCode = "";
    const existingCodes = new Set(existingItems.map((i) => i.code.trim().toUpperCase()));
    let attempts = 0;
    do {
      const rand = Math.floor(100000000000 + Math.random() * 900000000000);
      newCode = rand.toString();
      attempts++;
    } while (existingCodes.has(newCode) && attempts < 20);
    return newCode;
  };

  // Product Items (Starts with 1 empty row for every new bill)
  const [items, setItems] = useState<ProductItem[]>([
    {
      id: "1",
      code: "012607076701",
      company: "GLITCH",
      category: "T-Shirt",
      size: "L",
      qty: 1,
      rate: 0,
      amount: 0,
    },
  ]);

  // Overall Bill Discount % Input
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Print Confirmation Modal State
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  // New Bill Confirmation Modal State
  const [showNewBillModal, setShowNewBillModal] = useState<boolean>(false);

  // Load settings and check for active draft or fetch next bill number on mount / edit query change
  useEffect(() => {
    setSettings(loadBillSettings());

    // 1. Fetch dynamic settings from MongoDB if available
    apiGetSettings().then((dbSettings) => {
      if (dbSettings) setSettings(dbSettings);
    });

    // 2. Fetch companies and categories from MongoDB
    apiGetCompanies().then((dbCompanies) => {
      if (dbCompanies && dbCompanies.length > 0) setCompanies(dbCompanies);
    });
    apiGetCategories().then((dbCategories) => {
      if (dbCategories && dbCategories.length > 0) setCategories(dbCategories);
    });

    async function initializeBill() {
      let loadedBill: SavedBill | null = null;

      // Check if target bill was passed via URL
      if (editQuery) {
        loadedBill = await apiGetBillById(editQuery);
      }

      // Check if user came from "Saved Invoices" draft in localStorage
      if (!loadedBill && typeof window !== "undefined") {
        const draft = localStorage.getItem("glitch_active_bill_draft");
        if (draft) {
          try {
            loadedBill = JSON.parse(draft) as SavedBill;
          } catch (e) {
            console.error("Failed to parse draft:", e);
          }
        }
      }

      // Check if bill exists in local saved history
      if (!loadedBill && editQuery && typeof window !== "undefined") {
        const saved = getSavedBills();
        loadedBill = saved.find((b) => b.invoiceNo === editQuery) || null;
      }

      if (loadedBill) {
        setCustomer({
          name: loadedBill.customerName || "",
          mobile: loadedBill.customerMobile || "",
          city: loadedBill.customerCity || "Modasa",
        });
        setInvoiceMeta({
          invoiceNo: loadedBill.invoiceNo || "GL-00001",
          date: loadedBill.date || new Date().toISOString().split("T")[0],
          paymentMode: loadedBill.paymentMode || "Cash",
        });
        setDiscountPercent(loadedBill.discountPercent || 0);
        if (loadedBill.items && loadedBill.items.length > 0) {
          setItems(
            loadedBill.items.map((i: any, idx: number) => ({
              id: i.id || i._id || `${Date.now()}_${idx}`,
              code: i.code || "",
              company: i.company || "GLITCH",
              category: i.category || "T-Shirt",
              size: i.size || "L",
              qty: Number(i.qty) || 1,
              rate: Number(i.rate) || 0,
              amount: Number(i.amount) || 0,
            }))
          );
        }
        setIsEditingInvoice(true);
        if (loadedBill.shareToken) {
          setCurrentShareToken(loadedBill.shareToken);
        }
        if (typeof window !== "undefined") {
          localStorage.removeItem("glitch_active_bill_draft");
        }
      } else {
        setIsEditingInvoice(false);
        setCurrentShareToken("");
        const nextNo = await apiGetNextBillNumber();
        if (nextNo) {
          setInvoiceMeta((prev) => ({ ...prev, invoiceNo: nextNo }));
        }
      }
    }

    initializeBill();
  }, [editQuery]);

  // Check for duplicate codes in bill
  const duplicateCodes = items
    .map((i) => i.code.trim().toUpperCase())
    .filter((code, idx, arr) => code && arr.indexOf(code) !== idx);

  // Add Item Row
  const handleAddItem = () => {
    const defaultCompany = companies[0] || "GLITCH";
    const defaultCategory = categories[0] || "T-Shirt";
    const newItem: ProductItem = {
      id: Date.now().toString(),
      code: generateUniqueCode(items),
      company: defaultCompany,
      category: defaultCategory,
      size: "L",
      qty: 1,
      rate: 0,
      amount: 0,
    };
    setItems([...items, newItem]);
  };

  // Remove Item Row
  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      setValidationModal({
        isOpen: true,
        title: "Cannot Remove Item",
        message: "A bill requires at least 1 line item.",
      });
      return;
    }
    setItems(items.filter((item) => item.id !== id));
  };

  // Update Item field with automatic amount calculation (Amount = Qty * Rate)
  const handleUpdateItem = (id: string, field: keyof ProductItem, value: string | number) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === "qty" || field === "rate") {
            const q = field === "qty" ? Number(value) : item.qty;
            const r = field === "rate" ? Number(value) : item.rate;
            updated.amount = q * r;
          } else if (field === "amount") {
            updated.amount = Number(value);
            if (updated.qty > 0) {
              updated.rate = updated.amount / updated.qty;
            }
          }
          return updated;
        }
        return item;
      })
    );
  };

  // Clear / New Bill Trigger
  const handleNewBill = () => {
    setShowNewBillModal(true);
  };

  // Confirm Start New Bill (All empty inputs & next sequential bill no from MongoDB)
  const handleConfirmNewBill = async () => {
    setIsEditingInvoice(false);
    setCurrentShareToken("");
    const nextNo = await apiGetNextBillNumber();
    setInvoiceMeta({
      invoiceNo: nextNo || `GL-0${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split("T")[0],
      paymentMode: "Cash",
    });
    setCustomer({
      name: "",
      mobile: "",
      city: "Modasa",
    });
    setDiscountPercent(0);
    setItems([
      {
        id: Date.now().toString(),
        code: generateUniqueCode(),
        company: companies[0] || "GLITCH",
        category: categories[0] || "T-Shirt",
        size: "L",
        qty: 1,
        rate: 0,
        amount: 0,
      },
    ]);
    setShowNewBillModal(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("glitch_active_bill_draft");
    }
    router.replace("/billing");
  };

  // Validation function: Mobile number is mandatory (10 digits) & at least 1 item
  const validateInvoice = (): boolean => {
    const cleanMobile = (customer.mobile || "").trim().replace(/\D/g, "");
    if (!cleanMobile || cleanMobile.length !== 10) {
      setValidationModal({
        isOpen: true,
        title: "Customer Mobile Number Required",
        message:
          "Please enter a valid 10-digit customer mobile number. Without a mobile number, an invoice cannot be created, printed, downloaded as PDF, or shared on WhatsApp.",
        fieldToFocus: "mobile",
      });
      return false;
    }
    if (!items || items.length === 0) {
      setValidationModal({
        isOpen: true,
        title: "Product Items Required",
        message: "An invoice must contain at least 1 product item with valid price.",
      });
      return false;
    }
    return true;
  };

  // Calculations
  const totalQty = items.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  const grossSubTotal = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const discountAmount = discountPercent > 0 ? (grossSubTotal * discountPercent) / 100 : 0;
  const grandTotal = Math.max(0, Math.round(grossSubTotal - discountAmount));

  // Dynamic UPI Payment QR Payload
  const upiQrPayload = `upi://pay?pa=${encodeURIComponent(
    settings.qrAndTerms.upiId
  )}&pn=${encodeURIComponent(settings.qrAndTerms.payeeName)}&am=${grandTotal}&cu=INR&tn=Invoice%20${invoiceMeta.invoiceNo}`;

  // PDF Download State
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Direct PDF Download on POS
  const handleDownloadPdf = async () => {
    if (!validateInvoice()) return;
    setDownloadingPdf(true);
    try {
      // Auto-save or update to MongoDB
      const saveRes = await apiSaveBill({
        billNo: invoiceMeta.invoiceNo,
        billDate: invoiceMeta.date,
        customer: {
          name: customer.name || "Walk-in Customer",
          mobile: customer.mobile.trim(),
          city: customer.city || "Modasa",
        },
        paymentMode: invoiceMeta.paymentMode,
        items: items,
        grossSubTotal: grossSubTotal,
        discountPercent: discountPercent,
        discountAmount: discountAmount,
        grandTotal: grandTotal,
      });

      if (saveRes?.data?.shareToken) {
        setCurrentShareToken(saveRes.data.shareToken);
      }

      // Save to localStorage history
      const savedBillData: SavedBill = {
        id: invoiceMeta.invoiceNo,
        invoiceNo: invoiceMeta.invoiceNo,
        date: invoiceMeta.date,
        customerName: customer.name || "Walk-in Customer",
        customerMobile: customer.mobile.trim(),
        customerCity: customer.city || "Modasa",
        paymentMode: invoiceMeta.paymentMode,
        items: items,
        grossSubTotal: grossSubTotal,
        discountPercent: discountPercent,
        discountAmount: discountAmount,
        grandTotal: grandTotal,
        shareToken: saveRes?.data?.shareToken || currentShareToken,
        createdAt: new Date().toISOString(),
      };
      saveBillToHistory(savedBillData);

      await exportElementToPdf("printable-bill", `GLITCH-INVOICE-${invoiceMeta.invoiceNo}.pdf`);
    } catch (e) {
      console.error("Failed to generate PDF:", e);
    } finally {
      setDownloadingPdf(false);
    }
  };

  // WhatsApp Share with Direct Digital PDF Bill Link
  const shareToWhatsapp = async () => {
    if (!validateInvoice()) return;

    // Auto-save bill to MongoDB so the public link exists and obtain tamper-proof share token
    const saveRes = await apiSaveBill({
      billNo: invoiceMeta.invoiceNo,
      billDate: invoiceMeta.date,
      customer: {
        name: customer.name || "Walk-in Customer",
        mobile: customer.mobile.trim(),
        city: customer.city || "Modasa",
      },
      paymentMode: invoiceMeta.paymentMode,
      items: items,
      grossSubTotal: grossSubTotal,
      discountPercent: discountPercent,
      discountAmount: discountAmount,
      grandTotal: grandTotal,
    });

    const token = saveRes?.data?.shareToken || currentShareToken || "";
    if (token) setCurrentShareToken(token);
    const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : "";

    const publicBillUrl = typeof window !== "undefined"
      ? `${window.location.origin}/bill/${invoiceMeta.invoiceNo}${tokenQuery}`
      : `http://localhost:3000/bill/${invoiceMeta.invoiceNo}${tokenQuery}`;

    const text = `*⚡ ${settings.topLeft.brandName} - ${settings.topLeft.tagline} | INVOICE ${invoiceMeta.invoiceNo}*\n\n` +
      `👤 *Customer:* ${customer.name || "Customer"} (${customer.city || "Modasa"})\n` +
      `📱 *Mobile:* ${customer.mobile.trim()}\n` +
      `📅 *Date:* ${invoiceMeta.date} | *Mode:* ${invoiceMeta.paymentMode}\n\n` +
      `🛍️ *Items (${totalQty} pcs):*\n` +
      items.map((i) => `• ${i.company} ${i.category} [${i.size}] x${i.qty} @ ₹${i.rate} = ₹${i.amount}`).join("\n") +
      `\n\n` +
      (discountPercent > 0
        ? `💵 *Sub Total:* ₹${grossSubTotal.toLocaleString("en-IN")}\n` +
          `🏷️ *Discount (${discountPercent}%):* -₹${discountAmount.toLocaleString("en-IN")}\n`
        : "") +
      `💰 *Grand Total:* ₹${grandTotal.toLocaleString("en-IN")}\n\n` +
      `📄 *View & Download Full PDF Bill:*\n${publicBillUrl}\n\n` +
      `📍 *Store:* ${settings.topRight.addressLine1}, ${settings.topRight.addressLine2}\n` +
      `📸 *Instagram:* ${settings.qrAndTerms.socialHandle}\n\n` +
      `_Thank you for shopping with ${settings.topLeft.brandName}!_ 🔥`;

    window.open(`https://api.whatsapp.com/send?phone=91${customer.mobile.trim()}&text=${encodeURIComponent(text)}`, "_blank");
  };

  // Open Print Modal
  const handleInitiatePrint = () => {
    if (!validateInvoice()) return;
    setShowPrintModal(true);
  };

  // Confirm Print & Save Bill (Direct to MongoDB Atlas + localStorage fallback)
  const handleConfirmPrint = async () => {
    if (!validateInvoice()) return;
    // 1. Save bill to MongoDB Atlas via Express API
    apiSaveBill({
      billNo: invoiceMeta.invoiceNo,
      billDate: invoiceMeta.date,
      customer: {
        name: customer.name || "Walk-in Customer",
        mobile: customer.mobile.trim(),
        city: customer.city || "Modasa",
      },
      paymentMode: invoiceMeta.paymentMode,
      items: items,
      grossSubTotal: grossSubTotal,
      discountPercent: discountPercent,
      discountAmount: discountAmount,
      grandTotal: grandTotal,
    });

    // 2. Save bill to localStorage as backup
    const savedBillData: SavedBill = {
      id: invoiceMeta.invoiceNo,
      invoiceNo: invoiceMeta.invoiceNo,
      date: invoiceMeta.date,
      customerName: customer.name || "Walk-in Customer",
      customerMobile: customer.mobile.trim(),
      customerCity: customer.city || "Modasa",
      paymentMode: invoiceMeta.paymentMode,
      items: items,
      grossSubTotal: grossSubTotal,
      discountPercent: discountPercent,
      discountAmount: discountAmount,
      grandTotal: grandTotal,
      createdAt: new Date().toISOString(),
    };
    saveBillToHistory(savedBillData);

    // 3. Close modal
    setShowPrintModal(false);

    // 4. Trigger print dialog after modal closes
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans print:bg-white print:text-black antialiased selection:bg-white selection:text-black">
      
      {/* -------------------------------------------------------------------------
          TOP ACTION BAR (Hidden during Print)
         ------------------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-4 lg:px-8 py-3 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition"
              title="Home"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="w-9 h-9 rounded-full bg-black overflow-hidden ring-1 ring-zinc-700 relative flex-shrink-0">
              <Image
                src={settings.topLeft.logoUrl || "/glitch-original.jpeg"}
                alt="Brand Logo"
                fill
                className="object-cover"
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-wider text-white">
                  {settings.topLeft.brandName}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-semibold border border-zinc-700">
                  {settings.topLeft.tagline}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Horizontal Retail POS Invoice Template</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            
            {/* Button to Saved Invoices History Page */}
            <Link
              href="/billing/history"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs font-bold transition shadow-sm"
              title="View all saved previous bills"
            >
              <History className="w-3.5 h-3.5 text-zinc-400" />
              <span>Invoices</span>
            </Link>

            {/* Brands Management */}
            <Link
              href="/billing/companies"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs font-bold transition shadow-sm"
              title="Manage product companies/brands"
            >
              <Building2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Brands</span>
            </Link>

            {/* Categories Management */}
            <Link
              href="/billing/categories"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs font-bold transition shadow-sm"
              title="Manage apparel product categories"
            >
              <Tag className="w-3.5 h-3.5 text-zinc-400" />
              <span>Categories</span>
            </Link>

            {/* Bill Settings Button -> Navigates to /billing/settings */}
            <Link
              href="/billing/settings"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-white text-xs font-bold transition shadow-sm"
              title="Customize Brand, Store Info, QR Codes, and Watermark"
            >
              <Settings className="w-3.5 h-3.5 text-zinc-300" />
              <span>Settings</span>
            </Link>

            <button
              onClick={handleNewBill}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              New Bill
            </button>

            <button
              onClick={shareToWhatsapp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 text-xs font-semibold transition"
              title="Share digital bill on WhatsApp"
            >
              <Smartphone className="w-3.5 h-3.5" />
              WhatsApp
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs font-semibold transition disabled:opacity-50"
              title="Download official PDF file"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span>{downloadingPdf ? "PDF..." : "PDF"}</span>
            </button>

            <button
              onClick={handleInitiatePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 text-xs font-black transition shadow-lg shadow-white/5 active:scale-95"
            >
              <Printer className="w-4 h-4" />
              Print Slip
            </button>

            <button
              onClick={() => {
                clearAuthSession();
                router.replace('/login');
              }}
              className="flex items-center gap-1.5 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition"
              title="Logout from POS"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </header>

      {/* Duplicate Code Alert Banner */}
      {duplicateCodes.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 pt-3 print:hidden">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              <strong>Warning:</strong> Duplicate Item Code detected:{" "}
              <code className="bg-amber-950/60 px-1.5 py-0.5 rounded font-mono font-bold">
                {duplicateCodes.join(", ")}
              </code>
              . Each item code in the same bill should be unique.
            </span>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------
          MAIN HORIZONTAL BILL TEMPLATE WORKSPACE
         ------------------------------------------------------------------------- */}
      <main className="max-w-6xl mx-auto px-4 py-6 print:p-0 print:max-w-none flex flex-col items-center">
        
        {/* Editing Existing Bill Indicator Banner */}
        {isEditingInvoice && (
          <div className="w-full mb-3 print:hidden">
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs flex flex-wrap items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse flex-shrink-0" />
                <p>
                  <strong className="text-white font-bold">Currently Editing Saved Invoice:</strong>{" "}
                  <span className="bg-blue-950/80 text-blue-200 px-2 py-0.5 rounded font-mono font-bold border border-blue-800">
                    {invoiceMeta.invoiceNo}
                  </span>
                  <span className="text-zinc-400 ml-2 hidden sm:inline">
                    (Downloading, Printing, or WhatsApp will update this invoice without creating duplicates)
                  </span>
                </p>
              </div>
              <button
                onClick={handleNewBill}
                className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-white hover:text-black text-zinc-200 text-[11px] font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Start New Invoice</span>
              </button>
            </div>
          </div>
        )}

        {/* THE HORIZONTAL BILL SLIP CONTAINER */}
        <div
          id="printable-bill"
          className="w-full bg-white text-zinc-900 rounded-lg shadow-2xl border border-zinc-300 overflow-hidden relative print:shadow-none print:border-none print:m-0 print:w-full print:rounded-none"
          style={{
            fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          }}
        >
          {/* MAIN SLIP CONTENT WRAPPER */}
          <div className="relative z-10 flex flex-col justify-between p-4 sm:p-5 text-zinc-900 text-xs min-h-[480px]">
            
            {/* =================================================================
                1. TOP HEADER: Top-Left Brand Details & Top-Right Store Details
               ================================================================= */}
            <div className="border-b-2 border-zinc-900 pb-2.5">
              <div className="flex items-start justify-between gap-4">
                
                {/* Top Left Corner: Brand Naming, Original Logo & Info from Settings */}
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

                {/* Top Right Corner: Invoice Badge, Store Address & 3 Bold Phone Numbers */}
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

            {/* =================================================================
                2. CUSTOMER & INVOICE DETAILS (Inputs for User to Edit Directly)
               ================================================================= */}
            <div className="bg-zinc-100/90 border-b border-zinc-300 py-1.5 px-2.5 my-1.5 rounded text-[10px] leading-tight">
              <div className="grid grid-cols-12 gap-2 items-center">
                
                {/* Customer Details: Name, Mobile, City */}
                <div className="col-span-12 sm:col-span-7 flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-zinc-500 font-bold uppercase text-[9px]">Buyer:</span>
                    <input
                      type="text"
                      value={customer.name}
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                      placeholder="Customer Name"
                      className="bg-white/80 border border-zinc-300 rounded px-1.5 py-0.5 text-[11px] font-black uppercase text-zinc-950 focus:bg-white focus:outline-none focus:border-zinc-900 w-36"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-zinc-500 font-bold uppercase text-[9px] flex items-center gap-0.5">
                      Mo. No <span className="text-red-600 font-black text-xs">*</span>:
                    </span>
                    <input
                      ref={mobileInputRef}
                      type="tel"
                      maxLength={10}
                      value={customer.mobile}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setCustomer({ ...customer, mobile: val });
                      }}
                      placeholder="10-digit Mo"
                      title="Customer 10-digit mobile number (Required)"
                      className={`bg-white/80 border ${
                        !customer.mobile || customer.mobile.length !== 10
                          ? "border-amber-400 focus:border-red-500 bg-amber-50/50"
                          : "border-zinc-300 focus:border-zinc-900"
                      } rounded px-1.5 py-0.5 text-[10.5px] font-mono font-bold text-zinc-900 focus:bg-white focus:outline-none w-28`}
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-zinc-500 font-bold uppercase text-[9px]">City:</span>
                    <input
                      type="text"
                      value={customer.city}
                      onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                      placeholder="City"
                      className="bg-white/80 border border-zinc-300 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-900 w-20"
                    />
                  </div>
                </div>

                {/* Invoice Meta: Bill No, Date, Payment Mode */}
                <div className="col-span-12 sm:col-span-5 flex items-center justify-start sm:justify-end gap-2 text-right">
                  <div className="flex items-center gap-1">
                    <span className="text-zinc-500 font-bold uppercase text-[9px]">Bill No:</span>
                    <input
                      type="text"
                      disabled
                      readOnly
                      value={invoiceMeta.invoiceNo}
                      title="Auto-generated sequential bill number from database (Locked)"
                      className="bg-zinc-200/90 border border-zinc-300 rounded px-1.5 py-0.5 text-[10.5px] font-mono font-black text-zinc-950 text-center cursor-not-allowed select-none w-24 opacity-90"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-zinc-500 font-bold uppercase text-[9px]">Date:</span>
                    <input
                      type="date"
                      value={invoiceMeta.date}
                      onChange={(e) => setInvoiceMeta({ ...invoiceMeta, date: e.target.value })}
                      className="bg-white/80 border border-zinc-300 rounded px-1 py-0.5 text-[9.5px] font-mono font-bold text-zinc-900 focus:bg-white focus:outline-none w-26"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-zinc-500 font-bold uppercase text-[9px]">Mode:</span>
                    <select
                      value={invoiceMeta.paymentMode}
                      onChange={(e) => setInvoiceMeta({ ...invoiceMeta, paymentMode: e.target.value })}
                      className="bg-white/80 border border-zinc-300 rounded px-1 py-0.5 text-[10px] font-bold text-zinc-900 focus:bg-white focus:outline-none"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Debit Card">Debit Card</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Online">Online</option>
                    </select>
                  </div>
                </div>

              </div>
            </div>

            {/* =================================================================
                3. PRODUCT DETAILS TABLE (WITH CENTER WATERMARK EMBEDDED SAFELY)
                - S.N.
                - Item Code (Unique)
                - Description (2 Dropdowns: Company + Category)
                - Size (Dropdown)
                - Qty (Number input)
                - Rate (₹) (Number input next to Qty)
                - Amount (₹) (Auto-calculated from Qty * Rate)
               ================================================================= */}
            <div className="flex-1 my-1 relative">
              
              {/* UNCLIPPED CENTER WATERMARK (Placed safely inside table zone without upper clipping) */}
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
                    <th className="py-1 px-1 w-6 text-center print:hidden"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 text-[10px]">
                  {items.map((item, index) => {
                    const isDuplicate = items.some(
                      (other) =>
                        other.id !== item.id &&
                        other.code.trim().toUpperCase() === item.code.trim().toUpperCase() &&
                        item.code.trim() !== ""
                    );

                    return (
                      <tr key={item.id} className="hover:bg-zinc-50/60">
                        {/* S.N. */}
                        <td className="py-1.5 px-1.5 text-center font-mono font-bold text-zinc-700">
                          {index + 1}.
                        </td>

                        {/* Item Code (Unique input) */}
                        <td className="py-1 px-1.5">
                          <input
                            type="text"
                            value={item.code}
                            onChange={(e) => handleUpdateItem(item.id, "code", e.target.value)}
                            placeholder="Unique Code"
                            className={`w-full bg-transparent border rounded px-1.5 py-0.5 text-[10px] font-mono font-bold text-zinc-900 focus:bg-white focus:outline-none ${
                              isDuplicate
                                ? "border-red-500 bg-red-50 text-red-700 font-black"
                                : "border-transparent hover:border-zinc-300 focus:border-zinc-900"
                            }`}
                          />
                        </td>

                        {/* Description: 2 Dropdowns (Company + Category) */}
                        <td className="py-1 px-1.5">
                          <div className="flex items-center gap-1.5">
                            {/* Dropdown 1: Company Name */}
                            <select
                              value={item.company}
                              onChange={(e) => handleUpdateItem(item.id, "company", e.target.value)}
                              className="bg-zinc-50 border border-zinc-300 rounded px-1.5 py-0.5 text-[10px] font-extrabold text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-900"
                            >
                              {companies.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>

                            <span className="text-zinc-400 font-bold">—</span>

                            {/* Dropdown 2: Category */}
                            <select
                              value={item.category}
                              onChange={(e) => handleUpdateItem(item.id, "category", e.target.value)}
                              className="flex-1 bg-zinc-50 border border-zinc-300 rounded px-1.5 py-0.5 text-[10px] font-bold text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-900"
                            >
                              {categories.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>

                        {/* Size Dropdown */}
                        <td className="py-1 px-1.5 text-center">
                          <select
                            value={item.size}
                            onChange={(e) => handleUpdateItem(item.id, "size", e.target.value)}
                            className="bg-zinc-50 border border-zinc-300 rounded px-1.5 py-0.5 text-[10px] font-extrabold text-zinc-900 text-center focus:bg-white focus:outline-none focus:border-zinc-900 w-full"
                          >
                            {SIZE_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Qty (Number input) */}
                        <td className="py-1 px-1.5 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.qty || ""}
                            onChange={(e) =>
                              handleUpdateItem(item.id, "qty", parseInt(e.target.value) || 0)
                            }
                            className="w-12 bg-zinc-50 border border-zinc-300 rounded px-1 py-0.5 text-[10.5px] font-mono font-bold text-zinc-950 text-center focus:bg-white focus:outline-none focus:border-zinc-900"
                          />
                        </td>

                        {/* Rate (₹) (Number input next to Qty) */}
                        <td className="py-1 px-1.5 text-right">
                          <input
                            type="number"
                            min="0"
                            value={item.rate || ""}
                            onChange={(e) =>
                              handleUpdateItem(item.id, "rate", parseFloat(e.target.value) || 0)
                            }
                            placeholder="0"
                            className="w-16 bg-zinc-50 border border-zinc-300 rounded px-1.5 py-0.5 text-[10.5px] font-mono font-semibold text-zinc-900 text-right focus:bg-white focus:outline-none focus:border-zinc-900"
                          />
                        </td>

                        {/* Amount (Auto Calculated: Qty * Rate) */}
                        <td className="py-1 px-1.5 text-right">
                          <span className="font-mono font-black text-zinc-950 text-[11px]">
                            {item.amount.toFixed(2)}
                          </span>
                        </td>

                        {/* Delete Row Button (Hidden in print) */}
                        <td className="py-1 px-0.5 text-center print:hidden">
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-zinc-400 hover:text-red-500 p-0.5 transition"
                            title="Remove row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Add Item Row Button (Hidden in print) */}
              <div className="mt-2 flex items-center justify-between print:hidden">
                <button
                  onClick={handleAddItem}
                  className="flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-900 text-white hover:bg-zinc-800 text-[11px] font-bold transition shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Product Item</span>
                </button>
                <span className="text-[10px] text-zinc-500">
                  Total Items: {items.length} ({totalQty} Pcs)
                </span>
              </div>
            </div>

            {/* =================================================================
                4. BOTTOM SECTION:
                - Left: Dual QR Codes & Terms from Settings (Title: Terms & Conditions)
                - Middle: Amount in Words
                - Right Bottom: Discount % input & Conditional Totals display!
               ================================================================= */}
            <div className="border-t-2 border-zinc-900 pt-2 mt-auto">
              <div className="grid grid-cols-12 gap-3 items-end">
                
                {/* BOTTOM LEFT: Dual QR Codes & Legal Terms */}
                <div className="col-span-12 sm:col-span-4 flex items-center gap-2.5">
                  {/* QR 1: Social Media QR */}
                  <div className="flex flex-col items-center p-1 bg-white border border-zinc-300 rounded text-center shadow-xs">
                    <QRCodeSVG
                      value={settings.qrAndTerms.socialUrl}
                      size={52}
                      level="M"
                      includeMargin={false}
                    />
                    <span className="text-[7.5px] font-black tracking-tight text-zinc-900 mt-0.5 flex items-center gap-0.5">
                      <InstagramIcon className="w-2 h-2 text-pink-600 inline" />{" "}
                      {settings.qrAndTerms.socialLabel}
                    </span>
                    <span className="text-[6.5px] font-bold text-zinc-600 -mt-0.5 truncate max-w-[56px]">
                      {settings.qrAndTerms.socialHandle}
                    </span>
                  </div>

                  {/* QR 2: Bank / UPI Payment QR */}
                  <div className="flex flex-col items-center p-1 bg-white border border-zinc-300 rounded text-center shadow-xs">
                    <QRCodeSVG
                      value={upiQrPayload}
                      size={52}
                      level="M"
                      includeMargin={false}
                    />
                    <span className="text-[7.5px] font-black tracking-tight text-zinc-900 mt-0.5 flex items-center gap-0.5">
                      <CreditCard className="w-2 h-2 text-emerald-600 inline" />{" "}
                      {settings.qrAndTerms.paymentLabel}
                    </span>
                    <span className="text-[6.5px] font-mono font-bold text-zinc-600 -mt-0.5 truncate max-w-[56px]">
                      ₹{grandTotal}
                    </span>
                  </div>

                  {/* Terms & Conditions from Settings */}
                  <div className="text-[7.5px] text-zinc-600 leading-tight border-l border-zinc-300 pl-1.5 hidden sm:block">
                    <p className="font-bold text-zinc-900 uppercase">Terms & Conditions</p>
                    <p>{settings.qrAndTerms.terms1}</p>
                    <p>{settings.qrAndTerms.terms2}</p>
                    <p className="font-semibold">{settings.qrAndTerms.terms3}</p>
                  </div>
                </div>

                {/* BOTTOM MIDDLE: Amount in Words */}
                <div className="col-span-12 sm:col-span-4 text-center px-1 flex flex-col justify-center h-full">
                  <div>
                    <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold block">
                      Amount in Words
                    </span>
                    <p className="text-[9.5px] font-black text-zinc-900 leading-tight uppercase italic mt-0.5">
                      {numberToWords(grandTotal)}
                    </p>
                  </div>
                </div>

                {/* BOTTOM RIGHT: Discount % Input & Conditional Calculation */}
                <div className="col-span-12 sm:col-span-4 bg-zinc-100/95 border border-zinc-300 rounded p-2 text-[10px]">
                  
                  {/* Discount % Input Control (Hidden in print if discount is 0) */}
                  <div className={`flex items-center justify-between mb-1.5 pb-1.5 border-b border-zinc-200 ${discountPercent === 0 ? "print:hidden" : ""}`}>
                    <span className="text-[9px] font-bold text-zinc-600 uppercase flex items-center gap-1">
                      <Tag className="w-3 h-3 text-zinc-700" />
                      Discount (%):
                    </span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={discountPercent || ""}
                        onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-14 bg-white border border-zinc-300 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-center text-zinc-900 focus:outline-none focus:border-zinc-900"
                      />
                      <span className="font-bold text-zinc-700 text-xs">%</span>
                    </div>
                  </div>

                  {/* Financial Breakdown:
                      - If discount === 0: Hide Subtotal & Discount rows, directly show Grand Total!
                      - If discount > 0: Show Subtotal and Discount amount deducted from total!
                  */}
                  <div className="space-y-1 font-mono">
                    {discountPercent > 0 && (
                      <>
                        <div className="flex justify-between text-zinc-700 text-[9.5px]">
                          <span>Sub Total (Gross):</span>
                          <span>₹{grossSubTotal.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between text-emerald-700 font-bold text-[9.5px]">
                          <span>Discount ({discountPercent}%):</span>
                          <span>-₹{discountAmount.toFixed(2)}</span>
                        </div>
                      </>
                    )}

                    {/* Grand Total Row */}
                    <div
                      className={`flex justify-between items-center font-sans ${
                        discountPercent > 0 ? "pt-1 border-t-2 border-zinc-900" : ""
                      }`}
                    >
                      <span className="text-xs font-black uppercase text-zinc-950 tracking-tight">
                        GRAND TOTAL:
                      </span>
                      <span className="text-base font-black font-mono text-zinc-950">
                        ₹{grandTotal.toFixed(2)}
                      </span>
                    </div>
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

        {/* Helper Instructions under bill (Hidden in print) */}
        <div className="w-full max-w-6xl flex flex-wrap items-center justify-between mt-4 px-1 text-xs text-zinc-400 print:hidden gap-2">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              All branding & QR codes load from{" "}
              <Link href="/billing/settings" className="text-white underline font-semibold">
                Bill Settings
              </Link>
            </span>
          </div>
          <button
            onClick={handleInitiatePrint}
            className="text-white hover:underline flex items-center gap-1 font-semibold"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Landscape Slip
          </button>
        </div>

      </main>

      {/* -------------------------------------------------------------------------
          PRINT CONFIRMATION MODAL
         ------------------------------------------------------------------------- */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print:hidden">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold">
                <Printer className="w-5 h-5 text-emerald-400" />
                <span>Confirm & Print Bill</span>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300">
              Are you sure you want to complete and print this bill? It will be automatically saved to your <strong className="text-white">Saved Invoices</strong> history.
            </p>

            {/* Bill Summary Box */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs space-y-2">
              <div className="flex justify-between text-zinc-400">
                <span>Invoice Number:</span>
                <span className="font-mono font-bold text-white">{invoiceMeta.invoiceNo}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Customer:</span>
                <span className="font-bold text-white uppercase">{customer.name || "Walk-in Customer"}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Mobile / City:</span>
                <span className="font-mono text-zinc-300">{customer.mobile || "N/A"} ({customer.city || "Modasa"})</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Items:</span>
                <span className="text-zinc-300">{items.length} Items ({totalQty} Pcs)</span>
              </div>
              <div className="flex justify-between text-white font-bold pt-2 border-t border-zinc-800 text-sm">
                <span>Grand Total:</span>
                <span className="font-mono text-emerald-400 text-base">₹{grandTotal.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmPrint}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-extrabold transition shadow-lg shadow-white/10 active:scale-95"
              >
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Yes, Complete & Print</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------
          NEW BILL CONFIRMATION MODAL
         ------------------------------------------------------------------------- */}
      {showNewBillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print:hidden">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold">
                <RefreshCw className="w-5 h-5 text-amber-400" />
                <span>Start New Bill</span>
              </div>
              <button
                onClick={() => setShowNewBillModal(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-zinc-300">
              <p>
                Are you sure you want to start a new invoice?
              </p>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed">
                ⚠️ All current customer inputs, selected items, and discount fields will be cleared, and the next sequential bill number from the database will be assigned.
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowNewBillModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmNewBill}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-400 text-black hover:bg-amber-300 text-xs font-extrabold transition shadow-lg shadow-amber-400/10 active:scale-95"
              >
                <RefreshCw className="w-4 h-4 text-black" />
                <span>Yes, Start New Bill</span>
              </button>
            </div>

          </div>
        </div>
      )}

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
          input, select {
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
            padding: 0 !important;
            appearance: none !important;
            -webkit-appearance: none !important;
          }
        }
      `}</style>

      {/* -------------------------------------------------------------------------
          VALIDATION MODAL (Replaces browser alert with high quality UI)
         ------------------------------------------------------------------------- */}
      {validationModal && validationModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print:hidden">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5 text-white font-bold">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <span className="text-sm">{validationModal.title}</span>
              </div>
              <button
                onClick={() => {
                  const field = validationModal.fieldToFocus;
                  setValidationModal(null);
                  if (field === "mobile") {
                    setTimeout(() => mobileInputRef.current?.focus(), 100);
                  }
                }}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-zinc-300 text-xs leading-relaxed">
              {validationModal.message}
            </div>

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                onClick={() => {
                  const field = validationModal.fieldToFocus;
                  setValidationModal(null);
                  if (field === "mobile") {
                    setTimeout(() => mobileInputRef.current?.focus(), 100);
                  }
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-black transition active:scale-95 shadow-lg shadow-white/5"
              >
                {validationModal.fieldToFocus === "mobile" ? "Enter Mobile Number" : "Okay, Got it"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center font-sans">
          <div className="flex items-center gap-2 text-zinc-400 text-xs">
            <RefreshCw className="w-4 h-4 animate-spin text-white" />
            <span>Loading GLITCH Billing POS...</span>
          </div>
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  );
}
