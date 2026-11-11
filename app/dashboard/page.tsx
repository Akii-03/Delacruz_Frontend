"use client";

import { useEffect, useState } from "react";
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

interface Category {
  category_id: number;
  category_name: string;
}

interface Product {
  product_id: number;
  category_id: number;
  product_name: string;
  description: string;
  price: number;
  stock_qty: number;
}

interface CartItem extends Product {
  quantity: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { isChecking } = useAuthGuard({ requireAuth: true });
  const [role, setRole] = useState<string | null>(null);

  // Common states
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Admin states
  const [newCategory, setNewCategory] = useState({ category_name: "", description: "" });
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [newProduct, setNewProduct] = useState({
    category_id: "",
    product_name: "",
    description: "",
    price: "",
    stock_qty: "",
  });
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  // Customer states
  const [cart, setCart] = useState<CartItem[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);

  // Checkout steps: "cart" -> "address" -> "payment"
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "address" | "payment">("cart");

  // Address inputs
  const [addressDetails, setAddressDetails] = useState({
    street: "",
    city: "",
    zip_code: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("GCash");
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  const loadData = async (userRole: string | null) => {
    try {
      const catRes: any = await apiClient("/category");
      setCategories(Array.isArray(catRes) ? catRes : catRes?.data || []);
    } catch {
      setCategories([]);
    }

    try {
      const prodRes: any = await apiClient("/products");
      setProducts(Array.isArray(prodRes) ? prodRes : prodRes?.data || []);
    } catch {
      setProducts([]);
    }

    if (userRole === "admin") {
      try {
        const orderRes: any = await apiClient("/orders");
        setAllOrders(Array.isArray(orderRes) ? orderRes : orderRes?.data || []);
      } catch {
        setAllOrders([]);
      }
    } else {
      try {
        const myOrderRes: any = await apiClient("/orders/my-orders");
        setMyOrders(Array.isArray(myOrderRes) ? myOrderRes : myOrderRes?.data || []);
      } catch {
        setMyOrders([]);
      }
    }
  };

  useEffect(() => {
    if (!isChecking) {
      const userRole = getUserRole();
      setRole(userRole);
      loadData(userRole);
    }
  }, [isChecking]);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Verifying session...</p>
      </div>
    );
  }

  const handleLogout = () => {
    clearTokens();
    router.push(CONFIG.ROUTES.LOGIN);
  };

  // Admin handlers
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingCategory(true);
    try {
      await apiClient("/category", {
        method: "POST",
        body: JSON.stringify(newCategory),
      });
      alert("Category added successfully!");
      setNewCategory({ category_name: "", description: "" });
      await loadData("admin");
    } catch (err: any) {
      alert(err.message || "Failed to add category.");
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.category_id) return alert("Please select a category first!");

