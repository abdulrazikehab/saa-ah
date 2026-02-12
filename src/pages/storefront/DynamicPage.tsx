import { useEffect, useState, useMemo } from 'react';
import { useParams, useLocation, useSearchParams } from 'react-router-dom';
import { coreApi } from '@/lib/api';
import { SectionRenderer } from '@/components/builder/SectionRenderer';
import { Section } from '@/components/builder/PageBuilder';
import { Page } from '@/services/types';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

import { StorefrontLoading } from '@/components/storefront/StorefrontLoading';

import { Capacitor } from '@capacitor/core';
import MobileCustomPage from '../mobile/MobileCustomPage';
import { useStoreSettings } from "@/contexts/StoreSettingsContext";


interface PageContent {
  sections: Section[];
  backgroundColor?: string;
  isDarkMode?: boolean;
  [key: string]: unknown;
}

// List of routes that should NOT be handled by DynamicPage
// These routes have explicit handlers and should not fall through to DynamicPage
const EXCLUDED_ROUTES = [
  'login', 'signup', 'auth', 'dashboard', 'products', 'categories', 
  'cart', 'checkout', 'orders', 'wishlist', 'collections',
  'track-order', 'returns', 'faq', 'terms', 'policies', 'rules', 'offers',
  'invite', 'setup', 'builder',
  'accountinventory', 'customer-orders' // Explicit routes that should not use DynamicPage
];

