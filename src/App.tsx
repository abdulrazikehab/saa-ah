import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { DarkModeProvider } from "@/contexts/DarkModeContext";
import { TabUpdatesProvider } from "@/contexts/TabUpdatesContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { StoreSettingsProvider } from "@/contexts/StoreSettingsContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import "./i18n";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import ChangePassword from "./pages/auth/ChangePassword";
import OAuthCallback from "./pages/auth/OAuthCallback";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import CustomerProtectedRoute from "./components/auth/CustomerProtectedRoute";
import PermissionRoute from "./components/auth/PermissionRoute";
import Dashboard from "./pages/dashboard/Dashboard";
import ProductsManager from "./pages/dashboard/ProductsManager";
import CategoriesManager from "./pages/dashboard/CategoriesManager";
import HierarchicalManager from "./pages/dashboard/HierarchicalManager";
import PriceManager from "./pages/dashboard/PriceManager";
import OrdersManager from "./pages/dashboard/OrdersManager";
import CustomersManager from "./pages/dashboard/CustomersManager";
import ReportsPage from "./pages/dashboard/ReportsPage";
import Settings from "./pages/dashboard/Settings";
import SettingsLayout from "./pages/dashboard/settings/SettingsLayout";
import SupplierSettings from "./pages/dashboard/settings/SupplierSettings";
import UnitSettings from "./pages/dashboard/settings/UnitSettings";
import BrandSettings from "./pages/dashboard/settings/BrandSettings";
import CurrencySettings from "./pages/dashboard/settings/CurrencySettings";
import SuppliersPage from "./pages/dashboard/SuppliersPage";
import BrandsPage from "./pages/dashboard/BrandsPage";
import UnitsPage from "./pages/dashboard/UnitsPage";
import CurrenciesPage from "./pages/dashboard/CurrenciesPage";
import PaymentSettings from "./pages/dashboard/settings/PaymentSettings";
import PaymentOptions from "./pages/dashboard/PaymentOptions";
import CheckoutSettings from "./pages/dashboard/settings/CheckoutSettings";
import NotificationsSettings from "./pages/dashboard/settings/NotificationsSettings";
import DomainsSettings from "./pages/dashboard/settings/DomainsSettings";
import UsersSettings from "./pages/dashboard/settings/UsersSettings";
import IntegrationsSettings from "./pages/dashboard/settings/IntegrationsSettings";
import KycSettings from "./pages/dashboard/settings/KycSettings";
import BillingSettings from "./pages/dashboard/settings/BillingSettings";
import Limits from "./pages/dashboard/settings/Limits";
import DomainManagement from "./pages/dashboard/DomainManagement";
import TemplatesPage from "./pages/dashboard/TemplatesPage";
import MarketSetup from "./pages/dashboard/MarketSetup";
import NavigationEditor from "./pages/dashboard/NavigationEditor";
import ChatInterface from "./pages/dashboard/ChatInterface";
import Management from "./pages/dashboard/Management";
import AppBuilder from "./pages/dashboard/AppBuilder";
import InstalledApps from "./pages/dashboard/InstalledApps";
import MarketingDashboard from "./pages/dashboard/MarketingDashboard";
import SmartLinePage from "./pages/dashboard/SmartLinePage";
import SupportPage from "./pages/dashboard/SupportPage";
import ThemesStore from "./pages/dashboard/ThemesStore";
import AppsStore from "./pages/dashboard/AppsStore";
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
import PagesManager from "@/pages/dashboard/PagesManager";
import PageBuilderPage from "@/pages/dashboard/PageBuilderPage";
import DashboardProfile from "@/pages/dashboard/DashboardProfile";
import Help from "@/pages/dashboard/Help";
import WalletTransactions from "@/pages/dashboard/WalletTransactions";
import WalletPage from "@/pages/dashboard/wallet/WalletPage";
import ActivityLogs from "@/pages/dashboard/ActivityLogs";
import Chat from "@/pages/dashboard/Chat";
import Reports from "@/pages/dashboard/Reports";
import { StorefrontLayout } from "@/components/storefront/StorefrontLayout";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import HierarchicalStandalone from "@/pages/dashboard/HierarchicalStandalone";
import { BuyerDashboardLayout } from "@/components/buyer-dashboard/BuyerDashboardLayout";
import { TenantRouter } from "@/TenantRouter";
// Buyer Dashboard Pages
import BuyerDashboard from "./pages/buyer-dashboard/BuyerDashboard";
import BuyerProducts from "./pages/buyer-dashboard/BuyerProducts";
import BuyerOrders from "./pages/buyer-dashboard/BuyerOrders";
import BuyerWallet from "./pages/buyer-dashboard/BuyerWallet";
import BuyerFavorites from "./pages/buyer-dashboard/BuyerFavorites";
import BuyerSupport from "./pages/buyer-dashboard/BuyerSupport";
import BuyerProfile from "./pages/buyer-dashboard/BuyerProfile";
import SystemAdminPanel from "@/pages/SystemAdminPanel";
import StaticPage from "@/pages/StaticPage";
import './i18n'; // Initialize i18n
import './styles/theme.css'; // Import theme CSS
// import './styles/theme-force.css'; // Force theme application - DISABLED to preserve dashboard design
import './styles/dark-mode-visibility-fix.css'; // Fix invisible text in dark mode
import PartnerWithUs from './pages/PartnerWithUs';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';
import PrivacyPolicy from './pages/PrivacyPolicy';
import CookieConsent from './components/ui/CookieConsent';
import CookieRequired from './components/ui/CookieRequired';
import i18n from './i18n';
import CardsStore from "@/pages/dashboard/cards/CardsStore";
import CardsFavorites from "@/pages/dashboard/cards/CardsFavorites";
import CardsOrders from "@/pages/dashboard/cards/CardsOrders";
import CardsReports from "@/pages/dashboard/cards/CardsReports";
import EmployeesManager from "@/pages/dashboard/EmployeesManager";
import PermissionsManager from "@/pages/dashboard/PermissionsManager";
import { ThemeCustomizer } from "@/components/ui/ThemeCustomizer";
import { isMainDomain } from "@/lib/domain";

