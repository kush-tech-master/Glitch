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
  Tag,
  CheckCircle2,
  AlertTriangle,
  X,
  Receipt,
  History,
  Building2,
  Settings,
  LogOut,
  Sparkles,
  Layers
} from "lucide-react";
import {
  CategoryItem,
  apiGetCategoriesFull,
  apiCreateCategory,
  apiUpdateCategory,
  apiDeleteCategory
} from "../lib/api";
import { clearAuthSession } from "../lib/auth";

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Add / Edit Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<CategoryItem | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    gender: "Men",
    order: 1,
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch all categories from MongoDB Atlas
  const fetchCategories = async () => {
    setLoading(true);
    const list = await apiGetCategoriesFull();
    setCategories(list);
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Open Add Modal
  const handleOpenAdd = () => {
    setFormData({
      name: "",
      code: "",
      gender: "Men",
      order: categories.length + 1,
    });
    setFormError("");
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (cat: CategoryItem) => {
    setCategoryToEdit(cat);
    setFormData({
      name: cat.name,
      code: cat.code,
      gender: cat.gender || "Men",
      order: cat.order || 1,
    });
    setFormError("");
  };

  // Handle Save (Create or Update)
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim()) {
      setFormError("Category name is required.");
      return;
    }

    setSubmitting(true);
    try {
      if (categoryToEdit) {
        // Update
        const res = await apiUpdateCategory(categoryToEdit._id, {
          name: formData.name.trim(),
          code: formData.code.trim() || formData.name.substring(0, 3).toUpperCase(),
          gender: formData.gender,
          order: Number(formData.order) || 1,
        });
        if (res.success) {
          setCategoryToEdit(null);
          fetchCategories();
        } else {
          setFormError(res.message || "Failed to update category");
        }
      } else {
        // Create
        const res = await apiCreateCategory({
          name: formData.name.trim(),
          code: formData.code.trim() || formData.name.substring(0, 3).toUpperCase(),
          gender: formData.gender,
          order: Number(formData.order) || 1,
        });
        if (res.success) {
          setShowAddModal(false);
          fetchCategories();
        } else {
          setFormError(res.message || "Failed to add category");
        }
      }
    } catch (err: any) {
      setFormError(err.message || "Error saving category");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Confirm Delete
  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    setSubmitting(true);
    await apiDeleteCategory(categoryToDelete._id);
    setCategoryToDelete(null);
    setSubmitting(false);
    fetchCategories();
  };

  // Filtered categories
  const filteredCategories = categories.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      (c.gender && c.gender.toLowerCase().includes(q))
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
                  <span>Product Categories</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono">
                    {categories.length} Categories
                  </span>
                </h1>
                <p className="text-[11px] text-zinc-400">Manage apparel category dropdown options in MongoDB Atlas</p>
              </div>
            </div>
          </div>

          {/* Quick Navigation & Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/billing/companies"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Brands</span>
            </Link>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 text-xs font-extrabold transition shadow-lg shadow-white/5 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
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
              placeholder="Search category by name or code..."
              className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition"
            />
          </div>

          <div className="text-xs text-zinc-400 font-medium">
            Showing <strong className="text-white">{filteredCategories.length}</strong> of {categories.length} product categories
          </div>
        </div>

        {/* Categories Grid */}
        {filteredCategories.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800/60 max-w-xl mx-auto space-y-4">
            <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center mx-auto text-zinc-500 border border-zinc-800">
              <Tag className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">No categories found</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? "No categories match your search criteria. Try a different query."
                  : "Add your first apparel category using the button above."}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredCategories.map((cat) => (
              <div
                key={cat._id}
                className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 transition flex flex-col justify-between group shadow-lg"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px] font-bold border border-zinc-700">
                      {cat.code || "CAT"}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">#{cat.order || 0}</span>
                  </div>

                  <h3 className="text-base font-extrabold text-white tracking-wide">
                    {cat.name}
                  </h3>

                  <span className="inline-block mt-1 text-[11px] text-zinc-400 font-medium">
                    Type: <strong className="text-zinc-300">{cat.gender || "Men's Apparel"}</strong>
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-800/80">
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Active in POS
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
                      title="Edit Category"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setCategoryToDelete(cat)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition"
                      title="Delete Category"
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
          ADD / EDIT CATEGORY MODAL
         ------------------------------------------------------------------------- */}
      {(showAddModal || categoryToEdit) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold">
                <Tag className="w-5 h-5 text-zinc-300" />
                <span>{categoryToEdit ? "Edit Product Category" : "Add New Apparel Category"}</span>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setCategoryToEdit(null);
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

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              
              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-300 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Oversized T-Shirt, Baggy Pant, Hoodie"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-300 mb-1">
                    Category Code
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. OV-TSH, PNT, HOD"
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
                  Department / Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-white transition"
                >
                  <option value="Men">Men's Apparel</option>
                  <option value="Unisex">Unisex / Streetwear</option>
                  <option value="Women">Women's Apparel</option>
                  <option value="Accessories">Accessories & Footwear</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setCategoryToEdit(null);
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
                  {submitting ? "Saving..." : categoryToEdit ? "Update Category" : "Add Category"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------
          DELETE CONFIRMATION MODAL
         ------------------------------------------------------------------------- */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span>Delete Product Category</span>
              </div>
              <button
                onClick={() => setCategoryToDelete(null)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Are you sure you want to delete category <strong className="text-white uppercase">{categoryToDelete.name}</strong> from MongoDB database? It will no longer appear in POS dropdown selectors.
            </p>

            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs space-y-1.5">
              <div className="flex justify-between text-zinc-400">
                <span>Category Name:</span>
                <span className="font-extrabold text-white">{categoryToDelete.name}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Code:</span>
                <span className="font-mono text-zinc-200">{categoryToDelete.code}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setCategoryToDelete(null)}
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
                <span>{submitting ? "Deleting..." : "Yes, Delete Category"}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
