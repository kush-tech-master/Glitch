"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  Plus,
  Edit2,
  Trash2,
  Building2,
  CheckCircle2,
  AlertTriangle,
  X,
  Receipt,
  History,
  Layers,
  Settings,
  LogOut,
  Sparkles,
  Tag
} from "lucide-react";
import {
  CompanyItem,
  apiGetCompaniesFull,
  apiCreateCompany,
  apiUpdateCompany,
  apiDeleteCompany
} from "../lib/api";
import { clearAuthSession } from "../lib/auth";

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Add / Edit Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState<CompanyItem | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<CompanyItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    order: 1,
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch all companies from MongoDB Atlas
  const fetchCompanies = async () => {
    setLoading(true);
    const list = await apiGetCompaniesFull();
    setCompanies(list);
    setLoading(false);
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Open Add Modal
  const handleOpenAdd = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
      order: companies.length + 1,
    });
    setFormError("");
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (comp: CompanyItem) => {
    setCompanyToEdit(comp);
    setFormData({
      name: comp.name,
      code: comp.code,
      description: comp.description || "",
      order: comp.order || 1,
    });
    setFormError("");
  };

  // Handle Save (Create or Update)
  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim()) {
      setFormError("Company name is required.");
      return;
    }

    setSubmitting(true);
    try {
      if (companyToEdit) {
        // Update
        const res = await apiUpdateCompany(companyToEdit._id, {
          name: formData.name.trim(),
          code: formData.code.trim() || formData.name.substring(0, 3).toUpperCase(),
          description: formData.description.trim(),
          order: Number(formData.order) || 1,
        });
        if (res.success) {
          setCompanyToEdit(null);
          fetchCompanies();
        } else {
          setFormError(res.message || "Failed to update company");
        }
      } else {
        // Create
        const res = await apiCreateCompany({
          name: formData.name.trim(),
          code: formData.code.trim() || formData.name.substring(0, 3).toUpperCase(),
          description: formData.description.trim(),
          order: Number(formData.order) || 1,
        });
        if (res.success) {
          setShowAddModal(false);
          fetchCompanies();
        } else {
          setFormError(res.message || "Failed to add company");
        }
      }
    } catch (err: any) {
      setFormError(err.message || "Error saving company");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Confirm Delete
  const handleConfirmDelete = async () => {
    if (!companyToDelete) return;
    setSubmitting(true);
    await apiDeleteCompany(companyToDelete._id);
    setCompanyToDelete(null);
    setSubmitting(false);
    fetchCompanies();
  };

  // Filtered companies
  const filteredCompanies = companies.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased selection:bg-white selection:text-black">
      
      {/* Top Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-md px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <Link
              href="/billing"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-semibold transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>POS</span>
            </Link>
            <div className="h-5 w-px bg-zinc-800" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-black text-black text-xs">
                GL
              </div>
              <div>
                <h1 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Product Companies & Brands</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono">
                    {companies.length} Brands
                  </span>
                </h1>
                <p className="text-[11px] text-zinc-400">Manage apparel brand dropdown options in MongoDB Atlas</p>
              </div>
            </div>
          </div>

          {/* Quick Navigation & Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/billing/categories"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Categories</span>
            </Link>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 text-xs font-extrabold transition shadow-lg shadow-white/5 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Company</span>
            </button>

            <button
              onClick={() => {
                clearAuthSession();
                router.replace("/login");
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
        
        {/* Search Bar & Stats */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search companies by name or brand code..."
              className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition"
            />
          </div>

          <div className="text-xs text-zinc-400 font-medium">
            Showing <strong className="text-white">{filteredCompanies.length}</strong> of {companies.length} brand companies
          </div>
        </div>

        {/* Companies Grid */}
        {filteredCompanies.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800/60 max-w-xl mx-auto space-y-4">
            <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center mx-auto text-zinc-500 border border-zinc-800">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">No company brands found</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? "No companies match your search criteria. Try a different query."
                  : "Add your first apparel brand company using the button above."}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredCompanies.map((comp) => (
              <div
                key={comp._id}
                className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 transition flex flex-col justify-between group shadow-lg"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px] font-bold border border-zinc-700">
                      {comp.code || "BRD"}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">#{comp.order || 0}</span>
                  </div>

                  <h3 className="text-base font-extrabold text-white tracking-wide uppercase">
                    {comp.name}
                  </h3>

                  <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 min-h-[32px]">
                    {comp.description || "In-store apparel brand"}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-800/80">
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Active in POS
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(comp)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
                      title="Edit Company"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setCompanyToDelete(comp)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition"
                      title="Delete Company"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* -------------------------------------------------------------------------
          ADD / EDIT COMPANY MODAL
         ------------------------------------------------------------------------- */}
      {(showAddModal || companyToEdit) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold">
                <Building2 className="w-5 h-5 text-zinc-300" />
                <span>{companyToEdit ? "Edit Company Brand" : "Add New Brand Company"}</span>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setCompanyToEdit(null);
                }}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCompany} className="space-y-4 text-xs">
              
              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-300 mb-1">
                  Brand / Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. ZARA, SNITCH, GLITCH"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-bold uppercase focus:outline-none focus:border-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-300 mb-1">
                    Brand Code
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. ZR, SN, GL"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-white transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-300 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-300 mb-1">
                  Description / Note
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Official Menswear Apparel Line"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-white transition"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setCompanyToEdit(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-extrabold transition shadow-lg shadow-white/10 active:scale-95 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : companyToEdit ? "Update Company" : "Add Brand"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------
          DELETE CONFIRMATION MODAL
         ------------------------------------------------------------------------- */}
      {companyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span>Delete Company Brand</span>
              </div>
              <button
                onClick={() => setCompanyToDelete(null)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Are you sure you want to delete brand <strong className="text-white uppercase">{companyToDelete.name}</strong> from MongoDB database? It will no longer appear in POS dropdown selectors.
            </p>

            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs space-y-1.5">
              <div className="flex justify-between text-zinc-400">
                <span>Brand Name:</span>
                <span className="font-extrabold text-white uppercase">{companyToDelete.name}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Code:</span>
                <span className="font-mono text-zinc-200">{companyToDelete.code}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setCompanyToDelete(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmDelete}
                disabled={submitting}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-red-600 text-white hover:bg-red-500 text-xs font-extrabold transition shadow-lg shadow-red-600/20 active:scale-95 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{submitting ? "Deleting..." : "Yes, Delete Brand"}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
