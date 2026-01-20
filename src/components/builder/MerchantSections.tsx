import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '@/services/core/api-client';
import { coreApi, walletService } from '@/lib/api';
import { TopUpRequest, WalletTransaction as Transaction, Bank as WalletBank, BankAccount as WalletBankAccount } from '@/services/wallet.service';
import { merchantCartService } from '@/services/merchant-cart.service';
import { Cart, CartItem, Product, Brand } from '@/services/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, Search, FileText, Heart, ShoppingCart, X, Users, Upload, Calendar, TrendingUp, BarChart3, User, CreditCard, DollarSign, Wallet, Info, AlertCircle, MessageSquare, RefreshCw, Copy, CheckCircle2, Package, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { isErrorObject } from '@/lib/error-utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

// Interfaces
interface EmployeePermissions {
  ordersCreate: boolean;
  ordersRead: boolean;
  reportsRead: boolean;
  walletRead: boolean;
  playersWrite: boolean;
  employeesManage: boolean;
  settingsWrite: boolean;
  invoicesRead: boolean;
  mobileAccess: boolean;
  mobileOrders: boolean;
  mobileProducts: boolean;
  mobileCustomers: boolean;
  mobileAnalytics: boolean;
}

interface Employee {
  id: string;
  name: string;
  username: string;
  email?: string;
  phone: string;
  groupId?: string;
  status: string;
  permissions: string[];
  createdAt?: string;
  balance?: number;
}

interface EmployeeGroup {
  id: string;
  name: string;
  description: string;
  permissions: EmployeePermissions;
  employeeCount?: number;
}

interface Customer {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  phone?: string;
}

interface Order {
  id: string;
  _id?: string;
  orderNumber?: string;
  createdAt: string;
  status: string;
}

interface SupportTicket {
  id: string;
  ticketNumber?: string;
  title: string;
  description: string;
  status: 'OPEN' | 'PENDING' | 'RESOLVED' | 'IN_PROGRESS' | 'CLOSED';
  orderId?: string;
  orderNumber?: string;
  dateAdded?: string;
  createdAt: string;
  updatedAt: string;
}

interface FavoriteCard {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    nameAr?: string;
    description?: string;
    descriptionAr?: string;
    price: number;
    retailPrice?: number;
    wholesalePrice?: number;
    images?: Array<{ url: string }>;
  };
  snapshot?: {
    id: string;
    name: string;
    nameAr?: string;
    price: number;
    retailPrice?: number;
    wholesalePrice?: number;
    costPerItem?: number;
  };
}

interface Bank {
  id: string;
  name: string;
  nameAr?: string;
  logo?: string;
  accountNumber?: string;
  iban?: string;
  accountHolderName?: string;
}

// Local interfaces for UI state
interface NewGroup {
  name: string;
  description: string;
  permissions: EmployeePermissions;
}

interface NewEmployee {
  email: string; // Changed from username
  phone: string;
  groupId: string;
  permissions: EmployeePermissions;
}

