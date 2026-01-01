import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  Search,
  Grid3X3,
  List,
  Trash2,
  RefreshCw,
  Package,
  Tag,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { ProductCard } from '@/components/storefront/ProductCard';
import { Product } from '@/services/types';

export default function BuyerFavorites() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const isRTL = i18n.language === 'ar';
  const { items: favorites, removeFromWishlist, clearWishlist } = useWishlist();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const removeFavorite = async (productId: string) => {
    try {
      removeFromWishlist(productId);
      setDeleteConfirmOpen(false);
      setProductToDelete(null);
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في إزالة المنتج',
        variant: 'destructive',
      });
    }
  };

  const sortedFavorites = [...favorites].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        // Sort by name if no date available (wishlist doesn't store dates)
        return (a.name || '').localeCompare(b.name || '');
      case 'price-low':
        return (Number(a.price) || 0) - (Number(b.price) || 0);
      case 'price-high':
        return (Number(b.price) || 0) - (Number(a.price) || 0);
      case 'name':
        return (a.name || '').localeCompare(b.name || '');
      default:
        return 0;
    }
  });

  const filteredFavorites = sortedFavorites.filter(product =>
    (product.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        
        <div className="container relative py-12">
          <div className="flex items-center gap-2 text-muted-foreground mb-4 animate-fade-in">
            <Link to="/" className="hover:text-primary transition-colors">{t('storefront.products.home', 'الرئيسية')}</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-medium">{t('nav.wishlist', 'المفضلة')}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 mb-2 animate-slide-up">
              <div className="p-3 rounded-xl gradient-accent shadow-glow">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold gradient-text">
                  {t('nav.wishlist', 'المفضلة')}
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  المنتجات المحفوظة للشراء لاحقاً
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {favorites.length > 0 && (
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    clearWishlist();
                    toast({
                      title: 'تم المسح',
                      description: 'تم مسح جميع المنتجات من المفضلة',
                    });
                  }}
                  className="gap-2 rounded-xl"
                >
                  <Trash2 className="w-4 h-4" />
                  مسح الكل
                </Button>
              )}
              <Link to="/products">
                <Button className="gap-2 rounded-xl">
                  <Package className="h-4 w-4" />
                  تصفح المنتجات
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">

        {/* Stats */}
        {favorites.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
                    <p className="text-2xl font-bold">
                      {favorites.filter(f => f.compareAtPrice && Number(f.compareAtPrice) > Number(f.price)).length}
                    </p>
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
                    <p className="text-2xl font-bold">
                      {favorites.filter(f => f.isAvailable !== false && (f.stock === undefined || f.stock > 0)).length}
                    </p>
                    <p className="text-xs text-muted-foreground">متوفر</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Package className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {favorites.reduce((acc, f) => acc + (Number(f.price) || 0), 0).toFixed(0)}
                    </p>
                    <p className="text-xs text-muted-foreground">ر.س الإجمالي</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        {favorites.length > 0 && (
          <Card className="mb-6">
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
                    <SelectItem value="name">الاسم</SelectItem>
                    <SelectItem value="price-low">السعر: من الأقل</SelectItem>
                    <SelectItem value="price-high">السعر: من الأعلى</SelectItem>
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
        )}

        {/* Products */}
        {filteredFavorites.length === 0 ? (
          <Card className="p-16 text-center border-2 border-dashed border-border shadow-xl rounded-3xl glass-card animate-scale-in">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 rounded-full gradient-mesh blur-2xl opacity-50" />
              <div className="relative p-6 rounded-full bg-muted/50">
                <Heart className="h-20 w-20 text-muted-foreground/30" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-3">
              {searchQuery ? 'لم يتم العثور على نتائج' : 'المفضلة فارغة'}
            </h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
              {searchQuery ? 'جرب البحث بكلمات مختلفة' : 'لم تقم بإضافة أي منتجات إلى المفضلة بعد.'}
            </p>
            <Link to="/products">
              <Button
                size="lg"
                className="rounded-xl gradient-primary text-white hover:shadow-glow transition-shadow"
              >
                <Package className="ml-2 h-5 w-5" />
                {t('storefront.home.shopNow', 'تسوق الآن')}
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {filteredFavorites.map((product, index) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                index={index}
              />
            ))}
          </div>
        )}
      </div>

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

