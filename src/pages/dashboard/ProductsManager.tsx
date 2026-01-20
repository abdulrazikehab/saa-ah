import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Filter, Download, Upload, Edit, Trash2, Eye, Package, AlertCircle, Image as ImageIcon, X, Tag, Globe, TrendingUp, Settings, FolderTree, Store, Loader2, ChevronLeft, ChevronRight, Cloud } from 'lucide-react';
import { read, utils, writeFile } from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ImportProgressDialog } from '@/components/ui/import-progress-dialog';
import { coreApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import MarketSetupPrompt from '@/components/dashboard/MarketSetupPrompt';
import { CloudinaryImagePicker } from '@/components/dashboard/CloudinaryImagePicker';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import { ProductFormWizard, ProductFormData } from '@/components/dashboard/products/ProductFormWizard';
import { ProductImportWizard } from '@/components/dashboard/products/ProductImportWizard';

interface Category {
  id: string;
  name: string;
  nameAr?: string;
  parentId?: string;
}

interface CategoryResponse {
  id: string;
  name: string;
  nameAr?: string;
  parentId?: string;
}

interface ProductApiResponse {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  price?: number | string;
  compareAtPrice?: number;
  costPerItem?: number;
  sku?: string;
  barcode?: string;
  lowStockThreshold?: number;
  images?: Array<string | { url: string }>;
  categories?: Array<{ category?: Category } | Category>;
  variants?: Array<{ inventoryQuantity?: number }>;
  isAvailable?: boolean;
  featured?: boolean;
  createdAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  weight?: string;
  dimensions?: string;
  unit?: { id: string };
  productId?: string;
  odooProductId?: string;
  slug?: string;
  suppliers?: Array<{ supplierId?: string; supplier?: { id: string } }>;
}

interface Product {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  price: number;
  compareAtPrice?: number;
  cost?: number;
  costPerItem?: number;
  sku: string;
  barcode?: string;
  stock: number;
  lowStockThreshold: number;
  images: string[];
  category?: Category;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  featured: boolean;
  createdAt: string;
  metaTitle?: string;
  metaDescription?: string;
  weight?: string;
  dimensions?: string;
  path?: string;
  // Export fields
  productId?: string;
  coinsNumber?: number;
  notify?: boolean;
  min?: number;
  max?: number;
  webStatus?: boolean;
  mobileStatus?: boolean;
  purpleCardsProductNameAr?: string;
  purpleCardsProductNameEn?: string;
  purpleCardsSlugAr?: string;
  purpleCardsSlugEn?: string;
  purpleCardsDescAr?: string;
  purpleCardsDescEn?: string;
  purpleCardsLongDescAr?: string;
  purpleCardsLongDescEn?: string;
  purpleCardsMetaTitleAr?: string;
  purpleCardsMetaTitleEn?: string;
  purpleCardsMetaKeywordAr?: string;
  purpleCardsMetaKeywordEn?: string;
  purpleCardsMetaDescriptionAr?: string;
  purpleCardsMetaDescriptionEn?: string;
  ish7enProductNameAr?: string;
  ish7enProductNameEn?: string;
  ish7enSlugAr?: string;
  ish7enSlugEn?: string;
  ish7enDescAr?: string;
  ish7enDescEn?: string;
  ish7enLongDescAr?: string;
  ish7enLongDescEn?: string;
  ish7enMetaTitleAr?: string;
  ish7enMetaTitleEn?: string;
  ish7enMetaKeywordAr?: string;
  ish7enMetaKeywordEn?: string;
  ish7enMetaDescriptionAr?: string;
  ish7enMetaDescriptionEn?: string;
}

export default function ProductsManager() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Array<{ id: string; name: string; nameAr?: string; code: string; symbol?: string; cost: number }>>([]);
  const [brands, setBrands] = useState<Array<{ id: string; name: string; nameAr?: string; code?: string }>>([]);
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string; nameAr?: string; discountRate: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, currentItem: '' });
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [importErrors, setImportErrors] = useState<Array<{ row: number; column: string; productName: string; error: string }>>([]);
  const [showImportErrorDialog, setShowImportErrorDialog] = useState(false);
  const importAbortRef = useRef<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Form state
  const [wizardInitialData, setWizardInitialData] = useState<Partial<ProductFormData>>({});
  const [wizardInitialImages, setWizardInitialImages] = useState<string[]>([]);
  const [isImportWizardOpen, setIsImportWizardOpen] = useState(false);


  const [activeTab, setActiveTab] = useState('all');

  // Define loadData and other helpers BEFORE hooks and early returns to avoid ReferenceError
  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Calling coreApi.getProducts()...');
      
      // Build query params with pagination
      const queryParams: Record<string, string | number> = {
        page: currentPage,
        limit: itemsPerPage,
      };
      
      if (searchQuery) {
        queryParams.search = searchQuery;
      }
      
      if (filterCategory !== 'all') {
        queryParams.categoryId = filterCategory;
      }
      
      if (filterStatus !== 'all') {
        queryParams.isActive = filterStatus === 'active' ? 'true' : 'false';
      }
      
      const [productsResponse, categoriesData, unitsData, brandsData, suppliersData] = await Promise.all([
        coreApi.getProducts(queryParams, true),
        coreApi.getCategories(),
        coreApi.get('/units', { requireAuth: true }).catch(() => []),
        coreApi.getBrands(true).catch(() => []), 
        coreApi.get('/suppliers', { requireAuth: true }).catch(() => [])
      ]);
      
      let productsData: ProductApiResponse[] = [];
      if (productsResponse && typeof productsResponse === 'object' && 'data' in productsResponse && 'meta' in productsResponse) {
        const paginatedResponse = productsResponse as unknown as { data: ProductApiResponse[]; meta: { total: number; page: number; limit: number; totalPages: number } };
        productsData = paginatedResponse.data;
        setTotalItems(paginatedResponse.meta.total);
        setTotalPages(paginatedResponse.meta.totalPages);
        setCurrentPage(paginatedResponse.meta.page);
      } else {
        productsData = Array.isArray(productsResponse) ? (productsResponse as unknown as ProductApiResponse[]) : [];
        setTotalItems(productsData.length);
        setTotalPages(1);
      }

      let validCategories: CategoryResponse[] = [];
      if (categoriesData && typeof categoriesData === 'object') {
        if (Array.isArray(categoriesData)) {
          validCategories = categoriesData.filter((c: unknown) => 
            c && typeof c === 'object' && 'id' in c && !('error' in c) && !('statusCode' in c)
          ) as CategoryResponse[];
        } else {
          const dataObj = categoriesData as { categories?: unknown[] };
          if (dataObj.categories && Array.isArray(dataObj.categories)) {
            validCategories = dataObj.categories.filter((c: unknown) => 
              c && typeof c === 'object' && 'id' in c && !('error' in c) && !('statusCode' in c)
            ) as CategoryResponse[];
          }
        }
      }
      
      const mappedCategories = validCategories.map((c: CategoryResponse) => ({
        id: c.id,
        name: c.name,
        nameAr: c.nameAr || c.name,
        parentId: c.parentId || undefined
      }));
      setCategories(mappedCategories);
      
      const validateArray = <T,>(data: unknown): T[] => {
        if (Array.isArray(data)) {
          return data.filter((item: unknown) => 
            item && typeof item === 'object' && !('error' in item) && !('statusCode' in item)
          ) as T[];
        }
        return [];
      };
      
      setUnits(validateArray<any>(unitsData));
      setBrands(validateArray<any>(brandsData));
      setSuppliers(validateArray<any>(suppliersData));

      let rawProducts: ProductApiResponse[] = [];
      if (productsData && typeof productsData === 'object') {
        if (Array.isArray(productsData)) {
          rawProducts = (productsData.filter((p: unknown) => 
            p && typeof p === 'object' && 'id' in p && !('error' in p) && !('statusCode' in p)
          ) as unknown[]) as ProductApiResponse[];
        } else {
          const dataObj = productsData as { products?: unknown[] };
          if (dataObj.products && Array.isArray(dataObj.products)) {
            rawProducts = dataObj.products.filter((p: unknown) => 
              p && typeof p === 'object' && 'id' in p && !('error' in p) && !('statusCode' in p)
            ) as ProductApiResponse[];
          } else if (!('error' in productsData) && !('statusCode' in productsData)) {
            rawProducts = [productsData as ProductApiResponse];
          }
        }
      }
      
      const mappedProducts: Product[] = rawProducts.map((p: ProductApiResponse): Product => {
        let productCategory: Category | undefined = undefined;
        if (p.categories && Array.isArray(p.categories) && p.categories.length > 0) {
          const firstCategory = p.categories[0];
          if (firstCategory && typeof firstCategory === 'object' && 'category' in firstCategory) {
            productCategory = (firstCategory as { category?: Category }).category;
          } else if (firstCategory && typeof firstCategory === 'object' && 'id' in firstCategory && 'name' in firstCategory) {
            productCategory = firstCategory as Category;
          } else if (firstCategory && typeof firstCategory === 'object' && 'categoryId' in firstCategory) {
            const categoryId = (firstCategory as { categoryId?: string }).categoryId;
            if (categoryId) {
              const foundCategory = mappedCategories.find(c => c.id === categoryId);
              if (foundCategory) productCategory = foundCategory;
            }
          }
        }
        
        if (!productCategory && 'categoryId' in p) {
          const directCategoryId = (p as { categoryId?: string }).categoryId;
          if (directCategoryId) {
            const foundCategory = mappedCategories.find(c => c.id === directCategoryId);
            if (foundCategory) productCategory = foundCategory;
          }
        }
        
        return {
          id: p.id,
          name: p.name,
          nameAr: p.nameAr || '',
          description: p.description || '',
          descriptionAr: p.descriptionAr || '',
          price: typeof p.price === 'string' ? parseFloat(p.price) : (p.price || 0),
          compareAtPrice: p.compareAtPrice,
          cost: p.costPerItem,
          sku: p.sku || '',
          barcode: p.barcode,
          stock: p.variants?.[0]?.inventoryQuantity || 0,
          lowStockThreshold: p.lowStockThreshold || 10,
          images: p.images?.map((img) => typeof img === 'string' ? img : (img as any).url) || [],
          category: productCategory,
          status: p.isAvailable ? 'ACTIVE' : 'DRAFT',
          featured: p.featured || false,
          createdAt: p.createdAt || new Date().toISOString(),
          metaTitle: p.seoTitle || '',
          metaDescription: p.seoDescription || '',
          weight: p.weight || '',
          dimensions: p.dimensions || '',
          path: p.slug || ''
        };
      });
      
      setProducts(mappedProducts);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: t('dashboard.products.loadDataError'),
        description: t('dashboard.products.loadDataErrorDesc'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setWizardInitialData({});
    setWizardInitialImages([]);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    interface ExtendedProduct extends Product {
      categories?: Array<{ category?: { id: string }; id?: string }>;
      unit?: { id: string };
      productId?: string;
      productCode?: string;
      odooProductId?: string;
      brand?: { id: string };
      suppliers?: Array<{ 
        supplierId?: string; 
        supplier?: { id: string; name?: string; nameAr?: string; discountRate?: number };
        lastPrice?: number | string;
        discountRate?: number;
        isPrimary?: boolean;
      }>;
    }
    const extProduct = product as ExtendedProduct;
    const suppliersData = extProduct.suppliers?.map((s) => ({
      supplierId: s.supplierId || s.supplier?.id || '',
      price: s.lastPrice ? (typeof s.lastPrice === 'string' ? s.lastPrice : s.lastPrice.toString()) : '',
      discountRate: s.discountRate || s.supplier?.discountRate || 0,
      isPrimary: s.isPrimary || false,
    })).filter(s => s.supplierId) || [];
    
    setWizardInitialData({
      name: product.name,
      nameAr: product.nameAr,
      description: product.description,
      descriptionAr: product.descriptionAr,
      price: (product.price || 0).toString(),
      compareAtPrice: product.compareAtPrice?.toString() || '',
      cost: product.cost?.toString() || product.costPerItem?.toString() || '',
      sku: product.sku,
      barcode: product.barcode || '',
      stock: (product.stock || 0).toString(),
      lowStockThreshold: (product.lowStockThreshold || 0).toString(),
      categoryId: product.category?.id || '',
      categoryIds: extProduct.categories?.map((c) => c.category?.id || c.id || '').filter(Boolean) || (product.category?.id ? [product.category.id] : []),
      status: product.status,
      featured: product.featured,
      tags: '',
      metaTitle: product.metaTitle || '',
      metaDescription: product.metaDescription || '',
      weight: product.weight || '',
      dimensions: product.dimensions || '',
      unitId: extProduct.unit?.id || '',
      brandId: extProduct.brand?.id || (product as { brandId?: string }).brandId || '',
      productCode: extProduct.productCode || '',
      odooProductId: extProduct.odooProductId || '',
      path: ('slug' in extProduct ? (extProduct as { slug?: string }).slug : undefined) || product.path || '',
      supplierIds: suppliersData.length > 0 ? suppliersData.map(s => s.supplierId) : [],
      suppliers: suppliersData,
      minQuantity: product.min?.toString() || '',
      maxQuantity: product.max?.toString() || '',
      enableSlider: ('enableSlider' in product && typeof (product as { enableSlider?: boolean }).enableSlider === 'boolean') 
        ? (product as { enableSlider: boolean }).enableSlider 
        : false,
    });
    setWizardInitialImages(product.images || []);
    setIsAddDialogOpen(true);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-show error dialog when errors are set and import is complete
  useEffect(() => {
    if (importErrors.length > 0 && !isImporting) {
      console.log('🔄 useEffect: Checking error dialog state', {
        errorsCount: importErrors.length,
        isImporting,
        showImportErrorDialog
      });
      if (!showImportErrorDialog) {
        console.log('🔄 Auto-showing error dialog with', importErrors.length, 'errors');
        // Use setTimeout to ensure state updates are processed
        const timer = setTimeout(() => {
          setShowImportErrorDialog(true);
          console.log('✅ useEffect: Set error dialog to true');
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [importErrors.length, isImporting, showImportErrorDialog]);

  // Handle URL parameters for pre-filling form from Hierarchical Explorer
  useEffect(() => {
    const openAdd = searchParams.get('openAdd');
    const editId = searchParams.get('editId');
    const brandId = searchParams.get('brandId');
    const categoryIdsParam = searchParams.get('categoryIds');
    
    if (openAdd === 'true' && !loading) {
      // Pre-fill form data for new product
      const categoryIds = categoryIdsParam ? categoryIdsParam.split(',') : [];
      
      setWizardInitialData(prev => ({
        ...prev,
        brandId: brandId || '',
        categoryIds: categoryIds,
        categoryId: categoryIds.length > 0 ? categoryIds[categoryIds.length - 1] : '',
      }));
      
      // Reset editing state and open dialog
      setEditingProduct(null);
      setWizardInitialImages([]);
      setIsAddDialogOpen(true);
      
      // Clear URL params after processing
      setSearchParams({});
    }
    
    // Handle edit product from URL
    if (editId && !loading && products.length > 0) {
      const productToEdit = products.find(p => p.id === editId);
      if (productToEdit) {
        openEditDialog(productToEdit);
        // Clear URL params after processing
        setSearchParams({});
      }
    }
  }, [searchParams, loading, setSearchParams, products]);
  
  // Check if user has a market set up
  const hasMarket = !!(user?.tenantId && user.tenantId !== 'default' && user.tenantId !== 'system');
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, filterCategory, activeTab]);
  
  // Reload data when pagination changes
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage]);
  
  // Show market setup prompt if no market (must be after all hooks)
  if (!hasMarket) {
    return <MarketSetupPrompt />;
  }





  // Function to extract quantity from product name (e.g., "100 coin card" -> 100)
  const extractQuantityFromName = (name: string, unitCode: string, unitName: string, unitNameAr?: string): number | null => {
    if (!name || !unitCode) return null;
    
    const text = name.toLowerCase();
    const code = unitCode.toLowerCase();
    const unit = unitName.toLowerCase();
    const unitAr = unitNameAr?.toLowerCase() || '';
    
    // Try to find pattern: number + unit code/name (e.g., "100 coin", "100 COIN", "100 عملة")
    const patterns = [
      new RegExp(`(\\d+)\\s*${code}\\b`, 'i'), // "100 coin"
      new RegExp(`(\\d+)\\s*${unit}\\b`, 'i'), // "100 coin"
      unitAr ? new RegExp(`(\\d+)\\s*${unitAr}\\b`, 'i') : null, // "100 عملة"
    ].filter(Boolean) as RegExp[];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const quantity = parseInt(match[1], 10);
        if (!isNaN(quantity) && quantity > 0) {
          return quantity;
        }
      }
    }
    
    return null;
  };

  const handleSaveProduct = async (data: ProductFormData, images: string[]) => {
    try {
      // Validate required fields
      if (!data.name || data.name.trim() === '') {
        toast({
          title: t('dashboard.products.messages.requiredField'),
          description: t('dashboard.products.messages.nameRequired'),
          variant: 'destructive',
        });
        return;
      }

      if (!data.price || data.price.trim() === '') {
        toast({
          title: t('dashboard.products.messages.requiredField'),
          description: t('dashboard.products.messages.priceRequired'),
          variant: 'destructive',
        });
        return;
      }

      const productPrice = parseFloat(data.price);
      if (isNaN(productPrice) || productPrice < 0) {
        toast({
          title: t('dashboard.products.messages.priceError'),
          description: t('dashboard.products.messages.priceInvalid'),
          variant: 'destructive',
        });
        return;
      }

      // Validate price against unit cost if unit is selected
      if (data.unitId && data.price) {
        const selectedUnit = units.find(u => u.id === data.unitId);
        if (selectedUnit) {
          const unitCost = Number(selectedUnit.cost) || 0;
          
          // Try to extract quantity from product name
          const quantity = extractQuantityFromName(
            data.name || data.nameAr || '',
            selectedUnit.code,
            selectedUnit.name,
            selectedUnit.nameAr
          );
          
          if (quantity !== null && quantity > 0 && unitCost > 0) {
            const expectedMinPrice = quantity * unitCost;
            
            if (productPrice < expectedMinPrice) {
              toast({
                title: t('dashboard.products.messages.priceError'),
                description: t('dashboard.products.messages.priceTooLow', { 
                  minPrice: expectedMinPrice.toFixed(2), 
                  quantity, 
                  unit: selectedUnit.code, 
                  cost: unitCost.toFixed(2) 
                }),
                variant: 'destructive',
              });
              return; // Stop saving
            }
          }
        }
      }

      // Transform frontend form data to match backend DTO
      const categoryIds = data.categoryIds.length > 0 ? data.categoryIds : (data.categoryId ? [data.categoryId] : []);
      console.log('💾 Saving product with categoryIds:', categoryIds);
      console.log('💾 Form data categoryIds:', data.categoryIds);
      console.log('💾 Form data categoryId:', data.categoryId);
      
      const productData = {
        name: data.name,
        nameAr: data.nameAr || undefined,
        description: data.description || undefined,
        descriptionAr: data.descriptionAr || undefined,
        sku: data.sku || undefined,
        barcode: data.barcode || undefined,
        price: parseFloat(data.price),
        compareAtPrice: data.compareAtPrice ? parseFloat(data.compareAtPrice) : undefined,
        costPerItem: data.cost ? parseFloat(data.cost) : undefined,
        stockCount: data.stock ? parseInt(data.stock) : undefined,
        isAvailable: data.status === 'ACTIVE',
        isPublished: data.status === 'ACTIVE',
        seoTitle: data.metaTitle || undefined,
        seoDescription: data.metaDescription || undefined,
        categoryIds: categoryIds,
        images: images.map((url, index) => ({
          url,
          altText: data.name,
          sortOrder: index
        })),
        featured: !!data.featured,
        weight: data.weight ? parseFloat(data.weight) : undefined,
        dimensions: data.dimensions || undefined,
        unitId: data.unitId || undefined,
        brandId: data.brandId || undefined,
        productCode: data.productCode || undefined,
        odooProductId: data.odooProductId || undefined,
        min: data.minQuantity ? parseInt(data.minQuantity) : undefined,
        max: data.maxQuantity ? parseInt(data.maxQuantity) : undefined,
        enableSlider: !!data.enableSlider,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        variants: [{
          name: 'Default',
          sku: data.sku || undefined,
          price: parseFloat(data.price),
          compareAtPrice: data.compareAtPrice ? parseFloat(data.compareAtPrice) : undefined,
          inventoryQuantity: Math.max(parseInt(data.stock) || 0, 0),
        }]
      };

      console.log('💾 Sending productData to API:', JSON.stringify(productData, null, 2));
      
      let savedProduct;
      if (editingProduct) {
        savedProduct = await coreApi.updateProduct(editingProduct.id, productData);
        console.log('✅ Product updated:', savedProduct);
        console.log('✅ Updated product categories:', savedProduct.categories);
        toast({ title: t('common.success'), description: t('dashboard.products.editProduct') + ' ' + t('common.success') });
      } else {
        savedProduct = await coreApi.createProduct(productData);
        console.log('✅ Product created:', savedProduct);
        console.log('✅ Created product categories:', savedProduct.categories);
        toast({ title: t('common.success'), description: t('dashboard.products.addProduct') + ' ' + t('common.success') });
      }
      
      // Verify categories were saved
      if (savedProduct) {
        console.log('🔍 Verifying saved product:', {
          productId: savedProduct.id,
          productName: savedProduct.name,
          expectedCategoryIds: categoryIds,
          savedCategories: savedProduct.categories,
          categoriesCount: savedProduct.categories?.length || 0,
          isAvailable: savedProduct.isAvailable,
          isPublished: savedProduct.isPublished
        });
        
        if (categoryIds.length > 0) {
          if (!savedProduct.categories || savedProduct.categories.length === 0) {
            console.error('❌ ERROR: Product was saved but categories are missing!', {
              productId: savedProduct.id,
              expectedCategoryIds: categoryIds,
              savedCategories: savedProduct.categories
            });
            toast({
              title: t('dashboard.products.messages.categoriesWarning'),
              description: t('dashboard.products.messages.categoriesWarningDesc'),
              variant: 'destructive',
            });
          } else {
            console.log('✅ Categories verified:', savedProduct.categories.length, 'categories attached');
          }
        }
      }

      setIsAddDialogOpen(false);
      setEditingProduct(null);
      resetForm();
      
      // Reload data to show updated products
      await loadData();
      
      // Notify other components that products have been updated
      window.dispatchEvent(new CustomEvent('productsUpdated'));
      
      // Also trigger a custom event with product details for immediate update
      window.dispatchEvent(new CustomEvent('productSaved', { 
        detail: { product: savedProduct, categoryIds } 
      }));
    } catch (error) {
      console.error('Failed to save product:', error);
      toast({
        title: t('dashboard.products.messages.saveError'),
        description: t('dashboard.products.messages.saveErrorDesc'),
        variant: 'destructive',
      });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm(t('dashboard.products.delete') + '?')) return;

    try {
      await coreApi.deleteProduct(id);
      toast({ title: t('common.success'), description: t('dashboard.products.delete') + ' ' + t('common.success') });
      loadData();
      setSelectedProducts(new Set());
    } catch (error: unknown) {
      console.error('Failed to delete product:', error);
      const errorMessage = (error as { message?: string })?.message || t('dashboard.products.messages.deleteErrorDesc');
      const isNotFound = errorMessage.includes('not found') || errorMessage.includes('404');
      
      if (isNotFound) {
        toast({
          title: t('dashboard.products.messages.deleted'),
          description: t('dashboard.products.messages.notFound'),
        });
        loadData();
      } else {
        toast({
          title: t('dashboard.products.messages.deleteError'),
          description: errorMessage,
          variant: 'destructive',
        });
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) {
      toast({
        title: t('dashboard.products.messages.noSelection'),
        description: t('dashboard.products.messages.noSelectionDesc'),
        variant: 'destructive',
      });
      return;
    }

    const count = selectedProducts.size;
    if (!confirm(t('dashboard.products.messages.confirmDelete', { count }))) return;

    try {
      setIsDeleting(true);
      const allIds = Array.from(selectedProducts);
      
      // Batch delete in chunks of 100 to avoid payload limits and timeouts
      const CHUNK_SIZE = 100;
      let deletedCount = 0;
      let failedCount = 0;
      
      for (let i = 0; i < allIds.length; i += CHUNK_SIZE) {
        const chunk = allIds.slice(i, i + CHUNK_SIZE);
        try {
          const result = await coreApi.deleteProducts(chunk);
          deletedCount += result.deleted || chunk.length;
          failedCount += result.failed || 0;
        } catch (error) {
          console.error(`Failed to delete chunk ${i/CHUNK_SIZE + 1}:`, error);
          failedCount += chunk.length;
        }
      }
      
      // Handle partial failures gracefully
      if (failedCount > 0) {
        toast({
          title: t('dashboard.products.messages.categoriesWarning'),
          description: t('dashboard.products.messages.deletePartial', { deleted: deletedCount, total: count, failed: failedCount }),
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('common.success'),
          description: t('dashboard.products.messages.deleteSuccess', { count }),
        });
      }
      
      setSelectedProducts(new Set());
      loadData();
    } catch (error: unknown) {
      console.error('Failed to delete products:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || t('dashboard.products.messages.deleteErrorDesc');
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectProduct = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedProducts);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedProducts(newSelected);
  };


  const getStatusBadge = (status: string) => {
    const config = {
      ACTIVE: { label: t('dashboard.products.statusBadges.active'), className: 'bg-green-500/10 text-green-700 border-green-500/20' },
      DRAFT: { label: t('dashboard.products.statusBadges.draft'), className: 'bg-gray-500/10 text-gray-700 border-gray-500/20' },
      ARCHIVED: { label: t('dashboard.products.statusBadges.archived'), className: 'bg-red-500/10 text-red-700 border-red-500/20' },
    };
    const { label, className } = config[status as keyof typeof config] || config.DRAFT;
    return <Badge variant="outline" className={className}>{label}</Badge>;
  };

  const getStockBadge = (stock: number, threshold: number) => {
    if (stock === 0) {
      return <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-500/20">{t('dashboard.products.depleted')}</Badge>;
    }
    if (stock <= threshold) {
      return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">{t('dashboard.products.statusBadges.low')}</Badge>;
    }
    return <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">{t('dashboard.products.statusBadges.available')}</Badge>;
  };

  // Client-side filtering (search, status, category) - applied after backend pagination
  // Note: For better performance, these filters should be moved to backend
  const filteredProducts = products.filter(product => {
    const matchesSearch = (product.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (product.nameAr || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (product.sku || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || product.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || product.category?.id === filterCategory;
    
    let matchesTab = true;
    if (activeTab === 'low-stock') {
      matchesTab = product.stock <= product.lowStockThreshold && product.stock > 0;
    } else if (activeTab === 'out-of-stock') {
      matchesTab = product.stock === 0;
    }

    return matchesSearch && matchesStatus && matchesCategory && matchesTab;
  });

  // Pagination calculations
  // Use filtered products directly (backend handles pagination)
  // Note: Client-side filtering is applied after backend pagination
  // For better performance, move filters to backend query params
  const displayProducts = filteredProducts;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(new Set(displayProducts.map(p => p.id)));
    } else {
      setSelectedProducts(new Set());
    }
  };

  const handleSelectAllProducts = async () => {
    try {
      // Fetch all products with a very large limit to get all IDs
      const allProductsResponse = await coreApi.getProducts({ limit: 10000 });
      const allProducts = Array.isArray(allProductsResponse) 
        ? allProductsResponse 
        : (allProductsResponse as unknown as { data: Array<{ id: string }> })?.data || [];
      const allProductIds = allProducts.map((p: { id: string }) => p.id);
      setSelectedProducts(new Set(allProductIds));
      toast({
        title: t('dashboard.products.messages.selectAllSuccess', { count: allProductIds.length }),
        description: t('dashboard.products.messages.selectAllSuccess', { count: allProductIds.length }),
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t('dashboard.products.messages.selectAllError');
      console.error('Failed to select all products:', error);
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const isAllSelected = displayProducts.length > 0 && displayProducts.every(p => selectedProducts.has(p.id));
  const isSomeSelected = selectedProducts.size > 0 && selectedProducts.size < displayProducts.length;

  // Export products to Excel with all order-related fields
  const handleExportProducts = async () => {
    try {
      const headers = [
        'product_id',
        'sku',
        'price',
        'cost',
        'coins_number',
        'notify',
        'min',
        'max',
        'web_status',
        'mobile_status',
        'purple_cards_product_name_ar',
        'purple_cards_product_name_en',
        'purple_cards_slug_ar',
        'purple_cards_slug_en',
        'purple_cards_desc_ar',
        'purple_cards_desc_en',
        'purple_cards_long_desc_ar',
        'purple_cards_long_desc_en',
        'purple_cards_meta_title_ar',
        'purple_cards_meta_title_en',
        'purple_cards_meta_keyword_ar',
        'purple_cards_meta_keyword_en',
        'purple_cards_meta_description_ar',
        'purple_cards_meta_description_en',
        'ish7en_product_name_ar',
        'ish7en_product_name_en',
        'ish7en_slug_ar',
        'ish7en_slug_en',
        'ish7en_desc_ar',
        'ish7en_desc_en',
        'ish7en_long_desc_ar',
        'ish7en_long_desc_en',
        'ish7en_meta_title_ar',
        'ish7en_meta_title_en',
        'ish7en_meta_keyword_ar',
        'ish7en_meta_keyword_en',
        'ish7en_meta_description_ar',
        'ish7en_meta_description_en'
      ];
      
      const exportData = products.map((p: Product) => ({
        product_id: p.productId || p.id || '',
        sku: p.sku || '',
        price: p.price || 0,
        cost: p.costPerItem || p.cost || 0,
        coins_number: p.coinsNumber || '',
        notify: p.notify ? 'true' : 'false',
        min: p.min || '',
        max: p.max || '',
        web_status: p.webStatus !== false ? 'true' : 'false',
        mobile_status: p.mobileStatus !== false ? 'true' : 'false',
        purple_cards_product_name_ar: p.purpleCardsProductNameAr || '',
        purple_cards_product_name_en: p.purpleCardsProductNameEn || '',
        purple_cards_slug_ar: p.purpleCardsSlugAr || '',
        purple_cards_slug_en: p.purpleCardsSlugEn || '',
        purple_cards_desc_ar: p.purpleCardsDescAr || '',
        purple_cards_desc_en: p.purpleCardsDescEn || '',
        purple_cards_long_desc_ar: p.purpleCardsLongDescAr || '',
        purple_cards_long_desc_en: p.purpleCardsLongDescEn || '',
        purple_cards_meta_title_ar: p.purpleCardsMetaTitleAr || '',
        purple_cards_meta_title_en: p.purpleCardsMetaTitleEn || '',
        purple_cards_meta_keyword_ar: p.purpleCardsMetaKeywordAr || '',
        purple_cards_meta_keyword_en: p.purpleCardsMetaKeywordEn || '',
        purple_cards_meta_description_ar: p.purpleCardsMetaDescriptionAr || '',
        purple_cards_meta_description_en: p.purpleCardsMetaDescriptionEn || '',
        ish7en_product_name_ar: p.ish7enProductNameAr || '',
        ish7en_product_name_en: p.ish7enProductNameEn || '',
        ish7en_slug_ar: p.ish7enSlugAr || '',
        ish7en_slug_en: p.ish7enSlugEn || '',
        ish7en_desc_ar: p.ish7enDescAr || '',
        ish7en_desc_en: p.ish7enDescEn || '',
        ish7en_long_desc_ar: p.ish7enLongDescAr || '',
        ish7en_long_desc_en: p.ish7enLongDescEn || '',
        ish7en_meta_title_ar: p.ish7enMetaTitleAr || '',
        ish7en_meta_title_en: p.ish7enMetaTitleEn || '',
        ish7en_meta_keyword_ar: p.ish7enMetaKeywordAr || '',
        ish7en_meta_keyword_en: p.ish7enMetaKeywordEn || '',
        ish7en_meta_description_ar: p.ish7enMetaDescriptionAr || '',
        ish7en_meta_description_en: p.ish7enMetaDescriptionEn || ''
      }));

      const ws = utils.json_to_sheet(exportData, { header: headers });
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Products");
      writeFile(wb, "products_export.xlsx");
      
      toast({
        title: t('common.success'),
        description: t('dashboard.products.exportSuccess'),
      });
    } catch (error) {
      console.error('Failed to export products:', error);
      toast({
        title: t('common.error'),
        description: t('dashboard.products.messages.exportErrorDesc'),
        variant: 'destructive',
      });
    }
  };

  // Import products from Excel
  const handleImportProducts = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Try to refresh token first before checking authentication
    try {
      const { ensureFreshToken } = await import('@/services/core/api-client');
      const tokenRefreshed = await ensureFreshToken();
      if (!tokenRefreshed) {
        // Token refresh failed - check if we have any token at all
        const accessToken = localStorage.getItem('accessToken') || document.cookie.split('; ').find(row => row.startsWith('accessToken='))?.split('=')[1];
        if (!accessToken) {
          toast({
            title: t('common.unauthorized'),
            description: t('common.pleaseLogin'),
            variant: 'destructive',
          });
          // Don't auto-redirect - let user decide
          return;
        }
      }
    } catch (tokenError) {
      console.warn('⚠️ Token refresh check failed:', tokenError);
      // Continue anyway - might still work with existing token
    }

    // Check if user has a valid tenant/market
    if (!user?.tenantId || user.tenantId === 'default' || user.tenantId === 'system') {
      toast({
        title: t('dashboard.products.messages.settingsError'),
        description: t('dashboard.products.messages.settingsErrorDesc'),
        variant: 'destructive',
      });
      return;
    }

    try {
      // Set importing state first to show dialog immediately
      setIsImporting(true);
      // Clear any previous errors
      setImportErrors([]);
      setShowImportErrorDialog(false);
      // Set initial progress to show loading animation
      setImportProgress({ current: 0, total: 100, currentItem: t('common.refreshingSession') });
      
      // Refresh token before starting import to prevent session expiry during upload
      try {
        const { ensureFreshToken } = await import('@/services/core/api-client');
        const tokenRefreshed = await ensureFreshToken();
        if (!tokenRefreshed) {
          console.warn('⚠️ Token refresh failed or not available, proceeding anyway...');
        } else {
          console.log('✅ Token refreshed before import');
        }
      } catch (tokenError) {
        console.warn('⚠️ Token refresh check failed:', tokenError);
        // Continue anyway - might still work with existing token
      }
      
      // Set progress to reading file
      setImportProgress({ current: 0, total: 100, currentItem: t('dashboard.products.messages.readingFile') });
      
      // Force a re-render to ensure dialog is visible
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const data = await file.arrayBuffer();
      setImportProgress({ current: 10, total: 100, currentItem: t('dashboard.products.messages.analyzingData') });
      
      const workbook = read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      setImportProgress({ current: 20, total: 100, currentItem: t('dashboard.products.messages.processingData') });
      
      // Read ALL rows from Excel - ensure no limit is applied
      const jsonData = utils.sheet_to_json<{
        product_id?: string;
        product_isku?: string; // Support for product_isku column name
        sku?: string;
        price: number | string;
        cost?: number | string;
        coins_number?: number | string;
        coins_nun?: number | string; // Support for coins_nun (typo in Excel)
        notify?: string | boolean;
        min?: number | string;
        max?: number | string;
        web_status?: string | boolean;
        web_statu?: string | boolean; // Support for web_statu (truncated)
        mobile_status?: string | boolean;
        mobile_st?: string | boolean; // Support for mobile_st (truncated)
        purple_cards_product_name_ar?: string;
        purple_cards_product_name_en?: string;
        purple_cards_slug_ar?: string;
        purple_cards_slug_en?: string;
        purple_cards_desc_ar?: string;
        purple_cards_desc_en?: string;
        purple_cards_long_desc_ar?: string;
        purple_cards_long_desc_en?: string;
        purple_cards_meta_title_ar?: string;
        purple_cards_meta_title_en?: string;
        purple_cards_meta_keyword_ar?: string;
        purple_cards_meta_keyword_en?: string;
        purple_cards_meta_description_ar?: string;
        purple_cards_meta_description_en?: string;
        ish7en_product_name_ar?: string;
        ish7en_product_name_en?: string;
        ish7en_slug_ar?: string;
        ish7en_slug_en?: string;
        ish7en_desc_ar?: string;
        ish7en_desc_en?: string;
        ish7en_long_desc_ar?: string;
        ish7en_long_desc_en?: string;
        ish7en_meta_title_ar?: string;
        ish7en_meta_title_en?: string;
        ish7en_meta_keyword_ar?: string;
        ish7en_meta_keyword_en?: string;
        ish7en_meta_description_ar?: string;
        ish7en_meta_description_en?: string;
        // Legacy fields (for backward compatibility)
        SKU?: string;
        Name?: string;
        NameAr?: string;
        Description?: string;
        DescriptionAr?: string;
        Price?: number | string;
        CompareAtPrice?: number | string;
        Stock?: number | string;
        Category?: string;
        Brand?: string;
        BrandCode?: string;
        Status?: string;
        Featured?: string;
        Barcode?: string;
        Weight?: string;
        Dimensions?: string;
        Tags?: string;
      }>(worksheet, { defval: '' });

      const totalItems = jsonData.length;
      
      // Log total items for debugging
      console.log(`📊 Total items to import: ${totalItems}`);
      console.log(`📋 Excel file contains ${jsonData.length} rows (excluding header)`);
      
      // Log all column names from first row to help debug column mapping
      if (totalItems > 0) {
        const firstRow = jsonData[0];
        const columnNames = Object.keys(firstRow);
        console.log('📋 Excel column names detected:', columnNames);
        console.log('📋 First row data sample:', JSON.stringify(firstRow, null, 2));
        
        // Alert user about detected columns
        console.log('🔍 Column mapping check:');
        console.log('  - Name columns:', columnNames.filter(c => c.toLowerCase().includes('name') || c.includes('اسم') || c.includes('الاسم')));
        console.log('  - Price columns:', columnNames.filter(c => c.toLowerCase().includes('price') || c.toLowerCase().includes('cost') || c.includes('سعر') || c.includes('السعر')));
        console.log('  - SKU columns:', columnNames.filter(c => c.toLowerCase().includes('sku') || c.toLowerCase().includes('product_id') || c.toLowerCase().includes('isku')));
        console.log('  - Category columns:', columnNames.filter(c => c.toLowerCase().includes('category') || c.includes('فئة') || c.includes('الفئة') || c.includes('تصنيف')));
      }
      
      if (totalItems === 0) {
        setIsImporting(false);
        toast({
          title: t('common.error'),
          description: t('dashboard.products.messages.noDataError'),
          variant: 'destructive',
        });
        e.target.value = '';
        return;
      }
      
      // ============================================
      // PHASE 1: SCAN AND VALIDATE ALL ROWS FIRST
      // ============================================
      console.log('📋 PHASE 1: Scanning and validating all rows...');
      console.log('📋 Total rows to validate:', totalItems);
      console.log('📋 Categories available:', categories.length, categories.map(c => c.name).slice(0, 5));
      console.log('📋 Brands available:', brands.length);
      setImportProgress({ current: 0, total: totalItems, currentItem: t('dashboard.products.messages.validatingRows', { count: totalItems }) });
      
      // Yield to UI every 100 rows to prevent blocking
      const yieldToUI = () => new Promise(resolve => setTimeout(resolve, 0));
      
      const validationErrors: Array<{ row: number; column: string; productName: string; error: string }> = [];
      interface ExcelRow {
        product_id?: string | number;
        product_isku?: string | number; // Support for product_isku column name
        sku?: string;
        SKU?: string;
        price?: number | string;
        Price?: number | string;
        cost?: number | string;
        coins_number?: number | string;
        coins_nun?: number | string; // Support for coins_nun (typo in Excel)
        notify?: string | boolean;
        min?: number | string;
        max?: number | string;
        web_status?: string | boolean;
        web_statu?: number | string | boolean; // Support for web_statu (truncated, may contain price)
        mobile_status?: string | boolean;
        mobile_st?: number | string | boolean; // Support for mobile_st (truncated, may contain price)
        purple_cards_product_name_ar?: string;
        purple_cards_product_name_en?: string;
        purple_cards_slug_ar?: string;
        purple_cards_slug_en?: string;
        purple_cards_desc_ar?: string;
        purple_cards_desc_en?: string;
        purple_cards_long_desc_ar?: string;
        purple_cards_long_desc_en?: string;
        purple_cards_meta_title_ar?: string;
        purple_cards_meta_title_en?: string;
        purple_cards_meta_keyword_ar?: string;
        purple_cards_meta_keyword_en?: string;
        purple_cards_meta_description_ar?: string;
        purple_cards_meta_description_en?: string;
        ish7en_product_name_ar?: string;
        ish7en_product_name_en?: string;
        ish7en_slug_ar?: string;
        ish7en_slug_en?: string;
        ish7en_desc_ar?: string;
        ish7en_desc_en?: string;
        ish7en_long_desc_ar?: string;
        ish7en_long_desc_en?: string;
        ish7en_meta_title_ar?: string;
        ish7en_meta_title_en?: string;
        ish7en_meta_keyword_ar?: string;
        ish7en_meta_keyword_en?: string;
        ish7en_meta_description_ar?: string;
        ish7en_meta_description_en?: string;
        Name?: string;
        NameAr?: string;
        Description?: string;
        DescriptionAr?: string;
        CompareAtPrice?: number | string;
        Stock?: number | string;
        Category?: string;
        Brand?: string;
        BrandCode?: string;
        Status?: string;
        Featured?: string;
        Barcode?: string;
        Weight?: string | number;
        Dimensions?: string;
        Tags?: string;
      }
      const validRows: Array<{ index: number; row: ExcelRow; productData: unknown }> = [];
      
      // Scan and validate all rows first
      for (let i = 0; i < totalItems; i++) {
        // Check if import was stopped
        if (importAbortRef.current) {
          console.log('🛑 Import stopped by user during validation');
          break;
        }
        
        const row = jsonData[i];
        const rowNum = i + 2; // Excel row number (1-indexed + header)
        
        // Update scan progress and yield to UI every 100 rows
        if (i % 100 === 0) {
        setImportProgress({ 
          current: i + 1, 
          total: totalItems, 
          currentItem: t('dashboard.products.messages.validatingRow', { current: i + 1, total: totalItems })
        });
          await yieldToUI();
          console.log(`📋 Validating row ${i + 1}/${totalItems}...`);
        }
        
        // Validate row
        // Support multiple column name variations - get raw row with any key type
        const rawRow = row as Record<string, unknown>;
        const rowKeys = Object.keys(rawRow);
        
        // Helper function to find value by multiple possible column names (case-insensitive)
        const getColumnValue = (keys: string[]): string => {
          for (const key of keys) {
            // Direct match
            if (rawRow[key] !== undefined && rawRow[key] !== null && rawRow[key] !== '') {
              return String(rawRow[key]).trim();
            }
            // Case-insensitive match
            const foundKey = rowKeys.find(k => k.toLowerCase() === key.toLowerCase());
            if (foundKey && rawRow[foundKey] !== undefined && rawRow[foundKey] !== null && rawRow[foundKey] !== '') {
              return String(rawRow[foundKey]).trim();
            }
          }
          // Search for partial matches (contains key name)
          for (const key of keys) {
            const foundKey = rowKeys.find(k => k.toLowerCase().includes(key.toLowerCase()));
            if (foundKey && rawRow[foundKey] !== undefined && rawRow[foundKey] !== null && rawRow[foundKey] !== '') {
              return String(rawRow[foundKey]).trim();
            }
          }
          return '';
        };
        
        // Support multiple column name variations
        const productId = getColumnValue(['product_id', 'product_isku', 'productid', 'id', 'رقم_المنتج', 'معرف']);
        const sku = getColumnValue(['sku', 'SKU', 'product_isku', 'رمز', 'كود']);
        
        // Try to get name from many possible column names including Arabic
        let name = getColumnValue([
          'Name', 'name', 'ProductName', 'product_name', 'title', 'Title',
          'الاسم', 'اسم', 'اسم_المنتج', 'اسم المنتج', 'العنوان',
          'purple_cards_product_name_ar', 'purple_cards_product_name_en',
          'ish7en_product_name_ar', 'ish7en_product_name_en',
          'NameAr', 'nameAr'
        ]);
        
        // If name is empty but min column has text (likely product name in wrong column), use it
        if (!name && row.min && typeof row.min === 'string' && row.min.trim().length > 0 && isNaN(Number(row.min))) {
          name = row.min.toString().trim();
        }
        
        // If still no name, check for any column that might be a product name (contains text)
        if (!name) {
          for (const key of rowKeys) {
            const val = rawRow[key];
            if (typeof val === 'string' && val.trim().length > 3 && val.trim().length < 200 && isNaN(Number(val))) {
              // Looks like a product name
              name = val.trim();
              console.log(`📋 Row ${rowNum}: Using column "${key}" as name: ${name.substring(0, 50)}`);
              break;
            }
          }
        }
        
        const productName = name || productId || sku || `${t('dashboard.products.messages.row')} ${rowNum}`;
        // Try price from multiple possible columns (price, Price, Arabic names, or from status columns if they contain numbers)
        const priceColumnValue = getColumnValue([
          'price', 'Price', 'PRICE', 'سعر', 'السعر', 'السعر_بالريال', 
          'sale_price', 'SalePrice', 'retail_price', 'unit_price'
        ]);
        let priceStr: string | number | undefined = priceColumnValue;
        
        // If price is empty, check if web_statu or mobile_st contain price values
        if (!priceStr || priceStr === '' || priceStr.trim() === '') {
          const webStatuValue = getColumnValue(['web_statu', 'web_status', 'webstatus']);
          const mobileStValue = getColumnValue(['mobile_st', 'mobile_status', 'mobilestatus']);
          if (webStatuValue && !isNaN(Number(webStatuValue)) && Number(webStatuValue) > 0) {
            priceStr = webStatuValue;
          } else if (mobileStValue && !isNaN(Number(mobileStValue)) && Number(mobileStValue) > 0) {
            priceStr = mobileStValue;
          }
          // Also check cost column as fallback
          const costValue = getColumnValue(['cost', 'Cost', 'COST', 'التكلفة', 'تكلفة']);
          if ((!priceStr || priceStr === '') && costValue && !isNaN(Number(costValue)) && Number(costValue) > 0) {
            priceStr = costValue;
          }
        }
        
        // If still no price, look for any numeric column that could be a price
        if (!priceStr || priceStr === '') {
          for (const key of rowKeys) {
            const val = rawRow[key];
            if (val !== undefined && val !== null && val !== '') {
              const numVal = Number(val);
              if (!isNaN(numVal) && numVal > 0 && numVal < 1000000) {
                // Found a numeric value that could be a price
                priceStr = String(val);
                console.log(`📋 Row ${rowNum}: Using column "${key}" as price: ${priceStr}`);
                break;
              }
            }
          }
        }
        
        let hasError = false;
        let errorColumn = 'General';
        let errorMessage = '';
        
        // Validate required fields
        if (!name && !productId && !sku) {
          hasError = true;
          errorColumn = 'General';
          errorMessage = t('dashboard.products.messages.nameRequiredImport');
        } else if (!priceStr || priceStr === '' || (typeof priceStr === 'string' && priceStr.trim() === '')) {
          hasError = true;
          errorColumn = 'Price';
          errorMessage = 'السعر مطلوب - لم يتم العثور على سعر صالح في أعمدة price أو Price أو web_statu أو mobile_st أو cost';
        } else {
          // Validate price format
          const price = typeof priceStr === 'string' ? parseFloat(priceStr.toString().replace(/[^\d.-]/g, '')) : priceStr;
          if (isNaN(price) || price < 0) {
            hasError = true;
            errorColumn = 'Price';
            errorMessage = t('dashboard.products.messages.priceInvalidImport');
          }
        }
        
        // Validate category if provided (support multiple categories and paths)
        if (!hasError && row.Category && typeof row.Category === 'string') {
          const categoryInputs = row.Category.split(',').map(c => c.trim()).filter(Boolean);
          const missingCategories: string[] = [];
          
          for (const categoryInput of categoryInputs) {
            let found = false;
            
            // Check if it's a path (contains '>')
            if (categoryInput.includes('>')) {
              const pathParts = categoryInput.split(/\s*>\s*/).map(p => p.trim()).filter(Boolean);
              const categoryName = pathParts[pathParts.length - 1];
          const category = categories.find(c => 
                c.name?.toLowerCase() === categoryName.toLowerCase() ||
                c.nameAr?.toLowerCase() === categoryName.toLowerCase()
          );
              found = !!category;
            } else {
              // Direct category name
              const category = categories.find(c => 
                c.name?.toLowerCase() === categoryInput.toLowerCase() ||
                c.nameAr?.toLowerCase() === categoryInput.toLowerCase()
              );
              found = !!category;
            }
            
            if (!found) {
              missingCategories.push(categoryInput);
            }
          }
          
          if (missingCategories.length > 0) {
            hasError = true;
            errorColumn = 'Category';
            errorMessage = t('dashboard.products.messages.categoryNotFound', { category: missingCategories.join(', ') });
          }
        }

        // Validate brand if provided
        if (!hasError && (row.Brand || row.BrandCode)) {
          const brand = brands.find(b => 
            b.name?.toLowerCase() === row.Brand?.toLowerCase() ||
            b.nameAr?.toLowerCase() === row.Brand?.toLowerCase() ||
            b.code?.toLowerCase() === row.BrandCode?.toLowerCase()
          );
          if (!brand && (row.Brand?.trim() || row.BrandCode?.trim())) {
            hasError = true;
            errorColumn = row.Brand ? 'Brand' : 'BrandCode';
            errorMessage = t('dashboard.products.messages.brandNotFound', { brand: row.Brand || row.BrandCode });
          }
        }
        
        if (hasError) {
          validationErrors.push({ row: rowNum, column: errorColumn, productName: productName.toString(), error: errorMessage });
        } else {
          // Row is valid, prepare product data for upload
          // We'll build the full productData in the upload phase
          validRows.push({ index: i, row, productData: null }); // productData will be built during upload
        }
      }
      
      console.log(`✅ PHASE 1 COMPLETE: ${validRows.length} valid rows, ${validationErrors.length} invalid rows`);
      
      // If all rows failed validation, show errors immediately
      if (validRows.length === 0 && validationErrors.length > 0) {
        console.error('❌ ALL rows failed validation! First 5 errors:', validationErrors.slice(0, 5));
        setImportErrors(validationErrors);
        setIsImporting(false);
        setShowImportErrorDialog(true);
        e.target.value = '';
        return;
      }
      
      // ============================================
      // PHASE 2: UPLOAD VALID ROWS WITH BATCHING
      // ============================================
      let successCount = 0;
      const uploadErrors: Array<{ row: number; column: string; productName: string; error: string }> = [];
      // Reset abort flag at start of import
      importAbortRef.current = false;
      
      if (validRows.length > 0) {
        console.log(`🔄 PHASE 2: Starting upload of ${validRows.length} valid rows...`);
        console.log(`🔄 Batch size: 10, Total batches: ${Math.ceil(validRows.length / 10)}`);
        setImportProgress({ current: 0, total: validRows.length, currentItem: t('dashboard.products.messages.uploadingValid', { count: validRows.length }) });
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Process in batches with rate limiting to avoid throttling
        const BATCH_SIZE = 10; // Process 10 products concurrently to avoid rate limits
        let totalBatches = Math.ceil(validRows.length / BATCH_SIZE);
        let currentBatch = 0;
        
        for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
          currentBatch++;
          console.log(`🔄 Starting batch ${currentBatch}/${totalBatches} (rows ${i + 1} to ${Math.min(i + BATCH_SIZE, validRows.length)})`);
          
          if (importAbortRef.current) {
            console.log('🛑 Import stopped by user');
            break;
          }
          
          const batch = validRows.slice(i, i + BATCH_SIZE);
          
          // Process batch with individual error handling and rate limiting
          // Add small delay between each request in batch to avoid throttling
          const batchResults = await Promise.allSettled(batch.map(async (item, batchIndex) => {
            // Stagger requests within batch to avoid hitting rate limits
            if (batchIndex > 0) {
              await new Promise(resolve => setTimeout(resolve, 100 * batchIndex)); // 100ms delay between each request
            }
            const { index, row } = item;
            const rowNum = index + 2;
            
            if (importAbortRef.current) {
              console.log('🛑 Import stopped by user - skipping item');
              return;
            }
            
            // Support multiple column name variations - use same flexible detection as validation phase
            const rawRow = row as Record<string, unknown>;
            const rowKeys = Object.keys(rawRow);
            
            // Helper function to find value by multiple possible column names (case-insensitive)
            const getColumnValue = (keys: string[]): string => {
              for (const key of keys) {
                // Direct match
                if (rawRow[key] !== undefined && rawRow[key] !== null && rawRow[key] !== '') {
                  return String(rawRow[key]).trim();
                }
                // Case-insensitive match
                const foundKey = rowKeys.find(k => k.toLowerCase() === key.toLowerCase());
                if (foundKey && rawRow[foundKey] !== undefined && rawRow[foundKey] !== null && rawRow[foundKey] !== '') {
                  return String(rawRow[foundKey]).trim();
                }
              }
              // Search for partial matches (contains key name)
              for (const key of keys) {
                const foundKey = rowKeys.find(k => k.toLowerCase().includes(key.toLowerCase()));
                if (foundKey && rawRow[foundKey] !== undefined && rawRow[foundKey] !== null && rawRow[foundKey] !== '') {
                  return String(rawRow[foundKey]).trim();
                }
              }
              return '';
            };
            
            const productId = getColumnValue(['product_id', 'product_isku', 'productid', 'id', 'رقم_المنتج', 'معرف']);
            const sku = getColumnValue(['sku', 'SKU', 'product_isku', 'رمز', 'كود']);
            
            // Try to get name from many possible column names including Arabic
            let name = getColumnValue([
              'Name', 'name', 'ProductName', 'product_name', 'title', 'Title',
              'الاسم', 'اسم', 'اسم_المنتج', 'اسم المنتج', 'العنوان',
              'purple_cards_product_name_ar', 'purple_cards_product_name_en',
              'ish7en_product_name_ar', 'ish7en_product_name_en',
              'NameAr', 'nameAr'
            ]);
            
            // If name is empty but min column has text, use it
            if (!name && row.min && typeof row.min === 'string' && row.min.trim().length > 0 && isNaN(Number(row.min))) {
              name = row.min.toString().trim();
            }
            
            // If still no name, check for any column that might be a product name
            if (!name) {
              for (const key of rowKeys) {
                const val = rawRow[key];
                if (typeof val === 'string' && val.trim().length > 3 && val.trim().length < 200 && isNaN(Number(val))) {
                  name = val.trim();
                  break;
                }
              }
            }
            
            const productName = name || productId || sku || `الصف ${rowNum}`;
            
            // Build product data - try price from multiple possible columns
            const priceColumnValue = getColumnValue([
              'price', 'Price', 'PRICE', 'سعر', 'السعر', 'السعر_بالريال', 
              'sale_price', 'SalePrice', 'retail_price', 'unit_price'
            ]);
            let priceStr: string | number | undefined = priceColumnValue;
            
            // If price is empty, check status columns and cost
            if (!priceStr || priceStr === '') {
              const webStatuValue = getColumnValue(['web_statu', 'web_status', 'webstatus']);
              const mobileStValue = getColumnValue(['mobile_st', 'mobile_status', 'mobilestatus']);
              if (webStatuValue && !isNaN(Number(webStatuValue)) && Number(webStatuValue) > 0) {
                priceStr = webStatuValue;
              } else if (mobileStValue && !isNaN(Number(mobileStValue)) && Number(mobileStValue) > 0) {
                priceStr = mobileStValue;
              }
              const costValue = getColumnValue(['cost', 'Cost', 'COST', 'التكلفة', 'تكلفة']);
              if ((!priceStr || priceStr === '') && costValue && !isNaN(Number(costValue)) && Number(costValue) > 0) {
                priceStr = costValue;
              }
            }
            
            // If still no price, look for any numeric column
            if (!priceStr || priceStr === '') {
              for (const key of rowKeys) {
                const val = rawRow[key];
                if (val !== undefined && val !== null && val !== '') {
                  const numVal = Number(val);
                  if (!isNaN(numVal) && numVal > 0 && numVal < 1000000) {
                    priceStr = String(val);
                    break;
                  }
                }
              }
            }
            
            // Validate that we have a valid price before proceeding
            if (!priceStr || priceStr === '') {
              throw new Error('السعر مطلوب - لم يتم العثور على سعر صالح');
            }
            
            const costStr = getColumnValue(['cost', 'Cost', 'التكلفة']);
            const coinsNumberStr = getColumnValue(['coins_number', 'coins_nun', 'عدد_العملات']);
            const notifyStr = getColumnValue(['notify', 'Notify', 'إشعار']);
            const minStr = getColumnValue(['min', 'Min', 'الحد_الأدنى']);
            const maxStr = getColumnValue(['max', 'Max', 'الحد_الأقصى']);
            const webStatusStr = getColumnValue(['web_status', 'web_statu', 'WebStatus']);
            const mobileStatusStr = getColumnValue(['mobile_status', 'mobile_st', 'MobileStatus']);

            try {
              // Parse and validate price - must be a valid number > 0
              let price: number;
              if (typeof priceStr === 'string') {
                price = parseFloat(priceStr.toString().replace(/[^\d.-]/g, ''));
              } else if (typeof priceStr === 'number') {
                price = priceStr;
              } else {
                price = 0;
              }
              
              // Validate price is a valid number
              if (isNaN(price) || price < 0) {
                throw new Error(`Invalid price: ${priceStr}. Price must be a valid number >= 0.`);
              }

              const cost = costStr 
                ? parseFloat(costStr.toString().replace(/[^\d.-]/g, ''))
                : undefined;

              const coinsNumber = coinsNumberStr 
                ? parseFloat(coinsNumberStr.toString().replace(/[^\d.-]/g, '')) || undefined
                : undefined;

              const notify = notifyStr 
                ? (notifyStr.toLowerCase() === 'true' || notifyStr === '1')
                : undefined;

              const min = minStr 
                ? parseInt(minStr.toString().replace(/[^\d]/g, '')) || undefined
                : undefined;

              const max = maxStr 
                ? parseInt(maxStr.toString().replace(/[^\d]/g, '')) || undefined
                : undefined;

              const webStatus = webStatusStr 
                ? (webStatusStr.toLowerCase() === 'true' || webStatusStr === '1')
                : undefined;

              const mobileStatus = mobileStatusStr 
                ? (mobileStatusStr.toLowerCase() === 'true' || mobileStatusStr === '1')
                : undefined;

              const compareAtPriceStr = getColumnValue(['CompareAtPrice', 'compare_at_price', 'السعر_المقارن']);
              const compareAtPrice = compareAtPriceStr 
                ? parseFloat(compareAtPriceStr.replace(/[^\d.-]/g, ''))
                : undefined;

              const stockStr = getColumnValue(['Stock', 'stock', 'المخزون', 'الكمية', 'quantity']);
              const stock = stockStr 
                ? parseInt(stockStr.replace(/[^\d]/g, '')) || 0
                : 0;

              const tagsStr = getColumnValue(['Tags', 'tags', 'الوسوم', 'العلامات']);
              const tags = tagsStr ? tagsStr.split(',').map((t: string) => t.trim()).filter(Boolean) : [];

              const productSku = sku || undefined;

              // Create variant data with validated price
              const variantData: { name: string; price: number; inventoryQuantity: number; sku?: string; compareAtPrice?: number } = {
                name: 'Default',
                price: price, // Use validated price
                inventoryQuantity: Number(stock) || 0,
              };
              
              // Add variant SKU if product SKU exists
              if (productSku) {
                variantData.sku = productSku;
              }
              
              // Add variant compareAtPrice if exists
              if (compareAtPrice !== undefined && compareAtPrice !== null && !isNaN(Number(compareAtPrice)) && Number(compareAtPrice) > 0) {
                variantData.compareAtPrice = Number(compareAtPrice);
              }

              const cleanString = (value: unknown): string | undefined => {
                if (value === null || value === undefined || value === '') return undefined;
                const str = String(value).trim();
                return str.length > 0 ? str : undefined;
              };

              // Find category and brand using flexible column detection
              const categoryStr = getColumnValue(['Category', 'category', 'الفئة', 'التصنيف', 'فئة']);
              const categoryIds: string[] = [];
              if (categoryStr) {
                const categoryInputs = categoryStr.split(',').map(c => c.trim()).filter(Boolean);
                
                for (const categoryInput of categoryInputs) {
                  // Check if it's a path (contains '>')
                  if (categoryInput.includes('>')) {
                    // Parse category path (e.g., "Parent > Child")
                    const pathParts = categoryInput.split(/\s*>\s*/).map(p => p.trim()).filter(Boolean);
                    // Find category by matching the last part of the path
                    const categoryName = pathParts[pathParts.length - 1];
                const category = categories.find(c => 
                      c.name?.toLowerCase() === categoryName.toLowerCase() ||
                      c.nameAr?.toLowerCase() === categoryName.toLowerCase()
                    );
                    if (category) {
                      categoryIds.push(category.id);
                    }
                  } else {
                    // Direct category name
                    const category = categories.find(c => 
                      c.name?.toLowerCase() === categoryInput.toLowerCase() ||
                      c.nameAr?.toLowerCase() === categoryInput.toLowerCase()
                );
                    if (category) {
                      categoryIds.push(category.id);
                    }
                  }
                }
              }
              
              // For backward compatibility, use first category as categoryId
              const categoryId = categoryIds.length > 0 ? categoryIds[0] : undefined;

              const brandStr = getColumnValue(['Brand', 'brand', 'العلامة', 'الماركة']);
              const brandCodeStr = getColumnValue(['BrandCode', 'brand_code', 'كود_العلامة']);
              let brandId: string | undefined;
              if (brandStr || brandCodeStr) {
                const brand = brands.find(b => 
                  (brandStr && b.name?.toLowerCase() === brandStr.toLowerCase()) ||
                  (brandStr && b.nameAr?.toLowerCase() === brandStr.toLowerCase()) ||
                  (brandCodeStr && b.code?.toLowerCase() === brandCodeStr.toLowerCase())
                );
                brandId = brand?.id;
              }

              interface ProductData {
                name: string;
                nameAr?: string;
                description?: string;
                descriptionAr?: string;
                price: number;
                costPerItem?: number;
                coinsNumber?: number;
                notify?: boolean;
                min?: number;
                max?: number;
                webStatus?: boolean;
                mobileStatus?: boolean;
                purpleCardsProductNameAr?: string;
                purpleCardsProductNameEn?: string;
                purpleCardsSlugAr?: string;
                purpleCardsSlugEn?: string;
                purpleCardsDescAr?: string;
                purpleCardsDescEn?: string;
                purpleCardsLongDescAr?: string;
                purpleCardsLongDescEn?: string;
                purpleCardsMetaTitleAr?: string;
                purpleCardsMetaTitleEn?: string;
                purpleCardsMetaKeywordAr?: string;
                purpleCardsMetaKeywordEn?: string;
                purpleCardsMetaDescriptionAr?: string;
                purpleCardsMetaDescriptionEn?: string;
                ish7enProductNameAr?: string;
                ish7enProductNameEn?: string;
                ish7enSlugAr?: string;
                ish7enSlugEn?: string;
                ish7enDescAr?: string;
                ish7enDescEn?: string;
                ish7enLongDescAr?: string;
                ish7enLongDescEn?: string;
                ish7enMetaTitleAr?: string;
                ish7enMetaTitleEn?: string;
                ish7enMetaKeywordAr?: string;
                ish7enMetaKeywordEn?: string;
                ish7enMetaDescriptionAr?: string;
                ish7enMetaDescriptionEn?: string;
                compareAtPrice?: number;
                sku?: string;
                productId?: string;
                barcode?: string;
                weight?: number;
                dimensions?: string;
                tags?: string[];
                brandId?: string;
                categoryIds?: string[];
                isAvailable?: boolean;
                featured?: boolean;
                variants: Array<{ name: string; price: number; inventoryQuantity: number; sku?: string; compareAtPrice?: number }>;
              }
              // Get additional fields using flexible column detection
              const nameArStr = getColumnValue(['NameAr', 'nameAr', 'name_ar', 'الاسم_بالعربي', 'الاسم_عربي']);
              const descStr = getColumnValue(['Description', 'description', 'الوصف', 'وصف']);
              const descArStr = getColumnValue(['DescriptionAr', 'descriptionAr', 'description_ar', 'الوصف_بالعربي']);
              const barcodeStr = getColumnValue(['Barcode', 'barcode', 'الباركود', 'رمز_شريطي']);
              const weightStr = getColumnValue(['Weight', 'weight', 'الوزن']);
              const dimensionsStr = getColumnValue(['Dimensions', 'dimensions', 'الأبعاد']);
              const statusStr = getColumnValue(['Status', 'status', 'الحالة']);
              const featuredStr = getColumnValue(['Featured', 'featured', 'مميز']);
              
              const productData: ProductData = {
                name: name || productId || sku || t('dashboard.products.messages.defaultProductName'),
                nameAr: cleanString(nameArStr),
                description: cleanString(descStr),
                descriptionAr: cleanString(descArStr),
                price: price, // Use validated price
                costPerItem: cost !== undefined && cost !== null && !isNaN(Number(cost)) && Number(cost) > 0 ? Number(cost) : undefined,
                coinsNumber: coinsNumber !== undefined && coinsNumber !== null ? Number(coinsNumber) : undefined,
                notify: notify !== undefined && notify !== null ? Boolean(notify) : undefined,
                min: min !== undefined && min !== null ? Number(min) : undefined,
                max: max !== undefined && max !== null ? Number(max) : undefined,
                webStatus: webStatus !== undefined && webStatus !== null ? Boolean(webStatus) : undefined,
                mobileStatus: mobileStatus !== undefined && mobileStatus !== null ? Boolean(mobileStatus) : undefined,
                purpleCardsProductNameAr: cleanString(getColumnValue(['purple_cards_product_name_ar'])),
                purpleCardsProductNameEn: cleanString(getColumnValue(['purple_cards_product_name_en'])),
                purpleCardsSlugAr: cleanString(getColumnValue(['purple_cards_slug_ar'])),
                purpleCardsSlugEn: cleanString(getColumnValue(['purple_cards_slug_en'])),
                purpleCardsDescAr: cleanString(getColumnValue(['purple_cards_desc_ar'])),
                purpleCardsDescEn: cleanString(getColumnValue(['purple_cards_desc_en'])),
                purpleCardsLongDescAr: cleanString(getColumnValue(['purple_cards_long_desc_ar'])),
                purpleCardsLongDescEn: cleanString(getColumnValue(['purple_cards_long_desc_en'])),
                purpleCardsMetaTitleAr: cleanString(getColumnValue(['purple_cards_meta_title_ar'])),
                purpleCardsMetaTitleEn: cleanString(getColumnValue(['purple_cards_meta_title_en'])),
                purpleCardsMetaKeywordAr: cleanString(getColumnValue(['purple_cards_meta_keyword_ar'])),
                purpleCardsMetaKeywordEn: cleanString(getColumnValue(['purple_cards_meta_keyword_en'])),
                purpleCardsMetaDescriptionAr: cleanString(getColumnValue(['purple_cards_meta_description_ar'])),
                purpleCardsMetaDescriptionEn: cleanString(getColumnValue(['purple_cards_meta_description_en'])),
                ish7enProductNameAr: cleanString(getColumnValue(['ish7en_product_name_ar'])),
                ish7enProductNameEn: cleanString(getColumnValue(['ish7en_product_name_en'])),
                ish7enSlugAr: cleanString(getColumnValue(['ish7en_slug_ar'])),
                ish7enSlugEn: cleanString(getColumnValue(['ish7en_slug_en'])),
                ish7enDescAr: cleanString(getColumnValue(['ish7en_desc_ar'])),
                ish7enDescEn: cleanString(getColumnValue(['ish7en_desc_en'])),
                ish7enLongDescAr: cleanString(getColumnValue(['ish7en_long_desc_ar'])),
                ish7enLongDescEn: cleanString(getColumnValue(['ish7en_long_desc_en'])),
                ish7enMetaTitleAr: cleanString(getColumnValue(['ish7en_meta_title_ar'])),
                ish7enMetaTitleEn: cleanString(getColumnValue(['ish7en_meta_title_en'])),
                ish7enMetaKeywordAr: cleanString(getColumnValue(['ish7en_meta_keyword_ar'])),
                ish7enMetaKeywordEn: cleanString(getColumnValue(['ish7en_meta_keyword_en'])),
                ish7enMetaDescriptionAr: cleanString(getColumnValue(['ish7en_meta_description_ar'])),
                ish7enMetaDescriptionEn: cleanString(getColumnValue(['ish7en_meta_description_en'])),
                compareAtPrice: compareAtPrice !== undefined && compareAtPrice !== null && !isNaN(Number(compareAtPrice)) && Number(compareAtPrice) > 0 ? Number(compareAtPrice) : undefined,
                ...(productSku ? { sku: productSku } : {}),
                ...(productId ? { productId: productId } : {}),
                barcode: cleanString(barcodeStr),
                weight: weightStr ? (parseFloat(weightStr.replace(/[^\d.-]/g, '')) || undefined) : undefined,
                dimensions: cleanString(dimensionsStr),
                tags: tags.length > 0 ? tags : undefined,
                brandId: brandId || undefined,
                categoryIds: categoryIds.length > 0 ? categoryIds : (categoryId ? [categoryId] : undefined),
                isAvailable: statusStr !== 'DRAFT' && statusStr !== 'ARCHIVED' && statusStr !== 'draft' && statusStr !== 'archived',
                featured: featuredStr === 'Yes' || featuredStr === 'true' || featuredStr === 'TRUE' || featuredStr === '1',
                variants: [variantData]
              };
              
              // Remove undefined values
              Object.keys(productData).forEach(key => {
                if (productData[key] === undefined) {
                  delete productData[key];
                }
              });

              // Log product data for debugging (always log first product and every 10th)
              const shouldLog = successCount < 1 || successCount % 10 === 0 || validRows.length <= 5;
              if (shouldLog) {
                console.log(`📦 Creating product at row ${rowNum} (${successCount + 1}/${validRows.length}):`, {
                  name: productData.name,
                  price: productData.price,
                  sku: productData.sku,
                  categoryIds: productData.categoryIds?.length || 0,
                  variants: productData.variants?.length || 0,
                  fullData: productData
                });
              }
              
              // Update progress before API call
              setImportProgress({ 
                current: successCount, 
                total: validRows.length, 
                currentItem: `جاري رفع المنتج ${successCount + 1} من ${validRows.length}: ${productData.name}...`
              });
              
              // Create product with timeout to prevent hanging
              const createProductPromise = coreApi.createProduct(productData, true);
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Product creation timeout after 30 seconds')), 30000)
              );
              
              const createdProduct = await Promise.race([createProductPromise, timeoutPromise]) as Awaited<ReturnType<typeof coreApi.createProduct>>;
              
              // Verify product was actually created - check for ID in various response formats
              const createdProductId = createdProduct?.id || (createdProduct as { product?: { id?: string }; data?: { id?: string } })?.product?.id || (createdProduct as { data?: { id?: string } })?.data?.id;
              if (!createdProductId) {
                console.error(`❌ Product creation failed validation at row ${rowNum}:`, {
                  response: createdProduct,
                  hasId: !!createdProduct?.id,
                  hasProductId: !!(createdProduct as { product?: { id?: string } })?.product?.id,
                  hasDataId: !!(createdProduct as { data?: { id?: string } })?.data?.id
                });
                throw new Error('Product creation returned no ID - product may not have been created');
              }
              
              // Always log success for first few products or if total is small
              const shouldLogSuccess = successCount < 1 || successCount % 10 === 0 || validRows.length <= 5;
              if (shouldLogSuccess) {
                console.log(`✅ Product created successfully at row ${rowNum}: ID=${createdProductId}, Name="${productData.name}" (Total success: ${successCount + 1})`);
              }
              
              successCount++;
              
              // Update progress after success
              setImportProgress({ 
                current: successCount, 
                total: validRows.length, 
                currentItem: `تم رفع ${successCount} منتج من ${validRows.length}...`
              });
              
            } catch (error: unknown) {
              // Always log errors for debugging
              console.error(`❌ Error uploading product at row ${rowNum}:`, error);
              console.error(`❌ Full error details:`, {
                error,
                errorType: error instanceof Error ? error.constructor.name : typeof error,
                errorMessage: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
              });
              console.error(`❌ Product data that failed:`, {
                name: name || productId || sku,
                productName: productName,
                price: priceStr,
                rowNum: rowNum
              });
              
              let userFriendlyError = t('dashboard.products.messages.unknownError');
              let errorColumn = 'General';
              
              const errorObj = error as { 
                message?: string; 
                data?: { message?: string | string[] }; 
                response?: { 
                  data?: { message?: string | string[]; error?: string }; 
                  status?: number;
                }; 
                status?: number;
              };
              const responseData = errorObj?.response?.data;
              const errorMessage = responseData?.message || errorObj?.data?.message || errorObj?.message || '';
              
              // Prefer detailed error message from backend
              if (errorMessage) {
                if (Array.isArray(errorMessage)) {
                  userFriendlyError = errorMessage.join(', ');
                } else {
                  userFriendlyError = String(errorMessage);
                }
              }

              // Handle specific status codes if no specific message was found or to override
              const statusCode = errorObj?.status || errorObj?.response?.status;
              if (statusCode === 401 || userFriendlyError.includes('sessionExpired') || userFriendlyError.includes('Session expired') || userFriendlyError.includes('Authentication required')) {
                // Session expired or not authenticated - try to refresh token once
                console.log('🔄 Authentication required during upload, attempting token refresh...');
                try {
                  const { ensureFreshToken } = await import('@/services/core/api-client');
                  const tokenRefreshed = await ensureFreshToken();
                  if (tokenRefreshed) {
                    console.log('✅ Token refreshed - continuing with import');
                    userFriendlyError = t('common.sessionRefreshed');
                    // Don't abort - retry this product
                    errorColumn = 'General';
                  } else {
                    userFriendlyError = t('common.sessionRefreshFailed');
                    // Mark error but don't abort entire import - let other products continue
                    errorColumn = 'General';
                  }
                } catch (refreshError) {
                  console.error('❌ Token refresh failed:', refreshError);
                  userFriendlyError = t('common.authError');
                  errorColumn = 'General';
                }
              } else if (statusCode === 403) {
                // 403 Forbidden - likely authentication issue, try to refresh token
                console.log('🔄 403 Forbidden, attempting token refresh...');
                try {
                  const { ensureFreshToken } = await import('@/services/core/api-client');
                  const tokenRefreshed = await ensureFreshToken();
                  if (tokenRefreshed) {
                    console.log('✅ Token refreshed after 403 - continuing');
                    userFriendlyError = t('common.sessionRefreshed');
                  } else {
                    if (!userFriendlyError || userFriendlyError === t('dashboard.products.messages.unknownError')) {
                      userFriendlyError = t('common.forbiddenRetry');
                    }
                  }
                } catch (refreshError) {
                  console.error('❌ Token refresh failed after 403:', refreshError);
                  if (!userFriendlyError || userFriendlyError === t('dashboard.products.messages.unknownError')) {
                    userFriendlyError = t('common.forbiddenRetry');
                  }
                }
                errorColumn = 'General';
                importAbortRef.current = true;
                userFriendlyError = t('dashboard.products.messages.storeSetupRequired');
                errorColumn = 'General';
              } else if (statusCode === 404) {
                if (!responseData?.message) {
                   userFriendlyError = t('dashboard.products.messages.categoryOrBrandNotFound');
                   errorColumn = 'Category';
                }
              } else if (statusCode === 409) {
                 userFriendlyError = t('dashboard.products.messages.productExists');
                 errorColumn = 'SKU';
              } else if (statusCode === 429 || userFriendlyError.includes('ThrottlerException') || userFriendlyError.includes('Too Many Requests')) {
                // Rate limit exceeded - mark error but don't retry (delays between batches should prevent this)
                userFriendlyError = 'تم تجاوز حد الطلبات. يرجى تقليل عدد المنتجات في الملف أو المحاولة لاحقاً';
                errorColumn = 'General';
              } else if (statusCode === 400) {
                // Bad request - likely validation error
                if (!userFriendlyError || userFriendlyError === t('dashboard.products.messages.unknownError')) {
                  userFriendlyError = responseData?.error || 'Validation error: Please check all required fields are filled correctly.';
                }
                errorColumn = 'General';
              }
              
              // If error message contains specific field names, update errorColumn
              const errorLower = userFriendlyError.toLowerCase();
              if (errorLower.includes('price')) errorColumn = 'Price';
              else if (errorLower.includes('name')) errorColumn = 'Name';
              else if (errorLower.includes('category')) errorColumn = 'Category';
              else if (errorLower.includes('brand')) errorColumn = 'Brand';
              else if (errorLower.includes('sku')) errorColumn = 'SKU';
              else if (errorLower.includes('variant')) errorColumn = 'Variants';
                
              uploadErrors.push({ row: rowNum, column: errorColumn, productName: productName.toString(), error: userFriendlyError });
              throw error; // Re-throw to mark as rejected in Promise.allSettled
            }
          }));
          
          // Process batch results - count successes and failures
          let batchSuccesses = 0;
          let batchFailures = 0;
          batchResults.forEach((result, batchIndex) => {
            if (result.status === 'fulfilled') {
              batchSuccesses++;
            } else {
              batchFailures++;
              // Failure - error already logged in catch block
              console.error(`❌ Batch item ${i + batchIndex + 1} failed:`, result.reason);
            }
          });
          
          console.log(`📊 Batch ${Math.floor(i / BATCH_SIZE) + 1} complete: ${batchSuccesses} succeeded, ${batchFailures} failed. Total success so far: ${successCount}`);
          
          // Update progress after batch - show actual progress based on processed items
          const processedCount = Math.min(i + BATCH_SIZE, validRows.length);
          setImportProgress({ 
            current: processedCount, 
            total: validRows.length, 
            currentItem: `جاري رفع ${successCount} منتج صالح من ${validRows.length}... (تم معالجة ${processedCount})`
          });
          
          // Delay between batches to avoid rate limiting (throttling)
          if (i + BATCH_SIZE < validRows.length) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay between batches
          }
        }
      }

      // ============================================
      // PHASE 3: SHOW ERROR POPUP WITH ALL REFUSED COLUMNS
      // ============================================
      // Combine validation errors and upload errors
      const allErrors = [...validationErrors, ...uploadErrors];
      
      if (!importAbortRef.current) {
        const finalTotal = totalItems;
        const completionMessage = allErrors.length > 0 
          ? t('dashboard.products.messages.importCompleteWithErrors', { success: successCount, errors: allErrors.length, total: finalTotal })
          : t('dashboard.products.messages.importComplete', { success: successCount, total: finalTotal });
        
        setImportProgress({ 
          current: finalTotal, 
          total: finalTotal, 
          currentItem: completionMessage
        });

        // Show completion message briefly, then close dialog
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (allErrors.length > 0) {
          console.group('تفاصيل أخطاء الاستيراد:');
          console.log(`إجمالي الأخطاء: ${allErrors.length}`);
          allErrors.forEach((err, idx) => {
            console.error(`خطأ ${idx + 1}: الصف ${err.row} - العمود: ${err.column} - المنتج: ${err.productName} - الخطأ: ${err.error}`);
          });
          console.groupEnd();
          
          setImportErrors(allErrors);
          // Close import dialog first
          setIsImporting(false);
          
          // Small delay before showing error dialog
          await new Promise(resolve => setTimeout(resolve, 300));
          
          setShowImportErrorDialog(true);
          console.log('✅ Error dialog should now be visible with', allErrors.length, 'errors');
        } else {
          // Close dialog immediately on success
          setIsImporting(false);
          setImportProgress({ current: 0, total: 0, currentItem: '' });
        }
        
        toast({
          title: successCount > 0 ? t('dashboard.products.messages.importSuccess') : t('dashboard.products.messages.importFailed'),
          description: allErrors.length > 0 
            ? t('dashboard.products.messages.importSuccessDescWithErrors', { success: successCount, errors: allErrors.length })
            : t('dashboard.products.messages.importSuccessDesc', { success: successCount }),
          variant: allErrors.length > successCount ? 'destructive' : successCount > 0 ? 'default' : 'destructive',
          duration: 5000,
        });
        
        // Reload data to show newly imported products
        console.log(`📊 Import Summary: ${successCount} succeeded, ${allErrors.length} failed out of ${totalItems} total rows`);
        if (successCount > 0) {
          console.log(`🔄 Reloading product data after import (${successCount} products should be created)...`);
          setLoading(true); // Show loading state
        await loadData();
          setLoading(false);
          console.log(`✅ Data reloaded. Current product count: ${products.length}`);
          
          // If products count didn't increase, log a warning
          if (products.length === 0 && successCount > 0) {
            console.warn(`⚠️ WARNING: ${successCount} products reported as created but product list is still empty!`);
            toast({
              title: 'تحذير',
              description: `تم إنشاء ${successCount} منتج ولكن القائمة فارغة. يرجى تحديث الصفحة يدوياً أو التحقق من السجلات.`,
              variant: 'destructive',
              duration: 10000,
            });
          }
        } else {
          await loadData(); // Still reload even if no successes
        }
      } else {
        // Import was aborted - ensure dialog is closed and cleaned up
        setIsImporting(false);
        setImportProgress({ current: 0, total: 0, currentItem: '' });
        importAbortRef.current = false; // Reset for next import
      }
      
      // Reset file input
      e.target.value = '';
    } catch (error: unknown) {
      // Ensure progress dialog is closed on error
      importAbortRef.current = false; // Reset abort flag
      setIsImporting(false);
      setImportProgress({ current: 0, total: 0, currentItem: '' });
      toast({ 
        title: t('dashboard.products.messages.importErrorTitle'), 
        description: error instanceof Error ? error.message : t('dashboard.products.messages.importErrorDesc'), 
        variant: 'destructive' 
      });
    } finally {
      // Only reset progress if dialog is already closed (error dialog might be showing)
      if (!showImportErrorDialog && !isImporting) {
        setImportProgress({ current: 0, total: 0, currentItem: '' });
      }
    }
  };

    const stats = {
      total: totalItems,
      active: products.filter((p: Product) => p.status === 'ACTIVE').length,
      lowStock: products.filter((p: Product) => p.stock <= p.lowStockThreshold).length,
      outOfStock: products.filter((p: Product) => p.stock === 0).length,
    };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('dashboard.products.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('dashboard.products.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => navigate('/dashboard/hierarchical')}
          >
            <FolderTree className="h-4 w-4" />
            {t('dashboard.products.messages.productsAndCollections')}
          </Button>
          <Button 
            variant="outline"
            className="gap-2"
            onClick={() => setIsImportWizardOpen(true)}
            id="tour-products-import-btn"
          >
            <Upload className="h-4 w-4" />
            {t('dashboard.products.messages.importBtn')}
          </Button>
          <Button 
            className="gap-2" 
            onClick={() => {
              setEditingProduct(null);
              resetForm();
              setIsAddDialogOpen(true);
            }}
            id="tour-products-add-btn"
          >
            <Plus className="h-4 w-4" />
            {t('dashboard.products.addProduct')}
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
              <DialogTitle>{editingProduct ? t('dashboard.products.editProduct') : t('dashboard.products.addNewProduct')}</DialogTitle>
              <DialogDescription>
                {t('dashboard.products.enterProductDetails')}
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 min-h-0 flex flex-col px-6 pb-6">
              <ProductFormWizard
                initialData={wizardInitialData}
                initialImages={wizardInitialImages}
                categories={categories}
                brands={[]}
                units={units}
                suppliers={suppliers}
                onSave={handleSaveProduct}
                onCancel={() => setIsAddDialogOpen(false)}
                isEditing={!!editingProduct}
              />
            </div>
          </DialogContent>
        </Dialog>

        <ProductImportWizard
          open={isImportWizardOpen}
          onOpenChange={setIsImportWizardOpen}
          categories={categories}
          brands={brands}
          units={units}
          suppliers={suppliers}
          onSuccess={() => {
            loadData();
          }}
        />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-r-4 border-r-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.products.totalProducts')}</p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.products.activeProducts')}</p>
                <p className="text-2xl font-bold mt-1">{stats.active}</p>
              </div>
              <Package className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-yellow-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.products.lowStock')}</p>
                <p className="text-2xl font-bold mt-1">{stats.lowStock}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.products.outOfStock')}</p>
                <p className="text-2xl font-bold mt-1">{stats.outOfStock}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Table */}
      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value);
        // Clear badge counts when tab is clicked (mark as viewed)
        if (value === 'low-stock' || value === 'out-of-stock') {
          // The badges will still show the current count, but this marks the tab as viewed
          // If you want to actually clear the counts, you'd need to track viewed state separately
        }
      }} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">{t('dashboard.products.allProducts')}</TabsTrigger>
          <TabsTrigger value="low-stock" className="gap-2">
            {t('dashboard.products.nearDepletion')}
            {activeTab !== 'low-stock' && stats.lowStock > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 min-w-[1.25rem]">{stats.lowStock}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="out-of-stock" className="gap-2">
            {t('dashboard.products.quantityDepleted')}
            {activeTab !== 'out-of-stock' && stats.outOfStock > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 min-w-[1.25rem]">{stats.outOfStock}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative" id="tour-products-search">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t('dashboard.products.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('dashboard.products.allStatuses')}</SelectItem>
                <SelectItem value="ACTIVE">{t('dashboard.products.active')}</SelectItem>
                <SelectItem value="DRAFT">{t('dashboard.products.draft')}</SelectItem>
                <SelectItem value="ARCHIVED">{t('dashboard.products.archived')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder={t('dashboard.products.category')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('dashboard.products.allCategories')}</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.nameAr || category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="gap-2" 
                onClick={handleSelectAllProducts}
                disabled={loading}
              >
                <Package className="h-4 w-4" />
                {t('dashboard.products.messages.selectAll')}
              </Button>
              {selectedProducts.size > 0 && (
                <Button 
                  variant="destructive" 
                  className="gap-2" 
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                  {isDeleting ? t('dashboard.products.messages.deleting') : t('dashboard.products.messages.deleteSelected', { count: selectedProducts.size })}
                </Button>
              )}
              <Button variant="outline" className="gap-2" onClick={handleExportProducts} id="tour-products-export-btn">
                <Download className="h-4 w-4" />
                {t('dashboard.products.export')}
              </Button>
              <div className="relative">
                <Input
                  type="file"
                  accept=".xlsx, .xls"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleImportProducts}
                />
                <Button variant="outline" className="gap-2">
                  <Upload className="h-4 w-4" />
                  {t('dashboard.products.import')}
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
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('dashboard.products.noProducts')}</h3>
              <p className="text-gray-500 mb-4">{t('dashboard.products.startAddingFirst')}</p>
              <Button onClick={() => {
                setEditingProduct(null);
                resetForm();
                setIsAddDialogOpen(true);
              }}>
                <Plus className="h-4 w-4 ml-2" />
                {t('dashboard.products.addProduct')}
              </Button>
            </div>
          ) : (
            <div className="w-full max-w-full overflow-x-auto" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
            <Table className="w-full table-auto" style={{ minWidth: '900px' }}>
              <TableHeader>
                <TableRow>
                  <TableHead className={`w-12 sticky ${isRTL ? 'right-0' : 'left-0'} bg-background z-20 ${isRTL ? 'border-l' : 'border-r'} shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]`}>
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className={`font-semibold text-start min-w-[200px]`}>{t('dashboard.products.product')}</TableHead>
                  <TableHead className={`font-semibold text-start w-32 whitespace-nowrap`}>SKU</TableHead>
                  <TableHead className={`font-semibold text-start w-32 whitespace-nowrap`}>{t('dashboard.products.messages.path')}</TableHead>
                  <TableHead className={`font-semibold text-start w-32 whitespace-nowrap`}>{t('dashboard.products.price')}</TableHead>
                  <TableHead className={`font-semibold text-start w-32 whitespace-nowrap`}>{t('dashboard.products.stock')}</TableHead>
                  <TableHead className={`font-semibold text-start w-32 whitespace-nowrap`}>{t('dashboard.products.status')}</TableHead>
                  <TableHead className={`font-semibold text-center w-32 whitespace-nowrap sticky ${isRTL ? 'left-0' : 'right-0'} bg-background z-20 ${isRTL ? 'border-r' : 'border-l'} shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.1)]`}>{t('dashboard.products.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayProducts.map((product, index) => (
                  <TableRow 
                    key={product.id} 
                    className="group hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent dark:hover:from-gray-800 dark:hover:to-transparent transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
                    style={{ 
                      animationDelay: `${index * 50}ms`,
                      animationDuration: '500ms'
                    }}
                  >
                    <TableCell className={`sticky ${isRTL ? 'right-0' : 'left-0'} bg-background z-10 ${isRTL ? 'border-l' : 'border-r'} shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]`} onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedProducts.has(product.id)}
                        onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select ${product.nameAr || product.name}`}
                      />
                    </TableCell>
                    <TableCell
                      className={`cursor-pointer text-start`}
                      onClick={() => {
                        setViewingProduct(product);
                        setIsDetailsModalOpen(true);
                      }}
                    >
                      <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-xl flex items-center justify-center overflow-hidden border-2 border-transparent transition-all duration-300 group-hover:border-primary group-hover:shadow-lg group-hover:scale-110">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.nameAr} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                          ) : (
                            <ImageIcon className="h-7 w-7 text-gray-400 transition-all duration-300 group-hover:text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 text-start">
                          <p className="font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors duration-300 break-words">{product.nameAr || product.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 break-words">{product.category?.nameAr || product.category?.name || 'بدون فئة'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className={`font-mono text-sm text-gray-600 dark:text-gray-300 text-start break-all`}>{product.sku}</TableCell>
                    <TableCell className={`font-mono text-sm text-gray-600 dark:text-gray-300 text-start break-all`}>{product.path || '-'}</TableCell>
                    <TableCell className="text-start">
                      <div className="text-start">
                        <p className="font-bold text-gray-900 dark:text-white">{Number(product.price || 0).toFixed(2)} ريال</p>
                        {product.compareAtPrice && (
                          <p className="text-xs text-gray-500 line-through">{Number(product.compareAtPrice).toFixed(2)} ريال</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-start">
                      <div className={`flex items-center gap-2 ${isRTL ? 'justify-end' : 'justify-start'}`}>
                        <span className="font-medium text-gray-900 dark:text-white">{product.stock}</span>
                        {getStockBadge(product.stock, product.lowStockThreshold)}
                      </div>
                    </TableCell>
                    <TableCell className="text-start">{getStatusBadge(product.status)}</TableCell>
                    <TableCell className={`sticky ${isRTL ? 'left-0' : 'right-0'} bg-background z-10 ${isRTL ? 'border-r' : 'border-l'} shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.1)]`}>
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(product);
                          }}
                          className="hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-600"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          asChild
                          onClick={(e) => e.stopPropagation()}
                          className="hover:bg-green-100 dark:hover:bg-green-900 hover:text-green-600"
                        >
                          <Link to={`/products/${product.id}`} target="_blank">
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProduct(product.id);
                          }}
                          className="hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
          
          {/* Pagination Controls */}
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
              className="border-t"
            />
          )}
        </CardContent>
        </Card>
      </Tabs>

      {/* Product Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {viewingProduct && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <DialogTitle className="text-2xl font-bold mb-2">
                      {viewingProduct.nameAr || viewingProduct.name}
                    </DialogTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(viewingProduct.status)}
                      {viewingProduct.featured && (
                        <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                          ⭐ مميز
                        </Badge>
                      )}
                      <Badge variant="outline" className="font-mono text-xs">
                        {viewingProduct.sku}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="rounded-full"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </DialogHeader>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Images Section */}
                <div className="space-y-3">
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border-2 border-gray-200 dark:border-gray-700">
                    {viewingProduct.images && viewingProduct.images.length > 0 ? (
                      <img
                        src={viewingProduct.images[0]}
                        alt={viewingProduct.nameAr}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-24 w-24 text-gray-400" />
                      </div>
                    )}
                  </div>
                  {viewingProduct.images && viewingProduct.images.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {viewingProduct.images.slice(1, 5).map((image, idx) => (
                        <div
                          key={idx}
                          className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border cursor-pointer hover:border-primary transition-all"
                        >
                          <img
                            src={image}
                            alt={`${viewingProduct.nameAr} ${idx + 2}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Product Info Section */}
                <div className="space-y-4">
                  {/* Pricing */}
                  <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                    <CardContent className="pt-6">
                      <div className="flex items-baseline gap-3">
                        <span className="text-4xl font-bold text-primary">
                          {Number(viewingProduct.price || 0).toFixed(2)}
                        </span>
                        <span className="text-xl text-gray-600 dark:text-gray-400">ريال</span>
                      </div>
                      {viewingProduct.compareAtPrice && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-lg text-gray-500 line-through">
                            {Number(viewingProduct.compareAtPrice).toFixed(2)} ريال
                          </span>
                          <Badge className="bg-red-500 text-white">
                            خصم {Math.round((1 - viewingProduct.price / viewingProduct.compareAtPrice) * 100)}%
                          </Badge>
                        </div>
                      )}
                      {viewingProduct.cost && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          التكلفة: {Number(viewingProduct.cost).toFixed(2)} ريال
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Stock Info */}
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">المخزون</span>
                        {getStockBadge(viewingProduct.stock, viewingProduct.lowStockThreshold)}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">{viewingProduct.stock}</span>
                        <span className="text-gray-500">وحدة متوفرة</span>
                      </div>
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          حد التنبيه: {viewingProduct.lowStockThreshold} وحدة
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Category */}
                  {viewingProduct.category && (
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">الفئة</p>
                        <p className="text-lg font-semibold">
                          {viewingProduct.category.nameAr || viewingProduct.category.name}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              {/* Description */}
              {(viewingProduct.description || viewingProduct.descriptionAr) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">الوصف</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {viewingProduct.descriptionAr || viewingProduct.description}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Additional Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">معلومات إضافية</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {viewingProduct.barcode && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">الباركود</p>
                        <p className="font-mono font-semibold">{viewingProduct.barcode}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">تاريخ الإضافة</p>
                      <p className="font-semibold">
                        {new Date(viewingProduct.createdAt).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>





              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  className="flex-1 gap-2"
                  onClick={() => {
                    setIsDetailsModalOpen(false);
                    openEditDialog(viewingProduct);
                  }}
                >
                  <Edit className="h-4 w-4" />
                  {t('dashboard.products.editProduct')}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  asChild
                >
                  <Link to={`/products/${viewingProduct.id}`} target="_blank">
                    <Eye className="h-4 w-4" />
                    {t('dashboard.products.viewInStore')}
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>


      
      {/* Import Errors Dialog */}
      <Dialog 
        open={showImportErrorDialog} 
        onOpenChange={(open) => {
          console.log('🔔 Error dialog onOpenChange:', open, 'Current errors:', importErrors.length);
          setShowImportErrorDialog(open);
          if (!open) {
            setImportErrors([]);
          }
        }}
      >
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              تقرير أخطاء استيراد المنتجات
            </DialogTitle>
            <DialogDescription>
              حدثت الأخطاء التالية أثناء الاستيراد. يرجى مراجعة الصفوف التي فشلت وتصحيح البيانات في ملف Excel.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[70vh] overflow-y-auto">
            <div className="space-y-4">
              {/* Summary Card */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border-2 border-red-200 dark:border-red-800 rounded-lg p-5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-full">
                      <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-red-900 dark:text-red-300">
                        إجمالي الصفوف التي فشلت: {importErrors.length}
                      </h3>
                      <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                        يرجى مراجعة الأخطاء أدناه وإصلاحها في ملف Excel قبل المحاولة مرة أخرى
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">عدد الصفوف</p>
                      <p className="text-2xl font-bold text-red-600">{importErrors.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* All errors table - showing all failed rows */}
              {importErrors.length > 0 && (
                <Card className="border-2 border-red-200 dark:border-red-800">
                  <CardHeader className="bg-red-50 dark:bg-red-950/30">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <X className="h-5 w-5 text-red-600" />
                      قائمة الصفوف التي فشل استيرادها
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      جميع الصفوف التي لم يتم استيرادها مع سبب الفشل لكل صف
                    </p>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50 dark:bg-gray-900">
                            <TableHead className="w-24 font-bold text-center"># الصف في Excel</TableHead>
                            <TableHead className="font-bold min-w-[150px]">اسم المنتج / SKU</TableHead>
                            <TableHead className="font-bold min-w-[120px]">العمود المشكوك فيه</TableHead>
                            <TableHead className="font-bold">سبب الفشل</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {importErrors.map((err, index) => (
                            <TableRow 
                              key={index} 
                              className="hover:bg-red-50/50 dark:hover:bg-red-950/20 border-b border-red-100 dark:border-red-900/50"
                            >
                              <TableCell className="font-mono font-bold text-center text-lg bg-red-50 dark:bg-red-950/30">
                                {err.row}
                              </TableCell>
                              <TableCell className="font-medium">
                                <div className="flex flex-col gap-1">
                                  <span className="font-semibold">{err.productName || '(لا يوجد اسم)'}</span>
                                  {err.productName && err.productName !== err.productName && (
                                    <span className="text-xs text-gray-500">SKU: {err.productName}</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant="outline" 
                                  className="font-semibold text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30"
                                >
                                  {err.column || 'عام'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-red-700 dark:text-red-400 font-medium">
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                  <span>{err.error}</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowImportErrorDialog(false);
                setImportErrors([]);
              }}
              className="min-w-[100px]"
            >
              إغلاق
            </Button>
            <Button 
              onClick={() => {
                // Export errors to CSV
                const errorData = importErrors.map(err => ({
                  row: err.row,
                  productName: err.productName || '',
                  column: err.column || '',
                  error: err.error
                }));
                
                const ws = utils.json_to_sheet(errorData);
                const wb = utils.book_new();
                utils.book_append_sheet(wb, ws, "Import Errors");
                writeFile(wb, `import_errors_${new Date().toISOString().split('T')[0]}.xlsx`);
                
                toast({
                  title: 'تم التصدير',
                  description: 'تم تصدير تقرير الأخطاء بنجاح',
                });
              }}
              variant="secondary"
              className="min-w-[150px]"
            >
              <Download className="h-4 w-4 ml-2" />
              تصدير تقرير الأخطاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Progress Dialog */}
      <ImportProgressDialog
        open={isImporting}
        onOpenChange={(open) => {
          setIsImporting(open);
          // Stop import and reset progress when dialog is closed
          if (!open) {
            importAbortRef.current = true;
            setImportProgress({ current: 0, total: 0, currentItem: '' });
            // Only show toast if import was actually running
            if (importProgress.total > 0 && importProgress.current < importProgress.total) {
              toast({
                title: t('dashboard.products.importStopped'),
                description: t('dashboard.products.importStoppedDesc'),
              });
            }
          } else {
            // Reset abort flag when dialog opens
            importAbortRef.current = false;
          }
        }}
        progress={importProgress}
        title={t('dashboard.products.importingProducts')}
        description={t('dashboard.products.importingProductsDesc')}
      />
    </div>
  );
}
