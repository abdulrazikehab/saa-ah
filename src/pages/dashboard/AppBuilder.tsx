import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Store, ShoppingBag, CreditCard, Bell, ChevronRight, Star, Plus, MapPin, Box, Heart, Zap, Search, HelpCircle, LogOut, ArrowLeft, Trash2, Smartphone, Smartphone as SmartphoneIcon, Download, Share2, Info, Layout, Palette, Settings, RotateCcw, PenTool, Eye, Cpu, Save, Loader2, Check, Sparkles, FileText, Mail, Shield, Maximize2, Layers, Package, GripVertical, Clock, History, Home as HomeIcon, LayoutGrid as GridIcon, ShoppingCart as CartIcon, User as UserIcon, X, MessageSquare, BarChart3, Image as ImageIcon, CornerDownRight, Pencil, Headphones, Search as SearchIcon, Bell as BellIcon, Plus as PlusIcon, Trash2 as TrashIcon, Save as SaveIcon, Download as DownloadIcon, Share2 as ShareIcon, Info as InfoIcon, Layout as LayoutIcon, Palette as PaletteIcon, Settings as SettingsIcon, RotateCcw as RotateIcon, PenTool as PenToolIcon, Eye as EyeIcon, Loader2 as LoaderIcon, Check as CheckIcon, Sparkles as SparklesIcon, FileText as FileTextIcon, Mail as MailIcon, Shield as ShieldIcon, ChevronRight as ChevronRightIcon, Upload,
  Monitor, Send, LayoutDashboard, Wallet, Grid, ArrowRight
} from 'lucide-react';

// Helper icons
const Rocket = ({ className }: { className?: string }) => (
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className={className}>
    <path d='M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z' />
    <path d='m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z' />
    <path d='M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0' />
    <path d='M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5' />
  </svg>
);

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { coreApi } from '@/lib/api';
import { Product, Category, Brand } from '@/services/types';
import { tenantService } from '@/services/tenant.service';
import { notificationService } from '@/services/notification.service';
import { getMobileTenantId } from '@/lib/storefront-utils';
import { uploadService } from '@/services/upload.service';
import { MobileSectionRenderer } from '@/components/mobile/MobileSectionRenderer';
import { CORE_ROOT_URL } from '@/services/core/api-client';


import { Section as MobileSection, getDefaultProps } from '@/components/builder/PageBuilder';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SectionLibrary } from '@/components/builder/SectionLibrary';
import { PropertyPanel } from '@/components/builder/PropertyPanel';

// Mock Data for Preview
const MOCK_PRODUCTS: Partial<Product>[] = [
  { id: '1', name: 'PlayStation $50 Card', nameAr: 'بطاقة بلايستيشن 50 دولار', price: 187.50, image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&q=80' },
  { id: '2', name: 'iTunes $25 Gift Card', nameAr: 'بطاقة آيتونز 25 دولار', price: 93.75, image: 'https://images.unsplash.com/photo-1627389955609-bc04300bf8a3?w=800&q=80' },
  { id: '3', name: 'Amazon $10 Gift Card', nameAr: 'بطاقة أمازون 10 دولار', price: 37.50, image: 'https://images.unsplash.com/photo-1523475496153-3d6cc0f0bf19?w=800&q=80' },
  { id: '4', name: 'Google Play $15 Card', nameAr: 'بطاقة جوجل بلاي 15 دولار', price: 56.25, image: 'https://images.unsplash.com/photo-1576662712957-9c79ae1280f8?w=800&q=80' },
];

const MOCK_CATEGORIES = [
  { id: '1', name: 'PlayStation', nameAr: 'بلايستيشن', image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&q=80' },
  { id: '2', name: 'iTunes', nameAr: 'آيتونز', image: 'https://images.unsplash.com/photo-1627389955609-bc04300bf8a3?w=800&q=80' },
  { id: '3', name: 'Amazon', nameAr: 'أمازون', image: 'https://images.unsplash.com/photo-1523475496153-3d6cc0f0bf19?w=800&q=80' },
  { id: '4', name: 'Google Play', nameAr: 'جوجل بلاي', image: 'https://images.unsplash.com/photo-1576662712957-9c79ae1280f8?w=800&q=80' },
];

type AppScreen = 'home' | 'product' | 'products' | 'cart' | 'profile' | 'categories' | 'search' | 'orders' | 'addresses' | 'payment' | 'settings' | 'support' | 'inventory' | 'checkout' | 'wishlist' | 'category-products' | 'category-brands' | 'brand-products' | 'login' | 'splash' | 'wallet' | string;
type SectionId = string;

// Page type definition
interface AppPage {
  id: string;
  title: string;
  titleAr?: string;
  icon: string;
  type: 'system' | 'custom';
  route?: string;
  content?: string;
  contentAr?: string;
  enabled?: boolean;
  sections?: MobileSection[];
}

// Default system pages that cannot be deleted
const DEFAULT_SYSTEM_PAGES: AppPage[] = [
  // Core Navigation - EDITABLE
  { id: 'home', title: 'Home', titleAr: 'الرئيسية', icon: 'Home', type: 'system', route: '/', enabled: true },
  { id: 'products', title: 'All Products', titleAr: 'جميع المنتجات', icon: 'ShoppingBag', type: 'system', route: '/products', enabled: true },
  { id: 'categories', title: 'Categories', titleAr: 'التصنيفات', icon: 'LayoutGrid', type: 'system', route: '/categories', enabled: true },
  
  // Shopping - SYSTEM (Core flows)
  { id: 'cart', title: 'Cart', titleAr: 'السلة', icon: 'ShoppingCart', type: 'system', route: '/cart', enabled: true },
  { id: 'wishlist', title: 'Wishlist', titleAr: 'المفضلة', icon: 'Heart', type: 'system', route: '/wishlist', enabled: true },
  { id: 'checkout', title: 'Checkout', titleAr: 'إتمام الطلب', icon: 'CreditCard', type: 'system', route: '/checkout', enabled: true },
  
  // Account & Profile
  { id: 'profile', title: 'Profile', titleAr: 'الملف الشخصي', icon: 'User', type: 'system', route: '/profile', enabled: true },
  { id: 'customer-orders', title: 'My Orders', titleAr: 'طلباتي', icon: 'Package', type: 'system', route: '/account/orders', enabled: true },
  { id: 'inventory', title: 'My Inventory', titleAr: 'مخزوني', icon: 'Layers', type: 'system', route: '/account/inventory', enabled: true },
  { id: 'addresses', title: 'Addresses', titleAr: 'العناوين', icon: 'MapPin', type: 'system', route: '/account/addresses', enabled: true },
  { id: 'notifications', title: 'Notifications', titleAr: 'الإشعارات', icon: 'Bell', type: 'system', route: '/notifications', enabled: true },
  
  // Wallet & Financial
  { id: 'wallet', title: 'Wallet', titleAr: 'المحفظة', icon: 'Wallet', type: 'system', route: '/wallet', enabled: true },
  { id: 'recharge', title: 'Recharge Balance', titleAr: 'شحن الرصيد', icon: 'PlusCircle', type: 'system', route: '/account/recharge', enabled: true },
  { id: 'recharge-history', title: 'Recharge History', titleAr: 'سجل الشحن', icon: 'History', type: 'system', route: '/account/recharge-history', enabled: true },
  { id: 'payment-methods', title: 'Payment Methods', titleAr: 'طرق الدفع', icon: 'CreditCard', type: 'system', route: '/account/payment-methods', enabled: true },
  { id: 'bank-accounts', title: 'Bank Accounts', titleAr: 'الحسابات البنكية', icon: 'Building', type: 'system', route: '/bank-accounts', enabled: true },
  
  // Content Pages - EDITABLE
  { id: 'about', title: 'About Us', titleAr: 'من نحن', icon: 'Info', type: 'system', route: '/about', enabled: true },
  { id: 'contact', title: 'Contact Us', titleAr: 'تواصل معنا', icon: 'Mail', type: 'system', route: '/contact', enabled: true },
  { id: 'support', title: 'Support', titleAr: 'الدعم', icon: 'Headphones', type: 'system', route: '/support', enabled: true },
  { id: 'faqs', title: 'FAQs', titleAr: 'الأسئلة الشائعة', icon: 'HelpCircle', type: 'system', route: '/faqs', enabled: true },
  
  // Policies
  { id: 'privacy-policy', title: 'Privacy Policy', titleAr: 'سياسة الخصوصية', icon: 'Shield', type: 'system', route: '/privacy', enabled: true },
  { id: 'terms', title: 'Terms & Conditions', titleAr: 'الشروط والأحكام', icon: 'FileText', type: 'system', route: '/terms', enabled: true },

  // Management (For Merchant Staff)
  { id: 'employees', title: 'Employees', titleAr: 'الموظفين', icon: 'Users', type: 'system', route: '/account/employees', enabled: false },
  { id: 'reports', title: 'Reports', titleAr: 'التقارير', icon: 'BarChart3', type: 'system', route: '/account/reports', enabled: false },
  
  // Settings & Auth
  { id: 'settings', title: 'Settings', titleAr: 'الإعدادات', icon: 'Settings', type: 'system', route: '/settings', enabled: true },
  { id: 'login', title: 'Login', titleAr: 'تسجيل الدخول', icon: 'LogIn', type: 'system', route: '/login', enabled: true },
  { id: 'signup', title: 'Sign Up', titleAr: 'إنشاء حساب', icon: 'UserPlus', type: 'system', route: '/signup', enabled: true },
];

// Template presets with unique design styles
const TEMPLATE_PRESETS: Record<string, Partial<typeof DEFAULT_CONFIG>> = {
  'retail-pro': {
    primaryColor: '#2563eb',
    secondaryColor: '#1e40af',
    cornerRadius: '1rem',
    buttonStyle: 'filled',
    fontFamily: 'Inter',
    bannerText: 'Summer Sale 50%',
    bannerSubtext: 'Limited time offer',
    bannerTextAr: 'تخفيضات الصيف 50%',
    bannerSubtextAr: 'عرض لفترة محدودة',
  },
  'digital-market': {
    primaryColor: '#10b981',
    secondaryColor: '#059669',
    cornerRadius: '0.5rem',
    buttonStyle: 'outline',
    fontFamily: 'Roboto',
    bannerText: 'Digital Downloads',
    bannerSubtext: 'Instant delivery',
    bannerTextAr: 'تحميلات رقمية',
    bannerSubtextAr: 'توصيل فوري',
  },
  'minimal-shop': {
    primaryColor: '#1f2937',
    secondaryColor: '#111827',
    cornerRadius: '0rem',
    buttonStyle: 'ghost',
    fontFamily: 'Playfair Display',
    bannerText: 'New Arrivals',
    bannerSubtext: 'Discover our collection',
    bannerTextAr: 'وصل حديثاً',
    bannerSubtextAr: 'اكتشف تشكيلتنا',
  },
  'grocery-go': {
    primaryColor: '#f97316',
    secondaryColor: '#ea580c',
    cornerRadius: '1.5rem',
    buttonStyle: 'filled',
    fontFamily: 'Inter',
    bannerText: 'Fresh Deals',
    bannerSubtext: 'Daily discounts',
    bannerTextAr: 'عروض طازجة',
    bannerSubtextAr: 'خصومات يومية',
  },
};

// Helper function to generate default sections for each page type
const getDefaultSectionsForPage = (pageId: string, isRTL: boolean): MobileSection[] => {
  const timestamp = Date.now();
  
  switch (pageId) {
    case 'home':
      return [
        {
          id: `section-${timestamp}-hero`,
          type: 'hero',
          props: {
            title: isRTL ? 'مرحباً بك في متجرنا' : 'Welcome to Our Store',
            subtitle: isRTL ? 'اكتشف أفضل المنتجات' : 'Discover amazing products',
            buttonText: isRTL ? 'تسوق الآن' : 'Shop Now',
            buttonLink: '/products',
            backgroundImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070',
            overlayOpacity: 0.5,
          }
        },
        {
          id: `section-${timestamp}-products`,
          type: 'products',
          props: {
            title: isRTL ? 'منتجات مميزة' : 'Featured Products',
            limit: 8,
            layout: 'grid',
            columns: '2',
            showPrice: true,
            showAddToCart: true,
          }
        }
      ];
    
    case 'categories':
      return [
        {
          id: `section-${timestamp}-categories`,
          type: 'categories-hierarchy',
          props: {
            title: isRTL ? 'تصفح الأقسام' : 'Browse Categories',
            subtitle: isRTL ? 'استكشف مجموعتنا الواسعة' : 'Explore our wide range',
            productsPerCategory: 8,
          }
        }
      ];
    
    case 'products':
      return [
        {
          id: `section-${timestamp}-products`,
          type: 'products',
          props: {
            title: isRTL ? 'جميع المنتجات' : 'All Products',
            limit: 20,
            layout: 'grid',
            columns: '2',
            showPrice: true,
            showAddToCart: true,
            showName: true,
          }
        }
      ];
    
    case 'cart':
      return [
        {
          id: `section-${timestamp}-cart`,
          type: 'cart-section',
          props: {
            title: isRTL ? 'سلة التسوق' : 'Shopping Cart',
            emptyCartMessage: isRTL ? 'سلتك فارغة' : 'Your cart is empty',
            checkoutButtonText: isRTL ? 'إتمام الشراء' : 'Proceed to Checkout',
          }
        }
      ];
    
    case 'checkout':
      return [
        {
          id: `section-${timestamp}-checkout`,
          type: 'checkout-section',
          props: {
            title: isRTL ? 'إتمام الطلب' : 'Checkout',
            showOrderSummary: true,
            showPaymentMethods: true,
          }
        }
      ];
    
    case 'profile':
      return [
        {
          id: `section-${timestamp}-profile`,
          type: 'profile-section',
          props: {
            title: isRTL ? 'الملف الشخصي' : 'My Profile',
            showAvatar: true,
            showStats: true,
          }
        }
      ];
    
    case 'customer-orders':
    case 'orders':
      return [
        {
          id: `section-${timestamp}-orders`,
          type: 'orders-section',
          props: {
            title: isRTL ? 'طلباتي' : 'My Orders',
            subtitle: isRTL ? 'تتبع طلباتك السابقة' : 'Track your previous orders',
            showFilters: true,
            showSearch: true,
          }
        }
      ];
    
    case 'wishlist':
      return [
        {
          id: `section-${timestamp}-wishlist`,
          type: 'wishlist-section',
          props: {
            title: isRTL ? 'قائمة الرغبات' : 'My Wishlist',
            emptyMessage: isRTL ? 'قائمة الرغبات فارغة' : 'Your wishlist is empty',
          }
        }
      ];
    
    case 'wallet':
      return [
        {
          id: `section-${timestamp}-wallet`,
          type: 'wallet-section',
          props: {
            title: isRTL ? 'المحفظة' : 'My Wallet',
            showBalance: true,
            showTransactions: true,
            showRechargeButton: true,
          }
        }
      ];
    
    case 'inventory':
      return [
        {
          id: `section-${timestamp}-inventory`,
          type: 'inventory-section',
          props: {
            title: isRTL ? 'مخزوني' : 'My Inventory',
            subtitle: isRTL ? 'البطاقات والأكواد المشتراة' : 'Purchased cards and codes',
          }
        }
      ];
    
    case 'addresses':
      return [
        {
          id: `section-${timestamp}-addresses`,
          type: 'addresses-section',
          props: {
            title: isRTL ? 'عناويني' : 'My Addresses',
            addButtonText: isRTL ? 'إضافة عنوان جديد' : 'Add New Address',
          }
        }
      ];
    
    case 'notifications':
      return [
        {
          id: `section-${timestamp}-notifications`,
          type: 'notifications-section',
          props: {
            title: isRTL ? 'الإشعارات' : 'Notifications',
            emptyMessage: isRTL ? 'لا توجد إشعارات' : 'No notifications',
          }
        }
      ];
    
    case 'recharge':
      return [
        {
          id: `section-${timestamp}-recharge`,
          type: 'recharge-section',
          props: {
            title: isRTL ? 'شحن الرصيد' : 'Recharge Balance',
            subtitle: isRTL ? 'أضف رصيداً إلى محفظتك' : 'Add balance to your wallet',
          }
        }
      ];
    
    case 'recharge-history':
      return [
        {
          id: `section-${timestamp}-recharge-history`,
          type: 'transactions-section',
          props: {
            title: isRTL ? 'سجل الشحن' : 'Recharge History',
            showFilters: true,
          }
        }
      ];
    
    case 'payment-methods':
      return [
        {
          id: `section-${timestamp}-payment`,
          type: 'payment-methods-section',
          props: {
            title: isRTL ? 'طرق الدفع' : 'Payment Methods',
            addButtonText: isRTL ? 'إضافة طريقة دفع' : 'Add Payment Method',
          }
        }
      ];
    
    case 'bank-accounts':
      return [
        {
          id: `section-${timestamp}-bank`,
          type: 'bank-accounts-section',
          props: {
            title: isRTL ? 'الحسابات البنكية' : 'Bank Accounts',
            addButtonText: isRTL ? 'إضافة حساب بنكي' : 'Add Bank Account',
          }
        }
      ];
    
    case 'employees':
      return [
        {
          id: `section-${timestamp}-employees`,
          type: 'employees-section',
          props: {
            title: isRTL ? 'الموظفين' : 'Employees',
            addButtonText: isRTL ? 'إضافة موظف' : 'Add Employee',
          }
        }
      ];
    
    case 'reports':
      return [
        {
          id: `section-${timestamp}-reports`,
          type: 'reports-section',
          props: {
            title: isRTL ? 'التقارير' : 'Reports',
            showSalesReport: true,
            showOrdersReport: true,
          }
        }
      ];
    
    case 'settings':
      return [
        {
          id: `section-${timestamp}-settings`,
          type: 'settings-section',
          props: {
            title: isRTL ? 'الإعدادات' : 'Settings',
            showLanguage: true,
            showTheme: true,
            showNotifications: true,
          }
        }
      ];
    
    case 'support':
      return [
        {
          id: `section-${timestamp}-support`,
          type: 'support-section',
          props: {
            title: isRTL ? 'الدعم' : 'Support',
            subtitle: isRTL ? 'كيف يمكننا مساعدتك؟' : 'How can we help you?',
            showChat: true,
            showFAQ: true,
          }
        }
      ];
    
    case 'faqs':
      return [
        {
          id: `section-${timestamp}-faqs`,
          type: 'faq-section',
          props: {
            title: isRTL ? 'الأسئلة الشائعة' : 'Frequently Asked Questions',
            items: [
              { question: isRTL ? 'كيف أقوم بالطلب؟' : 'How do I place an order?', answer: isRTL ? 'تصفح المنتجات، أضفها للسلة، ثم انتقل لإتمام الدفع.' : 'Browse products, add to cart, then proceed to checkout.' },
              { question: isRTL ? 'كم مدة التوصيل؟' : 'How long is delivery?', answer: isRTL ? 'عادة ما يتم التوصيل خلال 1-3 أيام عمل حسب موقعك.' : 'Delivery usually takes 1-3 business days depending on your location.' },
            ]
          }
        }
      ];

    case 'login':
      return [
        {
          id: `section-${timestamp}-auth`,
          type: 'auth-section',
          props: {
            defaultMode: 'login',
            heroTitle: isRTL ? 'مرحباً بعودتك' : 'Welcome Back',
            heroSubtitle: isRTL ? 'سجل دخولك للمتابعة' : 'Sign in to continue',
          }
        }
      ];
    
    case 'signup':
      return [
        {
          id: `section-${timestamp}-auth`,
          type: 'auth-section',
          props: {
            defaultMode: 'signup',
            heroTitle: isRTL ? 'انضم إلينا' : 'Join Us Today',
            heroSubtitle: isRTL ? 'أنشئ حسابك الآن' : 'Create your account now',
          }
        }
      ];
    
    case 'about':
      return [
        {
          id: `section-${timestamp}-about`,
          type: 'about-section',
          props: {
            title: isRTL ? 'من نحن' : 'About Us',
            subtitle: isRTL ? 'قصتنا ورؤيتنا' : 'Our Story & Vision',
            description: isRTL 
              ? 'نحن متخصصون في تقديم أفضل الخدمات والمنتجات لعملائنا بجودة عالية وأسعار منافسة.' 
              : 'We specialize in providing the best services and products to our customers with high quality and competitive prices.',
            stats: [
              { value: '100%', label: isRTL ? 'جودة مضمونة' : 'Quality Guaranteed' },
              { value: '24/7', label: isRTL ? 'دعم مستمر' : 'Continuous Support' },
            ],
            showImage: true,
            imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070'
          }
        }
      ];
    
    case 'contact':
      return [
        {
          id: `section-${timestamp}-contact`,
          type: 'contact-section',
          props: {
            title: isRTL ? 'تواصل معنا' : 'Contact Us',
            subtitle: isRTL ? 'نحن هنا لمساعدتك دائماً' : 'We are here to help you always',
            email: 'support@example.com',
            phone: '+966 50 000 0000',
            address: isRTL ? 'المملكة العربية السعودية' : 'Saudi Arabia',
            showForm: true,
            showContactInfo: true,
          }
        }
      ];

    case 'privacy-policy':
    case 'terms':
      return [
        {
          id: `section-${timestamp}-text`,
          type: 'text',
          props: {
            title: pageId === 'terms' ? (isRTL ? 'الشروط والأحكام' : 'Terms & Conditions') : (isRTL ? 'سياسة الخصوصية' : 'Privacy Policy'),
            text: isRTL 
              ? 'هنا يمكنك كتابة سياستكم وشروطكم للحفاظ على حقوقكم وحقوق عملائكم.' 
              : 'Here you can write your policies and terms to protect your rights and your customers rights.',
            textAlign: isRTL ? 'right' : 'left',
          }
        }
      ];
    
    default:
      // Generic text section for any undefined page
      return [
        {
          id: `section-${timestamp}-text`,
          type: 'text',
          props: {
            title: isRTL ? 'محتوى الصفحة' : 'Page Content',
            text: isRTL ? 'أضف محتوى هذه الصفحة هنا...' : 'Add your page content here...',
            textAlign: 'center',
          }
        }
      ];
  }
};

const DEFAULT_CONFIG = {
  themeId: 'retail-pro',
  appName: 'أسس',
  primaryColor: '#2563eb',
  secondaryColor: '#1e40af',
  logo: null as string | null,
  
  // Layout & Content
  showSearch: true,
  showBanner: true,
  bannerText: 'Summer Sale 50%',
  bannerTextAr: 'تخفيضات الصيف 50%',
  bannerSubtext: 'Limited time offer',
  bannerSubtextAr: 'عرض لفترة محدودة',
  bannerImage: null as string | null,
  showCategories: true,
  categoriesTitle: 'Categories',
  categoriesTitleAr: 'الأقسام',
  showFeatured: true,
  featuredTitle: 'Featured Products',
  featuredTitleAr: 'منتجات مميزة',
  
  // Design
  navigationMode: 'bottom' as 'bottom' | 'drawer',
  cornerRadius: '1rem',
  buttonStyle: 'filled' as 'filled' | 'outline' | 'ghost',
  fontFamily: 'Inter',
  storeName: 'أسس',
  storeLogo: '',
  currency: 'SAR',
  enableGlassEffect: false,
  theme: 'light' as 'light' | 'dark',
  backgroundColor: '#f9fafb',
  userName: 'ABDELRAZIK',
  shadowIntensity: 'md' as 'none' | 'sm' | 'md' | 'lg' | 'xl',
  borderWidth: 1,
  sectionSpacing: 16,

  // Splash Screen
  splashEnabled: true,
  splashImage: null as string | null, // URL for image or gif
  splashDuration: 3, // in seconds
  splashAnimation: 'fade' as 'fade' | 'slide' | 'zoom' | 'bounce',
  
    // Pages / Menu Items - now using comprehensive AppPage type
   pages: [...DEFAULT_SYSTEM_PAGES] as AppPage[],
   customPages: [] as AppPage[],
   homePageSlug: '/',
};



// Extended AppConfig to include dynamic properties from backend/Stitch
type AppConfig = typeof DEFAULT_CONFIG & {
  sections?: MobileSection[];
  homeSections?: MobileSection[];
  content?: { sections?: MobileSection[] };
  stitchScreens?: Record<string, string>;
  stitchEditMode?: Record<string, boolean>;
  homePageSlug?: string;
};

interface StitchProps {
  config: AppConfig;
  isRTL: boolean;
  data?: {
    userName?: string;
    categories?: Category[];
    products?: Product[];
    brands?: Brand[];
  };
  categories?: Category[];
  product?: Product;
  items?: Product[];
}


interface SortableListItemProps {
  section: MobileSection;
  onSelect: () => void;
  onDelete: () => void;
  isSelected?: boolean;
}

function SortableListItem({ section, onSelect, onDelete, isSelected }: SortableListItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl bg-white border mb-2 group transition-all cursor-pointer shadow-sm hover:shadow-md relative overflow-hidden", 
        isSelected ? "border-blue-500 ring-1 ring-blue-500 bg-blue-50/50" : "border-gray-100 hover:border-blue-200"
      )}
      onClick={onSelect}
    >
       <div {...attributes} {...listeners} className="cursor-grab text-gray-300 hover:text-gray-500 active:cursor-grabbing p-1 shrink-0">
          <GripVertical className="w-4 h-4" />
       </div>
       <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex items-center gap-2">
             <span className="text-xs font-bold text-gray-800 capitalize truncate leading-tight">{section.type.replace('-', ' ')}</span>
             {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
          </div>
          <span className="text-[10px] text-gray-400 truncate mt-0.5 leading-tight">{(section.props as { title?: string; label?: string }).title || (section.props as { title?: string; label?: string }).label || 'No title set'}</span>
       </div>
       <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all shrink-0" 
          onClick={(e) => { 
            e.stopPropagation();
            if (confirm('Delete this section?')) onDelete(); 
          }}
       >
          <Trash2 className="w-3.5 h-3.5" />
       </Button>
    </div>
  );
}


