import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Loader2, FolderOpen, Download, Upload, Users, Gift, Percent, Tag } from 'lucide-react';
import { read, utils, writeFile } from 'xlsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { coreApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

// Interfaces for Customer Tiers & Offers
interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface CustomerTier {
  id: string;
  name: string;
  description: string;
  color: string;
  discountPercent: number;
  productCategories: string[]; // Category IDs that qualify customers for this tier
  assignedCustomers: string[]; // Customer IDs assigned to this tier
  minPurchases?: number; // Optional: minimum number of purchases to qualify
}

interface CustomerTierAssignment {
  id: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  tierId: string;
  tierName: string;
  assignedAt: string;
}

interface CategoryOffer {
  id: string;
  name: string;
  tierId: string;
  tierName: string;
  productCategoryIds: string[];
  assignedCustomers: string[]; // Direct customer IDs for this offer
  discountPercent: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

export default function CategoriesManager() {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  // Categories state
  const [categories, setCategories] = useState<{id: string; name: string; description?: string; slug?: string; productCount?: number}[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{id: string; name: string; description?: string; slug?: string} | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
  });

  // Active tab
  const [activeTab, setActiveTab] = useState('categories');

  // Customers state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);

  // Customer Tiers state
  const [customerTiers, setCustomerTiers] = useState<CustomerTier[]>([
    { id: '1', name: 'فئة A - VIP', description: 'عملاء VIP مميزون', color: '#FFD700', discountPercent: 15, productCategories: [], assignedCustomers: [] },
    { id: '2', name: 'فئة B - ذهبي', description: 'عملاء ذهبيون', color: '#C0C0C0', discountPercent: 10, productCategories: [], assignedCustomers: [] },
    { id: '3', name: 'فئة C - عادي', description: 'عملاء عاديون', color: '#CD7F32', discountPercent: 5, productCategories: [], assignedCustomers: [] },
  ]);
  const [tierDialogOpen, setTierDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<CustomerTier | null>(null);
  const [tierFormData, setTierFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    discountPercent: 10,
    productCategories: [] as string[],
    assignedCustomers: [] as string[],
  });

