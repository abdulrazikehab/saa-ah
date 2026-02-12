/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { coreApi } from '@/lib/api';
import { AuthContext } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { isErrorObject, getErrorMessage } from '@/lib/error-utils';
import i18n from '@/i18n';

import { Cart, CartItem } from '@/services/types';

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  addToCart: (productId: string, quantity: number, variantId?: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  refreshCart: (force?: boolean) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('🛒 CartProvider: Component rendered');
  
  // Safely get auth context - handle case where AuthProvider might not be available
  // Use useContext directly instead of useAuth hook to avoid throwing error
  const authContext = useContext(AuthContext);
  const user = authContext?.user || null;
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  // Use refs to access current cart/loading without including them in dependency arrays
  const cartRef = useRef<Cart | null>(null);
  const loadingRef = useRef(false);
  const lastRefreshRef = useRef<number>(0);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const addToCartLockRef = useRef(false); // Prevent concurrent addToCart operations
  
  const sessionIdRef = useRef<string>(localStorage.getItem('guestSessionId') || '');
  const [sessionId, setSessionId] = useState(() => {
    let id = localStorage.getItem('guestSessionId');
    if (!id) {
      id = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('guestSessionId', id);
    }
    sessionIdRef.current = id;
    console.log('🛒 CartProvider: SessionId initialized:', id);
    return id;
  });

  // Function to update sessionId in both state and ref
  const updateSessionId = React.useCallback((newId: string) => {
    if (newId && newId !== sessionIdRef.current) {
       console.log('🛒 CartProvider: Updating SessionId:', { from: sessionIdRef.current, to: newId });
       sessionIdRef.current = newId;
       localStorage.setItem('guestSessionId', newId);
       setSessionId(newId);
    }
  }, []);

  // Keep refs in sync with state
  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);
  
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  // Listen for sessionId changes from localStorage (when updated by api-client)
  useEffect(() => {
    const checkSessionId = () => {
      const stored = localStorage.getItem('guestSessionId');
      if (stored && stored !== sessionIdRef.current) {
        console.log('🛒 CartProvider: SessionId changed in localStorage, updating state:', { old: sessionIdRef.current, new: stored });
        updateSessionId(stored);
      }
    };
    
    // Check immediately
    checkSessionId();
    
    // Poll localStorage less frequently to avoid too many updates
    // Only poll if we don't have a user (guest mode)
    if (!user) {
      const interval = setInterval(checkSessionId, 5000); // Changed to 5s to reduce updates
      
      return () => {
        clearInterval(interval);
      };
    }
  }, [user, updateSessionId]); // sessionId is a ref via sessionIdRef.current, so no need for sessionId dep

  const refreshCart = React.useCallback(async (force = false) => {
    console.log('🛒 CartContext: refreshCart called', { user: !!user, sessionId: sessionIdRef.current });
    
    // Don't refresh if addToCart is in progress (to prevent overwriting)
    if (addToCartLockRef.current) {
      console.log('🛒 CartContext: Add to cart in progress, skipping refresh to prevent overwrite');
      return;
    }
    
    // Prevent multiple simultaneous refreshes (use ref to avoid dependency)
    if (loadingRef.current) {
      console.log('🛒 CartContext: Already loading, skipping refresh');
      return;
    }
    
    // Debounce rapid refreshes - don't refresh if last refresh was less than 500ms ago
    // Increased from 200ms to prevent overwriting when multiple items are added quickly
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshRef.current;
    if (!force && timeSinceLastRefresh < 500 && lastRefreshRef.current > 0) {
      console.log('🛒 CartContext: Too soon since last refresh, skipping (debounced)');
      return;
    }
    lastRefreshRef.current = now;
    
    // Set loading only if forced or initial load to avoid UI flicker on background refreshes
    if (force || !cartRef.current) {
      setLoading(true);
    }
    try {
      console.group('🛒 CartContext: refreshCart');
      const currentSessionId = sessionIdRef.current;
      console.log('Context:', { user: !!user, sessionId: currentSessionId, force });
      
      const response = await coreApi.getCart(user ? undefined : currentSessionId);
      console.log('Raw response:', response);
      
      const data = response;
      // NOTE: api-client already unwraps TransformInterceptor format { success, data }
      // So 'response' here is most likely already the unwrapped Cart object.
      
      if (isErrorObject(data)) {
        console.error('❌ Cart API returned error object:', data);
        if (!cartRef.current) setCart(null);
        console.groupEnd();
        return;
      }
      
      if (data && typeof data === 'object' && !isErrorObject(data)) {
        const cartData = data as Cart;
        
        // Normalize cartItems to items for frontend consistency
        if (cartData.cartItems && !cartData.items) cartData.items = cartData.cartItems;
        if (!Array.isArray(cartData.cartItems)) cartData.cartItems = cartData.items || [];
        if (!Array.isArray(cartData.items)) cartData.items = cartData.cartItems || [];
        
        const rawItems = cartData.cartItems || [];
        const validatedItems = rawItems.filter((item: CartItem) => {
          const isValid = item && item.product;
          if (!isValid) {
            console.warn('⚠️ Filtering out item without product data:', item);
          }
          return isValid;
        });
        
        console.log('Item filtering:', { 
          raw: rawItems.length, 
          valid: validatedItems.length,
          productIds: rawItems.map(i => i.productId)
        });
        
        cartData.cartItems = validatedItems;
        cartData.items = validatedItems;
        
        const currentCart = cartRef.current;
        const currentItemCount = ((currentCart as Cart)?.cartItems || (currentCart as Cart)?.items || []).length;
        const newItemCount = validatedItems.length;
        
        // Update if forced, or no current cart, or item count changed, or just always update on success to be safe
        const shouldUpdate = force || !currentCart || currentCart.id !== cartData.id || currentItemCount !== newItemCount || true;
        
        if (shouldUpdate) {
          console.log('✅ Updating cart state', { newItemCount });
          const newCart = { ...cartData } as Cart;
          setCart(newCart);
          cartRef.current = newCart;
        } else {
          console.log('ℹ️ Skipping state update (already sync)');
        }
      } else {
        console.warn('⚠️ Received empty or invalid cart data, clearing state');
        setCart(null);
        cartRef.current = null;
      }
    } catch (error) {
      console.error('❌ Error in refreshCart:', error);
      const errorMessage = getErrorMessage(error);
      const isNotFound = errorMessage.includes('not found') || 
                         errorMessage.includes('404') || 
                         (error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 404);

      if (isNotFound) {
        setCart(null);
        cartRef.current = null;
      }
    } finally {
      console.groupEnd();
      setLoading(false);
    }
  }, [user]); // Only depend on user, use sessionIdRef inside

  // Only refresh cart on mount or when user/sessionId actually changes (not when refreshCart function reference changes)
  useEffect(() => {
    console.log('🛒 CartContext: useEffect triggered, calling refreshCart');
    console.log('🛒 CartContext: Dependencies:', { user: !!user, sessionId });
    let isMounted = true;
    
    // Clear any pending refresh timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    
    // Small delay to batch multiple rapid changes
    refreshTimeoutRef.current = setTimeout(() => {
      if (isMounted) {
        refreshCart().catch((error) => {
          if (isMounted) {
            console.error('🛒 CartContext: Error in refreshCart from useEffect:', error);
          }
        });
      }
    }, 100); // 100ms delay to batch rapid changes
    
    return () => {
      isMounted = false;
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [user, sessionId, refreshCart]); // Include refreshCart but it's stable now

  const addToCart = async (productId: string, quantity: number, variantId?: string) => {
    // Prevent concurrent addToCart operations - but queue them instead of blocking
    if (addToCartLockRef.current) {
      console.log('🛒 CartContext: Add to cart already in progress, waiting...');
      // Wait longer and retry up to 3 times
      for (let i = 0; i < 3; i++) {
        await new Promise(resolve => setTimeout(resolve, 200));
        if (!addToCartLockRef.current) {
          break; // Lock released, proceed
        }
      }
      if (addToCartLockRef.current) {
        console.warn('🛒 CartContext: Add to cart still locked after waiting, proceeding anyway to prevent blocking');
        // Don't return - proceed anyway to prevent blocking multiple additions
      }
    }
    
    addToCartLockRef.current = true;
    
    try {
      // Validate productId
      if (!productId || typeof productId !== 'string' || productId.trim() === '') {
        console.error('❌ CartContext: Invalid productId:', productId);
        toast({
          title: 'خطأ',
          description: 'معرف المنتج غير صحيح',
          variant: 'destructive',
        });
        throw new Error('Invalid product ID');
      }
      
      const currentSessionId = sessionIdRef.current;
      console.log('🛒 CartContext: Adding to cart', { 
        productId: productId.trim(), 
        quantity, 
        variantId, 
        sessionId: currentSessionId, 
        user: !!user 
      });
      
      // Only include productVariantId if variantId is provided
      const payload: { productId: string; quantity: number; productVariantId?: string } = {
        productId: productId.trim(), // Ensure no whitespace
        quantity: Number(quantity), // Ensure quantity is a number
      };
      if (variantId) {
        payload.productVariantId = variantId.trim();
      }
      console.log('🛒 CartContext: Payload', payload);
      
      // Get current cart state before adding
      const currentCart = cartRef.current;
      const currentItemCount = (currentCart as Cart)?.cartItems?.length || (currentCart as Cart)?.items?.length || 0;
      console.log('🛒 CartContext: Current cart has', currentItemCount, 'items before adding');
      
      const response = await coreApi.addToCart(payload, user ? undefined : currentSessionId);
      console.log('CartContext: Add to cart response:', response);
      
      // Handle TransformInterceptor wrapped response
      let cartData = response;
      if (response && typeof response === 'object' && 'data' in response && 'success' in response) {
        cartData = (response as { data: Cart }).data;
        console.log('CartContext: Unwrapped add to cart response:', cartData);
      }
      
      // Normalize cartItems to items
      if (cartData && typeof cartData === 'object') {
        if (cartData.cartItems && !cartData.items) {
          cartData.items = cartData.cartItems;
        }
        if (!cartData.cartItems && cartData.items) {
          cartData.cartItems = cartData.items;
        }
        if (!Array.isArray(cartData.cartItems)) {
          cartData.cartItems = [];
        }
        if (!Array.isArray(cartData.items)) {
          cartData.items = cartData.cartItems || [];
        }
        
        // Validate each cart item has product data
        const validatedItems = (cartData.cartItems || cartData.items || []).filter((item: CartItem) => {
          if (!item || !item.product) {
            console.warn('🛒 CartContext: Filtering out invalid cart item from add response:', item);
            return false;
          }
          return true;
        });
        
        cartData.cartItems = validatedItems;
        cartData.items = validatedItems;
        
        console.log('🛒 CartContext: Setting cart from add response with', validatedItems.length, 'valid items');
        console.log('🛒 CartContext: Cart items details:', validatedItems.map((item: CartItem) => ({
          cartItemId: item.id,
          productId: item.productId,
          productName: item.product?.name || item.product?.nameAr || 'Unknown',
          quantity: item.quantity,
          hasProduct: !!item.product,
        })));
        
        // Update sessionId if returned in cart
        if (cartData.sessionId && cartData.sessionId !== sessionIdRef.current) {
          console.log('🛒 CartContext: Updating sessionId from cart response:', cartData.sessionId);
          updateSessionId(cartData.sessionId);
        }
        
        // Set cart immediately with normalized and validated data
        // The backend returns the complete cart with all items, so we trust this response
        console.log('🛒 CartContext: Updating cart state with', validatedItems.length, 'items from addToCart response');
        console.log('🛒 CartContext: Item count changed from', currentItemCount, 'to', validatedItems.length);
        
        // Verify we have more items than before (or at least the same if updating quantity)
        if (validatedItems.length < currentItemCount && currentItemCount > 0) {
          console.warn('🛒 CartContext: WARNING - Item count decreased! This might indicate items were lost.');
          console.warn('🛒 CartContext: Current items:', currentItemCount, 'New items:', validatedItems.length);
          console.warn('🛒 CartContext: Current product IDs:', 
            ((currentCart as Cart)?.cartItems || (currentCart as Cart)?.items || []).map((item: CartItem) => item.productId));
          console.warn('🛒 CartContext: New product IDs:', validatedItems.map((item: CartItem) => item.productId));
          // Still update, but log a warning
        }
        
        // Create a new object to ensure React detects the state change
        const newCart = { ...cartData } as Cart;
        
        // CRITICAL: Always update cart state with the complete cart from backend
        // The backend returns ALL items in the cart, not just the one we added
        // This ensures that when multiple products are added, all of them are displayed
        setCart(newCart);
        
        // Update cartRef immediately to reflect the new state
        cartRef.current = newCart;
        
        console.log('🛒 CartContext: ========== CART STATE UPDATED ==========');
        console.log('🛒 CartContext: Cart ID:', newCart.id);
        console.log('🛒 CartContext: Total items in cart:', validatedItems.length);
        console.log('🛒 CartContext: Product IDs:', validatedItems.map((item: CartItem) => item.productId));
        console.log('🛒 CartContext: Product Names:', validatedItems.map((item: CartItem) => item.product?.name || item.product?.nameAr || 'Unknown'));
        console.log('🛒 CartContext: Cart Item IDs:', validatedItems.map((item: CartItem) => item.id));
        console.log('🛒 CartContext: Quantities:', validatedItems.map((item: CartItem) => item.quantity));
        console.log('🛒 CartContext: =======================================');
        
        // Always trigger a background refresh to ensure full product data sync
        // (Sometimes the add response is less complete than a full getCart)
        refreshCart(true).catch(err => console.error('Background refresh failed:', err));

        toast({
          title: 'Added to cart',
          description: 'Item added successfully',
        });
      } else {
        // If response doesn't have cart data, refresh to get latest state
        console.warn('🛒 CartContext: Add to cart response missing cart data, refreshing...');
        await refreshCart(true);
        toast({
          title: 'Added to cart',
          description: 'Item added successfully',
        });
      }
    } catch (error: unknown) {
      console.error('CartContext: Add to cart failed', error);
      const errorMessage = getErrorMessage(error);
      toast({
        title: 'Error',
        description: errorMessage || 'Could not add item to cart',
        variant: 'destructive',
      });
      throw error;
    } finally {
      // Always release the lock
      addToCartLockRef.current = false;
      
      // Refresh cart after a longer delay to ensure backend has processed all items
      // Increased delay to 1000ms to allow multiple rapid additions to complete
      // This ensures that if multiple products are added quickly, we get the final state
      setTimeout(() => {
        // Only refresh if no other addToCart is in progress
        if (!addToCartLockRef.current) {
          console.log('🛒 CartContext: Refreshing cart after add to ensure all items are present');
          refreshCart().catch(err => console.error('Failed to refresh cart after add:', err));
        } else {
          console.log('🛒 CartContext: Skipping refresh - another addToCart in progress');
          // Schedule another refresh attempt after the current operation completes
          setTimeout(() => {
            if (!addToCartLockRef.current) {
              refreshCart().catch(err => console.error('Failed to refresh cart after delayed add:', err));
            }
          }, 1000);
        }
      }, 1000);
    }
  };

  const updateQuantityLockRef = useRef<{ [key: string]: boolean }>({});

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (updateQuantityLockRef.current[itemId]) return;
    updateQuantityLockRef.current[itemId] = true;

    try {
      const response = await coreApi.updateCartItem(itemId, quantity, user ? undefined : sessionId);
      
      // Handle response similar to addToCart
      let cartData = response;
      if (response && typeof response === 'object' && 'data' in response && 'success' in response) {
        cartData = (response as { data: Cart }).data;
      }
      
      // Update cart state from response if valid
      if (cartData && typeof cartData === 'object' && !isErrorObject(cartData)) {
        const cartDataTyped = cartData as Cart;
        
        // Normalize cartItems
        if (cartDataTyped.cartItems && !cartDataTyped.items) {
          cartDataTyped.items = cartDataTyped.cartItems || [];
        }
        if (!cartDataTyped.cartItems && cartDataTyped.items) {
          cartDataTyped.cartItems = cartDataTyped.items;
        }
        if (!Array.isArray(cartDataTyped.cartItems)) {
          cartDataTyped.cartItems = cartDataTyped.items || [];
        }
        if (!Array.isArray(cartDataTyped.items)) {
          cartDataTyped.items = cartDataTyped.cartItems || [];
        }
        
        // Validate items
        const validatedItems = (cartDataTyped.cartItems || cartDataTyped.items || []).filter((item: CartItem) => {
          return item && item.product;
        });
        
        cartDataTyped.cartItems = validatedItems;
        cartDataTyped.items = validatedItems;
        
        console.log('🛒 CartContext: Updating cart from updateQuantity response with', validatedItems.length, 'items');
      setCart({ ...cartDataTyped } as Cart);
      cartRef.current = cartDataTyped;
    } else {
      // Fallback to refresh if response is invalid
      await refreshCart(true);
    }
  } catch (error: unknown) {
    let errorMessage = getErrorMessage(error);
    const isRTL = i18n.language === 'ar' || (typeof i18n.language === 'string' && i18n.language.startsWith('ar'));

    // Special handling for inventory errors
    if (errorMessage.toLowerCase().includes('inventory') || errorMessage.toLowerCase().includes('stock')) {
        errorMessage = isRTL 
          ? 'عذراً، الكمية المطلوبة غير متوفرة حالياً' 
          : 'Sorry, the requested quantity is not available';
    }

    toast({
      title: isRTL ? 'خطأ في التحديث' : 'Update Error',
      description: errorMessage,
      variant: 'destructive',
    });
    
    // Refresh cart to revert UI to valid state
    refreshCart(true).catch(() => {});
    throw error;
  } finally {
    updateQuantityLockRef.current[itemId] = false;
  }
};

  const removeItemLockRef = useRef<{ [key: string]: boolean }>({});

  const removeItem = async (itemId: string) => {
    if (!itemId) return;
    if (removeItemLockRef.current[itemId]) return;
    removeItemLockRef.current[itemId] = true;

    try {
      console.log('🛒 CartContext: removeItem called with itemId:', itemId);
      
      await coreApi.removeFromCart(itemId, user ? undefined : sessionId);
      
      // Always refresh cart after removal to ensure we have the latest state
      await refreshCart(true);
      
      toast({
        title: i18n.language.startsWith('ar') ? 'تم الحذف' : 'Item removed',
        description: i18n.language.startsWith('ar') ? 'تم حذف المنتج من السلة' : 'Item removed from cart',
      });
    } catch (error: unknown) {
      console.error('🛒 CartContext: Error removing item:', error);
      const errorMessage = getErrorMessage(error);
      
      const isNotFound = errorMessage.includes('not found') || errorMessage.includes('404') || 
                        (error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 404);
      
      // Always refresh cart to sync state
      await refreshCart(true).catch(() => {});
      
      if (!isNotFound) {
        toast({
          title: i18n.language === 'ar' ? 'خطأ في الحذف' : 'Removal Error',
          description: i18n.language === 'ar' ? 'تعذر حذف المنتج، يرجى المحاولة لاحقاً' : 'Could not remove product',
          variant: 'destructive'
        });
      }
    } finally {
      removeItemLockRef.current[itemId] = false;
    }
  };

  const clearCart = async () => {
    try {
      setLoading(true);
      await coreApi.clearCart(user ? undefined : sessionId);
      setCart(null);
      cartRef.current = null;
    } catch (error) {
      console.error('🛒 CartContext: Failed to clear cart:', error);
      // Even if backend fails, clear local state
      setCart(null);
      cartRef.current = null;
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider value={{ cart, loading, addToCart, updateQuantity, removeItem, refreshCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    console.warn('⚠️ useCart called outside of CartProvider. Returning dummy context.');
    return {
       cart: null,
       loading: false,
       addToCart: async () => { console.error('Cart action called outside of provider'); },
       updateQuantity: async () => {},
       removeItem: async () => {},
       refreshCart: async () => {},
       clearCart: async () => {}
    };
  }
  return context;
};
