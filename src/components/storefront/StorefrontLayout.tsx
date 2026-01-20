import { Outlet } from 'react-router-dom';
import { StorefrontHeader } from './StorefrontHeader';
import { StorefrontFooter } from './StorefrontFooter';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';

import { StorefrontLoading } from './StorefrontLoading';
import { ThemeCustomizer } from '@/components/ui/ThemeCustomizer';

const StorefrontLayoutContent = () => {
  const { loading } = useTheme();

  if (loading) {
    return <StorefrontLoading />;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--theme-background)', color: 'var(--theme-text)' }}>
      <StorefrontHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <StorefrontFooter />
      {/* Theme Debugger - Remove in production */}
      <ThemeCustomizer />
    </div>
  );
};

export const StorefrontLayout = () => {
  return (
    <ThemeProvider>
      <StorefrontLayoutContent />
    </ThemeProvider>
  );
};
