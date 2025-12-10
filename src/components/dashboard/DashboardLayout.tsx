import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';
import { useAuth } from '@/contexts/AuthContext';
import DashboardBanner from './DashboardBanner';

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 bg-card border-l z-40 transition-all duration-300 ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}`}>
          <DashboardSidebar 
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </aside>

        {/* Mobile Sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="right" className="w-64 p-0">
            <DashboardSidebar />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'lg:mr-20' : 'lg:mr-64'}`}>
          {/* Header */}
          <DashboardHeader 
            onMenuClick={() => setSidebarOpen(true)}
            userName={user?.name || user?.tenantName || user?.email || 'User'}
            userEmail={user?.email || ''}
            userAvatar={user?.avatar || user?.tenantLogo || undefined}
          />

          {/* Page Content */}
          <main className="p-4 sm:p-6 lg:p-8">
            <DashboardBanner />
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
