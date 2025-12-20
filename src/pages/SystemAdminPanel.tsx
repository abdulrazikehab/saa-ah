import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Activity, Users, CreditCard, Database, Lock, 
  Globe, Sun, Moon, X, Menu, Search, Bell, LogOut, 
  Layers, Zap, CheckCircle, RefreshCcw, Gift, Handshake, 
  LayoutDashboard, Bot, Fingerprint, Eye, Ban, MapPin, Monitor, Trash2, FileText, ChevronLeft, ChevronRight, Key, UserPlus
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
import UserManagement from './master-dashboard/UserManagement';
import ApiKeyManager from './master-dashboard/ApiKeyManager';

import AiSettingsManager from './master-dashboard/AiSettingsManager';
import { APP_VERSION } from '../version';
import { getAdminApiKeySync, initializeAdminApiKey, clearAdminApiKeyCache } from '@/lib/admin-config';

// Translations
const translations = {
  en: {
    systemAdmin: 'System Admin',
    online: 'Online',
    dashboard: 'Dashboard',
    overview: 'Overview',
    tenants: 'Tenants',
    users: 'Users',
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
    users: 'المستخدمين',
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
  url?: string;
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
  const [errorLogs, setErrorLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [logSubTab, setLogSubTab] = useState<'security' | 'audit' | 'errors' | 'all'>('security');
  const [userFilter, setUserFilter] = useState('');
  // Professional filters
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [actionTypeFilter, setActionTypeFilter] = useState<string>('');
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');
  const [timeFilter, setTimeFilter] = useState<string>(''); // Time filter: last hour, 24h, 7d, 30d, all
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  // User details modal
  const [selectedUserEmail, setSelectedUserEmail] = useState<string | null>(null);
  const [userLogs, setUserLogs] = useState<AuditLog[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'management' | 'overview' | 'tenants' | 'gateways' | 'partners' | 'plans' | 'features' | 'gifts' | 'database' | 'ai' | 'customers' | 'analytics' | 'users' | 'api-keys'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [dbStats, setDbStats] = useState<any>(null);
  const [rateLimitConfig, setRateLimitConfig] = useState<any>(null);
  const [rateLimitStats, setRateLimitStats] = useState<any>(null);
  const [loadingDbStats, setLoadingDbStats] = useState(false);
  const [clearing, setClearing] = useState<string | null>(null);
  const [updatingConfig, setUpdatingConfig] = useState(false);
  const [configForm, setConfigForm] = useState({
    loginMaxAttempts: 100,
    loginWindowMs: 15 * 60 * 1000,
    signupMaxAttempts: 3,
    signupWindowMs: 60 * 60 * 1000,
    passwordResetMaxAttempts: 5,
    passwordResetWindowMs: 60 * 60 * 1000,
  });
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [language, setLanguage] = useState<'en' | 'ar'>('ar');
  const [customerFingerprints, setCustomerFingerprints] = useState<CustomerFingerprint[]>([]);
  const [resetting, setResetting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const t = translations[language];
  const isRTL = language === 'ar';

  // Admin API key - initialized from backend
  const [ADMIN_PASSWORD, setAdminPassword] = useState(getAdminApiKeySync());

  // Initialize admin API key on mount
  useEffect(() => {
    initializeAdminApiKey().then(() => {
      setAdminPassword(getAdminApiKeySync());
    });
  }, []);

  // Normalize any log shape from backend/auth service so UI is robust
  const normalizeLogs = useCallback((raw: any, type: 'security' | 'audit' | 'error') => {
    const list = (raw?.logs) || (raw?.data?.logs) || (raw?.data) || raw || [];
    if (!Array.isArray(list)) return [];
    return list.map((log, index) => {
      const id = log.id || log._id || `${type}-${index}-${log.createdAt || Date.now()}`;
      const severity = log.severity || log.level || (type === 'security' ? 'LOW' : type === 'error' ? 'HIGH' : undefined);
      const action = log.action || log.event || log.type || (type === 'error' ? 'ERROR' : 'UNKNOWN');
      // Handle details from different sources (activityLog uses details object, auditLog uses details string)
      let details = '';
      if (log.details) {
        if (typeof log.details === 'string') {
          details = log.details;
        } else if (typeof log.details === 'object' && log.details.message) {
          details = log.details.message;
        } else if (typeof log.details === 'object') {
          details = JSON.stringify(log.details);
        }
      }
      details = details || log.message || log.description || (log.metadata?.message) || '';
      
      // Extract URL from different sources
      let url = '';
      if (log.details && typeof log.details === 'object' && log.details.url) {
        url = log.details.url;
      } else if (log.metadata) {
        if (typeof log.metadata === 'object' && log.metadata.url) {
          url = log.metadata.url;
        } else if (typeof log.metadata === 'string') {
          try {
            const parsed = JSON.parse(log.metadata);
            if (parsed.url) url = parsed.url;
          } catch (e) {
            // Not JSON, ignore
          }
        }
      }
      // Also check if URL is directly in the action (format: "METHOD /path")
      if (!url && log.action && log.action.includes(' ')) {
        const parts = log.action.split(' ');
        if (parts.length >= 2) {
          url = parts.slice(1).join(' ');
        }
      }
      
      const createdAt = log.createdAt || log.timestamp || new Date().toISOString();
      
      // Handle user info from different sources (activityLog uses actorId, auditLog uses userId)
      const userEmail = log.user?.email || log.userEmail || log.email || (log.metadata?.userEmail);
      const userName = log.user?.name || log.userName || log.name || (log.metadata?.userName);
      
      const tenantName = log.tenant?.name || log.tenantName || log.storeName || log.shopName;
      const resourceType = log.resourceType || log.entity || log.model || (log.metadata?.resourceType) || (type === 'error' ? 'SYSTEM' : '');
      const resourceId = log.resourceId || log.entityId || log.targetId || '';
      return {
        ...log,
        id,
        severity,
        action,
        details,
        url,
        createdAt,
        resourceType,
        resourceId,
        user: userEmail ? { email: userEmail, name: userName } : (log.user || { email: 'System' }),
        tenant: tenantName ? { name: tenantName } : log.tenant,
      } as AuditLog;
    });
  }, []);

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
      const response = await coreApi.get('/admin/master/overview', { requireAuth: true, adminApiKey: ADMIN_PASSWORD });
      setDashboardStats(response);
    } catch (error) {
      // Error logged to backend
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchSystemHealth = useCallback(async () => {
    try {
      const response = await coreApi.get('/admin/master/system-health', { requireAuth: true, adminApiKey: ADMIN_PASSWORD });
      setSystemHealth(response);
    } catch (error) {
      // Error logged to backend
    }
  }, []);

  const fetchSecurityEvents = useCallback(async () => {
    try {
      // Fetch from both auth and core backends
      const authUrl = apiClient.authUrl.endsWith('/auth') ? apiClient.authUrl : `${apiClient.authUrl}/auth`;
      const [authData, coreData] = await Promise.allSettled([
        apiClient.get(`${authUrl}/security-events`, { requireAuth: true, adminApiKey: ADMIN_PASSWORD, timeout: 20000 }),
        coreApi.get('/admin/master/security-events', { requireAuth: true, adminApiKey: ADMIN_PASSWORD, timeout: 20000 }).catch(() => ({ logs: [] })), // Gracefully handle core backend errors
      ]);
      
      const authLogs = authData.status === 'fulfilled' ? normalizeLogs(authData.value, 'security') : [];
      const coreLogs = coreData.status === 'fulfilled' ? normalizeLogs(coreData.value, 'security') : [];
      
      // Merge and deduplicate by id
      const merged = [...authLogs, ...coreLogs].reduce((acc, log) => {
        if (!acc.find(l => l.id === log.id)) {
          acc.push(log);
        }
        return acc;
      }, [] as AuditLog[]).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setSecurityEvents(merged);
      if (logSubTab === 'security') {
        setFilteredLogs(merged);
      }
    } catch (error) {
      // Error logged to backend
      setSecurityEvents([]);
    }
  }, [logSubTab, toast]);

  const fetchErrorLogs = useCallback(async () => {
    try {
      // Fetch all error logs from both auth and core backends (with high limit to get all)
      const authUrl = apiClient.authUrl.endsWith('/auth') ? apiClient.authUrl : `${apiClient.authUrl}/auth`;
      const [authData, coreData] = await Promise.allSettled([
        apiClient.get(`${authUrl}/error-logs?limit=10000`, { requireAuth: true, adminApiKey: ADMIN_PASSWORD, timeout: 20000 }),
        coreApi.get('/admin/master/error-logs?limit=10000', { requireAuth: true, adminApiKey: ADMIN_PASSWORD, timeout: 20000 }).catch(() => ({ logs: [] })),
      ]);
      
      const authLogs = authData.status === 'fulfilled' ? normalizeLogs(authData.value, 'error') : [];
      const coreLogs = coreData.status === 'fulfilled' ? normalizeLogs(coreData.value, 'error') : [];
      
      // Merge and deduplicate by id
      const merged = [...authLogs, ...coreLogs].reduce((acc, log) => {
        if (!acc.find(l => l.id === log.id)) {
          acc.push(log);
        }
        return acc;
      }, [] as AuditLog[]).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setErrorLogs(merged);
      if (logSubTab === 'errors') {
        setFilteredLogs(merged);
      }
    } catch (error) {
      setErrorLogs([]);
    }
  }, [logSubTab, normalizeLogs]);

  const fetchAuditLogs = useCallback(async () => {
    try {
      // Fetch from both auth and core backends
      const authUrl = apiClient.authUrl.endsWith('/auth') ? apiClient.authUrl : `${apiClient.authUrl}/auth`;
      const [authData, coreData] = await Promise.allSettled([
        apiClient.get(`${authUrl}/audit-logs`, { requireAuth: true, adminApiKey: ADMIN_PASSWORD, timeout: 20000 }),
        coreApi.get('/admin/master/audit-logs', { requireAuth: true, adminApiKey: ADMIN_PASSWORD, timeout: 20000 }).catch(() => ({ logs: [] })), // Gracefully handle core backend errors
      ]);
      
      const authLogs = authData.status === 'fulfilled' ? normalizeLogs(authData.value, 'audit') : [];
      const coreLogs = coreData.status === 'fulfilled' ? normalizeLogs(coreData.value, 'audit') : [];
      
      // Merge and deduplicate by id
      const merged = [...authLogs, ...coreLogs].reduce((acc, log) => {
        if (!acc.find(l => l.id === log.id)) {
          acc.push(log);
        }
        return acc;
      }, [] as AuditLog[]).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setAuditLogs(merged);
      if (logSubTab === 'audit') {
        setFilteredLogs(merged);
      }
    } catch (error) {
      // Error logged to backend
      setAuditLogs([]);
    }
  }, [logSubTab, toast]);

  const fetchLogs = useCallback(async () => {
    await Promise.all([fetchSecurityEvents(), fetchAuditLogs(), fetchErrorLogs()]);
  }, [fetchSecurityEvents, fetchAuditLogs, fetchErrorLogs]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchLogs();
      fetchDashboardStats();
      fetchSystemHealth();
      const interval = setInterval(fetchSystemHealth, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchLogs, fetchDashboardStats, fetchSystemHealth]);

  // Fetch database stats and rate limit config when database tab is opened
  useEffect(() => {
    if (isAuthenticated && activeTab === 'database') {
      fetchDbStats();
      fetchRateLimitConfig();
    }
  }, [isAuthenticated, activeTab]);

  // Fetch Customer Fingerprints
  const fetchCustomerFingerprints = useCallback(async () => {
    try {
      const data = await coreApi.get('/admin/master/customers', { requireAuth: true, adminApiKey: ADMIN_PASSWORD });
      setCustomerFingerprints(data);
    } catch (error) {
      // Error logged to backend
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
    let currentLogs: AuditLog[] = [];
    if (logSubTab === 'security') {
      currentLogs = securityEvents;
    } else if (logSubTab === 'audit') {
      currentLogs = auditLogs;
    } else if (logSubTab === 'errors') {
      currentLogs = errorLogs;
    } else if (logSubTab === 'all') {
      // Combine all logs (security events + audit logs + error logs)
      currentLogs = [...securityEvents, ...auditLogs, ...errorLogs].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    setFilteredLogs(currentLogs);
    setSearchTerm('');
    setUserFilter('');
    setCurrentPage(1); // Reset to first page when tab changes
  }, [logSubTab, securityEvents, auditLogs, errorLogs]);

  useEffect(() => {
    let currentLogs: AuditLog[] = [];
    if (logSubTab === 'security') {
      currentLogs = securityEvents;
    } else if (logSubTab === 'audit') {
      currentLogs = auditLogs;
    } else if (logSubTab === 'errors') {
      currentLogs = errorLogs;
    } else if (logSubTab === 'all') {
      currentLogs = [...securityEvents, ...auditLogs, ...errorLogs].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    
    // Apply user filter
    if (userFilter) {
      const lowerUser = userFilter.toLowerCase();
      currentLogs = currentLogs.filter(log => 
        (log.user?.email || '').toLowerCase().includes(lowerUser)
      );
    }
    
    // Apply severity filter
    if (severityFilter) {
      currentLogs = currentLogs.filter(log => log.severity === severityFilter);
    }
    
    // Apply action type filter
    if (actionTypeFilter) {
      currentLogs = currentLogs.filter(log => 
        (log.action || '').toLowerCase().includes(actionTypeFilter.toLowerCase())
      );
    }
    
    // Apply date range filter
    if (dateFromFilter) {
      const fromDate = new Date(dateFromFilter);
      currentLogs = currentLogs.filter(log => new Date(log.createdAt) >= fromDate);
    }
    if (dateToFilter) {
      const toDate = new Date(dateToFilter);
      toDate.setHours(23, 59, 59, 999);
      currentLogs = currentLogs.filter(log => new Date(log.createdAt) <= toDate);
    }
    
    // Apply time filter (last hour, 24h, 7d, 30d)
    if (timeFilter) {
      const now = new Date();
      let cutoffDate: Date;
      switch (timeFilter) {
        case '1h':
          cutoffDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffDate = new Date(0); // All time
      }
      if (timeFilter !== 'all') {
        currentLogs = currentLogs.filter(log => new Date(log.createdAt) >= cutoffDate);
      }
    }
    
    // Apply search filter
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      setFilteredLogs(currentLogs.filter(log => 
        (log.action || '').toLowerCase().includes(lower) || 
        (log.details || '').toLowerCase().includes(lower) ||
        (log.url || '').toLowerCase().includes(lower) ||
        (log.ipAddress || '').includes(lower) ||
        (log.user?.email || '').toLowerCase().includes(lower)
      ));
    } else {
      setFilteredLogs(currentLogs);
    }
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, userFilter, severityFilter, actionTypeFilter, dateFromFilter, dateToFilter, timeFilter, logSubTab, securityEvents, auditLogs, errorLogs]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  // View user details - all activities and errors
  const viewUserDetails = (email: string) => {
    setSelectedUserEmail(email);
    const allLogs = [...securityEvents, ...auditLogs].filter(log => 
      (log.user?.email || '').toLowerCase() === email.toLowerCase()
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setUserLogs(allLogs);
    setShowUserModal(true);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setUserFilter('');
    setSeverityFilter('');
    setActionTypeFilter('');
    setDateFromFilter('');
    setDateToFilter('');
    setTimeFilter('');
  };

  // Get unique action types from logs
  const getActionTypes = () => {
    const actions = new Set<string>();
    [...securityEvents, ...auditLogs].forEach(log => {
      if (log.action) actions.add(log.action);
    });
    return Array.from(actions);
  };

  const fetchDbStats = async () => {
    setLoadingDbStats(true);
    try {
      const baseAuthUrl = apiClient.authUrl.replace(/\/auth$/, '');
      const stats = await apiClient.fetch(`${baseAuthUrl}/admin/stats`, {
        method: 'GET',
        requireAuth: true,
        adminApiKey: ADMIN_PASSWORD,
      });
      setDbStats(stats);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل تحميل إحصائيات قاعدة البيانات' : 'Failed to load database statistics',
      });
    } finally {
      setLoadingDbStats(false);
    }
  };

  const fetchRateLimitConfig = async () => {
    try {
      const baseAuthUrl = apiClient.authUrl.replace(/\/auth$/, '');
      const config = await apiClient.fetch(`${baseAuthUrl}/admin/rate-limit-config`, {
        method: 'GET',
        requireAuth: true,
        adminApiKey: ADMIN_PASSWORD,
      });
      setRateLimitConfig(config);
      // Update form with current config
      if (config.login) {
        setConfigForm({
          loginMaxAttempts: config.login.maxAttempts,
          loginWindowMs: config.login.windowMs,
          signupMaxAttempts: config.signup.maxAttempts,
          signupWindowMs: config.signup.windowMs,
          passwordResetMaxAttempts: config.passwordReset.maxAttempts,
          passwordResetWindowMs: config.passwordReset.windowMs,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل تحميل إعدادات قيود المعدل' : 'Failed to load rate limit configuration',
      });
    }
  };

  const handleUpdateRateLimitConfig = async () => {
    if (!confirm(language === 'ar' 
      ? 'هل أنت متأكد من تحديث إعدادات قيود المعدل؟ سيتم تطبيق التغييرات فوراً.'
      : 'Are you sure you want to update rate limit configuration? Changes will be applied immediately.')) return;

    setUpdatingConfig(true);
    try {
      const result = await apiClient.fetch(`${apiClient.authUrl}/admin/rate-limit-config`, {
        method: 'PUT',
        body: JSON.stringify({
          loginMaxAttempts: configForm.loginMaxAttempts,
          loginWindowMs: configForm.loginWindowMs,
          signupMaxAttempts: configForm.signupMaxAttempts,
          signupWindowMs: configForm.signupWindowMs,
        }),
        requireAuth: true,
        adminApiKey: ADMIN_PASSWORD,
      });
      
      toast({
        title: '✅ Success',
        description: result.message || (language === 'ar' ? 'تم تحديث الإعدادات بنجاح' : 'Configuration updated successfully'),
      });
      fetchRateLimitConfig();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '❌ Error',
        description: error?.message || (language === 'ar' ? 'فشل تحديث الإعدادات' : 'Failed to update configuration'),
      });
    } finally {
      setUpdatingConfig(false);
    }
  };

  const handleClearRateLimits = async (type?: string) => {
    if (!confirm(type 
      ? `Clear rate limits for ${type}?` 
      : 'Clear ALL rate limits? This will remove all rate limiting restrictions.')) return;

    setClearing(type ? `rateLimits-${type}` : 'rateLimits');
    try {
      const url = type 
        ? `${apiClient.authUrl}/admin/clear-rate-limits?type=${type}`
        : `${apiClient.authUrl}/admin/clear-rate-limits`;
      
      const result = await apiClient.fetch(url, {
        method: 'DELETE',
        requireAuth: true,
        adminApiKey: ADMIN_PASSWORD,
      });
      
      toast({
        title: '✅ Success',
        description: result.message || 'Rate limits cleared successfully',
      });
      fetchDbStats();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '❌ Error',
        description: error?.message || 'Failed to clear rate limits',
      });
    } finally {
      setClearing(null);
    }
  };

  const handleClearData = async (type: string) => {
    if (!confirm(`Clear all ${type}? This action cannot be undone.`)) return;
    
    setClearing(type);
    try {
      let url = '';
      let method = 'DELETE';
      
      switch (type) {
        case 'loginAttempts': {
          const baseAuthUrl = apiClient.authUrl.replace(/\/auth$/, '');
          url = `${baseAuthUrl}/admin/clear-login-attempts`;
          break;
        }
        case 'securityEvents': {
          const baseAuthUrl = apiClient.authUrl.replace(/\/auth$/, '');
          url = `${baseAuthUrl}/admin/clear-security-events`;
          break;
        }
        case 'passwordResets': {
          const baseAuthUrl = apiClient.authUrl.replace(/\/auth$/, '');
          url = `${baseAuthUrl}/admin/clear-password-resets`;
          break;
        }
        case 'refreshTokens': {
          const baseAuthUrl = apiClient.authUrl.replace(/\/auth$/, '');
          url = `${baseAuthUrl}/admin/clear-refresh-tokens`;
          break;
        }
        case 'users': {
          const baseAuthUrl = apiClient.authUrl.replace(/\/auth$/, '');
          url = `${baseAuthUrl}/admin/clear-users`;
          break;
        }
        default:
          throw new Error('Unknown clear type');
      }
      
      const result = await apiClient.fetch(url, {
        method,
        requireAuth: true,
        adminApiKey: ADMIN_PASSWORD,
      });
      
      toast({
        title: '✅ Success',
        description: result.message || `Cleared ${type} successfully`,
      });
      fetchDbStats();
      if (type === 'users') {
        fetchDashboardStats();
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '❌ Error',
        description: error?.message || `Failed to clear ${type}`,
      });
    } finally {
      setClearing(null);
    }
  };

  const handleResetDatabase = async () => {
    if (!confirm('ARE YOU SURE? This will delete ALL data. This action cannot be undone.')) return;
    if (!confirm('Really? Last warning!')) return;

    try {
      setResetting(true);
      await coreApi.post('/admin/master/reset-database', {}, { requireAuth: true, adminApiKey: ADMIN_PASSWORD });
      toast({
        title: '✅ Success',
        description: 'Database has been reset successfully',
      });
      // Refresh stats
      fetchDashboardStats();
      fetchSystemHealth();
      fetchDbStats();
    } catch (error) {
      // Error logged to backend
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
    { id: 'users', label: t.users, icon: Users },
    { id: 'plans', label: t.plans, icon: Layers },
    { id: 'features', label: t.features, icon: Zap },
    { id: 'ai', label: t.aiAssistant, icon: Bot },
    { id: 'gifts', label: t.gifts, icon: Gift },
    { id: 'gateways', label: t.gateways, icon: CreditCard },
    { id: 'partners', label: t.partners, icon: Handshake },
    { id: 'api-keys', label: language === 'ar' ? 'مفاتيح API' : 'API Keys', icon: Key },
    { id: 'database', label: t.database, icon: Database },
    { id: 'customers', label: t.customers, icon: Fingerprint },
    { id: 'analytics', label: language === 'ar' ? 'التحليلات' : 'Analytics', icon: Activity },
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
              
              <div className={`mt-4 text-center text-xs ${theme.textDim}`}>
                v{APP_VERSION}
              </div>
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
                    <h2 className={`text-3xl font-bold ${theme.text} mb-2`}>{t.database}</h2>
                    <p className={theme.textMuted}>{language === 'ar' ? 'إدارة قاعدة البيانات وصيانة النظام' : 'Manage system database and perform maintenance'}</p>
                  </div>
                  <button
                    onClick={() => { fetchDbStats(); fetchRateLimitConfig(); }}
                    disabled={loadingDbStats}
                    className={`p-2 ${theme.card} ${theme.border} border rounded-lg ${theme.textMuted} hover:${theme.accentText} transition-colors`}
                  >
                    {loadingDbStats ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <RefreshCcw className="w-5 h-5" />}
                  </button>
                </div>

                {/* Database Statistics */}
                {dbStats && (
                  <div className={`${cardStyle} p-6 rounded-2xl`}>
                    <h3 className={`text-lg font-bold ${theme.text} mb-4`}>{t.dbStats}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-slate-100'} rounded-lg`}>
                        <div className={`text-sm ${theme.textMuted}`}>{language === 'ar' ? 'المستخدمين' : 'Users'}</div>
                        <div className={`text-2xl font-bold ${theme.text}`}>{dbStats.users || 0}</div>
                      </div>
                      <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-slate-100'} rounded-lg`}>
                        <div className={`text-sm ${theme.textMuted}`}>{language === 'ar' ? 'المستأجرين' : 'Tenants'}</div>
                        <div className={`text-2xl font-bold ${theme.text}`}>{dbStats.tenants || 0}</div>
                      </div>
                      <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-slate-100'} rounded-lg`}>
                        <div className={`text-sm ${theme.textMuted}`}>{language === 'ar' ? 'قيود المعدل' : 'Rate Limits'}</div>
                        <div className={`text-2xl font-bold ${theme.text}`}>{dbStats.rateLimits || 0}</div>
                      </div>
                      <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-slate-100'} rounded-lg`}>
                        <div className={`text-sm ${theme.textMuted}`}>{language === 'ar' ? 'محاولات تسجيل الدخول' : 'Login Attempts'}</div>
                        <div className={`text-2xl font-bold ${theme.text}`}>{dbStats.loginAttempts || 0}</div>
                      </div>
                      <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-slate-100'} rounded-lg`}>
                        <div className={`text-sm ${theme.textMuted}`}>{language === 'ar' ? 'أحداث الأمان' : 'Security Events'}</div>
                        <div className={`text-2xl font-bold ${theme.text}`}>{dbStats.securityEvents || 0}</div>
                      </div>
                      <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-slate-100'} rounded-lg`}>
                        <div className={`text-sm ${theme.textMuted}`}>{language === 'ar' ? 'إعادة تعيين كلمة المرور' : 'Password Resets'}</div>
                        <div className={`text-2xl font-bold ${theme.text}`}>{dbStats.passwordResets || 0}</div>
                      </div>
                      <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-slate-100'} rounded-lg`}>
                        <div className={`text-sm ${theme.textMuted}`}>{language === 'ar' ? 'رموز التحديث' : 'Refresh Tokens'}</div>
                        <div className={`text-2xl font-bold ${theme.text}`}>{dbStats.refreshTokens || 0}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rate Limiting Management */}
                <div className={`${cardStyle} p-6 rounded-2xl`}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-lg font-bold ${theme.text}`}>
                      {language === 'ar' ? 'إدارة قيود المعدل' : 'Rate Limiting Management'}
                    </h3>
                    <button
                      onClick={fetchRateLimitConfig}
                      className={`px-3 py-1.5 text-sm ${theme.card} ${theme.border} border rounded-lg ${theme.textMuted} hover:${theme.accentText} transition-colors`}
                    >
                      {language === 'ar' ? 'تحديث' : 'Refresh'}
                    </button>
                  </div>

                  {/* Current Configuration */}
                  {rateLimitConfig && (
                    <div className="mb-6 space-y-4">
                      <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-slate-100'} rounded-lg`}>
                        <h4 className={`font-semibold ${theme.text} mb-4`}>{language === 'ar' ? 'الإعدادات الحالية' : 'Current Configuration'}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <label className={`text-sm ${theme.textMuted}`}>{language === 'ar' ? 'تسجيل الدخول' : 'Login'}</label>
                            <div className={`mt-1 ${theme.text}`}>
                              {rateLimitConfig.login.maxAttempts} {language === 'ar' ? 'محاولة' : 'attempts'} / {Math.floor(rateLimitConfig.login.windowMs / 60000)} {language === 'ar' ? 'دقيقة' : 'min'}
                            </div>
                          </div>
                          <div>
                            <label className={`text-sm ${theme.textMuted}`}>{language === 'ar' ? 'التسجيل' : 'Signup'}</label>
                            <div className={`mt-1 ${theme.text}`}>
                              {rateLimitConfig.signup.maxAttempts} {language === 'ar' ? 'محاولة' : 'attempts'} / {Math.floor(rateLimitConfig.signup.windowMs / 3600000)} {language === 'ar' ? 'ساعة' : 'hour'}
                            </div>
                          </div>
                          <div>
                            <label className={`text-sm ${theme.textMuted}`}>{language === 'ar' ? 'إعادة تعيين كلمة المرور' : 'Password Reset'}</label>
                            <div className={`mt-1 ${theme.text}`}>
                              {rateLimitConfig.passwordReset.maxAttempts} {language === 'ar' ? 'محاولة' : 'attempts'} / {Math.floor(rateLimitConfig.passwordReset.windowMs / 3600000)} {language === 'ar' ? 'ساعة' : 'hour'}
                            </div>
                          </div>
                        </div>
                        
                        {/* Configuration Form */}
                        <div className="border-t border-gray-700 pt-4 mt-4">
                          <h5 className={`font-semibold ${theme.text} mb-3`}>{language === 'ar' ? 'تعديل الإعدادات' : 'Update Configuration'}</h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className={`text-sm ${theme.textMuted} block mb-1`}>{language === 'ar' ? 'تسجيل الدخول - عدد المحاولات' : 'Login - Max Attempts'}</label>
                              <input
                                type="number"
                                min="1"
                                value={configForm.loginMaxAttempts}
                                onChange={(e) => setConfigForm({...configForm, loginMaxAttempts: parseInt(e.target.value) || 1})}
                                className={`w-full ${theme.input} border rounded-lg px-3 py-2 text-sm ${theme.text} focus:outline-none ${theme.focus}`}
                              />
                              <span className={`text-xs ${theme.textMuted} mt-1 block`}>{Math.floor(configForm.loginWindowMs / 60000)} {language === 'ar' ? 'دقيقة' : 'min'} window</span>
                            </div>
                            <div>
                              <label className={`text-sm ${theme.textMuted} block mb-1`}>{language === 'ar' ? 'التسجيل - عدد المحاولات' : 'Signup - Max Attempts'}</label>
                              <input
                                type="number"
                                min="1"
                                value={configForm.signupMaxAttempts}
                                onChange={(e) => setConfigForm({...configForm, signupMaxAttempts: parseInt(e.target.value) || 1})}
                                className={`w-full ${theme.input} border rounded-lg px-3 py-2 text-sm ${theme.text} focus:outline-none ${theme.focus}`}
                              />
                              <span className={`text-xs ${theme.textMuted} mt-1 block`}>{Math.floor(configForm.signupWindowMs / 3600000)} {language === 'ar' ? 'ساعة' : 'hour'} window</span>
                            </div>
                            <div>
                              <label className={`text-sm ${theme.textMuted} block mb-1`}>{language === 'ar' ? 'إعادة تعيين - عدد المحاولات' : 'Password Reset - Max Attempts'}</label>
                              <input
                                type="number"
                                min="1"
                                value={configForm.passwordResetMaxAttempts}
                                onChange={(e) => setConfigForm({...configForm, passwordResetMaxAttempts: parseInt(e.target.value) || 1})}
                                className={`w-full ${theme.input} border rounded-lg px-3 py-2 text-sm ${theme.text} focus:outline-none ${theme.focus}`}
                              />
                              <span className={`text-xs ${theme.textMuted} mt-1 block`}>{Math.floor(configForm.passwordResetWindowMs / 3600000)} {language === 'ar' ? 'ساعة' : 'hour'} window</span>
                            </div>
                          </div>
                          <button
                            onClick={handleUpdateRateLimitConfig}
                            disabled={updatingConfig}
                            className={`mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50`}
                          >
                            {updatingConfig ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            {language === 'ar' ? 'حفظ الإعدادات' : 'Save Configuration'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rate Limit Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <button
                      onClick={() => handleClearRateLimits()}
                      disabled={clearing === 'rateLimits'}
                      className={`p-4 ${theme.card} ${theme.border} border rounded-lg hover:${theme.cardHover} transition-colors text-left disabled:opacity-50`}
                    >
                      <div className="flex items-center gap-3">
                        {clearing === 'rateLimits' ? (
                          <RefreshCcw className="w-5 h-5 animate-spin text-blue-500" />
                        ) : (
                          <RefreshCcw className="w-5 h-5 text-blue-500" />
                        )}
                        <div>
                          <div className={`font-semibold ${theme.text}`}>
                            {language === 'ar' ? 'مسح جميع قيود المعدل' : 'Clear All Rate Limits'}
                          </div>
                          <div className={`text-sm ${theme.textMuted}`}>
                            {language === 'ar' ? 'إزالة جميع قيود المعدل' : 'Remove all rate limiting restrictions'}
                          </div>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleClearRateLimits('LOGIN')}
                      disabled={clearing === 'rateLimits-LOGIN'}
                      className={`p-4 ${theme.card} ${theme.border} border rounded-lg hover:${theme.cardHover} transition-colors text-left disabled:opacity-50`}
                    >
                      <div className="flex items-center gap-3">
                        {clearing === 'rateLimits-LOGIN' ? (
                          <RefreshCcw className="w-5 h-5 animate-spin text-green-500" />
                        ) : (
                          <Lock className="w-5 h-5 text-green-500" />
                        )}
                        <div>
                          <div className={`font-semibold ${theme.text}`}>
                            {language === 'ar' ? 'مسح قيود تسجيل الدخول' : 'Clear Login Rate Limits'}
                          </div>
                          <div className={`text-sm ${theme.textMuted}`}>
                            {language === 'ar' ? 'إزالة قيود تسجيل الدخول فقط' : 'Remove login rate limits only'}
                          </div>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleClearRateLimits('REGISTRATION')}
                      disabled={clearing === 'rateLimits-REGISTRATION'}
                      className={`p-4 ${theme.card} ${theme.border} border rounded-lg hover:${theme.cardHover} transition-colors text-left disabled:opacity-50`}
                    >
                      <div className="flex items-center gap-3">
                        {clearing === 'rateLimits-REGISTRATION' ? (
                          <RefreshCcw className="w-5 h-5 animate-spin text-purple-500" />
                        ) : (
                          <UserPlus className="w-5 h-5 text-purple-500" />
                        )}
                        <div>
                          <div className={`font-semibold ${theme.text}`}>
                            {language === 'ar' ? 'مسح قيود التسجيل' : 'Clear Signup Rate Limits'}
                          </div>
                          <div className={`text-sm ${theme.textMuted}`}>
                            {language === 'ar' ? 'إزالة قيود التسجيل فقط' : 'Remove signup rate limits only'}
                          </div>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleClearRateLimits('PASSWORD_RESET')}
                      disabled={clearing === 'rateLimits-PASSWORD_RESET'}
                      className={`p-4 ${theme.card} ${theme.border} border rounded-lg hover:${theme.cardHover} transition-colors text-left disabled:opacity-50`}
                    >
                      <div className="flex items-center gap-3">
                        {clearing === 'rateLimits-PASSWORD_RESET' ? (
                          <RefreshCcw className="w-5 h-5 animate-spin text-orange-500" />
                        ) : (
                          <Key className="w-5 h-5 text-orange-500" />
                        )}
                        <div>
                          <div className={`font-semibold ${theme.text}`}>
                            {language === 'ar' ? 'مسح قيود إعادة تعيين كلمة المرور' : 'Clear Password Reset Limits'}
                          </div>
                          <div className={`text-sm ${theme.textMuted}`}>
                            {language === 'ar' ? 'إزالة قيود إعادة تعيين كلمة المرور' : 'Remove password reset rate limits'}
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Database Management */}
                <div className={`${cardStyle} p-6 rounded-2xl`}>
                  <h3 className={`text-lg font-bold ${theme.text} mb-4`}>
                    {language === 'ar' ? 'إدارة قاعدة البيانات' : 'Database Management'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => handleClearData('loginAttempts')}
                      disabled={clearing === 'loginAttempts'}
                      className={`p-4 ${theme.card} ${theme.border} border rounded-lg hover:${theme.cardHover} transition-colors text-left disabled:opacity-50`}
                    >
                      <div className="flex items-center gap-3">
                        {clearing === 'loginAttempts' ? (
                          <RefreshCcw className="w-5 h-5 animate-spin text-blue-500" />
                        ) : (
                          <Trash2 className="w-5 h-5 text-blue-500" />
                        )}
                        <div>
                          <div className={`font-semibold ${theme.text}`}>
                            {language === 'ar' ? 'مسح محاولات تسجيل الدخول' : 'Clear Login Attempts'}
                          </div>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleClearData('securityEvents')}
                      disabled={clearing === 'securityEvents'}
                      className={`p-4 ${theme.card} ${theme.border} border rounded-lg hover:${theme.cardHover} transition-colors text-left disabled:opacity-50`}
                    >
                      <div className="flex items-center gap-3">
                        {clearing === 'securityEvents' ? (
                          <RefreshCcw className="w-5 h-5 animate-spin text-red-500" />
                        ) : (
                          <Trash2 className="w-5 h-5 text-red-500" />
                        )}
                        <div>
                          <div className={`font-semibold ${theme.text}`}>
                            {language === 'ar' ? 'مسح أحداث الأمان' : 'Clear Security Events'}
                          </div>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleClearData('passwordResets')}
                      disabled={clearing === 'passwordResets'}
                      className={`p-4 ${theme.card} ${theme.border} border rounded-lg hover:${theme.cardHover} transition-colors text-left disabled:opacity-50`}
                    >
                      <div className="flex items-center gap-3">
                        {clearing === 'passwordResets' ? (
                          <RefreshCcw className="w-5 h-5 animate-spin text-orange-500" />
                        ) : (
                          <Trash2 className="w-5 h-5 text-orange-500" />
                        )}
                        <div>
                          <div className={`font-semibold ${theme.text}`}>
                            {language === 'ar' ? 'مسح طلبات إعادة تعيين كلمة المرور' : 'Clear Password Resets'}
                          </div>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleClearData('refreshTokens')}
                      disabled={clearing === 'refreshTokens'}
                      className={`p-4 ${theme.card} ${theme.border} border rounded-lg hover:${theme.cardHover} transition-colors text-left disabled:opacity-50`}
                    >
                      <div className="flex items-center gap-3">
                        {clearing === 'refreshTokens' ? (
                          <RefreshCcw className="w-5 h-5 animate-spin text-purple-500" />
                        ) : (
                          <Trash2 className="w-5 h-5 text-purple-500" />
                        )}
                        <div>
                          <div className={`font-semibold ${theme.text}`}>
                            {language === 'ar' ? 'مسح رموز التحديث' : 'Clear Refresh Tokens'}
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className={`${cardStyle} p-6 rounded-2xl border border-red-500/20`}>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-red-500/10 rounded-lg">
                      <Trash2 className="w-6 h-6 text-red-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-lg font-bold ${theme.text} mb-2`}>{t.dangerZone}</h3>
                      <p className={`${theme.textMuted} mb-6`}>
                        {t.resetWarning}
                      </p>
                      
                      <div className="space-y-3">
                        <button
                          onClick={() => handleClearData('users')}
                          disabled={clearing === 'users'}
                          className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {clearing === 'users' ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                          {language === 'ar' ? 'مسح جميع المستخدمين' : 'Clear All Users'}
                        </button>
                        <button
                          onClick={handleResetDatabase}
                          disabled={resetting}
                          className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {resetting ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          {t.resetDatabaseAction}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'overview' && <MasterOverview />}
            {activeTab === 'tenants' && <TenantManagement />}
            {activeTab === 'users' && <UserManagement />}
            {activeTab === 'gateways' && <PaymentGatewayManager />}
            {activeTab === 'partners' && <PartnerManager />}
            {activeTab === 'plans' && <PlansManager />}
            {activeTab === 'features' && <FeatureControlManager />}
            {activeTab === 'ai' && <AiSettingsManager />}
            {activeTab === 'gifts' && <UserGiftsManager />}
            {activeTab === 'api-keys' && (
              <div className="space-y-6">
                <ApiKeyManager />
                
                {/* Admin API Key Management */}
                <AdminApiKeySection 
                  adminPassword={ADMIN_PASSWORD}
                  onUpdate={() => {
                    clearAdminApiKeyCache();
                    initializeAdminApiKey().then(() => {
                      setAdminPassword(getAdminApiKeySync());
                      toast({
                        title: language === 'ar' ? 'تم التحديث' : 'Updated',
                        description: language === 'ar' 
                          ? 'تم تحديث مفتاح API بنجاح'
                          : 'API key updated successfully',
                      });
                    });
                  }}
                  theme={theme}
                  language={language}
                  cardStyle={cardStyle}
                />
              </div>
            )}

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
                        (async () => {
                          const authUrl = apiClient.authUrl.endsWith('/auth') ? apiClient.authUrl : `${apiClient.authUrl}/auth`;
                          return apiClient.fetch(`${authUrl}/test-security-event`, { requireAuth: true, adminApiKey: ADMIN_PASSWORD });
                        })()
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
                  <button
                    onClick={() => setLogSubTab('errors')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      logSubTab === 'errors' 
                        ? 'bg-red-500 text-white' 
                        : `${theme.card} ${theme.textMuted} hover:bg-red-500/20`
                    }`}
                  >
                    <Ban className="w-4 h-4 inline-block mr-2" />
                    {language === 'ar' ? 'سجل الأخطاء' : 'Error Logs'}
                    <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                      {errorLogs.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setLogSubTab('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      logSubTab === 'all' 
                        ? 'bg-cyan-500 text-white' 
                        : `${theme.card} ${theme.textMuted} hover:bg-cyan-500/20`
                    }`}
                  >
                    <FileText className="w-4 h-4 inline-block mr-2" />
                    {language === 'ar' ? 'جميع السجلات' : 'All Logs'}
                    <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                      {securityEvents.length + auditLogs.length + errorLogs.length}
                    </span>
                  </button>
                </div>

                <div className={`${cardStyle} rounded-2xl overflow-hidden`}>
                  <div className={`p-4 border-b ${theme.border}`}>
                    <div className="flex gap-4 flex-wrap">
                      {/* Search input */}
                      <div className="relative flex-1 min-w-[200px]">
                        <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textDim}`} />
                        <input
                          type="text"
                          placeholder={t.searchLogs}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className={`w-full ${theme.input} border rounded-lg py-2 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-sm ${theme.text} focus:outline-none ${theme.focus}`}
                        />
                      </div>
                      {/* User filter input */}
                      <div className="relative flex-1 min-w-[200px]">
                        <Users className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textDim}`} />
                        <input
                          type="text"
                          placeholder={language === 'ar' ? 'تصفية حسب المستخدم...' : 'Filter by user email...'}
                          value={userFilter}
                          onChange={(e) => setUserFilter(e.target.value)}
                          className={`w-full ${theme.input} border rounded-lg py-2 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-sm ${theme.text} focus:outline-none ${theme.focus}`}
                        />
                      </div>
                    </div>
                    
                    {/* Professional Filters Row */}
                    <div className="flex gap-3 flex-wrap mt-4 items-center">
                      {/* Severity Filter */}
                      <select
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value)}
                        className={`${theme.input} border rounded-lg py-2 px-3 text-sm ${theme.text} focus:outline-none ${theme.focus} min-w-[140px]`}
                      >
                        <option value="">{language === 'ar' ? 'جميع المستويات' : 'All Severities'}</option>
                        <option value="LOW">{language === 'ar' ? 'منخفض' : 'LOW'}</option>
                        <option value="MEDIUM">{language === 'ar' ? 'متوسط' : 'MEDIUM'}</option>
                        <option value="HIGH">{language === 'ar' ? 'عالي' : 'HIGH'}</option>
                        <option value="CRITICAL">{language === 'ar' ? 'حرج' : 'CRITICAL'}</option>
                      </select>
                      
                      {/* Action Type Filter */}
                      <select
                        value={actionTypeFilter}
                        onChange={(e) => setActionTypeFilter(e.target.value)}
                        className={`${theme.input} border rounded-lg py-2 px-3 text-sm ${theme.text} focus:outline-none ${theme.focus} min-w-[140px]`}
                      >
                        <option value="">{language === 'ar' ? 'جميع الأنواع' : 'All Actions'}</option>
                        {getActionTypes().map((action) => (
                          <option key={action} value={action}>{action}</option>
                        ))}
                      </select>
                      
                      {/* Date From */}
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${theme.textMuted}`}>{language === 'ar' ? 'من:' : 'From:'}</span>
                        <input
                          type="date"
                          value={dateFromFilter}
                          onChange={(e) => setDateFromFilter(e.target.value)}
                          className={`${theme.input} border rounded-lg py-2 px-3 text-sm ${theme.text} focus:outline-none ${theme.focus}`}
                        />
                      </div>
                      
                      {/* Date To */}
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${theme.textMuted}`}>{language === 'ar' ? 'إلى:' : 'To:'}</span>
                        <input
                          type="date"
                          value={dateToFilter}
                          onChange={(e) => setDateToFilter(e.target.value)}
                          className={`${theme.input} border rounded-lg py-2 px-3 text-sm ${theme.text} focus:outline-none ${theme.focus}`}
                        />
                      </div>
                      
                      {/* Time Filter */}
                      <select
                        value={timeFilter}
                        onChange={(e) => setTimeFilter(e.target.value)}
                        className={`${theme.input} border rounded-lg py-2 px-3 text-sm ${theme.text} focus:outline-none ${theme.focus} min-w-[140px]`}
                      >
                        <option value="">{language === 'ar' ? 'جميع الأوقات' : 'All Time'}</option>
                        <option value="1h">{language === 'ar' ? 'آخر ساعة' : 'Last Hour'}</option>
                        <option value="24h">{language === 'ar' ? 'آخر 24 ساعة' : 'Last 24 Hours'}</option>
                        <option value="7d">{language === 'ar' ? 'آخر 7 أيام' : 'Last 7 Days'}</option>
                        <option value="30d">{language === 'ar' ? 'آخر 30 يوم' : 'Last 30 Days'}</option>
                      </select>
                      
                      {/* Clear Filters Button */}
                      <button
                        onClick={clearFilters}
                        className={`px-4 py-2 ${theme.card} ${theme.border} border rounded-lg ${theme.textMuted} hover:bg-red-500/20 hover:text-red-400 transition-colors text-sm flex items-center gap-2`}
                      >
                        <X className="w-4 h-4" />
                        {language === 'ar' ? 'مسح' : 'Clear'}
                      </button>
                      
                      {/* Results count */}
                      <span className={`text-sm ${theme.textMuted} ml-auto`}>
                        {language === 'ar' 
                          ? `${filteredLogs.length} نتيجة`
                          : `${filteredLogs.length} results`}
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left table-auto" style={{ tableLayout: 'auto' }}>
                      <thead className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-slate-50'} ${theme.textMuted}`}>
                        <tr>
                          {logSubTab === 'security' ? (
                            <>
                              <th className="px-2 py-3 font-medium whitespace-nowrap">{t.severity}</th>
                              <th className="px-2 py-3 font-medium min-w-[150px]">{t.action}</th>
                              <th className="px-2 py-3 font-medium whitespace-nowrap">{language === 'ar' ? 'النظام' : 'OS'}</th>
                              <th className="px-2 py-3 font-medium min-w-[120px]">{language === 'ar' ? 'الموقع' : 'Location'}</th>
                              <th className="px-2 py-3 font-medium min-w-[150px]">{t.userIp}</th>
                              <th className="px-2 py-3 font-medium whitespace-nowrap">{t.time}</th>
                              <th className="px-2 py-3 font-medium whitespace-nowrap">{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                            </>
                          ) : (
                            <>
                              <th className="px-2 py-3 font-medium min-w-[150px]">{language === 'ar' ? 'الإجراء' : 'Action'}</th>
                              <th className="px-2 py-3 font-medium min-w-[200px]">{language === 'ar' ? 'الرابط' : 'URL'}</th>
                              <th className="px-2 py-3 font-medium whitespace-nowrap">{language === 'ar' ? 'النوع' : 'Resource'}</th>
                              <th className="px-2 py-3 font-medium min-w-[150px]">{language === 'ar' ? 'المستخدم / العميل' : 'User / Customer'}</th>
                              <th className="px-2 py-3 font-medium min-w-[120px]">{language === 'ar' ? 'المتجر' : 'Tenant'}</th>
                              <th className="px-2 py-3 font-medium whitespace-nowrap">{t.time}</th>
                              <th className="px-2 py-3 font-medium whitespace-nowrap">{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDarkMode ? 'divide-gray-800' : 'divide-gray-200'}`}>
                        {filteredLogs.length === 0 ? (
                          <tr>
                            <td colSpan={logSubTab === 'security' ? 7 : 8} className={`px-6 py-12 text-center ${theme.textMuted}`}>
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
                          paginatedLogs.map((log) => (
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
                              <td className={`px-2 py-4 ${theme.text}`}>
                                <div className="font-medium break-words">{log.action}</div>
                                <div className={`text-xs ${theme.textMuted} break-words line-clamp-2`}>{log.details || '...'}</div>
                              </td>
                              <td className={`px-2 py-4 ${theme.text}`}>
                                <div className="flex items-center gap-1">
                                  <Monitor className="w-3 h-3 flex-shrink-0" />
                                  <span className="text-sm break-words">{typeof log.metadata === 'object' ? log.metadata?.os : 'Unknown'}</span>
                                </div>
                              </td>
                              <td className={`px-2 py-4 ${theme.text}`}>
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 flex-shrink-0" />
                                  <span className="text-sm break-words">
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
                              <td className="px-2 py-4">
                                <div className={`${theme.text} break-words`}>{log.user?.email || t.system}</div>
                                <div className={`text-xs ${theme.textDim} break-words`}>{log.ipAddress}</div>
                              </td>
                              <td className={`px-2 py-4 ${theme.textDim} whitespace-nowrap`}>
                                {new Date(log.createdAt).toLocaleString()}
                              </td>
                              <td className="px-2 py-4">
                                <div className="flex items-center gap-2">
                                  {/* View User Activity Button */}
                                  {log.user?.email && (
                                    <button
                                      onClick={() => viewUserDetails(log.user?.email || '')}
                                      className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 transition-colors"
                                      title={language === 'ar' ? 'عرض نشاط المستخدم' : 'View User Activity'}
                                    >
                                      <Users className="w-4 h-4" />
                                    </button>
                                  )}
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
                          paginatedLogs.map((log) => (
                            <tr key={log.id} className={`${theme.cardHover} transition-colors`}>
                              <td className={`px-2 py-4 ${theme.text}`}>
                                <div className="font-medium break-words">{log.action}</div>
                                <div className={`text-xs ${theme.textMuted} break-words line-clamp-2`}>{log.details || log.resourceType || '—'}</div>
                              </td>
                              <td className={`px-2 py-4 ${theme.text}`}>
                                <code className={`text-xs ${theme.textMuted} break-all font-mono`}>
                                  {log.url || '-'}
                                </code>
                              </td>
                              <td className={`px-2 py-4 ${theme.text}`}>
                                <span className="px-2 py-1 bg-purple-500/10 text-purple-500 rounded text-xs whitespace-nowrap">
                                  {log.resourceType || '-'}
                                </span>
                              </td>
                              <td className={`px-2 py-4 ${theme.text}`}>
                                <div className="font-medium break-words">{log.user?.email || (log as any).userEmail || t.system}</div>
                                <div className={`text-xs ${theme.textDim} break-words`}>{log.user?.name || (log as any).userName || ''}</div>
                              </td>
                              <td className={`px-2 py-4 ${theme.text} break-words`}>
                                {log.tenant?.name || (log as any).tenantName || '-'}
                              </td>
                              <td className={`px-2 py-4 ${theme.textDim} whitespace-nowrap`}>
                                {new Date(log.createdAt).toLocaleString()}
                              </td>
                              <td className="px-2 py-4">
                                <div className="flex items-center gap-2">
                                  {log.user?.email && (
                                    <button
                                      onClick={() => viewUserDetails(log.user?.email || '')}
                                      className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 transition-colors"
                                      title={language === 'ar' ? 'عرض نشاط المستخدم' : 'View User Activity'}
                                    >
                                      <Users className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => toast({ 
                                      title: language === 'ar' ? 'تفاصيل' : 'Details', 
                                      description: log.details 
                                    })}
                                    className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {filteredLogs.length > 0 && (
                    <div className={`p-4 border-t ${theme.border} flex flex-col sm:flex-row items-center justify-between gap-4`}>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${theme.textMuted}`}>
                          {language === 'ar' ? 'عرض' : 'Show'}
                        </span>
                        <select
                          value={itemsPerPage}
                          onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className={`${theme.input} border rounded-lg py-1 px-2 text-sm ${theme.text} focus:outline-none ${theme.focus}`}
                        >
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                        <span className={`text-sm ${theme.textMuted}`}>
                          {language === 'ar' ? 'لكل صفحة' : 'per page'}
                        </span>
                      </div>

                      <div className={`text-sm ${theme.textMuted}`}>
                        {language === 'ar' 
                          ? `صفحة ${currentPage} من ${totalPages} (${filteredLogs.length} ${filteredLogs.length === 1 ? 'نتيجة' : 'نتيجة'})`
                          : `Page ${currentPage} of ${totalPages} (${filteredLogs.length} ${filteredLogs.length === 1 ? 'result' : 'results'})`}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className={`p-2 rounded-lg border ${theme.border} ${
                            currentPage === 1 
                              ? `${theme.textDim} cursor-not-allowed opacity-50` 
                              : `${theme.textMuted} hover:${theme.accentText} hover:border-violet-500`
                          } transition-colors`}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        
                        {/* Page Numbers */}
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                  currentPage === pageNum
                                    ? `${theme.accent} text-white`
                                    : `${theme.card} ${theme.border} border ${theme.textMuted} hover:${theme.accentText}`
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className={`p-2 rounded-lg border ${theme.border} ${
                            currentPage === totalPages 
                              ? `${theme.textDim} cursor-not-allowed opacity-50` 
                              : `${theme.textMuted} hover:${theme.accentText} hover:border-violet-500`
                          } transition-colors`}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className={`text-3xl font-bold ${theme.text}`}>
                    {language === 'ar' ? 'التحليلات' : 'Analytics'}
                  </h2>
                </div>

                {/* Google Analytics Setup */}
                <div className={`${cardStyle} rounded-2xl p-6`}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-orange-500/10 rounded-xl">
                      <Activity className="w-8 h-8 text-orange-500" />
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${theme.text}`}>
                        {language === 'ar' ? 'Google Analytics' : 'Google Analytics'}
                      </h3>
                      <p className={theme.textMuted}>
                        {language === 'ar' ? 'اربط حسابك لعرض إحصائيات المتجر' : 'Connect your account to view store statistics'}
                      </p>
                    </div>
                  </div>

                  <div className={`p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-slate-100'} rounded-xl mb-6`}>
                    <h4 className={`font-medium ${theme.text} mb-4`}>
                      {language === 'ar' ? 'إعداد Google Analytics' : 'Google Analytics Setup'}
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className={`block text-sm ${theme.textMuted} mb-2`}>
                          {language === 'ar' ? 'معرف القياس (Measurement ID)' : 'Measurement ID'}
                        </label>
                        <input
                          type="text"
                          placeholder="G-XXXXXXXXXX"
                          className={`w-full ${theme.input} border rounded-lg py-2 px-4 ${theme.text} focus:outline-none ${theme.focus}`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm ${theme.textMuted} mb-2`}>
                          {language === 'ar' ? 'مفتاح API (اختياري)' : 'API Key (Optional)'}
                        </label>
                        <input
                          type="password"
                          placeholder="••••••••••••"
                          className={`w-full ${theme.input} border rounded-lg py-2 px-4 ${theme.text} focus:outline-none ${theme.focus}`}
                        />
                      </div>
                      <button className="px-6 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all">
                        {language === 'ar' ? 'حفظ الإعدادات' : 'Save Settings'}
                      </button>
                    </div>
                  </div>

                  {/* Analytics Overview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    {[
                      { label: language === 'ar' ? 'الزوار اليوم' : 'Visitors Today', value: '-', icon: Users, color: 'blue' },
                      { label: language === 'ar' ? 'مشاهدات الصفحات' : 'Page Views', value: '-', icon: Eye, color: 'green' },
                      { label: language === 'ar' ? 'معدل الارتداد' : 'Bounce Rate', value: '-', icon: Activity, color: 'yellow' },
                      { label: language === 'ar' ? 'متوسط الجلسة' : 'Avg. Session', value: '-', icon: Monitor, color: 'purple' },
                    ].map((stat, i) => (
                      <div key={i} className={`${isDarkMode ? 'bg-gray-800' : 'bg-slate-100'} p-4 rounded-xl`}>
                        <div className={`p-2 bg-${stat.color}-500/10 rounded-lg w-fit mb-2`}>
                          <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
                        </div>
                        <div className={`text-2xl font-bold ${theme.text}`}>{stat.value}</div>
                        <div className={`text-sm ${theme.textMuted}`}>{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className={`p-8 text-center ${theme.textMuted} ${isDarkMode ? 'bg-gray-800' : 'bg-slate-100'} rounded-xl`}>
                    <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">
                      {language === 'ar' ? 'لم يتم ربط Google Analytics بعد' : 'Google Analytics not connected yet'}
                    </p>
                    <p className={`text-sm mt-2 ${theme.textDim}`}>
                      {language === 'ar' 
                        ? 'أدخل معرف القياس الخاص بك لعرض البيانات' 
                        : 'Enter your Measurement ID to view data'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </main>
      </div>

      {/* User Details Modal */}
      <AnimatePresence>
        {showUserModal && selectedUserEmail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowUserModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`${theme.card} rounded-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden shadow-2xl`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className={`p-6 border-b ${theme.border} flex items-center justify-between`}>
                <div>
                  <h3 className={`text-xl font-bold ${theme.text}`}>
                    {language === 'ar' ? 'نشاط المستخدم' : 'User Activity'}
                  </h3>
                  <p className={`text-sm ${theme.textMuted} mt-1`}>
                    <Users className="w-4 h-4 inline-block mr-2" />
                    {selectedUserEmail}
                  </p>
                </div>
                <button
                  onClick={() => setShowUserModal(false)}
                  className={`p-2 rounded-lg ${theme.cardHover} transition-colors`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Stats Summary */}
              <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-gray-700">
                <div className={`${theme.card} p-4 rounded-xl text-center`}>
                  <div className="text-2xl font-bold text-blue-500">{userLogs.length}</div>
                  <div className={`text-xs ${theme.textMuted}`}>{language === 'ar' ? 'إجمالي السجلات' : 'Total Logs'}</div>
                </div>
                <div className={`${theme.card} p-4 rounded-xl text-center`}>
                  <div className="text-2xl font-bold text-green-500">
                    {userLogs.filter(l => l.severity === 'LOW' || l.severity === 'MEDIUM' || !l.severity).length}
                  </div>
                  <div className={`text-xs ${theme.textMuted}`}>{language === 'ar' ? 'عادي' : 'Normal'}</div>
                </div>
                <div className={`${theme.card} p-4 rounded-xl text-center`}>
                  <div className="text-2xl font-bold text-amber-500">
                    {userLogs.filter(l => l.severity === 'HIGH').length}
                  </div>
                  <div className={`text-xs ${theme.textMuted}`}>{language === 'ar' ? 'تحذيرات' : 'Warnings'}</div>
                </div>
                <div className={`${theme.card} p-4 rounded-xl text-center`}>
                  <div className="text-2xl font-bold text-red-500">
                    {userLogs.filter(l => l.severity === 'CRITICAL').length}
                  </div>
                  <div className={`text-xs ${theme.textMuted}`}>{language === 'ar' ? 'أخطاء' : 'Errors'}</div>
                </div>
              </div>
              
              {/* Logs List */}
              <div className="overflow-y-auto max-h-[50vh] p-4 space-y-3">
                {userLogs.length === 0 ? (
                  <div className={`text-center py-12 ${theme.textMuted}`}>
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{language === 'ar' ? 'لا توجد سجلات لهذا المستخدم' : 'No logs found for this user'}</p>
                  </div>
                ) : (
                  userLogs.map((log) => (
                    <div 
                      key={log.id} 
                      className={`${theme.card} p-4 rounded-xl border ${
                        log.severity === 'CRITICAL' ? 'border-red-500/50 bg-red-500/5' :
                        log.severity === 'HIGH' ? 'border-amber-500/50 bg-amber-500/5' :
                        theme.border
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {log.severity && (
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                log.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                                log.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400' :
                                log.severity === 'MEDIUM' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-green-500/20 text-green-400'
                              }`}>
                                {log.severity}
                              </span>
                            )}
                            <span className={`font-medium ${theme.text}`}>
                              {log.action}
                            </span>
                          </div>
                          <p className={`text-sm ${theme.textMuted}`}>
                            {log.details || '-'}
                          </p>
                          <div className={`flex items-center gap-4 mt-2 text-xs ${theme.textDim}`}>
                            {log.ipAddress && (
                              <span className="flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                {log.ipAddress}
                              </span>
                            )}
                            {typeof log.metadata === 'object' && log.metadata && 'os' in log.metadata && (
                              <span className="flex items-center gap-1">
                                <Monitor className="w-3 h-3" />
                                {(log.metadata as { os: string }).os}
                              </span>
                            )}
                            {typeof log.metadata === 'object' && log.metadata && 'country' in log.metadata && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {(log.metadata as { city?: string; country: string }).city || ''} {(log.metadata as { country: string }).country}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={`text-xs ${theme.textDim} whitespace-nowrap`}>
                          {new Date(log.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Admin API Key Management Component
function AdminApiKeySection({ adminPassword, onUpdate, theme, language, cardStyle }: {
  adminPassword: string;
  onUpdate: () => void;
  theme: any;
  language: 'en' | 'ar';
  cardStyle: string;
}) {
  const [currentApiKey, setCurrentApiKey] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadCurrentApiKey();
  }, []);

  const loadCurrentApiKey = async () => {
    try {
      setFetching(true);
      const response = await coreApi.get('/admin/master/admin-api-key', { 
        requireAuth: true, 
        adminApiKey: adminPassword 
      });
      setCurrentApiKey(response.apiKey || '');
    } catch (error: any) {
      console.error('Failed to load admin API key:', error);
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' 
          ? 'فشل تحميل مفتاح API'
          : 'Failed to load API key',
      });
    } finally {
      setFetching(false);
    }
  };

  const handleUpdate = async () => {
    if (!newApiKey.trim() || newApiKey.trim().length < 8) {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' 
          ? 'يجب أن يكون مفتاح API 8 أحرف على الأقل'
          : 'API key must be at least 8 characters long',
      });
      return;
    }

    try {
      setLoading(true);
      await coreApi.post('/admin/master/admin-api-key', { 
        apiKey: newApiKey.trim() 
      }, { 
        requireAuth: true, 
        adminApiKey: adminPassword 
      });
      
      toast({
        title: language === 'ar' ? 'نجح' : 'Success',
        description: language === 'ar' 
          ? 'تم تحديث مفتاح API بنجاح'
          : 'API key updated successfully',
      });
      
      setNewApiKey('');
      await loadCurrentApiKey();
      onUpdate();
    } catch (error: any) {
      console.error('Failed to update admin API key:', error);
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error?.response?.data?.message || (language === 'ar' 
          ? 'فشل تحديث مفتاح API'
          : 'Failed to update API key'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: language === 'ar' ? 'تم النسخ' : 'Copied',
      description: language === 'ar' 
        ? 'تم نسخ مفتاح API إلى الحافظة'
        : 'API key copied to clipboard',
    });
  };

  return (
    <div className={`${cardStyle} p-6 rounded-2xl border-2 border-violet-500/20`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={`text-xl font-bold ${theme.text} mb-2`}>
            {language === 'ar' ? 'مفتاح API للمدير' : 'Admin API Key'}
          </h3>
          <p className={`text-sm ${theme.textMuted}`}>
            {language === 'ar' 
              ? 'إدارة مفتاح API الرئيسي للنظام. يستخدم هذا المفتاح للوصول إلى لوحة الإدارة.'
              : 'Manage the system admin API key. This key is used to access the admin panel.'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Current API Key */}
        <div>
          <label className={`block text-sm font-medium ${theme.text} mb-2`}>
            {language === 'ar' ? 'مفتاح API الحالي' : 'Current API Key'}
          </label>
          <div className="flex items-center gap-2">
            <input
              type={showCurrent ? 'text' : 'password'}
              value={fetching ? (language === 'ar' ? 'جاري التحميل...' : 'Loading...') : currentApiKey}
              readOnly
              className={`flex-1 px-4 py-2 ${theme.input} border ${theme.border} rounded-lg font-mono text-sm`}
            />
            <button
              onClick={() => setShowCurrent(!showCurrent)}
              className={`p-2 ${theme.card} border ${theme.border} rounded-lg ${theme.textMuted} hover:${theme.accentText}`}
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleCopy(currentApiKey)}
              className={`p-2 ${theme.card} border ${theme.border} rounded-lg ${theme.textMuted} hover:${theme.accentText}`}
            >
              <Key className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* New API Key */}
        <div>
          <label className={`block text-sm font-medium ${theme.text} mb-2`}>
            {language === 'ar' ? 'مفتاح API جديد' : 'New API Key'}
          </label>
          <div className="flex items-center gap-2">
            <input
              type={showNew ? 'text' : 'password'}
              value={newApiKey}
              onChange={(e) => setNewApiKey(e.target.value)}
              placeholder={language === 'ar' ? 'أدخل مفتاح API جديد (8 أحرف على الأقل)' : 'Enter new API key (min 8 characters)'}
              className={`flex-1 px-4 py-2 ${theme.input} border ${theme.border} rounded-lg font-mono text-sm`}
            />
            <button
              onClick={() => setShowNew(!showNew)}
              className={`p-2 ${theme.card} border ${theme.border} rounded-lg ${theme.textMuted} hover:${theme.accentText}`}
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
          <p className={`text-xs ${theme.textMuted} mt-1`}>
            {language === 'ar' 
              ? 'يجب أن يكون المفتاح 8 أحرف على الأقل'
              : 'Key must be at least 8 characters long'}
          </p>
        </div>

        {/* Update Button */}
        <button
          onClick={handleUpdate}
          disabled={loading || !newApiKey.trim()}
          className={`w-full px-4 py-2 ${theme.accent} ${theme.accentHover} text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
        >
          {loading 
            ? (language === 'ar' ? 'جاري التحديث...' : 'Updating...')
            : (language === 'ar' ? 'تحديث مفتاح API' : 'Update API Key')}
        </button>
      </div>
    </div>
  );
}
