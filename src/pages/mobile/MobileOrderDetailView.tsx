import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Package, CheckCircle, Copy, Download, Loader2, Check, FileText, FileSpreadsheet, Mail, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { coreApi } from '@/lib/api';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import { formatCurrency } from '@/lib/currency-utils';
import { CORE_BASE_URL } from '@/services/core/api-client';
import { Order } from '@/services/types';

interface MobileOrderDetailViewProps {
  order: Order | null | any;
  isLoading: boolean;
  isDownloading: boolean;
  isRetrying?: boolean;
  onDownloadFiles?: () => void;
  onRetryDelivery?: () => void;
}

export default function MobileOrderDetailView({ 
  order: propOrder, 
  isLoading: propIsLoading, 
  isDownloading,
  isRetrying,
  onDownloadFiles, 
  onRetryDelivery 
}: Partial<MobileOrderDetailViewProps>) {
  const { t } = useTranslation();
  const { settings } = useStoreSettings();
  const navigate = useNavigate();
  const params = useParams();
  const [fetchedOrder, setFetchedOrder] = useState<Order | null>(null);
  const [fetching, setFetching] = useState(false);
  
  const [activeConfig, setActiveConfig] = useState<any>(null);
  const { toast } = useToast();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    coreApi.get('/app-builder/config').then(res => setActiveConfig(res.config || res)).catch(() => {});
  }, []);

  useEffect(() => {
      // If no order prop, fetch from ID
      if (!propOrder && params.id) {
          setFetching(true);
          coreApi.get(`/orders/${params.id}`)
             .then(res => setFetchedOrder(res))
             .catch(err => {
                 console.error(err);
                 toast({ title: "Error", description: "Failed to load order" });
             })
             .finally(() => setFetching(false));
      }
  }, [propOrder, params.id]);

  const handleDownload = (url: string) => {
    if (!url) return;
    
    // Construct full URL if relative
    let fullUrl = url;
    if (!url.startsWith('http')) {
        const baseUrl = CORE_BASE_URL.replace(/\/api\/?$/, '');
        fullUrl = `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    }
    
    console.log('Downloading file from:', fullUrl);
    window.open(fullUrl, '_blank');
  };

  const order = propOrder || fetchedOrder;
  const isLoading = propOrder ? propIsLoading : fetching;

  const primaryColor = activeConfig?.primaryColor || '#000000';

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary" /></div>;
  if (!order) return <div className="p-8 text-center pt-20 bg-background text-foreground">Order not found. <Button onClick={() => navigate('/account/orders')} className="block mx-auto mt-4">Back</Button></div>;

  const isCardOrder = order.items?.some((item: any) => item.product?.productType === 'DIGITAL_CARD' || item.deliveries?.length > 0) || !!order.deliveryFiles;

  return (
    <div className="pb-24 bg-background min-h-screen">
       <div className="bg-card p-4 shadow-sm sticky top-0 z-10 flex items-center gap-4 border-b border-border">
          <button onClick={() => navigate('/account/orders')} className="p-1 text-foreground hover:bg-muted rounded-full">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold truncate text-foreground">Order #{order.orderNumber || order.id?.slice(0, 8)}</h1>
       </div>

       <div className="p-4 space-y-4">
          <div className="bg-card p-4 rounded-xl shadow-sm border border-border">
             <div className="flex justify-between items-center mb-2">
                <span className="text-muted-foreground text-sm">Status</span>
                <Badge variant={order.status === 'COMPLETED' ? 'default' : 'secondary'}>{order.status}</Badge>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Date</span>
                <span className="font-medium text-sm text-foreground">{new Date(order.createdAt).toLocaleString()}</span>
             </div>
             {order.totalAmount && (
                 <div className="mt-2 pt-2 border-t border-border flex justify-between items-center">
                    <span className="font-bold text-foreground">Total</span>
                    <span className="font-bold text-lg" style={{ color: primaryColor }}>{formatCurrency(order.totalAmount, settings?.currency || 'SAR')}</span>
                 </div>
             )}
          </div>

          <div className="space-y-4">
            <h3 className="font-bold px-1 text-foreground">Items</h3>
            {(order.items || order.orderItems || []).map((item: any, idx: number) => {
               const productName = item.productName || item.product?.name || '';
               const productNameAr = item.product?.nameAr || '';
               
               let serialNumbers = order.deliveryFiles?.serialNumbersByProduct?.[productName] || 
                                   order.deliveryFiles?.serialNumbersByProduct?.[productNameAr] ||
                                   [];
               
               if ((!serialNumbers || serialNumbers.length === 0) && item.deliveries) {
                 serialNumbers = item.deliveries.map((d: any) => ({ serialNumber: d.cardCode, pin: d.cardPin }));
               }

               // Fallback matching
               if ((!serialNumbers || serialNumbers.length === 0) && order.deliveryFiles?.serialNumbersByProduct) {
                    const allProductNames = Object.keys(order.deliveryFiles.serialNumbersByProduct);
                    const matchedKey = allProductNames.find(key => {
                      const keyLower = key.toLowerCase().trim();
                      const nameLower = productName.toLowerCase().trim();
                      return keyLower.includes(nameLower) || nameLower.includes(keyLower);
                    });
                    if (matchedKey) serialNumbers = order.deliveryFiles.serialNumbersByProduct[matchedKey];
               }

               return (
                <div key={idx} className="bg-card p-4 rounded-xl shadow-sm border border-border">
                    <div className="flex gap-3 mb-3">
                        {item.product?.images?.[0] ? 
                           <img src={item.product.images[0]} className="w-16 h-16 rounded-lg object-cover bg-muted" alt={productName} /> :
                           <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center"><Package className="text-muted-foreground" /></div>
                        }
                        <div className="flex-1">
                            <p className="font-medium text-sm line-clamp-2 text-foreground">{productName}</p>
                            <div className="flex justify-between mt-1">
                                <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
                                <span className="font-medium text-sm text-foreground">{formatCurrency(item.price, settings?.currency || 'SAR')}</span>
                            </div>
                        </div>
                    </div>

                    {serialNumbers && serialNumbers.length > 0 && (
                        <div className="mt-3 bg-muted/30 rounded-lg p-3 border border-border space-y-2">
                            <p className="text-xs font-bold text-green-600 dark:text-green-400 flex items-center gap-1 mb-2">
                                <CheckCircle size={12} /> Digital Codes
                            </p>
                            {serialNumbers.map((sn: any, sIdx: number) => (
                                <div key={sIdx} className="bg-card p-2 rounded border border-border text-xs font-mono">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-muted-foreground">CODE:</span>
                                        <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(sn.serialNumber); setCopiedIndex(sIdx); setTimeout(() => setCopiedIndex(null), 2000); }}>
                                            {copiedIndex === sIdx ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-muted-foreground" />}
                                        </button>
                                    </div>
                                    <div className="font-bold text-foreground break-all mb-1">{sn.serialNumber}</div>
                                    {sn.pin && (
                                        <>
                                            <div className="border-t border-border my-1"></div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-muted-foreground">PIN:</span>
                                                <span className="font-medium text-foreground">{sn.pin}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
               );
            })}
          </div>

          <div className="space-y-3 pt-2">
            {order.deliveryFiles?.textFileUrl && (
                <Button 
                    onClick={() => handleDownload(order.deliveryFiles.textFileUrl)} 
                    variant="outline"
                    className="w-full h-12 rounded-xl justify-start shadow-sm border-2 bg-white text-foreground hover:bg-gray-50"
                    style={{ borderColor: primaryColor }}
                >
                    <FileText className="mr-3 w-5 h-5" style={{ color: primaryColor }} />
                    <span className="flex-1 text-left">{t('order.downloadTextFile', 'Download Text File')}</span>
                    <Download className="w-4 h-4 opacity-50" />
                </Button>
            )}

            {order.deliveryFiles?.excelFileUrl && (
                <Button 
                    onClick={() => handleDownload(order.deliveryFiles.excelFileUrl)} 
                    variant="outline"
                    className="w-full h-12 rounded-xl justify-start shadow-sm border-2 bg-white text-foreground hover:bg-gray-50"
                    style={{ borderColor: primaryColor }}
                >
                    <FileSpreadsheet className="mr-3 w-5 h-5" style={{ color: primaryColor }} />
                    <span className="flex-1 text-left">{t('order.downloadExcelFile', 'Download Excel File')}</span>
                    <Download className="w-4 h-4 opacity-50" />
                </Button>
            )}
            
            {/* Delivery Confirmations */}
            {order.deliveryFiles?.deliveryOptions?.includes('email') && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
                    <Mail className="w-5 h-5" />
                    <div className="flex flex-col">
                        <span className="text-sm font-bold">{t('order.sentToEmail', 'Sent to Email')}</span>
                        <span className="text-xs opacity-80">{order.customerEmail}</span>
                    </div>
                </div>
            )}
            
            {order.deliveryFiles?.deliveryOptions?.includes('whatsapp') && (
                <div className="flex items-center gap-3 p-3 bg-green-50 text-green-700 rounded-xl border border-green-100">
                    <MessageCircle className="w-5 h-5" />
                    <div className="flex flex-col">
                        <span className="text-sm font-bold">{t('order.sentToWhatsApp', 'Sent to WhatsApp')}</span>
                        <span className="text-xs opacity-80">{order.customerPhone}</span>
                    </div>
                </div>
            )}
          </div>

          {(onDownloadFiles && isCardOrder && (order.status === 'PAID' || order.status === 'COMPLETED')) && (
             <Button onClick={onDownloadFiles} className="w-full h-12 rounded-xl shadow-lg text-white mt-2" style={{ backgroundColor: primaryColor }} disabled={isDownloading}>
                {isDownloading ? <Loader2 className="animate-spin mr-2" /> : <Download className="mr-2" />}
                {t('order.downloadAllCodes', 'Download All Codes')}
             </Button>
          )}

          {isRetrying && <div className="text-center text-sm text-muted-foreground mt-4"><Loader2 className="inline animate-spin mr-1"/> Retrying delivery...</div>}
       </div>
    </div>
  );
}
