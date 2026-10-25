import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem } from '../types/store';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  totalItemsCount: number;
  totalUniqueItems: number;
  totalAmount: number;
  totalSaved: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addToCart: () => {},
  updateQuantity: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  totalItemsCount: 0,
  totalUniqueItems: 0,
  totalAmount: 0,
  totalSaved: 0,
  isCartOpen: false,
  setIsCartOpen: () => {},
});

const CART_STORAGE_KEY = 'grosir_berkah_cart_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save cart to localStorage', e);
    }
  }, [items]);

  const addToCart = (product: Product, quantity: number = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setItems([]);
  };

  // Calculations
  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalUniqueItems = items.length;

  let totalAmount = 0;
  let totalSaved = 0;

  items.forEach((item) => {
    const isWholesale = item.quantity >= item.product.minWholesaleQty;
    const priceToApply = isWholesale ? item.product.wholesalePrice : item.product.price;
    const subtotal = priceToApply * item.quantity;
    const regularSubtotal = item.product.price * item.quantity;

    totalAmount += subtotal;
    if (isWholesale) {
      totalSaved += regularSubtotal - subtotal;
    }
  });

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItemsCount,
        totalUniqueItems,
        totalAmount,
        totalSaved,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
