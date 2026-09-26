export interface BillSettings {
  topLeft: {
    brandName: string;
    tagline: string;
    categories: string;
    gstin: string;
    state: string;
    logoUrl: string;
  };
  topRight: {
    invoiceTitle: string;
    addressLine1: string;
    addressLine2: string;
    phone1: string;
    phone2: string;
    phone3: string;
    email: string;
  };
  qrAndTerms: {
    socialLabel: string;
    socialHandle: string;
    socialUrl: string;
    paymentLabel: string;
    upiId: string;
    payeeName: string;
    terms1: string;
    terms2: string;
    terms3: string;
  };
  watermark: {
    enabled: boolean;
    opacity: number; // in %
    size: number; // in px
    imageUrl: string;
  };
}

export interface SavedBill {
  id: string;
  invoiceNo: string;
  date: string;
  customerName: string;
  customerMobile: string;
  customerCity: string;
  paymentMode: string;
  items: Array<{
    id: string;
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
  shareToken?: string;
  createdAt: string;
}

export const DEFAULT_BILL_SETTINGS: BillSettings = {
  topLeft: {
    brandName: "GLITCH",
    tagline: "GEN Z MENSWEAR",
    categories: "STREETWEAR • OVERSIZED TEES • CARGOS • HOODIES • DENIMS",
    gstin: "",
    state: "Gujarat",
    logoUrl: "/glitch-original.jpeg",
  },
  topRight: {
    invoiceTitle: "RETAIL INVOICE",
    addressLine1: "Shop No. 30, Glitch Clothing, Near Purnima hotel, Modasa",
    addressLine2: "Post office Road, Modasa - 383315, Dist. Aravalli",
    phone1: "+91 77789 78723",
    phone2: "+91 94085 91917",
    phone3: "+91 98259 26615",
    email: "glitch.menswear@gmail.com",
  },
  qrAndTerms: {
    socialLabel: "FOLLOW US",
    socialHandle: "@glitch_clothing_co",
    socialUrl: "https://www.instagram.com/glitch_clothing_co?stkn=N3V4d3dya3JvYXNu",
    paymentLabel: "SCAN & PAY",
    upiId: "glitch@okhdfcbank",
    payeeName: "GLITCH MENSWEAR",
    terms1: "1. Goods once sold will not be taken back.",
    terms2: "2. Goods once sold will not be refunded.",
    terms3: "3. Subject to 'MODASA' Jurisdiction only.",
  },
  watermark: {
    enabled: true,
    opacity: 25,
    size: 240,
    imageUrl: "/glitch-original.jpeg",
  },
};

export const COMPANY_OPTIONS = [
  "GLITCH",
  "ZARA",
  "H&M",
  "SNITCH",
  "LEVIS",
  "OFF-WHITE",
  "BALENCIAGA",
  "PUMA",
  "NIKE",
  "ADIDAS",
  "POWERLOOK",
  "THE SOULS",
  "JACK & JONES",
  "US POLO",
  "OVERSIZED CLUB",
  "OTHER BRAND",
];

export const CATEGORY_OPTIONS = [
  "Shirt",
  "T-Shirt",
  "Oversized T-Shirt",
  "Pant",
  "Jeans",
  "Cargo Pant",
  "Baggy Pant",
  "Parachute Cargo",
  "Hoodie",
  "Sweatshirt",
  "Jacket / Varsity",
  "Boxy Cropped Shirt",
  "Shorts",
  "Track Pant",
  "Kurta / Ethnic",
  "Dress / Combo",
  "Accessories",
];

export const SIZE_OPTIONS = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "2XL",
  "3XL",
  "28",
  "30",
  "32",
  "34",
  "36",
  "38",
  "40",
  "FREE SIZE",
];

const SETTINGS_STORAGE_KEY = "glitch_bill_settings_v3";
const SAVED_BILLS_STORAGE_KEY = "glitch_saved_bills_v1";

export function loadBillSettings(): BillSettings {
  if (typeof window === "undefined") return DEFAULT_BILL_SETTINGS;
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_BILL_SETTINGS,
        ...parsed,
        topLeft: { ...DEFAULT_BILL_SETTINGS.topLeft, ...parsed.topLeft },
        topRight: { ...DEFAULT_BILL_SETTINGS.topRight, ...parsed.topRight },
        qrAndTerms: { ...DEFAULT_BILL_SETTINGS.qrAndTerms, ...parsed.qrAndTerms },
        watermark: { ...DEFAULT_BILL_SETTINGS.watermark, ...parsed.watermark },
      };
    }
  } catch (e) {
    console.error("Failed to load bill settings:", e);
  }
  return DEFAULT_BILL_SETTINGS;
}

export function saveBillSettings(settings: BillSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save bill settings:", e);
  }
}

export function getSavedBills(): SavedBill[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(SAVED_BILLS_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load saved bills:", e);
  }
  return [];
}

export function saveBillToHistory(bill: SavedBill): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getSavedBills();
    // filter out if same invoiceNo or id already exists to update it or prepend new
    const filtered = existing.filter((b) => b.invoiceNo !== bill.invoiceNo && b.id !== bill.id);
    const updated = [bill, ...filtered];
    localStorage.setItem(SAVED_BILLS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save bill to history:", e);
  }
}

export function deleteSavedBill(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getSavedBills();
    const updated = existing.filter((b) => b.id !== id);
    localStorage.setItem(SAVED_BILLS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to delete bill from history:", e);
  }
}
