
import { useState, useEffect, useCallback } from 'react';
import { coreApi } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, RefreshCw, Wand2, Database, Trash2, X, Check, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SupplierProduct {
    id: string;
    productCode: string;
    nameEn: string;
    nameAr?: string;
    currency?: string;
    faceValue: number;
    isActive: boolean;
    supplier: string;
    supplierProductId: string;
    buyPrice: number;
    isAvailable: boolean;
    lastSyncedAt: string;
}

interface SyncResult {
    success: boolean;
    count: number;
    message: string;
}

interface AutoFillResult {
    productId: string;
    productName: string;
    productNameAr?: string | null;
    matchedSupplierProduct: string;
    matchedSupplierProductAr?: string | null;
    productCode: string;
    similarity: string;
    normalizedProductName?: string;
    normalizedSupplierName?: string;
    supplierProductCode?: string;
    supplierCurrency?: string | null;
    supplierFaceValue?: number | null;
}

export default function SupplierProductsManager({ adminApiKey }: { adminApiKey?: string }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSyncPopup, setShowSyncPopup] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [showAutoFillPopup, setShowAutoFillPopup] = useState(false);
  const [autoFillResult, setAutoFillResult] = useState<AutoFillResult[]>([]);
  const [acceptedProductIds, setAcceptedProductIds] = useState<Set<string>>(new Set());
  const [rejectedProductIds, setRejectedProductIds] = useState<Set<string>>(new Set());
  const [accepting, setAccepting] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const fetchProducts = useCallback(async () => {
      // Proceed even if adminApiKey is not provided
      setLoading(true);
      try {
          const res = await coreApi.get('/supplier/products', { 
            requireAuth: true, 
            adminApiKey: adminApiKey 
          });
          setProducts(res);
      } catch (e) {
          console.error(e);
          toast.error(t('common.failedToLoad'));
      } finally {
          setLoading(false);
      }
  }, [t, adminApiKey]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSync = async () => {
      // Proceed even if adminApiKey is not provided
      setLoading(true);
      try {
          const res = await coreApi.post('/supplier/products/sync', {}, { 
            requireAuth: true, 
            adminApiKey: adminApiKey 
          });
          setSyncResult(res);
          setShowSyncPopup(true);
          fetchProducts();
      } catch (e) {
         console.error(e);
         toast.error(t('supplierProducts.failedSync'));
      } finally {
         setLoading(false);
      }
  };

  const handleAutoFill = async () => {
      // Proceed even if adminApiKey is not provided
      setLoading(true);
      try {
          const res = await coreApi.post('/supplier/products/auto-fill', {}, { 
            requireAuth: true, 
            adminApiKey: adminApiKey 
          });
          setAutoFillResult(res);
          setAcceptedProductIds(new Set()); // Reset accepted items
          setRejectedProductIds(new Set()); // Reset rejected items
          setShowAutoFillPopup(true);
      } catch (e) {
          console.error(e);
          toast.error(t('supplierProducts.failedAutoFill'));
      } finally {
          setLoading(false);
      }
  };

  const handleAcceptMatch = async (productId: string) => {
      // Proceed even if adminApiKey is not provided
      setAccepting(true);
      try {
          await coreApi.post('/supplier/products/auto-fill/accept', { productIds: [productId] }, { 
            requireAuth: true, 
            adminApiKey: adminApiKey 
          });
          setAcceptedProductIds(prev => new Set([...prev, productId]));
          toast.success(t('supplierProducts.matchAccepted'));
          fetchProducts(); // Refresh products list
      } catch (e) {
          console.error(e);
          toast.error(t('common.error'));
      } finally {
          setAccepting(false);
      }
  };

  const handleAcceptAll = async () => {
      const pendingProductIds = autoFillResult
          .filter(res => !acceptedProductIds.has(res.productId) && !rejectedProductIds.has(res.productId))
          .map(res => res.productId);
      
      if (pendingProductIds.length === 0) {
          toast.info(t('supplierProducts.allHandled'));
          return;
      }

      // Proceed even if adminApiKey is not provided
      setAccepting(true);
      try {
          await coreApi.post('/supplier/products/auto-fill/accept', { productIds: pendingProductIds }, { 
            requireAuth: true, 
            adminApiKey: adminApiKey 
          });
          setAcceptedProductIds(prev => new Set([...prev, ...pendingProductIds]));
          toast.success(t('supplierProducts.matchesAccepted', { count: pendingProductIds.length }));
          fetchProducts(); // Refresh products list
      } catch (e) {
          console.error(e);
          toast.error(t('common.error'));
      } finally {
          setAccepting(false);
      }
  };

  const handleRejectMatch = (productId: string) => {
      setRejectedProductIds(prev => new Set([...prev, productId]));
      toast.info(t('supplierProducts.matchRejected'));
  };

  const handleRejectAll = () => {
      const pendingProductIds = autoFillResult
          .filter(res => !acceptedProductIds.has(res.productId) && !rejectedProductIds.has(res.productId))
          .map(res => res.productId);
      
      if (pendingProductIds.length === 0) {
          toast.info(t('supplierProducts.allHandled'));
          return;
      }

      setRejectedProductIds(prev => new Set([...prev, ...pendingProductIds]));
      toast.info(t('supplierProducts.matchesRejected', { count: pendingProductIds.length }));
  };

  const handleClearProductCodes = async () => {
      // Proceed even if adminApiKey is not provided
      setClearing(true);
      try {
          const res = await coreApi.post('/supplier/products/clear-product-codes', {}, { 
            requireAuth: true, 
            adminApiKey: adminApiKey 
          });
          toast.success(res.message || t('supplierProducts.successClear'));
          setShowClearConfirm(false);
          fetchProducts(); // Refresh products list
      } catch (e) {
          console.error(e);
          toast.error(t('supplierProducts.failedClear'));
      } finally {
          setClearing(false);
      }
  };

  return (
    <div className="space-y-6 p-6">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">{t('supplierProducts.title')}</h2>
            <p className="text-gray-400">{t('supplierProducts.subtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-3">
             <button 
                onClick={handleSync} 
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg text-white hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
             >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> 
                {t('supplierProducts.sync')}
             </button>
             <button 
                onClick={handleAutoFill} 
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50"
             >
                <Wand2 className="w-4 h-4" /> 
                {t('supplierProducts.autoFill')}
             </button>
             <button 
                onClick={() => setShowClearConfirm(true)} 
                disabled={loading || clearing}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg text-white hover:from-red-700 hover:to-orange-700 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
             >
                <Trash2 className="w-4 h-4" /> 
                {t('supplierProducts.clearAll')}
             </button>
          </div>
       </div>

       {/* Stats Cards */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
               <div className="flex items-center gap-3 mb-2">
                   <div className="p-2 bg-blue-500/10 rounded-lg"><Database className="w-5 h-5 text-blue-500"/></div>
                   <span className="text-2xl font-bold text-white">{products.length}</span>
               </div>
               <p className="text-sm text-gray-400">{t('supplierProducts.totalProducts')}</p>
           </div>
       </div>

       {/* Table */}
       {loading && products.length === 0 ? (
           <div className="flex justify-center p-12">
               <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
           </div>
       ) : (
           <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
               <div className="overflow-x-auto">
                   <table className="w-full text-white table-fixed">
                       <thead className="bg-slate-950/50 text-gray-400 border-b border-slate-800">
                           <tr>
                               <th className="p-4 text-left font-medium w-32">{t('supplierProducts.code')}</th>
                               <th className="p-4 text-left font-medium w-auto">{t('supplierProducts.name')}</th>
                               <th className="p-4 text-left font-medium w-28">{t('supplierProducts.price')}</th>
                               <th className="p-4 text-left font-medium w-32">{t('supplierProducts.status')}</th>
                               <th className="p-4 text-left font-medium w-40">{t('supplierProducts.syncedAt')}</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-800">
                           {products.map(p => (
                               <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                                   <td className="p-4 font-mono text-xs text-blue-400 truncate" title={p.productCode}>{p.productCode}</td>
                                   <td className="p-4">
                                       <div className="font-medium truncate text-sm" title={p.nameEn}>{p.nameEn}</div>
                                       {p.nameAr && <div className="text-xs text-gray-500 truncate" title={p.nameAr}>{p.nameAr}</div>}
                                   </td>
                                   <td className="p-4 whitespace-nowrap">
                                       <span className="font-semibold text-green-400">{p.buyPrice}</span> <span className="text-gray-500 text-xs">{p.currency || 'USD'}</span>
                                   </td>
                                   <td className="p-4">
                                       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                           p.isAvailable 
                                           ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                                           : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                       }`}>
                                           {p.isAvailable ? t('supplierProducts.available') : t('supplierProducts.unavailable')}
                                       </span>
                                   </td>
                                   <td className="p-4 text-xs text-gray-500 whitespace-nowrap">
                                       {new Date(p.lastSyncedAt).toLocaleDateString()}
                                       <div className="text-[10px] opacity-70">
                                            {new Date(p.lastSyncedAt).toLocaleTimeString()}
                                       </div>
                                   </td>
                               </tr>
                           ))}
                           {products.length === 0 && (
                               <tr>
                                   <td colSpan={5} className="p-12 text-center text-gray-500">
                                       <Database className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                       <p>{t('supplierProducts.noProducts')}</p>
                                   </td>
                               </tr>
                           )}
                       </tbody>
                   </table>
               </div>
           </div>
       )}

       {/* Sync Popup */}
       {showSyncPopup && (
           <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
               <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
                   <div className="flex items-center gap-3 mb-4 text-green-500">
                       <Check className="w-6 h-6 p-1 bg-green-500/20 rounded-full" />
                       <h3 className="text-lg font-bold text-white">{t('supplierProducts.syncComplete')}</h3>
                   </div>
                   <div className="space-y-4">
                       <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 text-center">
                           <p className="text-3xl font-bold text-white mb-1">{syncResult?.count}</p>
                           <p className="text-xs text-gray-400 uppercase tracking-wider">{t('supplierProducts.productsSynced')}</p>
                       </div>
                       <p className="text-gray-400 text-sm text-center">{syncResult?.message}</p>
                   </div>
                   <button 
                        onClick={() => setShowSyncPopup(false)} 
                        className="mt-6 w-full py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-white font-medium transition-colors"
                   >
                       {t('supplierProducts.close')}
                   </button>
               </div>
           </div>
       )}

       {/* Auto-Fill Popup */}
       {showAutoFillPopup && (
           <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
               <div className="bg-slate-900 flex flex-col w-full max-w-2xl max-h-[85vh] rounded-xl border border-slate-800 shadow-2xl animate-in fade-in zoom-in duration-200">
                   <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                       <h3 className="text-lg font-bold text-white flex items-center gap-2">
                           <Wand2 className="w-5 h-5 text-purple-500" />
                           {t('supplierProducts.autoFillResults')}
                       </h3>
                       <button onClick={() => setShowAutoFillPopup(false)} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">
                            <X className="w-5 h-5" />
                       </button>
                   </div>
                   
                   <div className="flex-1 overflow-y-auto p-4 space-y-3">
                       {autoFillResult.length > 0 ? (
                           autoFillResult
                               .filter(res => !rejectedProductIds.has(res.productId))
                               .map((res, i) => {
                                   const isAccepted = acceptedProductIds.has(res.productId);
                                   return (
                                       <div key={i} className={`flex flex-col gap-3 p-4 rounded-xl border transition-all ${
                                           isAccepted 
                                               ? 'bg-green-500/5 border-green-500/20' 
                                               : 'bg-slate-800/40 border-slate-700 hover:border-slate-600'
                                       }`}>
                                           <div className="flex items-start justify-between gap-3">
                                               <div className="flex-1 min-w-0">
                                                   <div className="flex items-center gap-2 mb-2">
                                                       <p className="text-white font-medium">{res.productName}</p>
                                                       {res.productNameAr && (
                                                           <span className="text-xs text-gray-500">({res.productNameAr})</span>
                                                       )}
                                                   </div>
                                                   <div className="flex items-center gap-2 flex-wrap">
                                                       <span className="text-xs text-purple-400">{t('supplierProducts.linkedTo')}</span>
                                                       <span className="text-sm text-gray-300">{res.matchedSupplierProduct}</span>
                                                       {res.matchedSupplierProductAr && (
                                                           <span className="text-xs text-gray-500">({res.matchedSupplierProductAr})</span>
                                                       )}
                                                   </div>
                                                   <div className="mt-2 flex items-center gap-2 flex-wrap">
                                                       <span className="text-[10px] px-2 py-0.5 bg-slate-800 rounded font-mono text-gray-400 border border-slate-700">
                                                           {t('supplierProducts.productCode')}: {res.productCode}
                                                       </span>
                                                       {res.supplierCurrency && res.supplierFaceValue && (
                                                           <span className="text-xs text-gray-500">
                                                               {res.supplierFaceValue} {res.supplierCurrency}
                                                           </span>
                                                       )}
                                                   </div>
                                               </div>
                                               
                                               <div className="flex items-center gap-4 flex-shrink-0">
                                                   <div className="text-right">
                                                       <p className="text-[10px] text-gray-500 uppercase">{t('supplierProducts.similarity')}</p>
                                                       <p className="text-green-400 font-bold text-sm">{res.similarity}</p>
                                                   </div>
                                                   
                                                   {isAccepted ? (
                                                       <span className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs font-bold flex items-center gap-1.5">
                                                           <Check className="w-3.5 h-3.5" />
                                                           {t('supplierProducts.accepted')}
                                                       </span>
                                                   ) : (
                                                       <div className="flex items-center gap-2">
                                                           <button
                                                               onClick={() => handleAcceptMatch(res.productId)}
                                                               disabled={accepting}
                                                               className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-xs font-medium transition-colors"
                                                           >
                                                               {t('supplierProducts.accept')}
                                                           </button>
                                                           <button
                                                               onClick={() => handleRejectMatch(res.productId)}
                                                               disabled={accepting}
                                                               className="px-3 py-1.5 bg-slate-700 hover:bg-red-900/50 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-gray-300 text-xs font-medium transition-colors"
                                                           >
                                                               {t('supplierProducts.reject')}
                                                           </button>
                                                       </div>
                                                   )}
                                               </div>
                                           </div>
                                           
                                           {/* Expandable comparison details */}
                                           <button
                                               onClick={() => {
                                                   const newExpanded = new Set(expandedItems);
                                                   if (newExpanded.has(res.productId)) {
                                                       newExpanded.delete(res.productId);
                                                   } else {
                                                       newExpanded.add(res.productId);
                                                   }
                                                   setExpandedItems(newExpanded);
                                               }}
                                               className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-300 transition-colors"
                                           >
                                               <Info className="w-3.5 h-3.5" />
                                               {expandedItems.has(res.productId) ? (
                                                   <>
                                                       {t('supplierProducts.hideDetails')}
                                                       <ChevronUp className="w-3.5 h-3.5" />
                                                   </>
                                               ) : (
                                                   <>
                                                       {t('supplierProducts.showDetails')}
                                                       <ChevronDown className="w-3.5 h-3.5" />
                                                   </>
                                               )}
                                           </button>
                                           
                                           {expandedItems.has(res.productId) && (
                                               <div className="mt-2 p-3 bg-slate-900/50 rounded-lg border border-slate-700 space-y-2 text-xs">
                                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                       <div>
                                                           <p className="text-gray-500 mb-1">{t('supplierProducts.yourProduct')}:</p>
                                                           <p className="text-white font-medium">{res.productName}</p>
                                                           {res.productNameAr && (
                                                               <p className="text-gray-400 mt-1">{res.productNameAr}</p>
                                                           )}
                                                       </div>
                                                       <div>
                                                           <p className="text-gray-500 mb-1">{t('supplierProducts.supplierProduct')}:</p>
                                                           <p className="text-white font-medium">{res.matchedSupplierProduct}</p>
                                                           {res.matchedSupplierProductAr && (
                                                               <p className="text-gray-400 mt-1">{res.matchedSupplierProductAr}</p>
                                                           )}
                                                       </div>
                                                   </div>
                                                   
                                                   {res.normalizedProductName && res.normalizedSupplierName && (
                                                       <div className="pt-2 border-t border-slate-700">
                                                           <p className="text-gray-500 mb-2">{t('supplierProducts.normalizedComparison')}:</p>
                                                           <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                               <div className="p-2 bg-slate-800/50 rounded font-mono text-[10px] text-gray-300">
                                                                   {res.normalizedProductName || '-'}
                                                               </div>
                                                               <div className="p-2 bg-slate-800/50 rounded font-mono text-[10px] text-gray-300">
                                                                   {res.normalizedSupplierName || '-'}
                                                               </div>
                                                           </div>
                                                       </div>
                                                   )}
                                                   
                                                   <div className="pt-2 border-t border-slate-700">
                                                       <p className="text-gray-500 mb-1">{t('supplierProducts.willAssignCode')}:</p>
                                                       <p className="text-purple-400 font-mono font-bold">{res.productCode}</p>
                                                   </div>
                                               </div>
                                           )}
                                       </div>
                                           
                                   );
                               })
                       ) : (
                           <div className="text-center py-12 text-gray-500">
                               <p className="text-lg font-medium text-gray-400">{t('supplierProducts.noNewMatches')}</p>
                               <p className="text-sm mt-1">{t('supplierProducts.noNewMatchesDesc')}</p>
                           </div>
                       )}
                   </div>
                   
                   <div className="p-4 border-t border-slate-800 bg-slate-900 rounded-b-xl flex gap-3">
                       {autoFillResult.length > 0 && autoFillResult.some(res => !acceptedProductIds.has(res.productId)) && (
                           <>
                                <button
                                    onClick={handleAcceptAll}
                                    disabled={accepting}
                                    className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 rounded-lg text-white font-medium transition-all shadow-lg shadow-purple-900/20"
                                >
                                    {accepting ? t('supplierProducts.accepting') : t('supplierProducts.acceptAll')}
                                </button>
                                <button
                                    onClick={handleRejectAll}
                                    disabled={accepting}
                                    className="px-4 py-2.5 bg-slate-800 hover:bg-red-900/30 hover:text-red-400 border border-slate-700 rounded-lg text-gray-300 font-medium transition-colors"
                                >
                                    {t('supplierProducts.reject')}
                                </button>
                           </>
                       )}
                       <button 
                           onClick={() => setShowAutoFillPopup(false)} 
                           className="px-6 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                       >
                           {t('supplierProducts.close')}
                       </button>
                   </div>
               </div>
           </div>
       )}

       {/* Clear Product Codes Confirmation Popup */}
       {showClearConfirm && (
           <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
               <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                   <div className="flex items-center gap-3 mb-4 text-red-500">
                       <div className="p-2 bg-red-500/10 rounded-full">
                            <Trash2 className="w-6 h-6" />
                       </div>
                       <h3 className="text-xl font-bold text-white">{t('supplierProducts.clearAll')}</h3>
                   </div>
                   <div className="text-gray-300 space-y-3 mb-6">
                       <p className="text-red-400 font-medium bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                           {t('supplierProducts.warning')}
                       </p>
                       <p className="text-sm leading-relaxed">
                           {t('supplierProducts.clearWarning')}
                       </p>
                   </div>
                   <div className="flex gap-3">
                       <button 
                           onClick={() => setShowClearConfirm(false)} 
                           disabled={clearing}
                           className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg text-white transition-colors"
                       >
                           {t('supplierProducts.cancel')}
                       </button>
                       <button 
                           onClick={handleClearProductCodes}
                           disabled={clearing}
                           className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg text-white font-medium transition-colors shadow-lg shadow-red-900/20"
                       >
                           {clearing ? t('supplierProducts.clearing') : t('supplierProducts.confirmClear')}
                       </button>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
}
