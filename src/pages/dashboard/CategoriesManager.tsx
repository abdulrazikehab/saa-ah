import { useEffect, useState, useCallback } from 'react';
import { Download, Upload, Users, FolderOpen, Gift, Plus, Trash2, Tag, Pencil, Percent, Loader2 } from 'lucide-react';
import { read, utils, writeFile } from 'xlsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ImportProgressDialog } from '@/components/ui/import-progress-dialog';
import { ImportErrorDialog, ImportError } from '@/components/ui/import-error-dialog';
import { coreApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/contexts/AuthContext';
import MarketSetupPrompt from '@/components/dashboard/MarketSetupPrompt';



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

  const { user } = useAuth();
  
  // Categories state
  const [categories, setCategories] = useState<{id: string; name: string; nameAr?: string; description?: string; slug?: string; image?: string; productCount?: number; parentId?: string}[]>([]);
  const [loading, setLoading] = useState(true);

  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, currentItem: '' });
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const [showImportErrorDialog, setShowImportErrorDialog] = useState(false);




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

  // Category dialog state
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{id: string; name: string; nameAr?: string; description?: string; slug?: string; image?: string} | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    nameAr: '',
    description: '',
    slug: '',
    image: '',
  });
  
  // Selected categories for bulk actions
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

  // Category handlers
  const handleOpenCategoryDialog = (category?: {id: string; name: string; nameAr?: string; description?: string; slug?: string; image?: string}) => {
    if (category) {
      setEditingCategory(category);
      setCategoryFormData({
        name: category.name || '',
        nameAr: category.nameAr || '',
        description: category.description || '',
        slug: category.slug || '',
        image: category.image || '',
      });
    } else {
      setEditingCategory(null);
      setCategoryFormData({ name: '', nameAr: '', description: '', slug: '', image: '' });
    }
    setShowCategoryDialog(true);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm(t('categories.productCategories.deleteConfirm'))) return;
    
    try {
      await coreApi.deleteCategory(categoryId);
      toast({
        title: t('common.success'),
        description: t('categories.productCategories.deleteSuccess'),
      });
      loadCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
      toast({
        title: t('common.error'),
        description: t('categories.productCategories.deleteError'),
        variant: 'destructive',
      });
    }
  };

  const handleSaveCategory = async () => {
    try {
      if (editingCategory) {
        await coreApi.updateCategory(editingCategory.id, categoryFormData as any);
        toast({
          title: t('common.success'),
          description: t('categories.productCategories.updateSuccess'),
        });
      } else {
        await coreApi.createCategory(categoryFormData as any);
        toast({
          title: t('common.success'),
          description: t('categories.productCategories.addSuccess'),
        });
      }
      setShowCategoryDialog(false);
      setEditingCategory(null);
      setCategoryFormData({ name: '', nameAr: '', description: '', slug: '', image: '' });
      loadCategories();
    } catch (error) {
      console.error('Failed to save category:', error);
      toast({
        title: t('common.error'),
        description: t('categories.productCategories.saveError'),
        variant: 'destructive',
      });
    }
  };

  // Bulk delete categories
  const handleBulkDeleteCategories = async () => {
    if (selectedCategories.size === 0) return;
    
    if (!confirm(t('categories.productCategories.bulkDeleteConfirm', { count: selectedCategories.size }))) return;
    
    try {
      // Delete all selected categories
      await Promise.all(
        Array.from(selectedCategories).map(id => coreApi.deleteCategory(id))
      );
      
      toast({
        title: t('common.success'),
        description: t('categories.productCategories.bulkDeleteSuccess', { count: selectedCategories.size }),
      });
      
      setSelectedCategories(new Set());
      loadCategories();
    } catch (error) {
      console.error('Failed to bulk delete categories:', error);
      toast({
        title: t('common.error'),
        description: t('categories.productCategories.bulkDeleteError'),
        variant: 'destructive',
      });
    }
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectedCategories.size === categories.length) {
      setSelectedCategories(new Set());
    } else {
      setSelectedCategories(new Set(categories.map(c => c.id)));
    }
  };

  // Toggle single category selection
  const toggleCategorySelection = (categoryId: string) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(categoryId)) {
      newSelected.delete(categoryId);
    } else {
      newSelected.add(categoryId);
    }
    setSelectedCategories(newSelected);
  };

  // Load categories and other data
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      
      const categoriesData = await coreApi.getCategories({ limit: 1000 });
      
      let categoriesList: any[] = [];
      
      if (categoriesData && 'meta' in categoriesData) {
        categoriesList = categoriesData.categories;
      } else {
        const data = categoriesData as any;
        categoriesList = Array.isArray(data) ? data : (data.categories || []);
      }

      setCategories(categoriesList.map((c: any) => ({
        ...c,
        parentId: c.parentId || undefined
      })));
      
    } catch (error) {
      console.error('Failed to load data:', error);
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
          <div className="flex justify-between items-center gap-2 mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold">{t('categories.productCategories.allCategories')}</h2>
              {selectedCategories.size > 0 && (
                <Badge variant="secondary" className="gap-1">
                  {selectedCategories.size} {t('common.selected')}
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              {selectedCategories.size > 0 && (
                <Button 
                  variant="destructive" 
                  onClick={handleBulkDeleteCategories} 
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {t('categories.productCategories.deleteSelected')} ({selectedCategories.size})
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
              <Button onClick={() => setShowCategoryDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                {t('categories.productCategories.addCategory')}
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : categories.length === 0 ? (
            <Card>
              <CardContent className="text-center py-16">
                <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{t('categories.productCategories.noCategories')}</h3>
                <p className="text-muted-foreground mb-6">
                  {t('categories.productCategories.noCategoriesDesc')}
                </p>
                <Button onClick={() => setShowCategoryDialog(true)}>
                  <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('categories.productCategories.addNewCategory')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground w-12">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                            checked={selectedCategories.size === categories.length && categories.length > 0}
                            onChange={toggleSelectAll}
                          />
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t('categories.productCategories.logo')}</th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t('categories.productCategories.category')}</th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">Slug</th>
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground">{t('categories.productCategories.productCount')}</th>
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground">{t('categories.productCategories.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((category) => (
                        <tr key={category.id} className={`border-b hover:bg-muted/30 transition-colors ${selectedCategories.has(category.id) ? 'bg-primary/5' : ''}`}>
                          <td className="px-4 py-4">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                              checked={selectedCategories.has(category.id)}
                              onChange={() => toggleCategorySelection(category.id)}
                            />
                          </td>
                          <td className="px-4 py-4">
                            {(category as any).image ? (
                              <img 
                                src={(category as any).image} 
                                alt={category.name}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                <FolderOpen className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div>
                              <p className="font-medium">{(category as any).nameAr || category.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {category.description || t('categories.productCategories.noDescription')}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-muted-foreground font-mono text-sm">
                            {category.slug || '-'}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <Badge variant="secondary">{category.productCount || 0}</Badge>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenCategoryDialog(category)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDeleteCategory(category.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
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

      {/* Category Create/Edit Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory 
                ? t('categories.productCategories.editCategory')
                : t('categories.productCategories.addNewCategory')}
            </DialogTitle>
            <DialogDescription>
              {editingCategory 
                ? t('categories.productCategories.editCategoryDesc')
                : t('categories.productCategories.addCategoryDesc')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoryName">{t('categories.productCategories.name')} (English) *</Label>
                <Input
                  id="categoryName"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  placeholder="Category Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryNameAr">{t('categories.productCategories.name')} (العربية)</Label>
                <Input
                  id="categoryNameAr"
                  value={categoryFormData.nameAr}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, nameAr: e.target.value })}
                  placeholder="اسم الفئة"
                  dir="rtl"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="categorySlug">{t('categories.productCategories.slug')}</Label>
              <Input
                id="categorySlug"
                value={categoryFormData.slug}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, slug: e.target.value })}
                placeholder="category-slug"
              />
              <p className="text-xs text-muted-foreground">{t('categories.productCategories.slugHint')}</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="categoryDescription">{t('categories.productCategories.description')}</Label>
              <Input
                id="categoryDescription"
                value={categoryFormData.description}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                placeholder={t('categories.productCategories.description')}
              />
            </div>
            
            <div className="space-y-2">
              <Label>{t('categories.productCategories.categoryLogo')}</Label>
              <Input
                type="url"
                value={categoryFormData.image}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, image: e.target.value })}
                placeholder="https://example.com/logo.png"
              />
              <p className="text-xs text-muted-foreground">{t('categories.productCategories.logoHint')}</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCategoryDialog(false);
                setEditingCategory(null);
                setCategoryFormData({ name: '', nameAr: '', description: '', slug: '', image: '' });
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSaveCategory}
              disabled={!categoryFormData.name.trim()}
            >
              {editingCategory ? t('categories.productCategories.update') : t('categories.productCategories.add')}
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
