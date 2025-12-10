import { Routes, Route, Navigate } from "react-router-dom";
import StorefrontHome from "@/pages/storefront/StorefrontHome";
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
import { useDynamicFavicon } from "@/hooks/useDynamicFavicon";

export const TenantRouter = () => {
  // Update favicon and title based on tenant configuration
  useDynamicFavicon();
  return (
    <Routes>
      <Route element={<StorefrontLayout />}>
        <Route path="/" element={<StorefrontHome />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
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
      </Route>
      
      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
