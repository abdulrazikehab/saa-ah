import { Button } from '@/components/ui/button';
import { Layout, Type, Image, ShoppingCart, Star, Phone, Images, Repeat, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SectionLibraryProps {
  onAddSection: (type: string) => void;
}

export function SectionLibrary({ onAddSection }: SectionLibraryProps) {
  const { t } = useTranslation();

  const sectionTypes = [
    { type: 'hero', label: t('sections.hero.label', 'Hero'), icon: Layout, description: t('sections.hero.desc', 'Full-width hero banner') },
    { type: 'features', label: t('sections.features.label', 'Features'), icon: Star, description: t('sections.features.desc', 'Feature grid') },
    { type: 'products', label: t('sections.products.label', 'Products'), icon: ShoppingCart, description: t('sections.products.desc', 'Product showcase') },
    { type: 'testimonials', label: t('sections.testimonials.label', 'Testimonials'), icon: Star, description: t('sections.testimonials.desc', 'Customer reviews') },
    { type: 'pricing', label: t('sections.pricing.label', 'Pricing'), icon: CreditCard, description: t('sections.pricing.desc', 'Pricing tables') },
    { type: 'team', label: t('sections.team.label', 'Team'), icon: Type, description: t('sections.team.desc', 'Team members') },
    { type: 'stats', label: t('sections.stats.label', 'Statistics'), icon: Star, description: t('sections.stats.desc', 'Number counters') },
    { type: 'faq', label: t('sections.faq.label', 'FAQ'), icon: Type, description: t('sections.faq.desc', 'Questions & answers') },
    { type: 'newsletter', label: t('sections.newsletter.label', 'Newsletter'), icon: Type, description: t('sections.newsletter.desc', 'Email subscription') },
    { type: 'video', label: t('sections.video.label', 'Video'), icon: Image, description: t('sections.video.desc', 'Embedded video') },
    { type: 'countdown', label: t('sections.countdown.label', 'Countdown'), icon: Type, description: t('sections.countdown.desc', 'Timer countdown') },
    { type: 'brands', label: t('sections.brands.label', 'Brands'), icon: Images, description: t('sections.brands.desc', 'Partner logos') },
    { type: 'contact', label: t('sections.contact.label', 'Contact'), icon: Phone, description: t('sections.contact.desc', 'Contact form') },
    { type: 'slider', label: t('sections.slider.label', 'Image Slider'), icon: Images, description: t('sections.slider.desc', 'Animated image carousel') },
    { type: 'content-slider', label: t('sections.contentSlider.label', 'Content Slider'), icon: Repeat, description: t('sections.contentSlider.desc', 'Infinite scrolling content') },
    { type: 'payments', label: t('sections.payments.label', 'Payment Methods'), icon: CreditCard, description: t('sections.payments.desc', 'Display accepted payment methods') },
    { type: 'cta', label: t('sections.cta.label', 'Call to Action'), icon: Phone, description: t('sections.cta.desc', 'CTA banner') },
    { type: 'text', label: t('sections.text.label', 'Text Block'), icon: Type, description: t('sections.text.desc', 'Rich text content') },
    { type: 'image', label: t('sections.image.label', 'Image'), icon: Image, description: t('sections.image.desc', 'Image block') },
    { type: 'gallery', label: t('sections.gallery.label', 'Gallery'), icon: Images, description: t('sections.gallery.desc', 'Image gallery') },
  ];

  return (
    <div className="p-4 space-y-2">
      {sectionTypes.map(({ type, label, icon: Icon, description }) => (
        <Button
          key={type}
          variant="outline"
          className="w-full justify-start h-auto py-3 px-4"
          onClick={() => onAddSection(type)}
        >
          <div className="flex items-start gap-3 text-left">
            <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium">{label}</div>
              <div className="text-xs text-gray-500">{description}</div>
            </div>
          </div>
        </Button>
      ))}
    </div>
  );
}
