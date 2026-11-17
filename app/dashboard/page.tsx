"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { clearTokens, getUserRole } from "@/lib/auth";
import { apiClient } from "@/lib/api";
import { CONFIG } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// --- Interfaces ---
interface Category {
  category_id: number;
  category_name: string;
  description?: string;
}

interface Product {
  product_id: number;
  category_id: number;
  product_name: string;
  description: string;
  price: number;
  stock_qty: number;
}

interface Order {
  order_id: number;
  customer_id: number;
  total_price: number;
  order_status: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled" | string;
  order_date: string;
  payment_method?: string;
  address_details?: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface Notification {
  type: "success" | "error";
  message: string;
}

// --- Smart Visual Suggestion Engine ---
const VISUAL_THEMES = [
  {
    bg: "from-slate-800 via-slate-900 to-zinc-950",
    accent: "text-sky-400",
    glow: "bg-sky-500/20",
  },
  {
    bg: "from-indigo-900 via-slate-900 to-slate-950",
    accent: "text-indigo-400",
    glow: "bg-indigo-500/20",
  },
  {
    bg: "from-emerald-900 via-teal-950 to-slate-950",
    accent: "text-emerald-400",
    glow: "bg-emerald-500/20",
  },
  {
    bg: "from-amber-900 via-stone-900 to-neutral-950",
    accent: "text-amber-400",
    glow: "bg-amber-500/20",
  },
  {
    bg: "from-rose-900 via-slate-900 to-zinc-950",
    accent: "text-rose-400",
    glow: "bg-rose-500/20",
  },
];

function SmartIcon({ name, className = "h-8 w-8" }: { name: string; className?: string }) {
  const lower = name.toLowerCase();

  if (lower.includes("audio") || lower.includes("headphone") || lower.includes("speaker") || lower.includes("earbud") || lower.includes("mic")) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
      </svg>
    );
  }

  if (lower.includes("tech") || lower.includes("electronic") || lower.includes("laptop") || lower.includes("keyboard") || lower.includes("mouse") || lower.includes("monitor") || lower.includes("pc")) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
      </svg>
    );
  }

  if (lower.includes("phone") || lower.includes("mobile") || lower.includes("watch") || lower.includes("wearable") || lower.includes("tablet")) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
      </svg>
    );
  }

  if (lower.includes("fashion") || lower.includes("cloth") || lower.includes("shirt") || lower.includes("shoe") || lower.includes("bag") || lower.includes("wear") || lower.includes("apparel")) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    );
  }

  if (lower.includes("food") || lower.includes("coffee") || lower.includes("drink") || lower.includes("kitchen") || lower.includes("snack") || lower.includes("tea")) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
      </svg>
    );
  }

  if (lower.includes("home") || lower.includes("living") || lower.includes("desk") || lower.includes("chair") || lower.includes("lamp") || lower.includes("furniture")) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    );
  }

  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
  );
}

