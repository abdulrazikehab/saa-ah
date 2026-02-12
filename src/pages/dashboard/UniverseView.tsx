import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  Home, Package, ShoppingCart, Settings, FolderOpen, 
  Users, BarChart3, Palette, Smartphone, LayoutDashboard, 
  Plug, ShieldCheck, MessageSquare, Tag, Rocket, Receipt,
  Building2, Truck, Globe, DollarSign, Wallet, CreditCard,
  Grid, List, ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function UniverseView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';
  const [viewMode, setViewMode] = useState<'cards' | 'roadmap'>('cards');

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemAnim = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const sections = [
    {
      title: t('dashboard.sidebar.home', 'Home'),
      items: [
        { name: t('dashboard.sidebar.dashboard', 'Dashboard'), href: '/dashboard', icon: Home, description: t('universe.dashboardDesc', 'Overview of your store performance') },
      ],
    },
    {
      title: t('dashboard.sidebar.salesAndOrders', 'Sales & Orders'),
      items: [
        { name: t('dashboard.sidebar.hierarchical', 'Hierarchical View'), href: '/dashboard/hierarchical', icon: FolderOpen, description: t('universe.hierarchicalDesc', 'Manage items in a tree structure') },
        { name: t('dashboard.sidebar.products', 'Products'), href: '/dashboard/products', icon: Package, description: t('universe.productsDesc', 'Manage your product catalog') },
        { name: t('dashboard.sidebar.categories', 'Categories'), href: '/dashboard/categories', icon: FolderOpen, description: t('universe.categoriesDesc', 'Organize products into categories') },
        { name: t('dashboard.sidebar.brands', 'Brands'), href: '/dashboard/settings/brands', icon: Package, description: t('universe.brandsDesc', 'Manage product brands') },
        { name: t('dashboard.sidebar.priceManagement', 'Price Management'), href: '/dashboard/prices', icon: DollarSign, description: t('universe.pricesDesc', 'Bulk update product prices') },
        { name: t('dashboard.sidebar.orders', 'Orders'), href: '/dashboard/orders', icon: ShoppingCart, description: t('universe.ordersDesc', 'Process and track orders') },
        { name: t('dashboard.sidebar.inventory', 'Inventory'), href: '/dashboard/inventory', icon: Package, description: t('universe.inventoryDesc', 'Track stock levels') },
        { name: t('dashboard.wallet.pageTitle', 'Banks & Transactions'), href: '/dashboard/banks', icon: Receipt, description: t('universe.banksDesc', 'Manage bank accounts and transactions') },
        { name: t('supplierProducts.title', 'Supplier Products'), href: '/dashboard/supplier-products', icon: Building2, description: t('universe.supplierDesc', 'Browse products from suppliers') },
        { name: t('dashboard.sidebar.customers', 'Customers'), href: '/dashboard/customers', icon: Users, description: t('universe.customersDesc', 'Manage customer relationships') },
      ],
    },
    {
      title: t('dashboard.sidebar.reports', 'Reports'),
      items: [
        { name: t('dashboard.sidebar.generalReports', 'General Reports'), href: '/dashboard/reports', icon: BarChart3, description: t('universe.genReportsDesc', 'View overall store analytics') },
        { name: t('dashboard.sidebar.customerReports', 'Customer Reports'), href: '/dashboard/customer-reports', icon: Users, description: t('universe.custReportsDesc', 'Analyze customer behavior') },
        { name: t('dashboard.sidebar.customerBalances', 'Customer Balances'), href: '/dashboard/customer-balances', icon: Wallet, description: t('universe.balancesDesc', 'Track customer wallet balances') },
        { name: t('dashboard.sidebar.productReports', 'Product Reports'), href: '/dashboard/product-reports', icon: BarChart3, description: t('universe.prodReportsDesc', 'Analyze product performance') },
        { name: t('dashboard.sidebar.paymentReports', 'Payment Reports'), href: '/dashboard/payment-reports', icon: CreditCard, description: t('universe.payReportsDesc', 'View payment transaction reports') },
      ],
    },
    {
      title: t('dashboard.sidebar.storeSettings', 'Store Settings'),
      items: [
        { name: t('dashboard.sidebar.generalSettings', 'General Settings'), href: '/dashboard/settings', icon: Settings, description: t('universe.settingsDesc', 'Configure store preferences') },
        { name: t('dashboard.sidebar.storeManagement', 'Store Management'), href: '/dashboard/management', icon: Building2, description: t('universe.manageDesc', 'Manage store details') },
        { name: t('dashboard.sidebar.suppliers', 'Suppliers'), href: '/dashboard/settings/suppliers', icon: Truck, description: t('universe.suppliersSettingsDesc', 'Manage supplier information') },
        { name: t('dashboard.sidebar.domains', 'Domains'), href: '/dashboard/settings/domains', icon: Globe, description: t('universe.domainsDesc', 'Manage custom domains') },
        { name: t('dashboard.sidebar.units', 'Units'), href: '/dashboard/settings/units', icon: Package, description: t('universe.unitsDesc', 'Manage measurement units') },
        { name: t('dashboard.sidebar.currencies', 'Currencies'), href: '/dashboard/settings/currencies', icon: DollarSign, description: t('universe.currenciesDesc', 'Manage supported currencies') },
        { name: t('dashboard.sidebar.notifications', 'Notifications'), href: '/dashboard/settings/notifications', icon: MessageSquare, description: t('universe.notifDesc', 'Configure notification settings') },
        { name: t('dashboard.sidebar.limits', 'Limits'), href: '/dashboard/settings/limits', icon: ShieldCheck, description: t('universe.limitsDesc', 'View and manage store limits') },
      ],
    },
    {
      title: t('dashboard.sidebar.contentAndDesign', 'Content & Design'),
      items: [
        { name: t('dashboard.sidebar.pages', 'Pages'), href: '/dashboard/pages', icon: FileText, description: t('universe.pagesDesc', 'Manage custom pages') },
        { name: t('dashboard.sidebar.themes', 'Themes'), href: '/dashboard/themes', icon: Palette, description: t('universe.themesDesc', 'Customize store appearance') },
        { name: t('dashboard.sidebar.myApp', 'My App'), href: '/dashboard/app-builder', icon: Smartphone, description: t('universe.appDesc', 'Build your mobile app') },
        { name: t('dashboard.sidebar.appStore', 'App Store'), href: '/dashboard/apps', icon: Smartphone, description: t('universe.appStoreDesc', 'Install integrations and apps') },
        { name: t('dashboard.sidebar.templates', 'Templates'), href: '/dashboard/templates', icon: LayoutDashboard, description: t('universe.templatesDesc', 'Browse design templates') },
      ],
    },
    {
      title: t('dashboard.sidebar.advanced', 'Advanced'),
      items: [
        { name: t('dashboard.sidebar.integrations', 'Integrations'), href: '/dashboard/settings/integrations', icon: Plug, description: t('universe.integrationsDesc', 'Manage third-party integrations') },
        { name: t('dashboard.sidebar.identityVerification', 'Identity Verification'), href: '/dashboard/settings/kyc', icon: ShieldCheck, description: t('universe.kycDesc', 'Verify your identity') },
        { name: t('dashboard.sidebar.chat', 'Chat'), href: '/dashboard/chat', icon: MessageSquare, description: t('universe.chatDesc', 'Chat with customers') },
      ],
    },
    {
      title: t('dashboard.sidebar.marketing', 'Marketing'),
      items: [
        { name: t('dashboard.sidebar.potentialAndMarketing', 'Potential & Marketing'), href: '/dashboard/marketing', icon: Tag, description: t('universe.marketingDesc', 'Manage marketing campaigns') },
        { name: t('dashboard.sidebar.smartLine', 'Smart Line'), href: '/dashboard/smart-line', icon: Rocket, description: t('universe.smartLineDesc', 'Smart Line marketing tools') },
      ],
    },
  ];

  // Flatten items for roadmap loop if needed, but keeping sections is better for organization
  
  return (
    <div className="flex flex-col h-full bg-background p-6 gap-6 overflow-hidden">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            {t('universe.title', 'Universe View')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('universe.subtitle', 'Navigate your store ecosystem from a bird\'s-eye view')}
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
          <Button
            variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('cards')}
            className={cn("gap-2", viewMode === 'cards' && "bg-background shadow-sm")}
          >
            <Grid className="h-4 w-4" />
            <span className="hidden sm:inline">{t('universe.cards', 'Cards')}</span>
          </Button>
          <Button
            variant={viewMode === 'roadmap' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('roadmap')}
            className={cn("gap-2", viewMode === 'roadmap' && "bg-background shadow-sm")}
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">{t('universe.roadmap', 'Roadmap')}</span>
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 -mx-6 px-6">
        <motion.div 
          className="space-y-8 pb-10"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-1 bg-primary rounded-full" />
                <h2 className="text-xl font-semibold">{section.title}</h2>
              </div>
              
              {viewMode === 'cards' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {section.items.map((item, itemIdx) => (
                    <motion.div key={itemIdx} variants={itemAnim}>
                      <Card 
                        className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer border-muted/60 bg-card/50 hover:bg-card hover:border-primary/20"
                        onClick={() => navigate(item.href)}
                      >
                        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                            <item.icon className="h-6 w-6" />
                          </div>
                          <CardTitle className="text-base font-medium leading-none">
                            {item.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="line-clamp-2 text-xs">
                            {item.description}
                          </CardDescription>
                          <div className={cn(
                            "mt-4 flex items-center text-xs font-medium text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300",
                            isRTL && "flex-row-reverse -translate-x-0 translate-x-2 group-hover:translate-x-0"
                          )}>
                            <span>{t('common.open', 'Open')}</span>
                            <ArrowRight className={cn("h-3 w-3 ml-1", isRTL && "rotate-180 mr-1 ml-0")} />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {section.items.map((item, itemIdx) => (
                    <motion.div key={itemIdx} variants={itemAnim}>
                      <div 
                        className="group flex items-center justify-between p-4 rounded-xl border border-muted/60 bg-card/50 hover:bg-card hover:border-primary/20 hover:shadow-md transition-all cursor-pointer"
                        onClick={() => navigate(item.href)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                            <item.icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-medium text-sm group-hover:text-primary transition-colors">{item.name}</h3>
                            <p className="text-xs text-muted-foreground hidden sm:block">{item.description}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="group-hover:translate-x-1 transition-transform rtl:group-hover:-translate-x-1">
                          <ArrowRight className={cn("h-4 w-4", isRTL && "rotate-180")} />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </motion.div>
      </ScrollArea>
    </div>
  );
}

// Missing imports fix
import { FileText } from 'lucide-react';
