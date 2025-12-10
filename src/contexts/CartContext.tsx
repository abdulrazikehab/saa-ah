import React, { createContext, useContext, useState, useEffect } from 'react';
import { coreApi } from '@/lib/api';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';

import { Cart, CartItem } from '@/services/types';

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  addToCart: (productId: string, quantity: number, variantId?: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => {
    let id = localStorage.getItem('guestSessionId');
    if (!id) {
      id = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('guestSessionId', id);
    }
    return id;
  });

  const refreshCart = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await coreApi.getCart(user ? undefined : sessionId);
      setCart(data);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  }, [user, sessionId]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (productId: string, quantity: number, variantId?: string) => {
    try {
      console.log('CartContext: Adding to cart', { productId, quantity, variantId, sessionId, user: !!user });
      const payload = { productId, quantity, productVariantId: variantId };
      console.log('CartContext: Payload', payload);
      
      await coreApi.addToCart(payload, user ? undefined : sessionId);
      console.log('CartContext: Added to cart successfully, refreshing...');
      
      await refreshCart();
      toast({
        title: 'Added to cart',
        description: 'Item added successfully',
      });
    } catch (error: unknown) {
      console.error('CartContext: Add to cart failed', error);
      const err = error as Error;
      toast({
        title: 'Error',
        description: err.message || 'Could not add item to cart',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      await coreApi.updateCartItem(itemId, quantity, user ? undefined : sessionId);
      await refreshCart();
    } catch (error: unknown) {
      const err = error as Error;
      toast({
        title: 'Error',
        description: err.message || 'Could not update quantity',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      await coreApi.removeFromCart(itemId, user ? undefined : sessionId);
      await refreshCart();
      toast({
        title: 'Item removed',
        description: 'Item removed from cart',
      });
    } catch (error: unknown) {
      const err = error as Error;
      toast({
        title: 'Error',
        description: err.message || 'Could not remove item',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return (
    <CartContext.Provider value={{ cart, loading, addToCart, updateQuantity, removeItem, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
