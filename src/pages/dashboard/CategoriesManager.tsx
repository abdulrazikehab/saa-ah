import { useEffect, useState, useCallback } from 'react';
import { Download, Upload, Users, FolderOpen, Gift, Plus, Trash2, Tag, Pencil, Percent, Loader2 } from 'lucide-react';
import { read, utils, writeFile } from 'xlsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { CategoryForm, CategoryFormData } from '@/components/dashboard/CategoryForm';



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
  const [brands, setBrands] = useState<{id: string; name: string; nameAr?: string; code?: string}[]>([]);
  const [categories, setCategories] = useState<{id: string; name: string; nameAr?: string; description?: string; slug?: string; image?: string; productCount?: number; parentId?: string}[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  // Add Category Dialog state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);

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





  // Load categories and other data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [brandsData, categoriesData, productsData] = await Promise.all([
        coreApi.getBrands().catch(() => []),
        coreApi.getCategories({ limit: 1000 }),
        coreApi.getProducts({ limit: '1000' } as any).catch(() => []),
      ]);
      
      // Process Brands
      setBrands(Array.isArray(brandsData) ? brandsData : []);

      // Process Categories
      let categoriesList: any[] = [];
      if (categoriesData && 'meta' in categoriesData) {
        categoriesList = categoriesData.categories;
      } else {
        const data = categoriesData as any;
        categoriesList = Array.isArray(data) ? data : (data.categories || []);
      }

      setCategories(categoriesList.map((c: any) => ({
        ...c,
        parentId: typeof c.parentId === 'object' ? c.parentId?.id : c.parentId,
      })));

      // Process Products
      const productsList = Array.isArray(productsData) 
        ? productsData 
        : ((productsData as any).products || []);
        
      setProducts(productsList.map((p: any) => {
        // Normalize categories
        let normalizedCategories = [];
        if (p.categories && Array.isArray(p.categories)) {
          normalizedCategories = p.categories.map((cat: any) => {
            if (typeof cat === 'string') {
              return { categoryId: cat };
            }
            return {
              categoryId: cat.categoryId || cat.id || cat.category?.id,
              category: cat.category,
              id: cat.id,
            };
          });
        }
        
        return {
          id: p.id,
          name: p.name,
          nameAr: p.nameAr || p.name,
          brandId: p.brandId || p.brand?.id,
          categories: normalizedCategories,
          price: p.price,
          description: p.description,
          status: p.status,
          images: p.images,
          stock: p.stock,
          sku: p.sku,
          barcode: p.barcode,
          cost: p.cost,
          compareAtPrice: p.compareAtPrice,
        };
      }));
      
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: t('common.error'),
        description: t('dashboard.categories.productCategories.loadError'),
        variant: 'destructive',
      });
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);


  
  // Check if user has a market set up (must be after all hooks)
  const hasMarket = !!(user?.tenantId && user.tenantId !== 'default' && user.tenantId !== 'system');
  
  // Show market setup prompt if no market
  if (!hasMarket) {
    return <MarketSetupPrompt />;
  }

















  const handleExport = async () => {
    try {
      setLoading(true);
      
      // Fetch all categories with all fields - use a high limit to get all
      const categoriesData = await coreApi.get(`/categories?limit=10000&allFields=true`);
      let allCategories: any[] = [];
      if (categoriesData && 'categories' in categoriesData) {
        allCategories = categoriesData.categories;
      } else {
        allCategories = Array.isArray(categoriesData) ? categoriesData : [];
      }

      // If paginated, fetch all pages
      if (categoriesData && 'meta' in categoriesData && categoriesData.meta.totalPages > 1) {
        const totalPages = categoriesData.meta.totalPages;
        const allPages = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, i) => 
            coreApi.get(`/categories?limit=10000&page=${i + 2}&allFields=true`)
          )
        );
        allPages.forEach((pageData: any) => {
          if (pageData && 'categories' in pageData) {
            allCategories = [...allCategories, ...pageData.categories];
          }
        });
      }

      // Fetch all products to get SKUs - fetch in batches if needed
      let allProducts: any[] = [];
      try {
        const productsData = await coreApi.getProducts({ limit: 10000 } as any);
        
        // Handle paginated response
        if (productsData && typeof productsData === 'object' && 'data' in productsData) {
          allProducts = productsData.data || [];
          
          // If paginated, fetch all pages
          if (productsData.meta && productsData.meta.totalPages > 1) {
            const totalPages = productsData.meta.totalPages;
            const allProductPages = await Promise.all(
              Array.from({ length: totalPages - 1 }, (_, i) => 
                coreApi.getProducts({ limit: 10000, page: i + 2 } as any)
              )
            );
            allProductPages.forEach((pageData: any) => {
              if (pageData && typeof pageData === 'object' && 'data' in pageData) {
                allProducts = [...allProducts, ...(pageData.data || [])];
              } else if (Array.isArray(pageData)) {
                allProducts = [...allProducts, ...pageData];
              }
            });
          }
        } else if (Array.isArray(productsData)) {
          // Non-paginated array response
          allProducts = productsData;
        } else if (productsData && 'products' in productsData) {
          // Legacy format
          allProducts = (productsData as any).products || [];
        }
      } catch (error) {
        console.warn('Could not fetch all products for export:', error);
        // Use already loaded products as fallback
        allProducts = products;
      }

      // Create a map of category ID to product SKUs
      const categoryProductMap = new Map<string, string[]>();
      
      allProducts.forEach((product: any) => {
        if (product.categories && Array.isArray(product.categories)) {
          product.categories.forEach((cat: any) => {
            const categoryId = cat.categoryId || cat.id || cat.category?.id;
            if (categoryId && product.sku) {
              if (!categoryProductMap.has(categoryId)) {
                categoryProductMap.set(categoryId, []);
              }
              categoryProductMap.get(categoryId)!.push(product.sku);
            }
          });
        }
      });

      // Create a map of category ID to category data for path building
      const categoryMap = new Map<string, any>();
      allCategories.forEach((cat: any) => {
        if (cat.id) {
          categoryMap.set(cat.id, cat);
        }
      });

      // Helper function to build category path (full hierarchy)
      const buildCategoryPath = (category: any, useArabic: boolean = false): string => {
        const path: string[] = [];
        let current: any = category;
        
        // Build path from current to root
        while (current) {
          const name = useArabic ? ((current.nameAr || current.name) || '') : (current.name || '');
          if (name) {
            path.unshift(name);
          }
          
          if (current.parentId && categoryMap.has(current.parentId)) {
            current = categoryMap.get(current.parentId);
          } else {
            break;
          }
        }
        
        return path.join(' > ');
      };

      // Define headers for the Excel sheet - Arabic column names
      const headers = [
        'مسار الفئة', // Category Path
        'الاسم', // Name
        'الاسم (عربي)', // NameAr
        'الوصف', // Description
        'الوصف (عربي)', // DescriptionAr
        'الرابط', // Slug
        'الصورة', // Image
        'الأيقونة', // Icon
        'نشط', // IsActive
        'ترتيب العرض', // SortOrder
        'الحد الأدنى للكمية', // MinQuantity
        'الحد الأقصى للكمية', // MaxQuantity
        'تفعيل السلايدر', // EnableSlider
        'تطبيق السلايدر على جميع المنتجات', // ApplySliderToAllProducts
        'عدد المنتجات', // ProductCount
        'أكواد المنتجات' // ProductSKUs
      ];
      
      const exportData = allCategories.map(c => {
        const categoryId = c.id;
        const productSKUs = categoryProductMap.get(categoryId) || [];
        const skusString = productSKUs.join(', ');
        
        // Build full category path in Arabic
        const categoryPath = buildCategoryPath(c, true);
        
        return {
          'مسار الفئة': categoryPath, // Full path: Category > Subcategory > Subcategory...
          'الاسم': c.name || '',
          'الاسم (عربي)': (c as any).nameAr || '',
          'الوصف': c.description || '',
          'الوصف (عربي)': (c as any).descriptionAr || '',
          'الرابط': c.slug || '',
          'الصورة': (c as any).image || '',
          'الأيقونة': (c as any).icon || '',
          'نشط': (c as any).isActive !== undefined ? ((c as any).isActive ? 'نعم' : 'لا') : 'نعم',
          'ترتيب العرض': (c as any).sortOrder || 0,
          'الحد الأدنى للكمية': (c as any).minQuantity || '',
          'الحد الأقصى للكمية': (c as any).maxQuantity || '',
          'تفعيل السلايدر': (c as any).enableSlider !== undefined ? ((c as any).enableSlider ? 'نعم' : 'لا') : 'لا',
          'تطبيق السلايدر على جميع المنتجات': (c as any).applySliderToAllProducts !== undefined ? ((c as any).applySliderToAllProducts ? 'نعم' : 'لا') : 'لا',
          'عدد المنتجات': c.productCount || productSKUs.length || 0,
          'أكواد المنتجات': skusString,
        };
      });

      // Create worksheet with headers
      const ws = utils.json_to_sheet(exportData, { header: headers });
      
      // Set column widths for better readability
      const colWidths = [
        { wch: 50 }, // مسار الفئة (Category Path)
        { wch: 25 }, // الاسم (Name)
        { wch: 25 }, // الاسم (عربي) (NameAr)
        { wch: 40 }, // الوصف (Description)
        { wch: 40 }, // الوصف (عربي) (DescriptionAr)
        { wch: 25 }, // الرابط (Slug)
        { wch: 50 }, // الصورة (Image)
        { wch: 20 }, // الأيقونة (Icon)
        { wch: 10 }, // نشط (IsActive)
        { wch: 12 }, // ترتيب العرض (SortOrder)
        { wch: 15 }, // الحد الأدنى للكمية (MinQuantity)
        { wch: 15 }, // الحد الأقصى للكمية (MaxQuantity)
        { wch: 15 }, // تفعيل السلايدر (EnableSlider)
        { wch: 30 }, // تطبيق السلايدر على جميع المنتجات (ApplySliderToAllProducts)
        { wch: 12 }, // عدد المنتجات (ProductCount)
        { wch: 100 }, // أكواد المنتجات (ProductSKUs)
      ];
      ws['!cols'] = colWidths;
      
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Categories");
      writeFile(wb, `categories_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast({
        title: t('common.success'),
        description: `${allCategories.length} categories exported successfully with product SKUs`,
      });
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: error.message || 'Failed to export categories',
      });
    } finally {
      setLoading(false);
    }
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
        'مسار الفئة'?: string; // Category Path (Arabic header)
        'Category Path'?: string; // Category Path (English header - fallback)
        'الاسم'?: string; // Name (Arabic)
        'Name'?: string; // Name (English fallback)
        'الاسم (عربي)'?: string; // NameAr (Arabic)
        'NameAr'?: string; // NameAr (English fallback)
        'الوصف'?: string; // Description (Arabic)
        'Description'?: string; // Description (English fallback)
        'الوصف (عربي)'?: string; // DescriptionAr (Arabic)
        'DescriptionAr'?: string; // DescriptionAr (English fallback)
        'الرابط'?: string; // Slug (Arabic)
        'Slug'?: string; // Slug (English fallback)
        'Parent'?: string; // Legacy parent column
        'الصورة'?: string; // Image (Arabic)
        'Image'?: string; // Image (English fallback)
        'الأيقونة'?: string; // Icon (Arabic)
        'Icon'?: string; // Icon (English fallback)
        'نشط'?: string; // IsActive (Arabic)
        'IsActive'?: string; // IsActive (English fallback)
        'ترتيب العرض'?: number; // SortOrder (Arabic)
        'SortOrder'?: number; // SortOrder (English fallback)
        'الحد الأدنى للكمية'?: number; // MinQuantity (Arabic)
        'MinQuantity'?: number; // MinQuantity (English fallback)
        'الحد الأقصى للكمية'?: number; // MaxQuantity (Arabic)
        'MaxQuantity'?: number; // MaxQuantity (English fallback)
        'تفعيل السلايدر'?: string; // EnableSlider (Arabic)
        'EnableSlider'?: string; // EnableSlider (English fallback)
        'تطبيق السلايدر على جميع المنتجات'?: string; // ApplySliderToAllProducts (Arabic)
        'ApplySliderToAllProducts'?: string; // ApplySliderToAllProducts (English fallback)
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

      // Helper function to get field value (supports both Arabic and English headers)
      const getField = (row: any, arabicKey: string, englishKey: string): string | undefined => {
        return row[arabicKey] || row[englishKey];
      };

      // Map to track created categories during import (name -> id)
      const createdCategoriesMap = new Map<string, string>();

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const rowNum = i + 2; // Excel row number (1-indexed + header)
        
        // Get name (supports both Arabic and English headers)
        const name = getField(row, 'الاسم', 'Name')?.trim();
        const itemName = name || `الصف ${rowNum}`;
        
        // Update progress
        setImportProgress({ 
          current: i + 1, 
          total: totalItems, 
          currentItem: `جاري استيراد: ${itemName}...` 
        });

        // Validate Name field
        if (!name) {
          collectedErrors.push({
            row: rowNum,
            column: 'الاسم / Name',
            itemName: itemName,
            error: 'اسم الفئة مطلوب'
          });
          continue;
        }

        try {
          // Parse category path if provided
          let parentId: string | undefined;
          const categoryPath = getField(row, 'مسار الفئة', 'Category Path')?.trim();
          
          if (categoryPath) {
            // Split path by ' > ' or '>' separator
            const pathParts = categoryPath.split(/\s*>\s*/).map(p => p.trim()).filter(p => p);
            
            if (pathParts.length > 1) {
              // The last part is the current category name, rest is the path
              const currentCategoryName = pathParts[pathParts.length - 1];
              
              // Build the path from root to parent
              let currentParentId: string | undefined = undefined;
              
              // Process each part of the path (except the last one which is the current category)
              for (let j = 0; j < pathParts.length - 1; j++) {
                const pathPart = pathParts[j];
                
                // First check in created categories map (from this import)
                let foundCategoryId = createdCategoriesMap.get(pathPart);
                
                // If not found, check in existing categories
                if (!foundCategoryId) {
                  const foundCategory = categories.find(c => 
                    c.name?.toLowerCase() === pathPart.toLowerCase() ||
                    (c as any).nameAr?.toLowerCase() === pathPart.toLowerCase()
                  );
                  foundCategoryId = foundCategory?.id;
                }
                
                // If still not found, create it
                if (!foundCategoryId) {
                  try {
                    const slug = generateSlug(pathPart);
                    const newCategory = await coreApi.createCategory({
                      name: pathPart,
                      slug,
                      parentId: currentParentId || undefined,
                      isActive: true,
                    } as any);
                    foundCategoryId = newCategory.category?.id;
                    createdCategoriesMap.set(pathPart, foundCategoryId);
                  } catch (error: any) {
                    collectedErrors.push({
                      row: rowNum,
                      column: 'مسار الفئة / Category Path',
                      itemName: itemName,
                      error: `فشل إنشاء الفئة الأب "${pathPart}": ${error?.message || 'خطأ غير معروف'}`
                    });
                    break;
                  }
                }
                
                currentParentId = foundCategoryId;
              }
              
              parentId = currentParentId;
            }
          } else {
            // Fallback to Parent column if path not provided
            const parentName = row.Parent?.trim();
            if (parentName) {
              // Check in created categories map first
              let foundParentId = createdCategoriesMap.get(parentName);
              
              // If not found, check in existing categories
              if (!foundParentId) {
                const parent = categories.find(c => 
                  c.name?.toLowerCase() === parentName.toLowerCase() ||
                  (c as any).nameAr?.toLowerCase() === parentName.toLowerCase() ||
                  c.slug?.toLowerCase() === parentName.toLowerCase()
                );
                foundParentId = parent?.id;
              }
              
              parentId = foundParentId;
              
              if (!parentId) {
                collectedErrors.push({
                  row: rowNum,
                  column: 'Parent',
                  itemName: itemName,
                  error: `الفئة الأب "${parentName}" غير موجودة. تأكد من إنشاء الفئات الأب أولاً أو استخدم اسم فئة موجودة.`
                });
                continue;
              }
            }
          }

          // Get all field values (supporting both Arabic and English headers)
          const nameAr = getField(row, 'الاسم (عربي)', 'NameAr')?.trim();
          const description = getField(row, 'الوصف', 'Description')?.trim() || '';
          const descriptionAr = getField(row, 'الوصف (عربي)', 'DescriptionAr')?.trim();
          const slug = getField(row, 'الرابط', 'Slug')?.trim() || generateSlug(name);
          const image = getField(row, 'الصورة', 'Image')?.trim();
          const icon = getField(row, 'الأيقونة', 'Icon')?.trim();
          const isActiveStr = getField(row, 'نشط', 'IsActive');
          const sortOrder = getField(row, 'ترتيب العرض', 'SortOrder') || row.SortOrder;
          const minQuantity = getField(row, 'الحد الأدنى للكمية', 'MinQuantity') || row.MinQuantity;
          const maxQuantity = getField(row, 'الحد الأقصى للكمية', 'MaxQuantity') || row.MaxQuantity;
          const enableSliderStr = getField(row, 'تفعيل السلايدر', 'EnableSlider');
          const applySliderToAllProductsStr = getField(row, 'تطبيق السلايدر على جميع المنتجات', 'ApplySliderToAllProducts');

          // Parse boolean fields (supports Arabic 'نعم'/'لا' and English 'Yes'/'No')
          const isActive = isActiveStr ? 
            (isActiveStr.toString().toLowerCase() === 'yes' || 
             isActiveStr.toString().toLowerCase() === 'true' || 
             isActiveStr.toString() === '1' ||
             isActiveStr.toString() === 'نعم') : 
            true;
          
          const enableSlider = enableSliderStr ? 
            (enableSliderStr.toString().toLowerCase() === 'yes' || 
             enableSliderStr.toString().toLowerCase() === 'true' || 
             enableSliderStr.toString() === '1' ||
             enableSliderStr.toString() === 'نعم') : 
            false;
          
          const applySliderToAllProducts = applySliderToAllProductsStr ? 
            (applySliderToAllProductsStr.toString().toLowerCase() === 'yes' || 
             applySliderToAllProductsStr.toString().toLowerCase() === 'true' || 
             applySliderToAllProductsStr.toString() === '1' ||
             applySliderToAllProductsStr.toString() === 'نعم') : 
            false;

          const newCategory = await coreApi.createCategory({
            name: name.trim(),
            nameAr: nameAr || undefined,
            description,
            descriptionAr: descriptionAr || undefined,
            slug,
            parentId: parentId || undefined,
            image: image || undefined,
            icon: icon || undefined,
            isActive,
            sortOrder: sortOrder ? Number(sortOrder) : undefined,
            minQuantity: minQuantity ? Number(minQuantity) : undefined,
            maxQuantity: maxQuantity ? Number(maxQuantity) : undefined,
            enableSlider,
            applySliderToAllProducts,
          } as any);
          
          // Track created category for path building
          const createdCategoryId = newCategory.category?.id;
          createdCategoriesMap.set(name, createdCategoryId);
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
      
      loadData();
      e.target.value = '';
    } catch (error: any) {
      setIsImporting(false);
      toast({ 
        title: t('common.error'), 
        description: error?.message || t('dashboard.categories.productCategories.importError'), 
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
      toast({ title: t('common.error'), description: t('dashboard.categories.customerTiers.tierNameRequired'), variant: 'destructive' });
      return;
    }

    if (editingTier) {
      setCustomerTiers(prev => prev.map(t => 
        t.id === editingTier.id 
          ? { ...t, ...tierFormData }
          : t
      ));
      toast({ title: t('common.success'), description: t('dashboard.categories.customerTiers.updateSuccess') });
    } else {
      const newTier: CustomerTier = {
        id: Date.now().toString(),
        ...tierFormData,
      };
      setCustomerTiers(prev => [...prev, newTier]);
      toast({ title: t('common.success'), description: t('dashboard.categories.customerTiers.addSuccess') });
    }
    setTierDialogOpen(false);
  };

  const handleDeleteTier = (id: string) => {
    if (!confirm(t('dashboard.categories.customerTiers.deleteConfirm'))) return;
    setCustomerTiers(prev => prev.filter(t => t.id !== id));
    toast({ title: t('common.success'), description: t('dashboard.categories.customerTiers.deleteSuccess') });
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
      toast({ title: t('common.error'), description: t('dashboard.categories.offers.nameAndTierRequired'), variant: 'destructive' });
      return;
    }

    const tier = customerTiers.find(t => t.id === offerFormData.tierId);

    if (editingOffer) {
      setOffers(prev => prev.map(o => 
        o.id === editingOffer.id 
          ? { ...o, ...offerFormData, tierName: tier?.name || '' }
          : o
      ));
      toast({ title: t('common.success'), description: t('dashboard.categories.offers.updateSuccess') });
    } else {
      const newOffer: CategoryOffer = {
        id: Date.now().toString(),
        ...offerFormData,
        tierName: tier?.name || '',
      };
      setOffers(prev => [...prev, newOffer]);
      toast({ title: t('common.success'), description: t('dashboard.categories.offers.addSuccess') });
    }
    setOfferDialogOpen(false);
  };

  const handleDeleteOffer = (id: string) => {
    if (!confirm(t('dashboard.categories.offers.deleteConfirm'))) return;
    setOffers(prev => prev.filter(o => o.id !== id));
    toast({ title: t('common.success'), description: t('dashboard.categories.offers.deleteSuccess') });
  };

  const calculateDiscount = (price: number, discountPercent: number) => {
    return (price * (1 - discountPercent / 100)).toFixed(2);
  };

  // ==================== Category Functions ====================

  const handleOpenCategoryDialog = () => {
    setCategoryDialogOpen(true);
  };

  const handleCategoryFormSave = async (formData: CategoryFormData) => {
    try {
      setSavingCategory(true);

      // Generate slug if not provided
      const slug = formData.slug.trim() || 
        formData.name
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');

      await coreApi.createCategory({
        name: formData.name.trim(),
        nameAr: formData.nameAr.trim() || undefined,
        description: formData.description.trim() || undefined,
        descriptionAr: formData.descriptionAr.trim() || undefined,
        slug,
        parentId: formData.parentId || undefined,
        image: formData.image.trim() || undefined,
        icon: formData.icon.trim() || undefined,
        isActive: formData.isActive,
      } as any);

      toast({
        title: t('common.success'),
        description: 'تم إضافة الفئة بنجاح',
      });

      setCategoryDialogOpen(false);
      loadData(); // Reload categories
    } catch (error: any) {
      console.error('Failed to create category:', error);
      toast({
        title: t('common.error'),
        description: error?.message || 'فشل إضافة الفئة',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setSavingCategory(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {t('dashboard.categories.title')}
          </h1>
          <p className="text-muted-foreground text-lg">{t('dashboard.categories.subtitle')}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="categories" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            {t('dashboard.categories.tabs.productCategories')}
          </TabsTrigger>
          <TabsTrigger value="tiers" className="gap-2">
            <Users className="h-4 w-4" />
            {t('dashboard.categories.tabs.customerTiers')}
          </TabsTrigger>
          <TabsTrigger value="offers" className="gap-2">
            <Gift className="h-4 w-4" />
            {t('dashboard.categories.tabs.offers')}
          </TabsTrigger>
        </TabsList>

        {/* Product Categories Tab */}
        {/* Product Categories Tab */}
        <TabsContent value="categories">
          <div className="flex justify-between items-center gap-2 mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold">{t('dashboard.categories.productCategories.allCategories')}</h2>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleOpenCategoryDialog} className="gap-2">
                <Plus className="h-4 w-4" />
                إضافة فئة
              </Button>
              <Button variant="outline" onClick={handleExport} className="gap-2">
                <Download className="h-4 w-4" />
                {t('dashboard.categories.productCategories.export')}
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
                  {t('dashboard.categories.productCategories.import')}
                </Button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto" dir={isRTL ? 'rtl' : 'ltr'}>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold text-right">الإجراءات</TableHead>
                        <TableHead className="font-semibold text-center">عدد المنتجات</TableHead>
                        <TableHead className="font-semibold text-right">الوصف</TableHead>
                        <TableHead className="font-semibold text-right">الاسم (عربي)</TableHead>
                        <TableHead className="font-semibold text-right">الاسم</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                            <div className="flex flex-col items-center gap-2">
                              <FolderOpen className="h-12 w-12 text-muted-foreground/50" />
                              <p className="text-lg">لا توجد فئات</p>
                              <p className="text-sm">ابدأ بإضافة فئة جديدة</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        categories.map((category) => (
                          <TableRow key={category.id} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="py-4">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    window.location.href = '/dashboard/hierarchical';
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="py-4 text-center">
                              <Badge variant="secondary" className="font-semibold">
                                {category.productCount || 0}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-4 text-right max-w-md">
                              <div className="truncate" title={category.description || undefined}>
                                {category.description || '-'}
                              </div>
                            </TableCell>
                            <TableCell className="py-4 text-right">
                              <span className="text-muted-foreground">{category.nameAr || '-'}</span>
                            </TableCell>
                            <TableCell className="font-medium py-4 text-right">
                              <div className="flex items-center gap-2 justify-end">
                                <span>{category.name || '-'}</span>
                                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
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
              {t('dashboard.categories.customerTiers.addTier')}
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
                      <Label className="text-sm text-muted-foreground">{t('dashboard.categories.customerTiers.linkedCategories')}</Label>
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
                          <span className="text-sm text-muted-foreground">{t('dashboard.categories.customerTiers.allCategories')}</span>
                        )}
                      </div>
                    </div>
                    {/* Assigned Customers Count */}
                    <div>
                      <Label className="text-sm text-muted-foreground">{t('dashboard.categories.customerTiers.assignedCustomers')}</Label>
                      <div className="mt-1">
                        {tier.assignedCustomers && tier.assignedCustomers.length > 0 ? (
                          <Badge variant="default" className="text-xs">
                            {t('dashboard.categories.customerTiers.customerCount', { count: tier.assignedCustomers.length })}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">{t('dashboard.categories.customerTiers.noCustomersAssigned')}</span>
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
                {t('dashboard.categories.customerTiers.howItWorks')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <p>{t('dashboard.categories.customerTiers.howItWorksDesc1')}</p>
                <p>{t('dashboard.categories.customerTiers.howItWorksDesc2')}</p>
                <p>{t('dashboard.categories.customerTiers.howItWorksDesc3')}</p>
                <p>{t('dashboard.categories.customerTiers.howItWorksDesc4')}</p>
                <p className="text-muted-foreground">{t('dashboard.categories.customerTiers.howItWorksDesc5')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Offers Tab */}
        <TabsContent value="offers">
          <div className="flex justify-end mb-4">
            <Button onClick={() => handleOpenOfferDialog()} size="lg">
              <Plus className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('dashboard.categories.offers.addOffer')}
            </Button>
          </div>

          {offers.length === 0 ? (
            <Card>
              <CardContent className="text-center py-16">
                <Gift className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{t('dashboard.categories.offers.noOffers')}</h3>
                <p className="text-muted-foreground mb-6">
                  {t('dashboard.categories.offers.noOffersDesc')}
                </p>
                <Button onClick={() => handleOpenOfferDialog()}>
                  <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('dashboard.categories.offers.addNewOffer')}
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
                        <CardDescription>{t('dashboard.categories.offers.forTier', { tierName: offer.tierName })}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={offer.isActive ? 'default' : 'secondary'}>
                          {offer.isActive ? t('dashboard.categories.offers.active') : t('dashboard.categories.offers.inactive')}
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
                        <Label className="text-sm text-muted-foreground">{t('dashboard.categories.offers.includedCategories')}</Label>
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
                            <span className="text-sm text-muted-foreground">{t('dashboard.categories.offers.allCategories')}</span>
                          )}
                        </div>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-sm">
                          <strong>{t('dashboard.categories.offers.example')}</strong> {t('dashboard.categories.offers.exampleDesc', { price: calculateDiscount(100, offer.discountPercent) })}
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
              {editingTier ? t('dashboard.categories.customerTiers.editTier') : t('dashboard.categories.customerTiers.addNewTier')}
            </DialogTitle>
            <DialogDescription>
              {t('dashboard.categories.customerTiers.tierDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t('dashboard.categories.customerTiers.tierName')} *</Label>
              <Input
                value={tierFormData.name}
                onChange={(e) => setTierFormData({ ...tierFormData, name: e.target.value })}
                placeholder={t('dashboard.categories.customerTiers.tierNamePlaceholder')}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t('dashboard.categories.customerTiers.description')}</Label>
              <Input
                value={tierFormData.description}
                onChange={(e) => setTierFormData({ ...tierFormData, description: e.target.value })}
                placeholder={t('dashboard.categories.customerTiers.descriptionPlaceholder')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t('dashboard.categories.customerTiers.color')}</Label>
                <Input
                  type="color"
                  value={tierFormData.color}
                  onChange={(e) => setTierFormData({ ...tierFormData, color: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="grid gap-2">
                <Label>{t('dashboard.categories.customerTiers.discountPercent')}</Label>
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
              <Label>{t('dashboard.categories.customerTiers.linkedProductCategories')}</Label>
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
                  <SelectValue placeholder={t('dashboard.categories.customerTiers.selectProductCategory')} />
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
                {t('dashboard.categories.customerTiers.assignCustomers')}
              </Label>
              {customersLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className={`text-sm text-muted-foreground ${isRTL ? 'mr-2' : 'ml-2'}`}>{t('dashboard.categories.customerTiers.loadingCustomers')}</span>
                </div>
              ) : customers.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('dashboard.categories.customerTiers.noCustomersAvailable')}</p>
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
                      <SelectValue placeholder={t('dashboard.categories.customerTiers.selectCustomer')} />
                    </SelectTrigger>
                    <SelectContent>
                      {customers
                        .filter(c => !tierFormData.assignedCustomers.includes(c.id))
                        .map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            <div className="flex flex-col">
                              <span>{customer.name || t('dashboard.categories.customerTiers.customer')}</span>
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
                      {t('dashboard.categories.customerTiers.assignedCount', { count: tierFormData.assignedCustomers.length })}
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
              {editingTier ? t('dashboard.categories.productCategories.update') : t('dashboard.categories.productCategories.add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Offer Dialog */}
      <Dialog open={offerDialogOpen} onOpenChange={setOfferDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingOffer ? t('dashboard.categories.offers.editOffer') : t('dashboard.categories.offers.addNewOffer')}
            </DialogTitle>
            <DialogDescription>
              {t('dashboard.categories.offers.offerDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t('dashboard.categories.offers.offerName')} *</Label>
              <Input
                value={offerFormData.name}
                onChange={(e) => setOfferFormData({ ...offerFormData, name: e.target.value })}
                placeholder={t('dashboard.categories.offers.offerNamePlaceholder')}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t('dashboard.categories.offers.customerTier')} *</Label>
              <Select
                value={offerFormData.tierId}
                onValueChange={(value) => setOfferFormData({ ...offerFormData, tierId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('dashboard.categories.offers.selectCustomerTier')} />
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
              <Label>{t('dashboard.categories.offers.discountPercent')}</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={offerFormData.discountPercent}
                onChange={(e) => setOfferFormData({ ...offerFormData, discountPercent: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t('dashboard.categories.offers.productCategories')}</Label>
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
                  <SelectValue placeholder={t('dashboard.categories.offers.selectProductCategories')} />
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
                {t('dashboard.categories.customerTiers.assignCustomers')}
              </Label>
              {customersLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className={`text-sm text-muted-foreground ${isRTL ? 'mr-2' : 'ml-2'}`}>{t('dashboard.categories.customerTiers.loadingCustomers')}</span>
                </div>
              ) : customers.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('dashboard.categories.customerTiers.noCustomersAvailable')}</p>
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
                      <SelectValue placeholder={t('dashboard.categories.customerTiers.selectCustomer')} />
                    </SelectTrigger>
                    <SelectContent>
                      {customers
                        .filter(c => !offerFormData.assignedCustomers.includes(c.id))
                        .map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            <div className="flex flex-col">
                              <span>{customer.name || t('dashboard.categories.customerTiers.customer')}</span>
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
                      {t('dashboard.categories.customerTiers.assignedCount', { count: offerFormData.assignedCustomers.length })}
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
              {editingOffer ? t('dashboard.categories.productCategories.update') : t('dashboard.categories.productCategories.add')}
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
        title={t('dashboard.categories.productCategories.importingCategories')}
        description={t('dashboard.categories.productCategories.importingCategoriesDesc')}
      />



      {/* Import Errors Dialog - Shows failed rows with details */}
      <ImportErrorDialog
        open={showImportErrorDialog}
        onOpenChange={setShowImportErrorDialog}
        errors={importErrors}
        title={t('dashboard.categories.productCategories.importErrorTitle')}
        description={t('dashboard.categories.productCategories.importErrorDesc')}
        itemLabel={t('dashboard.categories.productCategories.categoryName')}
      />

      {/* Add Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('dashboard.categories.productCategories.addNewCategory')}</DialogTitle>
            <DialogDescription>
              {t('dashboard.categories.productCategories.addCategoryDesc')}
            </DialogDescription>
          </DialogHeader>
          <CategoryForm
            categories={categories}
            initialData={null}
            parentId={undefined}
            onSave={handleCategoryFormSave}
            onCancel={() => setCategoryDialogOpen(false)}
            saving={savingCategory}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
