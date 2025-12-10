import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { coreApi } from '@/lib/api';
import { Loader2 } from 'lucide-react';

export default function StorefrontHome() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const redirectToHomePage = async () => {
      try {
        // Try to find a page with slug 'home' or the first page
        const pages = await coreApi.getPages();
        
        if (Array.isArray(pages) && pages.length > 0) {
          // Look for 'home' page first
          const homePage = pages.find((p: { slug: string }) => p.slug === 'home');
          
          if (homePage) {
            navigate(`/${homePage.slug}`, { replace: true });
          } else {
            // Redirect to first page
            navigate(`/${pages[0].slug}`, { replace: true });
          }
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to load pages', error);
        setLoading(false);
      }
    };

    redirectToHomePage();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-12 h-12 text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center p-8">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          Welcome to Our Store
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          No pages have been created yet. Please create a page to get started.
        </p>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-yellow-800 dark:text-yellow-200">
            <strong>Tip:</strong> Create a page with slug "home" to make it your homepage.
          </p>
        </div>
      </div>
    </div>
  );
}
