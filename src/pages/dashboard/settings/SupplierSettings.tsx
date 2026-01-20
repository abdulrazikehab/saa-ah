import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Percent, Link, Key, Zap, ShoppingCart, TrendingDown, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
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
  return 'حدث خطأ غير متوقع';
};

export default function SupplierSettings() {
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [productPrices, setProductPrices] = useState<SupplierPrice[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [checkingPrices, setCheckingPrices] = useState(false);
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
  });

  useEffect(() => {
    loadSuppliers();
    loadProducts();
    loadPurchases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSuppliers = async () => {
    try {
      const response = await coreApi.get('/suppliers', { requireAuth: true });
      // Validate response is an array of valid supplier objects
      if (Array.isArray(response)) {
        const validSuppliers = response.filter((s: unknown): s is Supplier =>
          s !== null && typeof s === 'object' && 'id' in s && !('error' in s)
        );
        setSuppliers(validSuppliers);
      } else {
        setSuppliers([]);
      }
    } catch (error: unknown) {
      console.error('Failed to load suppliers:', error);
      setSuppliers([]);
      const errorMessage = getErrorMessage(error);
      toast({
        title: 'تعذر تحميل الموردين',
        description: errorMessage || 'حدث خطأ أثناء تحميل الموردين. يرجى تحديث الصفحة.',
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
          title: 'نجح',
          description: 'تم تحديث المورد بنجاح',
        });
      } else {
        await coreApi.post('/suppliers', {
          ...formData,
          discountRate: parseFloat(formData.discountRate.toString()),
          isActive: formData.isActive ?? true,
        }, { requireAuth: true });
        toast({
          title: 'نجح',
          description: 'تم إضافة المورد بنجاح',
        });
      }
      setIsDialogOpen(false);
      resetForm();
      loadSuppliers();
    } catch (error: unknown) {
      toast({
        title: 'تعذر حفظ المورد',
        description: getErrorMessage(error) || 'حدث خطأ أثناء حفظ المورد. يرجى المحاولة مرة أخرى.',
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
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المورد؟')) return;

    try {
      const response = await coreApi.delete(`/suppliers/${encodeURIComponent(id)}`, { requireAuth: true });
      // Backend may return the updated supplier (soft delete) or nothing (hard delete)
      // In both cases, reload the list
      toast({
        title: 'نجح',
        description: response?.isActive === false 
          ? 'تم تعطيل المورد (يستخدم في منتجات)' 
          : 'تم حذف المورد بنجاح',
      });
      // Always reload to get the updated list
      await loadSuppliers();
    } catch (error: unknown) {
      console.error('Failed to delete supplier:', error);
      const errorMessage = getErrorMessage(error);
      toast({
        title: 'تعذر حذف المورد',
        description: errorMessage || 'حدث خطأ أثناء حذف المورد. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    }
  };

  const loadProducts = async () => {
    try {
      const response = await coreApi.get('/products?limit=1000', { requireAuth: true }).catch(() => []);
      if (Array.isArray(response)) {
        setProducts(response.filter((p: unknown): p is Product =>
          p !== null && typeof p === 'object' && 'id' in p
        ));
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const loadPurchases = async () => {
    try {
      const response = await coreApi.get('/supplier-api/purchases', { requireAuth: true });
      if (Array.isArray(response)) {
        const validPurchases = response.map((p: {
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
        }) => ({
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
      } else {
        setPurchases([]);
      }
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
          title: 'لا توجد أسعار',
          description: 'لا توجد موردين مرتبطين بهذا المنتج أو لا يوجد API مضبوط',
        });
      }
    } catch (error: unknown) {
      toast({
        title: 'تعذر جلب الأسعار',
        description: getErrorMessage(error) || 'حدث خطأ أثناء جلب الأسعار من الموردين',
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
          title: 'تم العثور على أفضل مورد',
          description: `${response.supplierName}: ${response.price} - ${response.reason}`,
        });
      } else {
        toast({
          title: 'لا يوجد مورد مناسب',
          description: response?.reason || 'لا يوجد مورد يلبي معايير السعر',
          variant: 'destructive',
        });
      }
    } catch (error: unknown) {
      toast({
        title: 'تعذر العثور على أفضل مورد',
        description: getErrorMessage(error) || 'حدث خطأ أثناء البحث عن أفضل مورد',
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
        title: 'نجح الشراء',
        description: `تم الشراء من المورد بنجاح. الكمية: ${quantity}`,
      });
      setIsPurchaseDialogOpen(false);
      setSelectedProduct('');
      setProductPrices([]);
      loadPurchases();
      loadProducts(); // Refresh products to update inventory
    } catch (error: unknown) {
      toast({
        title: 'فشل الشراء',
        description: getErrorMessage(error) || 'حدث خطأ أثناء الشراء من المورد',
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
        title: 'نجح الشراء التلقائي',
        description: `تم الشراء من أفضل مورد بنجاح. الكمية: ${quantity}`,
      });
      setIsPurchaseDialogOpen(false);
      setSelectedProduct('');
      setProductPrices([]);
      loadPurchases();
      loadProducts();
    } catch (error: unknown) {
      toast({
        title: 'فشل الشراء التلقائي',
        description: getErrorMessage(error) || 'حدث خطأ أثناء الشراء التلقائي',
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
    });
    setEditingSupplier(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">إدارة الموردين والشراء</h2>
          <p className="text-gray-600 dark:text-gray-400">إدارة الموردين والشراء التلقائي من الموردين</p>
        </div>
      </div>

      <Tabs defaultValue="suppliers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="suppliers">إدارة الموردين</TabsTrigger>
          <TabsTrigger value="purchase">الشراء من الموردين</TabsTrigger>
          <TabsTrigger value="history">سجل المشتريات</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              إضافة مورد
            </Button>
          </div>

          <Card>
        <CardHeader>
          <CardTitle>قائمة الموردين</CardTitle>
          <CardDescription>جميع الموردين المسجلين في النظام</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full max-w-full overflow-x-auto">
            <Table style={{ minWidth: '800px' }}>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>البريد الإلكتروني</TableHead>
                <TableHead>الهاتف</TableHead>
                <TableHead>معدل الخصم</TableHead>
                <TableHead>API</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
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
                          {supplier.autoPurchaseEnabled ? 'مفعل' : 'مضبوط'}
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
                      {supplier.isActive ? 'نشط' : 'غير نشط'}
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
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="purchase" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                الشراء من الموردين
              </CardTitle>
              <CardDescription>
                اختر منتج للشراء من الموردين. سيتم اختيار أفضل مورد تلقائياً بناءً على السعر
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="product-select">اختر المنتج</Label>
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
                    <option value="">-- اختر منتج --</option>
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
                      {checkingPrices ? 'جاري البحث...' : 'أفضل مورد'}
                    </Button>
                  )}
                </div>
              </div>

              {productPrices.length > 0 && (
                <div className="space-y-2">
                  <Label>الأسعار من الموردين:</Label>
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
                                  السعر: {priceInfo.price} {priceInfo.available ? '✅ متوفر' : '❌ غير متوفر'}
                                </div>
                                {product && (
                                  <div className="text-xs text-gray-400 mt-1">
                                    التكلفة: {cost} | سعر البيع: {sellingPrice} | الربح: {sellingPrice - priceInfo.price}
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
                                    شراء
                                  </Button>
                                )}
                                {!isFavorable && (
                                  <Badge variant="destructive">سعر غير مناسب</Badge>
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
                      شراء من أفضل مورد تلقائياً
                    </Button>
                  )}
                </div>
              )}

              {selectedProduct && productPrices.length === 0 && !checkingPrices && (
                <div className="text-center py-8 text-gray-500">
                  لا توجد أسعار متاحة من الموردين لهذا المنتج
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
                سجل المشتريات من الموردين
              </CardTitle>
              <CardDescription>عرض جميع المشتريات من الموردين</CardDescription>
            </CardHeader>
            <CardContent>
              {purchases.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  لا توجد مشتريات مسجلة بعد
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المنتج</TableHead>
                      <TableHead>المورد</TableHead>
                      <TableHead>الكمية</TableHead>
                      <TableHead>السعر</TableHead>
                      <TableHead>المجموع</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>التاريخ</TableHead>
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
                            {purchase.status === 'COMPLETED' ? 'مكتمل' :
                             purchase.status === 'REFUNDED' ? 'مسترد' :
                             purchase.status === 'CANCELLED' ? 'ملغي' : purchase.status}
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
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? 'تعديل مورد' : 'إضافة مورد جديد'}</DialogTitle>
            <DialogDescription>املأ المعلومات التالية لإضافة مورد جديد</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">اسم المورد *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="nameAr">اسم المورد (عربي)</Label>
                <Input
                  id="nameAr"
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">الهاتف</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="contactPerson">الشخص المسؤول</Label>
              <Input
                id="contactPerson"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="address">العنوان</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="discountRate">معدل الخصم (%) *</Label>
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

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">حالة المورد</Label>
                <p className="text-sm text-gray-500">
                  تفعيل أو تعطيل المورد
                </p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>

            <div>
              <Label htmlFor="notes">ملاحظات</Label>
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
                    إعدادات API للمورد
                  </Label>
                  <p className="text-sm text-gray-500 mt-1">
                    تكوين API للمورد للشراء التلقائي ومقارنة الأسعار
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="apiEndpoint">رابط API للمورد</Label>
                <Input
                  id="apiEndpoint"
                  type="url"
                  placeholder="https://api.supplier.com/v1"
                  value={formData.apiEndpoint}
                  onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  الرابط الأساسي لـ API الخاص بالمورد (مثال: https://api.supplier.com/v1)
                </p>
              </div>

              <div>
                <Label htmlFor="apiKey">مفتاح API</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="أدخل مفتاح API"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  مفتاح المصادقة للوصول إلى API الخاص بالمورد
                </p>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="autoPurchaseEnabled" className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    تفعيل الشراء التلقائي
                  </Label>
                  <p className="text-sm text-gray-500">
                    السماح للنظام بالشراء التلقائي من هذا المورد عند توفر أفضل سعر
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
                  <Label htmlFor="priceCheckInterval">فترة فحص الأسعار (بالدقائق)</Label>
                  <Input
                    id="priceCheckInterval"
                    type="number"
                    min="1"
                    max="1440"
                    value={formData.priceCheckInterval}
                    onChange={(e) => setFormData({ ...formData, priceCheckInterval: parseInt(e.target.value) || 60 })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    كم مرة يتم فحص الأسعار من هذا المورد (افتراضي: 60 دقيقة)
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                <X className="h-4 w-4 mr-2" />
                إلغاء
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'جاري الحفظ...' : 'حفظ'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPurchaseDialogOpen} onOpenChange={setIsPurchaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الشراء</DialogTitle>
            <DialogDescription>
              {products.find(p => p.id === selectedProduct)?.nameAr || products.find(p => p.id === selectedProduct)?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="quantity">الكمية</Label>
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
                  <div>المورد: {productPrices[0]?.supplierName}</div>
                  <div>السعر للوحدة: {productPrices[0]?.price}</div>
                  <div className="font-semibold mt-2">المجموع: {productPrices[0]?.price * purchaseQuantity}</div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPurchaseDialogOpen(false)}
            >
              إلغاء
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
              {purchaseLoading ? 'جاري الشراء...' : 'تأكيد الشراء'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

