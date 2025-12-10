import { Palette, Layout, Globe, Settings, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function StorefrontEditor() {
  const options = [
    {
      title: 'تصميم المتجر',
      description: 'تخصيص ألوان، خطوط، وشعار المتجر',
      icon: Palette,
      href: '/dashboard/design',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    },
    {
      title: 'القوالب',
      description: 'اختر قالب المتجر المناسب لهويتك',
      icon: Layout,
      href: '/dashboard/templates',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      title: 'قوائم التنقل',
      description: 'إدارة روابط الهيدر والفوتر',
      icon: Globe,
      href: '/dashboard/navigation',
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      title: 'إعدادات المتجر',
      description: 'الإعدادات العامة ومعلومات المتجر',
      icon: Settings,
      href: '/dashboard/store-settings',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">نافذة المتجر</h1>
        <p className="text-muted-foreground mt-2">تحكم في مظهر وتجربة متجرك بالكامل</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {options.map((option) => (
          <Link key={option.title} to={option.href}>
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/20">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${option.bgColor}`}>
                  <option.icon className={`w-6 h-6 ${option.color}`} />
                </div>
                <CardTitle>{option.title}</CardTitle>
                <CardDescription>{option.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="group p-0 h-auto hover:bg-transparent text-primary">
                  الذهاب للإعدادات
                  <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
