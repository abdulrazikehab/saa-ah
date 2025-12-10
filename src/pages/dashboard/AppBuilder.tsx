import { Smartphone } from 'lucide-react';
import PlaceholderPage from '@/components/dashboard/PlaceholderPage';

export default function AppBuilder() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">صانع التطبيقات</h1>
        <p className="text-muted-foreground mt-2">حول متجرك إلى تطبيق جوال احترافي</p>
      </div>

      <PlaceholderPage 
        title="صانع التطبيقات قادم قريباً" 
        description="نعمل على تطوير أداة قوية تمكنك من بناء تطبيق لمتجرك بكل سهولة وبدون برمجة."
        icon={Smartphone}
        actionLabel="سجل اهتمامك"
      />
    </div>
  );
}
