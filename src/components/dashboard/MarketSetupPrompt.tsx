import { AlertCircle, Store } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function MarketSetupPrompt() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Store className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">مرحباً بك في لوحة التحكم!</CardTitle>
          <CardDescription className="text-base">
            لم تقم بإعداد متجرك بعد. دعنا نبدأ بإنشاء متجرك الإلكتروني
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>خطوة واحدة فقط!</AlertTitle>
            <AlertDescription>
              قم بإكمال إعداد متجرك لتتمكن من إضافة المنتجات وبدء البيع
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <h3 className="font-semibold">ما الذي ستحصل عليه:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>متجر إلكتروني احترافي بنطاق خاص</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>لوحة تحكم كاملة لإدارة المنتجات والطلبات</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>قوالب جاهزة قابلة للتخصيص</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>تحليلات وتقارير مفصلة</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/setup" className="flex-1">
              <Button size="lg" className="w-full">
                ابدأ إعداد المتجر
              </Button>
            </Link>
            <Link to="/dashboard/settings" className="flex-1">
              <Button size="lg" variant="outline" className="w-full">
                الإعدادات
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
