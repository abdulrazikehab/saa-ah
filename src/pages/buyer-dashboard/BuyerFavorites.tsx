import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  Search,
  Grid3X3,
  List,
  ShoppingCart,
  Trash2,
  Eye,
  RefreshCw,
  Star,
  Clock,
  Package,
  Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';

interface FavoriteProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  type: 'file' | 'course' | 'subscription' | 'service';
  category: string;
  rating: number;
  reviewCount: number;
  thumbnailUrl?: string;
  addedAt: string;
  inStock: boolean;
  isOnSale: boolean;
}

export default function BuyerFavorites() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const isRTL = i18n.language === 'ar';
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      setFavorites([
        {
          id: '1',
          name: 'دورة تطوير تطبيقات الموبايل',
          description: 'تعلم تطوير تطبيقات iOS و Android باستخدام React Native',
          price: 399.00,
          originalPrice: 499.00,
          type: 'course',
          category: 'برمجة',
          rating: 4.8,
          reviewCount: 156,
          addedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          inStock: true,
          isOnSale: true
        },
        {
          id: '2',
          name: 'حزمة تصميم UI Kit كاملة',
          description: 'أكثر من 500 عنصر تصميم جاهز للاستخدام',
          price: 79.00,
          type: 'file',
          category: 'تصميم',
          rating: 4.9,
          reviewCount: 89,
          addedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
          inStock: true,
          isOnSale: false
        },
        {
          id: '3',
          name: 'اشتراك منصة التعلم السنوي',
          description: 'وصول غير محدود لجميع الدورات والمحتوى الحصري',
          price: 999.00,
          originalPrice: 1499.00,
          type: 'subscription',
          category: 'اشتراكات',
          rating: 4.7,
          reviewCount: 234,
          addedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
          inStock: true,
          isOnSale: true
        },
        {
          id: '4',
          name: 'قالب متجر إلكتروني متكامل',
          description: 'قالب ووردبريس احترافي مع WooCommerce',
          price: 149.00,
          type: 'file',
          category: 'قوالب',
          rating: 4.5,
          reviewCount: 67,
          addedAt: new Date(Date.now() - 86400000 * 15).toISOString(),
          inStock: true,
          isOnSale: false
        },
        {
          id: '5',
          name: 'دورة التسويق الرقمي',
          description: 'استراتيجيات التسويق الحديثة وإدارة الحملات الإعلانية',
          price: 299.00,
          type: 'course',
          category: 'تسويق',
          rating: 4.6,
          reviewCount: 112,
          addedAt: new Date(Date.now() - 86400000 * 20).toISOString(),
          inStock: false,
          isOnSale: false
        }
      ]);
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (productId: string) => {
    try {
      // TODO: Call API to remove from favorites
      setFavorites(prev => prev.filter(p => p.id !== productId));
      toast({
        title: 'تم الحذف',
        description: 'تم إزالة المنتج من المفضلة',
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في إزالة المنتج',
        variant: 'destructive',
      });
    }
    setDeleteConfirmOpen(false);
    setProductToDelete(null);
  };

  const addToCart = async (productId: string) => {
    // TODO: Implement add to cart
    toast({
      title: 'تمت الإضافة',
      description: 'تم إضافة المنتج إلى السلة',
    });
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

  const sortedFavorites = [...favorites].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      default:
        return 0;
    }
  });

  const filteredFavorites = sortedFavorites.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ProductCard = ({ product }: { product: FavoriteProduct }) => (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="aspect-video bg-muted relative overflow-hidden">
        {product.thumbnailUrl ? (
          <img 
            src={product.thumbnailUrl} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-2 left-2 right-2 flex justify-between">
          {product.isOnSale && (
            <Badge className="bg-destructive text-white">خصم</Badge>
          )}
          {!product.inStock && (
            <Badge variant="secondary">غير متوفر</Badge>
          )}
        </div>

        {/* Remove button */}
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => {
            setProductToDelete(product.id);
            setDeleteConfirmOpen(true);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-[10px]">
            {product.category}
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            {getProductTypeLabel(product.type)}
          </Badge>
        </div>
        
        <h3 className="font-semibold text-sm line-clamp-2 mb-1">{product.name}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{product.description}</p>
        
        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{product.rating}</span>
          </div>
          <span className="text-xs text-muted-foreground">({product.reviewCount} تقييم)</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg font-bold text-primary">{product.price.toFixed(2)} ر.س</span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              {product.originalPrice.toFixed(2)} ر.س
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            size="sm" 
            className="flex-1 gap-1"
            disabled={!product.inStock}
            onClick={() => addToCart(product.id)}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            أضف للسلة
          </Button>
          <Link to={`/products/${product.id}`}>
            <Button size="sm" variant="outline" className="px-3">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );

  const ProductRow = ({ product }: { product: FavoriteProduct }) => (
    <Card className="group hover:shadow-md transition-all">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            {product.thumbnailUrl ? (
              <img 
                src={product.thumbnailUrl} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                <Package className="h-8 w-8 text-muted-foreground/50" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm truncate">{product.name}</h3>
              {product.isOnSale && (
                <Badge className="bg-destructive text-white text-[10px]">خصم</Badge>
              )}
              {!product.inStock && (
                <Badge variant="secondary" className="text-[10px]">غير متوفر</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{product.description}</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs">{product.rating}</span>
              </div>
              <Badge variant="outline" className="text-[10px]">{product.category}</Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(product.addedAt).toLocaleDateString('ar-SA')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-left">
              <p className="font-bold text-primary">{product.price.toFixed(2)} ر.س</p>
              {product.originalPrice && (
                <p className="text-xs text-muted-foreground line-through">
                  {product.originalPrice.toFixed(2)} ر.س
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                className="gap-1"
                disabled={!product.inStock}
                onClick={() => addToCart(product.id)}
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                أضف
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setProductToDelete(product.id);
                  setDeleteConfirmOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
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
          <p className="text-muted-foreground">جاري تحميل المفضلة...</p>
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
            <Heart className="h-8 w-8 text-destructive" />
            المفضلة
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            المنتجات المحفوظة للشراء لاحقاً
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/products">
            <Button className="gap-2">
              <Package className="h-4 w-4" />
              تصفح المنتجات
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <Heart className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{favorites.length}</p>
                <p className="text-xs text-muted-foreground">منتج محفوظ</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Tag className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{favorites.filter(f => f.isOnSale).length}</p>
                <p className="text-xs text-muted-foreground">عليها خصم</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{favorites.filter(f => f.inStock).length}</p>
                <p className="text-xs text-muted-foreground">متوفر</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <ShoppingCart className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {favorites.reduce((acc, f) => acc + f.price, 0).toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">ر.س الإجمالي</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
              <Input
                placeholder="البحث في المفضلة..."
                className={isRTL ? 'pr-9' : 'pl-9'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="ترتيب حسب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">الأحدث</SelectItem>
                <SelectItem value="price-low">السعر: من الأقل</SelectItem>
                <SelectItem value="price-high">السعر: من الأعلى</SelectItem>
                <SelectItem value="rating">التقييم</SelectItem>
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

      {/* Products */}
      {filteredFavorites.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-muted/50 flex items-center justify-center">
              <Heart className="h-8 w-8 opacity-40" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {searchQuery ? 'لم يتم العثور على نتائج' : 'قائمة المفضلة فارغة'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {searchQuery ? 'جرب البحث بكلمات مختلفة' : 'أضف منتجات للمفضلة لتجدها هنا'}
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
          {filteredFavorites.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFavorites.map((product) => (
            <ProductRow key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>إزالة من المفضلة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من إزالة هذا المنتج من قائمة المفضلة؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => productToDelete && removeFavorite(productToDelete)}
            >
              إزالة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

