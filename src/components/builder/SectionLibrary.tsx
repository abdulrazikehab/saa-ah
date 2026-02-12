import { Button } from '@/components/ui/button';
import { Layout, Type, Image, ShoppingCart, Star, Phone, Images, Repeat, CreditCard, BarChart3, MessageSquare, Heart, Wallet, Users, User, FolderTree, Building2 } from 'lucide-react';
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
    { type: 'categories-hierarchy', label: t('sections.categoriesHierarchy.label', 'Categories Hierarchy'), icon: FolderTree, description: t('sections.categoriesHierarchy.desc', 'Categories with subcategories and products') },
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
    { type: 'merchant-dashboard', label: t('sections.merchantDashboard.label', 'Merchant Dashboard'), icon: BarChart3, description: t('sections.merchantDashboard.desc', 'Live merchant dashboard with real data') },
    { type: 'product-list', label: t('sections.productList.label', 'Product List'), icon: ShoppingCart, description: t('sections.productList.desc', 'Product list with search and table view') },
    { type: 'store-page', label: t('sections.storePage.label', 'Store Page'), icon: Layout, description: t('sections.storePage.desc', 'Store with shopping cart and brand cards') },
    { type: 'support-tickets', label: t('sections.supportTickets.label', 'Support Tickets'), icon: MessageSquare, description: t('sections.supportTickets.desc', 'Support tickets management page') },
    { type: 'favorites-page', label: t('sections.favoritesPage.label', 'Favorites Page'), icon: Heart, description: t('sections.favoritesPage.desc', 'Favorite cards with shopping cart') },
    { type: 'balance-operations', label: t('sections.balanceOperations.label', 'Balance Operations'), icon: Wallet, description: t('sections.balanceOperations.desc', 'Wallet recharge operations list') },
    { type: 'employees-page', label: t('sections.employeesPage.label', 'Employees Page'), icon: Users, description: t('sections.employeesPage.desc', 'Employee management page') },
    { type: 'charge-wallet', label: t('sections.chargeWallet.label', 'Charge Wallet'), icon: CreditCard, description: t('sections.chargeWallet.desc', 'Wallet recharge form') },
    { type: 'reports-page', label: t('sections.reportsPage.label', 'Reports Page'), icon: BarChart3, description: t('sections.reportsPage.desc', 'Product and order reports') },
    { type: 'profile-page', label: t('sections.profilePage.label', 'Profile Page'), icon: User, description: t('sections.profilePage.desc', 'Merchant profile page') },
    { type: 'bank-accounts', label: t('sections.bankAccounts.label', 'Bank Accounts'), icon: Building2, description: t('sections.bankAccounts.desc', 'Customer bank accounts management') },
    { type: 'contact-us', label: t('sections.contactUs.label', 'Contact Us (Modern)'), icon: Phone, description: t('sections.contactUs.desc', 'Premium contact section with store data') },
    { type: 'about-us', label: t('sections.aboutUs.label', 'About Us (Modern)'), icon: User, description: t('sections.aboutUs.desc', 'Premium about section with store data') },
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
          <div className="flex items-start gap-3">
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
