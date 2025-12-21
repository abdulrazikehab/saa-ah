import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Settings, 
  Home,
  Users,
  FileText,
  BarChart3,
  Palette,
  Globe,
  FolderOpen,
  MessageSquare,
  Bell,
  CreditCard,
  Tag,
  Rocket,
  Building2,
  Plug,
  ShieldCheck,
  Smartphone,
  DollarSign,
  type LucideIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface NavigationSection {
  title: string;
  items: Array<{
    name: string;
    href: string;
    icon: LucideIcon;
    description?: string;
    color?: string;
  }>;
}

export const DashboardNavigationCards = () => {
  const { t } = useTranslation();

  const navigationSections: NavigationSection[] = [
    {
      title: t('dashboard.sidebar.salesAndOrders'),
      items: [
        { name: t('dashboard.sidebar.products'), href: '/dashboard/products', icon: Package, color: 'text-blue-500', description: t('dashboard.sidebar.productsDesc') },
        { name: t('dashboard.sidebar.hierarchical', 'المستكشف الهرمي'), href: '/dashboard/hierarchical', icon: FolderOpen, color: 'text-indigo-500', description: t('dashboard.sidebar.hierarchicalDesc') },
        { name: t('dashboard.sidebar.priceManagement'), href: '/dashboard/prices', icon: DollarSign, color: 'text-green-500', description: t('dashboard.sidebar.priceManagementDesc') },
        { name: t('dashboard.sidebar.orders'), href: '/dashboard/orders', icon: ShoppingCart, color: 'text-orange-500', description: t('dashboard.sidebar.ordersDesc') },
        { name: t('dashboard.sidebar.customers'), href: '/dashboard/customers', icon: Users, color: 'text-purple-500', description: t('dashboard.sidebar.customersDesc') },
        { name: t('dashboard.sidebar.reports'), href: '/dashboard/reports', icon: BarChart3, color: 'text-red-500', description: t('dashboard.sidebar.reportsDesc') },
      ],
    },
    {
      title: t('dashboard.sidebar.contentAndDesign'),
      items: [
        { name: t('dashboard.sidebar.categories'), href: '/dashboard/categories', icon: FolderOpen, color: 'text-yellow-500', description: t('dashboard.sidebar.categoriesDesc') },
        { name: t('dashboard.sidebar.pages'), href: '/dashboard/pages', icon: FileText, color: 'text-teal-500', description: t('dashboard.sidebar.pagesDesc') },
        { name: t('dashboard.sidebar.storefront'), href: '/dashboard/storefront', icon: Home, color: 'text-cyan-500', description: t('dashboard.sidebar.storefrontDesc') },
        { name: t('dashboard.sidebar.storeDesign'), href: '/dashboard/design', icon: Palette, color: 'text-pink-500', description: t('dashboard.sidebar.storeDesignDesc') },
        { name: t('dashboard.sidebar.templates'), href: '/dashboard/templates', icon: LayoutDashboard, color: 'text-rose-500', description: t('dashboard.sidebar.templatesDesc') },
      ],
    },
    {
      title: t('dashboard.sidebar.marketing'),
      items: [
        { name: t('dashboard.sidebar.potentialAndMarketing'), href: '/dashboard/marketing', icon: Tag, color: 'text-red-500', description: t('dashboard.sidebar.marketingDesc') },
        { name: t('dashboard.sidebar.smartLine'), href: '/dashboard/smart-line', icon: Rocket, color: 'text-violet-500', description: t('dashboard.sidebar.smartLineDesc') },
      ],
    },
    {
      title: t('dashboard.sidebar.storeSettings'),
      items: [
        { name: t('dashboard.sidebar.generalSettings'), href: '/dashboard/settings', icon: Settings, color: 'text-gray-500', description: t('dashboard.sidebar.generalSettingsDesc') },
        { name: t('dashboard.sidebar.notifications'), href: '/dashboard/settings/notifications', icon: Bell, color: 'text-yellow-600', description: t('dashboard.sidebar.notificationsDesc') },
        { name: t('dashboard.sidebar.payment'), href: '/dashboard/settings/payment', icon: CreditCard, color: 'text-green-600', description: t('dashboard.sidebar.paymentDesc') },
        { name: t('dashboard.sidebar.domains'), href: '/dashboard/settings/domains', icon: Globe, color: 'text-blue-600', description: t('dashboard.sidebar.domainsDesc') },
        { name: t('dashboard.sidebar.suppliers'), href: '/dashboard/settings/suppliers', icon: Building2, color: 'text-indigo-600', description: t('dashboard.sidebar.suppliersDesc') },
      ],
    },
    {
      title: t('dashboard.sidebar.advanced'),
      items: [
        { name: t('dashboard.sidebar.usersAndPermissions'), href: '/dashboard/settings/users', icon: Users, color: 'text-purple-600', description: t('dashboard.sidebar.usersAndPermissionsDesc') },
        { name: t('dashboard.sidebar.integrations'), href: '/dashboard/settings/integrations', icon: Plug, color: 'text-orange-600', description: t('dashboard.sidebar.integrationsDesc') },
        { name: t('dashboard.sidebar.identityVerification'), href: '/dashboard/settings/kyc', icon: ShieldCheck, color: 'text-emerald-600', description: t('dashboard.sidebar.identityVerificationDesc') },
        { name: t('dashboard.sidebar.appStore'), href: '/dashboard/apps', icon: Smartphone, color: 'text-blue-400', description: t('dashboard.sidebar.appStoreDesc') },
        { name: t('dashboard.sidebar.chat'), href: '/dashboard/chat', icon: MessageSquare, color: 'text-pink-600', description: t('dashboard.sidebar.chatDesc') },
      ],
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {navigationSections.map((section, index) => (
        <div key={section.title} className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 border-b pb-2">
            <span className="w-1 h-6 bg-primary rounded-full"></span>
            {section.title}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {section.items.map((item) => (
              <Link key={item.href} to={item.href}>
                <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-transparent hover:border-primary/20 bg-card/50 backdrop-blur-sm group">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className={cn("p-3 rounded-xl bg-muted group-hover:bg-primary/10 transition-colors", item.color)}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold group-hover:text-primary transition-colors">{item.name}</h3>
                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
