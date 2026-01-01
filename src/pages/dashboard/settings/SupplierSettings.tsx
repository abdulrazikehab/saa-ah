import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, Save, X, Percent, Link, Key, Zap, ShoppingCart, TrendingDown, RefreshCw, CheckCircle, XCircle, BarChart3, AlertTriangle, DollarSign, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { coreApi } from '@/lib/api';
import EmailTemplateEditor from './EmailTemplateEditor';

interface Supplier {
  id: string;
  name: string;
  nameAr?: string;
  email?: string;
  phone?: string;
  contactPerson?: string;
  address?: string;
  discountRate: number;
  isActive: boolean;
  notes?: string;
  // API Configuration
  apiEndpoint?: string;
  apiKey?: string;
  apiConfig?: Record<string, unknown>;
  autoPurchaseEnabled?: boolean;
  priceCheckInterval?: number;
  responseDays?: number; // Days supplier takes to respond to problems
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  nameAr?: string;
  price: number;
  costPerItem?: number;
  sku?: string;
}

interface SupplierPrice {
  supplierId: string;
  supplierName: string;
  price: number;
  available: boolean;
  productCode?: string;
}

interface Purchase {
  id: string;
  productId: string;
  productName: string;
  supplierId: string;
  supplierName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: string;
  purchaseDate: string;
  reason?: string;
}

interface SupplierStatistics {
  supplierId: string;
  supplierName: string;
  totalPurchases: number;
  totalSpent: number;
  totalQuantity: number;
  averagePrice: number;
  productsPurchased: Array<{
    productId: string;
    productName: string;
    quantity: number;
    totalSpent: number;
    averagePrice: number;
    lastPurchaseDate: string;
  }>;
  inventoryAlerts: Array<{
    productId: string;
    productName: string;
    currentQuantity: number;
    supplierQuantity?: number;
    threshold: number;
    alertLevel: 'critical' | 'warning' | 'low';
    needsRecharge: boolean;
  }>;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface RawPurchase {
  id: string;
  productId: string;
  product?: { name?: string; nameAr?: string };
  supplierId: string;
  supplier?: { name?: string; nameAr?: string };
  quantity: number | string;
  unitPrice: number | string;
  totalAmount: number | string;
  status: string;
  purchaseDate: string;
  reason?: string;
}

const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) {
      return response.data.message;
    }
  }
  return 'An unexpected error occurred';
};