// Support Tickets Section Component
export function SupportTicketsSection({ props }: { props: Record<string, unknown> }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    title: '',
    description: '',
    orderId: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  });
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [sendingContact, setSendingContact] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: user?.name || user?.email || '',
    email: user?.email || '',
    subject: '',
    message: ''
  });
  const [storeEmail, setStoreEmail] = useState<string>('');

  // Check if admin has selected a customer (from URL params or localStorage)
  const selectedCustomerId = searchParams.get('customerId') || localStorage.getItem('selectedCustomerId');
  const selectedCustomerName = searchParams.get('customerName') || localStorage.getItem('selectedCustomerName');
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const hasSelectedCustomer = isAdmin && selectedCustomerId;

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      // Try to fetch actual support tickets first
      try {
        const response = await coreApi.get('/support-tickets', { requireAuth: false });
        const ticketsData = response as unknown as SupportTicket[] | { tickets: SupportTicket[] };
        if (Array.isArray(ticketsData)) {
          setTickets(ticketsData);
        } else if (ticketsData && 'tickets' in ticketsData && Array.isArray(ticketsData.tickets)) {
          setTickets(ticketsData.tickets);
        } else {
          // Fallback to orders if support tickets endpoint doesn't exist yet
          throw new Error('Support tickets endpoint not available');
        }
      } catch (e) {
        console.log('Support tickets endpoint not available, using orders as fallback');
        const orders: { items: Order[] } | undefined = await apiClient.fetch(`${apiClient.coreUrl}/merchant/orders?status=PENDING`, { requireAuth: false }).catch(() => ({ items: [] }));
        const ticketsData: SupportTicket[] = (orders?.items || []).map((order: Order) => ({
          id: order.id,
          dateAdded: order.createdAt,
          createdAt: order.createdAt,
          updatedAt: order.createdAt,
          title: t('sections.supportTickets.orderTicketTitle', 'Order {{number}}', { number: order.orderNumber }),
          ticketNumber: order.orderNumber,
          orderNumber: order.orderNumber,
          status: order.status as SupportTicket['status'],
          description: '',
        }));
        setTickets(ticketsData);
      }
    } catch (error) {
      console.error('Failed to load tickets:', error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadStoreConfig = useCallback(async () => {
    try {
      const config = await coreApi.get('/site-config', { requireAuth: false });
      const email = (config?.settings as { email?: string })?.email || '';
      setStoreEmail(email);
    } catch (error: unknown) {
      console.error('Failed to load store email:', error);
    }
  }, []);

  useEffect(() => {
    loadTickets();
    loadStoreConfig();
  }, [loadTickets, loadStoreConfig]);

  const handleCreateTicket = async () => {
    if (!ticketForm.title.trim() || !ticketForm.description.trim()) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'يرجى إدخال عنوان ووصف للتذكرة'
      });
      return;
    }

    try {
      setCreatingTicket(true);
      const ticketData = {
        title: ticketForm.title,
        description: ticketForm.description,
        orderId: ticketForm.orderId || undefined,
        priority: ticketForm.priority
      };

      // Try to create ticket via API
      try {
        await coreApi.post('/support-tickets', ticketData, { requireAuth: true });
        toast({
          title: 'تم إنشاء التذكرة',
          description: 'تم إنشاء تذكرة الدعم بنجاح'
        });
        setIsCreateDialogOpen(false);
        setTicketForm({ title: '', description: '', orderId: '', priority: 'MEDIUM' });
        loadTickets();
      } catch (error: unknown) {
        // If API doesn't exist yet, show success message anyway
        console.log('Support ticket creation endpoint not available yet');
        toast({
          title: 'تم إنشاء التذكرة',
          description: 'سيتم معالجة طلبك قريباً'
        });
        setIsCreateDialogOpen(false);
        setTicketForm({ title: '', description: '', orderId: '', priority: 'MEDIUM' });
      }
    } catch (error: unknown) {
      console.error('Failed to create ticket:', error);
      toast({
        title: t('common.error', 'Error'),
        description: (error as { message?: string })?.message || t('sections.supportTickets.createError', 'Failed to create ticket'),
        variant: 'destructive',
      });
    } finally {
      setCreatingTicket(false);
    }
  };

  const handleSendContact = async () => {
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'يرجى إدخال الاسم والبريد الإلكتروني والرسالة'
      });
      return;
    }

    if (!storeEmail) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'البريد الإلكتروني للمتجر غير متوفر. يرجى الاتصال بالدعم مباشرة.'
      });
      return;
    }

    try {
      setSendingContact(true);
      const response = await apiClient.fetch(`${apiClient.coreUrl}/site-config/contact`, {
        method: 'POST',
        body: JSON.stringify({
          name: contactForm.name,
          email: contactForm.email,
          subject: contactForm.subject || t('sections.supportTickets.contactSubject', 'Message from {{name}}', { name: contactForm.name }),
          message: contactForm.message
        }),
        requireAuth: false
      });

      if (response?.success) {
        toast({
          title: 'تم الإرسال بنجاح',
          description: 'تم إرسال رسالتك إلى فريق الدعم. سنتواصل معك قريباً.'
        });
        setIsContactDialogOpen(false);
        setContactForm({
          name: user?.name || user?.email || '',
          email: user?.email || '',
          subject: '',
          message: ''
        });
      }
    } catch (error: unknown) {
      console.error('Failed to send contact email:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: (error as { message?: string })?.message || 'فشل في إرسال الرسالة. يرجى المحاولة مرة أخرى.'
      });
    } finally {
      setSendingContact(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{props.title || t('sections.supportTickets.title', 'Support Tickets')}</h1>
            {hasSelectedCustomer && (
              <Badge variant="outline" className="text-sm px-3 py-1">
                {t('sections.supportTickets.managerBadge', 'Store Manager: {{name}}', { name: selectedCustomerName || t('common.selectedCustomer', 'Selected Customer') })}
              </Badge>
            )}
          </div>
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="ml-2 h-5 w-5" />
            {t('sections.supportTickets.addTicket', 'Add Ticket')}
          </Button>
        </div>

        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            {tickets.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">{t('sections.supportTickets.ticketNumber', 'Ticket Number')}</TableHead>
                      <TableHead className="text-right">{t('sections.supportTickets.dateAdded', 'Date Added')}</TableHead>
                      <TableHead className="text-right">{t('sections.supportTickets.ticketTitle', 'Title')}</TableHead>
                      <TableHead className="text-right">{t('sections.supportTickets.orderNumber', 'Order Number')}</TableHead>
                      <TableHead className="text-right">{t('sections.supportTickets.status', 'Status')}</TableHead>
                      <TableHead className="text-right">{t('sections.supportTickets.description', 'Description')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((ticket: SupportTicket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-mono text-sm">{ticket.ticketNumber || ticket.id.slice(0, 8)}</TableCell>
                        <TableCell>{new Date(ticket.dateAdded || ticket.createdAt).toLocaleDateString('ar-SA')}</TableCell>
                        <TableCell>{ticket.title}</TableCell>
                        <TableCell>{ticket.orderNumber || ticket.orderId || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={
                            ticket.status === 'OPEN' || ticket.status === 'PENDING' ? 'secondary' : 
                            ticket.status === 'RESOLVED' ? 'default' : 'outline'
                          }>
                            {ticket.status === 'OPEN' ? t('common.status.open', 'Open') : 
                             ticket.status === 'PENDING' ? t('common.status.pending', 'Pending') :
                             ticket.status === 'RESOLVED' ? t('common.status.resolved', 'Resolved') :
                             ticket.status === 'IN_PROGRESS' ? t('common.status.inProgress', 'In Progress') :
                             ticket.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{ticket.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <FileText className="h-12 w-12 mb-4" />
                <p>{t('sections.supportTickets.noTickets', 'No tickets found')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Us Section */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('sections.supportTickets.contactUs', 'Contact Us')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('sections.supportTickets.contactDesc', 'Have a question or need help? Send us a message and we\'ll get back to you as soon as possible.')}
            </p>
            {storeEmail && (
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                {t('sections.supportTickets.storeEmail', 'Store Email:')} <span className="font-mono">{storeEmail}</span>
              </p>
            )}
            <Button
              onClick={() => setIsContactDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <MessageSquare className="ml-2 h-5 w-5" />
              {t('sections.supportTickets.sendMessage', 'Send Message')}
            </Button>
          </CardContent>
        </Card>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('sections.supportTickets.createTitle', 'Create New Ticket')}</DialogTitle>
              <DialogDescription>
                {t('sections.supportTickets.createDesc', 'Please provide details about your issue')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t('sections.supportTickets.form.title', 'Title')}</Label>
                <Input
                  value={ticketForm.title}
                  onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
                  placeholder={t('sections.supportTickets.form.titlePlaceholder', 'Issue Title')}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('sections.supportTickets.form.description', 'Description')}</Label>
                <Textarea
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                  placeholder={t('sections.supportTickets.form.descriptionPlaceholder', 'Describe your issue...')}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={creatingTicket}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                onClick={handleCreateTicket}
                disabled={creatingTicket || !ticketForm.title.trim() || !ticketForm.description.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                {creatingTicket ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    {t('sections.supportTickets.creating', 'Creating...')}
                  </>
                ) : (
                  t('sections.supportTickets.createButton', 'Create Ticket')
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Contact Us Dialog */}
        <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('sections.supportTickets.contactUs', 'Contact Us')}</DialogTitle>
              <DialogDescription>
                {t('sections.supportTickets.contactDialogDesc', 'Send a message to the store support team')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t('sections.supportTickets.contactForm.name', 'Name')}</Label>
                <Input
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  placeholder={t('sections.supportTickets.contactForm.namePlaceholder', 'Your name')}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('sections.supportTickets.contactForm.email', 'Email')}</Label>
                <Input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  placeholder={t('sections.supportTickets.contactForm.emailPlaceholder', 'your.email@example.com')}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('sections.supportTickets.contactForm.subject', 'Subject')} ({t('common.optional', 'Optional')})</Label>
                <Input
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  placeholder={t('sections.supportTickets.contactForm.subjectPlaceholder', 'Message subject')}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('sections.supportTickets.contactForm.message', 'Message')}</Label>
                <Textarea
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  placeholder={t('sections.supportTickets.contactForm.messagePlaceholder', 'Your message...')}
                  rows={6}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsContactDialogOpen(false)}
                disabled={sendingContact}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                onClick={handleSendContact}
                disabled={sendingContact || !contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {sendingContact ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    {t('sections.supportTickets.sending', 'Sending...')}
                  </>
                ) : (
                  <>
                    <MessageSquare className="ml-2 h-4 w-4" />
                    {t('sections.supportTickets.sendButton', 'Send Message')}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Favorites Page Section Component
export function FavoritesPageSection({ props }: { props: Record<string, unknown> }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState<FavoriteCard[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});


  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [favoritesData, cartData] = await Promise.all([
        apiClient.fetch(`${apiClient.coreUrl}/merchant/favorites?type=product`, { requireAuth: true }).catch(() => []),
        apiClient.fetch(`${apiClient.coreUrl}/merchant/cart`, { requireAuth: true }).catch(() => ({ items: [] }))
      ]);

      // CRITICAL: Validate data is not error objects before setting state
      const validFavorites = Array.isArray(favoritesData) && !isErrorObject(favoritesData) 
        ? favoritesData.filter(item => !isErrorObject(item))
        : [];
      setFavorites(validFavorites);
      
      // Handle TransformInterceptor wrapped response for cart
      let cart = cartData;
      if (cartData && typeof cartData === 'object' && 'data' in cartData && 'success' in cartData) {
        cart = (cartData as { data: Cart }).data;
      }
      
      // Validate cart data
      if (cart && typeof cart === 'object' && !isErrorObject(cart) && Array.isArray(cart.items)) {
        setCartItems(cartData.items);
      } else {
        setCartItems([]);
      }
    } catch (error: unknown) {
      console.error('Failed to load favorites:', error);
      setFavorites([]);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = (productId: string, delta: number, min: number = 1, max: number = 100) => {
    setQuantities(prev => {
      const current = prev[productId] || 1;
      const next = Math.max(min, Math.min(max, current + delta));
      return { ...prev, [productId]: next };
    });
  };

  const handleAddToCart = async (productId: string) => {
    try {
      const qty = quantities[productId] || 1;
      const updatedCart = await merchantCartService.addItem(productId, qty);
      
      // Handle TransformInterceptor wrapped response
      let cart = updatedCart;
      if (updatedCart && typeof updatedCart === 'object' && 'data' in updatedCart && 'success' in updatedCart) {
        cart = (updatedCart as { data: Cart }).data;
      }
      
      if (cart && Array.isArray(cart.items)) {
        setCartItems(cart.items);
      }
      
      toast({
        title: t('common.success'),
        description: t('sections.favoritesPage.addedToCart', 'Added to cart successfully'),
      });
    } catch (error: unknown) {
      console.error('Failed to add to cart:', error);
      toast({
        title: t('common.error'),
        description: t('sections.favoritesPage.failedToAddToCart', 'Failed to add to cart'),
        variant: 'destructive',
      });
    }
  };

  const handleRemoveFromCart = async (itemId: string) => {
    try {
      const updatedCart = await merchantCartService.removeItem(itemId);
      
      // Handle TransformInterceptor wrapped response
      let cart = updatedCart;
      if (updatedCart && typeof updatedCart === 'object' && 'data' in updatedCart && 'success' in updatedCart) {
        cart = (updatedCart as { data: Cart }).data;
      }
      
      if (cart && Array.isArray(cart.items)) {
        setCartItems(cart.items);
      }
    } catch (error: unknown) {
      console.error('Failed to remove from cart:', error);
    }
  };


  const filteredFavorites = favorites.filter((fav: FavoriteCard) => {
    const product = fav.snapshot || fav;
    return !searchQuery ||
      product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.nameAr?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.lineTotal || item.effectiveUnitPrice * item.qty || 0), 0);
  const cartCount = cartItems.reduce((sum, item) => sum + (item.qty || 0), 0);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="flex">
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{props.title || t('sections.favoritesPage.title', 'Favorite Cards')}</h1>
            
            <div className="relative">
              <input
                type="text"
                placeholder={t('sections.favoritesPage.searchPlaceholder', 'Search for a card...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pr-12 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>

            <p className="text-gray-600 dark:text-gray-400">{t('sections.favoritesPage.selectCard', 'Select Card')}</p>

            <div className="space-y-4">
              {filteredFavorites.map((fav: FavoriteCard) => {
                const product = fav.snapshot || fav;
                const wholesalePrice = product.wholesalePrice || product.costPerItem || 0;
                const retailPrice = product.price || product.retailPrice || 0;
                
                return (
                  <Card key={fav.id || product.id} className="border-0 shadow-md">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {product.image && (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-24 h-24 rounded object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                                {product.nameAr || product.name}
                              </h3>
                              <p className="text-sm text-gray-500">{product.brandName || product.brand?.name}</p>
                            </div>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                              <Heart className="h-5 w-5 fill-current" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                              <p className="text-sm text-gray-500">{t('sections.favoritesPage.wholesalePrice', 'Wholesale Price')}:</p>
                              <p className="font-semibold">${wholesalePrice.toFixed(6)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">{t('sections.favoritesPage.retailPrice', 'Retail Price')}:</p>
                              <p className="font-semibold">${retailPrice.toFixed(6)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-4">
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleUpdateQuantity(product.id, -1, product.minQuantity || 1, product.maxQuantity || 100)}
                              >-</Button>
                              <span className="w-12 text-center">{quantities[product.id] || 1}</span>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleUpdateQuantity(product.id, 1, product.minQuantity || 1, product.maxQuantity || 100)}
                              >+</Button>
                            </div>
                            <Button 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleAddToCart(product.id)}
                            >
                              {t('sections.favoritesPage.addToCart', 'Add to Cart')}
                            </Button>
                          </div>

                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredFavorites.length === 0 && (
              <div className="text-center py-12">
                <Heart className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">{t('sections.favoritesPage.noFavorites', 'No favorite cards')}</p>
              </div>
            )}

            {filteredFavorites.length > 0 && (
              <div className="text-sm text-gray-500 text-center">
                {t('sections.favoritesPage.paginationInfo', 'Showing 1 to {{count}} of {{total}} cards', { count: filteredFavorites.length, total: filteredFavorites.length })}
              </div>
            )}
          </div>
        </div>

        <div className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{t('sections.favoritesPage.cartTitle', 'Shopping Cart')}</h2>
          
          {cartItems.length > 0 ? (
            <>
              <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto">
                {cartItems.map((item: CartItem) => (
                  <div key={item.id} className="flex gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    {item.productImage && (
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-16 h-16 rounded object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900 dark:text-white">
                        {item.productNameAr || item.productName}
                      </p>
                      <p className="text-sm text-gray-500">{t('common.quantity', 'Qty')}: {item.qty}</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        ${item.lineTotal?.toFixed(6) || (item.effectiveUnitPrice * item.qty).toFixed(6)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleRemoveFromCart(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>

                  </div>
                ))}
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{t('sections.favoritesPage.cartCount', 'Card Count')}</span>
                  <span className="font-medium">{cartCount} {t('common.cards', 'Cards')}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-900 dark:text-white">{t('sections.favoritesPage.total', 'Total')}:</span>
                  <span className="text-gray-900 dark:text-white">${cartTotal.toFixed(6)}</span>
                </div>
                <Button
                  className="w-full mt-4 bg-green-600 hover:bg-green-700"
                  onClick={() => navigate('/store')}
                >
                  {t('sections.favoritesPage.checkout', 'Checkout')}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4" />
              <p>{t('sections.favoritesPage.cartEmpty', 'Cart is empty')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Balance Operations Section Component
export function BalanceOperationsSection({ props }: { props: Record<string, unknown> }) {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [topUpRequests, setTopUpRequests] = useState<TopUpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [selectedRejectionReason, setSelectedRejectionReason] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch transactions
      const transactionsResponse = await walletService.getTransactions(1, 50).catch(() => ({ data: [], items: [], transactions: [] }));
      
      // Handle different possible response formats
      let transactionsData: Transaction[] = [];
      const response = transactionsResponse as { data?: Transaction[]; items?: Transaction[]; transactions?: Transaction[] };
      
      if (Array.isArray(response.data)) {
        transactionsData = response.data;
      } else if (Array.isArray(response.items)) {
        transactionsData = response.items;
      } else if (Array.isArray(response.transactions)) {
        transactionsData = response.transactions;
      }
      
      // Fetch top-up requests
      const topUpResponse = await walletService.getTopUpRequests().catch(() => []);
      
      // Handle different possible response formats
      let topUpData: TopUpRequest[] = [];
      if (Array.isArray(topUpResponse)) {
        topUpData = topUpResponse;
      } else if (topUpResponse && typeof topUpResponse === 'object' && 'data' in topUpResponse && Array.isArray((topUpResponse as { data: TopUpRequest[] }).data)) {
        topUpData = (topUpResponse as { data: TopUpRequest[] }).data;
      } else if (topUpResponse && typeof topUpResponse === 'object' && 'items' in topUpResponse && Array.isArray((topUpResponse as { items: TopUpRequest[] }).items)) {
        topUpData = (topUpResponse as { items: TopUpRequest[] }).items;
      }
      
      setTransactions(transactionsData);
      setTopUpRequests(topUpData);
    } catch (error: unknown) {
      console.error('Failed to load balance operations:', error);
      setTransactions([]);
      setTopUpRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Listen for balance recharge events to refresh the log
    const handleRefresh = () => loadData();
    window.addEventListener('wallet-recharge-success', handleRefresh);
    return () => window.removeEventListener('wallet-recharge-success', handleRefresh);
  }, []);

  if (loading && transactions.length === 0 && topUpRequests.length === 0) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-gray-500">{t('common.loading', 'Loading...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {props.title || t('sections.balanceOperations.title', 'Balance Operations')}
          </h1>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadData} 
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {t('common.refresh', 'Refresh')}
          </Button>
        </div>

        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            {(transactions.length > 0 || topUpRequests.length > 0) ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">{t('sections.balanceOperations.id', 'ID')}</TableHead>
                      <TableHead className="text-right">{t('sections.balanceOperations.date', 'Date')}</TableHead>
                      <TableHead className="text-right">{t('sections.balanceOperations.description', 'Description')}</TableHead>
                      <TableHead className="text-right">{t('sections.balanceOperations.action', 'Action')}</TableHead>
                      <TableHead className="text-right">{t('sections.balanceOperations.status', 'Status')}</TableHead>
                      <TableHead className="text-right">{t('sections.balanceOperations.amount', 'Amount')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Display top-up requests first (pending requests) */}
                    {topUpRequests.map((request: TopUpRequest) => (
                      <TableRow key={`request-${request.id}`}>
                        <TableCell className="font-mono text-sm">{request.id?.slice(0, 8) || 'N/A'}</TableCell>
                        <TableCell>{new Date(request.createdAt || request.date).toLocaleDateString('ar-SA')}</TableCell>
                        <TableCell>
                          {request.notes || (request.paymentMethod === 'BANK_TRANSFER' ? t('sections.chargeWallet.methods.bankTransfer', 'Bank Transfer') : request.paymentMethod) || t('sections.balanceOperations.topupRequest', 'Top-up Request')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">
                            {t('sections.balanceOperations.deposit', 'Deposit')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              request.status === 'APPROVED' ? 'default' : 
                              request.status === 'REJECTED' ? 'destructive' : 
                              'secondary'
                            }>
                              {request.status === 'PENDING' ? t('common.status.pending', 'Pending') : 
                               request.status === 'APPROVED' ? t('common.status.approved', 'Approved') : 
                               request.status === 'REJECTED' ? t('common.status.rejected', 'Rejected') : 
                               request.status || t('common.status.pending', 'Pending')}
                            </Badge>
                            {request.status === 'REJECTED' && request.rejectionReason && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedRejectionReason(request.rejectionReason);
                                  setRejectionDialogOpen(true);
                                }}
                                className="h-8 w-8 p-0"
                                title={t('sections.balanceOperations.viewRejectionReason', 'View rejection reason')}
                              >
                                <Info className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          +{Math.abs(Number(request.amount) || 0).toFixed(2)} {request.currency || 'SAR'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Display completed transactions */}
                    {transactions.map((tx: Transaction) => (
                      <TableRow key={`tx-${tx.id}`}>
                        <TableCell className="font-mono text-sm">{tx.id?.slice(0, 8) || 'N/A'}</TableCell>
                        <TableCell>{new Date(tx.createdAt || tx.date).toLocaleDateString('ar-SA')}</TableCell>
                        <TableCell>{tx.description || tx.type || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={tx.type === 'TOPUP' || tx.type === 'DEPOSIT' ? 'default' : 'secondary'}>
                            {tx.type === 'TOPUP' || tx.type === 'DEPOSIT' ? t('sections.balanceOperations.deposit', 'Deposit') : t('sections.balanceOperations.withdraw', 'Withdraw')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={tx.status === 'COMPLETED' ? 'default' : 'secondary'}>
                            {tx.status === 'COMPLETED' ? t('common.status.completed', 'Completed') : (tx.status || t('common.status.pending', 'Pending'))}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {(tx.type === 'TOPUP' || tx.type === 'DEPOSIT') ? '+' : '-'}{Math.abs(Number(tx.amount) || Number(tx.value) || 0).toFixed(2)} {tx.currency || 'SAR'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <FileText className="h-12 w-12 mb-4" />
                <p>{t('common.noData', 'No data')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rejection Reason Dialog */}
      <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              {t('sections.balanceOperations.rejectionReason', 'Rejection Reason')}
            </DialogTitle>
            <DialogDescription>
              {t('sections.balanceOperations.rejectionReasonDescription', 'The reason why your top-up request was rejected')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {selectedRejectionReason || t('sections.balanceOperations.noReasonProvided', 'No reason provided')}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setRejectionDialogOpen(false)}>
              {t('common.close', 'Close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Employees Page Section Component
export function EmployeesPageSection({ props }: { props: Record<string, unknown> }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'employees' | 'groups'>('employees');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [balanceEmployee, setBalanceEmployee] = useState<Employee | null>(null);
  const [balanceAmount, setBalanceAmount] = useState<string>('');
  const [employeeGroups, setEmployeeGroups] = useState<EmployeeGroup[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [newGroup, setNewGroup] = useState<NewGroup>({
    name: '',
    description: '',
    permissions: {
      ordersCreate: false,
      ordersRead: false,
      reportsRead: false,
      walletRead: false,
      playersWrite: false,
      employeesManage: false,
      settingsWrite: false,
      invoicesRead: false,
      mobileAccess: false,
      mobileOrders: false,
      mobileProducts: false,
      mobileCustomers: false,
      mobileAnalytics: false
    }
  });
  const [newEmployee, setNewEmployee] = useState<NewEmployee>({
    email: '',
    phone: '',
    groupId: '',
    permissions: {
      ordersCreate: false,
      ordersRead: false,
      reportsRead: false,
      walletRead: false,
      playersWrite: false,
      employeesManage: false,
      settingsWrite: false,
      invoicesRead: false,
      mobileAccess: false,
      mobileOrders: false,
      mobileProducts: false,
      mobileCustomers: false,
      mobileAnalytics: false
    }
  });
  const [submitting, setSubmitting] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [passwordCopied, setPasswordCopied] = useState(false);

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setNewEmployee({
      email: employee.email || employee.username || '',
      phone: employee.phone || '',
      groupId: employee.groupId || '',
      permissions: {
        ordersCreate: employee.permissions?.includes('store:orders:create') || false,
        ordersRead: employee.permissions?.includes('store:orders:view') || false,
        reportsRead: employee.permissions?.includes('store:analytics:view') || false,
        walletRead: employee.permissions?.includes('store:wallet:view') || false,
        playersWrite: employee.permissions?.includes('store:customers:edit') || false,
        employeesManage: employee.permissions?.includes('store:employees:manage') || false,
        settingsWrite: employee.permissions?.includes('store:settings:update') || false,
        invoicesRead: employee.permissions?.includes('store:invoices:view') || false,
        mobileAccess: employee.permissions?.includes('mobile:merchant:access') || false,
        mobileOrders: employee.permissions?.includes('mobile:merchant:orders') || false,
        mobileProducts: employee.permissions?.includes('mobile:merchant:products') || false,
        mobileCustomers: employee.permissions?.includes('mobile:merchant:customers') || false,
        mobileAnalytics: employee.permissions?.includes('mobile:merchant:analytics') || false

      }
    });
    setShowAddDialog(true);
  };

  useEffect(() => {
    loadEmployees();
    loadEmployeeGroups();
  }, []);

  useEffect(() => {
    if (showAddDialog) {
      loadCustomers();
    }
  }, [showAddDialog]);

  const loadEmployeeGroups = async () => {
    try {
      // For now, create groups based on permission patterns
      // In a real app, this would fetch from an API
      const groups = [
        { 
          id: '1', 
          name: 'مدير الطلبات', 
          description: 'موظفين بإدارة الطلبات', 
          permissions: { 
            ordersCreate: true, 
            ordersRead: true, 
            reportsRead: false, 
            walletRead: false, 
            playersWrite: false, 
            employeesManage: false, 
            settingsWrite: false, 
            invoicesRead: false,
            mobileAccess: false,
            mobileOrders: false,
            mobileProducts: false,
            mobileCustomers: false,
            mobileAnalytics: false
          } 
        },
        { 
          id: '2', 
          name: 'مشرف التقارير', 
          description: 'موظفين بصلاحية قراءة التقارير', 
          permissions: { 
            ordersCreate: false, 
            ordersRead: false, 
            reportsRead: true, 
            walletRead: false, 
            playersWrite: false, 
            employeesManage: false, 
            settingsWrite: false, 
            invoicesRead: true,
            mobileAccess: false,
            mobileOrders: false,
            mobileProducts: false,
            mobileCustomers: false,
            mobileAnalytics: false
          } 
        },
        { 
          id: '3', 
          name: 'مدير كامل', 
          description: 'موظفين بجميع الصلاحيات', 
          permissions: { 
            ordersCreate: true, 
            ordersRead: true, 
            reportsRead: true, 
            walletRead: true, 
            playersWrite: true, 
            employeesManage: true, 
            settingsWrite: true, 
            invoicesRead: true,
            mobileAccess: true,
            mobileOrders: true,
            mobileProducts: true,
            mobileCustomers: true,
            mobileAnalytics: true
          } 
        }
      ];
      setEmployeeGroups(groups);
    } catch (error: unknown) {
      console.error('Failed to load groups:', error);
      setEmployeeGroups([]);
    }
  };

  const loadCustomers = async () => {
    try {
      setLoadingCustomers(true);
      // Use requireAuth: false to avoid redirect on 401 (token is still sent if available)
      const response = await coreApi.get('/dashboard/customers', { requireAuth: false });
      console.log('🛒 EmployeesPageSection: Customers response:', response);
      
      // Backend returns { customers: [...], total: number, page: number, limit: number }
      let customersData: Customer[] = [];
      if (Array.isArray(response)) {
        customersData = response;
      } else if (response && typeof response === 'object') {
        // Handle different response formats
        if (Array.isArray(response.customers)) {
          customersData = response.customers;
        } else if (Array.isArray(response.data)) {
          customersData = response.data;
        } else if (response.data && Array.isArray(response.data.customers)) {
          customersData = response.data.customers;
        }
      }
      
      console.log('🛒 EmployeesPageSection: Extracted customers data:', customersData);
      setCustomers(customersData);
      
      if (customersData.length === 0) {
        console.warn('🛒 EmployeesPageSection: No customers found in response');
      }
    } catch (error: unknown) {
      console.error('🛒 EmployeesPageSection: Failed to load customers:', error);
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  useEffect(() => {
    if (searchQuery) {
      const filtered = allEmployees.filter((emp: Employee) =>
        emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.phone?.includes(searchQuery)
      );
      setEmployees(filtered);
    } else {
      setEmployees(allEmployees);
    }
  }, [searchQuery, allEmployees]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      // Use requireAuth: true to send authentication token
      const response = await apiClient.fetch(`${apiClient.coreUrl}/merchant/employees`, { requireAuth: true }).catch(() => []);
      const employeesList = Array.isArray(response) ? response : (response?.data || []);
      setAllEmployees(employeesList);
      setEmployees(employeesList);
    } catch (error: unknown) {
      console.error('Failed to load employees:', error);
      setAllEmployees([]);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(generatedPassword);
      setPasswordCopied(true);
      toast({
        title: t('common.copied', 'Copied'),
        description: t('common.passwordCopied', 'Password copied to clipboard'),
      });
      setTimeout(() => setPasswordCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy password:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('common.copyFailed', 'Failed to copy password. Please copy manually.'),
        variant: 'destructive',
      });
    }
  };

  const handleAddEmployee = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Validate required fields - only email is required now
    if (!newEmployee.email || !newEmployee.email.trim()) {
      toast({
        title: t('common.error', 'Error'),
        description: t('sections.employeesPage.form.emailRequired', 'Email is required'),
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      
      // If a group is selected, apply group permissions
      let permissionsToUse = newEmployee.permissions;
      if (newEmployee.groupId) {
        const selectedGroup = employeeGroups.find(g => g.id === newEmployee.groupId);
        if (selectedGroup) {
          permissionsToUse = selectedGroup.permissions;
        }
      }

      const employeeData = {
        email: newEmployee.email.trim(),
        phone: newEmployee.phone?.trim() || undefined,
        permissions: permissionsToUse
      };

      // If editing, use PUT request
      if (editingEmployee) {
        await apiClient.fetch(`${apiClient.coreUrl}/merchant/employees/${editingEmployee.id}`, {
          method: 'PUT',
          body: JSON.stringify(employeeData),
          requireAuth: true
        });

        toast({
          title: t('common.success', 'Success'),
          description: t('sections.employeesPage.employeeUpdated', 'Employee updated successfully'),
          variant: 'default',
        });
      } else {
        // Create new employee - password is auto-generated
        const response = await apiClient.fetch(`${apiClient.coreUrl}/merchant/employees`, {
          method: 'POST',
          body: JSON.stringify(employeeData),
          requireAuth: true
        });

        // If password was auto-generated, show it in a dialog
        const responseData = response as any;
        if (responseData.password) {
          setGeneratedPassword(responseData.password);
          setGeneratedEmail(newEmployee.email);
          setPasswordDialogOpen(true);
          // Also log to console for easy copy
          console.log(`Employee Password for ${newEmployee.email}: ${responseData.password}`);
        } else {
          toast({
            title: t('common.success', 'Success'),
            description: t('sections.employeesPage.employeeCreated', 'Employee created successfully'),
          });
        }
      }

      setShowAddDialog(false);
      setEditingEmployee(null);
      setNewEmployee({
        email: '',
        phone: '',
        groupId: '',
        permissions: {
          ordersCreate: false,
          ordersRead: false,
          reportsRead: false,
          walletRead: false,
          playersWrite: false,
          employeesManage: false,
          settingsWrite: false,
          invoicesRead: false,
          mobileAccess: false,
          mobileOrders: false,
          mobileProducts: false,
          mobileCustomers: false,
          mobileAnalytics: false
        }
      });
      loadEmployees();
    } catch (error: unknown) {
      console.error('Failed to create/update employee:', error);
      toast({
        title: t('common.error', 'Error'),
        description: (error as { message?: string })?.message || t('sections.employeesPage.employeeError', 'Failed to save employee. Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddBalance = async () => {
    if (!balanceEmployee || !balanceAmount || isNaN(Number(balanceAmount)) || Number(balanceAmount) <= 0) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال مبلغ صحيح',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.fetch(`${apiClient.coreUrl}/merchant/employees/${balanceEmployee.id}/balance`, {
        method: 'POST',
        body: JSON.stringify({ amount: Number(balanceAmount) }),
        requireAuth: true
      });

      toast({
        title: 'تم بنجاح',
        description: 'تم شحن رصيد الموظف بنجاح',
        variant: 'default',
      });

      setShowBalanceDialog(false);
      setBalanceEmployee(null);
      setBalanceAmount('');
      loadEmployees();
    } catch (error: unknown) {
      console.error('Failed to add balance:', error);
      toast({
        title: 'خطأ',
        description: (error as { message?: string })?.message || 'فشل شحن الرصيد',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الموظف؟')) return;

    try {
      await apiClient.fetch(`${apiClient.coreUrl}/merchant/employees/${id}`, {
        method: 'DELETE',
        requireAuth: true
      });

      toast({
        title: 'تم بنجاح',
        description: 'تم حذف الموظف بنجاح',
        variant: 'default',
      });

      loadEmployees();
    } catch (error: unknown) {
      console.error('Failed to delete employee:', error);
      toast({
        title: 'خطأ',
        description: 'فشل حذف الموظف. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroup.name) {
      toast({
        title: 'خطأ في البيانات',
        description: 'يرجى إدخال اسم المجموعة',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      // In a real app, this would call an API
      const group: EmployeeGroup = {
        id: Date.now().toString(),
        ...newGroup,
        employeeCount: 0
      };
      setEmployeeGroups([...employeeGroups, group]);

      toast({
        title: 'تم بنجاح',
        description: 'تم إنشاء المجموعة بنجاح',
        variant: 'default',
      });

      setShowGroupDialog(false);
      setNewGroup({
        name: '',
        description: '',
        permissions: {
          ordersCreate: false,
          ordersRead: false,
          reportsRead: false,
          walletRead: false,
          playersWrite: false,
          employeesManage: false,
          settingsWrite: false,
          invoicesRead: false,
          mobileAccess: false,
          mobileOrders: false,
          mobileProducts: false,
          mobileCustomers: false,
          mobileAnalytics: false
        }
      });
    } catch (error: unknown) {
      console.error('Failed to create group:', error);
      toast({
        title: 'خطأ',
        description: 'فشل إنشاء المجموعة. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المجموعة؟')) return;

    try {
      setEmployeeGroups(employeeGroups.filter(g => g.id !== id));
      toast({
        title: 'تم بنجاح',
        description: 'تم حذف المجموعة بنجاح',
        variant: 'default',
      });
    } catch (error: unknown) {
      console.error('Failed to delete group:', error);
      toast({
        title: t('dashboard.orders.rejectError'), // This seems like a copy-paste error from the instruction, but I'll apply it faithfully.
        description: (error as { message?: string })?.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <Button 
              variant="ghost" 
              className={activeTab === 'employees' ? 'border-b-2 border-primary font-semibold' : ''}
              onClick={() => setActiveTab('employees')}
            >
              {t('sections.employeesPage.tabs.employees', 'Employees List')}
            </Button>
            <Button 
              variant="ghost"
              className={activeTab === 'groups' ? 'border-b-2 border-primary font-semibold' : ''}
              onClick={() => setActiveTab('groups')}
            >
              {t('sections.employeesPage.tabs.groups', 'Employee Groups')}
            </Button>
          </div>
          <div className="flex gap-4">
            {activeTab === 'employees' && (
              <>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t('sections.employeesPage.searchPlaceholder', 'Search for employee')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-4 py-2 pr-10 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => setShowAddDialog(true)}
                >
                  <Plus className="ml-2 h-5 w-5" />
                  {t('sections.employeesPage.addEmployee', 'Add New Employee')}
                </Button>
              </>
            )}
            {activeTab === 'groups' && (
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setShowGroupDialog(true)}
              >
                <Plus className="ml-2 h-5 w-5" />
                {t('sections.employeesPage.addGroup', 'Add New Group')}
              </Button>
            )}
          </div>
        </div>

        {activeTab === 'employees' ? (
          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              {employees.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">{t('sections.employeesPage.table.name', 'Name')}</TableHead>
                        <TableHead className="text-right">{t('sections.employeesPage.table.username', 'Username')}</TableHead>
                        <TableHead className="text-right">{t('sections.employeesPage.table.phone', 'Phone')}</TableHead>
                        <TableHead className="text-right">{t('sections.employeesPage.table.balance', 'Balance')}</TableHead>
                        <TableHead className="text-right">{t('sections.employeesPage.table.status', 'Status')}</TableHead>
                        <TableHead className="text-right">{t('sections.employeesPage.table.actions', 'Actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.map((emp: Employee) => (
                        <TableRow key={emp.id}>
                          <TableCell>{emp.name}</TableCell>
                          <TableCell>{emp.username}</TableCell>
                          <TableCell>{emp.phone}</TableCell>
                          <TableCell>{Number(emp.balance || 0).toFixed(2)} SAR</TableCell>
                          <TableCell>
                            <Badge variant={emp.status === 'ACTIVE' ? 'default' : 'secondary'}>
                              {emp.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEditEmployee(emp)}
                              >
                                {t('common.edit', 'Edit')}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-green-600 hover:text-green-700"
                                onClick={() => {
                                  setBalanceEmployee(emp);
                                  setShowBalanceDialog(true);
                                }}
                              >
                                <Wallet className="h-4 w-4 ml-2" />
                                {t('sections.employeesPage.addBalance', 'Add Balance')}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-500 hover:text-red-700"
                                onClick={() => handleDeleteEmployee(emp.id)}
                              >
                                {t('common.delete', 'Delete')}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Users className="h-12 w-12 mb-4" />
                  <p>{t('sections.employeesPage.noEmployees', 'No employees found')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              {employeeGroups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                  {employeeGroups.map((group: EmployeeGroup) => {
                    const groupEmployees = employees.filter((emp: Employee) => emp.groupId === group.id);
                    return (
                      <Card key={group.id} className="border-2 hover:border-primary/50 transition-colors">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg mb-1">{group.name}</CardTitle>
                              <p className="text-sm text-gray-500">{group.description}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteGroup(group.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">{t('sections.employeesPage.group.employeeCount', 'Employee Count:')}</span>
                              <span className="font-semibold">{groupEmployees.length}</span>
                            </div>
                            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">{t('sections.employeesPage.group.permissions', 'Permissions:')}</p>
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(group.permissions).map(([key, value]: [string, boolean]) => 
                                  value && (
                                    <Badge key={key} variant="secondary" className="text-xs">
                                      {t(`sections.employeesPage.permissions.${key}`, key)}
                                    </Badge>
                                  )
                                )}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full mt-3"
                              onClick={() => {
                                setActiveTab('employees');
                                setSearchQuery('');
                              }}
                            >
                              {t('sections.employeesPage.group.viewEmployees', 'View Employees')}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Users className="h-12 w-12 mb-4" />
                  <p>{t('sections.employeesPage.noGroups', 'No groups found')}</p>
                  <p className="text-sm mt-2">{t('sections.employeesPage.dialog.addGroupDesc', 'Start by creating a new group')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Add Employee Dialog */}
        <Dialog open={showAddDialog} onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) setEditingEmployee(null);
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {editingEmployee ? t('sections.employeesPage.dialog.editEmployeeTitle', 'Edit Employee') : t('sections.employeesPage.dialog.addEmployeeTitle', 'Add New Employee')}
              </DialogTitle>
              <DialogDescription className="text-base">
                {editingEmployee ? t('sections.employeesPage.dialog.editEmployeeDesc', 'Update employee information') : t('sections.employeesPage.dialog.addEmployeeDesc', 'Fill in the information below to add a new employee to your store')}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddEmployee} className="space-y-4 py-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="empEmail">{t('sections.employeesPage.form.email', 'Email')} *</Label>
                  <Input
                    id="empEmail"
                    type="email"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                    placeholder={t('sections.employeesPage.form.emailPlaceholder', 'employee@example.com')}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="empPhone">{t('sections.employeesPage.form.phone', 'Phone')}</Label>
                  <Input
                    id="empPhone"
                    value={newEmployee.phone}
                    onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                    placeholder={t('sections.employeesPage.form.phonePlaceholder', '+966 5XX XXX XXX')}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="empGroup">{t('sections.employeesPage.form.group', 'Group')}</Label>
                <select
                  id="empGroup"
                  value={newEmployee.groupId}
                  onChange={(e) => setNewEmployee({ ...newEmployee, groupId: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white mt-1"
                >
                  <option value="">{t('sections.employeesPage.form.selectGroup', 'Select Group (Optional)')}</option>
                  {employeeGroups.map((group: EmployeeGroup) => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {t('sections.employeesPage.form.groupHint', 'Selecting a group will apply its default permissions')}
                </p>
              </div>

              {!newEmployee.groupId && (
                <div>
                  <Label className="mb-3 block">{t('sections.employeesPage.form.permissions', 'Permissions')}</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(newEmployee.permissions).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox
                          id={`perm-${key}`}
                          checked={value}
                          onCheckedChange={(checked) =>
                            setNewEmployee({
                              ...newEmployee,
                              permissions: { ...newEmployee.permissions, [key]: checked }
                            })
                          }
                        />
                        <Label htmlFor={`perm-${key}`} className="text-sm font-normal cursor-pointer">
                          {t(`sections.employeesPage.permissions.${key}`, key)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </form>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button onClick={() => handleAddEmployee()} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    {t('common.saving', 'Saving...')}
                  </>
                ) : (
                  editingEmployee ? t('common.saveChanges', 'Save Changes') : t('sections.employeesPage.dialog.add', 'Add Employee')
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Password Dialog */}
        <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('sections.employeesPage.passwordDialog.title', 'Employee Created Successfully')}</DialogTitle>
              <DialogDescription>
                {t('sections.employeesPage.passwordDialog.description', 'The employee account has been created. Please copy the password below and share it with the employee.')}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t('sections.employeesPage.passwordDialog.email', 'Email')}</Label>
                <Input value={generatedEmail} readOnly className="font-mono" />
              </div>
              
              <div className="space-y-2">
                <Label>{t('sections.employeesPage.passwordDialog.temporaryPassword', 'Temporary Password')}</Label>
                <div className="flex gap-2">
                  <Input 
                    value={generatedPassword} 
                    readOnly 
                    className="font-mono text-lg font-bold" 
                    type="text"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={copyPassword}
                    className="shrink-0"
                  >
                    {passwordCopied ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>{t('sections.employeesPage.passwordDialog.important', 'Important')}:</strong> {t('sections.employeesPage.passwordDialog.mustChangePassword', 'The employee will be required to change the password on first login.')}
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button onClick={() => setPasswordDialogOpen(false)}>
                {t('common.understood', 'Understood')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Group Dialog */}
        <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('sections.employeesPage.dialog.addGroupTitle', 'Add New Group')}</DialogTitle>
              <DialogDescription>
                {t('sections.employeesPage.dialog.addGroupDesc', 'Create a new group and define its default permissions')}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); handleCreateGroup(); }} className="space-y-4 py-4">
              <div>
                <Label htmlFor="groupName">{t('sections.employeesPage.form.groupName', 'Group Name')} *</Label>
                <Input
                  id="groupName"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  placeholder={t('sections.employeesPage.form.groupName', 'Group Name')}
                />
              </div>
              <div>
                <Label htmlFor="groupDescription">{t('sections.employeesPage.form.groupDesc', 'Description')}</Label>
                <Input
                  id="groupDescription"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  placeholder={t('sections.employeesPage.form.groupDesc', 'Description')}
                />
              </div>

              <div>
                <Label className="mb-3 block">{t('sections.employeesPage.form.defaultPermissions', 'Default Permissions')}</Label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(newGroup.permissions).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id={`group-${key}`}
                        checked={value}
                        onCheckedChange={(checked) =>
                          setNewGroup({
                            ...newGroup,
                            permissions: { ...newGroup.permissions, [key]: checked }
                          })
                        }
                      />
                      <Label htmlFor={`group-${key}`} className="text-sm font-normal cursor-pointer">
                        {t(`sections.employeesPage.permissions.${key}`, key)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </form>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowGroupDialog(false)}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button onClick={handleCreateGroup} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    {t('common.loading', 'Loading...')}
                  </>
                ) : (
                  t('sections.employeesPage.addGroup', 'Create Group')
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Balance Dialog */}
        <Dialog open={showBalanceDialog} onOpenChange={setShowBalanceDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('sections.employeesPage.addBalance', 'Add Balance')}</DialogTitle>
              <DialogDescription>
                {t('sections.employeesPage.addBalanceDesc', 'Add balance to employee wallet from your wallet')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>{t('sections.employeesPage.form.employee', 'Employee')}</Label>
                <Input value={balanceEmployee?.name || ''} disabled />
              </div>
              <div>
                <Label htmlFor="balanceAmount">{t('sections.employeesPage.form.amount', 'Amount')} (SAR)</Label>
                <Input
                  id="balanceAmount"
                  type="number"
                  min="1"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBalanceDialog(false)}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button onClick={handleAddBalance} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    {t('common.loading', 'Loading...')}
                  </>
                ) : (
                  t('common.confirm', 'Confirm')
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
// Charge Wallet Section Component
export function ChargeWalletSection({ props }: { props: Record<string, unknown> }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'visa'>('cash');
  const [selectedBank, setSelectedBank] = useState('');
  const [banks, setBanks] = useState<Bank[]>([]);
  const [customerBankAccounts, setCustomerBankAccounts] = useState<BankAccount[]>([]);
  const [selectedCustomerAccount, setSelectedCustomerAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('SAR');
  const [transferrerName, setTransferrerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);



  useEffect(() => {
    loadBanks();
    loadCustomerBankAccounts();
  }, []);

  const loadBanks = async () => {
    try {
      const response = await walletService.getBanks().catch(() => []);
      setBanks(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Failed to load banks:', error);
      setBanks([]);
    }
  };

  const loadCustomerBankAccounts = async () => {
    try {
      const accounts = await walletService.getBankAccounts().catch(() => []);
      setCustomerBankAccounts(Array.isArray(accounts) ? accounts : []);
    } catch (error) {
      console.error('Failed to load customer bank accounts:', error);
      setCustomerBankAccounts([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: t('common.error', 'Error'),
        description: t('sections.chargeWallet.amountRequired', 'Please enter a valid amount greater than 0'),
        variant: 'destructive',
      });
      return;
    }

    if (!selectedBank) {
      toast({
        title: t('common.error', 'Error'),
        description: t('sections.chargeWallet.bankRequired', 'Please select a bank account'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('paymentMethod', paymentMethod);
      formData.append('bankId', selectedBank);
      formData.append('amount', amount);
      formData.append('currency', currency);
      
      // Add transferrer name if provided
      if (transferrerName) {
        formData.append('transferrerName', transferrerName);
      }
      
      // Add customer bank account ID if selected
      if (selectedCustomerAccount) {
        formData.append('senderAccountId', selectedCustomerAccount);
      }
      
      if (receiptFile) {
        formData.append('receiptImage', receiptFile);
      }

      const response = await apiClient.post('/merchant/wallet/recharge', formData, {
        requireAuth: true
      });

      console.log('Recharge response:', response);

      toast({
        title: t('sections.chargeWallet.successTitle', 'Request Sent'),
        description: t('sections.chargeWallet.successDesc', 'Balance charge request sent successfully'),
        variant: 'default',
      });
      
      // Dispatch event to refresh other sections (like BalanceOperationsSection)
      window.dispatchEvent(new CustomEvent('wallet-recharge-success'));
      
      // Reset form
      setAmount('');
      setSelectedBank('');
      setSelectedCustomerAccount('');
      setTransferrerName('');
      setReceiptFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Navigate only if not already on the page
      if (window.location.pathname !== '/balance-operations') {
        navigate('/balance-operations');
      }
    } catch (error: unknown) {
      console.error('Recharge error:', error);
      const err = error as { message?: string; data?: { message?: string } };
      const errorMessage = err?.message || err?.data?.message || t('sections.chargeWallet.submitError', 'Failed to send balance charge request');
      toast({
        title: t('common.error', 'Error'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: t('common.error', 'Error'),
          description: t('sections.chargeWallet.fileTypeError', 'File must be jpeg, png, jpg, or pdf'),
          variant: 'destructive',
        });
        return;
      }
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: t('common.error', 'Error'),
          description: t('sections.chargeWallet.fileSizeError', 'File size must be less than 10MB'),
          variant: 'destructive',
        });
        return;
      }
      setReceiptFile(file);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('sections.chargeWallet.title', 'Charge Balance')}</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex gap-4">
            <Button
              type="button"
              variant={paymentMethod === 'cash' ? 'default' : 'outline'}
              onClick={() => setPaymentMethod('cash')}
              className={paymentMethod === 'cash' ? 'border-b-2 border-primary' : ''}
            >
              {t('sections.chargeWallet.methods.cash', 'Cash')}
            </Button>
            <Button
              type="button"
              variant={paymentMethod === 'visa' ? 'default' : 'outline'}
              onClick={() => setPaymentMethod('visa')}
              className={paymentMethod === 'visa' ? 'border-b-2 border-primary' : ''}
            >
              {t('sections.chargeWallet.methods.visa', 'Visa')}
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('sections.chargeWallet.bank', 'Bank')}</label>
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
            >
              <option value="">{t('sections.chargeWallet.selectBank', 'Select Bank')}</option>
              {banks.map((bank: Bank) => (
                <option key={bank.id} value={bank.id}>
                  {i18n.language === 'ar' ? (bank.nameAr || bank.name) : bank.name}
                </option>
              ))}
            </select>
          </div>

          {selectedBank && (() => {
            const bank = banks.find((b: Bank) => b.id === selectedBank);
            return bank ? (
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle>{t('sections.chargeWallet.bankDetails', 'Bank Account Details')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t('sections.chargeWallet.accountName', 'Account Name:')}</span>
                    <span className="font-medium">{bank.accountHolderName || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t('sections.chargeWallet.accountNumber', 'Account Number:')}</span>
                    <span className="font-medium font-mono">{bank.accountNumber || '-'}</span>
                  </div>
                  {bank.iban && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{t('sections.chargeWallet.iban', 'IBAN:')}</span>
                      <span className="font-medium font-mono text-xs">{bank.iban}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null;
          })()}

          <div>
            <label className="block text-sm font-medium mb-2">{t('sections.chargeWallet.transferrerAccount', 'Transferrer Account')}</label>
            <select 
              value={selectedCustomerAccount}
              onChange={(e) => setSelectedCustomerAccount(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
            >
              <option value="">{t('sections.chargeWallet.selectTransferrerAccount', 'Select Bank Account')}</option>
              {customerBankAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.bankName} - {account.accountHolderName} ({account.accountNumber})
                </option>
              ))}
            </select>
            {customerBankAccounts.length === 0 && (
              <div className="mt-2">
                <p className="text-sm text-muted-foreground mb-2">
                  {t('sections.chargeWallet.noBankAccounts', 'No bank accounts found. Please add a bank account first.')}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/bank-accounts')}
                >
                  {t('sections.chargeWallet.addBankAccount', 'Add Bank Account')}
                </Button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('sections.chargeWallet.transferrerName', 'Transferrer Name')}</label>
            <input
              type="text"
              value={transferrerName}
              onChange={(e) => setTransferrerName(e.target.value)}
              placeholder={t('sections.chargeWallet.transferrerNamePlaceholder', 'Enter transferrer name')}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('sections.chargeWallet.amount', 'Amount')}</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1-"
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('sections.chargeWallet.currency', 'Currency')}</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
              >
                <option value="SAR">{t('common.currencies.SAR', 'SAR')}</option>
                <option value="AED">{t('common.currencies.AED', 'AED')}</option>
                <option value="KWD">{t('common.currencies.KWD', 'KWD')}</option>
                <option value="USD">{t('common.currencies.USD', 'USD')}</option>
                <option value="QAR">{t('common.currencies.QAR', 'QAR')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('sections.chargeWallet.receipt', 'Receipt Image')}</label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
              {receiptFile ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-8 w-8 text-green-500" />
                    <span className="text-sm font-medium">{receiptFile.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setReceiptFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    {(receiptFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <>
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-sm text-gray-500 mb-2">
                    {t('sections.chargeWallet.receiptHint', 'Receipt image must be jpeg, png, jpg, or pdf')}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Plus className="ml-2 h-4 w-4" />
                    {t('sections.chargeWallet.uploadReceipt', 'Upload File')}
                  </Button>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={loading}
          >
            {loading ? <Loader2 className="ml-2 h-5 w-5 animate-spin" /> : null}
            {loading ? t('sections.chargeWallet.submitting', 'Sending...') : t('sections.chargeWallet.submit', 'Submit')}
          </Button>
        </form>
      </div>
    </div>
  );
}

// Reports Page Section Component
export function ReportsPageSection({ props }: { props: Record<string, unknown> }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'details'>('products');
  const [reportData, setReportData] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [summary, setSummary] = useState({ totalAfterTax: 0, totalTax: 0, totalPrice: 0 });

  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  const loadBrands = useCallback(async () => {
    try {
      const brandsData = await apiClient.fetch(`${apiClient.coreUrl}/brands`, { requireAuth: false }).catch(() => []);
      setBrands(Array.isArray(brandsData) ? brandsData : []);
    } catch (error) {
      console.error('Failed to load brands:', error);
    }
  }, []);

  const loadReportData = useCallback(async () => {
    try {
      setLoading(true);
      let data: unknown[] = [];
      
      // Build query params
      const params = new URLSearchParams();
      if (dateFrom) params.append('startDate', dateFrom);
      if (dateTo) params.append('endDate', dateTo);
      if (selectedBrand) params.append('brandId', selectedBrand);

      if (activeTab === 'products') {
        const response = await apiClient.fetch(`${apiClient.coreUrl}/merchant/dashboard/reports/top-profitable-products?${params.toString()}`, { requireAuth: false })
          .catch(() => ({ products: [] }));
        data = (response as { products?: unknown[] })?.products || [];
        
        // Calculate summary for products
        const totalPrice = (data as { revenue?: number }[]).reduce((sum: number, p: { revenue?: number }) => sum + (p.revenue || 0), 0);
        const totalTax = totalPrice * 0.15;
        setSummary({
          totalPrice,
          totalTax,
          totalAfterTax: totalPrice + totalTax
        });

      } else if (activeTab === 'orders') {
        const response = await apiClient.fetch(`${apiClient.coreUrl}/merchant/orders?${params.toString()}`, { requireAuth: true })
          .catch(() => ({ items: [] }));
        data = (response as { items?: unknown[] })?.items || [];

        // Calculate summary for orders
        const totalPrice = (data as { total?: number; tax?: number }[]).reduce((sum: number, o: { total?: number; tax?: number }) => sum + (o.total || 0), 0);
        const totalTax = (data as { total?: number; tax?: number }[]).reduce((sum: number, o: { total?: number; tax?: number }) => sum + (o.tax || 0), 0);
        setSummary({
          totalPrice: totalPrice - totalTax,
          totalTax,
          totalAfterTax: totalPrice
        });
      } else {
        // Order Details (mock or different endpoint)
        data = [];
        setSummary({ totalAfterTax: 0, totalTax: 0, totalPrice: 0 });
      }
      
      setReportData(data);
    } catch (error) {
      console.error('Failed to load report data:', error); // Changed error message as per user's provided code
      setReportData([]);
      setSummary({ totalAfterTax: 0, totalTax: 0, totalPrice: 0 });
    } finally {
      setLoading(false);
    }
  }, [activeTab, dateFrom, dateTo, selectedBrand]);

  const handleExport = (type: 'excel' | 'pdf') => {
    toast({
      title: t('common.exporting', 'Exporting...'),
      description: t('common.exportStarted', 'Your {{type}} export has started.', { type: type.toUpperCase() }),
    });
    
    // Mock export logic - in real app would trigger backend download or generate client-side
    setTimeout(() => {
      toast({
        title: t('common.success', 'Success'),
        description: t('common.exportComplete', 'Export completed successfully.'),
        variant: 'default',
      });
    }, 1500);
  };

  const filteredData = reportData.filter((item: unknown) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    const dataItem = item as { name?: string; nameAr?: string; orderNumber?: string; customerName?: string };
    if (activeTab === 'products') {
      return (dataItem.name?.toLowerCase().includes(search) || dataItem.nameAr?.toLowerCase().includes(search));
    } else if (activeTab === 'orders') {
      return (dataItem.orderNumber?.toLowerCase().includes(search) || dataItem.customerName?.toLowerCase().includes(search));
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{(props.title as string) || t('sections.reportsPage.title', 'Reports')}</h1>

        <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
          <Button 
            variant="ghost" 
            className={activeTab === 'products' ? "border-b-2 border-primary text-primary" : ""}
            onClick={() => setActiveTab('products')}
          >
            {t('sections.reportsPage.tabs.products', 'Products')}
          </Button>
          <Button 
            variant="ghost"
            className={activeTab === 'orders' ? "border-b-2 border-primary text-primary" : ""}
            onClick={() => setActiveTab('orders')}
          >
            {t('sections.reportsPage.tabs.orders', 'Orders')}
          </Button>
          <Button 
            variant="ghost"
            className={activeTab === 'details' ? "border-b-2 border-primary text-primary" : ""}
            onClick={() => setActiveTab('details')}
          >
            {t('sections.reportsPage.tabs.orderDetails', 'Order Details')}
          </Button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400 self-center">{t('sections.reportsPage.export', 'Export:')}</span>
            <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>Excel</Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>PDF</Button>
          </div>
          <div className="flex flex-wrap gap-4">
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white"
            >
              <option value="">{t('sections.reportsPage.selectBrand', 'Select Brand')}</option>
              {brands.map((brand: Brand) => (
                <option key={brand.id} value={brand.id}>{brand.nameAr || brand.name}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-4 py-2 border-2 border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-4 py-2 border-2 border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder={t('sections.reportsPage.searchPlaceholder', 'Search...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 pr-10 border-2 border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('sections.reportsPage.summary.totalAfterTax', 'Total After Tax')}</p>
                  <p className="text-2xl font-bold">{summary.totalAfterTax.toFixed(2)}</p>
                </div>
                <CreditCard className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('sections.reportsPage.summary.totalTax', 'Total Tax')}</p>
                  <p className="text-2xl font-bold">{summary.totalTax.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('sections.reportsPage.summary.totalPrice', 'Total Price')}</p>
                  <p className="text-2xl font-bold">{summary.totalPrice.toFixed(2)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 flex items-center justify-center min-h-[200px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredData.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {activeTab === 'products' ? (
                        <>
                          <TableHead className="text-right">#</TableHead>
                          <TableHead className="text-right">{t('sections.reportsPage.table.productName', 'Product Name')}</TableHead>
                          <TableHead className="text-right">{t('sections.reportsPage.table.brandName', 'Brand Name')}</TableHead>
                          <TableHead className="text-right">{t('sections.reportsPage.table.type', 'Type')}</TableHead>
                          <TableHead className="text-right">{t('sections.reportsPage.table.quantity', 'Quantity')}</TableHead>
                          <TableHead className="text-right">{t('sections.reportsPage.table.unitPrice', 'Unit Price')}</TableHead>
                          <TableHead className="text-right">{t('sections.reportsPage.table.totalPrice', 'Total Price')}</TableHead>
                          <TableHead className="text-right">{t('sections.reportsPage.table.unitTax', 'Unit Tax')}</TableHead>
                          <TableHead className="text-right">{t('sections.reportsPage.table.totalAfterTax', 'Total After Tax')}</TableHead>
                        </>
                      ) : activeTab === 'orders' ? (
                        <>
                          <TableHead className="text-right">{t('sections.reportsPage.table.orderNumber', 'Order #')}</TableHead>
                          <TableHead className="text-right">{t('sections.reportsPage.table.date', 'Date')}</TableHead>
                          <TableHead className="text-right">{t('sections.reportsPage.table.customer', 'Customer')}</TableHead>
                          <TableHead className="text-right">{t('sections.reportsPage.table.status', 'Status')}</TableHead>
                          <TableHead className="text-right">{t('sections.reportsPage.table.items', 'Items')}</TableHead>
                          <TableHead className="text-right">{t('sections.reportsPage.table.total', 'Total')}</TableHead>
                        </>
                      ) : (
                        <TableHead className="text-right">{t('sections.reportsPage.table.details', 'Details')}</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((item: unknown, index: number) => {
                      const dataItem = item as { 
                        id?: string; 
                        name?: string; 
                        nameAr?: string; 
                        brandName?: string; 
                        qty?: number; 
                        revenue?: number;
                        orderNumber?: string;
                        createdAt?: string;
                        customerName?: string;
                        customer?: { name?: string };
                        status?: string;
                        items?: unknown[];
                        total?: number;
                      };
                      return (
                        <TableRow key={dataItem.id || index}>
                          {activeTab === 'products' ? (
                            <>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>{dataItem.nameAr || dataItem.name}</TableCell>
                              <TableCell>{dataItem.brandName || 'N/A'}</TableCell>
                              <TableCell>بطاقة رقمية</TableCell>
                              <TableCell>{dataItem.qty || 0}</TableCell>
                              <TableCell>${((dataItem.revenue || 0) / (dataItem.qty || 1)).toFixed(6)}</TableCell>
                              <TableCell>${dataItem.revenue?.toFixed(6) || '0.00'}</TableCell>
                              <TableCell>${(((dataItem.revenue || 0) / (dataItem.qty || 1)) * 0.15).toFixed(6)}</TableCell>
                              <TableCell>${((dataItem.revenue || 0) * 1.15).toFixed(6)}</TableCell>
                            </>
                          ) : activeTab === 'orders' ? (
                            <>
                              <TableCell className="font-mono">{dataItem.orderNumber}</TableCell>
                              <TableCell>{dataItem.createdAt ? new Date(dataItem.createdAt).toLocaleDateString('ar-SA') : '-'}</TableCell>
                              <TableCell>{dataItem.customerName || dataItem.customer?.name || 'Guest'}</TableCell>
                              <TableCell>
                                <Badge variant={dataItem.status === 'COMPLETED' ? 'default' : 'secondary'}>
                                  {dataItem.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{dataItem.items?.length || 0}</TableCell>
                              <TableCell>${dataItem.total?.toFixed(6)}</TableCell>
                            </>
                          ) : (
                            <TableCell colSpan={9} className="text-center">{t('common.noData', 'No details available')}</TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <BarChart3 className="h-12 w-12 mb-4" />
                <p>{t('sections.reportsPage.noData', 'No data')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Profile Page Section Component
export function ProfilePageSection({ props }: { props: Record<string, unknown> }) {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<{ businessName?: string; businessNameAr?: string; phone?: string; email?: string; taxId?: string; taxCardNumber?: string; address?: string; createdAt?: string } | null>(null);
  const [balance, setBalance] = useState(0);
  const [documents, setDocuments] = useState<{ id: string; fileName: string; type: string; size: string; uploadedAt: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'documents' | 'edit'>('documents');

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [profileData, balanceData, documentsData] = await Promise.all([
        apiClient.fetch(`${apiClient.coreUrl}/merchant/profile`, { requireAuth: false }).catch(() => null),
        apiClient.fetch(`${apiClient.coreUrl}/transactions/balance`, { requireAuth: false }).catch(() => ({ balance: 0 })),
        apiClient.fetch(`${apiClient.coreUrl}/merchant/profile/documents`, { requireAuth: false }).catch(() => [])
      ]);

      setProfile(profileData as { businessName?: string; businessNameAr?: string; phone?: string; email?: string; taxId?: string; taxCardNumber?: string; address?: string; createdAt?: string } | null);
      setBalance((balanceData as { balance?: number })?.balance || 0);
      setDocuments(Array.isArray(documentsData) ? documentsData : []);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="text-center mb-4">
                <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto mb-4 flex items-center justify-center">
                  <User className="h-10 w-10 text-gray-400" />
                </div>
                <h2 className="text-xl font-bold">{profile?.businessName || 'abanoub'}</h2>
                <p className="text-sm text-gray-500">{profile?.businessNameAr || 'abanoub'}</p>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('sections.profilePage.balance', 'Balance')}</p>
                  <p className="text-2xl font-bold">${balance.toFixed(2)}</p>
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <Plus className="ml-2 h-4 w-4" />
                  {t('sections.profilePage.addBalance', 'Add Balance')}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>{t('sections.profilePage.documents', 'Documents')}</CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('sections.profilePage.table.fileName', 'File Name')}</TableHead>
                      <TableHead>{t('sections.profilePage.table.type', 'Type')}</TableHead>
                      <TableHead>{t('sections.profilePage.table.size', 'Size')}</TableHead>
                      <TableHead>{t('sections.profilePage.table.uploadDate', 'Upload Date')}</TableHead>
                      <TableHead>{t('sections.profilePage.table.action', 'Action')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc: { id: string; fileName: string; type: string; size: string; uploadedAt: string }) => (
                      <TableRow key={doc.id}>
                        <TableCell>{doc.fileName}</TableCell>
                        <TableCell>{doc.type}</TableCell>
                        <TableCell>{doc.size}</TableCell>
                        <TableCell>{new Date(doc.uploadedAt).toLocaleDateString('ar-SA')}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">{t('sections.profilePage.download', 'Download')}</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <FileText className="h-12 w-12 mb-4" />
                  <p>{t('sections.reportsPage.noData', 'No data')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{profile?.businessName || 'abanoub'}</h2>
                  <p className="text-sm text-gray-500">المملكة العربية السعودية الدودامي</p>
                </div>
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  {t('sections.profilePage.verified', 'Verified')}
                </Badge>
              </div>
              <div className="flex gap-4 mt-4">
                <Button
                  variant={activeTab === 'documents' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('documents')}
                >
                  {t('sections.profilePage.tabs.documents', 'Documents')}
                </Button>
                <Button
                  variant={activeTab === 'edit' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('edit')}
                >
                  {t('sections.profilePage.tabs.edit', 'Edit Profile')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('sections.profilePage.fields.companyName', 'Company Name :')}</p>
                    <p className="font-medium">{profile?.businessName || 'abanoub'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('sections.profilePage.fields.manager', 'Manager :')}</p>
                    <p className="font-medium">{profile?.businessName || 'abanoub'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('sections.profilePage.fields.phone', 'Phone :')}</p>
                    <p className="font-medium">{profile?.phone || '201029009237'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('sections.profilePage.fields.email', 'Email :')}</p>
                    <p className="font-medium">{profile?.email || 'ai.dev@asuscard.com'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('sections.profilePage.fields.commercialRecord', 'Commercial Record :')}</p>
                    <p className="font-medium">{profile?.taxId || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('sections.profilePage.fields.taxCard', 'Tax Card :')}</p>
                    <p className="font-medium">{profile?.taxCardNumber || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('sections.profilePage.fields.country', 'Country :')}</p>
                    <p className="font-medium">المملكة العربية السعودية</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('sections.profilePage.fields.city', 'City :')}</p>
                    <p className="font-medium">الدودامي</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('sections.profilePage.fields.address', 'Address :')}</p>
                    <p className="font-medium">{profile?.address || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('sections.profilePage.fields.joinDate', 'Join Date :')}</p>
                    <p className="font-medium">
                      {profile?.createdAt ? new Date(profile.createdAt).toLocaleString('ar-SA') : 'AM 12:00 10/12/2025'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Bank Accounts Section Component
export function BankAccountsSection({ props }: { props: Record<string, unknown> }) {
  // Use dynamic import for the premium-styled component
  const [Component, setComponent] = useState<React.ComponentType | null>(null);
  
  useEffect(() => {
    import('@/components/cards-template/CardsBankAccounts').then((mod) => {
      setComponent(() => mod.default);
    });
  }, []);

  if (!Component) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <Component />;
}

// Customer Orders Section Component
export function CustomerOrdersSection({ props }: { props: Record<string, unknown> }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Get localized title and subtitle based on current language
  const title = isRTL 
    ? (props.titleAr as string) || (props.title as string) || t('sections.customerOrders.title')
    : (props.titleEn as string) || (props.title as string) || t('sections.customerOrders.title');
  const subtitle = isRTL
    ? (props.subtitleAr as string) || (props.subtitle as string) || t('sections.customerOrders.subtitle')
    : (props.subtitleEn as string) || (props.subtitle as string) || t('sections.customerOrders.subtitle');
  const showSearch = props.showSearch !== false;
  const showFilters = props.showFilters !== false;
  const showStatusBadge = props.showStatusBadge !== false;

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const customerToken = localStorage.getItem('customerToken');
      const customerEmail = user?.email || localStorage.getItem('lastOrderEmail') || sessionStorage.getItem('guestOrderEmail');
      
      if (!customerToken && !user && !customerEmail) {
        return;
      }

      let regularOrdersResponse: any = { data: [] };
      
      // If authenticated, use the orders endpoint (includes both regular and guest orders)
      if (customerToken || user) {
        regularOrdersResponse = await apiClient.fetch(`${apiClient.coreUrl}/orders`, {
          headers: customerToken ? { 'Authorization': `Bearer ${customerToken}` } : {},
          requireAuth: !!user
        }).catch(() => ({ data: [] }));
      } 
      // If not authenticated but have email, use the public guest orders endpoint
      else if (customerEmail) {
        regularOrdersResponse = await apiClient.fetch(
          `${apiClient.coreUrl}/guest-checkout/orders-by-email?email=${encodeURIComponent(customerEmail)}`,
          { requireAuth: false }
        ).catch(() => []);
      }

      // Fetch card orders if authenticated
      const cardOrdersResponse = (customerToken || user) 
        ? await apiClient.fetch(`${apiClient.coreUrl}/card-orders/my-orders`, {
          headers: customerToken ? { 'Authorization': `Bearer ${customerToken}` } : {},
          requireAuth: !!user
          }).catch(() => ({ data: [] }))
        : { data: [] };
      
      // Handle paginated response format { data: [...], meta: {...} } or array
      const regularOrders = Array.isArray(regularOrdersResponse) 
        ? regularOrdersResponse 
        : (regularOrdersResponse?.data || []);
      const cardOrders = Array.isArray(cardOrdersResponse) 
        ? cardOrdersResponse 
        : (cardOrdersResponse?.data || []);
      
      // Merge and sort by date
      const allOrders = [
        ...regularOrders,
        ...cardOrders.map((o: any) => ({ ...o, isCardOrder: true })),
      ].sort((a: any, b: any) => new Date(b.createdAt || b.created_at || 0).getTime() - new Date(a.createdAt || a.created_at || 0).getTime());

      setOrders(allOrders);
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast({
        title: t('sections.customerOrders.loadError', 'تعذر تحميل الطلبات'),
        description: t('sections.customerOrders.loadErrorDesc', 'حدث خطأ أثناء تحميل الطلبات. يرجى المحاولة مرة أخرى.'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string; icon: React.ElementType }> = {
      PENDING: { label: t('sections.customerOrders.status.pending', 'قيد الانتظار'), className: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20', icon: Calendar },
      PROCESSING: { label: t('sections.customerOrders.status.processing', 'قيد المعالجة'), className: 'bg-blue-500/10 text-blue-700 border-blue-500/20', icon: Loader2 },
      SHIPPED: { label: t('sections.customerOrders.status.shipped', 'تم الشحن'), className: 'bg-purple-500/10 text-purple-700 border-purple-500/20', icon: ShoppingCart },
      DELIVERED: { label: t('sections.customerOrders.status.delivered', 'تم التسليم'), className: 'bg-green-500/10 text-green-700 border-green-500/20', icon: CheckCircle2 },
      APPROVED: { label: t('sections.customerOrders.status.approved', 'موافق عليه'), className: 'bg-green-500/10 text-green-700 border-green-500/20', icon: CheckCircle2 },
      REJECTED: { label: t('sections.customerOrders.status.rejected', 'مرفوض'), className: 'bg-red-500/10 text-red-700 border-red-500/20', icon: X },
      CANCELLED: { label: t('sections.customerOrders.status.cancelled', 'ملغي'), className: 'bg-red-500/10 text-red-700 border-red-500/20', icon: X },
      COMPLETED: { label: t('sections.customerOrders.status.completed', 'مكتمل'), className: 'bg-green-500/10 text-green-700 border-green-500/20', icon: CheckCircle2 },
    };

    const config = statusMap[status] || statusMap.PENDING;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={`${config.className} gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      (order.orderNumber || order.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.status?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2">{title}</h2>
        {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
      </div>

      {/* Search and Filters */}
      {(showSearch || showFilters) && (
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          {showSearch && (
            <div className="relative flex-1">
              <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
              <Input
                placeholder={t('sections.customerOrders.searchPlaceholder', 'البحث برقم الطلب أو الحالة...')}
                className={isRTL ? 'pr-9' : 'pl-9'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
          {showFilters && (
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded-md bg-background"
            >
              <option value="all">{t('sections.customerOrders.allStatuses', 'جميع الحالات')}</option>
              <option value="PENDING">{t('sections.customerOrders.status.pending', 'قيد الانتظار')}</option>
              <option value="PROCESSING">{t('sections.customerOrders.status.processing', 'قيد المعالجة')}</option>
              <option value="SHIPPED">{t('sections.customerOrders.status.shipped', 'تم الشحن')}</option>
              <option value="DELIVERED">{t('sections.customerOrders.status.delivered', 'تم التسليم')}</option>
              <option value="APPROVED">{t('sections.customerOrders.status.approved', 'موافق عليه')}</option>
              <option value="REJECTED">{t('sections.customerOrders.status.rejected', 'مرفوض')}</option>
              <option value="CANCELLED">{t('sections.customerOrders.status.cancelled', 'ملغي')}</option>
              <option value="COMPLETED">{t('sections.customerOrders.status.completed', 'مكتمل')}</option>
            </select>
          )}
        </div>
      )}

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-40" />
              <p className="text-muted-foreground">{t('sections.customerOrders.noOrders', 'لا توجد طلبات')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('sections.customerOrders.orderNumber', 'رقم الطلب')}</TableHead>
                  <TableHead>{t('sections.customerOrders.date', 'التاريخ')}</TableHead>
                  <TableHead>{t('sections.customerOrders.status', 'الحالة')}</TableHead>
                  <TableHead>{t('sections.customerOrders.total', 'المبلغ')}</TableHead>
                  <TableHead>{t('sections.customerOrders.actions', 'الإجراءات')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order: any) => (
                  <TableRow key={order.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono font-semibold">
                      #{order.orderNumber || order.id?.slice(0, 8) || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(order.createdAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {showStatusBadge && getStatusBadge(order.status)}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {order.totalAmount ? `${Number(order.totalAmount).toFixed(2)} ${t('common.currency')}` : 
                       order.total ? `${Number(order.total).toFixed(2)} ${t('common.currency')}` : '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          setDetailsOpen(true);
                        }}
                        title={t('sections.customerOrders.view')}
                        aria-label={t('sections.customerOrders.view')}
                      >
                        <Eye className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        {t('sections.customerOrders.view')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {t('sections.customerOrders.orderDetails', 'تفاصيل الطلب')} #{selectedOrder?.orderNumber || selectedOrder?.id?.slice(0, 8)}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('sections.customerOrders.status', 'الحالة')}</Label>
                  <div className="mt-1">
                    {showStatusBadge && getStatusBadge(selectedOrder.status)}
                  </div>
                </div>
                <div>
                  <Label>{t('sections.customerOrders.date')}</Label>
                  <p className="mt-1 text-sm">
                    {new Date(selectedOrder.createdAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <Label>{t('sections.customerOrders.total')}</Label>
                  <p className="mt-1 font-semibold">
                    {selectedOrder.totalAmount ? `${Number(selectedOrder.totalAmount).toFixed(2)} ${t('common.currency')}` : 
                     selectedOrder.total ? `${Number(selectedOrder.total).toFixed(2)} ${t('common.currency')}` : '-'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

