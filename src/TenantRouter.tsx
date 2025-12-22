import { Routes, Route } from "react-router-dom";
import Home from "@/pages/storefront/Home";
import Products from "@/pages/storefront/Products";
import ProductDetail from "@/pages/storefront/ProductDetail";
import Cart from "@/pages/storefront/Cart";
import Checkout from "@/pages/storefront/Checkout";
import Orders from "@/pages/storefront/Orders";
import AccountProfile from "@/pages/storefront/AccountProfile";
import OrderDetail from "@/pages/storefront/OrderDetail";
import Collection from "@/pages/storefront/Collection";
import Categories from "@/pages/storefront/Categories";
import CategoryDetail from "@/pages/storefront/CategoryDetail";
import DynamicPage from "@/pages/storefront/DynamicPage";
import { StorefrontLayout } from "@/components/storefront/StorefrontLayout";
import CustomerProtectedRoute from "@/components/auth/CustomerProtectedRoute";
import NotFound from "@/pages/NotFound";
import Help from "@/pages/dashboard/Help";
import { useDynamicFavicon } from "@/hooks/useDynamicFavicon";
import CardsCatalog from "@/pages/storefront/cards/CardsCatalog";
import CardDetail from "@/pages/storefront/cards/CardDetail";
import CardsLayout from "@/components/storefront/cards/CardsLayout";
import AboutUs from "@/pages/AboutUs";
import ContactUs from "@/pages/ContactUs";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import StorefrontAuth from "@/pages/storefront/auth/StorefrontAuth";

export const TenantRouter = () => {
  console.log('Rendering TenantRouter');
  // Update favicon and title based on tenant configuration
  useDynamicFavicon();
  
  return (
    <Routes>
      {/* Digital Cards Marketplace Routes */}
      <Route element={<CardsLayout />}>
        <Route path="/cards" element={<CardsCatalog />} />
        <Route path="/cards/:id" element={<CardDetail />} />
        <Route path="/account/cards" element={<CustomerProtectedRoute><Orders /></CustomerProtectedRoute>} />
        <Route path="/account/wallet" element={<CustomerProtectedRoute><AccountProfile /></CustomerProtectedRoute>} />
        <Route path="/account/favorites" element={<CustomerProtectedRoute><Orders /></CustomerProtectedRoute>} />
      </Route>

      {/* Standard Storefront Routes */}
      <Route element={<StorefrontLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/products/:tenantId/:productId" element={<ProductDetail />} />
        <Route path="/collections/:id" element={<Collection />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/categories/:id" element={<CategoryDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/account" element={<CustomerProtectedRoute><AccountProfile /></CustomerProtectedRoute>} />
        <Route path="/account/orders" element={<CustomerProtectedRoute><Orders /></CustomerProtectedRoute>} />
        <Route path="/account/profile" element={<CustomerProtectedRoute><AccountProfile /></CustomerProtectedRoute>} />
        <Route path="/orders/:id" element={<CustomerProtectedRoute><OrderDetail /></CustomerProtectedRoute>} />
        
        {/* Additional Storefront Pages */}
        <Route path="/wishlist" element={<CustomerProtectedRoute><Orders /></CustomerProtectedRoute>} />
        <Route path="/track-order" element={<DynamicPage />} />
        <Route path="/returns" element={<DynamicPage />} />
        <Route path="/faq" element={<DynamicPage />} />
        <Route path="/terms" element={<DynamicPage />} />
        <Route path="/policies" element={<DynamicPage />} />
        <Route path="/rules" element={<DynamicPage />} />
        <Route path="/offers" element={<DynamicPage />} />
        
        <Route path="/:slug" element={<DynamicPage />} />
        
        {/* Public pages - available on both main and tenant domains */}
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/help" element={<Help />} />
      </Route>
      
      {/* Auth Routes */}
      <Route path="/auth/login" element={<StorefrontAuth />} />
      <Route path="/auth/signup" element={<StorefrontAuth />} />
      <Route path="/login" element={<StorefrontAuth />} />
      <Route path="/signup" element={<StorefrontAuth />} />
      
      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
