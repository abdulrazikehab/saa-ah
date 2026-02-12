import { Routes, Route, Navigate } from "react-router-dom";
import Home from "@/pages/storefront/Home";
import Products from "@/pages/storefront/Products";
import ProductDetail from "@/pages/storefront/ProductDetail";
import Cart from "@/pages/storefront/Cart";
import Checkout from "@/pages/storefront/Checkout";
import Orders from "@/pages/storefront/Orders";
import AccountProfile from "@/pages/storefront/AccountProfile";
import OrderDetail from "@/pages/storefront/OrderDetail";
import RechargeBalance from "@/pages/storefront/RechargeBalance";
import CustomerInventory from "@/pages/storefront/CustomerInventory";
import Collection from "@/pages/storefront/Collection";
import Categories from "@/pages/storefront/Categories";
import CategoryDetail from "@/pages/storefront/CategoryDetail";
import Wishlist from "@/pages/storefront/Wishlist";
import DynamicPage from "@/pages/storefront/DynamicPage";
import { StorefrontLayout } from "@/components/storefront/StorefrontLayout";
import CustomerProtectedRoute from "@/components/auth/CustomerProtectedRoute";
import PermissionRoute from "@/components/auth/PermissionRoute";
import NotFound from "@/pages/NotFound";
import { useDynamicFavicon } from "@/hooks/useDynamicFavicon";
import CardsCatalog from "@/pages/storefront/cards/CardsCatalog";
import CardsHome from "@/pages/storefront/cards/CardsHome";
import CardDetail from "@/pages/storefront/cards/CardDetail";
import CardsLayout from "@/components/storefront/cards/CardsLayout";
import { 
  MerchantDashboardSection, 
  ProductListSection, 
  BalanceOperationsSection, 
  ChargeWalletSection, 
  FavoritesPageSection, 
  SupportTicketsSection, 
  EmployeesPageSection, 
  ReportsPageSection, 
  BankAccountsSection,
  StorePageSection
} from "@/components/builder/MerchantSections";
import PermissionsPage from "@/components/storefront/PermissionsPage";
import StorefrontAuth from "@/pages/storefront/auth/StorefrontAuth";
import MobileAddresses from "@/pages/mobile/MobileAddresses";
import MobilePaymentMethods from "@/pages/mobile/MobilePaymentMethods";
import MobileDigitalKeys from "@/pages/mobile/MobileDigitalKeys";
import MobileEditProfile from "@/pages/mobile/MobileEditProfile";
import MobileChangePassword from "@/pages/mobile/MobileChangePassword";
import MobileSupport from "@/pages/mobile/MobileSupport";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import InvitePage from "@/pages/auth/InvitePage";
import { useStoreSettings } from "@/contexts/StoreSettingsContext";
import { MobileLayout } from "@/components/mobile/MobileLayout";
import MobileHome from "@/pages/mobile/MobileHome";
import MobileCategories from "@/pages/mobile/MobileCategories";
import MobileCategoryBrands from "@/pages/mobile/MobileCategoryBrands";
import MobileCategoryDetail from "@/pages/mobile/MobileCategoryDetail";
import MobileProduct from "@/pages/mobile/MobileProduct";
import MobileCart from "@/pages/mobile/MobileCart";
import MobileProfile from "@/pages/mobile/MobileProfile";
import MobileRecharge from "@/pages/mobile/MobileRecharge";
import MobileCheckout from "@/pages/mobile/MobileCheckout";
import MobileWishlist from "@/pages/mobile/MobileWishlist";
import MobileOrders from "@/pages/mobile/MobileOrders";
import MobileOrderDetailView from "@/pages/mobile/MobileOrderDetailView";
import MobileRechargeHistory from "@/pages/mobile/MobileRechargeHistory";
import MobileLogin from "@/pages/mobile/MobileLogin";
import MobileSignup from "@/pages/mobile/MobileSignup";
import MobileReports from "@/pages/mobile/MobileReports";
import MobileEmployees from "@/pages/mobile/MobileEmployees";
import MobileInventory from "@/pages/mobile/MobileInventory";
import MobileNotifications from "@/pages/mobile/MobileNotifications";
import MobileBankAccounts from "@/pages/mobile/MobileBankAccounts";
import MobileWallet from "@/pages/mobile/MobileWallet";
import MobileSettings from "@/pages/mobile/MobileSettings";

