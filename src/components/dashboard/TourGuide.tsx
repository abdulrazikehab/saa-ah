import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { 
  HelpCircle, Sparkles, ChevronRight, ChevronLeft, Store, Package, 
  FileText, Settings, LayoutDashboard, X, Bell, Palette, Users,
  Plus, Upload, Download, MousePointer, Save, Eye, Filter, Search,
  Star, Zap, Rocket, MessageCircle, Send, Bot, Loader2
} from 'lucide-react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { aiService } from '@/services/ai.service';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RobotFaceHelper, type RobotMood } from '@/components/common/RobotFaceHelper';

// Context for tour control
interface TourContextType {
  startTour: () => void;
  isRunning: boolean;
}

const TourContext = createContext<TourContextType>({ startTour: () => {}, isRunning: false });

export const useTour = () => useContext(TourContext);

// Tour step definition
interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  target?: string;
  position?: 'center' | 'right' | 'left' | 'bottom';
  navigateTo?: string;
  waitForElement?: boolean; // Wait for element to appear after navigation
  robotMood?: RobotMood; // Robot face expression for this step
}

// Chat Component
const TourChat = ({ step, onClose }: { step: TourStep; onClose: () => void }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { 
      role: 'assistant', 
      content: isRTL 
        ? `مرحباً! أنا مساعدك الذكي. يمكنني إخبارك المزيد عن "${step.title}". ماذا تريد أن تعرف؟`
        : `Hi! I'm your AI assistant. I can tell you more about "${step.title}". What would you like to know?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      // Call AI Service with context about the current step
      const response = await aiService.chat({
        message: userMsg,
        context: {
          currentSection: step.title,
          currentPage: step.navigateTo || 'dashboard',
          userAction: 'tour_guide_question'
        }
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.response }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: isRTL ? 'عذراً، حدث خطأ في الاتصال. حاول مرة أخرى.' : 'Sorry, connection error. Please try again.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="border-t border-border/50 bg-muted/30"
    >
      <div className="p-4 h-[300px] flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-teal-600">
            <Bot className="w-4 h-4" />
            <span className="text-sm font-semibold">{isRTL ? 'المساعد الذكي' : 'AI Assistant'}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
            <X className="w-3 h-3" />
          </Button>
        </div>

        <ScrollArea className="flex-1 pr-3 mb-3" ref={scrollRef}>
          <div className="space-y-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={cn("flex gap-2", msg.role === 'user' ? "flex-row-reverse" : "")}>
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                  msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-teal-100 text-teal-600"
                )}>
                  {msg.role === 'user' ? <Users className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                </div>
                <div className={cn(
                  "p-2.5 rounded-2xl text-sm max-w-[85%]",
                  msg.role === 'user' 
                    ? "bg-primary text-primary-foreground rounded-tr-none" 
                    : "bg-white dark:bg-gray-800 border shadow-sm rounded-tl-none"
                )}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3 h-3" />
                </div>
                <div className="bg-white dark:bg-gray-800 border shadow-sm rounded-2xl rounded-tl-none p-3 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2 mt-auto pt-2 border-t border-border/50">
          <Input 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={isRTL ? 'اكتب سؤالك هنا...' : 'Type your question...'}
            className="h-9 text-sm bg-background"
          />
          <Button size="sm" onClick={handleSend} disabled={loading || !input.trim()} className="h-9 w-9 p-0 bg-teal-600 hover:bg-teal-700">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// Tour Provider Component
export const TourProvider = ({ children }: { children: React.ReactNode }) => {
  const [isRunning, setIsRunning] = useState(false);
  
  const startTour = useCallback(() => {
    localStorage.removeItem('tour_completed');
    setIsRunning(true);
  }, []);

  const stopTour = useCallback(() => {
    setIsRunning(false);
    localStorage.setItem('tour_completed', 'true');
    document.querySelectorAll('.tour-highlight-active').forEach(el => {
      el.classList.remove('tour-highlight-active');
    });
  }, []);
  
  return (
    <TourContext.Provider value={{ startTour, isRunning }}>
      {children}
      <CustomTourGuide isRunning={isRunning} onClose={stopTour} />
    </TourContext.Provider>
  );
};

// Custom Tour Guide Component
const CustomTourGuide = ({ 
  isRunning, 
  onClose 
}: { 
  isRunning: boolean; 
  onClose: () => void;
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const retryCountRef = useRef(0);
  const isRTL = i18n.language === 'ar';

  // Comprehensive tour steps with page-specific elements
  const steps: TourStep[] = [
    // === WELCOME ===
    {
      id: 'welcome',
      title: 'مرحباً بك في سِعَة! 🎉',
      description: 'سنأخذك في جولة شاملة للتعرف على جميع أقسام لوحة التحكم وكيفية استخدامها.',
      icon: <Sparkles className="w-8 h-8 text-white" />,
      position: 'center',
      robotMood: 'excited',
    },

    // === SETTINGS ===
    {
      id: 'settings-nav',
      title: 'لنبدأ بالإعدادات ⚙️',
      description: 'أول خطوة هي إعداد متجرك. اضغط على "الإعدادات العامة" في القائمة.',
      icon: <Settings className="w-6 h-6" />,
      target: '#tour-sidebar-settings',
      navigateTo: '/dashboard/settings',
      robotMood: 'thinking',
    },
    {
      id: 'settings-save',
      title: 'حفظ الإعدادات 💾',
      description: 'بعد تعديل أي إعدادات، اضغط على زر "حفظ" لحفظ التغييرات.',
      icon: <Save className="w-6 h-6" />,
      target: '#tour-settings-save-btn',
      waitForElement: true,
      robotMood: 'wink',
    },
    {
      id: 'settings-info',
      title: 'ما يمكنك تعديله',
      description: '• اسم المتجر والشعار\n• العملة الافتراضية\n• طرق الدفع (مدى، فيزا)\n• إعدادات الشحن\n• الضرائب والفواتير',
      icon: <Settings className="w-6 h-6" />,
      position: 'center',
      robotMood: 'happy',
    },

    // === HIERARCHICAL ===
    {
      id: 'hierarchical-nav',
      title: 'المستكشف الهرمي 🏷️',
      description: 'لتنظيم منتجاتك في علامات تجارية وفئات. اضغط هنا.',
      icon: <Store className="w-6 h-6" />,
      target: '#tour-sidebar-hierarchical',
      navigateTo: '/dashboard/hierarchical',
      robotMood: 'happy',
    },
    {
      id: 'hierarchical-add-brand',
      title: 'إضافة علامة تجارية',
      description: 'اضغط على "إضافة علامة تجارية" لإنشاء علامة جديدة مثل Nike أو Apple.',
      icon: <Plus className="w-6 h-6" />,
      target: '#tour-brands-add-btn',
      waitForElement: true,
      robotMood: 'excited',
    },
    {
      id: 'hierarchical-add-category',
      title: 'إضافة فئة',
      description: 'بعد إنشاء العلامة، أضف فئات لها. اضغط "إضافة فئة".',
      icon: <Plus className="w-6 h-6" />,
      target: '#tour-categories-add-btn',
      waitForElement: true,
      robotMood: 'happy',
    },
    {
      id: 'hierarchical-info',
      title: 'نصيحة مهمة 💡',
      description: 'التنظيم الجيد = تجربة أفضل للعملاء!\n\nمثال:\n🏷️ Nike\n  📁 أحذية رياضية\n    📁 أحذية جري\n  📁 ملابس رياضية',
      icon: <Store className="w-6 h-6" />,
      position: 'center',
      robotMood: 'wink',
    },

    // === PRODUCTS ===
    {
      id: 'products-nav',
      title: 'إدارة المنتجات 📦',
      description: 'الآن لإضافة منتجاتك. اضغط على "المنتجات".',
      icon: <Package className="w-6 h-6" />,
      target: '#tour-sidebar-products',
      navigateTo: '/dashboard/products',
      robotMood: 'excited',
    },
    {
      id: 'products-add',
      title: 'إضافة منتج جديد ➕',
      description: 'اضغط هنا لإضافة منتج جديد. سيفتح نموذج خطوة بخطوة.',
      icon: <Plus className="w-6 h-6" />,
      target: '#tour-products-add-btn',
      waitForElement: true,
      robotMood: 'happy',
    },
    {
      id: 'products-import',
      title: 'استيراد من Excel 📥',
      description: 'لديك منتجات كثيرة؟ اضغط "استيراد" لرفع ملف Excel.',
      icon: <Upload className="w-6 h-6" />,
      target: '#tour-products-import-btn',
      waitForElement: true,
      robotMood: 'thinking',
    },
    {
      id: 'products-export',
      title: 'تصدير المنتجات 📤',
      description: 'تصدير جميع منتجاتك لملف Excel للنسخ الاحتياطي.',
      icon: <Download className="w-6 h-6" />,
      target: '#tour-products-export-btn',
      waitForElement: true,
      robotMood: 'happy',
    },
    {
      id: 'products-search',
      title: 'البحث والفلترة 🔍',
      description: 'ابحث عن أي منتج بسرعة. يمكنك الفلترة حسب الفئة أو الحالة.',
      icon: <Search className="w-6 h-6" />,
      target: '#tour-products-search',
      waitForElement: true,
      robotMood: 'thinking',
    },

    // === PAGES ===
    {
      id: 'pages-nav',
      title: 'إدارة الصفحات 📄',
      description: 'لإنشاء صفحات مخصصة. اضغط على "الصفحات".',
      icon: <FileText className="w-6 h-6" />,
      target: '#tour-sidebar-pages',
      navigateTo: '/dashboard/pages',
      robotMood: 'happy',
    },
    {
      id: 'pages-add',
      title: 'إنشاء صفحة جديدة',
      description: 'اضغط لإنشاء صفحة مثل "من نحن" أو "سياسة الخصوصية".',
      icon: <Plus className="w-6 h-6" />,
      target: '#tour-pages-add-btn',
      waitForElement: true,
      robotMood: 'excited',
    },
    {
      id: 'pages-info',
      title: 'المحرر المرئي ✨',
      description: 'استخدم المحرر المرئي لتصميم صفحاتك بسهولة:\n• سحب وإفلات العناصر\n• إضافة نصوص وصور\n• معاينة مباشرة',
      icon: <Eye className="w-6 h-6" />,
      position: 'center',
      robotMood: 'wink',
    },

    // === CUSTOMERS ===
    {
      id: 'customers-nav',
      title: 'إدارة العملاء 👥',
      description: 'لمتابعة عملائك وطلباتهم. اضغط على "العملاء".',
      icon: <Users className="w-6 h-6" />,
      target: '#tour-sidebar-customers',
      navigateTo: '/dashboard/customers',
      robotMood: 'happy',
    },
    {
      id: 'customers-info',
      title: 'ما ستجده هنا',
      description: '• قائمة جميع العملاء\n• تاريخ الطلبات\n• إجمالي المشتريات\n• تصدير البيانات\n• التواصل مع العملاء',
      icon: <Users className="w-6 h-6" />,
      position: 'center',
      robotMood: 'love',
    },

    // === DESIGN ===
    // {
    //   id: 'design-nav',
    //   title: 'تصميم المتجر 🎨',
    //   description: 'لتخصيص مظهر متجرك. اضغط على "تصميم المتجر".',
    //   icon: <Palette className="w-6 h-6" />,
    //   target: '#tour-sidebar-design',
    //   navigateTo: '/dashboard/design',
    //   robotMood: 'excited',
    // },
    {
      id: 'design-info',
      title: 'خيارات التصميم',
      description: '• الألوان الرئيسية\n• الخطوط\n• تخطيط الصفحات\n• شكل بطاقات المنتجات\n• الهيدر والفوتر',
      icon: <Palette className="w-6 h-6" />,
      position: 'center',
      robotMood: 'happy',
    },

    // === ORDERS ===
    {
      id: 'orders-nav',
      title: 'إدارة الطلبات 🛒',
      description: 'تابع جميع طلبات متجرك. اضغط على "الطلبات".',
      icon: <Package className="w-6 h-6" />,
      target: '#tour-sidebar-orders',
      navigateTo: '/dashboard/orders',
      robotMood: 'happy',
    },
    {
      id: 'orders-info',
      title: 'ما يمكنك فعله بالطلبات',
      description: '• عرض تفاصيل كل طلب\n• تحديث حالة الطلب\n• طباعة الفواتير\n• التواصل مع العميل\n• تصدير بيانات الطلبات',
      icon: <Package className="w-6 h-6" />,
      position: 'center',
      robotMood: 'thinking',
    },

    // === REPORTS ===
    {
      id: 'reports-nav',
      title: 'التقارير والإحصائيات 📊',
      description: 'تحليلات مفصلة لأداء متجرك. اضغط على "التقارير".',
      icon: <LayoutDashboard className="w-6 h-6" />,
      target: '#tour-sidebar-reports',
      navigateTo: '/dashboard/reports',
      robotMood: 'thinking',
    },
    {
      id: 'reports-info',
      title: 'أنواع التقارير',
      description: '• تقارير المبيعات\n• أداء المنتجات\n• سلوك العملاء\n• مقارنات زمنية\n• تصدير للـ Excel',
      icon: <LayoutDashboard className="w-6 h-6" />,
      position: 'center',
      robotMood: 'happy',
    },

    // === EMPLOYEES/USERS ===
    {
      id: 'users-nav',
      title: 'إدارة الموظفين 👨‍💼',
      description: 'أضف موظفين وحدد صلاحياتهم. اضغط على "المستخدمين والصلاحيات".',
      icon: <Users className="w-6 h-6" />,
      target: '#tour-sidebar-users',
      navigateTo: '/dashboard/settings/users',
      robotMood: 'happy',
    },
    {
      id: 'users-info',
      title: 'صلاحيات الموظفين',
      description: '• إضافة موظفين جدد\n• تحديد الصلاحيات لكل موظف\n• مدير كامل أو محدود\n• صلاحيات المنتجات فقط\n• صلاحيات الطلبات فقط',
      icon: <Users className="w-6 h-6" />,
      position: 'center',
      robotMood: 'wink',
    },

    // === STORE MANAGEMENT ===
    {
      id: 'management-nav',
      title: 'إدارة المتاجر 🏪',
      description: 'هل لديك أكثر من متجر؟ أدِرها من هنا. اضغط على "إدارة المتجر".',
      icon: <Store className="w-6 h-6" />,
      target: '#tour-sidebar-management',
      navigateTo: '/dashboard/management',
      robotMood: 'excited',
    },
    {
      id: 'management-info',
      title: 'إمكانيات إدارة المتاجر',
      description: '• إنشاء متجر جديد\n• التبديل بين المتاجر\n• نسخ إعدادات متجر لآخر\n• إدارة النطاقات\n• إعدادات كل متجر',
      icon: <Store className="w-6 h-6" />,
      position: 'center',
      robotMood: 'happy',
    },

    // === NOTIFICATIONS ===
    {
      id: 'notifications',
      title: 'الإشعارات 🔔',
      description: 'هنا تظهر الإشعارات: طلبات جديدة، تنبيهات المخزون، ورسائل العملاء.',
      icon: <Bell className="w-6 h-6" />,
      target: '#tour-header-notifications',
      robotMood: 'surprised',
    },

    // === COMPLETION ===
    {
      id: 'complete',
      title: 'تهانينا! 🎊',
      description: 'لقد أكملت الجولة التعريفية بنجاح!',
      icon: <Sparkles className="w-8 h-8 text-white" />,
      position: 'center',
      robotMood: 'love',
    },
    {
      id: 'next-steps',
      title: 'خطواتك التالية 🚀',
      description: '1️⃣ أكمل إعدادات المتجر\n2️⃣ أضف العلامات والفئات\n3️⃣ أضف منتجاتك\n4️⃣ أنشئ الصفحات\n5️⃣ شارك رابط متجرك!\n\nنتمنى لك التوفيق! 💪',
      icon: <Sparkles className="w-8 h-8 text-white" />,
      position: 'center',
      robotMood: 'excited',
    },
  ];

  // Find and highlight element
  const findAndHighlight = useCallback((selector: string): boolean => {
    const element = document.querySelector(selector);
    if (element) {
      // Scroll into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Small delay for scroll to complete
      setTimeout(() => {
        const rect = element.getBoundingClientRect();
        setHighlightRect(rect);
        element.classList.add('tour-highlight-active');
      }, 300);
      
      return true;
    }
    return false;
  }, []);

  // Handle step changes
  useEffect(() => {
    if (!isRunning) return;

    const step = steps[currentStep];
    retryCountRef.current = 0;

    // Clear previous highlights
    document.querySelectorAll('.tour-highlight-active').forEach(el => {
      el.classList.remove('tour-highlight-active');
    });
    setHighlightRect(null);

    // Handle navigation
    if (step.navigateTo && location.pathname !== step.navigateTo) {
      setIsNavigating(true);
      navigate(step.navigateTo);
      return;
    }

    setIsNavigating(false);

    // Try to find target element
    if (step.target) {
      const tryFind = () => {
        const found = findAndHighlight(step.target!);
        if (!found && retryCountRef.current < 10) {
          retryCountRef.current++;
          setTimeout(tryFind, 300);
        } else if (!found) {
          // Element not found after retries, show center message
          setHighlightRect(null);
        }
      };

      // Wait a bit for page to render if we just navigated
      if (step.waitForElement) {
        setTimeout(tryFind, 500);
      } else {
        tryFind();
      }
    }

    // Resize handler
    const handleResize = () => {
      if (step.target) {
        const element = document.querySelector(step.target);
        if (element) {
          const rect = element.getBoundingClientRect();
          setHighlightRect(rect);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, isRunning, location.pathname]);

  // Handle when navigation completes
  useEffect(() => {
    if (!isRunning || !isNavigating) return;

    const step = steps[currentStep];
    if (step.navigateTo && location.pathname === step.navigateTo) {
      setIsNavigating(false);
      
      // Now try to find element
      if (step.target) {
        setTimeout(() => {
          findAndHighlight(step.target!);
        }, 500);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, isNavigating, isRunning]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      // Smooth transition out
      document.querySelectorAll('.tour-highlight-active').forEach(el => {
        el.classList.remove('tour-highlight-active');
      });
      setHighlightRect(null);
      
      // Small delay for smooth transition
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 150);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      // Smooth transition out
      document.querySelectorAll('.tour-highlight-active').forEach(el => {
        el.classList.remove('tour-highlight-active');
      });
      setHighlightRect(null);
      
      // Small delay for smooth transition
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
      }, 150);
    }
  };

  const handleSkip = () => {
    document.querySelectorAll('.tour-highlight-active').forEach(el => {
      el.classList.remove('tour-highlight-active');
    });
    onClose();
  };

  const handleHighlightClick = () => {
    const step = steps[currentStep];
    if (step.navigateTo) {
      navigate(step.navigateTo);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 300);
    } else {
      handleNext();
    }
  };

  if (!isRunning) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isCenter = step.position === 'center' || (!step.target && !highlightRect);
  const hasTarget = step.target && highlightRect;

  // Card position - Position card at bottom-center so content above is visible
  const getCardPosition = (): { className: string; style: React.CSSProperties } => {
    if (isCenter) {
      return { 
        className: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2", 
        style: {} 
      };
    }
    
    // For highlighted elements, position card at bottom center of viewport
    // This ensures the content/setup above is visible
    const style: React.CSSProperties = {
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
    };
    
    return { className: '', style };
  };

  const cardPosition = getCardPosition();

  return (
    <AnimatePresence>
      {isRunning && (
        <>
          {/* Cinematic Overlay with gradient vignette */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[9998] pointer-events-none"
            style={{ 
              background: 'radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.4) 100%)',
            }}
          />

          {/* Animated spotlight effect */}
          {hasTarget && highlightRect && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9997] pointer-events-none"
              style={{
                background: `radial-gradient(ellipse ${highlightRect.width + 100}px ${highlightRect.height + 100}px at ${highlightRect.left + highlightRect.width / 2}px ${highlightRect.top + highlightRect.height / 2}px, transparent 40%, rgba(0, 0, 0, 0.5) 70%)`,
              }}
            />
          )}

          {/* Clickable Highlight Border with multiple layers */}
          {hasTarget && highlightRect && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                rotate: 0,
              }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ 
                type: 'spring',
                stiffness: 300,
                damping: 25,
                mass: 0.8
              }}
              className="fixed cursor-pointer z-[9999]"
              style={{
                left: highlightRect.left - 16,
                top: highlightRect.top - 16,
                width: highlightRect.width + 32,
                height: highlightRect.height + 32,
              }}
              onClick={handleHighlightClick}
            >
              {/* Outer glow ring */}
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.6, 0.9, 0.6],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute inset-0 rounded-3xl"
                style={{
                  background: 'radial-gradient(circle, rgba(0, 169, 157, 0.4) 0%, transparent 70%)',
                  filter: 'blur(8px)',
                }}
              />
              
              {/* Middle animated border */}
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(0, 169, 157, 0.6), 0 0 40px rgba(0, 169, 157, 0.4), inset 0 0 20px rgba(0, 169, 157, 0.2)',
                    '0 0 40px rgba(0, 169, 157, 0.8), 0 0 60px rgba(0, 169, 157, 0.5), inset 0 0 30px rgba(0, 169, 157, 0.3)',
                    '0 0 20px rgba(0, 169, 157, 0.6), 0 0 40px rgba(0, 169, 157, 0.4), inset 0 0 20px rgba(0, 169, 157, 0.2)',
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute inset-0 rounded-3xl border-[3px] border-teal-400"
              />
              
              {/* Inner highlight */}
              <motion.div
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute inset-[6px] rounded-2xl bg-gradient-to-br from-teal-400/20 to-cyan-400/20"
              />

              {/* Sparkle particles */}
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-teal-400"
                  style={{
                    left: `${20 + (i * 12)}%`,
                    top: `${15 + (i % 3) * 30}%`,
                  }}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                    y: [-10, -20, -10],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: 'easeInOut',
                  }}
                />
              ))}

              {/* Click hint */}
              {step.navigateTo && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    scale: 1,
                  }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ 
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                  }}
                  className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-500 text-white px-6 py-3 rounded-full text-sm font-bold shadow-2xl whitespace-nowrap backdrop-blur-sm"
                  style={{
                    backgroundSize: '200% 100%',
                    animation: 'gradient-shift 3s ease infinite',
                  }}
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <MousePointer className="w-4 h-4" />
                  </motion.div>
                  <span>اضغط هنا للانتقال</span>
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <ChevronRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Tour Card with cinematic entrance */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 30, scale: 0.9, rotateX: -15 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ 
              type: 'spring', 
              damping: 30, 
              stiffness: 400,
              mass: 0.8
            }}
            className={cn("fixed z-[10000]", cardPosition.className)}
            style={{
              ...cardPosition.style,
              perspective: '1000px',
            }}
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <Card className="w-[400px] max-w-[90vw] shadow-2xl border-0 overflow-hidden bg-gradient-to-br from-card/98 via-card/95 to-card/98 backdrop-blur-2xl relative">
                {/* Animated background gradient */}
                <motion.div
                  className="absolute inset-0 opacity-30"
                  animate={{
                    background: [
                      'radial-gradient(circle at 0% 0%, rgba(0, 169, 157, 0.1) 0%, transparent 50%)',
                      'radial-gradient(circle at 100% 100%, rgba(0, 169, 157, 0.1) 0%, transparent 50%)',
                      'radial-gradient(circle at 0% 0%, rgba(0, 169, 157, 0.1) 0%, transparent 50%)',
                    ],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
                
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 opacity-20"
                  animate={{
                    x: ['-100%', '200%'],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatDelay: 2,
                    ease: 'easeInOut',
                  }}
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                  }}
                />

                {/* Progress bar with glow */}
                <div className="h-2 bg-muted/50 relative overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-500 relative"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    style={{
                      backgroundSize: '200% 100%',
                      animation: 'gradient-shift 3s ease infinite',
                    }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-white/30"
                      animate={{
                        x: ['-100%', '100%'],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    />
                  </motion.div>
                </div>

              <CardContent className="p-6 relative z-10">
                {/* Header with Robot Face */}
                <div className="flex items-start gap-4 mb-5">
                  {/* Robot Face Helper - Replaces the old icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      type: 'spring',
                      stiffness: 300,
                      damping: 20,
                      delay: 0.1
                    }}
                    whileHover={{ scale: 1.1 }}
                    className="flex-shrink-0"
                  >
                    <RobotFaceHelper
                      mood={step.robotMood || 'happy'}
                      size="lg"
                      isArabic={isRTL}
                    />
                  </motion.div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <motion.h3
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl font-bold leading-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
                      >
                        {step.title}
                      </motion.h3>
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-foreground hover:bg-destructive/10"
                          onClick={handleSkip}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    </div>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line"
                    >
                      {step.description}
                    </motion.p>
                  </div>
                </div>

                {/* Step Counter with animated dots */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center justify-between mb-5 px-1"
                >
                  <div className="flex items-center gap-3">
                    <motion.span
                      key={currentStep}
                      initial={{ scale: 1.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-sm text-muted-foreground font-medium"
                    >
                      الخطوة {currentStep + 1} من {steps.length}
                    </motion.span>
                    
                    {/* AI Chat Toggle */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowChat(!showChat)}
                      className={cn(
                        "h-6 px-2 text-xs gap-1.5 rounded-full transition-all duration-300",
                        showChat 
                          ? "bg-teal-100 text-teal-700 hover:bg-teal-200" 
                          : "bg-teal-50 text-teal-600 hover:bg-teal-100"
                      )}
                    >
                      <Sparkles className="w-3 h-3" />
                      {showChat ? (isRTL ? 'إخفاء المساعد' : 'Hide AI') : (isRTL ? 'اسأل الذكاء الاصطناعي' : 'Ask AI')}
                    </Button>
                  </div>

                  <div className="flex gap-1.5">
                    {Array.from({ length: Math.min(steps.length, 8) }).map((_, idx) => {
                      const stepIdx = Math.floor(currentStep / 8) * 8 + idx;
                      const isActive = stepIdx === currentStep;
                      const isCompleted = stepIdx < currentStep;
                      
                      return (
                        <motion.div
                          key={idx}
                          initial={{ scale: 0 }}
                          animate={{ 
                            scale: isActive ? 1.2 : 1,
                            width: isActive ? 24 : isCompleted ? 8 : 8,
                          }}
                          whileHover={{ scale: 1.3 }}
                          transition={{ 
                            type: 'spring',
                            stiffness: 400,
                            damping: 20
                          }}
                          className={cn(
                            "h-2 rounded-full transition-all duration-300",
                            isActive
                              ? "bg-gradient-to-r from-teal-500 to-cyan-500 shadow-lg shadow-teal-500/50" 
                              : isCompleted 
                                ? "bg-teal-500/50"
                                : "bg-muted"
                          )}
                        />
                      );
                    })}
                  </div>
                </motion.div>

                {/* AI Chat Interface */}
                <AnimatePresence>
                  {showChat && (
                    <TourChat step={step} onClose={() => setShowChat(false)} />
                  )}
                </AnimatePresence>

                {/* Navigation Buttons with enhanced animations */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className={cn("flex gap-3", isRTL && "flex-row-reverse")}
                >
                  <AnimatePresence>
                    {currentStep > 0 && (
                      <motion.div
                        initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                      >
                        <Button
                          variant="outline"
                          onClick={handlePrev}
                          className="gap-2 px-4 relative overflow-hidden group"
                        >
                          <motion.div
                            whileHover={{ x: isRTL ? -3 : 3 }}
                            transition={{ type: 'spring', stiffness: 400 }}
                          >
                            {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                          </motion.div>
                          السابق
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <motion.div
                    className="flex-1"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={handleNext}
                      className="w-full gap-2 bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-500 hover:from-teal-600 hover:via-cyan-600 hover:to-teal-600 font-semibold shadow-xl relative overflow-hidden group"
                      style={{
                        backgroundSize: '200% 100%',
                      }}
                    >
                      {/* Animated background */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        animate={{
                          x: ['-100%', '100%'],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                      />
                      
                      <motion.span
                        className="relative z-10 flex items-center gap-2"
                        animate={currentStep === steps.length - 1 ? {
                          scale: [1, 1.05, 1],
                        } : {}}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      >
                        {currentStep === steps.length - 1 ? (
                          <>
                            <motion.div
                              animate={{ rotate: [0, 360] }}
                              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                            >
                              <Rocket className="h-4 w-4" />
                            </motion.div>
                            ابدأ الآن!
                          </>
                        ) : (
                          <>
                            التالي
                            <motion.div
                              animate={{ x: [0, 5, 0] }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                            >
                              {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </motion.div>
                          </>
                        )}
                      </motion.span>
                    </Button>
                  </motion.div>
                </motion.div>

                {/* Skip Link with subtle animation */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSkip}
                  className="w-full mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  تخطي الجولة
                </motion.button>
              </CardContent>
            </Card>
          </motion.div>
          </motion.div>

          {/* Enhanced CSS animations */}
          <style>{`
            @keyframes gradient-shift {
              0%, 100% {
                background-position: 0% 50%;
              }
              50% {
                background-position: 100% 50%;
              }
            }
            
            @keyframes tour-glow {
              0%, 100% {
                box-shadow: 0 0 30px rgba(0, 169, 157, 0.7), 0 0 60px rgba(0, 169, 157, 0.4);
              }
              50% {
                box-shadow: 0 0 50px rgba(0, 169, 157, 0.9), 0 0 80px rgba(0, 169, 157, 0.5);
              }
            }
            
            .tour-highlight-active {
              position: relative;
              z-index: 1;
              transition: all 0.3s ease;
            }
            
            .tour-highlight-active::before {
              content: '';
              position: absolute;
              inset: -4px;
              border-radius: inherit;
              padding: 2px;
              background: linear-gradient(45deg, rgba(0, 169, 157, 0.3), rgba(0, 255, 255, 0.3));
              -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
              -webkit-mask-composite: xor;
              mask-composite: exclude;
              animation: border-glow 2s ease-in-out infinite;
            }
            
            @keyframes border-glow {
              0%, 100% {
                opacity: 0.5;
              }
              50% {
                opacity: 1;
              }
            }
          `}</style>
        </>
      )}
    </AnimatePresence>
  );
};

// Exports
export const StartTourButton = ({ className = '' }: { className?: string }) => {
  const { startTour } = useTour();
  
  return (
    <Button
      onClick={startTour}
      variant="outline"
      size="sm"
      className={`gap-2 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border-teal-500/30 hover:border-teal-500/50 hover:bg-teal-500/20 ${className}`}
    >
      <Sparkles className="h-4 w-4 text-teal-500" />
      <span>ابدأ الجولة التعريفية</span>
    </Button>
  );
};

export const TourHelpButton = () => {
  const { startTour } = useTour();
  
  return (
    <Button
      onClick={startTour}
      variant="ghost"
      size="icon"
      className="relative"
      title="ابدأ الجولة التعريفية"
    >
      <HelpCircle className="h-5 w-5" />
    </Button>
  );
};

export const TourGuide = () => null;
