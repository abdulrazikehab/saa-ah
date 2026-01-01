import React, { useState, useEffect, useMemo, useCallback, useRef, ChangeEvent } from 'react';
import * as XLSX from 'xlsx';
import { 
  DndContext, 
  DragOverlay, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragStartEvent, 
  DragEndEvent,
  useDraggable,
  useDroppable,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from 'react-i18next';
import { 
  ChevronRight, ChevronDown, ChevronLeft, Folder, FolderOpen, Package, 
  ArrowLeft, Plus, Tag, Eye, Edit, X, Image as ImageIcon, 
  AlertTriangle, Home, Store, Box, Trash2, Search, MoreVertical,
  LayoutGrid, List, Info, ExternalLink, RefreshCw, Upload, Cloud, Link as LinkIcon, Download
} from 'lucide-react';
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
import { cloudinaryAccessService } from '@/services/cloudinary-access.service';
import { getLogoUrl } from '@/config/logo.config';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import { CategoryForm, CategoryFormData } from './CategoryForm';
import { ProductFormWizard, ProductFormData } from './products/ProductFormWizard';

interface Brand {
  id: string;
  name: string;
  nameAr?: string;
  code?: string;
  logo?: string;
}

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
  path?: string;
}

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
  onCreateCategory?: (category: { name: string; nameAr?: string; description?: string; parentId?: string; image?: string }) => Promise<Category>;
  onCreateBrand?: (brand: { name: string; nameAr?: string; code?: string; logo?: string }) => Promise<Brand>;
  onCreateProduct?: (product: { name: string; nameAr?: string; description?: string; categoryId?: string; brandId?: string; price: number }) => Promise<Product>;
  onCategoriesUpdate?: () => void;
  onBrandsUpdate?: () => void;
  onProductsUpdate?: () => void;
  isFullScreen?: boolean;
}

