import { useEffect, useState, useMemo } from 'react';
import { useParams, useLocation, useSearchParams } from 'react-router-dom';
import { coreApi } from '@/lib/api';
import { SectionRenderer } from '@/components/builder/SectionRenderer';
import { Section } from '@/components/builder/PageBuilder';
import { Page } from '@/services/types';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

import { StorefrontLoading } from '@/components/storefront/StorefrontLoading';

interface PageContent {
  sections: Section[];
  backgroundColor?: string;
  isDarkMode?: boolean;
  [key: string]: any;
}

export default function DynamicPage() {
  const { slug: slugFromParams } = useParams<{ slug: string }>();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);

  // Get slug from params or extract from pathname (remove leading/trailing slashes)
  // Handle both /page/:slug and /:slug routes
  const slug = useMemo(() => {
    if (slugFromParams) {
      return slugFromParams;
    }
    // Remove leading/trailing slashes and 'page/' prefix if present
    let path = location.pathname.replace(/^\//, '').replace(/\/$/, '');
    if (path.startsWith('page/')) {
      path = path.replace('page/', '');
    }
    return path;
  }, [slugFromParams, location.pathname]);

  useEffect(() => {
    setLoading(true);
    setPage(null);
    
    if (slug) {
      const loadPage = async () => {
        try {
          const data = await coreApi.getPageBySlug(slug);
          // Only set page if it's published (unless preview mode)
          if (data && (isPreview || data.isPublished)) {
            setPage(data);
          } else {
            setPage(null);
          }
        } catch (error) {
          // Error logged to backend
          setPage(null);
        } finally {
          setLoading(false);
        }
      };
      loadPage();
    } else {
      setLoading(false);
    }
  }, [slug, isPreview]);

  if (loading) {
    return <StorefrontLoading />;
  }

  if (!page) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">Page not found</h2>
        <p className="text-gray-600">The requested page does not exist.</p>
      </div>
    );
  }

  const rawContent = (isPreview && page.draftContent) ? page.draftContent : page.content;
  const content = rawContent as unknown as PageContent;
  const sections: Section[] = content?.sections ?? [];

  // List of section types that require the premium dark theme (Cards template)
  const CARDS_SECTION_TYPES = [
    'merchant-dashboard',
    'product-list',
    'store-page',
    'support-tickets',
    'favorites-page',
    'balance-operations',
    'employees-page',
    'permissions-page',
    'charge-wallet',
    'reports-page',
    'profile-page',
    'categories-hierarchy',
    'bank-accounts'
  ];

  // Check if the page contains any of the Cards template sections
  const isCardsPage = sections.some(section => CARDS_SECTION_TYPES.includes(section.type));

  // Force transparent background for Cards pages to ensure premium look
  // regardless of legacy database settings
  const backgroundColor = isCardsPage 
    ? 'transparent' 
    : ((content?.backgroundColor as string) || '#ffffff');
    
  // For Cards pages, we want to respect the global theme (light/dark)
  // so we force isDarkMode to false here to prevent the 'dark' class from being added locally
  // The content will then inherit the theme from the parent (html/body)
  const isDarkMode = isCardsPage 
    ? false 
    : ((content?.isDarkMode as boolean) || false);

  return (
    <motion.div
      className={`min-h-screen p-6 ${isDarkMode ? 'dark' : ''}`}
      style={{ backgroundColor }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header with title and edit button */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">
          {page.title}
        </h1>

      </div>

      {/* Render sections with entrance animation */}
      {sections.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">This page has no content yet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sections.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              <SectionRenderer section={section} />
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
