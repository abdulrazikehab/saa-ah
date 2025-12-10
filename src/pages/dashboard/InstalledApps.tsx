import { Package } from 'lucide-react';
import PlaceholderPage from '@/components/dashboard/PlaceholderPage';

export default function InstalledApps() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">التطبيقات المثبتة</h1>
        <p className="text-muted-foreground mt-2">إدارة التطبيقات والخدمات المرتبطة بمتجرك</p>
      </div>

      <PlaceholderPage 
        title="لا توجد تطبيقات مثبتة" 
        description="تصفح متجر التطبيقات لاكتشاف أدوات تساعدك في تنمية تجارتك."
        icon={Package}
        actionLabel="تصفح متجر التطبيقات"
      />
    </div>
  );
}
