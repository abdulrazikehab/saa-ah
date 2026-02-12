import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Settings as SettingsIcon, 
  CreditCard, 
  Users, 
  Plug, 
  ShieldCheck,
  ShoppingCart,
  Globe,
  Bell,
  Palette,
  Package,
  Building2,
  DollarSign
} from 'lucide-react';

const settingsNav = [
  {
    title: 'عام',
    items: [
      { name: 'الإعدادات العامة', path: '/dashboard/settings', icon: SettingsIcon },
      { name: 'الإشعارات', path: '/dashboard/settings/notifications', icon: Bell },
    ],
  },
  {
    title: 'المتجر',
    items: [
      { name: 'الدفع', path: '/dashboard/settings/payment', icon: CreditCard },
      { name: 'خيارات الدفع', path: '/dashboard/settings/payment-options', icon: CreditCard },
      { name: 'الطلبات', path: '/dashboard/settings/checkout', icon: ShoppingCart },
      { name: 'النطاقات', path: '/dashboard/settings/domains', icon: Globe },
      { name: 'الموردين', path: '/dashboard/settings/suppliers', icon: Building2 },
      { name: 'العلامات التجارية', path: '/dashboard/settings/brands', icon: Package },
      { name: 'الوحدات', path: '/dashboard/settings/units', icon: Package },
      { name: 'العملات', path: '/dashboard/settings/currencies', icon: DollarSign },
    ],
  },
  {
    title: 'المتقدم',
    items: [
      { name: 'المستخدمين والصلاحيات', path: '/dashboard/settings/users', icon: Users },
      { name: 'التكاملات', path: '/dashboard/settings/integrations', icon: Plug },
      { name: 'التحقق من الهوية (KYC)', path: '/dashboard/settings/kyc', icon: ShieldCheck },
    ],
  },
];

export default function SettingsLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">الإعدادات</h1>
          <p className="text-gray-600 dark:text-gray-400">
            إدارة إعدادات متجرك والتكاملات
          </p>
        </div>

        {/* Content Area - No duplicate sidebar, navigation is in main sidebar */}
        <div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
