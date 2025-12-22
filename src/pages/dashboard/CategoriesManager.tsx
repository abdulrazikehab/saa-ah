import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Loader2, FolderOpen, Download, Upload, Users, Gift, Percent, Tag, AlertCircle } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ImageUpload } from '@/components/ui/image-upload';
import { ImportProgressDialog } from '@/components/ui/import-progress-dialog';
import { ImportErrorDialog, ImportError } from '@/components/ui/import-error-dialog';
import { CloudinaryImagePicker } from '@/components/dashboard/CloudinaryImagePicker';
import { coreApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { useTabUpdatesContext } from '@/contexts/TabUpdatesContext';
import { useAuth } from '@/contexts/AuthContext';
import MarketSetupPrompt from '@/components/dashboard/MarketSetupPrompt';
import { Cloud } from 'lucide-react';

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
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { toast } = useToast();
  const { addUpdate } = useTabUpdatesContext();
  const { user } = useAuth();
  
  // Categories state
  const [categories, setCategories] = useState<{id: string; name: string; description?: string; slug?: string; image?: string; productCount?: number; parentId?: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{id: string; name: string; description?: string; slug?: string; image?: string; parentId?: string} | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, currentItem: '' });
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const [showImportErrorDialog, setShowImportErrorDialog] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCloudinaryPicker, setShowCloudinaryPicker] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    slug: '',
    image: '',
    icon: '',
    parentId: '',
    isActive: true,
    sortOrder: 0,
    minQuantity: '',
    maxQuantity: '',
    enableSlider: false,
    applySliderToAllProducts: false,
  });

  // Active tab
  const [activeTab, setActiveTab] = useState('categories');

  // Customers state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);

  // Customer Tiers state - initialized in useEffect to support i18n
  const [customerTiers, setCustomerTiers] = useState<CustomerTier[]>([
    { id: '1', name: 'VIP Tier', description: 'VIP customers', color: '#FFD700', discountPercent: 15, productCategories: [], assignedCustomers: [] },
    { id: '2', name: 'Gold Tier', description: 'Gold customers', color: '#C0C0C0', discountPercent: 10, productCategories: [], assignedCustomers: [] },
    { id: '3', name: 'Regular Tier', description: 'Regular customers', color: '#CD7F32', discountPercent: 5, productCategories: [], assignedCustomers: [] },
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
      const data = await coreApi.getCategories() as {id: string; name: string; description?: string; slug?: string; image?: string; productCount?: number; parentId?: string}[] | {categories: {id: string; name: string; description?: string; slug?: string; image?: string; productCount?: number; parentId?: string}[]};
      const categoriesList = Array.isArray(data) ? data : (data.categories || []);
      setCategories(categoriesList.map((c: any) => ({
        ...c,
        parentId: c.parentId || undefined
      })));
    } catch (error) {
      console.error('Failed to load categories:', error);
      toast({
        title: t('common.error'),
        description: t('categories.productCategories.loadError'),
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
  
  // Check if user has a market set up (must be after all hooks)
  const hasMarket = !!(user?.tenantId && user.tenantId !== 'default' && user.tenantId !== 'system');
  
  // Show market setup prompt if no market
  if (!hasMarket) {
    return <MarketSetupPrompt />;
  }

  const handleOpenDialog = (category?: any) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name || '',
        nameAr: category.nameAr || '',
        description: category.description || '',
        descriptionAr: category.descriptionAr || '',
        slug: category.slug || '',
        image: category.image || '',
        icon: category.icon || '',
        parentId: category.parentId || '',
        isActive: category.isActive !== undefined ? category.isActive : true,
        sortOrder: category.sortOrder || 0,
        minQuantity: (category as any).minQuantity?.toString() || '',
        maxQuantity: (category as any).maxQuantity?.toString() || '',
        enableSlider: (category as any).enableSlider || false,
        applySliderToAllProducts: (category as any).applySliderToAllProducts || false,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        nameAr: '',
        description: '',
        descriptionAr: '',
        slug: '',
        image: '',
        icon: '',
        parentId: '',
        isActive: true,
        sortOrder: 0,
        minQuantity: '',
        maxQuantity: '',
        enableSlider: false,
        applySliderToAllProducts: false,
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const categoryData: any = {
        name: formData.name,
        nameAr: formData.nameAr || undefined,
        description: formData.description || undefined,
        descriptionAr: formData.descriptionAr || undefined,
        slug: formData.slug || undefined,
        image: formData.image || undefined,
        icon: formData.icon || undefined,
        parentId: formData.parentId || undefined,
        isActive: formData.isActive,
        sortOrder: formData.sortOrder || 0,
      };

      if (editingCategory) {
        await coreApi.updateCategory(editingCategory.id, categoryData);
        addUpdate('/dashboard/categories', {
          type: 'updated',
          message: t('categories.productCategories.updateSuccess'),
          data: { categoryId: editingCategory.id, ...categoryData },
        });
        toast({
          title: t('common.success'),
          description: t('categories.productCategories.updateSuccess'),
        });
      } else {
        await coreApi.createCategory(categoryData);
        addUpdate('/dashboard/categories', {
          type: 'added',
          message: t('categories.productCategories.addSuccess'),
          data: categoryData,
        });
        toast({
          title: t('common.success'),
          description: t('categories.productCategories.addSuccess'),
        });
      }
      setDialogOpen(false);
      loadCategories();
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('categories.productCategories.saveError'),
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('categories.productCategories.deleteConfirm'))) return;

    try {
      await coreApi.deleteCategory(id);
      toast({
        title: t('common.success'),
        description: t('categories.productCategories.deleteSuccess'),
      });
      loadCategories();
      setSelectedCategories(new Set());
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('categories.productCategories.deleteError'),
        variant: 'destructive',
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCategories.size === 0) {
      toast({
        title: 'لا يوجد فئات محددة',
        description: 'يرجى تحديد الفئات المراد حذفها',
        variant: 'destructive',
      });
      return;
    }

    const count = selectedCategories.size;
    if (!confirm(`هل أنت متأكد من حذف ${count} فئة${count > 1 ? 'ات' : ''}؟`)) return;

    try {
      setIsDeleting(true);
      const ids = Array.from(selectedCategories);
      const result = await coreApi.deleteCategories(ids);
      
      if (result.failed > 0) {
        toast({
          title: 'تحذير',
          description: `تم حذف ${result.deleted} من أصل ${count} فئة. عدد المحاولات الفاشلة: ${result.failed}`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'نجح',
          description: result?.message || `تم حذف ${result?.deleted || count} فئة${count > 1 ? 'ات' : ''} بنجاح`,
        });
      }
      
      if (result?.errors && result.errors.length > 0) {
        toast({
          title: 'تحذير',
          description: `بعض الفئات لم يتم حذفها: ${result.errors.join(', ')}`,
          variant: 'destructive',
        });
      }
      
      setSelectedCategories(new Set());
      loadCategories();
    } catch (error: any) {
      console.error('Failed to delete categories:', error);
      toast({
        title: 'خطأ',
        description: error?.response?.data?.message || 'فشل حذف الفئات',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCategories(new Set(categories.map(c => c.id)));
    } else {
      setSelectedCategories(new Set());
    }
  };

  const handleSelectAllCategories = async () => {
    try {
      // Fetch all categories
      const allCategoriesData = await coreApi.getCategories();
      const allCategories = Array.isArray(allCategoriesData) 
        ? allCategoriesData 
        : (allCategoriesData as any).categories || [];
      const allCategoryIds = allCategories.map((c: any) => c.id);
      setSelectedCategories(new Set(allCategoryIds));
      toast({
        title: 'تم التحديد',
        description: `تم تحديد ${allCategoryIds.length} فئة`,
      });
    } catch (error: any) {
      console.error('Failed to select all categories:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحديد جميع الفئات',
        variant: 'destructive',
      });
    }
  };

  const handleSelectCategory = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedCategories);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedCategories(newSelected);
  };

  const isAllSelected = categories.length > 0 && categories.every(c => selectedCategories.has(c.id));

  const handleExport = () => {
    // Define headers for the Excel sheet
    const headers = [
      'ID',
      'Name',
      'NameAr',
      'Description',
      'DescriptionAr',
      'Slug',
      'Image',
      'Icon',
      'ParentId',
      'IsActive',
      'SortOrder',
      'ProductCount',
      'CreatedAt',
      'UpdatedAt'
    ];
    
    const exportData = categories.map(c => ({
      ID: c.id,
      Name: c.name || '',
      NameAr: (c as any).nameAr || '',
      Description: c.description || '',
      DescriptionAr: (c as any).descriptionAr || '',
      Slug: c.slug || '',
      Image: (c as any).image || '',
      Icon: (c as any).icon || '',
      ParentId: (c as any).parentId || '',
      IsActive: (c as any).isActive !== undefined ? ((c as any).isActive ? 'Yes' : 'No') : 'Yes',
      SortOrder: (c as any).sortOrder || 0,
      ProductCount: c.productCount || 0,
      CreatedAt: (c as any).createdAt || '',
      UpdatedAt: (c as any).updatedAt || '',
    }));

    // Create worksheet with headers
    const ws = utils.json_to_sheet(exportData, { header: headers });
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Categories");
    writeFile(wb, "categories_export.xlsx");
    
    toast({
      title: t('common.success'),
      description: t('categories.productCategories.exportSuccess'),
    });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setImportErrors([]);
      setShowImportErrorDialog(false);
      setImportProgress({ current: 0, total: 0, currentItem: 'جاري قراءة الملف...' });
      
      const data = await file.arrayBuffer();
      setImportProgress({ current: 10, total: 100, currentItem: 'جاري تحليل البيانات...' });
      
      const workbook = read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json<{ 
        Name: string; 
        NameAr?: string;
        Description?: string; 
        DescriptionAr?: string;
        Slug?: string;
        Parent?: string;
        Image?: string;
      }>(worksheet, { defval: '' });

      const totalItems = jsonData.length;
      
      if (totalItems === 0) {
        setIsImporting(false);
        toast({
          title: t('common.error'),
          description: 'لم يتم العثور على أي بيانات في ملف Excel',
          variant: 'destructive',
        });
        e.target.value = '';
        return;
      }
      
      setImportProgress({ current: 0, total: totalItems, currentItem: `جاري معالجة ${totalItems} فئة...` });

      let successCount = 0;
      const collectedErrors: ImportError[] = [];

      // Helper function to generate slug from name
      const generateSlug = (name: string): string => {
        return name
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
      };

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const rowNum = i + 2; // Excel row number (1-indexed + header)
        const itemName = row.Name?.trim() || `الصف ${rowNum}`;
        
        // Update progress
        setImportProgress({ 
          current: i + 1, 
          total: totalItems, 
          currentItem: `جاري استيراد: ${itemName}...` 
        });

        // Validate Name field
        if (!row.Name || !row.Name.trim()) {
          collectedErrors.push({
            row: rowNum,
            column: 'Name',
            itemName: itemName,
            error: 'اسم الفئة مطلوب'
          });
          continue;
        }

        try {
          // Find parent category if specified
          let parentId: string | undefined;
          if (row.Parent && row.Parent.trim()) {
            const parent = categories.find(c => 
              c.name?.toLowerCase() === row.Parent?.toLowerCase() ||
              (c as any).nameAr?.toLowerCase() === row.Parent?.toLowerCase() ||
              c.slug?.toLowerCase() === row.Parent?.toLowerCase()
            );
            parentId = parent?.id;
            if (!parentId) {
              collectedErrors.push({
                row: rowNum,
                column: 'Parent',
                itemName: itemName,
                error: `الفئة الأب "${row.Parent}" غير موجودة`
              });
              continue;
            }
          }

          // Generate slug if not provided
          const slug = row.Slug?.trim() || generateSlug(row.Name);

          await coreApi.createCategory({
            name: row.Name.trim(),
            nameAr: row.NameAr?.trim() || undefined,
            description: row.Description?.trim() || '',
            descriptionAr: row.DescriptionAr?.trim() || undefined,
            slug,
            parentId: parentId || undefined,
          } as any);
          successCount++;
          
          // Small delay to avoid rate limiting
          if (i < jsonData.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error: any) {
          const errorMsg = error?.message || error?.data?.message || 'خطأ غير معروف';
          let errorColumn = 'General';
          
          // Detect column from error message
          const errorLower = errorMsg.toLowerCase();
          if (errorLower.includes('name') || errorLower.includes('اسم')) errorColumn = 'Name';
          else if (errorLower.includes('slug')) errorColumn = 'Slug';
          else if (errorLower.includes('parent') || errorLower.includes('أب')) errorColumn = 'Parent';
          
          collectedErrors.push({
            row: rowNum,
            column: errorColumn,
            itemName: itemName,
            error: errorMsg
          });
        }
      }

      // Update progress to 100%
      const completionMessage = collectedErrors.length > 0 
        ? `اكتمل الاستيراد! تم استيراد ${successCount} فئة، ورفض ${collectedErrors.length}`
        : `اكتمل الاستيراد! تم استيراد ${successCount} فئة بنجاح`;
      
      setImportProgress({ 
        current: totalItems, 
        total: totalItems, 
        currentItem: completionMessage 
      });

      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Show error dialog if there were errors
      if (collectedErrors.length > 0) {
        setImportErrors(collectedErrors);
        setIsImporting(false);
        await new Promise(resolve => setTimeout(resolve, 300));
        setShowImportErrorDialog(true);
      } else {
        setIsImporting(false);
      }

      toast({
        title: successCount > 0 ? t('common.success') : t('common.error'),
        description: collectedErrors.length > 0 
          ? `تم استيراد ${successCount} فئة بنجاح، ورفض ${collectedErrors.length} فئة`
          : `تم استيراد ${successCount} فئة بنجاح`,
        variant: collectedErrors.length > successCount ? 'destructive' : 'default',
        duration: 5000,
      });
      
      loadCategories();
      e.target.value = '';
    } catch (error: any) {
      setIsImporting(false);
      toast({ 
        title: t('common.error'), 
        description: error?.message || t('categories.productCategories.importError'), 
        variant: 'destructive' 
      });
    } finally {
      if (!showImportErrorDialog) {
        setImportProgress({ current: 0, total: 0, currentItem: '' });
      }
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
      toast({ title: t('common.error'), description: t('categories.customerTiers.tierNameRequired'), variant: 'destructive' });
      return;
    }

    if (editingTier) {
      setCustomerTiers(prev => prev.map(t => 
        t.id === editingTier.id 
          ? { ...t, ...tierFormData }
          : t
      ));
      toast({ title: t('common.success'), description: t('categories.customerTiers.updateSuccess') });
    } else {
      const newTier: CustomerTier = {
        id: Date.now().toString(),
        ...tierFormData,
      };
      setCustomerTiers(prev => [...prev, newTier]);
      toast({ title: t('common.success'), description: t('categories.customerTiers.addSuccess') });
    }
    setTierDialogOpen(false);
  };

  const handleDeleteTier = (id: string) => {
    if (!confirm(t('categories.customerTiers.deleteConfirm'))) return;
    setCustomerTiers(prev => prev.filter(t => t.id !== id));
    toast({ title: t('common.success'), description: t('categories.customerTiers.deleteSuccess') });
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
      toast({ title: t('common.error'), description: t('categories.offers.nameAndTierRequired'), variant: 'destructive' });
      return;
    }

    const tier = customerTiers.find(t => t.id === offerFormData.tierId);

    if (editingOffer) {
      setOffers(prev => prev.map(o => 
        o.id === editingOffer.id 
          ? { ...o, ...offerFormData, tierName: tier?.name || '' }
          : o
      ));
      toast({ title: t('common.success'), description: t('categories.offers.updateSuccess') });
    } else {
      const newOffer: CategoryOffer = {
        id: Date.now().toString(),
        ...offerFormData,
        tierName: tier?.name || '',
      };
      setOffers(prev => [...prev, newOffer]);
      toast({ title: t('common.success'), description: t('categories.offers.addSuccess') });
    }
    setOfferDialogOpen(false);
  };

  const handleDeleteOffer = (id: string) => {
    if (!confirm(t('categories.offers.deleteConfirm'))) return;
    setOffers(prev => prev.filter(o => o.id !== id));
    toast({ title: t('common.success'), description: t('categories.offers.deleteSuccess') });
  };

  const calculateDiscount = (price: number, discountPercent: number) => {
    return (price * (1 - discountPercent / 100)).toFixed(2);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {t('categories.title')}
          </h1>
          <p className="text-muted-foreground text-lg">{t('categories.subtitle')}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="categories" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            {t('categories.tabs.productCategories')}
          </TabsTrigger>
          <TabsTrigger value="tiers" className="gap-2">
            <Users className="h-4 w-4" />
            {t('categories.tabs.customerTiers')}
          </TabsTrigger>
          <TabsTrigger value="offers" className="gap-2">
            <Gift className="h-4 w-4" />
            {t('categories.tabs.offers')}
          </TabsTrigger>
        </TabsList>

        {/* Product Categories Tab */}
        <TabsContent value="categories">
          <div className="flex justify-end gap-2 mb-4">
            <Button 
              variant="outline" 
              className="gap-2" 
              onClick={handleSelectAllCategories}
              disabled={loading}
            >
              <Tag className="h-4 w-4" />
              تحديد الكل
            </Button>
            {selectedCategories.size > 0 && (
              <Button 
                variant="destructive" 
                className="gap-2" 
                onClick={handleBulkDelete}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? 'جاري الحذف...' : `حذف ${selectedCategories.size}`}
              </Button>
            )}
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              {t('categories.productCategories.export')}
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
                {t('categories.productCategories.import')}
              </Button>
            </div>
            <Button 
              onClick={() => handleOpenDialog()} 
              size="lg"
              className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 transition-all shadow-lg shadow-primary/20"
            >
              <Plus className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('categories.productCategories.addCategory')}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('categories.productCategories.allCategories')}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-16">
                  <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{t('categories.productCategories.noCategories')}</h3>
                  <p className="text-muted-foreground mb-6">
                    {t('categories.productCategories.noCategoriesDesc')}
                  </p>
                  <Button onClick={() => handleOpenDialog()}>
                    <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t('categories.productCategories.addCategory')}
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead>{t('categories.productCategories.logo')}</TableHead>
                      <TableHead>{t('categories.productCategories.category')}</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>{t('categories.productCategories.productCount')}</TableHead>
                      <TableHead className="text-left">{t('categories.productCategories.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedCategories.has(category.id)}
                            onCheckedChange={(checked) => handleSelectCategory(category.id, checked as boolean)}
                            aria-label={`Select ${category.name}`}
                          />
                        </TableCell>
                        <TableCell>
                          {category.image ? (
                            <img 
                              src={category.image} 
                              alt={category.name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                              <FolderOpen className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-lg">{category.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {category.description || t('categories.productCategories.noDescription')}
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
              <Plus className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('categories.customerTiers.addTier')}
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
                      <Label className="text-sm text-muted-foreground">{t('categories.customerTiers.linkedCategories')}</Label>
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
                          <span className="text-sm text-muted-foreground">{t('categories.customerTiers.allCategories')}</span>
                        )}
                      </div>
                    </div>
                    {/* Assigned Customers Count */}
                    <div>
                      <Label className="text-sm text-muted-foreground">{t('categories.customerTiers.assignedCustomers')}</Label>
                      <div className="mt-1">
                        {tier.assignedCustomers && tier.assignedCustomers.length > 0 ? (
                          <Badge variant="default" className="text-xs">
                            {t('categories.customerTiers.customerCount', { count: tier.assignedCustomers.length })}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">{t('categories.customerTiers.noCustomersAssigned')}</span>
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
                        {t('common.edit')}
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
                {t('categories.customerTiers.howItWorks')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <p>{t('categories.customerTiers.howItWorksDesc1')}</p>
                <p>{t('categories.customerTiers.howItWorksDesc2')}</p>
                <p>{t('categories.customerTiers.howItWorksDesc3')}</p>
                <p>{t('categories.customerTiers.howItWorksDesc4')}</p>
                <p className="text-muted-foreground">{t('categories.customerTiers.howItWorksDesc5')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Offers Tab */}
        <TabsContent value="offers">
          <div className="flex justify-end mb-4">
            <Button onClick={() => handleOpenOfferDialog()} size="lg">
              <Plus className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('categories.offers.addOffer')}
            </Button>
          </div>

          {offers.length === 0 ? (
            <Card>
              <CardContent className="text-center py-16">
                <Gift className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{t('categories.offers.noOffers')}</h3>
                <p className="text-muted-foreground mb-6">
                  {t('categories.offers.noOffersDesc')}
                </p>
                <Button onClick={() => handleOpenOfferDialog()}>
                  <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('categories.offers.addNewOffer')}
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
                        <CardDescription>{t('categories.offers.forTier', { tierName: offer.tierName })}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={offer.isActive ? 'default' : 'secondary'}>
                          {offer.isActive ? t('categories.offers.active') : t('categories.offers.inactive')}
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
                        <Label className="text-sm text-muted-foreground">{t('categories.offers.includedCategories')}</Label>
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
                            <span className="text-sm text-muted-foreground">{t('categories.offers.allCategories')}</span>
                          )}
                        </div>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-sm">
                          <strong>{t('categories.offers.example')}</strong> {t('categories.offers.exampleDesc', { price: calculateDiscount(100, offer.discountPercent) })}
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
                          {t('common.edit')}
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
        <DialogContent className="sm:max-w-[700px] max-h-[95vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-2xl">
              {editingCategory ? t('categories.productCategories.editCategory') : t('categories.productCategories.addNewCategory')}
            </DialogTitle>
            <DialogDescription>
              {editingCategory ? t('categories.productCategories.editCategoryDesc') : t('categories.productCategories.addCategoryDesc')}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-2">
            <div className="grid gap-6 py-4">
              {/* Names Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-bold">{t('categories.productCategories.categoryName')} *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nameAr" className="text-sm font-bold">اسم الفئة (عربي)</Label>
                  <Input
                    id="nameAr"
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    className="h-11"
                  />
                </div>
              </div>

              {/* Slug Section */}
              <div className="space-y-2">
                <Label htmlFor="slug" className="text-sm font-bold">{t('categories.productCategories.slug')}</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="electronics"
                  className="h-11 text-left direction-ltr"
                />
                <p className="text-xs text-muted-foreground italic">
                  {t('categories.productCategories.slugHint')}
                </p>
              </div>

              {/* Descriptions Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-bold">{t('categories.productCategories.description')}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descriptionAr" className="text-sm font-bold">الوصف (عربي)</Label>
                  <Textarea
                    id="descriptionAr"
                    value={formData.descriptionAr}
                    onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                    rows={4}
                    className="resize-none"
                  />
                </div>
              </div>

              {/* Icon and Sort Order Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="icon" className="text-sm font-bold">الأيقونة (Icon/Emoji)</Label>
                  <Input
                    id="icon"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="📱 أو category-icon"
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    يمكنك استخدام إيموجي أو اسم أيقونة
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sortOrder" className="text-sm font-bold">ترتيب العرض</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    min="0"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    الرقم الأقل يظهر أولاً
                  </p>
                </div>
              </div>

              {/* Parent Category Section */}
              <div className="space-y-2">
                <Label htmlFor="parentId" className="text-sm font-bold">
                  {t('categories.productCategories.parentCategory', 'الفئة الرئيسية (اختياري)')}
                </Label>
                <Select
                  value={formData.parentId || "__none__"}
                  onValueChange={(value) => setFormData({ ...formData, parentId: value === "__none__" ? '' : value })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder={t('categories.productCategories.selectParentCategory', 'اختر فئة رئيسية (اختياري)')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{t('categories.productCategories.noParent', 'لا توجد فئة رئيسية')}</SelectItem>
                    {categories
                      .filter(cat => !editingCategory || cat.id !== editingCategory.id)
                      .map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t('categories.productCategories.parentCategoryHint', 'اختر فئة رئيسية لجعل هذه الفئة فئة فرعية')}
                </p>
              </div>

              {/* Image Upload Section */}
              <div className="space-y-2">
                <Label htmlFor="image" className="text-sm font-bold">{t('categories.productCategories.categoryLogo')}</Label>
                <div className="border-2 border-dashed border-border rounded-xl p-4 bg-muted/30">
                  <ImageUpload
                    value={formData.image}
                    onChange={(url) => setFormData({ ...formData, image: url })}
                    placeholder={t('categories.productCategories.uploadLogo')}
                    className="[&>div]:aspect-square [&>div]:h-40 mx-auto"
                  />
                </div>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowCloudinaryPicker(true);
                    }}
                    className="gap-2"
                  >
                    <Cloud className="h-4 w-4" />
                    اختر من Cloudinary
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  {t('categories.productCategories.logoHint')}
                </p>
              </div>

              {/* Quantity Slider Section for Supplier API Integration */}
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableSlider" className="text-base font-semibold">
                      شريط الكمية للشراء (Slider)
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      تفعيل شريط اختيار الكمية عند الشراء - سيتم تطبيقه على جميع منتجات هذه الفئة
                    </p>
                  </div>
                  <Switch
                    id="enableSlider"
                    checked={formData.enableSlider}
                    onCheckedChange={(checked) => setFormData({ ...formData, enableSlider: checked })}
                  />
                </div>
                
                {formData.enableSlider && (
                  <>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <Label htmlFor="minQuantity">الحد الأدنى للكمية</Label>
                        <Input
                          id="minQuantity"
                          type="number"
                          min="1"
                          value={formData.minQuantity}
                          onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
                          placeholder="1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="maxQuantity">الحد الأقصى للكمية</Label>
                        <Input
                          id="maxQuantity"
                          type="number"
                          min="1"
                          value={formData.maxQuantity}
                          onChange={(e) => setFormData({ ...formData, maxQuantity: e.target.value })}
                          placeholder="100"
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch
                        id="applySliderToAllProducts"
                        checked={formData.applySliderToAllProducts}
                        onCheckedChange={(checked) => setFormData({ ...formData, applySliderToAllProducts: checked })}
                      />
                      <Label htmlFor="applySliderToAllProducts" className="text-sm">
                        تطبيق على جميع منتجات هذه الفئة
                      </Label>
                    </div>
                  </>
                )}
              </div>

              {/* Status Section */}
              <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-xl">
                <div className="space-y-0.5">
                  <Label htmlFor="isActive" className="text-base font-bold">حالة الفئة</Label>
                  <p className="text-sm text-muted-foreground">
                    تفعيل أو تعطيل الفئة في المتجر
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
            </div>
            
            <div className="h-4" /> {/* Bottom spacing */}
          </form>

          <DialogFooter className="p-6 pt-2 border-t bg-muted/20">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="h-11 px-8">
              {t('common.cancel')}
            </Button>
            <Button type="submit" onClick={(e) => {
              e.preventDefault();
              handleSubmit(e as any);
            }} className="h-11 px-8">
              {editingCategory ? t('categories.productCategories.update') : t('categories.productCategories.add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tier Dialog */}
      <Dialog open={tierDialogOpen} onOpenChange={setTierDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingTier ? t('categories.customerTiers.editTier') : t('categories.customerTiers.addNewTier')}
            </DialogTitle>
            <DialogDescription>
              {t('categories.customerTiers.tierDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t('categories.customerTiers.tierName')} *</Label>
              <Input
                value={tierFormData.name}
                onChange={(e) => setTierFormData({ ...tierFormData, name: e.target.value })}
                placeholder={t('categories.customerTiers.tierNamePlaceholder')}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t('categories.customerTiers.description')}</Label>
              <Input
                value={tierFormData.description}
                onChange={(e) => setTierFormData({ ...tierFormData, description: e.target.value })}
                placeholder={t('categories.customerTiers.descriptionPlaceholder')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t('categories.customerTiers.color')}</Label>
                <Input
                  type="color"
                  value={tierFormData.color}
                  onChange={(e) => setTierFormData({ ...tierFormData, color: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="grid gap-2">
                <Label>{t('categories.customerTiers.discountPercent')}</Label>
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
              <Label>{t('categories.customerTiers.linkedProductCategories')}</Label>
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
                  <SelectValue placeholder={t('categories.customerTiers.selectProductCategory')} />
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
                {t('categories.customerTiers.assignCustomers')}
              </Label>
              {customersLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className={`text-sm text-muted-foreground ${isRTL ? 'mr-2' : 'ml-2'}`}>{t('categories.customerTiers.loadingCustomers')}</span>
                </div>
              ) : customers.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('categories.customerTiers.noCustomersAvailable')}</p>
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
                      <SelectValue placeholder={t('categories.customerTiers.selectCustomer')} />
                    </SelectTrigger>
                    <SelectContent>
                      {customers
                        .filter(c => !tierFormData.assignedCustomers.includes(c.id))
                        .map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            <div className="flex flex-col">
                              <span>{customer.name || t('categories.customerTiers.customer')}</span>
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
                      {t('categories.customerTiers.assignedCount', { count: tierFormData.assignedCustomers.length })}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setTierDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveTier}>
              {editingTier ? t('categories.productCategories.update') : t('categories.productCategories.add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Offer Dialog */}
      <Dialog open={offerDialogOpen} onOpenChange={setOfferDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingOffer ? t('categories.offers.editOffer') : t('categories.offers.addNewOffer')}
            </DialogTitle>
            <DialogDescription>
              {t('categories.offers.offerDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t('categories.offers.offerName')} *</Label>
              <Input
                value={offerFormData.name}
                onChange={(e) => setOfferFormData({ ...offerFormData, name: e.target.value })}
                placeholder={t('categories.offers.offerNamePlaceholder')}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t('categories.offers.customerTier')} *</Label>
              <Select
                value={offerFormData.tierId}
                onValueChange={(value) => setOfferFormData({ ...offerFormData, tierId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('categories.offers.selectCustomerTier')} />
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
              <Label>{t('categories.offers.discountPercent')}</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={offerFormData.discountPercent}
                onChange={(e) => setOfferFormData({ ...offerFormData, discountPercent: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t('categories.offers.productCategories')}</Label>
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
                  <SelectValue placeholder={t('categories.offers.selectProductCategories')} />
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
                {t('categories.customerTiers.assignCustomers')}
              </Label>
              {customersLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className={`text-sm text-muted-foreground ${isRTL ? 'mr-2' : 'ml-2'}`}>{t('categories.customerTiers.loadingCustomers')}</span>
                </div>
              ) : customers.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('categories.customerTiers.noCustomersAvailable')}</p>
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
                      <SelectValue placeholder={t('categories.customerTiers.selectCustomer')} />
                    </SelectTrigger>
                    <SelectContent>
                      {customers
                        .filter(c => !offerFormData.assignedCustomers.includes(c.id))
                        .map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            <div className="flex flex-col">
                              <span>{customer.name || t('categories.customerTiers.customer')}</span>
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
                      {t('categories.customerTiers.assignedCount', { count: offerFormData.assignedCustomers.length })}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOfferDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveOffer}>
              {editingOffer ? t('categories.productCategories.update') : t('categories.productCategories.add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Progress Dialog - New Reusable Component */}
      <ImportProgressDialog
        open={isImporting}
        onOpenChange={(open) => {
          // Only allow closing if import is complete
          if (!open && importProgress.current < importProgress.total && importProgress.total > 0) {
            return;
          }
          setIsImporting(open);
        }}
        progress={importProgress}
        title="جاري استيراد الفئات"
        description="يرجى الانتظار أثناء استيراد الفئات من ملف Excel..."
      />

      {/* Cloudinary Image Picker */}
      <CloudinaryImagePicker
        open={showCloudinaryPicker}
        onOpenChange={(open) => {
          setShowCloudinaryPicker(open);
        }}
        onSelect={(images) => {
          if (images.length > 0) {
            setFormData({ ...formData, image: images[0] });
            toast({
              title: 'تم الاختيار بنجاح',
              description: `تم اختيار صورة من Cloudinary`,
            });
          }
        }}
        multiple={false}
      />

      {/* Import Errors Dialog - Shows failed rows with details */}
      <ImportErrorDialog
        open={showImportErrorDialog}
        onOpenChange={setShowImportErrorDialog}
        errors={importErrors}
        title="تقرير أخطاء استيراد الفئات"
        description="حدثت الأخطاء التالية أثناء استيراد الفئات. يرجى مراجعة الصفوف التي فشلت وتصحيح البيانات في ملف Excel."
        itemLabel="اسم الفئة"
      />
    </div>
  );
}
