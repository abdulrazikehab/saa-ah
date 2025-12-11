import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plug, Plus, Edit, Trash2 } from 'lucide-react';
import { coreApi } from '@/lib/api';

interface Integration {
  id: string;
  name: string;
  type: string;
  provider: string;
  isActive: boolean;
  createdAt: string;
}

export default function IntegrationsSettings() {
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      const response = await coreApi.get('/integrations').catch(() => []);
      setIntegrations(Array.isArray(response) ? response : []);
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error?.message || 'فشل تحميل التكاملات',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold mb-2">التكاملات</h2>
          <p className="text-gray-600 dark:text-gray-400">
            إدارة التكاملات مع الخدمات الخارجية
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          إضافة تكامل
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {integrations.map((integration) => (
          <Card key={integration.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <Plug className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <CardTitle>{integration.name}</CardTitle>
                    <CardDescription>{integration.provider}</CardDescription>
                  </div>
                </div>
                <Switch checked={integration.isActive} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge variant={integration.isActive ? 'default' : 'secondary'}>
                  {integration.isActive ? 'نشط' : 'غير نشط'}
                </Badge>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {integrations.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Plug className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">لا توجد تكاملات مضافة</p>
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              إضافة تكامل جديد
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