export const TenantRouter = ({ isMobile }: { isMobile?: boolean }) => {
  console.log('Rendering TenantRouter', { isMobile });
  // Update favicon and title based on tenant configuration
  useDynamicFavicon();
  const { settings } = useStoreSettings();
  const isDigitalCardsStore = settings?.storeType === 'DIGITAL_CARDS';
  
  if (isMobile) {
    return (
      <Routes>
        <Route path="/login" element={<MobileLogin />} />
        <Route path="/signup" element={<MobileSignup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/invite" element={<InvitePage />} />
        
        <Route element={<MobileLayout />}>
           <Route path="/" element={<MobileHome />} />
           <Route path="/categories" element={<MobileCategories />} />
           <Route path="/categories/:id" element={<MobileCategoryDetail />} />
           <Route path="/categories/:id/brands" element={<MobileCategoryBrands />} />
           <Route path="/products" element={<MobileCategoryDetail />} />
           <Route path="/products/:id" element={<MobileProduct />} />
           <Route path="/cart" element={<MobileCart />} />
           <Route path="/checkout" element={<CustomerProtectedRoute><MobileCheckout /></CustomerProtectedRoute>} />
           <Route path="/wishlist" element={<CustomerProtectedRoute><MobileWishlist /></CustomerProtectedRoute>} />
           <Route path="/profile" element={<MobileProfile />} />
           <Route path="/account" element={<MobileProfile />} />
           
           {/* Mobile specifics */}
           <Route path="/account/orders" element={<CustomerProtectedRoute><MobileOrders /></CustomerProtectedRoute>} />
           <Route path="/orders/:id" element={<CustomerProtectedRoute><MobileOrderDetailView /></CustomerProtectedRoute>} />
           <Route path="/account/addresses" element={<CustomerProtectedRoute><MobileAddresses /></CustomerProtectedRoute>} />
           <Route path="/account/payment-methods" element={<CustomerProtectedRoute><MobilePaymentMethods /></CustomerProtectedRoute>} />
           <Route path="/account/edit-profile" element={<CustomerProtectedRoute><MobileEditProfile /></CustomerProtectedRoute>} />
           <Route path="/account/change-password" element={<CustomerProtectedRoute><MobileChangePassword /></CustomerProtectedRoute>} />
           <Route path="/account/support" element={<MobileSupport />} />
           <Route path="/notifications" element={<CustomerProtectedRoute><MobileNotifications /></CustomerProtectedRoute>} />
           <Route path="/account/notifications" element={<CustomerProtectedRoute><MobileNotifications /></CustomerProtectedRoute>} />
           <Route path="/account/recharge" element={<CustomerProtectedRoute><MobileRecharge /></CustomerProtectedRoute>} />
           <Route path="/account/recharge-history" element={<CustomerProtectedRoute><MobileRechargeHistory /></CustomerProtectedRoute>} />
           <Route path="/account/reports" element={<CustomerProtectedRoute><MobileReports /></CustomerProtectedRoute>} />
           <Route path="/account/employees" element={<CustomerProtectedRoute><MobileEmployees /></CustomerProtectedRoute>} />
           <Route path="/myinventory" element={<CustomerProtectedRoute><MobileInventory /></CustomerProtectedRoute>} />
           <Route path="/inventory" element={<CustomerProtectedRoute><MobileInventory /></CustomerProtectedRoute>} />
           <Route path="/accountinventory" element={<CustomerProtectedRoute><MobileInventory /></CustomerProtectedRoute>} />
           <Route path="/account/inventory" element={<CustomerProtectedRoute><MobileInventory /></CustomerProtectedRoute>} />
           <Route path="/account/digital-keys" element={<CustomerProtectedRoute><MobileInventory /></CustomerProtectedRoute>} />
           
           {/* Wallet & Financial Routes */}
           <Route path="/wallet" element={<CustomerProtectedRoute><MobileWallet /></CustomerProtectedRoute>} />
           <Route path="/bank-accounts" element={<CustomerProtectedRoute><MobileBankAccounts /></CustomerProtectedRoute>} />
           
           {/* Settings */}
           <Route path="/settings" element={<MobileSettings />} />
           
           <Route path="*" element={<MobileHome />} />
        </Route>
      </Routes>
    );    
  }

  return (
    <Routes>
      {/* Invitation Route - High priority */}
      <Route path="/invite" element={<InvitePage />} />

      {/* Digital Cards Marketplace Routes */}
      {/* Cards Marketplace Routes - REMOVED as requested */}
      {/* 
      <Route element={<CardsLayout />}>
        <Route path="/cards" element={<CardsCatalog />} />
        <Route path="/cards/:id" element={<CardDetail />} />
        <Route path="/account/cards" element={<CustomerProtectedRoute><Orders /></CustomerProtectedRoute>} />
        <Route path="/account/wallet" element={<CustomerProtectedRoute><AccountProfile /></CustomerProtectedRoute>} />
        <Route path="/account/favorites" element={<Wishlist />} />
      </Route> 
      */}

      {/* Standard Storefront Routes */}
      <Route element={<StorefrontLayout />}>
        {/* Always use Home component which checks for custom pages first */}
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/products/:tenantId/:productId" element={<ProductDetail />} />
        <Route path="/collections/:id" element={<Collection />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/categories/:id" element={<CategoryDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/profile" element={<CustomerProtectedRoute><AccountProfile /></CustomerProtectedRoute>} />
        <Route path="/account" element={<CustomerProtectedRoute><AccountProfile /></CustomerProtectedRoute>} />
        <Route path="/account/orders" element={<CustomerProtectedRoute><Orders /></CustomerProtectedRoute>} />
        <Route path="/account/inventory" element={<CustomerProtectedRoute><CustomerInventory /></CustomerProtectedRoute>} />
        <Route path="/accountinventory" element={<CustomerProtectedRoute><CustomerInventory /></CustomerProtectedRoute>} />
        <Route path="/account/profile" element={<CustomerProtectedRoute><AccountProfile /></CustomerProtectedRoute>} />
        <Route path="/account/recharge" element={<CustomerProtectedRoute><RechargeBalance /></CustomerProtectedRoute>} />
        <Route path="/orders/:id" element={<CustomerProtectedRoute><OrderDetail /></CustomerProtectedRoute>} />
        <Route path="/customer-orders" element={<CustomerProtectedRoute><Orders /></CustomerProtectedRoute>} />
        <Route path="/account/addresses" element={<CustomerProtectedRoute><MobileAddresses /></CustomerProtectedRoute>} />
        <Route path="/account/payment-methods" element={<CustomerProtectedRoute><MobilePaymentMethods /></CustomerProtectedRoute>} />
        <Route path="/account/digital-keys" element={<CustomerProtectedRoute><MobileDigitalKeys /></CustomerProtectedRoute>} />
        <Route path="/account/edit-profile" element={<CustomerProtectedRoute><MobileEditProfile /></CustomerProtectedRoute>} />
        <Route path="/account/change-password" element={<CustomerProtectedRoute><MobileChangePassword /></CustomerProtectedRoute>} />
        <Route path="/account/support" element={<MobileSupport />} />
        <Route path="/notifications" element={<CustomerProtectedRoute><MobileNotifications /></CustomerProtectedRoute>} />
        <Route path="/account/notifications" element={<CustomerProtectedRoute><MobileNotifications /></CustomerProtectedRoute>} />
        
        {/* Additional Storefront Pages */}
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/track-order" element={<DynamicPage />} />
        <Route path="/returns" element={<DynamicPage />} />
        <Route path="/faq" element={<DynamicPage />} />
        <Route path="/terms" element={<DynamicPage />} />
        <Route path="/policies" element={<DynamicPage />} />
        <Route path="/rules" element={<DynamicPage />} />
        <Route path="/offers" element={<DynamicPage />} />

        {/* Merchant Dashboard Routes - Explicitly defined to avoid DynamicPage lookup failures */}
        <Route path="/merchant-dashboard" element={<PermissionRoute><MerchantDashboardSection props={{}} /></PermissionRoute>} />
        <Route path="/products-list" element={<PermissionRoute requiredPermissions={['store:products:manage', 'mobile:merchant:products']} requireAnyPermission={true}><ProductListSection props={{}} /></PermissionRoute>} />
        <Route path="/balance-operations" element={<PermissionRoute requiredPermissions={['store:wallet:view']}><BalanceOperationsSection props={{}} /></PermissionRoute>} />
        <Route path="/charge-wallet" element={<PermissionRoute requiredPermissions={['store:wallet:view']}><ChargeWalletSection props={{}} /></PermissionRoute>} />
        <Route path="/favorites" element={<PermissionRoute><FavoritesPageSection props={{}} /></PermissionRoute>} />
        <Route path="/support" element={<PermissionRoute><SupportTicketsSection props={{}} /></PermissionRoute>} />
        <Route path="/employees" element={<PermissionRoute requiredPermissions={['store:employees:manage']}><EmployeesPageSection props={{}} /></PermissionRoute>} />
        <Route path="/permissions" element={<PermissionRoute requiredPermissions={['store:employees:manage']}><PermissionsPage /></PermissionRoute>} />
        <Route path="/reports" element={<PermissionRoute requiredPermissions={['store:analytics:view']}><ReportsPageSection props={{}} /></PermissionRoute>} />
        <Route path="/bank-accounts" element={<PermissionRoute requiredPermissions={['store:wallet:view']}><BankAccountsSection props={{}} /></PermissionRoute>} />
        <Route path="/store" element={<PermissionRoute requiredPermissions={['store:settings:update']}><StorePageSection props={{}} /></PermissionRoute>} />
        
        {/* Public pages - available on both main and tenant domains - MUST be before catch-all */}
        
        {/* Dynamic Pages - from Page Builder - MUST be last (catch-all) */}
        {/* Handle nested slugs like account/inventory, customer-orders, etc. */}
        {/* Use catch-all to handle nested paths - must be last */}
        <Route path="/page/*" element={<DynamicPage />} />
        <Route path="*" element={<DynamicPage />} />
      </Route>
      
      {/* Auth Routes */}
      <Route path="/login" element={<StorefrontAuth />} />
      <Route path="/signup" element={<StorefrontAuth />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/login" element={<StorefrontAuth />} />
      <Route path="/signup" element={<StorefrontAuth />} />
      
      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
