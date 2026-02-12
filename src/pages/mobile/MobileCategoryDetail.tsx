import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Package } from 'lucide-react';
import { coreApi } from '@/lib/api';
import { Product, Category, Brand } from '@/services/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter } from 'lucide-react';
import { MobileProductCard } from '@/components/mobile/MobileProductCard';

export default function MobileCategoryDetail() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const brandId = params.get('brandId');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [appConfig, setAppConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc'>('default');
  
  // Retrieve context configuration from MobileLayout
  const { appConfig: contextAppConfig } = useOutletContext<{ appConfig: any }>() || {};
  
  // Prioritize context config (live preview) over local state
  const config = contextAppConfig || appConfig || {};

  // Helper to get dynamic page title
  const getPageTitle = (pageId: string) => {
    const page = config.pages?.find((p: any) => p.id === pageId);
    if (!page) return null;
    return isRTL ? (page.titleAr || page.title) : page.title;
  };

  useEffect(() => {
    const load = async () => {
        try {
            const [configRes, productsRes] = await Promise.all([
                coreApi.get('/app-builder/config'),
                coreApi.getProducts({ categoryId: id, brandId: brandId || undefined, limit: 100 } as any)
            ]);
            setAppConfig(configRes.config || configRes);
            const asAny = productsRes as any;
            const pList = Array.isArray(productsRes) ? productsRes : 
                          (Array.isArray(asAny.products) ? asAny.products : 
                          (Array.isArray(asAny.data) ? asAny.data : []));
            setProducts(pList);
            
            // Try to find category details (name)
            const catsVars = await coreApi.getCategories();
            const cats = Array.isArray(catsVars) ? catsVars : catsVars.categories;
            const found = cats?.find((c: any) => c.id === id);
            setCategory(found || null);

            // Fetch brand details if filtering by brand
            if (brandId) {
                try {
                    const bRes = await coreApi.getBrand(brandId);
                    setBrand(bRes.data || bRes);
                } catch (e) {
                    console.error('Failed to fetch brand', e);
                }
            } else {
                setBrand(null);
            }

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    load();
  }, [id, brandId]);

  if (loading) return <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div></div>;

  const primaryColor = config.primaryColor || '#000000';
  
  const catName = brand ? (brand.nameAr || brand.name) : (category ? (category.nameAr || category.name) : (getPageTitle('products') || (isRTL ? 'المنتجات' : 'Products')));

  const filteredProducts = products
    .filter(p => {
        const query = searchQuery.toLowerCase();
        const nameEn = (p.name || '').toLowerCase();
        const nameAr = (p.nameAr || '').toLowerCase();
        return nameEn.includes(query) || nameAr.includes(query);
    })
    .sort((a, b) => {
        if (sortBy === 'price-asc') return (a.price || 0) - (b.price || 0);
        if (sortBy === 'price-desc') return (b.price || 0) - (a.price || 0);
        return 0;
    });

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pt-4 pb-32 px-4 bg-gray-50/50 min-h-screen">
         <div className="flex items-center gap-3 mb-6">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full bg-white shadow-sm" 
              onClick={() => navigate(brandId ? `/categories/${id}/brands` : '/categories')}
            >
               <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
            </Button>
            <h2 className="text-xl font-bold">{catName}</h2>
         </div>
         
         {/* Search & Simple Filter */}
         <div className="flex gap-2 mb-6">
            <div className="relative flex-1">
                <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} />
                <Input 
                    placeholder={isRTL ? 'ابحث...' : 'Search...'}
                    className={`h-10 text-xs bg-white border-gray-100 rounded-xl ${isRTL ? 'pr-9' : 'pl-9'}`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <Button 
                variant="outline" 
                size="sm" 
                className="h-10 rounded-xl border-gray-100 bg-white gap-2 text-xs"
                onClick={() => setSortBy(prev => prev === 'price-asc' ? 'price-desc' : (prev === 'price-desc' ? 'default' : 'price-asc'))}
            >
                <Filter className="w-4 h-4" />
                {sortBy === 'default' ? (isRTL ? 'فرز' : 'Sort') : (sortBy === 'price-asc' ? (isRTL ? 'الأقل سعراً' : 'Price: Low') : (isRTL ? 'الأعلى سعراً' : 'Price: High'))}
            </Button>
         </div>

         <div className="grid grid-cols-2 gap-4">
            {filteredProducts.map((product) => (
                <MobileProductCard key={product.id} product={product} config={config} />
            ))}
         </div>
         
          {products.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{isRTL ? 'لا توجد منتجات' : 'No products found'}</p>
              {brandId && (
                 <Button variant="outline" className="mt-4" onClick={() => navigate(id ? `/categories/${id}` : '/products')}>
                    {isRTL ? 'مسح الفلتر' : 'Clear Filter'}
                 </Button>
              )}
            </div>
          )}
      </div>
  );
}