function GeneratedVisualCard({
  title,
  subtitle,
  seed = 0,
  variant = "card",
}: {
  title: string;
  subtitle?: string;
  seed?: number;
  variant?: "card" | "thumb" | "banner";
}) {
  const theme = VISUAL_THEMES[Math.abs(seed) % VISUAL_THEMES.length];
  const initials = title
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (variant === "thumb") {
    return (
      <div
        className={`relative h-12 w-12 rounded-xl bg-linear-to-br ${theme.bg} text-white flex items-center justify-center shrink-0 shadow-sm overflow-hidden border border-white/10`}
      >
        <div className={`absolute -right-2 -bottom-2 h-8 w-8 rounded-full blur-md ${theme.glow}`} />
        <SmartIcon name={title} className={`h-5 w-5 ${theme.accent}`} />
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-full bg-linear-to-br ${theme.bg} text-white overflow-hidden flex flex-col justify-between p-5 select-none`}
    >
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)",
          backgroundSize: "18px 18px",
        }}
      />
      <div className={`absolute -right-8 -top-8 h-36 w-36 rounded-full blur-2xl ${theme.glow}`} />
      <div className={`absolute -left-8 -bottom-8 h-32 w-32 rounded-full blur-2xl ${theme.glow}`} />

      <div className="relative z-10 flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-md bg-white/10 backdrop-blur-sm border border-white/10 text-white/90">
          {initials || "ECDC"}
        </span>
        <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center shadow-inner">
          <SmartIcon name={`${title} ${subtitle || ""}`} className={`h-5 w-5 ${theme.accent}`} />
        </div>
      </div>

      <div className="relative z-10 space-y-0.5 mt-auto">
        {subtitle && (
          <p className={`text-[10px] font-semibold uppercase tracking-widest ${theme.accent}`}>
            {subtitle}
          </p>
        )}
        <p className="font-bold text-base sm:text-lg tracking-tight text-white line-clamp-1">
          {title || "Untitled Item"}
        </p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { isChecking } = useAuthGuard({ requireAuth: true });
  const [role, setRole] = useState<string | null>(null);

  // Global UI states
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Common Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // --- Admin States ---
  const [adminTab, setAdminTab] = useState<"orders" | "products" | "categories">("orders");
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [adminSearchQuery, setAdminSearchQuery] = useState("");

  // Category Form (POST & PUT)
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    category_name: "",
    description: "",
  });
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

  // Product Form (POST & PUT)
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [productForm, setProductForm] = useState({
    category_id: "",
    product_name: "",
    description: "",
    price: "",
    stock_qty: "",
  });
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  // --- Customer States ---
  const [cart, setCart] = useState<CartItem[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | "all">("all");
  const [storeSearchQuery, setStoreSearchQuery] = useState("");
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "address" | "payment">("cart");
  const [addressDetails, setAddressDetails] = useState({ street: "", city: "", zip_code: "" });
  const [paymentMethod, setPaymentMethod] = useState("GCash");
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  const notify = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // --- GET: Fetch Data ---
  const loadData = async (userRole: string | null) => {
    setIsLoadingData(true);
    try {
      const [catRes, prodRes]: any[] = await Promise.all([
        apiClient("/category").catch(() => []),
        apiClient("/products").catch(() => []),
      ]);

      setCategories(Array.isArray(catRes) ? catRes : catRes?.data || []);
      setProducts(Array.isArray(prodRes) ? prodRes : prodRes?.data || []);

      if (userRole === "admin") {
        const orderRes: any = await apiClient("/orders").catch(() => []);
        setAllOrders(Array.isArray(orderRes) ? orderRes : orderRes?.data || []);
      } else {
        const myOrderRes: any = await apiClient("/orders/my-orders").catch(() => []);
        setMyOrders(Array.isArray(myOrderRes) ? myOrderRes : myOrderRes?.data || []);
      }
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (!isChecking) {
      const userRole = getUserRole();
      setRole(userRole);
      loadData(userRole);
    }
  }, [isChecking]);

  // --- Admin Analytics ---
  const adminMetrics = useMemo(() => {
    const totalRevenue = allOrders
      .filter((o) => o.order_status !== "Cancelled")
      .reduce((sum, o) => sum + Number(o.total_price || 0), 0);
    const pendingOrders = allOrders.filter((o) => o.order_status === "Pending").length;
    const lowStockCount = products.filter((p) => p.stock_qty <= 5).length;
    const totalUnits = products.reduce((sum, p) => sum + Number(p.stock_qty || 0), 0);

    return { totalRevenue, pendingOrders, lowStockCount, totalUnits };
  }, [allOrders, products]);

  // ==========================================
  // ADMIN CRUD: CATEGORIES (POST, PUT, DELETE)
  // ==========================================
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingCategory(true);

    const payload = {
      category_name: categoryForm.category_name.trim(),
      description: categoryForm.description.trim(),
    };

    try {
      if (editingCategoryId) {
        await apiClient(`/category/${editingCategoryId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        notify("success", "Category updated successfully.");
      } else {
        await apiClient("/category", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        notify("success", "Category created successfully.");
      }
      resetCategoryForm();
      await loadData("admin");
    } catch (err: any) {
      notify("error", err.message || "Failed to save category.");
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const handleEditCategoryClick = (category: Category) => {
    setEditingCategoryId(category.category_id);
    setCategoryForm({
      category_name: category.category_name,
      description: category.description || "",
    });
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!window.confirm("Delete this category? Products assigned to it may become uncategorized.")) return;
    try {
      await apiClient(`/category/${categoryId}`, { method: "DELETE" });
      notify("success", "Category removed.");
      if (editingCategoryId === categoryId) resetCategoryForm();
      await loadData("admin");
    } catch (err: any) {
      notify("error", err.message || "Failed to delete category.");
    }
  };

  const resetCategoryForm = () => {
    setEditingCategoryId(null);
    setCategoryForm({ category_name: "", description: "" });
  };

  // ==========================================
  // ADMIN CRUD: PRODUCTS (POST, PUT, DELETE)
  // ==========================================
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.category_id) return notify("error", "Please select a category.");

    setIsSubmittingProduct(true);
    const payload = {
      category_id: parseInt(productForm.category_id, 10),
      product_name: productForm.product_name.trim(),
      description: productForm.description.trim(),
      price: parseFloat(productForm.price),
      stock_qty: parseInt(productForm.stock_qty, 10),
    };

    try {
      if (editingProductId) {
        await apiClient(`/products/${editingProductId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        notify("success", "Product updated successfully.");
      } else {
        await apiClient("/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        notify("success", "Product published to ECDC catalog.");
      }
      resetProductForm();
      await loadData("admin");
    } catch (err: any) {
      notify("error", err.message || "Failed to save product.");
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleEditProductClick = (product: Product) => {
    setEditingProductId(product.product_id);
    setProductForm({
      category_id: String(product.category_id),
      product_name: product.product_name,
      description: product.description,
      price: String(product.price),
      stock_qty: String(product.stock_qty),
    });
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!window.confirm("Permanently remove this product from the ECDC catalog?")) return;
    try {
      await apiClient(`/products/${productId}`, { method: "DELETE" });
      notify("success", "Product deleted.");
      if (editingProductId === productId) resetProductForm();
      await loadData("admin");
    } catch (err: any) {
      notify("error", err.message || "Failed to delete product.");
    }
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setProductForm({
      category_id: "",
      product_name: "",
      description: "",
      price: "",
      stock_qty: "",
    });
  };

  // ==========================================
  // ADMIN CRUD: ORDERS (PUT, DELETE)
  // ==========================================
  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      await apiClient(`/orders/${orderId}`, {
        method: "PUT",
        body: JSON.stringify({ order_status: newStatus }),
      });
      notify("success", `Order #${orderId} status set to ${newStatus}.`);
      await loadData("admin");
    } catch (err: any) {
      notify("error", err.message || "Failed to update order.");
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!window.confirm(`Delete Order #${orderId}? This cannot be undone.`)) return;
    try {
      await apiClient(`/orders/${orderId}`, { method: "DELETE" });
      notify("success", `Order #${orderId} deleted.`);
      await loadData("admin");
    } catch (err: any) {
      notify("error", err.message || "Failed to delete order.");
    }
  };

  // ==========================================
  // CUSTOMER CART & CHECKOUT HANDLERS
  // ==========================================
  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product_id === product.product_id);
      if (existing) {
        if (existing.quantity >= product.stock_qty) {
          notify("error", "Maximum available stock reached.");
          return prevCart;
        }
        return prevCart.map((item) =>
          item.product_id === product.product_id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      notify("success", `Added "${product.product_name}" to your bag.`);
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.product_id !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.product_id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.stock_qty) {
              notify("error", "Stock limit reached.");
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  };

  const handleFinalCheckout = async () => {
    if (cart.length === 0) return notify("error", "Your shopping bag is empty.");
    if (!addressDetails.street || !addressDetails.city || !addressDetails.zip_code) {
      return notify("error", "Please complete all shipping address fields.");
    }

    setIsProcessingOrder(true);
    try {
      await apiClient("/orders", {
        method: "POST",
        body: JSON.stringify({
          address_details: `${addressDetails.street}, ${addressDetails.city}, ${addressDetails.zip_code}`,
          total_price: calculateTotal(),
          order_status: "Pending",
          payment_method: paymentMethod,
          items: cart.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            price_at_purchase: item.price,
          })),
        }),
      });

      notify("success", "Order confirmed! Thank you for shopping at ECDC Online Shopping Center.");
      setCart([]);
      setCheckoutStep("cart");
      await loadData("customer");
    } catch (err: any) {
      notify("error", err.message || "Checkout failed. Please try again.");
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const handleLogout = () => {
    clearTokens();
    router.push(CONFIG.ROUTES.LOGIN);
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "Delivered":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-600/10";
      case "Shipped":
        return "bg-indigo-50 text-indigo-700 border-indigo-200 ring-1 ring-indigo-600/10";
      case "Processing":
        return "bg-sky-50 text-sky-700 border-sky-200 ring-1 ring-sky-600/10";
      case "Cancelled":
        return "bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-600/10";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-600/10";
    }
  };

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-t-transparent" />
          <p className="text-sm font-medium text-slate-600">Loading ECDC Online Shopping Center...</p>
        </div>
      </div>
    );
  }

  const storeFilteredProducts = products.filter((p) => {
    const matchesCat = selectedCategoryFilter === "all" || p.category_id === selectedCategoryFilter;
    const matchesSearch =
      p.product_name.toLowerCase().includes(storeSearchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(storeSearchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const adminFilteredProducts = products.filter((p) =>
    p.product_name.toLowerCase().includes(adminSearchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Sticky Glassmorphism Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 px-2.5 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm font-extrabold text-xs tracking-wider">
              ECDC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
                  ECDC Online Shopping Center
                </h1>
                <span className="hidden md:inline-block text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                  {role === "admin" ? "Admin Portal" : "Store"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex border-slate-200 text-slate-700 hover:bg-slate-100"
              onClick={() => loadData(role)}
              disabled={isLoadingData}
            >
              {isLoadingData ? "Syncing..." : "Sync Data"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              onClick={handleLogout}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Floating Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm animate-in fade-in slide-in-from-bottom-4">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border flex items-center justify-between gap-4 text-sm font-medium ${
              notification.type === "success"
                ? "bg-slate-900 text-white border-slate-800"
                : "bg-rose-600 text-white border-rose-500"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`h-2 w-2 rounded-full ${
                  notification.type === "success" ? "bg-emerald-400" : "bg-white"
                }`}
              />
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="opacity-70 hover:opacity-100 text-xs">
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="flex-1">
        {role === "admin" ? (
          /* =====================================================================
             ECDC ADMIN CONSOLE
             ===================================================================== */
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Executive KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <Card className="border-slate-200/80 shadow-sm bg-white">
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Gross Revenue
                  </CardDescription>
                  <CardTitle className="text-2xl font-bold text-slate-900">
                    ₱{adminMetrics.totalRevenue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-emerald-600 font-medium">Excludes cancelled orders</p>
                </CardContent>
              </Card>

              <Card className="border-slate-200/80 shadow-sm bg-white">
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Pending Fulfillment
                  </CardDescription>
                  <CardTitle className="text-2xl font-bold text-slate-900">
                    {adminMetrics.pendingOrders} <span className="text-sm font-normal text-slate-400">orders</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-amber-600 font-medium">Awaiting processing</p>
                </CardContent>
              </Card>

              <Card className="border-slate-200/80 shadow-sm bg-white">
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Catalog Size
                  </CardDescription>
                  <CardTitle className="text-2xl font-bold text-slate-900">
                    {products.length} <span className="text-sm font-normal text-slate-400">SKUs</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-500 font-medium">{adminMetrics.totalUnits} total units in stock</p>
                </CardContent>
              </Card>

              <Card className="border-slate-200/80 shadow-sm bg-white">
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Low Stock Alerts
                  </CardDescription>
                  <CardTitle
                    className={`text-2xl font-bold ${
                      adminMetrics.lowStockCount > 0 ? "text-rose-600" : "text-slate-900"
                    }`}
                  >
                    {adminMetrics.lowStockCount} <span className="text-sm font-normal text-slate-400">items</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-500 font-medium">Threshold: ≤ 5 units remaining</p>
                </CardContent>
              </Card>
            </div>

            {/* Segmented Navigation Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="inline-flex p-1 rounded-xl bg-slate-200/70 border border-slate-200/80 w-fit">
                <button
                  onClick={() => setAdminTab("orders")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    adminTab === "orders"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Orders ({allOrders.length})
                </button>
                <button
                  onClick={() => setAdminTab("products")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    adminTab === "products"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Products ({products.length})
                </button>
                <button
                  onClick={() => setAdminTab("categories")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    adminTab === "categories"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Categories ({categories.length})
                </button>
              </div>

              {adminTab === "products" && (
                <Input
                  placeholder="Search products by name..."
                  value={adminSearchQuery}
                  onChange={(e) => setAdminSearchQuery(e.target.value)}
                  className="max-w-xs bg-white"
                />
              )}
            </div>

            {/* TAB 1: ORDERS CRUD */}
            {adminTab === "orders" && (
              <Card className="border-slate-200/80 shadow-sm bg-white">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle className="text-lg">Order Fulfillment & Transactions</CardTitle>
                  <CardDescription>
                    Manage incoming customer orders for ECDC Online Shopping Center.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-slate-50/80">
                      <TableRow>
                        <TableHead className="pl-6">Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right pr-6">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                            No customer orders recorded yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        allOrders.map((order) => (
                          <TableRow key={order.order_id} className="hover:bg-slate-50/70">
                            <TableCell className="pl-6 font-semibold text-slate-900">
                              #{String(order.order_id).padStart(4, "0")}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2.5">
                                <div className="h-7 w-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">
                                  C{order.customer_id}
                                </div>
                                <span className="text-sm font-medium text-slate-700">
                                  Customer #{order.customer_id}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-600 text-sm">
                              {new Date(order.order_date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </TableCell>
                            <TableCell className="font-semibold text-slate-900">
                              ₱{Number(order.total_price).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <select
                                value={order.order_status}
                                onChange={(e) => handleUpdateOrderStatus(order.order_id, e.target.value)}
                                className={`text-xs font-semibold px-3 py-1.5 rounded-full border cursor-pointer outline-none transition-all ${getStatusBadgeStyle(
                                  order.order_status
                                )}`}
                              >
                                <option value="Pending">Pending</option>
                                <option value="Processing">Processing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                onClick={() => handleDeleteOrder(order.order_id)}
                              >
                                Delete
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* TAB 2: PRODUCTS CRUD */}
            {adminTab === "products" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Product Form */}
                <Card className="lg:col-span-4 h-fit border-slate-200/80 shadow-sm bg-white">
                  <CardHeader className="border-b border-slate-100">
                    <CardTitle className="text-lg">
                      {editingProductId ? `Edit Product #${editingProductId}` : "New Product"}
                    </CardTitle>
                    <CardDescription>
                      {editingProductId
                        ? "Update product specifications."
                        : "Enter details — card artwork is generated automatically."}
                    </CardDescription>
                  </CardHeader>
                  <form onSubmit={handleSaveProduct}>
                    <CardContent className="space-y-4 pt-5">
                      <div className="h-36 w-full rounded-xl overflow-hidden shadow-sm">
                        <GeneratedVisualCard
                          title={productForm.product_name || "New Product"}
                          subtitle={
                            categories.find((c) => String(c.category_id) === productForm.category_id)
                              ?.category_name || "ECDC Catalog"
                          }
                          seed={editingProductId || productForm.product_name.length}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="category_id" className="text-xs font-semibold">
                          Category
                        </Label>
                        <select
                          id="category_id"
                          className="w-full border border-slate-200 rounded-md p-2 text-sm bg-white"
                          value={productForm.category_id}
                          onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                          required
                        >
                          <option value="">-- Choose Category --</option>
                          {categories.map((c) => (
                            <option key={c.category_id} value={c.category_id}>
                              {c.category_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="product_name" className="text-xs font-semibold">
                          Product Title
                        </Label>
                        <Input
                          id="product_name"
                          placeholder="e.g., Wireless Mechanical Keyboard"
                          value={productForm.product_name}
                          onChange={(e) => setProductForm({ ...productForm, product_name: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="description" className="text-xs font-semibold">
                          Description
                        </Label>
                        <Textarea
                          id="description"
                          rows={3}
                          placeholder="Key features, materials, or specs..."
                          value={productForm.description}
                          onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="price" className="text-xs font-semibold">
                            Price (₱)
                          </Label>
                          <Input
                            id="price"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="1500.00"
                            value={productForm.price}
                            onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="stock_qty" className="text-xs font-semibold">
                            Stock Units
                          </Label>
                          <Input
                            id="stock_qty"
                            type="number"
                            min="0"
                            placeholder="20"
                            value={productForm.stock_qty}
                            onChange={(e) => setProductForm({ ...productForm, stock_qty: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        {editingProductId && (
                          <Button type="button" variant="outline" className="w-1/3" onClick={resetProductForm}>
                            Cancel
                          </Button>
                        )}
                        <Button
                          type="submit"
                          className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
                          disabled={isSubmittingProduct}
                        >
                          {isSubmittingProduct
                            ? "Saving..."
                            : editingProductId
                            ? "Update Product"
                            : "Publish Product"}
                        </Button>
                      </div>
                    </CardContent>
                  </form>
                </Card>

                {/* Products Table */}
                <Card className="lg:col-span-8 border-slate-200/80 shadow-sm bg-white">
                  <CardHeader className="border-b border-slate-100">
                    <CardTitle className="text-lg">Inventory Catalog</CardTitle>
                    <CardDescription>Manage pricing, stock quantities, and product listings.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-slate-50/80">
                        <TableRow>
                          <TableHead className="pl-6">Product</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead className="text-right pr-6">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {adminFilteredProducts.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                              No matching products found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          adminFilteredProducts.map((p) => {
                            const catName =
                              categories.find((c) => c.category_id === p.category_id)?.category_name || "General";
                            return (
                              <TableRow key={p.product_id} className="hover:bg-slate-50/70">
                                <TableCell className="pl-6">
                                  <div className="flex items-center gap-3.5">
                                    <GeneratedVisualCard
                                      title={p.product_name}
                                      seed={p.product_id}
                                      variant="thumb"
                                    />
                                    <div>
                                      <p className="font-semibold text-slate-900 text-sm">{p.product_name}</p>
                                      <p className="text-xs text-slate-500 line-clamp-1 max-w-50">
                                        {p.description}
                                      </p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                                    {catName}
                                  </span>
                                </TableCell>
                                <TableCell className="font-semibold text-slate-900">
                                  ₱{Number(p.price).toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  <span
                                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                      p.stock_qty === 0
                                        ? "bg-rose-100 text-rose-700"
                                        : p.stock_qty <= 5
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-emerald-100 text-emerald-700"
                                    }`}
                                  >
                                    {p.stock_qty} in stock
                                  </span>
                                </TableCell>
                                <TableCell className="text-right pr-6 space-x-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-slate-200"
                                    onClick={() => handleEditProductClick(p)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                    onClick={() => handleDeleteProduct(p.product_id)}
                                  >
                                    Delete
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* TAB 3: CATEGORIES CRUD */}
            {adminTab === "categories" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Category Form */}
                <Card className="lg:col-span-4 h-fit border-slate-200/80 shadow-sm bg-white">
                  <CardHeader className="border-b border-slate-100">
                    <CardTitle className="text-lg">
                      {editingCategoryId ? `Edit Category #${editingCategoryId}` : "New Category"}
                    </CardTitle>
                    <CardDescription>Organize ECDC Online Shopping Center into collections.</CardDescription>
                  </CardHeader>
                  <form onSubmit={handleSaveCategory}>
                    <CardContent className="space-y-4 pt-5">
                      <div className="h-32 w-full rounded-xl overflow-hidden shadow-sm">
                        <GeneratedVisualCard
                          title={categoryForm.category_name || "New Collection"}
                          subtitle="ECDC Department"
                          seed={(editingCategoryId || categoryForm.category_name.length) + 2}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="category_name" className="text-xs font-semibold">
                          Category Name
                        </Label>
                        <Input
                          id="category_name"
                          placeholder="e.g., Electronics & Audio"
                          value={categoryForm.category_name}
                          onChange={(e) =>
                            setCategoryForm({ ...categoryForm, category_name: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="category_desc" className="text-xs font-semibold">
                          Description
                        </Label>
                        <Textarea
                          id="category_desc"
                          rows={2}
                          placeholder="Brief summary of this category..."
                          value={categoryForm.description}
                          onChange={(e) =>
                            setCategoryForm({ ...categoryForm, description: e.target.value })
                          }
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        {editingCategoryId && (
                          <Button type="button" variant="outline" className="w-1/3" onClick={resetCategoryForm}>
                            Cancel
                          </Button>
                        )}
                        <Button
                          type="submit"
                          className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
                          disabled={isSubmittingCategory}
                        >
                          {isSubmittingCategory
                            ? "Saving..."
                            : editingCategoryId
                            ? "Update Category"
                            : "Create Category"}
                        </Button>
                      </div>
                    </CardContent>
                  </form>
                </Card>

                {/* Category Grid */}
                <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4 h-fit">
                  {categories.length === 0 ? (
                    <Card className="col-span-2 p-12 text-center text-slate-500">
                      No categories created yet.
                    </Card>
                  ) : (
                    categories.map((cat) => {
                      const itemCount = products.filter((p) => p.category_id === cat.category_id).length;
                      return (
                        <Card
                          key={cat.category_id}
                          className="overflow-hidden border-slate-200/80 shadow-sm bg-white"
                        >
                          <div className="h-32 w-full">
                            <GeneratedVisualCard
                              title={cat.category_name}
                              subtitle={`${itemCount} ${itemCount === 1 ? "Product" : "Products"}`}
                              seed={cat.category_id + 2}
                            />
                          </div>
                          <CardContent className="p-4 flex items-center justify-between gap-2">
                            <p className="text-xs text-slate-500 line-clamp-1">
                              {cat.description || "No description provided."}
                            </p>
                            <div className="flex gap-1.5 shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditCategoryClick(cat)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-rose-600 hover:bg-rose-50"
                                onClick={() => handleDeleteCategory(cat.category_id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </main>
        ) : (
          /* =====================================================================
             ECDC CUSTOMER STOREFRONT
             ===================================================================== */
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
            {/* Architectural Storefront Hero Banner */}
            <div className="relative rounded-2xl overflow-hidden bg-linear-to-br from-slate-900 via-slate-900 to-indigo-950 text-white px-6 py-10 sm:px-12 sm:py-14 shadow-md border border-slate-800">
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)",
                  backgroundSize: "24px 24px",
                }}
              />
              <div className="relative z-10 max-w-2xl space-y-3">
                <span className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full bg-white/10 text-indigo-200 border border-white/15">
                  Welcome to ECDC Online Shopping Center
                </span>
                <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                  Quality Products, Delivered Fast.
                </h2>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  Browse our collections, add your favorite items to your shopping bag, and enjoy
                  seamless checkout with real-time order tracking.
                </p>
              </div>
            </div>

            {/* Visual Category Showcase Strip */}
            {categories.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold tracking-tight text-slate-900">Collections</h3>
                  {selectedCategoryFilter !== "all" && (
                    <button
                      onClick={() => setSelectedCategoryFilter("all")}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline"
                    >
                      Show All Products
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {categories.map((cat) => {
                    const isSelected = selectedCategoryFilter === cat.category_id;
                    const count = products.filter((p) => p.category_id === cat.category_id).length;
                    return (
                      <button
                        key={cat.category_id}
                        onClick={() =>
                          setSelectedCategoryFilter(isSelected ? "all" : cat.category_id)
                        }
                        className={`h-28 rounded-xl overflow-hidden text-left transition-all ${
                          isSelected
                            ? "ring-2 ring-slate-900 ring-offset-2 scale-[1.01]"
                            : "hover:shadow-md opacity-95 hover:opacity-100"
                        }`}
                      >
                        <GeneratedVisualCard
                          title={cat.category_name}
                          subtitle={`${count} Items`}
                          seed={cat.category_id + 2}
                        />
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Main Storefront Grid + Sticky Checkout Drawer */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Product Catalog Column */}
              <div className="lg:col-span-8 space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {selectedCategoryFilter === "all"
                        ? "All Products"
                        : categories.find((c) => c.category_id === selectedCategoryFilter)?.category_name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Showing {storeFilteredProducts.length} items
                    </p>
                  </div>
                  <Input
                    placeholder="Search ECDC catalog..."
                    value={storeSearchQuery}
                    onChange={(e) => setStoreSearchQuery(e.target.value)}
                    className="max-w-xs bg-white"
                  />
                </div>

                {/* Product Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {storeFilteredProducts.length === 0 ? (
                    <div className="col-span-2 py-16 text-center bg-white rounded-2xl border border-slate-200/80">
                      <p className="text-slate-500 font-medium">No products match your current filter.</p>
                      <Button
                        variant="link"
                        onClick={() => {
                          setSelectedCategoryFilter("all");
                          setStoreSearchQuery("");
                        }}
                      >
                        Reset Filters
                      </Button>
                    </div>
                  ) : (
                    storeFilteredProducts.map((product) => {
                      const catName =
                        categories.find((c) => c.category_id === product.category_id)?.category_name ||
                        "General";
                      return (
                        <Card
                          key={product.product_id}
                          className="group overflow-hidden border-slate-200/80 shadow-sm hover:shadow-md transition-all bg-white flex flex-col justify-between"
                        >
                          <div>
                            <div className="relative h-44 w-full overflow-hidden">
                              <GeneratedVisualCard
                                title={product.product_name}
                                subtitle={catName}
                                seed={product.product_id}
                              />
                              {product.stock_qty <= 5 && product.stock_qty > 0 && (
                                <span className="absolute bottom-3 right-3 z-20 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow">
                                  Only {product.stock_qty} left
                                </span>
                              )}
                              {product.stock_qty === 0 && (
                                <div className="absolute inset-0 z-20 bg-slate-950/70 backdrop-blur-[1px] flex items-center justify-center">
                                  <span className="bg-white text-slate-900 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-md">
                                    Sold Out
                                  </span>
                                </div>
                              )}
                            </div>

                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-baseline gap-2">
                                <span className="text-xs font-medium text-slate-400">
                                  SKU #{String(product.product_id).padStart(3, "0")}
                                </span>
                                <span className="text-lg font-extrabold text-slate-900">
                                  ₱{Number(product.price).toFixed(2)}
                                </span>
                              </div>
                              <CardDescription className="text-xs line-clamp-2 pt-1 text-slate-600">
                                {product.description}
                              </CardDescription>
                            </CardHeader>
                          </div>

                          <CardContent className="pt-2">
                            <Button
                              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium"
                              onClick={() => addToCart(product)}
                              disabled={product.stock_qty <= 0}
                            >
                              {product.stock_qty > 0 ? "Add to Bag" : "Unavailable"}
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>

                {/* Customer Purchase History */}
                <Card className="border-slate-200/80 shadow-sm bg-white">
                  <CardHeader className="border-b border-slate-100">
                    <CardTitle className="text-lg">Your Order History</CardTitle>
                    <CardDescription>Real-time status of your purchases at ECDC Online Shopping Center.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-slate-50/80">
                        <TableRow>
                          <TableHead className="pl-6">Order</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead className="pr-6">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {myOrders.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-slate-500 text-sm">
                              No orders placed yet.
                            </TableCell>
                          </TableRow>
                        ) : (
                          myOrders.map((order) => (
                            <TableRow key={order.order_id}>
                              <TableCell className="pl-6 font-semibold">
                                #{String(order.order_id).padStart(4, "0")}
                              </TableCell>
                              <TableCell className="text-sm text-slate-600">
                                {new Date(order.order_date).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="font-semibold">
                                ₱{Number(order.total_price).toFixed(2)}
                              </TableCell>
                              <TableCell className="pr-6">
                                <span
                                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getStatusBadgeStyle(
                                    order.order_status
                                  )}`}
                                >
                                  {order.order_status}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              {/* Sticky Shopping Bag & Checkout Sidebar */}
              <div className="lg:col-span-4 sticky top-24">
                <Card className="border-slate-200/80 shadow-md bg-white overflow-hidden">
                  <CardHeader className="bg-slate-900 text-white py-4">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base font-bold">
                        Shopping Bag ({cart.reduce((acc, i) => acc + i.quantity, 0)})
                      </CardTitle>
                      <span className="text-xs text-slate-300 font-medium">
                        {checkoutStep === "cart"
                          ? "1 / 3"
                          : checkoutStep === "address"
                          ? "2 / 3"
                          : "3 / 3"}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 h-1 rounded-full mt-3 overflow-hidden">
                      <div
                        className="bg-emerald-400 h-full transition-all duration-300"
                        style={{
                          width:
                            checkoutStep === "cart"
                              ? "33.3%"
                              : checkoutStep === "address"
                              ? "66.6%"
                              : "100%",
                        }}
                      />
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 space-y-5">
                    {/* Step 1: Bag Review */}
                    {checkoutStep === "cart" && (
                      <div className="space-y-4">
                        {cart.length === 0 ? (
                          <div className="text-center py-10 space-y-2">
                            <p className="text-sm font-medium text-slate-600">Your bag is empty</p>
                            <p className="text-xs text-slate-400">
                              Select items from the catalog to begin checkout.
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                              {cart.map((item) => (
                                <div
                                  key={item.product_id}
                                  className="flex items-center gap-3 border-b border-slate-100 pb-3"
                                >
                                  <GeneratedVisualCard
                                    title={item.product_name}
                                    seed={item.product_id}
                                    variant="thumb"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm text-slate-900 truncate">
                                      {item.product_name}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      ₱{Number(item.price).toFixed(2)}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                      <button
                                        onClick={() => updateQuantity(item.product_id, -1)}
                                        className="h-6 w-6 rounded border border-slate-200 text-xs font-bold hover:bg-slate-100"
                                      >
                                        -
                                      </button>
                                      <span className="text-xs font-semibold w-4 text-center">
                                        {item.quantity}
                                      </span>
                                      <button
                                        onClick={() => updateQuantity(item.product_id, 1)}
                                        className="h-6 w-6 rounded border border-slate-200 text-xs font-bold hover:bg-slate-100"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => removeFromCart(item.product_id)}
                                    className="text-slate-400 hover:text-rose-600 text-xs p-1"
                                    title="Remove item"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>

                            <div className="pt-2 space-y-3">
                              <div className="flex justify-between text-sm text-slate-500">
                                <span>Shipping</span>
                                <span className="text-emerald-600 font-medium">Free</span>
                              </div>
                              <div className="flex justify-between font-bold text-base text-slate-900 border-t pt-3">
                                <span>Subtotal</span>
                                <span>₱{calculateTotal().toFixed(2)}</span>
                              </div>
                              <Button
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                                onClick={() => setCheckoutStep("address")}
                              >
                                Proceed to Shipping
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Step 2: Shipping Address */}
                    {checkoutStep === "address" && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-slate-900">Delivery Destination</h4>
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <Label htmlFor="street" className="text-xs">
                              Street Address & Unit
                            </Label>
                            <Input
                              id="street"
                              placeholder="123 Rizal Avenue"
                              value={addressDetails.street}
                              onChange={(e) =>
                                setAddressDetails({ ...addressDetails, street: e.target.value })
                              }
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label htmlFor="city" className="text-xs">
                                City / Municipality
                              </Label>
                              <Input
                                id="city"
                                placeholder="Makati City"
                                value={addressDetails.city}
                                onChange={(e) =>
                                  setAddressDetails({ ...addressDetails, city: e.target.value })
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="zip_code" className="text-xs">
                                Postal Code
                              </Label>
                              <Input
                                id="zip_code"
                                placeholder="1200"
                                value={addressDetails.zip_code}
                                onChange={(e) =>
                                  setAddressDetails({ ...addressDetails, zip_code: e.target.value })
                                }
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" className="w-1/2" onClick={() => setCheckoutStep("cart")}>
                            Back
                          </Button>
                          <Button
                            className="w-1/2 bg-slate-900 hover:bg-slate-800 text-white"
                            onClick={() => {
                              if (!addressDetails.street || !addressDetails.city || !addressDetails.zip_code) {
                                return notify("error", "Please fill in all shipping fields.");
                              }
                              setCheckoutStep("payment");
                            }}
                          >
                            Continue
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Payment */}
                    {checkoutStep === "payment" && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-slate-900">Payment Method</h4>
                        <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs space-y-2">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Ship to:</span>
                            <span className="font-semibold text-slate-800 text-right">
                              {addressDetails.street}, {addressDetails.city}
                            </span>
                          </div>
                          <div className="flex justify-between font-bold text-sm text-slate-900 border-t border-slate-200 pt-2">
                            <span>Total Amount:</span>
                            <span className="text-emerald-600">₱{calculateTotal().toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Select Payment Option</Label>
                          <select
                            className="w-full border border-slate-200 rounded-md p-2.5 text-sm bg-white"
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                          >
                            <option value="GCash">GCash E-Wallet</option>
                            <option value="Maya">Maya Wallet</option>
                            <option value="Credit Card">Credit / Debit Card</option>
                            <option value="Cash on Delivery">Cash on Delivery (COD)</option>
                          </select>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" className="w-1/2" onClick={() => setCheckoutStep("address")}>
                            Back
                          </Button>
                          <Button
                            className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                            onClick={handleFinalCheckout}
                            disabled={isProcessingOrder}
                          >
                            {isProcessingOrder ? "Processing..." : "Complete Order"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        )}
      </div>

      {/* Professional Branded Footer */}
      <footer className="border-t border-slate-200 bg-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">ECDC Online Shopping Center</span>
            <span>•</span>
            <span>All rights reserved.</span>
          </div>
          <div>Secure Online Ordering & Inventory Management System</div>
        </div>
      </footer>
    </div>
  );
}