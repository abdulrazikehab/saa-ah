import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Package, 
  TrendingUp, 
  ShoppingCart, 
  DollarSign,
  Download,
  Search,
  BarChart3,
  RefreshCw,
  Truck,
  Award,
  Building2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { coreApi } from '@/lib/api';
import { formatCurrency as formatCurrencyBase, formatNumber } from '@/lib/currency-utils';
import { writeFile, utils } from 'xlsx';
import { DataTablePagination } from '@/components/common/DataTablePagination';

// Helper function to format currency with default SAR
const formatCurrency = (amount: number | string): string => {
  return formatCurrencyBase(amount, 'SAR');
};

// Interfaces for API responses
interface RawProduct {
  id: string;
  name: string;
  nameAr?: string;
  sku?: string;
  brandId?: string;
  supplierId?: string;
  costPerItem?: number;
  cost?: number;
  stock?: number;
  categories?: Array<{ categoryId?: string; id?: string }>;
}

interface RawBrand {
  id: string;
  name?: string;
  nameAr?: string;
}

interface RawCategory {
  id: string;
  name?: string;
  nameAr?: string;
}

interface RawSupplier {
  id: string;
  name?: string;
}

interface RawOrder {
  items?: Array<{ productId?: string; product?: { id: string }; quantity?: number; price?: number }>;
  orderItems?: Array<{ productId?: string; product?: { id: string }; quantity?: number; price?: number }>;
}


// Product Report interfaces
interface ProductReport {
  id: string;
  name: string;
  nameAr?: string;
  sku?: string;
  brandId?: string;
  brandName?: string;
  categoryId?: string;
  categoryName?: string;
  supplierId?: string;
  supplierName?: string;
  salesCount: number;
  revenue: number;
  cost: number;
  profitMargin: number;
  stock: number;
  turnoverRate: number;
  withdrawnQuantity: number;
}

interface BrandReport {
  id: string;
  name: string;
  salesCount: number;
  revenue: number;
  topCategory?: string;
  products: number;
}

interface SupplierReport {
  id: string;
  name: string;
  products: string[];
  totalWithdrawals: number;
  totalQuantity: number;
  totalValue: number;
}

