import { Outlet } from 'react-router-dom';
import { StorefrontHeader } from './StorefrontHeader';
import { StorefrontFooter } from './StorefrontFooter';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ThemeDebugger } from '@/components/theme/ThemeDebugger';

export const StorefrontLayout = () => {
  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--theme-background)', color: 'var(--theme-text)' }}>
        <StorefrontHeader />
        <main className="flex-1">
          <Outlet />
        </main>
        <StorefrontFooter />
        {/* Theme Debugger - Remove in production */}
        <ThemeDebugger />
      </div>
    </ThemeProvider>
  );
};
