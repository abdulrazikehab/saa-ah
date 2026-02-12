import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { coreApi } from '@/lib/api';
import { Brand, Category } from '@/services/types';
import { Button } from '@/components/ui/button';

export default function MobileCategoryBrands() {
  const { id } = useParams<{ id: string }>(); // Category ID
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  
  const [brands, setBrands] = useState<Brand[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
     const load = async () => {
        try {
           const [brandsRes, catRes] = await Promise.all([
               coreApi.getBrands({ categoryId: id, limit: 50 }).catch(() => []),
               coreApi.getCategories().then(res => {
                    const list = Array.isArray(res) ? res : res.categories || [];
                    return list.find((c: any) => c.id === id);
               }).catch(() => null)
           ]);
           
           const brandsList = Array.isArray(brandsRes) ? brandsRes : (brandsRes as any).data || [];
           setBrands(brandsList);
           setCategory(catRes || null);
           
           // If no brands found, auto-redirect to products? 
           // Probably redundant check since we shouldn't have linked here, but good for safety.
           if (brandsList.length === 0) {
              navigate(`/categories/${id}`, { replace: true });
           }
        } finally {
            setLoading(false);
        }
     };
     if(id) load();
  }, [id, navigate]);

  const catName = category ? (category.nameAr || category.name) : '';

  if (loading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"/></div>;

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pt-6 pb-20 px-4 bg-gray-50/50 min-h-screen">
       <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white shadow-sm" onClick={() => navigate('/categories')}>
             <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
          </Button>
          <h2 className="text-xl font-bold">{catName} - {isRTL ? 'البراندات' : 'Brands'}</h2>
       </div>
       
       <div className="grid grid-cols-2 gap-4">
          {brands.map(brand => (
             <div key={brand.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-3 cursor-pointer transition-transform hover:scale-[1.02]"
                  onClick={() => navigate(`/categories/${id}?brandId=${brand.id}`)}
             >
                {brand.logo ? (
                    <img src={brand.logo} className="w-16 h-16 object-contain" alt={brand.name}/>
                ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-400 text-xl">{brand.name?.[0]}</div>
                )}
                <span className="font-medium text-sm text-center">{brand.nameAr || brand.name}</span>
             </div>
          ))}
       </div>
    </div>
  );
}
