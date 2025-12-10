import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Activity, Users, CreditCard, Database, Lock, 
  Globe, Sun, Moon, X, Menu, Search, Bell, LogOut, 
  Layers, Zap, CheckCircle, RefreshCcw, Gift, Handshake, 
  LayoutDashboard, Bot, Fingerprint, Eye, Ban, MapPin, Monitor, Trash2
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { coreApi } from '@/lib/api';
import { apiClient } from '@/services/core/api-client';
import MasterOverview from './master-dashboard/Overview';
import TenantManagement from './master-dashboard/TenantManagement';
import PaymentGatewayManager from './master-dashboard/PaymentGatewayManager';
import PartnerManager from './master-dashboard/PartnerManager';
import PlansManager from './master-dashboard/PlansManager';
import FeatureControlManager from './master-dashboard/FeatureControlManager';
import UserGiftsManager from './master-dashboard/UserGiftsManager';
import AiSettingsManager from './master-dashboard/AiSettingsManager';

// Translations
const translations = {
  en: {
    systemAdmin: 'System Admin',
    online: 'Online',
    dashboard: 'Dashboard',
    overview: 'Overview',
    tenants: 'Tenants',
    plans: 'Plans',
    features: 'Features',
    gifts: 'Gifts',
    gateways: 'Gateways',
    partners: 'Partners',
    securityLogs: 'Security Logs',
    customers: 'Customers',
    logout: 'Logout',
    systemStatus: 'System Status',
    cpuUsage: 'CPU Usage',
    memory: 'Memory',
    uptime: 'Uptime',
    cores: 'Cores',
    ram: 'RAM',
    search: 'Search...',
    searchLogs: 'Search logs...',
    totalTenants: 'Total Tenants',
    activeTenants: 'Active Tenants',
    totalUsers: 'Total Users',
    paymentGateways: 'Payment Gateways',
    totalRevenue: 'Total Revenue',
    platformFees: 'Platform Fees',
    totalTransactions: 'Total Transactions',
    quickActions: 'Quick Actions',
    manageTenants: 'Manage Tenants',
    addEditTenants: 'Add or edit tenants',
    updatePlans: 'Update Plans',
    modifyPlans: 'Modify subscription plans',
    featureControl: 'Feature Control',
    toggleFeatures: 'Toggle global features',
    recentActivity: 'Recent Activity',
    viewAll: 'View All',
    noRecentActivity: 'No recent activity',
    accessGranted: 'Access Granted',
    welcomeAdmin: 'Welcome to System Admin Panel',
    accessDenied: 'Access Denied',
    invalidPassword: 'Invalid password',
    systemAdminAccess: 'System Admin Access',
    restrictedArea: 'Restricted area. Authorized personnel only.',
    enterPassword: 'Enter admin password',
    accessPanel: 'Access Panel',
    severity: 'Severity',
    action: 'Action',
    details: 'Details',
    userIp: 'User/IP',
    time: 'Time',
    system: 'System',
    errorFetchingLogs: 'Error fetching logs',
    couldNotLoadLogs: 'Could not load security logs',
    refresh: 'Refresh',
    database: 'Database',
    testConnection: 'Test Connection',
    dbConnectionSuccess: 'Database connection successful',
    dbConnectionFailed: 'Database connection failed',
    dbStats: 'Database Statistics',
    aiAssistant: 'AI Assistant',
    dangerZone: 'Danger Zone',
    resetWarning: 'Resetting the database will permanently delete all data including users, tenants, orders, and products. This action cannot be undone.',
    resetDatabaseAction: 'Reset Database',
  },
  ar: {
    systemAdmin: 'مدير النظام',
    online: 'متصل',
    dashboard: 'لوحة التحكم',
    overview: 'نظرة عامة',
    tenants: 'المستأجرين',
    plans: 'الخطط',
    features: 'المميزات',
    gifts: 'الهدايا',
    gateways: 'بوابات الدفع',
    partners: 'الشركاء',
    securityLogs: 'سجلات الأمان',
    customers: 'العملاء',
    logout: 'تسجيل الخروج',
    systemStatus: 'حالة النظام',
    cpuUsage: 'استخدام المعالج',
    memory: 'الذاكرة',
    uptime: 'وقت التشغيل',
    cores: 'الأنوية',
    ram: 'الرام',
    search: 'بحث...',
    searchLogs: 'البحث في السجلات...',
    totalTenants: 'إجمالي المستأجرين',
    activeTenants: 'المستأجرين النشطين',
    totalUsers: 'إجمالي المستخدمين',
    paymentGateways: 'بوابات الدفع',
    totalRevenue: 'إجمالي الإيرادات',
    platformFees: 'رسوم المنصة',
    totalTransactions: 'إجمالي المعاملات',
    quickActions: 'إجراءات سريعة',
    manageTenants: 'إدارة المستأجرين',
    addEditTenants: 'إضافة أو تعديل المستأجرين',
    updatePlans: 'تحديث الخطط',
    modifyPlans: 'تعديل خطط الاشتراك',
    featureControl: 'التحكم بالمميزات',
    toggleFeatures: 'تبديل المميزات العامة',
    recentActivity: 'النشاط الأخير',
    viewAll: 'عرض الكل',
    noRecentActivity: 'لا يوجد نشاط حديث',
    accessGranted: 'تم منح الوصول',
    welcomeAdmin: 'مرحباً بك في لوحة مدير النظام',
    accessDenied: 'تم رفض الوصول',
    invalidPassword: 'كلمة مرور غير صحيحة',
    systemAdminAccess: 'الوصول لمدير النظام',
    restrictedArea: 'منطقة محظورة. للمخولين فقط.',
    enterPassword: 'أدخل كلمة مرور المدير',
    accessPanel: 'الدخول للوحة',
    severity: 'الخطورة',
    action: 'الإجراء',
    details: 'التفاصيل',
    userIp: 'المستخدم/IP',
    time: 'الوقت',
    system: 'النظام',
    errorFetchingLogs: 'خطأ في جلب السجلات',
    couldNotLoadLogs: 'تعذر تحميل سجلات الأمان',
    refresh: 'تحديث',
    database: 'قاعدة البيانات',
    testConnection: 'اختبار الاتصال',
    dbConnectionSuccess: 'تم الاتصال بقاعدة البيانات بنجاح',
    dbConnectionFailed: 'فشل الاتصال بقاعدة البيانات',
    dbStats: 'إحصائيات قاعدة البيانات',
    aiAssistant: 'مساعد الذكاء الاصطناعي',
    dangerZone: 'منطقة الخطر',
    resetWarning: 'إعادة تعيين قاعدة البيانات سيؤدي إلى حذف جميع البيانات بما في ذلك المستخدمين والمستأجرين والطلبات والمنتجات بشكل دائم. لا يمكن التراجع عن هذا الإجراء.',
    resetDatabaseAction: 'إعادة تعيين قاعدة البيانات',
  },
};

