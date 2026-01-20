import { Store } from 'lucide-react';
import PlaceholderPage from '@/components/dashboard/PlaceholderPage';

export default function AppsStore() {
  return (
    <PlaceholderPage
      title="متجر التطبيقات"
      description="اكتشف تطبيقات لتعزيز متجرك"
      icon={Store}
      actionLabel="تصفح التطبيقات"
    />
  );
}
