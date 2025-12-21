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
  brand?: { id: string };
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
}

export default function ProductsManager() {
  const { t, i18n } = useTranslation();
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
  const [itemsPerPage] = useState(20);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    price: '',
    compareAtPrice: '',
    cost: '',
    sku: '',
    barcode: '',
    stock: '',
    lowStockThreshold: '10',
    categoryId: '',
    status: 'ACTIVE' as 'ACTIVE' | 'DRAFT' | 'ARCHIVED',
    featured: false,
    tags: '',
    metaTitle: '',
    metaDescription: '',
    weight: '',
    dimensions: '',
    unitId: '',
    productId: '',
    productCode: '',
    odooProductId: '',
    brandId: '',
    categoryIds: [] as string[],
    supplierIds: [] as string[],
  });
  const [productImages, setProductImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showCloudinaryPicker, setShowCloudinaryPicker] = useState(false);


  const [activeTab, setActiveTab] = useState('all');

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
      
      setFormData(prev => ({
        ...prev,
        brandId: brandId || '',
        categoryIds: categoryIds,
        categoryId: categoryIds.length > 0 ? categoryIds[categoryIds.length - 1] : '',
      }));
      
      // Reset editing state and open dialog
      setEditingProduct(null);
      setProductImages([]);
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
  
  // Show market setup prompt if no market (must be after all hooks)
  if (!hasMarket) {
    return <MarketSetupPrompt />;
  }

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Calling coreApi.getProducts()...');
      const [productsData, categoriesData, unitsData, brandsData, suppliersData] = await Promise.all([
        coreApi.getProducts({ limit: 1000 }),
        coreApi.getCategories(),
        // Protected endpoints: require auth so Authorization header is attached
        coreApi.get('/units', { requireAuth: true }).catch(() => []),
        coreApi.getBrands().catch(() => []), // Brands: attach auth when available for correct tenant
        coreApi.get('/suppliers', { requireAuth: true }).catch(() => [])
      ]);

      // Validate categoriesData
      let validCategories: CategoryResponse[] = [];
      if (categoriesData && typeof categoriesData === 'object') {
        if (Array.isArray(categoriesData)) {
          validCategories = categoriesData.filter((c: any) => 
            c && typeof c === 'object' && c.id && !('error' in c) && !('statusCode' in c)
          );
        } else if (categoriesData.categories && Array.isArray(categoriesData.categories)) {
          validCategories = categoriesData.categories.filter((c: any) => 
            c && typeof c === 'object' && c.id && !('error' in c) && !('statusCode' in c)
          );
        }
      }
      
      const mappedCategories = validCategories.map((c: CategoryResponse) => ({
        id: c.id,
        name: c.name,
        nameAr: c.nameAr || c.name,
        parentId: c.parentId || undefined
      }));
      setCategories(mappedCategories);
      
      // Validate unitsData, brandsData, suppliersData - filter out error objects
      const validateArray = (data: any): any[] => {
        if (Array.isArray(data)) {
          return data.filter((item: any) => 
            item && typeof item === 'object' && !('error' in item) && !('statusCode' in item)
          );
        }
        return [];
      };
      
      setUnits(validateArray(unitsData));
      setBrands(validateArray(brandsData));
      setSuppliers(validateArray(suppliersData));

      // Validate productsData - ensure it's not an error object
      let rawProducts: ProductApiResponse[] = [];
      if (productsData && typeof productsData === 'object') {
        if (Array.isArray(productsData)) {
          rawProducts = productsData.filter((p: any) => 
            p && typeof p === 'object' && p.id && !('error' in p) && !('statusCode' in p)
          ) as ProductApiResponse[];
        } else if (productsData.products && Array.isArray(productsData.products)) {
          rawProducts = productsData.products.filter((p: any) => 
            p && typeof p === 'object' && p.id && !('error' in p) && !('statusCode' in p)
          ) as ProductApiResponse[];
        } else if (!('error' in productsData) && !('statusCode' in productsData)) {
          // Single product object
          rawProducts = [productsData as ProductApiResponse];
        }
      }
      
      console.log('📦 Raw products count:', rawProducts.length);
      if (rawProducts.length > 0) {
        console.log('📦 First product RAW:', JSON.stringify(rawProducts[0], null, 2));
        console.log('📦 First product fields:', {
          id: rawProducts[0].id,
          name: rawProducts[0].name,
          nameAr: rawProducts[0].nameAr,
          price: rawProducts[0].price,
          priceType: typeof rawProducts[0].price,
          images: rawProducts[0].images,
          variants: rawProducts[0].variants,
          categories: rawProducts[0].categories
        });
      }

      const mappedProducts: Product[] = rawProducts.map((p: ProductApiResponse) => ({
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
        images: p.images?.map((img) => typeof img === 'string' ? img : img.url) || [],
        category: (p.categories?.[0] as { category?: Category })?.category || p.categories?.[0] as Category,
        status: p.isAvailable ? 'ACTIVE' : 'DRAFT',
        featured: p.featured || false,
        createdAt: p.createdAt || new Date().toISOString(),
        // Extra fields for form
        metaTitle: p.seoTitle || '',
        metaDescription: p.seoDescription || '',
        weight: p.weight || '',
        dimensions: p.dimensions || ''
      }));
      
      console.log('📦 Mapped products count:', mappedProducts.length);
      if (mappedProducts.length > 0) {
        console.log('📦 First MAPPED product:', JSON.stringify(mappedProducts[0], null, 2));
        console.log('📦 First mapped product fields:', {
          id: mappedProducts[0].id,
          name: mappedProducts[0].name,
          nameAr: mappedProducts[0].nameAr,
          price: mappedProducts[0].price,
          priceType: typeof mappedProducts[0].price,
          images: mappedProducts[0].images,
          stock: mappedProducts[0].stock,
          category: mappedProducts[0].category
        });
      }
      
      setProducts(mappedProducts);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'تعذر تحميل البيانات',
        description: 'حدث خطأ أثناء تحميل المنتجات. يرجى تحديث الصفحة.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      const uploadFormData = new FormData();
      for (let i = 0; i < files.length; i++) {
        uploadFormData.append('images', files[i]);
      }

      interface ImageUploadResponse {
        images?: Array<{ secureUrl?: string; url?: string }>;
      }
      const res = await coreApi.post('/upload/product-images', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        requireAuth: true
      }) as ImageUploadResponse;

      if (res.images && res.images.length > 0) {
        const newImageUrls = res.images.map((img) => img.secureUrl || img.url || '');
        setProductImages(prev => [...prev, ...newImageUrls]);
        toast({ title: 'تم الرفع بنجاح', description: 'تم رفع الصور بنجاح' });
      }
    } catch (error) {
      console.error('Failed to upload images:', error);
      toast({
        title: 'تعذر رفع الصور',
        description: 'حدث خطأ أثناء رفع الصور. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index: number) => {
    setProductImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleCloudinarySelect = (images: string[]) => {
    console.log('📸 Setting image from Cloudinary:', images);
    // Take only the first image since we're in single selection mode
    const selectedImage = images.length > 0 ? [images[0]] : [];
    setProductImages(selectedImage);
    console.log('📸 New productImages state:', selectedImage);
    toast({
      title: 'تم الاختيار بنجاح',
      description: 'تم تعيين الصورة من Cloudinary كصورة المنتج',
    });
  };

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

  const handleSaveProduct = async () => {
    try {
      // Validate required fields
      if (!formData.name || formData.name.trim() === '') {
        toast({
          title: 'حقل مطلوب',
          description: 'اسم المنتج مطلوب',
          variant: 'destructive',
        });
        return;
      }

      if (!formData.price || formData.price.trim() === '') {
        toast({
          title: 'حقل مطلوب',
          description: 'سعر المنتج مطلوب',
          variant: 'destructive',
        });
        return;
      }

      const productPrice = parseFloat(formData.price);
      if (isNaN(productPrice) || productPrice < 0) {
        toast({
          title: 'خطأ في السعر',
          description: 'السعر يجب أن يكون رقماً صحيحاً أكبر من أو يساوي صفر',
          variant: 'destructive',
        });
        return;
      }

      // Validate price against unit cost if unit is selected
      if (formData.unitId && formData.price) {
        const selectedUnit = units.find(u => u.id === formData.unitId);
        if (selectedUnit) {
          const unitCost = Number(selectedUnit.cost) || 0;
          
          // Try to extract quantity from product name
          const quantity = extractQuantityFromName(
            formData.name || formData.nameAr || '',
            selectedUnit.code,
            selectedUnit.name,
            selectedUnit.nameAr
          );
          
          if (quantity !== null && quantity > 0 && unitCost > 0) {
            const expectedMinPrice = quantity * unitCost;
            
            if (productPrice < expectedMinPrice) {
              toast({
                title: 'خطأ في السعر',
                description: `السعر يجب أن يكون ${expectedMinPrice.toFixed(2)} ر.س على الأقل (${quantity} ${selectedUnit.code} × ${unitCost.toFixed(2)} ر.س)`,
                variant: 'destructive',
              });
              return; // Stop saving
            }
          }
        }
      }

      // Transform frontend form data to match backend DTO
      const productData = {
        name: formData.name,
        nameAr: formData.nameAr,
        description: formData.description,
        descriptionAr: formData.descriptionAr,
        sku: formData.sku || undefined,
        barcode: formData.barcode || undefined,
        price: parseFloat(formData.price),
        compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : undefined,
        costPerItem: formData.cost ? parseFloat(formData.cost) : undefined,
        isAvailable: formData.status === 'ACTIVE',
        isPublished: formData.status === 'ACTIVE',
        seoTitle: formData.metaTitle || undefined,
        seoDescription: formData.metaDescription || undefined,
        categoryIds: formData.categoryIds.length > 0 ? formData.categoryIds : (formData.categoryId ? [formData.categoryId] : []),
        images: productImages.map((url, index) => ({
          url,
          altText: formData.name, // Use English name
          sortOrder: index
        })),
        featured: formData.featured,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        dimensions: formData.dimensions || undefined,
        unitId: formData.unitId || undefined,
        productId: formData.productId || undefined,
        productCode: formData.productCode || undefined,
        odooProductId: formData.odooProductId || undefined,
        brandId: formData.brandId || undefined,
        supplierIds: formData.supplierIds.length > 0 ? formData.supplierIds : undefined,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        variants: [{
          name: 'Default',
          sku: formData.sku || undefined,
          price: parseFloat(formData.price),
          compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : undefined,
          inventoryQuantity: Math.max(parseInt(formData.stock) || 0, 0),
        }]
      };

      if (editingProduct) {
        await coreApi.updateProduct(editingProduct.id, productData);
        toast({ title: t('common.success'), description: t('dashboard.products.editProduct') + ' ' + t('common.success') });
      } else {
        await coreApi.createProduct(productData);
        toast({ title: t('common.success'), description: t('dashboard.products.addProduct') + ' ' + t('common.success') });
      }

      setIsAddDialogOpen(false);
      setEditingProduct(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to save product:', error);
      toast({
        title: 'تعذر حفظ المنتج',
        description: 'حدث خطأ أثناء حفظ المنتج. يرجى المحاولة مرة أخرى.',
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
    } catch (error: any) {
      console.error('Failed to delete product:', error);
      const errorMessage = error?.message || 'حدث خطأ أثناء حذف المنتج';
      const isNotFound = errorMessage.includes('not found') || errorMessage.includes('404');
      
      if (isNotFound) {
        toast({
          title: 'تم الحذف',
          description: 'المنتج غير موجود (ربما تم حذفه مسبقاً)',
        });
        loadData();
      } else {
        toast({
          title: 'تعذر حذف المنتج',
          description: errorMessage || 'حدث خطأ أثناء حذف المنتج. يرجى المحاولة مرة أخرى.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) {
      toast({
        title: 'لا يوجد منتجات محددة',
        description: 'يرجى تحديد المنتجات المراد حذفها',
        variant: 'destructive',
      });
      return;
    }

    const count = selectedProducts.size;
    if (!confirm(`هل أنت متأكد من حذف ${count} منتج${count > 1 ? 'ات' : ''}؟`)) return;

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
          title: 'تنبيه',
          description: `تم حذف ${deletedCount} من أصل ${count} منتج. عدد المحاولات الفاشلة: ${failedCount}`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'نجح',
          description: `تم حذف ${count} منتج${count > 1 ? 'ات' : ''} بنجاح`,
        });
      }
      
      setSelectedProducts(new Set());
      loadData();
    } catch (error: any) {
      console.error('Failed to delete products:', error);
      toast({
        title: 'خطأ',
        description: error?.response?.data?.message || 'فشل حذف المنتجات',
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

  const resetForm = () => {
    setFormData({
      name: '',
      nameAr: '',
      description: '',
      descriptionAr: '',
      price: '',
      compareAtPrice: '',
      cost: '',
      sku: '',
      barcode: '',
      stock: '',
      lowStockThreshold: '10',
      categoryId: '',
      status: 'ACTIVE',
      featured: false,
      tags: '',
      metaTitle: '',
      metaDescription: '',
      weight: '',
      dimensions: '',
      unitId: '',
      productId: '',
      productCode: '',
      odooProductId: '',
      brandId: '',
      categoryIds: [],
      supplierIds: [],
    });
    setProductImages([]);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    // Extended product type for form data
    interface ExtendedProduct extends Product {
      categories?: Array<{ category?: { id: string }; id?: string }>;
      unit?: { id: string };
      productId?: string;
      productCode?: string;
      odooProductId?: string;
      brand?: { id: string };
      suppliers?: Array<{ supplierId?: string; supplier?: { id: string } }>;
    }
    const extProduct = product as ExtendedProduct;
    setFormData({
      name: product.name,
      nameAr: product.nameAr,
      description: product.description,
      descriptionAr: product.descriptionAr,
      price: (product.price || 0).toString(),
      compareAtPrice: product.compareAtPrice?.toString() || '',
      cost: product.cost?.toString() || '',
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
      productId: extProduct.productId || '',
      productCode: extProduct.productCode || '',
      odooProductId: extProduct.odooProductId || '',
      brandId: extProduct.brand?.id || '',
      supplierIds: extProduct.suppliers?.map((s) => s.supplierId || s.supplier?.id || '').filter(Boolean) || [],
    });
    setProductImages(product.images || []);
    setIsAddDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const config = {
      ACTIVE: { label: 'نشط', className: 'bg-green-500/10 text-green-700 border-green-500/20' },
      DRAFT: { label: 'مسودة', className: 'bg-gray-500/10 text-gray-700 border-gray-500/20' },
      ARCHIVED: { label: 'مؤرشف', className: 'bg-red-500/10 text-red-700 border-red-500/20' },
    };
    const { label, className } = config[status as keyof typeof config] || config.DRAFT;
    return <Badge variant="outline" className={className}>{label}</Badge>;
  };

  const getStockBadge = (stock: number, threshold: number) => {
    if (stock === 0) {
      return <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-500/20">{t('dashboard.products.depleted')}</Badge>;
    }
    if (stock <= threshold) {
      return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">منخفض</Badge>;
    }
    return <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">متوفر</Badge>;
  };

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
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(new Set(paginatedProducts.map(p => p.id)));
    } else {
      setSelectedProducts(new Set());
    }
  };

  const handleSelectAllProducts = async () => {
    try {
      // Fetch all products with a very large limit to get all IDs
      const allProducts = await coreApi.getProducts({ limit: 10000 });
      const allProductIds = allProducts.map((p) => p.id);
      setSelectedProducts(new Set(allProductIds));
      toast({
        title: 'تم التحديد',
        description: `تم تحديد ${allProductIds.length} منتج`,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'فشل في تحديد جميع المنتجات';
      console.error('Failed to select all products:', error);
      toast({
        title: 'خطأ',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const isAllSelected = paginatedProducts.length > 0 && paginatedProducts.every(p => selectedProducts.has(p.id));
  const isSomeSelected = selectedProducts.size > 0 && selectedProducts.size < paginatedProducts.length;

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
      
      const exportData = products.map((p: any) => ({
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
        title: 'نجح',
        description: t('dashboard.products.exportSuccess'),
      });
    } catch (error) {
      console.error('Failed to export products:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تصدير المنتجات. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    }
  };

  // Import products from Excel
  const handleImportProducts = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if user has a valid tenant/market
    if (!user?.tenantId || user.tenantId === 'default' || user.tenantId === 'system') {
      toast({
        title: 'خطأ في الإعدادات',
        description: 'يجب إعداد متجر أولاً قبل استيراد المنتجات. يرجى الانتقال إلى إعدادات المتجر.',
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
      setImportProgress({ current: 0, total: 100, currentItem: 'جاري قراءة ملف Excel...' });
      
      // Force a re-render to ensure dialog is visible
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const data = await file.arrayBuffer();
      setImportProgress({ current: 10, total: 100, currentItem: 'جاري تحليل البيانات...' });
      
      const workbook = read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      setImportProgress({ current: 20, total: 100, currentItem: 'جاري معالجة البيانات...' });
      
      // Read ALL rows from Excel - ensure no limit is applied
      const jsonData = utils.sheet_to_json<{
        product_id?: string;
        sku?: string;
        price: number | string;
        cost?: number | string;
        coins_number?: number | string;
        notify?: string | boolean;
        min?: number | string;
        max?: number | string;
        web_status?: string | boolean;
        mobile_status?: string | boolean;
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
      
      if (totalItems === 0) {
        setIsImporting(false);
        toast({
          title: 'خطأ',
          description: 'لم يتم العثور على أي بيانات في ملف Excel. يرجى التحقق من الملف.',
          variant: 'destructive',
        });
        e.target.value = '';
        return;
      }
      
      // ============================================
      // PHASE 1: SCAN AND VALIDATE ALL ROWS FIRST
      // ============================================
      console.log('📋 PHASE 1: Scanning and validating all rows...');
      setImportProgress({ current: 0, total: totalItems, currentItem: `جاري فحص ومراجعة ${totalItems} صف...` });
      
      const validationErrors: Array<{ row: number; column: string; productName: string; error: string }> = [];
      const validRows: Array<{ index: number; row: any; productData: any }> = [];
      
      // Scan and validate all rows first
      for (let i = 0; i < totalItems; i++) {
        // Check if import was stopped
        if (importAbortRef.current) {
          console.log('🛑 Import stopped by user during validation');
          break;
        }
        
        const row = jsonData[i];
        const rowNum = i + 2; // Excel row number (1-indexed + header)
        
        // Update scan progress
        setImportProgress({ 
          current: i + 1, 
          total: totalItems, 
          currentItem: `جاري فحص الصف ${rowNum}/${totalItems}...` 
        });
        
        // Validate row
        const productId = (row.product_id || '').toString().trim();
        const sku = (row.sku || row.SKU || '').toString().trim();
        const name = (row.Name || '').toString().trim();
        const productName = name || productId || sku || `الصف ${rowNum}`;
        const priceStr = row.price || row.Price;
        
        let hasError = false;
        let errorColumn = 'General';
        let errorMessage = '';
        
        // Validate required fields
        if (!name && !productId && !sku) {
          hasError = true;
          errorColumn = 'General';
          errorMessage = 'Name, product_id, or sku is required';
        } else if (!priceStr || (typeof priceStr === 'string' && !priceStr.toString().trim())) {
          hasError = true;
          errorColumn = 'Price';
          errorMessage = 'Price is required';
        } else {
          // Validate price format
          const price = typeof priceStr === 'string' ? parseFloat(priceStr.toString().replace(/[^\d.-]/g, '')) : priceStr;
          if (isNaN(price) || price < 0) {
            hasError = true;
            errorColumn = 'Price';
            errorMessage = 'Invalid price format';
          }
        }
        
        // Validate category if provided
        if (!hasError && row.Category) {
          const category = categories.find(c => 
            c.name?.toLowerCase() === row.Category?.toLowerCase() ||
            c.nameAr?.toLowerCase() === row.Category?.toLowerCase()
          );
          if (!category && row.Category.trim()) {
            hasError = true;
            errorColumn = 'Category';
            errorMessage = `Category "${row.Category}" not found`;
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
            errorMessage = `Brand "${row.Brand || row.BrandCode}" not found`;
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
      
      console.log(`✅ Scan complete: ${validRows.length} valid rows, ${validationErrors.length} invalid rows`);
      
      // ============================================
      // PHASE 2: UPLOAD VALID ROWS WITH BATCHING
      // ============================================
      let successCount = 0;
      const uploadErrors: Array<{ row: number; column: string; productName: string; error: string }> = [];
      // Reset abort flag at start of import
      importAbortRef.current = false;
      
      if (validRows.length > 0) {
        console.log(`🔄 PHASE 2: Uploading ${validRows.length} valid rows...`);
        setImportProgress({ current: 0, total: validRows.length, currentItem: `جاري رفع ${validRows.length} منتج صالح...` });
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Process in batches for speed
        const BATCH_SIZE = 5; // Process 5 products concurrently
        
        for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
          if (importAbortRef.current) {
            console.log('🛑 Import stopped by user');
            break;
          }
          
          const batch = validRows.slice(i, i + BATCH_SIZE);
          
          await Promise.all(batch.map(async (item) => {
            const { index, row } = item;
            const rowNum = index + 2;
            
            if (importAbortRef.current) {
              console.log('🛑 Import stopped by user - skipping item');
              return;
            }
            
            const productId = (row.product_id || '').toString().trim();
            const sku = (row.sku || row.SKU || '').toString().trim();
            const name = (row.Name || '').toString().trim();
            const productName = name || productId || sku || `الصف ${rowNum}`;
            
            // Build product data
            const priceStr = row.price || row.Price;
            const costStr = row.cost;
            const coinsNumberStr = row.coins_number;
            const notifyStr = row.notify;
            const minStr = row.min;
            const maxStr = row.max;
            const webStatusStr = row.web_status;
            const mobileStatusStr = row.mobile_status;

            try {
              const price = typeof priceStr === 'string' ? parseFloat(priceStr.toString().replace(/[^\d.-]/g, '')) : priceStr;

              const cost = costStr 
                ? (typeof costStr === 'string' ? parseFloat(costStr.toString().replace(/[^\d.-]/g, '')) : costStr)
                : undefined;

              const coinsNumber = coinsNumberStr 
                ? (typeof coinsNumberStr === 'string' ? parseInt(coinsNumberStr.toString().replace(/[^\d]/g, '')) || undefined : coinsNumberStr)
                : undefined;

              const notify = notifyStr !== undefined && notifyStr !== null && notifyStr !== '' 
                ? (typeof notifyStr === 'boolean' ? notifyStr : (notifyStr.toString().toLowerCase() === 'true' || notifyStr.toString() === '1'))
                : undefined;

              const min = minStr 
                ? (typeof minStr === 'string' ? parseInt(minStr.toString().replace(/[^\d]/g, '')) || undefined : minStr)
                : undefined;

              const max = maxStr 
                ? (typeof maxStr === 'string' ? parseInt(maxStr.toString().replace(/[^\d]/g, '')) || undefined : maxStr)
                : undefined;

              const webStatus = webStatusStr !== undefined && webStatusStr !== null && webStatusStr !== ''
                ? (typeof webStatusStr === 'boolean' ? webStatusStr : (webStatusStr.toString().toLowerCase() === 'true' || webStatusStr.toString() === '1'))
                : undefined;

              const mobileStatus = mobileStatusStr !== undefined && mobileStatusStr !== null && mobileStatusStr !== ''
                ? (typeof mobileStatusStr === 'boolean' ? mobileStatusStr : (mobileStatusStr.toString().toLowerCase() === 'true' || mobileStatusStr.toString() === '1'))
                : undefined;

              const compareAtPrice = row.CompareAtPrice 
                ? (typeof row.CompareAtPrice === 'string' 
                    ? parseFloat(row.CompareAtPrice.replace(/[^\d.-]/g, '')) 
                    : row.CompareAtPrice)
                : undefined;

              const stock = row.Stock 
                ? (typeof row.Stock === 'string' ? parseInt(row.Stock.replace(/[^\d]/g, '')) || 0 : row.Stock)
                : 0;

              const tags = row.Tags ? row.Tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [];

              const productSku = sku || undefined;

              const variantData: any = {
                name: 'Default',
                price,
                inventoryQuantity: stock,
              };

              const cleanString = (value: any): string | undefined => {
                if (value === null || value === undefined || value === '') return undefined;
                const str = value.toString().trim();
                return str.length > 0 ? str : undefined;
              };

              // Find category and brand
              let categoryId: string | undefined;
              if (row.Category) {
                const category = categories.find(c => 
                  c.name?.toLowerCase() === row.Category?.toLowerCase() ||
                  c.nameAr?.toLowerCase() === row.Category?.toLowerCase()
                );
                categoryId = category?.id;
              }

              let brandId: string | undefined;
              if (row.Brand || row.BrandCode) {
                const brand = brands.find(b => 
                  b.name?.toLowerCase() === row.Brand?.toLowerCase() ||
                  b.nameAr?.toLowerCase() === row.Brand?.toLowerCase() ||
                  b.code?.toLowerCase() === row.BrandCode?.toLowerCase()
                );
                brandId = brand?.id;
              }

              const productData: any = {
                name: name || productId || sku || 'Product',
                nameAr: cleanString(row.NameAr),
                description: cleanString(row.Description),
                descriptionAr: cleanString(row.DescriptionAr),
                price,
                costPerItem: cost && !isNaN(cost) && cost > 0 ? cost : undefined,
                coinsNumber: coinsNumber !== undefined && coinsNumber !== null ? coinsNumber : undefined,
                notify: notify !== undefined && notify !== null ? notify : undefined,
                min: min !== undefined && min !== null ? min : undefined,
                max: max !== undefined && max !== null ? max : undefined,
                webStatus: webStatus !== undefined && webStatus !== null ? webStatus : undefined,
                mobileStatus: mobileStatus !== undefined && mobileStatus !== null ? mobileStatus : undefined,
                purpleCardsProductNameAr: cleanString(row.purple_cards_product_name_ar),
                purpleCardsProductNameEn: cleanString(row.purple_cards_product_name_en),
                purpleCardsSlugAr: cleanString(row.purple_cards_slug_ar),
                purpleCardsSlugEn: cleanString(row.purple_cards_slug_en),
                purpleCardsDescAr: cleanString(row.purple_cards_desc_ar),
                purpleCardsDescEn: cleanString(row.purple_cards_desc_en),
                purpleCardsLongDescAr: cleanString(row.purple_cards_long_desc_ar),
                purpleCardsLongDescEn: cleanString(row.purple_cards_long_desc_en),
                purpleCardsMetaTitleAr: cleanString(row.purple_cards_meta_title_ar),
                purpleCardsMetaTitleEn: cleanString(row.purple_cards_meta_title_en),
                purpleCardsMetaKeywordAr: cleanString(row.purple_cards_meta_keyword_ar),
                purpleCardsMetaKeywordEn: cleanString(row.purple_cards_meta_keyword_en),
                purpleCardsMetaDescriptionAr: cleanString(row.purple_cards_meta_description_ar),
                purpleCardsMetaDescriptionEn: cleanString(row.purple_cards_meta_description_en),
                ish7enProductNameAr: cleanString(row.ish7en_product_name_ar),
                ish7enProductNameEn: cleanString(row.ish7en_product_name_en),
                ish7enSlugAr: cleanString(row.ish7en_slug_ar),
                ish7enSlugEn: cleanString(row.ish7en_slug_en),
                ish7enDescAr: cleanString(row.ish7en_desc_ar),
                ish7enDescEn: cleanString(row.ish7en_desc_en),
                ish7enLongDescAr: cleanString(row.ish7en_long_desc_ar),
                ish7enLongDescEn: cleanString(row.ish7en_long_desc_en),
                ish7enMetaTitleAr: cleanString(row.ish7en_meta_title_ar),
                ish7enMetaTitleEn: cleanString(row.ish7en_meta_title_en),
                ish7enMetaKeywordAr: cleanString(row.ish7en_meta_keyword_ar),
                ish7enMetaKeywordEn: cleanString(row.ish7en_meta_keyword_en),
                ish7enMetaDescriptionAr: cleanString(row.ish7en_meta_description_ar),
                ish7enMetaDescriptionEn: cleanString(row.ish7en_meta_description_en),
                compareAtPrice: compareAtPrice && !isNaN(compareAtPrice) && compareAtPrice > 0 ? compareAtPrice : undefined,
                ...(productSku ? { sku: productSku } : {}),
                ...(productId ? { productId: productId } : {}),
                barcode: cleanString(row.Barcode),
                weight: row.Weight?.toString().trim() ? (parseFloat(row.Weight.toString().replace(/[^\d.-]/g, '')) || undefined) : undefined,
                dimensions: cleanString(row.Dimensions),
                tags: tags.length > 0 ? tags : undefined,
                brandId: brandId || undefined,
                categoryIds: categoryId ? [categoryId] : undefined,
                isAvailable: row.Status !== 'DRAFT' && row.Status !== 'ARCHIVED' && row.Status !== 'draft' && row.Status !== 'archived',
                featured: row.Featured === 'Yes' || row.Featured === 'true' || row.Featured === 'TRUE' || row.Featured === '1',
                variants: [variantData]
              };
              
              // Remove undefined values
              Object.keys(productData).forEach(key => {
                if (productData[key] === undefined) {
                  delete productData[key];
                }
              });

              // Create product with retry logic handled by backend or simple retry here if needed
              // For speed, we rely on backend handling or simple error catching
              await coreApi.createProduct(productData, true);
              successCount++;
              
            } catch (error: any) {
              console.error(`❌ Error uploading product at row ${rowNum}:`, error);
              
              let userFriendlyError = 'حدث خطأ غير معروف';
              let errorColumn = 'General';
              
              const errorMessage = error?.message || error?.data?.message || error?.response?.data?.message || '';
                
              if (error?.status === 403) {
                importAbortRef.current = true;
                userFriendlyError = 'يجب إعداد متجر أولاً.';
              } else if (error?.status === 400) {
                userFriendlyError = 'بيانات غير صحيحة.';
              } else if (error?.status === 404) {
                userFriendlyError = 'الفئة أو العلامة التجارية غير موجودة.';
                errorColumn = 'Category';
              }
                
              uploadErrors.push({ row: rowNum, column: errorColumn, productName: productName.toString(), error: userFriendlyError });
            }
          }));
          
          // Update progress after batch
          setImportProgress({ 
            current: Math.min(i + BATCH_SIZE, validRows.length), 
            total: validRows.length, 
            currentItem: `تم رفع ${Math.min(i + BATCH_SIZE, validRows.length)} من ${validRows.length} منتج...` 
          });
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
          ? `اكتمل الاستيراد! تم استيراد ${successCount} منتج بنجاح، ورفض ${allErrors.length} منتج من إجمالي ${finalTotal}`
          : `اكتمل الاستيراد! تم استيراد ${successCount} منتج بنجاح من إجمالي ${finalTotal}`;
        
        setImportProgress({ 
          current: finalTotal, 
          total: finalTotal, 
          currentItem: completionMessage
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        if (allErrors.length > 0) {
          console.group('تفاصيل أخطاء الاستيراد:');
          console.log(`إجمالي الأخطاء: ${allErrors.length}`);
          allErrors.forEach((err, idx) => {
            console.error(`خطأ ${idx + 1}: الصف ${err.row} - العمود: ${err.column} - المنتج: ${err.productName} - الخطأ: ${err.error}`);
          });
          console.groupEnd();
          
          setImportErrors(allErrors);
          setIsImporting(false);
          
          await new Promise(resolve => setTimeout(resolve, 600));
          
          setShowImportErrorDialog(true);
          console.log('✅ Error dialog should now be visible with', allErrors.length, 'errors');
          
          setTimeout(() => {
          setShowImportErrorDialog(true);
          }, 200);
        } else {
          await new Promise(resolve => setTimeout(resolve, 1500));
          setIsImporting(false);
        }
        
        toast({
          title: successCount > 0 ? 'تم الاستيراد بنجاح' : 'فشل الاستيراد',
          description: allErrors.length > 0 
            ? `تم استيراد ${successCount} منتج${successCount !== 1 ? 'ات' : ''} بنجاح، ورفض ${allErrors.length} منتج${allErrors.length !== 1 ? 'ات' : ''}`
            : `تم استيراد ${successCount} منتج${successCount !== 1 ? 'ات' : ''} بنجاح`,
          variant: allErrors.length > successCount ? 'destructive' : successCount > 0 ? 'default' : 'destructive',
          duration: 5000,
        });
        
        await loadData();
      }
      
      // Reset file input
      e.target.value = '';
    } catch (error: unknown) {
      // Ensure progress dialog is closed on error
      setIsImporting(false);
      toast({ 
        title: 'تعذر استيراد المنتجات', 
        description: error instanceof Error ? error.message : 'حدث خطأ أثناء قراءة ملف الاستيراد. تأكد من صحة تنسيق الملف.', 
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
    total: products.length,
    active: products.filter((p: Product) => p.status === 'ACTIVE').length,
    lowStock: products.filter((p: Product) => p.stock <= (p as any).lowStockThreshold).length,
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
            المستكشف الهرمي
          </Button>
          <Button 
            className="gap-2" 
            onClick={() => {
              setEditingProduct(null);
              resetForm();
              setIsAddDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            {t('dashboard.products.addProduct')}
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? t('dashboard.products.editProduct') : t('dashboard.products.addNewProduct')}</DialogTitle>
              <DialogDescription>
                {t('dashboard.products.enterProductDetails')}
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic">الأساسية</TabsTrigger>
                <TabsTrigger value="pricing">الأسعار</TabsTrigger>
                <TabsTrigger value="seo">SEO</TabsTrigger>
                <TabsTrigger value="advanced">متقدم</TabsTrigger>
                <TabsTrigger value="settings">الإعدادات</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                {/* Image Upload Section */}
                <div>
                  <Label>صور المنتج</Label>
                  <div className="mt-2 space-y-3">
                    {/* Image Preview Grid */}
                    {productImages.length > 0 && (
                      <div className="grid grid-cols-4 gap-3">
                        {productImages.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image}
                              alt={`Product ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeImage(index)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Upload Buttons */}
                    <div className="flex items-center gap-2">
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('image-upload')?.click()}
                        disabled={uploadingImage}
                        className="flex-1"
                      >
                        <ImageIcon className="ml-2 h-4 w-4" />
                        {uploadingImage ? 'جاري الرفع...' : 'رفع صور'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('🔵 [BUTTON CLICK] Opening Cloudinary picker dialog');
                          setShowCloudinaryPicker(true);
                        }}
                        className="flex-1"
                      >
                        <Cloud className="ml-2 h-4 w-4" />
                        اختر من Cloudinary
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">اسم المنتج (English) *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Product Name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="nameAr">اسم المنتج (العربية)</Label>
                    <Input
                      id="nameAr"
                      value={formData.nameAr}
                      onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                      placeholder="اسم المنتج"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="productId">معرف المنتج (Product ID)</Label>
                    <Input
                      id="productId"
                      value={formData.productId}
                      onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                      placeholder="معرف المنتج (اختياري)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="productCode">رمز المنتج (Product Code)</Label>
                    <Input
                      id="productCode"
                      value={formData.productCode}
                      onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                      placeholder="رمز المنتج من المورد (اختياري)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="odooProductId">معرف Odoo</Label>
                    <Input
                      id="odooProductId"
                      value={formData.odooProductId}
                      onChange={(e) => setFormData({ ...formData, odooProductId: e.target.value })}
                      placeholder="معرف Odoo (اختياري)"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="brandId">العلامة التجارية</Label>
                  <Select 
                    value={formData.brandId} 
                    onValueChange={(value) => setFormData({ ...formData, brandId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر العلامة التجارية (اختياري)" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.nameAr || brand.name} {brand.code && `(${brand.code})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="categories">الفئات (يمكن اختيار أكثر من فئة)</Label>
                  <Select 
                    value="" 
                    onValueChange={(value) => {
                      if (value && !formData.categoryIds.includes(value)) {
                        setFormData({ ...formData, categoryIds: [...formData.categoryIds, value] });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر فئة لإضافتها" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter(cat => !formData.categoryIds.includes(cat.id)).map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.nameAr || category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.categoryIds.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.categoryIds.map((catId) => {
                        const category = categories.find(c => c.id === catId);
                        return category ? (
                          <Badge key={catId} variant="secondary" className="flex items-center gap-1">
                            {category.nameAr || category.name}
                            <X 
                              className="h-3 w-3 cursor-pointer" 
                              onClick={() => setFormData({ ...formData, categoryIds: formData.categoryIds.filter(id => id !== catId) })}
                            />
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">الوصف (English)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Product description..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="descriptionAr">الوصف (العربية)</Label>
                  <Textarea
                    id="descriptionAr"
                    value={formData.descriptionAr}
                    onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                    placeholder="وصف المنتج..."
                    rows={3}
                  />
                </div>
              </TabsContent>

              <TabsContent value="pricing" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">السعر (ريال) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="compareAtPrice">السعر قبل الخصم</Label>
                    <Input
                      id="compareAtPrice"
                      type="number"
                      step="0.01"
                      value={formData.compareAtPrice}
                      onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cost">التكلفة</Label>
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sku">رمز المنتج (SKU)</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="SKU-001"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="unitId">الوحدة</Label>
                  <Select
                    value={formData.unitId}
                    onValueChange={(value) => setFormData({ ...formData, unitId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الوحدة (اختياري)" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.nameAr || unit.name} ({unit.code}) - {Number(unit.cost).toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">التكلفة المعروضة بالعملة الأساسية</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stock">الكمية المتوفرة</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lowStockThreshold">حد التنبيه</Label>
                    <Input
                      id="lowStockThreshold"
                      type="number"
                      value={formData.lowStockThreshold}
                      onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                      placeholder="10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="barcode">الباركود</Label>
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="123456789"
                  />
                </div>
              </TabsContent>

              <TabsContent value="seo" className="space-y-4 mt-4">
                <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <Globe className="h-5 w-5 text-blue-600" />
                  <p className="text-sm text-blue-900 dark:text-blue-100">تحسين ظهور المنتج في محركات البحث</p>
                </div>

                <div>
                  <Label htmlFor="metaTitle">عنوان SEO</Label>
                  <Input
                    id="metaTitle"
                    value={formData.metaTitle}
                    onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                    placeholder="عنوان المنتج لمحركات البحث"
                    maxLength={60}
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.metaTitle.length}/60 حرف</p>
                </div>

                <div>
                  <Label htmlFor="metaDescription">وصف SEO</Label>
                  <Textarea
                    id="metaDescription"
                    value={formData.metaDescription}
                    onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                    placeholder="وصف المنتج لمحركات البحث"
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.metaDescription.length}/160 حرف</p>
                </div>

                <div>
                  <Label htmlFor="tags">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      الوسوم (Tags)
                    </div>
                  </Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="أدخل الوسوم مفصولة بفاصلة (مثال: إلكترونيات, هواتف, سامسونج)"
                  />
                  <p className="text-xs text-gray-500 mt-1">استخدم الفاصلة للفصل بين الوسوم</p>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4 mt-4">
                <div className="flex items-center gap-2 mb-4 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <Settings className="h-5 w-5 text-purple-600" />
                  <p className="text-sm text-purple-900 dark:text-purple-100">إعدادات متقدمة للمنتج</p>
                </div>

                <div>
                  <Label htmlFor="suppliers">الموردين (يمكن اختيار أكثر من مورد)</Label>
                  <Select 
                    value="" 
                    onValueChange={(value) => {
                      if (value && !formData.supplierIds.includes(value)) {
                        setFormData({ ...formData, supplierIds: [...formData.supplierIds, value] });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر مورد لإضافته" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.filter(sup => !formData.supplierIds.includes(sup.id)).map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.nameAr || supplier.name} - خصم: {Number(supplier.discountRate).toFixed(2)}%
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.supplierIds.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.supplierIds.map((supId) => {
                        const supplier = suppliers.find(s => s.id === supId);
                        return supplier ? (
                          <Badge key={supId} variant="secondary" className="flex items-center gap-1">
                            {supplier.nameAr || supplier.name} ({Number(supplier.discountRate).toFixed(2)}%)
                            <X 
                              className="h-3 w-3 cursor-pointer" 
                              onClick={() => setFormData({ ...formData, supplierIds: formData.supplierIds.filter(id => id !== supId) })}
                            />
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="weight">الوزن (كجم)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.01"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dimensions">الأبعاد (سم)</Label>
                    <Input
                      id="dimensions"
                      value={formData.dimensions}
                      onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                      placeholder="الطول × العرض × الارتفاع"
                    />
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    معلومات إضافية
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <p>• يمكنك إضافة متغيرات المنتج (الألوان، المقاسات) لاحقاً</p>
                    <p>• الوزن والأبعاد تساعد في حساب تكلفة الشحن</p>
                    <p>• الوسوم تحسن من ظهور المنتج في البحث</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="status">الحالة</Label>
                  <Select value={formData.status} onValueChange={(value: 'ACTIVE' | 'DRAFT' | 'ARCHIVED') => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">نشط</SelectItem>
                      <SelectItem value="DRAFT">مسودة</SelectItem>
                      <SelectItem value="ARCHIVED">مؤرشف</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>منتج مميز</Label>
                    <p className="text-sm text-gray-500">عرض هذا المنتج في القسم المميز</p>
                  </div>
                  <Switch
                    checked={formData.featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="flex justify-between items-center sm:justify-between">
              {editingProduct && (
                <Button variant="outline" asChild className="gap-2">
                  <Link to={`/products/${editingProduct.id}`} target="_blank">
                    <Eye className="h-4 w-4" />
                    {t('dashboard.products.viewInStore')}
                  </Link>
                </Button>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  {t('dashboard.products.cancel')}
                </Button>
                <Button 
                  onClick={handleSaveProduct}
                  disabled={!formData.name?.trim() || !formData.price?.trim() || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0}
                >
                  {editingProduct ? t('dashboard.products.update') : t('dashboard.products.add')}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
            <div className="flex-1 relative">
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
                تحديد الكل
              </Button>
              {selectedProducts.size > 0 && (
                <Button 
                  variant="destructive" 
                  className="gap-2" 
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                  {isDeleting ? 'جاري الحذف...' : `حذف ${selectedProducts.size}`}
                </Button>
              )}
              <Button variant="outline" className="gap-2" onClick={handleExportProducts}>
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
                  <TableHead>{t('dashboard.products.product')}</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>{t('dashboard.products.price')}</TableHead>
                  <TableHead>{t('dashboard.products.stock')}</TableHead>
                  <TableHead>{t('dashboard.products.status')}</TableHead>
                  <TableHead>{t('dashboard.products.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.map((product, index) => (
                  <TableRow 
                    key={product.id} 
                    className="group hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent dark:hover:from-gray-800 dark:hover:to-transparent transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
                    style={{ 
                      animationDelay: `${index * 50}ms`,
                      animationDuration: '500ms'
                    }}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedProducts.has(product.id)}
                        onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select ${product.nameAr || product.name}`}
                      />
                    </TableCell>
                    <TableCell
                      className="cursor-pointer"
                      onClick={() => {
                        setViewingProduct(product);
                        setIsDetailsModalOpen(true);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-xl flex items-center justify-center overflow-hidden border-2 border-transparent transition-all duration-300 group-hover:border-primary group-hover:shadow-lg group-hover:scale-110">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.nameAr} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                          ) : (
                            <ImageIcon className="h-7 w-7 text-gray-400 transition-all duration-300 group-hover:text-primary" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors duration-300">{product.nameAr || product.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{product.category?.nameAr || product.category?.name || 'بدون فئة'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-gray-600 dark:text-gray-300">{product.sku}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">{Number(product.price || 0).toFixed(2)} ريال</p>
                        {product.compareAtPrice && (
                          <p className="text-xs text-gray-500 line-through">{Number(product.compareAtPrice).toFixed(2)} ريال</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">{product.stock}</span>
                        {getStockBadge(product.stock, product.lowStockThreshold)}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(product.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
          )}
          
          {/* Pagination Controls */}
          {!loading && filteredProducts.length > itemsPerPage && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                عرض {startIndex + 1} - {Math.min(endIndex, filteredProducts.length)} من {filteredProducts.length} منتج
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  السابق
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="min-w-[40px]"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  التالي
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
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
                  تعديل المنتج
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

      {/* Cloudinary Image Picker - Always render, Dialog handles visibility */}
      <CloudinaryImagePicker
        open={showCloudinaryPicker}
        onOpenChange={(open) => {
          console.log('🔵 CloudinaryImagePicker onOpenChange:', open);
          setShowCloudinaryPicker(open);
        }}
        onSelect={(images) => {
          console.log('🔵 CloudinaryImagePicker onSelect:', images);
          handleCloudinarySelect(images);
        }}
        multiple={false}
      />
      
      {/* Import Errors Dialog */}
      <Dialog 
        open={showImportErrorDialog} 
        onOpenChange={(open) => {
          console.log('🔔 Error dialog onOpenChange:', open, 'Current errors:', importErrors.length);
          setShowImportErrorDialog(open);
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
              onClick={() => setShowImportErrorDialog(false)}
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
            toast({
              title: 'تم إيقاف الاستيراد',
              description: 'تم إيقاف عملية الاستيراد بنجاح',
            });
          }
        }}
        progress={importProgress}
        title="جاري استيراد المنتجات"
        description="يرجى الانتظار بينما نقوم بمعالجة ورفع المنتجات..."
      />
    </div>
  );
}
