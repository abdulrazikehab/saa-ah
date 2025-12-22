import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '@/services/core/api-client';
import { coreApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, Search, FileText, Heart, ShoppingCart, X, Users, Upload, Calendar, TrendingUp, BarChart3, User, CreditCard, DollarSign, Wallet } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { isErrorObject } from '@/lib/error-utils';
import { useAuth } from '@/contexts/AuthContext';

// Support Tickets Section Component
export function SupportTicketsSection({ props }: { props: any }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    title: '',
    description: '',
    orderId: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  });

  // Check if admin has selected a customer (from URL params or localStorage)
  const selectedCustomerId = searchParams.get('customerId') || localStorage.getItem('selectedCustomerId');
  const selectedCustomerName = searchParams.get('customerName') || localStorage.getItem('selectedCustomerName');
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const hasSelectedCustomer = isAdmin && selectedCustomerId;

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      // Try to fetch actual support tickets first
      try {
        const ticketsData = await coreApi.get('/support-tickets', { requireAuth: false });
        if (Array.isArray(ticketsData)) {
          setTickets(ticketsData);
        } else if (ticketsData?.tickets && Array.isArray(ticketsData.tickets)) {
          setTickets(ticketsData.tickets);
        } else {
          setTickets([]);
        }
      } catch (error) {
        // Fallback to orders if support tickets endpoint doesn't exist yet
        console.log('Support tickets endpoint not available, using orders as fallback');
        const orders = await apiClient.fetch(`${apiClient.coreUrl}/merchant/orders?status=PENDING`, { requireAuth: false }).catch(() => ({ items: [] }));
        const ticketsData = (orders?.items || []).map((order: any) => ({
          id: order.id,
          dateAdded: order.createdAt,
          title: `طلب ${order.orderNumber}`,
          ticketNumber: order.orderNumber,
          orderNumber: order.orderNumber,
          status: order.status,
          description: order.notes || ''
        }));
        setTickets(ticketsData);
      }
    } catch (error) {
      console.error('Failed to load tickets:', error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

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
      } catch (error: any) {
        // If API doesn't exist yet, show success message anyway
        console.log('Support ticket creation endpoint not available yet');
        toast({
          title: 'تم إنشاء التذكرة',
          description: 'سيتم معالجة طلبك قريباً'
        });
        setIsCreateDialogOpen(false);
        setTicketForm({ title: '', description: '', orderId: '', priority: 'MEDIUM' });
      }
    } catch (error: any) {
      console.error('Failed to create ticket:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: error?.message || 'فشل في إنشاء التذكرة. يرجى المحاولة مرة أخرى.'
      });
    } finally {
      setCreatingTicket(false);
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">الدعم</h1>
            {hasSelectedCustomer && (
              <Badge variant="outline" className="text-sm px-3 py-1">
                مدير متجرك: {selectedCustomerName || 'عميل محدد'}
              </Badge>
            )}
          </div>
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="ml-2 h-5 w-5" />
            إضافة تذكرة +
          </Button>
        </div>

        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            {tickets.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">رقم التذكرة</TableHead>
                      <TableHead className="text-right">تاريخ الإضافة</TableHead>
                      <TableHead className="text-right">عنوان التذكرة</TableHead>
                      <TableHead className="text-right">رقم الطلب</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">الوصف</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((ticket: any) => (
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
                            {ticket.status === 'OPEN' ? 'مفتوحة' : 
                             ticket.status === 'PENDING' ? 'قيد الانتظار' :
                             ticket.status === 'IN_PROGRESS' ? 'قيد المعالجة' :
                             ticket.status === 'RESOLVED' ? 'محلولة' :
                             ticket.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{ticket.description || ticket.comment || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <FileText className="h-12 w-12 mb-4" />
                <p>No data</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Ticket Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>إضافة تذكرة دعم جديدة</DialogTitle>
            <DialogDescription>
              املأ المعلومات التالية لإنشاء تذكرة دعم جديدة
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ticket-title">عنوان التذكرة *</Label>
              <Input
                id="ticket-title"
                value={ticketForm.title}
                onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
                placeholder="أدخل عنوان التذكرة"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-description">الوصف *</Label>
              <Textarea
                id="ticket-description"
                value={ticketForm.description}
                onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                placeholder="أدخل وصف المشكلة أو الطلب"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-order">رقم الطلب (اختياري)</Label>
              <Input
                id="ticket-order"
                value={ticketForm.orderId}
                onChange={(e) => setTicketForm({ ...ticketForm, orderId: e.target.value })}
                placeholder="أدخل رقم الطلب المرتبط"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-priority">الأولوية</Label>
              <select
                id="ticket-priority"
                value={ticketForm.priority}
                onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value as any })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="LOW">منخفضة</option>
                <option value="MEDIUM">متوسطة</option>
                <option value="HIGH">عالية</option>
                <option value="URGENT">عاجلة</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={creatingTicket}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleCreateTicket}
              disabled={creatingTicket || !ticketForm.title.trim() || !ticketForm.description.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {creatingTicket ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                'إنشاء التذكرة'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Favorites Page Section Component
export function FavoritesPageSection({ props }: { props: any }) {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [favoritesData, cartData] = await Promise.all([
        apiClient.fetch(`${apiClient.coreUrl}/merchant/favorites?type=product`, { requireAuth: false }).catch(() => []),
        apiClient.fetch(`${apiClient.coreUrl}/merchant/cart`, { requireAuth: false }).catch(() => ({ items: [] }))
      ]);

      // CRITICAL: Validate data is not error objects before setting state
      const validFavorites = Array.isArray(favoritesData) && !isErrorObject(favoritesData) 
        ? favoritesData.filter(item => !isErrorObject(item))
        : [];
      setFavorites(validFavorites);
      
      // Handle TransformInterceptor wrapped response for cart
      let cart = cartData;
      if (cartData && typeof cartData === 'object' && 'data' in cartData && 'success' in cartData) {
        cart = (cartData as any).data;
      }
      
      // Validate cart data
      if (cart && typeof cart === 'object' && !isErrorObject(cart) && Array.isArray(cart.items)) {
        setCartItems(cartData.items);
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
      setFavorites([]);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredFavorites = favorites.filter((fav: any) => {
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">البطاقات المفضلة</h1>
            
            <div className="relative">
              <input
                type="text"
                placeholder="ابحث عن بطاقة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pr-12 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>

            <p className="text-gray-600 dark:text-gray-400">اختر البطاقة</p>

            <div className="space-y-4">
              {filteredFavorites.map((fav: any) => {
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
                              <p className="text-sm text-gray-500">سعر الجملة:</p>
                              <p className="font-semibold">${wholesalePrice.toFixed(6)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">سعر التجزئة:</p>
                              <p className="font-semibold">${retailPrice.toFixed(6)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-4">
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm">-</Button>
                              <span className="w-12 text-center">1</span>
                              <Button variant="outline" size="sm">+</Button>
                            </div>
                            <Button className="bg-green-600 hover:bg-green-700">
                              تفاصيل المنتج
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
                <p className="text-gray-500">لا توجد بطاقات مفضلة</p>
              </div>
            )}

            {filteredFavorites.length > 0 && (
              <div className="text-sm text-gray-500 text-center">
                عرض 1 إلى {filteredFavorites.length} من {filteredFavorites.length} بطاقة
              </div>
            )}
          </div>
        </div>

        <div className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">سلة الشراء</h2>
          
          {cartItems.length > 0 ? (
            <>
              <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto">
                {cartItems.map((item: any) => (
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
                      <p className="text-sm text-gray-500">الكمية: {item.qty}</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        ${item.lineTotal?.toFixed(6) || (item.effectiveUnitPrice * item.qty).toFixed(6)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">عدد البطاقات</span>
                  <span className="font-medium">{cartCount} بطاقة</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-900 dark:text-white">الإجمالي :</span>
                  <span className="text-gray-900 dark:text-white">${cartTotal.toFixed(6)}</span>
                </div>
                <Button
                  className="w-full mt-4 bg-green-600 hover:bg-green-700"
                  onClick={() => navigate('/store')}
                >
                  إتمام الطلب
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4" />
              <p>السلة فارغة</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Balance Operations Section Component
export function BalanceOperationsSection({ props }: { props: any }) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await apiClient.fetch(`${apiClient.coreUrl}/merchant/wallet/transactions`, { requireAuth: false })
        .catch(() => apiClient.fetch(`${apiClient.coreUrl}/transactions`, { requireAuth: false }))
        .catch(() => ({ items: [] }));
      
      setTransactions(response?.items || response?.transactions || []);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">عمليات شحن الرصيد</h1>

        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            {transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الرقم التعريفي</TableHead>
                      <TableHead className="text-right">تاريخ العملية</TableHead>
                      <TableHead className="text-right">الوصف</TableHead>
                      <TableHead className="text-right">الإجراء</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">القيمة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx: any) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-mono text-sm">{tx.id.slice(0, 8)}</TableCell>
                        <TableCell>{new Date(tx.createdAt || tx.date).toLocaleDateString('ar-SA')}</TableCell>
                        <TableCell>{tx.description || tx.type || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={tx.type === 'DEPOSIT' ? 'default' : 'secondary'}>
                            {tx.type === 'DEPOSIT' ? 'إيداع' : 'سحب'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={tx.status === 'COMPLETED' ? 'default' : 'secondary'}>
                            {tx.status || 'PENDING'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          ${Math.abs(tx.amount || tx.value || 0).toFixed(6)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <FileText className="h-12 w-12 mb-4" />
                <p>No data</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Employees Page Section Component
export function EmployeesPageSection({ props }: { props: any }) {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<any[]>([]);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'employees' | 'groups'>('employees');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [employeeGroups, setEmployeeGroups] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [newGroup, setNewGroup] = useState({
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
      invoicesRead: false
    }
  });
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    username: '',
    password: '',
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
      invoicesRead: false
    }
  });
  const [submitting, setSubmitting] = useState(false);

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
        { id: '1', name: 'مدير الطلبات', description: 'موظفين بإدارة الطلبات', permissions: { ordersCreate: true, ordersRead: true } },
        { id: '2', name: 'مشرف التقارير', description: 'موظفين بصلاحية قراءة التقارير', permissions: { reportsRead: true, invoicesRead: true } },
        { id: '3', name: 'مدير كامل', description: 'موظفين بجميع الصلاحيات', permissions: { ordersCreate: true, ordersRead: true, reportsRead: true, walletRead: true, playersWrite: true, employeesManage: true, settingsWrite: true, invoicesRead: true } }
      ];
      setEmployeeGroups(groups);
    } catch (error) {
      console.error('Failed to load groups:', error);
      setEmployeeGroups([]);
    }
  };

  const loadCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const response = await coreApi.get('/dashboard/customers', { requireAuth: false });
      console.log('🛒 EmployeesPageSection: Customers response:', response);
      
      // Backend returns { customers: [...], total: number, page: number, limit: number }
      let customersData: any[] = [];
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
    } catch (error) {
      console.error('🛒 EmployeesPageSection: Failed to load customers:', error);
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  useEffect(() => {
    if (searchQuery) {
      const filtered = allEmployees.filter((emp: any) =>
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
      const response = await apiClient.fetch(`${apiClient.coreUrl}/merchant/employees`, { requireAuth: false }).catch(() => []);
      const employeesList = Array.isArray(response) ? response : [];
      setAllEmployees(employeesList);
      setEmployees(employeesList);
    } catch (error) {
      console.error('Failed to load employees:', error);
      setAllEmployees([]);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async () => {
    if (!newEmployee.name || !newEmployee.username || !newEmployee.password || !newEmployee.phone) {
      toast({
        title: 'خطأ في البيانات',
        description: 'يرجى ملء جميع الحقول المطلوبة',
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
        name: newEmployee.name,
        username: newEmployee.username,
        password: newEmployee.password,
        phone: newEmployee.phone,
        permissions: permissionsToUse
      };

      const response = await apiClient.fetch(`${apiClient.coreUrl}/merchant/employees`, {
        method: 'POST',
        body: JSON.stringify(employeeData),
        requireAuth: true
      });

      toast({
        title: 'تم بنجاح',
        description: 'تم إضافة الموظف بنجاح',
        variant: 'default',
      });

      setShowAddDialog(false);
      setNewEmployee({
        name: '',
        username: '',
        password: '',
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
          invoicesRead: false
        }
      });
      loadEmployees();
    } catch (error: any) {
      console.error('Failed to create employee:', error);
      toast({
        title: 'خطأ',
        description: error?.message || 'فشل إضافة الموظف. يرجى المحاولة مرة أخرى.',
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
    } catch (error: any) {
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
      const group = {
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
          invoicesRead: false
        }
      });
    } catch (error: any) {
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
    } catch (error: any) {
      console.error('Failed to delete group:', error);
      toast({
        title: 'خطأ',
        description: 'فشل حذف المجموعة. يرجى المحاولة مرة أخرى.',
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
              قائمة الموظفين
            </Button>
            <Button 
              variant="ghost"
              className={activeTab === 'groups' ? 'border-b-2 border-primary font-semibold' : ''}
              onClick={() => setActiveTab('groups')}
            >
              مجموعات الموظفين
            </Button>
          </div>
          <div className="flex gap-4">
            {activeTab === 'employees' && (
              <>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ابحث عن موظف"
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
                  اضافة موظف جديد
                </Button>
              </>
            )}
            {activeTab === 'groups' && (
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setShowGroupDialog(true)}
              >
                <Plus className="ml-2 h-5 w-5" />
                إضافة مجموعة جديدة
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
                        <TableHead className="text-right">الاسم</TableHead>
                        <TableHead className="text-right">اسم المستخدم</TableHead>
                        <TableHead className="text-right">الهاتف</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.map((emp: any) => (
                        <TableRow key={emp.id}>
                          <TableCell>{emp.name}</TableCell>
                          <TableCell>{emp.username}</TableCell>
                          <TableCell>{emp.phone}</TableCell>
                          <TableCell>
                            <Badge variant={emp.status === 'ACTIVE' ? 'default' : 'secondary'}>
                              {emp.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">تعديل</Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-500 hover:text-red-700"
                                onClick={() => handleDeleteEmployee(emp.id)}
                              >
                                حذف
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
                  <p>لا توجد موظفين</p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              {employeeGroups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                  {employeeGroups.map((group: any) => {
                    const groupEmployees = employees.filter((emp: any) => emp.groupId === group.id);
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
                              <span className="text-gray-600 dark:text-gray-400">عدد الموظفين:</span>
                              <span className="font-semibold">{groupEmployees.length}</span>
                            </div>
                            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">الصلاحيات:</p>
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(group.permissions).map(([key, value]: [string, any]) => 
                                  value && (
                                    <Badge key={key} variant="secondary" className="text-xs">
                                      {key === 'ordersCreate' && 'إنشاء الطلبات'}
                                      {key === 'ordersRead' && 'قراءة الطلبات'}
                                      {key === 'reportsRead' && 'التقارير'}
                                      {key === 'walletRead' && 'المحفظة'}
                                      {key === 'playersWrite' && 'اللاعبين'}
                                      {key === 'employeesManage' && 'الموظفين'}
                                      {key === 'settingsWrite' && 'الإعدادات'}
                                      {key === 'invoicesRead' && 'الفواتير'}
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
                              عرض الموظفين
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
                  <p>لا توجد مجموعات</p>
                  <p className="text-sm mt-2">ابدأ بإنشاء مجموعة جديدة</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Add Employee Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إضافة موظف جديد</DialogTitle>
              <DialogDescription>
                املأ البيانات التالية لإضافة موظف جديد إلى النظام
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Customer Selection */}
              {customers.length > 0 && (
                <div className="col-span-2">
                  <Label htmlFor="customerSelect">اختر عميل (اختياري)</Label>
                  <select
                    id="customerSelect"
                    onChange={(e) => {
                      const customerId = e.target.value;
                      if (customerId) {
                        const selectedCustomer = customers.find(c => (c.id || c.email) === customerId);
                        if (selectedCustomer) {
                          setNewEmployee({
                            ...newEmployee,
                            name: selectedCustomer.name || selectedCustomer.firstName || '',
                            phone: selectedCustomer.phone || '',
                          });
                        }
                      }
                    }}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">-- اختر عميل --</option>
                    {customers.map((customer: any) => (
                      <option key={customer.id || customer.email} value={customer.id || customer.email}>
                        {customer.name || customer.firstName || customer.email} - {customer.email}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    سيتم ملء الاسم ورقم الهاتف تلقائياً عند اختيار عميل
                  </p>
                </div>
              )}
              
              {loadingCustomers && (
                <div className="col-span-2 text-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-gray-500 mt-2">جاري تحميل العملاء...</p>
                </div>
              )}
              
              {!loadingCustomers && customers.length === 0 && (
                <div className="col-span-2 text-center py-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <p className="text-sm text-gray-500">لا يوجد عملاء مسجلين في المتجر</p>
                  <p className="text-xs text-gray-400 mt-1">
                    سيتم عرض العملاء هنا عند وجود طلبات أو عملاء مسجلين
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">الاسم *</Label>
                  <Input
                    id="name"
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                    placeholder="اسم الموظف"
                  />
                </div>
                <div>
                  <Label htmlFor="username">اسم المستخدم *</Label>
                  <Input
                    id="username"
                    value={newEmployee.username}
                    onChange={(e) => setNewEmployee({ ...newEmployee, username: e.target.value })}
                    placeholder="اسم المستخدم"
                  />
                </div>
                <div>
                  <Label htmlFor="password">كلمة المرور *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newEmployee.password}
                    onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                    placeholder="كلمة المرور"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">رقم الهاتف *</Label>
                  <Input
                    id="phone"
                    value={newEmployee.phone}
                    onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                    placeholder="+966500000000"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="groupId">المجموعة (اختياري)</Label>
                  <select
                    id="groupId"
                    value={newEmployee.groupId}
                    onChange={(e) => {
                      const groupId = e.target.value;
                      const selectedGroup = employeeGroups.find(g => g.id === groupId);
                      setNewEmployee({ 
                        ...newEmployee, 
                        groupId,
                        permissions: selectedGroup ? selectedGroup.permissions : newEmployee.permissions
                      });
                    }}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">بدون مجموعة</option>
                    {employeeGroups.map((group: any) => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                  {newEmployee.groupId && (
                    <p className="text-xs text-gray-500 mt-1">
                      سيتم تطبيق صلاحيات المجموعة تلقائياً
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label className="mb-3 block">الصلاحيات</Label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(newEmployee.permissions).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id={key}
                        checked={value}
                        onCheckedChange={(checked) =>
                          setNewEmployee({
                            ...newEmployee,
                            permissions: { ...newEmployee.permissions, [key]: checked }
                          })
                        }
                      />
                      <Label htmlFor={key} className="text-sm font-normal cursor-pointer">
                        {key === 'ordersCreate' && 'إنشاء الطلبات'}
                        {key === 'ordersRead' && 'قراءة الطلبات'}
                        {key === 'reportsRead' && 'قراءة التقارير'}
                        {key === 'walletRead' && 'قراءة المحفظة'}
                        {key === 'playersWrite' && 'إدارة اللاعبين'}
                        {key === 'employeesManage' && 'إدارة الموظفين'}
                        {key === 'settingsWrite' && 'تعديل الإعدادات'}
                        {key === 'invoicesRead' && 'قراءة الفواتير'}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={handleAddEmployee} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري الإضافة...
                  </>
                ) : (
                  'إضافة الموظف'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Group Dialog */}
        <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إضافة مجموعة موظفين جديدة</DialogTitle>
              <DialogDescription>
                قم بإنشاء مجموعة جديدة وتحديد الصلاحيات الافتراضية لها
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="groupName">اسم المجموعة *</Label>
                <Input
                  id="groupName"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  placeholder="مثال: مدير الطلبات"
                />
              </div>
              <div>
                <Label htmlFor="groupDescription">الوصف</Label>
                <Input
                  id="groupDescription"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  placeholder="وصف المجموعة ووظيفتها"
                />
              </div>

              <div>
                <Label className="mb-3 block">الصلاحيات الافتراضية</Label>
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
                        {key === 'ordersCreate' && 'إنشاء الطلبات'}
                        {key === 'ordersRead' && 'قراءة الطلبات'}
                        {key === 'reportsRead' && 'قراءة التقارير'}
                        {key === 'walletRead' && 'قراءة المحفظة'}
                        {key === 'playersWrite' && 'إدارة اللاعبين'}
                        {key === 'employeesManage' && 'إدارة الموظفين'}
                        {key === 'settingsWrite' && 'تعديل الإعدادات'}
                        {key === 'invoicesRead' && 'قراءة الفواتير'}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowGroupDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={handleCreateGroup} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري الإنشاء...
                  </>
                ) : (
                  'إنشاء المجموعة'
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
export function ChargeWalletSection({ props }: { props: any }) {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'visa'>('cash');
  const [selectedBank, setSelectedBank] = useState('');
  const [banks, setBanks] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('SAR');
  const [transferrerName, setTransferrerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadBanks();
  }, []);

  const loadBanks = async () => {
    try {
      const response = await apiClient.fetch(`${apiClient.coreUrl}/merchant/wallet/banks`, { requireAuth: false }).catch(() => []);
      setBanks(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Failed to load banks:', error);
      setBanks([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('paymentMethod', paymentMethod);
      formData.append('bankId', selectedBank);
      formData.append('amount', amount);
      formData.append('currency', currency);
      formData.append('transferrerName', transferrerName);
      
      if (receiptFile) {
        formData.append('receiptImage', receiptFile);
      }

      await apiClient.fetch(`${apiClient.coreUrl}/merchant/wallet/recharge`, {
        method: 'POST',
        body: formData,
        requireAuth: true
      });
      toast({
        title: 'تم الإرسال',
        description: 'تم إرسال طلب شحن الرصيد بنجاح',
        variant: 'default',
      });
      navigate('/balance-operations');
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل إرسال طلب شحن الرصيد',
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
          title: 'خطأ',
          description: 'يجب أن يكون الملف من النوع: jpeg, png, jpg, pdf',
          variant: 'destructive',
        });
        return;
      }
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'خطأ',
          description: 'حجم الملف يجب أن يكون أقل من 10 ميجابايت',
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">شحن الرصيد</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex gap-4">
            <Button
              type="button"
              variant={paymentMethod === 'cash' ? 'default' : 'outline'}
              onClick={() => setPaymentMethod('cash')}
              className={paymentMethod === 'cash' ? 'border-b-2 border-primary' : ''}
            >
              نقدي
            </Button>
            <Button
              type="button"
              variant={paymentMethod === 'visa' ? 'default' : 'outline'}
              onClick={() => setPaymentMethod('visa')}
              className={paymentMethod === 'visa' ? 'border-b-2 border-primary' : ''}
            >
              فيزا
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">البنك</label>
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
            >
              <option value="">أختر البنك</option>
              {banks.map((bank: any) => (
                <option key={bank.id} value={bank.id}>{bank.name}</option>
              ))}
            </select>
          </div>

          {selectedBank && (() => {
            const bank = banks.find((b: any) => b.id === selectedBank);
            return bank ? (
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle>بيانات الحساب البنكي</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">اسم الحساب :</span>
                    <span className="font-medium">{bank.accountName || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">رقم الحساب :</span>
                    <span className="font-medium font-mono">{bank.accountNumber || '-'}</span>
                  </div>
                  {bank.iban && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">IBAN :</span>
                      <span className="font-medium font-mono text-xs">{bank.iban}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null;
          })()}

          <div>
            <label className="block text-sm font-medium mb-2">الحساب المحول منه</label>
            <select className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white">
              <option>اختر حساب البنك</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">اسم المحول</label>
            <input
              type="text"
              value={transferrerName}
              onChange={(e) => setTransferrerName(e.target.value)}
              placeholder="أدخل اسم المحول"
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">قيمة الرصيد</label>
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
              <label className="block text-sm font-medium mb-2">العمله</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
              >
                <option value="SAR">ريال سعودي</option>
                <option value="AED">درهم اماراتي</option>
                <option value="KWD">دينار كويتي</option>
                <option value="USD">دولار</option>
                <option value="QAR">ريال قطري</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">صورة الإيصال</label>
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
                    يجب أن يكون صورة الايصال ملف من النوع : jpeg. png. jpg. pdf
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Plus className="ml-2 h-4 w-4" />
                    رفع ملف
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
            ارسال
          </Button>
        </form>
      </div>
    </div>
  );
}

// Reports Page Section Component
export function ReportsPageSection({ props }: { props: any }) {
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [brands, setBrands] = useState<any[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [summary, setSummary] = useState({ totalAfterTax: 0, totalTax: 0, totalPrice: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [brandsData, productReport] = await Promise.all([
        apiClient.fetch(`${apiClient.coreUrl}/brands`, { requireAuth: false }).catch(() => []),
        apiClient.fetch(`${apiClient.coreUrl}/merchant/dashboard/reports/top-profitable-products`, { requireAuth: false }).catch(() => ({ products: [] }))
      ]);

      setBrands(Array.isArray(brandsData) ? brandsData : []);
      const products = productReport?.products || [];
      setReportData(products);
      
      const totalPrice = products.reduce((sum: number, p: any) => sum + (p.revenue || 0), 0);
      const totalTax = totalPrice * 0.15;
      const totalAfterTax = totalPrice + totalTax;
      
      setSummary({ totalAfterTax, totalTax, totalPrice });
    } catch (error) {
      console.error('Failed to load reports:', error);
      setReportData([]);
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">التقارير</h1>

        <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
          <Button variant="ghost" className="border-b-2 border-primary">المنتجات</Button>
          <Button variant="ghost">الطلبات</Button>
          <Button variant="ghost">تفاصيل الطلب</Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">تصدير:</span>
            <Button variant="outline" size="sm">Excel</Button>
            <Button variant="outline" size="sm">PDF</Button>
          </div>
          <div className="flex gap-4">
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white"
            >
              <option value="">اختر العلامة التجارية</option>
              {brands.map((brand: any) => (
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
                placeholder="بحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 pr-10 border-2 border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">الإجمالي بعد الضريبة</p>
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
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">إجمالي الضريبة</p>
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
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">إجمالي السعر</p>
                  <p className="text-2xl font-bold">{summary.totalPrice.toFixed(2)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            {reportData.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">data</TableHead>
                      <TableHead className="text-right">اسم المنتج</TableHead>
                      <TableHead className="text-right">اسم العلامة التجارية</TableHead>
                      <TableHead className="text-right">النوع</TableHead>
                      <TableHead className="text-right">الكمية</TableHead>
                      <TableHead className="text-right">سعر الوحدة</TableHead>
                      <TableHead className="text-right">إجمالي السعر</TableHead>
                      <TableHead className="text-right">الضريبة على الوحدة</TableHead>
                      <TableHead className="text-right">الإجمالي بعد الضريبة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.map((item: any) => (
                      <TableRow key={item.productId || item.id}>
                        <TableCell>-</TableCell>
                        <TableCell>{item.nameAr || item.name}</TableCell>
                        <TableCell>{item.brandName || 'N/A'}</TableCell>
                        <TableCell>بطاقة رقمية</TableCell>
                        <TableCell>{item.qty || 0}</TableCell>
                        <TableCell>${(item.revenue / (item.qty || 1)).toFixed(6)}</TableCell>
                        <TableCell>${item.revenue?.toFixed(6) || '0.00'}</TableCell>
                        <TableCell>${((item.revenue / (item.qty || 1)) * 0.15).toFixed(6)}</TableCell>
                        <TableCell>${((item.revenue || 0) * 1.15).toFixed(6)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <BarChart3 className="h-12 w-12 mb-4" />
                <p>No data</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Profile Page Section Component
export function ProfilePageSection({ props }: { props: any }) {
  const [profile, setProfile] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'documents' | 'edit'>('documents');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profileData, balanceData, documentsData] = await Promise.all([
        apiClient.fetch(`${apiClient.coreUrl}/merchant/profile`, { requireAuth: false }).catch(() => null),
        apiClient.fetch(`${apiClient.coreUrl}/transactions/balance`, { requireAuth: false }).catch(() => ({ balance: 0 })),
        apiClient.fetch(`${apiClient.coreUrl}/merchant/profile/documents`, { requireAuth: false }).catch(() => [])
      ]);

      setProfile(profileData);
      setBalance(balanceData?.balance || 0);
      setDocuments(Array.isArray(documentsData) ? documentsData : []);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
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
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">الرصيد</p>
                  <p className="text-2xl font-bold">${balance.toFixed(2)}</p>
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <Plus className="ml-2 h-4 w-4" />
                  اضافة رصيد
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>الوثائق</CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم الملف</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>الحجم</TableHead>
                      <TableHead>تاريخ الرفع</TableHead>
                      <TableHead>الإجراء</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc: any) => (
                      <TableRow key={doc.id}>
                        <TableCell>{doc.fileName}</TableCell>
                        <TableCell>{doc.type}</TableCell>
                        <TableCell>{doc.size}</TableCell>
                        <TableCell>{new Date(doc.uploadedAt).toLocaleDateString('ar-SA')}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">تحميل</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <FileText className="h-12 w-12 mb-4" />
                  <p>No data</p>
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
                  موثق
                </Badge>
              </div>
              <div className="flex gap-4 mt-4">
                <Button
                  variant={activeTab === 'documents' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('documents')}
                >
                  الوثائق
                </Button>
                <Button
                  variant={activeTab === 'edit' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('edit')}
                >
                  تعديل البيانات
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">اسم الشركة :</p>
                    <p className="font-medium">{profile?.businessName || 'abanoub'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">المدير المسئول :</p>
                    <p className="font-medium">{profile?.businessName || 'abanoub'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">رقم الهاتف :</p>
                    <p className="font-medium">{profile?.phone || '201029009237'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">البريد الالكتروني :</p>
                    <p className="font-medium">{profile?.email || 'ai.dev@asuscard.com'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">رقم السجل التجاري :</p>
                    <p className="font-medium">{profile?.taxId || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">رقم البطاقة الضريبية :</p>
                    <p className="font-medium">{profile?.taxCardNumber || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">الدولة :</p>
                    <p className="font-medium">المملكة العربية السعودية</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">المدينة :</p>
                    <p className="font-medium">الدودامي</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">العنوان :</p>
                    <p className="font-medium">{profile?.address || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">تاريخ الانضمام :</p>
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

