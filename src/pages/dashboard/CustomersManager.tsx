import { useEffect, useState, useCallback } from 'react';
import { Users, UserPlus, Search, Filter, Download, Award, TrendingUp, Mail, Phone, Upload, MoreHorizontal, Edit, Trash2, Key, Copy, Check, Info, DollarSign, LogOut, MailX, MailCheck, Eye, X, Loader2 } from 'lucide-react';
import { read, utils, writeFile } from 'xlsx';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { coreApi } from '@/lib/api';
import { walletService } from '@/services/wallet.service';
import { tenantService } from '@/services/tenant.service';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import { useAuth } from '@/contexts/AuthContext';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  totalOrders: number;
  totalSpent: number;
  loyaltyPoints: number;
  loyaltyTier: string;
  createdAt: string;
  lastOrderDate?: string;
  firstName?: string;
  lastName?: string;
  metadata?: string;
  emailDisabled?: boolean;
}

interface LoyaltyProgram {
  id: string;
  name: string;
  description: string;
  members: number;
  minPoints: number;
  benefits: string[];
}

interface StoreSettings {
  isPrivateStore: boolean;
  allowGuestCheckout: boolean;
  [key: string]: unknown;
}

interface JoinRequest {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  storeName?: string;
  companyName?: string;
  activity?: string;
  city?: string;
  country?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  rejectionReason?: string;
}

