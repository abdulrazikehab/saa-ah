import { useState, useEffect } from 'react';
import { ChevronRight, Folder, FolderOpen, Package, ArrowLeft, Plus, Tag, Eye, Edit, X, Image as ImageIcon, AlertTriangle, Home, Store, Box, Trash2 } from 'lucide-react';
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
import { coreApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const [showCreateCategoryDialog, setShowCreateCategoryDialog] = useState(false);
  const [showCreateBrandDialog, setShowCreateBrandDialog] = useState(false);
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
  });
  const [savingProduct, setSavingProduct] = useState(false);

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
        const updatedProducts = await getProductsInCategory(selectedCategory);
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

  // Filter categories by brand (if products have brandId)
  const getCategoriesByBrand = (brandId: string | null): Category[] => {
    if (!brandId) {
      // Return top-level categories (no parent)
      return categories.filter(cat => !cat.parentId);
    }
    
    // Filter categories that have products with this brand
    // We'll check if any products in the products array have this brandId
    const brandProductIds = new Set(
      products
        .filter(p => p.brandId === brandId)
        .map(p => p.id)
    );
    
    // Get categories that have products with this brand
    // For now, return all top-level categories - can be enhanced with actual product-category relationships
    return categories.filter(cat => !cat.parentId);
  };

  // Get subcategories of a category
  const getSubcategories = (parentId: string): Category[] => {
    return categories.filter(cat => cat.parentId === parentId);
  };

  // Get products in a category
  const getProductsInCategory = async (categoryId: string): Promise<Product[]> => {
    if (loadProductsByCategory) {
      try {
        setLoadingProducts(true);
        return await loadProductsByCategory(categoryId);
      } finally {
        setLoadingProducts(false);
      }
    }
    
    // Fallback: filter products that belong to this category
    // This is a simplified version - in reality, you'd check product-category relationships
    return products.filter(p => {
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
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل حذف العلامة التجارية',
        variant: 'destructive',
      });
    } finally {
      setDeletingBrand(false);
    }
  };

  const handleCategoryClick = async (category: Category) => {
    const subcategories = getSubcategories(category.id);
    
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
      const categoryProducts = await getProductsInCategory(category.id);
      setFilteredProducts(categoryProducts);
      // Also select the category
      onCategorySelect(category.id);
    }
  };

  const handleSubcategoryClick = async (category: Category) => {
    const subcategories = getSubcategories(category.id);
    
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
      const categoryProducts = await getProductsInCategory(category.id);
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
      
      const subcategories = targetCategory ? getSubcategories(targetCategory.id) : [];
      if (subcategories.length > 0) {
        setCurrentView('subcategories');
      } else {
        setCurrentView('products');
      }
    }
  };

  const currentCategories = currentView === 'categories' 
    ? getCategoriesByBrand(selectedBrand)
    : currentView === 'subcategories' && selectedCategory
    ? getSubcategories(selectedCategory)
    : [];

  const currentProducts = currentView === 'products' && selectedCategory
    ? filteredProducts
    : [];

  // Load products when view changes to products
  useEffect(() => {
    if (currentView === 'products' && selectedCategory && filteredProducts.length === 0) {
      getProductsInCategory(selectedCategory).then(setFilteredProducts);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, selectedCategory]);

  // Initialize view based on selected brand
  useEffect(() => {
    if (selectedBrandId && currentView === 'brands') {
      setSelectedBrand(selectedBrandId);
      setCurrentView('categories');
    }
  }, [selectedBrandId, currentView]);

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

    // Determine parentId: if we're in subcategories or products view, use the selected category
    // Otherwise, use the last category in the path
    const parentId = (currentView === 'subcategories' || currentView === 'products') && selectedCategory 
      ? selectedCategory 
      : categoryPath.length > 0 
      ? categoryPath[categoryPath.length - 1].id 
      : undefined;

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

        // Refresh categories
        if (onCategoriesUpdate) {
          onCategoriesUpdate();
        }

        // Clear form and close dialog
        setNewCategoryData({ name: '', nameAr: '', description: '', image: '' });
        setShowCreateCategoryDialog(false);

        // If we're in subcategories view, navigate to the new category
        if (parentId) {
          // Wait a bit for categories to refresh, then navigate
          setTimeout(() => {
            setSelectedCategory(newCategory.id);
            setCategoryPath([...categoryPath, newCategory]);
            setCurrentView('subcategories');
          }, 500);
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
        await coreApi.post('/brands', {
          name: newBrandData.name,
          nameAr: newBrandData.nameAr || newBrandData.name,
          code: newBrandData.code || undefined,
          logo: newBrandData.logo || undefined,
        }, { requireAuth: true });
        
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

  return (
    <div className="w-full bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
      {/* Explorer Header - Like Windows Explorer */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-2">
        <div className="flex items-center gap-2">
          {/* Navigation Buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-700"
              onClick={handleBack}
              disabled={currentView === 'brands'}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Breadcrumb Path - Like Explorer Address Bar */}
          <div className="flex-1 flex items-center bg-slate-700/50 rounded px-2 py-1.5 gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-slate-300 hover:text-white hover:bg-slate-600 gap-1"
              onClick={() => {
                setCurrentView('brands');
                setSelectedBrand(null);
                setCategoryPath([]);
                setSelectedCategory(null);
                onBrandSelect?.(null);
              }}
            >
              <Home className="h-3 w-3" />
              الرئيسية
            </Button>
            
            {selectedBrand && (
              <>
                <ChevronRight className="h-3 w-3 text-slate-500" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-slate-300 hover:text-white hover:bg-slate-600 gap-1"
                  onClick={() => handleBreadcrumbClick(-1)}
                >
                  <Store className="h-3 w-3" />
                  {brands.find(b => b.id === selectedBrand)?.nameAr || brands.find(b => b.id === selectedBrand)?.name}
                </Button>
              </>
            )}

            {categoryPath.map((cat, index) => (
              <div key={cat.id} className="flex items-center gap-1">
                <ChevronRight className="h-3 w-3 text-slate-500" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-slate-300 hover:text-white hover:bg-slate-600 gap-1"
                  onClick={() => handleBreadcrumbClick(index)}
                >
                  <Folder className="h-3 w-3 text-yellow-500" />
                  {cat.nameAr || cat.name}
                </Button>
              </div>
            ))}

            {currentView === 'products' && selectedCategory && (
              <>
                <ChevronRight className="h-3 w-3 text-slate-500" />
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Package className="h-3 w-3 text-cyan-400" />
                  المنتجات
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-slate-800/50 border-b border-slate-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          {currentView === 'brands' && <span>{brands.length} علامة تجارية</span>}
          {(currentView === 'categories' || currentView === 'subcategories') && <span>{currentCategories.length} فئة</span>}
          {currentView === 'products' && <span>{currentProducts.length} منتج</span>}
        </div>
        
        <div className="flex items-center gap-2">
          {currentView === 'brands' && (
            <Button
              size="sm"
              className="h-7 text-xs gap-1 bg-cyan-600 hover:bg-cyan-700"
              onClick={() => setShowCreateBrandDialog(true)}
            >
              <Plus className="h-3 w-3" />
              علامة تجارية جديدة
            </Button>
          )}
          
          {(currentView === 'categories' || currentView === 'subcategories') && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={() => setShowCreateCategoryDialog(true)}
                disabled={currentView === 'subcategories' && !canAddSubcategory}
              >
                <Folder className="h-3 w-3 text-yellow-500" />
                {currentView === 'subcategories' ? `فئة فرعية (${remainingSubcategories})` : 'فئة جديدة'}
              </Button>
              {canAddProduct && (
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1 bg-green-600 hover:bg-green-700"
                  onClick={() => navigateToAddProduct()}
                >
                  <Package className="h-3 w-3" />
                  منتج جديد
                </Button>
              )}
            </>
          )}
          
          {currentView === 'products' && selectedCategory && (
            <>
              {!hasProducts ? (
                canAddSubcategory && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                    onClick={() => setShowCreateCategoryDialog(true)}
                  >
                    <Folder className="h-3 w-3 text-yellow-500" />
                    فئة فرعية ({remainingSubcategories})
                  </Button>
                )
              ) : null}
              {canAddProduct && (
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1 bg-green-600 hover:bg-green-700"
                  onClick={() => navigateToAddProduct()}
                >
                  <Package className="h-3 w-3" />
                  منتج جديد
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Content Area - Explorer Style */}
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <ScrollArea className="h-[450px] bg-slate-900">
            <div className="p-4">
              {/* Brands View */}
              {currentView === 'brands' && (
                <div>
                  {brands.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                        <Store className="h-10 w-10 text-slate-600" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-300 mb-2">لا توجد علامات تجارية</h3>
                      <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
                        ابدأ بإنشاء علامة تجارية جديدة لبناء هيكل المنتجات
                      </p>
                      <div className="flex items-center justify-center gap-2 text-xs text-slate-600 mb-6">
                        <Store className="h-4 w-4" />
                        <ChevronRight className="h-3 w-3" />
                        <Folder className="h-4 w-4 text-yellow-600" />
                        <ChevronRight className="h-3 w-3" />
                        <Folder className="h-4 w-4 text-yellow-600" />
                        <ChevronRight className="h-3 w-3" />
                        <Package className="h-4 w-4 text-cyan-600" />
                      </div>
                      <Button onClick={() => setShowCreateBrandDialog(true)} className="gap-2 bg-cyan-600 hover:bg-cyan-700">
                        <Plus className="h-4 w-4" />
                        إنشاء علامة تجارية
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {brands.map((brand) => (
                        <ContextMenu key={brand.id}>
                          <ContextMenuTrigger asChild>
                            <div
                              className="group cursor-pointer"
                              onClick={() => handleBrandClick(brand.id)}
                            >
                              <div className="flex flex-col items-center p-4 rounded-lg hover:bg-slate-800 transition-colors">
                                {/* Brand Logo/Icon */}
                                <div className={`w-16 h-16 mb-3 rounded-xl flex items-center justify-center overflow-hidden transition-all duration-200 ${
                                  brand.logo 
                                    ? 'bg-white shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 group-hover:scale-105' 
                                    : 'bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 group-hover:border-cyan-500'
                                }`}>
                                  {brand.logo ? (
                                    <img 
                                      src={brand.logo} 
                                      alt={brand.name} 
                                      className="w-full h-full object-contain p-1.5"
                                    />
                                  ) : (
                                    <Store className="h-8 w-8 text-cyan-500" />
                                  )}
                                </div>
                                {/* Brand Name */}
                                <p className="text-sm text-slate-300 text-center font-medium truncate w-full group-hover:text-white">
                                  {brand.nameAr || brand.name}
                                </p>
                                {brand.code && (
                                  <p className="text-xs text-slate-500 mt-0.5">{brand.code}</p>
                                )}
                              </div>
                            </div>
                          </ContextMenuTrigger>
                          <ContextMenuContent className="w-48">
                            <ContextMenuItem
                              onClick={() => handleBrandClick(brand.id)}
                              className="gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              عرض المحتوى
                            </ContextMenuItem>
                            <ContextMenuSeparator />
                            <ContextMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setBrandToDelete(brand);
                                setShowDeleteBrandDialog(true);
                              }}
                              className="gap-2 text-red-500 focus:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                              حذف العلامة التجارية
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Categories View */}
              {currentView === 'categories' && (
                <div>
                  {currentCategories.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-lg bg-slate-800 flex items-center justify-center">
                        <Folder className="h-10 w-10 text-yellow-600" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-300 mb-2">مجلد فارغ</h3>
                      <p className="text-sm text-slate-500 mb-6">
                        أنشئ فئة جديدة أو أضف منتج مباشرة
                      </p>
                      <div className="flex items-center justify-center gap-3">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowCreateCategoryDialog(true)} 
                          className="gap-2 border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          <Folder className="h-4 w-4 text-yellow-500" />
                          فئة جديدة
                        </Button>
                        <Button 
                          onClick={() => navigateToAddProduct()} 
                          className="gap-2 bg-green-600 hover:bg-green-700"
                        >
                          <Package className="h-4 w-4" />
                          منتج جديد
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Warning: Can't add products when categories exist */}
                      <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                        <p className="text-sm text-amber-400">
                          لإضافة منتج، يجب الدخول إلى مجلد فارغ (بدون فئات فرعية)
                        </p>
                      </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {currentCategories.map((category) => {
                        const subcategories = getSubcategories(category.id);
                        const isSelected = selectedCategoryIds.includes(category.id);
                        
                        return (
                          <div
                            key={category.id}
                            className="group cursor-pointer"
                            onClick={() => handleCategoryClick(category)}
                          >
                            <div className={`flex flex-col items-center p-4 rounded-lg hover:bg-slate-800 transition-colors ${isSelected ? 'bg-slate-800 ring-1 ring-cyan-500' : ''}`}>
                              {/* Folder Icon with Image */}
                              <div className="w-16 h-16 mb-3 relative">
                                {category.image ? (
                                  <div className="w-full h-full relative group-hover:scale-105 transition-transform">
                                    {/* Folder shape background */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-yellow-500 to-yellow-600 rounded-lg shadow-lg">
                                      {/* Folder tab */}
                                      <div className="absolute -top-1.5 left-1 w-6 h-2.5 bg-yellow-400 rounded-t-md" />
                                    </div>
                                    {/* Image inside folder */}
                                    <div className="absolute inset-1 top-2 bg-white rounded overflow-hidden shadow-inner">
                                      <img 
                                        src={category.image} 
                                        alt={category.name} 
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center group-hover:scale-105 transition-transform">
                                    {subcategories.length > 0 ? (
                                      <FolderOpen className="h-14 w-14 text-yellow-500 drop-shadow-lg" />
                                    ) : (
                                      <Folder className="h-14 w-14 text-yellow-500 drop-shadow-lg" />
                                    )}
                                  </div>
                                )}
                                {subcategories.length > 0 && (
                                  <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-xs text-yellow-900 font-bold px-1.5 py-0.5 rounded-full shadow">
                                    {subcategories.length}
                                  </div>
                                )}
                              </div>
                              {/* Category Name */}
                              <p className="text-sm text-slate-300 text-center font-medium truncate w-full group-hover:text-white">
                                {category.nameAr || category.name}
                              </p>
                              {subcategories.length > 0 && (
                                <p className="text-xs text-slate-500 mt-0.5">{subcategories.length} فئة فرعية</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    </>
                  )}
                </div>
              )}

              {/* Subcategories View */}
              {currentView === 'subcategories' && (
                <div>
                  {currentCategories.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-lg bg-slate-800 flex items-center justify-center">
                        <Folder className="h-10 w-10 text-yellow-600" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-300 mb-2">مجلد فارغ - يمكن إضافة منتج</h3>
                      <p className="text-sm text-slate-500 mb-2">
                        أنشئ فئة فرعية أو أضف منتج مباشرة
                      </p>
                      {canAddSubcategory && (
                        <p className="text-xs text-slate-600 mb-6">
                          متبقي {remainingSubcategories} من {MAX_SUBCATEGORIES}
                        </p>
                      )}
                      <div className="flex items-center justify-center gap-3">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowCreateCategoryDialog(true)} 
                          className="gap-2 border-slate-600 text-slate-300 hover:bg-slate-700"
                          disabled={!canAddSubcategory}
                        >
                          <Folder className="h-4 w-4 text-yellow-500" />
                          فئة فرعية
                        </Button>
                        <Button 
                          onClick={() => navigateToAddProduct()} 
                          className="gap-2 bg-green-600 hover:bg-green-700"
                        >
                          <Package className="h-4 w-4" />
                          منتج جديد
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-4 text-slate-400 hover:text-white hover:bg-slate-700"
                        onClick={async () => {
                          if (selectedCategory) {
                            setCurrentView('products');
                            const categoryProducts = await getProductsInCategory(selectedCategory);
                            setFilteredProducts(categoryProducts);
                            onCategorySelect(selectedCategory);
                          }
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        عرض المنتجات
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Warning: Can't add products when subcategories exist */}
                      <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                        <p className="text-sm text-amber-400">
                          لإضافة منتج، يجب الدخول إلى مجلد فارغ (بدون فئات فرعية)
                        </p>
                      </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {currentCategories.map((category) => {
                        const subcategories = getSubcategories(category.id);
                        const isSelected = selectedCategoryIds.includes(category.id);
                        
                        return (
                          <div
                            key={category.id}
                            className="group cursor-pointer"
                            onClick={() => handleSubcategoryClick(category)}
                          >
                            <div className={`flex flex-col items-center p-4 rounded-lg hover:bg-slate-800 transition-colors ${isSelected ? 'bg-slate-800 ring-1 ring-cyan-500' : ''}`}>
                              {/* Folder Icon with Image */}
                              <div className="w-16 h-16 mb-3 relative">
                                {category.image ? (
                                  <div className="w-full h-full relative group-hover:scale-105 transition-transform">
                                    {/* Folder shape background */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-yellow-500 to-yellow-600 rounded-lg shadow-lg">
                                      {/* Folder tab */}
                                      <div className="absolute -top-1.5 left-1 w-6 h-2.5 bg-yellow-400 rounded-t-md" />
                                    </div>
                                    {/* Image inside folder */}
                                    <div className="absolute inset-1 top-2 bg-white rounded overflow-hidden shadow-inner">
                                      <img 
                                        src={category.image} 
                                        alt={category.name} 
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center group-hover:scale-105 transition-transform">
                                    {subcategories.length > 0 ? (
                                      <FolderOpen className="h-14 w-14 text-yellow-500 drop-shadow-lg" />
                                    ) : (
                                      <Folder className="h-14 w-14 text-yellow-500 drop-shadow-lg" />
                                    )}
                                  </div>
                                )}
                                {subcategories.length > 0 && (
                                  <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-xs text-yellow-900 font-bold px-1.5 py-0.5 rounded-full shadow">
                                    {subcategories.length}
                                  </div>
                                )}
                              </div>
                              {/* Category Name */}
                              <p className="text-sm text-slate-300 text-center font-medium truncate w-full group-hover:text-white">
                                {category.nameAr || category.name}
                              </p>
                              {subcategories.length > 0 && (
                                <p className="text-xs text-slate-500 mt-0.5">{subcategories.length} فئة فرعية</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    </>
                  )}
                </div>
              )}

              {/* Products View */}
              {currentView === 'products' && (
                <div>
                  {loadingProducts ? (
                    <div className="text-center py-16">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4" />
                      <p className="text-slate-400">جاري التحميل...</p>
                    </div>
                  ) : currentProducts.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-lg bg-slate-800 flex items-center justify-center">
                        <Box className="h-10 w-10 text-cyan-600" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-300 mb-2">لا توجد منتجات</h3>
                      <p className="text-sm text-slate-500 mb-2">
                        أضف أول منتج في هذا المجلد
                      </p>
                      {canAddSubcategory && (
                        <p className="text-xs text-slate-600 mb-6">
                          أو أنشئ فئة فرعية جديدة (متبقي {remainingSubcategories})
                        </p>
                      )}
                      <div className="flex items-center justify-center gap-3">
                        {canAddSubcategory && (
                          <Button 
                            variant="outline" 
                            onClick={() => setShowCreateCategoryDialog(true)} 
                            className="gap-2 border-slate-600 text-slate-300 hover:bg-slate-700"
                          >
                            <Folder className="h-4 w-4 text-yellow-500" />
                            فئة فرعية
                          </Button>
                        )}
                        {canAddProduct && (
                          <Button 
                            onClick={() => navigateToAddProduct()} 
                            className="gap-2 bg-green-600 hover:bg-green-700"
                          >
                            <Package className="h-4 w-4" />
                            منتج جديد
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Info: Can't add subcategories when products exist */}
                      <div className="mb-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg flex items-center gap-3">
                        <Package className="h-5 w-5 text-cyan-500 flex-shrink-0" />
                        <p className="text-sm text-cyan-400">
                          يوجد منتجات في هذا المجلد - لا يمكن إضافة فئات فرعية
                        </p>
                      </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {currentProducts.map((product) => (
                        <div
                          key={product.id}
                          className="group cursor-pointer"
                          onClick={() => loadProductDetails(product.id)}
                        >
                          <div className="flex flex-col items-center p-4 rounded-lg hover:bg-slate-800 transition-colors">
                            {/* Product Image */}
                            <div className="w-16 h-16 mb-3 relative">
                              {product.images?.[0] ? (
                                <div className="w-full h-full relative group-hover:scale-105 transition-transform">
                                  {/* Product card background */}
                                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl shadow-lg shadow-cyan-500/30" />
                                  {/* Product image */}
                                  <div className="absolute inset-1 bg-white rounded-lg overflow-hidden shadow-inner">
                                    <img 
                                      src={product.images[0]} 
                                      alt={product.name} 
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="w-full h-full rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center group-hover:border-cyan-500 group-hover:scale-105 transition-all">
                                  <Package className="h-8 w-8 text-cyan-500" />
                                </div>
                              )}
                            </div>
                            {/* Product Name */}
                            <p className="text-sm text-slate-300 text-center font-medium truncate w-full group-hover:text-white">
                              {product.nameAr || product.name}
                            </p>
                            {product.price !== undefined && (
                              <p className="text-xs text-cyan-400 mt-0.5 font-semibold">{Number(product.price).toFixed(2)} ريال</p>
                            )}
                            {/* Action buttons on hover */}
                            <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  loadProductDetails(product.id);
                                }}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigateToEditProduct(product.id);
                                }}
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </ContextMenuTrigger>
        <ContextMenuContent className="bg-slate-800 border-slate-700">
            {/* At brands level - can add brand */}
            {currentView === 'brands' && (
              <ContextMenuItem onClick={() => setShowCreateBrandDialog(true)}>
                <Tag className="h-4 w-4 ml-2" />
                إضافة علامة تجارية
              </ContextMenuItem>
            )}
            
            {/* At categories level (inside brand) - can add category or product */}
            {currentView === 'categories' && (
              <>
                <ContextMenuItem onClick={() => setShowCreateCategoryDialog(true)}>
                  <Folder className="h-4 w-4 ml-2" />
                  إضافة فئة
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem 
                  onClick={() => canAddProduct && navigateToAddProduct()}
                  disabled={!canAddProduct}
                >
                  <Package className="h-4 w-4 ml-2" />
                  {canAddProduct ? 'إضافة منتج' : 'لا يمكن - توجد فئات فرعية'}
                </ContextMenuItem>
              </>
            )}
            
            {/* At subcategories level (inside category) - can add subcategory or product */}
            {currentView === 'subcategories' && selectedCategory && (
              <>
                <ContextMenuItem 
                  onClick={() => canAddSubcategory && setShowCreateCategoryDialog(true)}
                  disabled={!canAddSubcategory}
                >
                  <Folder className="h-4 w-4 ml-2" />
                  إضافة فئة فرعية {!canAddSubcategory ? '(الحد الأقصى)' : `(${remainingSubcategories})`}
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem 
                  onClick={() => canAddProduct && navigateToAddProduct()}
                  disabled={!canAddProduct}
                >
                  <Package className="h-4 w-4 ml-2" />
                  {canAddProduct ? 'إضافة منتج' : 'لا يمكن - توجد فئات فرعية'}
                </ContextMenuItem>
              </>
            )}
            
            {/* At products level - can still add subcategory or more products */}
            {currentView === 'products' && selectedCategory && (
              <>
                <ContextMenuItem 
                  onClick={() => canAddSubcategory && setShowCreateCategoryDialog(true)}
                  disabled={!canAddSubcategory}
                >
                  <Folder className="h-4 w-4 ml-2" />
                  إضافة فئة فرعية {!canAddSubcategory ? '(الحد الأقصى)' : `(${remainingSubcategories})`}
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem 
                  onClick={() => canAddProduct && navigateToAddProduct()}
                  disabled={!canAddProduct}
                >
                  <Package className="h-4 w-4 ml-2" />
                  {canAddProduct ? 'إضافة منتج جديد' : 'توجد فئات فرعية - انتقل للداخل'}
                </ContextMenuItem>
              </>
            )}
          </ContextMenuContent>
        </ContextMenu>

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
              {currentView === 'subcategories' || currentView === 'products' ? 'إضافة فئة فرعية جديدة' : 'إضافة فئة جديدة'}
            </DialogTitle>
            <DialogDescription>
              {categoryPath.length > 0 
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
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="basic">الأساسية</TabsTrigger>
                      <TabsTrigger value="pricing">الأسعار والمخزون</TabsTrigger>
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
    </div>
  );
}
