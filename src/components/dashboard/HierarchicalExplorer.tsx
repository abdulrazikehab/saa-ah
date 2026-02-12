import React, { useState, useEffect, useMemo, useCallback, useRef, ChangeEvent } from 'react';
import * as XLSX from 'xlsx';
import { useTranslation } from 'react-i18next';
import { 
  ChevronRight, ChevronDown, ChevronLeft, Folder, FolderOpen, Package, 
  ArrowLeft, Plus, Tag, Eye, Edit, X, Image as ImageIcon, 
  AlertTriangle, Home, Store, Box, Trash2, Search, MoreVertical,
  LayoutGrid, List, Info, ExternalLink, RefreshCw, Upload, Cloud, Link as LinkIcon, Download,
  Loader2
} from 'lucide-react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { CloudinaryImagePicker } from './CloudinaryImagePicker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '@/components/ui/context-menu';
import { ImageUpload } from '@/components/ui/image-upload';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { coreApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirm } from '@/contexts/ConfirmationContext';
import { cloudinaryAccessService } from '@/services/cloudinary-access.service';
import { getLogoUrl } from '@/config/logo.config';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import { CategoryForm, CategoryFormData } from './CategoryForm';
import { ProductFormWizard, ProductFormData } from './products/ProductFormWizard';

import { HierarchicalImportWizard } from './HierarchicalImportWizard';
import { ExplorerTree, ExplorerCategory, ExplorerBrand, ExplorerProduct } from './ExplorerTree';

interface Brand {
  id: string;
  name: string;
  nameAr?: string;
  code?: string;
  logo?: string;
  parentCategoryId?: string;
  ParentCategoryID?: string; // For loose compatibility
}

// Helpers to reliably get values from various data variants
const getBrandParentCategoryId = (b: unknown): string => {
  if (!b || typeof b !== 'object') return "";
  const brand = b as Record<string, unknown>;
  const val = (brand.ParentCategoryID ?? brand.parentCategoryID ?? brand.parentCategoryId ?? brand.ParentCategoryId ?? brand.parent_category_id ?? brand.parent_category_ID ?? "") as string | number | null | undefined;
  return val ? String(val) : "";
};
const toStr = (id: unknown): string => (id ? String(id).trim() : "");

interface Category {
  id: string;
  name: string;
  nameAr?: string;
  parentId?: string;
  image?: string;
  description?: string;
}

interface ProductCategory {
  categoryId?: string;
  category?: { id: string; name: string; nameAr?: string };
  id?: string;
}

interface Product {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  price?: number;
  compareAtPrice?: number;
  cost?: number;
  sku?: string;
  barcode?: string;
  stock?: number;
  images?: string[];
  status?: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  featured?: boolean;
  brandId?: string;
  categories?: ProductCategory[];
  categoryIds?: string[]; // Direct array of category IDs (from import)
  path?: string;
}

// Helper to check if product belongs to a category (handles both formats)
const productHasCategory = (product: Product, categoryId: string): boolean => {
  const catId = toStr(categoryId);
  
  // Check categories array (objects with categoryId, id, or nested category.id)
  if (product.categories && product.categories.length > 0) {
    const found = product.categories.some(pc => {
      const pcId = toStr(pc.categoryId || pc.category?.id || pc.id);
      return pcId === catId;
    });
    if (found) return true;
  }
  
  // Check categoryIds array (simple string array from import)
  if (product.categoryIds && product.categoryIds.length > 0) {
    const found = product.categoryIds.some(cid => toStr(cid) === catId);
    if (found) return true;
  }
  
  return false;
};

interface ProductDetails extends Product {
  categories?: Array<{ id: string; name: string; nameAr?: string }>;
  brand?: { id: string; name: string; nameAr?: string };
  variants?: Array<{ id: string; name: string; price: number; inventoryQuantity: number; cost?: number }>;
  suppliers?: Array<{ id: string; name: string; nameAr?: string; cost?: number }>;
}

interface HierarchicalExplorerProps {
  brands: Brand[];
  categories: Category[];
  products: Product[];
  selectedBrandId?: string;
  selectedCategoryIds: string[];
  onBrandSelect?: (brandId: string | null) => void;
  onCategorySelect: (categoryId: string) => void;
  onProductSelect?: (productId: string) => void;
  loadProductsByCategory?: (categoryId: string) => Promise<Product[]>;
  loadProductsByBrand?: (brandId: string) => Promise<Product[]>;
  onCreateCategory?: (category: { name: string; nameAr?: string; description?: string; parentId?: string; image?: string }, options?: any) => Promise<Category>;
  onCreateBrand?: (brand: { name: string; nameAr?: string; code?: string; logo?: string }, options?: any) => Promise<Brand>;
  onCreateProduct?: (product: { name: string; nameAr?: string; description?: string; categoryId?: string; brandId?: string; price: number }, options?: any) => Promise<Product>;
  onCategoriesUpdate?: () => void;
  onBrandsUpdate?: () => void;
  onProductsUpdate?: () => void;
  isFullScreen?: boolean;
}

interface ImportPreviewData {
  categories: Array<{
    id?: string;
    existingId?: string;
    name: string;
    nameAr?: string;
    description?: string;
    parentId?: string;
    image?: string;
    status?: 'EXISTING' | 'NEW';
  }>;
  brands: Array<{
    id?: string;
    existingId?: string;
    name: string;
    nameAr?: string;
    code?: string;
    logo?: string;
    status?: 'EXISTING' | 'NEW';
  }>;
  products: Array<{
    id?: string;
    name: string;
    nameAr?: string;
    description?: string;
    descriptionAr?: string;
    price: number;
    cost?: number;
    sku?: string;
    barcode?: string;
    stock?: number;
    categoryIds: string[];
    brandId?: string;
    status?: string;
    statusProp?: 'ACTIVE' | 'DRAFT';
    images: string[];
    featured?: boolean;
  }>;
}

import { BrandForm } from './BrandForm';

type ViewType = 'categories' | 'subcategories' | 'products' | 'brands' | 'category-edit' | 'brand-edit' | 'product-edit';

interface TreeNode {
  id: string;
  type: 'brand' | 'category' | 'product';
  data: Brand | Category | Product;
  name: string;
  children: TreeNode[];
}

interface Unit {
  id: string;
  name: string;
  nameAr?: string;
  code: string;
  cost: number;
}

interface Supplier {
  id: string;
  name: string;
  nameAr?: string;
  discountRate: number;
}

interface Currency {
  id: string;
  code: string;
  name: string;
  nameAr?: string;
  symbol: string;
  exchangeRate: number;
  isDefault?: boolean;
}

interface CreateCategoryData {
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  slug?: string;
  parentId?: string;
  image?: string;
  icon?: string;
  isActive?: boolean;
}