export default function CustomersManager() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { settings } = useStoreSettings();
  const { user } = useAuth();
  const isRTL = i18n.language === 'ar';
  
  const [languageKey, setLanguageKey] = useState(i18n.language);
  
  useEffect(() => {
    const handleLanguageChange = () => setLanguageKey(i18n.language);
    i18n.on('languageChanged', handleLanguageChange);
    return () => i18n.off('languageChanged', handleLanguageChange);
  }, [i18n]);
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loyaltyPrograms, setLoyaltyPrograms] = useState<LoyaltyProgram[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  
  const [showProgramSheet, setShowProgramSheet] = useState(false);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const [editingProgram, setEditingProgram] = useState<LoyaltyProgram | null>(null);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  
  const [programForm, setProgramForm] = useState({
    name: '',
    description: '',
    minPoints: 0,
    benefits: ''
  });
  
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState<string | null>(null);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [passwordCopied, setPasswordCopied] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [showChargeDialog, setShowChargeDialog] = useState(false);
  const [chargeType, setChargeType] = useState<'charge' | 'recharge'>('charge');
  const [chargeAmount, setChargeAmount] = useState('');
  const [chargeDescription, setChargeDescription] = useState('');
  const [isCharging, setIsCharging] = useState(false);

  // Join requests state
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [loadingJoinRequests, setLoadingJoinRequests] = useState(false);
  const [processingJoinRequest, setProcessingJoinRequest] = useState<string | null>(null);
  const [showJoinRequestRejectDialog, setShowJoinRequestRejectDialog] = useState(false);
  const [selectedJoinRequest, setSelectedJoinRequest] = useState<JoinRequest | null>(null);
  const [joinRequestRejectReason, setJoinRequestRejectReason] = useState('');
  const [showJoinRequestDetails, setShowJoinRequestDetails] = useState(false);
  const [isSavingJoinRequest, setIsSavingJoinRequest] = useState(false);
  const [joinRequestForm, setJoinRequestForm] = useState({
    fullName: '',
    phone: '',
    storeName: '',
    companyName: '',
    activity: '',
    city: '',
    country: '',
  });
  const [activeTab, setActiveTab] = useState('customers');

  const generatePassword = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let retVal = "";
    for (let i = 0, n = charset.length; i < 12; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    setCustomerForm(prev => ({ ...prev, password: retVal }));
  };

  const copyToClipboard = (text: string, type: 'password' | 'url') => {
    navigator.clipboard.writeText(text);
    if (type === 'password') {
      setPasswordCopied(true);
      setTimeout(() => setPasswordCopied(false), 2000);
    }
    toast({ 
      title: isRTL ? 'تم النسخ' : 'Copied', 
      description: isRTL ? `تم نسخ ${type === 'password' ? 'كلمة المرور' : 'الرابط'} إلى الحافظة` : `Copied ${type === 'password' ? 'password' : 'url'} to clipboard` 
    });
  };

  const openCreateCustomer = () => {
    setCustomerForm({ name: '', email: '', phone: '', password: '' });
    setGeneratedInviteUrl(null);
    setShowCustomerDialog(true);
  };

  const openEditCustomer = (customer: Customer) => {
    setCurrentCustomer(customer);
    setCustomerForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      password: '' // Don't show password on edit
    });
    setShowEditDialog(true);
  };

  const openDeleteCustomer = (customer: Customer) => {
    setCurrentCustomer(customer);
    setShowDeleteDialog(true);
  };

  const openChargeDialog = (customer: Customer, type: 'charge' | 'recharge' = 'charge') => {
    setCurrentCustomer(customer);
    setChargeType(type);
    setChargeAmount('');
    setChargeDescription('');
    setShowChargeDialog(true);
  };

  const openCreateProgram = () => {
    setEditingProgram(null);
    setProgramForm({ name: '', description: '', minPoints: 0, benefits: '' });
    setShowProgramSheet(true);
  };

  const openEditProgram = (program: LoyaltyProgram) => {
    setEditingProgram(program);
    setProgramForm({
      name: program.name,
      description: program.description,
      minPoints: program.minPoints,
      benefits: program.benefits.join(', '),
    });
    setShowProgramSheet(true);
  };

  const handleProgramFormChange = (field: string, value: string | number) => {
    setProgramForm(prev => ({ ...prev, [field]: value }));
  };

  // Load join requests
  const loadJoinRequests = useCallback(async () => {
    try {
      setLoadingJoinRequests(true);
      const response = await coreApi.get('/customer-registration-requests', { requireAuth: true }) as JoinRequest[];
      const requests = Array.isArray(response) ? response : [];
      setJoinRequests(requests);
    } catch (error) {
      console.error('Failed to load join requests:', error);
      toast({
        title: t('dashboard.customers.loadJoinRequestsError') || t('common.error'),
        description: t('dashboard.customers.failedToLoadJoinRequests') || 'Failed to load join requests',
        variant: 'destructive',
      });
      setJoinRequests([]);
    } finally {
      setLoadingJoinRequests(false);
    }
  }, [toast, t]);

  // Load join requests when tab is active
  useEffect(() => {
    if (activeTab === 'join-requests') {
      loadJoinRequests();
    }
  }, [activeTab, loadJoinRequests]);

  // Approve join request
  const handleApproveJoinRequest = async (requestId: string) => {
    try {
      setProcessingJoinRequest(requestId);
      const response = await coreApi.post(`/customer-registration-requests/${requestId}/approve`, {}, { requireAuth: true }) as { inviteUrl?: string };
      
      if (response && response.inviteUrl) {
         setGeneratedInviteUrl(response.inviteUrl);
         // Show invite URL dialog/sheet?
         // We can use the existing setShowCustomerDialog logic but it might be confusing if it wasn't triggered from "Add Customer".
         // But generatedInviteUrl state controls the layout of that dialog.
         // Let's set some state to indicate this is from an approval, or just reuse the dialog.
         setShowCustomerDialog(true);
         
         toast({
           title: t('dashboard.customers.approveSuccess'),
           description: t('dashboard.customers.customerInvited') || 'Customer approved and invite link generated',
         });
      } else {
         toast({
           title: t('dashboard.customers.approveSuccess') || t('common.success'),
           description: t('dashboard.customers.joinRequestApproved') || 'Join request approved successfully',
         });
      }
      
      loadJoinRequests();
      loadCustomers(); // Refresh customers list
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('Failed to approve join request:', error);
      toast({
        title: t('dashboard.customers.approveError') || t('common.error'),
        description: err?.message || t('dashboard.customers.failedToApprove') || 'Failed to approve request',
        variant: 'destructive',
      });
    } finally {
      setProcessingJoinRequest(null);
    }
  };

  // Reject join request
  const handleRejectJoinRequest = async () => {
    if (!selectedJoinRequest || !joinRequestRejectReason.trim()) {
      toast({
        title: t('common.error'),
        description: t('dashboard.customers.enterRejectReason') || 'Please enter a rejection reason',
        variant: 'destructive',
      });
      return;
    }

    try {
      setProcessingJoinRequest(selectedJoinRequest.id);
      await coreApi.post(
        `/customer-registration-requests/${selectedJoinRequest.id}/reject`,
        { reason: joinRequestRejectReason },
        { requireAuth: true }
      );
      
      toast({
        title: t('dashboard.customers.rejectSuccess') || t('common.success'),
        description: t('dashboard.customers.joinRequestRejected') || 'Join request rejected successfully',
      });
      
      setShowJoinRequestRejectDialog(false);
      setJoinRequestRejectReason('');
      setSelectedJoinRequest(null);
      loadJoinRequests();
    } catch (error: unknown) {
      console.error('Failed to reject join request:', error);
      toast({
        title: t('dashboard.customers.rejectError') || t('common.error'),
        description: (error as { message?: string })?.message || t('dashboard.customers.failedToReject') || 'Failed to reject request',
        variant: 'destructive',
      });
    } finally {
      setProcessingJoinRequest(null);
    }
  };

  const handleUpdateJoinRequest = async () => {
    if (!selectedJoinRequest) return;
    
    try {
      setIsSavingJoinRequest(true);
      await coreApi.post(`/customer-registration-requests/${selectedJoinRequest.id}/update`, joinRequestForm, { requireAuth: true });
      
      toast({
        title: isRTL ? 'تم التحديث بنجاح' : 'Updated Successfully',
        description: isRTL ? 'تم تحديث بيانات الطلب بنجاح' : 'Join request details updated successfully',
      });
      
      setShowJoinRequestDetails(false);
      loadJoinRequests();
    } catch (error: unknown) {
      console.error('Failed to update join request:', error);
      
      const err = error as { response?: { status?: number; data?: { message?: string } } };
      toast({
        title: t('common.error'),
        description: err.response?.data?.message || (isRTL ? 'فشل التحديث' : 'Failed to update'),
        variant: 'destructive',
      });
    } finally {
      setIsSavingJoinRequest(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });
      
      if (searchQuery) queryParams.append('search', searchQuery);
      if (filterTier !== 'all') queryParams.append('tier', filterTier);
      
      const response = await coreApi.get(`/dashboard/customers?${queryParams.toString()}`, { requireAuth: true });
      
      if (response && response.data && Array.isArray(response.data)) {
        setCustomers(response.data);
        if (response.meta) {
          setTotalItems(response.meta.total || response.data.length);
          setTotalPages(response.meta.totalPages || 1);
        } else {
          setTotalItems(response.data.length);
          setTotalPages(1);
        }
      } else if (Array.isArray(response)) {
        setCustomers(response);
        setTotalItems(response.length);
        setTotalPages(1);
      } else if (response && response.customers && Array.isArray(response.customers)) {
        setCustomers(response.customers);
        setTotalItems(response.total || response.customers.length);
        setTotalPages(1);
      } else {
         setCustomers([]);
         setTotalItems(0);
         setTotalPages(1);
      }
    } catch (error: unknown) {
      console.error('Failed to load customers:', error);
      toast({
        title: t('dashboard.customers.loadCustomersError'),
        description: t('common.errorOccurred'),
        variant: 'destructive',
      });
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [toast, t, currentPage, itemsPerPage, searchQuery, filterTier]);


  const submitCustomer = async () => {
    try {
      // Get subdomain from current hostname, tenant API, user context, or localStorage
      const hostname = window.location.hostname;
      let subdomain: string | undefined;
      let port: string | undefined;
      
      // Extract subdomain and port from hostname
      if (hostname.includes('.localhost')) {
        subdomain = hostname.split('.localhost')[0];
        port = window.location.port || '8080';
      } else if (hostname.endsWith('.kawn.com') || hostname.endsWith('.kawn.net')) {
        const parts = hostname.split('.');
        if (parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'app') {
          subdomain = parts[0];
        }
      }
      
      // If no subdomain from hostname, try to get from tenant API (most reliable)
      if (!subdomain) {
        try {
          const tenant = await tenantService.getCurrentUserTenant();
          if (tenant?.subdomain) {
            subdomain = tenant.subdomain;
            port = window.location.port || '8080';
          }
        } catch (e) {
          console.warn('Failed to get tenant subdomain from API:', e);
        }
      }
      
      // Fallback: try to get from user context or localStorage
      if (!subdomain) {
        try {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const parsed = JSON.parse(storedUser) as { tenantSubdomain?: string };
            if (parsed.tenantSubdomain) {
              subdomain = parsed.tenantSubdomain;
              port = window.location.port || '8080';
            }
          } else if (user?.tenantSubdomain) {
            subdomain = user.tenantSubdomain;
            port = window.location.port || '8080';
          }
        } catch (e) {
          // Ignore errors
        }
      }
      
      // Build tenant domain header
      const headers: Record<string, string> = {};
      if (subdomain) {
        port = port || window.location.port || '8080';
        
        // Determine root domain
        const hostname = window.location.hostname;
        const isLocal = hostname.includes('localhost') || hostname.includes('127.0.0.1');

        // Check if we are pointing to Production API
        const coreApiUrl = import.meta.env.VITE_CORE_API_URL || '';
        const isProductionApi = coreApiUrl.includes('saeaa.net') || coreApiUrl.includes('kawn.net');
        const platformDomain = import.meta.env.VITE_PLATFORM_DOMAIN || 'saeaa.com';
        
        let domain = '';
        if (isLocal && !isProductionApi) {
            domain = port && port !== '80' && port !== '443' 
              ? `${subdomain}.localhost:${port}`
              : `${subdomain}.localhost`;
        } else {
            // Production: use platform domain (saeaa.com)
            // Even if running local dashboard against production API, we want to invite to production
            domain = `${subdomain}.${platformDomain}`;
        }
        
        headers['X-Tenant-Domain'] = domain;
        console.log('📧 Sending X-Tenant-Domain header:', domain);
      } else {
        console.warn('⚠️ No subdomain found for invite URL');
      }
      
      const response = await coreApi.post('/customers', {
        firstName: customerForm.name.split(' ')[0],
        lastName: customerForm.name.split(' ').slice(1).join(' '),
        email: customerForm.email,
        phone: customerForm.phone,
        password: customerForm.password || undefined
      }, { requireAuth: true, headers }) as { success?: boolean; id?: string; inviteUrl?: string };

      if (response && response.inviteUrl) {
        setGeneratedInviteUrl(response.inviteUrl);
        toast({ 
          title: t('dashboard.customers.addCustomer'), 
          description: t('dashboard.customers.addCustomerSuccess'), 
          variant: 'default' 
        });
        loadCustomers();
      } else {
        toast({ 
          title: t('dashboard.customers.addCustomer'), 
          description: t('dashboard.customers.addCustomerSuccess'), 
          variant: 'default' 
        });
        setShowCustomerDialog(false);
        loadCustomers();
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Customer submit error', error);
      toast({ 
        title: t('dashboard.customers.addCustomer'), 
        description: err.response?.data?.message || t('common.errorOccurred'), 
        variant: 'destructive' 
      });
    }
  };

  const updateCustomer = async () => {
    if (!currentCustomer) return;
    try {
      await coreApi.put(`/customers/${currentCustomer.id}`, {
        firstName: customerForm.name.split(' ')[0],
        lastName: customerForm.name.split(' ').slice(1).join(' '),
        phone: customerForm.phone
      }, { requireAuth: true });
      toast({ title: isRTL ? 'تم تحديث العميل' : 'Customer Updated' });
      setShowEditDialog(false);
      loadCustomers();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({ 
        title: isRTL ? 'خطأ' : 'Error', 
        description: err.response?.data?.message || t('common.errorOccurred'), 
        variant: 'destructive' 
      });
    }
  };

  const deleteCustomer = async () => {
    if (!currentCustomer) return;
    try {
      await coreApi.delete(`/customers/${currentCustomer.id}`, { requireAuth: true });
      toast({ title: isRTL ? 'تم حذف العميل' : 'Customer Deleted' });
      setShowDeleteDialog(false);
      loadCustomers();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({ 
        title: isRTL ? 'خطأ' : 'Error', 
        description: err.response?.data?.message || t('common.errorOccurred'), 
        variant: 'destructive' 
      });
    }
  };

  const forceLogoutCustomer = async (customer: Customer) => {
    try {
      await coreApi.post(`/customers/${customer.id}/force-logout`, {}, { requireAuth: true });
      toast({ 
        title: isRTL ? 'تم تسجيل الخروج' : 'Customer Logged Out', 
        description: isRTL ? 'تم تسجيل خروج العميل من جميع الأجهزة' : 'Customer has been logged out from all devices' 
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({ 
        title: isRTL ? 'خطأ' : 'Error', 
        description: err.response?.data?.message || t('common.errorOccurred'), 
        variant: 'destructive' 
      });
    }
  };

  const toggleCustomerEmail = async (customer: Customer, disable: boolean) => {
    try {
      await coreApi.put(`/customers/${customer.id}/email-settings`, { emailDisabled: disable }, { requireAuth: true });
      toast({ 
        title: isRTL ? (disable ? 'تم تعطيل البريد الإلكتروني' : 'تم تفعيل البريد الإلكتروني') : (disable ? 'Email Disabled' : 'Email Enabled'), 
        description: isRTL 
          ? (disable ? 'تم تعطيل إشعارات البريد الإلكتروني للعميل' : 'تم تفعيل إشعارات البريد الإلكتروني للعميل')
          : (disable ? 'Email notifications have been disabled for this customer' : 'Email notifications have been enabled for this customer')
      });
      loadCustomers(); // Reload to update the UI
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({ 
        title: isRTL ? 'خطأ' : 'Error', 
        description: err.response?.data?.message || t('common.errorOccurred'), 
        variant: 'destructive' 
      });
    }
  };

  const submitProgram = async () => {
    try {
      const payload = {
        name: programForm.name,
        description: programForm.description,
        minPoints: Number(programForm.minPoints),
        benefits: programForm.benefits.split(',').map((b: string) => b.trim()).filter(Boolean),
      };
      if (editingProgram) {
        await coreApi.put(`/dashboard/loyalty-programs/${editingProgram.id}`, payload);
      } else {
        await coreApi.post('/dashboard/loyalty-programs', payload);
      }
      toast({ title: t('dashboard.customers.saveProgramSuccess'), variant: 'default' });
      setShowProgramSheet(false);
      loadLoyaltyPrograms();
    } catch (error) {
      console.error('Program submit error', error);
      toast({ title: t('dashboard.customers.saveProgramError'), description: t('common.errorOccurred'), variant: 'destructive' });
    }
  };

  const handleChargeCustomer = async () => {
    if (!currentCustomer || !chargeAmount) return;

    try {
      setIsCharging(true);
      
      if (chargeType === 'recharge') {
        await walletService.rechargeCustomer({
          customerId: currentCustomer.id,
          amount: Number(chargeAmount),
          description: chargeDescription || 'Manual recharge by admin',
          descriptionAr: chargeDescription || 'شحن رصيد يدوي من المسؤول'
        });

        toast({
          title: isRTL ? 'تم شحن الرصيد بنجاح' : 'Recharged Successfully',
          description: isRTL 
            ? `تم إضافة ${chargeAmount} إلى رصيد العميل` 
            : `Successfully added ${chargeAmount} to customer balance`,
          variant: 'default'
        });
      } else {
        await walletService.chargeCustomer({
          customerId: currentCustomer.id,
          amount: Number(chargeAmount),
          description: chargeDescription || 'Manual charge by admin',
          descriptionAr: chargeDescription || 'خصم يدوي من المسؤول'
        });

        toast({
          title: isRTL ? 'تم الخصم بنجاح' : 'Charged Successfully',
          description: isRTL 
            ? `تم خصم ${chargeAmount} من رصيد العميل` 
            : `Successfully charged ${chargeAmount} from customer balance`,
          variant: 'default'
        });
      }
      
      setShowChargeDialog(false);
      loadCustomers(); // Reload customers to update balance/stats if needed
    } catch (error: unknown) {
      console.error('Transaction error:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        title: isRTL ? 'فشلت العملية' : 'Transaction Failed',
        description: err.response?.data?.message || (isRTL ? 'حدث خطأ في النظام' : 'System error occurred'),
        variant: 'destructive'
      });
    } finally {
      setIsCharging(false);
    }
  };

  const loadLoyaltyPrograms = useCallback(async () => {
    try {
      const data = await coreApi.get('/dashboard/loyalty-programs', { requireAuth: true });
      const programs = data && data.programs ? data.programs : (Array.isArray(data) ? data : []);
      setLoyaltyPrograms(programs);
    } catch (error) {
      console.error('Failed to load loyalty programs:', error);
      setLoyaltyPrograms([]);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const data = await coreApi.get('/site-config', { requireAuth: true });
      console.log('⚙️ Loaded Settings:', data);
      setStoreSettings(data as StoreSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
    loadLoyaltyPrograms();
    loadSettings();
  }, [loadCustomers, loadLoyaltyPrograms, loadSettings]);

  const getTierBadge = (tier: string) => {
    const tierConfig: Record<string, { label: string; className: string }> = {
      gold: { label: t('dashboard.customers.gold'), className: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20' },
      silver: { label: t('dashboard.customers.silver'), className: 'bg-gray-500/10 text-gray-700 border-gray-500/20' },
      bronze: { label: t('dashboard.customers.bronze'), className: 'bg-orange-500/10 text-orange-700 border-orange-500/20' },
    };

    const config = tierConfig[tier] || tierConfig.bronze;
    return (
      <Badge variant="outline" className={config.className}>
        <Award className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
        {config.label}
      </Badge>
    );
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
  };

  // Use server-side filtered customers
  const filteredCustomers = customers;

  const handleExport = () => {
    const exportData = customers.map(c => ({
      [t('dashboard.customers.exportHeaders.id')]: c.id,
      [t('dashboard.customers.exportHeaders.name')]: c.name,
      [t('dashboard.customers.exportHeaders.email')]: c.email,
      [t('dashboard.customers.exportHeaders.phone')]: c.phone || '',
      [t('dashboard.customers.exportHeaders.totalOrders')]: c.totalOrders || 0,
      [t('dashboard.customers.exportHeaders.totalSpent')]: c.totalSpent || 0,
      [t('dashboard.customers.exportHeaders.loyaltyPoints')]: c.loyaltyPoints || 0,
      [t('dashboard.customers.exportHeaders.loyaltyTier')]: c.loyaltyTier || '',
      [t('dashboard.customers.exportHeaders.createdAt')]: c.createdAt || '',
      [t('dashboard.customers.exportHeaders.lastOrderDate')]: c.lastOrderDate || ''
    }));

    const ws = utils.json_to_sheet(exportData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, t('dashboard.customers.title'));
    writeFile(wb, `${t('dashboard.customers.title')}_export.xlsx`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(worksheet);
      
      toast({ 
        title: t('dashboard.customers.importProcessed'), 
        description: t('dashboard.customers.importProcessedDesc', { count: jsonData.length }) 
      });
      
      e.target.value = '';
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t('common.errorOccurred');
      toast({ title: t('common.error'), description: errorMessage, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6" key={languageKey}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('dashboard.customers.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('dashboard.customers.subtitle')}</p>
        </div>
        <Button className="gap-2" onClick={openCreateCustomer}>
          <UserPlus className="h-4 w-4" />
          {t('dashboard.customers.addCustomer')}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-md min-w-8 order grid-cols-3">
          <TabsTrigger value="customers">{t('dashboard.customers.tabs.customers')} ({customers.length})</TabsTrigger>
          <TabsTrigger value="loyalty">{t('dashboard.customers.tabs.loyalty')} ({loyaltyPrograms.length})</TabsTrigger>
          <TabsTrigger value="join-requests" className="relative">
            {t('dashboard.customers.tabs.joinRequests') || 'Join Requests'}
            {joinRequests.filter(r => r.status === 'PENDING').length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                {joinRequests.filter(r => r.status === 'PENDING').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.customers.totalCustomers')}</p>
                    <p className="text-2xl font-bold mt-1">{customers.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-yellow-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.customers.goldCustomers')}</p>
                    <p className="text-2xl font-bold mt-1">
                      {customers.filter(c => c?.loyaltyTier === 'gold').length}
                    </p>
                  </div>
                  <Award className="h-8 w-8 text-yellow-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.customers.averageSpending')}</p>
                    <p className="text-2xl font-bold mt-1">
                      {(customers.reduce((sum, c) => sum + (c?.totalSpent || 0), 0) / (customers.length || 1)).toFixed(0)} {t('common.currency')}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.customers.totalPoints')}</p>
                    <p className="text-2xl font-bold mt-1">
                      {customers.reduce((sum, c) => sum + (c?.loyaltyPoints || 0), 0)}
                    </p>
                  </div>
                  <Award className="h-8 w-8 text-purple-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="border-b">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute end-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={t('dashboard.customers.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pe-10 text-start"
                  />
                </div>
                <Select value={filterTier} onValueChange={setFilterTier}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    <SelectValue placeholder={t('dashboard.customers.filterTier')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('dashboard.customers.allTiers')}</SelectItem>
                    <SelectItem value="gold">{t('dashboard.customers.gold')}</SelectItem>
                    <SelectItem value="silver">{t('dashboard.customers.silver')}</SelectItem>
                    <SelectItem value="bronze">{t('dashboard.customers.bronze')}</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button variant="outline" className="gap-2" onClick={handleExport}>
                    <Download className="h-4 w-4" />
                    {t('dashboard.customers.export')}
                  </Button>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".xlsx, .xls"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleImport}
                    />
                    <Button variant="outline" className="gap-2">
                      <Upload className="h-4 w-4" />
                      {t('dashboard.customers.import')}
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{t('dashboard.customers.noResults')}</h3>
                  <p className="text-gray-500">{t('dashboard.customers.noResultsDesc')}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                <Table className="w-full table-auto">
                  <TableHeader>
                    <TableRow>
                      <TableHead className={`font-semibold w-32 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>{t('dashboard.customers.customer')}</TableHead>
                      <TableHead className={`font-semibold min-w-[200px] ${isRTL ? 'text-right' : 'text-left'}`}>{t('dashboard.customers.contactInfo')}</TableHead>
                      <TableHead className={`font-semibold w-32 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>{t('dashboard.customers.orders')}</TableHead>
                      <TableHead className={`font-semibold w-32 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>{t('dashboard.customers.totalSpent')}</TableHead>
                      <TableHead className={`font-semibold w-32 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>{t('dashboard.customers.loyaltyPoints')}</TableHead>
                      <TableHead className={`font-semibold w-32 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>{t('dashboard.customers.tier')}</TableHead>
                      <TableHead className={`font-semibold w-32 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>{t('dashboard.customers.lastOrder')}</TableHead>
                      <TableHead className={`font-semibold w-16 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>{t('dashboard.customers.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer) => (
                      <TableRow key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <TableCell className={isRTL ? 'text-right' : 'text-left'}>
                          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse justify-end' : 'justify-start'}`}>
                            <Avatar>
                              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${customer.name}`} />
                              <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium break-words">{customer.name}</p>
                              <p className="text-sm text-gray-500 break-words">
                                {t('dashboard.customers.memberSince')} {new Date(customer.createdAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className={isRTL ? 'text-right' : 'text-left'}>
                          <div className="space-y-1 min-w-0">
                            <div className={`flex items-center gap-2 text-sm ${isRTL ? 'flex-row-reverse justify-end' : 'justify-start'}`}>
                              <Mail className="h-3 w-3 text-gray-400" />
                              <span className="break-words">{customer.email}</span>
                            </div>
                            {customer.phone && (
                              <div className={`flex items-center gap-2 text-sm text-gray-500 ${isRTL ? 'flex-row-reverse justify-end' : 'justify-start'}`}>
                                <Phone className="h-3 w-3" />
                                <span className="break-words">{customer.phone}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className={isRTL ? 'text-right' : 'text-left'}>
                          <Badge variant="secondary">{customer.totalOrders} {t('dashboard.customers.orders')}</Badge>
                        </TableCell>
                        <TableCell className={`font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>
                          {(customer.totalSpent || 0).toFixed(2)} {t('common.currency')}
                        </TableCell>
                        <TableCell className={isRTL ? 'text-right' : 'text-left'}>
                          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse justify-end' : 'justify-start'}`}>
                            <Award className="h-4 w-4 text-primary" />
                            <span className="font-medium">{customer.loyaltyPoints}</span>
                          </div>
                        </TableCell>
                        <TableCell className={isRTL ? 'text-right' : 'text-left'}>{getTierBadge(customer.loyaltyTier)}</TableCell>
                        <TableCell className={`text-sm text-gray-500 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {customer.lastOrderDate 
                            ? new Date(customer.lastOrderDate).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                           <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align={isRTL ? 'end' : 'start'}>
                              <DropdownMenuItem onClick={() => openEditCustomer(customer)}>
                                <Edit className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                {t('dashboard.customers.edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openChargeDialog(customer, 'recharge')}>
                                <TrendingUp className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                {isRTL ? 'شحن رصيد' : 'Recharge Balance'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openChargeDialog(customer, 'charge')}>
                                <DollarSign className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                {isRTL ? 'خصم رصيد' : 'Deduct Balance'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => forceLogoutCustomer(customer)}>
                                <LogOut className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                {isRTL ? 'تسجيل الخروج القسري' : 'Force Logout'}
                              </DropdownMenuItem>
                              {(() => {
                                // Parse metadata to check emailDisabled status
                                let emailDisabled = false;
                                try {
                                  if (customer.metadata) {
                                    const metadata = typeof customer.metadata === 'string' 
                                      ? JSON.parse(customer.metadata) 
                                      : customer.metadata;
                                    emailDisabled = metadata.emailDisabled === true;
                                  }
                                } catch {
                                  // Ignore parsing errors
                                }
                                return (
                                  <DropdownMenuItem 
                                    onClick={() => toggleCustomerEmail(customer, !emailDisabled)}
                                  >
                                    {emailDisabled ? (
                                      <>
                                        <MailCheck className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                        {isRTL ? 'تفعيل البريد الإلكتروني' : 'Enable Email'}
                                      </>
                                    ) : (
                                      <>
                                        <MailX className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                        {isRTL ? 'تعطيل البريد الإلكتروني' : 'Disable Email'}
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                );
                              })()}
                              <DropdownMenuItem className="text-destructive" onClick={() => openDeleteCustomer(customer)}>
                                <Trash2 className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                {t('dashboard.customers.delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              )}

              {!loading && totalItems > 0 && (
                <DataTablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                  itemsPerPageOptions={[10, 20, 50, 100]}
                  showItemsPerPage={true}
                  className="border-t mt-4"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loyalty" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-gray-500">
              {t('dashboard.customers.loyaltyDesc')}
            </p>
            <Button className="gap-2" onClick={openCreateProgram}>
              <UserPlus className="h-4 w-4" />
              {t('dashboard.customers.createProgram')}
            </Button>
          </div>

          {loyaltyPrograms.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Award className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{t('dashboard.customers.noPrograms')}</h3>
                <p className="text-gray-500 mb-4">{t('dashboard.customers.noProgramsDesc')}</p>
                <Button onClick={openCreateProgram}>
                  <UserPlus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('dashboard.customers.createProgram')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {loyaltyPrograms.map((program) => (
                <Card key={program.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Award className="h-6 w-6 text-primary" />
                      </div>
                      <Badge variant="secondary">{program.members} {t('dashboard.customers.members')}</Badge>
                    </div>
                    <CardTitle className="mt-4">{program.name}</CardTitle>
                    <CardDescription>{program.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium mb-2">{t('dashboard.customers.minPoints')}:</p>
                        <p className="text-2xl font-bold text-primary">{program.minPoints}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">{t('dashboard.customers.benefits')}:</p>
                        <ul className="space-y-1">
                          {program.benefits.map((benefit, index) => (
                            <li key={index} className="text-sm text-gray-500 flex items-center gap-2">
                              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Button variant="outline" className="w-full" onClick={() => openEditProgram(program)}>
                        {t('dashboard.customers.editProgram')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Join Requests Tab */}
        <TabsContent value="join-requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                {t('dashboard.customers.joinRequests') || 'Join Requests'}
                {joinRequests.filter((r: JoinRequest) => r.status === 'PENDING').length > 0 && (
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                    {joinRequests.filter((r: JoinRequest) => r.status === 'PENDING').length} {t('dashboard.customers.pending') || 'Pending'}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {t('dashboard.customers.joinRequestsDesc') || 'Review and manage customer registration requests'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingJoinRequests ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : joinRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Info className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{t('dashboard.customers.noJoinRequests') || 'No Join Requests'}</h3>
                  <p className="text-gray-500">{t('dashboard.customers.noPendingJoinRequests') || 'No pending join requests found'}</p>
                </div>
              ) : (
                <div className="w-full overflow-x-auto" dir={isRTL ? 'rtl' : 'ltr'}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('dashboard.customers.fullName') || 'Full Name'}</TableHead>
                        <TableHead>{t('dashboard.customers.email') || 'Email'}</TableHead>
                        <TableHead>{t('dashboard.customers.phone') || 'Phone'}</TableHead>
                        <TableHead>{t('dashboard.customers.storeName') || 'Store Name'}</TableHead>
                        <TableHead>{t('dashboard.customers.companyName') || 'Company Name'}</TableHead>
                        <TableHead>{t('dashboard.customers.activity') || 'Activity'}</TableHead>
                        <TableHead>{t('dashboard.customers.city') || 'City'}</TableHead>
                        <TableHead>{t('dashboard.customers.country') || 'Country'}</TableHead>
                        <TableHead>{t('dashboard.customers.status') || 'Status'}</TableHead>
                        <TableHead>{t('dashboard.customers.date') || 'Date'}</TableHead>
                        <TableHead>{t('dashboard.customers.actions') || 'Actions'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {joinRequests.map((request: JoinRequest) => (
                        <TableRow key={request.id}>
                          <TableCell>{request.fullName}</TableCell>
                          <TableCell>{request.email}</TableCell>
                          <TableCell>{request.phone || '-'}</TableCell>
                          <TableCell>{request.storeName || '-'}</TableCell>
                          <TableCell>{request.companyName || '-'}</TableCell>
                          <TableCell>{request.activity || '-'}</TableCell>
                          <TableCell>{request.city || '-'}</TableCell>
                          <TableCell>{request.country || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={
                              request.status === 'PENDING' ? 'default' :
                              request.status === 'APPROVED' ? 'default' : 'destructive'
                            } className={
                              request.status === 'PENDING' ? 'bg-yellow-500' :
                              request.status === 'APPROVED' ? 'bg-green-500' : 'bg-red-500'
                            }>
                              {request.status === 'PENDING' && (t('dashboard.customers.pending') || 'Pending')}
                              {request.status === 'APPROVED' && (t('dashboard.customers.approved') || 'Approved')}
                              {request.status === 'REJECTED' && (t('dashboard.customers.rejected') || 'Rejected')}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(request.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedJoinRequest(request);
                                  setJoinRequestForm({
                                    fullName: request.fullName || '',
                                    phone: request.phone || '',
                                    storeName: request.storeName || '',
                                    companyName: request.companyName || '',
                                    activity: request.activity || '',
                                    city: request.city || '',
                                    country: request.country || '',
                                  });
                                  setShowJoinRequestDetails(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {request.status === 'PENDING' && (
                                <>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleApproveJoinRequest(request.id)}
                                    disabled={processingJoinRequest === request.id}
                                  >
                                    {processingJoinRequest === request.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Check className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedJoinRequest(request);
                                      setShowJoinRequestRejectDialog(true);
                                    }}
                                    disabled={processingJoinRequest === request.id}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Sheet open={showProgramSheet} onOpenChange={setShowProgramSheet}>
        <SheetContent className="sm:max-w-[540px]">
          <SheetHeader>
            <SheetTitle>{editingProgram ? t('dashboard.customers.editProgramTitle') : t('dashboard.customers.createProgramTitle')}</SheetTitle>
            <SheetDescription>
              {editingProgram ? t('dashboard.customers.editProgramTitle') : t('dashboard.customers.createProgramTitle')}
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="program-name">{t('dashboard.customers.programName')}</Label>
              <Input
                id="program-name"
                value={programForm.name}
                onChange={(e) => handleProgramFormChange('name', e.target.value)}
                placeholder={t('dashboard.customers.gold')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="program-description">{t('dashboard.customers.description')}</Label>
              <Textarea
                id="program-description"
                value={programForm.description}
                onChange={(e) => handleProgramFormChange('description', e.target.value)}
                placeholder={t('dashboard.customers.description')}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="program-min-points">{t('dashboard.customers.minPoints')}</Label>
              <Input
                id="program-min-points"
                type="number"
                value={programForm.minPoints}
                onChange={(e) => handleProgramFormChange('minPoints', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="program-benefits">{t('dashboard.customers.benefits')} ({t('dashboard.customers.benefitsHint')})</Label>
              <Textarea
                id="program-benefits"
                value={programForm.benefits}
                onChange={(e) => handleProgramFormChange('benefits', e.target.value)}
                placeholder={t('dashboard.customers.benefitsPlaceholder')}
                rows={4}
              />
              <p className="text-xs text-gray-500">{t('dashboard.customers.benefitsHint')}</p>
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setShowProgramSheet(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={submitProgram}>
              {editingProgram ? t('common.saveChanges') : t('dashboard.customers.createProgram')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={showChargeDialog} onOpenChange={setShowChargeDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {chargeType === 'recharge' 
                ? (isRTL ? 'شحن رصيد العميل' : 'Recharge Customer Balance')
                : (isRTL ? 'خصم من رصيد العميل' : 'Deduct Customer Balance')
              }
            </DialogTitle>
            <DialogDescription>
              {chargeType === 'recharge'
                ? (isRTL 
                    ? `سيتم إضافة المبلغ إلى محفظة ${currentCustomer?.name}`
                    : `Amount will be added to ${currentCustomer?.name}'s wallet`
                  )
                : (isRTL 
                    ? `سيتم خصم المبلغ من محفظة ${currentCustomer?.name}`
                    : `Amount will be deducted from ${currentCustomer?.name}'s wallet`
                  )
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="charge-amount">{isRTL ? 'المبلغ' : 'Amount'}</Label>
              <Input
                id="charge-amount"
                type="number"
                value={chargeAmount}
                onChange={(e) => setChargeAmount(e.target.value)}
                placeholder="0.00"
                min="0.01"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="charge-desc">{isRTL ? 'الوصف (اختياري)' : 'Description (Optional)'}</Label>
              <Input
                id="charge-desc"
                value={chargeDescription}
                onChange={(e) => setChargeDescription(e.target.value)}
                placeholder={isRTL ? 'الوصف...' : 'Description...'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChargeDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleChargeCustomer} 
              disabled={isCharging || !chargeAmount || Number(chargeAmount) <= 0} 
              variant={chargeType === 'recharge' ? 'default' : 'destructive'}
            >
              {isCharging 
                ? (isRTL ? 'جاري التنفيذ...' : 'Processing...') 
                : (chargeType === 'recharge' 
                    ? (isRTL ? 'شحن الرصيد' : 'Recharge') 
                    : (isRTL ? 'خصم المبلغ' : 'Deduct Amount')
                  )
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('dashboard.customers.addNewCustomer')}</DialogTitle>
            <DialogDescription>
              {t('dashboard.customers.addCustomerDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="customer-name">{t('dashboard.customers.name')}</Label>
              <Input
                id="customer-name"
                value={customerForm.name}
                onChange={(e) => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('dashboard.customers.name')}
                disabled={!!generatedInviteUrl}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer-email">{t('dashboard.customers.email')}</Label>
              <Input
                id="customer-email"
                type="email"
                value={customerForm.email}
                onChange={(e) => setCustomerForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="example@email.com"
                disabled={!!generatedInviteUrl}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer-phone">{t('dashboard.customers.phone')}</Label>
              <Input
                id="customer-phone"
                type="tel"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+966500000000"
                disabled={!!generatedInviteUrl}
              />
            </div>
            
            {/* Password field - hidden for private stores, otherwise optional/recommended */}
            {!generatedInviteUrl && !settings?.isPrivateStore && (
              <div className="grid gap-2">
                <Label htmlFor="customer-password">{t('dashboard.customers.password')}</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="customer-password"
                      type="text"
                      value={customerForm.password}
                      onChange={(e) => setCustomerForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="********"
                      className={isRTL ? 'pl-20' : 'pr-20'}
                    />
                    <div className={`absolute top-1/2 -translate-y-1/2 flex gap-1 ${isRTL ? 'left-2' : 'right-2'}`}>
                       <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0" 
                        onClick={generatePassword}
                        title={t('dashboard.customers.generatePassword')}
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0" 
                        onClick={() => copyToClipboard(customerForm.password, 'password')}
                        disabled={!customerForm.password}
                        title={t('dashboard.customers.copy')}
                      >
                        {passwordCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">{t('dashboard.customers.passwordHint')}</p>
              </div>
            )}

            {!generatedInviteUrl && settings?.isPrivateStore && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm flex items-start gap-2">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="text-muted-foreground">
                   {isRTL 
                     ? 'سيتم إنشاء رابط دعوة تلقائياً لهذا العميل ليتمكن من تعيين كلمة المرور الخاصة به.' 
                     : 'An invitation link will be automatically generated for this customer to set their own password.'}
                </div>
              </div>
            )}

            {generatedInviteUrl && (
              <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary/20 space-y-2">
                <Label className="text-primary font-bold">{t('dashboard.customers.invitationUrlTitle')}</Label>
                <div className="flex gap-2">
                    <Input 
                      readOnly 
                      value={(() => {
                        let url = generatedInviteUrl.startsWith('http') ? generatedInviteUrl : `${window.location.protocol}//${window.location.host}/${generatedInviteUrl}`;
                        const hostname = window.location.hostname;
                        const isLocal = hostname === 'localhost' || 
                                         hostname === '127.0.0.1' || 
                                         hostname.startsWith('192.168.') || 
                                         hostname.includes('nip.io') || 
                                         hostname.endsWith('.localhost');

                        if (isLocal && url.includes('.localhost')) {
                          url = url.replace(/:\/\/[^/]+\.localhost/, `://${hostname}`);
                        }
                        return url;
                      })()}
                      className="bg-white"
                    />
                    <Button 
                      size="sm"
                      onClick={() => {
                        let url = generatedInviteUrl.startsWith('http') ? generatedInviteUrl : `${window.location.protocol}//${window.location.host}/${generatedInviteUrl}`;
                        const hostname = window.location.hostname;
                        const isLocal = hostname === 'localhost' || 
                                         hostname === '127.0.0.1' || 
                                         hostname.startsWith('192.168.') || 
                                         hostname.includes('nip.io') || 
                                         hostname.endsWith('.localhost');

                        if (isLocal && url.includes('.localhost')) {
                          url = url.replace(/:\/\/[^/]+\.localhost/, `://${hostname}`);
                        }
                        copyToClipboard(url, 'url');
                      }}
                    >
                     {t('dashboard.customers.copy')}
                   </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('dashboard.customers.invitationUrlDesc')}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            {generatedInviteUrl ? (
              <Button onClick={() => setShowCustomerDialog(false)}>
                {t('common.close')}
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setShowCustomerDialog(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={submitCustomer} disabled={!customerForm.name || !customerForm.email}>
                  {t('dashboard.customers.addCustomer')}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('dashboard.customers.editCustomer')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">{t('dashboard.customers.name')}</Label>
              <Input
                id="edit-name"
                value={customerForm.name}
                onChange={(e) => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">{t('dashboard.customers.email')}</Label>
              <Input
                id="edit-email"
                value={customerForm.email}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">{t('dashboard.customers.phone')}</Label>
              <Input
                id="edit-phone"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={updateCustomer}>
              {t('common.saveChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dashboard.customers.delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dashboard.customers.deleteConfirm', { name: currentCustomer?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={deleteCustomer} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('dashboard.customers.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Join Request Details Dialog */}
      <Dialog open={showJoinRequestDetails} onOpenChange={setShowJoinRequestDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('dashboard.customers.joinRequestDetails') || 'Edit Join Request'}</DialogTitle>
          </DialogHeader>
          {selectedJoinRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('dashboard.customers.fullName') || 'Full Name'}</Label>
                  <Input 
                    value={joinRequestForm.fullName} 
                    onChange={(e) => setJoinRequestForm({...joinRequestForm, fullName: e.target.value})}
                    disabled={selectedJoinRequest.status !== 'PENDING'}
                    placeholder={isRTL ? 'يستكمل' : 'continue'}
                  />
                </div>
                <div>
                  <Label>{t('dashboard.customers.email') || 'Email'}</Label>
                  <Input value={selectedJoinRequest.email} disabled className="bg-muted" />
                </div>
                <div>
                  <Label>{t('dashboard.customers.phone') || 'Phone'}</Label>
                  <Input 
                    value={joinRequestForm.phone} 
                    onChange={(e) => setJoinRequestForm({...joinRequestForm, phone: e.target.value})}
                    disabled={selectedJoinRequest.status !== 'PENDING'}
                    placeholder={isRTL ? 'يستكمل' : 'continue'}
                  />
                </div>
                <div>
                  <Label>{t('dashboard.customers.storeName') || 'Store Name'}</Label>
                  <Input 
                    value={joinRequestForm.storeName} 
                    onChange={(e) => setJoinRequestForm({...joinRequestForm, storeName: e.target.value})}
                    disabled={selectedJoinRequest.status !== 'PENDING'}
                    placeholder={isRTL ? 'يستكمل' : 'continue'}
                  />
                </div>
                <div>
                  <Label>{t('dashboard.customers.companyName') || 'Company Name'}</Label>
                  <Input 
                    value={joinRequestForm.companyName} 
                    onChange={(e) => setJoinRequestForm({...joinRequestForm, companyName: e.target.value})}
                    disabled={selectedJoinRequest.status !== 'PENDING'}
                    placeholder={isRTL ? 'يستكمل' : 'continue'}
                  />
                </div>
                <div>
                  <Label>{t('dashboard.customers.activity') || 'Activity'}</Label>
                  <Input 
                    value={joinRequestForm.activity} 
                    onChange={(e) => setJoinRequestForm({...joinRequestForm, activity: e.target.value})}
                    disabled={selectedJoinRequest?.status !== 'PENDING'}
                    placeholder={isRTL ? 'يستكمل' : 'continue'}
                  />
                </div>
                <div>
                  <Label>{t('dashboard.customers.city') || 'City'}</Label>
                  <Input 
                    value={joinRequestForm.city} 
                    onChange={(e) => setJoinRequestForm({...joinRequestForm, city: e.target.value})}
                    disabled={selectedJoinRequest?.status !== 'PENDING'}
                    placeholder={isRTL ? 'يستكمل' : 'continue'}
                  />
                </div>
                <div>
                  <Label>{t('dashboard.customers.country') || 'Country'}</Label>
                  <Input 
                    value={joinRequestForm.country} 
                    onChange={(e) => setJoinRequestForm({...joinRequestForm, country: e.target.value})}
                    disabled={selectedJoinRequest?.status !== 'PENDING'}
                    placeholder={isRTL ? 'يستكمل' : 'continue'}
                  />
                </div>
                <div>
                  <Label>{t('dashboard.customers.status') || 'Status'}</Label>
                  <div className="mt-2">
                  {selectedJoinRequest && (
                    <Badge variant={
                      selectedJoinRequest.status === 'PENDING' ? 'default' :
                      selectedJoinRequest.status === 'APPROVED' ? 'default' : 'destructive'
                    } className={
                      selectedJoinRequest.status === 'PENDING' ? 'bg-yellow-500 hover:bg-yellow-600' :
                      selectedJoinRequest.status === 'APPROVED' ? 'bg-green-500 hover:bg-green-600' : ''
                    }>
                      {selectedJoinRequest.status === 'PENDING' && (t('dashboard.customers.pending') || 'Pending')}
                      {selectedJoinRequest.status === 'APPROVED' && (t('dashboard.customers.approved') || 'Approved')}
                      {selectedJoinRequest.status === 'REJECTED' && (t('dashboard.customers.rejected') || 'Rejected')}
                    </Badge>
                  )}
                  </div>
                </div>
                <div>
                  <Label>{t('dashboard.customers.date') || 'Date'}</Label>
                  <div className="mt-2 text-sm font-medium">{selectedJoinRequest ? formatDate(selectedJoinRequest.createdAt) : '-'}</div>
                </div>
              </div>
              {selectedJoinRequest?.rejectionReason && (
                <div>
                  <Label>{t('dashboard.customers.rejectionReason') || 'Rejection Reason'}</Label>
                  <p className="text-sm text-muted-foreground">{selectedJoinRequest.rejectionReason}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowJoinRequestDetails(false)}>
              {t('common.cancel') || 'Cancel'}
            </Button>
            {selectedJoinRequest?.status === 'PENDING' && (
              <Button onClick={handleUpdateJoinRequest} disabled={isSavingJoinRequest}>
                {isSavingJoinRequest ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.saving') || 'Saving...'}
                  </>
                ) : (
                  t('common.save') || 'Save'
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Join Request Dialog */}
      <Dialog open={showJoinRequestRejectDialog} onOpenChange={setShowJoinRequestRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dashboard.customers.rejectJoinRequest') || 'Reject Join Request'}</DialogTitle>
            <DialogDescription>
              {t('dashboard.customers.enterRejectReasonJoinRequest') || 'Please enter a reason for rejecting this join request'} - {selectedJoinRequest?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="join-request-reject-reason" className="mb-2 block">
              {t('dashboard.customers.rejectReason') || 'Rejection Reason'}
            </Label>
            <Textarea
              id="join-request-reject-reason"
              placeholder={t('dashboard.customers.enterRejectReason') || 'Enter rejection reason'}
              value={joinRequestRejectReason}
              onChange={(e) => setJoinRequestRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowJoinRequestRejectDialog(false);
              setJoinRequestRejectReason('');
              setSelectedJoinRequest(null);
            }}>
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRejectJoinRequest}
              disabled={!joinRequestRejectReason.trim() || processingJoinRequest === selectedJoinRequest?.id}
            >
              {processingJoinRequest === selectedJoinRequest?.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t('dashboard.customers.reject') || 'Reject'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