export default function AppBuilder() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [activeScreen, setActiveScreen] = useState<AppScreen>('home');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState('design');
  const [selectedSection, setSelectedSection] = useState<SectionId | null>(null);
  const [realProducts, setRealProducts] = useState<Product[]>([]);
  const [realCategories, setRealCategories] = useState<Category[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [useRealData, setUseRealData] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [realBrands, setRealBrands] = useState<Brand[]>([]);
  const [storeSubdomain, setStoreSubdomain] = useState<string>('default');
  const [tenantId, setTenantId] = useState<string | null>(null);

  const [buildStatus, setBuildStatus] = useState<'idle' | 'building' | 'deploying' | 'completed' | 'failed'>('idle');
  const [buildProgress, setBuildProgress] = useState(0);
  const [showBuildDialog, setShowBuildDialog] = useState(false);
  const [apkDownloadUrl, setApkDownloadUrl] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [serverConfig, setServerConfig] = useState<Record<string, unknown> | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(384);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [canvasScale, setCanvasScale] = useState(0.85);
  const [isResizing, setIsResizing] = useState(false);
  const [isDigital, setIsDigital] = useState(false);

  const getFilteredSystemPages = (digital: boolean) => {
    return DEFAULT_SYSTEM_PAGES.filter(p => {
       // Management pages are hidden for basic merchant view
       if (p.id === 'employees' || p.id === 'reports') return false;
       // Digital stores don't usually need physical addresses for customers
       if (digital && p.id === 'addresses') return false;
       return true;
    });
  };

  // --- Section Management ---
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getCurrentSections = () => {
     // Check pages (System)
     const page = (config.pages || []).find(p => p.id === activeScreen);
     if (page && page.sections && page.sections.length > 0) return page.sections;
     
     // Check custom pages
     const customPage = (config.customPages || []).find(p => p.id === activeScreen);
     if (customPage && customPage.sections && customPage.sections.length > 0) return customPage.sections;

     // Fallback for home legacy
     if (activeScreen === 'home') {
        const legacySections = config.sections || config.homeSections;
        if (legacySections && legacySections.length > 0) return legacySections;
     }
     
     // Return default sections for the current page type (enables editing for all pages)
     return getDefaultSectionsForPage(activeScreen, isRTL);
  };

  const updateCurrentSections = (newSections: MobileSection[]) => {
      setConfig(prev => {
          const updatedConfig = { ...prev };
          const isHome = activeScreen === 'home';
          
          if (isHome) {
              updatedConfig.homeSections = newSections;
              updatedConfig.sections = newSections;
          }

          // Update System Pages
          const systemPages = prev.pages || [...DEFAULT_SYSTEM_PAGES];
          if (systemPages.some(p => p.id === activeScreen)) {
              updatedConfig.pages = systemPages.map(p => p.id === activeScreen ? { ...p, sections: newSections } : p);
          } else if (isHome) {
             // Ensure home is in pages if for some reason it wasn't
             const homePage = systemPages.find(p => p.id === 'home');
             if (homePage) {
                 updatedConfig.pages = systemPages.map(p => p.id === 'home' ? { ...p, sections: newSections } : p);
             }
          }

          // Update Custom Pages
          if (prev.customPages?.some(p => p.id === activeScreen)) {
              updatedConfig.customPages = prev.customPages.map(p => p.id === activeScreen ? { ...p, sections: newSections } : p);
          }
          
          return updatedConfig;
      });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
       const currentSections = getCurrentSections();
       const oldIndex = currentSections.findIndex((item) => item.id === active.id);
       const newIndex = currentSections.findIndex((item) => item.id === over.id);
       if (oldIndex !== -1 && newIndex !== -1) {
          const newSections = arrayMove(currentSections, oldIndex, newIndex);
          updateCurrentSections(newSections);
       }
    }
  };
  
  const handleAddSection = (type: string) => {
      const newSection: MobileSection = {
          id: `section-${Date.now()}`,
          type,
          props: getDefaultProps(type, t)
      };
      
      const current = getCurrentSections();
      updateCurrentSections([...current, newSection]);
      // setSelectedSection(newSection.id as any); // Cast because selectedSection is SectionId union, but we abuse it for ID
      // We should probably allow selectedSection to be string.
      // But selectedSection is typed as SectionId | null (union). 
      // I should update the state definition of selectedSection to 'string | null'.
      // For now, casting to 'any' allows it to compile, assuming we fix state type or ignore.
      setSelectedSection(newSection.id as SectionId);
  };
  
  const handleUpdateSectionProps = (newProps: Record<string, unknown>) => {
      if (!selectedSection) return;
      const current = getCurrentSections();
      const updated = current.map(s => s.id === selectedSection ? { ...s, props: newProps } : s);
      updateCurrentSections(updated);
  };
  
  const handleDeleteSection = (id: string) => {
      const current = getCurrentSections();
      const updated = current.filter(s => s.id !== id);
      updateCurrentSections(updated);
      if (selectedSection === id) setSelectedSection(null);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
       if (!isResizing) return;
       
       let newWidth;
       if (isRTL) {
          // In RTL, sidebar is on the right (usually), so resize moves left
          // Assuming the sidebar is anchored to the right edge of the screen or container
          // Actually, based on layout: flex-row with RTL direction
          // Mouse moving Left (decreasing X) increases width
          const containerWidth = document.body.clientWidth;
          // This depends on where the sidebar is anchored. 
          // If it's flex, we just calculate delta? 
          // Simpler: Just use delta logic or absolute position
          // Let's assume standard behavior:
          // Sidebar is first child -> On Right in RTL.
          // Handle is on Left edge of Sidebar.
          // Moving mouse Left (smaller X) -> Sidebar gets wider.
          newWidth = document.body.clientWidth - e.clientX; 
       } else {
          // LTR: Sidebar on Left. Handle on Right edge.
          // Moving mouse Right (larger X) -> Sidebar gets wider.
          newWidth = e.clientX;
       }

       // Clamping
       if (newWidth < 280) newWidth = 280;
       if (newWidth > 600) newWidth = 600;
       
       setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
       setIsResizing(false);
       document.body.style.cursor = 'default';
    };

    if (isResizing) {
       document.addEventListener('mousemove', handleMouseMove);
       document.addEventListener('mouseup', handleMouseUp);
       document.body.style.cursor = 'col-resize';
    }

    return () => {
       document.removeEventListener('mousemove', handleMouseMove);
       document.removeEventListener('mouseup', handleMouseUp);
       document.body.style.cursor = 'default';
    };
  }, [isResizing, isRTL]);



  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem('app_builder_config');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  useEffect(() => {
     // Auto-correct any garbled Arabic titles in the configuration
     if (config.categoriesTitleAr && config.categoriesTitleAr.includes('Ø')) {
        setConfig(prev => ({ ...prev, categoriesTitleAr: 'الأقسام' }));
     }
     if (config.featuredTitleAr && config.featuredTitleAr.includes('Ø')) {
        setConfig(prev => ({ ...prev, featuredTitleAr: 'منتجات مميزة' }));
     }
     if (config.bannerTextAr && config.bannerTextAr.includes('Ø')) {
        setConfig(prev => ({ ...prev, bannerTextAr: 'تخفيضات الصيف 50%' }));
     }
  }, [config.categoriesTitleAr, config.featuredTitleAr, config.bannerTextAr]);

  // Splash Screen State
  const [splashActive, setSplashActive] = useState(false);
  const [hasShownSplash, setHasShownSplash] = useState(false);

  useEffect(() => {
    localStorage.setItem('app_builder_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        const [productsRes, categoriesRes, brandsRes, settingsRes, mobileConfigRes, tenantData] = await Promise.all([
          coreApi.getProducts({ limit: 20 }),
          coreApi.getCategories({ all: true }),
          coreApi.getBrands({ limit: 20 }).catch(() => []),
          coreApi.get('/site-config', { requireAuth: true }),
          coreApi.get('/site-config/mobile', { requireAuth: true }).catch(() => null),
          tenantService.getCurrentUserTenant().catch(() => null)
        ]);
        
        setRealProducts(Array.isArray(productsRes) ? productsRes : (productsRes as { data?: Product[] }).data || []);
        setRealCategories(Array.isArray(categoriesRes) ? categoriesRes : (categoriesRes as { categories?: Category[] }).categories || []);
        setRealBrands(Array.isArray(brandsRes) ? brandsRes : (brandsRes as { data?: Brand[] }).data || []);
        
        // Get tenant data for store URL and ID
        if (tenantData?.id) {
          setTenantId(tenantData.id);
        }
        if (tenantData?.subdomain) {
          setStoreSubdomain(tenantData.subdomain);
        } else if (settingsRes?.settings?.subdomain) {
          setStoreSubdomain(settingsRes.settings.subdomain);
        }
        
        if (settingsRes?.settings) {
          const s = settingsRes.settings;
          const digital = s.storeType === 'DIGITAL_CARDS' || s.isDigital || false;
          setIsDigital(digital);
          
          const storeName = s.storeNameAr || s.storeName || s.name || '';
          const storeLogo = s.storeLogoUrl || s.logo || '';
          
          const actualMobileConfig = mobileConfigRes?.config || mobileConfigRes || {};
          
          // Filter system pages based on store type
          const filteredSystemPages = getFilteredSystemPages(digital);

          // Update both config and initial config with store data
          // Prioritize actualMobileConfig if it exists, otherwise fall back to store settings
          const storeConfig = {
            appName: actualMobileConfig.appName || storeName || 'My Store App',
            storeName: actualMobileConfig.storeName || storeName || '',
            storeLogo: storeLogo,
            logo: actualMobileConfig.logo || storeLogo || null,
            currency: actualMobileConfig.currency || s.currency || '$',
            primaryColor: actualMobileConfig.primaryColor || s.primaryColor || DEFAULT_CONFIG.primaryColor,
            secondaryColor: actualMobileConfig.secondaryColor || s.secondaryColor || DEFAULT_CONFIG.secondaryColor,
            pages: actualMobileConfig.pages?.length > 0 ? actualMobileConfig.pages : filteredSystemPages,
          };
          
          setConfig(prev => ({
            ...prev,
            ...actualMobileConfig, // Apply all saved mobile settings
            ...storeConfig // Ensure store-level overrides are correctly applied
          }));
          setServerConfig(actualMobileConfig);
        }
      } catch (error) {
        console.error('Failed to fetch real data:', error);
        setUseRealData(false);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, []);



  // Splash Screen Sequence logic
  useEffect(() => {
    // If we haven't shown splash yet and it's enabled, or if user explicitly went to splash screen
    if (config.splashEnabled && !hasShownSplash && activeScreen === 'home') {
      setSplashActive(true);
      setHasShownSplash(true);
      const timer = setTimeout(() => {
        setSplashActive(false);
      }, (config.splashDuration || 3) * 1000);
      return () => clearTimeout(timer);
    } else if (activeScreen === 'splash') {
       setSplashActive(true);
    } else {
       setSplashActive(false);
    }
  }, [activeScreen, config.splashEnabled, config.splashDuration, hasShownSplash]);


  // Broadcast config changes to any iframes (Live Preview sync)
  useEffect(() => {
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      iframe.contentWindow?.postMessage({
        type: 'APP_BUILDER_CONFIG_SYNC',
        config: config
      }, '*');
    });
  }, [config]);

  // Also listen for iframe ready message to sync immediately
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PREVIEW_READY') {
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
          if (iframe.contentWindow === event.source) {
            iframe.contentWindow?.postMessage({
                type: 'APP_BUILDER_CONFIG_SYNC',
                config: config
            }, '*');
          }
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [config]);


  const handleSectionClick = (sectionId: SectionId) => {
    setSelectedSection(sectionId);
    setActiveTab('content');
  };

  
  

  // --- Page Config Helpers ---
  const getPageTitle = (id: string, ar = false) => {
    const p = (config.pages || []).find((x: AppPage) => x.id === id) || (config.customPages || []).find((x: AppPage) => x.id === id) || DEFAULT_SYSTEM_PAGES.find((x: AppPage) => x.id === id);
    if (!p) return ar ? '' : '';
    return ar ? (p.titleAr || p.title) : p.title;
  };

  const updatePageTitle = (id: string, title: string, ar = false) => {
     // System Page
     if (DEFAULT_SYSTEM_PAGES.some(p => p.id === id)) {
        const currentPages = config.pages || [...DEFAULT_SYSTEM_PAGES];
        let newPages = [...currentPages];
        
        // Ensure the page exists in config.pages
        if (!newPages.some(p => p.id === id)) {
           const def = DEFAULT_SYSTEM_PAGES.find(p => p.id === id);
           if (def) newPages.push(def);
        }
        
        newPages = newPages.map(p => p.id === id ? { ...p, [ar ? 'titleAr' : 'title']: title } : p);
        setConfig({ ...config, pages: newPages });
     } else {
        // Custom Page
        const customPages = config.customPages || [];
        const newCustom = customPages.map(p => p.id === id ? { ...p, [ar ? 'titleAr' : 'title']: title } : p);
        setConfig({ ...config, customPages: newCustom });
     }
  };

  // Build & Publish Logic
  const handlePublishApp = () => {
    setShowBuildDialog(true);
  };

  const [isSaving, setIsSaving] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateDesign = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    
    // Simulate AI thinking and generating a new design pattern
    setTimeout(() => {
      const prompt = aiPrompt.toLowerCase();
      let aiConfig: Partial<AppConfig> = {};

      if (prompt.includes('dark') || prompt.includes('luxury') || prompt.includes('night')) {
        aiConfig = {
          theme: 'dark',
          primaryColor: '#7c3aed', 
          secondaryColor: '#1e1b4b',
          backgroundColor: '#0f172a',
          enableGlassEffect: true,
          cornerRadius: '1.5rem',
          shadowIntensity: 'xl',
          borderWidth: 0,
          sectionSpacing: 24
        };
      } else if (prompt.includes('minimal') || prompt.includes('clean') || prompt.includes('simple')) {
        aiConfig = {
          theme: 'light',
          primaryColor: '#000000',
          secondaryColor: '#f8fafc',
          backgroundColor: '#ffffff',
          enableGlassEffect: false,
          cornerRadius: '0.5rem',
          shadowIntensity: 'sm',
          borderWidth: 1,
          sectionSpacing: 12
        };
      } else if (prompt.includes('vibrant') || prompt.includes('fun') || prompt.includes('colorful')) {
        aiConfig = {
          theme: 'light',
          primaryColor: '#ec4899', 
          secondaryColor: '#fef2f2',
          enableGlassEffect: true,
          cornerRadius: '2rem',
          shadowIntensity: 'md',
          borderWidth: 2,
          sectionSpacing: 20
        };
      } else {
        const colors = ['#2563eb', '#16a34a', '#dc2626', '#ea580c', '#0891b2'];
        aiConfig = {
          primaryColor: colors[Math.floor(Math.random() * colors.length)],
          enableGlassEffect: Math.random() > 0.5,
          cornerRadius: Math.random() > 0.5 ? '1rem' : '0.75rem',
          shadowIntensity: 'md',
          borderWidth: 1,
          sectionSpacing: 16
        };
      }

      setConfig(prev => {
        const updatedConfig = {
          ...prev,
          ...aiConfig,
          stitchEditMode: { ...(prev.stitchEditMode || {}), [activeScreen]: false }
        };

        // restructuring based on active screen and prompt
        if (activeScreen === 'home') {
          const newHomeSections: MobileSection[] = [{ id: 'header', type: 'header', props: {} }];
          if (prompt.includes('grid') || prompt.includes('modern')) {
            newHomeSections.push({ id: 'banners', type: 'banner', props: { height: 180, autoPlay: true } });
            newHomeSections.push({ id: 'cats', type: 'categories', props: { layout: 'grid', columns: 4 } });
            newHomeSections.push({ id: 'featured', type: 'products', props: { layout: 'grid', columns: 2, title: prompt.includes('grid') ? 'Our Collection' : 'Featured' } });
          } else if (prompt.includes('list') || prompt.includes('traditional')) {
             newHomeSections.push({ id: 'cats', type: 'categories', props: { layout: 'list' } });
             newHomeSections.push({ id: 'featured', type: 'products', props: { layout: 'list', title: 'Top Deals' } });
          } else {
             newHomeSections.push({ id: 'banners', type: 'banner', props: {} });
             newHomeSections.push({ id: 'featured', type: 'products', props: { layout: 'grid', columns: 2 } });
          }
          updatedConfig.homeSections = newHomeSections;
          updatedConfig.showBanner = newHomeSections.some(s => s.type === 'banner');
          updatedConfig.showCategories = newHomeSections.some(s => s.type === 'categories');
          updatedConfig.showFeatured = newHomeSections.some(s => s.type === 'products');
        } else if (activeScreen === 'categories') {
          updatedConfig.showCategories = true;
          updatedConfig.categoriesTitle = prompt.includes('minimal') ? 'Our Collections' : 'Browse Categories';
        } else if (activeScreen === 'profile') {
          updatedConfig.theme = prompt.includes('luxury') || prompt.includes('dark') ? 'dark' : 'light';
          updatedConfig.enableGlassEffect = prompt.includes('luxury');
        } else if (activeScreen === 'products') {
          updatedConfig.featuredTitle = prompt.includes('modern') ? 'Explore Our Store' : 'All Products';
        } else if (activeScreen === 'cart') {
          updatedConfig.primaryColor = prompt.includes('vibrant') ? '#f43f5e' : updatedConfig.primaryColor;
        } else if (activeScreen === 'search') {
          updatedConfig.showSearch = true;
        }

        return updatedConfig;
      });

      setIsGenerating(false);
      toast({
        title: t('appBuilder.aiSuccessTitle', 'AI Design Applied'),
        description: t('appBuilder.aiSuccessDesc', 'Your store has been redesigned based on your prompt.'),
      });
    }, 1500);
  };
  


  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      // Simulate API call to save config
      await coreApi.post('/site-config/mobile', { config }, { requireAuth: true }).catch(() => {
         // Fallback if endpoint doesn't exist yet
         localStorage.setItem('app_builder_config', JSON.stringify(config));
      });
      
      setServerConfig(config);
      toast({
        title: 'Configuration Saved ',
        description: 'Your mobile app settings have been saved successfully.',
      });
    } catch (error) {
      console.error('Failed to save config:', error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Could not save your configuration. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestoreFromServer = async () => {
     if (!serverConfig) {
        toast({
           title: 'No Data on Server',
           description: 'Your store has no saved configuration on the server yet.',
        });
        return;
     }

     setIsSyncing(true);
     try {
        // Fetch fresh copy from server
        const mobileConfigRes = await coreApi.get('/site-config/mobile', { requireAuth: true }).catch(() => null);
        
         if (mobileConfigRes) {
            const actualConfig = mobileConfigRes.config || mobileConfigRes;
            setConfig(prev => ({
               ...prev,
               ...actualConfig
            }));
           setServerConfig(actualConfig);
           localStorage.setItem('app_builder_config', JSON.stringify({ ...config, ...actualConfig }));
           
           toast({
              title: 'Synced with Server',
              description: 'Your local edits have been replaced with the version saved in the database.',
           });
        }
     } catch (error) {
        toast({
           variant: 'destructive',
           title: 'Sync Failed',
           description: 'Failed to fetch the latest configuration from the server.',
        });
     } finally {
        setIsSyncing(false);
     }
  };

  const startBuildProcess = async () => {
    const platformDomain = import.meta.env.VITE_PLATFORM_DOMAIN || 'saeaa.com';
    const secondaryDomain = import.meta.env.VITE_PLATFORM_SECONDARY_DOMAIN || 'saeaa.net';
    
    setBuildStatus('building');
    setBuildProgress(5);
    setIsPublishing(true);

    try {
      // Step 1: Trigger Build on Server
      const buildRes = await coreApi.post('/app-builder/build', {
         appName: config.appName || config.storeName || 'My Store',
         storeUrl: `https://${storeSubdomain}.${platformDomain}`,
         primaryColor: config.primaryColor,
         secondaryColor: config.secondaryColor,
         iconUrl: (config.logo || config.storeLogo) 
            ? ((config.logo || config.storeLogo).startsWith('http') 
               ? (config.logo || config.storeLogo) 
               : (config.logo || config.storeLogo).startsWith('data:')
                  ? (config.logo || config.storeLogo)
                  : `${window.location.origin}${config.logo || config.storeLogo}`)
            : undefined,
         platform: 'android',
         config: config // Pass full config for the builder service
      }, { requireAuth: true });

      const buildId = buildRes.buildId;
      setBuildProgress(10);

      // Step 2: Poll for status
      let isComplete = false;
      let attempts = 0;
      
      while (!isComplete && attempts < 120) { // 10 minutes max
         await new Promise(r => setTimeout(r, 5000));
         attempts++;
         
         const statusRes = await coreApi.get(`/app-builder/build/${buildId}/status`, { requireAuth: true });
         
         if (statusRes.status === 'success') {
             isComplete = true;
             setBuildProgress(100);
             setBuildStatus('completed');

              let downloadUrl = statusRes.downloadUrl;
              if (downloadUrl && !downloadUrl.startsWith('http')) {
                   // Construct full URL pointing to backend
                   const backendUrl = import.meta.env.VITE_CORE_API_URL || CORE_ROOT_URL || `https://${secondaryDomain}/api`;
                   const backendRoot = backendUrl.replace(/\/api\/?$/, '');
                   downloadUrl = `${backendRoot}${downloadUrl}`;
              }
              
              // Ensure we have a direct absolute URL
              if (downloadUrl && downloadUrl.startsWith('/')) {
                downloadUrl = window.location.origin + downloadUrl;
              }

              setApkDownloadUrl(downloadUrl);
             
             toast({
                title: t('appBuilder.buildSuccess', 'App Build Successful!'),
                description: t('appBuilder.downloadReady', 'Your Android APK is ready for download.'),
             });
         } else if (statusRes.status === 'failed') {
             isComplete = true;
             setBuildStatus('failed');
             throw new Error(statusRes.error || 'Server reported build failure');
         } else {
             // Update progress from server or simulate slow progress
             setBuildProgress(statusRes.progress || Math.min(90, 10 + attempts));
         }
      }
      
      if (!isComplete) {
         throw new Error('Build timed out');
      }

    } catch (error: unknown) {
      console.error('Build failed:', error);
      setBuildStatus('failed');
      const errorMessage = error instanceof Error ? error.message : 'Could not start the build process.';
      toast({
        variant: 'destructive',
        title: 'Build Failed',
        description: errorMessage,
      });
    }
  };

  const handleCopyStoreUrl = () => {
     const params = new URLSearchParams();
     params.set('platform', 'mobile');
     if (tenantId) params.set('tenantId', tenantId);
     const url = `${window.location.protocol}//${window.location.host}/${window.location.hostname.startsWith('192.168.') ? '' : 'store'}?${params.toString()}`;
     navigator.clipboard.writeText(url);
     toast({
        title: 'Link Copied',
        description: 'Mobile store URL copied to clipboard.',
     });
  };

  const handleOpenStoreUrl = () => {
     const params = new URLSearchParams();
     params.set('platform', 'mobile');
     if (tenantId) params.set('tenantId', tenantId);
     window.open(`${window.location.protocol}//${window.location.host}/${window.location.hostname.startsWith('192.168.') ? '' : 'store'}?${params.toString()}`, '_blank');
   };

   const getIframeUrl = () => {
    const params = new URLSearchParams();
    params.set('platform', 'preview');
    const tid = tenantId || getMobileTenantId() || '';
    if (tid) params.set('tenantId', tid);
    
    let path = '/';
    switch (activeScreen) {
      case 'home': path = '/'; break;
      case 'categories': path = '/categories'; break;
      case 'cart': path = '/cart'; break;
      case 'profile': path = '/profile'; break;
      case 'products': path = '/products'; break;
      case 'checkout': path = '/checkout'; break;
      case 'orders': path = '/account/orders'; break;
      case 'wishlist': path = '/wishlist'; break;
      case 'wallet': path = '/wallet'; break;
      case 'inventory': path = '/account/inventory'; break;
      case 'settings': path = '/account/profile'; break;
      default: path = '/'; break;
    }
    
    if (!path.startsWith('/')) path = '/' + path;
    
    const baseUrl = `${window.location.protocol}//${window.location.host}${window.location.hostname.startsWith('192.168.') ? '' : '/store'}`;
    return `${baseUrl}${path}?${params.toString()}`;
  };

  // Render the phone content
  const renderScreenContent = () => {
    // Check for custom pages first
    const customPages = (config.customPages as AppPage[]) || [];
    const customPage = customPages.find((p: AppPage) => p.id === activeScreen || p.route === activeScreen);
    

    if (customPage) {
       return (
          <div className='flex-1 overflow-y-auto no-scrollbar pt-6 pb-20 px-4 bg-gray-50/50'>
             <div className='flex items-center gap-3 mb-6'>
                <Button variant='ghost' size='icon' className='h-8 w-8 rounded-full bg-white shadow-sm' onClick={() => setActiveScreen('profile')}>
                   <ArrowLeft className={cn('w-4 h-4', isRTL && 'rotate-180')} />
                </Button>
                <h2 className='text-xl font-bold'>{isRTL ? customPage.titleAr : customPage.title}</h2>
             </div>
             
             <div className='bg-white p-4 rounded-xl shadow-sm border border-gray-100 min-h-[50vh]'>
                {(isRTL ? customPage.contentAr : customPage.content) ? (
                   <div 
                      dir={isRTL ? 'rtl' : 'ltr'}
                      className={cn('prose prose-sm max-w-none dark:prose-invert', isRTL && 'text-right')}
                      dangerouslySetInnerHTML={{ __html: (isRTL ? customPage.contentAr || customPage.content : customPage.content) || '' }} 
                   />
                ) : (
                   <div className='flex flex-col items-center justify-center h-40 text-muted-foreground opacity-50'>
                      <FileText className='w-10 h-10 mb-2' />
                      <p>{t('appBuilder.noContent')}</p>
                   </div>
                )}
             </div>
          </div>
       );
    }

    // Generic Stitch Rendering Logic
    const stitchImage = config.stitchScreens?.[activeScreen];
    const isEditingStitch = config.stitchEditMode?.[activeScreen];

    if (stitchImage || isEditingStitch) {
      const stitchData = {
        products: (useRealData ? realProducts : MOCK_PRODUCTS) as Product[],
        categories: (useRealData ? realCategories : MOCK_CATEGORIES) as unknown as Category[],
        brands: realBrands as Brand[]
      };

      switch (activeScreen) {
        case 'home': return <StitchHomeContent config={config} isRTL={isRTL} data={stitchData} />;
        case 'wallet': return <StitchWalletContent config={config} isRTL={isRTL} />;
        case 'profile': return <StitchProfileContent config={config} isRTL={isRTL} />;
        case 'categories': return <StitchCategoriesContent config={config} isRTL={isRTL} categories={stitchData.categories} />;
        case 'product': return <StitchProductContent config={config} isRTL={isRTL} product={stitchData.products[0]} />;
        case 'cart': return <StitchCartContent config={config} isRTL={isRTL} items={stitchData.products.slice(0, 2)} />;
        case 'splash': return <StitchSplashContent config={config} isRTL={isRTL} />;
      }
    }

    // --- GENERIC SECTION RENDERING (User Customization) ---
    // If ANY page has sections defined via the builder, render them here.
    // This allows overriding system pages (Home, Cart, Profile) with custom sections.
    const builderSections = getCurrentSections();
    if (builderSections && builderSections.length > 0) {
         const isDark = config.theme === 'dark';
         return (
            <div className={cn('flex-1 overflow-y-auto no-scrollbar pb-24', isDark ? 'bg-transparent' : 'bg-gray-50/50')}>
                <div className='flex flex-col gap-0'>
                    {builderSections.map((section: MobileSection, index: number) => (
                        <MobileSectionRenderer key={section.id || index} section={section} config={config} />
                    ))}
                </div>
            </div>
         );
    }

    switch (activeScreen) {
      case 'home': {
        const isDark = config.theme === 'dark';
        
        // --- FALLBACK DESIGN (If no sections defined) ---
        return (
          <div className={cn('flex-1 overflow-y-auto no-scrollbar pb-24', isDark ? 'bg-transparent' : 'bg-gray-50/50')}>
             {/* Dynamic Greeting */}
            <div className='bg-white px-4 py-4 border-b flex items-center justify-between sticky top-0 z-10 shadow-sm'>
                <div className='flex items-center gap-2'>
                   {(config.logo || config.storeLogo) ? (
                     <img src={config.logo || config.storeLogo || ''} alt='Logo' className='w-8 h-8 object-contain' />
                   ) : <div className='w-8 h-8 bg-primary/10 rounded flex items-center justify-center text-primary font-bold text-xs'>{(config.storeName || config.appName || 'A').charAt(0).toUpperCase()}</div>}
                </div>
                
                <div className='flex-1 flex justify-center mx-2'>
                   <div className='px-4 py-1.5 bg-gray-50 rounded-full flex items-center gap-2 border border-blue-50/50 shadow-sm'>
                      <span className='text-sm font-black text-gray-800 tracking-tight'>4150.80</span>
                      <div className='w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center'>
                         <CreditCard className='w-3 h-3 text-white' />
                      </div>
                   </div>
                </div>

                <div className='flex items-center gap-3'>
                   <div className='relative'>
                     <BellIcon className='w-5 h-5 text-gray-400' />
                     <span className='absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm'></span>
                   </div>
                   <div className='w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500 border border-gray-100'>U</div>
                </div>
             </div>

            <div className={cn('px-5 py-6', isRTL ? 'text-right' : 'text-left')}>
               <span className={cn('text-[10px] font-black uppercase tracking-[0.2em] opacity-40', isDark ? 'text-white' : 'text-gray-900')}>
                  {config.userName ? (isRTL ? `مرحباً بك، ${config.userName.split(' ')[0]}` : `Welcome back, ${config.userName.split(' ')[0]}`) : (isRTL ? 'مرحباً بك' : 'Welcome to Store')}
               </span>
               <h2 className={cn('text-2xl font-black mt-1', isDark ? 'text-white' : 'text-gray-900')}>
                  {config.storeName || config.appName}
               </h2>
            </div>

            {/* Banner preview */}
            {config.showBanner && (
               <div 
                  className={cn(
                    'px-4 mb-8 transition-all duration-200 cursor-pointer border-2 py-1',
                    selectedSection === 'banner' ? 'border-primary bg-primary/5' : 'border-transparent'
                  )}
                  onClick={() => handleSectionClick('banner')}
               >
                  <div 
                    className='w-full aspect-[2/1] rounded-3xl relative overflow-hidden shadow-xl group'
                    style={{ 
                      background: config.bannerImage ? `url(${config.bannerImage}) center/cover no-repeat` : `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`
                    }}
                  >
                    {!config.bannerImage && (
                       <div className='absolute inset-0 bg-black/10 mix-blend-overlay' />
                    )}
                    <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex flex-col justify-end p-6'>
                       <div className={cn(
                         'transition-all duration-500 transform translate-y-0',
                         config.enableGlassEffect && 'bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-lg'
                       )}>
                          <h3 className='font-black text-2xl text-white mb-1 leading-tight drop-shadow-md'>
                            {isRTL ? config.bannerTextAr : config.bannerText}
                          </h3>
                          <p className='text-white/90 text-xs font-medium uppercase tracking-wider mb-3 drop-shadow'>
                            {isRTL ? config.bannerSubtextAr : config.bannerSubtext}
                          </p>
                          <Button 
                            size='sm' 
                            className='bg-white text-black hover:bg-white/90 border-0 h-8 text-xs font-bold rounded-full px-4 shadow-xl'
                          >
                            {t('appBuilder.shopNow')}
                          </Button>
                       </div>
                    </div>
                  </div>
               </div>
            )}

            {/* Categories */}
            {config.showCategories && (
              <div 
                className={cn(
                  'mb-8 transition-all duration-200 cursor-pointer border-2 py-2',
                  selectedSection === 'categories' ? 'border-primary bg-primary/5' : 'border-transparent'
                )}
                onClick={() => handleSectionClick('categories')}
              >
                <div className='px-4 flex items-center justify-between mb-4'>
                  <h3 className={cn('font-bold text-lg', isDark ? 'text-white' : 'text-gray-900')}>
                    {isRTL ? config.categoriesTitleAr : config.categoriesTitle}
                  </h3>
                   <Button variant='ghost' size='sm' className={cn('text-xs h-6', isDark ? 'text-white/70' : 'text-gray-500')}>
                     {t('appBuilder.viewAll')}
                     <ChevronRight className={cn('w-3 h-3 ml-1', isRTL && 'rotate-180')} />
                   </Button>
                </div>
                
                <div className='overflow-x-auto pb-4 px-4 no-scrollbar'>
                  <div className='flex gap-4 min-w-max'>
                     {(useRealData && realCategories.length > 0 ? realCategories.slice(0, 5) : [1, 2, 3, 4, 5]).map((cat, idx) => {
                       const catData = cat as Category;
                       const catId = typeof cat === 'object' ? catData.id : `cat-${cat}`;
                       const isReal = typeof cat === 'object';
                       const name = isReal ? catData.nameAr || catData.name : `Category ${cat}`;
                       const img = isReal ? catData.image : null;
                       
                       return (
                         <div 
                           key={catId} 
                           className='flex flex-col items-center gap-2.5 shrink-0 cursor-pointer group'
                           onClick={(e) => {
                             e.stopPropagation();
                             setSelectedCategoryId(catId);
                             setActiveScreen('category-products');
                           }}
                         >
                            <div className={cn(
                               'w-14 h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center p-2 group-hover:shadow-md transition-shadow',
                               config.enableGlassEffect 
                                  ? 'bg-white/5 border border-white/20 backdrop-blur-xl shadow-[0_0_20px_rgba(255,255,255,0.05)]' 
                                  : 'bg-white border text-gray-900 shadow-sm'
                            )}>
                               {img ? (
                                  <img src={img} className='w-full h-full object-contain' alt='' />
                               ) : (
                                  <div className='w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-full'>
                                     <Zap className='w-8 h-8 text-gray-300' />
                                  </div>
                               )}
                            </div>
                            <span className={cn(
                               'text-[10px] font-medium text-gray-600 truncate w-14 text-center',
                               isDark ? 'text-white/40 group-hover:text-white' : 'text-gray-600'
                            )}>
                               {name}
                            </span>
                         </div>
                       );
                     })}
                  </div>
                </div>
              </div>
            )}
            
            {/* Products Grid fallback */}
            {config.showFeatured && (
               <div 
                  className={cn(
                    'px-4 transition-all duration-200 cursor-pointer border-2 py-2',
                    selectedSection === 'featured' ? 'border-primary bg-primary/5' : 'border-transparent'
                  )}
                  onClick={() => handleSectionClick('featured')}
                >
                  <div className={cn('flex justify-between items-center mb-5 px-1', isRTL && 'flex-row-reverse')}>
                    <div className='flex items-center gap-2'>
                       <h3 className={cn('font-bold text-lg', isDark ? 'text-white' : 'text-gray-900')}>
                         {isRTL ? config.featuredTitleAr : config.featuredTitle}
                       </h3>
                       <div className='w-1.5 h-6 bg-blue-600 rounded-full'></div>
                    </div>
                  </div>
                  
                  <div className='grid grid-cols-2 gap-4'>
                    {(useRealData && realProducts.length > 0 ? realProducts : (MOCK_PRODUCTS as Product[])).slice(0, 4).map((product: Product) => {
                      const pName = product.nameAr || product.name || (isRTL ? 'منتج مميز' : 'Premium Product');
                      const pPriceValue = product.price || 99;
                      
                      return (
                        <div 
                          key={product.id} 
                          className={cn(
                            'group rounded-2xl overflow-hidden transition-all duration-300 border-2 border-transparent hover:border-primary/20',
                            isDark 
                              ? 'bg-white/5 border border-white/10 backdrop-blur-md' 
                              : 'bg-white shadow-sm border border-gray-100'
                          )}
                          onClick={() => setActiveScreen('product')}
                        >
                           <div className='aspect-square bg-gray-100 relative overflow-hidden'>
                              <img src={product.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'} className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-700' alt='' />
                              <button className='absolute top-2 right-2 p-1.5 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white hover:text-red-500 transition-colors'>
                                 <Heart className='w-3.5 h-3.5' />
                              </button>
                           </div>
                           <div className='p-3'>
                              <h4 className={cn('font-bold text-xs mb-1 line-clamp-1', isDark ? 'text-white' : 'text-gray-900')}>{pName}</h4>
                              <div className='flex flex-col gap-2 mt-2'>
                                 <div className='flex flex-col'>
                                    <span className='text-[8px] text-gray-400 uppercase font-black'>{isRTL ? 'السعر' : 'Price'}</span>
                                    <span className={cn('text-xs font-bold', isDark ? 'text-purple-400' : 'text-primary')} style={{ color: isDark ? undefined : config.primaryColor }}>{pPriceValue} {config.currency || 'SAR'}</span>
                                 </div>
                                 <button 
                                   className={cn(
                                     'w-full h-8 rounded-xl flex items-center justify-center gap-2 transition-colors text-[10px] font-bold text-white',
                                     isDark ? 'bg-indigo-600' : 'bg-blue-600'
                                   )}
                                   style={{ backgroundColor: isDark ? undefined : config.primaryColor }}
                                 >
                                    <Plus className='w-3 h-3' />
                                    {isRTL ? 'إضافة' : 'Add'}
                                 </button>
                              </div>
                           </div>
                        </div>
                      );
                    })}
                  </div>
               </div>
            )}

            {/* Quick Services (Quick Actions) - Matching MobileHome.tsx */}
            <div className='px-4 mb-8 mt-6'>
               <div className='flex justify-between items-center mb-5 px-1'>
                  <div className='flex items-center gap-2'>
                     <h3 className={cn('font-bold text-lg', isDark ? 'text-white' : 'text-gray-900')}>
                       {isRTL ? 'خدمات سريعة' : 'Quick Services'}
                     </h3>
                     <div className='w-1.5 h-6 bg-blue-600 rounded-full'></div>
                  </div>
               </div>
               <div className='grid grid-cols-3 gap-4'>
                  {[
                     { icon: Box, labelAr: 'المخزون', label: 'Inventory' },
                     { icon: Package, labelAr: 'طلباتي', label: 'Orders' },
                     { icon: Wallet, labelAr: 'المحفظة', label: 'Wallet' },
                  ].map((item, idx) => (
                     <div key={idx} className={cn('flex flex-col items-center gap-2.5 p-4 rounded-3xl border transition-all active:scale-95 cursor-pointer', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-50 shadow-sm')}>
                        <div className='w-12 h-12 rounded-2xl flex items-center justify-center' style={{ backgroundColor: `${config.primaryColor}15`, color: config.primaryColor }}>
                           <item.icon className='w-6 h-6' />
                        </div>
                        <span className={cn('text-[10px] font-bold', isDark ? 'text-gray-400' : 'text-gray-500')}>{isRTL ? item.labelAr : item.label}</span>
                     </div>
                  ))}
               </div>
            </div>
          </div>
        );
      }
  


      case 'product':
        return (
          <div className='flex-1 overflow-y-auto no-scrollbar pb-20 bg-gray-50/50'>
             <div className='bg-white h-[350px] relative'>
                <div className='absolute top-4 left-4 z-10'>
                   <Button variant='secondary' size='icon' className='rounded-full backdrop-blur-md bg-white/50 hover:bg-white' onClick={() => setActiveScreen('home')}>
                      <ArrowLeft className={cn('w-4 h-4', isRTL && 'rotate-180')} />
                   </Button>
                </div>
                <img src='https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80' className='w-full h-full object-cover' alt='Product' />
             </div>
             
             <div className='-mt-6 relative z-10 bg-white rounded-t-3xl p-6 shadow-sm min-h-[400px]'>
                <div className='flex justify-between items-start mb-4'>
                   <div>
                      <h2 className='text-2xl font-bold text-gray-900 mb-1'>{isRTL ? 'سماعات فاخرة' : 'Premium Wireless Headphones'}</h2>
                      <div className='flex items-center gap-2'>
                         <div className='flex text-yellow-400'>
                            <Star className='w-4 h-4 fill-current' />
                            <Star className='w-4 h-4 fill-current' />
                            <Star className='w-4 h-4 fill-current' />
                            <Star className='w-4 h-4 fill-current' />
                            <Star className='w-4 h-4 fill-current' />
                         </div>
                         <span className='text-xs text-gray-500'>(128 reviews)</span>
                      </div>
                   </div>
                   <span className='text-2xl font-bold' style={{ color: config.primaryColor }}>$187.50</span>
                </div>
                
                <div className='space-y-6'>
                   <div>
                      <h3 className='font-bold mb-3'>{isRTL ? 'اللون' : 'Color'}</h3>
                      <div className='flex gap-3'>
                         {['#111', '#555', '#999'].map(c => (
                            <div key={c} className='w-8 h-8 rounded-full border-2 border-white ring-1 ring-gray-200 shadow-sm' style={{ backgroundColor: c }} />
                         ))}
                      </div>
                   </div>
                   
                   <div>
                      <h3 className='font-bold mb-2'>{isRTL ? 'الوصف' : 'Description'}</h3>
                      <p className='text-gray-500 leading-relaxed text-sm'>
                         {isRTL 
                           ? 'استمتع بجودة صوت استثنائية مع هذه السماعات اللاسلكية. تتميز بإلغاء الضوضاء وعمر بطارية طويل وتصميم مريح للاستخدام طوال اليوم.'
                           : 'Experience exceptional sound quality with these premium wireless headphones. Featuring active noise cancellation, long battery life, and a comfortable design for all-day wear.'}
                      </p>
                   </div>
                </div>
             </div>
             
             <div className='fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 flex items-center gap-3 w-[320px] mx-auto rounded-b-[35px]'>
                <Button variant='outline' size='icon' className='h-12 w-12 rounded-xl border-gray-200'>
                   <Heart className='w-5 h-5' />
                </Button>
                <Button className='flex-1 h-12 rounded-xl font-bold shadow-lg' style={{ backgroundColor: config.primaryColor }}>
                   {isRTL ? 'أضف للسلة' : 'Add to Cart'}
                </Button>
             </div>
          </div>
        );

      case 'cart':
        return (
          <div className='flex-1 overflow-y-auto no-scrollbar pt-6 pb-20 px-4 bg-gray-50/50'>
             <h2 className='text-2xl font-bold mb-6'>{getPageTitle('cart', isRTL)}</h2>
             
             <div className='space-y-4 mb-8'>
                {[1, 2].map(i => (
                   <div key={i} className='bg-white p-3 rounded-2xl flex gap-3 shadow-sm border border-gray-100'>
                      <div className='w-20 h-20 bg-gray-100 rounded-xl overflow-hidden shrink-0'>
                         <img src={MOCK_PRODUCTS[i-1].image} className='w-full h-full object-cover' alt='' />
                      </div>
                      <div className='flex-1 flex flex-col justify-between py-1'>
                         <div className='flex justify-between items-start'>
                            <h4 className='font-bold text-sm line-clamp-1'>{isRTL ? MOCK_PRODUCTS[i-1].nameAr : MOCK_PRODUCTS[i-1].name}</h4>
                            <button className='text-gray-400 hover:text-red-500'>
                               <Trash2 className='w-4 h-4' />
                            </button>
                         </div>
                         <div className='flex justify-between items-end'>
                            <span className='font-bold text-primary' style={{ color: config.primaryColor }}>{MOCK_PRODUCTS[i-1].price}</span>
                            <div className='flex items-center gap-3 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100'>
                               <button className='w-4 h-4 flex items-center justify-center font-bold'>-</button>
                               <span className='text-xs font-bold'>1</span>
                               <button className='w-4 h-4 flex items-center justify-center font-bold'>+</button>
                            </div>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
             
             <div className='bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-3'>
                <div className='flex justify-between text-sm'>
                   <span className='text-gray-500'>{isRTL ? 'المجموع الفرعي' : 'Subtotal'}</span>
                   <span className='font-bold'>.00</span>
                </div>
                <div className='flex justify-between text-sm'>
                   <span className='text-gray-500'>{isRTL ? 'الضريبة' : 'Tax'}</span>
                   <span className='font-bold'>.00</span>
                </div>
                <Separator />
                <div className='flex justify-between text-lg font-bold'>
                   <span>{isRTL ? 'المجموع' : 'Total'}</span>
                   <span style={{ color: config.primaryColor }}>.00</span>
                </div>
                
                <Button className='w-full h-12 rounded-xl mt-4 font-bold shadow-lg' style={{ backgroundColor: config.primaryColor }}>
                   {isRTL ? 'إتمام الطلب' : 'Checkout'}
                </Button>
             </div>
          </div>
        );

      case 'profile':
        return (
          <div className='flex-1 overflow-y-auto no-scrollbar bg-gray-50/50 pb-20'>
             <div className='pt-10 pb-6' style={{ backgroundColor: config.primaryColor }}>
                <div className='flex flex-col items-center gap-3 text-white'>
                   <div className='w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center text-2xl font-bold shadow-xl'>
                      U
                   </div>
                   <div className='text-center'>
                      <h2 className='font-bold text-lg'>{config.userName || getPageTitle('profile', isRTL)}</h2>
                      <p className='text-white/80 text-sm'>{config.storeName ? `${config.storeName.toLowerCase().replace(/\s+/g, '')}@store.com` : 'user@example.com'}</p>
                   </div>
                </div>
             </div>
             
             <div className='px-4 -mt-6'>
                <div className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden'>
                   {[
                      { icon: Box, label: isRTL ? 'طلباتي' : 'My Orders', onClick: () => setActiveScreen('orders') },
                      { icon: Heart, label: isRTL ? 'المفضلة' : 'Wishlist', onClick: () => setActiveScreen('wishlist') },
                      { icon: MapPin, label: isRTL ? 'عناويني' : 'Addresses', onClick: () => setActiveScreen('addresses') },
                      { icon: CreditCard, label: isRTL ? 'المحفظة' : 'Wallet', onClick: () => setActiveScreen('payment') },
                   ].map((item, i) => (
                      <div 
                        key={i} 
                        className='flex items-center gap-4 p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors'
                        onClick={item.onClick}
                      >
                         <div className='w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600'>
                            <item.icon className='w-5 h-5' />
                         </div>
                         <div className='flex-1 font-medium text-gray-700'>{item.label}</div>
                         <ChevronRight className={cn('w-4 h-4 text-gray-400', isRTL && 'rotate-180')} />
                      </div>
                   ))}
                </div>
                
                <div className='mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6'>
                   {[
                      { icon: Settings, label: isRTL ? 'الإعدادات' : 'Settings', onClick: () => setActiveScreen('settings') },
                      { icon: HelpCircle, label: isRTL ? 'الدعم والمساعدة' : 'Support', onClick: () => setActiveScreen('support') },
                      { icon: LogOut, label: isRTL ? 'تسجيل الخروج' : 'Log Out', className: 'text-red-500', onClick: () => {} },
                   ].map((item, i) => (
                      <div 
                        key={i} 
                        className={cn('flex items-center gap-4 p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors', item.className)}
                        onClick={item.onClick}
                      >
                         <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', item.className ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-600')}>
                            <item.icon className='w-5 h-5' />
                         </div>
                         <div className='flex-1 font-medium'>{item.label}</div>
                         <ChevronRight className={cn('w-4 h-4 text-gray-400', isRTL && 'rotate-180')} />
                      </div>
                   ))}
                </div>
             </div>
          </div>
        );

      case 'orders':
        return (
             <div className='flex-1 overflow-y-auto no-scrollbar bg-gray-50/50 pb-20'>
                <MobileSectionRenderer 
                    section={{ 
                        id: 'default-orders', 
                        type: 'customer-orders', 
                        props: { 
                            title: 'My Orders', 
                            titleAr: 'طلباتي' 
                        } 
                    }} 
                    config={config} 
                />
             </div>
        );

      case 'inventory':
      case 'inventory-page':
         return (
             <div className='flex-1 overflow-y-auto no-scrollbar bg-gray-50/50 pb-20'>
                <MobileSectionRenderer 
                    section={{ 
                        id: 'default-inventory', 
                        type: 'inventory-page', 
                        props: { 
                            title: 'My Inventory', 
                            titleAr: 'مخزوني' 
                        } 
                    }} 
                    config={config} 
                />
             </div>
        );

      case 'categories':
           return (
              <div className='flex-1 overflow-y-auto no-scrollbar pt-4 pb-20 px-4 bg-white'>
                 <div className={cn('mb-6', isRTL && 'text-right')}>
                   <h2 className='text-2xl font-black text-gray-900 mb-6'>{getPageTitle('categories', isRTL)}</h2>
                   <div className='bg-gray-100 h-12 rounded-2xl flex items-center px-4 gap-3'>
                      <Search className='w-4 h-4 text-gray-400' />
                      <span className='text-xs text-gray-400'>{isRTL ? 'البحث عن قسم...' : 'Search for a category...'}</span>
                   </div>
                 </div>

                 <div className='grid grid-cols-2 gap-4'>
                    {(useRealData && realCategories.length > 0 ? realCategories : MOCK_CATEGORIES as unknown as Category[]).map((cat: Category) => {
                       const name = cat.nameAr || cat.name;
                       return (
                          <div key={cat.id} className='flex flex-col gap-3 group cursor-pointer'>
                             <div className='aspect-square rounded-3xl bg-white shadow-[0_8px_20px_rgba(0,0,0,0.04)] border border-gray-50 flex items-center justify-center p-6 group-hover:scale-105 transition-transform'>
                                <div className='w-full h-full bg-gray-50 rounded-2xl flex items-center justify-center'>
                                   <Zap className='w-8 h-8 text-white' />
                                </div>
                             </div>
                             <h3 className='text-xs font-bold text-gray-700 text-center'>{name}</h3>
                          </div>
                       );
                    })}
                 </div>
              </div>
           );

      case 'wallet':
        return (
           <div className='flex-1 flex flex-col items-center justify-center p-8 bg-gray-50/50'>
              <CreditCard className='w-16 h-16 text-gray-300 mb-4' />
              <h3 className='text-lg font-bold text-gray-700'>{getPageTitle('wallet', isRTL)}</h3>
              <p className='text-sm text-gray-500 text-center mt-2'>{isRTL ? 'تابع معاملاتك ورصيدك من هنا' : 'Track your transactions and balance here'}</p>
              <Button 
                variant='outline' 
                className='mt-6 rounded-xl'
                onClick={() => setActiveScreen('home')}
              >
                {t('appBuilder.backToHome')}
              </Button>
           </div>
        );

       case 'checkout':
         return (
            <div className='flex-1 flex flex-col overflow-y-auto no-scrollbar bg-gray-50/50 pb-20'>
               <div className='p-4 border-b bg-white sticky top-0 z-20 flex items-center gap-3'>
                   <Button variant='ghost' size='icon' className='h-8 w-8' onClick={() => setActiveScreen('cart')}>
                      <ArrowLeft className={cn('w-4 h-4', isRTL && 'rotate-180')} />
                   </Button>
                   <h2 className='font-bold'>{getPageTitle('checkout', isRTL)}</h2>
               </div>

               <div className='p-4 space-y-6'>
                  {/* Delivery Info */}
                  <div className='bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-3'>
                     <div className='flex items-center gap-2 text-primary font-bold text-sm'>
                        <MapPin className='w-4 h-4' />
                        {isRTL ? 'عنوان التوصيل' : 'Delivery Address'}
                     </div>
                     <div className='p-3 bg-gray-50 rounded-lg border border-dashed border-gray-200'>
                        <p className='text-xs text-gray-600'>{isRTL ? 'أضف عنواناً للتوصيل...' : 'Add delivery address...'}</p>
                     </div>
                  </div>

                  {/* Payment Method */}
                  <div className='bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-3'>
                     <div className='flex items-center gap-2 text-primary font-bold text-sm'>
                        <CreditCard className='w-4 h-4' />
                        {isRTL ? 'طريقة الدفع' : 'Payment Method'}
                     </div>
                     <div className='space-y-2'>
                        {['Cash on Delivery', 'Digital Wallet', 'Credit Card'].map((method, idx) => (
                           <div key={idx} className={cn('p-3 rounded-lg border flex items-center justify-between cursor-pointer', idx === 0 ? 'border-primary bg-primary/5' : 'border-gray-100 bg-white')}>
                              <span className='text-xs font-medium'>{method}</span>
                              {idx === 0 && <Check className='w-4 h-4 text-primary' />}
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Order Summary */}
                  <div className='bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-3'>
                     <h3 className='font-bold text-sm'>{isRTL ? 'ملخص الطلب' : 'Order Summary'}</h3>
                     <div className='space-y-2'>
                        <div className='flex justify-between text-xs text-gray-500'>
                           <span>{isRTL ? 'المجموع' : 'Subtotal'}</span>
                           <span>$299.00</span>
                        </div>
                        <div className='flex justify-between text-xs text-gray-500'>
                           <span>{isRTL ? 'التوصيل' : 'Shipping'}</span>
                           <span>$15.00</span>
                        </div>
                        <Separator />
                        <div className='flex justify-between text-base font-black'>
                           <span>{isRTL ? 'المجموع الكلي' : 'Total Amount'}</span>
                           <span style={{ color: config.primaryColor }}>$314.00</span>
                        </div>
                     </div>
                  </div>

                  <Button className='w-full h-12 rounded-xl font-bold shadow-lg' style={{ backgroundColor: config.primaryColor }}>
                     {isRTL ? 'تأكيد الطلب' : 'Confirm Order'}
                  </Button>
               </div>
            </div>
         );

      case 'login':
        return (
          <div className='flex-1 flex flex-col items-center justify-center p-8 bg-black relative overflow-hidden text-white'>
             <div className='absolute top-[-10%] right-[-10%] w-60 h-60 bg-purple-500/20 rounded-full blur-[100px]' />
             <div className='absolute bottom-[-10%] left-[-10%] w-40 h-40 bg-indigo-500/20 rounded-full blur-[80px]' />
             
             <div className='w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center mb-8 rotate-12'>
                <Zap className='w-10 h-10 text-white' />
             </div>
             
             <h2 className='text-3xl font-black tracking-tight mb-2'>{getPageTitle('login', isRTL)}</h2>
             <p className='text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-10'>Access your digital world</p>
             
             <div className='w-full space-y-4'>
                <div className='h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center px-4'>
                   <Mail className='w-5 h-5 text-white/20 mr-3' />
                   <span className='text-white/20 text-sm'>email@example.com</span>
                </div>
                <div className='h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center px-4'>
                   <Shield className='w-5 h-5 text-white/20 mr-3' />
                   <span className='text-white/20 text-sm'>••••••••</span>
                </div>
                
                <Button className='w-full h-14 mt-4 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl shadow-blue-500/20 rounded-2xl'>
                   {isRTL ? 'تسجيل الدخول' : 'Sign In Now'}
                </Button>
             </div>
          </div>
        );

      default:
        // Generic placeholders for other screens
        return (
          <div className='flex-1 flex items-center justify-center bg-gray-50 text-muted-foreground p-8 text-center'>
             <div>
                <Smartphone className='w-12 h-12 mx-auto mb-3 opacity-20' />
                <p className='text-sm'>Preview not available for {activeScreen}</p>
                <Button variant='link' className='mt-2' onClick={() => setActiveScreen('home')}>Back to Home</Button>
             </div>
          </div>
        );
    }
  };


  // Final content wrapper to handle splash overlay
  const renderPhoneContent = () => {
    if (splashActive && (config.splashEnabled || activeScreen === 'splash')) {
       const animationClass = {
          fade: 'animate-in fade-in duration-700',
          slide: 'animate-in slide-in-from-bottom duration-700',
          zoom: 'animate-in zoom-in duration-700',
          bounce: 'animate-in zoom-in duration-700 ease-bounce',
       }[config.splashAnimation || 'fade'];

       return (
          <div className={cn('absolute inset-0 z-50 fill-mode-forwards bg-white', animationClass)}>
             <div 
                className='w-full h-full flex flex-col items-center justify-center relative overflow-hidden' 
                style={{ backgroundColor: config.primaryColor }}
             >
                {config.splashImage ? (
                   <img src={config.splashImage} alt='Splash' className='w-full h-full object-cover absolute inset-0 z-0' />
                ) : (
                   <div className='z-10 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500'>
                       <div className='w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 text-white border border-white/30 shadow-inner'>
                          {config.logo || config.storeLogo ? (
                             <img src={config.logo || config.storeLogo || ''} alt='Logo' className='w-16 h-16 object-contain' />
                          ) : (
                            <Store className='w-10 h-10 text-white' />
                          )}
                       </div>
                       <h1 className='text-white text-3xl font-bold tracking-tight shadow-xl'>
                          {config.storeName || config.appName}
                       </h1>
                   </div>
                )}
                
                {/* Loader */}
                <div className='absolute bottom-12 z-10 flex flex-col items-center gap-2'>
                    <Loader2 className='w-8 h-8 text-white animate-spin opacity-80' />
                    <span className='text-white/60 text-[10px] font-medium uppercase tracking-[0.2em]'>{t('appBuilder.loading')}</span>
                </div>
             </div>
          </div>
       );
    }
    
    return (
       <div 
         className={cn(
           'flex-1 flex flex-col overflow-hidden transition-colors duration-500',
           config.theme === 'dark' ? 'text-white' : 'text-gray-900'
         )}
         style={{ backgroundColor: config.backgroundColor || (config.theme === 'dark' ? '#0f172a' : '#ffffff') }}
       >
          {renderScreenContent()}
       </div>
    );
  };

  return (
    <div className='flex flex-col h-[calc(100vh-theme(spacing.16))] bg-gray-50 overflow-hidden'>
      {/* Top Bar */}
      <div className='h-16 bg-white border-b px-4 sm:px-6 flex items-center justify-between shrink-0 z-30 shadow-sm'>
         <div className='flex items-center gap-2 sm:gap-4 overflow-hidden'>
            <Button 
               variant='ghost' 
               size='sm' 
               className='h-10 w-10 rounded-xl hover:bg-gray-100 hidden lg:flex' 
               onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            >
               {isSidebarCollapsed ? <Maximize2 className='w-5 h-5 text-gray-600' /> : <Layout className='w-5 h-5 text-gray-600' />}
            </Button>
            
            <div className='w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 shrink-0'>
               <Smartphone className='w-4 h-4 sm:w-5 sm:h-5' />
            </div>
            <div className='hidden xs:block whitespace-nowrap overflow-hidden'>
               <h1 className='font-bold text-sm sm:text-base leading-none truncate'>{t('appBuilder.title')}</h1>
               <p className='text-[10px] text-muted-foreground mt-1 truncate'>{t('appBuilder.subtitle')}</p>
            </div>
         </div>
         
         <div className='flex items-center gap-1.5 sm:gap-3 ml-2'>
             <div className='hidden lg:flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200 shrink-0'>
                <Button 
                   variant='ghost' 
                   size='sm' 
                   className={cn('h-7 text-[10px] rounded-md px-2', !isPreviewMode && 'bg-white shadow-sm font-bold')}
                   onClick={() => setIsPreviewMode(false)}
                >
                   <PenTool className='w-3 h-3 mr-1.5' />
                   {t('appBuilder.editor')}
                </Button>
                <Button 
                   variant='ghost' 
                   size='sm' 
                   className={cn('h-7 text-[10px] rounded-md px-2', isPreviewMode && 'bg-white shadow-sm font-bold')}
                   onClick={() => setIsPreviewMode(true)}
                >
                   <Eye className='w-3 h-3 mr-1.5' />
                   {t('appBuilder.preview')}
                </Button>
             </div>

             <div className='flex items-center gap-1 sm:gap-2'>
                <Button variant='outline' size='sm' onClick={handleSaveConfig} disabled={isSaving} className='h-8 sm:h-9 border-green-200 text-green-700 bg-green-50 hover:bg-green-100 px-2 sm:px-4 shrink-0 transition-all'>
                   {isSaving ? <Loader2 className='w-3.5 h-3.5 animate-spin' /> : <Save className='w-3.5 h-3.5 text-green-600' />}
                   <span className='hidden sm:inline ml-1.5 text-xs font-bold'>{t('common.save', 'Save')}</span>
                </Button>

                <Button className='h-8 sm:h-9 gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md px-2 sm:px-4 shrink-0 transition-all group' onClick={handlePublishApp}>
                   <Rocket className='w-3.5 h-3.5 text-white group-hover:scale-110 transition-transform' />
                   <span className='hidden md:inline uppercase text-[10px] sm:text-xs font-black tracking-tight'>{t('appBuilder.publishApp')}</span>
                </Button>
             </div>
         </div>
      </div>

      {/* Main Content Area */}
      <div className='flex-1 flex overflow-hidden'>
         
         {/* Editor Sidebar (Left/Right based on RTL) */}
          {!isPreviewMode && (
             <div 
               className={cn(
               'bg-white flex flex-col z-20 shadow-xl overflow-hidden relative transition-all duration-300',
               isRTL ? 'border-l' : 'border-r',
               isSidebarCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'opacity-100'
               )}
               style={{ width: isSidebarCollapsed ? '0px' : `${sidebarWidth}px`, flexShrink: 0 }}
             >
                {/* Resize Handle */}
                <div 
                  className={cn(
                     "absolute top-0 bottom-0 w-1.5 z-50 cursor-col-resize hover:bg-blue-500/50 hover:w-2 transition-all", 
                     isRTL ? "left-0 -translate-x-1/2" : "right-0 translate-x-1/2"
                  )}
                  onMouseDown={(e) => { e.preventDefault(); setIsResizing(true); }}
                />
               <Tabs value={activeTab} onValueChange={setActiveTab} className='flex-1 flex flex-col'>
                  <div className='px-4 pt-4 pb-2'>
                     <TabsList className='w-full flex bg-gray-200/50 p-1 rounded-xl shadow-inner gap-0.5 overflow-x-auto no-scrollbar'>
                        <TabsTrigger value='design' className='flex-1 rounded-lg text-[9px] sm:text-[10px] px-1 sm:px-2 h-8 data-[state=active]:bg-white shadow-none whitespace-nowrap gap-1.5'>
                           <Palette className='w-3 h-3' />
                           {t('appBuilder.design', 'Design')}
                        </TabsTrigger>
                        <TabsTrigger value='pages' className='flex-1 rounded-lg text-[9px] sm:text-[10px] px-1 sm:px-2 h-8 data-[state=active]:bg-white shadow-none whitespace-nowrap gap-1.5'>
                           <FileText className='w-3 h-3' />
                           {t('appBuilder.pages', 'Pages')}
                        </TabsTrigger>
                        <TabsTrigger value='content' className='flex-1 rounded-lg text-[9px] sm:text-[10px] px-1 sm:px-2 h-8 data-[state=active]:bg-white shadow-none whitespace-nowrap gap-1.5'>
                           <Layers className='w-3 h-3' />
                           {t('appBuilder.content', 'Content')}
                        </TabsTrigger>
                        <TabsTrigger value='ai' className='flex-1 rounded-lg text-[9px] sm:text-[10px] px-1 sm:px-2 h-8 data-[state=active]:bg-white shadow-none whitespace-nowrap gap-1.5'>
                           <Sparkles className='w-3 h-3 text-purple-500' />
                           {t('appBuilder.ai', 'AI')}
                        </TabsTrigger>
                        <TabsTrigger value='saved' className='flex-1 rounded-lg text-[9px] sm:text-[10px] px-1 sm:px-2 h-8 data-[state=active]:bg-white shadow-none whitespace-nowrap gap-1.5'>
                           <History className='w-3 h-3' />
                           {t('appBuilder.saved', 'Saved')}
                        </TabsTrigger>
                     </TabsList>
                  </div>
                  
                  <div className='flex-1 overflow-hidden flex flex-col relative min-h-0 bg-white/50'>
                     <TabsContent value='design' className='flex-1 h-full m-0 relative data-[state=active]:block overflow-hidden bg-white/50'>
                        <div className='absolute inset-0 w-full h-full overflow-y-auto custom-scrollbar'>
                           <div className='space-y-8 px-5 pt-6 pb-24 min-h-full'>
                           <div className='flex items-center justify-between'>
                               <h3 className='font-bold text-sm'>{t('appBuilder.designSettings')}</h3>
                               <div className='flex gap-2'>
                                  <Button 
                                    variant='outline' 
                                    size='sm' 
                                    className='h-8 text-xs gap-2 border-orange-100 bg-orange-50 text-orange-600 hover:bg-orange-100'
                                     onClick={() => {
                                       if (confirm(t('appBuilder.resetConfirm', 'Are you sure you want to reset all designs to default? Your store name and logo will be preserved.'))) {
                                         // Preserve store-specific settings while resetting design
                                         const preservedSettings = {
                                           storeName: config.storeName,
                                           storeLogo: config.storeLogo,
                                           appName: config.appName || config.storeName,
                                           logo: config.logo || config.storeLogo,
                                           currency: config.currency,
                                         };
                                         const resetConfig = {
                                           ...DEFAULT_CONFIG,
                                           ...preservedSettings,
                                           pages: getFilteredSystemPages(isDigital), // Reset pages to appropriate defaults
                                           customPages: [], // Clear custom pages
                                         };
                                         localStorage.setItem('app_builder_config', JSON.stringify(resetConfig));
                                         setConfig(resetConfig);
                                          toast({
                                             title: t('appBuilder.resetSuccess', 'Reset Complete'),
                                             description: t('appBuilder.resetSuccessDesc', 'All designs have been restored to their default state. Store settings preserved.'),
                                          });
                                       }
                                    }}
                                  >
                                    <RotateCcw className='w-3.5 h-3.5' />
                                    {t('appBuilder.resetToDefault')}
                                  </Button>

                                  <Button 
                                    variant='outline' 
                                    size='sm' 
                                    className='h-8 text-xs gap-2 border-blue-100 bg-blue-50 text-blue-600 hover:bg-blue-100'
                                    onClick={handleRestoreFromServer}
                                    disabled={isSyncing}
                                  >
                                    {isSyncing ? <Loader2 className='w-3 h-3 animate-spin' /> : <RotateCcw className='w-3.5 h-3.5' />}
                                    {t('appBuilder.syncWithServer', 'Restore Saved')}
                                  </Button>
                               </div>
                           </div>
                           <Separator />
                        
                        {/* 1. Template Style */}
                        <div className='space-y-4'>
                           <div className='flex items-center gap-2 mb-2'>
                              <div className='w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600'>
                                 <Layout className='w-4 h-4' />
                              </div>
                              <div>
                                 <h3 className='font-bold text-sm text-gray-900'>{t('appBuilder.templateStyle')}</h3>
                                 <p className='text-[10px] text-muted-foreground'>{t('appBuilder.templateStyleDesc')}</p>
                              </div>
                           </div>
                           
                           <div className='grid grid-cols-2 gap-3'>
                              {[
                                 { id: 'retail-pro', name: t('appBuilder.retailPro'), color: '#6366f1', gradient: 'from-blue-500 to-indigo-600' },
                                 { id: 'digital-market', name: t('appBuilder.digitalMarket'), color: '#10b981', gradient: 'from-emerald-500 to-teal-600' },
                                 { id: 'minimal-shop', name: t('appBuilder.minimalShop'), color: '#1f2937', gradient: 'from-gray-700 to-gray-900' },
                                 { id: 'grocery-go', name: t('appBuilder.groceryGo'), color: '#f97316', gradient: 'from-orange-500 to-red-500' },
                               ].map((template) => (
                                 <button
                                   key={template.id}
                                   className={cn(
                                     'relative h-24 rounded-xl overflow-hidden border-2 text-left transition-all group',
                                     config.themeId === template.id ? 'border-primary ring-2 ring-primary/20 shadow-lg scale-[1.02]' : 'border-white hover:border-gray-200 shadow-sm'
                                   )}
                                   onClick={() => {
                                     const preset = TEMPLATE_PRESETS[template.id];
                                     if (preset) setConfig(prev => ({ ...prev, themeId: template.id, ...preset }));
                                   }}
                                 >
                                   <div className={cn('absolute inset-0 bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity', template.gradient)} />
                                   <div className='absolute bottom-3 left-3 right-3 flex justify-between items-end'>
                                      <span className='font-bold text-[10px] uppercase tracking-wider text-gray-700'>{template.name}</span>
                                      <div className='w-4 h-4 rounded-full shadow-sm ring-1 ring-white' style={{ backgroundColor: template.color }} />
                                   </div>
                                 </button>
                               ))}
                           </div>
                        </div>

                        <Separator />

                        {/* 2. Brand Colors */}
                        <div className='space-y-4'>
                           <div className='flex items-center gap-2 mb-2'>
                              <div className='w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-pink-600'>
                                 <Palette className='w-4 h-4' />
                              </div>
                               <div>
                                 <h3 className='font-bold text-sm text-gray-900'>{t('appBuilder.brandColors')}</h3>
                                 <p className='text-[10px] text-muted-foreground'>{t('appBuilder.brandColorsDesc')}</p>
                               </div>
                           </div>
                           
                           <div className='grid grid-cols-2 gap-4'>
                              <div className='space-y-2'>
                                 <Label className='text-xs'>Primary</Label>
                                 <div className='flex gap-2 items-center'>
                                    <div className='relative'>
                                       <Input 
                                          type="color" 
                                          value={config.primaryColor} 
                                          onChange={(e) => setConfig({...config, primaryColor: e.target.value})}
                                          className='opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10' 
                                       />
                                       <div className='w-10 h-10 rounded-lg border shadow-sm cursor-pointer ring-offset-1 transition-transform hover:scale-105' style={{ backgroundColor: config.primaryColor }} />
                                    </div>
                                    <Input value={config.primaryColor} onChange={(e) => setConfig({...config, primaryColor: e.target.value})} className='h-10 font-mono text-xs uppercase' />
                                 </div>
                              </div>
                              <div className='space-y-2'>
                                 <Label className='text-xs'>Secondary</Label>
                                 <div className='flex gap-2 items-center'>
                                    <div className='relative'>
                                       <Input 
                                          type="color" 
                                          value={config.secondaryColor} 
                                          onChange={(e) => setConfig({...config, secondaryColor: e.target.value})}
                                          className='opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10' 
                                       />
                                       <div className='w-10 h-10 rounded-lg border shadow-sm cursor-pointer ring-offset-1 transition-transform hover:scale-105' style={{ backgroundColor: config.secondaryColor }} />
                                    </div>
                                    <Input value={config.secondaryColor} onChange={(e) => setConfig({...config, secondaryColor: e.target.value})} className='h-10 font-mono text-xs uppercase' />
                                 </div>
                              </div>
                           </div>
                        </div>

                        <Separator />

                        {/* 3. Global Styling */}
                        <div className='space-y-4'>
                           <div className='flex items-center gap-2 mb-2'>
                              <div className='w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600'>
                                 <Settings className='w-4 h-4' />
                              </div>
                               <div>
                                 <h3 className='font-bold text-sm text-gray-900'>{t('appBuilder.globalStyling')}</h3>
                                 <p className='text-[10px] text-muted-foreground'>{t('appBuilder.globalStylingDesc')}</p>
                               </div>
                           </div>

                           <div className='space-y-5 bg-white p-5 rounded-xl border border-gray-100 shadow-sm'>
                              <div className='flex items-center justify-between'>
                                  <Label className='text-xs flex flex-col'>
                                     <span className='font-bold'>{t('appBuilder.darkMode')}</span>
                                     <span className='text-[10px] text-muted-foreground font-normal'>{t('appBuilder.darkModeDesc')}</span>
                                  </Label>
                                 <Switch 
                                    checked={config.theme === 'dark'} 
                                    onCheckedChange={(c) => setConfig({...config, theme: c ? 'dark' : 'light', backgroundColor: c ? '#0f172a' : '#f9fafb'})} 
                                 />
                              </div>
                              
                              <Separator className='h-px bg-gray-50' />

                              <div className='flex items-center justify-between'>
                                  <Label className='text-xs flex flex-col'>
                                     <span className='font-bold'>{t('appBuilder.glassmorphism')}</span>
                                     <span className='text-[10px] text-muted-foreground font-normal'>{t('appBuilder.glassmorphismDesc')}</span>
                                  </Label>
                                 <Switch checked={config.enableGlassEffect} onCheckedChange={(c) => setConfig({...config, enableGlassEffect: c})} />
                              </div>

                              <Separator className='h-px bg-gray-50' />

                              <div className='space-y-3'>
                                  <div className='flex justify-between items-center'>
                                     <Label className='text-xs font-bold'>{t('appBuilder.fontFamily', 'Font Family')}</Label>
                                     <Badge variant='outline' className='text-[9px] font-mono text-blue-600'>{config.fontFamily}</Badge>
                                  </div>
                                  <Select value={config.fontFamily} onValueChange={(val) => setConfig({...config, fontFamily: val})}>
                                     <SelectTrigger className='h-9 text-xs'>
                                        <SelectValue />
                                     </SelectTrigger>
                                     <SelectContent>
                                        <SelectItem value='Inter'>Inter (System)</SelectItem>
                                        <SelectItem value='Cairo'>Cairo (Arabic Web)</SelectItem>
                                        <SelectItem value='Roboto'>Roboto (Pure)</SelectItem>
                                        <SelectItem value='Montserrat'>Montserrat (Heading)</SelectItem>
                                        <SelectItem value='Poppins'>Poppins (Modern)</SelectItem>
                                     </SelectContent>
                                  </Select>
                              </div>

                              <div className='space-y-4 pt-2'>
                                 <div className='space-y-3'>
                                    <div className='flex justify-between items-center'>
                                       <Label className='text-xs font-bold'>{t('appBuilder.cornerRadius', 'Corner Radius')}</Label>
                                       <span className='text-[10px] bg-gray-100 px-2 py-0.5 rounded'>{config.cornerRadius}</span>
                                    </div>
                                    <div className='grid grid-cols-3 gap-2'>
                                       {['0rem', '0.75rem', '1.5rem'].map((r, i) => (
                                          <button 
                                             key={r}
                                             className={cn(
                                                'h-8 border rounded-md text-[10px] transition-all',
                                                config.cornerRadius === r ? 'border-primary bg-primary/5 text-primary font-bold' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                             )}
                                             onClick={() => setConfig({...config, cornerRadius: r})}
                                          >
                                             {[t('appBuilder.sharp'), t('appBuilder.soft'), t('appBuilder.round')][i]}
                                          </button>
                                       ))}
                                    </div>
                                 </div>

                                 <div className='space-y-3'>
                                    <div className='flex justify-between items-center'>
                                       <Label className='text-xs font-bold'>{t('appBuilder.shadowIntensity', 'Shadows')}</Label>
                                       <span className='text-[10px] bg-gray-100 px-2 py-0.5 rounded uppercase'>{config.shadowIntensity}</span>
                                    </div>
                                    <div className='grid grid-cols-5 gap-1.5'>
                                       {['none', 'sm', 'md', 'lg', 'xl'].map((s) => (
                                          <button 
                                             key={s}
                                             className={cn(
                                                'h-8 border rounded-md text-[9px] transition-all uppercase',
                                                config.shadowIntensity === s ? 'border-primary bg-primary/5 text-primary font-bold' : 'border-gray-200 text-gray-400 hover:bg-gray-50'
                                             )}
                                             onClick={() => setConfig({...config, shadowIntensity: s as AppConfig['shadowIntensity']})}
                                          >
                                             {s}
                                          </button>
                                       ))}
                                    </div>
                                 </div>

                                 <div className='grid grid-cols-2 gap-5'>
                                    <div className='space-y-2'>
                                       <div className='flex justify-between items-center'>
                                          <Label className='text-xs font-bold'>{t('appBuilder.border', 'Border')}</Label>
                                          <span className='text-[9px]'>{config.borderWidth}px</span>
                                       </div>
                                       <Slider 
                                          value={[config.borderWidth || 0]} 
                                          max={4} 
                                          step={1} 
                                          onValueChange={(val) => setConfig({...config, borderWidth: val[0]})} 
                                        />
                                    </div>
                                    <div className='space-y-2'>
                                       <div className='flex justify-between items-center'>
                                          <Label className='text-xs font-bold'>{t('appBuilder.spacing', 'Spacing')}</Label>
                                          <span className='text-[9px]'>{config.sectionSpacing}px</span>
                                       </div>
                                       <Slider 
                                          value={[config.sectionSpacing || 16]} 
                                          max={40} 
                                          step={4} 
                                          onValueChange={(val) => setConfig({...config, sectionSpacing: val[0]})} 
                                       />
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>
                        
                        <Separator />
                        
                        {/* 5. Splash Screen Settings */}
                        <div className='space-y-4'>
                           <div className='flex items-center gap-2 mb-2'>
                              <div className='w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600'>
                                 <Smartphone className='w-4 h-4' />
                              </div>
                              <div>
                                 <h3 className='font-bold text-sm text-gray-900'>{isRTL ? 'شاشة البداية' : 'Splash Screen'}</h3>
                                 <p className='text-[10px] text-muted-foreground'>{isRTL ? 'تخصيص شاشة التحميل الأولى لتطبيقك' : 'Customize the loading screen of your app'}</p>
                              </div>
                           </div>
                           
                           {/* Enable/Disable Switch */}
                           <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                              <div>
                                 <Label className='text-xs font-bold'>{isRTL ? 'تفعيل شاشة البداية' : 'Enable Splash Screen'}</Label>
                                 <p className='text-[10px] text-muted-foreground'>{isRTL ? 'عرض شاشة التحميل عند بدء التطبيق' : 'Show loading screen on app start'}</p>
                              </div>
                              <Switch 
                                 checked={config.splashEnabled} 
                                 onCheckedChange={(val) => setConfig({...config, splashEnabled: val})}
                              />
                           </div>
                           
                           {config.splashEnabled && (
                              <div className='space-y-4'>
                                 {/* Splash Image Upload */}
                                 <div className='space-y-2'>
                                    <Label className='text-xs font-bold'>{isRTL ? 'صورة أو GIF' : 'Image or GIF'}</Label>
                                    <div className='flex gap-2 items-start'>
                                       <div className='flex-1'>
                                          <div className='relative border-2 border-dashed border-gray-200 rounded-xl p-4 hover:border-primary transition-colors cursor-pointer group'>
                                             <input 
                                                type="file" 
                                                accept="image/*,.gif"
                                                className='absolute inset-0 opacity-0 cursor-pointer'
                                                onChange={async (e) => {
                                                   const file = e.target.files?.[0];
                                                   if (file) {
                                                      try {
                                                         const response = await uploadService.uploadImage(file);
                                                         if (response.url) {
                                                            setConfig({...config, splashImage: response.url});
                                                            toast({ title: isRTL ? 'تم الرفع بنجاح' : 'Upload Success', description: isRTL ? 'تم رفع الصورة بنجاح' : 'Image uploaded successfully' });
                                                         }
                                                      } catch (err) {
                                                         toast({ title: isRTL ? 'خطأ في الرفع' : 'Upload Error', description: String(err), variant: 'destructive' });
                                                      }
                                                   }
                                                }}
                                             />
                                             {config.splashImage ? (
                                                <div className='relative'>
                                                   <img src={config.splashImage} alt='Splash' className='w-full h-32 object-cover rounded-lg' />
                                                   <Button 
                                                      variant='destructive' 
                                                      size='sm' 
                                                      className='absolute top-2 right-2 h-7 w-7 p-0'
                                                      onClick={(e) => { e.stopPropagation(); setConfig({...config, splashImage: null}); }}
                                                   >
                                                      <X className='w-4 h-4' />
                                                   </Button>
                                                </div>
                                             ) : (
                                                <div className='text-center py-4'>
                                                   <Upload className='w-8 h-8 mx-auto mb-2 text-gray-400 group-hover:text-primary transition-colors' />
                                                   <p className='text-xs text-gray-500'>{isRTL ? 'اسحب صورة أو اضغط للرفع' : 'Drop image or click to upload'}</p>
                                                   <p className='text-[10px] text-gray-400'>{isRTL ? 'يدعم PNG, JPG, GIF' : 'Supports PNG, JPG, GIF'}</p>
                                                </div>
                                             )}
                                          </div>
                                       </div>
                                    </div>
                                 </div>
                                 
                                 {/* Duration Slider */}
                                 <div className='space-y-2'>
                                    <div className='flex justify-between items-center'>
                                       <Label className='text-xs font-bold'>{isRTL ? 'مدة العرض' : 'Duration'}</Label>
                                       <span className='text-[10px] bg-gray-100 px-2 py-0.5 rounded'>{config.splashDuration || 3}s</span>
                                    </div>
                                    <Slider 
                                       value={[config.splashDuration || 3]} 
                                       min={1}
                                       max={10} 
                                       step={0.5} 
                                       onValueChange={(val) => setConfig({...config, splashDuration: val[0]})} 
                                    />
                                    <p className='text-[10px] text-muted-foreground'>{isRTL ? 'كم ثانية لعرض شاشة البداية' : 'How long to show splash screen'}</p>
                                 </div>
                                 
                                 {/* Animation Style */}
                                 <div className='space-y-2'>
                                    <Label className='text-xs font-bold'>{isRTL ? 'نوع الحركة' : 'Animation Style'}</Label>
                                    <div className='grid grid-cols-4 gap-2'>
                                       {[
                                          { id: 'fade', label: isRTL ? 'تلاشي' : 'Fade', icon: '✨' },
                                          { id: 'slide', label: isRTL ? 'انزلاق' : 'Slide', icon: '➡️' },
                                          { id: 'zoom', label: isRTL ? 'تكبير' : 'Zoom', icon: '🔍' },
                                          { id: 'bounce', label: isRTL ? 'ارتداد' : 'Bounce', icon: '🎈' },
                                       ].map((anim) => (
                                          <button 
                                             key={anim.id}
                                             className={cn(
                                                'h-16 border rounded-xl text-[10px] transition-all flex flex-col items-center justify-center gap-1',
                                                config.splashAnimation === anim.id ? 'border-primary bg-primary/5 text-primary font-bold ring-2 ring-primary/20' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                             )}
                                             onClick={() => setConfig({...config, splashAnimation: anim.id as AppConfig['splashAnimation']})}
                                          >
                                             <span className='text-lg'>{anim.icon}</span>
                                             <span>{anim.label}</span>
                                          </button>
                                       ))}
                                    </div>
                                 </div>
                                 
                                 {/* Preview Button */}
                                 <Button 
                                    variant='outline' 
                                    size='sm' 
                                    className='w-full h-9 text-xs gap-2 border-purple-100 bg-purple-50 text-purple-600 hover:bg-purple-100'
                                    onClick={() => {
                                       setHasShownSplash(false);
                                       const prevScreen = activeScreen;
                                       setActiveScreen('splash');
                                       setTimeout(() => setActiveScreen(prevScreen === 'splash' ? 'home' : (prevScreen || 'home')), (config.splashDuration || 3) * 1000);
                                    }}
                                 >
                                    <Eye className='w-4 h-4' />
                                    {isRTL ? 'معاينة شاشة البداية' : 'Preview Splash Screen'}
                                 </Button>
                              </div>
                           )}
                        </div>
                        </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value='pages' className='flex-1 h-full m-0 relative data-[state=active]:block overflow-hidden'>
                         <div className='absolute inset-0 w-full h-full overflow-y-auto custom-scrollbar'>
                          <div className='space-y-4 px-5 pt-6 pb-24 min-h-full'>
                           {/* Store Theme Colors Section */}
                           <div className='bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3'>
                               <div className='flex items-center justify-between mb-2'>
                                   <div>
                                       <h3 className='font-bold text-sm'>{isRTL ? 'ألوان المتجر الرئيسية' : 'Store Theme Colors'}</h3>
                                       <p className='text-[10px] text-muted-foreground'>{isRTL ? 'اختر لوحة الألوان الافتراضية لمتجرك' : 'Choose the default color palette for your store.'}</p>
                                   </div>
                               </div>
                               
                               <div className='grid grid-cols-2 gap-2 pt-1'>
                                   {[
                                       { name: isRTL ? 'الافتراضي' : 'Default', primary: '#7c3aed', secondary: '#4f46e5', bg: '#ffffff' },
                                       { name: isRTL ? 'أزرق محيطي' : 'Ocean Blue', primary: '#0ea5e9', secondary: '#0284c7', bg: '#f0f9ff' },
                                       { name: isRTL ? 'أخضر غابة' : 'Forest Green', primary: '#10b981', secondary: '#059669', bg: '#ecfdf5' },
                                       { name: isRTL ? 'برتقالي' : 'Sunset', primary: '#f97316', secondary: '#ea580c', bg: '#fff7ed' },
                                       { name: isRTL ? 'وردي' : 'Berry', primary: '#db2777', secondary: '#be185d', bg: '#fff1f2' },
                                       { name: isRTL ? 'ليلي' : 'Midnight', primary: '#6366f1', secondary: '#4f46e5', bg: '#0f172a', theme: 'dark' },
                                   ].map((palette, i) => (
                                       <div 
                                           key={i}
                                           onClick={() => setConfig({
                                               ...config,
                                               primaryColor: palette.primary,
                                               secondaryColor: palette.secondary,
                                               backgroundColor: palette.bg,
                                               theme: (palette.theme as AppConfig['theme']) || 'light'
                                           })}
                                          className={cn(
                                              'cursor-pointer flex items-center gap-2 p-2 rounded-lg border transition-all text-left bg-white shadow-sm hover:shadow-md',
                                              config.primaryColor === palette.primary ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : 'border-gray-100 hover:border-gray-300'
                                          )}
                                       >
                                           <div className='flex -space-x-1 shrink-0'>
                                               <div className='w-4 h-4 rounded-full border border-white shadow-sm' style={{ backgroundColor: palette.primary }} />
                                               <div className='w-4 h-4 rounded-full border border-white shadow-sm' style={{ backgroundColor: palette.secondary }} />
                                           </div>
                                           <span className='text-[10px] font-semibold text-gray-700 truncate'>{palette.name}</span>
                                       </div>
                                   ))}
                               </div>
                           </div>
                         {/* System Pages Section */}
                         <div className='bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3'>
                             <div className='flex items-center justify-between'>
                                 <div>
                                    <h3 className='font-bold text-sm'>{t('appBuilder.systemPages', 'System Pages')}</h3>
                                    <p className='text-[10px] text-muted-foreground'>{t('appBuilder.systemPagesDesc', 'Core app screens. Enable or disable as needed.')}</p>
                                 </div>
                             </div>
                            <div className='space-y-2'>
                                {DEFAULT_SYSTEM_PAGES.filter(p => p.type === 'system').map(page => {
                                   const configPage = (config.pages || []).find(cp => cp.id === page.id);
                                   const isEnabled = configPage ? configPage.enabled : page.enabled;
                                   const isHome = config.homePageSlug === page.id || ((config.homePageSlug === 'home' || config.homePageSlug === '/') && page.id === 'home');
                                   
                                   return (
                                    <div 
                                       key={page.id} 
                                       className={cn(
                                         'flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 group cursor-pointer border',
                                         activeScreen === page.id ? 'bg-blue-50 border-blue-200' : 'border-transparent'
                                       )}
                                       onClick={() => setActiveScreen(page.id as AppScreen)}
                                    >
                                        <div className='flex items-center gap-3'>
                                            <GripVertical className='w-4 h-4 text-gray-300 group-hover:text-gray-400' />
                                            <span className='text-xs font-medium'>{isRTL ? page.titleAr : page.title}</span>
                                            <Badge variant='outline' className='text-[8px] h-4'>{page.route}</Badge>
                                            {isHome && <Badge className='text-[8px] h-4 bg-yellow-400 text-yellow-900 border-none'>🏠 HOME</Badge>}
                                        </div>
                                        <div className='flex items-center gap-2'>
                                            <Button
                                               variant='ghost'
                                               size='icon'
                                               className={cn('h-8 w-8 rounded-lg transition-all', isHome ? 'text-yellow-500' : 'text-gray-300 opacity-0 group-hover:opacity-100 hover:text-yellow-400')}
                                               onClick={(e) => {
                                                  e.stopPropagation();
                                                  setConfig({ ...config, homePageSlug: page.id === 'home' ? '/' : page.id });
                                                  toast({ title: t('appBuilder.homePageSet', 'Home Page Set'), description: `${isRTL ? page.titleAr : page.title} is now your main page.` });
                                               }}
                                            >
                                               <Star className={cn('w-4 h-4', isHome ? 'fill-current' : '')} />
                                            </Button>
                                            <Switch 
                                               checked={isEnabled !== false} 
                                               onCheckedChange={(val) => { 
                                                  const currentPages = config.pages || [...DEFAULT_SYSTEM_PAGES];
                                                  let newPages;
                                                  if (currentPages.some(p => p.id === page.id)) {
                                                     newPages = currentPages.map(p => p.id === page.id ? { ...p, enabled: val } : p);
                                                  } else {
                                                     newPages = [...currentPages, { ...page, enabled: val }];
                                                  }
                                                  setConfig({ ...config, pages: newPages }); 
                                               }} 
                                               disabled={page.id === 'home' || isHome} 
                                               onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    </div>
                                   );
                                })}
                            </div>
                        </div>

                        {/* Custom Pages Section */}
                        <div className='bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3 mt-4'>
                             <div className='flex items-center justify-between'>
                                 <div>
                                    <h3 className='font-bold text-sm'>{t('appBuilder.customPages', 'Custom Pages')}</h3>
                                 <p className='text-[10px] text-muted-foreground'>{t('appBuilder.customPagesDesc', 'Add your own pages with custom content.')}</p>
                                 </div>
                                 <Button 
                                    variant='outline' 
                                    size='sm' 
                                    className='h-8 text-xs gap-2 text-blue-600 border-blue-100 bg-blue-50 hover:bg-blue-100'
                                    onClick={() => {
                                       const newPageId = `custom-${Date.now()}`;
                                       const newPage: AppPage = {
                                          id: newPageId,
                                          title: 'New Page',
                                          titleAr: 'صفحة جديدة',
                                          icon: 'FileText',
                                          type: 'custom',
                                          route: `/page/${newPageId}`,
                                          content: '<p>Your content here...</p>',
                                          contentAr: '<p>المحتوى هنا...</p>',
                                          enabled: true,
                                       };
                                       setConfig({ ...config, customPages: [...(config.customPages || []), newPage] });
                                       toast({ title: t('appBuilder.pageAdded', 'Page Added'), description: t('appBuilder.pageAddedDesc', 'Edit the page content in the Content tab.') });
                                    }}
                                 >
                                    <Plus className='w-4 h-4' />
                                    {t('appBuilder.addPage', 'Add Page')}
                                 </Button>
                             </div>
                            <div className='space-y-2'>
                                {(config.customPages || []).length === 0 ? (
                                   <div className='text-center py-8 text-muted-foreground text-xs'>
                                      <FileText className='w-8 h-8 mx-auto mb-2 opacity-30' />
                                      <p>{t('appBuilder.noCustomPages', 'No custom pages yet. Click "Add Page" to create one.')}</p>
                                   </div>
                                ) : (
                                   (config.customPages || []).map(page => (
                                       <div key={page.id} className='flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 group border border-gray-50'>
                                            <div className='flex items-center gap-3'>
                                               <GripVertical className='w-4 h-4 text-gray-300 group-hover:text-gray-400' />
                                               <span className='text-xs font-medium'>{isRTL ? page.titleAr : page.title}</span>
                                               <Badge variant='outline' className='text-[8px] h-4'>/{page.id}</Badge>
                                               {config.homePageSlug === page.id && <Badge className='text-[8px] h-4 bg-yellow-400 text-yellow-900 border-none'>🏠 HOME</Badge>}
                                           </div>
                                           <div className='flex items-center gap-2'>
                                               <Button
                                                  variant='ghost'
                                                  size='icon'
                                                  className={cn('h-8 w-8 rounded-lg transition-all', config.homePageSlug === page.id ? 'text-yellow-500' : 'text-gray-300 opacity-0 group-hover:opacity-100 hover:text-yellow-400')}
                                                  onClick={(e) => {
                                                     e.stopPropagation();
                                                     setConfig({ ...config, homePageSlug: page.id });
                                                     toast({ title: t('appBuilder.homePageSet', 'Home Page Set'), description: `${isRTL ? page.titleAr : page.title} is now your main page.` });
                                                  }}
                                               >
                                                  <Star className={cn('w-4 h-4', config.homePageSlug === page.id ? 'fill-current' : '')} />
                                               </Button>
                                               <Button 
                                                  variant='ghost' 
                                                  size='icon' 
                                                  className='h-6 w-6 text-gray-400 hover:text-blue-600'
                                                  onClick={() => {
                                                     const newTitle = prompt(t('appBuilder.enterPageTitle', 'Enter page title:'), page.title);
                                                     if (newTitle) {
                                                        const updatedPages = (config.customPages || []).map(p => p.id === page.id ? { ...p, title: newTitle } : p);
                                                        setConfig({ ...config, customPages: updatedPages });
                                                     }
                                                  }}
                                               >
                                                  <Pencil className='w-3 h-3' />
                                               </Button>
                                               <Button 
                                                  variant='ghost' 
                                                  size='icon' 
                                                  className='h-6 w-6 text-gray-400 hover:text-red-600'
                                                  onClick={() => {
                                                     if (confirm(t('appBuilder.confirmDeletePage', 'Are you sure you want to delete this page?'))) {
                                                        const updatedPages = (config.customPages || []).filter(p => p.id !== page.id);
                                                        const isHome = config.homePageSlug === page.id;
                                                        setConfig({ ...config, customPages: updatedPages, homePageSlug: isHome ? 'home' : config.homePageSlug });
                                                        toast({ title: t('appBuilder.pageDeleted', 'Page Deleted') });
                                                     }
                                                  }}
                                               >
                                                  <Trash2 className='w-3 h-3' />
                                               </Button>
                                               <Switch 
                                                  checked={page.enabled !== false} 
                                                  onCheckedChange={(val) => { 
                                                     const updatedPages = (config.customPages || []).map(p => p.id === page.id ? { ...p, enabled: val } : p); 
                                                     setConfig({ ...config, customPages: updatedPages }); 
                                                  }} 
                                                  disabled={config.homePageSlug === page.id}
                                               />
                                           </div>
                                       </div>
                                   ))
                                )}
                                </div>
                           </div>
                        </div>
                     </div>
                  </TabsContent>

                       <TabsContent value='content' className='flex-1 h-full m-0 relative data-[state=active]:block overflow-hidden'>
                            {/* If a section is selected, show Property Panel */}
                            {selectedSection && getCurrentSections().find(s => s.id === selectedSection) ? (
                                <div className="absolute inset-0 flex flex-col bg-white z-20">
                                    <div className="flex items-center gap-2 p-4 border-b shrink-0">
                                        <Button variant="ghost" size="sm" onClick={() => setSelectedSection(null)}>
                                            <ArrowLeft className="w-4 h-4 mr-1" />
                                            Back
                                        </Button>
                                        <h3 className="font-bold text-sm">Edit Section</h3>
                                    </div>
                                    <div className="flex-1 relative">
                                       <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-4 pb-24">
                                           <PropertyPanel 
                                               section={getCurrentSections().find(s => s.id === selectedSection)!}
                                               onUpdate={handleUpdateSectionProps}
                                               onClose={() => setSelectedSection(null)}
                                           />
                                       </div>
                                    </div>
                                </div>
                            ) : (
                           <div className='absolute inset-0 w-full h-full overflow-y-auto custom-scrollbar'>
                            <div className='space-y-6 px-5 pt-6 pb-24 min-h-full'>
                            
                            {/* Generic Page Settings (Title) - Available for ALL pages */}
                            <div className='bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4'>
                               <div className='flex items-center gap-2 border-b border-gray-50 pb-3 mb-3'>
                                  <FileText className='w-4 h-4 text-blue-500' />
                                  <h3 className='font-bold text-sm'>{t('appBuilder.pageSettings', 'Page Settings')}</h3>
                               </div>
                               
                               <div className='space-y-3'>
                                   <div className='space-y-1.5'>
                                       <Label className='text-xs'>{t('appBuilder.pageTitle', 'Page Title')}</Label>
                                       <Input 
                                           value={getPageTitle(activeScreen, false) || ''} 
                                           onChange={(e) => updatePageTitle(activeScreen, e.target.value, false)}
                                           className='h-8 text-xs' 
                                           placeholder='Page Title'
                                       />
                                   </div>
                                   <div className='space-y-1.5'>
                                       <Label className='text-xs'>{t('appBuilder.pageTitleAr', 'Page Title (Arabic)')}</Label>
                                       <Input 
                                           value={getPageTitle(activeScreen, true) || ''}
                                           onChange={(e) => updatePageTitle(activeScreen, e.target.value, true)}
                                           className='h-8 text-xs text-right' 
                                           dir='rtl'
                                           placeholder='عنوان الصفحة'
                                       />
                                   </div>
                               </div>
                            </div>

                            {/* Section Manager */}
                            <div className='bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4'>
                                <div className='flex items-center justify-between border-b border-gray-50 pb-3 mb-3'>
                                    <div className='flex items-center gap-2'>
                                        <Layers className='w-4 h-4 text-indigo-500' />
                                        <h3 className='font-bold text-sm'>Page Sections</h3>
                                    </div>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button size="sm" className="h-7 text-xs gap-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-100">
                                                <Plus className="w-3 h-3" /> Add Section
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
                                            <DialogHeader>
                                                <DialogTitle>Add Section</DialogTitle>
                                                <DialogDescription>Choose a section to add to your page.</DialogDescription>
                                            </DialogHeader>
                                            <SectionLibrary onAddSection={(type) => { handleAddSection(type); }} />
                                        </DialogContent>
                                    </Dialog>
                                </div>
                                
                                <DndContext 
                                    sensors={sensors} 
                                    collisionDetection={closestCenter} 
                                    onDragEnd={handleDragEnd}
                                >
                                    <div className="space-y-2 min-h-[100px]">
                                        <SortableContext 
                                            items={getCurrentSections().map(s => s.id)} 
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {getCurrentSections().length > 0 ? (
                                                getCurrentSections().map((section, index) => (
                                                    <SortableListItem 
                                                        key={`${section.id}-${index}`} 
                                                        section={section} 
                                                        onSelect={() => setSelectedSection(section.id as SectionId)}
                                                        onDelete={() => handleDeleteSection(section.id)}
                                                        isSelected={selectedSection === section.id}
                                                    />
                                                ))
                                            ) : (
                                                <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                                                    <Layout className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                    <p className="text-xs">No sections yet.</p>
                                                    <p className="text-[10px]">Click "Add Section" to start building.</p>
                                                </div>
                                            )}
                                        </SortableContext>
                                    </div>
                                </DndContext>
                            </div>

                            {/* Legacy Options for Home (Only show if no sections?) */}
                            {activeScreen === 'home' && getCurrentSections().length === 0 && (
                                <div className="space-y-4 opacity-50 pointer-events-none filter grayscale">
                                    <p className="text-center text-xs text-gray-400">Legacy controls disabled when using custom sections.</p>
                                    {/* ... we can hide legacy controls entirely ... */}
                                </div>
                            )}

                           </div>
                          </div>
                          )}
                      </TabsContent>

                      <TabsContent value='ai' className='flex-1 h-full min-h-0 m-0 data-[state=active]:flex data-[state=active]:flex-col relative overflow-hidden'>
                         <div className='flex-1 h-full w-full overflow-y-auto'>
                            <div className='space-y-6 px-5 pt-6 pb-24'>
                          <div className='space-y-4'>
                            <div className='flex items-center gap-2 mb-2'>
                              <div className='w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600'>
                                <Sparkles className='w-4 h-4' />
                              </div>
                              <div>
                                <h3 className='font-bold text-sm text-gray-900'>{t('appBuilder.aiDesigner')}</h3>
                                <p className='text-[10px] text-muted-foreground'>{t('appBuilder.aiDesignerDesc', 'Generate custom designs for your screens using AI.')}</p>
                              </div>
                            </div>

                            <div className='bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4'>
                              <div className='space-y-2'>
                                <Label className='text-xs'>{t('appBuilder.aiPromptLabel', 'What would you like to build?')}</Label>
                                <Textarea 
                                  placeholder={t('appBuilder.aiPromptPlaceholder', 'e.g. Create a futuristic dark marketplace with neon accents...')}
                                  value={aiPrompt}
                                  onChange={(e) => setAiPrompt(e.target.value)}
                                  className='min-h-[120px] text-xs resize-none'
                                />
                              </div>

                              <Button 
                                className='w-full gap-2 bg-gradient-to-r from-purple-600 to-indigo-600'
                                onClick={handleGenerateDesign}
                                disabled={isGenerating || !aiPrompt.trim()}
                              >
                                {isGenerating ? <Loader2 className='w-4 h-4 animate-spin' /> : <Sparkles className='w-4 h-4' />}
                                {t('appBuilder.generateDesign', 'Generate Design')}
                              </Button>

                              <div className='p-3 bg-purple-50 rounded-lg border border-purple-100/50'>
                                <p className='text-[10px] text-purple-700 leading-relaxed font-medium'>
                                  Tip: Try to be specific about colors, style, and the overall vibe you want for the current screen.
                                </p>
                              </div>

                              {config.stitchScreens?.[activeScreen] && (
                                <Button 
                                  variant='outline' 
                                  className='w-full text-xs text-red-500 hover:text-red-600 hover:bg-red-50'
                                  onClick={() => {
                                    const newScreens = { ...(config.stitchScreens || {}) };
                                    delete newScreens[activeScreen];
                                    setConfig(prev => ({ ...prev, stitchScreens: newScreens }));
                                  }}
                                >
                                  {t('appBuilder.resetDesign', 'Reset AI Design')}
                                </Button>
                               )}
                            </div>
                          </div>
                        </div>
                         </div>
                      </TabsContent>

                      <TabsContent value='saved' className='flex-1 h-full min-h-0 m-0 data-[state=active]:flex data-[state=active]:flex-col relative overflow-hidden'>
                         <div className='flex-1 h-full w-full overflow-y-auto'>
                           <div className='space-y-6 px-5 pt-6 pb-24'>
                          <div className='space-y-4'>
                            <div className='flex items-center gap-2 mb-2'>
                              <div className='w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600'>
                                <History className='w-4 h-4' />
                              </div>
                              <div>
                                <h3 className='font-bold text-sm text-gray-900'>{t('appBuilder.serverConfig', 'Saved on Server')}</h3>
                                <p className='text-[10px] text-muted-foreground'>{t('appBuilder.serverConfigDesc', 'This is exactly what is stored in the database for your store.')}</p>
                              </div>
                            </div>

                            {serverConfig ? (
                              <div className='space-y-4 font-mono text-[10px]'>
                                <div className='bg-gray-900 text-green-400 p-4 rounded-xl border border-gray-800 shadow-inner overflow-x-auto max-h-[60vh]'>
                                  <pre>{JSON.stringify(serverConfig, null, 2)}</pre>
                                </div>
                                <Button className='w-full text-xs font-bold' variant='secondary' onClick={handleRestoreFromServer} disabled={isSyncing}>
                                   {isSyncing ? <Loader2 className='w-4 h-4 animate-spin mr-2' /> : <RotateCcw className='w-4 h-4 mr-2' />}
                                   {t('appBuilder.applySavedToEditor', 'Apply Saved Config to Editor')}
                                </Button>
                              </div>
                            ) : (
                               <div className='p-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100'>
                                  <Cpu className='w-12 h-12 mx-auto mb-3 opacity-20 text-gray-400' />
                                  <p className='text-sm text-gray-400 font-medium'>{t('appBuilder.noSavedConfig', 'No saved data found.')}</p>
                                  <p className='text-xs text-gray-400 mt-1'>{t('appBuilder.saveFirst', 'Save your changes to see them here.')}</p>
                               </div>
                            )}

                            <div className='p-4 bg-blue-50 rounded-xl border border-blue-100'>
                               <div className='flex items-center gap-2 mb-2 text-blue-700 font-bold text-xs'>
                                  <Info className='w-3.5 h-3.5' />
                                  {t('appBuilder.debuggingTips', 'Debugging Information')}
                               </div>
                               <div className='space-y-1 text-[10px] text-blue-600'>
                                  <p><strong>Subdomain:</strong> {storeSubdomain}</p>
                                  <p><strong>Tenant ID:</strong> {getMobileTenantId() || 'Detecting...'}</p>
                                   <p><strong>Market Name:</strong> {config.storeName}</p>
                                 </div>
                               </div>
                           </div>
                        </div>
                       </div>
                      </TabsContent>
                   </div>
                </Tabs>
            </div>
         )}
         
         {/* Center Canvas */}
         <div className='flex-1 bg-gray-100 flex items-center justify-center overflow-auto p-4 md:p-12 relative'>
            {/* Grid Pattern */}
            <div className='absolute inset-0 grid grid-cols-[repeat(20,minmax(0,1fr))] grid-rows-[repeat(20,minmax(0,1fr))] opacity-[0.02] pointer-events-none'>
               {Array.from({ length: 400 }).map((_, i) => <div key={i} className='border-r border-b border-black/10'></div>)}
            </div>

            {/* Canvas Controls */}
            {isPreviewMode && (
               <Button 
                  variant='secondary' 
                  size='icon' 
                  className='absolute top-4 right-4 rounded-full shadow-lg z-50 bg-white' 
                  onClick={() => setIsPreviewMode(false)}
               >
                  <X className='h-5 w-5' />
               </Button>
            )}

            {/* Phone Frame wrapper */}
                <div className={cn(
                   'relative transition-transform duration-500 flex items-center justify-center py-10 origin-center',
                )}
                style={{ transform: `scale(${canvasScale})` }}
                >
                <div 
                   className='w-[320px] h-[740px] rounded-[55px] p-[10px] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.5)] border-[12px] border-gray-900 relative ring-1 ring-white/10 flex flex-col overflow-hidden bg-white shrink-0'
                >
                   {/* Mimic Status Bar */}
                   <div className='h-8 w-full flex justify-between items-center px-8 shrink-0 z-50 absolute top-2 left-0 pointer-events-none'>
                      <span className='text-[10px] font-black text-gray-400'>9:41</span>
                      <div className='flex items-center gap-1.5'>
                         <div className='w-4 h-2 border border-gray-200 rounded-[2px] relative'><div className='absolute inset-0.5 bg-green-500 rounded-[1px] w-2' /></div>
                         <div className='flex gap-0.5 items-end h-2'>
                            <div className='w-0.5 h-1 bg-gray-300 rounded-full' />
                            <div className='w-0.5 h-1.5 bg-gray-300 rounded-full' />
                            <div className='w-0.5 h-2 bg-gray-400 rounded-full' />
                         </div>
                      </div>
                   </div>

                   <div className="flex-1 overflow-hidden relative">
                      <iframe 
                        src={getIframeUrl()}
                        className="w-full h-full border-0"
                        title="Mobile Preview"
                        loading="lazy"
                        allow="geolocation; microphone; camera; midi; encrypted-media;"
                      />
                   </div>
                </div>

                  {/* Notch */}
                  <div className='absolute top-0 left-1/2 -translate-x-1/2 h-[30px] w-[150px] bg-black rounded-b-[20px] z-50 flex justify-center items-start pt-[8px]'>
                     <div className='w-16 h-1.5 bg-gray-800/50 rounded-full' />
                  </div>
                </div>
             </div>
          </div>
    
       {/* AI Design Dialog Feedback */}
      
      {/* Code Viewer Dialog */}
      
      {/* Build Dialog */}
      <Dialog open={showBuildDialog} onOpenChange={setShowBuildDialog}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>{t('appBuilder.buildAppTitle')}</DialogTitle>
            <DialogDescription>
               {t('appBuilder.buildAppDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-6 py-4'>
             {buildStatus === 'idle' && (
                <div className='text-center p-6 border-2 border-dashed rounded-xl bg-gray-50'>
                   <div className='w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4'>
                      <SmartphoneIcon className='w-8 h-8' />
                   </div>
                   <h3 className='font-bold text-lg mb-2'>{t('appBuilder.readyToBuild')}</h3>
                   <p className='text-sm text-gray-500 mb-6'>{t('appBuilder.buildConfirmText')}</p>
                   <Button onClick={startBuildProcess} className='w-full' size='lg'>{t('appBuilder.startBuild')}</Button>
                </div>
             )}
             
             {buildStatus === 'building' && (
                <div className='space-y-4'>
                   <div className='flex items-center justify-between text-sm font-medium'>
                      <span>{t('appBuilder.buildingApp')}</span>
                      <span>{buildProgress}%</span>
                   </div>
                   <div className='h-3 w-full bg-gray-100 rounded-full overflow-hidden'>
                      <div className='h-full bg-blue-600 transition-all duration-300' style={{ width: `${buildProgress}%` }} />
                   </div>
                   <p className='text-xs text-gray-500 text-center animate-pulse'>Compiling assets and signing APK...</p>
                </div>
             )}

             {buildStatus === 'deploying' && (
                <div className='space-y-4 text-center py-6'>
                   <Loader2 className='w-12 h-12 text-blue-600 animate-spin mx-auto mb-4' />
                   <h3 className='font-bold text-lg'>{t('appBuilder.deployingApp', 'Finalizing...')}</h3>
                   <p className='text-sm text-gray-500'>{t('appBuilder.deployingDesc', 'Preparing the download links for your app.')}</p>
                </div>
             )}
             
             {buildStatus === 'completed' && (
                <div className='text-center space-y-4'>
                   <div className='w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto'>
                      <Check className='w-8 h-8' />
                   </div>
                   <h3 className='font-bold text-lg'>{t('appBuilder.buildSuccess')}</h3>
                   <p className='text-sm text-gray-600'>{t('appBuilder.buildSuccessDesc')}</p>
                   
                    <div className='flex flex-col gap-3'>
                       <Button 
                         asChild
                         className='w-full gap-2 py-6 h-auto shadow-md' 
                         variant='default'
                         disabled={!apkDownloadUrl}
                       >
                          <a href={apkDownloadUrl || '#'} download={`${config.appName || 'store'}.apk`}>
                            <Download className='w-5 h-5' />
                            <div className='flex flex-col items-start'>
                              <span className='font-bold'>{t('appBuilder.downloadApk', 'Download APK')}</span>
                              <span className='text-[10px] opacity-70 font-normal'>{t('appBuilder.directLink', 'Direct Download')}</span>
                            </div>
                          </a>
                       </Button>

                       <div className='p-3 bg-blue-50 rounded-xl border border-blue-100/50 flex flex-col gap-2'>
                          <p className='text-[10px] text-blue-700 font-medium text-center'>
                            {t('appBuilder.scanQrHint', 'You can also scan this link to download on your phone:')}
                          </p>
                          <div className='bg-white p-2 rounded-lg border border-blue-100 self-center'>
                             {/* If we had a QR component we'd use it here, for now just show the URL */}
                             <p className='text-[8px] break-all text-gray-400 select-all'>{apkDownloadUrl}</p>
                          </div>
                          <Button 
                            variant='ghost'
                            size='sm'
                            className='w-full h-8 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-100/50'
                            onClick={() => {
                              if (apkDownloadUrl) {
                                navigator.clipboard.writeText(apkDownloadUrl);
                                toast({
                                  title: t('common.success'),
                                  description: t('appBuilder.linkCopied'),
                                });
                              }
                            }}
                          >
                             <Share2 className='w-3.5 h-3.5 mr-1.5' />
                             {t('appBuilder.copyDownloadLink', 'Copy Download Link')}
                          </Button>
                       </div>
                    </div>
                </div>
              )}

              {buildStatus === 'failed' && (
                 <div className='text-center space-y-4 py-4'>
                    <div className='w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto'>
                       <X className='w-8 h-8' />
                    </div>
                    <div>
                       <h3 className='font-bold text-lg'>{t('appBuilder.buildFailed', 'Build Failed')}</h3>
                       <p className='text-sm text-gray-500 mt-1'>{t('appBuilder.buildError')}</p>
                    </div>
                    <Button onClick={startBuildProcess} className='w-full gap-2' variant='outline'>
                       <RotateCcw className='w-4 h-4' />
                       {t('appBuilder.tryAgainBuild', 'Try Again')}
                    </Button>
                 </div>
              )}
           </div>
         </DialogContent>
       </Dialog>
     </div>
   );
}

// --- Stitch (AI Design) Preview Components ---

const StitchHomeContent = ({ config, isRTL, data }: StitchProps) => {
  const isDark = config.theme === 'dark';
  return (
    <div className={cn('flex-1 overflow-y-auto no-scrollbar pb-20', isDark ? 'bg-[#0f172a]' : 'bg-gray-50')}>
      <div className='p-6 space-y-6'>
         <div className='flex justify-between items-center'>
            <div>
               <p className='text-[10px] text-muted-foreground uppercase font-black tracking-widest'>{isRTL ? 'مرحباً بك' : 'Welcome back'}</p>
               <h2 className='text-2xl font-black'>{data?.userName || config.userName || 'User'}</h2>
            </div>
            <div className='w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary'>
               <UserIcon className='w-6 h-6' />
            </div>
         </div>

         {config.showBanner && (
            <div className='h-48 rounded-[32px] overflow-hidden relative shadow-2xl group'>
               <img src={config.bannerImage || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=800&q=80'} className='w-full h-full object-cover' alt='' />
               <div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6'>
                  <h3 className='text-white font-bold text-xl'>{isRTL ? config.bannerTextAr : config.bannerText}</h3>
                  <p className='text-white/80 text-xs'>{isRTL ? config.bannerSubtextAr : config.bannerSubtext}</p>
               </div>
            </div>
         )}

         {config.showCategories && (
            <div className='space-y-4'>
               <h3 className='font-black text-sm uppercase tracking-wider text-muted-foreground'>{isRTL ? 'الأقسام' : 'Explore'}</h3>
               <div className='flex gap-4 overflow-x-auto no-scrollbar'>
                  {data?.categories?.slice(0, 5).map((cat: Category) => (
                     <div key={cat.id} className='flex flex-col items-center gap-2 shrink-0'>
                        <div className='w-16 h-16 rounded-[22px] bg-white shadow-sm border border-gray-100 flex items-center justify-center p-3'>
                           {cat.image ? <img src={cat.image} className='w-full h-full object-contain' alt='' /> : <Zap className='text-gray-300' />}
                        </div>
                        <span className='text-[10px] font-bold text-gray-500'>{isRTL ? cat.nameAr : cat.name}</span>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {config.showFeatured && (
            <div className='space-y-4'>
               <h3 className='font-black text-sm uppercase tracking-wider text-muted-foreground'>{isRTL ? 'منتجات مختارة' : 'Picked for you'}</h3>
               <div className='grid grid-cols-2 gap-4'>
                  {data?.products?.slice(0, 4).map((p: Product) => (
                     <div key={p.id} className='bg-white rounded-3xl p-3 shadow-sm border border-gray-50 group hover:shadow-md transition-shadow'>
                        <div className='aspect-square rounded-2xl bg-gray-50 overflow-hidden mb-3'>
                           <img src={p.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'} className='w-full h-full object-cover group-hover:scale-105 transition-transform' alt='' />
                        </div>
                        <h4 className='text-xs font-bold line-clamp-1'>{isRTL ? p.nameAr : p.name}</h4>
                        <p className='text-primary font-black text-sm mt-1' style={{ color: config.primaryColor }}>{p.price} {config.currency || 'SAR'}</p>
                     </div>
                  ))}
               </div>
            </div>
         )}
      </div>
    </div>
  );
};

const StitchWalletContent = ({ config, isRTL }: StitchProps) => {
   return (
      <div className='flex-1 overflow-y-auto no-scrollbar p-6 space-y-6'>
         <div className='h-52 rounded-[32px] bg-gradient-to-br from-blue-600 to-indigo-700 p-8 shadow-2xl relative overflow-hidden'>
            <div className='absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16' />
            <div className='relative flex flex-col h-full justify-between'>
               <div className='flex justify-between items-start'>
                  <CreditCard className='text-white/80 w-8 h-8' />
                  <span className='text-white/40 font-mono text-xs'>Stitch Pay</span>
               </div>
               <div>
                  <p className='text-white/60 text-xs mb-1'>{isRTL ? 'الرصيد المتاح' : 'Available Balance'}</p>
                  <h2 className='text-white text-3xl font-black tracking-tight'>4,150.80 {config.currency || 'SAR'}</h2>
               </div>
            </div>
         </div>
         
         <div className='space-y-4'>
            <h3 className='font-bold'>{isRTL ? 'المعاملات الأخيرة' : 'Recent Activity'}</h3>
            {[1, 2, 3].map(i => (
               <div key={i} className='flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-gray-50'>
                  <div className='flex items-center gap-3'>
                     <div className='w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center'>
                        <ShoppingBag className='w-5 h-5 text-gray-500' />
                     </div>
                     <div>
                        <p className='text-xs font-bold'>{isRTL ? 'شراء منتج' : 'Product Purchase'}</p>
                        <p className='text-[10px] text-gray-400'>24 Jan, 2024</p>
                     </div>
                  </div>
                  <span className='text-red-500 text-xs font-bold'>-45.00</span>
               </div>
            ))}
         </div>
      </div>
   );
};

const StitchProfileContent = ({ config, isRTL }: StitchProps) => {
   return (
      <div className='flex-1 flex flex-col overflow-y-auto no-scrollbar pb-20'>
         <div className='p-8 flex flex-col items-center gap-4 bg-white'>
            <div className='w-24 h-24 rounded-[32px] bg-primary/5 flex items-center justify-center border border-primary/10 shadow-inner' style={{ backgroundColor: `${config.primaryColor}10` }}>
               <UserIcon className='w-10 h-10 text-primary' style={{ color: config.primaryColor }} />
            </div>
            <div className='text-center'>
               <h2 className='text-xl font-bold'>{config.userName || 'Username'}</h2>
               <p className='text-xs text-gray-400'>{config.storeName?.toLowerCase().replace(/\s+/g, '') || 'john'}@example.com</p>
            </div>
            <Button size='sm' variant='outline' className='rounded-full px-6 h-8 text-[10px] font-bold'>{isRTL ? 'تعديل الملف' : 'Edit Profile'}</Button>
         </div>

         <div className='p-6 space-y-3'>
            {[
               { icon: Package, label: isRTL ? 'طلباتي' : 'My Orders' },
               { icon: Heart, label: isRTL ? 'المفضلة' : 'Wishlist' },
               { icon: MapPin, label: isRTL ? 'العناوين' : 'Delivery Address' },
               { icon: BellIcon, label: isRTL ? 'التنبيهات' : 'Notifications' },
               { icon: ShieldIcon, label: isRTL ? 'الأمان' : 'Security' },
            ].map((item, i) => (
               <div key={i} className='flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer group'>
                  <div className='flex items-center gap-3'>
                     <div className='w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors' style={{ color: config.primaryColor ? undefined : '#94a3b8' }}>
                        <item.icon className='w-4 h-4' />
                     </div>
                     <span className='text-xs font-bold text-gray-700'>{item.label}</span>
                  </div>
                  <ChevronRight className={cn('w-4 h-4 text-gray-300', isRTL && 'rotate-180')} />
               </div>
            ))}
         </div>
      </div>
   );
};

const StitchCategoriesContent = ({ config, isRTL, categories }: StitchProps) => {
   return (
      <div className='flex-1 overflow-y-auto no-scrollbar p-6 space-y-6'>
         <h2 className='text-2xl font-black'>{isRTL ? 'الأقسام' : 'Categories'}</h2>
         <div className='grid grid-cols-2 gap-4'>
            {categories?.map((cat: Category) => (
               <div key={cat.id} className='relative h-32 rounded-3xl overflow-hidden group shadow-sm border border-gray-100'>
                  {cat.image ? (
                     <img src={cat.image} className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-500' alt='' />
                  ) : (
                     <div className='w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center'>
                        <Zap className='w-8 h-8 text-white' />
                     </div>
                  )}
                  <div className='absolute inset-0 bg-black/30 flex items-end p-4 group-hover:bg-black/40 transition-colors'>
                     <span className='text-white font-bold text-xs uppercase tracking-wider'>{isRTL ? cat.nameAr : cat.name}</span>
                  </div>
               </div>
            ))}
         </div>
      </div>
   );
};

const StitchProductContent = ({ config, isRTL, product }: StitchProps) => {
   return (
       <div className='flex-1 flex flex-col bg-white overflow-y-auto no-scrollbar'>
          <div className='h-[400px] relative overflow-hidden'>
             <img src={product?.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'} className='w-full h-full object-cover' alt='' />
             <div className='absolute top-6 left-6 right-6 flex justify-between'>
                <Button variant='secondary' size='icon' className='rounded-2xl bg-white/80 backdrop-blur-md border-0'><ArrowLeft className={cn('w-4 h-4', isRTL && 'rotate-180')} /></Button>
                <Button variant='secondary' size='icon' className='rounded-2xl bg-white/80 backdrop-blur-md border-0 text-red-500'><Heart className='w-4 h-4' /></Button>
             </div>
          </div>
          <div className='-mt-8 flex-1 bg-white rounded-t-[40px] p-8 shadow-2xl relative z-10 space-y-6'>
             <div className='space-y-2'>
                <div className='flex justify-between items-start'>
                   <h2 className='text-2xl font-black tracking-tight leading-tight max-w-[70%]'>{isRTL ? product?.nameAr : product?.name}</h2>
                   <div className='px-4 py-2 bg-primary/10 rounded-2xl' style={{ backgroundColor: `${config.primaryColor}15` }}>
                      <span className='font-black text-lg' style={{ color: config.primaryColor }}>{product?.price} {config.currency}</span>
                   </div>
                </div>
                <div className='flex items-center gap-2'>
                   <div className='flex text-yellow-400'><Star className='w-3 h-3 fill-current' /><Star className='w-3 h-3 fill-current' /><Star className='w-3 h-3 fill-current' /><Star className='w-3 h-3 fill-current' /><Star className='w-3 h-3 fill-current' /></div>
                   <span className='text-[10px] text-gray-400'>(4.9 Rating)</span>
                </div>
             </div>
             <p className='text-xs text-gray-500 leading-relaxed font-medium'>{isRTL ? 'هذا وصف للمنتج مصمم بشكل جميل ليتناسب مع تجربة المستخدم.' : 'A beautifully crafted product featuring premium materials and exceptional design for an elite user experience.'}</p>
             <div className='pt-4'>
                <Button className='w-full h-14 rounded-2xl shadow-xl font-bold flex gap-3' style={{ backgroundColor: config.primaryColor }}>
                   <ShoppingBag className='w-5 h-5' />
                   {isRTL ? 'إضافة للسلة' : 'Add to Cart'}
                </Button>
             </div>
          </div>
       </div>
   );
};

const StitchCartContent = ({ config, isRTL, items }: StitchProps) => {
   return (
      <div className='flex-1 flex flex-col p-6 space-y-6'>
         <h2 className='text-2xl font-black'>{isRTL ? 'سلة التسوق' : 'Shopping Cart'}</h2>
         <div className='space-y-4 overflow-y-auto no-scrollbar max-h-[450px]'>
            {items?.map((item: Product) => (
               <div key={item.id} className='flex gap-4 bg-white p-3 rounded-3xl shadow-sm border border-gray-50'>
                  <div className='w-20 h-20 rounded-2xl bg-gray-50 overflow-hidden shrink-0'>
                     <img src={item.image} className='w-full h-full object-cover' alt='' />
                  </div>
                  <div className='flex-1 flex flex-col justify-between py-1'>
                     <div>
                        <h4 className='text-xs font-bold line-clamp-1'>{isRTL ? item.nameAr : item.name}</h4>
                        <p className='text-[10px] text-gray-400 font-bold mt-1'>{item.price} {config.currency}</p>
                     </div>
                     <div className='flex items-center gap-3 bg-gray-50 self-start px-2 py-1 rounded-lg border border-gray-100'>
                        <button className='w-4 h-4 flex items-center justify-center font-bold text-gray-400'>-</button>
                        <span className='text-xs font-bold'>1</span>
                        <button className='w-4 h-4 flex items-center justify-center font-bold text-primary' style={{ color: config.primaryColor }}>+</button>
                     </div>
                  </div>
               </div>
            ))}
         </div>
         <div className='mt-auto pt-4 space-y-4 border-t border-dashed'>
            <div className='flex justify-between items-center'>
               <span className='text-sm text-gray-400 font-bold'>{isRTL ? 'المجموع' : 'Subtotal'}</span>
               <span className='text-xl font-black' style={{ color: config.primaryColor }}>350.00 {config.currency}</span>
            </div>
            <Button className='w-full h-14 rounded-2xl shadow-xl font-bold' style={{ backgroundColor: config.primaryColor }}>{isRTL ? 'إتمام الدفع' : 'Checkout Now'}</Button>
         </div>
      </div>
   );
};

const StitchSplashContent = ({ config, isRTL }: StitchProps) => {
   return (
      <div className='flex-1 flex flex-col items-center justify-center relative overflow-hidden' style={{ backgroundColor: config.primaryColor }}>
         <div className='absolute top-[-20%] right-[-20%] w-80 h-80 bg-white/10 rounded-full blur-[100px]' />
         <div className='absolute bottom-[-20%] left-[-20%] w-60 h-60 bg-black/10 rounded-full blur-[80px]' />
         
         <div className='relative z-10 flex flex-col items-center gap-6'>
            <div className='w-24 h-24 bg-white rounded-[32px] flex items-center justify-center shadow-2xl rotate-12 group hover:rotate-0 transition-transform duration-500'>
               {config.logo || config.storeLogo ? (
                  <img src={config.logo || config.storeLogo} className='w-16 h-16 object-contain' alt='' />
               ) : (
                  <Zap className='w-12 h-12 text-primary' style={{ color: config.primaryColor }} />
               )}
            </div>
            <div className='text-center'>
               <h1 className='text-white text-3xl font-black tracking-tight mb-2'>{config.storeName || config.appName}</h1>
               <div className='flex items-center gap-2 justify-center'>
                  <div className='w-8 h-[2px] bg-white/30 truncate' />
                  <span className='text-white/60 text-[8px] font-black uppercase tracking-[0.3em]'>{isRTL ? 'جار التحميل' : 'Loading Experience'}</span>
                  <div className='w-8 h-[2px] bg-white/30 truncate' />
               </div>
            </div>
         </div>
         
         <div className='absolute bottom-12'>
            <Loader2 className='w-6 h-6 text-white/40 animate-spin' />
         </div>
      </div>
   );
};
