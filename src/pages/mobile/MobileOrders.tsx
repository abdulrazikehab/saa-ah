import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/services/core/api-client';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { coreApi } from '@/lib/api';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import { formatCurrency } from '@/lib/currency-utils';

export default function MobileOrders() {
  const { t, i18n } = useTranslation();
  const { settings } = useStoreSettings();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeConfig, setActiveConfig] = useState<any>(null);

  // Retrieve context configuration from MobileLayout
  const { appConfig: contextAppConfig } = useOutletContext<{ appConfig: any }>() || {};
  
  // Prioritize context config (live preview) over local state
  const config = contextAppConfig || activeConfig || {};

  // Helper to get dynamic page title
  const getPageTitle = (pageId: string) => {
    const page = config.pages?.find((p: any) => p.id === pageId);
    if (!page) return null;
    return i18n.language === 'ar' ? (page.titleAr || page.title) : page.title;
  };

  useEffect(() => {
    coreApi.get('/app-builder/config').then(res => setActiveConfig(res.config || res)).catch(() => {});
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      const customerToken = localStorage.getItem('customerToken');
      const customerEmail = localStorage.getItem('lastOrderEmail') || sessionStorage.getItem('guestOrderEmail');
      
      if (!customerToken && !customerEmail) {
        navigate('/login');
        return;
      }

      let regularOrdersResponse: any = { data: [] };
      
      if (customerToken) {
        regularOrdersResponse = await apiClient.fetch(`${apiClient.coreUrl}/orders`, {
          headers: { 'Authorization': `Bearer ${customerToken}` },
        }).catch(() => ({ data: [] }));
      } else if (customerEmail) {
        regularOrdersResponse = await apiClient.fetch(
          `${apiClient.coreUrl}/guest-checkout/orders-by-email?email=${encodeURIComponent(customerEmail)}`,
          { requireAuth: false }
        ).catch(() => []);
      }

      const cardOrdersResponse = customerToken
        ? await apiClient.fetch(`${apiClient.coreUrl}/card-orders/my-orders`, {
          headers: { 'Authorization': `Bearer ${customerToken}` },
          }).catch(() => ({ data: [] }))
        : { data: [] };
      
      const regularOrders = Array.isArray(regularOrdersResponse) ? regularOrdersResponse : (regularOrdersResponse?.data || []);
      const cardOrders = Array.isArray(cardOrdersResponse) ? cardOrdersResponse : (cardOrdersResponse?.data || []);
      
      const allOrders = [
        ...regularOrders,
        ...cardOrders.map((o: any) => ({ ...o, isCardOrder: true })),
      ].sort((a: any, b: any) => new Date(b.createdAt || b.created_at || 0).getTime() - new Date(a.createdAt || a.created_at || 0).getTime());

      setOrders(allOrders);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
      case 'DELIVERED': return 'bg-green-100 text-green-700 border-green-200 hover:bg-green-100';
      case 'PENDING':
      case 'PROCESSING': return 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100';
      case 'CANCELLED':
      case 'REFUNDED': return 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100';
      case 'SHIPPED': return 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100';
      default: return 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100';
    }
  };

  const primaryColor = config.primaryColor || '#000000';

  if (isLoading) return <div className="p-8 text-center pt-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" style={{ borderColor: primaryColor, borderTopColor: 'transparent', borderLeftColor: 'transparent', borderRightColor: 'transparent' }}></div></div>;

  return (
    <div className="pb-24 bg-background min-h-screen">
      <div className="bg-card p-4 shadow-sm sticky top-0 z-10 flex items-center gap-3 border-b border-border">
          <button onClick={() => navigate(-1)} className="p-1 rounded-full hover:bg-muted text-foreground">
             <ArrowIcon className="w-5 h-5 rtl:rotate-180" />
          </button>
          <h1 className="text-lg font-bold text-foreground">
             {getPageTitle('orders') || t('sections.customerOrders.title', 'My Orders')}
          </h1>
      </div>

      <div className="p-4 space-y-4">
        {orders.length === 0 ? (
             <div className="text-center py-20 text-muted-foreground">
               <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
               <p className="mb-4">{t('sections.customerOrders.noOrders', 'No orders found')}</p>
               <Button onClick={() => navigate('/products')} style={{ backgroundColor: primaryColor }} className="text-white">
                 {t('sections.customerOrders.continueShopping', 'Start Shopping')}
               </Button>
             </div>
        ) : (
           orders.map(order => (
             <div key={order.id} className="bg-card p-5 rounded-2xl shadow-sm border border-border active:scale-[0.98] transition-all" onClick={() => navigate(`/orders/${order.id}`)}>
                <div className="flex justify-between items-start mb-6">
                    <Badge className={`px-3 py-1 rounded-full shadow-none font-bold ${getStatusColor(order.status)}`}>
                        {order.status}
                    </Badge>
                    <div className="text-right">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mb-0.5">ORDER #{order.orderNumber || order.id.slice(0, 6).toUpperCase()}</span>
                        <span className="text-xs text-muted-foreground font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
                
                <div className="flex justify-between items-end">
                    <div>
                        <span className="text-xl font-bold block" style={{ color: primaryColor }}>
                            {formatCurrency(order.totalAmount || order.total || 0, settings?.currency || 'SAR')}
                        </span>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1 max-w-[60%]">
                         {order.orderItems && order.orderItems.length > 0 && (
                             <span className="text-sm text-foreground font-medium truncate w-full text-right">
                                 {order.orderItems[0].product?.name || order.orderItems[0].productName}
                             </span>
                         )}
                         {order.orderItems && order.orderItems.length > 1 && (
                             <span className="text-xs text-muted-foreground">
                                 + {order.orderItems.length - 1} more items
                             </span>
                         )}
                    </div>
                </div>
             </div>
           ))
        )}
      </div>
    </div>
  );
}

function ArrowIcon(props: any) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="m15 18-6-6 6-6"/>
        </svg>
    )
}
