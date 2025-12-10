import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Upload, Edit, Trash2, Eye, Package, AlertCircle, Image as ImageIcon, X, Tag, Globe, TrendingUp, Settings } from 'lucide-react';
import { read, utils, writeFile } from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { coreApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface Category {
  id: string;
  name: string;
  nameAr: string;
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
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

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
  });
  const [productImages, setProductImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Calling coreApi.getProducts()...');
      const [productsData, categoriesData] = await Promise.all([
        coreApi.getProducts({ limit: '1000' } as any),
        coreApi.getCategories()
      ]);

      const mappedCategories = (categoriesData || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        nameAr: c.nameAr || c.name
      }));
      setCategories(mappedCategories);

      console.log('📦 Raw products count:', productsData.length);
      if (productsData.length > 0) {
        console.log('📦 First product RAW:', JSON.stringify(productsData[0], null, 2));
        console.log('📦 First product fields:', {
          id: productsData[0].id,
          name: productsData[0].name,
          nameAr: productsData[0].nameAr,
          price: productsData[0].price,
          priceType: typeof productsData[0].price,
          images: productsData[0].images,
          variants: productsData[0].variants,
          categories: productsData[0].categories
        });
      }

      const mappedProducts: Product[] = productsData.map((p: any) => ({
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
        images: p.images?.map((img: any) => typeof img === 'string' ? img : img.url) || [],
        category: p.categories?.[0]?.category || p.categories?.[0],
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
        title: 'خطأ',
        description: 'فشل تحميل البيانات',
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
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i]);
      }

      const res = await coreApi.post('/upload/product-images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        requireAuth: true
      });

      if (res.images && res.images.length > 0) {
        const newImageUrls = res.images.map((img: any) => img.secureUrl || img.url);
        setProductImages([...productImages, ...newImageUrls]);
        toast({ title: 'نجح', description: 'تم رفع الصور بنجاح' });
      }
    } catch (error) {
      console.error('Failed to upload images:', error);
      toast({
        title: 'خطأ',
        description: 'فشل رفع الصور',
        variant: 'destructive',
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index: number) => {
    setProductImages(productImages.filter((_, i) => i !== index));
  };

  const handleSaveProduct = async () => {
    try {
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
        categoryIds: formData.categoryId ? [formData.categoryId] : [],
        images: productImages.map((url, index) => ({
          url,
          altText: formData.name, // Use English name
          sortOrder: index
        })),
        featured: formData.featured,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        dimensions: formData.dimensions || undefined,
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
        toast({ title: 'نجح', description: 'تم تحديث المنتج بنجاح' });
      } else {
        await coreApi.createProduct(productData);
        toast({ title: 'نجح', description: 'تم إضافة المنتج بنجاح' });
      }

      setIsAddDialogOpen(false);
      setEditingProduct(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to save product:', error);
      toast({
        title: 'خطأ',
        description: 'فشل حفظ المنتج',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;

    try {
      await coreApi.deleteProduct(id);
      toast({ title: 'نجح', description: 'تم حذف المنتج بنجاح' });
      loadData();
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast({
        title: 'خطأ',
        description: 'فشل حذف المنتج',
        variant: 'destructive',
      });
    }
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
    });
    setProductImages([]);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
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
      status: product.status,
      featured: product.featured,
      tags: '',
      metaTitle: product.metaTitle || '',
      metaDescription: product.metaDescription || '',
      weight: product.weight || '',
      dimensions: product.dimensions || '',
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
      return <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-500/20">نفذ</Badge>;
    }
    if (stock <= threshold) {
      return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">منخفض</Badge>;
    }
    return <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">متوفر</Badge>;
  };

  const [activeTab, setActiveTab] = useState('all');

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

  // Export products to Excel
  const handleExportProducts = () => {
    const headers = ['SKU', 'Name', 'NameAr', 'Description', 'DescriptionAr', 'Price', 'CompareAtPrice', 'Stock', 'Category', 'Status', 'Featured'];
    
    const exportData = products.map(p => ({
      SKU: p.sku || '',
      Name: p.name,
      NameAr: p.nameAr,
      Description: p.description,
      DescriptionAr: p.descriptionAr,
      Price: p.price,
      CompareAtPrice: p.compareAtPrice || '',
      Stock: p.stock,
      Category: p.category?.name || '',
      Status: p.status,
      Featured: p.featured ? 'Yes' : 'No',
    }));

    const ws = utils.json_to_sheet(exportData, { header: headers });
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Products");
    writeFile(wb, "products_export.xlsx");
    
    toast({
      title: 'نجح',
      description: 'تم تصدير المنتجات بنجاح',
    });
  };

  // Import products from Excel
  const handleImportProducts = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json<{
        SKU?: string;
        Name: string;
        NameAr?: string;
        Description?: string;
        DescriptionAr?: string;
        Price: number;
        CompareAtPrice?: number;
        Stock?: number;
        Category?: string;
        Status?: string;
        Featured?: string;
      }>(worksheet);

      let successCount = 0;
      let errorCount = 0;

      for (const row of jsonData) {
        if (!row.Name || !row.Price) continue;
        
        // Find category by name
        const category = categories.find(c => 
          c.name.toLowerCase() === (row.Category || '').toLowerCase() ||
          c.nameAr === row.Category
        );

        try {
          await coreApi.createProduct({
            name: row.Name,
            nameAr: row.NameAr || '',
            description: row.Description || '',
            descriptionAr: row.DescriptionAr || '',
            price: typeof row.Price === 'string' ? parseFloat(row.Price) : row.Price,
            compareAtPrice: row.CompareAtPrice ? (typeof row.CompareAtPrice === 'string' ? parseFloat(row.CompareAtPrice) : row.CompareAtPrice) : undefined,
            sku: row.SKU || undefined,
            categoryIds: category ? [category.id] : [],
            isAvailable: row.Status !== 'DRAFT' && row.Status !== 'ARCHIVED',
            featured: row.Featured === 'Yes' || row.Featured === 'true',
            variants: [{
              name: 'Default',
              sku: row.SKU || undefined,
              price: typeof row.Price === 'string' ? parseFloat(row.Price) : row.Price,
              inventoryQuantity: row.Stock ? (typeof row.Stock === 'string' ? parseInt(row.Stock) : row.Stock) : 0,
            }]
          });
          successCount++;
        } catch (error) {
          console.error('Failed to import product:', row.Name, error);
          errorCount++;
        }
      }

      toast({
        title: 'تم الاستيراد',
        description: `تم استيراد ${successCount} منتج بنجاح${errorCount > 0 ? `, فشل ${errorCount}` : ''}`,
      });
      
      loadData();
      e.target.value = '';
    } catch (error) {
      console.error('Import error:', error);
      toast({ 
        title: 'خطأ', 
        description: 'فشل استيراد الملف', 
        variant: 'destructive' 
      });
    }
  };

  const stats = {
    total: products.length,
    active: products.filter(p => p.status === 'ACTIVE').length,
    lowStock: products.filter(p => p.stock <= p.lowStockThreshold).length,
    outOfStock: products.filter(p => p.stock === 0).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">المنتجات</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة منتجات المتجر والمخزون</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={resetForm}>
              <Plus className="h-4 w-4" />
              إضافة منتج
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}</DialogTitle>
              <DialogDescription>
                أدخل تفاصيل المنتج أدناه
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
                    
                    {/* Upload Button */}
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
                        className="w-full"
                      >
                        <ImageIcon className="ml-2 h-4 w-4" />
                        {uploadingImage ? 'جاري الرفع...' : 'رفع صور'}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">اسم المنتج (English)</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Product Name"
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

                <div>
                  <Label htmlFor="category">الفئة</Label>
                  <Select 
                    value={formData.categoryId} 
                    onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفئة" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.nameAr || category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <Label htmlFor="price">السعر (ريال)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
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
                    عرض في المتجر
                  </Link>
                </Button>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleSaveProduct}>
                  {editingProduct ? 'تحديث' : 'إضافة'}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-r-4 border-r-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي المنتجات</p>
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
                <p className="text-sm text-gray-600 dark:text-gray-400">منتجات نشطة</p>
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
                <p className="text-sm text-gray-600 dark:text-gray-400">مخزون منخفض</p>
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
                <p className="text-sm text-gray-600 dark:text-gray-400">نفذ من المخزون</p>
                <p className="text-2xl font-bold mt-1">{stats.outOfStock}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Table */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">جميع المنتجات</TabsTrigger>
          <TabsTrigger value="low-stock" className="gap-2">
            قرب النفاذ
            <Badge variant="secondary" className="h-5 px-1.5 min-w-[1.25rem]">{stats.lowStock}</Badge>
          </TabsTrigger>
          <TabsTrigger value="out-of-stock" className="gap-2">
            نفذت الكمية
            <Badge variant="secondary" className="h-5 px-1.5 min-w-[1.25rem]">{stats.outOfStock}</Badge>
          </TabsTrigger>
        </TabsList>

        <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="البحث بالاسم أو SKU..."
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
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="ACTIVE">نشط</SelectItem>
                <SelectItem value="DRAFT">مسودة</SelectItem>
                <SelectItem value="ARCHIVED">مؤرشف</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="الفئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.nameAr || category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" onClick={handleExportProducts}>
                <Download className="h-4 w-4" />
                تصدير
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
                  استيراد
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
              <h3 className="text-xl font-semibold mb-2">لا توجد منتجات</h3>
              <p className="text-gray-500 mb-4">ابدأ بإضافة منتجك الأول</p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة منتج
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المنتج</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>المخزون</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product, index) => (
                  <TableRow 
                    key={product.id} 
                    className="group hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent dark:hover:from-gray-800 dark:hover:to-transparent transition-all duration-300 cursor-pointer animate-in fade-in slide-in-from-bottom-4"
                    style={{ 
                      animationDelay: `${index * 50}ms`,
                      animationDuration: '500ms'
                    }}
                    onClick={() => {
                      setViewingProduct(product);
                      setIsDetailsModalOpen(true);
                    }}
                  >
                    <TableCell>
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
                    عرض في المتجر
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