export default function SupplierSettings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [productPrices, setProductPrices] = useState<SupplierPrice[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [statistics, setStatistics] = useState<SupplierStatistics[]>([]);
  const [selectedSupplierForStats, setSelectedSupplierForStats] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [checkingPrices, setCheckingPrices] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    email: '',
    phone: '',
    contactPerson: '',
    address: '',
    discountRate: 0,
    notes: '',
    isActive: true,
    // API Configuration
    apiEndpoint: '',
    apiKey: '',
    autoPurchaseEnabled: false,
    priceCheckInterval: 60,
    responseDays: 3,
  });

  useEffect(() => {
    loadSuppliers();
    loadProducts();
    loadPurchases();
    loadStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStatistics = async () => {
    try {
      setLoadingStats(true);
      const response = await coreApi.get('/suppliers/statistics/all', { requireAuth: true });
      
      let statsData: SupplierStatistics[] = [];
      if (Array.isArray(response)) {
        statsData = response;
      } else if (response && typeof response === 'object' && 'data' in response && Array.isArray((response as PaginatedResponse<SupplierStatistics>).data)) {
        statsData = (response as PaginatedResponse<SupplierStatistics>).data;
      }
      
      setStatistics(statsData);
    } catch (error) {
      console.error('Failed to load statistics:', error);
      setStatistics([]);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const response = await coreApi.get('/suppliers', { requireAuth: true });
      
      let suppliersData: Supplier[] = [];
      if (Array.isArray(response)) {
        suppliersData = response;
      } else if (response && typeof response === 'object' && 'data' in response && Array.isArray((response as PaginatedResponse<Supplier>).data)) {
        suppliersData = (response as PaginatedResponse<Supplier>).data;
      }

      const validSuppliers = suppliersData.filter((s: unknown): s is Supplier =>
        s !== null && typeof s === 'object' && 'id' in s && !('error' in s)
      );
      setSuppliers(validSuppliers);
    } catch (error: unknown) {
      console.error('Failed to load suppliers:', error);
      setSuppliers([]);
      const errorMessage = getErrorMessage(error);
      toast({
        title: t('dashboard.suppliers.toasts.loadError'),
        description: errorMessage || t('dashboard.suppliers.toasts.loadErrorDesc'),
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingSupplier) {
        await coreApi.put(`/suppliers/${encodeURIComponent(editingSupplier.id)}`, {
          ...formData,
          discountRate: parseFloat(formData.discountRate.toString()),
          isActive: formData.isActive ?? true,
        }, { requireAuth: true });
        toast({
          title: t('common.success'),
          description: t('dashboard.suppliers.toasts.updateSuccess'),
        });
      } else {
        await coreApi.post('/suppliers', {
          ...formData,
          discountRate: parseFloat(formData.discountRate.toString()),
          isActive: formData.isActive ?? true,
        }, { requireAuth: true });
        toast({
          title: t('common.success'),
          description: t('dashboard.suppliers.toasts.addSuccess'),
        });
      }
      setIsDialogOpen(false);
      resetForm();
      loadSuppliers();
    } catch (error: unknown) {
      toast({
        title: t('dashboard.suppliers.toasts.saveError'),
        description: getErrorMessage(error) || t('dashboard.suppliers.toasts.saveErrorDesc'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      nameAr: supplier.nameAr || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      contactPerson: supplier.contactPerson || '',
      address: supplier.address || '',
      discountRate: Number(supplier.discountRate),
      notes: supplier.notes || '',
      isActive: supplier.isActive ?? true,
      // API Configuration
      apiEndpoint: supplier.apiEndpoint || '',
      apiKey: supplier.apiKey || '',
      autoPurchaseEnabled: supplier.autoPurchaseEnabled || false,
      priceCheckInterval: supplier.priceCheckInterval || 60,
      responseDays: supplier.responseDays || 3,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('dashboard.suppliers.dialogs.deleteConfirm'))) return;

    try {
      const response = await coreApi.delete(`/suppliers/${encodeURIComponent(id)}`, { requireAuth: true });
      // Backend may return the updated supplier (soft delete) or nothing (hard delete)
      // In both cases, reload the list
      toast({
        title: t('common.success'),
        description: response?.isActive === false 
          ? t('dashboard.suppliers.toasts.deactivateSuccess') 
          : t('dashboard.suppliers.toasts.deleteSuccess'),
      });
      // Always reload to get the updated list
      await loadSuppliers();
    } catch (error: unknown) {
      console.error('Failed to delete supplier:', error);
      const errorMessage = getErrorMessage(error);
      toast({
        title: t('dashboard.suppliers.toasts.deleteError'),
        description: errorMessage || t('dashboard.suppliers.toasts.deleteErrorDesc'),
        variant: 'destructive',
      });
    }
  };

  const loadProducts = async () => {
    try {
      const response = await coreApi.get('/products?limit=1000', { requireAuth: true }).catch(() => []);
      
      let productsData: Product[] = [];
      if (Array.isArray(response)) {
        productsData = response;
      } else if (response && typeof response === 'object' && 'data' in response && Array.isArray((response as PaginatedResponse<Product>).data)) {
        productsData = (response as PaginatedResponse<Product>).data;
      }

      setProducts(productsData.filter((p: unknown): p is Product =>
        p !== null && typeof p === 'object' && 'id' in p
      ));
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const loadPurchases = async () => {
    try {
      const response = await coreApi.get('/supplier-api/purchases', { requireAuth: true });
      
      let purchasesData: RawPurchase[] = [];
      if (Array.isArray(response)) {
        purchasesData = response as RawPurchase[];
      } else if (response && typeof response === 'object' && 'data' in response && Array.isArray((response as PaginatedResponse<RawPurchase>).data)) {
        purchasesData = (response as PaginatedResponse<RawPurchase>).data;
      }

      const validPurchases = purchasesData.map((p: RawPurchase) => ({
        id: p.id,
        productId: p.productId,
        productName: p.product?.nameAr || p.product?.name || 'Unknown Product',
        supplierId: p.supplierId,
        supplierName: p.supplier?.nameAr || p.supplier?.name || 'Unknown Supplier',
        quantity: Number(p.quantity),
        unitPrice: Number(p.unitPrice),
        totalAmount: Number(p.totalAmount),
        status: p.status,
        purchaseDate: p.purchaseDate,
        reason: p.reason,
      }));
      setPurchases(validPurchases);
    } catch (error) {
      console.error('Failed to load purchases:', error);
      setPurchases([]);
    }
  };

  const checkProductPrices = async (productId: string) => {
    if (!productId) return;
    setCheckingPrices(true);
    try {
      const response = await coreApi.get(`/supplier-api/prices/${productId}`, { requireAuth: true });
      setProductPrices(Array.isArray(response) ? response : []);
      if (response.length === 0) {
        toast({
          title: t('dashboard.suppliers.toasts.noPrices'),
          description: t('dashboard.suppliers.toasts.noPricesDesc'),
        });
      }
    } catch (error: unknown) {
      toast({
        title: t('dashboard.suppliers.toasts.fetchPricesError'),
        description: getErrorMessage(error) || t('dashboard.suppliers.toasts.fetchPricesErrorDesc'),
        variant: 'destructive',
      });
      setProductPrices([]);
    } finally {
      setCheckingPrices(false);
    }
  };

  const getBestSupplier = async (productId: string) => {
    if (!productId) return;
    setCheckingPrices(true);
    try {
      const response = await coreApi.get(`/supplier-api/best/${productId}`, { requireAuth: true });
      if (response && response.shouldPurchase) {
        setProductPrices([{
          supplierId: response.supplierId,
          supplierName: response.supplierName,
          price: response.price,
          available: true,
        }]);
        toast({
          title: t('dashboard.suppliers.toasts.bestSupplierFound'),
          description: `${response.supplierName}: ${response.price} - ${response.reason}`,
        });
      } else {
        toast({
          title: t('dashboard.suppliers.toasts.noSuitableSupplier'),
          description: response?.reason || t('dashboard.suppliers.toasts.noSuitableSupplierDesc'),
          variant: 'destructive',
        });
      }
    } catch (error: unknown) {
      toast({
        title: t('dashboard.suppliers.toasts.findBestError'),
        description: getErrorMessage(error) || t('dashboard.suppliers.toasts.findBestErrorDesc'),
        variant: 'destructive',
      });
    } finally {
      setCheckingPrices(false);
    }
  };

  const handlePurchase = async (productId: string, supplierId: string, quantity: number) => {
    setPurchaseLoading(true);
    try {
      const response = await coreApi.post(
        `/supplier-api/purchase/${productId}/${supplierId}`,
        { quantity },
        { requireAuth: true }
      );
      toast({
        title: t('dashboard.suppliers.toasts.purchaseSuccess'),
        description: t('dashboard.suppliers.toasts.purchaseSuccessDesc', { quantity }),
      });
      setIsPurchaseDialogOpen(false);
      setSelectedProduct('');
      setProductPrices([]);
      loadPurchases();
      loadProducts(); // Refresh products to update inventory
      loadStatistics(); // Refresh statistics after purchase
    } catch (error: unknown) {
      toast({
        title: t('dashboard.suppliers.toasts.purchaseError'),
        description: getErrorMessage(error) || t('dashboard.suppliers.toasts.purchaseErrorDesc'),
        variant: 'destructive',
      });
    } finally {
      setPurchaseLoading(false);
    }
  };

  const handleAutoPurchase = async (productId: string, quantity: number) => {
    setPurchaseLoading(true);
    try {
      const response = await coreApi.post(
        `/supplier-api/auto-purchase/${productId}`,
        { quantity },
        { requireAuth: true }
      );
      toast({
        title: t('dashboard.suppliers.toasts.autoPurchaseSuccess'),
        description: t('dashboard.suppliers.toasts.autoPurchaseSuccessDesc', { quantity }),
      });
      setIsPurchaseDialogOpen(false);
      setSelectedProduct('');
      setProductPrices([]);
      loadPurchases();
      loadProducts();
      loadStatistics(); // Refresh statistics after purchase
    } catch (error: unknown) {
      toast({
        title: t('dashboard.suppliers.toasts.autoPurchaseError'),
        description: getErrorMessage(error) || t('dashboard.suppliers.toasts.autoPurchaseErrorDesc'),
        variant: 'destructive',
      });
    } finally {
      setPurchaseLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      nameAr: '',
      email: '',
      phone: '',
      contactPerson: '',
      address: '',
      discountRate: 0,
      notes: '',
      isActive: true,
      // API Configuration
      apiEndpoint: '',
      apiKey: '',
      autoPurchaseEnabled: false,
      priceCheckInterval: 60,
      responseDays: 3,
    });
    setEditingSupplier(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{t('dashboard.suppliers.title')}</h2>
          <p className="text-gray-600 dark:text-gray-400">{t('dashboard.suppliers.subtitle')}</p>
        </div>
      </div>

      <Tabs defaultValue="suppliers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="suppliers">{t('dashboard.suppliers.tabs.manage')}</TabsTrigger>
          <TabsTrigger value="purchase">{t('dashboard.suppliers.tabs.purchase')}</TabsTrigger>
          <TabsTrigger value="history">{t('dashboard.suppliers.tabs.history')}</TabsTrigger>
          <TabsTrigger value="statistics">{t('dashboard.suppliers.tabs.statistics')}</TabsTrigger>
          <TabsTrigger value="email-template">{t('dashboard.suppliers.tabs.emailTemplate')}</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              {t('dashboard.suppliers.addSupplier')}
            </Button>
          </div>

          <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.suppliers.listTitle')}</CardTitle>
          <CardDescription>{t('dashboard.suppliers.listDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('dashboard.suppliers.table.name')}</TableHead>
                <TableHead>{t('dashboard.suppliers.table.email')}</TableHead>
                <TableHead>{t('dashboard.suppliers.table.phone')}</TableHead>
                <TableHead>{t('dashboard.suppliers.table.discount')}</TableHead>
                <TableHead>{t('dashboard.suppliers.table.api')}</TableHead>
                <TableHead>{t('dashboard.suppliers.table.status')}</TableHead>
                <TableHead>{t('dashboard.suppliers.table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell>{String(supplier.name || '')}</TableCell>
                  <TableCell>{String(supplier.email || '-')}</TableCell>
                  <TableCell>{String(supplier.phone || '-')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Percent className="h-4 w-4" />
                      {Number(supplier.discountRate).toFixed(2)}%
                    </div>
                  </TableCell>
                  <TableCell>
                    {supplier.apiEndpoint ? (
                      <div className="flex items-center gap-1">
                        <Link className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-600 dark:text-green-400">
                          {supplier.autoPurchaseEnabled ? t('dashboard.suppliers.status.enabled') : t('dashboard.suppliers.status.configured')}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${
                      supplier.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    }`}>
                      {supplier.isActive ? t('dashboard.suppliers.status.active') : t('dashboard.suppliers.status.inactive')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(supplier)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(supplier.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="purchase" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                {t('dashboard.suppliers.purchase.title')}
              </CardTitle>
              <CardDescription>
                {t('dashboard.suppliers.purchase.desc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="product-select">{t('dashboard.suppliers.purchase.selectProduct')}</Label>
                <div className="flex gap-2 mt-2">
                  <select
                    id="product-select"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={selectedProduct}
                    onChange={(e) => {
                      setSelectedProduct(e.target.value);
                      if (e.target.value) {
                        checkProductPrices(e.target.value);
                      } else {
                        setProductPrices([]);
                      }
                    }}
                  >
                    <option value="">-- {t('dashboard.suppliers.purchase.selectProduct')} --</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.nameAr || product.name} - {product.sku || product.id}
                      </option>
                    ))}
                  </select>
                  {selectedProduct && (
                    <Button
                      variant="outline"
                      onClick={() => getBestSupplier(selectedProduct)}
                      disabled={checkingPrices}
                    >
                      <TrendingDown className="h-4 w-4 mr-2" />
                      {checkingPrices ? t('common.loading') : t('dashboard.suppliers.purchase.checkPrice')}
                    </Button>
                  )}
                </div>
              </div>

              {productPrices.length > 0 && (
                <div className="space-y-2">
                  <Label>{t('dashboard.suppliers.purchase.pricesFromSuppliers')}:</Label>
                  <div className="space-y-2">
                    {productPrices.map((priceInfo, index) => {
                      const product = products.find(p => p.id === selectedProduct);
                      const cost = product?.costPerItem || 0;
                      const sellingPrice = product?.price || 0;
                      const isFavorable = priceInfo.price > cost && priceInfo.price < sellingPrice;
                      
                      return (
                        <Card key={index} className={isFavorable ? 'border-green-500' : ''}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-semibold">{priceInfo.supplierName}</div>
                                <div className="text-sm text-gray-500">
                                  {t('dashboard.suppliers.purchase.price')} {priceInfo.price} {priceInfo.available ? `✅ ${t('dashboard.suppliers.purchase.available')}` : `❌ ${t('dashboard.suppliers.purchase.unavailable')}`}
                                </div>
                                {product && (
                                  <div className="text-xs text-gray-400 mt-1">
                                    {t('dashboard.suppliers.purchase.cost')} {cost} | {t('dashboard.suppliers.purchase.sellingPrice')} {sellingPrice} | {t('dashboard.suppliers.purchase.profit')} {sellingPrice - priceInfo.price}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                {isFavorable && priceInfo.available && (
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setPurchaseQuantity(1);
                                      setIsPurchaseDialogOpen(true);
                                      // Store selected supplier for purchase
                                      (window as Window & { selectedSupplierForPurchase?: string }).selectedSupplierForPurchase = priceInfo.supplierId;
                                    }}
                                  >
                                    <ShoppingCart className="h-4 w-4 mr-1" />
                                    {t('dashboard.suppliers.purchase.buy')}
                                  </Button>
                                )}
                                {!isFavorable && (
                                  <Badge variant="destructive">{t('dashboard.suppliers.purchase.badPrice')}</Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  
                  {productPrices.some(p => {
                    const product = products.find(pr => pr.id === selectedProduct);
                    return p.available && product && p.price > (product.costPerItem || 0) && p.price < product.price;
                  }) && (
                    <Button
                      className="w-full"
                      onClick={() => {
                        setPurchaseQuantity(1);
                        setIsPurchaseDialogOpen(true);
                        (window as Window & { selectedSupplierForPurchase?: string | null }).selectedSupplierForPurchase = null; // null means auto-select
                      }}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      {t('dashboard.suppliers.purchase.buyBestAuto')}
                    </Button>
                  )}
                </div>
              )}

              {selectedProduct && productPrices.length === 0 && !checkingPrices && (
                <div className="text-center py-8 text-gray-500">
                  {t('dashboard.suppliers.purchase.noPrices')}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                {t('dashboard.suppliers.history.title')}
              </CardTitle>
              <CardDescription>{t('dashboard.suppliers.history.desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {purchases.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {t('dashboard.suppliers.history.noPurchases')}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('dashboard.suppliers.history.table.product')}</TableHead>
                      <TableHead>{t('dashboard.suppliers.history.table.supplier')}</TableHead>
                      <TableHead>{t('dashboard.suppliers.history.table.quantity')}</TableHead>
                      <TableHead>{t('dashboard.suppliers.history.table.price')}</TableHead>
                      <TableHead>{t('dashboard.suppliers.history.table.total')}</TableHead>
                      <TableHead>{t('dashboard.suppliers.history.table.status')}</TableHead>
                      <TableHead>{t('dashboard.suppliers.history.table.date')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell>{purchase.productName}</TableCell>
                        <TableCell>{purchase.supplierName}</TableCell>
                        <TableCell>{purchase.quantity}</TableCell>
                        <TableCell>{purchase.unitPrice}</TableCell>
                        <TableCell>{purchase.totalAmount}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              purchase.status === 'COMPLETED' ? 'default' :
                              purchase.status === 'REFUNDED' ? 'destructive' :
                              'secondary'
                            }
                          >
                            {purchase.status === 'COMPLETED' ? t('dashboard.header.completed') :
                             purchase.status === 'REFUNDED' ? t('dashboard.orders.refunded') :
                             purchase.status === 'CANCELLED' ? t('dashboard.orders.cancelled') : purchase.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(purchase.purchaseDate).toLocaleDateString('ar-SA')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {t('dashboard.suppliers.statistics.title')}
              </CardTitle>
              <CardDescription>
                {t('dashboard.suppliers.statistics.desc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p className="mt-4 text-muted-foreground">{t('dashboard.suppliers.statistics.loading')}</p>
                </div>
              ) : statistics.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {t('dashboard.suppliers.statistics.noStats')}
                </div>
              ) : (
                <div className="space-y-6">
                  {statistics.map((stat) => (
                    <Card key={stat.supplierId} className="border-l-4 border-l-primary">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl">{stat.supplierName}</CardTitle>
                            <CardDescription>{t('dashboard.suppliers.statistics.desc')}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Summary Statistics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              <span className="text-sm text-muted-foreground">{t('dashboard.suppliers.statistics.summary.totalPurchases')}</span>
                            </div>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stat.totalPurchases}</p>
                          </div>
                          <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                              <span className="text-sm text-muted-foreground">{t('dashboard.suppliers.statistics.summary.totalAmount')}</span>
                            </div>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {stat.totalSpent.toFixed(2)} {t('common.sar')}
                            </p>
                          </div>
                          <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                              <span className="text-sm text-muted-foreground">{t('dashboard.suppliers.statistics.summary.totalQuantity')}</span>
                            </div>
                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stat.totalQuantity}</p>
                          </div>
                          <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <TrendingDown className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                              <span className="text-sm text-muted-foreground">{t('dashboard.suppliers.statistics.summary.averagePrice')}</span>
                            </div>
                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                              {stat.averagePrice.toFixed(2)} {t('common.sar')}
                            </p>
                          </div>
                        </div>

                        {/* Products Purchased */}
                        {stat.productsPurchased.length > 0 && (
                          <div>
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              {t('dashboard.suppliers.statistics.products.title')}
                            </h3>
                            <div className="space-y-2">
                              {stat.productsPurchased.map((product) => (
                                <div key={product.productId} className="p-3 border rounded-lg flex justify-between items-center">
                                  <div>
                                    <p className="font-medium">{product.productName}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {t('dashboard.suppliers.statistics.products.quantity')} {product.quantity} | {t('dashboard.suppliers.statistics.products.avgPrice')} {product.averagePrice.toFixed(2)} {t('common.sar')}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {t('dashboard.suppliers.statistics.products.lastPurchase')} {new Date(product.lastPurchaseDate).toLocaleDateString('ar-SA')}
                                    </p>
                                  </div>
                                  <div className="text-left">
                                    <p className="font-bold text-green-600 dark:text-green-400">
                                      {product.totalSpent.toFixed(2)} {t('common.sar')}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{t('dashboard.suppliers.statistics.products.totalAmount')}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Inventory Alerts */}
                        {stat.inventoryAlerts.length > 0 && (
                          <div>
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                              {t('dashboard.suppliers.statistics.alerts.title')}
                            </h3>
                            <div className="space-y-2">
                              {stat.inventoryAlerts.map((alert) => (
                                <div
                                  key={alert.productId}
                                  className={`p-4 border-l-4 rounded-lg ${
                                    alert.alertLevel === 'critical'
                                      ? 'bg-red-50 dark:bg-red-950/20 border-red-500'
                                      : alert.alertLevel === 'warning'
                                      ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-500'
                                      : 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-500'
                                  }`}
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <AlertTriangle
                                          className={`h-4 w-4 ${
                                            alert.alertLevel === 'critical'
                                              ? 'text-red-500'
                                              : alert.alertLevel === 'warning'
                                              ? 'text-orange-500'
                                              : 'text-yellow-500'
                                          }`}
                                        />
                                        <p className="font-semibold">{alert.productName}</p>
                                        <Badge
                                          variant={
                                            alert.alertLevel === 'critical'
                                              ? 'destructive'
                                              : alert.alertLevel === 'warning'
                                              ? 'default'
                                              : 'secondary'
                                          }
                                        >
                                          {alert.alertLevel === 'critical'
                                            ? t('dashboard.suppliers.statistics.alerts.critical')
                                            : alert.alertLevel === 'warning'
                                            ? t('dashboard.suppliers.statistics.alerts.warning')
                                            : t('dashboard.suppliers.statistics.alerts.low')}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        {t('dashboard.suppliers.statistics.alerts.current')} <span className="font-bold">{alert.currentQuantity}</span> | 
                                        {t('dashboard.suppliers.statistics.alerts.threshold')} <span className="font-bold">{alert.threshold}</span>
                                      </p>
                                      {alert.needsRecharge && (
                                        <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-semibold">
                                          ⚠️ {t('dashboard.suppliers.statistics.alerts.needsRecharge')}
                                        </p>
                                      )}
                                    </div>
                                    {alert.needsRecharge && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setSelectedProduct(alert.productId);
                                          checkProductPrices(alert.productId);
                                          // Switch to purchase tab
                                          const tabsElement = document.querySelector('[value="purchase"]') as HTMLElement;
                                          if (tabsElement) {
                                            tabsElement.click();
                                          }
                                        }}
                                      >
                                        <ShoppingCart className="h-4 w-4 ml-2" />
                                        {t('dashboard.suppliers.purchase.buyNow')}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {stat.inventoryAlerts.length === 0 && (
                          <div className="text-center py-4 text-green-600 dark:text-green-400">
                            <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                            <p>{t('dashboard.suppliers.statistics.alerts.allNormal')}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email-template" className="space-y-4">
          <EmailTemplateEditor />
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? t('dashboard.suppliers.dialogs.editSupplier') : t('dashboard.suppliers.dialogs.addSupplier')}</DialogTitle>
            <DialogDescription>{t('dashboard.suppliers.dialogs.desc')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">{t('dashboard.suppliers.dialogs.name')}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="nameAr">{t('dashboard.suppliers.dialogs.nameAr')}</Label>
                <Input
                  id="nameAr"
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">{t('dashboard.suppliers.dialogs.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">{t('dashboard.suppliers.dialogs.phone')}</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="contactPerson">{t('dashboard.suppliers.dialogs.contactPerson')}</Label>
              <Input
                id="contactPerson"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="address">{t('dashboard.suppliers.dialogs.address')}</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="discountRate">{t('dashboard.suppliers.dialogs.discount')}</Label>
                <Input
                  id="discountRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.discountRate}
                  onChange={(e) => setFormData({ ...formData, discountRate: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="responseDays">{t('dashboard.suppliers.dialogs.responseDays')}</Label>
                <Input
                  id="responseDays"
                  type="number"
                  min="1"
                  max="30"
                  value={formData.responseDays}
                  onChange={(e) => setFormData({ ...formData, responseDays: parseInt(e.target.value) || 3 })}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('dashboard.suppliers.dialogs.responseDaysHint', { days: formData.responseDays + 1 })}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">{t('dashboard.suppliers.dialogs.status')}</Label>
                <p className="text-sm text-gray-500">
                  {t('dashboard.suppliers.dialogs.statusDesc')}
                </p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>

            <div>
              <Label htmlFor="notes">{t('dashboard.suppliers.dialogs.notes')}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <Separator className="my-4" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Link className="h-4 w-4" />
                    {t('dashboard.suppliers.dialogs.api.title')}
                  </Label>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('dashboard.suppliers.dialogs.api.desc')}
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="apiEndpoint">{t('dashboard.suppliers.dialogs.api.endpoint')}</Label>
                <Input
                  id="apiEndpoint"
                  type="url"
                  placeholder="https://api.supplier.com/v1"
                  value={formData.apiEndpoint}
                  onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('dashboard.suppliers.dialogs.api.endpointHint')}
                </p>
              </div>

              <div>
                <Label htmlFor="apiKey">{t('dashboard.suppliers.dialogs.api.key')}</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder={t('dashboard.suppliers.dialogs.api.key')}
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('dashboard.suppliers.dialogs.api.keyHint')}
                </p>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="autoPurchaseEnabled" className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    {t('dashboard.suppliers.dialogs.api.autoPurchase')}
                  </Label>
                  <p className="text-sm text-gray-500">
                    {t('dashboard.suppliers.dialogs.api.autoPurchaseDesc')}
                  </p>
                </div>
                <Switch
                  id="autoPurchaseEnabled"
                  checked={formData.autoPurchaseEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, autoPurchaseEnabled: checked })}
                />
              </div>

              {formData.autoPurchaseEnabled && (
                <div>
                  <Label htmlFor="priceCheckInterval">{t('dashboard.suppliers.dialogs.api.interval')}</Label>
                  <Input
                    id="priceCheckInterval"
                    type="number"
                    min="1"
                    max="1440"
                    value={formData.priceCheckInterval}
                    onChange={(e) => setFormData({ ...formData, priceCheckInterval: parseInt(e.target.value) || 60 })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t('dashboard.suppliers.dialogs.api.intervalHint')}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                <X className="h-4 w-4 mr-2" />
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? t('common.saving') : t('common.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPurchaseDialogOpen} onOpenChange={setIsPurchaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dashboard.suppliers.dialogs.purchase.title')}</DialogTitle>
            <DialogDescription>
              {products.find(p => p.id === selectedProduct)?.nameAr || products.find(p => p.id === selectedProduct)?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="quantity">{t('dashboard.suppliers.dialogs.purchase.quantity')}</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={purchaseQuantity}
                onChange={(e) => setPurchaseQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
            {productPrices.length > 0 && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="text-sm">
                  <div>{t('dashboard.suppliers.history.table.supplier')}: {productPrices[0]?.supplierName}</div>
                  <div>{t('dashboard.suppliers.purchase.price')} {productPrices[0]?.price}</div>
                  <div className="font-semibold mt-2">{t('dashboard.suppliers.history.table.total')}: {productPrices[0]?.price * purchaseQuantity}</div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPurchaseDialogOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => {
                const supplierId = (window as Window & { selectedSupplierForPurchase?: string | null }).selectedSupplierForPurchase;
                if (supplierId) {
                  handlePurchase(selectedProduct, supplierId, purchaseQuantity);
                } else {
                  handleAutoPurchase(selectedProduct, purchaseQuantity);
                }
              }}
              disabled={purchaseLoading || !selectedProduct}
            >
              {purchaseLoading ? t('dashboard.suppliers.dialogs.purchase.loading') : t('dashboard.suppliers.dialogs.purchase.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

