import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { BuyerDashboardSidebar } from './BuyerDashboardSidebar';
import { BuyerDashboardHeader } from './BuyerDashboardHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { VersionFooter } from '@/components/common/VersionFooter';

export const BuyerDashboardLayout = () => {
  const { i18n } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useAuth();
  
  const isRTL = i18n.language === 'ar';

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex flex-col lg:flex-row">
        {/* Desktop Sidebar */}
        <aside className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 bg-card z-40 transition-all duration-300 ${
          isRTL ? 'right-0 border-l' : 'left-0 border-r'
        } ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}`}>
          <BuyerDashboardSidebar 
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </aside>

        {/* Mobile Sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side={isRTL ? 'right' : 'left'} className="w-[280px] sm:w-80 p-0 overflow-hidden">
            <BuyerDashboardSidebar />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className={`flex-1 w-full transition-all duration-300 ${
          isRTL 
            ? (sidebarCollapsed ? 'lg:mr-20' : 'lg:mr-64')
            : (sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64')
        }`}>
          {/* Header */}
          <BuyerDashboardHeader 
            onMenuClick={() => setSidebarOpen(true)}
            userName={user?.name || user?.email || 'مستخدم'}
            userEmail={user?.email || ''}
            userAvatar={user?.avatar || undefined}
          />

          {/* Page Content */}
          <main className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-[1920px] mx-auto w-full flex flex-col min-h-[calc(100vh-4rem)]">
            <div className="flex-1">
              <Outlet />
            </div>
            {/* Version Footer */}
            <VersionFooter className="mt-8 pt-4 border-t border-border" />
          </main>
        </div>
      </div>
    </div>
  );
};

