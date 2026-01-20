import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';
import { useAuth } from '@/contexts/AuthContext';
import DashboardBanner from './DashboardBanner';
import { useTranslation } from 'react-i18next';
import { VersionFooter } from '@/components/common/VersionFooter';
import { TourProvider } from './TourGuide';
import WelcomeTourBanner from './WelcomeTourBanner';
import { AIChatHelper } from '@/components/chat/AIChatHelper';
import { ThemeCustomizer } from '@/components/ui/ThemeCustomizer';

export const DashboardLayout = () => {
  const { i18n } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useAuth();
  
  const isRTL = i18n.language === 'ar';

  return (
    <TourProvider>
      <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex flex-col lg:flex-row min-h-screen">
          {/* Desktop Sidebar - key forces re-render on language change */}
          <aside className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 bg-card z-40 transition-all duration-300 ${
            isRTL ? 'right-0 border-l' : 'left-0 border-r'
          } ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}`}>
            <DashboardSidebar 
              key={`sidebar-desktop-${i18n.language}`}
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
          </aside>

          {/* Mobile Sidebar */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side={isRTL ? 'right' : 'left'} className="w-[280px] sm:w-80 p-0 overflow-hidden">
              <DashboardSidebar key={`sidebar-mobile-${i18n.language}`} />
            </SheetContent>
          </Sheet>

          {/* Main Content */}
          <div className={`flex-1 w-full transition-all duration-300 ${
            isRTL 
              ? (sidebarCollapsed ? 'lg:mr-20' : 'lg:mr-64')
              : (sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64')
          }`} style={{ maxWidth: '100%', overflowX: 'hidden' }}>
            {/* Header - key forces re-render on language change */}
            <DashboardHeader 
              key={`header-${i18n.language}`}
              onMenuClick={() => setSidebarOpen(true)}
              userName={user?.name || user?.tenantName || user?.email || 'User'}
              userEmail={user?.employerEmail || user?.email || ''}
              userAvatar={user?.avatar || user?.tenantLogo || undefined}
            />

            {/* Page Content */}
            <main className="p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 w-full flex flex-col" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
              <WelcomeTourBanner />
              <DashboardBanner />
              <div className="mt-3 sm:mt-4 md:mt-5 lg:mt-6 flex-1 w-full overflow-y-visible" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
                <Outlet />
              </div>
              {/* Version Footer */}
              <VersionFooter className="mt-6 sm:mt-8 pt-3 sm:pt-4 border-t border-border" />
            </main>
          </div>
        </div>
      </div>
      <ThemeCustomizer />
      <AIChatHelper context={{ currentPage: 'dashboard' }} />
    </TourProvider>
  );
};
