import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Product, CartItem, ProductVariant } from "@/types/product";
import { Bundle, CartBundle } from "@/types/bundle";
import { toast } from "sonner";

const CART_STORAGE_KEY = "aris-cart-items";
const BUNDLE_STORAGE_KEY = "aris-bundle-items";

// Helper to safely parse JSON from localStorage
const getStoredItems = <T,>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

interface CartContextType {
  cartItems: CartItem[];
  bundleItems: CartBundle[];
  addToCart: (product: Product, selectedVariant?: ProductVariant) => void;
  addBundleToCart: (bundle: Bundle) => void;
  removeFromCart: (productId: string) => void;
  removeBundleFromCart: (bundleId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateBundleQuantity: (bundleId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => 
    getStoredItems<CartItem[]>(CART_STORAGE_KEY, [])
  );
  const [bundleItems, setBundleItems] = useState<CartBundle[]>(() => 
    getStoredItems<CartBundle[]>(BUNDLE_STORAGE_KEY, [])
  );

  // Persist cart items to localStorage
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  // Persist bundle items to localStorage
  useEffect(() => {
    localStorage.setItem(BUNDLE_STORAGE_KEY, JSON.stringify(bundleItems));
  }, [bundleItems]);

  const addToCart = (product: Product, selectedVariant?: ProductVariant) => {
    setCartItems((prevItems) => {
      // Unique key: product id + variant id (if any)
      const cartKey = selectedVariant ? `${product.id}_${selectedVariant.id}` : product.id;
      const existingItem = prevItems.find((item) => {
        const itemKey = item.selectedVariant ? `${item.id}_${item.selectedVariant.id}` : item.id;
        return itemKey === cartKey;
      });
      
      const effectivePrice = selectedVariant ? selectedVariant.price : product.price;
      
      if (existingItem) {
        toast.success("Quantity updated in cart");
        return prevItems.map((item) => {
          const itemKey = item.selectedVariant ? `${item.id}_${item.selectedVariant.id}` : item.id;
          return itemKey === cartKey
            ? { ...item, quantity: item.quantity + 1 }
            : item;
        });
      }
      toast.success(selectedVariant 
        ? `Added ${selectedVariant.variant_value} to cart` 
        : "Added to cart"
      );
      return [...prevItems, { ...product, price: effectivePrice, quantity: 1, selectedVariant }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
    toast.success("Removed from cart");
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const addBundleToCart = (bundle: Bundle) => {
    setBundleItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === bundle.id);
      if (existingItem) {
        toast.success("Bundle quantity updated in cart");
        return prevItems.map((item) =>
          item.id === bundle.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      toast.success("Bundle added to cart");
      return [...prevItems, { ...bundle, quantity: 1 }];
    });
  };

  const removeBundleFromCart = (bundleId: string) => {
    setBundleItems((prevItems) => prevItems.filter((item) => item.id !== bundleId));
    toast.success("Bundle removed from cart");
  };

  const updateBundleQuantity = (bundleId: string, quantity: number) => {
    if (quantity <= 0) {
      removeBundleFromCart(bundleId);
      return;
    }
    setBundleItems((prevItems) =>
      prevItems.map((item) =>
        item.id === bundleId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setBundleItems([]);
    localStorage.removeItem(CART_STORAGE_KEY);
    localStorage.removeItem(BUNDLE_STORAGE_KEY);
  };

  const getCartTotal = () => {
    const productsTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
    const bundlesTotal = bundleItems.reduce((total, item) => total + item.bundle_price * item.quantity, 0);
    return productsTotal + bundlesTotal;
  };

  const getCartItemCount = () => {
    const productsCount = cartItems.reduce((count, item) => count + item.quantity, 0);
    const bundlesCount = bundleItems.reduce((count, item) => count + item.quantity, 0);
    return productsCount + bundlesCount;
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        bundleItems,
        addToCart,
        addBundleToCart,
        removeFromCart,
        removeBundleFromCart,
        updateQuantity,
        updateBundleQuantity,
        clearCart,
        getCartTotal,
        getCartItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
