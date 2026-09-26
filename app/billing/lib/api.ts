import { BillSettings, SavedBill } from '../billing-config';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Fetch next unique sequential bill number from MongoDB
export async function apiGetNextBillNumber(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/bills/next-number`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      return data.nextBillNo;
    }
  } catch (e) {
    console.warn('Backend offline or unreachable, using local fallback:', e);
  }
  return null;
}

// Save bill to MongoDB
export async function apiSaveBill(bill: {
  billNo: string;
  billDate: string;
  customer: { name: string; mobile: string; city: string };
  paymentMode: string;
  items: Array<{
    code: string;
    company: string;
    category: string;
    size: string;
    qty: number;
    rate: number;
    amount: number;
  }>;
  grossSubTotal: number;
  discountPercent: number;
  discountAmount: number;
  grandTotal: number;
}): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/bills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bill),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Failed to save to MongoDB backend:', e);
  }
  return null;
}

// Get all saved bills from MongoDB
export async function apiGetAllBills(search?: string): Promise<SavedBill[] | null> {
  try {
    const url = search
      ? `${API_BASE_URL}/bills?search=${encodeURIComponent(search)}`
      : `${API_BASE_URL}/bills?limit=100`;
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const result = await res.json();
      // Map MongoDB bills to frontend structure
      return result.data.map((b: any) => ({
        id: b._id || b.billNo,
        invoiceNo: b.billNo,
        date: b.billDate,
        customerName: b.customer?.name || 'Walk-in Customer',
        customerMobile: b.customer?.mobile || '',
        customerCity: b.customer?.city || 'Modasa',
        paymentMode: b.paymentMode || 'Cash',
        items: b.items || [],
        grossSubTotal: b.grossSubTotal,
        discountPercent: b.discountPercent,
        discountAmount: b.discountAmount,
        grandTotal: b.grandTotal,
        createdAt: b.createdAt,
      }));
    }
  } catch (e) {
    console.warn('Backend offline, falling back to localStorage history:', e);
  }
  return null;
}

// Delete bill by ID or Bill No from MongoDB
export async function apiDeleteBill(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/bills/${id}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (e) {
    console.warn('Failed to delete from MongoDB:', e);
    return false;
  }
}

export interface CompanyItem {
  _id: string;
  name: string;
  code: string;
  description?: string;
  order: number;
  isActive: boolean;
  createdAt?: string;
}

export interface CategoryItem {
  _id: string;
  name: string;
  code: string;
  gender?: string;
  order: number;
  isActive: boolean;
  createdAt?: string;
}

// Get companies list from MongoDB (Names only for dropdowns)
export async function apiGetCompanies(): Promise<string[] | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/companies`, { cache: 'no-store' });
    if (res.ok) {
      const result = await res.json();
      if (Array.isArray(result.data) && result.data.length > 0) {
        return result.data.map((c: any) => c.name);
      }
    }
  } catch (e) {
    console.warn('Failed to load companies from backend:', e);
  }
  return null;
}

// Get full companies objects for management page
export async function apiGetCompaniesFull(): Promise<CompanyItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/companies`, { cache: 'no-store' });
    if (res.ok) {
      const result = await res.json();
      return result.data || [];
    }
  } catch (e) {
    console.warn('Failed to load full companies from backend:', e);
  }
  return [];
}

// Create new Company
export async function apiCreateCompany(company: {
  name: string;
  code?: string;
  description?: string;
  order?: number;
}): Promise<{ success: boolean; message?: string; data?: CompanyItem }> {
  try {
    const res = await fetch(`${API_BASE_URL}/companies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(company),
    });
    return await res.json();
  } catch (e: any) {
    return { success: false, message: e.message || 'Network error' };
  }
}

// Update Company
export async function apiUpdateCompany(
  id: string,
  company: Partial<CompanyItem>
): Promise<{ success: boolean; message?: string; data?: CompanyItem }> {
  try {
    const res = await fetch(`${API_BASE_URL}/companies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(company),
    });
    return await res.json();
  } catch (e: any) {
    return { success: false, message: e.message || 'Network error' };
  }
}

// Delete Company
export async function apiDeleteCompany(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/companies/${id}`, {
      method: 'DELETE',
    });
    return await res.json();
  } catch (e: any) {
    return { success: false, message: e.message || 'Network error' };
  }
}

// Get categories list from MongoDB (Names only for dropdowns)
export async function apiGetCategories(): Promise<string[] | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/categories`, { cache: 'no-store' });
    if (res.ok) {
      const result = await res.json();
      if (Array.isArray(result.data) && result.data.length > 0) {
        return result.data.map((cat: any) => cat.name);
      }
    }
  } catch (e) {
    console.warn('Failed to load categories from backend:', e);
  }
  return null;
}

// Get full categories objects for management page
export async function apiGetCategoriesFull(): Promise<CategoryItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/categories`, { cache: 'no-store' });
    if (res.ok) {
      const result = await res.json();
      return result.data || [];
    }
  } catch (e) {
    console.warn('Failed to load full categories from backend:', e);
  }
  return [];
}

// Create new Category
export async function apiCreateCategory(category: {
  name: string;
  code?: string;
  gender?: string;
  order?: number;
}): Promise<{ success: boolean; message?: string; data?: CategoryItem }> {
  try {
    const res = await fetch(`${API_BASE_URL}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    });
    return await res.json();
  } catch (e: any) {
    return { success: false, message: e.message || 'Network error' };
  }
}

// Update Category
export async function apiUpdateCategory(
  id: string,
  category: Partial<CategoryItem>
): Promise<{ success: boolean; message?: string; data?: CategoryItem }> {
  try {
    const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    });
    return await res.json();
  } catch (e: any) {
    return { success: false, message: e.message || 'Network error' };
  }
}

// Delete Category
export async function apiDeleteCategory(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'DELETE',
    });
    return await res.json();
  } catch (e: any) {
    return { success: false, message: e.message || 'Network error' };
  }
}

// Get settings from MongoDB
export async function apiGetSettings(): Promise<BillSettings | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/settings`, { cache: 'no-store' });
    if (res.ok) {
      const result = await res.json();
      if (result.data) {
        return {
          topLeft: result.data.topLeft,
          topRight: result.data.topRight,
          qrAndTerms: result.data.qrAndTerms,
          watermark: result.data.watermark,
        };
      }
    }
  } catch (e) {
    console.warn('Failed to fetch settings from backend:', e);
  }
  return null;
}

// Save settings to MongoDB
export async function apiSaveSettings(settings: BillSettings): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return res.ok;
  } catch (e) {
    console.warn('Failed to save settings to backend:', e);
    return false;
  }
}

// User Login API
export async function apiLoginUser(credentials: { email: string; password: string }): Promise<{
  success: boolean;
  message?: string;
  data?: {
    _id: string;
    name: string;
    email: string;
    mobile: string;
    role: string;
    token: string;
  };
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data = await res.json();
    return data;
  } catch (e: any) {
    return {
      success: false,
      message: e.message || 'Network error connecting to backend authentication service',
    };
  }
}
