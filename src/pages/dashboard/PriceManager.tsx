import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Edit2, Save, X, DollarSign, TrendingUp, TrendingDown, Package, Loader2, Download, Upload, RefreshCw, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { coreApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  nameAr?: string;
  sku?: string;
  price: number;
  compareAtPrice?: number;
  costPerItem?: number;
  category?: { id: string; name: string };
  brand?: { id: string; name: string };
  isAvailable: boolean;
  suppliers?: Array<{
    id: string;
    supplierId: string;
    supplier: { id: string; name: string; nameAr?: string };
    cost?: number;
    discountRate: number;
    isPrimary: boolean;
    supplierProductCode?: string;
  }>;
}

interface PriceUpdate {
  productId: string;
  price: number;
  compareAtPrice?: number;
  costPerItem?: number;
  suppliers?: Array<{
    supplierId: string;
    cost?: number;
    discountRate?: number;
    isPrimary?: boolean;
    supplierProductCode?: string;
  }>;
}

export default function PriceManager() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [brands, setBrands] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [activeSuppliers, setActiveSuppliers] = useState<Array<{ id: string; name: string }>>([]);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  
  // Editing state
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<{ price: string; compareAtPrice: string; costPerItem: string }>({
    price: '',
    compareAtPrice: '',
    costPerItem: '',
  });
  
  // Bulk update
  const [bulkUpdateDialogOpen, setBulkUpdateDialogOpen] = useState(false);
  const [bulkUpdateType, setBulkUpdateType] = useState<'percentage' | 'fixed' | 'replace'>('percentage');
  const [bulkUpdateValue, setBulkUpdateValue] = useState('');
  const [bulkUpdateDirection, setBulkUpdateDirection] = useState<'increase' | 'decrease'>('increase');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      interface ProductResponse {
        id: string;
        name: string;
        nameAr?: string;
        sku?: string;
        price: number | string;
        compareAtPrice?: number | string;
        costPerItem?: number | string;
        categories?: Array<{ category?: { id: string; name: string }; id?: string; name?: string }>;
        brand?: { id: string; name: string };
        isAvailable?: boolean;
      }

      interface PaginatedResponse {
        data: ProductResponse[];
        meta?: { total: number; totalPages: number };
      }

      const [productsResponse, categoriesData, brandsData, suppliersData] = await Promise.all([
        coreApi.getProducts({ limit: 10000, includeCategories: true, includeBrand: true, includeSuppliers: true }),
        coreApi.getCategories(),
        coreApi.get('/brands').catch(() => []),
        coreApi.get('/suppliers').catch(() => []),
      ]);

      // Handle both paginated and non-paginated responses
      let productsData: ProductResponse[] = [];
      if (Array.isArray(productsResponse)) {
        // Direct array response
        productsData = productsResponse;
      } else if (productsResponse && typeof productsResponse === 'object') {
        if ('data' in productsResponse && 'meta' in productsResponse) {
          // Paginated response: { data: [...], meta: {...} }
          const paginatedResponse = productsResponse as PaginatedResponse;
          productsData = Array.isArray(paginatedResponse.data) ? paginatedResponse.data : [];
        } else if ('data' in productsResponse) {
          // Response with data property but no meta
          const dataResponse = productsResponse as { data: ProductResponse[] };
          productsData = Array.isArray(dataResponse.data) ? dataResponse.data : [];
        }
      }

      // Ensure productsData is always an array before mapping
      if (!Array.isArray(productsData)) {
        productsData = [];
      }

      const mappedProducts: Product[] = productsData.map((p: ProductResponse) => ({
        id: p.id,
        name: p.name,
        nameAr: p.nameAr,
        sku: p.sku,
        price: typeof p.price === 'string' ? parseFloat(p.price) : (p.price || 0),
        compareAtPrice: p.compareAtPrice ? (typeof p.compareAtPrice === 'string' ? parseFloat(p.compareAtPrice) : p.compareAtPrice) : undefined,
        costPerItem: p.costPerItem ? (typeof p.costPerItem === 'string' ? parseFloat(p.costPerItem) : p.costPerItem) : undefined,
        category: p.categories?.[0]?.category || (p.categories?.[0]?.id ? { id: p.categories[0].id, name: p.categories[0].name || '' } : undefined),
        brand: p.brand,
        isAvailable: p.isAvailable !== false,
        suppliers: p.suppliers,
      }));

      setProducts(mappedProducts);

      // Handle suppliers list
      const sList: Array<{ id: string; name: string }> = Array.isArray(suppliersData) ? suppliersData : (suppliersData?.data || []);
      setActiveSuppliers(sList.map((s) => ({ id: s.id, name: s.name })));
      
      interface CategoryResponse {
        id: string;
        name: string;
      }

      interface CategoriesResponse {
        categories?: CategoryResponse[];
      }

      const categoriesList = Array.isArray(categoriesData) 
        ? categoriesData 
        : (categoriesData as CategoriesResponse).categories || [];
      setCategories(categoriesList.map((c: CategoryResponse) => ({ id: c.id, name: c.name })));
      
      setBrands(Array.isArray(brandsData) ? brandsData : []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'تعذر تحميل البيانات',
        description: 'حدث خطأ أثناء تحميل بيانات الأسعار. يرجى تحديث الصفحة.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    setCurrentPage(1); // Reset to page 1 when filters change
    return products.filter(product => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          product.name.toLowerCase().includes(query) ||
          (product.nameAr && product.nameAr.toLowerCase().includes(query)) ||
          (product.sku && product.sku.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && product.category?.id !== selectedCategory) {
        return false;
      }

      // Brand filter
      if (selectedBrand !== 'all' && product.brand?.id !== selectedBrand) {
        return false;
      }

      // Price range filter
      if (priceRange.min && product.price < parseFloat(priceRange.min)) {
        return false;
      }
      if (priceRange.max && product.price > parseFloat(priceRange.max)) {
        return false;
      }

      // Availability filter
      if (availabilityFilter === 'available' && !product.isAvailable) {
        return false;
      }
      if (availabilityFilter === 'unavailable' && product.isAvailable) {
        return false;
      }

      // Supplier filter
      if (selectedSuppliers.length > 0) {
        const hasLinkedSupplier = product.suppliers?.some(s => selectedSuppliers.includes(s.supplierId));
        if (!hasLinkedSupplier) return false;
      }

      return true;
    });
  }, [products, searchQuery, selectedCategory, selectedBrand, selectedSuppliers, priceRange, availabilityFilter]);

  // Paginated products
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);
  const handleStartEdit = (product: Product) => {
    setEditingProductId(product.id);
    
    // Determine which cost to show in the edit field
    let displayCost = product.costPerItem?.toString() || '';
    if (selectedSuppliers.length === 1) {
       const supplierCost = product.suppliers?.find(s => s.supplierId === selectedSuppliers[0])?.cost;
       if (supplierCost !== undefined) displayCost = supplierCost.toString();
    }

    setEditingPrice({
      price: product.price.toString(),
      compareAtPrice: product.compareAtPrice?.toString() || '',
      costPerItem: displayCost,
    });
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
    setEditingPrice({ price: '', compareAtPrice: '', costPerItem: '' });
  };

  interface UpdateProductData {
    price: number;
    compareAtPrice?: number;
    costPerItem?: number;
  }

  const handleSaveEdit = async (productId: string) => {
    try {
      setSaving(true);
      const updateData: UpdateProductData = {
        price: parseFloat(editingPrice.price),
      };
      
      if (editingPrice.compareAtPrice) {
        updateData.compareAtPrice = parseFloat(editingPrice.compareAtPrice);
      }
      
      if (editingPrice.costPerItem) {
        updateData.costPerItem = parseFloat(editingPrice.costPerItem);
      }

      // If a single supplier is filtered, we update its cost as well
      if (selectedSuppliers.length === 1 && editingPrice.costPerItem) {
          const product = products.find(p => p.id === productId);
          if (product && product.suppliers) {
              const supplierLinks = [...product.suppliers];
              const index = supplierLinks.findIndex(s => s.supplierId === selectedSuppliers[0]);
              const newCost = parseFloat(editingPrice.costPerItem);
              
              if (index !== -1) {
                  supplierLinks[index] = { 
                      ...supplierLinks[index], 
                      cost: newCost,
                      // Auto calculate discountRate if we want to update it now, 
                      // but the backend will handle it on update if we pass it correctly.
                      discountRate: updateData.price > 0 ? ((updateData.price - newCost) / updateData.price) * 100 : supplierLinks[index].discountRate
                  };
              } else {
                  // Link new supplier if not linked? Maybe better to only allow editing existing links
              }
              updateData.suppliers = supplierLinks.map(s => ({
                  supplierId: s.supplierId,
                  cost: s.cost,
                  discountRate: s.discountRate,
                  isPrimary: s.isPrimary,
                  supplierProductCode: s.supplierProductCode
              }));
          }
      }

      // Properly encode product ID to handle special characters
      const encodedId = encodeURIComponent(productId);
      await coreApi.updateProduct(encodedId, updateData);
      
      // Reload data to get fresh state from server
      await loadData();

      toast({
        title: 'نجح',
        description: 'تم تحديث السعر بنجاح',
      });
      
      handleCancelEdit();
    } catch (error) {
      console.error('Failed to update price:', error);
      toast({
        title: 'تعذر تحديث السعر',
        description: 'حدث خطأ أثناء تحديث السعر. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBulkUpdate = async () => {
    if (!bulkUpdateValue || filteredProducts.length === 0) {
      toast({
        title: 'قيمة التحديث مطلوبة',
        description: 'يرجى إدخال قيمة التحديث للمتابعة',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      const value = parseFloat(bulkUpdateValue);
      const productsToUpdate = selectedProducts.size > 0 
        ? filteredProducts.filter(p => selectedProducts.has(p.id))
        : filteredProducts;

      const updates: PriceUpdate[] = productsToUpdate.map(product => {
        let newPrice = product.price;
        
        if (bulkUpdateType === 'percentage') {
          // Apply percentage based on direction
          const multiplier = bulkUpdateDirection === 'increase' ? (1 + value / 100) : (1 - value / 100);
          newPrice = product.price * multiplier;
        } else if (bulkUpdateType === 'fixed') {
          // Apply fixed amount based on direction
          const adjustment = bulkUpdateDirection === 'increase' ? value : -value;
          newPrice = product.price + adjustment;
        } else if (bulkUpdateType === 'replace') {
          // Replace ignores direction
          newPrice = value;
        }

        return {
          productId: product.id,
          price: Math.max(0, newPrice),
          compareAtPrice: product.compareAtPrice,
          costPerItem: product.costPerItem,
        };
      });

      // Update products in batches
      const batchSize = 10;
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        await Promise.all(
          batch.map(update => {
            // Properly encode product ID to handle special characters
            const encodedId = encodeURIComponent(update.productId);
            return coreApi.updateProduct(encodedId, {
              price: update.price,
              compareAtPrice: update.compareAtPrice,
              costPerItem: update.costPerItem,
            });
          })
        );
      }

      // Reload data
      await loadData();
      
      toast({
        title: 'نجح',
        description: `تم تحديث ${updates.length} منتج بنجاح`,
      });

      setBulkUpdateDialogOpen(false);
      setBulkUpdateValue('');
      setBulkUpdateDirection('increase');
      setSelectedProducts(new Set());
    } catch (error) {
      console.error('Failed to bulk update:', error);
      toast({
        title: 'تعذر تحديث الأسعار',
        description: 'حدث خطأ أثناء تحديث الأسعار. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleProductSelection = (productId: string) => {
    const newSelection = new Set(selectedProducts);
    if (newSelection.has(productId)) {
      newSelection.delete(productId);
    } else {
      newSelection.add(productId);
    }
    setSelectedProducts(newSelection);
  };

  const selectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  };

  return (
    <div className="space-y-5 w-full" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            إدارة الأسعار
          </h1>
          <p className="text-muted-foreground text-lg">إدارة وتحديث أسعار جميع المنتجات بسهولة وسرعة</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button onClick={() => setBulkUpdateDialogOpen(true)}>
            <TrendingUp className="h-4 w-4 ml-2" />
            تحديث جماعي
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            الفلاتر والبحث
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>البحث</Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="اسم المنتج، SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>الفئة</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الفئات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفئات</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>العلامة التجارية</Label>
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع العلامات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع العلامات</SelectItem>
                  {brands.map(brand => (
                    <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>حالة التوفر</Label>
              <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="available">متوفر</SelectItem>
                  <SelectItem value="unavailable">غير متوفر</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>المورد</Label>
              <div className="flex flex-wrap gap-1 border rounded-md p-1 min-h-[40px] bg-background">
                 {activeSuppliers.map(supplier => (
                   <Badge 
                    key={supplier.id}
                    variant={selectedSuppliers.includes(supplier.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                        if (selectedSuppliers.includes(supplier.id)) {
                            setSelectedSuppliers(selectedSuppliers.filter(id => id !== supplier.id));
                        } else {
                            setSelectedSuppliers([...selectedSuppliers, supplier.id]);
                        }
                    }}
                   >
                     {supplier.name}
                   </Badge>
                 ))}
                 {activeSuppliers.length === 0 && <span className="text-muted-foreground text-sm p-1">لا يوجد موردين متاحين</span>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>السعر الأدنى</Label>
              <Input
                type="number"
                placeholder="0"
                value={priceRange.min}
                onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>السعر الأعلى</Label>
              <Input
                type="number"
                placeholder="لا يوجد حد"
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              عرض {filteredProducts.length} من {products.length} منتج
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedBrand('all');
                setPriceRange({ min: '', max: '' });
                setAvailabilityFilter('all');
                setSelectedSuppliers([]);
                setSelectedProducts(new Set());
              }}
            >
              إعادة تعيين الفلاتر
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-" />
              المنتجات ({filteredProducts.length})
            </CardTitle>
            {filteredProducts.length > 0 && (
              <Button variant="outline" size="sm" onClick={selectAll}>
                {selectedProducts.size === filteredProducts.length ? 'إلغاء التحديد' : 'تحديد الكل'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 px-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Package className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">لا توجد منتجات</h3>
              <p className="text-muted-foreground">
                {products.length === 0 ? 'لا توجد منتجات في النظام' : 'لا توجد منتجات تطابق الفلاتر المحددة'}
              </p>
            </div>
          ) : (
            <div className="w-full">
              <Table style={{ minWidth: '800px' }}>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={paginatedProducts.length > 0 && paginatedProducts.every(p => selectedProducts.has(p.id))}
                        onChange={() => {
                          const allSelected = paginatedProducts.every(p => selectedProducts.has(p.id));
                          if (allSelected) {
                            // Deselect all on current page
                            const newSelected = new Set(selectedProducts);
                            paginatedProducts.forEach(p => newSelected.delete(p.id));
                            setSelectedProducts(newSelected);
                          } else {
                            // Select all on current page
                            const newSelected = new Set(selectedProducts);
                            paginatedProducts.forEach(p => newSelected.add(p.id));
                            setSelectedProducts(newSelected);
                          }
                        }}
                        className="rounded"
                      />
                    </TableHead>
                    <TableHead>المنتج</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>الفئة</TableHead>
                    <TableHead>العلامة التجارية</TableHead>
                    <TableHead>السعر الحالي</TableHead>
                    <TableHead>سعر المقارنة</TableHead>
                    <TableHead>التكلفة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedProducts.has(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          {product.nameAr && (
                            <p className="text-sm text-muted-foreground">{product.nameAr}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {product.sku || '-'}
                      </TableCell>
                      <TableCell>
                        {product.category ? (
                          <Badge variant="outline">{product.category.name}</Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {product.brand ? (
                          <Badge variant="secondary">{product.brand.name}</Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {editingProductId === product.id ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={editingPrice.price}
                            onChange={(e) => setEditingPrice({ ...editingPrice, price: e.target.value })}
                            className="w-24"
                          />
                        ) : (
                          <span className="font-semibold text-lg">{product.price.toFixed(2)} ر.س</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingProductId === product.id ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={editingPrice.compareAtPrice}
                            onChange={(e) => setEditingPrice({ ...editingPrice, compareAtPrice: e.target.value })}
                            className="w-24"
                            placeholder="اختياري"
                          />
                        ) : (
                          <span className="text-muted-foreground">
                            {product.compareAtPrice ? `${product.compareAtPrice.toFixed(2)} ر.س` : '-'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingProductId === product.id ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={editingPrice.costPerItem}
                            onChange={(e) => setEditingPrice({ ...editingPrice, costPerItem: e.target.value })}
                            className="w-24"
                            placeholder="اختياري"
                          />
                        ) : (
                          <div className="flex flex-col gap-1">
                             {selectedSuppliers.length === 1 ? (
                               <span className="text-muted-foreground font-medium">
                                 {(() => {
                                   const s = product.suppliers?.find(s => s.supplierId === selectedSuppliers[0]);
                                   return s?.cost !== undefined ? `${s.cost.toFixed(2)} ر.س` : (product.costPerItem ? `${product.costPerItem.toFixed(2)} ر.س` : '-');
                                 })()}
                               </span>
                             ) : (
                               <span className="text-muted-foreground">
                                 {product.costPerItem ? `${product.costPerItem.toFixed(2)} ر.س` : '-'}
                               </span>
                             )}
                             {selectedSuppliers.length !== 1 && product.suppliers && product.suppliers.length > 0 && (
                               <span className="text-[10px] text-muted-foreground">
                                 ({product.suppliers.length} موردين)
                               </span>
                             )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingProductId === product.id ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleSaveEdit(product.id)}
                              disabled={saving}
                            >
                              <Save className="h-4 w-4 ml-1" />
                              حفظ
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                              disabled={saving}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStartEdit(product)}
                          >
                            <Edit2 className="h-4 w-4 ml-1" />
                            تعديل
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Pagination Controls */}
              {filteredProducts.length > 0 && (
                <div className="flex items-center justify-between border-t pt-4 mt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>عرض</span>
                    <Select value={itemsPerPage.toString()} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                    <span>من {filteredProducts.length} منتج</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      الأول
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      السابق
                    </Button>
                    <span className="text-sm px-2">
                      صفحة {currentPage} من {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      التالي
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      الأخير
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Update Dialog */}
      <Dialog open={bulkUpdateDialogOpen} onOpenChange={setBulkUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>تحديث جماعي للأسعار</DialogTitle>
            <DialogDescription>
              {selectedProducts.size > 0 
                ? `تحديث ${selectedProducts.size} منتج محدد`
                : `تحديث جميع المنتجات المفلترة (${filteredProducts.length} منتج)`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>نوع التحديث</Label>
              <Select value={bulkUpdateType} onValueChange={(v: 'percentage' | 'fixed' | 'replace') => setBulkUpdateType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">نسبة مئوية (%)</SelectItem>
                  <SelectItem value="fixed">مبلغ ثابت (ر.س)</SelectItem>
                  <SelectItem value="replace">استبدال بالسعر الجديد</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {bulkUpdateType !== 'replace' && (
              <div className="grid gap-2">
                <Label>اتجاه التحديث</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={bulkUpdateDirection === 'increase' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setBulkUpdateDirection('increase')}
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    زيادة
                  </Button>
                  <Button
                    type="button"
                    variant={bulkUpdateDirection === 'decrease' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setBulkUpdateDirection('decrease')}
                  >
                    <Minus className="h-4 w-3 ml-2" />
                    تخفيض
                  </Button>
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label>
                {bulkUpdateType === 'percentage' 
                  ? 'النسبة المئوية (%)'
                  : bulkUpdateType === 'fixed'
                  ? 'المبلغ (ر.س)'
                  : 'السعر الجديد (ر.س)'
                }
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={bulkUpdateValue}
                onChange={(e) => {
                  const val = e.target.value;
                  // Only allow positive numbers (direction is handled by toggle)
                  if (val === '' || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0)) {
                    setBulkUpdateValue(val);
                  }
                }}
                placeholder={
                  bulkUpdateType === 'percentage' 
                    ? 'مثال: 10'
                    : bulkUpdateType === 'fixed'
                    ? 'مثال: 50'
                    : 'مثال: 100'
                }
              />
              {bulkUpdateType === 'percentage' && bulkUpdateValue && (
                <p className="text-xs text-muted-foreground">
                  مثال: منتج بسعر 100 ر.س → {
                    bulkUpdateDirection === 'increase'
                      ? ((100 * (1 + parseFloat(bulkUpdateValue) / 100)) || 0).toFixed(2)
                      : ((100 * (1 - parseFloat(bulkUpdateValue) / 100)) || 0).toFixed(2)
                  } ر.س
                </p>
              )}
              {bulkUpdateType === 'fixed' && bulkUpdateValue && (
                <p className="text-xs text-muted-foreground">
                  مثال: منتج بسعر 100 ر.س → {
                    bulkUpdateDirection === 'increase'
                      ? (100 + (parseFloat(bulkUpdateValue) || 0)).toFixed(2)
                      : (100 - (parseFloat(bulkUpdateValue) || 0)).toFixed(2)
                  } ر.س
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkUpdateDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleBulkUpdate} disabled={saving || !bulkUpdateValue}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جاري التحديث...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 ml-2" />
                  تحديث
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

