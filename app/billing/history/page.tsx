"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  Trash2,
  Printer,
  ExternalLink,
  Receipt,
  Calendar,
  User,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  Eye,
  CheckCircle2,
  AlertTriangle,
  X,
  LogOut,
  Building2,
  Tag,
  Settings
} from "lucide-react";
import { SavedBill, getSavedBills, deleteSavedBill } from "../billing-config";
import { apiGetAllBills, apiDeleteBill } from "../lib/api";
import { clearAuthSession } from "../lib/auth";

export default function BillHistoryPage() {
  const router = useRouter();
  const [bills, setBills] = useState<SavedBill[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [billToDelete, setBillToDelete] = useState<SavedBill | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBills = async () => {
    setLoading(true);
    const dbBills = await apiGetAllBills();
    if (dbBills && dbBills.length > 0) {
      setBills(dbBills);
    } else {
      setBills(getSavedBills());
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handleConfirmDelete = async () => {
    if (!billToDelete) return;
    setIsDeleting(true);
    // 1. Delete from MongoDB Atlas
    await apiDeleteBill(billToDelete.id);
    // 2. Delete from localStorage fallback
    deleteSavedBill(billToDelete.id);
    // 3. Close modal & refresh
    setBillToDelete(null);
    setIsDeleting(false);
    fetchBills();
  };

  const handleLoadBill = (bill: SavedBill) => {
    // Save as active draft for /billing
    if (typeof window !== "undefined") {
      localStorage.setItem("glitch_active_bill_draft", JSON.stringify(bill));
      router.push("/billing?loaded=true");
    }
  };

  // Filtered bills
  const filteredBills = bills.filter((b) => {
    const q = searchQuery.toLowerCase();
    return (
      b.invoiceNo.toLowerCase().includes(q) ||
      b.customerName.toLowerCase().includes(q) ||
      b.customerMobile.includes(q) ||
      b.customerCity.toLowerCase().includes(q) ||
      b.date.includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased selection:bg-white selection:text-black">
      {/* Top Header */}
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
                  <span>Saved Invoices & Billing History</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono">
                    {bills.length} Bills
                  </span>
                </h1>
                <p className="text-[11px] text-zinc-400">View, reprint, or reload previously confirmed bills</p>
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
              href="/billing/settings"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </Link>

            <Link
              href="/billing"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 text-xs font-bold transition shadow-lg shadow-white/5 active:scale-95"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>New Bill</span>
            </Link>

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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        
        {/* Search Bar & Summary */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Bill No, Customer Name, Mobile, City or Date..."
              className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition"
            />
          </div>

          <div className="text-xs text-zinc-400 font-medium">
            Showing <strong className="text-white">{filteredBills.length}</strong> of {bills.length} invoices
          </div>
        </div>

        {/* Bills Table or Empty State */}
        {filteredBills.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800/60 max-w-xl mx-auto space-y-4">
            <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center mx-auto text-zinc-500 border border-zinc-800">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">No saved invoices found</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? "No bills match your search criteria. Try a different query."
                  : "When you print an invoice on the billing page, it will automatically save and appear here for your records."}
              </p>
            </div>
            <Link
              href="/billing"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition"
            >
              <Receipt className="w-3.5 h-3.5" />
              Go to Billing POS
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800/80 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider font-bold">
                    <th className="py-3 px-4">Bill Number</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Customer Details</th>
                    <th className="py-3 px-4">City</th>
                    <th className="py-3 px-4 text-center">Items</th>
                    <th className="py-3 px-4 text-center">Payment</th>
                    <th className="py-3 px-4 text-right">Grand Total</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredBills.map((bill) => {
                    const totalPcs = bill.items.reduce((s, i) => s + (i.qty || 1), 0);
                    return (
                      <tr key={bill.id} className="hover:bg-zinc-800/30 transition">
                        {/* Bill No */}
                        <td className="py-3.5 px-4 font-mono font-bold text-white">
                          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">
                            {bill.invoiceNo}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 font-mono text-zinc-400 text-[11px] whitespace-nowrap">
                          {bill.date.split("-").reverse().join("/")}
                        </td>

                        {/* Customer */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white uppercase text-[11px]">
                            {bill.customerName || "Walk-in Customer"}
                          </div>
                          <div className="text-[10px] font-mono text-zinc-400">
                            {bill.customerMobile || "No Mobile"}
                          </div>
                        </td>

                        {/* City */}
                        <td className="py-3.5 px-4 text-zinc-300 font-medium">
                          {bill.customerCity || "Modasa"}
                        </td>

                        {/* Items count */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="text-[11px] font-mono font-bold text-zinc-300">
                            {bill.items.length} items
                          </span>
                          <span className="block text-[9px] text-zinc-500">
                            ({totalPcs} pcs)
                          </span>
                        </td>

                        {/* Payment Mode */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                            {bill.paymentMode || "Cash"}
                          </span>
                        </td>

                        {/* Grand Total */}
                        <td className="py-3.5 px-4 text-right font-mono font-black text-white text-sm">
                          ₹{bill.grandTotal.toLocaleString("en-IN")}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleLoadBill(bill)}
                              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-white hover:text-black text-zinc-200 text-[11px] font-bold transition flex items-center gap-1 shadow-xs"
                              title="Load bill into editor"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Open / Edit</span>
                            </button>

                            <button
                              onClick={() => setBillToDelete(bill)}
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition"
                              title="Delete from history"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* -------------------------------------------------------------------------
          DELETE INVOICE CONFIRMATION MODAL
         ------------------------------------------------------------------------- */}
      {billToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span>Delete Invoice Confirmation</span>
              </div>
              <button
                onClick={() => setBillToDelete(null)}
                disabled={isDeleting}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Are you sure you want to permanently delete this invoice? This action will remove the record from your database and cannot be undone.
            </p>

            {/* Invoice Info Card */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs space-y-2">
              <div className="flex justify-between text-zinc-400">
                <span>Invoice Number:</span>
                <span className="font-mono font-bold text-white px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700">
                  {billToDelete.invoiceNo}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Customer:</span>
                <span className="font-bold text-white uppercase">{billToDelete.customerName || "Walk-in Customer"}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Mobile:</span>
                <span className="font-mono text-zinc-300">{billToDelete.customerMobile || "N/A"}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Date:</span>
                <span className="font-mono text-zinc-300">{billToDelete.date}</span>
              </div>
              <div className="flex justify-between text-white font-bold pt-2 border-t border-zinc-800 text-sm">
                <span>Grand Total:</span>
                <span className="font-mono text-red-400 text-base">₹{billToDelete.grandTotal.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setBillToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-red-600 text-white hover:bg-red-500 text-xs font-extrabold transition shadow-lg shadow-red-600/20 active:scale-95 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? "Deleting..." : "Yes, Delete Invoice"}</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