  // Offers state
  const [offers, setOffers] = useState<CategoryOffer[]>([]);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<CategoryOffer | null>(null);
  const [offerFormData, setOfferFormData] = useState({
    name: '',
    tierId: '',
    productCategoryIds: [] as string[],
    assignedCustomers: [] as string[],
    discountPercent: 13,
    isActive: true,
  });

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      const data = await coreApi.getCategories() as {id: string; name: string; description?: string; slug?: string; productCount?: number}[] | {categories: {id: string; name: string; description?: string; slug?: string; productCount?: number}[]};
      setCategories(Array.isArray(data) ? data : (data.categories || []));
    } catch (error) {
      console.error('Failed to load categories:', error);
      toast({
        title: t('common.error'),
        description: 'فشل تحميل الفئات',
        variant: 'destructive',
      });
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleOpenDialog = (category?: any) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name || '',
        description: category.description || '',
        slug: category.slug || '',
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        slug: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await coreApi.updateCategory(editingCategory.id, formData);
        toast({
          title: t('common.success'),
          description: 'تم تحديث الفئة بنجاح',
        });
      } else {
        await coreApi.createCategory(formData);
        toast({
          title: t('common.success'),
          description: 'تم إضافة الفئة بنجاح',
        });
      }
      setDialogOpen(false);
      loadCategories();
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || 'فشل حفظ الفئة',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الفئة؟')) return;

    try {
      await coreApi.deleteCategory(id);
      toast({
        title: t('common.success'),
        description: 'تم حذف الفئة بنجاح',
      });
      loadCategories();
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || 'فشل حذف الفئة',
        variant: 'destructive',
      });
    }
  };

  const handleExport = () => {
    // Define headers for the Excel sheet
    const headers = ['ID', 'Name', 'Description', 'Slug', 'ProductCount'];
    
    const exportData = categories.map(c => ({
      ID: c.id,
      Name: c.name,
      Description: c.description || '',
      Slug: c.slug || '',
      ProductCount: c.productCount || 0,
    }));

    // Create worksheet with headers
    const ws = utils.json_to_sheet(exportData, { header: headers });
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Categories");
    writeFile(wb, "categories_export.xlsx");
    
    toast({
      title: t('common.success'),
      description: 'تم تصدير الفئات بنجاح',
    });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json<{ Name: string; Description?: string; Slug?: string }>(worksheet);

      let successCount = 0;
      let errorCount = 0;

      for (const row of jsonData) {
        if (!row.Name) continue;
        
        try {
          await coreApi.createCategory({
            name: row.Name,
            description: row.Description || '',
            slug: row.Slug || '',
          });
          successCount++;
        } catch (error) {
          console.error('Failed to import category:', row.Name, error);
          errorCount++;
        }
      }

      toast({
        title: 'تم الاستيراد',
        description: `تم استيراد ${successCount} فئة بنجاح${errorCount > 0 ? `, فشل ${errorCount}` : ''}`,
      });
      
      loadCategories();
      e.target.value = '';
    } catch (error) {
      console.error('Import error:', error);
      toast({ 
        title: t('common.error'), 
        description: 'فشل استيراد الملف', 
        variant: 'destructive' 
      });
    }
  };

  // ==================== Customer Tier Functions ====================
  
  const handleOpenTierDialog = (tier?: CustomerTier) => {
    // Load customers when opening dialog
    loadCustomers();
    
    if (tier) {
      setEditingTier(tier);
      setTierFormData({
        name: tier.name,
        description: tier.description,
        color: tier.color,
        discountPercent: tier.discountPercent,
        productCategories: tier.productCategories || [],
        assignedCustomers: tier.assignedCustomers || [],
      });
    } else {
      setEditingTier(null);
      setTierFormData({
        name: '',
        description: '',
        color: '#3B82F6',
        discountPercent: 10,
        productCategories: [],
        assignedCustomers: [],
      });
    }
    setTierDialogOpen(true);
  };

  const loadCustomers = async () => {
    try {
      setCustomersLoading(true);
      const data = await coreApi.get('/customers', { requireAuth: true }) as {id: string; name: string; email: string; phone?: string}[] | {customers: {id: string; name: string; email: string; phone?: string}[]};
      setCustomers(Array.isArray(data) ? data : (data.customers || []));
    } catch (error) {
      console.error('Failed to load customers:', error);
      setCustomers([]);
    } finally {
      setCustomersLoading(false);
    }
  };

  const handleSaveTier = () => {
    if (!tierFormData.name) {
      toast({ title: t('common.error'), description: 'اسم الفئة مطلوب', variant: 'destructive' });
      return;
    }

    if (editingTier) {
      setCustomerTiers(prev => prev.map(t => 
        t.id === editingTier.id 
          ? { ...t, ...tierFormData }
          : t
      ));
      toast({ title: t('common.success'), description: 'تم تحديث فئة العملاء' });
    } else {
      const newTier: CustomerTier = {
        id: Date.now().toString(),
        ...tierFormData,
      };
      setCustomerTiers(prev => [...prev, newTier]);
      toast({ title: t('common.success'), description: 'تم إضافة فئة العملاء' });
    }
    setTierDialogOpen(false);
  };

  const handleDeleteTier = (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الفئة؟')) return;
    setCustomerTiers(prev => prev.filter(t => t.id !== id));
    toast({ title: t('common.success'), description: 'تم حذف فئة العملاء' });
  };

  // ==================== Offer Functions ====================

  const handleOpenOfferDialog = (offer?: CategoryOffer) => {
    // Load customers when opening dialog
    loadCustomers();
    
    if (offer) {
      setEditingOffer(offer);
      setOfferFormData({
        name: offer.name,
        tierId: offer.tierId,
        productCategoryIds: offer.productCategoryIds,
        assignedCustomers: offer.assignedCustomers || [],
        discountPercent: offer.discountPercent,
        isActive: offer.isActive,
      });
    } else {
      setEditingOffer(null);
      setOfferFormData({
        name: '',
        tierId: '',
        productCategoryIds: [],
        assignedCustomers: [],
        discountPercent: 13,
        isActive: true,
      });
    }
    setOfferDialogOpen(true);
  };

  const handleSaveOffer = () => {
    if (!offerFormData.name || !offerFormData.tierId) {
      toast({ title: t('common.error'), description: 'اسم العرض وفئة العميل مطلوبان', variant: 'destructive' });
      return;
    }

    const tier = customerTiers.find(t => t.id === offerFormData.tierId);

    if (editingOffer) {
      setOffers(prev => prev.map(o => 
        o.id === editingOffer.id 
          ? { ...o, ...offerFormData, tierName: tier?.name || '' }
          : o
      ));
      toast({ title: t('common.success'), description: 'تم تحديث العرض' });
    } else {
      const newOffer: CategoryOffer = {
        id: Date.now().toString(),
        ...offerFormData,
        tierName: tier?.name || '',
      };
      setOffers(prev => [...prev, newOffer]);
      toast({ title: t('common.success'), description: 'تم إضافة العرض' });
    }
    setOfferDialogOpen(false);
  };

  const handleDeleteOffer = (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العرض؟')) return;
    setOffers(prev => prev.filter(o => o.id !== id));
    toast({ title: t('common.success'), description: 'تم حذف العرض' });
  };

  const calculateDiscount = (price: number, discountPercent: number) => {
    return (price * (1 - discountPercent / 100)).toFixed(2);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            إدارة الفئات والعروض
          </h1>
          <p className="text-muted-foreground text-lg">تنظيم فئات المنتجات وعروض العملاء</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="categories" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            فئات المنتجات
          </TabsTrigger>
          <TabsTrigger value="tiers" className="gap-2">
            <Users className="h-4 w-4" />
            فئات العملاء
          </TabsTrigger>
          <TabsTrigger value="offers" className="gap-2">
            <Gift className="h-4 w-4" />
            العروض
          </TabsTrigger>
        </TabsList>

        {/* Product Categories Tab */}
        <TabsContent value="categories">
          <div className="flex justify-end gap-2 mb-4">
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              تصدير
            </Button>
            <div className="relative">
              <Input
                type="file"
                accept=".xlsx, .xls"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleImport}
              />
              <Button variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                استيراد
              </Button>
            </div>
            <Button onClick={() => handleOpenDialog()} size="lg">
              <Plus className="ml-2 h-5 w-5" />
              إضافة فئة
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>جميع الفئات</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-16">
                  <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">لا توجد فئات</h3>
                  <p className="text-muted-foreground mb-6">
                    أنشئ فئتك الأولى لتنظيم المنتجات
                  </p>
                  <Button onClick={() => handleOpenDialog()}>
                    <Plus className="ml-2 h-4 w-4" />
                    إضافة فئة
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الفئة</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>عدد المنتجات</TableHead>
                      <TableHead className="text-left">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-lg">{category.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {category.description || 'لا يوجد وصف'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {category.slug || '-'}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">
                            {category.productCount || 0}
                          </span>
                        </TableCell>
                        <TableCell className="text-left">
                          <div className="flex justify-start gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(category)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(category.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customer Tiers Tab */}
        <TabsContent value="tiers">
          <div className="flex justify-end mb-4">
            <Button onClick={() => handleOpenTierDialog()} size="lg">
              <Plus className="ml-2 h-5 w-5" />
              إضافة فئة عملاء
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {customerTiers.map((tier) => (
              <Card key={tier.id} className="relative overflow-hidden">
                <div 
                  className="absolute top-0 left-0 right-0 h-2" 
                  style={{ backgroundColor: tier.color }}
                />
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {tier.name}
                      </CardTitle>
                      <CardDescription>{tier.description}</CardDescription>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className="text-lg font-bold"
                      style={{ backgroundColor: `${tier.color}20`, color: tier.color }}
                    >
                      {tier.discountPercent}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm text-muted-foreground">فئات المنتجات المرتبطة:</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {tier.productCategories.length > 0 ? (
                          tier.productCategories.map(catId => {
                            const cat = categories.find(c => c.id === catId);
                            return cat ? (
                              <Badge key={catId} variant="outline" className="text-xs">
                                {cat.name}
                              </Badge>
                            ) : null;
                          })
                        ) : (
                          <span className="text-sm text-muted-foreground">جميع الفئات</span>
                        )}
                      </div>
                    </div>
                    {/* Assigned Customers Count */}
                    <div>
                      <Label className="text-sm text-muted-foreground">العملاء المُعينين:</Label>
                      <div className="mt-1">
                        {tier.assignedCustomers && tier.assignedCustomers.length > 0 ? (
                          <Badge variant="default" className="text-xs">
                            {tier.assignedCustomers.length} عميل
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">لم يتم تعيين عملاء</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleOpenTierDialog(tier)}
                      >
                        <Pencil className="h-3 w-3 ml-1" />
                        تعديل
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteTier(tier.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                كيفية تصنيف العملاء
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <p>• يتم تصنيف العملاء تلقائياً بناءً على فئات المنتجات التي يشترونها</p>
                <p>• عملاء فئة A (VIP) يحصلون على خصم 15% على جميع المنتجات</p>
                <p>• عملاء فئة B (ذهبي) يحصلون على خصم 10%</p>
                <p>• عملاء فئة C (عادي) يحصلون على خصم 5%</p>
                <p className="text-muted-foreground">قم بربط فئات المنتجات مع فئات العملاء لتفعيل التصنيف التلقائي</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Offers Tab */}
        <TabsContent value="offers">
          <div className="flex justify-end mb-4">
            <Button onClick={() => handleOpenOfferDialog()} size="lg">
              <Plus className="ml-2 h-5 w-5" />
              إضافة عرض
            </Button>
          </div>

          {offers.length === 0 ? (
            <Card>
              <CardContent className="text-center py-16">
                <Gift className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold mb-2">لا توجد عروض</h3>
                <p className="text-muted-foreground mb-6">
                  أنشئ عروضاً خاصة لفئات العملاء المختلفة
                </p>
                <Button onClick={() => handleOpenOfferDialog()}>
                  <Plus className="ml-2 h-4 w-4" />
                  إضافة عرض جديد
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {offers.map((offer) => (
                <Card key={offer.id} className={`${offer.isActive ? 'border-green-500/50' : 'border-gray-300'}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Percent className="h-5 w-5 text-primary" />
                          {offer.name}
                        </CardTitle>
                        <CardDescription>لفئة: {offer.tierName}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={offer.isActive ? 'default' : 'secondary'}>
                          {offer.isActive ? 'نشط' : 'غير نشط'}
                        </Badge>
                        <Badge variant="outline" className="text-lg font-bold text-green-600">
                          {offer.discountPercent}%
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm text-muted-foreground">فئات المنتجات المشمولة:</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {offer.productCategoryIds.length > 0 ? (
                            offer.productCategoryIds.map(catId => {
                              const cat = categories.find(c => c.id === catId);
                              return cat ? (
                                <Badge key={catId} variant="outline" className="text-xs">
                                  {cat.name}
                                </Badge>
                              ) : null;
                            })
                          ) : (
                            <span className="text-sm text-muted-foreground">جميع الفئات</span>
                          )}
                        </div>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-sm">
                          <strong>مثال:</strong> منتج بسعر 100 ريال ← السعر بعد الخصم: {calculateDiscount(100, offer.discountPercent)} ريال
                        </p>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleOpenOfferDialog(offer)}
                        >
                          <Pencil className="h-3 w-3 ml-1" />
                          تعديل
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteOffer(offer.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Category Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'تعديل الفئة' : 'إضافة فئة جديدة'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory ? 'قم بتحديث معلومات الفئة' : 'أضف فئة جديدة لتنظيم منتجاتك'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">اسم الفئة *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="electronics"
                />
                <p className="text-xs text-muted-foreground">
                  يستخدم في الروابط (اتركه فارغاً للإنشاء التلقائي)
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">الوصف</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit">
                {editingCategory ? 'تحديث' : 'إضافة'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Tier Dialog */}
      <Dialog open={tierDialogOpen} onOpenChange={setTierDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingTier ? 'تعديل فئة العملاء' : 'إضافة فئة عملاء جديدة'}
            </DialogTitle>
            <DialogDescription>
              أنشئ فئات لتصنيف العملاء وتقديم خصومات مخصصة
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>اسم الفئة *</Label>
              <Input
                value={tierFormData.name}
                onChange={(e) => setTierFormData({ ...tierFormData, name: e.target.value })}
                placeholder="مثال: فئة VIP"
              />
            </div>
            <div className="grid gap-2">
              <Label>الوصف</Label>
              <Input
                value={tierFormData.description}
                onChange={(e) => setTierFormData({ ...tierFormData, description: e.target.value })}
                placeholder="وصف مختصر لهذه الفئة"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>اللون</Label>
                <Input
                  type="color"
                  value={tierFormData.color}
                  onChange={(e) => setTierFormData({ ...tierFormData, color: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="grid gap-2">
                <Label>نسبة الخصم (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={tierFormData.discountPercent}
                  onChange={(e) => setTierFormData({ ...tierFormData, discountPercent: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>فئات المنتجات المرتبطة (اختياري)</Label>
              <Select
                value={tierFormData.productCategories[0] || ''}
                onValueChange={(value) => {
                  if (value && !tierFormData.productCategories.includes(value)) {
                    setTierFormData({ 
                      ...tierFormData, 
                      productCategories: [...tierFormData.productCategories, value] 
                    });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر فئة منتجات" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-1 mt-1">
                {tierFormData.productCategories.map(catId => {
                  const cat = categories.find(c => c.id === catId);
                  return cat ? (
                    <Badge 
                      key={catId} 
                      variant="secondary" 
                      className="cursor-pointer"
                      onClick={() => setTierFormData({
                        ...tierFormData,
                        productCategories: tierFormData.productCategories.filter(id => id !== catId)
                      })}
                    >
                      {cat.name} ×
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>

            {/* Customer Selection */}
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                تعيين عملاء لهذه الفئة
              </Label>
              {customersLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="mr-2 text-sm text-muted-foreground">جاري تحميل العملاء...</span>
                </div>
              ) : customers.length === 0 ? (
                <p className="text-sm text-muted-foreground">لا يوجد عملاء متاحين</p>
              ) : (
                <>
                  <Select
                    value=""
                    onValueChange={(value) => {
                      if (value && !tierFormData.assignedCustomers.includes(value)) {
                        setTierFormData({ 
                          ...tierFormData, 
                          assignedCustomers: [...tierFormData.assignedCustomers, value] 
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر عميل لإضافته للفئة" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers
                        .filter(c => !tierFormData.assignedCustomers.includes(c.id))
                        .map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            <div className="flex flex-col">
                              <span>{customer.name || 'عميل'}</span>
                              <span className="text-xs text-muted-foreground">{customer.email}</span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {tierFormData.assignedCustomers.map(customerId => {
                      const customer = customers.find(c => c.id === customerId);
                      return customer ? (
                        <Badge 
                          key={customerId} 
                          variant="default" 
                          className="cursor-pointer bg-primary/80 hover:bg-primary"
                          onClick={() => setTierFormData({
                            ...tierFormData,
                            assignedCustomers: tierFormData.assignedCustomers.filter(id => id !== customerId)
                          })}
                        >
                          {customer.name || customer.email} ×
                        </Badge>
                      ) : null;
                    })}
                  </div>
                  {tierFormData.assignedCustomers.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {tierFormData.assignedCustomers.length} عميل مُعين لهذه الفئة
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setTierDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveTier}>
              {editingTier ? 'تحديث' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Offer Dialog */}
      <Dialog open={offerDialogOpen} onOpenChange={setOfferDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingOffer ? 'تعديل العرض' : 'إضافة عرض جديد'}
            </DialogTitle>
            <DialogDescription>
              أنشئ عروضاً خاصة لفئات العملاء على منتجات محددة
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>اسم العرض *</Label>
              <Input
                value={offerFormData.name}
                onChange={(e) => setOfferFormData({ ...offerFormData, name: e.target.value })}
                placeholder="مثال: عرض رمضان"
              />
            </div>
            <div className="grid gap-2">
              <Label>فئة العملاء *</Label>
              <Select
                value={offerFormData.tierId}
                onValueChange={(value) => setOfferFormData({ ...offerFormData, tierId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر فئة العملاء" />
                </SelectTrigger>
                <SelectContent>
                  {customerTiers.map((tier) => (
                    <SelectItem key={tier.id} value={tier.id}>
                      {tier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>نسبة الخصم (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={offerFormData.discountPercent}
                onChange={(e) => setOfferFormData({ ...offerFormData, discountPercent: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="grid gap-2">
              <Label>فئات المنتجات المشمولة</Label>
              <Select
                value={offerFormData.productCategoryIds[0] || ''}
                onValueChange={(value) => {
                  if (value && !offerFormData.productCategoryIds.includes(value)) {
                    setOfferFormData({ 
                      ...offerFormData, 
                      productCategoryIds: [...offerFormData.productCategoryIds, value] 
                    });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر فئة منتجات" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-1 mt-1">
                {offerFormData.productCategoryIds.map(catId => {
                  const cat = categories.find(c => c.id === catId);
                  return cat ? (
                    <Badge 
                      key={catId} 
                      variant="secondary" 
                      className="cursor-pointer"
                      onClick={() => setOfferFormData({
                        ...offerFormData,
                        productCategoryIds: offerFormData.productCategoryIds.filter(id => id !== catId)
                      })}
                    >
                      {cat.name} ×
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>

            {/* Customer Selection for Offer */}
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                اختر العملاء لهذا العرض
              </Label>
              {customersLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="mr-2 text-sm text-muted-foreground">جاري تحميل العملاء...</span>
                </div>
              ) : customers.length === 0 ? (
                <p className="text-sm text-muted-foreground">لا يوجد عملاء متاحين</p>
              ) : (
                <>
                  <Select
                    value=""
                    onValueChange={(value) => {
                      if (value && !offerFormData.assignedCustomers.includes(value)) {
                        setOfferFormData({ 
                          ...offerFormData, 
                          assignedCustomers: [...offerFormData.assignedCustomers, value] 
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر عميل لإضافته للعرض" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers
                        .filter(c => !offerFormData.assignedCustomers.includes(c.id))
                        .map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            <div className="flex flex-col">
                              <span>{customer.name || 'عميل'}</span>
                              <span className="text-xs text-muted-foreground">{customer.email}</span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {offerFormData.assignedCustomers.map(customerId => {
                      const customer = customers.find(c => c.id === customerId);
                      return customer ? (
                        <Badge 
                          key={customerId} 
                          variant="default" 
                          className="cursor-pointer bg-green-600 hover:bg-green-700"
                          onClick={() => setOfferFormData({
                            ...offerFormData,
                            assignedCustomers: offerFormData.assignedCustomers.filter(id => id !== customerId)
                          })}
                        >
                          {customer.name || customer.email} ×
                        </Badge>
                      ) : null;
                    })}
                  </div>
                  {offerFormData.assignedCustomers.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {offerFormData.assignedCustomers.length} عميل سيحصل على هذا العرض
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOfferDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveOffer}>
              {editingOffer ? 'تحديث' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
