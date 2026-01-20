import { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SectionLibrary } from './SectionLibrary';
import { SortableSection } from './SortableSection';
import { PropertyPanel } from './PropertyPanel';
import { TemplateGallery } from './TemplateGallery';
import { Template } from '@/services/template.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Eye, Code, Sparkles, ExternalLink, Search, Palette, Moon, Sun, Globe, RotateCcw, Layout } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { aiService } from '@/services/ai.service';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

export interface Section {
  id: string;
  type: string;
  props: Record<string, unknown>;
}

interface PageBuilderProps {
  initialSections?: Section[];
  onSave?: (sections: Section[]) => void;
  domain?: string | null;
  slug?: string;
  initialBackgroundColor?: string;
  initialDarkMode?: boolean;
  onBackgroundColorChange?: (color: string) => void;
  onDarkModeChange?: (isDark: boolean) => void;
  onPublish?: (sections: Section[]) => void;
  onHistory?: () => void;
  onCodeEditor?: () => void;
}

export function PageBuilder({ 
  initialSections = [], 
  onSave, 
  domain, 
  slug,
  initialBackgroundColor = '#ffffff',
  initialDarkMode = false,
  onBackgroundColorChange,
  onDarkModeChange,
  onPublish,
  onHistory,
  onCodeEditor
}: PageBuilderProps) {
  const { t, i18n } = useTranslation();
  const [sections, setSections] = useState<Section[]>(initialSections);
  const { toast } = useToast();
  const isArabic = i18n.language === 'ar';

  // Sync sections when initialSections prop changes
  useEffect(() => {
    setSections(initialSections);
  }, [initialSections]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [backgroundColor, setBackgroundColor] = useState(initialBackgroundColor);
  const [isDarkMode, setIsDarkMode] = useState(initialDarkMode);
  const [showAIDesignDialog, setShowAIDesignDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingDesign, setIsGeneratingDesign] = useState(false);

  const handleAIDesign = async () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingDesign(true);
    try {
      const result = await aiService.generateDesign(aiPrompt);
      if (result.section) {
        setSections([...sections, result.section]);
        setSelectedSectionId(result.section.id);
        setShowAIDesignDialog(false);
        setAiPrompt('');
        toast({
          title: t('builder.aiDesignSuccess', 'Design Generated'),
          description: t('builder.aiDesignSuccessDesc', 'AI has created a new section for you.'),
        });
      } else {
        throw new Error('Failed to generate section');
      }
    } catch (error) {
      console.error('AI Design Error:', error);
      toast({
        title: t('common.error'),
        description: t('builder.aiDesignError', 'Failed to generate design. Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingDesign(false);
    }
  };

  // Sync background color when prop changes
  useEffect(() => {
    setBackgroundColor(initialBackgroundColor);
  }, [initialBackgroundColor]);

  // Sync dark mode when prop changes
  useEffect(() => {
    setIsDarkMode(initialDarkMode);
  }, [initialDarkMode]);

  // Derived state for selected section
  const selectedSection = sections.find(s => s.id === selectedSectionId) || null;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAddSection = (type: string) => {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      type,
      props: getDefaultProps(type, t),
    };
    setSections([...sections, newSection]);
    // Automatically select the new section
    setSelectedSectionId(newSection.id);
  };

  const handleUpdateSection = (id: string, props: Record<string, unknown>) => {
    setSections(prevSections => prevSections.map(s => s.id === id ? { ...s, props } : s));
  };

  const handleDeleteSection = (id: string) => {
    setSections(prevSections => prevSections.filter(s => s.id !== id));
    if (selectedSectionId === id) {
      setSelectedSectionId(null);
    }
  };

  const handleDuplicateSection = (id: string) => {
    const sectionIndex = sections.findIndex(s => s.id === id);
    if (sectionIndex === -1) return;

    const sectionToDuplicate = sections[sectionIndex];
    const newSection: Section = {
      ...sectionToDuplicate,
      id: `section-${Date.now()}`,
      props: JSON.parse(JSON.stringify(sectionToDuplicate.props)), // Deep copy props
    };

    const newSections = [...sections];
    newSections.splice(sectionIndex + 1, 0, newSection);
    setSections(newSections);
    setSelectedSectionId(newSection.id);
  };

  const handleSave = () => {
    onSave?.(sections);
  };

  const handleSelectTemplate = (template: Template) => {
    if (template.content && template.content.sections) {
      const newSections = template.content.sections;
      setSections(newSections);
      setShowTemplateGallery(false);
      setSelectedSectionId(null);
      
      // Extract backgroundColor and isDarkMode from template content if they exist
      const templateContent = template.content as { 
        sections: Section[];
        backgroundColor?: string;
        isDarkMode?: boolean;
      };
      
      if (templateContent?.backgroundColor) {
        handleBackgroundColorChange(templateContent.backgroundColor);
      }
      if (typeof templateContent?.isDarkMode === 'boolean' && templateContent.isDarkMode !== isDarkMode) {
        // Only update if different from current state
        setIsDarkMode(templateContent.isDarkMode);
        onDarkModeChange?.(templateContent.isDarkMode);
      }
      
      // Immediately save the template to parent component
      onSave?.(newSections);
      
      toast({
        title: t('builder.templateApplied'),
        description: t('builder.templateAppliedDesc', { name: template.name }),
      });
    } else {
      toast({
        title: t('common.error'),
        description: t('builder.templateError'),
        variant: 'destructive',
      });
    }
  };

  const handleLivePreview = () => {
    if (domain && slug) {
      const protocol = window.location.protocol;
      const normalizedSlug = slug === '/' ? '' : slug.startsWith('/') ? slug : `/${slug}`;
      const url = `${protocol}//${domain}${normalizedSlug}?preview=true`;
      window.open(url, '_blank');
    } else {
      toast({
        title: t('common.error'),
        description: t('builder.domainMissing'),
        variant: 'destructive',
      });
    }
  };

  const handleBackgroundColorChange = (color: string) => {
    setBackgroundColor(color);
    onBackgroundColorChange?.(color);
  };

  const handleDarkModeToggle = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    onDarkModeChange?.(newMode);
  };

  // Filter sections based on search query
  const filteredSections = sections.filter(section => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      section.type.toLowerCase().includes(query) ||
      JSON.stringify(section.props).toLowerCase().includes(query)
    );
  });

  return (
    <div className="h-full flex bg-gray-50 dark:bg-gray-950">
      {/* Left Sidebar - Section Library */}
      <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">{t('builder.addSections')}</h2>
        </div>
        <SectionLibrary onAddSection={handleAddSection} />
      </div>

      {/* Main Content - Canvas */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
          <div className="flex items-center gap-2 mb-3">
            <Button onClick={handleSave} className="gap-2">
              <Save className="w-4 h-4" />
              {t('common.save')}
            </Button>
            {onPublish && (
              <Button onClick={() => onPublish(sections)} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                <Globe className="w-4 h-4" />
                {t('common.publish', 'Publish')}
              </Button>
            )}
            {onHistory && (
              <Button variant="outline" onClick={onHistory} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                {t('common.history', 'History')}
              </Button>
            )}
            {onCodeEditor && (
              <Button variant="outline" onClick={onCodeEditor} className="gap-2" title="Edit page code">
                <Code className="w-4 h-4" />
                {t('builder.codeEditor', 'Code')}
              </Button>
            )}
            <Button
              variant={previewMode ? 'default' : 'outline'}
              onClick={() => setPreviewMode(!previewMode)}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              {previewMode ? t('builder.editMode') : t('builder.preview')}
            </Button>
            {domain && slug && (
              <Button
                variant="outline"
                onClick={handleLivePreview}
                className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/20"
              >
                <ExternalLink className="w-4 h-4" />
                {t('builder.livePreview', 'Live Site')}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setShowAIDesignDialog(true)}
              className="gap-2 ml-auto text-purple-600 border-purple-200 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:hover:bg-purple-900/20"
            >
              <Sparkles className="w-4 h-4" />
              {t('builder.magicDesign', 'Magic Design')}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowTemplateGallery(true)}
              className="gap-2"
            >
              <Layout className="w-4 h-4" />
              {t('builder.chooseTemplate')}
            </Button>
          </div>
          
          {/* Search, Background Color, and Dark Mode Controls */}
          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder={t('builder.searchSections', 'Search sections...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Background Color Picker */}
            <div className="flex items-center gap-2">
              <Label htmlFor="bg-color" className="text-sm whitespace-nowrap flex items-center gap-1">
                <Palette className="w-4 h-4" />
                {t('builder.backgroundColor', 'Background')}
              </Label>
              <Input
                id="bg-color"
                type="color"
                value={backgroundColor}
                onChange={(e) => handleBackgroundColorChange(e.target.value)}
                className="w-16 h-9 cursor-pointer"
              />
            </div>

            {/* Dark Mode Toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleDarkModeToggle}
              className="gap-2"
              title={isDarkMode ? t('builder.lightMode', 'Light Mode') : t('builder.darkMode', 'Dark Mode')}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 p-4">
          <div 
            className={`max-w-6xl mx-auto shadow-lg ${isDarkMode ? 'dark' : ''}`}
            style={{ backgroundColor }}
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredSections.map(s => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {filteredSections.map((section) => (
                  <SortableSection
                    key={section.id}
                    section={section}
                    isSelected={selectedSectionId === section.id}
                    isPreview={previewMode}
                    onSelect={() => setSelectedSectionId(section.id)}
                    onDelete={() => handleDeleteSection(section.id)}
                    onDuplicate={() => handleDuplicateSection(section.id)}
                    onToggleTheme={handleDarkModeToggle}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {sections.length === 0 && (
              <div className="py-20 text-center text-gray-500 dark:text-gray-400">
                <p className="mb-4">{t('builder.noSections')}</p>
                <Button
                  variant="outline"
                  onClick={() => setShowTemplateGallery(true)}
                  className="gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {t('builder.browseTemplates')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Properties Panel */}
      {selectedSection && !previewMode && (
        <div className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 overflow-y-auto">
          <PropertyPanel
            section={selectedSection}
            onUpdate={(props) => handleUpdateSection(selectedSection.id, props)}
            onClose={() => setSelectedSectionId(null)}
          />
        </div>
      )}

      {/* Template Gallery Modal */}
      {showTemplateGallery && (
        <TemplateGallery
          onSelectTemplate={handleSelectTemplate}
          onClose={() => setShowTemplateGallery(false)}
        />
      )}

      {/* AI Design Dialog */}
      <Dialog open={showAIDesignDialog} onOpenChange={setShowAIDesignDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              {t('builder.aiDesignTitle', 'AI Magic Design')}
            </DialogTitle>
            <DialogDescription>
              {t('builder.aiDesignDesc', 'Describe the section you want to create, and our AI will design it for you.')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="ai-prompt" className="mb-2 block">
              {t('builder.aiPromptLabel', 'What should this section contain?')}
            </Label>
            <Textarea
              id="ai-prompt"
              placeholder={t('builder.aiPromptPlaceholder', 'e.g., A hero section for a luxury watch store with a dark theme and a "Shop Now" button.')}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAIDesignDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleAIDesign} 
              disabled={isGeneratingDesign || !aiPrompt.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
            >
              {isGeneratingDesign ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('common.generating', 'Generating...')}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {t('builder.generateDesign', 'Generate Design')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



function getDefaultProps(type: string, t: TFunction): Record<string, unknown> {
  const defaults: Record<string, Record<string, unknown>> = {
    header: {
      companyName: t('builder.defaults.header.companyName', 'My Store'),
      logoUrl: '',
      links: [
        { label: t('builder.defaults.header.home', 'Home'), url: '/' },
        { label: t('builder.defaults.header.products', 'Products'), url: '/products' },
        { label: t('builder.defaults.header.about', 'About'), url: '/about' },
      ],
      showThemeToggle: true,
      showLanguageToggle: true,
      backgroundColor: '#ffffff',
      textColor: '#000000',
    },
    hero: {
      title: t('builder.defaults.hero.title', 'Welcome to Our Store'),
      subtitle: t('builder.defaults.hero.subtitle', 'Discover amazing products'),
      buttonText: t('builder.defaults.hero.buttonText', 'Shop Now'),
      buttonLink: '/products',
      backgroundImage: '',
      textColor: '#ffffff',
      backgroundColor: '#000000',
    },
    features: {
      title: t('builder.defaults.features.title', 'Features'),
      items: [
        { icon: '🚀', title: t('builder.defaults.features.fastShipping', 'Fast Shipping'), description: t('builder.defaults.features.fastShippingDesc', 'Get your orders quickly') },
        { icon: '💳', title: t('builder.defaults.features.securePayment', 'Secure Payment'), description: t('builder.defaults.features.securePaymentDesc', 'Your data is safe') },
        { icon: '🎁', title: t('builder.defaults.features.giftCards', 'Gift Cards'), description: t('builder.defaults.features.giftCardsDesc', 'Perfect for any occasion') },
      ],
    },
    products: {
      title: t('builder.defaults.products.title', 'Featured Products'),
      limit: 8,
      layout: 'grid',
      columns: '4',
      categoryId: 'all',
      showPrice: true,
      showAddToCart: true,
      showName: true,
      showDescription: false,
      showImage: true,
      showRating: false,
      showStock: false,
      sortBy: 'default',
      showOnlyAvailable: false,
      showOnlyFeatured: false,
    },
    gallery: {
      title: t('builder.defaults.gallery.title', 'Our Gallery'),
      images: [],
      columns: '3',
    },
    slider: {
      title: t('builder.defaults.slider.title', 'Image Showcase'),
      description: t('builder.defaults.slider.description', 'Browse through our collection'),
      images: [],
      autoPlay: true,
      interval: 5000,
      showDots: true,
      showArrows: true,
      height: '500px',
      animationType: 'slide',
    },
    'content-slider': {
      title: t('builder.defaults.contentSlider.title', 'Featured Content'),
      items: [
        { id: '1', icon: '⭐', title: t('builder.defaults.contentSlider.item1', 'Quality Products'), description: t('builder.defaults.contentSlider.item1Desc', 'Top-notch quality guaranteed') },
        { id: '2', icon: '🚀', title: t('builder.defaults.contentSlider.item2', 'Fast Delivery'), description: t('builder.defaults.contentSlider.item2Desc', 'Quick shipping worldwide') },
        { id: '3', icon: '💎', title: t('builder.defaults.contentSlider.item3', 'Premium Support'), description: t('builder.defaults.contentSlider.item3Desc', '24/7 customer service') },
        { id: '4', icon: '🎁', title: t('builder.defaults.contentSlider.item4', 'Special Offers'), description: t('builder.defaults.contentSlider.item4Desc', 'Exclusive deals daily') },
        { id: '5', icon: '🔒', title: t('builder.defaults.contentSlider.item5', 'Secure Payment'), description: t('builder.defaults.contentSlider.item5Desc', 'Safe transactions') },
      ],
      direction: 'horizontal',
      speed: 20,
      pauseOnHover: true,
      itemWidth: '300px',
      itemHeight: 'auto',
      gap: '2rem',
      backgroundColor: 'transparent',
      sliderBackgroundColor: 'transparent',
      textColor: 'inherit',
    },
    cta: {
      title: t('builder.defaults.cta.title', 'Ready to get started?'),
      description: t('builder.defaults.cta.description', 'Join thousands of happy customers'),
      buttonText: t('builder.defaults.cta.buttonText', 'Get Started'),
      buttonLink: '/auth/signup',
      backgroundColor: '#3b82f6',
      textColor: '#ffffff',
    },
    testimonials: {
      title: t('builder.defaults.testimonials.title', 'What Our Customers Say'),
      items: [
        { 
          id: '1',
          name: t('builder.defaults.testimonials.customer1', 'Ahmed Ali'),
          role: t('builder.defaults.testimonials.role1', 'Customer'),
          image: '',
          rating: 5,
          text: t('builder.defaults.testimonials.text1', 'Excellent service and quality products!')
        },
        { 
          id: '2',
          name: t('builder.defaults.testimonials.customer2', 'Sara Mohamed'),
          role: t('builder.defaults.testimonials.role2', 'Customer'),
          image: '',
          rating: 5,
          text: t('builder.defaults.testimonials.text2', 'Fast delivery and great support!')
        },
      ],
    },
    pricing: {
      title: t('builder.defaults.pricing.title', 'Choose Your Plan'),
      subtitle: t('builder.defaults.pricing.subtitle', 'Simple, transparent pricing'),
      plans: [
        {
          id: '1',
          name: t('builder.defaults.pricing.basic', 'Basic'),
          price: '99',
          currency: 'SAR',
          period: t('builder.defaults.pricing.month', 'month'),
          features: [
            t('builder.defaults.pricing.feature1', '10 Products'),
            t('builder.defaults.pricing.feature2', 'Basic Support'),
            t('builder.defaults.pricing.feature3', '1 GB Storage'),
          ],
          highlighted: false,
        },
        {
          id: '2',
          name: t('builder.defaults.pricing.pro', 'Pro'),
          price: '299',
          currency: 'SAR',
          period: t('builder.defaults.pricing.month', 'month'),
          features: [
            t('builder.defaults.pricing.feature4', 'Unlimited Products'),
            t('builder.defaults.pricing.feature5', 'Priority Support'),
            t('builder.defaults.pricing.feature6', '10 GB Storage'),
          ],
          highlighted: true,
        },
      ],
    },
    team: {
      title: t('builder.defaults.team.title', 'Meet Our Team'),
      subtitle: t('builder.defaults.team.subtitle', 'The people behind our success'),
      members: [
        {
          id: '1',
          name: t('builder.defaults.team.member1', 'John Doe'),
          role: t('builder.defaults.team.role1', 'CEO & Founder'),
          image: '',
          bio: t('builder.defaults.team.bio1', 'Leading the company vision'),
          social: { linkedin: '', twitter: '' },
        },
      ],
    },
    stats: {
      title: t('builder.defaults.stats.title', 'Our Achievements'),
      items: [
        { id: '1', number: '1000', suffix: '+', label: t('builder.defaults.stats.customers', 'Happy Customers') },
        { id: '2', number: '500', suffix: '+', label: t('builder.defaults.stats.products', 'Products') },
        { id: '3', number: '50', suffix: '+', label: t('builder.defaults.stats.countries', 'Countries') },
        { id: '4', number: '99', suffix: '%', label: t('builder.defaults.stats.satisfaction', 'Satisfaction') },
      ],
    },
    faq: {
      title: t('builder.defaults.faq.title', 'Frequently Asked Questions'),
      subtitle: t('builder.defaults.faq.subtitle', 'Find answers to common questions'),
      items: [
        {
          id: '1',
          question: t('builder.defaults.faq.q1', 'How do I place an order?'),
          answer: t('builder.defaults.faq.a1', 'Simply browse our products and add items to your cart.'),
        },
        {
          id: '2',
          question: t('builder.defaults.faq.q2', 'What payment methods do you accept?'),
          answer: t('builder.defaults.faq.a2', 'We accept all major credit cards and online payment methods.'),
        },
      ],
    },
    newsletter: {
      title: t('builder.defaults.newsletter.title', 'Subscribe to Our Newsletter'),
      subtitle: t('builder.defaults.newsletter.subtitle', 'Get the latest updates and offers'),
      placeholder: t('builder.defaults.newsletter.placeholder', 'Enter your email'),
      buttonText: t('builder.defaults.newsletter.button', 'Subscribe'),
      backgroundColor: '#6366f1',
      textColor: '#ffffff',
    },
    video: {
      title: t('builder.defaults.video.title', 'Watch Our Story'),
      videoUrl: '',
      thumbnail: '',
      autoPlay: false,
      controls: false,
      loop: false,
    },
    countdown: {
      title: t('builder.defaults.countdown.title', 'Limited Time Offer'),
      subtitle: t('builder.defaults.countdown.subtitle', 'Hurry up! Offer ends soon'),
      targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      showDays: true,
      showHours: true,
      showMinutes: true,
      showSeconds: true,
    },
    brands: {
      title: t('builder.defaults.brands.title', 'Trusted By Leading Brands'),
      logos: [],
      grayscale: true,
      columns: '6',
    },
    contact: {
      title: t('builder.defaults.contact.title', 'Get In Touch'),
      subtitle: t('builder.defaults.contact.subtitle', 'We\'d love to hear from you'),
      email: 'info@example.com',
      phone: '+966 XX XXX XXXX',
      address: t('builder.defaults.contact.address', 'Riyadh, Saudi Arabia'),
      showMap: true,
      mapUrl: '',
    },
    footer: {
      companyName: t('builder.defaults.footer.companyName', 'Your Company'),
      links: [
        { label: t('builder.defaults.footer.about', 'About'), url: '/about' },
        { label: t('builder.defaults.footer.contact', 'Contact'), url: '/contact' },
        { label: t('builder.defaults.footer.privacy', 'Privacy'), url: '/privacy' },
      ],
      socialLinks: {
        facebook: '',
        twitter: '',
        instagram: '',
      },
    },
    'categories-hierarchy': {
      title: t('builder.defaults.categoriesHierarchy.title', 'الفئات والمنتجات'),
      subtitle: t('builder.defaults.categoriesHierarchy.subtitle', 'تصفح الفئات والفئات الفرعية والمنتجات'),
      productsPerCategory: 12,
      productsColumns: 4,
      productsLayout: 'grid',
      showAddToCart: true,
    },
  };

  return defaults[type] || {};
}
