import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ChevronRight, ChevronDown, ChevronLeft, Folder, FolderOpen, Package, 
  ArrowLeft, Plus, Tag, Eye, Edit, X, Image as ImageIcon, 
  AlertTriangle, Home, Store, Box, Trash2, Search, MoreVertical,
  LayoutGrid, List, Info, ExternalLink, RefreshCw, Upload
} from 'lucide-react';
import { CloudinaryImagePicker } from './CloudinaryImagePicker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '@/components/ui/context-menu';
import { ImageUpload } from '@/components/ui/image-upload';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { coreApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';

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
}

type ViewType = 'brands' | 'categories' | 'subcategories' | 'products';

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
}: HierarchicalExplorerProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<ViewType>('brands');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(selectedBrandId || null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryPath, setCategoryPath] = useState<Category[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showCreateCategoryDialog, setShowCreateCategoryDialog] = useState(false);
  const [showCreateBrandDialog, setShowCreateBrandDialog] = useState(false);
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

  // Product details state
  const [showProductDetails, setShowProductDetails] = useState(false);
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
      setShowProductDetails(true);
      
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
    } catch (error) {
      console.error('Failed to load product details:', error);
      toast({
        title: 'تعذر تحميل المنتج',
        description: 'حدث خطأ أثناء تحميل تفاصيل المنتج. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
      setShowProductDetails(false);
    } finally {
      setLoadingProductDetails(false);
    }
  };

  // Save product changes
  const handleSaveProduct = async () => {
    if (!selectedProductDetails) return;

    try {
      setSavingProduct(true);
      
      await coreApi.patch(`/products/${selectedProductDetails.id}`, {
        name: editProductData.name,
        nameAr: editProductData.nameAr,
        description: editProductData.description,
        descriptionAr: editProductData.descriptionAr,
        price: parseFloat(editProductData.price) || 0,
        compareAtPrice: editProductData.compareAtPrice ? parseFloat(editProductData.compareAtPrice) : undefined,
        sku: editProductData.sku || undefined,
        barcode: editProductData.barcode || undefined,
        images: editProductData.images,
      });

      // Update inventory if stock changed
      if (selectedProductDetails.variants?.[0]?.id) {
        const newStock = parseInt(editProductData.stock) || 0;
        if (newStock !== selectedProductDetails.stock) {
          await coreApi.patch(`/products/${selectedProductDetails.id}/variants/${selectedProductDetails.variants[0].id}`, {
            inventoryQuantity: newStock,
          });
        }
      }

      toast({
        title: 'نجح',
        description: 'تم تحديث المنتج بنجاح',
      });

      // Refresh product details
      await loadProductDetails(selectedProductDetails.id);
      setIsEditingProduct(false);

      // Refresh products list
      if (onProductsUpdate) {
        onProductsUpdate();
      }
      if (selectedCategory) {
        const updatedProducts = await getProductsInCategory(selectedCategory, selectedBrand);
        setFilteredProducts(updatedProducts);
      }
    } catch (error) {
      console.error('Failed to save product:', error);
      toast({
        title: 'تعذر حفظ التغييرات',
        description: 'لم نتمكن من حفظ تعديلات المنتج. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setSavingProduct(false);
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

  // Get categories by brand - ensures proper hierarchy: Brand → Category → Subcategory → Product
  const getCategoriesByBrand = useCallback((brandId: string | null): Category[] => {
    if (!brandId) {
      // Return all top-level categories when no brand is selected
      return categories.filter(cat => !cat.parentId);
    }
    
    // Return top-level categories that are in this brand
    const brandSet = getCategorySetForBrand(brandId);
    return categories.filter(cat => !cat.parentId && brandSet.has(cat.id));
  }, [categories, getCategorySetForBrand]);

  // Get subcategories of a category - strictly filtered by brand
  const getSubcategories = useCallback((parentId: string, brandId: string | null = null): Category[] => {
    const allSubcategories = categories.filter(cat => cat.parentId === parentId);
    
    if (!brandId) return allSubcategories;
    
    // Return subcategories that are in this brand
    const brandSet = getCategorySetForBrand(brandId);
    return allSubcategories.filter(subcat => brandSet.has(subcat.id));
  }, [categories, getCategorySetForBrand]);

  // Get products in a category, optionally filtered by brand
  const getProductsInCategory = async (categoryId: string, brandId: string | null = null): Promise<Product[]> => {
    if (loadProductsByCategory) {
      try {
        setLoadingProducts(true);
        let categoryProducts = await loadProductsByCategory(categoryId);
        
        // If a brand is selected, filter products by brand
        if (brandId) {
          categoryProducts = categoryProducts.filter(p => p.brandId === brandId);
        }
        
        return categoryProducts;
      } finally {
        setLoadingProducts(false);
      }
    }
    
    // Fallback: filter products that belong to this category
    // This is a simplified version - in reality, you'd check product-category relationships
    return products.filter(p => {
      // If brand is selected, product must belong to this brand
      if (brandId && p.brandId !== brandId) {
        return false;
      }
      
      // Check if product has this category in its categories array
      return p.categories?.some((pc: ProductCategory) => 
        (pc.categoryId || pc.category?.id || pc.id) === categoryId
      ) || false;
    });
  };

  const handleBrandClick = (brandId: string) => {
    setSelectedBrand(brandId);
    setCurrentView('categories');
    setCategoryPath([]);
    onBrandSelect?.(brandId);
  };

  const handleDeleteBrand = async () => {
    if (!brandToDelete) return;
    
    setDeletingBrand(true);
    try {
      await coreApi.deleteBrand(brandToDelete.id);
      toast({
        title: 'تم الحذف',
        description: `تم حذف العلامة التجارية "${brandToDelete.nameAr || brandToDelete.name}" بنجاح`,
      });
      setShowDeleteBrandDialog(false);
      setBrandToDelete(null);
      onBrandsUpdate?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'فشل حذف العلامة التجارية';
      toast({
        title: 'خطأ',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setDeletingBrand(false);
    }
  };

  const handleCategoryClick = async (category: Category) => {
    const subcategories = getSubcategories(category.id, selectedBrand);
    
    if (subcategories.length > 0) {
      // Has subcategories, navigate to subcategories
      setSelectedCategory(category.id);
      setCategoryPath([...categoryPath, category]);
      setCurrentView('subcategories');
    } else {
      // No subcategories, show products
      setSelectedCategory(category.id);
      setCategoryPath([...categoryPath, category]);
      setCurrentView('products');
      const categoryProducts = await getProductsInCategory(category.id, selectedBrand);
      setFilteredProducts(categoryProducts);
      // Also select the category
      onCategorySelect(category.id);
    }
  };

  const handleSubcategoryClick = async (category: Category) => {
    const subcategories = getSubcategories(category.id, selectedBrand);
    
    if (subcategories.length > 0) {
      // Has more subcategories, navigate deeper
      setSelectedCategory(category.id);
      setCategoryPath([...categoryPath, category]);
      setCurrentView('subcategories');
    } else {
      // No more subcategories, show products
      setSelectedCategory(category.id);
      setCategoryPath([...categoryPath, category]);
      setCurrentView('products');
      const categoryProducts = await getProductsInCategory(category.id, selectedBrand);
      setFilteredProducts(categoryProducts);
      // Also select the category
      onCategorySelect(category.id);
    }
  };

  const handleBack = () => {
    if (currentView === 'products') {
      if (categoryPath.length > 0) {
        const newPath = [...categoryPath];
        const lastCategory = newPath.pop();
        setCategoryPath(newPath);
        if (newPath.length === 0) {
          setCurrentView('categories');
        } else {
          setCurrentView('subcategories');
        }
        setSelectedCategory(lastCategory?.id || null);
      } else {
        setCurrentView('categories');
        setSelectedCategory(null);
      }
    } else if (currentView === 'subcategories') {
      if (categoryPath.length > 1) {
        const newPath = [...categoryPath];
        newPath.pop();
        setCategoryPath(newPath);
        setSelectedCategory(newPath[newPath.length - 1]?.id || null);
      } else {
        setCategoryPath([]);
        setCurrentView('categories');
        setSelectedCategory(null);
      }
    } else if (currentView === 'categories') {
      setCurrentView('brands');
      setSelectedBrand(null);
      onBrandSelect?.(null);
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      // Clicked on brand
      setCurrentView('brands');
      setSelectedBrand(null);
      setCategoryPath([]);
      setSelectedCategory(null);
      onBrandSelect?.(null);
    } else {
      // Clicked on a category in path
      const newPath = categoryPath.slice(0, index + 1);
      setCategoryPath(newPath);
      const targetCategory = newPath[newPath.length - 1];
      setSelectedCategory(targetCategory?.id || null);
      
      const subcategories = targetCategory ? getSubcategories(targetCategory.id, selectedBrand, false) : [];
      if (subcategories.length > 0) {
        setCurrentView('subcategories');
      } else {
        setCurrentView('products');
      }
    }
  };

  const currentCategories = useMemo(() => {
    return currentView === 'categories' 
      ? getCategoriesByBrand(selectedBrand)
      : currentView === 'subcategories' && selectedCategory
      ? getSubcategories(selectedCategory, selectedBrand)
      : [];
  }, [currentView, selectedBrand, selectedCategory, getCategoriesByBrand, getSubcategories]);

  const currentProducts = useMemo(() => {
    return currentView === 'products' && selectedCategory
      ? filteredProducts
      : [];
  }, [currentView, selectedCategory, filteredProducts]);

  // Load products when view changes to products
  useEffect(() => {
    if (currentView === 'products' && selectedCategory && filteredProducts.length === 0) {
      getProductsInCategory(selectedCategory, selectedBrand).then(setFilteredProducts);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, selectedCategory, selectedBrand]);

  // Initialize view based on selected brand
  useEffect(() => {
    if (selectedBrandId && currentView === 'brands') {
      setSelectedBrand(selectedBrandId);
      setCurrentView('categories');
    }
  }, [selectedBrandId, currentView]);

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
    
    // Ensure expanded states are maintained
    if (currentView === 'brands' || (currentView === 'categories' && selectedBrand)) {
      if (selectedBrand) {
        const newExpanded = new Set(expandedBrands);
        if (!newExpanded.has(selectedBrand)) {
          newExpanded.add(selectedBrand);
          setExpandedBrands(newExpanded);
        }
      }
    }
    
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
  const canAddSubcategory = subcategoryCount < MAX_SUBCATEGORIES && !hasProducts;

  const handleCreateCategory = async () => {
    if (!newCategoryData.name.trim()) {
      toast({
        title: 'اسم الفئة مطلوب',
        description: 'يرجى إدخال اسم للفئة الجديدة',
        variant: 'destructive',
      });
      return;
    }

    // Determine parentId: 
    // 1. If categoryParentCategory is set (from context menu), use it
    // 2. If categoryParentBrand is set but no parent category, it's a top-level category (no parentId)
    // 3. If we're in subcategories or products view, use the selected category
    // 4. Otherwise, use the last category in the path
    let parentId: string | undefined;
    if (categoryParentCategory) {
      parentId = categoryParentCategory;
    } else if (categoryParentBrand) {
      // Top-level category under brand (no parent)
      parentId = undefined;
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

        // Track brand association for the new category
        let brandIdToAssociate: string | null = null;
        if (categoryParentBrand) {
          brandIdToAssociate = categoryParentBrand;
        } else if (selectedBrand) {
          brandIdToAssociate = selectedBrand;
        } else if (parentId) {
          // If creating a subcategory, inherit brand from parent
          brandIdToAssociate = categoryBrandMap.get(parentId) || null;
        }
        
        // Add to categoryBrandMap if we have a brand association
        if (brandIdToAssociate) {
          setCategoryBrandMap(prev => {
            const newMap = new Map(prev);
            newMap.set(newCategory.id, brandIdToAssociate!);
            
            // Also ensure parent category is in the map if it exists
            if (parentId && !prev.has(parentId)) {
              newMap.set(parentId, brandIdToAssociate!);
            }
            
            saveCategoryBrandMap(newMap);
            return newMap;
          });
        }

        // Refresh categories
        if (onCategoriesUpdate) {
          onCategoriesUpdate();
        }

        // Clear form and close dialog
        setNewCategoryData({ name: '', nameAr: '', description: '', image: '' });
        setCategoryParentBrand(null);
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
        description: 'يرجى إدخال اسم للعلامة التجارية الجديدة',
        variant: 'destructive',
      });
      return;
    }

    try {
      setCreatingBrand(true);
      
      if (onCreateBrand) {
        const newBrand = await onCreateBrand({
          name: newBrandData.name,
          nameAr: newBrandData.nameAr || newBrandData.name,
          code: newBrandData.code || undefined,
          logo: newBrandData.logo || undefined,
        });
        
        toast({
          title: 'نجح',
          description: 'تم إنشاء العلامة التجارية بنجاح',
        });

        if (onBrandsUpdate) {
          onBrandsUpdate();
        }

        setNewBrandData({ name: '', nameAr: '', code: '', logo: '' });
        setShowCreateBrandDialog(false);
      } else {
        // Fallback: use coreApi directly
        await coreApi.createBrand({
          name: newBrandData.name,
          nameAr: newBrandData.nameAr || newBrandData.name,
          code: newBrandData.code || undefined,
          logo: newBrandData.logo || undefined,
        });
        
        toast({
          title: 'نجح',
          description: 'تم إنشاء العلامة التجارية بنجاح',
        });

        if (onBrandsUpdate) {
          onBrandsUpdate();
        }

        setNewBrandData({ name: '', nameAr: '', code: '', logo: '' });
        setShowCreateBrandDialog(false);
      }
    } catch (error: unknown) {
      console.error('Failed to create brand:', error);
      toast({
        title: 'تعذر إنشاء العلامة التجارية',
        description: 'حدث خطأ أثناء إنشاء العلامة التجارية الجديدة. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setCreatingBrand(false);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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

  return (
    <div className="flex h-[750px] overflow-hidden rounded-2xl border border-border bg-background/40 backdrop-blur-2xl shadow-2xl">
      {/* Sidebar - Brands */}
      <div className="w-72 border-r border-border/50 bg-card/20 flex flex-col">
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">العلامات التجارية</h3>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={() => setShowCreateBrandDialog(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="بحث..."
              className="pr-10 h-9 bg-muted/50 border-border text-sm focus:ring-primary/20"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3 space-y-1">
            <button
              onClick={() => {
                setSelectedBrand(null);
                setCurrentView('brands');
                setCategoryPath([]);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                !selectedBrand 
                  ? 'bg-primary/10 border border-primary/30 text-primary shadow-lg shadow-primary/5' 
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              <div className={`p-2 rounded-lg ${!selectedBrand ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                <LayoutGrid className="h-4 w-4" />
              </div>
              <span className="font-medium text-sm">جميع العلامات</span>
            </button>

            {brands.map((brand) => (
              <button
                key={brand.id}
                onClick={() => {
                  setSelectedBrand(brand.id);
                  setCurrentView('categories');
                  setCategoryPath([]);
                  const newExpanded = new Set(expandedBrands);
                  newExpanded.add(brand.id);
                  setExpandedBrands(newExpanded);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  selectedBrand === brand.id 
                    ? 'bg-primary/10 border border-primary/30 text-primary shadow-lg shadow-primary/5' 
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                <div className={`p-2 rounded-lg transition-colors ${
                  selectedBrand === brand.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground group-hover:bg-muted/80'
                }`}>
                  <Store className="h-4 w-4" />
                </div>
                <div className="flex flex-col items-start overflow-hidden">
                  <span className="font-medium text-sm truncate w-full">{brand.nameAr || brand.name}</span>
                  {brand.code && <span className="text-[10px] text-slate-500 uppercase tracking-tighter">{brand.code}</span>}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-background/20">
        {/* Toolbar */}
        <div className="h-20 border-b border-border/50 flex items-center justify-between px-8 bg-card/10 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-xl border border-border/50">
              <button
                onClick={() => handleBack()}
                disabled={currentView === 'brands'}
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground disabled:opacity-30 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <Separator orientation="vertical" className="h-4 bg-border" />
              <button
                onClick={() => {
                  setSelectedBrand(null);
                  setCurrentView('brands');
                  setCategoryPath([]);
                }}
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
              >
                <Home className="h-4 w-4" />
              </button>
            </div>

            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 overflow-hidden max-w-[400px]">
              {selectedBrand && (
                <>
                  <ChevronLeft className="h-3 w-3 text-slate-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-slate-400 truncate">
                    {brands.find(b => b.id === selectedBrand)?.nameAr || brands.find(b => b.id === selectedBrand)?.name}
                  </span>
                </>
              )}
              {categoryPath.map((cat, idx) => (
                <div key={cat.id} className="flex items-center gap-2 flex-shrink-0">
                  <ChevronLeft className="h-3 w-3 text-slate-600" />
                  <button
                    onClick={() => {
                      const newPath = categoryPath.slice(0, idx + 1);
                      setCategoryPath(newPath);
                      setSelectedCategory(cat.id);
                      setCurrentView(idx === categoryPath.length - 1 ? currentView : 'subcategories');
                    }}
                    className="text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors truncate max-w-[120px]"
                  >
                    {cat.nameAr || cat.name}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="بحث في المجلد الحالي..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 h-10 bg-muted/50 border-border text-sm focus:ring-primary/20 rounded-xl"
              />
            </div>
            
            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl border border-border/50">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-muted text-primary shadow-inner' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-muted text-primary shadow-inner' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {selectedBrand && (
                <Button
                  onClick={() => setShowCreateCategoryDialog(true)}
                  className="h-10 px-4 bg-gradient-primary hover:opacity-90 text-white border-none shadow-lg shadow-primary/20 rounded-xl gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>إضافة فئة</span>
                </Button>
              )}
              {canAddProduct && (
                <Button
                  onClick={() => navigateToAddProduct()}
                  className="h-10 px-4 bg-gradient-secondary hover:opacity-90 text-white border-none shadow-lg shadow-secondary/20 rounded-xl gap-2"
                >
                  <Package className="h-4 w-4" />
                  <span>إضافة منتج</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <ScrollArea className="flex-1 p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentView}-${selectedBrand}-${selectedCategory}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {currentView === 'brands' && !selectedBrand ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {brands.map((brand) => (
                    <motion.div
                      key={brand.id}
                      whileHover={{ scale: 1.02, y: -4 }}
                      className="group relative bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl p-6 cursor-pointer hover:border-primary/50 transition-all duration-300 shadow-xl hover:shadow-primary/10"
                      onClick={() => {
                        setSelectedBrand(brand.id);
                        setCurrentView('categories');
                      }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-muted to-card border border-border group-hover:from-primary/20 group-hover:to-secondary/20 group-hover:border-primary/30 transition-all duration-300">
                          <Store className="h-8 w-8 text-primary" />
                        </div>
                        <button className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                          <MoreVertical className="h-5 w-5" />
                        </button>
                      </div>
                      <h4 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                        {brand.nameAr || brand.name}
                      </h4>
                      <p className="text-sm text-muted-foreground font-mono uppercase tracking-widest">{brand.code || 'NO CODE'}</p>
                      
                      <div className="mt-6 pt-6 border-t border-slate-800/50 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Folder className="h-3 w-3" />
                          <span>{getCategoriesByBrand(brand.id).length} فئات</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-cyan-500 font-medium group-hover:translate-x-[-4px] transition-transform">
                          <span>فتح</span>
                          <ChevronLeft className="h-3 w-3" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-2"}>
                  {/* Categories */}
                  {filteredItems.categories.map((category) => (
                    <motion.div
                      key={category.id}
                      whileHover={{ scale: 1.02 }}
                      className={viewMode === 'grid' 
                        ? "group relative bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl p-5 cursor-pointer hover:border-secondary/50 transition-all duration-300 shadow-xl hover:shadow-secondary/5"
                        : "group flex items-center gap-4 bg-card/40 backdrop-blur-md border border-border/50 rounded-xl p-3 cursor-pointer hover:border-secondary/50 transition-all duration-300"
                      }
                      onClick={() => handleCategoryClick(category)}
                    >
                      <div className={viewMode === 'grid' ? "flex items-start justify-between mb-4" : "flex-shrink-0"}>
                        <div className={`p-3 rounded-xl bg-muted/50 border border-border group-hover:bg-secondary/10 group-hover:border-secondary/30 transition-all duration-300`}>
                          <Folder className="h-6 w-6 text-secondary" />
                        </div>
                        {viewMode === 'grid' && (
                          <button className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-200 group-hover:text-white transition-colors truncate">
                          {category.nameAr || category.name}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 truncate">
                          {getSubcategories(category.id, selectedBrand).length} فئات فرعية
                        </p>
                      </div>

                      {viewMode === 'list' && (
                        <div className="flex items-center gap-2">
                          <button className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {/* Products */}
                  {filteredItems.products.map((product) => (
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
                          <button className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-200 group-hover:text-white transition-colors truncate">
                          {product.nameAr || product.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded uppercase font-mono">
                            {product.sku || 'NO SKU'}
                          </span>
                        </div>
                      </div>

                      {viewMode === 'list' && (
                        <div className="flex items-center gap-2">
                          <button className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {/* Empty State */}
                  {filteredItems.categories.length === 0 && filteredItems.products.length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                      <div className="w-24 h-24 bg-slate-900/50 rounded-full flex items-center justify-center mb-6 border border-slate-800">
                        <Search className="h-10 w-10 text-slate-700" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-300 mb-2">لا توجد نتائج</h3>
                      <p className="text-slate-500 max-w-xs">
                        {searchQuery ? `لم نجد أي نتائج لـ "${searchQuery}"` : 'هذا المجلد فارغ حالياً'}
                      </p>
                      {!searchQuery && (
                        <div className="mt-8 flex gap-3">
                          <Button 
                            variant="outline" 
                            className="border-slate-800 text-slate-400 hover:bg-slate-800 rounded-xl"
                            onClick={() => setShowCreateCategoryDialog(true)}
                          >
                            إضافة فئة
                          </Button>
                          <Button 
                            className="bg-cyan-600 hover:bg-cyan-700 rounded-xl"
                            onClick={() => navigateToAddProduct()}
                          >
                            إضافة منتج
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </ScrollArea>
      </div>

      {/* Create Brand Dialog */}
      <Dialog open={showCreateBrandDialog} onOpenChange={setShowCreateBrandDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة علامة تجارية جديدة</DialogTitle>
            <DialogDescription>
              العلامة التجارية هي المستوى الأعلى في التسلسل الهرمي
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Brand Logo */}
            <div>
              <Label>شعار العلامة التجارية</Label>
              <div className="mt-2">
                <ImageUpload
                  value={newBrandData.logo}
                  onChange={(url) => setNewBrandData({ ...newBrandData, logo: url })}
                  placeholder="اسحب الشعار هنا أو انقر للتحميل"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="brandName">اسم العلامة التجارية (English) *</Label>
              <Input
                id="brandName"
                value={newBrandData.name}
                onChange={(e) => setNewBrandData({ ...newBrandData, name: e.target.value })}
                placeholder="Brand Name"
              />
            </div>
            
            <div>
              <Label htmlFor="brandNameAr">اسم العلامة التجارية (العربية)</Label>
              <Input
                id="brandNameAr"
                value={newBrandData.nameAr}
                onChange={(e) => setNewBrandData({ ...newBrandData, nameAr: e.target.value })}
                placeholder="اسم العلامة التجارية"
                dir="rtl"
              />
            </div>
            
            <div>
              <Label htmlFor="brandCode">رمز العلامة التجارية (اختياري)</Label>
              <Input
                id="brandCode"
                value={newBrandData.code}
                onChange={(e) => setNewBrandData({ ...newBrandData, code: e.target.value })}
                placeholder="BRAND-001"
              />
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
            <DialogDescription>
              هل أنت متأكد من حذف العلامة التجارية "{brandToDelete?.nameAr || brandToDelete?.name}"؟
              <br />
              <span className="text-red-400 font-medium">هذا الإجراء لا يمكن التراجع عنه.</span>
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

      {/* Create Category Dialog */}
      <Dialog open={showCreateCategoryDialog} onOpenChange={setShowCreateCategoryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {categoryParentCategory ? 'إضافة فئة فرعية جديدة' : categoryParentBrand ? 'إضافة فئة جديدة' : (currentView === 'subcategories' || currentView === 'products' ? 'إضافة فئة فرعية جديدة' : 'إضافة فئة جديدة')}
            </DialogTitle>
            <DialogDescription>
              {categoryParentCategory 
                ? `إضافة فئة فرعية تحت الفئة المحددة`
                : categoryParentBrand
                ? `إضافة فئة تحت العلامة التجارية: ${brands.find(b => b.id === categoryParentBrand)?.nameAr || brands.find(b => b.id === categoryParentBrand)?.name || ''}`
                : categoryPath.length > 0 
                  ? `إضافة فئة فرعية تحت: ${categoryPath.map(c => c.nameAr || c.name).join(' > ')}`
                  : 'إضافة فئة جديدة'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Category Image */}
            <div>
              <Label>صورة الفئة</Label>
              <div className="mt-2">
                <ImageUpload
                  value={newCategoryData.image}
                  onChange={(url) => setNewCategoryData({ ...newCategoryData, image: url })}
                  placeholder="اسحب الصورة هنا أو انقر للتحميل"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="categoryName">اسم الفئة (English) *</Label>
              <Input
                id="categoryName"
                value={newCategoryData.name}
                onChange={(e) => setNewCategoryData({ ...newCategoryData, name: e.target.value })}
                placeholder="Category Name"
              />
            </div>
            
            <div>
              <Label htmlFor="categoryNameAr">اسم الفئة (العربية)</Label>
              <Input
                id="categoryNameAr"
                value={newCategoryData.nameAr}
                onChange={(e) => setNewCategoryData({ ...newCategoryData, nameAr: e.target.value })}
                placeholder="اسم الفئة"
                dir="rtl"
              />
            </div>
            
            <div>
              <Label htmlFor="categoryDescription">الوصف</Label>
              <Textarea
                id="categoryDescription"
                value={newCategoryData.description}
                onChange={(e) => setNewCategoryData({ ...newCategoryData, description: e.target.value })}
                placeholder="وصف الفئة (اختياري)"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateCategoryDialog(false);
                setNewCategoryData({ name: '', nameAr: '', description: '', image: '' });
              }}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleCreateCategory}
              disabled={creatingCategory || !newCategoryData.name.trim()}
            >
              {creatingCategory ? 'جاري الإنشاء...' : 'إنشاء'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Details Dialog */}
      <Dialog open={showProductDetails} onOpenChange={(open) => {
        setShowProductDetails(open);
        if (!open) {
          setIsEditingProduct(false);
          setSelectedProductDetails(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {loadingProductDetails ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
          ) : selectedProductDetails ? (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <DialogTitle className="text-xl font-bold">
                      {selectedProductDetails.nameAr || selectedProductDetails.name}
                    </DialogTitle>
                    <DialogDescription className="mt-1">
                      {selectedProductDetails.name !== selectedProductDetails.nameAr && selectedProductDetails.name}
                    </DialogDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isEditingProduct ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditingProduct(true)}
                          className="gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          تعديل
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigateToEditProduct(selectedProductDetails.id)}
                          className="gap-2"
                        >
                          تعديل كامل
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditingProduct(false)}
                        >
                          إلغاء
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveProduct}
                          disabled={savingProduct}
                        >
                          {savingProduct ? 'جاري الحفظ...' : 'حفظ'}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </DialogHeader>

              {isEditingProduct ? (
                // Edit Mode
                <div className="space-y-4 py-4">
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="basic">الأساسية</TabsTrigger>
                      <TabsTrigger value="pricing">الأسعار والمخزون</TabsTrigger>
                      <TabsTrigger value="images">الصور</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="editName">اسم المنتج (English)</Label>
                          <Input
                            id="editName"
                            value={editProductData.name}
                            onChange={(e) => setEditProductData({ ...editProductData, name: e.target.value })}
                            placeholder="Product Name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="editNameAr">اسم المنتج (العربية)</Label>
                          <Input
                            id="editNameAr"
                            value={editProductData.nameAr}
                            onChange={(e) => setEditProductData({ ...editProductData, nameAr: e.target.value })}
                            placeholder="اسم المنتج"
                            dir="rtl"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="editDescription">الوصف (English)</Label>
                        <Textarea
                          id="editDescription"
                          value={editProductData.description}
                          onChange={(e) => setEditProductData({ ...editProductData, description: e.target.value })}
                          placeholder="Product description..."
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label htmlFor="editDescriptionAr">الوصف (العربية)</Label>
                        <Textarea
                          id="editDescriptionAr"
                          value={editProductData.descriptionAr}
                          onChange={(e) => setEditProductData({ ...editProductData, descriptionAr: e.target.value })}
                          placeholder="وصف المنتج..."
                          rows={3}
                          dir="rtl"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="pricing" className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="editPrice">السعر (ريال)</Label>
                          <Input
                            id="editPrice"
                            type="number"
                            step="0.01"
                            value={editProductData.price}
                            onChange={(e) => setEditProductData({ ...editProductData, price: e.target.value })}
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label htmlFor="editCompareAtPrice">السعر قبل الخصم</Label>
                          <Input
                            id="editCompareAtPrice"
                            type="number"
                            step="0.01"
                            value={editProductData.compareAtPrice}
                            onChange={(e) => setEditProductData({ ...editProductData, compareAtPrice: e.target.value })}
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="editSku">رمز المنتج (SKU)</Label>
                          <Input
                            id="editSku"
                            value={editProductData.sku}
                            onChange={(e) => setEditProductData({ ...editProductData, sku: e.target.value })}
                            placeholder="SKU-001"
                          />
                        </div>
                        <div>
                          <Label htmlFor="editBarcode">الباركود</Label>
                          <Input
                            id="editBarcode"
                            value={editProductData.barcode}
                            onChange={(e) => setEditProductData({ ...editProductData, barcode: e.target.value })}
                            placeholder="123456789"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="editStock">الكمية المتوفرة</Label>
                        <Input
                          id="editStock"
                          type="number"
                          value={editProductData.stock}
                          onChange={(e) => setEditProductData({ ...editProductData, stock: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="images" className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        {editProductData.images.map((image, index) => (
                          <div key={index} className="relative group">
                            <ImageUpload
                              value={image}
                                onChange={(url) => {
                                  const newImages = [...editProductData.images];
                                  if (url) {
                                    newImages[index] = url;
                                  } else {
                                    newImages.splice(index, 1);
                                  }
                                  setEditProductData(prev => ({ ...prev, images: newImages }));
                                }}
                            />
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-6 flex justify-center">
                        <Button
                          variant="outline"
                          className="w-full border-dashed border-2 h-24 flex flex-col gap-2 hover:border-primary hover:bg-primary/5"
                          onClick={() => setShowImagePicker(true)}
                        >
                          <Upload className="h-6 w-6 text-muted-foreground" />
                          <span>اختر صور من Cloudinary</span>
                        </Button>
                      </div>

                      <p className="text-xs text-muted-foreground text-center">
                        يمكنك إضافة حتى 4 صور للمنتج
                      </p>
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                // View Mode
                <div className="space-y-6 py-4">
                  {/* Product Images */}
                  {selectedProductDetails.images && selectedProductDetails.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {selectedProductDetails.images.slice(0, 4).map((image, idx) => (
                        <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                          <img src={image} alt={`${selectedProductDetails.name} ${idx + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Cost Alert - Warning when cost > price */}
                  {selectedProductDetails.cost !== undefined && 
                   selectedProductDetails.price !== undefined && 
                   selectedProductDetails.cost > selectedProductDetails.price && (
                    <Card className="bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800">
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/50">
                            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-red-800 dark:text-red-300">تحذير: تكلفة المورد أعلى من سعر البيع!</h4>
                            <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                              تكلفة المورد ({Number(selectedProductDetails.cost).toFixed(2)} ريال) أكبر من سعر البيع ({Number(selectedProductDetails.price).toFixed(2)} ريال).
                              <br />
                              <span className="font-bold">الخسارة المتوقعة: {Number(selectedProductDetails.cost - selectedProductDetails.price).toFixed(2)} ريال لكل وحدة</span>
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Pricing Card */}
                  <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                    <CardContent className="pt-6">
                      <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-bold text-primary">
                          {Number(selectedProductDetails.price || 0).toFixed(2)}
                        </span>
                        <span className="text-lg text-gray-600 dark:text-gray-400">ريال</span>
                      </div>
                      {selectedProductDetails.compareAtPrice && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-sm text-gray-500 line-through">
                            {Number(selectedProductDetails.compareAtPrice).toFixed(2)} ريال
                          </span>
                          <Badge className="bg-red-500 text-white text-xs">
                            خصم {Math.round((1 - (selectedProductDetails.price || 0) / selectedProductDetails.compareAtPrice) * 100)}%
                          </Badge>
                        </div>
                      )}
                      {/* Cost Information */}
                      {selectedProductDetails.cost !== undefined && selectedProductDetails.cost > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">تكلفة المورد:</span>
                            <span className={`font-semibold ${selectedProductDetails.cost > (selectedProductDetails.price || 0) ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'}`}>
                              {Number(selectedProductDetails.cost).toFixed(2)} ريال
                            </span>
                          </div>
                          {selectedProductDetails.price && selectedProductDetails.price > selectedProductDetails.cost && (
                            <div className="flex items-center justify-between text-sm mt-1">
                              <span className="text-gray-500">هامش الربح:</span>
                              <span className="font-semibold text-green-600">
                                {Number(selectedProductDetails.price - selectedProductDetails.cost).toFixed(2)} ريال 
                                ({Math.round(((selectedProductDetails.price - selectedProductDetails.cost) / selectedProductDetails.price) * 100)}%)
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Product Info Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-gray-500 mb-1">المخزون</p>
                        <p className="text-2xl font-bold">{selectedProductDetails.stock || 0}</p>
                        <p className="text-xs text-gray-500">وحدة متوفرة</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-gray-500 mb-1">الحالة</p>
                        <Badge className={selectedProductDetails.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-500'}>
                          {selectedProductDetails.status === 'ACTIVE' ? 'نشط' : selectedProductDetails.status === 'DRAFT' ? 'مسودة' : 'مؤرشف'}
                        </Badge>
                      </CardContent>
                    </Card>
                  </div>

                  {/* SKU & Barcode */}
                  {(selectedProductDetails.sku || selectedProductDetails.barcode) && (
                    <Card>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-2 gap-4">
                          {selectedProductDetails.sku && (
                            <div>
                              <p className="text-sm text-gray-500 mb-1">رمز المنتج (SKU)</p>
                              <p className="font-mono font-semibold">{selectedProductDetails.sku}</p>
                            </div>
                          )}
                          {selectedProductDetails.barcode && (
                            <div>
                              <p className="text-sm text-gray-500 mb-1">الباركود</p>
                              <p className="font-mono font-semibold">{selectedProductDetails.barcode}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Description */}
                  {(selectedProductDetails.description || selectedProductDetails.descriptionAr) && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">الوصف</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                          {selectedProductDetails.descriptionAr || selectedProductDetails.description}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Categories */}
                  {selectedProductDetails.categories && selectedProductDetails.categories.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">الفئات</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {selectedProductDetails.categories.map((cat) => (
                            <Badge key={cat.id} variant="secondary">
                              {cat.nameAr || cat.name}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Brand */}
                  {selectedProductDetails.brand && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">العلامة التجارية</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge variant="outline">
                          {selectedProductDetails.brand.nameAr || selectedProductDetails.brand.name}
                        </Badge>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
      {/* Cloudinary Image Picker */}
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
    </div>
  );
}