const queryClient = new QueryClient();

// Component to handle direction updates
const DirectionHandler = () => {
  const { i18n: i18nInstance } = useTranslation();
  
  useEffect(() => {
    // Create or get style element for direction
    let styleEl = document.getElementById('direction-style') as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'direction-style';
      document.head.appendChild(styleEl);
    }
    
    const updateDirection = (lng: string) => {
      const dir = lng === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.setAttribute('dir', dir);
      document.documentElement.classList.remove('rtl', 'ltr');
      document.documentElement.classList.add(dir);
      
      // Inject CSS directly into style tag for maximum priority
      styleEl.textContent = `
        html { direction: ${dir} !important; }
        body { direction: ${dir} !important; }
        html[dir="${dir}"] { direction: ${dir} !important; }
        body[dir="${dir}"] { direction: ${dir} !important; }
        html.${dir} { direction: ${dir} !important; }
        body.${dir} { direction: ${dir} !important; }
      `;
      
      // Force update html element with multiple methods
      document.documentElement.dir = dir;
      document.documentElement.lang = lng;
      document.documentElement.setAttribute('dir', dir);
      document.documentElement.setAttribute('lang', lng);
      
      // Force update body element with multiple methods
      if (document.body) {
        document.body.dir = dir;
        document.body.setAttribute('dir', dir);
        document.body.style.setProperty('direction', dir, 'important');
        document.body.style.direction = dir;
      }
      
      // Add/remove RTL class for CSS targeting
      if (dir === 'rtl') {
        document.documentElement.classList.add('rtl');
        document.documentElement.classList.remove('ltr');
        if (document.body) {
          document.body.classList.add('rtl');
          document.body.classList.remove('ltr');
        }
      } else {
        document.documentElement.classList.add('ltr');
        document.documentElement.classList.remove('rtl');
        if (document.body) {
          document.body.classList.add('ltr');
          document.body.classList.remove('rtl');
        }
      }
      
      // Force a reflow to ensure changes are applied
      if (document.body) {
        void document.body.offsetHeight;
      }
    };
    
    // Set initial direction immediately
    const currentLang = i18nInstance.language || localStorage.getItem('language') || 'ar';
    updateDirection(currentLang);
    
    // Listen for language changes
    const handleLanguageChange = (lng: string) => {
      updateDirection(lng);
    };
    
    i18nInstance.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18nInstance.off('languageChanged', handleLanguageChange);
    };
  }, [i18nInstance]);
  
  return null;
};

