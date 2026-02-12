import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { coreApi } from '@/lib/api';
import { apiClient } from '@/services/core/api-client';
import { orderService } from '@/services/order.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, MapPin, CreditCard, Download, FileText, CheckCircle, Wallet, ExternalLink, RefreshCw, AlertCircle, Copy, Check } from 'lucide-react';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import { useToast } from '@/hooks/use-toast';
import { writeFile, utils } from 'xlsx';

import MobileOrderDetailView from '@/pages/mobile/MobileOrderDetailView';
import { Capacitor } from '@capacitor/core';
import { formatCurrency } from '@/lib/currency-utils';

import { Order, OrderItem } from '@/services/types';

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { settings } = useStoreSettings();
  const [isCardOrder, setIsCardOrder] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const loadOrder = useCallback(async (orderId: string, isBackground: boolean = false) => {
    try {
      if (!isBackground) setIsLoading(true);
      // Try regular order first
      try {
        const data = await coreApi.getOrder(orderId);
        setOrder(data as any);
        
        // Debug: Log deliveryFiles to see what we're getting
        if (process.env.NODE_ENV === 'development') {
          console.log('[OrderDetail] Order data:', {
            hasDeliveryFiles: !!data.deliveryFiles,
            deliveryFiles: data.deliveryFiles,
            itemsCount: data.items?.length || data.orderItems?.length,
            status: data.status
          });
        }
        
        // If store type is DIGITAL_CARDS, or order has items with deliveries, it's a card order
        const items = (data.orderItems || data.items || []) as any[];
        const hasDeliveries = items.some((item) => item.deliveries && item.deliveries.length > 0);
        const hasFiles = !!data.deliveryFiles && (!!data.deliveryFiles.excelFileUrl || !!data.deliveryFiles.textFileUrl || !!data.deliveryFiles.serialNumbersByProduct);
        const hasError = !!(data.deliveryFiles?.error || data.deliveryFiles?.errorAr);
        
        // Also check if any products are digital types (to support detecting card orders BEFORE delivery)
        const hasDigitalProducts = items.some(item => 
            item.product?.productType === 'DIGITAL_CARD' || 
            item.product?.type === 'DIGITAL_CARD' || 
            item.product?.isCardProduct === true ||
            !!item.product?.productCode // Heuristic: has product code implies digital/supplier
        );
        
        // Consider it a card order if: store type is DIGITAL_CARDS, has deliveries, has files, has error, OR includes digital products
        setIsCardOrder(settings?.storeType === 'DIGITAL_CARDS' || !!hasDeliveries || hasFiles || hasError || hasDigitalProducts);
      } catch (e) {
        // If regular order fails, try card order
        try {
          const cardData = await coreApi.getCardOrder(orderId);
          setOrder(cardData);
          setIsCardOrder(true);
        } catch (cardError) {
          console.error('Failed to load card order:', cardError);
          throw e; // Throw original error if both fail
        }
      }
    } catch (error) {
      console.error('Failed to load order:', error);
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  }, [settings?.storeType]);

  // Polling for serial numbers if they are missing but expected
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    let pollCount = 0;
    const maxPolls = 20; // Increase max polls to 20 (60 seconds total)

    if (id && order && isCardOrder && (order.status === 'PAID' || order.status === 'COMPLETED' || order.status === 'APPROVED' || order.status === 'DELIVERED' || order.status === 'PROCESSING')) {
      const hasSerials = (order.deliveryFiles?.serialNumbersByProduct && 
                         Object.keys(order.deliveryFiles.serialNumbersByProduct).length > 0) ||
                        (order.items?.some((item: any) => item.deliveries && item.deliveries.length > 0));
      
      const hasError = !!(order.deliveryFiles?.error || order.deliveryFiles?.errorAr);

      // We should continue polling if we don't have serials AND don't have a definitive error
      // OR if status is PROCESSING (explicitly waiting)
      if ((!hasSerials && !hasError) || (order.status as string) === 'PROCESSING') {
        console.log('[OrderDetail] Serial numbers expected but not found, starting polling...');
        pollInterval = setInterval(() => {
          pollCount++;
          if (pollCount >= maxPolls) {
            console.log('[OrderDetail] Max polling attempts reached.');
            clearInterval(pollInterval);
            return;
          }
          console.log(`[OrderDetail] Polling for serial numbers (attempt ${pollCount})...`);
          loadOrder(id, true);
        }, 3000);
      }
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [id, order?.id, order?.status, isCardOrder, order?.deliveryFiles, loadOrder]);

  useEffect(() => {
    if (id) {
      loadOrder(id);
    }
  }, [id, loadOrder]);

  // Helper function to extract serial numbers from deliveryFiles
  const extractSerialNumbers = (): Array<{ productName?: string; serialNumber: string; pin?: string }> => {
    const serialNumbersByProduct = order?.deliveryFiles?.serialNumbersByProduct || {};
    const allSerialNumbers: Array<{ productName?: string; serialNumber: string; pin?: string }> = [];
    
    // Flatten all serial numbers from all products
    Object.entries(serialNumbersByProduct).forEach(([productName, productSerials]: [string, any]) => {
      if (Array.isArray(productSerials)) {
        productSerials.forEach((sn: any) => {
          const serial = sn.serialNumber || sn.cardCode || '';
          const pin = sn.pin || sn.cardPin || '';
          if (serial) {
            allSerialNumbers.push({ productName, serialNumber: serial, pin: pin });
          }
        });
      }
    });
    
    // If no serialNumbersByProduct, use serialNumbers array
    if (allSerialNumbers.length === 0 && order?.deliveryFiles?.serialNumbers) {
      order.deliveryFiles.serialNumbers.forEach((sn: string) => {
        if (sn) {
          allSerialNumbers.push({ serialNumber: sn, pin: '' });
        }
      });
    }
    
    return allSerialNumbers;
  };

  const handleDownloadFile = async (fileType: 'excel' | 'text') => {
    if (!id || isDownloading || !order) return;
    setIsDownloading(true);
    try {
      // Check if we have serial numbers available
      const hasSerialNumbers = (order.deliveryFiles?.serialNumbersByProduct && 
        Object.keys(order.deliveryFiles.serialNumbersByProduct).length > 0) ||
        (order.deliveryFiles?.serialNumbers && order.deliveryFiles.serialNumbers.length > 0);
      
      // Generate Excel file client-side if we have serial numbers
      if (fileType === 'excel' && hasSerialNumbers) {
        const allSerialNumbers = extractSerialNumbers();
        
        if (allSerialNumbers.length === 0) {
          throw new Error('No serial numbers available');
        }
        
        // Create Excel workbook
        const workbook = utils.book_new();
        const worksheetData = [
          ['Product Name', 'Serial Number', 'PIN'],
          ...allSerialNumbers.map(card => [
            card.productName || '',
            card.serialNumber || '',
            card.pin || '',
          ]),
        ];
        const worksheet = utils.aoa_to_sheet(worksheetData);
        utils.book_append_sheet(workbook, worksheet, 'Serial Numbers');
        
        // Download Excel file
        writeFile(workbook, `order-${order?.orderNumber || id}-serial-numbers.xlsx`);
        setIsDownloading(false);
        return;
      }
      
      // Generate text file client-side if we have serial numbers
      if (fileType === 'text' && hasSerialNumbers) {
        const allSerialNumbers = extractSerialNumbers();
        
        // Generate lines with SERIAL and PIN in columns (tab-separated)
        const lines = allSerialNumbers.map(card => {
          const serial = card.serialNumber || '';
          const pin = card.pin || '';
          return `${serial}\t${pin}`;
        });
        
        const content = lines.join('\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `order-${order?.orderNumber || id}-serial-numbers.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        setIsDownloading(false);
        return;
      }
      
      // Try to download from server
      const token = localStorage.getItem('customerToken') || localStorage.getItem('accessToken');
      // Use apiClient.coreUrl (already includes /api)
      const apiUrl = apiClient.coreUrl || 'http://localhost:3002/api';
      const url = `${apiUrl}/orders/${id}/download/${fileType}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'X-Tenant-Domain': window.location.hostname,
        },
      });

      if (!response.ok) {
        // If server download fails but we have serial numbers, generate client-side
        const hasSerialNumbers = (order.deliveryFiles?.serialNumbersByProduct && 
          Object.keys(order.deliveryFiles.serialNumbersByProduct).length > 0) ||
          (order.deliveryFiles?.serialNumbers && order.deliveryFiles.serialNumbers.length > 0);
        
        if (hasSerialNumbers) {
          if (fileType === 'excel') {
            // Generate Excel file client-side
            const allSerialNumbers = extractSerialNumbers();
            
            if (allSerialNumbers.length > 0) {
              const workbook = utils.book_new();
              const worksheetData = [
                ['Product Name', 'Serial Number', 'PIN'],
                ...allSerialNumbers.map(card => [
                  card.productName || '',
                  card.serialNumber || '',
                  card.pin || '',
                ]),
              ];
              const worksheet = utils.aoa_to_sheet(worksheetData);
              utils.book_append_sheet(workbook, worksheet, 'Serial Numbers');
              
              writeFile(workbook, `order-${order?.orderNumber || id}-serial-numbers.xlsx`);
              setIsDownloading(false);
              return;
            }
          } else if (fileType === 'text') {
            // Generate text file with SERIAL and PIN in columns
            const allSerialNumbers = extractSerialNumbers();
            
            // Generate lines with SERIAL and PIN in columns (tab-separated)
            const lines = allSerialNumbers.map(card => {
              const serial = card.serialNumber || '';
              const pin = card.pin || '';
              return `${serial}\t${pin}`;
            });
            
            const content = lines.join('\n');
            const blob = new Blob([content], { type: 'text/plain' });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `order-${order?.orderNumber || id}-serial-numbers.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
            setIsDownloading(false);
            return;
          }
        }
        
        // If we can't generate client-side, throw error
        const errorText = await response.text().catch(() => '');
        throw new Error(`Failed to download file: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `order-${order?.orderNumber || id}-${fileType === 'excel' ? 'serial-numbers.xlsx' : 'serial-numbers.txt'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Failed to download file:', error);
      alert('فشل تحميل الملف. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadFiles = async () => {
    if (!id || isDownloading || !order) return;
    setIsDownloading(true);
    try {
      const token = localStorage.getItem('customerToken');
      // Use apiClient.coreUrl (already includes /api)
      const apiUrl = apiClient.coreUrl || 'http://localhost:3002/api';
      
      // Download Excel file if available
      if (order.deliveryFiles?.excelFileUrl) {
        try {
          const excelUrl = `${apiUrl}/orders/${id}/download/excel`;
          const excelResponse = await fetch(excelUrl, {
            headers: {
              'Authorization': token ? `Bearer ${token}` : '',
            },
          });

          if (excelResponse.ok) {
            const blob = await excelResponse.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `order-${order?.orderNumber || id}-serial-numbers.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
          }
        } catch (error) {
          console.error('Failed to download Excel file:', error);
        }
      }

      // Wait a bit before downloading the second file to avoid browser blocking
      await new Promise(resolve => setTimeout(resolve, 500));

      // Download text file if available
      if (order.deliveryFiles?.textFileUrl) {
        try {
          const textUrl = `${apiUrl}/orders/${id}/download/text`;
          const textResponse = await fetch(textUrl, {
            headers: {
              'Authorization': token ? `Bearer ${token}` : '',
            },
          });

          if (textResponse.ok) {
            const blob = await textResponse.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `order-${order?.orderNumber || id}-serial-numbers.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
          }
        } catch (error) {
          console.error('Failed to download text file:', error);
        }
      }

      // If no files are available, check if serial numbers are available for direct viewing
      if (!order.deliveryFiles?.excelFileUrl && !order.deliveryFiles?.textFileUrl) {
        const hasSerialNumbers = order.deliveryFiles?.serialNumbersByProduct && 
          Object.keys(order.deliveryFiles.serialNumbersByProduct).length > 0;
        
        if (hasSerialNumbers) {
          // Serial numbers are available for direct viewing, scroll to them
          const serialNumbersSection = document.getElementById('serial-numbers-section');
          if (serialNumbersSection) {
            serialNumbersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        } else {
          // Show error message from deliveryFiles if available
          const errorMessage = order.deliveryFiles?.errorAr || order.deliveryFiles?.error || 
            'لا توجد ملفات متاحة للتحميل. يرجى التحقق من أن المنتجات تحتوي على productCode وأن SUPPLIER_HUB_API_KEY مضبوط في الخادم.';
          alert(errorMessage);
        }
      }
    } catch (error) {
      console.error('Failed to download files:', error);
      alert('فشل تحميل الملفات. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRetryDelivery = async () => {
    if (!id || isRetrying) return;
    
    // Prevent rapid clicks
    const lastRetryTime = (handleRetryDelivery as any).lastRetryTime || 0;
    const now = Date.now();
    if (now - lastRetryTime < 2000) {
      toast({
        title: 'يرجى الانتظار',
        description: 'يرجى الانتظار قليلاً قبل إعادة المحاولة.',
        variant: 'default',
      });
      return;
    }
    (handleRetryDelivery as any).lastRetryTime = now;
    
    try {
      setIsRetrying(true);
      const updatedOrder = await orderService.retryDelivery(id);
      setOrder(updatedOrder as any);
      
      toast({
        title: 'نجاح',
        description: 'تم إعادة محاولة جلب الأرقام التسلسلية. جاري تحديث البيانات...',
      });
      
      // Reload order after a short delay
      setTimeout(() => {
        loadOrder(id);
      }, 2000);
    } catch (error: any) {
      console.error('Failed to retry delivery:', error);
      
      // Handle rate limit error specifically
      if (error?.status === 429) {
        toast({
          title: 'كثرة الطلبات',
          description: 'تم إرسال طلبات كثيرة. يرجى الانتظار دقيقة واحدة ثم المحاولة مرة أخرى.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'خطأ',
          description: error?.message || 'فشلت إعادة المحاولة. يرجى المحاولة مرة أخرى.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsRetrying(false);
    }
  };

  const isNative = Capacitor.isNativePlatform() || window.location.href.includes('platform=mobile') || sessionStorage.getItem('isMobilePlatform') === 'true';

  if (isNative) {
      return <MobileOrderDetailView 
                order={order} 
                isLoading={isLoading} 
                isDownloading={isDownloading} 
                isRetrying={isRetrying}
                onDownloadFiles={handleDownloadFiles}
                onRetryDelivery={handleRetryDelivery}
             />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Order not found</h1>
        <Button asChild>
          <Link to="/profile">Back to Orders</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-10 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4 pl-0">
          <Link to="/profile">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
          </Link>
        </Button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Order #{order.orderNumber || order.id.slice(0, 8)}</h1>
            <p className="text-muted-foreground">
              Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
            </p>
          </div>
          <Badge className="text-lg px-4 py-1" variant={
            order.status === 'COMPLETED' || order.status === 'PAID' || order.status === 'APPROVED' || order.status === 'DELIVERED' ? 'default' :
            order.status === 'PENDING' || order.status === 'PROCESSING' ? 'secondary' :
            order.status === 'CANCELLED' || order.status === 'REJECTED' ? 'destructive' : 'outline'
          }>
            {order.status === 'PAID' ? 'تم الدفع' : 
             order.status === 'COMPLETED' ? 'مكتمل' :
             order.status === 'APPROVED' ? 'مدفوع وقيد المعالجة' :
             order.status === 'DELIVERED' ? 'مكتمل وتم التسليم ✓' :
             order.status === 'PROCESSING' ? 'جاري استخراج الأكواد...' :
             order.status === 'PENDING' ? 'بانتظار الدفع' :
             order.status === 'REJECTED' ? 'مرفوض' :
             order.status === 'CANCELLED' ? 'ملغي' : order.status}
          </Badge>
        </div>
        
        {isCardOrder && (order.status === 'PAID' || order.status === 'COMPLETED' || order.deliveryFiles) && (
          <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary text-white rounded-lg">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold">تحميل بيانات البطاقات</h3>
                <p className="text-sm text-muted-foreground">يمكنك تحميل الأكواد بصيغة Excel (متوافق مع سلة) أو نصية</p>
              </div>
            </div>
            <Button 
              onClick={handleDownloadFiles} 
              disabled={isDownloading}
              className="w-full md:w-auto gap-2"
            >
              {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              تحميل الملفات
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4" id="serial-numbers-section">
                {(order.items || order.orderItems || []).map((item: OrderItem) => {
                  // Get serial numbers from deliveryFiles or item.deliveries
                  // Backend uses item.productName as the key in serialNumbersByProduct
                  const productName = item.productName || item.product?.name || '';
                  const productNameAr = item.product?.nameAr || '';
                  
                  // Try to find serial numbers by product name (exact match first, then try AR name)
                  let serialNumbers = order.deliveryFiles?.serialNumbersByProduct?.[productName] || 
                                     order.deliveryFiles?.serialNumbersByProduct?.[productNameAr] ||
                                     [];
                  
                  // If not found in serialNumbersByProduct, try item.deliveries
                  if (serialNumbers.length === 0 && item.deliveries) {
                    serialNumbers = item.deliveries.map(d => ({ serialNumber: d.cardCode, pin: d.cardPin }));
                  }
                  
                  // If still not found, try to find by matching any key in serialNumbersByProduct
                  if (serialNumbers.length === 0 && order.deliveryFiles?.serialNumbersByProduct) {
                    const allProductNames = Object.keys(order.deliveryFiles.serialNumbersByProduct);
                    // Try partial match (case-insensitive)
                    const matchedKey = allProductNames.find(key => {
                      const keyLower = key.toLowerCase().trim();
                      const nameLower = productName.toLowerCase().trim();
                      const nameArLower = productNameAr.toLowerCase().trim();
                      return keyLower === nameLower || keyLower === nameArLower ||
                             keyLower.includes(nameLower) || nameLower.includes(keyLower) ||
                             keyLower.includes(nameArLower) || nameArLower.includes(keyLower);
                    });
                    if (matchedKey) {
                      serialNumbers = order.deliveryFiles.serialNumbersByProduct[matchedKey];
                      console.log(`[OrderDetail] Matched serial numbers for product "${productName}" using key "${matchedKey}"`);
                    }
                  }
                  
                  const deliveryOptions = order.deliveryFiles?.deliveryOptions || [];
                  
                  // Debug logging
                  if (process.env.NODE_ENV === 'development') {
                    console.log(`[OrderDetail] Product: ${productName}, Serial numbers found: ${serialNumbers.length}, deliveryFiles keys:`, 
                      Object.keys(order.deliveryFiles?.serialNumbersByProduct || {}));
                  }

                  const isDigitalProduct = order.items?.some(i => i.product?.name === productName && (i.deliveries?.length || 0) > 0) || 
                                          // Check if it's a card product by heuristic (if we are in a card order view)
                                          (isCardOrder && !serialNumbers.length && (order.status === 'PAID' || order.status === 'COMPLETED' || order.status === 'APPROVED' || order.status === 'DELIVERED'));

                  const showNoSerialsMessage = isCardOrder && 
                                             serialNumbers.length === 0 && 
                                             (order.status === 'PAID' || order.status === 'COMPLETED' || order.status === 'APPROVED' || order.status === 'DELIVERED');
                  
                  return (
                    <div key={item.id} className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          {item.product?.images?.[0] && (
                            <img 
                              src={item.product.images[0]} 
                              alt={item.product.name} 
                              className="h-16 w-16 object-cover rounded-md"
                            />
                          )}
                          <div>
                            <p className="font-medium">{item.product?.nameAr || item.product?.name || item.productName || 'Unknown Product'}</p>
                            <p className="text-sm text-muted-foreground">الكمية: {item.quantity}</p>
                          </div>
                        </div>
                        <p className="font-medium">{formatCurrency(item.price, settings?.currency || 'SAR')}</p>
                      </div>
                      
                      {/* Display Serial Numbers */}
                      {serialNumbers.length > 0 ? (
                        <div className="mt-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 space-y-2">
                          <p className="text-xs font-bold text-green-800 dark:text-green-200 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            الأكواد المستلمة ({serialNumbers.length}):
                          </p>
                          {serialNumbers.map((sn, idx: number) => (
                            <div key={idx} className="flex flex-col gap-2 text-sm font-mono bg-white dark:bg-gray-800 p-3 rounded border border-border/50">
                              {!!sn.serialNumber && sn.serialNumber.trim() !== '' && (
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs text-muted-foreground mb-1">SERIAL:</div>
                                    <span className="text-primary font-bold break-all">{sn.serialNumber}</span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 flex-shrink-0"
                                    onClick={() => {
                                      navigator.clipboard.writeText(sn.serialNumber);
                                      setCopiedIndex(idx);
                                      toast({
                                        title: 'تم النسخ',
                                        description: 'تم نسخ الرقم التسلسلي',
                                      });
                                      setTimeout(() => setCopiedIndex(null), 2000);
                                    }}
                                  >
                                    {copiedIndex === idx ? (
                                      <Check className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              )}

                              {sn.pin && (
                                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs text-muted-foreground mb-1">PIN:</div>
                                    <span className="text-muted-foreground break-all">{sn.pin}</span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 flex-shrink-0"
                                    onClick={() => {
                                      navigator.clipboard.writeText(sn.pin!);
                                      setCopiedIndex(idx + 10000); // Use offset to distinguish PIN copy
                                      toast({
                                        title: 'تم النسخ',
                                        description: 'تم نسخ PIN',
                                      });
                                      setTimeout(() => setCopiedIndex(null), 2000);
                                    }}
                                  >
                                    {copiedIndex === idx + 10000 ? (
                                      <Check className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                          {deliveryOptions.length > 0 && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                              طريقة التسليم: {deliveryOptions.join(', ')}
                            </p>
                          )}
                        </div>
                      ) : showNoSerialsMessage ? (
                         <div className="mt-2 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                            <p className="text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
                               <Loader2 className="h-4 w-4 animate-spin" />
                               جاري معالجة البطاقات أو لا تتوفر أكواد حالياً. يرجى الانتظار قليلاً أو التواصل مع الدعم.
                            </p>
                         </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <Separator className="my-4" />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المجموع الفرعي</span>
                  <span>{formatCurrency(order.subtotal || order.totalAmount || order.total || 0, settings?.currency || 'SAR')}</span>
                </div>
                {Number(order.shippingCost || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الشحن</span>
                    <span>{formatCurrency(order.shippingCost, settings?.currency || 'SAR')}</span>
                  </div>
                )}
                {Number(order.tax || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الضريبة</span>
                    <span>{formatCurrency(order.tax, settings?.currency || 'SAR')}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-bold text-lg">
                  <span>الإجمالي</span>
                  <span>{formatCurrency(order.totalAmount || order.total || 0, settings?.currency || 'SAR')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {order.shippingAddress && order.shippingAddress.street !== 'Digital Delivery' && (
            <Card>
              <CardHeader>
                <CardTitle>عنوان الشحن</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">عنوان الشحن</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {order.shippingAddress.fullName && (
                        <>
                          {order.shippingAddress.fullName}<br />
                        </>
                      )}
                      {order.shippingAddress.street}<br />
                      {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}<br />
                      {order.shippingAddress.country}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>معلومات الدفع</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">طريقة الدفع</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {order.paymentMethod === 'WALLET_BALANCE' ? 'الدفع من الرصيد' :
                     order.paymentMethod === 'HYPERPAY' ? 'بطاقة ائتمان (HyperPay)' :
                     order.paymentMethod === 'STRIPE' ? 'بطاقة ائتمان (Stripe)' :
                     order.paymentMethod === 'PAYPAL' ? 'PayPal' :
                     order.paymentMethod === 'CASH_ON_DELIVERY' ? 'الدفع عند الاستلام' :
                     order.paymentMethod || 'غير محدد'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {order.paymentStatus === 'SUCCEEDED' || order.paymentStatus === 'PAID' ? (
                      <span className="text-green-600 dark:text-green-400 font-bold">تم الدفع ✓</span>
                    ) : order.paymentStatus === 'PENDING' ? (
                      order.paymentMethod === 'CASH_ON_DELIVERY' ? (
                        <span className="text-orange-600 dark:text-orange-400">بانتظار الدفع عند الاستلام</span>
                      ) : order.paymentMethod === 'WALLET_BALANCE' ? (
                        <span className="text-green-600 dark:text-green-400 font-bold">تم الخصم من الرصيد ✓</span>
                      ) : (
                        <span className="text-orange-600 dark:text-orange-400">بانتظار إتمام الدفع</span>
                      )
                    ) : order.paymentStatus === 'FAILED' ? (
                      <span className="text-red-600 dark:text-red-400 font-bold">فشل الدفع</span>
                    ) : (
                      <span className="text-orange-600 dark:text-orange-400">قيد الانتظار</span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Digital Cards Delivery Files */}
          {isCardOrder && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  ملفات التسليم
                </CardTitle>
                <CardDescription>
                  {order.deliveryFiles?.error || order.deliveryFiles?.errorAr 
                    ? 'حدث خطأ أثناء جلب الأرقام التسلسلية'
                    : 'قم بتحميل ملفات Excel و TXT التي تحتوي على جميع الأكواد والأرقام التسلسلية للمنتجات'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Error Message or No Delivery Files Message */}
                {((order.deliveryFiles?.error || order.deliveryFiles?.errorAr) || 
                  (!order.deliveryFiles?.serialNumbersByProduct || Object.keys(order.deliveryFiles.serialNumbersByProduct || {}).length === 0)) && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-800 dark:text-red-200">
                          {order.deliveryFiles?.errorAr || order.deliveryFiles?.error || 
                           'لم يتم جلب الأرقام التسلسلية بعد. يرجى المحاولة مرة أخرى أو الاتصال بالدعم.'}
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          يرجى التحقق من: 1) المنتج يحتوي على productCode، 2) SUPPLIER_HUB_API_KEY مضبوط، 3) واجهة برمجة التطبيقات للمورد متاحة
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleRetryDelivery}
                      disabled={isRetrying}
                      className="mt-3 flex items-center gap-2"
                      variant="outline"
                      size="sm"
                    >
                      <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
                      {isRetrying ? 'جاري إعادة المحاولة...' : 'إعادة المحاولة'}
                    </Button>
                  </div>
                )}

                {/* Download Buttons */}
                {(order.deliveryFiles?.excelFileUrl || order.deliveryFiles?.textFileUrl || order.deliveryFiles?.serialNumbersByProduct) && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    {order.deliveryFiles.excelFileUrl && (
                      <Button
                        onClick={() => handleDownloadFile('excel')}
                        disabled={isDownloading}
                        className="flex items-center gap-2"
                        variant="outline"
                      >
                        <Download className="h-4 w-4" />
                        {isDownloading ? 'جاري التحميل...' : 'تحميل ملف Excel'}
                      </Button>
                    )}
                    {order.deliveryFiles.textFileUrl && (
                      <Button
                        onClick={() => handleDownloadFile('text')}
                        disabled={isDownloading}
                        className="flex items-center gap-2"
                        variant="outline"
                      >
                        <Download className="h-4 w-4" />
                        {isDownloading ? 'جاري التحميل...' : 'تحميل ملف TXT'}
                      </Button>
                    )}
                  </div>
                )}

                {/* Info Message */}
                {!order.deliveryFiles?.error && !order.deliveryFiles?.errorAr && (
                  <p className="text-xs text-muted-foreground mt-3">
                    الملفات تحتوي على جميع الأكواد والأرقام التسلسلية للمنتجات التي تم شراؤها في هذا الطلب.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