interface AuditLog {
  id: string;
  action: string;
  details: string;
  ipAddress?: string;
  resourceType?: string;
  resourceId?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: string;
  user?: { email: string; name?: string };
  tenant?: { name: string };
  metadata?: {
    fingerprint?: {
      isVM?: boolean;
      visitorId?: string;
      riskScore?: number;
      components?: Record<string, unknown>;
    };
    isVpn?: boolean;
    os?: string;
    browser?: string;
    device?: string;
    country?: string;
    city?: string;
    isp?: string;
    emails?: string[];
    relatedEmails?: string[];
    [key: string]: unknown;
  } | string;
}

interface CustomerFingerprint {
  id: string;
  email: string;
  role: string;
  tenantName?: string;
  tenantSubdomain?: string;
  os: string;
  browser?: string;
  device?: string;
  isVpn: boolean;
  ipAddress?: string;
  lastLogin?: string;
  location?: string;
}

interface DashboardStats {
  tenants: {
    total: number;
    active: number;
    suspended: number;
    inactive: number;
  };
  transactions: {
    total: number;
    totalRevenue: number;
    platformFees: number;
  };
  activePaymentGateways: number;
  activePartners: number;
  totalUsers: number;
}

interface SystemHealth {
  cpu: { usage: number; cores: number };
  memory: { usage: number; total: number; free: number; used: number };
  uptime: { hours: number; minutes: number; formatted: string };
  database: { tenants: number; users: number; orders: number };
  platform: string;
  hostname: string;
}

