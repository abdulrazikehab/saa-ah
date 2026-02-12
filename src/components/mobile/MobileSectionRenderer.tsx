import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Section } from '@/components/builder/PageBuilder';
import { coreApi } from '@/lib/api';
import { Product, Category } from '@/services/types';
import { Package, Layout, ChevronRight, Search, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { MobileProductCard } from '@/components/mobile/MobileProductCard';

interface MobileSectionRendererProps {
  section: Section;
  config?: {
    primaryColor?: string;
    secondaryColor?: string;
    cornerRadius?: string;
  };
}

interface ExtensiveSectionProps {
  title?: string;
  titleAr?: string;
  subtitle?: string;
  subtitleAr?: string;
  text?: string;
  textAr?: string;
  description?: string;
  descriptionAr?: string;
  backgroundImage?: string;
  imageUrl?: string;
  link?: string;
  limit?: number;
  categoryId?: string;
  items?: unknown[];
  visible?: boolean;
  emptyCartMessage?: string;
  checkoutButtonText?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  defaultMode?: 'login' | 'signup';
  showOrderSummary?: boolean;
  showPaymentMethods?: boolean;
  emptyMessage?: string;
  addButtonText?: string;
  email?: string;
  phone?: string;
  address?: string;
  textAlign?: 'left' | 'center' | 'right';
  subtext?: string;
  subtextAr?: string;
}

export function MobileSectionRenderer({ section, config = {} }: MobileSectionRendererProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const { type } = section;
  const props = section.props as ExtensiveSectionProps;
  
  const [data, setData] = useState<Product[] | Category[] | unknown[]>([]);
  const [loading, setLoading] = useState(false);

  // Common Styles
  const primaryColor = config.primaryColor || '#000000';
  const secondaryColor = config.secondaryColor || primaryColor;
  const cornerRadius = config.cornerRadius || '1rem';

  // Fetch Data only for relevant sections
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
        if (type === 'products') {
            setLoading(true);
            try {
                const limit = props.limit || 6;
                const catId = props.categoryId;
                const res = await coreApi.getProducts({ 
                    limit, 
                    ...(catId && catId !== 'all' ? { categoryId: catId } : {}) 
                });
                
                if (isMounted) {
                    if (Array.isArray(res)) {
                        setData(res);
                    } else if (res && typeof res === 'object' && 'data' in res) {
                        setData((res as { data: Product[] }).data);
                    } else {
                        setData([]);
                    }
                }
            } catch (err) {
                console.warn("MobileSectionRenderer: Failed to load products", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        } else if (type === 'categories') {
            setLoading(true);
            try {
                // If section defines items, use them (manual categories). Otherwise fetch.
                if (props.items && props.items.length > 0) {
                     setData(props.items);
                } else {
                     const res = await coreApi.getCategories({ limit: 10 });
                     if (isMounted) {
                         if (Array.isArray(res)) {
                             setData(res);
                         } else if (res && typeof res === 'object' && 'categories' in res) {
                             setData((res as { categories: Category[] }).categories);
                         } else {
                             setData([]);
                         }
                     }
                }
            } catch (err) {
                 console.warn("MobileSectionRenderer: Failed to load categories", err);
            } finally {
                 if (isMounted) setLoading(false);
            }
        }
    };
    
    // Only load if not static content
    if (['products', 'categories'].includes(type) && !data.length) {
        loadData();
    }
    
    return () => { isMounted = false; };
  }, [type, props, data.length]);


  // RENDERERS
  switch (type) {
    case 'hero': // Mobile Banner
    case 'banner': {
        const bannerText = isRTL ? props.textAr || props.titleAr : props.text || props.title;
        const bannerSub = isRTL ? props.subtextAr || props.descriptionAr : props.subtext || props.description;
        const bgImage = props.backgroundImage || props.imageUrl;
        
        return (
            <div className="px-4 mb-6 mt-4">
            <div 
                className="w-full aspect-[2/1] rounded-2xl flex flex-col items-center justify-center text-white p-6 text-center shadow-lg relative overflow-hidden group border border-black/5"
                style={{ 
                    background: bgImage ? `url(${bgImage})` : `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`, 
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: cornerRadius 
                }}
                onClick={() => navigate(props.link || '/products')}
            >
                {/* Overlay for readability if image */}
                <div className={`absolute inset-0 ${bgImage ? 'bg-black/40' : 'bg-black/10'} group-hover:bg-black/20 transition-colors`} />
                
                <span className="relative z-10 font-bold text-2xl uppercase tracking-wider shadow-sm">
                {bannerText || 'Welcome'}
                </span>
                {bannerSub && (
                <span className="relative z-10 text-sm mt-2 opacity-90 font-medium text-blue-50">
                    {bannerSub}
                </span>
                )}
            </div>
            </div>
        );
    }

    case 'categories': // Horizontal Scroll
        if (!data.length && !loading) return null;
        
        return (
            <div className="mb-6">
            <div className="flex items-center justify-between mb-3 px-4">
                <h3 className="font-bold text-sm">{props.title || (isRTL ? 'الأقسام' : 'Categories')}</h3>
                <button onClick={() => navigate('/categories')} className="text-xs text-muted-foreground">{isRTL ? 'عرض الكل' : 'See All'}</button>
            </div>
            
            {loading ? (
                 <div className="flex gap-4 overflow-x-auto px-4 pb-2">
                     {[1,2,3,4].map(i => <div key={i} className="w-14 h-14 rounded-full bg-gray-100 animate-pulse shrink-0" />)}
                 </div>
            ) : (
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-4" style={{ scrollbarWidth: 'none' }}>
                    {data.map((cat: Category) => (
                    <div 
                        key={cat.id} 
                        className="flex flex-col items-center gap-1 shrink-0 cursor-pointer active:scale-95 transition-transform"
                        onClick={() => navigate(`/categories/${cat.id}`)}
                    >
                        <div className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                            {cat.image ? (
                                <img src={cat.image} className="w-full h-full object-cover" alt="" />
                            ) : (
                                <Layout className="w-6 h-6 text-gray-400" />
                            )}
                        </div>
                        <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300 truncate w-16 text-center">
                            {cat.nameAr || cat.name}
                        </span>
                    </div>
                    ))}
                </div>
            )}
            </div>
        );

    case 'products': // Mobile Grid
        if (!data.length && !loading) return null;
        
        return (
            <div className="px-4 mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold">{props.title || (isRTL ? 'منتجات مميزة' : 'Featured Products')}</h3>
                    <button onClick={() => navigate('/products')} className="text-xs font-medium" style={{ color: primaryColor }}>{isRTL ? 'عرض الكل' : 'See All'}</button>
                </div>
                
                {loading ? (
                    <div className="grid grid-cols-2 gap-4">
                         {[1,2,3,4].map(i => <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                    {data.map((product: Product) => (
                        <MobileProductCard key={product.id} product={product} config={config} />
                    ))}
                    </div>
                )}
            </div>
        );

    case 'header':
    case 'search': 
         // For header, implies search/logo. For search type, check visibility.
         if (type === 'search' && !props.visible) return null;
         
         return (
            <div className="px-4 py-3 sticky top-0 z-40 bg-gray-50 dark:bg-gray-900">
                <div className="relative">
                    <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                    <Input 
                        readOnly
                        onClick={() => navigate('/products')} 
                        placeholder={isRTL ? 'ابحث عن المنتجات...' : 'Search products...'} 
                        className={`h-12 bg-white dark:bg-gray-800 border-none shadow-sm rounded-xl ${isRTL ? 'pr-10' : 'pl-10'}`}
                    />
                </div>
            </div>
         );

    case 'customer-orders':
        return (
            <div className="px-4 py-6">
                <h3 className="font-bold mb-4 text-lg">{(isRTL ? props.titleAr : props.title) || (isRTL ? 'طلباتي' : 'My Orders')}</h3>
                <div className="space-y-3">
                    {/* Mock Orders for Preview */}
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-mono text-xs text-gray-500">#ORD-{1000+i}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${i===1 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                                    {i===1 ? (isRTL ? 'مكتمل' : 'Completed') : (isRTL ? 'قيد الانتظار' : 'Pending')}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-sm text-gray-700 dark:text-gray-300">{isRTL ? 'منتجات متنوعة' : 'Various Products'}</span>
                                <span className="font-bold text-sm text-gray-900 dark:text-white">$120.00</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );

    case 'profile-page':
        return (
            <div className="px-4 py-6">
                 <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-2 border-dashed border-gray-300">
                        <User className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">{isRTL ? 'اسم المستخدم' : 'User Name'}</h3>
                        <p className="text-sm text-gray-500">user@example.com</p>
                    </div>
                 </div>
                 <div className="space-y-2">
                    {[
                        { label: isRTL ? 'تعديل الملف الشخصي' : 'Edit Profile', icon: '👤' },
                        { label: isRTL ? 'الإعدادات' : 'Settings', icon: '⚙️' }, 
                        { label: isRTL ? 'تسجيل الخروج' : 'Logout', icon: '🚪' }
                    ].map((item, i) => (
                        <div key={i} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 flex justify-between items-center cursor-pointer hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                                <span>{item.icon}</span>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{item.label}</span>
                            </div>
                            <ChevronRight className={`w-4 h-4 text-gray-400 ${isRTL ? 'rotate-180' : ''}`} />
                        </div>
                    ))}
                 </div>
            </div>
        );

    case 'cart-section':
        return (
            <div className="px-4 py-6 h-full flex flex-col">
                <h3 className="font-bold mb-6 text-xl text-gray-900 dark:text-white">{isRTL ? 'سلة المشتريات' : 'Shopping Cart'}</h3>
                
                <div className="flex-1 flex flex-col items-center justify-center space-y-4 text-gray-400 py-12">
                     <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-2">
                        <Layout className="w-10 h-10 opacity-50" />
                     </div>
                     <p className="text-sm">{isRTL ? 'السلة فارغة حالياً' : 'Your cart is currently empty'}</p>
                     <button className="px-6 py-2 rounded-full text-sm font-medium text-white" style={{ backgroundColor: primaryColor }}>
                        {isRTL ? 'تسوق الآن' : 'Shop Now'}
                     </button>
                </div>
            </div>
        );

    case 'auth-section': {
        const isLogin = props.defaultMode === 'login';
        return (
            <div className="px-4 py-8 h-full flex flex-col items-center justify-center">
                <h3 className="font-bold mb-2 text-xl text-gray-900 dark:text-white">
                    {props.heroTitle || (isLogin ? (isRTL ? 'مرحباً بعودتك' : 'Welcome Back') : (isRTL ? 'انضم إلينا' : 'Join Us'))}
                </h3>
                <p className="text-sm text-gray-500 mb-6">{props.heroSubtitle}</p>
                <div className="w-full max-w-xs space-y-4">
                    <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
                    <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
                    <button className="w-full h-12 rounded-xl text-white font-medium" style={{ backgroundColor: primaryColor }}>
                        {isLogin ? (isRTL ? 'تسجيل الدخول' : 'Sign In') : (isRTL ? 'إنشاء حساب' : 'Create Account')}
                    </button>
                </div>
            </div>
        );
    }

    case 'checkout-section':
        return (
            <div className="px-4 py-6 h-full flex flex-col">
                <h3 className="font-bold mb-6 text-xl text-gray-900 dark:text-white">{props.title || (isRTL ? 'إتمام الطلب' : 'Checkout')}</h3>
                <div className="space-y-4 flex-1">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                        <h4 className="font-medium text-sm mb-2">{isRTL ? 'عنوان التوصيل' : 'Delivery Address'}</h4>
                        <div className="h-20 bg-gray-50 dark:bg-gray-700 rounded-lg"></div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                        <h4 className="font-medium text-sm mb-2">{isRTL ? 'طريقة الدفع' : 'Payment Method'}</h4>
                        <div className="h-12 bg-gray-50 dark:bg-gray-700 rounded-lg"></div>
                    </div>
                </div>
                <button className="w-full h-12 rounded-xl text-white font-medium mt-4" style={{ backgroundColor: primaryColor }}>
                    {isRTL ? 'تأكيد الطلب' : 'Confirm Order'}
                </button>
            </div>
        );

    case 'orders-section':
        return (
            <div className="px-4 py-6">
                <h3 className="font-bold mb-4 text-lg">{props.title || (isRTL ? 'طلباتي' : 'My Orders')}</h3>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-mono text-xs text-gray-500">#ORD-{1000+i}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${i===1 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {i===1 ? (isRTL ? 'مكتمل' : 'Completed') : (isRTL ? 'قيد الانتظار' : 'Pending')}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-sm text-gray-700 dark:text-gray-300">{isRTL ? 'منتجات متنوعة' : 'Various Products'}</span>
                                <span className="font-bold text-sm">$120.00</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );

    case 'wishlist-section':
        return (
            <div className="px-4 py-6 h-full flex flex-col">
                <h3 className="font-bold mb-6 text-xl">{props.title || (isRTL ? 'قائمة الرغبات' : 'My Wishlist')}</h3>
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">❤️</div>
                    <p className="text-sm">{props.emptyMessage || (isRTL ? 'قائمة الرغبات فارغة' : 'Your wishlist is empty')}</p>
                </div>
            </div>
        );

    case 'wallet-section':
        return (
            <div className="px-4 py-6">
                <h3 className="font-bold mb-6 text-xl">{props.title || (isRTL ? 'المحفظة' : 'My Wallet')}</h3>
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-2xl text-white mb-6">
                    <p className="text-sm opacity-80 mb-1">{isRTL ? 'الرصيد الحالي' : 'Current Balance'}</p>
                    <p className="text-3xl font-bold">$1,250.00</p>
                </div>
                <button className="w-full h-12 rounded-xl text-white font-medium" style={{ backgroundColor: primaryColor }}>
                    {isRTL ? 'شحن الرصيد' : 'Recharge'}
                </button>
            </div>
        );

    case 'inventory-section':
        return (
            <div className="px-4 py-6">
                <h3 className="font-bold mb-4 text-lg">{props.title || (isRTL ? 'مخزوني' : 'My Inventory')}</h3>
                <p className="text-sm text-gray-500 mb-4">{props.subtitle}</p>
                <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
                            <div className="text-2xl mb-2">🎮</div>
                            <p className="text-xs font-medium">{isRTL ? 'بطاقة رقمية' : 'Digital Card'}</p>
                        </div>
                    ))}
                </div>
            </div>
        );

    case 'addresses-section':
        return (
            <div className="px-4 py-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">{props.title || (isRTL ? 'عناويني' : 'My Addresses')}</h3>
                    <button className="text-xs font-medium" style={{ color: primaryColor }}>{props.addButtonText || '+ Add'}</button>
                </div>
                <div className="space-y-3">
                    {[1, 2].map(i => (
                        <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                            <p className="font-medium text-sm">{isRTL ? 'المنزل' : 'Home'}</p>
                            <p className="text-xs text-gray-500 mt-1">{isRTL ? 'العنوان التفصيلي هنا...' : '123 Street Name, City'}</p>
                        </div>
                    ))}
                </div>
            </div>
        );

    case 'notifications-section':
        return (
            <div className="px-4 py-6">
                <h3 className="font-bold mb-4 text-lg">{props.title || (isRTL ? 'الإشعارات' : 'Notifications')}</h3>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex items-start gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">🔔</div>
                            <div className="flex-1">
                                <p className="font-medium text-sm">{isRTL ? 'إشعار جديد' : 'New Notification'}</p>
                                <p className="text-xs text-gray-500">{isRTL ? 'منذ ساعة' : '1 hour ago'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );

    case 'recharge-section':
        return (
            <div className="px-4 py-6">
                <h3 className="font-bold mb-2 text-xl">{props.title || (isRTL ? 'شحن الرصيد' : 'Recharge Balance')}</h3>
                <p className="text-sm text-gray-500 mb-6">{props.subtitle}</p>
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {['50', '100', '200'].map(amount => (
                        <button key={amount} className="h-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 font-bold">${amount}</button>
                    ))}
                </div>
                <button className="w-full h-12 rounded-xl text-white font-medium" style={{ backgroundColor: primaryColor }}>
                    {isRTL ? 'متابعة' : 'Continue'}
                </button>
            </div>
        );

    case 'transactions-section':
        return (
            <div className="px-4 py-6">
                <h3 className="font-bold mb-4 text-lg">{props.title || (isRTL ? 'سجل المعاملات' : 'Transaction History')}</h3>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <div>
                                <p className="font-medium text-sm">{isRTL ? 'شحن رصيد' : 'Recharge'}</p>
                                <p className="text-xs text-gray-500">2024-01-{10+i}</p>
                            </div>
                            <span className="text-green-600 font-bold">+$50</span>
                        </div>
                    ))}
                </div>
            </div>
        );

    case 'payment-methods-section':
    case 'bank-accounts-section':
        return (
            <div className="px-4 py-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">{props.title}</h3>
                    <button className="text-xs font-medium" style={{ color: primaryColor }}>{props.addButtonText || '+ Add'}</button>
                </div>
                <div className="space-y-3">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                        <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">💳</div>
                        <div>
                            <p className="font-medium text-sm">**** 4242</p>
                            <p className="text-xs text-gray-500">{isRTL ? 'منتهية الصلاحية' : 'Expires'} 12/25</p>
                        </div>
                    </div>
                </div>
            </div>
        );

    case 'employees-section':
        return (
            <div className="px-4 py-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">{props.title || (isRTL ? 'الموظفين' : 'Employees')}</h3>
                    <button className="text-xs font-medium" style={{ color: primaryColor }}>{props.addButtonText || '+ Add'}</button>
                </div>
                <div className="space-y-3">
                    {[1, 2].map(i => (
                        <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">👤</div>
                            <div>
                                <p className="font-medium text-sm">{isRTL ? 'اسم الموظف' : 'Employee Name'}</p>
                                <p className="text-xs text-gray-500">{isRTL ? 'مبيعات' : 'Sales'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );

    case 'reports-section':
        return (
            <div className="px-4 py-6">
                <h3 className="font-bold mb-4 text-lg">{props.title || (isRTL ? 'التقارير' : 'Reports')}</h3>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { icon: '📊', label: isRTL ? 'المبيعات' : 'Sales' },
                        { icon: '📦', label: isRTL ? 'الطلبات' : 'Orders' },
                        { icon: '👥', label: isRTL ? 'العملاء' : 'Customers' },
                        { icon: '📈', label: isRTL ? 'الأداء' : 'Performance' },
                    ].map((item, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
                            <div className="text-2xl mb-2">{item.icon}</div>
                            <p className="text-xs font-medium">{item.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        );

    case 'settings-section':
        return (
            <div className="px-4 py-6">
                <h3 className="font-bold mb-4 text-lg">{props.title || (isRTL ? 'الإعدادات' : 'Settings')}</h3>
                <div className="space-y-2">
                    {[
                        { icon: '🌐', label: isRTL ? 'اللغة' : 'Language' },
                        { icon: '🎨', label: isRTL ? 'المظهر' : 'Theme' },
                        { icon: '🔔', label: isRTL ? 'الإشعارات' : 'Notifications' },
                        { icon: '🔒', label: isRTL ? 'الخصوصية' : 'Privacy' },
                    ].map((item, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <span>{item.icon}</span>
                                <span className="text-sm font-medium">{item.label}</span>
                            </div>
                            <ChevronRight className={`w-4 h-4 text-gray-400 ${isRTL ? 'rotate-180' : ''}`} />
                        </div>
                    ))}
                </div>
            </div>
        );

    case 'support-section':
        return (
            <div className="px-4 py-6">
                <h3 className="font-bold mb-2 text-xl">{props.title || (isRTL ? 'الدعم' : 'Support')}</h3>
                <p className="text-sm text-gray-500 mb-6">{props.subtitle}</p>
                <div className="space-y-3">
                    {[
                        { icon: '💬', label: isRTL ? 'المحادثة المباشرة' : 'Live Chat' },
                        { icon: '❓', label: isRTL ? 'الأسئلة الشائعة' : 'FAQ' },
                        { icon: '📧', label: isRTL ? 'راسلنا' : 'Email Us' },
                    ].map((item, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center gap-3 cursor-pointer">
                            <span className="text-xl">{item.icon}</span>
                            <span className="text-sm font-medium">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        );

    case 'profile-section':
        return (
            <div className="px-4 py-6">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-2 border-dashed border-gray-300">
                        <User className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">{isRTL ? 'اسم المستخدم' : 'User Name'}</h3>
                        <p className="text-sm text-gray-500">user@example.com</p>
                    </div>
                </div>
                <div className="space-y-2">
                    {[
                        { label: isRTL ? 'تعديل الملف' : 'Edit Profile', icon: '👤' },
                        { label: isRTL ? 'الإعدادات' : 'Settings', icon: '⚙️' },
                        { label: isRTL ? 'تسجيل الخروج' : 'Logout', icon: '🚪' }
                    ].map((item, i) => (
                        <div key={i} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <span>{item.icon}</span>
                                <span className="text-sm font-medium">{item.label}</span>
                            </div>
                            <ChevronRight className={`w-4 h-4 text-gray-400 ${isRTL ? 'rotate-180' : ''}`} />
                        </div>
                    ))}
                </div>
            </div>
        );

    case 'text':
        return (
            <div className="px-4 py-6" style={{ textAlign: props.textAlign || 'left' }}>
                {props.title && <h3 className="font-bold mb-3 text-lg">{props.title}</h3>}
                <p className="text-sm text-gray-600 dark:text-gray-400">{props.text}</p>
            </div>
        );

    case 'categories-hierarchy':
        return (
            <div className="px-4 py-6">
                <h3 className="font-bold mb-2 text-lg">{props.title || (isRTL ? 'الأقسام' : 'Categories')}</h3>
                {props.subtitle && <p className="text-sm text-gray-500 mb-4">{props.subtitle}</p>}
                <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
                            <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-2">
                                <Layout className="w-6 h-6 text-gray-400" />
                            </div>
                            <p className="text-xs font-medium">{isRTL ? `قسم ${i}` : `Category ${i}`}</p>
                        </div>
                    ))}
                </div>
            </div>
        );

    case 'about-us':
    case 'about':
    case 'about-section':
        return (
            <div className="px-4 py-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* Image placeholder */}
                    <div className="w-48 h-48 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center shrink-0">
                        <Package className="w-12 h-12 text-gray-300" />
                    </div>
                    <div className="flex-1 text-center md:text-right">
                        <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full mb-2">
                            {isRTL ? 'من نحن' : 'About Us'}
                        </span>
                        <h3 className="font-bold text-xl mb-2">{props.title || (isRTL ? 'من نحن' : 'About Us')}</h3>
                        <p className="text-sm text-gray-500 mb-4">{props.subtitle}</p>
                        <p className="text-sm text-gray-600">{props.description}</p>
                    </div>
                </div>
                {/* Stats */}
                <div className="flex justify-center gap-12 mt-8">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">100%</p>
                        <p className="text-xs text-gray-500">{isRTL ? 'جودة مضمونة' : 'Quality Guaranteed'}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">24/7</p>
                        <p className="text-xs text-gray-500">{isRTL ? 'دعم مستمر' : 'Continuous Support'}</p>
                    </div>
                </div>
            </div>
        );

    case 'faq-section':
        return (
            <div className="px-4 py-6">
                <h3 className="font-bold text-xl mb-4">{props.title || (isRTL ? 'الأسئلة الشائعة' : 'Frequently Asked Questions')}</h3>
                <div className="space-y-4">
                    {(props.items || []).map((item: { question: string; answer: string }, i: number) => (
                        <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                            <h4 className="font-bold text-sm mb-2">{item.question}</h4>
                            <p className="text-sm text-gray-500">{item.answer}</p>
                        </div>
                    ))}
                </div>
            </div>
        );

    case 'contact-us':
    case 'contact':
    case 'contact-section':
        return (
            <div className="px-4 py-6">
                <h3 className="font-bold text-xl text-center mb-2">{props.title || (isRTL ? 'تواصل معنا' : 'Contact Us')}</h3>
                <p className="text-sm text-gray-500 text-center mb-6">{props.subtitle}</p>
                
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Contact Form */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 space-y-3">
                        <div className="h-10 bg-gray-50 dark:bg-gray-700 rounded-lg"></div>
                        <div className="h-10 bg-gray-50 dark:bg-gray-700 rounded-lg"></div>
                        <div className="h-10 bg-gray-50 dark:bg-gray-700 rounded-lg"></div>
                        <div className="h-24 bg-gray-50 dark:bg-gray-700 rounded-lg"></div>
                        <button className="w-full h-10 rounded-lg text-white font-medium" style={{ backgroundColor: primaryColor }}>
                            {isRTL ? 'إرسال الرسالة' : 'Send Message'}
                        </button>
                    </div>
                    
                    {/* Contact Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">📧</div>
                            <div>
                                <p className="text-xs text-gray-500">{isRTL ? 'البريد الإلكتروني' : 'Email'}</p>
                                <p className="text-sm font-medium">{props.email || 'support@example.com'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">📞</div>
                            <div>
                                <p className="text-xs text-gray-500">{isRTL ? 'رقم الهاتف' : 'Phone'}</p>
                                <p className="text-sm font-medium">{props.phone || '+966 50 000 0000'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">📍</div>
                            <div>
                                <p className="text-xs text-gray-500">{isRTL ? 'العنوان' : 'Address'}</p>
                                <p className="text-sm font-medium">{props.address || (isRTL ? 'المملكة العربية السعودية' : 'Saudi Arabia')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );

    default:
        // For unknown sections, render a placeholder that can be edited
        return (
            <div className="px-4 py-6">
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-center">
                    <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500">{type || 'Unknown'} Section</p>
                    <p className="text-xs text-gray-400 mt-1">{isRTL ? 'انقر للتعديل' : 'Click to edit'}</p>
                </div>
            </div>
        ); 
  }
}
