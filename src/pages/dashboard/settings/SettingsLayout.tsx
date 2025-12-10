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
  Palette
} from 'lucide-react';

const settingsNav = [
  {
    title: 'عام',
    items: [
      { name: 'الإعدادات العامة', path: '/dashboard/settings', icon: SettingsIcon },
      { name: 'المظهر', path: '/dashboard/settings/appearance', icon: Palette },
      { name: 'الإشعارات', path: '/dashboard/settings/notifications', icon: Bell },
    ],
  },
  {
    title: 'المتجر',
    items: [
      { name: 'الدفع', path: '/dashboard/settings/payment', icon: CreditCard },
      { name: 'الطلبات', path: '/dashboard/settings/checkout', icon: ShoppingCart },
      { name: 'النطاقات', path: '/dashboard/settings/domains', icon: Globe },
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">الإعدادات</h1>
          <p className="text-gray-600 dark:text-gray-400">
            إدارة إعدادات متجرك والتكاملات
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-6">
              {settingsNav.map((section) => (
                <div key={section.title}>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    {section.title}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                            isActive
                              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
