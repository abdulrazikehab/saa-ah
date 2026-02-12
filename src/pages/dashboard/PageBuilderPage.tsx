import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { PageBuilder, Section } from '@/components/builder/PageBuilder';
import { coreApi, apiClient } from '@/lib/api';
import { templateService } from '@/services/template.service';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, RotateCcw, Clock, Code, Loader2, Layout, FileText, X } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { AIChatHelper } from '@/components/chat/AIChatHelper';
import { PageHistory } from '@/services/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function PageBuilderPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  
  // State declarations
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(false);
  const [domain, setDomain] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [history, setHistory] = useState<PageHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [codeEditorValue, setCodeEditorValue] = useState('');
  const [editorMounted, setEditorMounted] = useState(false);

  // Fetch domain information
  useEffect(() => {
    const fetchDomain = async () => {
      try {
        const domainData = await coreApi.getDomain();
        if (domainData) {
          const hostname = window.location.hostname;
          // If we have a custom domain, use it
          if (domainData.customDomain) {
            setDomain(domainData.customDomain);
          } else {
            // If on main domain (kawn.com), use main domain (not subdomain)
            if (hostname === 'kawn.com' || hostname === 'www.kawn.com') {
              setDomain('kawn.com');
            } else if (hostname === 'kawn.net' || hostname === 'www.kawn.net') {
              setDomain('kawn.net');
            } else {
              // Otherwise use subdomain format
              const prodDomain = hostname.includes('kawn.net') ? 'kawn.net' : 'kawn.com';
              setDomain(`${domainData.subdomain}.${prodDomain}`);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch domain:', error);
      }
    };
    fetchDomain();

    // Initialize with default section for new pages
    if (!id) {
      setSections([
        {
          id: `section-${Date.now()}`,
          type: 'hero',
          props: {
            title: 'Welcome to Our Store',
            subtitle: 'Discover amazing products',
            buttonText: 'Shop Now',
            buttonLink: '/products',
            backgroundImage: '',
            textColor: '#ffffff',
            backgroundColor: '#000000',
          },
        },
      ]);
    }
  }, [id]);

  const loadPage = useCallback(async () => {
    if (!id) return;
    
    try {
      // Fetch page data and site config in parallel
      const [page, siteConfigRes] = await Promise.all([
        coreApi.getPage(id),
        coreApi.get('/site-config', { requireAuth: true }).catch(err => {
            console.warn("Could not load site config", err);
            return { settings: {} }; // Return empty settings on failure
        })
      ]);

      const siteSettings = siteConfigRes?.settings || {};
      const isDigital = siteSettings.storeType === 'DIGITAL_CARDS';
      const storeName = siteSettings.storeName;

      setTitle(page.title);
      setSlug(page.slug);
      
      // Prefer draftContent if available
      const content = page.draftContent || page.content;
      let loadedSections = (content?.sections as Section[]) || [];
      
      // Inject defaults for empty system pages
      if (loadedSections.length === 0) {
          const pageSlug = page.slug?.toLowerCase() || '';
          const currentTimestamp = Date.now();
          
          if (pageSlug === 'home' || pageSlug === '' || pageSlug === '/') {
              const homeTitle = isArabic ? 'الرئيسية' : 'Home';
              const sub = isArabic ? 'اكتشف أفضل المنتجات' : 'Discover best products';

              if (isDigital) {
                  // Digital Store Default
                  loadedSections = [
                      {
                          id: `section-${currentTimestamp}-1`,
                          type: 'hero',
                          props: {
                              title: storeName || (isArabic ? 'متجر البطاقات' : 'Card Store'),
                              subtitle: isArabic ? 'بطاقاتك الرقمية في مكان واحد' : 'Your digital cards in one place',
                              backgroundImage: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=2000',
                              overlayOpacity: 0.6,
                              minHeight: '500px',
                              textAlign: 'center',
                              buttonText: isArabic ? 'تصفح البطاقات' : 'Browse Cards',
                              buttonLink: '/products',
                              animationType: 'animate-pulse'
                          }
                      },
                      {
                          id: `section-${currentTimestamp}-2`,
                          type: 'text',
                          props: { 
                              title: isArabic ? 'لماذا نحن؟' : 'Why Us?',
                              text: isArabic ? 'تسليم فوري للأكواد، ضمان تشغيل، ودعم فني على مدار الساعة.' : 'Instant code delivery, working guarantee, and 24/7 support.',
                              textAlign: 'center',
                              backgroundColor: '#f8f9fa',
                              padding: 'large'
                          }
                      }
                  ];
              } else {
                  // General Store Default
                  loadedSections = [
                      {
                          id: `section-${currentTimestamp}-1`,
                          type: 'hero',
                          props: {
                              title: storeName || (isArabic ? 'مرحباً بك' : 'Welcome to Our Store'),
                              subtitle: isArabic ? 'تسوق أحدث المنتجات العصرية' : 'Discover amazing products',
                              buttonText: isArabic ? 'تسوق الآن' : 'Shop Now',
                              buttonLink: '/products',
                              backgroundImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070',
                              textColor: '#ffffff',
                              backgroundColor: '#000000',
                              overlayOpacity: 0.5,
                              minHeight: '500px',
                              textAlign: 'center'
                          }
                      },
                      {
                          id: `section-${currentTimestamp}-2`,
                          type: 'features',
                          props: {
                              title: isArabic ? 'لماذا تختارنا' : 'Why Choose Us',
                              items: [
                                  { icon: '🚀', title: isArabic ? 'شحن سريع' : 'Fast Shipping', description: isArabic ? 'احصل على طلباتك بسرعة' : 'Get your orders quickly' },
                                  { icon: '💎', title: isArabic ? 'جودة عالية' : 'Quality Products', description: isArabic ? 'أفضل جودة مضمونة' : 'Best quality guaranteed' },
                                  { icon: '🛡️', title: isArabic ? 'دفع آمن' : 'Secure Shopping', description: isArabic ? 'عمليات دفع آمنة ومحمية' : 'Safe and secure payments' },
                              ]
                          }
                      }
                  ];
              }
          } else if (pageSlug === 'products') {
              loadedSections = [{
                  id: `section-${currentTimestamp}`,
                  type: 'products',
                  props: {
                      title: isArabic ? 'منتجاتنا' : 'Our Products',
                      limit: 12,
                      layout: 'grid',
                      columns: '4',
                      showPrice: true,
                      showAddToCart: true
                  }
              }];
          } else if (pageSlug === 'categories') {
               loadedSections = [{
                  id: `section-${currentTimestamp}`,
                  type: 'categories-hierarchy',
                  props: {
                      title: isArabic ? 'تصفح الأقسام' : 'Browse Categories',
                      subtitle: isArabic ? 'استكشف مجموعتنا الواسعة من الأقسام' : 'Explore our wide range of categories',
                      productsPerCategory: 8
                  }
               }];
          } else if (pageSlug === 'cart') {
              loadedSections = [{
                  id: `section-${currentTimestamp}`,
                  type: 'cart-section',
                  props: {
                      title: isArabic ? 'سلة التسوق' : 'Shopping Cart',
                  }
              }];
          } else if (pageSlug === 'login' || pageSlug === 'signup') {
               loadedSections = [{
                   id: `section-${currentTimestamp}`,
                   type: 'auth-section',
                   props: {
                       defaultMode: pageSlug,
                       heroTitle: pageSlug === 'login' ? (isArabic ? 'مرحباً بعودتك' : 'Welcome Back') : (isArabic ? 'انضم إلينا' : 'Join Us Today'),
                       heroSubtitle: isArabic ? 'أدر متجرك بكل سهولة' : 'Manage your store with ease'
                   }
               }];
          } else if (pageSlug === 'checkout' || pageSlug === 'checkout-success') {
               loadedSections = [{
                   id: `section-${currentTimestamp}`,
                   type: 'checkout-section',
                   props: {
                       title: isArabic ? 'إتمام الطلب' : 'Checkout',
                   }
               }];
          } else if (pageSlug === 'about' || pageSlug === 'about-us') {
               loadedSections = [{
                   id: `section-${currentTimestamp}`,
                   type: 'about-section',
                   props: {
                       title: isArabic ? 'من نحن' : 'About Us',
                       subtitle: isArabic ? 'قصتنا ورؤيتنا' : 'Our Story & Vision',
                       description: isArabic 
                           ? 'نحن متخصصون في تقديم أفضل الخدمات والمنتجات لعملائنا بجودة عالية وأسعار منافسة.' 
                           : 'We specialize in providing the best services and products to our customers with high quality and competitive prices.',
                       stats: [
                           { value: '100%', label: isArabic ? 'جودة مضمونة' : 'Quality Guaranteed' },
                           { value: '24/7', label: isArabic ? 'دعم مستمر' : 'Continuous Support' },
                       ],
                       showImage: true,
                   }
               }];
          } else if (pageSlug === 'contact' || pageSlug === 'contact-us') {
               loadedSections = [{
                   id: `section-${currentTimestamp}`,
                   type: 'contact-section',
                   props: {
                       title: isArabic ? 'تواصل معنا' : 'Contact Us',
                       subtitle: isArabic ? 'نحن هنا لمساعدتك دائماً' : 'We are here to help you always',
                       email: 'support@example.com',
                       phone: '+966 50 000 0000',
                       address: isArabic ? 'المملكة العربية السعودية' : 'Saudi Arabia',
                       showForm: true,
                       showContactInfo: true,
                   }
               }];
          } else if (pageSlug === 'faqs' || pageSlug === 'faq') {
               loadedSections = [
                   {
                       id: `section-${currentTimestamp}-hero`,
                       type: 'hero',
                       props: {
                           title: isArabic ? 'الأسئلة الشائعة' : 'Frequently Asked Questions',
                           subtitle: isArabic ? 'إجابات على استفساراتك' : 'Answers to your questions',
                           backgroundImage: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?q=80&w=2070',
                           overlayOpacity: 0.6,
                           minHeight: '250px',
                           textAlign: 'center'
                       }
                   },
                   {
                       id: `section-${currentTimestamp}-faq`,
                       type: 'faq-section',
                       props: {
                           title: isArabic ? 'الأسئلة الأكثر تكراراً' : 'Most Frequent Questions',
                           items: [
                               { question: isArabic ? 'كيف أقوم بالطلب؟' : 'How do I place an order?', answer: isArabic ? 'تصفح المنتجات، أضفها للسلة، ثم انتقل لإتمام الدفع.' : 'Browse products, add to cart, then proceed to checkout.' },
                               { question: isArabic ? 'كم مدة التوصيل؟' : 'How long is delivery?', answer: isArabic ? 'عادة ما يتم التوصيل خلال 1-3 أيام عمل حسب موقعك.' : 'Delivery usually takes 1-3 business days depending on your location.' },
                           ]
                       }
                   }
               ];
          } else if (pageSlug === 'privacy-policy' || pageSlug === 'policy' || pageSlug === 'terms') {
               loadedSections = [{
                   id: `section-${currentTimestamp}`,
                   type: 'text',
                   props: {
                       title: isArabic ? 'الشروط والسياسات' : 'Terms & Policies',
                       text: isArabic ? 'هنا يمكنك كتابة سياستكم وشروطكم للحفاظ على حقوقكم وحقوق عملائكم.' : 'Here you can write your policies and terms to protect your rights and your customers rights.',
                       textAlign: 'right',
                       padding: 'large'
                   }
               }];
          } else if (pageSlug === 'support') {
               loadedSections = [{
                   id: `section-${currentTimestamp}`,
                   type: 'support-tickets',
                   props: {
                       title: isArabic ? 'تذاكر الدعم' : 'Support Tickets',
                   }
               }];
          } else if (pageSlug === 'customer-orders') {
               loadedSections = [{
                   id: `section-${currentTimestamp}`,
                   type: 'customer-orders',
                   props: {
                       title: isArabic ? 'طلباتي' : 'My Orders',
                       showSearch: true,
                       showFilters: true
                   }
               }];
          } else if (pageSlug === 'charge-wallet' || pageSlug === 'recharge') {
               loadedSections = [{
                   id: `section-${currentTimestamp}`,
                   type: 'charge-wallet',
                   props: {
                       title: isArabic ? 'شحن المحفظة' : 'Recharge Wallet',
                       showBankTransfer: true,
                       showOnlinePayment: true
                   }
               }];
          } else if (pageSlug === 'wishlist') {
               loadedSections = [{
                   id: `section-${currentTimestamp}`,
                   type: 'favorites-page',
                   props: {
                       title: isArabic ? 'المفضلة' : 'Wishlist',
                       emptyMessage: isArabic ? 'لا توجد منتجات في المفضلة' : 'No products in wishlist'
                   }
               }];
          } else if (pageSlug === 'profile') {
               loadedSections = [{
                   id: `section-${currentTimestamp}`,
                   type: 'profile-page',
                   props: {
                       title: isArabic ? 'الملف الشخصي' : 'Profile',
                       showAvatar: true,
                       showStats: true
                   }
               }];
          } else if (pageSlug === 'inventory') {
               loadedSections = [{
                   id: `section-${currentTimestamp}`,
                   type: 'inventory-page',
                   props: {
                       title: isArabic ? 'المخزون' : 'Inventory',
                   }
               }];
          } else if (pageSlug === 'balance' || pageSlug === 'balance-operations') {
               loadedSections = [{
                   id: `section-${currentTimestamp}`,
                   type: 'balance-operations',
                   props: {
                       title: isArabic ? 'عمليات الرصيد' : 'Balance Operations',
                   }
               }];
          } else if (pageSlug === 'employees') {
               loadedSections = [{
                   id: `section-${currentTimestamp}`,
                   type: 'employees-page',
                   props: {
                       title: isArabic ? 'الموظفين' : 'Employees',
                   }
               }];
          } else if (pageSlug === 'reports') {
               loadedSections = [{
                   id: `section-${currentTimestamp}`,
                   type: 'reports-page',
                   props: {
                       title: isArabic ? 'التقارير' : 'Reports',
                   }
               }];
          } else if (pageSlug === 'bank-accounts') {
               loadedSections = [{
                   id: `section-${currentTimestamp}`,
                   type: 'bank-accounts',
                   props: {
                       title: isArabic ? 'الحسابات البنكية' : 'Bank Accounts',
                   }
               }];
          } else if (pageSlug === 'permissions') {
               loadedSections = [{
                   id: `section-${currentTimestamp}`,
                   type: 'permissions-page',
                   props: {
                       title: isArabic ? 'الصلاحيات' : 'Permissions',
                   }
               }];
          }
      }

      setSections(loadedSections);
      setBackgroundColor((content?.backgroundColor as string) || '#ffffff');
      setIsDarkMode((content?.isDarkMode as boolean) || false);

      // Try to populate the "Created Pages" list if we are in a multi-page context
      try {
        const allPages = await coreApi.getPages(true);
        // Map to the simple format required by the UI
        const pageList = allPages
            .map(p => ({
            name: p.title,
            slug: p.slug,
            id: p.id
        }));
        
        if (pageList.length > 1) {
             setCreatedPages(pageList);
        }
      } catch (err) {
        console.warn('Failed to fetch page list for navigation', err);
      }

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load page',
        variant: 'destructive',
      });
    }
  }, [id, toast, isArabic]);

  // Initialize code editor value when dialog opens or data changes
  useEffect(() => {
    if (showCodeEditor) {
      const pageData = {
        sections: sections || [],
        backgroundColor: backgroundColor || '#ffffff',
        isDarkMode: isDarkMode || false
      };
      const jsonString = JSON.stringify(pageData, null, 2);
      // Only update if value is different to avoid unnecessary re-renders
      if (codeEditorValue !== jsonString) {
        setCodeEditorValue(jsonString);
      }
    }
  }, [showCodeEditor, sections, backgroundColor, isDarkMode, codeEditorValue]);

  const handleCodeEditorChange = (value: string | undefined) => {
    if (value) {
      setCodeEditorValue(value);
    }
  };

  const applyCodeChanges = () => {
    try {
      const parsed = JSON.parse(codeEditorValue);
      if (parsed.sections && Array.isArray(parsed.sections)) {
        setSections(parsed.sections);
        if (parsed.backgroundColor) setBackgroundColor(parsed.backgroundColor);
        if (typeof parsed.isDarkMode === 'boolean') setIsDarkMode(parsed.isDarkMode);
        toast({
          title: 'Success',
          description: 'Code changes applied successfully',
        });
        setShowCodeEditor(false);
      } else {
        throw new Error('Invalid structure: sections array is required');
      }
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Invalid JSON: ${String(error)}`,
        variant: 'destructive',
      });
    }
  };

  const [createdPages, setCreatedPages] = useState<Array<{ name: string; slug: string; id: string }>>([]);
  const [showPagesList, setShowPagesList] = useState(false);

  // ... (rest of loadTemplate) ...

  const loadTemplate = useCallback(async (templateId: string) => {
    try {
      const template = await templateService.getTemplateById(templateId);
      
      const templateContent = template.content as { 
        sections?: Section[];
        backgroundColor?: string;
        isDarkMode?: boolean;
        pages?: Array<{ slug: string; name: string; nameAr?: string; sections: Section[] }>;
      };

      // Handle multi-page template
      if (templateContent.pages && Array.isArray(templateContent.pages) && templateContent.pages.length > 0) {
        toast({
          title: 'Multi-page Template Detected',
          description: 'Setting up all pages from this template...',
        });

        const newCreatedPages: Array<{ name: string; slug: string; id: string }> = [];
        let mainPageFound = false;

        const allPages = await coreApi.getPages(true);

        for (const page of templateContent.pages) {
          const isRoot = page.slug === '/' || page.slug === '';
          const pageSlug = page.slug === '/' ? '' : page.slug.replace(/^\//, '');
          const pageName = page.nameAr || page.name;

          let pageId = '';

          // 1. Check if page already exists by slug
          const existing = allPages.find(p => p.slug === pageSlug);
          
          if (existing) {
            console.log(`Page already exists: ${pageName} (${pageSlug}), using ID ${existing.id}`);
            pageId = existing.id;
          } else {
            try {
              // 2. Try to create the page only if it doesn't exist
              const createdPage = await coreApi.createPage({
                title: pageName,
                slug: pageSlug,
                content: { sections: page.sections },
                draftContent: { sections: page.sections },
                isPublished: true,
              });
              console.log(`Created new page: ${pageName} (${pageSlug})`);
              pageId = createdPage.id;
            } catch (error: unknown) {
               console.warn(`Failed to create page ${pageName}:`, error);
            }
          }

          if (pageId) {
            newCreatedPages.push({ name: pageName, slug: pageSlug, id: pageId });
          }

          const matchesCurrent = slug === page.slug || (slug === '' && isRoot);
          
          if (matchesCurrent && !mainPageFound) {
            setSections(page.sections);
            if (!title) setTitle(pageName);
            if (!slug && !isRoot) setSlug(pageSlug);
            mainPageFound = true;
          } else if (isRoot && !id) {
             // If we are on new page and this is root, load it
             setSections(page.sections);
             setTitle(pageName);
             setSlug('');
             mainPageFound = true;
          }
        }
        
        setCreatedPages(newCreatedPages);
        setShowPagesList(true); // Open the pages list automatically

        toast({
          title: 'Template Applied',
          description: `All pages from "${template.name}" are ready.`,
        });
        
        return;
      }

      setSections(templateContent?.sections || []);
      
      // Extract backgroundColor and isDarkMode if they exist in the template
      if (templateContent?.backgroundColor) {
        setBackgroundColor(templateContent.backgroundColor);
      }
      if (typeof templateContent?.isDarkMode === 'boolean') {
        setIsDarkMode(templateContent.isDarkMode);
      }
      
      setTemplateName(template.name);
      toast({
        title: 'Template Loaded',
        description: `Using "${template.name}" template`,
      });
    } catch (error) {
      console.error('Failed to load template:', error);
      toast({
        title: 'Error',
        description: 'Failed to load template',
        variant: 'destructive',
      });
    }
  }, [toast, slug, title, id]); // Added dependencies

  useEffect(() => {
    const templateId = searchParams.get('templateId');
    
    if (id) {
      loadPage();
    } else if (templateId) {
      loadTemplate(templateId);
    }
  }, [id, searchParams, loadPage, loadTemplate]);

  const handleSaveDraft = async (updatedSections: Section[]) => {
    // Validate title before saving
    if (!title || title.trim().length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Page title is required. Please enter a title before saving.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const content = { 
        sections: updatedSections,
        backgroundColor,
        isDarkMode
      };

      const finalSlug = slug.trim() === '' || slug.trim() === '/' ? '' : slug.trim().replace(/^\/+/, '');

      if (id) {
        await coreApi.updatePage(id, {
          title: title.trim(),
          slug: finalSlug,
          draftContent: content
        });
        toast({ title: 'Draft Saved', description: 'Changes saved to draft' });
      } else {
        await coreApi.createPage({
          title: title.trim(),
          slug: finalSlug,
          content: content, // Initial content
          draftContent: content,
          isPublished: false,
        });
        toast({ title: 'Success', description: 'Page created successfully' });
        navigate('/dashboard/pages');
      }
    } catch (error: unknown) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (updatedSections: Section[]) => {
    // Validate title before publishing
    if (!title || title.trim().length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Page title is required. Please enter a title before publishing.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const content = { 
        sections: updatedSections,
        backgroundColor,
        isDarkMode
      };

      const finalSlug = slug.trim() === '' || slug.trim() === '/' ? '' : slug.trim().replace(/^\/+/, '');

      if (id) {
        await coreApi.updatePage(id, {
          title: title.trim(),
          slug: finalSlug,
          content: content,
          draftContent: content,
          isPublished: true
        });
        toast({ title: 'Published', description: 'Page published successfully' });
      } else {
        await coreApi.createPage({
          title: title.trim(),
          slug: finalSlug,
          content: content,
          draftContent: content,
          isPublished: true,
        });
        toast({ title: 'Published', description: 'Page created and published' });
        navigate('/dashboard/pages');
      }
    } catch (error: unknown) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!id) return;
    try {
      const data = await coreApi.getHistory(id);
      setHistory(data);
      setShowHistory(true);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load history', variant: 'destructive' });
    }
  };

  const handleRestore = async (historyId: string) => {
    if (!id) return;
    try {
      await coreApi.restoreVersion(id, historyId);
      toast({ title: 'Restored', description: 'Version restored to draft' });
      loadPage();
      setShowHistory(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to restore version', variant: 'destructive' });
    }
  };

  const handleError = (error: unknown) => {
    let errorMessage = 'Failed to save page';
    if (error instanceof Error) {
      errorMessage = error.message;
      if (errorMessage.includes('slug already exists') || errorMessage.includes('Conflict')) {
        errorMessage = `A page with the slug "${slug}" already exists. Please use a different URL slug.`;
      }
    }
    toast({
      title: 'Error',
      description: errorMessage,
      variant: 'destructive',
    });
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/dashboard/pages')}
            className="dark:hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('builder.backToPages')}
          </Button>
          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
            / {id ? t('builder.editPage') : t('builder.newPage')}
            {templateName && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <Sparkles className="w-4 h-4" />
                  {t('builder.usingTemplate', { name: templateName })}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 max-w-2xl">
          <div>
            <Label className="text-gray-700 dark:text-gray-300">{t('builder.pageTitle')}</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="About Us"
              className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            />
          </div>
          <div>
            <Label className="text-gray-700 dark:text-gray-300">{t('builder.urlSlug')}</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              placeholder="about-us"
              className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            />
          </div>
        </div>
      </div>

      {/* Builder */}
      <div className="flex-1 overflow-hidden">
        <PageBuilder 
          initialSections={sections} 
          onSave={handleSaveDraft} 
          onPublish={handlePublish}
          onHistory={id ? loadHistory : undefined}
          onCodeEditor={() => {
            // Ensure we have current data before opening editor
            const pageData = {
              sections: sections || [],
              backgroundColor: backgroundColor || '#ffffff',
              isDarkMode: isDarkMode || false
            };
            const jsonString = JSON.stringify(pageData, null, 2);
            setCodeEditorValue(jsonString);
            setEditorMounted(false);
            setShowCodeEditor(true);
          }}
          domain={domain}
          slug={slug}
          initialBackgroundColor={backgroundColor}
          initialDarkMode={isDarkMode}
          onBackgroundColorChange={setBackgroundColor}
          onDarkModeChange={setIsDarkMode}
        />
      </div>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('builder.pageHistory')}</DialogTitle>
            <DialogDescription>
              {t('builder.restoreVersion')}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[300px] mt-4">
            <div className="space-y-4">
              {history.length === 0 ? (
                <p className="text-center text-gray-500 py-8">{t('builder.noHistory')}</p>
              ) : (
                history.map((version) => (
                  <div key={version.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{t('builder.version')} {version.version}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-3 h-3" />
                        {new Date(version.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleRestore(version.id)}
                    >
                      {t('builder.restore')}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Code Editor Dialog */}
      <Dialog open={showCodeEditor} onOpenChange={setShowCodeEditor}>
        {/* ... (existing code editor content) ... */}
        <DialogContent className="max-w-4xl h-[80vh] dark:bg-gray-900 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 dark:text-gray-100">
              <Code className="w-5 h-5" />
              {t('builder.codeEditorTitle')}
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              {t('builder.codeEditorDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 border dark:border-gray-700 rounded-lg overflow-hidden mt-4 relative text-left" style={{ backgroundColor: '#1e1e1e', height: 'calc(80vh - 250px)', minHeight: '400px' }} dir="ltr">
            <div style={{ color: '#d4d4d4', height: '100%', width: '100%' }}>
              <Editor
                key={showCodeEditor ? 'code-editor-open' : 'code-editor-closed'}
                height="100%"
                defaultLanguage="json"
                value={codeEditorValue || JSON.stringify({ sections: sections || [], backgroundColor: backgroundColor || '#ffffff', isDarkMode: isDarkMode || false }, null, 2)}
                onChange={handleCodeEditorChange}
                theme="vs-dark"
                onMount={(editor) => {
                  setEditorMounted(true);
                  const currentValue = codeEditorValue || JSON.stringify({ sections: sections || [], backgroundColor: backgroundColor || '#ffffff', isDarkMode: isDarkMode || false }, null, 2);
                  if (editor.getValue() !== currentValue) {
                    editor.setValue(currentValue);
                  }
                  setTimeout(() => {
                    editor.layout();
                  }, 100);
                  setTimeout(() => {
                    editor.layout();
                  }, 300);
                }}
                loading={<div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-300"><Loader2 className="w-6 h-6 animate-spin mr-2" /> {t('builder.loadingEditor')}</div>}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: true,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  formatOnPaste: true,
                  formatOnType: true,
                  wordWrap: 'on',
                  readOnly: false,
                  cursorStyle: 'line',
                  renderLineHighlight: 'all',
                  scrollbar: {
                    vertical: 'visible',
                    horizontal: 'visible',
                    useShadows: false,
                    verticalScrollbarSize: 10,
                    horizontalScrollbarSize: 10
                  }
                }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowCodeEditor(false)} className="dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700">
              {t('common.cancel')}
            </Button>
            <Button onClick={applyCodeChanges} className="gap-2 dark:bg-blue-600 dark:hover:bg-blue-700">
              <Code className="w-4 h-4" />
              {t('builder.applyChanges')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pages Navigation Sidebar (for multi-page templates) */}
      {/* Pages Navigation Sidebar (for multi-page templates) */}
      {createdPages.length > 0 && (
        <>
          <div 
            className={`absolute top-24 left-4 z-40 transition-all duration-300 ease-in-out ${
              showPagesList 
                ? 'opacity-100 translate-x-0' 
                : 'opacity-0 -translate-x-full pointer-events-none'
            }`}
          >
           <div className="w-64 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-150px)]">
              <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                <div className="flex items-center gap-2">
                   <Layout className="w-4 h-4 text-purple-600" />
                   <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Template Pages</h3>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowPagesList(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="overflow-y-auto p-2 space-y-1">
                 {createdPages.map(page => (
                    <button
                      key={page.id}
                      onClick={() => navigate(`/builder/${page.id}`)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-sm transition-colors text-left group ${
                        (slug === page.slug || (slug === '' && page.slug === ''))
                          ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 font-medium'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <FileText className={`w-4 h-4 shrink-0 ${
                         (slug === page.slug || (slug === '' && page.slug === '')) ? 'text-purple-600' : 'text-gray-400 group-hover:text-gray-600'
                      }`} />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="truncate">{page.name}</span>
                        <span className="text-[10px] opacity-70 truncate">/{page.slug.replace(/^\/+/, '')}</span>
                      </div>
                      {(slug === page.slug || (slug === '' && page.slug === '')) && (
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0" />
                      )}
                    </button>
                 ))}
              </div>
           </div>
          </div>

          {/* Minimal toggle button when closed */}
          {!showPagesList && (
             <button
               onClick={() => setShowPagesList(true)}
               className="absolute top-24 left-0 z-40 bg-white dark:bg-gray-900 border-y border-r border-gray-200 dark:border-gray-800 shadow-md rounded-r-lg p-2.5 flex items-center justify-center group hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
               title="Show Pages"
             >
               <Layout className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-purple-600 transition-colors" />
             </button>
          )}
        </>
      )}

      {/* AI Chat Helper */}
      <AIChatHelper 
        context={{
          currentPage: title || 'New Page',
          userAction: id ? 'editing a page' : 'creating a new page'
        }}
      />
    </div>
  );
}
