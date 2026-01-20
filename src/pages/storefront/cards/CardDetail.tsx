import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  CreditCard, 
  Star, 
  ShoppingCart,
  Loader2,
  ChevronRight,
  Shield,
  Zap,
  Clock,
  CheckCircle,
  Minus,
  Plus,
  Heart,
  Share2,
  ArrowRight,
  Gift,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { coreApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

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
  slug: string;
}

interface CardProduct {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  price: number;
  currencyCode: string;
  imageUrl?: string;
  brand?: Brand;
  category?: Category;
  inStock: number;
  isPopular?: boolean;
}

// Brand icons
const brandIcons: Record<string, string> = {
  'ITUNES': '🍎',
  'GOOGLEPLAY': '▶️',
  'PLAYSTATION': '🎮',
  'XBOX': '🎯',
  'STEAM': '🎲',
  'PUBG': '🔫',
  'FREEFIRE': '🔥',
  'NETFLIX': '🎬',
  'SPOTIFY': '🎵',
  'RAZERGOLD': '💎',
  'AMAZON': '📦',
  'NINTENDO': '🕹️',
};

export default function CardDetail() {
  const { id } = useParams<{ id: string }>();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [card, setCard] = useState<CardProduct | null>(null);
  const [relatedCards, setRelatedCards] = useState<CardProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    if (id) {
      loadCard();
    }
  }, [id]);

  const loadCard = async () => {
    try {
      setLoading(true);
      const [cardRes, walletRes] = await Promise.all([
        coreApi.get(`/card-products/${id}`).catch(() => null),
        isAuthenticated ? coreApi.get('/wallet', { requireAuth: true }).catch(() => ({ balance: 0 })) : { balance: 0 },
      ]);
      
      if (cardRes) {
        setCard(cardRes);
        setWalletBalance(walletRes.balance || 0);
        
        // Load related cards
        if (cardRes.brand?.id) {
          const relatedRes = await coreApi.get(`/card-products?brandId=${cardRes.brand.id}&limit=4`).catch(() => ({ data: [] }));
          setRelatedCards((relatedRes.data || []).filter((c: CardProduct) => c.id !== id));
        }
      }
    } catch (error) {
      console.error('Error loading card:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= Math.min(10, card?.inStock || 10)) {
      setQuantity(newQuantity);
    }
  };

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/cards/${id}` } });
      return;
    }

    const totalPrice = (card?.price || 0) * quantity;
    
    if (walletBalance < totalPrice) {
      toast.error(isRTL ? 'رصيد المحفظة غير كافي' : 'Insufficient wallet balance');
      return;
    }

    setShowPurchaseDialog(true);
  };

  const confirmPurchase = async () => {
    if (!card) return;
    
    try {
      setPurchasing(true);
      
      await coreApi.post('/card-orders', {
        items: [{
          productId: card.id,
          quantity,
        }],
      }, { requireAuth: true });
      
      toast.success(isRTL ? 'تم الشراء بنجاح!' : 'Purchase successful!');
      setShowPurchaseDialog(false);
      navigate('/account/cards');
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error(isRTL ? 'فشل في عملية الشراء' : 'Purchase failed');
    } finally {
      setPurchasing(false);
    }
  };

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    try {
      if (isFavorite) {
        await coreApi.delete(`/favorites/${id}`, { requireAuth: true });
      } else {
        await coreApi.post('/favorites', { cardProductId: id }, { requireAuth: true });
      }
      setIsFavorite(!isFavorite);
      toast.success(isFavorite 
        ? (isRTL ? 'تمت الإزالة من المفضلة' : 'Removed from favorites')
        : (isRTL ? 'تمت الإضافة للمفضلة' : 'Added to favorites')
      );
    } catch (error) {
      console.error('Favorite error:', error);
    }
  };

  const shareCard = () => {
    if (navigator.share) {
      navigator.share({
        title: card?.name,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success(isRTL ? 'تم نسخ الرابط' : 'Link copied');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Card className="bg-white/5 border-white/10 max-w-md mx-auto">
          <CardContent className="py-16 text-center">
            <CreditCard className="h-16 w-16 mx-auto text-slate-500 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {isRTL ? 'البطاقة غير موجودة' : 'Card not found'}
            </h3>
            <Link to="/cards">
              <Button variant="outline" className="mt-4 border-purple-500/50 text-purple-400">
                {isRTL ? 'تصفح البطاقات' : 'Browse Cards'}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalPrice = card.price * quantity;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-8">
          <Link to="/" className="hover:text-purple-400 transition-colors">
            {isRTL ? 'الرئيسية' : 'Home'}
          </Link>
          <ChevronRight className={cn("h-4 w-4", isRTL && "rotate-180")} />
          <Link to="/cards" className="hover:text-purple-400 transition-colors">
            {isRTL ? 'البطاقات' : 'Cards'}
          </Link>
          {card.brand && (
            <>
              <ChevronRight className={cn("h-4 w-4", isRTL && "rotate-180")} />
              <Link to={`/cards?brand=${card.brand.id}`} className="hover:text-purple-400 transition-colors">
                {isRTL ? card.brand.nameAr || card.brand.name : card.brand.name}
              </Link>
            </>
          )}
          <ChevronRight className={cn("h-4 w-4", isRTL && "rotate-180")} />
          <span className="text-purple-400 truncate max-w-[200px]">{card.name}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Card Image */}
          <div>
            <Card className="bg-white/5 border-white/10 overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-square bg-gradient-to-br from-purple-600/30 to-blue-600/30 relative">
                  {card.imageUrl ? (
                    <img 
                      src={card.imageUrl} 
                      alt={card.name}
                      className="w-full h-full object-contain p-8"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <span className="text-8xl mb-4 block">
                          {brandIcons[card.brand?.code || ''] || '🎁'}
                        </span>
                        <CreditCard className="h-24 w-24 text-purple-400/50 mx-auto" />
                      </div>
                    </div>
                  )}
                  
                  {/* Badges */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    {card.inStock > 0 && (
                      <Badge className="bg-green-500 text-white">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {isRTL ? 'متوفر' : 'In Stock'}
                      </Badge>
                    )}
                    {card.isPopular && (
                      <Badge className="bg-yellow-500 text-black">
                        <Star className="h-3 w-3 mr-1" />
                        {isRTL ? 'الأكثر مبيعاً' : 'Best Seller'}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              {[
                { icon: Zap, text: isRTL ? 'تسليم فوري' : 'Instant', color: 'text-yellow-400' },
                { icon: Shield, text: isRTL ? 'آمن 100%' : '100% Safe', color: 'text-green-400' },
                { icon: Clock, text: isRTL ? 'دعم 24/7' : '24/7 Support', color: 'text-blue-400' },
              ].map((item, i) => (
                <div key={i} className="text-center p-3 rounded-xl bg-white/5">
                  <item.icon className={cn("h-5 w-5 mx-auto mb-1", item.color)} />
                  <span className="text-xs text-slate-300">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card Details */}
          <div className="space-y-6">
            {/* Brand */}
            {card.brand && (
              <Link 
                to={`/cards?brand=${card.brand.id}`}
                className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
              >
                <span className="text-xl">{brandIcons[card.brand.code || ''] || '🎁'}</span>
                <span className="font-medium">
                  {isRTL ? card.brand.nameAr || card.brand.name : card.brand.name}
                </span>
              </Link>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              {isRTL ? card.nameAr || card.name : card.name}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-purple-400">
                {card.price.toFixed(2)}
              </span>
              <span className="text-xl text-slate-400">{card.currencyCode}</span>
            </div>

            {/* Description */}
            {(card.description || card.descriptionAr) && (
              <p className="text-slate-300 leading-relaxed">
                {isRTL ? card.descriptionAr || card.description : card.description}
              </p>
            )}

            <Separator className="bg-white/10" />

            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <span className="text-slate-300">{isRTL ? 'الكمية:' : 'Quantity:'}</span>
              <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="h-10 w-10 text-white hover:bg-white/10"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-white font-semibold w-10 text-center">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= Math.min(10, card.inStock)}
                  className="h-10 w-10 text-white hover:bg-white/10"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <span className="text-slate-400 text-sm">
                ({card.inStock} {isRTL ? 'متوفر' : 'available'})
              </span>
            </div>

            {/* Total */}
            <Card className="bg-purple-500/10 border-purple-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">{isRTL ? 'الإجمالي:' : 'Total:'}</span>
                  <span className="text-2xl font-bold text-purple-400">
                    {totalPrice.toFixed(2)} {card.currencyCode}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                size="lg"
                className="flex-1 h-14 text-lg bg-purple-600 hover:bg-purple-700"
                onClick={handlePurchase}
                disabled={card.inStock < 1}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {isRTL ? 'شراء الآن' : 'Buy Now'}
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                className="h-14 border-white/20 text-white hover:bg-white/10"
                onClick={toggleFavorite}
              >
                <Heart className={cn("h-5 w-5", isFavorite && "fill-red-500 text-red-500")} />
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                className="h-14 border-white/20 text-white hover:bg-white/10"
                onClick={shareCard}
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>

            {/* Low Stock Warning */}
            {card.inStock > 0 && card.inStock <= 5 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
                <span className="text-yellow-300 text-sm">
                  {isRTL 
                    ? `${card.inStock} فقط متبقي - أسرع!`
                    : `Only ${card.inStock} left - Hurry up!`
                  }
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Related Cards */}
        {relatedCards.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {isRTL ? 'بطاقات مشابهة' : 'Related Cards'}
              </h2>
              <Link to={`/cards?brand=${card.brand?.id}`}>
                <Button variant="ghost" className="text-purple-400 hover:text-purple-300">
                  {isRTL ? 'عرض الكل' : 'View All'}
                  <ArrowRight className={cn("h-4 w-4 ml-1", isRTL && "rotate-180")} />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedCards.map((relatedCard) => (
                <Link key={relatedCard.id} to={`/cards/${relatedCard.id}`}>
                  <Card className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/50 transition-all duration-300 cursor-pointer group overflow-hidden">
                    <CardContent className="p-0">
                      <div className="aspect-[4/3] bg-gradient-to-br from-purple-600/30 to-blue-600/30 relative">
                        {relatedCard.imageUrl ? (
                          <img 
                            src={relatedCard.imageUrl} 
                            alt={relatedCard.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <CreditCard className="h-10 w-10 text-purple-400/50" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="text-white font-medium text-sm truncate">
                          {isRTL ? relatedCard.nameAr || relatedCard.name : relatedCard.name}
                        </h3>
                        <p className="text-purple-400 font-bold mt-1">
                          {relatedCard.price.toFixed(2)} {relatedCard.currencyCode}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Purchase Confirmation Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="bg-slate-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-purple-400" />
              {isRTL ? 'تأكيد الشراء' : 'Confirm Purchase'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {isRTL 
                ? 'سيتم خصم المبلغ من رصيد محفظتك'
                : 'The amount will be deducted from your wallet balance'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-purple-500/20 flex items-center justify-center">
                {card.imageUrl ? (
                  <img src={card.imageUrl} alt="" className="w-12 h-12 object-contain" />
                ) : (
                  <CreditCard className="h-8 w-8 text-purple-400" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">{card.name}</h4>
                <p className="text-sm text-slate-400">× {quantity}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-purple-400">
                  {totalPrice.toFixed(2)} {card.currencyCode}
                </p>
              </div>
            </div>

            <Separator className="bg-white/10" />

            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">{isRTL ? 'رصيد المحفظة:' : 'Wallet Balance:'}</span>
              <span className={cn(
                "font-semibold",
                walletBalance >= totalPrice ? "text-green-400" : "text-red-400"
              )}>
                {walletBalance.toFixed(2)} {card.currencyCode}
              </span>
            </div>

            {walletBalance < totalPrice && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <p className="text-red-300 text-sm">
                  {isRTL 
                    ? 'رصيد المحفظة غير كافي. يرجى شحن المحفظة أولاً.'
                    : 'Insufficient balance. Please top up your wallet first.'
                  }
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPurchaseDialog(false)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={confirmPurchase}
              disabled={purchasing || walletBalance < totalPrice}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {purchasing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isRTL ? 'تأكيد الشراء' : 'Confirm Purchase'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

