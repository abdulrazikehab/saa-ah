import { Users, Shield, Activity, FileText } from 'lucide-react';
import PlaceholderPage from '@/components/dashboard/PlaceholderPage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmployeesManager from './EmployeesManager';

export default function Management() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">إدارة المتجر</h1>
        <p className="text-muted-foreground mt-2">إدارة الموظفين والصلاحيات وسجلات النشاط</p>
      </div>

      <Tabs defaultValue="employees" className="w-full">
        <TabsList>
          <TabsTrigger value="employees">الموظفين</TabsTrigger>
          <TabsTrigger value="roles">الأدوار والصلاحيات</TabsTrigger>
          <TabsTrigger value="logs">سجلات النشاط</TabsTrigger>
        </TabsList>
        
        <TabsContent value="employees" className="mt-6">
          <EmployeesManager />
        </TabsContent>
        
        <TabsContent value="roles" className="mt-6">
          <PlaceholderPage 
            title="الأدوار والصلاحيات" 
            description="تخصيص أدوار الموظفين والتحكم في وصولهم."
            icon={Shield}
          />
        </TabsContent>
        
        <TabsContent value="logs" className="mt-6">
          <PlaceholderPage 
            title="سجلات النشاط" 
            description="متابعة جميع الإجراءات التي تتم في لوحة التحكم."
            icon={Activity}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