export default function SystemAdminPanel() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [securityEvents, setSecurityEvents] = useState<AuditLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [logSubTab, setLogSubTab] = useState<'security' | 'audit'>('security');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'management' | 'overview' | 'tenants' | 'gateways' | 'partners' | 'plans' | 'features' | 'gifts' | 'database' | 'ai' | 'customers'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [language, setLanguage] = useState<'en' | 'ar'>('ar');
  const [customerFingerprints, setCustomerFingerprints] = useState<CustomerFingerprint[]>([]);
  const [resetting, setResetting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const t = translations[language];
  const isRTL = language === 'ar';

  // Secret password
  const ADMIN_PASSWORD = "BlackBox2025Admin!";

  // Check for existing admin session on mount
  useEffect(() => {
    const adminSession = sessionStorage.getItem('systemAdminAuth');
    if (adminSession === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const fetchDashboardStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const response = await coreApi.get('/admin/master/overview', { requireAuth: false, adminApiKey: ADMIN_PASSWORD });
      setDashboardStats(response);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchSystemHealth = useCallback(async () => {
    try {
      const response = await coreApi.get('/admin/master/system-health', { requireAuth: false, adminApiKey: ADMIN_PASSWORD });
      setSystemHealth(response);
    } catch (error) {
      console.error('Failed to fetch system health:', error);
    }
  }, []);

  const fetchSecurityEvents = useCallback(async () => {
    try {
      const data = await coreApi.get('/admin/master/security-events', { requireAuth: false, adminApiKey: ADMIN_PASSWORD });
      if (data.logs) {
        setSecurityEvents(data.logs);
        if (logSubTab === 'security') {
          setFilteredLogs(data.logs);
        }
      } else if (Array.isArray(data)) {
        setSecurityEvents(data);
        if (logSubTab === 'security') {
          setFilteredLogs(data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch security events:', error);
    }
  }, [logSubTab]);

  const fetchAuditLogs = useCallback(async () => {
    try {
      const data = await coreApi.get('/admin/master/audit-logs', { requireAuth: false, adminApiKey: ADMIN_PASSWORD });
      if (data.logs) {
        setAuditLogs(data.logs);
        if (logSubTab === 'audit') {
          setFilteredLogs(data.logs);
        }
      } else if (Array.isArray(data)) {
        setAuditLogs(data);
        if (logSubTab === 'audit') {
          setFilteredLogs(data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    }
  }, [logSubTab]);

  const fetchLogs = useCallback(async () => {
    await Promise.all([fetchSecurityEvents(), fetchAuditLogs()]);
  }, [fetchSecurityEvents, fetchAuditLogs]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchLogs();
      fetchDashboardStats();
      fetchSystemHealth();
      const interval = setInterval(fetchSystemHealth, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchLogs, fetchDashboardStats, fetchSystemHealth]);

  // Fetch Customer Fingerprints
  const fetchCustomerFingerprints = useCallback(async () => {
    try {
      const data = await coreApi.get('/admin/master/customers', { requireAuth: false, adminApiKey: ADMIN_PASSWORD });
      setCustomerFingerprints(data);
    } catch (error) {
      console.error('Failed to fetch customer fingerprints:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load customer data',
      });
    }
  }, [toast]);

  // Load customers when authenticated and tab is customers
  useEffect(() => {
    if (isAuthenticated && activeTab === 'customers') {
      fetchCustomerFingerprints();
    }
  }, [isAuthenticated, activeTab, fetchCustomerFingerprints]);

  // Update filtered logs when sub-tab changes
  useEffect(() => {
    const currentLogs = logSubTab === 'security' ? securityEvents : auditLogs;
    setFilteredLogs(currentLogs);
    setSearchTerm('');
  }, [logSubTab, securityEvents, auditLogs]);

  useEffect(() => {
    const currentLogs = logSubTab === 'security' ? securityEvents : auditLogs;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      setFilteredLogs(currentLogs.filter(log => 
        (log.action || '').toLowerCase().includes(lower) || 
        (log.details || '').toLowerCase().includes(lower) ||
        (log.ipAddress || '').includes(lower) ||
        (log.user?.email || '').toLowerCase().includes(lower)
      ));
    } else {
      setFilteredLogs(currentLogs);
    }
  }, [searchTerm, logSubTab, securityEvents, auditLogs]);

  const handleResetDatabase = async () => {
    if (!confirm('ARE YOU SURE? This will delete ALL data. This action cannot be undone.')) return;
    if (!confirm('Really? Last warning!')) return;

    try {
      setResetting(true);
      await coreApi.post('/admin/master/reset-database', {}, { requireAuth: false, adminApiKey: ADMIN_PASSWORD });
      toast({
        title: '✅ Success',
        description: 'Database has been reset successfully',
      });
      // Refresh stats
      fetchDashboardStats();
      fetchSystemHealth();
    } catch (error) {
      console.error('Failed to reset database:', error);
      toast({
        variant: 'destructive',
        title: '❌ Error',
        description: 'Failed to reset database',
      });
    } finally {
      setResetting(false);
    }
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only check password - no login required for system admin
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      // Store admin session in sessionStorage (not localStorage for security)
      sessionStorage.setItem('systemAdminAuth', 'true');
      toast({
        title: `✅ ${t.accessGranted}`,
        description: t.welcomeAdmin,
      });
    } else {
      toast({
        variant: 'destructive',
        title: `❌ ${t.accessDenied}`,
        description: t.invalidPassword,
      });
    }
  };

  const menuItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'overview', label: t.overview, icon: Activity },
    { id: 'tenants', label: t.tenants, icon: Users },
    { id: 'plans', label: t.plans, icon: Layers },
    { id: 'features', label: t.features, icon: Zap },
    { id: 'ai', label: t.aiAssistant, icon: Bot },
    { id: 'gifts', label: t.gifts, icon: Gift },
    { id: 'gateways', label: t.gateways, icon: CreditCard },
    { id: 'partners', label: t.partners, icon: Handshake },
    { id: 'database', label: t.database, icon: Database },
    { id: 'customers', label: t.customers, icon: Fingerprint },
    { id: 'logs', label: t.securityLogs, icon: Shield },
  ];

  // Theme colors
  const theme = isDarkMode ? {
    bg: 'bg-gray-950',
    bgSecondary: 'bg-gray-900',
    card: 'bg-gray-900',
    cardHover: 'hover:bg-gray-800',
    border: 'border-gray-800',
    text: 'text-white',
    textMuted: 'text-gray-400',
    textDim: 'text-gray-500',
    accent: 'bg-violet-600',
    accentHover: 'hover:bg-violet-700',
    accentText: 'text-violet-400',
    accentBg: 'bg-violet-500/10',
    input: 'bg-gray-950 border-gray-700 text-white placeholder-gray-500',
    focus: 'focus:border-violet-500 focus:ring-1 focus:ring-violet-500',
    sidebar: 'bg-gray-900',
    header: 'bg-gray-900/80',
    divider: 'divide-gray-800',
    scrollbar: 'scrollbar-thumb-gray-700',
  } : {
    bg: 'bg-slate-100',
    bgSecondary: 'bg-white',
    card: 'bg-white',
    cardHover: 'hover:bg-slate-50',
    border: 'border-slate-300',
    text: 'text-slate-900',
    textMuted: 'text-slate-600',
    textDim: 'text-slate-500',
    accent: 'bg-violet-600',
    accentHover: 'hover:bg-violet-700',
    accentText: 'text-violet-600',
    accentBg: 'bg-violet-100',
    input: 'bg-white border-slate-300 text-slate-900 placeholder-slate-400',
    focus: 'focus:border-violet-500 focus:ring-1 focus:ring-violet-500',
    sidebar: 'bg-white',
    header: 'bg-white/90',
    divider: 'divide-slate-200',
    scrollbar: 'scrollbar-thumb-slate-300',
    cardClass: 'bg-white border border-slate-200 shadow-sm',
  };

  // Helper for card classes
  const cardStyle = isDarkMode 
    ? 'bg-gray-900 border border-gray-800 shadow-sm'
    : theme.cardClass;

  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen ${theme.bg} flex items-center justify-center p-4`} dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Language Toggle - Top Right */}
        <div className="fixed top-4 right-4 flex gap-2">
          <button
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className={`p-2 ${theme.card} ${theme.border} border rounded-lg ${theme.textMuted} hover:${theme.accentText} transition-colors`}
          >
            <Globe className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 ${theme.card} ${theme.border} border rounded-lg ${theme.textMuted} hover:${theme.accentText} transition-colors`}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${cardStyle} p-8 rounded-2xl w-full max-w-md shadow-2xl`}
        >
          <div className="flex justify-center mb-8">
            <div className={`p-4 ${theme.accentBg} rounded-full`}>
              <Shield className={`w-12 h-12 ${theme.accentText}`} />
            </div>
          </div>
          <h1 className={`text-2xl font-bold ${theme.text} text-center mb-2`}>{t.systemAdminAccess}</h1>
          <p className={`${theme.textMuted} text-center mb-8`}>{t.restrictedArea}</p>
          
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="relative">
              <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 ${theme.textDim}`} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full ${theme.input} border rounded-lg py-3 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} ${theme.text} focus:outline-none ${theme.focus} transition-colors`}
                placeholder={t.enterPassword}
                autoFocus
              />
            </div>
            <button
              type="submit"
              className={`w-full ${theme.accent} ${theme.accentHover} text-white font-semibold py-3 rounded-lg transition-colors`}
            >
              {t.accessPanel}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} flex overflow-hidden`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <AnimatePresence mode='wait'>
        {isSidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className={`${theme.sidebar} border-${isRTL ? 'l' : 'r'} ${theme.border} flex-shrink-0 flex flex-col h-screen sticky top-0 ${!isDarkMode ? 'shadow-lg' : ''}`}
          >
            <div className={`p-6 border-b ${theme.border} flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 ${theme.accent} rounded-lg`}>
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-lg">{t.systemAdmin}</h1>
                  <div className={`text-xs ${theme.textMuted} flex items-center gap-1`}>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    {t.online}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className={`lg:hidden p-2 ${theme.cardHover} rounded-lg ${theme.textMuted}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as typeof activeTab)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? `${theme.accent} text-white shadow-lg shadow-violet-600/20` 
                        : `${theme.textMuted} ${theme.cardHover} hover:text-white`
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className={`${isRTL ? 'mr-auto' : 'ml-auto'} w-1.5 h-1.5 bg-white rounded-full`}
                      />
                    )}
                  </button>
                );
              })}
            </nav>

            <div className={`p-4 border-t ${theme.border}`}>
              <div className={`${isDarkMode ? 'bg-gray-950' : 'bg-slate-100'} rounded-xl p-4 mb-4 ${!isDarkMode ? 'border border-slate-200' : ''}`}>
                <div className={`text-xs ${theme.textDim} mb-2`}>{t.systemStatus}</div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{t.cpuUsage}</span>
                  <span className={`text-xs ${(systemHealth?.cpu?.usage ?? 0) > 80 ? 'text-red-500' : (systemHealth?.cpu?.usage ?? 0) > 50 ? 'text-yellow-500' : 'text-green-500'}`}>
                    {systemHealth?.cpu?.usage ?? 0}%
                  </span>
                </div>
                <div className={`w-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'} rounded-full h-1.5 mb-3`}>
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-500 ${(systemHealth?.cpu?.usage ?? 0) > 80 ? 'bg-red-500' : (systemHealth?.cpu?.usage ?? 0) > 50 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                    style={{ width: `${systemHealth?.cpu?.usage ?? 0}%` }} 
                  />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{t.memory}</span>
                  <span className={`text-xs ${(systemHealth?.memory?.usage ?? 0) > 80 ? 'text-red-500' : (systemHealth?.memory?.usage ?? 0) > 50 ? 'text-yellow-500' : 'text-green-500'}`}>
                    {systemHealth?.memory?.usage ?? 0}%
                  </span>
                </div>
                <div className={`w-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'} rounded-full h-1.5 mb-3`}>
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-500 ${(systemHealth?.memory?.usage ?? 0) > 80 ? 'bg-red-500' : (systemHealth?.memory?.usage ?? 0) > 50 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                    style={{ width: `${systemHealth?.memory?.usage ?? 0}%` }} 
                  />
                </div>
                <div className={`text-xs ${theme.textDim} mt-3 pt-3 border-t ${theme.border}`}>
                  <div className="flex justify-between">
                    <span>{t.uptime}</span>
                    <span className={theme.textMuted}>{systemHealth?.uptime?.formatted ?? '...'}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>{t.cores}</span>
                    <span className={theme.textMuted}>{systemHealth?.cpu?.cores ?? 0}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>{t.ram}</span>
                    <span className={theme.textMuted}>{systemHealth?.memory?.used ?? 0}GB / {systemHealth?.memory?.total ?? 0}GB</span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => {
                  setIsAuthenticated(false);
                  setPassword('');
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 ${theme.textMuted} ${theme.cardHover} hover:text-white rounded-xl transition-colors`}
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">{t.logout}</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Bar */}
        <header className={`h-16 ${theme.header} backdrop-blur-md border-b ${theme.border} flex items-center justify-between px-6 sticky top-0 z-10 ${!isDarkMode ? 'shadow-sm' : ''}`}>
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className={`p-2 ${theme.cardHover} rounded-lg ${theme.textMuted}`}
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <h2 className={`text-xl font-bold ${theme.text}`}>
              {menuItems.find(item => item.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textDim}`} />
              <input
                type="text"
                placeholder={t.search}
                className={`${theme.input} border rounded-full py-2 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-sm ${theme.text} focus:outline-none ${theme.focus} w-64`}
              />
            </div>
            
            {/* Language Toggle */}
            <button 
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className={`p-2 ${theme.cardHover} rounded-full ${theme.textMuted} flex items-center gap-1`}
            >
              <Globe className="w-5 h-5" />
              <span className="text-xs font-medium">{language.toUpperCase()}</span>
            </button>

            {/* Dark Mode Toggle */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 ${theme.cardHover} rounded-full ${theme.textMuted}`}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button className={`p-2 ${theme.cardHover} rounded-full ${theme.textMuted} relative`}>
              <Bell className="w-5 h-5" />
              <span className={`absolute top-1.5 ${isRTL ? 'left-1.5' : 'right-1.5'} w-2 h-2 bg-violet-500 rounded-full border-2 ${isDarkMode ? 'border-gray-900' : 'border-white'}`} />
            </button>
            <div className={`w-8 h-8 ${theme.accent} rounded-full flex items-center justify-center text-white font-bold`}>
              A
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto"
          >
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: t.totalTenants, value: dashboardStats?.tenants?.total ?? 0, icon: Users, bgColor: 'bg-blue-500/10', textColor: 'text-blue-500' },
                    { label: t.activeTenants, value: dashboardStats?.tenants?.active ?? 0, icon: CheckCircle, bgColor: 'bg-green-500/10', textColor: 'text-green-500' },
                    { label: t.totalUsers, value: dashboardStats?.totalUsers ?? 0, icon: Users, bgColor: 'bg-purple-500/10', textColor: 'text-purple-500' },
                    { label: t.paymentGateways, value: dashboardStats?.activePaymentGateways ?? 0, icon: CreditCard, bgColor: 'bg-amber-500/10', textColor: 'text-amber-500' },
                  ].map((stat, i) => (
                    <div key={i} className={`${cardStyle} p-6 rounded-2xl`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                          <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                        </div>
                      </div>
                      <h3 className={`text-2xl font-bold ${theme.text} mb-1`}>
                        {statsLoading ? '...' : stat.value.toLocaleString()}
                      </h3>
                      <p className={`text-sm ${theme.textMuted}`}>{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Additional Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className={`${cardStyle} p-6 rounded-2xl`}>
                    <h4 className={`text-sm ${theme.textMuted} mb-2`}>{t.totalRevenue}</h4>
                    <p className="text-3xl font-bold text-green-500">
                      ${statsLoading ? '...' : (dashboardStats?.transactions?.totalRevenue ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div className={`${cardStyle} p-6 rounded-2xl`}>
                    <h4 className={`text-sm ${theme.textMuted} mb-2`}>{t.platformFees}</h4>
                    <p className="text-3xl font-bold text-purple-500">
                      ${statsLoading ? '...' : (dashboardStats?.transactions?.platformFees ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div className={`${cardStyle} p-6 rounded-2xl`}>
                    <h4 className={`text-sm ${theme.textMuted} mb-2`}>{t.totalTransactions}</h4>
                    <p className="text-3xl font-bold text-blue-500">
                      {statsLoading ? '...' : (dashboardStats?.transactions?.total ?? 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Quick Actions */}
                  <div className={`${cardStyle} rounded-2xl p-6`}>
                    <h3 className={`text-lg font-bold ${theme.text} mb-4`}>{t.quickActions}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => setActiveTab('tenants')}
                        className={`p-4 ${theme.bg} border ${theme.border} rounded-xl hover:border-violet-500/50 transition-colors text-${isRTL ? 'right' : 'left'}`}
                      >
                        <Users className="w-6 h-6 text-purple-500 mb-2" />
                        <div className={`font-medium ${theme.text}`}>{t.manageTenants}</div>
                        <div className={`text-xs ${theme.textMuted}`}>{t.addEditTenants}</div>
                      </button>
                      <button 
                        onClick={() => setActiveTab('plans')}
                        className={`p-4 ${theme.bg} border ${theme.border} rounded-xl hover:border-violet-500/50 transition-colors text-${isRTL ? 'right' : 'left'}`}
                      >
                        <Layers className="w-6 h-6 text-blue-500 mb-2" />
                        <div className={`font-medium ${theme.text}`}>{t.updatePlans}</div>
                        <div className={`text-xs ${theme.textMuted}`}>{t.modifyPlans}</div>
                      </button>
                      <button 
                        onClick={() => setActiveTab('features')}
                        className={`p-4 ${theme.bg} border ${theme.border} rounded-xl hover:border-violet-500/50 transition-colors text-${isRTL ? 'right' : 'left'}`}
                      >
                        <Zap className="w-6 h-6 text-yellow-500 mb-2" />
                        <div className={`font-medium ${theme.text}`}>{t.featureControl}</div>
                        <div className={`text-xs ${theme.textMuted}`}>{t.toggleFeatures}</div>
                      </button>
                    </div>
                  </div>

                  {/* Recent Logs */}
                  <div className={`${cardStyle} rounded-2xl overflow-hidden`}>
                    <div className={`p-6 border-b ${theme.border} flex items-center justify-between`}>
                      <h3 className={`text-lg font-bold ${theme.text}`}>{t.recentActivity}</h3>
                      <button onClick={() => setActiveTab('logs')} className="text-sm text-violet-400 hover:text-violet-300">{t.viewAll}</button>
                    </div>
                    <div className={`divide-y ${isDarkMode ? 'divide-gray-800' : 'divide-gray-200'}`}>
                      {logs.slice(0, 20).map((log) => (
                        <div key={log.id} className={`p-4 flex items-center justify-between ${theme.cardHover} transition-colors`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-2 h-2 rounded-full ${
                              log.severity === 'CRITICAL' ? 'bg-red-500' :
                              log.severity === 'HIGH' ? 'bg-orange-500' :
                              log.severity === 'MEDIUM' ? 'bg-yellow-500' : 'bg-blue-500'
                            }`} />
                            <div>
                              <div className={`text-sm font-medium ${theme.text}`}>{log.action}</div>
                              <div className={`text-xs ${theme.textMuted}`}>{log.details}</div>
                            </div>
                          </div>
                          <div className={`text-xs ${theme.textDim}`}>
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      ))}
                      {logs.length === 0 && (
                        <div className={`p-8 text-center ${theme.textDim}`}>{t.noRecentActivity}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'database' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">{t.database}</h2>
                    <p className="text-gray-400">Manage system database and perform maintenance</p>
                  </div>
                </div>

                <div className={`${cardStyle} p-6 rounded-2xl border border-red-500/20`}>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-red-500/10 rounded-lg">
                      <Trash2 className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                      <h3 className={`text-lg font-bold ${theme.text} mb-2`}>{t.dangerZone}</h3>
                      <p className={`${theme.textMuted} mb-6`}>
                        {t.resetWarning}
                      </p>
                      
                      <button
                        onClick={handleResetDatabase}
                        disabled={resetting}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                      >
                        {resetting ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        {t.resetDatabaseAction}
                      </button>
                    </div>
                  </div>
                </div>

                <div className={`${cardStyle} p-6 rounded-2xl`}>
                   <h3 className={`text-lg font-bold ${theme.text} mb-4`}>{t.dbStats}</h3>
                   <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-slate-800 rounded-lg">
                        <div className="text-sm text-gray-400">Total Tenants</div>
                        <div className="text-2xl font-bold text-white">{systemHealth?.database?.tenants || 0}</div>
                      </div>
                      <div className="p-4 bg-slate-800 rounded-lg">
                        <div className="text-sm text-gray-400">Total Users</div>
                        <div className="text-2xl font-bold text-white">{systemHealth?.database?.users || 0}</div>
                      </div>
                      <div className="p-4 bg-slate-800 rounded-lg">
                        <div className="text-sm text-gray-400">Total Orders</div>
                        <div className="text-2xl font-bold text-white">{systemHealth?.database?.orders || 0}</div>
                      </div>
                   </div>
                </div>
              </div>
            )}
            {activeTab === 'overview' && <MasterOverview />}
            {activeTab === 'tenants' && <TenantManagement />}
            {activeTab === 'gateways' && <PaymentGatewayManager />}
            {activeTab === 'partners' && <PartnerManager />}
            {activeTab === 'plans' && <PlansManager />}
            {activeTab === 'features' && <FeatureControlManager />}
            {activeTab === 'ai' && <AiSettingsManager />}
            {activeTab === 'gifts' && <UserGiftsManager />}

            {activeTab === 'customers' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className={`text-3xl font-bold ${theme.text}`}>{t.customers}</h2>
                  <button 
                    onClick={fetchCustomerFingerprints}
                    className={`p-2 ${theme.card} ${theme.border} border rounded-lg ${theme.textMuted} hover:${theme.accentText} transition-colors`}
                  >
                    <RefreshCcw className="w-5 h-5" />
                  </button>
                </div>

                <div className={`${cardStyle} rounded-2xl overflow-hidden`}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className={`${theme.bg} ${theme.textMuted}`}>
                        <tr>
                          <th className={`p-4 text-${isRTL ? 'right' : 'left'} font-medium`}>{language === 'ar' ? 'العميل' : 'Customer'}</th>
                          <th className={`p-4 text-${isRTL ? 'right' : 'left'} font-medium`}>{language === 'ar' ? 'المتجر' : 'Store'}</th>
                          <th className={`p-4 text-${isRTL ? 'right' : 'left'} font-medium`}>{language === 'ar' ? 'النظام / المتصفح' : 'OS / Browser'}</th>
                          <th className={`p-4 text-${isRTL ? 'right' : 'left'} font-medium`}>{language === 'ar' ? 'الموقع' : 'Location'}</th>
                          <th className={`p-4 text-${isRTL ? 'right' : 'left'} font-medium`}>VPN</th>
                          <th className={`p-4 text-${isRTL ? 'right' : 'left'} font-medium`}>IP</th>
                          <th className={`p-4 text-${isRTL ? 'right' : 'left'} font-medium`}>{language === 'ar' ? 'آخر دخول' : 'Last Login'}</th>
                          <th className={`p-4 text-${isRTL ? 'right' : 'left'} font-medium`}>{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDarkMode ? 'divide-gray-800' : 'divide-gray-200'}`}>
                        {customerFingerprints.map((customer) => (
                          <tr key={customer.id} className={theme.cardHover}>
                            <td className={`p-4 ${theme.text}`}>
                              <div className="font-medium">{customer.email}</div>
                              <div className={`text-xs ${theme.textMuted}`}>{customer.role}</div>
                            </td>
                            <td className={`p-4 ${theme.text}`}>
                              {customer.tenantName ? (
                                <div>
                                  <div className="font-medium">{customer.tenantName}</div>
                                  <div className={`text-xs ${theme.textMuted}`}>{customer.tenantSubdomain}</div>
                                </div>
                              ) : (
                                <span className={theme.textMuted}>-</span>
                              )}
                            </td>
                            <td className={`p-4 ${theme.text}`}>
                              <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium">{customer.os || 'Unknown'}</span>
                                <span className={`text-xs ${theme.textMuted}`}>{customer.browser || '-'}</span>
                              </div>
                            </td>
                            <td className={`p-4 ${theme.text}`}>
                              <div className="flex items-center gap-2">
                                {customer.location && customer.location !== '-' ? (
                                  <span className="text-sm">{customer.location}</span>
                                ) : (
                                  <span className={`text-sm ${theme.textMuted}`}>-</span>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              {customer.isVpn ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                  VPN
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                  Clean
                                </span>
                              )}
                            </td>
                            <td className={`p-4 ${theme.textMuted} text-sm`}>
                              {customer.ipAddress || '-'}
                            </td>
                            <td className={`p-4 ${theme.textMuted} text-sm`}>
                              {customer.lastLogin ? new Date(customer.lastLogin).toLocaleString() : '-'}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => toast({ title: language === 'ar' ? 'عرض التفاصيل' : 'View Details', description: `${customer.email}` })}
                                  className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors"
                                  title={language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => toast({ title: language === 'ar' ? 'حظر المستخدم' : 'Block User', description: `${customer.email}`, variant: 'destructive' })}
                                  className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                                  title={language === 'ar' ? 'حظر' : 'Block'}
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {customerFingerprints.length === 0 && (
                    <div className={`p-12 text-center ${theme.textMuted}`}>
                      <Fingerprint className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>{language === 'ar' ? 'لا توجد بيانات بصمات العملاء' : 'No customer fingerprint data'}</p>
                      <p className={`text-sm mt-2 ${theme.textDim}`}>
                        {language === 'ar' ? 'سيتم عرض البيانات عند تسجيل دخول العملاء' : 'Data will appear when customers log in'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'logs' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className={`text-3xl font-bold ${theme.text}`}>{t.securityLogs}</h2>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        apiClient.fetch(`${apiClient.authUrl}/auth/test-security-event`, { requireAuth: false, adminApiKey: ADMIN_PASSWORD })
                          .then(data => {
                            toast({ title: language === 'ar' ? 'تم إنشاء حدث اختبار' : 'Test event created', description: data.message });
                            fetchLogs();
                          })
                          .catch(() => toast({ variant: 'destructive', title: 'Error' }));
                      }}
                      className={`px-3 py-2 ${theme.card} ${theme.border} border rounded-lg ${theme.textMuted} hover:${theme.accentText} transition-colors text-sm`}
                    >
                      {language === 'ar' ? 'إضافة حدث اختبار' : 'Add Test Event'}
                    </button>
                    <button 
                      onClick={fetchLogs}
                      className={`p-2 ${theme.card} ${theme.border} border rounded-lg ${theme.textMuted} hover:${theme.accentText} transition-colors`}
                    >
                      <RefreshCcw className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Sub-tabs for Security Events and Audit Logs */}
                <div className="flex gap-2 border-b border-gray-700 pb-4">
                  <button
                    onClick={() => setLogSubTab('security')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      logSubTab === 'security' 
                        ? 'bg-blue-500 text-white' 
                        : `${theme.card} ${theme.textMuted} hover:bg-blue-500/20`
                    }`}
                  >
                    <Shield className="w-4 h-4 inline-block mr-2" />
                    {language === 'ar' ? 'أحداث الأمان' : 'Security Events'}
                    <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">{securityEvents.length}</span>
                  </button>
                  <button
                    onClick={() => setLogSubTab('audit')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      logSubTab === 'audit' 
                        ? 'bg-purple-500 text-white' 
                        : `${theme.card} ${theme.textMuted} hover:bg-purple-500/20`
                    }`}
                  >
                    <Activity className="w-4 h-4 inline-block mr-2" />
                    {language === 'ar' ? 'سجلات التدقيق' : 'Audit Logs'}
                    <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">{auditLogs.length}</span>
                  </button>
                </div>

                <div className={`${cardStyle} rounded-2xl overflow-hidden`}>
                  <div className={`p-4 border-b ${theme.border}`}>
                    <div className="relative">
                      <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textDim}`} />
                      <input
                        type="text"
                        placeholder={t.searchLogs}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full ${theme.input} border rounded-lg py-2 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-sm ${theme.text} focus:outline-none ${theme.focus}`}
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-slate-50'} ${theme.textMuted}`}>
                        <tr>
                          {logSubTab === 'security' ? (
                            <>
                              <th className="px-4 py-3 font-medium">{t.severity}</th>
                              <th className="px-4 py-3 font-medium">{t.action}</th>
                              <th className="px-4 py-3 font-medium">{language === 'ar' ? 'النظام' : 'OS'}</th>
                              <th className="px-4 py-3 font-medium">{language === 'ar' ? 'الموقع' : 'Location'}</th>
                              <th className="px-4 py-3 font-medium">{t.userIp}</th>
                              <th className="px-4 py-3 font-medium">{t.time}</th>
                              <th className="px-4 py-3 font-medium">{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                            </>
                          ) : (
                            <>
                              <th className="px-4 py-3 font-medium">{language === 'ar' ? 'الإجراء' : 'Action'}</th>
                              <th className="px-4 py-3 font-medium">{language === 'ar' ? 'النوع' : 'Resource'}</th>
                              <th className="px-4 py-3 font-medium">{language === 'ar' ? 'المستخدم' : 'User'}</th>
                              <th className="px-4 py-3 font-medium">{language === 'ar' ? 'المتجر' : 'Tenant'}</th>
                              <th className="px-4 py-3 font-medium">{t.time}</th>
                              <th className="px-4 py-3 font-medium">{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDarkMode ? 'divide-gray-800' : 'divide-gray-200'}`}>
                        {filteredLogs.length === 0 ? (
                          <tr>
                            <td colSpan={7} className={`px-6 py-12 text-center ${theme.textMuted}`}>
                              {logSubTab === 'security' ? (
                                <>
                                  <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                  <p>{language === 'ar' ? 'لا توجد أحداث أمان' : 'No security events found'}</p>
                                  <p className={`text-sm mt-2 ${theme.textDim}`}>
                                    {language === 'ar' ? 'انقر على "إضافة حدث اختبار" لإنشاء سجل' : 'Click "Add Test Event" to create a log'}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                  <p>{language === 'ar' ? 'لا توجد سجلات تدقيق' : 'No audit logs found'}</p>
                                  <p className={`text-sm mt-2 ${theme.textDim}`}>
                                    {language === 'ar' ? 'ستظهر السجلات عند إجراء تغييرات في النظام' : 'Logs will appear when changes are made'}
                                  </p>
                                </>
                              )}
                            </td>
                          </tr>
                        ) : logSubTab === 'security' ? (
                          filteredLogs.map((log) => (
                            <tr key={log.id} className={`${theme.cardHover} transition-colors`}>
                              <td className="px-4 py-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  log.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-500' :
                                  log.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-500' :
                                  log.severity === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-500' :
                                  'bg-blue-500/10 text-blue-500'
                                }`}>
                                  {log.severity}
                                </span>
                              </td>
                              <td className={`px-4 py-4 ${theme.text}`}>
                                <div className="font-medium">{log.action}</div>
                                <div className={`text-xs ${theme.textMuted} max-w-xs truncate`}>{log.details}</div>
                              </td>
                              <td className={`px-4 py-4 ${theme.text}`}>
                                <div className="flex items-center gap-1">
                                  <Monitor className="w-3 h-3" />
                                  <span className="text-sm">{typeof log.metadata === 'object' ? log.metadata?.os : 'Unknown'}</span>
                                </div>
                              </td>
                              <td className={`px-4 py-4 ${theme.text}`}>
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  <span className="text-sm">
                                    {typeof log.metadata === 'object' && log.metadata?.city && log.metadata?.country 
                                      ? `${log.metadata.city}, ${log.metadata.country}` 
                                      : typeof log.metadata === 'object' ? log.metadata?.country || '-' : '-'}
                                  </span>
                                </div>
                                {typeof log.metadata === 'object' && log.metadata?.isVpn && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 mt-1">
                                    VPN
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-4">
                                <div className={theme.text}>{log.user?.email || t.system}</div>
                                <div className={`text-xs ${theme.textDim}`}>{log.ipAddress}</div>
                              </td>
                              <td className={`px-4 py-4 ${theme.textDim}`}>
                                {new Date(log.createdAt).toLocaleString()}
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => toast({ 
                                      title: language === 'ar' ? 'تفاصيل الحدث' : 'Event Details', 
                                      description: `${log.action}: ${log.details}` 
                                    })}
                                    className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors"
                                    title={language === 'ar' ? 'عرض' : 'View'}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => toast({ 
                                      variant: 'destructive',
                                      title: language === 'ar' ? 'حذف' : 'Delete', 
                                      description: `ID: ${log.id}` 
                                    })}
                                    className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                                    title={language === 'ar' ? 'حذف' : 'Delete'}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          filteredLogs.map((log) => (
                            <tr key={log.id} className={`${theme.cardHover} transition-colors`}>
                              <td className={`px-4 py-4 ${theme.text}`}>
                                <div className="font-medium">{log.action}</div>
                              </td>
                              <td className={`px-4 py-4 ${theme.text}`}>
                                <span className="px-2 py-1 bg-purple-500/10 text-purple-500 rounded text-xs">
                                  {log.resourceType || '-'}
                                </span>
                              </td>
                              <td className={`px-4 py-4 ${theme.text}`}>
                                {log.user?.email || t.system}
                              </td>
                              <td className={`px-4 py-4 ${theme.text}`}>
                                {log.tenant?.name || '-'}
                              </td>
                              <td className={`px-4 py-4 ${theme.textDim}`}>
                                {new Date(log.createdAt).toLocaleString()}
                              </td>
                              <td className="px-4 py-4">
                                <button
                                  onClick={() => toast({ 
                                    title: language === 'ar' ? 'تفاصيل' : 'Details', 
                                    description: log.details 
                                  })}
                                  className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
