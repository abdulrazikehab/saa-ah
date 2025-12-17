import { Routes, Route, Navigate } from "react-router-dom";
import Home from "@/pages/storefront/Home";
import Products from "@/pages/storefront/Products";
import ProductDetail from "@/pages/storefront/ProductDetail";
import Cart from "@/pages/storefront/Cart";
import Checkout from "@/pages/storefront/Checkout";
import Profile from "@/pages/storefront/Profile";
import Orders from "@/pages/storefront/Orders";
import AccountProfile from "@/pages/storefront/AccountProfile";
import OrderDetail from "@/pages/storefront/OrderDetail";
import Collection from "@/pages/storefront/Collection";
import Categories from "@/pages/storefront/Categories";
import CategoryDetail from "@/pages/storefront/CategoryDetail";
import DynamicPage from "@/pages/storefront/DynamicPage";
import { StorefrontLayout } from "@/components/storefront/StorefrontLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import CustomerProtectedRoute from "@/components/auth/CustomerProtectedRoute";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import Help from "@/pages/dashboard/Help";
import { useDynamicFavicon } from "@/hooks/useDynamicFavicon";
// Digital Cards Marketplace Storefront
import CardsHome from "@/pages/storefront/cards/CardsHome";
import CardsCatalog from "@/pages/storefront/cards/CardsCatalog";
import CardDetail from "@/pages/storefront/cards/CardDetail";
import CardsLayout from "@/components/storefront/cards/CardsLayout";

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
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/account/orders" element={<CustomerProtectedRoute><Orders /></CustomerProtectedRoute>} />
        <Route path="/account/profile" element={<CustomerProtectedRoute><AccountProfile /></CustomerProtectedRoute>} />
        <Route path="/orders/:id" element={<CustomerProtectedRoute><OrderDetail /></CustomerProtectedRoute>} />
        <Route path="/:slug" element={<DynamicPage />} />
        
        {/* Auth routes for customers */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/signup" element={<Signup />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
      </Route>
      
      {/* Public pages - available on both main and tenant domains */}
      <Route path="/help" element={<StorefrontLayout><Help /></StorefrontLayout>} />
      <Route path="/privacy" element={<StorefrontLayout><DynamicPage /></StorefrontLayout>} />
      <Route path="/terms" element={<StorefrontLayout><DynamicPage /></StorefrontLayout>} />
      <Route path="/policies" element={<StorefrontLayout><DynamicPage /></StorefrontLayout>} />
      <Route path="/rules" element={<StorefrontLayout><DynamicPage /></StorefrontLayout>} />
      
      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
