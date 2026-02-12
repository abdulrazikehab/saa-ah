import { Users, Shield, MessageSquare } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmployeesManager from './EmployeesManager';
import PermissionsManager from './PermissionsManager';
import StoreSupportTab from '@/components/dashboard/management/StoreSupportTab';

export default function Management() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">إدارة المتجر</h1>
        <p className="text-muted-foreground mt-2">إعدادات المتجر المتقدمة، الموظفين، والدعم الفني</p>
      </div>

      <Tabs defaultValue="employees" className="w-full">
        <TabsList className="bg-muted p-1 rounded-lg inline-flex mb-4 gap-2">
          <TabsTrigger value="employees" className="gap-2">
            <Users className="h-4 w-4" />
            الموظفين
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            <Shield className="h-4 w-4" />
            الأدوار والصلاحيات
          </TabsTrigger>
          <TabsTrigger value="tickets" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            تذاكر الدعم
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="employees" className="mt-2">
          <EmployeesManager />
        </TabsContent>
        
        <TabsContent value="roles" className="mt-2">
          <PermissionsManager />
        </TabsContent>

        <TabsContent value="tickets" className="mt-2">
          <StoreSupportTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
