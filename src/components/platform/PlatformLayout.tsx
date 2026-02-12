import { ReactNode } from 'react';
import { PlatformHeader } from './PlatformHeader';
import { PlatformFooter } from './PlatformFooter';
import { useTranslation } from 'react-i18next';

interface PlatformLayoutProps {
  children: ReactNode;
}

export function PlatformLayout({ children }: PlatformLayoutProps) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div className="min-h-screen flex flex-col bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <PlatformHeader />
      <main className="flex-1">
        {children}
      </main>
      <PlatformFooter />
    </div>
  );
}