    setIsAddingProduct(true);
    try {
      await apiClient("/products", {
        method: "POST",
        body: JSON.stringify({
          category_id: parseInt(newProduct.category_id, 10),
          product_name: newProduct.product_name,
          description: newProduct.description,
          price: parseFloat(newProduct.price),
          stock_qty: parseInt(newProduct.stock_qty, 10),
        }),
      });

      alert("Product added successfully!");
      setNewProduct({ category_id: "", product_name: "", description: "", price: "", stock_qty: "" });
      await loadData("admin");
    } catch (err: any) {
      alert(err.message || "Failed to add product.");
    } finally {
      setIsAddingProduct(false);
    }
  };

  // Customer cart and checkout handlers
  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product_id === product.product_id);
      if (existing) {
        return prevCart.map((item) =>
          item.product_id === product.product_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
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

  // The backend gets the customer_id from the logged-in user's JWT token
  const handleFinalCheckout = async () => {
    if (cart.length === 0) return alert("Your cart is empty!");

    setIsProcessingOrder(true);
    try {
      await apiClient("/orders", {
        method: "POST",
        body: JSON.stringify({
          // The backend controller gets the customer_id from the token and also uses it as the address_num
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

      alert("🎉 Your transaction was successful! The order has been recorded.");
      setCart([]);
      setCheckoutStep("cart");
      await loadData("customer");
    } catch (err: any) {
      alert(err.message || "Failed to process the order.");
    } finally {
      setIsProcessingOrder(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex justify-between items-center border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {role === "admin" ? "Admin Management Portal" : "Customer Storefront"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {role === "admin"
                ? "Manage categories, products, and customer orders."
                : "Choose a product, enter your address, and pay."}
            </p>
          </div>
          <Button variant="destructive" onClick={handleLogout}>
            Logout
          </Button>
        </header>

        {role === "admin" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-6">
              {/* Category form */}
              <Card>
                <CardHeader>
                  <CardTitle>1. Add New Category</CardTitle>
                </CardHeader>
                <form onSubmit={handleAddCategory}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="category_name">Category Name</Label>
                      <Input
                        id="category_name"
                        placeholder="e.g. Electronics"
                        value={newCategory.category_name}
                        onChange={(e) => setNewCategory({ ...newCategory, category_name: e.target.value })}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isAddingCategory}>
                      {isAddingCategory ? "Saving..." : "Save Category"}
                    </Button>
                  </CardContent>
                </form>
              </Card>

              {/* Product form */}
              <Card>
                <CardHeader>
                  <CardTitle>2. Add New Product</CardTitle>
                </CardHeader>
                <form onSubmit={handleAddProduct}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="category_id">Category ({categories.length} available)</Label>
                      <select
                        id="category_id"
                        className="w-full border rounded-md p-2 text-sm bg-background"
                        value={newProduct.category_id}
                        onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })}
                        required
                      >
                        <option value="">-- Select a Category --</option>
                        {categories.map((c) => (
                          <option key={c.category_id} value={c.category_id}>
                            {c.category_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="product_name">Product Name</Label>
                      <Input
                        id="product_name"
                        placeholder="Mechanical Keyboard"
                        value={newProduct.product_name}
                        onChange={(e) => setNewProduct({ ...newProduct, product_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Product specs..."
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="price">Price (₱)</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          placeholder="1500.00"
                          value={newProduct.price}
                          onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="stock_qty">Stock</Label>
                        <Input
                          id="stock_qty"
                          type="number"
                          placeholder="20"
                          value={newProduct.stock_qty}
                          onChange={(e) => setNewProduct({ ...newProduct, stock_qty: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full mt-2" disabled={isAddingProduct}>
                      {isAddingProduct ? "Saving..." : "Save Product"}
                    </Button>
                  </CardContent>
                </form>
              </Card>
            </div>

            {/* Admin tables */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Orders & Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer ID</TableHead>
                        <TableHead>Total Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No customer transactions.
                          </TableCell>
                        </TableRow>
                      ) : (
                        allOrders.map((order) => (
                          <TableRow key={order.order_id}>
                            <TableCell className="font-medium">#{order.order_id}</TableCell>
                            <TableCell>{order.customer_id}</TableCell>
                            <TableCell>₱{Number(order.total_price).toFixed(2)}</TableCell>
                            <TableCell>{order.order_status}</TableCell>
                            <TableCell>{new Date(order.order_date).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Inventory List</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Stock</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((p) => (
                        <TableRow key={p.product_id}>
                          <TableCell>#{p.product_id}</TableCell>
                          <TableCell className="font-medium">{p.product_name}</TableCell>
                          <TableCell>₱{Number(p.price).toFixed(2)}</TableCell>
                          <TableCell>{p.stock_qty}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* Customer storefront */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-bold">Products Store</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.length === 0 ? (
                  <p className="text-muted-foreground">No products available.</p>
                ) : (
                  products.map((product) => (
                    <Card key={product.product_id} className="flex flex-col justify-between">
                      <CardHeader>
                        <CardTitle className="text-lg">{product.product_name}</CardTitle>
                        <CardDescription>{product.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xl font-bold text-emerald-600">
                            ₱{Number(product.price).toFixed(2)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Stock: {product.stock_qty}
                          </span>
                        </div>
                        <Button
                          className="w-full"
                          onClick={() => addToCart(product)}
                          disabled={product.stock_qty <= 0}
                        >
                          {product.stock_qty > 0 ? "Add to Cart" : "Out of Stock"}
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Past orders */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>My Purchase History</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Total Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            You have no orders yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        myOrders.map((order) => (
                          <TableRow key={order.order_id}>
                            <TableCell className="font-medium">#{order.order_id}</TableCell>
                            <TableCell>₱{Number(order.total_price).toFixed(2)}</TableCell>
                            <TableCell>{order.order_status}</TableCell>
                            <TableCell>{new Date(order.order_date).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Checkout flow */}
            <div className="space-y-4">
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Shopping Checkout</span>
                    <span className="text-xs text-muted-foreground uppercase font-semibold">
                      Step: {checkoutStep}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Step 1: Cart */}
                  {checkoutStep === "cart" && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm border-b pb-1">1. Cart Items ({cart.length})</h3>
                      {cart.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">
                          Your cart is empty. Choose a product on the left.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {cart.map((item) => (
                            <div key={item.product_id} className="flex justify-between items-center border-b pb-2">
                              <div>
                                <p className="font-medium text-sm">{item.product_name}</p>
                                <p className="text-xs text-muted-foreground">₱{Number(item.price).toFixed(2)} each</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => updateQuantity(item.product_id, -1)}>-</Button>
                                <span className="text-sm font-semibold">{item.quantity}</span>
                                <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => updateQuantity(item.product_id, 1)}>+</Button>
                                <Button size="sm" variant="ghost" className="text-red-500 h-6 px-1 ml-1" onClick={() => removeFromCart(item.product_id)}>✕</Button>
                              </div>
                            </div>
                          ))}

                          <div className="pt-2">
                            <div className="flex justify-between font-bold text-base mb-4">
                              <span>Total:</span>
                              <span className="text-emerald-600">₱{calculateTotal().toFixed(2)}</span>
                            </div>
                            <Button className="w-full" onClick={() => setCheckoutStep("address")}>
                              Proceed to Address →
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 2: Address */}
                  {checkoutStep === "address" && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm border-b pb-1">2. Delivery Address</h3>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label htmlFor="street" className="text-xs">Street / House No.</Label>
                          <Input
                            id="street"
                            placeholder="123 Rizal St."
                            value={addressDetails.street}
                            onChange={(e) => setAddressDetails({ ...addressDetails, street: e.target.value })}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label htmlFor="city" className="text-xs">City / Town</Label>
                            <Input
                              id="city"
                              placeholder="Manila"
                              value={addressDetails.city}
                              onChange={(e) => setAddressDetails({ ...addressDetails, city: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="zip_code" className="text-xs">Zip Code</Label>
                            <Input
                              id="zip_code"
                              placeholder="1000"
                              value={addressDetails.zip_code}
                              onChange={(e) => setAddressDetails({ ...addressDetails, zip_code: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" className="w-1/2" onClick={() => setCheckoutStep("cart")}>
                          ← Back
                        </Button>
                        <Button className="w-1/2" onClick={() => setCheckoutStep("payment")}>
                          Proceed to Payment →
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Payment */}
                  {checkoutStep === "payment" && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm border-b pb-1">3. Payment & Confirmation</h3>
                      <div className="space-y-3">
                        <div className="bg-muted p-3 rounded-md text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Items:</span>
                            <span className="font-medium">{cart.length} items</span>
                          </div>
                          <div className="flex justify-between font-bold text-emerald-600 border-t pt-1">
                            <span>Amount to Pay:</span>
                            <span>₱{calculateTotal().toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-semibold">Payment Method</Label>
                          <select
                            className="w-full border rounded-md p-2 text-sm bg-background"
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                          >
                            <option value="GCash">GCash</option>
                            <option value="Cash on Delivery">Cash on Delivery (COD)</option>
                            <option value="Credit Card">Credit Card</option>
                            <option value="Maya">Maya</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" className="w-1/2" onClick={() => setCheckoutStep("address")}>
                          ← Back
                        </Button>
                        <Button
                          className="w-1/2 bg-emerald-600 hover:bg-emerald-700"
                          onClick={handleFinalCheckout}
                          disabled={isProcessingOrder}
                        >
                          {isProcessingOrder ? "Processing..." : "Confirm & Pay"}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
