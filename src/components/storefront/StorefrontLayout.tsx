import { Outlet } from 'react-router-dom';
import { StorefrontHeader } from './StorefrontHeader';
import { StorefrontFooter } from './StorefrontFooter';
import { useTheme } from '@/contexts/ThemeContext';
import { StorefrontLoading } from './StorefrontLoading';
import { ThemeCustomizer } from '@/components/ui/ThemeCustomizer';
import { Capacitor } from '@capacitor/core';

import { MobileLayout } from '@/components/mobile/MobileLayout';

const StorefrontLayoutContent = () => {
  const { loading } = useTheme();

  // Check for native mode
  // Persist mobile mode if triggered via URL
  if (typeof window !== 'undefined' && window.location.href.includes('platform=mobile')) {
      try { sessionStorage.setItem('isMobilePlatform', 'true'); } catch {}
  }

  const isNative = Capacitor.isNativePlatform() || 
                   (typeof window !== 'undefined' && (
                       window.location.href.includes('platform=mobile') || 
                       sessionStorage.getItem('isMobilePlatform') === 'true'
                   ));

  if (loading) {
    return <StorefrontLoading />;
  }

  // Use Mobile Layout structure for Native App
  if (isNative) {
    return <MobileLayout />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {!isNative && <StorefrontHeader />}
      <main className="flex-1">
        <Outlet />
      </main>
      {!isNative && <StorefrontFooter />}
      {/* Theme Debugger - Remove in production */}
      {!isNative && <ThemeCustomizer />}
    </div>
  );
};

export const StorefrontLayout = () => {
  return (
    <StorefrontLayoutContent />
  );
};
