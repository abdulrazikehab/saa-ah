import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { coreApi } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import { StorefrontHeader } from '@/components/storefront/StorefrontHeader';
import { StorefrontFooter } from '@/components/storefront/StorefrontFooter';
import { SafeHTML } from '@/components/common/SafeHTML';

interface PageContent {
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
}

export default function StaticPage({ slug: propSlug }: { slug?: string }) {
  const { slug: paramSlug } = useParams();
  const slug = propSlug || paramSlug;
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [content, setContent] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      if (!slug) return;
      
      setLoading(true);
      try {
        const response = await coreApi.get(`/public/pages/${slug}`);
        if (response?.content) {
          setContent(response.content);
        } else {
          setError(true);
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <StorefrontHeader />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <StorefrontFooter />
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen flex flex-col">
        <StorefrontHeader />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">
            {isRTL ? 'الصفحة غير موجودة' : 'Page Not Found'}
          </h1>
          <p className="text-muted-foreground">
            {isRTL ? 'عذراً، لم نتمكن من العثور على المحتوى المطلوب.' : 'Sorry, we could not find the requested content.'}
          </p>
        </div>
        <StorefrontFooter />
      </div>
    );
  }

  const title = isRTL ? content.titleAr : content.titleEn;
  const htmlContent = isRTL ? content.contentAr : content.contentEn;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <StorefrontHeader />
      
      <main className="flex-1 py-12 md:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">
              {title}
            </h1>
            
            {/* SECURITY FIX: Using SafeHTML to prevent XSS */}
            <SafeHTML
              html={htmlContent}
              className="prose prose-lg dark:prose-invert max-w-none"
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </motion.div>
        </div>
      </main>

      <StorefrontFooter />
    </div>
  );
}