export default function DynamicPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const { settings } = useStoreSettings();

  // Mobile Mode Detection
  const isNativeMode = Capacitor.isNativePlatform() || 
                       (typeof window !== 'undefined' && (
                          window.location.href.includes('platform=mobile') || 
                          sessionStorage.getItem('isMobilePlatform') === 'true'
                       ));



  // Extract slug from pathname (handles nested paths like account/inventory, customer-orders)
  const slug = useMemo(() => {
    // Get the full pathname - ensure we're only using the path, not hostname
    const pathname = location.pathname || '';
    
    // Safety check: pathname should always start with / and not contain hostname
    if (!pathname.startsWith('/') || pathname.includes('localhost') || pathname.includes('://')) {
      console.error('[DynamicPage] Invalid pathname detected:', pathname, 'location:', location);
      return null;
    }
    
    let path = pathname.replace(/^\//, '').replace(/\/$/, '');
    
    // Additional safety: if path contains dots without slashes, it might be a hostname
    if (path.includes('.') && !path.includes('/') && path.length > 10) {
      console.error('[DynamicPage] Path looks like hostname:', pathname, 'extracted path:', path);
      return null;
    }
    
    // Remove 'page/' prefix if present
    if (path.startsWith('page/')) {
      path = path.replace('page/', '');
    }
    
    // Don't process empty paths
    if (!path || path === '' || path === 'page') {
      return null;
    }
    
    // Check if the entire path matches an excluded route (for routes like 'accountinventory')
    if (EXCLUDED_ROUTES.includes(path.toLowerCase())) {
      return null;
    }
    
    // Check only the first segment for excluded routes to allow nested paths like account/inventory
    const firstSegment = path.split('/')[0];
    if (EXCLUDED_ROUTES.includes(firstSegment.toLowerCase())) {
      return null;
    }
    
    return path;
  }, [location]);



  useEffect(() => {
    // Skip fetch if in mobile mode
    if (isNativeMode && slug) return;

    setLoading(true);
    setPage(null);
    
    // Early return if slug is null (excluded route or invalid path)
    if (!slug) {
      setLoading(false);
      setPage(null);
      return;
    }
    
    // Only try to load page if we have a valid slug
    if (slug && slug.trim() !== '') {
      const loadPage = async () => {
        try {
          let data = null;
          try {
             data = await coreApi.getPageBySlug(slug);
          } catch (e) { /* ignore 404 */ }
          
          // Check for virtual page fallback if API returns 404
          if (!data && settings) {
             const virtualPage = getVirtualPage(slug, settings);
             if (virtualPage) {
                 if (['about-us', 'faqs'].includes(slug)) {
                    console.log(`[DynamicPage] Using virtual content for ${slug}`);
                 }
                 setPage(virtualPage);
                 setLoading(false);
                 return;
             }
          }

          // Check if data is null (page doesn't exist)
          if (!data) {
            setPage(null);
            setLoading(false);
            return;
          }
          // Only set page if it's published (unless preview mode)
          if (data && (isPreview || data.isPublished)) {
            setPage(data);
          } else {
            // Page not found or not published - don't redirect, just show not found
            setPage(null);
          }
        } catch (error: unknown) {
          // Error logged to backend - don't redirect, just show not found
          // Check if it's a 404 or network error
          const status = (error as { status?: number })?.status || (error as { response?: { status?: number } })?.response?.status;
          const message = (error as Error)?.message || '';
          
          if (status === 404 || message.includes('404')) {
            // Double check virtual page here just in case (though covered above)
            if (settings) {
                 const virtualPage = getVirtualPage(slug, settings);
                 if (virtualPage) {
                     setPage(virtualPage);
                     return;
                 }
            }
            setPage(null);
          } else {
            console.error('Error loading page:', error);
            setPage(null);
          }
        } finally {
          setLoading(false);
        }
      };
      loadPage();
    } else {
      // No valid slug, show not found immediately
      setLoading(false);
      setPage(null);
    }
  }, [slug, isPreview, isNativeMode, settings]);

  if (isNativeMode && slug) {
    return <MobileCustomPage pageId={slug} />;
  }

  if (loading) {
    return <StorefrontLoading />;
  }

  if (!page) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">Page not found</h2>
        <p className="text-gray-600">The requested page does not exist.</p>
      </div>
    );
  }

  const rawContent = (isPreview && page.draftContent) ? page.draftContent : page.content;
  const content = rawContent as unknown as PageContent;
  const sections: Section[] = content?.sections ?? [];

  // List of section types that require the premium dark theme (Cards template)
  const CARDS_SECTION_TYPES = [
    'merchant-dashboard',
    'product-list',
    'store-page',
    'support-tickets',
    'favorites-page',
    'balance-operations',
    'employees-page',
    'permissions-page',
    'charge-wallet',
    'reports-page',
    'profile-page',
    'categories-hierarchy',
    'bank-accounts'
  ];

  // Check if the page contains any of the Cards template sections
  const isCardsPage = sections.some(section => CARDS_SECTION_TYPES.includes(section.type));

  // Force transparent background for Cards pages to ensure premium look
  // regardless of legacy database settings
  const backgroundColor = isCardsPage 
    ? 'transparent' 
    : ((content?.backgroundColor as string) || '#ffffff');
    
  // For Cards pages, we want to respect the global theme (light/dark)
  // so we force isDarkMode to false here to prevent the 'dark' class from being added locally
  // The content will then inherit the theme from the parent (html/body)
  const isDarkMode = isCardsPage 
    ? false 
    : ((content?.isDarkMode as boolean) || false);

  return (
    <div
      className={isDarkMode ? 'dark' : ''}
      style={{ backgroundColor, minHeight: '100%' }}
    >
      {/* Render sections with entrance animation */}
      {sections.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">This page has no content yet.</p>
        </div>
      ) : (
        <div className="space-y-0">
          {sections.map((section, index) => (
            <motion.div
              key={section.id ? `section-${section.id}-${index}` : `section-idx-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              <SectionRenderer section={section} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper to generate virtual content for missing system pages
function getVirtualPage(slug: string, settings: { 
  storeType?: string; 
  storeName?: string; 
  storeNameAr?: string; 
  storeDescription?: string; 
  descriptionAr?: string;
  language?: string;
  email?: string;
  phone?: string;
  address?: string;
}): Page | null {
    const isDigital = settings.storeType === 'DIGITAL_CARDS';
    const storeName = settings.storeName || settings.storeNameAr;
    const isRTL = settings.language === 'ar' || true; // Default to true or check settings language
    // Note: Assuming true for isRTL based on user request context, or we can check settings.language 
    
    let content = {};
    
    if (slug === 'about-us' || slug === 'about') {
        const desc = settings.storeDescription || settings.descriptionAr || (isDigital ? (isRTL ? 'متجر البطاقات الرقمية الأول' : 'The #1 Digital Cards Store') : (isRTL ? 'أهلاً بك في متجرنا' : 'Welcome to our store.'));
        const name = storeName || (isRTL ? 'من نحن' : 'About Us');
        
        if (isDigital) {
            content = {
                sections: [{
                    type: 'hero',
                    props: {
                        title: name,
                        subtitle: desc,
                        backgroundImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070',
                        overlayOpacity: 0.7,
                        minHeight: '400px',
                        textAlign: 'center',
                        animationType: 'animate-pulse'
                    }
                }, {
                    type: 'text',
                    props: { 
                        title: isRTL ? 'خدماتنا الرقمية' : 'Our Digital Services',
                        text: isRTL ? 'نقدم أفضل البطاقات الرقمية مع تسليم فوري وآمن. جميع الأكواد مضمونة.' : 'We provide the best digital cards with instant and secure delivery. All codes are guaranteed.',
                        textAlign: 'center',
                        backgroundColor: '#f8f9fa',
                        padding: 'large'
                    }
                }]
            };
        } else {
            content = {
                sections: [{
                    type: 'hero',
                    props: {
                        title: name,
                        subtitle: desc,
                        backgroundImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070',
                        overlayOpacity: 0.5,
                        minHeight: '400px',
                        textAlign: 'center'
                    }
                }, {
                    type: 'text',
                    props: { text: desc, textAlign: 'center', padding: 'medium' }
                }]
            };
        }
        return {
            id: `virtual-${slug}`,
            title: isRTL ? 'من نحن' : 'About Us',
            slug: slug,
            content,
            isPublished: true,
            createdAt: new Date().toISOString()
        } as Page;
    } 

    if (slug === 'contact') {
        content = {
            sections: [{
                type: 'hero',
                props: {
                    title: isRTL ? 'تواصل معنا' : 'Contact Us',
                    subtitle: isRTL ? 'نحن هنا لمساعدتك دائماً' : 'We are always here to help you',
                    backgroundImage: 'https://images.unsplash.com/photo-1534536281715-e28d76689b4d?q=80&w=2070',
                    overlayOpacity: 0.6,
                    minHeight: '300px',
                    textAlign: 'center'
                }
            }, {
                type: 'text',
                props: { 
                    title: isRTL ? 'معلومات التواصل' : 'Contact Info',
                    text: `${settings.email || ''}\n${settings.phone || ''}\n${settings.address || ''}`,
                    textAlign: 'center',
                    padding: 'medium'
                }
            }]
        };
        return {
            id: `virtual-${slug}`,
            title: isRTL ? 'تواصل معنا' : 'Contact Us',
            slug: slug,
            content,
            isPublished: true,
            createdAt: new Date().toISOString()
        } as Page;
    }

    if (slug === 'privacy') {
        content = {
            sections: [{
                type: 'hero',
                props: {
                    title: isRTL ? 'سياسة الخصوصية' : 'Privacy Policy',
                    subtitle: isRTL ? 'كيفية حماية بياناتك' : 'How we protect your data',
                    backgroundImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070',
                    overlayOpacity: 0.6,
                    minHeight: '250px',
                    textAlign: 'center'
                }
            }, {
                type: 'text',
                props: { 
                    title: isRTL ? 'التزامنا بالخصوصية' : 'Our Commitment to Privacy',
                    text: isRTL 
                        ? `في ${storeName || 'متجرنا'}، نحن نلتزم بحماية خصوصية عملائنا. نحافظ على سرية بياناتكم ولا نشاركها مع أي طرف ثالث.`
                        : `At ${storeName || 'our store'}, we are committed to protecting our customers' privacy. We keep your data confidential and do not share it with third parties.`,
                    textAlign: 'center',
                    padding: 'large'
                }
            }]
        };
        return {
            id: `virtual-${slug}`,
            title: isRTL ? 'سياسة الخصوصية' : 'Privacy Policy',
            slug: slug,
            content,
            isPublished: true,
            createdAt: new Date().toISOString()
        } as Page;
    }
    
    if (slug === 'faqs' || slug === 'help') {
         const faqTitle = isRTL ? 'الأسئلة الشائعة' : 'Frequently Asked Questions';
         const items = isDigital ? [
             { question: isRTL ? 'متى أحصل على الكود؟' : 'When do I receive the code?', answer: isRTL ? 'يصلك الكود فوراً عبر رسالة نصية وفي صفحة طلباتي بعد الدفع المباشر.' : 'You receive the code instantly via SMS and in My Orders page after payment.' },
             { question: isRTL ? 'هل الدفع آمن؟' : 'Is payment secure?', answer: isRTL ? 'نعم، نستخدم بوابات دفع آمنة ومشفرة تماماً.' : 'Yes, we use fully secure and encrypted payment gateways.' }
         ] : [
             { question: isRTL ? 'كيف أقوم بالطلب؟' : 'How do I place an order?', answer: isRTL ? 'تصفح المنتجات، أضفها للسلة، ثم انتقل لإتمام الدفع.' : 'Browse products, add to cart, then proceed to checkout.' },
             { question: isRTL ? 'كم مدة التوصيل؟' : 'How long is delivery?', answer: isRTL ? 'عادة ما يتم التوصيل خلال 1-3 أيام عمل حسب موقعك.' : 'Delivery usually takes 1-3 business days depending on your location.' }
         ];
         content = {
            sections: [{
                type: 'hero',
                props: {
                    title: faqTitle,
                    subtitle: isRTL ? 'إجابات على استفساراتك' : 'Answers to your questions',
                    backgroundImage: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?q=80&w=2070',
                    overlayOpacity: 0.6,
                    minHeight: '250px',
                    textAlign: 'center'
                }
            }, {
                type: 'faq-section',
                props: { title: faqTitle, items }
            }]
        };
        return {
            id: `virtual-${slug}`,
            title: faqTitle,
            slug: slug,
            content,
            isPublished: true,
            createdAt: new Date().toISOString()
        } as Page;
    }

    if (slug === 'charge-wallet') {
         content = {
            sections: [{
                type: 'hero',
                props: {
                    title: isRTL ? 'شحن المحفظة' : 'Charge Wallet',
                    subtitle: isRTL ? 'اشحن رصيدك لتسوق أسرع وأسهل' : 'Top up your balance for faster shopping',
                    backgroundImage: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?q=80&w=2074',
                    overlayOpacity: 0.6,
                    minHeight: '250px',
                    textAlign: 'center'
                }
            }, {
                type: 'charge-wallet',
                props: { showBankTransfer: true, showOnlinePayment: true }
            }]
        };
        return {
            id: `virtual-${slug}`,
            title: isRTL ? 'شحن المحفظة' : 'Charge Wallet',
            slug: slug,
            content,
            isPublished: true,
            createdAt: new Date().toISOString()
        } as Page;
    }

    return null;
}
