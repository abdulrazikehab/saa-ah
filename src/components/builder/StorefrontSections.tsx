import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, ArrowRight, Trash2, Plus, Minus, Shield, Truck, Tag, ShoppingCart, LogIn, Mail, Lock, Eye, EyeOff, Loader2, CheckCircle2, Search, Filter, Phone, MapPin, Send, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import { formatCurrency } from '@/lib/currency-utils';
import { CartItem, Product, Category, Brand } from '@/services/types';
import { InteractiveFace } from '@/components/ui/InteractiveFace';
import { useAuth } from '@/contexts/AuthContext';
import { coreApi } from '@/lib/api';
import { cn } from '@/lib/utils';

// --- Types ---
interface SectionProps {
  [key: string]: unknown;
}

// --- Cart Section ---
export function CartSection({ props }: { props: SectionProps }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  // Ensure we are within a CartProvider in the parent tree, or this will throw.
  const cartContext = useCart(); 
  const { settings } = useStoreSettings();
  const [couponCode, setCouponCode] = useState('');

  if (!cartContext) return <div className="p-4 text-red-500">Cart Context Missing</div>;
  
  const { cart, loading, updateQuantity, removeItem, refreshCart } = cartContext;

  const cartItems: CartItem[] = Array.isArray(cart?.cartItems) ? cart!.cartItems! : (Array.isArray(cart?.items) ? cart!.items : []);
  
  // Filter valid items
  const validCartItems = cartItems.filter((item: CartItem) => {
    const isValid = item && item.id && item.product;
    if (!isValid && item) {
       console.warn('⚠️ CartSection: Item filtered out due to missing product data:', item);
    }
    return isValid;
  });
  
  const isEmpty = !validCartItems || validCartItems.length === 0;

  const subtotal = validCartItems.reduce((sum: number, item: CartItem) => {
    const price = item.unitPriceSnapshot ?? item.productVariant?.price ?? item.product?.retailPrice ?? 0;
    return sum + Number(price) * (item.quantity || 1);
  }, 0) ?? 0;

  const isShippingEnabled = settings?.shippingEnabled === true && settings?.storeType !== 'DIGITAL_CARDS';
  const shipping = isShippingEnabled ? (subtotal > 200 ? 0 : 25) : 0;
  const taxRate = settings?.taxRate ?? 15;
  const isTaxEnabled = settings?.taxEnabled !== false;
  const taxAmount = isTaxEnabled ? (subtotal * taxRate / 100) : 0;
  const total = subtotal + shipping + taxAmount;

  const applyCoupon = () => {
    if (!couponCode) return;
    toast({ title: t('cart.couponCode'), description: t('cart.couponApplied') });
  };

  return (
    <div className="py-12 px-4 bg-gray-50 dark:bg-gray-900 min-h-[60vh]">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold mb-8 text-center">{(props.title as string) || t('nav.cart', 'Shopping Cart')}</h1>
        
        {isEmpty ? (
          <Card className="p-12 text-center border-0 shadow-lg">
            <ShoppingBag className="h-20 w-20 mx-auto text-gray-400 mb-6" />
            <h2 className="text-2xl font-bold mb-4">{t('cart.emptyTitle', 'Your cart is empty')}</h2>
            <p className="text-gray-500 mb-8">{t('cart.emptyDesc', 'Start shopping now')}</p>
            <div className="flex flex-col gap-4 items-center justify-center">
              <div className="flex gap-4">
                <Link to="/products">
                  <Button size="lg" className="px-8">
                    {t('cart.browseProducts', 'Browse Products')}
                  </Button>
                </Link>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={async () => {
                    console.log('🔍 DEBUG: Manual cart refresh triggered from Section');
                    await refreshCart(true);
                    toast({
                      title: 'Debug',
                      description: `Cart refreshed. Items: ${cartItems.length}, Valid: ${validCartItems.length}`,
                    });
                  }}
                  className="px-8"
                >
                  🔍 Debug Cart
                </Button>
              </div>
              
              {cartItems.length > 0 && validCartItems.length === 0 && (
                <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-4 py-2 rounded-lg border border-amber-200 mt-4 max-w-md">
                  ⚠️ {t('cart.dataError', 'Some items are in your cart but product data could not be loaded. This might be due to a store mismatch.')}
                  <br />
                  <span className="text-xs opacity-75">(Total items: {cartItems.length})</span>
                </p>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {validCartItems.map((item: CartItem) => (
                <Card key={item.id} className="p-4 flex gap-4 items-center">
                    <div className="w-24 h-24 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                        {/* Safe image access */}
                        {item.product?.image ? (
                            <img src={typeof item.product.image === 'string' ? item.product.image : (item.product.image as { url?: string })?.url || ''} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <ShoppingBag className="w-8 h-8" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold">{item.product?.name || 'Product'}</h3>
                        <p className="text-sm text-gray-500">{formatCurrency(item.product?.price || 0, settings?.currency || 'SAR')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)} disabled={(item.quantity || 1) <= 1}><Minus className="w-3 h-3" /></Button>
                        <span className="w-8 text-center">{item.quantity || 1}</span>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}><Plus className="w-3 h-3" /></Button>
                    </div>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => removeItem(item.id)}><Trash2 className="w-4 h-4" /></Button>
                </Card>
              ))}
            </div>
            
            <div className="space-y-6">
                <Card className="p-6 shadow-lg border-0">
                    <h2 className="text-xl font-bold mb-4">{t('checkout.orderSummary', 'Order Summary')}</h2>
                    <div className="space-y-4 mb-6">
                        <div className="flex justify-between">
                            <span className="text-gray-600">{t('cart.subtotal')}</span>
                            <span className="font-bold">{formatCurrency(subtotal, settings?.currency || 'SAR')}</span>
                        </div>
                         {isShippingEnabled && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">{t('cart.shipping')}</span>
                                <span>{shipping === 0 ? <Badge className="bg-green-100 text-green-700">Free</Badge> : formatCurrency(shipping, settings?.currency || 'SAR')}</span>
                            </div>
                         )}
                         {isTaxEnabled && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">{t('cart.tax')}</span>
                                <span>{formatCurrency(taxAmount, settings?.currency || 'SAR')}</span>
                            </div>
                         )}
                         <Separator />
                         <div className="flex justify-between text-lg font-bold">
                            <span>{t('cart.total')}</span>
                            <span className="text-indigo-600">{formatCurrency(total, settings?.currency || 'SAR')}</span>
                         </div>
                    </div>
                    <Link to="/checkout" className="block w-full">
                        <Button className="w-full size-lg bg-indigo-600 hover:bg-indigo-700 text-white">
                            {t('cart.checkout', 'Checkout')} <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                    </Link>
                </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Auth Section (Login/Signup) ---
export function AuthSection({ props }: { props: SectionProps }) {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const [mode, setMode] = useState<'login' | 'signup'>((props.defaultMode as 'login' | 'signup') || 'login');
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 py-12">
            <div className="mb-8 flex flex-col items-center gap-4 text-center">
                <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-200">
                    <ShoppingBag className="w-10 h-10 text-white" />
                </div>
                <div>
                   <h1 className="text-4xl font-black text-gray-900 mb-2">
                       {mode === 'login' ? (isRTL ? 'تسجيل الدخول' : t('auth.login.title', 'Login')) : (isRTL ? 'إنشاء حساب جديد' : t('auth.signup.title', 'Create Account'))}
                   </h1>
                   <p className="text-gray-500 font-medium">
                       {mode === 'login' ? (isRTL ? 'سجل دخولك للمتابعة مع طلبك' : t('auth.login.subtitle', 'Enter your credentials to access your account')) : (isRTL ? 'انضم إلينا اليوم للحصول على تجربة تسوق فريدة' : t('auth.signup.subtitle', 'Fill in your details to get started'))}
                   </p>
                </div>
            </div>
            
            <Card className="w-full max-w-md border-0 shadow-2xl shadow-gray-200 overflow-hidden rounded-[32px]">
                <div className="flex bg-gray-50/50 border-b border-gray-100">
                    <button 
                        className={cn("flex-1 py-4 text-sm font-bold transition-all", mode === 'signup' ? "border-b-2 border-blue-600 text-blue-600 bg-white" : "text-gray-400")}
                        onClick={() => setMode('signup')}
                    >
                        {isRTL ? 'إنشاء حساب' : t('auth.signup.title', 'Create Account')}
                    </button>
                    <button 
                        className={cn("flex-1 py-4 text-sm font-bold transition-all", mode === 'login' ? "border-b-2 border-blue-600 text-blue-600 bg-white" : "text-gray-400")}
                        onClick={() => setMode('login')}
                    >
                        {isRTL ? 'تسجيل الدخول' : t('auth.login.title', 'Login')}
                    </button>
                </div>

                <CardContent className="p-8 space-y-6">
                    {mode === 'signup' && (
                         <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-100 flex items-start gap-3">
                             <div className="p-2 bg-white rounded-xl shadow-sm">
                                 <Plus className="w-4 h-4 text-blue-600" />
                             </div>
                             <p className="text-[11px] text-blue-700 leading-relaxed font-bold">
                                 {isRTL ? 'انضم إلينا اليوم للحصول على عروض حصرية وتتبع طلباتك بسهولة' : 'Join us for exclusive offers and easy order tracking'}
                             </p>
                         </div>
                    )}
                    
                    <div className="space-y-4">
                        {mode === 'signup' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-gray-400">{isRTL ? 'الاسم الأول' : 'First Name'}</Label>
                                    <Input className="h-12 bg-gray-50/50 border-0 focus:ring-0" placeholder={isRTL ? 'أحمد' : 'John'} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-gray-400">{isRTL ? 'اسم العائلة' : 'Last Name'}</Label>
                                    <Input className="h-12 bg-gray-50/50 border-0 focus:ring-0" placeholder={isRTL ? 'محمد' : 'Doe'} />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-400">{isRTL ? 'البريد الإلكتروني' : t('auth.email', 'Email Address')}</Label>
                            <div className="relative">
                                <Mail className={cn("absolute top-4 h-4 w-4 text-gray-400", isRTL ? "left-3" : "right-3")} />
                                <Input className={cn("h-12 bg-gray-50/50 border-0 focus:ring-0", isRTL ? "pl-10 text-right" : "pr-10")} placeholder="name@example.com" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
                            </div>
                        </div>

                        {mode === 'signup' && (
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-400">{isRTL ? 'رقم الهاتف (اختياري)' : 'Phone (Optional)'}</Label>
                                <div className="relative">
                                    <Phone className={cn("absolute top-4 h-4 w-4 text-gray-400", isRTL ? "left-3" : "right-3")} />
                                    <Input className={cn("h-12 bg-gray-50/50 border-0 focus:ring-0", isRTL ? "pl-10 text-right" : "pr-10")} placeholder="+966 50 123 4567" />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label className="text-xs font-bold text-gray-400">{isRTL ? 'كلمة المرور' : t('auth.password', 'Password')}</Label>
                                {mode === 'login' && (
                                    <button className="text-[10px] font-bold text-blue-600 hover:underline">{isRTL ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}</button>
                                )}
                            </div>
                            <div className="relative">
                                <Lock className={cn("absolute top-4 h-4 w-4 text-gray-400", isRTL ? "left-3" : "right-3")} />
                                <Input className={cn("h-12 bg-gray-50/50 border-0 focus:ring-0", isRTL ? "pl-10 pr-10" : "pl-10 pr-10")} type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className={cn("absolute top-4 text-gray-400", isRTL ? "right-3" : "left-3")}>
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <Button className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-100 flex items-center justify-center gap-2 group transition-all active:scale-95">
                         {mode === 'login' ? (isRTL ? 'تسجيل الدخول' : t('auth.login.button', 'Sign In')) : (isRTL ? 'إنشاء حساب جديد' : t('auth.signup.button', 'Sign Up'))}
                         <ArrowRight className={cn("w-5 h-5 group-hover:translate-x-1 transition-transform", isRTL && "rotate-180")} />
                    </Button>

                    <div className="pt-4 flex flex-col items-center gap-4">
                        <button className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors">
                            <span className="p-2 bg-gray-100 rounded-lg"><User className="w-4 h-4" /></span>
                            <span className="text-xs font-bold">{isRTL ? 'تسجيل دخول الموظفين' : 'Staff Login'}</span>
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// --- Checkout Section ---
export function CheckoutSection({ props }: { props: SectionProps }) {
    const { t } = useTranslation();
    return (
        <div className="py-12 px-4 bg-gray-50 dark:bg-gray-900 min-h-[60vh]">
            <div className="container mx-auto max-w-4xl">
                 <h1 className="text-3xl font-bold mb-8 text-center">{(props.title as string) || t('checkout.title', 'Checkout')}</h1>
                 <div className="grid md:grid-cols-2 gap-8">
                    <Card className="p-6 space-y-4">
                        <h2 className="font-semibold text-lg border-b pb-2">{t('checkout.shippingInfo', 'Shipping Information')}</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>First Name</Label><Input placeholder="John" /></div>
                            <div className="space-y-2"><Label>Last Name</Label><Input placeholder="Doe" /></div>
                        </div>
                        <div className="space-y-2"><Label>Address</Label><Input placeholder="123 Main St" /></div>
                        <div className="space-y-2"><Label>City</Label><Input placeholder="New York" /></div>
                    </Card>
                    <Card className="p-6 space-y-4">
                        <h2 className="font-semibold text-lg border-b pb-2">{t('checkout.payment', 'Payment Method')}</h2>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 p-3 border rounded-md bg-blue-50 border-blue-200">
                                <div className="w-4 h-4 rounded-full bg-blue-600" />
                                <span className="font-medium">Credit Card</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 border rounded-md opacity-60">
                                <div className="w-4 h-4 rounded-full border border-gray-400" />
                                <span className="font-medium">PayPal</span>
                            </div>
                        </div>
                        <Button className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white">
                            {t('checkout.placeOrder', 'Place Order')}
                        </Button>
                    </Card>
                 </div>
            </div>
        </div>
    );
}

// --- Categories Hierarchy Section ---
export function CategoriesHierarchySection({ props }: { props: SectionProps }) {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === 'ar';
    const [categories, setCategories] = useState<Category[]>([]);
    
    useEffect(() => {
        coreApi.getCategories().then((res: unknown) => {
             // Handle response structure variances
             const data = res as { items?: Category[]; categories?: Category[] } | Category[];
             const cats = Array.isArray(data) ? data : (data.items || data.categories || []);
             setCategories(cats);
        }).catch(err => console.error("Failed to load categories", err));
    }, []);

    return (
        <div className="py-12 px-4 bg-gray-50 dark:bg-gray-900">
             <div className="container mx-auto">
                 <div className="text-center mb-10">
                     <h2 className="text-3xl font-bold mb-4">{(props.title as string) || t('common.categories', 'Categories')}</h2>
                     {props.subtitle && <p className="text-gray-500 max-w-2xl mx-auto">{props.subtitle as string}</p>}
                 </div>
                 
                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                     {categories.length > 0 ? categories.map((cat) => (
                         <Link key={cat.id} to={`/categories/${cat.id}`} className="group block text-center">
                             <div className="aspect-square rounded-full bg-white dark:bg-gray-800 shadow-sm mb-4 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-700 group-hover:border-blue-500 transition-colors">
                                 {/* Use image if available, fallback to Tag icon */}
                                 {cat.image ? (
                                     <img src={cat.image} alt="" className="w-full h-full object-cover" />
                                 ) : (
                                     <Tag className="w-10 h-10 text-gray-400" />
                                 )}
                             </div>
                             <h3 className="font-medium group-hover:text-blue-600">{isArabic ? (cat.nameAr || cat.name) : cat.name}</h3>
                         </Link>
                     )) : (
                         // Empty State Mock
                         [1,2,3,4,5,6].map(i => (
                             <div key={i} className="animate-pulse">
                                 <div className="w-full aspect-square rounded-full bg-gray-200 dark:bg-gray-800 mb-4" />
                                 <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3 mx-auto" />
                             </div>
                         ))
                     )}
                 </div>
             </div>
        </div>
    );
}

// --- Store Page Section ---
export function StorePageSection({ props }: { props: SectionProps }) {
    const { t } = useTranslation();
    
    return (
        <div className="py-8 px-4 bg-white dark:bg-gray-950 min-h-screen">
             <div className="container mx-auto">
                 <div className="flex flex-col md:flex-row gap-8">
                     {/* Filters Sidebar (Mock) */}
                     {props.showFilters !== false && (
                         <div className="w-full md:w-64 flex-shrink-0 space-y-6">
                             <div>
                                 <h3 className="font-bold mb-4 flex items-center gap-2"><Filter className="w-4 h-4" /> {t('common.filters', 'Filters')}</h3>
                                 <div className="space-y-2">
                                     <div className="h-2 bg-gray-100 rounded w-full" />
                                     <div className="h-2 bg-gray-100 rounded w-5/6" />
                                     <div className="h-2 bg-gray-100 rounded w-4/6" />
                                 </div>
                             </div>
                             <Separator />
                             <div>
                                 <h3 className="font-bold mb-4">{t('common.price', 'Price')}</h3>
                                 <div className="h-2 bg-gray-100 rounded w-full" />
                             </div>
                         </div>
                     )}
                     
                     <div className="flex-1">
                         <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-bold">{(props.title as string) || t('common.store', 'Store')}</h1>
                            {props.showSearch !== false && <Button variant="outline"><Search className="w-4 h-4 mr-2" /> {t('common.search', 'Search')}</Button>}
                         </div>
                         
                         {/* Product Grid Mock */}
                         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                              {[1,2,3,4,5,6,7,8].map(i => (
                                  <Card key={`mock-card-${i}`} className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
                                      <div className="aspect-[4/5] bg-gray-100 dark:bg-gray-900 relative">
                                          <Badge className="absolute top-2 left-2">New</Badge>
                                      </div>
                                      <CardContent className="p-4">
                                          <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4 mb-2" />
                                          <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/4" />
                                      </CardContent>
                                  </Card>
                              ))}
                         </div>
                     </div>
                 </div>
             </div>
        </div>
    );
}

// --- Contact Us Section ---
export function ContactUsSection({ props }: { props: SectionProps }) {
    const { t } = useTranslation();
    
    return (
        <div className="py-16 px-4 bg-white dark:bg-gray-950">
            <div className="container mx-auto max-w-4xl">
                <div className="text-center mb-12">
                     <h2 className="text-3xl font-bold mb-4">{(props.title as string) || t('contact.title', 'Contact Us')}</h2>
                     <p className="text-gray-500">{(props.subtitle as string) || t('contact.subtitle', 'We are here to help')}</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-12">
                    <div className="space-y-8">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                                <Phone className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">{t('contact.phone', 'Phone')}</h3>
                                <p className="text-gray-500">+966 50 000 0000</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                                <Mail className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">{t('contact.email', 'Email')}</h3>
                                <p className="text-gray-500">support@example.com</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">{t('contact.address', 'Address')}</h3>
                                <p className="text-gray-500">Riyadh, Saudi Arabia</p>
                            </div>
                        </div>
                    </div>
                    
                    <Card className="p-6 shadow-lg border-0">
                        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                            <div className="space-y-2">
                                <Label>{t('contact.name', 'Name')}</Label>
                                <Input placeholder={t('contact.namePlaceholder', 'Your Name')} />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('contact.email', 'Email')}</Label>
                                <Input type="email" placeholder={t('contact.emailPlaceholder', 'your@email.com')} />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('contact.message', 'Message')}</Label>
                                <Textarea placeholder={t('contact.messagePlaceholder', 'How can we help?')} rows={4} />
                            </div>
                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                {t('contact.submit', 'Send Message')} <Send className="ml-2 w-4 h-4" />
                            </Button>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// --- Brand List Section ---
export function BrandListSection({ props }: { props: SectionProps }) {
    const { t } = useTranslation();
    const [brands, setBrands] = useState<Brand[]>([]);

    useEffect(() => {
        // Mock brands or fetch
        // For simplicity, we just use mock if no API available easily for brands list public
        setBrands([
           { id: '1', name: 'Brand A', logo: '' },
           { id: '2', name: 'Brand B', logo: '' },
           { id: '3', name: 'Brand C', logo: '' },
           { id: '4', name: 'Brand D', logo: '' },
        ] as Brand[]);
    }, []);

    return (
        <div className="py-12 bg-gray-50 dark:bg-gray-900 border-y dark:border-gray-800">
             <div className="container mx-auto text-center">
                 {props.showTitle !== false && <h2 className="text-2xl font-bold mb-8 opacity-50">{(props.title as string) || t('common.brands', 'Our Brands')}</h2>}
                 <div className="flex flex-wrap justify-center gap-8 items-center opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                     {brands.map((brand, i) => (
                         <div key={brand.id || `brand-${i}`} className="text-xl font-bold text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer">
                             {brand.name}
                         </div>
                     ))}
                 </div>
             </div>
        </div>
    );
}
