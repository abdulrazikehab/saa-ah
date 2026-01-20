import { useWishlist } from '@/contexts/WishlistContext';
import { ProductCard } from '@/components/storefront/ProductCard';
import { useTranslation } from 'react-i18next';
import { Heart, Package, ChevronRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';

export default function Wishlist() {
  const { t } = useTranslation();
  const { items, clearWishlist } = useWishlist();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        
        <div className="container relative py-6 sm:py-8 lg:py-12 px-4 sm:px-6">
          <div className="flex items-center gap-2 text-muted-foreground mb-3 sm:mb-4 animate-fade-in text-sm sm:text-base">
            <Link to="/" className="hover:text-primary transition-colors truncate">{t('storefront.products.home')}</Link>
            <ChevronRight className="w-4 h-4 shrink-0" />
            <span className="text-foreground font-medium truncate">{t('nav.wishlist', 'المفضلة')}</span>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4 mb-2 animate-slide-up">
                <div className="p-2 sm:p-3 rounded-xl gradient-accent shadow-glow shrink-0">
                <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text">
                {t('nav.wishlist', 'المفضلة')}
                </h1>
            </div>
            
            {items.length > 0 && (
                <Button 
                    variant="destructive" 
                    onClick={clearWishlist}
                    className="gap-2 rounded-xl w-full sm:w-auto"
                    size="sm"
                >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('common.clear', 'مسح الكل')}</span>
                    <span className="sm:hidden">{t('common.clear', 'مسح')}</span>
                </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container py-4 sm:py-6 lg:py-8 px-4 sm:px-6">
        {items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                {items.map((product, index) => (
                    <ProductCard 
                        key={product.id} 
                        product={product} 
                        index={index}
                    />
                ))}
            </div>
        ) : (
            <Card className="p-8 sm:p-12 lg:p-16 text-center border-2 border-dashed border-border shadow-xl rounded-2xl sm:rounded-3xl glass-card animate-scale-in">
                <div className="relative inline-block mb-4 sm:mb-6">
                    <div className="absolute inset-0 rounded-full gradient-mesh blur-2xl opacity-50" />
                    <div className="relative p-4 sm:p-6 rounded-full bg-muted/50">
                    <Heart className="h-16 w-16 sm:h-20 sm:w-20 text-muted-foreground/30" />
                    </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3">{t('wishlist.empty', 'المفضلة فارغة')}</h3>
                <p className="text-muted-foreground mb-6 sm:mb-8 max-w-md mx-auto text-base sm:text-lg px-4">
                    {t('wishlist.emptyDesc', 'لم تقم بإضافة أي منتجات إلى المفضلة بعد.')}
                </p>
                <Link to="/products">
                    <Button
                        size="lg"
                        className="rounded-xl gradient-primary text-white hover:shadow-glow transition-shadow"
                    >
                        <Package className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                        {t('storefront.home.shopNow', 'تسوق الآن')}
                    </Button>
                </Link>
            </Card>
        )}
      </div>
    </div>
  );
}
