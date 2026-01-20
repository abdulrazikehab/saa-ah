import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { coreApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, MapPin, CreditCard, Download, FileText, CheckCircle, Wallet, ExternalLink } from 'lucide-react';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product?: {
    name: string;
    nameAr?: string;
    images?: string[];
  };
  deliveries?: {
    cardCode: string;
    cardPin?: string;
  }[];
}

interface Order {
  id: string;
  orderNumber?: string;
  status: string;
  createdAt: string;
  totalAmount: number;
  subtotal?: number;
  shippingCost?: number;
  tax?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  items?: OrderItem[];
  deliveryFiles?: {
    excelFileUrl?: string;
    textFileUrl?: string;
  };
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    fullName?: string;
  };
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { settings } = useStoreSettings();
  const [isCardOrder, setIsCardOrder] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (id) {
      loadOrder(id);
    }
  }, [id]);

  async function loadOrder(orderId: string) {
    try {
      setIsLoading(true);
      // Try regular order first
      try {
        const data = await coreApi.getOrder(orderId);
        setOrder(data);
        // If store type is DIGITAL_CARDS, it's a card order
        setIsCardOrder(settings?.storeType === 'DIGITAL_CARDS');
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
      setIsLoading(false);
    }
  }

  const handleDownloadFile = async (fileType: 'excel' | 'text') => {
    if (!id || isDownloading) return;
    setIsDownloading(true);
    try {
      const token = localStorage.getItem('customerToken');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const url = `${apiUrl}/api/orders/${id}/download/${fileType}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download file');
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
            order.status === 'COMPLETED' || order.status === 'PAID' ? 'default' :
            order.status === 'PENDING' ? 'secondary' :
            order.status === 'CANCELLED' ? 'destructive' : 'outline'
          }>
            {order.status === 'PAID' ? 'تم الدفع' : 
             order.status === 'COMPLETED' ? 'مكتمل' :
             order.status === 'PENDING' ? 'قيد الانتظار' :
             order.status === 'CANCELLED' ? 'ملغي' : order.status}
          </Badge>
        </div>
        
        {isCardOrder && (order.status === 'PAID' || order.status === 'COMPLETED') && (
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
              <div className="space-y-4">
                {order.items?.map((item: OrderItem) => (
                    <div className="flex flex-col gap-2">
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
                            <p className="font-medium">{item.product?.nameAr || item.product?.name || 'Unknown Product'}</p>
                            <p className="text-sm text-muted-foreground">الكمية: {item.quantity}</p>
                          </div>
                        </div>
                        <p className="font-medium">{Number(item.price).toFixed(2)} ر.س</p>
                      </div>
                      
                      {isCardOrder && item.deliveries && item.deliveries.length > 0 && (
                        <div className="mt-2 p-3 bg-muted/50 rounded-lg space-y-2">
                          <p className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            الأكواد المستلمة:
                          </p>
                          {item.deliveries.map((delivery, idx: number) => (
                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-sm font-mono bg-background p-2 rounded border border-border/50">
                              <span className="text-primary font-bold">{delivery.cardCode}</span>
                              {delivery.cardPin && (
                                <span className="text-muted-foreground">PIN: {delivery.cardPin}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المجموع الفرعي</span>
                  <span>{Number(order.subtotal || order.totalAmount || order.total || 0).toFixed(2)} ر.س</span>
                </div>
                {Number(order.shippingCost || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الشحن</span>
                    <span>{Number(order.shippingCost).toFixed(2)} ر.س</span>
                  </div>
                )}
                {Number(order.tax || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الضريبة</span>
                    <span>{Number(order.tax).toFixed(2)} ر.س</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-bold text-lg">
                  <span>الإجمالي</span>
                  <span>{Number(order.totalAmount || order.total || 0).toFixed(2)} ر.س</span>
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
          {settings?.storeType === 'DIGITAL_CARDS' && order.deliveryFiles && (order.deliveryFiles.excelFileUrl || order.deliveryFiles.textFileUrl) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  ملفات التسليم
                </CardTitle>
                <CardDescription>
                  قم بتحميل ملفات Excel و TXT التي تحتوي على جميع الأكواد والأرقام التسلسلية للمنتجات
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                <p className="text-xs text-muted-foreground mt-3">
                  الملفات تحتوي على جميع الأكواد والأرقام التسلسلية للمنتجات التي تم شراؤها في هذا الطلب.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
