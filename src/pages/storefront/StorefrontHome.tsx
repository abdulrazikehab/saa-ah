import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { coreApi } from '@/lib/api';
import { Loader2, Search, ImageIcon } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/lib/currency-utils';

export default function StorefrontHome() {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    const init = async () => {
      try {
        // 1. Check if running natively or if we should show mobile layout
        // For now, let's allow it on web too if config exists, or restrict to Capacitor
        const isNative = Capacitor.isNativePlatform();
        
        // Fetch Config
        let appConfig = null;
        try {
            const res = await coreApi.get('/app-builder/config');
            appConfig = res?.config || res;
        } catch (e) {
            console.warn("No app config found");
        }

        if (isNative && appConfig) {
            setConfig(appConfig);
            // Fetch Data
            const [prodsRes, catsRes] = await Promise.all([
                coreApi.get('/products?limit=6&featured=true'),
                coreApi.get('/categories?limit=10')
            ]);
            setProducts(prodsRes?.data?.products || prodsRes?.products || []);
            setCategories(catsRes?.data?.categories || catsRes?.categories || []);
            setLoading(false);
            return;
        }

        // Fallback: Redirect
        const pages = await coreApi.getPages(false);
        if (Array.isArray(pages) && pages.length > 0) {
          const homePage = pages.find((p: any) => p.slug === 'home');
          navigate(`/${homePage ? homePage.slug : pages[0].slug}`, { replace: true });
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to init storefront home', error);
        setLoading(false);
      }
    };

    init();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-12 h-12 text-indigo-600" />
      </div>
    );
  }

  // Render Mobile Layout if Config exists
  if (config) {
      return (
        <div className="flex-1 overflow-y-auto pb-20 bg-gray-50 dark:bg-gray-900 min-h-screen">
            {/* Header / Search */}
            {config.showSearch && (
                <div className="px-4 py-3 bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
                    <div className="bg-gray-100 dark:bg-gray-700 h-10 rounded-xl flex items-center px-4 text-gray-500 text-sm">
                        <Search className="w-4 h-4 mr-2" />
                        {isRTL ? 'بحث عن منتجات...' : 'Search products...'}
                    </div>
                </div>
            )}

            <div className="p-4 space-y-6">
                {/* Banner */}
                {config.showBanner && (
                    <div 
                      className="w-full aspect-[2/1] rounded-2xl flex flex-col items-center justify-center text-white p-6 text-center shadow-lg relative overflow-hidden"
                      style={{ background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`, borderRadius: config.cornerRadius || '1rem' }}
                    >
                      <span className="relative z-10 font-bold text-2xl uppercase tracking-wider">
                        {isRTL ? config.bannerTextAr : config.bannerText}
                      </span>
                      {(isRTL ? config.bannerSubtextAr : config.bannerSubtext) && (
                        <span className="relative z-10 text-sm mt-2 opacity-90">
                          {isRTL ? config.bannerSubtextAr : config.bannerSubtext}
                        </span>
                      )}
                    </div>
                )}

                {/* Categories */}
                {config.showCategories && categories.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="font-bold text-sm">{isRTL ? config.categoriesTitleAr : config.categoriesTitle}</h3>
                    </div>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                        {categories.map((cat) => (
                            <div key={cat.id} className="flex flex-col items-center gap-1 shrink-0 w-16">
                                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border">
                                    {cat.image ? (
                                        <img src={cat.image} className="w-full h-full object-cover" alt={cat.name} />
                                    ) : (
                                        <ImageIcon className="w-6 h-6 text-gray-400" />
                                    )}
                                </div>
                                <span className="text-[10px] font-medium text-gray-600 truncate w-full text-center">
                                    {isRTL ? (cat.nameAr || cat.name) : cat.name}
                                </span>
                            </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Featured Products */}
                {config.showFeatured && products.length > 0 && (
                    <div>
                        <div className="flex justify-between items-center mb-4 px-1">
                            <h3 className="font-bold">{isRTL ? config.featuredTitleAr : config.featuredTitle}</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {products.map((product) => (
                                <div key={product.id} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border" style={{ borderRadius: config.cornerRadius || '1rem' }}>
                                    <div className="aspect-square bg-gray-100 relative">
                                        {product.images?.[0] ? (
                                            <img src={product.images[0]} className="w-full h-full object-cover" alt={product.name} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                <ImageIcon className="w-8 h-8" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3">
                                        <h4 className="font-medium text-sm line-clamp-1 text-gray-900 dark:text-gray-100">{isRTL ? (product.nameAr || product.name) : product.name}</h4>
                                        <p className="font-bold text-sm mt-1" style={{ color: config.primaryColor }}>
                                            {formatCurrency(product.price, config.currency || 'SAR')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
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
      </div>
    </div>
  );
}
