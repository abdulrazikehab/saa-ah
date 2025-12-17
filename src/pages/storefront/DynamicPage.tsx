import { useEffect, useState, useMemo } from 'react';
import { useParams, useLocation, useSearchParams } from 'react-router-dom';
import { coreApi } from '@/lib/api';
import { SectionRenderer } from '@/components/builder/SectionRenderer';
import { Section } from '@/components/builder/PageBuilder';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DynamicPage() {
  const { slug: slugFromParams } = useParams<{ slug: string }>();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Get slug from params or extract from pathname (remove leading/trailing slashes)
  const slug = useMemo(() => {
    return slugFromParams || location.pathname.replace(/^\//, '').replace(/\/$/, '');
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
    return (
      <div className="flex items-center justify-center min-h-screen text-primary">
        <Loader2 className="animate-spin w-12 h-12 mr-4" />
        <span className="text-xl font-medium">Loading page…</span>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">Page not found</h2>
        <p className="text-gray-600">The requested page does not exist.</p>
      </div>
    );
  }

  const content = (isPreview && page.draftContent) ? page.draftContent : page.content;
  const sections: Section[] = content?.sections ?? [];
  const backgroundColor = (content?.backgroundColor as string) || '#ffffff';
  const isDarkMode = (content?.isDarkMode as boolean) || false;

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
