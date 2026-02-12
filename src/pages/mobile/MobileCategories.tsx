import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout, Search } from 'lucide-react';
import { coreApi } from '@/lib/api';
import { Category } from '@/services/types';
import { cn } from '@/lib/utils';
import { getMobileTenantId } from '@/lib/storefront-utils';

interface MobileCategoriesProps {
  categories?: Category[];
  config?: any;
  loading?: boolean;
}

export default function MobileCategories({ 
  categories: initialCategories, 
  config: initialConfig,
  loading: initialLoading 
}: MobileCategoriesProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  
  const [categories, setCategories] = useState<Category[]>(initialCategories || []);
  const [localAppConfig, setLocalAppConfig] = useState<any>(initialConfig || null);
  const [loading, setLoading] = useState(initialLoading !== undefined ? initialLoading : !initialCategories);
  const [searchQuery, setSearchQuery] = useState('');

  // Retrieve context configuration from MobileLayout
  const { appConfig: contextAppConfig } = useOutletContext<{ appConfig: any }>() || {};
  
  // Prioritize context config (live preview) over props or local state
  const appConfig = contextAppConfig || initialConfig || localAppConfig;

  // Helper to get dynamic page title
  const getPageTitle = (pageId: string) => {
    const page = appConfig?.pages?.find((p: any) => p.id === pageId);
    if (!page) return null;
    return isRTL ? (page.titleAr || page.title) : page.title;
  };

  useEffect(() => {
    if (initialCategories) {
       setCategories(initialCategories);
       setLocalAppConfig(initialConfig);
       if (initialLoading !== undefined) setLoading(initialLoading);
       else setLoading(false);
       return;
    }

    const fetchData = async () => {
        try {
            const tenantId = getMobileTenantId();
            const [cats, config] = await Promise.all([
                coreApi.getCategories().catch(() => []),
                coreApi.get(tenantId ? `/app-builder/config?tenantId=${tenantId}` : '/app-builder/config')
                  .then(res => res.config || res)
                  .catch(() => ({}))
            ]);
            
            setCategories(Array.isArray(cats) ? cats : cats.categories || []);
            setLocalAppConfig(config);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [initialCategories, initialConfig, initialLoading]);

  const filteredCategories = categories.filter(cat => {
    const name = (cat.nameAr || cat.name || '').toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  if (loading) return (
    <div className="p-8 text-center min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
    </div>
  );


  const enableGlass = appConfig?.enableGlassEffect;
  
  const containerClass = enableGlass 
    ? 'bg-transparent text-white' 
    : 'bg-background text-foreground';
    
  const inputClass = enableGlass
    ? 'bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20'
    : 'bg-card border-border text-foreground placeholder:text-muted-foreground focus:ring-primary/20';
    
  const cardClass = enableGlass
    ? 'bg-white/10 border-white/10 backdrop-blur-md hover:bg-white/20'
    : 'bg-card border-border shadow-sm hover:scale-[1.02]';
    
  const iconBgClass = enableGlass
    ? 'bg-white/10 border-white/20 text-white'
    : 'bg-muted border-border text-muted-foreground';

  return (
    <div className={`flex-1 overflow-y-auto no-scrollbar pt-6 pb-32 px-4 min-h-screen ${containerClass}`}>
          <div className="mb-6">
             <h2 className={`text-2xl font-bold mb-4 ${enableGlass ? 'text-white' : 'text-foreground'}`}>
                {getPageTitle('categories') || (isRTL ? 'الأقسام' : 'Categories')}
             </h2>
             <div className="relative">
                <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 ${enableGlass ? 'text-white/60' : 'text-muted-foreground'}`} />
                <input 
                    placeholder={isRTL ? 'ابحث عن قسم...' : 'Search categories...'}
                    className={`w-full h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-1 transition-all ${isRTL ? 'pr-9' : 'pl-9'} ${inputClass}`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
          </div>
         
         {filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto ${iconBgClass}`}>
                    <Layout className={`w-8 h-8 ${enableGlass ? 'text-white/60' : 'text-muted-foreground'}`} />
                </div>
                <h3 className={`font-bold mb-1 ${enableGlass ? 'text-white' : 'text-foreground'}`}>{t('common.noCategories', 'No Categories Found')}</h3>
                <p className={`text-sm ${enableGlass ? 'text-white/60' : 'text-muted-foreground'}`}>{t('common.checkBackLater', 'Please check back later.')}</p>
            </div>
         ) : (
            <div className="grid grid-cols-2 gap-4">
                {filteredCategories.map((cat) => (
                   <div 
                     key={cat.id} 
                     className={`p-4 rounded-2xl border flex flex-col items-center gap-3 transition-all cursor-pointer ${cardClass}`}
                     onClick={async () => {
                        try {
                           // Quick check for brands
                           const brandsRes = await coreApi.getBrands({ categoryId: cat.id, limit: 1 }).catch(() => []);
                           const brandsList = Array.isArray(brandsRes) ? brandsRes : (brandsRes as any).data || [];
                           
                           if (brandsList.length > 0) {
                               navigate(`/categories/${cat.id}/brands`);
                           } else {
                               navigate(`/categories/${cat.id}`);
                           }
                        } catch (e) {
                           navigate(`/categories/${cat.id}`);
                        }
                     }}
                   >
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center overflow-hidden border ${iconBgClass}`}>
                         {cat.image ? (
                            <img src={cat.image} className="w-full h-full object-cover" alt="" />
                         ) : (
                            <Layout className={`w-8 h-8 ${enableGlass ? 'text-white/60' : 'text-muted-foreground'}`} />
                         )}
                      </div>
                      <span className={`font-bold text-sm text-center line-clamp-1 ${enableGlass ? 'text-white' : 'text-foreground'}`}>{cat.nameAr || cat.name}</span>
                   </div>
                ))}
            </div>
         )}
    </div>
  );
}