export default function ProductReportsPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { toast } = useToast();
  
  // State
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState<ProductReport[]>([]);
  const [brands, setBrands] = useState<BrandReport[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  // Available brands and categories for filters
  const [availableBrands, setAvailableBrands] = useState<{id: string, name: string}[]>([]);
  const [availableCategories, setAvailableCategories] = useState<{id: string, name: string}[]>([]);
  const [availableSuppliers, setAvailableSuppliers] = useState<{id: string, name: string}[]>([]);

  // Stats
  const stats = useMemo(() => {
    const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);
    const totalSales = products.reduce((sum, p) => sum + p.salesCount, 0);
    const totalProfit = products.reduce((sum, p) => sum + (p.revenue - p.cost), 0);
    const avgTurnover = products.length > 0 
      ? products.reduce((sum, p) => sum + p.turnoverRate, 0) / products.length 
      : 0;
    
    return {
      totalProducts: products.length,
      totalRevenue,
      totalSales,
      totalProfit,
      avgTurnover: avgTurnover.toFixed(2),
      topBrand: brands.length > 0 ? brands[0] : null,
    };
  }, [products, brands]);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch products
      const productsResponse = await coreApi.getProducts({ limit: 1000 } as Record<string, unknown>);
      const productsData: RawProduct[] = (productsResponse as { data?: RawProduct[]; products?: RawProduct[] }).data || 
        (productsResponse as { products?: RawProduct[] }).products || 
        (productsResponse as RawProduct[]) || [];
      
      // Fetch brands
      const brandsResponse = await coreApi.getBrands();
      const brandsData: RawBrand[] = Array.isArray(brandsResponse) ? brandsResponse as RawBrand[] : 
        ((brandsResponse as { brands?: RawBrand[] }).brands || []);
      
      // Fetch categories
      const categoriesResponse = await coreApi.getCategories({});
      const categoriesData: RawCategory[] = (categoriesResponse as { categories?: RawCategory[] }).categories || 
        (categoriesResponse as RawCategory[]) || [];
      
      // Fetch suppliers
      const suppliersResponse = await coreApi.get('/suppliers').catch(() => []);
      const suppliersData: RawSupplier[] = Array.isArray(suppliersResponse) ? suppliersResponse as RawSupplier[] : 
        ((suppliersResponse as { suppliers?: RawSupplier[] }).suppliers || []);
      
      // Fetch orders for sales data
      const ordersResponse = await coreApi.getOrders({ limit: 10000 } as Record<string, unknown>).catch(() => ({ orders: [] }));
      const ordersData: RawOrder[] = (ordersResponse as { orders?: RawOrder[]; data?: RawOrder[] }).orders || 
        (ordersResponse as { data?: RawOrder[] }).data || [];
      
      // Calculate product sales
      const productSalesMap = new Map<string, { count: number; revenue: number }>();
      ordersData.forEach((order: RawOrder) => {
        const items = order.items || order.orderItems || [];
        items.forEach((item) => {
          const productId = item.productId || item.product?.id;
          if (productId) {
            const existing = productSalesMap.get(productId) || { count: 0, revenue: 0 };
            productSalesMap.set(productId, {
              count: existing.count + (item.quantity || 1),
              revenue: existing.revenue + ((item.price || 0) * (item.quantity || 1))
            });
          }
        });
      });
      
      // Map products with sales data
      const mappedProducts: ProductReport[] = productsData.map((p: RawProduct) => {
        const sales = productSalesMap.get(p.id) || { count: 0, revenue: 0 };
        const cost = (p.costPerItem || p.cost || 0) * sales.count;
        const profit = sales.revenue - cost;
        const profitMargin = sales.revenue > 0 ? (profit / sales.revenue) * 100 : 0;
        const stock = p.stock || 0;
        const turnoverRate = stock > 0 ? sales.count / stock : 0;
        
        // Get brand name
        const brand = brandsData.find((b: RawBrand) => b.id === p.brandId);
        
        // Get category name
        const categoryIds = p.categories?.map((c) => c.categoryId || c.id) || [];
        const category = categoriesData.find((c: RawCategory) => categoryIds.includes(c.id));
        
        // Get supplier name
        const supplier = suppliersData.find((s: RawSupplier) => s.id === p.supplierId);
        
        return {
          id: p.id,
          name: p.name,
          nameAr: p.nameAr,
          sku: p.sku,
          brandId: p.brandId,
          brandName: brand?.name || brand?.nameAr || '',
          categoryId: category?.id,
          categoryName: category?.name || category?.nameAr || '',
          supplierId: p.supplierId,
          supplierName: supplier?.name || '',
          salesCount: sales.count,
          revenue: sales.revenue,
          cost: cost,
          profitMargin: profitMargin,
          stock: stock,
          turnoverRate: turnoverRate,
          withdrawnQuantity: sales.count
        };
      });
      
      // Sort by sales count (descending)
      mappedProducts.sort((a, b) => b.salesCount - a.salesCount);
      
      // Calculate brand reports
      const brandSalesMap = new Map<string, BrandReport>();
      mappedProducts.forEach(p => {
        if (p.brandId) {
          const existing = brandSalesMap.get(p.brandId);
          if (existing) {
            existing.salesCount += p.salesCount;
            existing.revenue += p.revenue;
            existing.products += 1;
          } else {
            brandSalesMap.set(p.brandId, {
              id: p.brandId,
              name: p.brandName || '',
              salesCount: p.salesCount,
              revenue: p.revenue,
              topCategory: p.categoryName,
              products: 1
            });
          }
        }
      });
      const brandReports = Array.from(brandSalesMap.values())
        .sort((a, b) => b.revenue - a.revenue);
      
      // Calculate supplier reports
      const supplierReportsMap = new Map<string, SupplierReport>();
      mappedProducts.forEach(p => {
        if (p.supplierId) {
          const existing = supplierReportsMap.get(p.supplierId);
          if (existing) {
            if (!existing.products.includes(p.name)) {
              existing.products.push(p.name);
            }
            existing.totalWithdrawals += p.withdrawnQuantity > 0 ? 1 : 0;
            existing.totalQuantity += p.withdrawnQuantity;
            existing.totalValue += p.cost;
          } else {
            supplierReportsMap.set(p.supplierId, {
              id: p.supplierId,
              name: p.supplierName || '',
              products: [p.name],
              totalWithdrawals: p.withdrawnQuantity > 0 ? 1 : 0,
              totalQuantity: p.withdrawnQuantity,
              totalValue: p.cost
            });
          }
        }
      });
      const supplierReports = Array.from(supplierReportsMap.values())
        .sort((a, b) => b.totalValue - a.totalValue);
      
      setProducts(mappedProducts);
      setBrands(brandReports);
      setSuppliers(supplierReports);
      setAvailableBrands(brandsData.map((b: RawBrand) => ({ id: b.id, name: b.name || b.nameAr || '' })));
      setAvailableCategories(categoriesData.map((c: RawCategory) => ({ id: c.id, name: c.name || c.nameAr || '' })));
      setAvailableSuppliers(suppliersData.map((s: RawSupplier) => ({ id: s.id, name: s.name || '' })));
      
    } catch (error: unknown) {
      console.error('Failed to load product reports:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل تقارير المنتجات',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!product.name.toLowerCase().includes(query) &&
            !product.nameAr?.toLowerCase().includes(query) &&
            !product.sku?.toLowerCase().includes(query)) {
          return false;
        }
      }
      
      // Brand filter
      if (brandFilter !== 'all' && product.brandId !== brandFilter) {
        return false;
      }
      
      // Category filter
      if (categoryFilter !== 'all' && product.categoryId !== categoryFilter) {
        return false;
      }
      
      // Supplier filter
      if (supplierFilter !== 'all' && product.supplierId !== supplierFilter) {
        return false;
      }
      
      return true;
    });
  }, [products, searchQuery, brandFilter, categoryFilter, supplierFilter]);

  // Paginated products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredProducts.slice(startIndex, startIndex + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize);

  // Export functions
  const handleExportProducts = () => {
    try {
      const exportData = filteredProducts.map((product, index) => ({
        '#': index + 1,
        'اسم المنتج': product.name,
        'الاسم بالعربي': product.nameAr || '',
        'رمز المنتج': product.sku || '',
        'البراند': product.brandName || '',
        'الفئة': product.categoryName || '',
        'المورد': product.supplierName || '',
        'عدد المبيعات': product.salesCount,
        'الإيرادات': product.revenue,
        'التكلفة': product.cost,
        'هامش الربح %': product.profitMargin.toFixed(2),
        'المخزون': product.stock,
        'معدل الدوران': product.turnoverRate.toFixed(2),
        'الكميات المسحوبة': product.withdrawnQuantity,
      }));

      const ws = utils.json_to_sheet(exportData);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'تقرير المنتجات');
      writeFile(wb, `تقرير_المنتجات_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast({
        title: 'تم التصدير',
        description: 'تم تصدير تقرير المنتجات بنجاح'
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تصدير التقرير',
        variant: 'destructive'
      });
    }
  };

  const handleExportBrands = () => {
    try {
      const exportData = brands.map((brand, index) => ({
        '#': index + 1,
        'اسم البراند': brand.name,
        'عدد المبيعات': brand.salesCount,
        'الإيرادات': brand.revenue,
        'أعلى فئة مبيعات': brand.topCategory || '',
        'عدد المنتجات': brand.products,
      }));

      const ws = utils.json_to_sheet(exportData);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'تقرير البراندات');
      writeFile(wb, `تقرير_البراندات_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast({
        title: 'تم التصدير',
        description: 'تم تصدير تقرير البراندات بنجاح'
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تصدير التقرير',
        variant: 'destructive'
      });
    }
  };

  const handleExportSuppliers = () => {
    try {
      const exportData = suppliers.map((supplier, index) => ({
        '#': index + 1,
        'اسم المورد': supplier.name,
        'المنتجات التابعة': supplier.products.join(', '),
        'عدد عمليات السحب': supplier.totalWithdrawals,
        'إجمالي الكمية المسحوبة': supplier.totalQuantity,
        'القيمة الإجمالية': supplier.totalValue,
      }));

      const ws = utils.json_to_sheet(exportData);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'تقرير الموردين');
      writeFile(wb, `تقرير_الموردين_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast({
        title: 'تم التصدير',
        description: 'تم تصدير تقرير الموردين بنجاح'
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تصدير التقرير',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-7 w-7 text-primary" />
            تقرير المنتجات
          </h1>
          <p className="text-muted-foreground mt-1">
            تحليل مبيعات المنتجات والبراندات والموردين
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadData} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">إجمالي المنتجات</p>
                <p className="text-2xl font-bold">{formatNumber(stats.totalProducts)}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">إجمالي المبيعات</p>
                <p className="text-2xl font-bold">{formatNumber(stats.totalSales)}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">الإيرادات</p>
                <p className="text-xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">الأرباح</p>
                <p className="text-xl font-bold">{formatCurrency(stats.totalProfit)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">متوسط الدوران</p>
                <p className="text-2xl font-bold">{formatNumber(stats.avgTurnover)}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950/50 dark:to-pink-900/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">أعلى براند</p>
                <p className="text-lg font-bold truncate">{stats.topBrand?.name || '-'}</p>
              </div>
              <Award className="h-8 w-8 text-pink-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products" className="gap-2">
            <Package className="h-4 w-4" />
            تقرير المنتجات
          </TabsTrigger>
          <TabsTrigger value="brands" className="gap-2">
            <Award className="h-4 w-4" />
            تقرير البراندات
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="gap-2">
            <Truck className="h-4 w-4" />
            تقرير الموردين
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="البحث بالاسم أو رمز المنتج..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                </div>
                
                <Select value={brandFilter} onValueChange={setBrandFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="البراند" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل البراندات</SelectItem>
                    {availableBrands.map(brand => (
                      <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الفئات</SelectItem>
                    {availableCategories.map(category => (
                      <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="المورد" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الموردين</SelectItem>
                    {availableSuppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button onClick={handleExportProducts} className="gap-2">
                  <Download className="h-4 w-4" />
                  تصدير Excel
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Products Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                تفاصيل المنتجات
              </CardTitle>
              <CardDescription>
                عرض {formatNumber(filteredProducts.length)} منتج من إجمالي {formatNumber(products.length)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-center w-[60px]">#</TableHead>
                          <TableHead>اسم المنتج</TableHead>
                          <TableHead>رمز المنتج</TableHead>
                          <TableHead>البراند</TableHead>
                          <TableHead>المورد</TableHead>
                          <TableHead className="text-center">عدد المبيعات</TableHead>
                          <TableHead className="text-left">الإيرادات</TableHead>
                          <TableHead className="text-center">هامش الربح</TableHead>
                          <TableHead className="text-center">المخزون</TableHead>
                          <TableHead className="text-center">معدل الدوران</TableHead>
                          <TableHead className="text-center">الكميات المسحوبة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedProducts.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={11} className="text-center py-12 text-muted-foreground">
                              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                              <p>لا توجد منتجات</p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedProducts.map((product, index) => (
                            <TableRow key={product.id} className="hover:bg-muted/50">
                              <TableCell className="text-center font-medium">
                                {formatNumber((currentPage - 1) * pageSize + index + 1)}
                              </TableCell>
                              <TableCell className="font-medium">
                                <div>
                                  <div>{product.name}</div>
                                  {product.nameAr && product.nameAr !== product.name && (
                                    <div className="text-xs text-muted-foreground">{product.nameAr}</div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{product.sku || '-'}</Badge>
                              </TableCell>
                              <TableCell>{product.brandName || '-'}</TableCell>
                              <TableCell>{product.supplierName || '-'}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant="secondary">{formatNumber(product.salesCount)}</Badge>
                              </TableCell>
                              <TableCell className="text-left font-medium">
                                {formatCurrency(product.revenue)}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge 
                                  className={product.profitMargin > 20 ? 'bg-green-100 text-green-800' : 
                                            product.profitMargin > 10 ? 'bg-yellow-100 text-yellow-800' : 
                                            'bg-red-100 text-red-800'}
                                >
                                  {formatNumber(product.profitMargin.toFixed(1))}%
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">{formatNumber(product.stock)}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline">{formatNumber(product.turnoverRate.toFixed(2))}</Badge>
                              </TableCell>
                              <TableCell className="text-center">{formatNumber(product.withdrawnQuantity)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {totalPages > 1 && (
                    <div className="mt-4">
                      <DataTablePagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        itemsPerPage={pageSize}
                        totalItems={filteredProducts.length}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={(size) => {
                          setPageSize(size);
                          setCurrentPage(1);
                        }}
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Brands Tab */}
        <TabsContent value="brands" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  أعلى البراندات مبيعاً
                </CardTitle>
                <CardDescription>
                  ترتيب البراندات حسب الإيرادات
                </CardDescription>
              </div>
              <Button onClick={handleExportBrands} className="gap-2">
                <Download className="h-4 w-4" />
                تصدير Excel
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center w-[60px]">الترتيب</TableHead>
                        <TableHead>اسم البراند</TableHead>
                        <TableHead className="text-center">عدد المنتجات</TableHead>
                        <TableHead className="text-center">عدد المبيعات</TableHead>
                        <TableHead className="text-left">الإيرادات</TableHead>
                        <TableHead>أعلى فئة مبيعات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {brands.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                            <Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>لا توجد بيانات براندات</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        brands.map((brand, index) => (
                          <TableRow key={brand.id} className="hover:bg-muted/50">
                            <TableCell className="text-center">
                              <Badge variant={index < 3 ? 'default' : 'secondary'}>
                                {formatNumber(index + 1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{brand.name}</TableCell>
                            <TableCell className="text-center">{formatNumber(brand.products)}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary">{formatNumber(brand.salesCount)}</Badge>
                            </TableCell>
                            <TableCell className="text-left font-medium">
                              {formatCurrency(brand.revenue)}
                            </TableCell>
                            <TableCell>{brand.topCategory || '-'}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  تقرير سحب المنتجات حسب المورد
                </CardTitle>
                <CardDescription>
                  تفاصيل الموردين والمنتجات المسحوبة
                </CardDescription>
              </div>
              <Button onClick={handleExportSuppliers} className="gap-2">
                <Download className="h-4 w-4" />
                تصدير Excel
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center w-[60px]">#</TableHead>
                        <TableHead>اسم المورد</TableHead>
                        <TableHead>المنتجات التابعة</TableHead>
                        <TableHead className="text-center">عمليات السحب</TableHead>
                        <TableHead className="text-center">الكمية المسحوبة</TableHead>
                        <TableHead className="text-left">القيمة الإجمالية</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {suppliers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                            <Truck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>لا توجد بيانات موردين</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        suppliers.map((supplier, index) => (
                          <TableRow key={supplier.id} className="hover:bg-muted/50">
                            <TableCell className="text-center font-medium">{index + 1}</TableCell>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                {supplier.name}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1 max-w-md">
                                {supplier.products.slice(0, 3).map((product, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {product}
                                  </Badge>
                                ))}
                                {supplier.products.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{supplier.products.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary">{supplier.totalWithdrawals}</Badge>
                            </TableCell>
                            <TableCell className="text-center">{supplier.totalQuantity}</TableCell>
                            <TableCell className="text-left font-medium">
                              {formatCurrency(supplier.totalValue)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