export function HierarchicalExplorer({
  brands,
  categories,
  products,
  selectedBrandId,
  selectedCategoryIds,
  onBrandSelect,
  onCategorySelect,
  onProductSelect,
  loadProductsByCategory,
  loadProductsByBrand,
  onCreateCategory,
  onCreateBrand,
  onCreateProduct,
  onCategoriesUpdate,
  onBrandsUpdate,
  onProductsUpdate,
  isFullScreen = false
}: HierarchicalExplorerProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { confirm } = useConfirm();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl' || i18n.language === 'ar';
  // Drag and Drop handlers removed per request

  // Track categories created under brands (categoryId -> brandId)
  // This allows showing categories under brands even before products are added
  // Load from localStorage on mount to preserve associations across reloads
  const loadCategoryBrandMap = useCallback((): Map<string, string> => {
    try {
      const stored = localStorage.getItem('hierarchical_categoryBrandMap');
      if (stored) {
        const data = JSON.parse(stored) as Record<string, string>;
        return new Map<string, string>(Object.entries(data));
      }
    } catch (error) {
      console.error('Failed to load categoryBrandMap from localStorage:', error);
    }
    return new Map<string, string>();
  }, []);
  
  const saveCategoryBrandMap = useCallback((map: Map<string, string>) => {
    try {
      const data = Object.fromEntries(map);
      localStorage.setItem('hierarchical_categoryBrandMap', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save categoryBrandMap to localStorage:', error);
    }
  }, []);
  // View & Navigation State
  const [currentView, setCurrentView] = useState<ViewType>('categories');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryPath, setCategoryPath] = useState<Category[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Data & Loading State
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [hasCloudinaryAccess, setHasCloudinaryAccess] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [categoryBrandMap, setCategoryBrandMap] = useState<Map<string, string>>(() => loadCategoryBrandMap());

  // Expansion State
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Dialog & Form State
  const [showCreateCategoryDialog, setShowCreateCategoryDialog] = useState(false);
  const [showCreateBrandDialog, setShowCreateBrandDialog] = useState(false);
  const [showDeleteBrandDialog, setShowDeleteBrandDialog] = useState(false);
  const [showDeleteCategoryDialog, setShowDeleteCategoryDialog] = useState(false);
  const [showDeleteProductDialog, setShowDeleteProductDialog] = useState(false);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [showHierarchicalImportWizard, setShowHierarchicalImportWizard] = useState(false);
  const [showProductFormDialog, setShowProductFormDialog] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showBrandImagePicker, setShowBrandImagePicker] = useState(false);
  const [showCategoryImagePicker, setShowCategoryImagePicker] = useState(false);

  // Editing State
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<string | null>(null);
  const [selectedProductDetails, setSelectedProductDetails] = useState<ProductDetails | null>(null);
  const [categoryParentBrand, setCategoryParentBrand] = useState<string | null>(null);
  const [categoryParentCategory, setCategoryParentCategory] = useState<string | null>(null);
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [selectedCategoryForEdit, setSelectedCategoryForEdit] = useState<Category | null>(null);
  const [selectedBrandForEdit, setSelectedBrandForEdit] = useState<Brand | null>(null);
  
  const [newCategoryData, setNewCategoryData] = useState({ name: '', nameAr: '', description: '', image: '' });
  const [newBrandData, setNewBrandData] = useState({ name: '', nameAr: '', code: '', logo: '' });
  const [editProductData, setEditProductData] = useState({
    name: '', nameAr: '', description: '', descriptionAr: '', price: '', compareAtPrice: '', sku: '', barcode: '', stock: '', images: [] as string[],
  });
  
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [updatingCategory, setUpdatingCategory] = useState(false);
  const [creatingBrand, setCreatingBrand] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [deletingBrand, setDeletingBrand] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [loadingProductDetails, setLoadingProductDetails] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [editingProductFormData, setEditingProductFormData] = useState<Partial<ProductFormData> | null>(null);
  const [deleteAllProgress, setDeleteAllProgress] = useState({ current: 0, total: 0, stage: '' });
  const [importErrors, setImportErrors] = useState<{item: string, reason: string}[]>([]);
  const [showImportResultDialog, setShowImportResultDialog] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreviewData | null>(null);
  const [showImportPreviewDialog, setShowImportPreviewDialog] = useState(false);
  const isImportCancelled = useRef(false);
  // Check Cloudinary access on mount - wrapped in try-catch to prevent signout
  useEffect(() => {
    const checkAccess = async () => {
      if (user?.id) {
        try {
          const access = await cloudinaryAccessService.checkUserAccess(user.id);
          setHasCloudinaryAccess(access);
        } catch (error: unknown) {
          // Silently fail - don't let this cause signout
          // Cloudinary access is a non-critical feature
          console.error('Failed to check Cloudinary access (non-critical):', error);
          setHasCloudinaryAccess(false);
        }
      }
    };
    // Only check if user exists and we're not in the middle of authentication
    if (user?.id && localStorage.getItem('accessToken')) {
      checkAccess();
    }
  }, [user?.id]);

  // Load units and suppliers for product form
  useEffect(() => {
    const loadUnitsAndSuppliers = async () => {
      try {
        const [unitsData, suppliersData, currenciesData] = await Promise.all([
          coreApi.get('/units', { requireAuth: true }).catch(() => []),
          coreApi.get('/suppliers', { requireAuth: true }).catch(() => []),
          coreApi.get('/currencies', { requireAuth: true }).catch(() => []),
        ]);
        setUnits(Array.isArray(unitsData) ? unitsData : []);
        setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
        setCurrencies(Array.isArray(currenciesData) ? currenciesData : []);
      } catch (error) {
        console.error('Failed to load units/suppliers:', error);
      }
    };
    loadUnitsAndSuppliers();
  }, []);

  // Navigate to ProductsManager with pre-filled brand and categories
  const navigateToAddProduct = () => {
    const params = new URLSearchParams();
    
    // Add brand if selected
    if (selectedBrand) {
      params.set('brandId', selectedBrand);
    }
    
    // Add all categories from the path
    const categoryIds = categoryPath.map(cat => cat.id);
    if (selectedCategory && !categoryIds.includes(selectedCategory)) {
      categoryIds.push(selectedCategory);
    }
    if (categoryIds.length > 0) {
      params.set('categoryIds', categoryIds.join(','));
    }
    
    // Set flag to open the dialog automatically
    params.set('openAdd', 'true');
    
    navigate(`/dashboard/products?${params.toString()}`);
  };

  // Load product details
  const loadProductDetails = async (productId: string) => {
    try {
      setLoadingProductDetails(true);
      setSelectedProductForEdit(productId);
      setCurrentView('product-edit');
      onProductSelect?.(productId);
      
      // Fetch full product details from API
      const productData = await coreApi.get(`/products/${productId}`, { requireAuth: true });
      
      const details: ProductDetails = {
        id: productData.id,
        name: productData.name,
        nameAr: productData.nameAr,
        description: productData.description,
        descriptionAr: productData.descriptionAr,
        price: typeof productData.price === 'string' ? parseFloat(productData.price) : productData.price,
        compareAtPrice: productData.compareAtPrice,
        cost: productData.costPerItem || productData.cost || productData.variants?.[0]?.cost,
        sku: productData.sku,
        barcode: productData.barcode,
        stock: productData.variants?.[0]?.inventoryQuantity || 0,
        images: productData.images?.map((img: string | { url: string }) => typeof img === 'string' ? img : img.url) || [],
        status: productData.isAvailable ? 'ACTIVE' : 'DRAFT',
        featured: productData.featured,
        categories: productData.categories?.map((c: { category?: { id: string; name: string; nameAr?: string }; id?: string; name?: string; nameAr?: string }) => ({
          id: c.category?.id || c.id,
          name: c.category?.name || c.name,
          nameAr: c.category?.nameAr || c.nameAr,
        })) || [],
        brand: productData.brand ? {
          id: productData.brand.id,
          name: productData.brand.name,
          nameAr: productData.brand.nameAr,
        } : undefined,
        variants: productData.variants || [],
        suppliers: productData.suppliers?.map((s: { supplier?: { id: string; name: string; nameAr?: string }; cost?: number; id?: string; name?: string; nameAr?: string }) => ({
          id: s.supplier?.id || s.id,
          name: s.supplier?.name || s.name,
          nameAr: s.supplier?.nameAr || s.nameAr,
          cost: s.cost,
        })) || [],
      };
      
      setSelectedProductDetails(details);
      setEditProductData({
        name: details.name || '',
        nameAr: details.nameAr || '',
        description: details.description || '',
        descriptionAr: details.descriptionAr || '',
        price: details.price?.toString() || '',
        compareAtPrice: details.compareAtPrice?.toString() || '',
        sku: details.sku || '',
        barcode: details.barcode || '',
        stock: details.stock?.toString() || '0',
        images: details.images || [],
      });
      
      // Set form data for ProductFormWizard
      const categoryIds = details.categories?.map(c => c.id).filter(Boolean) || [];
      const productImages = details.images || [];
      setEditingProductFormData({
        name: details.name || '',
        nameAr: details.nameAr || '',
        description: details.description || '',
        descriptionAr: details.descriptionAr || '',
        price: details.price?.toString() || '',
        compareAtPrice: details.compareAtPrice?.toString() || '',
        cost: details.cost?.toString() || '',
        sku: details.sku || '',
        barcode: details.barcode || '',
        stock: details.stock?.toString() || '0',
        lowStockThreshold: '10',
        categoryId: categoryIds[0] || '',
        categoryIds: categoryIds,
        brandId: details.brand?.id || details.brandId || '',
        status: details.status || 'ACTIVE',
        featured: details.featured || false,
        tags: '',
        metaTitle: '',
        metaDescription: '',
        weight: '',
        dimensions: '',
        unitId: '',
        productCode: '',
        odooProductId: '',
        path: productData.slug || '',
        supplierIds: details.suppliers?.map(s => s.id).filter(Boolean) || [],
        suppliers: details.suppliers?.map(s => ({
          supplierId: s.id,
          price: s.cost?.toString() || '',
          discountRate: 0,
          isPrimary: false,
        })) || [],
        minQuantity: '',
        maxQuantity: '',
        enableSlider: false,
        images: productImages, // Include images in form data
      } as ProductFormData & { images?: string[] });
    } catch (error) {
      console.error('Failed to load product details:', error);
      toast({
        title: 'تعذر تحميل المنتج',
        description: 'حدث خطأ أثناء تحميل تفاصيل المنتج. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setLoadingProductDetails(false);
    }
  };

  // Navigate to full product edit page
  const navigateToEditProduct = (productId: string) => {
    const params = new URLSearchParams();
    params.set('editId', productId);
    navigate(`/dashboard/products?${params.toString()}`);
  };

  // Helper to get all categories belonging to a specific brand
  const getCategorySetForBrand = useCallback((brandId: string | null) => {
    if (!brandId) return new Set<string>();
    
    const set = new Set<string>();
    
    // 1. Explicit mapping (from local storage / manual creation)
    categoryBrandMap.forEach((bId, cId) => {
      if (bId === brandId) {
        set.add(cId);
      }
    });
    
    // 2. Products (from server data)
    products.forEach(product => {
      if (product.brandId === brandId && product.categories) {
        product.categories.forEach((pc: ProductCategory) => {
          const catId = pc.categoryId || pc.category?.id || pc.id;
          if (catId) set.add(catId);
        });
      }
    });
    
    // 3. Ancestors (if a child is in brand, parent must be too)
    let addedAny = true;
    while (addedAny) {
      addedAny = false;
      categories.forEach(cat => {
        if (cat.parentId && set.has(cat.id) && !set.has(cat.parentId)) {
          set.add(cat.parentId);
          addedAny = true;
        }
      });
    }
    
    // 4. Descendants (if a parent is in brand, all children should be visible)
    addedAny = true;
    while (addedAny) {
      addedAny = false;
      categories.forEach(cat => {
        if (cat.parentId && set.has(cat.parentId) && !set.has(cat.id)) {
          set.add(cat.id);
          addedAny = true;
        }
      });
    }
    
    return set;
  }, [categories, products, categoryBrandMap]);

  // Get all categories that belong to the selected brand
  const categoriesInBrand = useMemo(() => getCategorySetForBrand(selectedBrand), [getCategorySetForBrand, selectedBrand]);

  // Get top-level categories (no brand filtering - categories are independent)
  const getTopLevelCategories = useCallback((): Category[] => {
    return categories.filter(cat => toStr(cat.parentId) === "");
  }, [categories]);

  // Get subcategories of a category (no brand filtering)
  const getSubcategories = useCallback((parentId: string): Category[] => {
    return categories.filter(cat => toStr(cat.parentId) === toStr(parentId));
  }, [categories]);

  const [allCategoryProducts, setAllCategoryProducts] = useState<Product[]>([]);
  const [showOtherBrandProducts, setShowOtherBrandProducts] = useState(false);

  // Get products in a category
  const getProductsInCategory = useCallback(async (categoryId: string): Promise<Product[]> => {
    if (loadProductsByCategory) {
      try {
        setLoadingProducts(true);
        const categoryProducts = await loadProductsByCategory(categoryId);
        // Deduplicate products
        return Array.from(new Map(categoryProducts.map(p => [p.id, p])).values());
      } finally {
        setLoadingProducts(false);
      }
    }
    
    // Fallback: filter products that belong to this category
    const filtered = products.filter(p => productHasCategory(p, categoryId));
    const uniqueById = Array.from(new Map(filtered.map(p => [p.id, p])).values());
    return Array.from(new Map(uniqueById.map(p => {
      const name = (p.nameAr || p.name || '').toString().trim().toLowerCase();
      return [name, p];
    })).values());
  }, [loadProductsByCategory, products]);

  const handleBrandClick = (brandId: string) => {
    setSelectedBrand(brandId);
    const brand = brands.find(b => b.id === brandId);
    if (brand) setSelectedBrandForEdit(brand);
    setCurrentView('brand-edit');
    onBrandSelect?.(brandId);
  };

  const handleDeleteBrand = async () => {
    if (!brandToDelete) return;
    
    setDeletingBrand(true);
    try {
      // Get all categories and products associated with this brand
      const brandCategories = Array.from(categoryBrandMap.entries())
        .filter(([_, brandId]) => brandId === brandToDelete.id)
        .map(([categoryId]) => categoryId);
      
      const brandProducts = products.filter(p => p.brandId === brandToDelete.id);
      
      // Delete the brand (this should cascade delete products if configured)
      await coreApi.deleteBrand(brandToDelete.id);
      
      // Remove category associations from localStorage
      if (brandCategories.length > 0) {
        setCategoryBrandMap(prev => {
          const newMap = new Map(prev);
          brandCategories.forEach(catId => newMap.delete(catId));
          saveCategoryBrandMap(newMap);
          return newMap;
        });
      }
      
      // Refresh all data
      if (onBrandsUpdate) onBrandsUpdate();
      if (onCategoriesUpdate) onCategoriesUpdate();
      if (onProductsUpdate) onProductsUpdate();
      
      // If we're viewing this brand, go back to categories view
      if (selectedBrand === brandToDelete.id) {
        setSelectedBrand(null);
        setCurrentView('categories');
        setCategoryPath([]);
        setSelectedCategory(null);
        onBrandSelect?.(null);
      }
      
      toast({
        title: t('common.success'),
        description: t('dashboard.hierarchical.brandDeleted', { 
          name: brandToDelete.nameAr || brandToDelete.name,
          categories: brandCategories.length,
          products: brandProducts.length
        }),
      });
      setShowDeleteBrandDialog(false);
      setBrandToDelete(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('dashboard.hierarchical.errors.deleteBrandFailed');
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setDeletingBrand(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    setDeletingCategory(true);
    try {
      // Check if category has subcategories or products
      const subcategories = categories.filter(c => c.parentId === categoryToDelete.id);
      const categoryProducts = await getProductsInCategory(categoryToDelete.id);

      // Delete the category
      await coreApi.deleteCategory(categoryToDelete.id);

      // Remove from categoryBrandMap
      setCategoryBrandMap(prev => {
        const newMap = new Map(prev);
        newMap.delete(categoryToDelete.id);
        saveCategoryBrandMap(newMap);
        return newMap;
      });

      // Refresh data
      if (onCategoriesUpdate) onCategoriesUpdate();
      if (onProductsUpdate) onProductsUpdate();

      // If we are currently viewing this category or inside it, go back
      if (selectedCategory === categoryToDelete.id || categoryPath.some(c => c.id === categoryToDelete.id)) {
        // Find parent category to navigate to
        const parentId = categoryToDelete.parentId;
        if (parentId) {
          // Go to parent category
          const parent = categories.find(c => c.id === parentId);
          if (parent) {
            // Reconstruct path up to parent
            const newPath = [];
            let current = parent;
            while (current) {
              newPath.unshift(current);
              if (current.parentId) {
                const p = categories.find(c => c.id === current.parentId);
                if (p) current = p;
                else break;
              } else {
                break;
              }
            }
            setCategoryPath(newPath);
            setSelectedCategory(parentId);
            setCurrentView('subcategories');
          } else {
            // Parent not found (shouldn't happen), go to root
            setCategoryPath([]);
            setSelectedCategory(null);
            setCurrentView('categories');
          }
        } else {
          // Top level category, go to root
          setCategoryPath([]);
          setSelectedCategory(null);
          setCurrentView('categories');
        }
      }

      toast({
        title: t('common.success'),
        description: t('dashboard.hierarchical.categoryDeleted', { 
          name: categoryToDelete.nameAr || categoryToDelete.name 
        }),
      });
      setShowDeleteCategoryDialog(false);
      setCategoryToDelete(null);
    } catch (error) {
      console.error('Failed to delete category:', error);
      toast({
        title: t('common.error'),
        description: t('dashboard.hierarchical.errors.deleteCategoryFailed'),
        variant: 'destructive',
      });
    } finally {
      setDeletingCategory(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    setDeletingProduct(true);
    try {
      await coreApi.deleteProduct(productToDelete.id);

      toast({
        title: t('common.success'),
        description: t('dashboard.hierarchical.productDeleted'),
      });

      // Refresh data
      if (onProductsUpdate) onProductsUpdate();
      
      // If we are currently viewing this product, clear it
      if (selectedProductForEdit === productToDelete.id) {
        setSelectedProductForEdit(null);
        setSelectedProductDetails(null);
        setEditingProductFormData(null);
        // Go back to the category view if possible
        if (selectedCategory) {
          setCurrentView('products');
        } else {
          setCurrentView('categories');
        }
      }

      setShowDeleteProductDialog(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast({
        title: t('common.error'),
        description: t('dashboard.hierarchical.errors.deleteProductFailed'),
        variant: 'destructive',
      });
    } finally {
      setDeletingProduct(false);
    }
  };

  // Unified handler for category clicks (works for both categories and subcategories)
  const handleCategoryClick = (category: Category, showEditForm = false) => {
      setSelectedCategory(category.id);
      setCategoryPath([...categoryPath, category]);
      setCurrentView('category-edit');
      setSelectedCategoryForEdit(category);
      onCategorySelect(category.id);
  };

  const handleBack = () => {
    if (currentView === 'products') {
      // If we have a selected brand, go back to subcategories view (where brands are listed)
      if (selectedBrand) {
        setSelectedBrand(null);
        setCurrentView('subcategories');
        return;
      }

      // Go back from products to subcategories or categories
      if (categoryPath.length > 0) {
        const newPath = [...categoryPath];
        const lastCategory = newPath.pop();
        setCategoryPath(newPath);
        
        if (newPath.length === 0) {
          // Back to categories view
          setCurrentView('categories');
          setSelectedCategory(null);
        } else {
          // Back to subcategories view
          setCurrentView('subcategories');
          setSelectedCategory(newPath[newPath.length - 1]?.id || null);
        }
      } else {
        // No path, go back to categories
        setCurrentView('categories');
        setSelectedCategory(null);
      }
    } else if (currentView === 'subcategories') {
      // Go back from subcategories
      if (categoryPath.length > 0) {
        const newPath = [...categoryPath];
        newPath.pop();
        setCategoryPath(newPath);
        
        if (newPath.length === 0) {
          // Back to categories view
          setCurrentView('categories');
          setSelectedCategory(null);
        } else {
          // Still in subcategories, update selected category
          setSelectedCategory(newPath[newPath.length - 1]?.id || null);
        }
      } else {
        // No path, go back to categories
        setCategoryPath([]);
        setCurrentView('categories');
        setSelectedCategory(null);
      }
    } else if (currentView === 'categories') {
      // Go back to root categories view
      setCategoryPath([]);
      setSelectedCategory(null);
      setCurrentPage(1);
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      // Clicked on brand in breadcrumb - Go to Brand Root (Categories)
      setCurrentView('categories');
      // Keep selectedBrand active
      setCategoryPath([]);
      setSelectedCategory(null);
    } else {
      // Clicked on a category in breadcrumb path
      const newPath = categoryPath.slice(0, index + 1);
      setCategoryPath(newPath);
      const targetCategory = newPath[newPath.length - 1];
      setSelectedCategory(targetCategory?.id || null);
      
      if (targetCategory) {
        onCategorySelect(targetCategory.id);
          setCurrentView('subcategories');
      }
    }
  };

  // 1. Grid Logic: Calculate current display items based on selected navigation
  const currentItems = useMemo(() => {
    // Brand List View
    if (currentView === 'brands' && !selectedBrand) {
      return brands.map(b => ({ ...b, type: 'brand' as const }));
    }

    // Top Level Categories View
    if (currentView === 'categories' && !selectedCategory && !selectedBrand) {
      return getTopLevelCategories().map(c => ({ ...c, type: 'category' as const }));
    }

    // Inside a Category View
    if ((currentView === 'categories' || currentView === 'subcategories') && selectedCategory && !selectedBrand) {
      const subcategories = getSubcategories(selectedCategory).map(c => ({ ...c, type: 'category' as const }));
      
      // Get Brands that are EITHER explicitly children of this category OR have products in this category
      const brandsInCat = brands
        .filter(b => {
            const isDirectChild = toStr(getBrandParentCategoryId(b)) === toStr(selectedCategory);
            // Also check if any product in this category belongs to this brand
            const hasProductsInCat = products.some(p => 
                toStr(p.brandId) === toStr(b.id) && 
                productHasCategory(p, selectedCategory!)
            );
            return isDirectChild || hasProductsInCat;
        })
        .map(b => ({ ...b, type: 'brand' as const }));
        
      // Check for unbranded products in this category to show "Other Products" folder
      const hasUnbranded = products.some(p => !p.brandId && productHasCategory(p, selectedCategory!));
      
      const otherFolder = hasUnbranded ? [{
        id: `${selectedCategory}-no-brand-group`,
        name: t('dashboard.products.otherProducts', 'منتجات أخرى'),
        nameAr: 'منتجات أخرى',
        type: 'brand' as const,
        isVirtual: true
      } as unknown as Brand] : [];

      return [...subcategories, ...brandsInCat, ...otherFolder];
    }
    
    return [];
  }, [currentView, selectedCategory, selectedBrand, brands, getTopLevelCategories, getSubcategories, products, t]);

  const currentProducts = useMemo(() => {
    let filtered = products;

    // Filter by Category if selected
    if (selectedCategory) {
       // Use allCategoryProducts if available (loaded from API), otherwise filter client-side
       if (allCategoryProducts.length > 0) {
         filtered = allCategoryProducts;
       } else {
         filtered = products.filter(p => productHasCategory(p, selectedCategory));
       }
    }

    if (selectedBrand) {
      // If virtual "No Brand" folder is selected
      if (selectedBrand.includes('-no-brand-group')) {
        const catId = selectedBrand.split('-no-brand-group')[0];
        return filtered.filter(p => !p.brandId && productHasCategory(p, catId));
      }
      // Normal brand
      return filtered.filter(p => toStr(p.brandId) === toStr(selectedBrand));
    }
    
    // If no brand selected but we are in products view (e.g. leaf category with no brands), show all products in category
    return filtered;
  }, [selectedBrand, products, selectedCategory, allCategoryProducts]);

  // Handle data loading triggers
  useEffect(() => {
    if (selectedCategory && !selectedBrand) {
       getProductsInCategory(selectedCategory).then(setAllCategoryProducts).catch(() => setAllCategoryProducts([]));
    }
  }, [selectedCategory, selectedBrand, getProductsInCategory]);

  // Reload products when products are updated
  useEffect(() => {
     if (onProductsUpdate) {
        const handleProductsUpdate = () => {
          if (selectedCategory) {
            getProductsInCategory(selectedCategory).then(setFilteredProducts).catch(() => setFilteredProducts([]));
          }
        };
        window.addEventListener('productsUpdated', handleProductsUpdate);
        return () => window.removeEventListener('productsUpdated', handleProductsUpdate);
     }
  }, [selectedCategory, onProductsUpdate, getProductsInCategory]);

  // Track previous data counts to detect significant changes (like after import)
  const prevDataCountRef = useRef({ brands: 0, categories: 0, products: 0 });
  
  // Reset internal state when data changes significantly (e.g., after import)
  // This ensures the tree view displays correctly with new data
  useEffect(() => {
    const currentCounts = {
      brands: brands.length,
      categories: categories.length,
      products: products.length
    };
    
    const prevCounts = prevDataCountRef.current;
    
    // Detect significant data change (likely after import)
    const significantChange = 
      Math.abs(currentCounts.brands - prevCounts.brands) > 10 ||
      Math.abs(currentCounts.categories - prevCounts.categories) > 5 ||
      Math.abs(currentCounts.products - prevCounts.products) > 50;
    
    if (significantChange && (prevCounts.brands > 0 || prevCounts.categories > 0 || prevCounts.products > 0)) {
      // Reset view to root when significant data change detected
      console.log('[HierarchicalExplorer] Significant data change detected, resetting view state');
      setSelectedCategory(null);
      setSelectedBrand(null);
      setCategoryPath([]);
      setCurrentView('categories');
      if (onBrandSelect) onBrandSelect(null);
    }
    
    // Validate selectedCategory still exists in the new categories list
    if (selectedCategory) {
      const categoryExists = categories.some(c => toStr(c.id) === toStr(selectedCategory));
      if (!categoryExists) {
        setSelectedCategory(null);
        setCategoryPath([]);
      }
    }
    
    // Validate selectedBrand still exists in the new brands list
    if (selectedBrand && !selectedBrand.includes('-no-brand-group')) {
      const brandExists = brands.some(b => toStr(b.id) === toStr(selectedBrand));
      if (!brandExists) {
        setSelectedBrand(null);
        if (onBrandSelect) onBrandSelect(null);
      }
    }
    
    // Clear expanded states for nodes that no longer exist
    setExpandedNodes(prev => {
      const next = new Set<string>();
      prev.forEach(id => {
        // Check if it's a category ID
        const isCategory = categories.some(c => toStr(c.id) === id);
        // Check if it's a brand ID
        const isBrand = brands.some(b => toStr(b.id) === id);
        if (isCategory || isBrand) {
          next.add(id);
        }
      });
      return next;
    });
    
    // Update ref with current counts
    prevDataCountRef.current = currentCounts;
  }, [brands, categories, products, selectedCategory, selectedBrand, onBrandSelect]);

  // Expanded states management
  useEffect(() => {
    if (selectedCategory && selectedBrand) {
      const categoryKey = `${selectedBrand}-${selectedCategory}`;
      if (!expandedCategories.has(categoryKey)) {
        setExpandedCategories(prev => new Set(prev).add(categoryKey));
      }
    }
  }, [selectedCategory, selectedBrand, expandedCategories]);

  const MAX_SUBCATEGORIES = 10;

  // Get current subcategory count for the active parent
  const getCurrentSubcategoryCount = (): number => {
    const parentId = (currentView === 'subcategories' || currentView === 'products') && selectedCategory 
      ? selectedCategory 
      : categoryPath.length > 0 
      ? categoryPath[categoryPath.length - 1].id 
      : undefined;
    
    if (!parentId) return 0;
    return categories.filter(cat => cat.parentId === parentId).length;
  };

  const subcategoryCount = getCurrentSubcategoryCount();
  const remainingSubcategories = MAX_SUBCATEGORIES - subcategoryCount;

  // Check if current location has subcategories (products can only be added to leaf categories)
  const currentLocationHasSubcategories = (): boolean => {
    // At brand level (categories view) - check if there are any categories
    if (currentView === 'categories' && selectedBrand) {
      // If there are any categories for this brand, can't add products here
      return currentItems.length > 0;
    }
    
    // At subcategories view - check if current categories are displayed
    if (currentView === 'subcategories') {
      return currentItems.length > 0;
    }
    
    // At products view - check if the selected category has any subcategories
    const currentCategoryId = selectedCategory || (categoryPath.length > 0 ? categoryPath[categoryPath.length - 1].id : undefined);
    if (!currentCategoryId) return false;
    return categories.some(cat => cat.parentId === currentCategoryId);
  };

  // Check if current location has products (subcategories can only be added when no products exist)
  const currentLocationHasProducts = (): boolean => {
    // At products view - check if there are products displayed
    if (currentView === 'products') {
      return currentProducts.length > 0;
    }
    return false;
  };

  const hasSubcategories = currentLocationHasSubcategories();
  const hasProducts = currentLocationHasProducts();
  
  // Products can only be added when there are NO subcategories (leaf node - empty folder)
  const canAddProduct = !hasSubcategories;
  
  // Subcategories can only be added when there are NO products AND limit not reached
  // Calculate category depth (how many levels deep this category is)
  // Returns the depth: 0 = brand level, 1 = top category, 2 = first subcategory, etc.
  const getCategoryDepth = useCallback((categoryId: string | null | undefined): number => {
    if (!categoryId) return 0;
    
    let depth = 0;
    let currentCategoryId: string | null | undefined = categoryId;
    
    // Traverse up the hierarchy to count levels
    while (currentCategoryId) {
      const category = categories.find(c => c.id === currentCategoryId);
      if (category?.parentId) {
        depth++;
        currentCategoryId = category.parentId;
      } else {
        break;
      }
    }
    
    // Add 1 for the current level (category itself is level 1, subcategory is level 2, etc.)
    return depth + 1;
  }, [categories]);

  // Get maximum depth allowed (10 levels: Brand->Category->Subcategory...->Subcategory(10)->Product)
  const MAX_DEPTH = 10;
  
  // Check if we can add more subcategories (depth must be less than MAX_DEPTH)
  const currentCategoryDepth = getCategoryDepth(selectedCategory);
  const canAddSubcategory = currentCategoryDepth < MAX_DEPTH && subcategoryCount < MAX_SUBCATEGORIES && !hasProducts;

  const sanitizeSlug = (slug: string) => {
    return slug
      .toLowerCase()
      .trim()
      .replace(/[\s_]+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const getFullCategoryPathIds = (categoryId: string): string[] => {
    const pathIds: string[] = [];
    let currentId: string | undefined = categoryId;
    
    while (currentId) {
      pathIds.unshift(currentId);
      const category = categories.find(c => c.id === currentId);
      currentId = category?.parentId;
    }
    
    return pathIds;
  };

  const findBrandForCategory = (categoryId: string): string | null => {
    let currentId: string | undefined = categoryId;
    let lastFoundBrandId: string | null = null;
    let topLevelCategoryId: string | null = null;
    
    while (currentId) {
      const brandId = categoryBrandMap.get(currentId);
      if (brandId) {
        lastFoundBrandId = brandId;
      }
      const category = categories.find(c => c.id === currentId);
      if (category && toStr(category.parentId) === "") {
        topLevelCategoryId = category.id;
      }
      currentId = category?.parentId;
    }
    
    if (lastFoundBrandId) return lastFoundBrandId;
    
    // Fallback: Check if there's a brand with the same name as the top-level category
    if (topLevelCategoryId) {
      const topCat = categories.find(c => c.id === topLevelCategoryId);
      if (topCat) {
        const matchingBrand = brands.find(b => 
          b.name.toLowerCase() === topCat.name.toLowerCase() || 
          (b.nameAr && topCat.nameAr && b.nameAr === topCat.nameAr)
        );
        if (matchingBrand) return matchingBrand.id;
      }
    }
    
    return null;
  };

  const getCategoryPathSlug = (categoryId: string): string => {
    const pathIds = getFullCategoryPathIds(categoryId);
    return pathIds
      .map(id => {
        const cat = categories.find(c => c.id === id);
        return cat ? sanitizeSlug(cat.name) : '';
      })
      .filter(Boolean)
      .join('-') + '-';
  };

  const handleCategoryFormSave = async (formData: CategoryFormData) => {
    const parentId = formData.parentId || categoryParentCategory || 
      ((currentView === 'subcategories' || currentView === 'products') && selectedCategory 
        ? selectedCategory 
        : categoryPath.length > 0 
        ? categoryPath[categoryPath.length - 1].id 
        : undefined);

    const targetCategory = editingCategory || selectedCategoryForEdit;

    if (targetCategory) {
      try {
        setUpdatingCategory(true);
        await coreApi.updateCategory(targetCategory.id, {
          name: formData.name,
          nameAr: formData.nameAr || undefined,
          description: formData.description || undefined,
          descriptionAr: formData.descriptionAr || undefined,
          slug: formData.slug ? sanitizeSlug(formData.slug) : undefined,
          parentId: parentId || undefined,
          image: formData.image || undefined,
          icon: formData.icon || undefined,
          isActive: formData.isActive,
        } as Record<string, unknown>);

        toast({
          title: t('common.success'),
          description: t('categories.productCategories.updateSuccess'),
        });

        if (onCategoriesUpdate) {
          onCategoriesUpdate();
        }

        setEditingCategory(null);
        setCategoryParentCategory(null);
        setShowCreateCategoryDialog(false);
      } catch (error: unknown) {
        console.error('Failed to update category:', error);
        toast({
          title: t('common.error'),
          description: t('categories.productCategories.saveError'),
          variant: 'destructive',
        });
        throw error;
      } finally {
        setUpdatingCategory(false);
      }
    } else {
      try {
        setCreatingCategory(true);
        const slug = formData.slug ? sanitizeSlug(formData.slug) : sanitizeSlug(formData.name);

        if (onCreateCategory) {
          await onCreateCategory({
            name: formData.name,
            nameAr: formData.nameAr || formData.name,
            description: formData.description,
            parentId,
            image: formData.image || undefined,
          });
        } else {
          await coreApi.createCategory({
            name: formData.name,
            nameAr: formData.nameAr || undefined,
            description: formData.description || undefined,
            descriptionAr: formData.descriptionAr || undefined,
            slug,
            parentId: parentId || undefined,
            image: formData.image || undefined,
            icon: formData.icon || undefined,
            isActive: formData.isActive,
          } as CreateCategoryData);
        }

        toast({
          title: t('common.success'),
          description: t('categories.productCategories.addSuccess'),
        });

        if (onCategoriesUpdate) {
          onCategoriesUpdate();
        }

        setCategoryParentCategory(null);
        setShowCreateCategoryDialog(false);
      } catch (error: unknown) {
        console.error('Failed to create category:', error);
        toast({
          title: t('common.error'),
          description: t('categories.productCategories.saveError'),
          variant: 'destructive',
        });
        throw error;
      } finally {
        setCreatingCategory(false);
      }
    }
  };

  const handleOpenProductForm = () => {
    setEditingProductId(null);
    setShowProductFormDialog(true);
  };

  const prepareProductData = (data: ProductFormData, images?: string[]) => {
    const cleaned: Record<string, unknown> = {
      name: data.name,
      nameAr: data.nameAr || undefined,
      description: data.description || undefined,
      descriptionAr: data.descriptionAr || undefined,
      sku: data.sku || undefined,
      barcode: data.barcode || undefined,
      price: parseFloat(data.price) || 0,
      compareAtPrice: data.compareAtPrice ? parseFloat(data.compareAtPrice) : undefined,
      costPerItem: data.cost ? parseFloat(data.cost) : undefined,
      stockCount: data.stock ? parseInt(data.stock) : undefined,
      weight: data.weight ? parseFloat(data.weight) : undefined,
      dimensions: data.dimensions || undefined,
      seoTitle: data.metaTitle || undefined,
      seoDescription: data.metaDescription || undefined,
      featured: !!data.featured,
      categoryIds: data.categoryIds || (data.categoryId ? [data.categoryId] : []),
      brandId: data.brandId || undefined,
      unitId: data.unitId || undefined,
      productCode: data.productCode || undefined,
      odooProductId: data.odooProductId || undefined,
      min: data.minQuantity ? parseInt(data.minQuantity) : undefined,
      max: data.maxQuantity ? parseInt(data.maxQuantity) : undefined,
      enableSlider: !!data.enableSlider,
      tags: Array.isArray(data.tags) ? data.tags : (data.tags ? data.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []),
    };

    // Add images if provided
    if (images && images.length > 0) {
      cleaned.images = images.map((url, index) => ({
        url,
        altText: data.name || `Product image ${index + 1}`,
        sortOrder: index,
      }));
    }

    // Remove undefined fields
    Object.keys(cleaned).forEach(key => cleaned[key] === undefined && delete cleaned[key]);
    
    return cleaned;
  };

  const handleProductFormSave = async (data: ProductFormData, images?: string[]) => {
    // Prevent double submission
    if (isSavingProduct) {
      return;
    }
    
    setIsSavingProduct(true);
    try {
      const preparedData = prepareProductData(data, images);
      let productCreated = false;
      
      const targetProductId = editingProductId || selectedProductForEdit;

      if (targetProductId) {
        await coreApi.patch(`/products/${targetProductId}`, preparedData);
        toast({
          title: t('common.success'),
          description: t('dashboard.products.messages.productUpdated'),
        });
      } else {
        if (onCreateProduct) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await onCreateProduct(preparedData as any);
          productCreated = true; // onCreateProduct already calls loadData(), so skip onProductsUpdate
        } else {
          await coreApi.post('/products', preparedData);
        }
        toast({
          title: t('common.success'),
          description: t('dashboard.products.messages.productCreated'),
        });
      }
      
      setShowProductFormDialog(false);
      setEditingProductId(null);
      
      // Only call onProductsUpdate if onCreateProduct wasn't used (since it already refreshes data)
      if (!productCreated && onProductsUpdate) {
        onProductsUpdate();
      }
      
      // Refresh products list
      if (selectedCategory) {
        const updatedProducts = await getProductsInCategory(selectedCategory);
        setFilteredProducts(updatedProducts);
      }
    } catch (error) {
      console.error('Failed to save product:', error);
      toast({
        title: t('common.error'),
        description: t('dashboard.products.messages.saveError'),
        variant: 'destructive',
      });
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryData.name.trim()) {
      toast({
        title: t('common.error'),
        description: t('categories.productCategories.categoryName') + ' ' + t('common.required'),
        variant: 'destructive',
      });
      return;
    }

    // If editing, update the category
    if (editingCategory) {
      try {
        setUpdatingCategory(true);
        await coreApi.updateCategory(editingCategory.id, {
          name: newCategoryData.name,
          nameAr: newCategoryData.nameAr || undefined,
          description: newCategoryData.description || undefined,
          parentId: categoryParentCategory || undefined,
          image: newCategoryData.image || undefined,
        } as Record<string, unknown>);

        toast({
          title: 'نجح',
          description: 'تم تحديث الفئة بنجاح',
        });

        // Refresh categories
        if (onCategoriesUpdate) {
          onCategoriesUpdate();
        }

        // Clear form and close dialog
        setNewCategoryData({ name: '', nameAr: '', description: '', image: '' });
        setEditingCategory(null);
        setCategoryParentCategory(null);
        setShowCreateCategoryDialog(false);
        return;
      } catch (error: unknown) {
        console.error('Failed to update category:', error);
        toast({
          title: 'تعذر تحديث الفئة',
          description: 'حدث خطأ أثناء تحديث الفئة. يرجى المحاولة مرة أخرى.',
          variant: 'destructive',
        });
        return;
      } finally {
        setUpdatingCategory(false);
      }
    }

    // Determine parentId: 
    // 1. If categoryParentCategory is set (from context menu), use it
    // 2. If we're in subcategories or products view, use the selected category
    // 3. Otherwise, use the last category in the path
    let parentId: string | undefined;
    if (categoryParentCategory) {
      parentId = categoryParentCategory;
    } else {
      parentId = (currentView === 'subcategories' || currentView === 'products') && selectedCategory 
        ? selectedCategory 
        : categoryPath.length > 0 
        ? categoryPath[categoryPath.length - 1].id 
        : undefined;
    }

    // Check subcategory limit (max 10 subcategories per parent)
    if (parentId) {
      const existingSubcategories = categories.filter(cat => cat.parentId === parentId);
      if (existingSubcategories.length >= MAX_SUBCATEGORIES) {
        toast({
          title: t('dashboard.categories.productCategories.maxSubcategoriesReached'),
          description: t('dashboard.categories.productCategories.maxSubcategoriesDesc', { max: MAX_SUBCATEGORIES }),
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      setCreatingCategory(true);

      if (onCreateCategory) {
        const newCategory = await onCreateCategory({
          name: newCategoryData.name,
          nameAr: newCategoryData.nameAr || newCategoryData.name,
          description: newCategoryData.description,
          parentId,
          image: newCategoryData.image || undefined,
        });
        
        toast({
          title: 'نجح',
          description: 'تم إنشاء الفئة بنجاح',
        });

        // Small delay to ensure state updates before refresh
        await new Promise(resolve => setTimeout(resolve, 100));

        // Refresh categories - this will trigger a reload
        if (onCategoriesUpdate) {
          onCategoriesUpdate();
        }

        // If we created a subcategory for the current selected category, switch to subcategories view
        if (parentId && parentId === selectedCategory && currentView === 'products') {
          setCurrentView('subcategories');
        }

        // Auto-expand parent node to show new subcategory
        if (parentId) {
          setExpandedNodes(prev => {
            const next = new Set(prev);
            next.add(parentId);
            return next;
          });
        }

        // Force a refresh - the useEffect that watches categories will handle the rest

        // Clear form and close dialog
        setNewCategoryData({ name: '', nameAr: '', description: '', image: '' });
        setEditingCategory(null);
        setCategoryParentCategory(null);
        setShowCreateCategoryDialog(false);
        
        // If category was created under a brand, navigate to that brand
        if (categoryParentBrand) {
          setSelectedBrand(categoryParentBrand);
          setCurrentView('categories');
          setCategoryPath([]);
        }

        // If category was created under a parent category, ensure we are in that view
        if (parentId && selectedBrand) {
          // If we are already in the parent category, the new subcategory will appear automatically
          // If we were in a different view, we might want to navigate
          if (selectedCategory !== parentId) {
            const parent = categories.find(c => c.id === parentId);
            if (parent) {
              setSelectedCategory(parentId);
              // Reconstruct path if needed, or just add to current path if it's a child
              if (!categoryPath.some(c => c.id === parentId)) {
                setCategoryPath([...categoryPath, parent]);
              }
              setCurrentView('subcategories');
            }
          }
        }
      } else {
        // Fallback: use coreApi directly
        const categoryData: { name: string; description?: string; image?: string; parentId?: string } = {
          name: newCategoryData.name,
          description: newCategoryData.description,
          image: newCategoryData.image || undefined,
        };
        
        if (parentId) {
          categoryData.parentId = parentId;
        }

        await coreApi.createCategory(categoryData);
        
        toast({
          title: 'نجح',
          description: 'تم إنشاء الفئة بنجاح',
        });

        if (onCategoriesUpdate) {
          onCategoriesUpdate();
        }

        setNewCategoryData({ name: '', nameAr: '', description: '', image: '' });
        setShowCreateCategoryDialog(false);
      }
    } catch (error: unknown) {
      console.error('Failed to create category:', error);
      toast({
        title: 'تعذر إنشاء الفئة',
        description: 'حدث خطأ أثناء إنشاء الفئة الجديدة. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleCreateBrand = async (data?: { name: string; nameAr?: string; code?: string; logo?: string }) => {
    const brandData = data || newBrandData;
    const targetBrand = editingBrand || selectedBrandForEdit;

    if (!brandData.name.trim()) {
      toast({
        title: 'اسم العلامة التجارية مطلوب',
        description: 'يرجى إدخال اسم للعلامة التجارية',
        variant: 'destructive',
      });
      return;
    }

    try {
      setCreatingBrand(true);
      
      if (targetBrand) {
        // Update existing brand
        await coreApi.updateBrand(targetBrand.id, {
          name: brandData.name,
          nameAr: brandData.nameAr || undefined,
          code: brandData.code || undefined,
          logo: brandData.logo || undefined,
        });
        
        toast({
          title: 'نجح',
          description: 'تم تحديث العلامة التجارية بنجاح',
        });
      } else {
        // Create new brand
        if (onCreateBrand) {
          await onCreateBrand({
            name: brandData.name,
            nameAr: brandData.nameAr || brandData.name,
            code: brandData.code || undefined,
            logo: brandData.logo || undefined,
          });
        } else {
          await coreApi.createBrand({
            name: brandData.name,
            nameAr: brandData.nameAr || undefined,
            code: brandData.code || undefined,
            logo: brandData.logo || undefined,
          });
        }
        
        toast({
          title: 'نجح',
          description: 'تم إنشاء العلامة التجارية بنجاح',
        });
      }

      if (onBrandsUpdate) {
        onBrandsUpdate();
      }

      setNewBrandData({ name: '', nameAr: '', code: '', logo: '' });
      setEditingBrand(null);
      setShowCreateBrandDialog(false);
    } catch (error) {
      console.error('Failed to save brand:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حفظ العلامة التجارية. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setCreatingBrand(false);
    }
  };

  const [showLinkCategoryDialog, setShowLinkCategoryDialog] = useState(false);
  const [categoryToLink, setCategoryToLink] = useState<string>('');

  const handleLinkCategory = () => {
    if (!categoryToLink || !selectedBrand) return;

    setCategoryBrandMap(prev => {
      const newMap = new Map(prev);
      newMap.set(categoryToLink, selectedBrand);
      saveCategoryBrandMap(newMap);
      return newMap;
    });

    toast({
      title: 'تم ربط الفئة',
      description: 'تم ربط الفئة بالعلامة التجارية بنجاح',
    });

    setShowLinkCategoryDialog(false);
    setCategoryToLink('');
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Import progress state
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, currentItem: '' });

  const handleDeleteAll = () => {
    setShowDeleteAllDialog(true);
  };

  const executeDeleteAll = async () => {

    // Helper to calculate depth for topological sort (Children first)
    const getCategoryDepth = (catId: string, allCats: Category[]): number => {
      let depth = 0;
      let current = allCats.find(c => c.id === catId);
      while (current?.parentId) {
        depth++;
        current = allCats.find(c => c.id === current.parentId);
        if (depth > 20) break;
      }
      return depth;
    };
    
    setIsImporting(true);
    isImportCancelled.current = false;
    setImportProgress({ current: 0, total: 100, currentItem: 'جاري كشف البيانات...' });
    
    // Helper for rate-limited requests
    const processWithRetry = async (fn: () => Promise<unknown>, maxRetries = 3) => {
      for (let i = 0; i < maxRetries; i++) {
        if (isImportCancelled.current) throw new Error('Cancelled');
        try {
          return await fn();
        } catch (error: unknown) {
          const err = error as { response?: { status?: number } };
          const isRateLimited = err.response?.status === 429;
          
          if (isRateLimited && i < maxRetries - 1) {
             const delay = 1000 * Math.pow(2, i);
             await new Promise(resolve => setTimeout(resolve, delay));
             continue;
          }
          // If 404, assume already deleted
          if (err.response?.status === 404) return;
          throw error;
        }
      }
    };

    try {
        // Helper to fetch all pages
        const fetchAllItems = async (endpoint: string): Promise<unknown[]> => {
             let allItems: unknown[] = [];
             let page = 1;
             const limit = 500; // Reasonable batch size
             
             while (true) {
                 if (isImportCancelled.current) break;
                 // Add query param separator correctly
                 const separator = endpoint.includes('?') ? '&' : '?';
                 const res = await coreApi.get(`${endpoint}${separator}page=${page}&limit=${limit}`);
                 const items = extractArray(res);
                 
                 if (!items || items.length === 0) break;
                 allItems = [...allItems, ...items];
                 
                 // If we got fewer items than limit, we've reached the end
                 if (items.length < limit) break;
                 page++;
                 
                 // Safety break to prevent infinite loops
                 if (page > 1000) break; 
                 await new Promise(r => setTimeout(r, 50)); // Small throttle
             }
             return allItems;
        };

        console.log('🗑️ Delete All: Fetching all data recursively...');
        
        // Helper to extract array from response (hoisted for use in fetchAllItems)
        const extractArray = (res: unknown): unknown[] => {
            if (Array.isArray(res)) return res;
            if (!res || typeof res !== 'object') return [];
            
            const r = res as Record<string, unknown>;
            if (r.data && Array.isArray(r.data)) return r.data;
            if (r.products && Array.isArray(r.products)) return r.products;
            if (r.categories && Array.isArray(r.categories)) return r.categories;
            if (r.brands && Array.isArray(r.brands)) return r.brands;
            
            // Try to find any array property
            const val = Object.values(r).find(v => Array.isArray(v));
            if (val) return val as unknown[];
            
            return [];
        };

        const [productsRes, categoriesRes, brandsRes] = await Promise.all([
             fetchAllItems('/products'),
             fetchAllItems('/categories'),
             fetchAllItems('/brands')
        ]);

        const allProducts = extractArray(productsRes);
        const allCategories = extractArray(categoriesRes);
        const allBrands = extractArray(brandsRes);
        
        console.log('🗑️ Delete All: Found items', { 
            products: allProducts.length, 
            categories: allCategories.length, 
            brands: allBrands.length 
        });

        const total = allProducts.length + allCategories.length + allBrands.length;
        
        if (total === 0) {
            toast({ description: 'لا توجد بيانات لحذفها' });
            setIsImporting(false);
            return;
        }

        setImportProgress({ current: 0, total, currentItem: 'جاري الحذف...' });
        let processed = 0;

        // 1. Delete Products (Leaves)
        for (let i = 0; i < allProducts.length; i++) {
            if (isImportCancelled.current) break;
            const p = allProducts[i] as Product;
            await processWithRetry(() => coreApi.deleteProduct(p.id));
            processed++;
            setImportProgress({ current: processed, total, currentItem: `حذف منتج: ${p.name}` });
            
            // Add batch delay every 10 items
            if (i % 10 === 0) await new Promise(r => setTimeout(r, 200));
        }

        // 2. Delete Categories (Deepest first)
        // Re-map categories to include parentId properly for sorting
        const mappedCats = allCategories.map(c => {
            const cat = c as Category & { parentId?: string | { id: string } };
            return {
                ...cat,
                parentId: typeof cat.parentId === 'object' && cat.parentId ? (cat.parentId as { id: string }).id : (cat.parentId as string | undefined)
            };
        });
        
        const sortedCats = [...mappedCats].sort((a,b) => getCategoryDepth(b.id, mappedCats) - getCategoryDepth(a.id, mappedCats));
        
        for (let i = 0; i < sortedCats.length; i++) {
             if (isImportCancelled.current) break;
             const c = sortedCats[i] as Category;
             await processWithRetry(() => coreApi.deleteCategory(c.id));
             processed++;
             setImportProgress({ current: processed, total, currentItem: `حذف فئة: ${c.name}` });
             if (i % 10 === 0) await new Promise(r => setTimeout(r, 200));
        }

        // 3. Delete Brands
        for (let i = 0; i < allBrands.length; i++) {
             if (isImportCancelled.current) break;
             const b = allBrands[i] as Brand;
             await processWithRetry(() => coreApi.deleteBrand(b.id));
             processed++;
             setImportProgress({ current: processed, total, currentItem: `حذف علامة تجارية: ${b.name}` });
             if (i % 10 === 0) await new Promise(r => setTimeout(r, 200));
        }

        toast({ description: 'تم حذف جميع البيانات بنجاح' });
        
        // Refresh
        if (onBrandsUpdate) onBrandsUpdate();
        if (onCategoriesUpdate) onCategoriesUpdate();
        if (onProductsUpdate) onProductsUpdate();
        
        // Reset local maps
        setCategoryBrandMap(new Map());
        saveCategoryBrandMap(new Map());

    } catch (error: unknown) {
        console.error(error);
        const err = error as Error;
        if (err.message !== 'Cancelled') {
             toast({ title: 'خطأ', variant: 'destructive', description: 'حدث خطأ أثناء الحذف' });
        }
    } finally {
        setIsImporting(false);
    }
  };

  const handleExport = () => {
    // Helper to get category path
    const getCategoryPath = (categoryId: string): string => {
      const category = categories.find(c => c.id === categoryId);
      if (!category) return '';
      
      const parentPath = category.parentId ? getCategoryPath(category.parentId) : '';
      return parentPath ? `${parentPath} > ${category.name}` : category.name;
    };

    // Prepare data for Excel
    const categoriesData = categories.map(c => {
      const parent = categories.find(cat => cat.id === c.parentId);
      return {
        ID: c.id,
        Name: c.name,
        NameAr: c.nameAr || '',
        ParentID: c.parentId || '',
        ParentName: parent?.name || '',
        Path: getCategoryPath(c.id),
        Description: c.description || '',
        Image: c.image || ''
      };
    });

    const productsData = products.map(p => {
      // Get category IDs and Paths
      const productCategories = p.categories?.map(c => {
        const catId = c.categoryId || c.category?.id || c.id;
        return categories.find(cat => cat.id === catId);
      }).filter(Boolean) as Category[];

      const categoryIds = productCategories.map(c => c.id).join(',');
      const categoryPaths = productCategories.map(c => getCategoryPath(c.id)).join(' | ');
      
      const brand = brands.find(b => b.id === (p.brandId || ''));

      return {
        ID: p.id,
        Name: p.name,
        NameAr: p.nameAr || '',
        Description: p.description || '',
        DescriptionAr: p.descriptionAr || '',
        Price: p.price || 0,
        Cost: p.cost || 0,
        SKU: p.sku || '',
        Barcode: p.barcode || '',
        Stock: p.stock || 0,
        BrandID: p.brandId || '',
        BrandName: brand?.name || '',
        CategoryIDs: categoryIds,
        CategoryPaths: categoryPaths,
        Status: p.status || 'ACTIVE',
        Images: p.images?.join(',') || '',
        Featured: p.featured ? 'Yes' : 'No'
      };
    });

    const brandsData = brands.map(b => ({
      ID: b.id,
      Name: b.name,
      NameAr: b.nameAr || '',
      Code: b.code || '',
      Logo: b.logo || ''
    }));

    // Create workbook and sheets
    const wb = XLSX.utils.book_new();
    
    const wsCategories = XLSX.utils.json_to_sheet(categoriesData);
    XLSX.utils.book_append_sheet(wb, wsCategories, "Categories");
    
    const wsProducts = XLSX.utils.json_to_sheet(productsData);
    XLSX.utils.book_append_sheet(wb, wsProducts, "Products");
    
    const wsBrands = XLSX.utils.json_to_sheet(brandsData);
    XLSX.utils.book_append_sheet(wb, wsBrands, "Brands");

    // Generate Excel file
    XLSX.writeFile(wb, `hierarchical-data-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: 'تم التصدير',
      description: 'تم تصدير البيانات إلى ملف Excel بنجاح',
    });
  };



  const startImportProcess = async () => {
    if (!importPreview) return;
    
    setShowImportPreviewDialog(false);
    setIsImporting(true);
    setImportErrors([]);
    const localErrors: {item: string, reason: string}[] = [];
    isImportCancelled.current = false;
    
    const totalItems = importPreview.categories.length + importPreview.products.length + (importPreview.brands?.length || 0);
    setImportProgress({ current: 0, total: totalItems, currentItem: 'جاري البدء...' });
    
    let processed = 0;
    let successCount = 0;
    const idMapping: Record<string, string> = {}; 
    const brandIdMapping: Record<string, string> = {};

    const processWithRetry = async <T,>(fn: () => Promise<T>, maxRetries = 5): Promise<T> => {
      for (let i = 0; i < maxRetries; i++) {
        if (isImportCancelled.current) throw new Error('Cancelled');
        try {
          return await fn();
        } catch (error: unknown) {
          const err = error as { response?: { status?: number } };
          const isRateLimited = err.response?.status === 429;
          if (isRateLimited && i < maxRetries - 1) {
            const delay = 2000 * Math.pow(2, i); // Increased base delay to 2s
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          // If it's a 500 error, also retry a few times
          if (err.response?.status && err.response.status >= 500 && i < maxRetries - 1) {
             await new Promise(resolve => setTimeout(resolve, 1000));
             continue;
          }
          throw error;
        }
      }
      throw new Error('Process failed after retries');
    };

    // 1. Import Categories
    const sortedCategories = [...importPreview.categories].sort((a, b) => {
        if (!a.parentId && b.parentId) return -1;
        if (a.parentId && !b.parentId) return 1;
        return 0;
    });

    const remainingCategories = [...sortedCategories];
    const processedCategoryIds = new Set<string>();
    let maxIterations = 10;
    
    while (remainingCategories.length > 0 && maxIterations > 0) {
      maxIterations--;
      const categoriesToProcess: typeof remainingCategories = [];
      const categoriesToDefer: typeof remainingCategories = [];
      
      for (const category of remainingCategories) {
        if (isImportCancelled.current) break;
        const canProcess = !category.parentId || processedCategoryIds.has(category.parentId) || idMapping[category.parentId];
        if (canProcess) categoriesToProcess.push(category);
        else categoriesToDefer.push(category);
      }
      
      if (categoriesToProcess.length === 0 && categoriesToDefer.length > 0) {
        categoriesToProcess.push(...categoriesToDefer);
        categoriesToDefer.length = 0;
      }
      
      for (const category of categoriesToProcess) {
        if (isImportCancelled.current) break;
        processed++;
        setImportProgress({ current: processed, total: totalItems, currentItem: `فئة: ${category.nameAr || category.name}` });

        try {
          if (category.status === 'EXISTING') {
            if (category.id && category.existingId) {
              idMapping[category.id] = category.existingId;
              processedCategoryIds.add(category.id);
            }
          } else {
            const mappedParentId = category.parentId ? (idMapping[category.parentId] || category.parentId) : undefined;
            const categoryData = {
              name: category.name,
              nameAr: category.nameAr,
              description: category.description,
              parentId: mappedParentId || undefined,
              image: category.image,
              isActive: true
            };
            const response = await processWithRetry(() => coreApi.post('/categories', categoryData, { requireAuth: true }));
            const newId = (response as { id?: string; category?: { id: string }; data?: { id: string } }).id || (response as { category?: { id: string } }).category?.id || (response as { data?: { id: string } }).data?.id;
            if (category.id && newId) {
              idMapping[category.id] = newId;
              processedCategoryIds.add(category.id);
            }
            successCount++;
          }
        } catch (error: unknown) {
          console.error('Failed to import category:', category.name, error);
          const err = error as { response?: { data?: { message?: string } }; message?: string };
          const errorObj = { item: category.nameAr || category.name, reason: err?.response?.data?.message || err.message || 'Error' };
          localErrors.push(errorObj);
          setImportErrors(prev => [...prev, errorObj]);
          if (category.id) processedCategoryIds.add(category.id);
        }
        await new Promise(resolve => setTimeout(resolve, 300)); // Increased delay to 300ms
      }
      remainingCategories.length = 0;
      remainingCategories.push(...categoriesToDefer);
    }

    // 2. Import Brands
    const brandsToImport = importPreview.brands || [];
    for (const brand of brandsToImport) {
        if (isImportCancelled.current) break;
        processed++;
        setImportProgress({ current: processed, total: totalItems, currentItem: `علامة تجارية: ${brand.nameAr || brand.name}` });
        try {
            if (brand.status === 'EXISTING') {
                if (brand.id && brand.existingId) brandIdMapping[brand.id] = brand.existingId;
                const rawPCatId = getBrandParentCategoryId(brand);
                const realPCatId = (rawPCatId && idMapping[rawPCatId]) ? idMapping[rawPCatId] : rawPCatId;
                if (brand.existingId && realPCatId) {
                     setCategoryBrandMap(prev => {
                         const newMap = new Map(prev);
                         newMap.set(brand.existingId, realPCatId);
                         saveCategoryBrandMap(newMap);
                         return newMap;
                     });
                }
            } else {
                const brandData = { name: brand.name, nameAr: brand.nameAr, code: brand.code, logo: brand.logo };
                const response = await processWithRetry(() => coreApi.post('/brands', brandData, { requireAuth: true }));
                const parsedResponse = response as { id?: string };
                if (brand.id && parsedResponse.id) {
                    brandIdMapping[brand.id] = parsedResponse.id;
                    const rawPCatId = getBrandParentCategoryId(brand);
                    const realPCatId = (rawPCatId && idMapping[rawPCatId]) ? idMapping[rawPCatId] : rawPCatId;
                    if (realPCatId) {
                        setCategoryBrandMap(prev => {
                            const newMap = new Map(prev);
                            newMap.set(parsedResponse.id!, realPCatId);
                            saveCategoryBrandMap(newMap);
                            return newMap;
                        });
                    }
                }
                successCount++;
            }
        } catch (error: unknown) {
            console.error('Failed to import brand:', brand.name, error);
            const err = error as { response?: { data?: { message?: string } }, message?: string };
            const errorObj = { item: brand.nameAr || brand.name, reason: err?.response?.data?.message || err.message || 'Error' };
            localErrors.push(errorObj);
            setImportErrors(prev => [...prev, errorObj]);
        }
        await new Promise(resolve => setTimeout(resolve, 300)); // Increased delay to 300ms
    }

    // 3. Import Products
    const batches = [];
    const productsToImport = importPreview.products || [];
    // Reduced batch size to 1 to avoid rate limits
    for (let i = 0; i < productsToImport.length; i += 1) {
      batches.push(productsToImport.slice(i, i + 1));
    }

    for (const batch of batches) {
      if (isImportCancelled.current) break;
      await Promise.all(batch.map(async (product) => {
          if (isImportCancelled.current) return;
          try {
            if (product.status === 'EXISTING') return;
            const mappedCategoryIds = (product.categoryIds || []).map((id: string) => idMapping[id] || id).filter(Boolean);
            const mappedBrandId = product.brandId ? (brandIdMapping[product.brandId] || product.brandId) : undefined;
            const productData = {
              name: product.name, nameAr: product.nameAr, description: product.description, descriptionAr: product.descriptionAr,
              price: product.price, cost: product.cost, sku: product.sku, barcode: product.barcode,
              stockCount: product.stock || 0, categoryIds: mappedCategoryIds, brandId: mappedBrandId,
              isAvailable: product.statusProp === 'ACTIVE', images: product.images, featured: product.featured
            };
            await processWithRetry(() => coreApi.post('/products', productData, { requireAuth: true }));
            successCount++;
          } catch (error: unknown) {
            console.error('Failed to import product:', product.name, error);
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            const errorObj = { item: product.nameAr || product.name, reason: err?.response?.data?.message || 'Error' };
            localErrors.push(errorObj);
            setImportErrors(prev => [...prev, errorObj]);
          }
      }));
      processed += batch.length;
      setImportProgress({ current: processed, total: totalItems, currentItem: `تم معالجة ${processed} من ${totalItems}` });
      await new Promise(resolve => setTimeout(resolve, 800)); // Increased delay to 800ms
    }

    setIsImporting(false);
    if (localErrors.length > 0) setShowImportResultDialog(true);
    else if (isImportCancelled.current) toast({ title: 'تم الإلغاء', description: 'تم إلغاء عملية الاستيراد.' });
    else toast({ title: 'تم الاستيراد بنجاح', description: `تم استيراد ${successCount} عنصر.` });

    if (onCategoriesUpdate) await onCategoriesUpdate();
    if (onBrandsUpdate) await onBrandsUpdate();
    if (onProductsUpdate) await onProductsUpdate();
  };

  // 1. Get products in a category (and optionally brand)
  const getProductsForCategory = useCallback((categoryId: string, brandId?: string): Product[] => {
    // Helper to safely access _id
    const getId = (item: unknown): string | undefined => {
        if (!item || typeof item !== 'object') return undefined;
        return (item as { _id?: string })._id;
    };

    const targetCat = categories.find(c => c.id === categoryId || getId(c) === categoryId);
    const catIds = [toStr(categoryId)];
    if (targetCat) {
        catIds.push(toStr(targetCat.id));
        const mongoId = getId(targetCat);
        if (mongoId) catIds.push(toStr(mongoId));
    }

    const filtered = products.filter(p => {
      const hasCategory = p.categories?.some((pc: ProductCategory) => {
        const pid = toStr(pc.categoryId || pc.id || pc.category?.id || getId(pc.category));
        return catIds.includes(pid);
      }) || (p as unknown as { categoryIds?: unknown[] }).categoryIds?.some((id: unknown) => catIds.includes(toStr(id))) || false;
      
      let hasBrand = true;
      if (brandId) {
          const targetBrand = brands.find(b => b.id === brandId || getId(b) === brandId);
          const bIds = [toStr(brandId)];
          if (targetBrand) {
              bIds.push(toStr(targetBrand.id));
              const mongoId = getId(targetBrand);
              if (mongoId) bIds.push(toStr(mongoId));
          }
          hasBrand = bIds.includes(toStr(p.brandId));
      }
      
      return hasCategory && hasBrand;
    });

    return Array.from(new Map(filtered.map(p => [p.id, p])).values());
  }, [products, categories, brands]);

  // 2. Tree Logic: Build Category > Brand > Product structure
  const buildCategoryTree = useCallback((allCats: Category[]): TreeNode[] => {
    const visited = new Set<string>(); // Track visited categories to prevent infinite recursion
    
    const getNodesForParent = (parentId?: string): TreeNode[] => {
      const currentCats = allCats.filter(c => toStr(c.parentId) === toStr(parentId || ""));

      return currentCats.map(cat => {
        // Prevent infinite recursion from circular references
        if (visited.has(cat.id)) {
          console.warn(`[HierarchicalExplorer] Circular reference detected for category "${cat.name}" (ID: ${cat.id}), skipping children`);
          return {
            id: cat.id,
            type: 'category',
            data: cat,
            name: (cat.nameAr || cat.name) as string,
            children: [] // Return empty children to break the cycle
          };
        }
        
        visited.add(cat.id);
        const subcatNodes = getNodesForParent(cat.id);
        visited.delete(cat.id); // Remove after processing to allow same category in different branches

        const brandNodes: TreeNode[] = brands
          .filter(b => toStr(getBrandParentCategoryId(b)) === toStr(cat.id))
          .map(brand => {
            const brandProducts = products.filter(p => toStr(p.brandId) === toStr(brand.id));
            const productNodes: TreeNode[] = brandProducts.map(p => ({
                id: toStr(p.id),
                type: 'product',
                data: p,
                name: (p.nameAr || p.name) as string,
                children: []
            }));

            return {
                id: `${cat.id}-brand-${brand.id}`,
                type: 'brand',
                data: brand,
                name: (brand.nameAr || brand.name) as string,
                children: productNodes
            };
        });

        const unbrandedProducts = products.filter(p => 
            !p.brandId && p.categories?.some(pc => toStr(pc.categoryId || pc.id) === toStr(cat.id))
        );
        
        if (unbrandedProducts.length > 0) {
            brandNodes.push({
                id: `${cat.id}-no-brand-group`,
                type: 'brand',
                data: { id: 'no-brand', name: 'Other Products', nameAr: 'منتجات أخرى' } as unknown as Brand,
                name: t('dashboard.products.otherProducts', 'منتجات أخرى'),
                children: unbrandedProducts.map(p => ({
                    id: toStr(p.id),
                    type: 'product',
                    data: p,
                    name: (p.nameAr || p.name) as string,
                    children: []
                }))
            });
        }

        return {
            id: cat.id,
            type: 'category',
            data: cat,
            name: (cat.nameAr || cat.name) as string,
            children: [...subcatNodes, ...brandNodes]
        };
      });
    };

    return getNodesForParent();
  }, [brands, products, t]);

  const treeData = useMemo(() => {
    return buildCategoryTree(categories);
  }, [buildCategoryTree, categories]);

  // Helper to get breadcrumb path
  const getBreadcrumbPath = () => {
    const path: { id: string, name: string, type: 'category' | 'brand' | 'product' }[] = [];
    
    if (categoryPath.length > 0) {
        path.push(...categoryPath.map(c => ({ id: c.id, name: (c.nameAr || c.name) as string, type: 'category' as const })));
    } else if (selectedCategory) {
        const cat = categories.find(c => c.id === selectedCategory);
        if (cat) path.push({ id: cat.id, name: (cat.nameAr || cat.name) as string, type: 'category' as const });
    }

    if (selectedBrand) {
        const brand = brands.find(b => b.id === selectedBrand);
        if (brand) path.push({ id: brand.id, name: (brand.nameAr || brand.name) as string, type: 'brand' as const });
    }

    return path;
  };

  const BreadcrumbDisplay = () => {
      const path = getBreadcrumbPath();
      if (path.length === 0) return null;

      return (
          <div className="flex items-center gap-2 mb-4 px-4 py-2 bg-muted/20 rounded-lg text-sm">
              <div 
                className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors"
                onClick={() => {
                    setSelectedCategory(null);
                    setSelectedBrand(null);
                    setCategoryPath([]);
                    setCurrentView('categories');
                }}
              >
                 <Home className="w-4 h-4" />
                 <span>الرئيسية</span>
              </div>
              
              {path.map((item, idx) => (
                  <React.Fragment key={item.id}>
                      <ChevronRight className={`w-4 h-4 text-muted-foreground ${isRtl ? 'rotate-180' : ''}`} />
                      <span 
                        className={`font-medium ${idx === path.length - 1 ? 'text-primary' : 'hover:text-primary cursor-pointer'}`}
                         onClick={() => {
                             if (item.type === 'category') {
                                 setSelectedCategory(item.id);
                                 setSelectedBrand(null);
                                 onCategorySelect(item.id);
                                 const cat = categories.find(c => c.id === item.id);
                                 if (cat) setCategoryPath([cat]);
                                 setCurrentView('subcategories');
                             }
                         }}
                      >
                          {item.name}
                      </span>
                  </React.Fragment>
              ))}
          </div>
      );
  };

  const TreeItem = ({ node, level }: { node: TreeNode, level: number }) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isProduct = node.type === 'product';
    const isBrand = node.type === 'brand';
    const realId = (node.data as { id: string }).id;
    
    const isSelected = 
       (isProduct && selectedProductForEdit === realId) ||
       (isBrand && selectedBrand === realId) ||
       (node.type === 'category' && selectedCategory === realId);

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      
      if (isProduct) {
        loadProductDetails(realId);
      } else if (node.type === 'category') {
        const category = node.data as Category;
        setSelectedCategory(category.id);
        setCategoryPath([category]); 
        setSelectedBrand(null); 
        // toggleNode(node.id); // Only toggle on arrow click
        setCurrentView('category-edit');
        setSelectedCategoryForEdit(category);
        onCategorySelect(category.id);
      } else if (node.type === 'brand') {
        const brand = node.data as Brand;
        setSelectedBrand(brand.id);
        // if (!isExpanded) toggleNode(node.id); // Only toggle on arrow click
        setCurrentView('brand-edit'); 
        setSelectedBrandForEdit(brand);
        onBrandSelect?.(brand.id);
      }
    };

    return (
      <div className="select-none">
        <ContextMenu>
          <ContextMenuTrigger>
             <div 
               className={`flex items-center gap-2 py-2 px-3 rounded-lg transition-all duration-200 ${
                 isSelected 
                   ? 'bg-gradient-to-r from-primary/20 to-primary/10 text-primary font-semibold shadow-sm border border-primary/20' 
                   : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground hover:shadow-sm border border-transparent hover:border-border/30'
               }`}
               style={{ [isRtl ? 'paddingRight' : 'paddingLeft']: `${level * 12 + 8}px` }}
               onClick={handleClick}
             >
                {!isProduct && (
                  <div 
                    className={`p-0.5 rounded-sm hover:bg-muted/80 transition-colors ${hasChildren ? 'visible' : 'invisible'}`}
                    onClick={(e) => { e.stopPropagation(); toggleNode(node.id); }}
                  >
                    {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : (isRtl ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />)}
                  </div>
                )}
                
                {isProduct ? (
                  <Package className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-blue-500/80'}`} />
                ) : isBrand ? (
                  node.id.includes('-no-brand-group') ? (
                    <Box className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-gray-400'}`} />
                  ) : (
                    <Store className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-purple-500/80'}`} />
                  )
                ) : (
                  <Folder className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-amber-500/80'}`} />
                )}
               
               <span className="truncate text-sm">{node.name}</span>
             </div>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-56">
             {isProduct ? (
                <ContextMenuItem onClick={(e) => { e.stopPropagation(); setProductToDelete(node.data as Product); setShowDeleteProductDialog(true); }} className="text-red-500">
                   <Trash2 className="h-4 w-4 mr-2" /> {t('common.delete')}
                </ContextMenuItem>
             ) : (
                <>
                  <ContextMenuItem onClick={(e) => { e.stopPropagation(); if(isBrand) { setEditingBrand(node.data as Brand); setShowCreateBrandDialog(true); } else { setEditingCategory(node.data as Category); setShowCreateCategoryDialog(true); } }}>
                     <Edit className="h-4 w-4 mr-2" /> {t('common.edit')}
                  </ContextMenuItem>
                  <ContextMenuItem onClick={(e) => { 
                      e.stopPropagation(); 
                      if (isBrand) { setBrandToDelete(node.data as Brand); setShowDeleteBrandDialog(true); } 
                      else { setCategoryToDelete(node.data as Category); setShowDeleteCategoryDialog(true); } 
                  }} className="text-red-500">
                      <Trash2 className="h-4 w-4 mr-2" /> {t('common.delete')}
                  </ContextMenuItem>
                </>
             )}
          </ContextMenuContent>
        </ContextMenu>
        
        {isExpanded && hasChildren && (
          <div className="border-r border-border/40 mr-[15px]">
            {node.children.map((child: TreeNode) => (
              <TreeItem key={child.id} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };



  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const filteredCategories = currentItems.filter(item => (item as { type: string }).type === 'category').map(item => item as unknown as Category).filter(c => (c.name || '').toLowerCase().includes(query) || (c.nameAr || '').toLowerCase().includes(query));
    const filteredBrands = currentItems.filter(item => (item as { type: string }).type === 'brand').map(item => item as unknown as Brand).filter(b => (b.name || '').toLowerCase().includes(query) || (b.nameAr || '').toLowerCase().includes(query));
    const filteredProducts = currentProducts.filter(p => (p.name || '').toLowerCase().includes(query) || (p.nameAr || '').toLowerCase().includes(query) || (p.sku || '').toLowerCase().includes(query));
    return { categories: filteredCategories, brands: filteredBrands, products: filteredProducts };
  }, [currentItems, currentProducts, searchQuery]);

  const paginatedItems = useMemo(() => {
    const allItems = [
      ...filteredItems.brands.map(b => ({ ...b, type: 'brand' as const })),
      ...filteredItems.categories.map(c => ({ ...c, type: 'category' as const })),
      ...filteredItems.products.map(p => ({ ...p, type: 'product' as const }))
    ];
    const totalItems = allItems.length;
    const totalPages = totalItems > 0 ? Math.ceil(totalItems / itemsPerPage) : 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginated = allItems.slice(startIndex, startIndex + itemsPerPage);
    return {
      brands: paginated.filter(item => item.type === 'brand').map(item => item as unknown as Brand),
      categories: paginated.filter(item => item.type === 'category').map(item => item as unknown as Category),
      products: paginated.filter(item => item.type === 'product').map(item => item as unknown as Product),
      totalItems,
      totalPages,
    };
  }, [filteredItems, currentPage, itemsPerPage]);

  useEffect(() => { setCurrentPage(1); }, [currentView, selectedBrand, selectedCategory, searchQuery]);
  useEffect(() => { if (paginatedItems.totalPages > 0 && currentPage > paginatedItems.totalPages) setCurrentPage(1); }, [paginatedItems.totalPages, currentPage]);

  const AllCategoriesButton = () => {
    return (
      <button
        onClick={() => {
          setSelectedBrand(null);
          setCurrentView('categories');
          setCategoryPath([]);
          setSelectedCategory(null);
          setSelectedProductForEdit(null);
          setEditingProductFormData(null);
        }}
        className={`w-full flex items-center gap-2.5 py-2.5 px-3 rounded-lg cursor-pointer transition-all duration-200 ${
          currentView === 'categories' && categoryPath.length === 0 
            ? 'bg-gradient-to-r from-primary/20 to-primary/10 text-primary font-semibold shadow-sm border border-primary/20' 
            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground hover:shadow-sm border border-transparent hover:border-border/30'
        }`}
      >
        <div className="w-5 flex justify-center"><LayoutGrid className="h-4 w-4" /></div>
        <span className="text-sm font-medium">{t('dashboard.categories.productCategories.allCategories')}</span>
      </button>
    );
  };

  return (
    <div className={`overflow-hidden rounded-2xl border border-border bg-background/40 backdrop-blur-2xl shadow-2xl ${
      isFullScreen ? 'h-full' : 'h-[calc(100vh-140px)] min-h-[600px]'
    }`}>
      <ResizablePanelGroup direction="horizontal" className="h-full w-full">
        {/* Sidebar - Hierarchy Tree (Right side in RTL) */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
          <div className="h-full bg-gradient-to-b from-card/40 to-card/20 ltr:border-r rtl:border-l border-border/50 flex flex-col backdrop-blur-xl shadow-lg flex-shrink-0">
        {/* Header with logo and actions */}
        <div className="p-4 border-b border-border/50 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-2.5">
            <img 
              src={getLogoUrl()} 
              alt="Koun Logo" 
              className="h-7 w-auto object-contain drop-shadow-sm"
            />
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 rounded-lg hover:bg-primary/10 hover:text-primary"
              onClick={() => {
                if (onBrandsUpdate) onBrandsUpdate();
                if (onCategoriesUpdate) onCategoriesUpdate();
                if (onProductsUpdate) onProductsUpdate();
                
                // Force reload map from localStorage
                const map = loadCategoryBrandMap();
                setCategoryBrandMap(map);
                
                toast({ description: t('dashboard.hierarchical.dataUpdated') });
              }}
              title="تحديث"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl border border-border/50">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleExport}
                className="h-8 w-8 rounded-lg hover:bg-background hover:text-primary"
                title="تصدير إلى Excel"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowHierarchicalImportWizard(true)}
                className="h-8 w-8 rounded-lg hover:bg-background hover:text-primary"
                title="استيراد من Excel"
              >
                <Upload className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-4 bg-border" />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.open('/hierarchical-fullscreen', '_blank')}
                className="h-8 w-8 rounded-lg hover:bg-background hover:text-primary"
                title="فتح في تبويب جديد (شاشة كاملة)"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-4 bg-border" />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDeleteAll}
                className="h-8 w-8 rounded-lg hover:bg-red-500/10 hover:text-red-500"
                title="حذف جميع البيانات"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 rounded-lg hover:bg-primary/10 hover:text-primary"
              onClick={() => {
                setSelectedBrand(null);
                setCurrentView('categories');
                setCategoryPath([]);
                setSelectedCategory(null);
              }}
              title="الرئيسية"
            >
              <Home className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <ExplorerTree
            categories={categories as unknown as ExplorerCategory[]}
            brands={brands as unknown as ExplorerBrand[]}
            products={products as unknown as ExplorerProduct[]}
            onSelectCategory={(cat) => {
               onCategorySelect(cat.id);
               setSelectedCategory(cat.id);
               setCurrentView('subcategories');
               setCategoryPath([cat as unknown as Category]); 
            }}
            onSelectBrand={(brand) => {
               setSelectedBrand(brand.id);
               setCurrentView('subcategories'); 
               if (onBrandSelect) onBrandSelect(brand.id);
            }}
            onSelectProduct={(prod) => {
               loadProductDetails(prod.id);
               if (onProductSelect) onProductSelect(prod.id);
            }}
            selectedId={selectedProductForEdit || selectedBrand || selectedCategory}
            className="h-full border-none"
          />
        </div>
        
        <div className="p-4 border-t border-border/50 bg-gradient-to-t from-card/30 to-transparent">
          <Button 
            className="w-full gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/20 hover:shadow-xl transition-all duration-200 font-semibold" 
            onClick={() => {
              setCategoryParentCategory(null);
              setShowCreateCategoryDialog(true);
            }}
            id="tour-categories-add-btn"
          >
            <Plus className="h-4 w-4" />
            <span>{t('categories.productCategories.addCategory', 'فئة جديدة')}</span>
          </Button>
        </div>
      </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize={80}>
      {/* Main Content Area */}
      <div className="h-full flex-1 flex flex-col bg-gradient-to-br from-background/30 to-background/10 min-w-0">
        {/* Toolbar */}
        <div className="min-h-[80px] py-3 border-b border-border/50 flex flex-wrap items-center justify-between gap-3 px-4 md:px-6 bg-gradient-to-r from-card/20 via-card/10 to-transparent backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-2 bg-muted/60 p-1 rounded-xl border border-border/50 flex-shrink-0 shadow-sm">
              <button
                onClick={() => handleBack()}
                disabled={currentView === 'categories' && categoryPath.length === 0}
                className="p-2 rounded-lg hover:bg-muted/80 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all duration-200"
                title={t('common.back', 'رجوع')}
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <Separator orientation="vertical" className="h-4 bg-border/50" />
              <button
                onClick={() => {
                  setSelectedBrand(null);
                  setCurrentView('categories');
                  setCategoryPath([]);
                  setSelectedCategory(null);
                  setFilteredProducts([]);
                  setCurrentPage(1);
                }}
                className="p-2 rounded-lg hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all duration-200"
                title={t('common.home', 'الرئيسية')}
              >
                <Home className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <div className="relative w-32 md:w-48 lg:w-64 hidden sm:block">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 h-10 bg-muted/60 border-border/50 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary/50 rounded-xl transition-all duration-200"
              />
            </div>
            
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/50 hidden sm:flex shadow-sm">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'grid' ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                title={t('common.gridView')}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'list' ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                title={t('common.listView')}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (onCategoriesUpdate) onCategoriesUpdate();
                if (onBrandsUpdate) onBrandsUpdate();
                if (onProductsUpdate) onProductsUpdate();
              }}
              className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-200"
              title={t('common.refresh', 'تحديث البيانات')}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl border border-border/50">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleExport}
                className="h-8 w-8 rounded-lg hover:bg-background hover:text-primary"
                title="تصدير إلى Excel"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowHierarchicalImportWizard(true)}
                className="h-8 w-8 rounded-lg hover:bg-background hover:text-primary"
                title="استيراد بيانات"
              >
                <Upload className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-4 bg-border" />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.open(window.location.href, '_blank')}
                className="h-8 w-8 rounded-lg hover:bg-background hover:text-primary"
                title="فتح في تبويب جديد"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-4 bg-border" />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDeleteAll}
                className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive text-destructive/70"
                title="حذف جميع البيانات"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {currentView === 'brands' ? (
                <Button
                  onClick={() => {
                    setEditingBrand(null);
                    setNewBrandData({ name: '', nameAr: '', code: '', logo: '' });
                    setShowCreateBrandDialog(true);
                  }}
                  className="h-10 px-4 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white border-none shadow-lg shadow-primary/20 hover:shadow-xl rounded-xl gap-2 hidden sm:flex transition-all duration-200 font-semibold"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden lg:inline">{t('dashboard.brands.addBrand', 'إضافة علامة تجارية')}</span>
                </Button>
              ) : currentView !== 'products' && (
                <Button
                  onClick={() => {
                    // Pre-populate parent category if we're in subcategories view
                    if (selectedCategory && !categoryParentCategory && currentView === 'subcategories') {
                      setCategoryParentCategory(selectedCategory);
                    }
                    setShowCreateCategoryDialog(true);
                  }}
                  className="h-10 px-4 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white border-none shadow-lg shadow-primary/20 hover:shadow-xl rounded-xl gap-2 hidden sm:flex transition-all duration-200 font-semibold"
                  id="tour-categories-add-btn"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden lg:inline">{currentView === 'categories' ? t('dashboard.categories.productCategories.addCategory') : t('dashboard.categories.productCategories.addSubcategory')}</span>
                </Button>
              )}
              {canAddProduct && (
                <Button
                  onClick={handleOpenProductForm}
                  className="h-10 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white border-none shadow-lg shadow-blue-500/20 hover:shadow-xl rounded-xl gap-2 transition-all duration-200 font-semibold"
                >
                  <Package className="h-4 w-4" />
                  <span>{t('dashboard.products.addProduct')}</span>
                </Button>
              )}
            </div>
            </div>
          </div>

        {/* Breadcrumb Path */}
        <div className="px-6 py-2 border-b border-border/40 bg-background/20 backdrop-blur-sm">
             <BreadcrumbDisplay />
        </div>

        {/* Content Area */}
        {selectedProductForEdit && editingProductFormData ? (
          // Product Edit Form in Main Content
          <div className="flex-1 overflow-y-auto">
            <div className="h-full p-6">
              {loadingProductDetails ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                </div>
              ) : (
                <ProductFormWizard
                  initialData={editingProductFormData}
                  initialImages={((editingProductFormData as ProductFormData & { images?: string[] }).images) || selectedProductDetails?.images || []}
                  categories={categories}
                  brands={brands}
                  units={units}
                  suppliers={suppliers}
                  currencies={currencies}
                  onCancel={() => {
                        setSelectedProductForEdit(null);
                        setEditingProductFormData(null);
                  }}
                  isEditing={true}
                  onSave={async (data, images) => {
                    try {
                      const preparedData = prepareProductData(data);
                      await coreApi.updateProduct(selectedProductForEdit, {
                        ...preparedData,
                        images: images.map((url, index) => ({
                          url,
                          altText: data.name,
                          sortOrder: index
                        })),
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      } as any);
                      toast({
                        title: t('common.success'),
                        description: t('dashboard.products.messages.productUpdated'),
                      });
                      if (onProductsUpdate) onProductsUpdate();
                      if (selectedCategory) {
                        const updatedProducts = await getProductsInCategory(selectedCategory);
                        setFilteredProducts(updatedProducts);
                      }
                      // Reload product details
                      await loadProductDetails(selectedProductForEdit);
                    } catch (error) {
                      console.error('Failed to save product:', error);
                      toast({
                        title: 'تعذر حفظ المنتج',
                        description: 'حدث خطأ أثناء حفظ المنتج. يرجى المحاولة مرة أخرى.',
                        variant: 'destructive',
                      });
                      throw error;
                    }
                  }}
                />
              )}
            </div>
          </div>
        ) : selectedCategoryForEdit ? (
          // Category Edit Form in Main Content
          <div className="flex-1 overflow-y-auto">
            <div className="h-full p-6">
              <CategoryForm
                categories={categories}
                initialData={selectedCategoryForEdit}
                parentId={selectedCategoryForEdit.parentId || undefined}
                onSave={async (formData) => {
                  try {
                    await coreApi.updateCategory(selectedCategoryForEdit.id, {
                      name: formData.name,
                      nameAr: formData.nameAr,
                      description: formData.description,
                      descriptionAr: formData.descriptionAr,
                      slug: formData.slug ? sanitizeSlug(formData.slug) : sanitizeSlug(formData.name),
                      image: formData.image,
                      icon: formData.icon,
                      parentId: formData.parentId || undefined,
                      isActive: formData.isActive,
                    });
                    toast({
                      title: 'نجح',
                      description: 'تم تحديث الفئة بنجاح',
                    });
                    if (onCategoriesUpdate) onCategoriesUpdate();
                    // Reload category data
                    const updatedCategory = await coreApi.getCategory(selectedCategoryForEdit.id);
                    setSelectedCategoryForEdit(updatedCategory);
                  } catch (error) {
                    console.error('Failed to save category:', error);
                    toast({
                      title: 'تعذر حفظ الفئة',
                      description: 'حدث خطأ أثناء حفظ الفئة. يرجى المحاولة مرة أخرى.',
                      variant: 'destructive',
                    });
                    throw error;
                  }
                }}
                onCancel={() => {
                  setSelectedCategoryForEdit(null);
                }}
              />
            </div>
          </div>
        ) : selectedBrandForEdit ? (
          // Brand Edit Form in Main Content (if BrandForm exists, otherwise show a message)
          <div className="flex-1 overflow-y-auto">
            <div className="h-full p-6">
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">تعديل العلامة التجارية</h2>
                  <Button variant="outline" onClick={() => setSelectedBrandForEdit(null)}>
                    إلغاء
                  </Button>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle>بيانات العلامة التجارية</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                       <Label>شعار العلامة</Label>
                       <div className="flex justify-center p-4 border-2 border-dashed rounded-lg bg-muted/20">
                           <ImageUpload
                             value={selectedBrandForEdit.logo || ''}
                             onChange={(url) => {
                                 setSelectedBrandForEdit({ ...selectedBrandForEdit, logo: url });
                             }}
                             placeholder="Upload Logo"
                           />
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>اسم العلامة التجارية (EN)</Label>
                          <Input 
                            value={selectedBrandForEdit.name} 
                            onChange={(e) => setSelectedBrandForEdit({ ...selectedBrandForEdit, name: e.target.value })} 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>الاسم بالعربية (AR)</Label>
                          <Input 
                            value={selectedBrandForEdit.nameAr || ''} 
                            onChange={(e) => setSelectedBrandForEdit({ ...selectedBrandForEdit, nameAr: e.target.value })} 
                            dir="rtl"
                          />
                        </div>
                    </div>
                    <div className="space-y-2">
                      <Label>الكود</Label>
                      <Input 
                        value={selectedBrandForEdit.code || ''} 
                        onChange={(e) => setSelectedBrandForEdit({ ...selectedBrandForEdit, code: e.target.value })} 
                      />
                    </div>
                    
                    <div className="pt-4 flex justify-end gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => setSelectedBrandForEdit(null)}
                        >
                            إلغاء
                        </Button>
                        <Button 
                            onClick={async () => {
                                // Prepare data for existing handleCreateBrand logic
                                setEditingBrand(selectedBrandForEdit);
                                setNewBrandData({
                                    name: selectedBrandForEdit.name,
                                    nameAr: selectedBrandForEdit.nameAr || '',
                                    code: selectedBrandForEdit.code || '',
                                    logo: selectedBrandForEdit.logo || ''
                                });
                                // We need to trigger handleCreateBrand but it relies on state that we just set
                                // Since setState is async, we call the core update function directly here for reliability
                                try {
                                    setCreatingBrand(true);
                                    await coreApi.updateBrand(selectedBrandForEdit.id, {
                                        name: selectedBrandForEdit.name,
                                        nameAr: selectedBrandForEdit.nameAr || undefined,
                                        code: selectedBrandForEdit.code || undefined,
                                        logo: selectedBrandForEdit.logo || undefined
                                    });
                                    toast({
                                        title: 'تم الحفظ',
                                        description: 'تم تحديث العلامة التجارية بنجاح'
                                    });
                                    if (onBrandsUpdate) onBrandsUpdate();
                                    setSelectedBrandForEdit(null);
                                } catch (e) {
                                    console.error(e);
                                    toast({
                                        title: 'خطأ',
                                        description: 'فشل حفظ التغييرات',
                                        variant: 'destructive'
                                    });
                                } finally {
                                    setCreatingBrand(false);
                                }
                            }}
                            disabled={creatingBrand}
                        >
                            {creatingBrand ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                        </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ) : currentView === 'brands' && !selectedBrand ? (
            <ScrollArea className="flex-1 p-8">
              <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-2"}>
                {paginatedItems.brands.map((brand) => (
                  <motion.div
                    key={brand.id}
                    whileHover={{ scale: 1.02 }}
                    className={viewMode === 'grid' 
                      ? "group relative bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl p-5 cursor-pointer hover:border-secondary/50 transition-all duration-300 shadow-xl hover:shadow-secondary/5"
                      : "group flex items-center gap-4 bg-card/40 backdrop-blur-md border border-border/50 rounded-xl p-3 cursor-pointer hover:border-secondary/50 transition-all duration-300"
                    }
                    onClick={() => handleBrandClick(brand.id)}
                  >
                    <div className={viewMode === 'grid' ? "flex items-start justify-between mb-4" : "flex-shrink-0"}>
                      <div className={`p-3 rounded-xl bg-muted/50 border border-border group-hover:bg-secondary/10 group-hover:border-secondary/30 transition-all duration-300`}>
                        {brand.logo ? (
                          <img src={brand.logo} alt={brand.name} className="h-6 w-6 object-contain" />
                        ) : (
                          <Store className="h-6 w-6 text-secondary" />
                        )}
                      </div>
                      {viewMode === 'grid' && (
                        <div className="flex items-center gap-1">
                          <button 
                            className="p-2 rounded-lg hover:bg-blue-500/20 text-muted-foreground hover:text-blue-600 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingBrand(brand);
                              setNewBrandData({
                                name: brand.name,
                                nameAr: brand.nameAr || '',
                                code: brand.code || '',
                                logo: brand.logo || '',
                              });
                              setShowCreateBrandDialog(true);
                            }}
                            title="تعديل"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            className="p-2 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-500 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setBrandToDelete(brand);
                              setShowDeleteBrandDialog(true);
                            }}
                            title="حذف"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                       <h3 className="font-semibold text-lg truncate mb-1 text-foreground/90 group-hover:text-primary transition-colors">{brand.nameAr || brand.name}</h3>
                       {brand.nameAr && brand.nameAr !== brand.name && <p className="text-sm text-muted-foreground truncate">{brand.name}</p>}
                       <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span className="bg-secondary/10 text-secondary px-2 py-0.5 rounded-full border border-secondary/20">
                            {brand.code || 'CODE'}
                          </span>
                       </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {/* Pagination for Brands */}
              {paginatedItems.totalPages > 1 && (
                <div className="mt-6 border-t border-border/50 pt-4">
                  <DataTablePagination
                    currentPage={currentPage}
                    totalPages={paginatedItems.totalPages}
                    totalItems={paginatedItems.totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={(newItemsPerPage) => {
                      setItemsPerPage(newItemsPerPage);
                      setCurrentPage(1);
                    }}
                    itemsPerPageOptions={[12, 20, 50, 100]}
                    showItemsPerPage={true}
                  />
                </div>
              )}
            </ScrollArea>
        ) : currentView === 'brand-edit' && selectedBrandForEdit ? (
            <div className="flex-1 overflow-hidden h-full">
                <BrandForm 
                    initialData={selectedBrandForEdit}
                    onSave={handleCreateBrand}
                    onCancel={() => {
                        setSelectedBrand(null);
                        setCurrentView('categories');
                    }}
                    hasCloudinaryAccess={hasCloudinaryAccess}
                    isSaving={creatingBrand}
                />
            </div>
        ) : currentView === 'category-edit' && selectedCategoryForEdit ? (
             <div className="flex-1 overflow-hidden h-full p-6 overflow-y-auto">
                <CategoryForm
                    categories={categories}
                    initialData={selectedCategoryForEdit}
                    parentId={selectedCategoryForEdit.parentId}
                    onSave={handleCategoryFormSave}
                    onCancel={() => {
                        setCurrentView('categories');
                    }}
                    saving={updatingCategory}
                />
             </div>
        ) : currentView === 'product-edit' ? (
             <div className="flex-1 overflow-hidden h-full p-6 overflow-y-auto">
                <ProductFormWizard
                    initialData={editingProductFormData || undefined}
                    initialImages={selectedProductDetails?.images || []}
                    categories={categories}
                    brands={brands}
                    units={units}
                    suppliers={suppliers}
                    currencies={currencies}
                    onSave={handleProductFormSave}
                    onCancel={() => {
                         setCurrentView('products');
                    }}
                    isEditing={true}
                />
             </div>
        ) : currentView === 'products' ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">اختر منتجاً من القائمة للتعديل</p>
            </div>
          </div>
        ) : (
        <ScrollArea className="flex-1 p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentView}-${selectedBrand}-${selectedCategory}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-2"}>
                  {/* Categories - Paginated */}
                  {paginatedItems.categories.map((category) => (
                    <motion.div
                      key={category.id}
                      whileHover={{ y: -4 }}
                      className={viewMode === 'grid' 
                        ? "group relative flex flex-col bg-card hover:bg-accent/5 border border-border/60 hover:border-primary/50 rounded-xl p-5 cursor-pointer shadow-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 h-full"
                        : "group flex items-center gap-4 bg-card border border-border/60 rounded-lg p-3 cursor-pointer hover:border-primary/50 hover:bg-accent/5 transition-all duration-200"
                      }
                      onClick={() => handleCategoryClick(category, true)}
                    >
                      {/* Grid View Layout */}
                      {viewMode === 'grid' && (
                        <>
                          <div className="flex items-start justify-between">
                            <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm">
                              <Folder className="h-6 w-6" />
                            </div>
                            
                            {/* Actions - Absolute Positioned */}
                            <div className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-background/80 backdrop-blur-sm p-1 rounded-lg border shadow-sm z-10`}>
                                <button 
                                  className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingCategory(category);
                                    setNewCategoryData({
                                      name: category.name,
                                      nameAr: category.nameAr || '',
                                      description: category.description || '',
                                      image: category.image || '',
                                    });
                                    setCategoryParentCategory(category.parentId || null);
                                    setShowCreateCategoryDialog(true);
                                  }}
                                  title={t('common.edit')}
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button 
                                  className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCategoryToDelete(category);
                                    setShowDeleteCategoryDialog(true);
                                  }}
                                  title={t('common.delete')}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                                <ContextMenu>
                                  <ContextMenuTrigger asChild>
                                    <button 
                                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </button>
                                  </ContextMenuTrigger>
                                  <ContextMenuContent>
                                    <ContextMenuItem onClick={(e) => {
                                      e.stopPropagation();
                                      if (getCategoryDepth(category.id) >= MAX_DEPTH) {
                                        toast({ title: t('common.error'), description: t('dashboard.categories.productCategories.maxDepthReached', { max: MAX_DEPTH }), variant: 'destructive' });
                                        return;
                                      }
                                      setEditingCategory(null);
                                      setNewCategoryData({ name: '', nameAr: '', description: '', image: '' });
                                      setCategoryParentCategory(category.id);
                                      const categoryBrand = categoryBrandMap.get(category.id);
                                      if (categoryBrand) setCategoryParentBrand(categoryBrand);
                                      else if (selectedBrand) setCategoryParentBrand(selectedBrand);
                                      setShowCreateCategoryDialog(true);
                                    }} disabled={getCategoryDepth(category.id) >= MAX_DEPTH}>
                                      <Plus className="h-4 w-4 mr-2" />
                                      {t('dashboard.categories.productCategories.addSubcategory')}
                                    </ContextMenuItem>
                                    {/* Additional context menu items can go here if needed */}
                                  </ContextMenuContent>
                                </ContextMenu>
                            </div>
                          </div>

                          <div className="mt-4 flex-1">
                            <h4 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                              {category.nameAr || category.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <Badge variant="secondary" className="bg-muted/50 text-muted-foreground font-normal hover:bg-muted">
                                {getSubcategories(category.id).length} {t('dashboard.categories.productCategories.subcategories')}
                              </Badge>
                              {category.parentId && (
                                <Badge variant="outline" className="text-[10px] font-mono opacity-70">
                                  L{getCategoryDepth(category.id)}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      {/* List View Layout */}
                      {viewMode === 'list' && (
                        <>
                          <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                            <Folder className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                              {category.nameAr || category.name}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{getSubcategories(category.id).length} فئات فرعية</span>
                              <span>•</span>
                              <span>المستوى: {getCategoryDepth(category.id)}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { 
                               e.stopPropagation();
                               setEditingCategory(category);
                               setNewCategoryData({ name: category.name, nameAr: category.nameAr || '', description: category.description || '', image: category.image || '' });
                               setCategoryParentCategory(category.parentId || null);
                               setShowCreateCategoryDialog(true);
                             }}>
                               <Edit className="h-4 w-4" />
                             </Button>
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => {
                               e.stopPropagation();
                               setCategoryToDelete(category);
                               setShowDeleteCategoryDialog(true);
                             }}>
                               <Trash2 className="h-4 w-4" />
                             </Button>
                          </div>
                        </>
                      )}
                    </motion.div>
                  ))}

                  {/* Brands - Show if in subcategories view */}
                  {currentView === 'subcategories' && paginatedItems.brands.map((brand) => (
                    <motion.div
                      key={brand.id}
                      whileHover={{ y: -4 }}
                      className={viewMode === 'grid' 
                        ? "group relative flex flex-col bg-card hover:bg-accent/5 border border-border/60 hover:border-primary/50 rounded-xl p-5 cursor-pointer shadow-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 h-full"
                        : "group flex items-center gap-4 bg-card border border-border/60 rounded-lg p-3 cursor-pointer hover:border-primary/50 hover:bg-accent/5 transition-all duration-200"
                      }
                      onClick={() => handleBrandClick(brand.id)}
                    >
                      {/* Grid View Layout */}
                      {viewMode === 'grid' && (
                        <>
                          <div className="flex items-start justify-between">
                            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 shadow-sm relative overflow-hidden">
                                {brand.logo ? (
                                  <img src={brand.logo} alt={brand.name} className="w-6 h-6 object-contain" />
                                ) : (
                                  <Store className="h-6 w-6" />
                                )}
                            </div>
                            
                            {/* Actions - Absolute Positioned */}
                            <div className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-background/80 backdrop-blur-sm p-1 rounded-lg border shadow-sm z-10`}>
                                <button 
                                  className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingBrand(brand);
                                    setNewBrandData({
                                      name: brand.name,
                                      nameAr: brand.nameAr || '',
                                      code: brand.code || '',
                                      logo: brand.logo || '',
                                    });
                                    setShowCreateBrandDialog(true);
                                  }}
                                  title={t('common.edit')}
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button 
                                  className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setBrandToDelete(brand);
                                    setShowDeleteBrandDialog(true);
                                  }}
                                  title={t('common.delete')}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                          </div>

                          <div className="mt-4 flex-1">
                            <h4 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                              {brand.nameAr || brand.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <Badge variant="secondary" className="bg-muted/50 text-muted-foreground font-normal hover:bg-muted">
                                {t('dashboard.products.brand')}
                              </Badge>
                            </div>
                          </div>
                        </>
                      )}

                      {/* List View Layout */}
                      {viewMode === 'list' && (
                        <>
                          <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                             {brand.logo ? (
                                  <img src={brand.logo} alt={brand.name} className="w-5 h-5 object-contain" />
                                ) : (
                                  <Store className="h-5 w-5" />
                                )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                              {brand.nameAr || brand.name}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{t('dashboard.products.brand')}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { 
                               e.stopPropagation();
                               setEditingBrand(brand);
                               setNewBrandData({ name: brand.name, nameAr: brand.nameAr || '', code: brand.code || '', logo: brand.logo || '' });
                               setShowCreateBrandDialog(true);
                             }}>
                               <Edit className="h-4 w-4" />
                             </Button>
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => {
                               e.stopPropagation();
                               setBrandToDelete(brand);
                               setShowDeleteBrandDialog(true);
                             }}>
                               <Trash2 className="h-4 w-4" />
                             </Button>
                          </div>
                        </>
                      )}
                    </motion.div>
                  ))}

                  {/* Products - Only show if not in products view */}
                  {(currentView === 'categories' || currentView === 'subcategories') && paginatedItems.products.map((product) => (
                    <motion.div
                      key={product.id}
                      whileHover={{ y: -4 }}
                      className={viewMode === 'grid'
                        ? "group relative flex flex-col bg-card hover:bg-accent/5 border border-border/60 hover:border-primary/50 rounded-xl p-5 cursor-pointer shadow-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 h-full"
                        : "group flex items-center gap-4 bg-card border border-border/60 rounded-lg p-3 cursor-pointer hover:border-primary/50 hover:bg-accent/5 transition-all duration-200"
                      }
                      onClick={() => loadProductDetails(product.id)}
                    >
                      {viewMode === 'grid' && (
                        <>
                           <div className="flex items-start justify-between">
                            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                              <Package className="h-6 w-6" />
                            </div>
                            
                            {/* Actions - Absolute Positioned */}
                            <div className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-background/80 backdrop-blur-sm p-1 rounded-lg border shadow-sm z-10`}>
                                <button 
                                  className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setProductToDelete(product);
                                    setShowDeleteProductDialog(true);
                                  }}
                                  title={t('common.delete')}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                          </div>

                          <div className="mt-4 flex-1">
                            <h4 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                              {product.nameAr || product.name}
                            </h4>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                               {product.sku && (
                                 <Badge variant="secondary" className="text-[10px] font-mono bg-muted/50 text-muted-foreground">
                                   {product.sku}
                                 </Badge>
                               )}
                               {product.price && (
                                 <span className="text-sm font-bold text-primary">
                                   {product.price.toFixed(2)} ر.س
                                 </span>
                               )}
                            </div>
                          </div>
                        </>
                      )}

                      {viewMode === 'list' && (
                        <>
                          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                             <Package className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                              {product.nameAr || product.name}
                            </h4>
                             <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{product.sku || 'NO SKU'}</span>
                                {product.price && <span className="text-primary font-medium">{product.price.toFixed(2)} ر.س</span>}
                             </div>
                          </div>
                          
                           <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { 
                               e.stopPropagation();
                               setProductToDelete(product);
                               setShowDeleteProductDialog(true);
                             }}>
                               <Trash2 className="h-4 w-4" />
                             </Button>
                          </div>
                        </>
                      )}
                    </motion.div>
                  ))}

                  {/* Empty State */}
                  {paginatedItems.totalItems === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                      <div className="w-24 h-24 bg-slate-900/50 rounded-full flex items-center justify-center mb-6 border border-slate-800">
                          <Folder className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        {searchQuery ? 'لا توجد نتائج' : 'لا توجد فئات'}
                      </h3>
                      <p className="text-muted-foreground max-w-xs">
                        {searchQuery 
                          ? `لم نجد أي نتائج لـ "${searchQuery}"` 
                              : 'هذا المجلد فارغ حالياً. يمكنك إضافة فئة جديدة.'}
                      </p>
                      {!searchQuery && (
                        <div className="mt-8 flex flex-wrap gap-3 justify-center">
                          {selectedBrand && currentView === 'categories' && (
                            <Button
                              variant="outline"
                              className="border-border text-muted-foreground hover:bg-muted rounded-xl gap-2"
                              onClick={() => setShowLinkCategoryDialog(true)}
                            >
                              <LinkIcon className="h-4 w-4" />
                              ربط فئة
                            </Button>
                          )}
                            <Button 
                              variant="outline" 
                              className="border-border text-muted-foreground hover:bg-muted rounded-xl gap-2"
                              disabled={currentCategoryDepth >= MAX_DEPTH}
                              onClick={() => {
                                // Pre-populate brand if we're in a brand context
                                if (selectedBrand && !categoryParentBrand) {
                                  setCategoryParentBrand(selectedBrand);
                                }
                              // Pre-populate parent category if we're in subcategories view
                              if (currentView === 'subcategories' && selectedCategory && !categoryParentCategory) {
                                  setCategoryParentCategory(selectedCategory);
                                }
                                setShowCreateCategoryDialog(true);
                              }}
                              title={currentCategoryDepth >= MAX_DEPTH ? `تم الوصول إلى الحد الأقصى من المستويات (${MAX_DEPTH})` : ''}
                            >
                              <Plus className="h-4 w-4" />
                            {currentView === 'subcategories' ? 'إضافة فئة فرعية' : 'إضافة فئة'}
                            </Button>
                          {currentCategoryDepth >= MAX_DEPTH && (
                            <p className="text-xs text-amber-500 text-center mt-2">
                              {t('dashboard.categories.productCategories.maxDepthWarning', { max: MAX_DEPTH })}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Pagination */}
                {paginatedItems.totalItems > 0 && (
                  <div className="mt-6 border-t border-border/50 pt-4">
                    <DataTablePagination
                      currentPage={currentPage}
                      totalPages={paginatedItems.totalPages}
                      totalItems={paginatedItems.totalItems}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setCurrentPage}
                      onItemsPerPageChange={(newItemsPerPage) => {
                        setItemsPerPage(newItemsPerPage);
                        setCurrentPage(1);
                      }}
                      itemsPerPageOptions={[12, 20, 50, 100]}
                      showItemsPerPage={true}
                    />
                  </div>
                )}
            </motion.div>
          </AnimatePresence>
        </ScrollArea>
        )}
      </div>

      {/* Create Brand Dialog */}
      <Dialog open={showCreateBrandDialog} onOpenChange={setShowCreateBrandDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Store className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-xl">إضافة علامة تجارية جديدة</DialogTitle>
                <DialogDescription className="mt-1">
                  العلامة التجارية هي المستوى الأعلى في التسلسل الهرمي (Brand → Category → Subcategory → Product)
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Brand Logo Section */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" />
                شعار العلامة التجارية
              </Label>
              
              {/* Current Logo Preview */}
              {newBrandData.logo && (
                <div className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-primary/20 bg-muted/50 group mx-auto">
                  <img 
                    src={newBrandData.logo} 
                    alt="Brand Logo" 
                    className="w-full h-full object-contain" 
                  />
                  <button
                    onClick={() => setNewBrandData({ ...newBrandData, logo: '' })}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/90 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              
              {/* Upload Options */}
              <div className="grid grid-cols-2 gap-3">
                {/* Local Upload */}
                <div className="relative">
                  <ImageUpload
                    value=""
                    onChange={(url) => setNewBrandData({ ...newBrandData, logo: url })}
                    placeholder="رفع من الجهاز"
                    className="h-24"
                  />
                </div>
                
                {/* Cloudinary Picker Button - Only show if user has access */}
                {hasCloudinaryAccess && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-24 flex flex-col gap-2 border-dashed border-2 hover:border-primary hover:bg-primary/5"
                    onClick={() => setShowBrandImagePicker(true)}
                  >
                    <Cloud className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm">اختر من Cloudinary</span>
                  </Button>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                يمكنك رفع صورة جديدة أو اختيار صورة موجودة من مكتبة Cloudinary
              </p>
            </div>
            
            <Separator />
            
            {/* Brand Names */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brandName" className="text-sm font-semibold">
                  اسم العلامة التجارية (English) *
                </Label>
                <Input
                  id="brandName"
                  value={newBrandData.name}
                  onChange={(e) => setNewBrandData({ ...newBrandData, name: e.target.value })}
                  placeholder="Brand Name"
                  className="h-11"
                />
              </div>
            
              <div className="space-y-2">
                <Label htmlFor="brandNameAr" className="text-sm font-semibold">
                  اسم العلامة التجارية (العربية)
                </Label>
                <Input
                  id="brandNameAr"
                  value={newBrandData.nameAr}
                  onChange={(e) => setNewBrandData({ ...newBrandData, nameAr: e.target.value })}
                  placeholder="اسم العلامة التجارية"
                  dir={isRtl ? 'rtl' : 'ltr'}
                  className="h-11"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="brandCode" className="text-sm font-semibold">
                رمز العلامة التجارية (اختياري)
              </Label>
              <Input
                id="brandCode"
                value={newBrandData.code}
                onChange={(e) => setNewBrandData({ ...newBrandData, code: e.target.value })}
                placeholder="BRAND-001"
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                رمز فريد للعلامة التجارية لاستخدامه في الباركود أو التعريف
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateBrandDialog(false);
                setNewBrandData({ name: '', nameAr: '', code: '', logo: '' });
              }}
            >
              إلغاء
            </Button>
            <Button
              onClick={() => handleCreateBrand()}
              disabled={creatingBrand || !newBrandData.name.trim()}
            >
              {creatingBrand ? 'جاري الإنشاء...' : 'إنشاء'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Brand Confirmation Dialog */}
      <Dialog open={showDeleteBrandDialog} onOpenChange={setShowDeleteBrandDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-500">حذف العلامة التجارية</DialogTitle>
            <DialogDescription className="space-y-2">
              <p>
                هل أنت متأكد من حذف العلامة التجارية <strong>"{brandToDelete?.nameAr || brandToDelete?.name}"</strong>؟
              </p>
              {brandToDelete && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-3 mt-3">
                  <p className="text-sm text-red-800 dark:text-red-300 font-medium mb-2">
                    سيتم حذف:
                  </p>
                  <ul className="text-sm text-red-700 dark:text-red-400 space-y-1 list-disc list-inside">
                    <li>العلامة التجارية نفسها</li>
                    <li>
                      {Array.from(categoryBrandMap.entries())
                        .filter(([_, brandId]) => brandId === brandToDelete.id).length} فئة/فئات
                    </li>
                    <li>
                      {products.filter(p => p.brandId === brandToDelete.id).length} منتج/منتجات
                    </li>
                  </ul>
                </div>
              )}
              <p className="text-red-400 font-medium mt-3">
                ⚠️ هذا الإجراء لا يمكن التراجع عنه.
              </p>
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteBrandDialog(false);
                setBrandToDelete(null);
              }}
              disabled={deletingBrand}
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteBrand}
              disabled={deletingBrand}
            >
              {deletingBrand ? 'جاري الحذف...' : 'حذف'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation Dialog */}
      <Dialog open={showDeleteCategoryDialog} onOpenChange={setShowDeleteCategoryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-500">حذف الفئة</DialogTitle>
            <DialogDescription className="space-y-2">
              <p>
                هل أنت متأكد من حذف الفئة <strong>"{categoryToDelete?.nameAr || categoryToDelete?.name}"</strong>؟
              </p>
              {categoryToDelete && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-3 mt-3">
                  <p className="text-sm text-red-800 dark:text-red-300 font-medium mb-2">
                    سيتم حذف:
                  </p>
                  <ul className="text-sm text-red-700 dark:text-red-400 space-y-1 list-disc list-inside">
                    <li>الفئة نفسها</li>
                    <li>
                      {categories.filter(c => c.parentId === categoryToDelete.id).length} فئات فرعية
                    </li>
                    <li>
                      قد تتأثر المنتجات المرتبطة بهذه الفئة
                    </li>
                  </ul>
                </div>
              )}
              <p className="text-red-600 dark:text-red-400 font-medium mt-3">
                ⚠️ هذا الإجراء لا يمكن التراجع عنه.
              </p>
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteCategoryDialog(false);
                setCategoryToDelete(null);
              }}
              disabled={deletingCategory}
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCategory}
              disabled={deletingCategory}
            >
              {deletingCategory ? 'جاري الحذف...' : 'حذف'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Product Confirmation Dialog */}
      <Dialog open={showDeleteProductDialog} onOpenChange={setShowDeleteProductDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-500">حذف المنتج</DialogTitle>
            <DialogDescription className="space-y-2">
              <p>
                هل أنت متأكد من حذف المنتج <strong>"{productToDelete?.nameAr || productToDelete?.name}"</strong>؟
              </p>
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-3 mt-3">
                <p className="text-sm text-red-800 dark:text-red-300 font-medium">
                  سيتم حذف المنتج نهائياً من قاعدة البيانات.
                </p>
              </div>
              <p className="text-red-600 dark:text-red-400 font-medium mt-3">
                ⚠️ هذا الإجراء لا يمكن التراجع عنه.
              </p>
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteProductDialog(false);
                setProductToDelete(null);
              }}
              disabled={deletingProduct}
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProduct}
              disabled={deletingProduct}
            >
              {deletingProduct ? 'جاري الحذف...' : 'حذف'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete All Confirmation Dialog */}
      <Dialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-500 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              حذف جميع البيانات
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <p className="text-base font-medium text-foreground">
                هل أنت متأكد من حذف جميع البيانات؟
              </p>
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-4">
                <p className="text-sm text-red-800 dark:text-red-300 font-medium mb-2">
                  سيؤدي هذا الإجراء إلى حذف:
                </p>
                <ul className="text-sm text-red-700 dark:text-red-400 space-y-1 list-disc list-inside">
                  <li>جميع المنتجات</li>
                  <li>جميع الفئات والفئات الفرعية</li>
                  <li>جميع العلامات التجارية</li>
                </ul>
              </div>
              <p className="text-red-600 dark:text-red-400 font-medium text-sm">
                ⚠️ هذا الإجراء نهائي ولا يمكن التراجع عنه.
              </p>
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteAllDialog(false)}
              disabled={isImporting}
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowDeleteAllDialog(false);
                executeDeleteAll();
              }}
              disabled={isImporting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isImporting ? 'جاري الحذف...' : 'حذف الكل'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Progress Dialog */}
      <Dialog open={isImporting} onOpenChange={(open) => {
        if (!open && isImporting) {
           confirm({
             title: 'هل تريد إيقاف العملية؟',
             description: 'سيتم إيقاف عملية الاستيراد الحالية.',
             confirmText: 'نعم، إيقاف',
             cancelText: 'لا، استمرار',
             variant: 'destructive'
           }).then((confirmed) => {
             if (confirmed) {
               isImportCancelled.current = true;
               setIsImporting(false);
             }
           });
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">جاري المعالجة...</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            {/* Spinning loader with percentage */}
            <div className="relative">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                {Math.round((importProgress.current / Math.max(importProgress.total, 1)) * 100)}%
              </div>
            </div>
            
            {/* Current item display */}
            <div className="text-center space-y-2 w-full">
              <p className="text-muted-foreground text-sm">{importProgress.currentItem}</p>
              <p className="text-xs text-muted-foreground/70">
                {importProgress.current} / {importProgress.total}
              </p>
            </div>
            
            {/* Progress bar */}
            <div className="w-full space-y-2">
              <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{ width: `${(importProgress.current / Math.max(importProgress.total, 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                 isImportCancelled.current = true;
              }}
              className="w-full"
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Category Dialog */}
      <Dialog open={showCreateCategoryDialog} onOpenChange={(open) => {
        setShowCreateCategoryDialog(open);
        if (!open) {
          setEditingCategory(null);
          setCategoryParentCategory(null);
        }
      }}>
        <DialogContent className="sm:max-w-[600px] h-[98vh] max-h-[98vh] overflow-hidden p-0 flex flex-col">
          <div className="p-6 pb-0">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'تعديل الفئة' : categoryParentCategory ? 'إضافة فئة فرعية جديدة' : (currentView === 'subcategories' || currentView === 'products' ? 'إضافة فئة فرعية جديدة' : 'إضافة فئة جديدة')}
              </DialogTitle>
              <DialogDescription>
                {editingCategory 
                  ? `تعديل الفئة: ${editingCategory.nameAr || editingCategory.name}`
                  : categoryParentCategory 
                  ? `إضافة فئة فرعية تحت الفئة المحددة`
                  : categoryPath.length > 0 
                    ? `إضافة فئة فرعية تحت: ${categoryPath.map(c => c.nameAr || c.name).join(' > ')}`
                    : 'إضافة فئة جديدة'}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-hidden p-6 pt-2">
          <CategoryForm
            categories={categories}
            initialData={editingCategory}
            parentId={categoryParentCategory || (categoryPath.length > 0 ? categoryPath[categoryPath.length - 1].id : undefined) || undefined}
            onSave={handleCategoryFormSave}
            onCancel={() => {
              setShowCreateCategoryDialog(false);
              setEditingCategory(null);
              setCategoryParentCategory(null);
            }}
            saving={creatingCategory || updatingCategory}
          />
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Details Dialog Removed as per user request */}
      {/* Cloudinary Image Picker for Product */}
      <CloudinaryImagePicker
        open={showImagePicker}
        onOpenChange={setShowImagePicker}
        multiple={true}
        onSelect={(urls) => {
          setEditProductData(prev => {
            const currentImages = [...prev.images];
            const newImages = [...currentImages, ...urls].slice(0, 4);
            return { ...prev, images: newImages };
          });
          setShowImagePicker(false);
          toast({
            title: 'تمت إضافة الصور',
            description: `تمت إضافة ${urls.length} صور للمنتج`,
          });
        }}
      />
      
      {/* Cloudinary Image Picker for Brand Logo */}
      <CloudinaryImagePicker
        open={showBrandImagePicker}
        onOpenChange={setShowBrandImagePicker}
        multiple={false}
        onSelect={(urls) => {
          if (urls.length > 0) {
            setNewBrandData(prev => ({ ...prev, logo: urls[0] }));
            toast({
              title: 'تم اختيار الشعار',
              description: 'تم اختيار شعار العلامة التجارية من Cloudinary',
            });
          }
          setShowBrandImagePicker(false);
        }}
      />
      
      {/* Cloudinary Image Picker for Category Image */}
      <CloudinaryImagePicker
        open={showCategoryImagePicker}
        onOpenChange={setShowCategoryImagePicker}
        multiple={false}
        onSelect={(urls) => {
          if (urls.length > 0) {
            setNewCategoryData(prev => ({ ...prev, image: urls[0] }));
            toast({
              title: 'تم اختيار الصورة',
              description: 'تم اختيار صورة الفئة من Cloudinary',
            });
          }
          setShowCategoryImagePicker(false);
        }}
      />
      {/* Link Category Dialog */}
      <Dialog open={showLinkCategoryDialog} onOpenChange={setShowLinkCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ربط فئة موجودة</DialogTitle>
            <DialogDescription>
              اختر فئة من القائمة لربطها بالعلامة التجارية الحالية.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="mb-2 block">الفئة</Label>
            <Select value={categoryToLink} onValueChange={setCategoryToLink}>
              <SelectTrigger>
                <SelectValue placeholder="اختر فئة..." />
              </SelectTrigger>
              <SelectContent>
                {categories
                  .filter(c => !categoriesInBrand.has(c.id)) // Only show categories NOT in this brand
                  .map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nameAr || c.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkCategoryDialog(false)}>إلغاء</Button>
            <Button onClick={handleLinkCategory} disabled={!categoryToLink}>ربط</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Form Wizard Dialog */}
      <Dialog open={showProductFormDialog} onOpenChange={(open) => {
        setShowProductFormDialog(open);
        if (!open) {
          setEditingProductId(null);
        }
      }}>
        <DialogContent className="max-w-[98vw] w-[98vw] h-[98vh] max-h-[98vh] overflow-hidden p-0 flex flex-col">
          <div className="flex-1 overflow-hidden p-6 h-full">
            <ProductFormWizard
              initialData={editingProductId ? undefined : {
                categoryId: selectedCategory || '',
                categoryIds: selectedCategory ? getFullCategoryPathIds(selectedCategory) : [],
                path: selectedCategory ? getCategoryPathSlug(selectedCategory) : '',
              } as Partial<ProductFormData>}
              initialImages={[]}
              categories={categories}
              brands={brands}
              units={units}
              suppliers={suppliers}
              currencies={currencies}
              onSave={handleProductFormSave}
              onCancel={() => {
                setShowProductFormDialog(false);
                setEditingProductId(null);
              }}
              isEditing={!!editingProductId}
            />
          </div>
        </DialogContent>
      </Dialog>



      {/* Hierarchical Import Wizard */}
      <HierarchicalImportWizard
        open={showHierarchicalImportWizard}
        onOpenChange={setShowHierarchicalImportWizard}
        existingCategories={categories}
        existingBrands={brands}
        existingProducts={products}
        onSuccess={() => {
          if (onCategoriesUpdate) onCategoriesUpdate();
          if (onBrandsUpdate) onBrandsUpdate();
          if (onProductsUpdate) onProductsUpdate();
        }}
        onCreateBrand={onCreateBrand}
        onCreateCategory={onCreateCategory}
        onCreateProduct={async (data, options) => {
            // Normalize images to objects if they are strings, to match API expectation
            const productPayload = { ...data };
            if (Array.isArray(productPayload.images) && productPayload.images.length > 0 && typeof productPayload.images[0] === 'string') {
                 productPayload.images = (productPayload.images as string[]).map((url: string, index: number) => ({
                    url,
                    altText: (productPayload.name as string) || `Product image ${index + 1}`,
                    sortOrder: index,
                 }));
            }
            
            if (onCreateProduct) {
                return onCreateProduct(productPayload as never, options); 
            }
            // Fallback if no creation handler provided
            return coreApi.createProduct(productPayload, false, options);
        }}
      />
      </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