type ViewType = 'categories' | 'subcategories' | 'products';

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
  const { t, i18n } = useTranslation();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeNode, setActiveNode] = useState<TreeNode | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    setActiveNode(active.data.current?.node as TreeNode);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveNode(null);

    if (!over || active.id === over.id) {
      return;
    }

    const draggedNode = active.data.current?.node as TreeNode;
    const dropTargetNode = over.data.current?.node as TreeNode;

    // Only allow dropping onto categories (or root for top-level categories)
    if (dropTargetNode && dropTargetNode.type !== 'category') {
      return;
    }

    const targetCategoryId = over.id === 'root' ? null : (dropTargetNode?.id || null);

    try {
      if (draggedNode.type === 'category') {
        const draggedCategory = draggedNode.data as Category;
        
        // Prevent moving category to itself or its own descendant
        if (targetCategoryId === draggedNode.id) {
          toast({
            title: t('common.error'),
            description: t('dashboard.hierarchical.errors.cannotMoveToSelf'),
            variant: 'destructive',
          });
          return;
        }

        // Check if target is a descendant (would create circular reference)
        if (targetCategoryId) {
          const isDescendant = (categoryId: string, parentId: string | null): boolean => {
            if (!parentId) return false;
            const parent = categories.find(c => c.id === parentId);
            if (!parent) return false;
            if (parent.id === categoryId) return true;
            return isDescendant(categoryId, parent.parentId || null);
          };
          
          if (isDescendant(draggedNode.id, targetCategoryId)) {
            toast({
              title: t('common.error'),
              description: t('dashboard.hierarchical.errors.cannotMoveToDescendant'),
              variant: 'destructive',
            });
            return;
          }
        }

        // Move category to new parent
        await coreApi.patch(`/categories/${draggedNode.id}`, { 
          parentId: targetCategoryId 
        }, { requireAuth: true });
        
        toast({
          title: t('dashboard.hierarchical.moved'),
          description: targetCategoryId 
            ? t('dashboard.hierarchical.categoryMoved', { name: draggedNode.name })
            : t('dashboard.hierarchical.categoryMovedToRoot', { name: draggedNode.name }),
        });
        
        if (onCategoriesUpdate) {
          await onCategoriesUpdate();
        }
      } else if (draggedNode.type === 'product') {
        const draggedProduct = draggedNode.data as Product;
        
        // Products must belong to a category, don't allow moving to root
        if (!targetCategoryId) {
          toast({
            title: t('common.warning'),
            description: t('dashboard.hierarchical.errors.productMustHaveCategory'),
            variant: 'destructive',
          });
          return;
        }

        // Get current categories for the product
        const currentCategoryIds = draggedProduct.categories?.map((pc: ProductCategory) => 
          pc.categoryId || pc.category?.id || pc.id
        ).filter(Boolean) || [];

        // Check if product already belongs to target category
        if (currentCategoryIds.includes(targetCategoryId)) {
          toast({
            title: t('common.warning'),
            description: t('dashboard.hierarchical.errors.productAlreadyInCategory'),
            variant: 'default',
          });
          return;
        }

        // Add target category to existing categories (preserve other categories)
        const updatedCategoryIds = [...currentCategoryIds, targetCategoryId];
        
        // Update product with new categories
        await coreApi.patch(`/products/${draggedNode.id}`, { 
          categoryIds: updatedCategoryIds 
        }, { requireAuth: true });
        
        toast({
          title: t('dashboard.hierarchical.moved'),
          description: t('dashboard.hierarchical.productMoved', { 
            productName: draggedNode.name, 
            categoryName: dropTargetNode.name 
          }),
        });
        
        if (onProductsUpdate) {
          await onProductsUpdate();
        }
      }
    } catch (error: any) {
      console.error('Failed to move item:', error);
      const errorMessage = error?.response?.data?.message || error?.message || t('common.unknownError');
      toast({
        title: t('dashboard.hierarchical.errors.moveFailed'),
        description: t('dashboard.hierarchical.errors.moveFailedDesc', { error: errorMessage }),
        variant: 'destructive',
      });
    }
  };

  const isRtl = i18n.language === 'ar';
  const [hasCloudinaryAccess, setHasCloudinaryAccess] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('categories');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null); // Deprecated - kept for compatibility but not used
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryPath, setCategoryPath] = useState<Category[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showCreateCategoryDialog, setShowCreateCategoryDialog] = useState(false);
  const [showCreateBrandDialog, setShowCreateBrandDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [categoryParentBrand, setCategoryParentBrand] = useState<string | null>(null); // Track which brand the new category belongs to
  const [categoryParentCategory, setCategoryParentCategory] = useState<string | null>(null); // Track parent category if any
  const [newCategoryData, setNewCategoryData] = useState({
    name: '',
    nameAr: '',
    description: '',
    image: '',
  });
  const [newBrandData, setNewBrandData] = useState({
    name: '',
    nameAr: '',
    code: '',
    logo: '',
  });
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [updatingCategory, setUpdatingCategory] = useState(false);
  const [creatingBrand, setCreatingBrand] = useState(false);
  
  // Track categories created under brands (categoryId -> brandId)
  // This allows showing categories under brands even before products are added
  // Load from localStorage on mount to preserve associations across reloads
  const loadCategoryBrandMap = (): Map<string, string> => {
    try {
      const stored = localStorage.getItem('hierarchical_categoryBrandMap');
      if (stored) {
        const data = JSON.parse(stored) as Record<string, string>;
        const map = new Map<string, string>(Object.entries(data));
        console.log('[loadCategoryBrandMap] Loaded from localStorage:', Array.from(map.entries()));
        return map;
      }
    } catch (error) {
      console.error('Failed to load categoryBrandMap from localStorage:', error);
    }
    return new Map<string, string>();
  };
  
  const saveCategoryBrandMap = (map: Map<string, string>) => {
    try {
      const data = Object.fromEntries(map);
      localStorage.setItem('hierarchical_categoryBrandMap', JSON.stringify(data));
      console.log('[saveCategoryBrandMap] Saved to localStorage:', Array.from(map.entries()));
    } catch (error) {
      console.error('Failed to save categoryBrandMap to localStorage:', error);
    }
  };
  
  const [categoryBrandMap, setCategoryBrandMap] = useState<Map<string, string>>(() => loadCategoryBrandMap());
  
  // Delete brand state
  const [showDeleteBrandDialog, setShowDeleteBrandDialog] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);
  const [deletingBrand, setDeletingBrand] = useState(false);

  // Delete category state
  const [showDeleteCategoryDialog, setShowDeleteCategoryDialog] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState(false);
  
  // Delete product state
  const [showDeleteProductDialog, setShowDeleteProductDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState(false);

  // Product details state
  const [selectedProductDetails, setSelectedProductDetails] = useState<ProductDetails | null>(null);
  const [loadingProductDetails, setLoadingProductDetails] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editProductData, setEditProductData] = useState({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    price: '',
    compareAtPrice: '',
    sku: '',
    barcode: '',
    stock: '',
    images: [] as string[],
  });
  const [savingProduct, setSavingProduct] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showBrandImagePicker, setShowBrandImagePicker] = useState(false);
  const [showCategoryImagePicker, setShowCategoryImagePicker] = useState(false);
  const [showProductFormDialog, setShowProductFormDialog] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<string | null>(null);
  const [editingProductFormData, setEditingProductFormData] = useState<Partial<ProductFormData> | null>(null);
  const [selectedCategoryForEdit, setSelectedCategoryForEdit] = useState<Category | null>(null);
  const [selectedBrandForEdit, setSelectedBrandForEdit] = useState<Brand | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

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
        const [unitsData, suppliersData] = await Promise.all([
          coreApi.get('/units').catch(() => []),
          coreApi.get('/suppliers').catch(() => []),
        ]);
        setUnits(Array.isArray(unitsData) ? unitsData : []);
        setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
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
      setCurrentView('products');
      
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
    return categories.filter(cat => !cat.parentId);
  }, [categories]);

  // Get subcategories of a category (no brand filtering)
  const getSubcategories = useCallback((parentId: string): Category[] => {
    return categories.filter(cat => cat.parentId === parentId);
  }, [categories]);

  const [allCategoryProducts, setAllCategoryProducts] = useState<Product[]>([]);
  const [showOtherBrandProducts, setShowOtherBrandProducts] = useState(false);

  // Get products in a category
  const getProductsInCategory = async (categoryId: string): Promise<Product[]> => {
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
    const filtered = products.filter(p => {
      // Check if product has this category in its categories array
      return p.categories?.some((pc: ProductCategory) => 
        (pc.categoryId || pc.category?.id || pc.id) === categoryId
      ) || false;
    });
    const uniqueById = Array.from(new Map(filtered.map(p => [p.id, p])).values());
    return Array.from(new Map(uniqueById.map(p => {
      const name = (p.nameAr || p.name || '').toString().trim().toLowerCase();
      return [name, p];
    })).values());
  };

  const handleBrandClick = (brandId: string) => {
    setSelectedBrand(brandId);
    setCurrentView('categories');
    setCategoryPath([]);
    setSelectedCategory(null);
    setFilteredProducts([]);
    setAllCategoryProducts([]);
    setShowOtherBrandProducts(false);
    setCurrentPage(1);
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
    if (showEditForm) {
      // Show edit form instead of navigating
      setSelectedCategoryForEdit(category);
      setSelectedProductForEdit(null);
      setEditingProductFormData(null);
      setSelectedBrandForEdit(null);
      return;
    }
    
      setSelectedCategory(category.id);
      setCategoryPath([...categoryPath, category]);
      setCurrentView('subcategories');
      setShowOtherBrandProducts(false); // Reset show all flag
    
      // Immediately load products for this category
      getProductsInCategory(category.id)
        .then(products => {
          console.log('Products loaded for category:', category.id, products.length, 'products');
          setAllCategoryProducts(products);
          
          // Filter if brand is selected and not showing all
          if (selectedBrand) {
            setFilteredProducts(products.filter(p => p.brandId === selectedBrand));
          } else {
            setFilteredProducts(products);
          }
        })
        .catch(error => {
          console.error('Failed to load products:', error);
          setFilteredProducts([]);
          setAllCategoryProducts([]);
        });
      onCategorySelect(category.id);
  };

  const handleBack = () => {
    if (currentView === 'products') {
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

  // Get current categories to display based on view
  const currentCategories = useMemo(() => {
    if (currentView === 'categories') {
      // Show all top-level categories (no brand filtering)
      return getTopLevelCategories();
    }
    
    if (currentView === 'subcategories' && selectedCategory) {
      // Show subcategories of the currently selected category
      return getSubcategories(selectedCategory);
    }
    
    return [];
  }, [currentView, selectedCategory, getTopLevelCategories, getSubcategories]);

  const currentProducts = useMemo(() => {
    return (currentView === 'products' || currentView === 'subcategories') && selectedCategory
      ? filteredProducts
      : [];
  }, [currentView, selectedCategory, filteredProducts]);

  // Load products when view changes to products or subcategories
  useEffect(() => {
    if ((currentView === 'products' || currentView === 'subcategories') && selectedCategory) {
      getProductsInCategory(selectedCategory)
        .then(products => {
          console.log('Loaded products for category:', selectedCategory, products);
          setAllCategoryProducts(products);
          
          if (selectedBrand && !showOtherBrandProducts) {
            setFilteredProducts(products.filter(p => p.brandId === selectedBrand));
          } else {
            setFilteredProducts(products);
          }
        })
        .catch(error => {
          console.error('Failed to load products:', error);
          setFilteredProducts([]);
          setAllCategoryProducts([]);
        });
    } else if (currentView !== 'products') {
      // Clear products when not in products view
      setFilteredProducts([]);
      setAllCategoryProducts([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, selectedCategory, selectedBrand, showOtherBrandProducts]);

  // Reload products when products are updated
  useEffect(() => {
    if (onProductsUpdate) {
      const handleProductsUpdate = () => {
        if (currentView === 'products' && selectedCategory) {
          getProductsInCategory(selectedCategory)
            .then(setFilteredProducts)
            .catch(() => setFilteredProducts([]));
        }
      };
      
      window.addEventListener('productsUpdated', handleProductsUpdate);
      return () => {
        window.removeEventListener('productsUpdated', handleProductsUpdate);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, selectedCategory, selectedBrand, onProductsUpdate]);

  // Initialize view - always start with categories (no brand selection)
  useEffect(() => {
    // View is already set to categories by default
  }, []);

  // Build categoryBrandMap from products when categories or products change
  // IMPORTANT: This only ADDS associations from products, it NEVER removes manual associations
  useEffect(() => {
    const newMap = new Map<string, string>();
    
    // For each category, find which brands have products in it
    categories.forEach(category => {
      const brandsWithProductsInCategory = new Map<string, number>();
      
      // Find all products that belong to this category
      products.forEach(product => {
        if (product.brandId && product.categories && Array.isArray(product.categories)) {
          const belongsToCategory = product.categories.some((pc: ProductCategory) => {
            const catId = pc.categoryId || pc.category?.id || pc.id;
            return catId === category.id;
          });
          
          if (belongsToCategory) {
            const count = brandsWithProductsInCategory.get(product.brandId) || 0;
            brandsWithProductsInCategory.set(product.brandId, count + 1);
          }
        }
      });
      
      // If only one brand has products in this category, associate them
      if (brandsWithProductsInCategory.size === 1) {
        const brandId = Array.from(brandsWithProductsInCategory.keys())[0];
        newMap.set(category.id, brandId);
      }
    });
    
    // CRITICAL: Only ADD new associations from products, NEVER remove existing ones
    // This preserves manually created associations (from handleCreateCategory)
    setCategoryBrandMap(prev => {
      const merged = new Map(prev);
      // Add new associations from products, but don't override existing ones
      newMap.forEach((brandId, categoryId) => {
        if (!merged.has(categoryId)) {
          merged.set(categoryId, brandId);
          console.log(`[useEffect] Auto-mapped category ${categoryId} to brand ${brandId} from products`);
        }
      });
      // Save to localStorage
      saveCategoryBrandMap(merged);
      return merged;
    });
    
    // Expanded states are maintained automatically
    
    if (currentView === 'subcategories' && selectedCategory && selectedBrand) {
      const categoryKey = `${selectedBrand}-${selectedCategory}`;
      const newExpanded = new Set(expandedCategories);
      if (!newExpanded.has(categoryKey)) {
        newExpanded.add(categoryKey);
        setExpandedCategories(newExpanded);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, products]);

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
      return currentCategories.length > 0;
    }
    
    // At subcategories view - check if current categories are displayed
    if (currentView === 'subcategories') {
      return currentCategories.length > 0;
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
      if (category && !category.parentId) {
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

    if (editingCategory) {
      try {
        setUpdatingCategory(true);
        await coreApi.updateCategory(editingCategory.id, {
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
      
      if (editingProductId) {
        await coreApi.patch(`/products/${editingProductId}`, preparedData);
        toast({
          title: t('common.success'),
          description: t('dashboard.products.messages.productUpdated'),
        });
      } else {
        if (onCreateProduct) {
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
          title: 'الحد الأقصى للفئات الفرعية',
          description: `لا يمكن إضافة أكثر من ${MAX_SUBCATEGORIES} فئات فرعية لكل فئة رئيسية`,
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

  const handleCreateBrand = async () => {
    if (!newBrandData.name.trim()) {
      toast({
        title: 'اسم العلامة التجارية مطلوب',
        description: 'يرجى إدخال اسم للعلامة التجارية',
        variant: 'destructive',
      });
      return;
    }

    try {
      setCreatingBrand(true);
      
      if (editingBrand) {
        // Update existing brand
        await coreApi.updateBrand(editingBrand.id, {
          name: newBrandData.name,
          nameAr: newBrandData.nameAr || undefined,
          code: newBrandData.code || undefined,
          logo: newBrandData.logo || undefined,
        });
        
        toast({
          title: 'نجح',
          description: 'تم تحديث العلامة التجارية بنجاح',
        });
      } else {
        // Create new brand
        if (onCreateBrand) {
          await onCreateBrand({
            name: newBrandData.name,
            nameAr: newBrandData.nameAr || newBrandData.name,
            code: newBrandData.code || undefined,
            logo: newBrandData.logo || undefined,
          });
        } else {
          await coreApi.createBrand({
            name: newBrandData.name,
            nameAr: newBrandData.nameAr || undefined,
            code: newBrandData.code || undefined,
            logo: newBrandData.logo || undefined,
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

  const handleImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        interface ImportResult {
          categories: Category[];
          products: Product[];
          brands: Brand[];
        }

        const result: ImportResult = {
          categories: [],
          products: [],
          brands: []
        };

        // Parse Categories
        if (workbook.Sheets["Categories"]) {
          const rawCategories = XLSX.utils.sheet_to_json(workbook.Sheets["Categories"]);
          result.categories = rawCategories.map((c: Record<string, any>) => ({
            id: String(c.ID || ''),
            name: String(c.Name || ''),
            nameAr: String(c.NameAr || ''),
            parentId: c.ParentID ? String(c.ParentID) : undefined,
            description: c.Description ? String(c.Description) : undefined,
            image: c.Image ? String(c.Image) : undefined
          }));
        }

        // Parse Products
        if (workbook.Sheets["Products"]) {
          const rawProducts = XLSX.utils.sheet_to_json(workbook.Sheets["Products"]);
          result.products = rawProducts.map((p: Record<string, any>) => ({
            id: String(p.ID || ''),
            name: String(p.Name || ''),
            nameAr: String(p.NameAr || ''),
            description: p.Description ? String(p.Description) : undefined,
            descriptionAr: p.DescriptionAr ? String(p.DescriptionAr) : undefined,
            price: Number(p.Price || 0),
            cost: p.Cost ? Number(p.Cost) : undefined,
            sku: p.SKU ? String(p.SKU) : undefined,
            barcode: p.Barcode ? String(p.Barcode) : undefined,
            stock: p.Stock ? Number(p.Stock) : undefined,
            brandId: p.BrandID ? String(p.BrandID) : undefined,
            categoryIds: p.CategoryIDs ? p.CategoryIDs.toString().split(',') : [],
            status: p.Status as 'ACTIVE' | 'DRAFT' | 'ARCHIVED',
            images: p.Images ? p.Images.toString().split(',') : [],
            featured: p.Featured === 'Yes'
          }));
        }

        // Parse Brands
        if (workbook.Sheets["Brands"]) {
          const rawBrands = XLSX.utils.sheet_to_json(workbook.Sheets["Brands"]);
          result.brands = rawBrands.map((b: Record<string, any>) => ({
            id: String(b.ID || ''),
            name: String(b.Name || ''),
            nameAr: String(b.NameAr || ''),
            code: b.Code ? String(b.Code) : undefined,
            logo: b.Logo ? String(b.Logo) : undefined
          }));
        }

        console.log('Imported Excel data:', result);
        
        toast({
          title: 'تم الاستيراد',
          description: `تم قراءة ملف Excel بنجاح (${result.categories.length} فئة, ${result.products.length} منتج, ${result.brands.length} علامة تجارية). سيتم تفعيل المعالجة قريباً.`,
        });
      } catch (error) {
        console.error('Import error:', error);
        toast({
          title: 'خطأ في الاستيراد',
          description: 'تعذر قراءة ملف Excel. تأكد من صحة الملف.',
          variant: 'destructive',
        });
      }
    };
    reader.readAsBinaryString(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  // Tree View State
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Get products in a category
  const getProductsForCategory = useCallback((categoryId: string): Product[] => {
    const filtered = products.filter(p => {
      return p.categories?.some((pc: ProductCategory) => 
        (pc.categoryId || pc.category?.id || pc.id) === categoryId
      ) || false;
    });
    
    // Deduplicate by ID first (most important - ensures same product ID only appears once)
    const uniqueById = Array.from(new Map(filtered.map(p => [p.id, p])).values());
    
    // Additional deduplication by normalized name to catch any edge cases
    const uniqueByName = Array.from(new Map(uniqueById.map(p => {
      // Normalize name for deduplication (trim and lowercase)
      const name = (p.nameAr || p.name || '').toString().trim().toLowerCase();
      return [name, p];
    })).values());

    return uniqueByName;
  }, [products]);

  // Build Tree Data - categories with products nested under them
  const buildCategoryTree = useCallback((cats: Category[]): TreeNode[] => {
    return cats.map(cat => {
      const subcats = getSubcategories(cat.id);
      const categoryProducts = getProductsForCategory(cat.id);
      
      // Build children: subcategories first, then products
      const children: TreeNode[] = [];
      const addedProductIds = new Set<string>(); // Track products already added to prevent duplicates
      
      // Add subcategories
      if (subcats.length > 0) {
        children.push(...buildCategoryTree(subcats));
        // Track product IDs from subcategories to avoid duplicates
        const collectProductIds = (nodes: TreeNode[]) => {
          nodes.forEach(node => {
            if (node.type === 'product') {
              addedProductIds.add(node.id);
            }
            if (node.children) {
              collectProductIds(node.children);
            }
          });
        };
        collectProductIds(children);
      }
      
      // Add products as tree nodes, ensuring no duplicates
      categoryProducts.forEach(product => {
        // Only add if not already in children (from subcategories or previous iterations)
        if (!addedProductIds.has(product.id)) {
          children.push({
            id: product.id,
            type: 'product' as const,
            data: product,
            name: product.nameAr || product.name,
            children: []
          });
          addedProductIds.add(product.id);
        }
      });
      
      return {
        id: cat.id,
        type: 'category' as const,
        data: cat,
        name: cat.nameAr || cat.name,
        children: children
      };
    });
  }, [getSubcategories, getProductsForCategory]);

  const treeData = useMemo(() => {
    // Build tree from top-level categories only (no brands)
    const topLevelCategories = getTopLevelCategories();
    return buildCategoryTree(topLevelCategories);
  }, [getTopLevelCategories, buildCategoryTree]);

  // Root Droppable Component - allows dropping items to root level
  const RootDroppable = ({ children }: { children: React.ReactNode }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: 'root',
      data: { type: 'root', node: { id: 'root', type: 'category' as const, name: 'Root', children: [] } }
    });

    return (
      <div
        ref={setNodeRef}
        className={`min-h-[200px] ${isOver ? 'bg-primary/5 border-2 border-dashed border-primary/30 rounded-lg' : ''}`}
      >
        {children}
      </div>
    );
  };

  // Tree Item Component
  const TreeItem = ({ node, level }: { node: TreeNode, level: number }) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isProduct = node.type === 'product';
    const isBrand = node.type === 'brand';
    const isSelected = isProduct 
      ? selectedProductForEdit === node.id 
      : isBrand 
        ? (selectedBrand === node.id || selectedBrandForEdit?.id === node.id)
        : (selectedCategory === node.id || selectedCategoryForEdit?.id === node.id);
    
    const [isDraggingState, setIsDraggingState] = useState(false);

    const { attributes, listeners, setNodeRef: setDraggableRef, transform, isDragging } = useDraggable({
      id: node.id,
      data: { type: node.type, node }
    });

    const { setNodeRef: setDroppableRef, isOver } = useDroppable({
      id: node.id,
      disabled: isProduct || isBrand // Cannot drop onto products or brands
    });

    // Track dragging state to prevent click during drag
    useEffect(() => {
      setIsDraggingState(isDragging);
    }, [isDragging]);

    const style = {
      transform: CSS.Translate.toString(transform),
      opacity: isDragging ? 0.4 : 1,
    };

    const handleClick = (e: React.MouseEvent) => {
      // Prevent click if we just finished dragging
      if (isDraggingState) {
        e.stopPropagation();
        return;
      }
      
      e.stopPropagation();
      if (isProduct) {
        // Load product details in the same page instead of navigating away
        loadProductDetails(node.id);
        // Clear category/brand edit states
        setSelectedCategoryForEdit(null);
        setSelectedBrandForEdit(null);
      } else if (node.type === 'category') {
        const category = node.data as Category;
        // Show edit form in main content
        handleCategoryClick(category, true);
        // Toggle expansion on click
        toggleNode(node.id);
      } else if (node.type === 'brand') {
        // Set brand for editing in main content area
        setSelectedBrandForEdit(node.data as Brand);
        // Clear other edit states
        setSelectedProductForEdit(null);
        setEditingProductFormData(null);
        setSelectedCategoryForEdit(null);
        // Auto expand brand on click if it has children
        if (hasChildren && !isExpanded) toggleNode(node.id);
      }
    };

    return (
      <div 
        ref={(el) => {
          setDraggableRef(el);
          setDroppableRef(el);
        }}
        style={style}
        className="select-none"
      >
        <ContextMenu>
          <ContextMenuTrigger>
            <div 
              {...attributes}
              {...listeners}
              className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-grab active:cursor-grabbing transition-all duration-200 ${
                isSelected 
                  ? 'bg-gradient-to-r from-primary/20 to-primary/10 text-primary font-semibold shadow-sm border border-primary/20' 
                  : isOver
                    ? 'bg-primary/10 border border-primary/30 text-primary shadow-sm'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground hover:shadow-sm border border-transparent hover:border-border/30'
              }`}
              style={{ [isRtl ? 'paddingRight' : 'paddingLeft']: `${level * 12 + 8}px` }}
              onClick={handleClick}
            >
              {!isProduct && (
              <div 
                className={`p-0.5 rounded-sm hover:bg-muted/80 transition-colors ${hasChildren ? 'visible' : 'invisible'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(node.id);
                }}
              >
                {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : (isRtl ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />)}
              </div>
              )}
              
              {isProduct ? (
                <Package className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-blue-500/80'}`} />
              ) : isExpanded ? (
                <FolderOpen className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-amber-500/80'}`} />
              ) : (
                <Folder className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-amber-500/80'}`} />
              )}
              
              <span className="truncate text-sm">{node.name}</span>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-56">
            {isProduct ? (
              <ContextMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  setProductToDelete(node.data as Product);
                  setShowDeleteProductDialog(true);
                }}
                className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('common.delete')} {t('nav.products')}
              </ContextMenuItem>
            ) : (
              <>
                <ContextMenuItem onClick={(e) => {
                  e.stopPropagation();
                  if (isBrand) {
                    setCategoryParentBrand(node.id);
                    setCategoryParentCategory(null);
                  } else {
                    const category = node.data as Category;
                    if (getCategoryDepth(category.id) >= MAX_DEPTH) {
                      toast({
                        title: t('common.error'),
                        description: t('dashboard.hierarchical.errors.maxDepthReached', { max: MAX_DEPTH }),
                        variant: 'destructive',
                      });
                      return;
                    }
                    setCategoryParentCategory(category.id);
                    const categoryBrand = categoryBrandMap.get(category.id);
                    if (categoryBrand) setCategoryParentBrand(categoryBrand);
                  }
                  setEditingCategory(null);
                  setNewCategoryData({ name: '', nameAr: '', description: '', image: '' });
                  setShowCreateCategoryDialog(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('categories.productCategories.addCategory')}
                </ContextMenuItem>

                <ContextMenuItem onClick={(e) => {
                  e.stopPropagation();
                  if (isBrand) {
                    setSelectedBrand(node.id);
                    setSelectedCategory(null);
                  } else {
                    const category = node.data as Category;
                    setSelectedCategory(category.id);
                  }
                  handleOpenProductForm();
                }}>
                  <Package className="h-4 w-4 mr-2" />
                  {t('dashboard.products.addProduct')}
                </ContextMenuItem>
                
                <ContextMenuItem onClick={(e) => {
                  e.stopPropagation();
                  if (isBrand) {
                    const brand = node.data as Brand;
                    setEditingBrand(brand);
                    setNewBrandData({
                      name: brand.name,
                      nameAr: brand.nameAr || '',
                      code: brand.code || '',
                      logo: brand.logo || '',
                    });
                    setShowCreateBrandDialog(true);
                  } else {
                    const category = node.data as Category;
                    setEditingCategory(category);
                    setNewCategoryData({
                      name: category.name,
                      nameAr: category.nameAr || '',
                      description: category.description || '',
                      image: category.image || '',
                    });
                    setCategoryParentCategory(category.parentId || null);
                    setShowCreateCategoryDialog(true);
                  }
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  {t('common.edit')}
                </ContextMenuItem>
                
                <ContextMenuSeparator />
                
                <ContextMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isBrand) {
                      setBrandToDelete(node.data as Brand);
                      setShowDeleteBrandDialog(true);
                    } else {
                      setCategoryToDelete(node.data as Category);
                      setShowDeleteCategoryDialog(true);
                    }
                  }}
                  className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('common.delete')} {isBrand ? t('dashboard.brands.brand') : t('nav.categories')}
                </ContextMenuItem>
              </>
            )}
          </ContextMenuContent>
        </ContextMenu>
        
        {isExpanded && hasChildren && !isProduct && (
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
    return {
      categories: currentCategories.filter(c => 
        (c.name || '').toLowerCase().includes(query) || 
        (c.nameAr || '').toLowerCase().includes(query)
      ),
      products: currentProducts.filter(p => 
        (p.name || '').toLowerCase().includes(query) || 
        (p.nameAr || '').toLowerCase().includes(query) ||
        (p.sku || '').toLowerCase().includes(query)
      )
    };
  }, [currentCategories, currentProducts, searchQuery]);

  // Paginated items - separate categories and products for proper rendering
  const paginatedItems = useMemo(() => {
    // Combine categories and products for pagination (categories first, then products)
    const allItems = [
      ...filteredItems.categories.map(c => ({ ...c, type: 'category' as const })),
      ...filteredItems.products.map(p => ({ ...p, type: 'product' as const }))
    ];
    
    const totalItems = allItems.length;
    const totalPages = totalItems > 0 ? Math.ceil(totalItems / itemsPerPage) : 1;
    
    // Calculate pagination slice
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = allItems.slice(startIndex, endIndex);
    
    // Separate back into categories and products
    const paginatedCategories = paginated
      .filter(item => item.type === 'category')
      .map(item => {
        const { type, ...rest } = item;
        return rest as Category;
      });
    
    const paginatedProducts = paginated
      .filter(item => item.type === 'product')
      .map(item => {
        const { type, ...rest } = item;
        return rest as Product;
      });
    
    return {
      categories: paginatedCategories,
      products: paginatedProducts,
      totalItems,
      totalPages,
    };
  }, [filteredItems, currentPage, itemsPerPage]);

  // Reset page when view, search, or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [currentView, selectedBrand, selectedCategory, searchQuery]);

  // Ensure currentPage doesn't exceed totalPages
  useEffect(() => {
    if (paginatedItems.totalPages > 0 && currentPage > paginatedItems.totalPages) {
      setCurrentPage(1);
    }
  }, [paginatedItems.totalPages, currentPage]);

  const AllCategoriesButton = () => {
    const { setNodeRef, isOver } = useDroppable({
      id: 'root',
      data: { type: 'category', node: { id: null, type: 'category', name: 'Root' } }
    });

    return (
      <button
        ref={setNodeRef}
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
            : isOver
              ? 'bg-primary/10 border border-primary/30 text-primary shadow-sm'
              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground hover:shadow-sm border border-transparent hover:border-border/30'
        }`}
      >
        <div className="w-5 flex justify-center">
          <LayoutGrid className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium">{t('categories.productCategories.allCategories', 'جميع الفئات')}</span>
      </button>
    );
  };

  return (
    <div className={`flex overflow-hidden rounded-2xl border border-border bg-background/40 backdrop-blur-2xl shadow-2xl ${
      isFullScreen ? 'h-full' : 'h-[calc(100vh-140px)] min-h-[600px]'
    }`}>
      {/* Sidebar - Brands */}

      <div className="w-72 bg-gradient-to-b from-card/40 to-card/20 border-l border-border/50 flex flex-col backdrop-blur-xl shadow-lg">
        <div className="p-4 border-b border-border/50 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-2.5">
            <img 
              src={getLogoUrl()} 
              alt="Saeaa Logo" 
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
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImport}
                className="hidden"
                accept=".xlsx, .xls"
              />
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
                onClick={() => fileInputRef.current?.click()}
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

        <ScrollArea className="flex-1 p-3" dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="space-y-2">
            <DndContext 
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <RootDroppable>
                <div className="space-y-2">
                  <AllCategoriesButton />

                  <div className="pt-1 pb-1">
                    <Separator className="bg-border/30" />
                  </div>

                  <div className="space-y-1">
                    {treeData.map(node => (
                      <TreeItem key={node.id} node={node} level={0} />
                    ))}
                  </div>
                </div>
              </RootDroppable>

              <DragOverlay dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({
                  styles: {
                    active: {
                      opacity: '0.4',
                    },
                  },
                }),
              }}>
                {activeId && activeNode ? (
                  <div className="flex items-center gap-1.5 py-1.5 px-2 rounded-md bg-primary/20 text-primary border border-primary/30 shadow-xl backdrop-blur-md opacity-90 cursor-grabbing">
                    {activeNode.type === 'product' ? (
                      <Package className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Folder className="h-4 w-4 text-amber-500" />
                    )}
                    <span className="text-sm font-medium">{activeNode.name}</span>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </ScrollArea>
        
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-background/30 to-background/10">
        {/* Toolbar */}
        <div className="h-20 border-b border-border/50 flex items-center justify-between px-6 md:px-8 bg-gradient-to-r from-card/20 via-card/10 to-transparent backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-4">
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

          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="relative w-40 md:w-64 hidden sm:block">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                placeholder={t('common.search', 'بحث...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 h-10 bg-muted/60 border-border/50 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary/50 rounded-xl transition-all duration-200"
              />
            </div>
            
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/50 hidden sm:flex shadow-sm">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'grid' ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                title={t('common.gridView', 'عرض الشبكة')}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'list' ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                title={t('common.listView', 'عرض القائمة')}
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
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImport}
                className="hidden"
                accept=".xlsx, .xls"
              />
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
                onClick={() => fileInputRef.current?.click()}
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
            </div>

            <div className="flex items-center gap-2">
              {currentView !== 'products' && (
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
                  <span className="hidden lg:inline">{currentView === 'categories' ? t('categories.productCategories.addCategory', 'إضافة فئة') : t('categories.productCategories.addSubcategory', 'إضافة فئة فرعية')}</span>
                </Button>
              )}
              {canAddProduct && (
                <Button
                  onClick={handleOpenProductForm}
                  className="h-10 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white border-none shadow-lg shadow-blue-500/20 hover:shadow-xl rounded-xl gap-2 transition-all duration-200 font-semibold"
                >
                  <Package className="h-4 w-4" />
                  <span>{t('dashboard.products.addProduct', 'إضافة منتج')}</span>
                </Button>
              )}
            </div>
          </div>
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
                  onCancel={() => {
                    setSelectedProductForEdit(null);
                    setEditingProductFormData(null);
                  }}
                  isEditing={true}
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
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                      <Label>اسم العلامة التجارية</Label>
                      <Input value={selectedBrandForEdit.name} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>الاسم بالعربية</Label>
                      <Input value={selectedBrandForEdit.nameAr || ''} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>الكود</Label>
                      <Input value={selectedBrandForEdit.code || ''} readOnly />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      تعديل العلامات التجارية متاح قريباً
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
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
                      whileHover={{ scale: 1.02 }}
                      className={viewMode === 'grid' 
                        ? "group relative bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl p-5 cursor-pointer hover:border-secondary/50 transition-all duration-300 shadow-xl hover:shadow-secondary/5"
                        : "group flex items-center gap-4 bg-card/40 backdrop-blur-md border border-border/50 rounded-xl p-3 cursor-pointer hover:border-secondary/50 transition-all duration-300"
                      }
                      onClick={() => handleCategoryClick(category, true)}
                    >
                      <div className={viewMode === 'grid' ? "flex items-start justify-between mb-4" : "flex-shrink-0"}>
                        <div className={`p-3 rounded-xl bg-muted/50 border border-border group-hover:bg-secondary/10 group-hover:border-secondary/30 transition-all duration-300`}>
                          <Folder className="h-6 w-6 text-secondary" />
                        </div>
                        {viewMode === 'grid' && (
                          <div className="flex items-center gap-1">
                            <button 
                              className="p-2 rounded-lg hover:bg-blue-500/20 text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
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
                              title="تعديل الفئة"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              className="p-2 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-500 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCategoryToDelete(category);
                                setShowDeleteCategoryDialog(true);
                              }}
                              title="حذف الفئة"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <ContextMenu>
                              <ContextMenuTrigger asChild>
                                <button 
                                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                              </ContextMenuTrigger>
                            <ContextMenuContent>
                              <ContextMenuItem onClick={(e) => {
                                e.stopPropagation();
                                // Add subcategory to this category
                                if (getCategoryDepth(category.id) >= MAX_DEPTH) {
                                  toast({
                                    title: 'تم الوصول إلى الحد الأقصى',
                                    description: `لا يمكن إضافة فئات فرعية أكثر. الحد الأقصى هو ${MAX_DEPTH} مستويات.`,
                                    variant: 'destructive',
                                  });
                                  return;
                                }
                                setEditingCategory(null);
                                setNewCategoryData({ name: '', nameAr: '', description: '', image: '' });
                                // Set parent category to this category
                                setCategoryParentCategory(category.id);
                                // Set parent brand if category is associated with a brand
                                const categoryBrand = categoryBrandMap.get(category.id);
                                if (categoryBrand) {
                                  setCategoryParentBrand(categoryBrand);
                                } else if (selectedBrand) {
                                  setCategoryParentBrand(selectedBrand);
                                }
                                setShowCreateCategoryDialog(true);
                              }} disabled={getCategoryDepth(category.id) >= MAX_DEPTH}>
                                <Plus className="h-4 w-4 mr-2" />
                                إضافة فئة فرعية
                              </ContextMenuItem>
                              <ContextMenuItem onClick={(e) => {
                                e.stopPropagation();
                                setEditingCategory(category);
                                setNewCategoryData({
                                  name: category.name,
                                  nameAr: category.nameAr || '',
                                  description: category.description || '',
                                  image: category.image || '',
                                });
                                // Set parent category
                                setCategoryParentCategory(category.parentId || null);
                                setShowCreateCategoryDialog(true);
                              }}>
                                <Edit className="h-4 w-4 mr-2" />
                                تعديل
                              </ContextMenuItem>
                              <ContextMenuItem onClick={(e) => {
                                e.stopPropagation();
                                setCategoryToDelete(category);
                                setShowDeleteCategoryDialog(true);
                              }} className="text-red-500 focus:text-red-500">
                                <Trash2 className="h-4 w-4 mr-2" />
                                حذف الفئة
                              </ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className={viewMode === 'grid' ? "font-bold text-foreground group-hover:text-primary transition-colors truncate" : "text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors truncate"}>
                          {category.nameAr || category.name}
                        </h4>
                        <div className={viewMode === 'grid' ? "text-xs text-muted-foreground mt-1" : "text-sm text-muted-foreground"}>
                          <p className="truncate">{getSubcategories(category.id).length} فئات فرعية</p>
                          <p className="text-xs text-muted-foreground mt-0.5">المستوى: {getCategoryDepth(category.id)}/{MAX_DEPTH}</p>
                        </div>
                      </div>

                      {viewMode === 'list' && (
                        <div className="flex items-center gap-2">
                          <button 
                            className="p-2 rounded-lg hover:bg-blue-500/20 text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCategory(category);
                              setNewCategoryData({
                                name: category.name,
                                nameAr: category.nameAr || '',
                                description: (category as any).description || '',
                                image: category.image || '',
                              });
                              setCategoryParentCategory(category.parentId || null);
                              setShowCreateCategoryDialog(true);
                            }}
                            title="تعديل الفئة"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            className="p-2 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-500 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCategoryToDelete(category);
                              setShowDeleteCategoryDialog(true);
                            }}
                            title="حذف الفئة"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <ContextMenu>
                            <ContextMenuTrigger asChild>
                              <button 
                                className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </ContextMenuTrigger>
                            <ContextMenuContent>
                              <ContextMenuItem onClick={(e) => {
                                e.stopPropagation();
                                // Add subcategory to this category
                                if (getCategoryDepth(category.id) >= MAX_DEPTH) {
                                  toast({
                                    title: 'تم الوصول إلى الحد الأقصى',
                                    description: `لا يمكن إضافة فئات فرعية أكثر. الحد الأقصى هو ${MAX_DEPTH} مستويات.`,
                                    variant: 'destructive',
                                  });
                                  return;
                                }
                                setEditingCategory(null);
                                setNewCategoryData({ name: '', nameAr: '', description: '', image: '' });
                                // Set parent category to this category
                                setCategoryParentCategory(category.id);
                                // Set parent brand if category is associated with a brand
                                const categoryBrand = categoryBrandMap.get(category.id);
                                if (categoryBrand) {
                                  setCategoryParentBrand(categoryBrand);
                                } else if (selectedBrand) {
                                  setCategoryParentBrand(selectedBrand);
                                }
                                setShowCreateCategoryDialog(true);
                              }} disabled={getCategoryDepth(category.id) >= MAX_DEPTH}>
                                <Plus className="h-4 w-4 mr-2" />
                                إضافة فئة فرعية
                              </ContextMenuItem>
                              <ContextMenuItem onClick={(e) => {
                                e.stopPropagation();
                                setEditingCategory(category);
                                setNewCategoryData({
                                  name: category.name,
                                  nameAr: category.nameAr || '',
                                  description: category.description || '',
                                  image: category.image || '',
                                });
                                // Set parent category
                                setCategoryParentCategory(category.parentId || null);
                                setShowCreateCategoryDialog(true);
                              }}>
                                <Edit className="h-4 w-4 mr-2" />
                                تعديل
                              </ContextMenuItem>
                              <ContextMenuItem onClick={(e) => {
                                e.stopPropagation();
                                setCategoryToDelete(category);
                                setShowDeleteCategoryDialog(true);
                              }} className="text-red-500 focus:text-red-500">
                                <Trash2 className="h-4 w-4 mr-2" />
                                حذف الفئة
                              </ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {/* Products - Only show if not in products view (handled separately above) */}
                  {(currentView === 'categories' || currentView === 'subcategories') && paginatedItems.products.map((product) => (
                    <motion.div
                      key={product.id}
                      whileHover={{ scale: 1.02 }}
                      className={viewMode === 'grid'
                        ? "group relative bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl p-5 cursor-pointer hover:border-primary/50 transition-all duration-300 shadow-xl hover:shadow-primary/5"
                        : "group flex items-center gap-4 bg-card/40 backdrop-blur-md border border-border/50 rounded-xl p-3 cursor-pointer hover:border-primary/50 transition-all duration-300"
                      }
                      onClick={() => loadProductDetails(product.id)}
                    >
                      <div className={viewMode === 'grid' ? "flex items-start justify-between mb-4" : "flex-shrink-0"}>
                        <div className={`p-3 rounded-xl bg-muted/50 border border-border group-hover:bg-primary/10 group-hover:border-primary/30 transition-all duration-300`}>
                          <Package className="h-6 w-6 text-primary" />
                        </div>
                        {viewMode === 'grid' && (
                          <button 
                            className="p-2 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-500 transition-colors"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm(`هل أنت متأكد من حذف المنتج "${product.nameAr || product.name}"؟`)) {
                                try {
                                  await coreApi.delete(`/products/${product.id}`, { requireAuth: true });
                                  toast({
                                    title: 'تم الحذف',
                                    description: `تم حذف المنتج "${product.nameAr || product.name}" بنجاح`,
                                  });
                                  if (onProductsUpdate) onProductsUpdate();
                                  // Refresh products list
                                  if (selectedCategory) {
                                    const updatedProducts = await getProductsInCategory(selectedCategory);
                                    setFilteredProducts(updatedProducts);
                                  }
                                } catch (error: unknown) {
                                  const errorMessage = error instanceof Error ? error.message : 'فشل حذف المنتج';
                                  toast({
                                    title: 'خطأ',
                                    description: errorMessage,
                                    variant: 'destructive',
                                  });
                                }
                              }
                            }}
                            title="حذف المنتج"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className={viewMode === 'grid' ? "font-bold text-foreground group-hover:text-primary transition-colors truncate" : "text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors truncate"}>
                          {product.nameAr || product.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={viewMode === 'grid' ? "text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded uppercase font-mono" : "text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded uppercase font-mono"}>
                            {product.sku || 'NO SKU'}
                          </span>
                          {product.path && (
                            <span className={viewMode === 'grid' ? "text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-mono truncate max-w-[100px]" : "text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-mono"}>
                              {product.path}
                            </span>
                          )}
                          {viewMode === 'list' && product.price && (
                            <span className="text-sm font-semibold text-primary">
                              {product.price.toFixed(2)} ر.س
                            </span>
                          )}
                        </div>
                      </div>

                      {viewMode === 'list' && (
                        <div className="flex items-center gap-2">
                          <button 
                            className="p-2 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-500 transition-colors"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm(`هل أنت متأكد من حذف المنتج "${product.nameAr || product.name}"؟`)) {
                                try {
                                  await coreApi.delete(`/products/${product.id}`, { requireAuth: true });
                                  toast({
                                    title: 'تم الحذف',
                                    description: `تم حذف المنتج "${product.nameAr || product.name}" بنجاح`,
                                  });
                                  if (onProductsUpdate) onProductsUpdate();
                                  // Refresh products list
                                  if (selectedCategory) {
                                    const updatedProducts = await getProductsInCategory(selectedCategory);
                                    setFilteredProducts(updatedProducts);
                                  }
                                } catch (error: unknown) {
                                  const errorMessage = error instanceof Error ? error.message : 'فشل حذف المنتج';
                                  toast({
                                    title: 'خطأ',
                                    description: errorMessage,
                                    variant: 'destructive',
                                  });
                                }
                              }
                            }}
                            title="حذف المنتج"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
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
                              ⚠️ تم الوصول إلى الحد الأقصى ({MAX_DEPTH} مستويات). يمكنك إضافة المنتجات فقط.
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
              onClick={handleCreateBrand}
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
    </div>
  );
}
