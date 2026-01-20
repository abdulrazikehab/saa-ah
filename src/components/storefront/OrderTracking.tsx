import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Package, MapPin, Clock, CheckCircle, Truck, ArrowRight } from 'lucide-react';

interface OrderStatus {
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  timestamp: string;
  description: string;
  descriptionAr: string;
}

interface OrderTrackingProps {
  orderNumber?: string;
  currentStatus?: 'pending' | 'processing' | 'shipped' | 'delivered';
  statusHistory?: OrderStatus[];
  estimatedDelivery?: string;
  language?: 'ar' | 'en';
  onTrack?: (orderNumber: string) => void;
}

export function OrderTracking({
  orderNumber = '',
  currentStatus = 'processing',
  statusHistory = [],
  estimatedDelivery,
  language = 'ar',
  onTrack
}: OrderTrackingProps) {
  const defaultHistory: OrderStatus[] = [
    {
      status: 'pending',
      timestamp: '2024-01-20 10:00',
      description: 'Order placed successfully',
      descriptionAr: 'تم تقديم الطلب بنجاح'
    },
    {
      status: 'processing',
      timestamp: '2024-01-20 10:15',
      description: 'Order is being processed',
      descriptionAr: 'جاري معالجة الطلب'
    },
    {
      status: 'shipped',
      timestamp: '2024-01-20 14:00',
      description: 'Order has been shipped',
      descriptionAr: 'تم شحن الطلب'
    },
    {
      status: 'delivered',
      timestamp: '',
      description: 'Order delivered',
      descriptionAr: 'تم توصيل الطلب'
    },
  ];

  const activeHistory = statusHistory.length > 0 ? statusHistory : defaultHistory;

  const statusConfig = {
    pending: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/20' },
    processing: { icon: Package, color: 'text-blue-500', bg: 'bg-blue-500/20' },
    shipped: { icon: Truck, color: 'text-purple-500', bg: 'bg-purple-500/20' },
    delivered: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/20' },
  };

  const getStatusIndex = (status: string) => {
    const statuses = ['pending', 'processing', 'shipped', 'delivered'];
    return statuses.indexOf(status);
  };

  const currentIndex = getStatusIndex(currentStatus);

  return (
    <div className="py-16 bg-gradient-to-b from-black to-gray-900">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            {language === 'ar' ? 'تتبع الطلب' : 'Track Your Order'}
          </h2>
          <p className="text-gray-400 text-lg">
            {language === 'ar' ? 'تابع حالة طلبك في الوقت الفعلي' : 'Follow your order status in real-time'}
          </p>
        </div>

        {/* Track Input */}
        {!orderNumber && (
          <Card className="bg-gray-900 border-gray-800 p-8 max-w-2xl mx-auto mb-12">
            <div className="space-y-4">
              <label className="text-white font-semibold block">
                {language === 'ar' ? 'أدخل رقم الطلب' : 'Enter Order Number'}
              </label>
              <div className="flex gap-3">
                <Input
                  placeholder={language === 'ar' ? 'مثال: ORD-12345' : 'e.g., ORD-12345'}
                  className="flex-1 bg-gray-800 border-gray-700 text-white"
                />
                <Button
                  onClick={() => onTrack?.('ORD-12345')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8"
                >
                  {language === 'ar' ? 'تتبع' : 'Track'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Order Info */}
        {orderNumber && (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Order Header */}
            <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30 p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">
                    {language === 'ar' ? 'رقم الطلب' : 'Order Number'}
                  </p>
                  <p className="text-2xl font-black text-white">{orderNumber}</p>
                </div>
                {estimatedDelivery && (
                  <div className="text-right">
                    <p className="text-gray-400 text-sm mb-1">
                      {language === 'ar' ? 'التوصيل المتوقع' : 'Estimated Delivery'}
                    </p>
                    <p className="text-lg font-bold text-purple-400">{estimatedDelivery}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Progress Timeline */}
            <Card className="bg-gray-900 border-gray-800 p-8">
              <div className="relative">
                {/* Progress Line */}
                <div className="absolute top-12 left-0 right-0 h-1 bg-gray-800">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000"
                    style={{ width: `${(currentIndex / 3) * 100}%` }}
                  />
                </div>

                {/* Status Steps */}
                <div className="relative grid grid-cols-4 gap-4">
                  {activeHistory.map((item, index) => {
                    const StatusIcon = statusConfig[item.status].icon;
                    const isCompleted = index <= currentIndex;
                    const isCurrent = index === currentIndex;

                    return (
                      <div key={item.status} className="flex flex-col items-center">
                        {/* Icon */}
                        <div
                          className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${
                            isCompleted
                              ? `${statusConfig[item.status].bg} border-2 border-${item.status === 'delivered' ? 'green' : 'purple'}-500`
                              : 'bg-gray-800 border-2 border-gray-700'
                          } ${isCurrent ? 'scale-110 shadow-lg shadow-purple-500/50' : ''}`}
                        >
                          <StatusIcon
                            className={`h-10 w-10 ${
                              isCompleted ? statusConfig[item.status].color : 'text-gray-600'
                            }`}
                          />
                          {isCompleted && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <CheckCircle className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Label */}
                        <div className="mt-4 text-center">
                          <p
                            className={`font-bold mb-1 ${
                              isCompleted ? 'text-white' : 'text-gray-600'
                            }`}
                          >
                            {language === 'ar' ? item.descriptionAr : item.description}
                          </p>
                          {item.timestamp && (
                            <p className="text-xs text-gray-500">{item.timestamp}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* Current Status Card */}
            <Card className="bg-gray-900 border-gray-800 p-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 ${statusConfig[currentStatus].bg} rounded-lg`}>
                  <MapPin className={`h-6 w-6 ${statusConfig[currentStatus].color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg mb-2">
                    {language === 'ar' ? 'الحالة الحالية' : 'Current Status'}
                  </h3>
                  <p className="text-gray-400">
                    {language === 'ar'
                      ? activeHistory[currentIndex].descriptionAr
                      : activeHistory[currentIndex].description}
                  </p>
                  {activeHistory[currentIndex].timestamp && (
                    <p className="text-sm text-gray-500 mt-2">
                      {activeHistory[currentIndex].timestamp}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Help Section */}
            <Card className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-purple-500/30 p-6">
              <div className="text-center">
                <p className="text-white font-semibold mb-2">
                  {language === 'ar' ? 'هل تحتاج مساعدة؟' : 'Need Help?'}
                </p>
                <p className="text-gray-400 text-sm mb-4">
                  {language === 'ar'
                    ? 'فريق الدعم متاح 24/7 لمساعدتك'
                    : 'Our support team is available 24/7 to help you'}
                </p>
                <Button variant="outline" className="border-purple-500 text-purple-400 hover:bg-purple-500/10">
                  {language === 'ar' ? 'تواصل معنا' : 'Contact Support'}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
