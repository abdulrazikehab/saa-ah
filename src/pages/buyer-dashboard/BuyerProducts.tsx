import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Download,
  FileText,
  CreditCard,
  Search,
  Filter,
  Grid3X3,
  List,
  Clock,
  Play,
  ExternalLink,
  Eye,
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from 'react-i18next';

interface DigitalProduct {
  id: string;
  name: string;
  description: string;
  type: 'file' | 'course' | 'subscription' | 'service';
  purchaseDate: string;
  expiryDate?: string;
  status: 'active' | 'expired' | 'pending' | 'processing';
  thumbnailUrl?: string;
  downloadUrl?: string;
  accessUrl?: string;
  progress?: number;
  lastAccessed?: string;
  fileSize?: string;
  version?: string;
}

export default function BuyerProducts() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      setProducts([
        {
          id: '1',
          name: 'دورة تصميم UI/UX الاحترافية',
          description: 'دورة شاملة في تصميم واجهات المستخدم وتجربة المستخدم',
          type: 'course',
          purchaseDate: new Date(Date.now() - 86400000 * 5).toISOString(),
          status: 'active',
          progress: 45,
          lastAccessed: new Date(Date.now() - 3600000).toISOString(),
          accessUrl: '/courses/1'
        },
        {
          id: '2',
          name: 'قالب ووردبريس متجر إلكتروني',
          description: 'قالب احترافي لإنشاء متجر إلكتروني متكامل',
          type: 'file',
          purchaseDate: new Date(Date.now() - 86400000 * 10).toISOString(),
          status: 'active',
          fileSize: '25.4 MB',
          version: '2.1.0',
          downloadUrl: '/downloads/2'
        },
        {
          id: '3',
          name: 'اشتراك أدوات التصميم السنوي',
          description: 'اشتراك سنوي في مجموعة أدوات التصميم المتقدمة',
          type: 'subscription',
          purchaseDate: new Date(Date.now() - 86400000 * 30).toISOString(),
          expiryDate: new Date(Date.now() + 86400000 * 335).toISOString(),
          status: 'active',
          accessUrl: '/tools'
        },
        {
          id: '4',
          name: 'خدمة استشارة تقنية',
          description: 'جلسة استشارية لمدة ساعة مع خبير تقني',
          type: 'service',
          purchaseDate: new Date(Date.now() - 86400000 * 2).toISOString(),
          status: 'pending'
        },
        {
          id: '5',
          name: 'حزمة أيقونات متجهة',
          description: 'مجموعة 500+ أيقونة متجهة بصيغ متعددة',
          type: 'file',
          purchaseDate: new Date(Date.now() - 86400000 * 60).toISOString(),
          status: 'active',
          fileSize: '12.8 MB',
          version: '1.5.0',
          downloadUrl: '/downloads/5'
        },
        {
          id: '6',
          name: 'دورة البرمجة بلغة Python',
          description: 'تعلم البرمجة من الصفر حتى الاحتراف',
          type: 'course',
          purchaseDate: new Date(Date.now() - 86400000 * 90).toISOString(),
          expiryDate: new Date(Date.now() - 86400000 * 5).toISOString(),
          status: 'expired',
          progress: 100,
          accessUrl: '/courses/6'
        }
      ]);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProductTypeIcon = (type: string) => {
    switch (type) {
      case 'course': return <FileText className="h-5 w-5" />;
      case 'subscription': return <CreditCard className="h-5 w-5" />;
      case 'file': return <Download className="h-5 w-5" />;
      case 'service': return <Package className="h-5 w-5" />;
      default: return <Package className="h-5 w-5" />;
    }
  };

  const getProductTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      file: 'ملف',
      course: 'دورة',
      subscription: 'اشتراك',
      service: 'خدمة'
    };
    return types[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'soft-warning' | 'soft-primary' | 'soft-success' | 'soft-destructive' }> = {
      pending: { label: 'قيد الانتظار', variant: 'soft-warning' },
      processing: { label: 'قيد المعالجة', variant: 'soft-primary' },
      active: { label: 'نشط', variant: 'soft-success' },
      expired: { label: 'منتهي', variant: 'soft-destructive' },
    };
    const { label, variant } = config[status] || config.pending;
    return <Badge variant={variant}>{label}</Badge>;
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || product.type === filterType;
    const matchesStatus = filterStatus === 'all' || product.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const productsByType = {
    all: filteredProducts,
    file: filteredProducts.filter(p => p.type === 'file'),
    course: filteredProducts.filter(p => p.type === 'course'),
    subscription: filteredProducts.filter(p => p.type === 'subscription'),
    service: filteredProducts.filter(p => p.type === 'service')
  };

  const ProductCard = ({ product }: { product: DigitalProduct }) => (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
      {product.thumbnailUrl && (
        <div className="aspect-video bg-muted relative overflow-hidden">
          <img 
            src={product.thumbnailUrl} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {product.type === 'course' && product.progress !== undefined && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
              <div 
                className="h-full bg-primary transition-all"
                style={{ width: `${product.progress}%` }}
              />
            </div>
          )}
        </div>
      )}
      {!product.thumbnailUrl && (
        <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
          <div className="p-4 rounded-full bg-background/80">
            {getProductTypeIcon(product.type)}
          </div>
        </div>
      )}
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Badge variant="outline" className="text-[10px]">
            {getProductTypeLabel(product.type)}
          </Badge>
          {getStatusBadge(product.status)}
        </div>
        <h3 className="font-semibold text-sm line-clamp-2 mb-1">{product.name}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{product.description}</p>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(product.purchaseDate).toLocaleDateString('ar-SA')}
          </span>
          {product.type === 'course' && product.progress !== undefined && (
            <span>{product.progress}% مكتمل</span>
          )}
          {product.type === 'file' && product.fileSize && (
            <span>{product.fileSize}</span>
          )}
          {product.type === 'subscription' && product.expiryDate && (
            <span>
              ينتهي: {new Date(product.expiryDate).toLocaleDateString('ar-SA')}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {product.type === 'file' && product.status === 'active' && (
            <Button size="sm" className="flex-1 gap-1">
              <Download className="h-3.5 w-3.5" />
              تحميل
            </Button>
          )}
          {product.type === 'course' && product.status === 'active' && (
            <Button size="sm" className="flex-1 gap-1">
              <Play className="h-3.5 w-3.5" />
              متابعة
            </Button>
          )}
          {product.type === 'subscription' && product.status === 'active' && (
            <Button size="sm" className="flex-1 gap-1">
              <ExternalLink className="h-3.5 w-3.5" />
              الوصول
            </Button>
          )}
          {product.status === 'pending' && (
            <Button size="sm" variant="outline" className="flex-1" disabled>
              قيد المعالجة
            </Button>
          )}
          {product.status === 'expired' && (
            <Button size="sm" variant="outline" className="flex-1 gap-1">
              <RefreshCw className="h-3.5 w-3.5" />
              تجديد
            </Button>
          )}
          <Button size="sm" variant="ghost" className="px-2">
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const ProductRow = ({ product }: { product: DigitalProduct }) => (
    <Card className="group hover:shadow-md transition-all">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center flex-shrink-0">
            {getProductTypeIcon(product.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm truncate">{product.name}</h3>
              {getStatusBadge(product.status)}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-[10px]">
                {getProductTypeLabel(product.type)}
              </Badge>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(product.purchaseDate).toLocaleDateString('ar-SA')}
              </span>
              {product.type === 'course' && product.progress !== undefined && (
                <span>{product.progress}% مكتمل</span>
              )}
              {product.type === 'file' && product.fileSize && (
                <span>{product.fileSize}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {product.type === 'file' && product.status === 'active' && (
              <Button size="sm" className="gap-1">
                <Download className="h-3.5 w-3.5" />
                تحميل
              </Button>
            )}
            {product.type === 'course' && product.status === 'active' && (
              <Button size="sm" className="gap-1">
                <Play className="h-3.5 w-3.5" />
                متابعة
              </Button>
            )}
            {product.type === 'subscription' && product.status === 'active' && (
              <Button size="sm" className="gap-1">
                <ExternalLink className="h-3.5 w-3.5" />
                الوصول
              </Button>
            )}
            {product.status === 'expired' && (
              <Button size="sm" variant="outline" className="gap-1">
                <RefreshCw className="h-3.5 w-3.5" />
                تجديد
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="px-2">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Eye className="h-4 w-4 ml-2" />
                  عرض التفاصيل
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileText className="h-4 w-4 ml-2" />
                  عرض الفاتورة
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">جاري تحميل المنتجات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold gradient-text flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            منتجاتي الرقمية
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            عرض وإدارة جميع المنتجات الرقمية المشتراة
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/products">
            <Button className="gap-2">
              <Package className="h-4 w-4" />
              تصفح المزيد
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
              <Input
                placeholder="البحث في المنتجات..."
                className={isRTL ? 'pr-9' : 'pl-9'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="نوع المنتج" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="file">ملفات</SelectItem>
                <SelectItem value="course">دورات</SelectItem>
                <SelectItem value="subscription">اشتراكات</SelectItem>
                <SelectItem value="service">خدمات</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="pending">قيد الانتظار</SelectItem>
                <SelectItem value="expired">منتهي</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="bg-muted/50 h-auto p-1 flex-wrap">
          <TabsTrigger value="all" className="data-[state=active]:bg-background">
            الكل ({productsByType.all.length})
          </TabsTrigger>
          <TabsTrigger value="file" className="data-[state=active]:bg-background">
            ملفات ({productsByType.file.length})
          </TabsTrigger>
          <TabsTrigger value="course" className="data-[state=active]:bg-background">
            دورات ({productsByType.course.length})
          </TabsTrigger>
          <TabsTrigger value="subscription" className="data-[state=active]:bg-background">
            اشتراكات ({productsByType.subscription.length})
          </TabsTrigger>
          <TabsTrigger value="service" className="data-[state=active]:bg-background">
            خدمات ({productsByType.service.length})
          </TabsTrigger>
        </TabsList>

        {Object.entries(productsByType).map(([key, prods]) => (
          <TabsContent key={key} value={key} className="space-y-4">
            {prods.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-muted/50 flex items-center justify-center">
                    <Package className="h-8 w-8 opacity-40" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">لا توجد منتجات</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {searchQuery ? 'جرب البحث بكلمات مختلفة' : 'ابدأ بتصفح المنتجات وشراء ما تحتاجه'}
                  </p>
                  <Link to="/products">
                    <Button variant="outline" size="sm" className="mt-4">
                      تصفح المنتجات
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {prods.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {prods.map((product) => (
                  <ProductRow key={product.id} product={product} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