const App = () => {
  const isMain = isMainDomain();
  console.log('App rendering. Hostname:', window.location.hostname, 'isMainDomain:', isMain);

  return (
    <>
      <DirectionHandler />
    <DarkModeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StoreSettingsProvider>
            <CartProvider>
              <WishlistProvider>
                <TabUpdatesProvider>
                  <NotificationProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <CookieConsent onAccept={() => {}} />
                <CookieRequired />
                <BrowserRouter>
            {isMain ? (
              <Routes>
                {/* Landing Page */}
                <Route path="/" element={<LandingPage />} />
                
                {/* Partner with Us */}
                <Route path="/partner" element={<PartnerWithUs />} />

                {/* Static Pages */}
                <Route path="/about" element={<AboutUs />} />
                <Route path="/contact" element={<ContactUs />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                
                {/* Hidden System Admin Panel - Secret URL */}
                <Route path="/system-admin-x7k9p2" element={<SystemAdminPanel />} />
                
                {/* Auth Routes (No Layout) */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Signup />} />
                <Route path="/auth/login" element={<Login />} />
                <Route path="/auth/signup" element={<Signup />} />
                <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                <Route path="/auth/reset-password" element={<ResetPassword />} />
                <Route path="/auth/change-password" element={<ChangePassword />} />
                <Route path="/oauth/callback" element={<OAuthCallback />} />
                
                {/* Storefront Preview Routes (With Layout) - Keep these for previewing on main domain */}
                <Route element={<StorefrontLayout />}>
                  <Route path="/store" element={<Home />} />
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
                </Route>
                
                {/* Market Setup (Protected, No Dashboard Layout) */}
                <Route path="/setup" element={<ProtectedRoute><MarketSetup /></ProtectedRoute>} />
                
                {/* Page Builder (Full Screen) */}
                <Route path="/builder/new" element={<ProtectedRoute><PageBuilderPage /></ProtectedRoute>} />
                <Route path="/builder/:id" element={<ProtectedRoute><PageBuilderPage /></ProtectedRoute>} />
                
                {/* Full Screen Hierarchical Explorer (Protected, Custom Layout) */}
                <Route path="/hierarchical-fullscreen" element={
                  <ProtectedRoute>
                    <HierarchicalStandalone />
                  </ProtectedRoute>
                } />

                {/* Dashboard Routes (Protected, With Dashboard Layout) */}
                <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/dashboard/market-setup" element={<MarketSetup />} />
                  <Route path="/dashboard/profile" element={<DashboardProfile />} />
                  <Route path="/dashboard/products" element={<PermissionRoute route="/dashboard/products"><ProductsManager /></PermissionRoute>} />
                  <Route path="/dashboard/categories" element={<PermissionRoute route="/dashboard/categories"><CategoriesManager /></PermissionRoute>} />
                  <Route path="/dashboard/hierarchical" element={<PermissionRoute route="/dashboard/hierarchical"><HierarchicalManager /></PermissionRoute>} />
                  <Route path="/dashboard/prices" element={<PermissionRoute route="/dashboard/prices"><PriceManager /></PermissionRoute>} />
                  <Route path="/dashboard/orders" element={<PermissionRoute route="/dashboard/orders"><OrdersManager /></PermissionRoute>} />
                  <Route path="/dashboard/customers" element={<PermissionRoute route="/dashboard/customers"><CustomersManager /></PermissionRoute>} />
                  <Route path="/dashboard/reports" element={<PermissionRoute route="/dashboard/reports"><ReportsPage /></PermissionRoute>} />
                  <Route path="/dashboard/pages" element={<PagesManager />} />
                  <Route path="/dashboard/chat" element={<ChatInterface />} />
                  <Route path="/dashboard/storefront" element={<NavigationEditor />} />
                  <Route path="/dashboard/navigation" element={<NavigationEditor />} />
                  <Route path="/dashboard/marketing" element={<MarketingDashboard />} />
                  <Route path="/dashboard/smart-line" element={<SmartLinePage />} />
                  <Route path="/dashboard/design" element={<ThemesStore />} />
                  <Route path="/dashboard/apps" element={<AppsStore />} />
                  <Route path="/dashboard/management" element={<Management />} />
                  <Route path="/dashboard/app-builder" element={<AppBuilder />} />
                  <Route path="/dashboard/installed-apps" element={<InstalledApps />} />
                  <Route path="/dashboard/templates" element={<TemplatesPage />} />
                  <Route path="/dashboard/wallet" element={<WalletPage />} />
                  <Route path="/dashboard/activity-log" element={<ActivityLogs />} />
                  <Route path="/dashboard/chat-team" element={<Chat />} />
                  <Route path="/dashboard/reports" element={<Reports />} />
                  <Route path="/dashboard/support" element={<SupportPage />} />
                  <Route path="/dashboard/help" element={<Help />} />
                  
                  {/* Cards Dashboard Routes */}
                  <Route path="/dashboard/cards/store" element={<CardsStore />} />
                  <Route path="/dashboard/cards/favorites" element={<CardsFavorites />} />
                  <Route path="/dashboard/cards/orders" element={<CardsOrders />} />
                  <Route path="/dashboard/cards/reports" element={<CardsReports />} />
                  
                  {/* Employees & Permissions Routes - Only for owners/admins (but allow staff to view their own permissions) */}
                  <Route path="/dashboard/employees" element={<PermissionRoute requiredPermissions={[]}><EmployeesManager /></PermissionRoute>} />
                  <Route path="/dashboard/permissions" element={<PermissionRoute requiredPermissions={[]}><PermissionsManager /></PermissionRoute>} />

                  {/* Direct access settings pages (from sidebar) */}
                  <Route path="/dashboard/settings/suppliers" element={<PermissionRoute route="/dashboard/settings/suppliers"><SuppliersPage /></PermissionRoute>} />
                  <Route path="/dashboard/settings/brands" element={<PermissionRoute route="/dashboard/settings/brands"><BrandsPage /></PermissionRoute>} />
                  <Route path="/dashboard/settings/units" element={<PermissionRoute route="/dashboard/settings/units"><UnitsPage /></PermissionRoute>} />
                  <Route path="/dashboard/settings/currencies" element={<PermissionRoute route="/dashboard/settings/currencies"><CurrenciesPage /></PermissionRoute>} />
                  {/* Settings Routes - Nested layout */}
                  <Route path="/dashboard/settings" element={<PermissionRoute route="/dashboard/settings"><SettingsLayout /></PermissionRoute>}>
                    <Route index element={<Settings />} />
                    <Route path="notifications" element={<NotificationsSettings />} />
                    <Route path="payment" element={<PaymentSettings />} />
                    <Route path="payment-options" element={<PaymentOptions />} />
                    <Route path="checkout" element={<CheckoutSettings />} />
                    <Route path="limits" element={<Limits />} />
                    <Route path="domains" element={<DomainsSettings />} />
                    <Route path="suppliers" element={<SupplierSettings />} />
                    <Route path="brands" element={<BrandSettings />} />
                    <Route path="units" element={<UnitSettings />} />
                    <Route path="currencies" element={<CurrencySettings />} />
                    <Route path="users" element={<UsersSettings />} />
                    <Route path="integrations" element={<IntegrationsSettings />} />
                    <Route path="kyc" element={<KycSettings />} />
                    <Route path="billing" element={<BillingSettings />} />
                  </Route>
                  {/* Redirect legacy settings route */}
                  <Route path="/dashboard/store-settings" element={<Settings />} />
                </Route>
                
                {/* Fallback */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            ) : (
              <TenantRouter />
            )}
          </BrowserRouter>
          <ThemeCustomizer />
        </TooltipProvider>
              </NotificationProvider>
              </TabUpdatesProvider>
            </WishlistProvider>
          </CartProvider>
          </StoreSettingsProvider>
        </AuthProvider>
      </QueryClientProvider>
    </DarkModeProvider>
    </>
  );
};

export default App;
