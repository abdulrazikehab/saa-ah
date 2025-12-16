import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { coreApi } from '@/lib/api';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';
import { isErrorObject, getErrorMessage } from '@/lib/error-utils';

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
  console.log('🛒 CartProvider: Component rendered');
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  // Use refs to access current cart/loading without including them in dependency arrays
  const cartRef = useRef<Cart | null>(null);
  const loadingRef = useRef(false);
  const lastRefreshRef = useRef<number>(0);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const addToCartLockRef = useRef(false); // Prevent concurrent addToCart operations
  
  const [sessionId, setSessionId] = useState(() => {
    let id = localStorage.getItem('guestSessionId');
    if (!id) {
      id = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('guestSessionId', id);
    }
    console.log('🛒 CartProvider: SessionId initialized:', id);
    return id;
  });

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
      if (stored && stored !== sessionId) {
        console.log('🛒 CartProvider: SessionId changed in localStorage, updating state:', { old: sessionId, new: stored });
        setSessionId(stored);
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
  }, [sessionId, user]);

  const refreshCart = React.useCallback(async () => {
    console.log('🛒 CartContext: refreshCart called', { user: !!user, sessionId, hasUser: !!user });
    
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
    if (timeSinceLastRefresh < 500 && lastRefreshRef.current > 0) {
      console.log('🛒 CartContext: Too soon since last refresh, skipping (debounced)');
      return;
    }
    lastRefreshRef.current = now;
    
    setLoading(true);
    try {
      console.log('🛒 CartContext: Calling coreApi.getCart...', { user: !!user, sessionId });
      const response = await coreApi.getCart(user ? undefined : sessionId);
      console.log('🛒 CartContext: Raw cart response:', response);
      console.log('🛒 CartContext: Response type:', typeof response);
      console.log('🛒 CartContext: Response keys:', response && typeof response === 'object' ? Object.keys(response) : 'N/A');
      
      // api-client should already unwrap TransformInterceptor response, but check just in case
      let data = response;
      if (response && typeof response === 'object' && 'data' in response && 'success' in response && response.success === true) {
        console.log('🛒 CartContext: Response is wrapped, unwrapping...');
        data = (response as any).data;
      }
      
      console.log('🛒 CartContext: Final data after unwrapping:', data);
      
      // CRITICAL: Validate data is not an error object before setting state
      if (isErrorObject(data)) {
        console.error('🛒 CartContext: Cart API returned error object:', data);
        // Don't clear cart if we already have one - might be a temporary error
        if (!cartRef.current) {
          setCart(null);
        }
        return;
      }
      
      // Validate cart structure
      if (data && typeof data === 'object' && !isErrorObject(data)) {
        // Ensure cartItems exists (backend returns cartItems, not items)
        const cartData = data as any;
        
        // Normalize cartItems to items for frontend compatibility
        if (cartData.cartItems && !cartData.items) {
          cartData.items = cartData.cartItems;
        }
        
        // Ensure both cartItems and items are arrays
        if (!Array.isArray(cartData.cartItems)) {
          cartData.cartItems = cartData.items || [];
        }
        if (!Array.isArray(cartData.items)) {
          cartData.items = cartData.cartItems || [];
        }
        
        // If both are missing, initialize as empty arrays
        if (!cartData.cartItems && !cartData.items) {
          cartData.items = [];
          cartData.cartItems = [];
        }
        
        // Validate each cart item has product data
        const validatedItems = (cartData.cartItems || cartData.items || []).filter((item: any) => {
          if (!item || !item.product) {
            console.warn('🛒 CartContext: Filtering out invalid cart item:', item);
            return false;
          }
          return true;
        });
        
        cartData.cartItems = validatedItems;
        cartData.items = validatedItems;
        
        const itemCount = validatedItems.length;
        console.log('🛒 CartContext: Setting cart with', itemCount, 'valid items');
        console.log('🛒 CartContext: Cart ID:', cartData.id);
        console.log('🛒 CartContext: Cart items details:', validatedItems.map((item: any) => ({
          cartItemId: item.id,
          productId: item.productId,
          productName: item.product?.name || item.product?.nameAr || 'Unknown',
          quantity: item.quantity,
          hasProduct: !!item.product,
          hasVariant: !!item.productVariant,
        })));
        
        // Always update cart to ensure we have the latest state
        // Compare item IDs to detect actual changes, not just counts
        const currentCart = cartRef.current;
        const currentItemIds = new Set(
          ((currentCart as any)?.cartItems || (currentCart as any)?.items || []).map((item: any) => item.id)
        );
        const newItemIds = new Set(validatedItems.map((item: any) => item.id));
        
        // Check if items actually changed (different IDs or different quantities)
        const itemsChanged = currentItemIds.size !== newItemIds.size ||
          Array.from(newItemIds).some(id => !currentItemIds.has(id)) ||
          validatedItems.some((item: any) => {
            const currentItem = ((currentCart as any)?.cartItems || (currentCart as any)?.items || []).find((i: any) => i.id === item.id);
            return !currentItem || currentItem.quantity !== item.quantity;
          });
        
        // Always update if:
        // 1. We don't have a cart yet
        // 2. Cart ID changed
        // 3. Items actually changed (different items or quantities)
        // 4. We have items (always show when available)
        // 5. Item count is different (to catch quantity changes)
        const shouldUpdate = !currentCart || 
                            currentCart.id !== cartData.id || 
                            itemsChanged ||
                            itemCount !== currentItemIds.size ||
                            itemCount > 0;
        
        if (shouldUpdate) {
          console.log('🛒 CartContext: Cart changed, updating state', {
            hadCart: !!currentCart,
            cartIdChanged: currentCart?.id !== cartData.id,
            itemsChanged,
            currentItemCount: currentItemIds.size,
            newItemCount: itemCount,
            currentItemIds: Array.from(currentItemIds),
            newItemIds: Array.from(newItemIds)
          });
          // Force a new object reference to trigger React re-render
          setCart({ ...cartData } as Cart);
        } else {
          console.log('🛒 CartContext: Cart unchanged, skipping state update to prevent flicker');
        }
      } else {
        console.warn('🛒 CartContext: Invalid cart data structure:', data);
        // Only clear cart if we don't have one already
        if (!cartRef.current) {
          setCart(null);
        }
      }
    } catch (error) {
      console.error('🛒 CartContext: Failed to fetch cart:', error);
      // Don't clear cart on error - might be a network issue
      // Only clear if we don't have a cart already
      if (!cartRef.current) {
        setCart(null);
      }
    } finally {
      setLoading(false);
      console.log('🛒 CartContext: refreshCart completed, loading set to false');
    }
  }, [user, sessionId]); // Removed cart and loading from dependencies - using refs instead

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
      
      console.log('🛒 CartContext: Adding to cart', { 
        productId: productId.trim(), 
        quantity, 
        variantId, 
        sessionId, 
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
      const currentItemCount = (currentCart as any)?.cartItems?.length || (currentCart as any)?.items?.length || 0;
      console.log('🛒 CartContext: Current cart has', currentItemCount, 'items before adding');
      
      const response = await coreApi.addToCart(payload, user ? undefined : sessionId);
      console.log('CartContext: Add to cart response:', response);
      
      // Handle TransformInterceptor wrapped response
      let cartData = response;
      if (response && typeof response === 'object' && 'data' in response && 'success' in response) {
        cartData = (response as any).data;
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
        const validatedItems = (cartData.cartItems || cartData.items || []).filter((item: any) => {
          if (!item || !item.product) {
            console.warn('🛒 CartContext: Filtering out invalid cart item from add response:', item);
            return false;
          }
          return true;
        });
        
        cartData.cartItems = validatedItems;
        cartData.items = validatedItems;
        
        console.log('🛒 CartContext: Setting cart from add response with', validatedItems.length, 'valid items');
        console.log('🛒 CartContext: Cart items details:', validatedItems.map((item: any) => ({
          cartItemId: item.id,
          productId: item.productId,
          productName: item.product?.name || item.product?.nameAr || 'Unknown',
          quantity: item.quantity,
          hasProduct: !!item.product,
        })));
        
        // Update sessionId if returned in cart
        if (cartData.sessionId && cartData.sessionId !== sessionId) {
          console.log('🛒 CartContext: Updating sessionId from cart response:', cartData.sessionId);
          localStorage.setItem('guestSessionId', cartData.sessionId);
          setSessionId(cartData.sessionId);
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
            ((currentCart as any)?.cartItems || (currentCart as any)?.items || []).map((item: any) => item.productId));
          console.warn('🛒 CartContext: New product IDs:', validatedItems.map((item: any) => item.productId));
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
        console.log('🛒 CartContext: Product IDs:', validatedItems.map((item: any) => item.productId));
        console.log('🛒 CartContext: Product Names:', validatedItems.map((item: any) => item.product?.name || item.product?.nameAr || 'Unknown'));
        console.log('🛒 CartContext: Cart Item IDs:', validatedItems.map((item: any) => item.id));
        console.log('🛒 CartContext: Quantities:', validatedItems.map((item: any) => item.quantity));
        console.log('🛒 CartContext: =======================================');
        
        toast({
          title: 'Added to cart',
          description: 'Item added successfully',
        });
      } else {
        // If response doesn't have cart data, refresh to get latest state
        console.warn('🛒 CartContext: Add to cart response missing cart data, refreshing...');
        await refreshCart();
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

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      const response = await coreApi.updateCartItem(itemId, quantity, user ? undefined : sessionId);
      
      // Handle response similar to addToCart
      let cartData = response;
      if (response && typeof response === 'object' && 'data' in response && 'success' in response) {
        cartData = (response as any).data;
      }
      
      // Update cart state from response if valid
      if (cartData && typeof cartData === 'object' && !isErrorObject(cartData)) {
        const cartDataTyped = cartData as any;
        
        // Normalize cartItems
        if (cartDataTyped.cartItems && !cartDataTyped.items) {
          cartDataTyped.items = cartDataTyped.cartItems;
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
        const validatedItems = (cartDataTyped.cartItems || cartDataTyped.items || []).filter((item: any) => {
          return item && item.product;
        });
        
        cartDataTyped.cartItems = validatedItems;
        cartDataTyped.items = validatedItems;
        
        console.log('🛒 CartContext: Updating cart from updateQuantity response with', validatedItems.length, 'items');
        setCart({ ...cartDataTyped } as Cart);
        
        // Also refresh cart to ensure we have all products and latest state
        setTimeout(() => {
          refreshCart().catch(err => console.error('Failed to refresh cart after update:', err));
        }, 200);
      } else {
        // Fallback to refresh if response is invalid
        await refreshCart();
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      toast({
        title: 'Error',
        description: errorMessage || 'Could not update quantity',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      console.log('🛒 CartContext: removeItem called with itemId:', itemId);
      console.log('🛒 CartContext: itemId type:', typeof itemId);
      console.log('🛒 CartContext: itemId length:', itemId?.length);
      
      // Clean the itemId - remove any URL encoding artifacts or extra characters
      // If itemId contains slashes or plus signs, it might be incorrectly formatted
      let cleanItemId = itemId;
      if (itemId.includes('/') || itemId.includes('+')) {
        // Try to extract the actual ID (CUIDs are typically 25 characters, no slashes)
        // Split by common delimiters and take the first valid-looking ID
        const parts = itemId.split(/[/+]/);
        cleanItemId = parts.find(part => part.length >= 20 && !part.includes('/') && !part.includes('+')) || itemId;
        console.log('🛒 CartContext: Cleaned itemId from', itemId, 'to', cleanItemId);
      }
      
      // Get current cart to verify the itemId exists
      const currentCart = cartRef.current;
      if (currentCart) {
        const cartItems = (currentCart as any)?.cartItems || (currentCart as any)?.items || [];
        console.log('🛒 CartContext: Current cart has', cartItems.length, 'items');
        const itemIds = cartItems.map((item: any) => item.id);
        console.log('🛒 CartContext: Current cart item IDs:', itemIds);
        
        // Try to find the item by exact match or partial match
        const itemExists = itemIds.includes(cleanItemId) || itemIds.some((id: string) => id.includes(cleanItemId) || cleanItemId.includes(id));
        console.log('🛒 CartContext: ItemId exists in cart?', itemExists);
        
        if (!itemExists && itemIds.length > 0) {
          // Try to find a matching item by partial ID
          const matchingItem = cartItems.find((item: any) => 
            item.id.includes(cleanItemId.substring(0, 20)) || 
            cleanItemId.includes(item.id.substring(0, 20))
          );
          if (matchingItem) {
            cleanItemId = matchingItem.id;
            console.log('🛒 CartContext: Found matching item, using ID:', cleanItemId);
          } else {
            console.warn('🛒 CartContext: ItemId not found in current cart, but will try to remove anyway');
          }
        }
      }
      
      const response = await coreApi.removeFromCart(cleanItemId, user ? undefined : sessionId);
      
      // Always refresh cart after removal to ensure we have the latest state
      // This ensures all products are displayed correctly
      await refreshCart();
      
      toast({
        title: 'Item removed',
        description: 'Item removed from cart',
      });
    } catch (error: unknown) {
      console.error('🛒 CartContext: Error removing item:', error);
      const errorMessage = getErrorMessage(error);
      
      // Check if it's a 404 error (item not found) - this is okay, item might already be removed
      const isNotFound = errorMessage.includes('not found') || errorMessage.includes('404') || 
                        (error && typeof error === 'object' && 'status' in error && (error as any).status === 404);
      
      // Always refresh cart to sync state (item might have been removed by another request)
      try {
        await refreshCart();
      } catch (refreshError) {
        console.error('🛒 CartContext: Failed to refresh cart after error:', refreshError);
      }
      
      // Only show error toast if it's not a 404 (item not found is acceptable)
      if (!isNotFound) {
        toast({
          title: 'Error',
          description: errorMessage || 'Could not remove item',
          variant: 'destructive',
        });
      } else {
        // Item not found - might have been removed already, just refresh silently
        console.log('🛒 CartContext: Item not found (404), assuming already removed');
      }
      
      // Don't throw error for 404s - item might already be removed
      if (!isNotFound) {
        throw error;
      }
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
