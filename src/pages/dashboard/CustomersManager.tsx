import { useEffect, useState, useCallback } from 'react';
import { Users, UserPlus, Search, Filter, Download, Award, TrendingUp, Mail, Phone, Upload } from 'lucide-react';
import { read, utils, writeFile } from 'xlsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { coreApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  totalOrders: number;
  totalSpent: number;
  loyaltyPoints: number;
  loyaltyTier: string;
  createdAt: string;
  lastOrderDate?: string;
}

interface LoyaltyProgram {
  id: string;
  name: string;
  description: string;
  members: number;
  minPoints: number;
  benefits: string[];
}

export default function CustomersManager() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loyaltyPrograms, setLoyaltyPrograms] = useState<LoyaltyProgram[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [showProgramSheet, setShowProgramSheet] = useState(false);
  const [editingProgram, setEditingProgram] = useState<LoyaltyProgram | null>(null);
  const [programForm, setProgramForm] = useState({
    name: '',
    description: '',
    minPoints: 0,
    benefits: ''
  });

  const openCreateProgram = () => {
    setEditingProgram(null);
    setProgramForm({ name: '', description: '', minPoints: 0, benefits: '' });
    setShowProgramSheet(true);
  };

  const openEditProgram = (program: LoyaltyProgram) => {
    setEditingProgram(program);
    setProgramForm({
      name: program.name,
      description: program.description,
      minPoints: program.minPoints,
      benefits: program.benefits.join(', '),
    });
    setShowProgramSheet(true);
  };

  const handleProgramFormChange = (field: string, value: string | number) => {
    setProgramForm(prev => ({ ...prev, [field]: value }));
  };

  const submitProgram = async () => {
    try {
      const payload = {
        name: programForm.name,
        description: programForm.description,
        minPoints: Number(programForm.minPoints),
        benefits: programForm.benefits.split(',').map((b: string) => b.trim()).filter(Boolean),
      };
      if (editingProgram) {
        await coreApi.put(`/dashboard/loyalty-programs/${editingProgram.id}`, payload);
        toast({ title: 'تم تعديل البرنامج', variant: 'default' });
      } else {
        await coreApi.post('/dashboard/loyalty-programs', payload);
        toast({ title: 'تم إضافة البرنامج', variant: 'default' });
      }
      setShowProgramSheet(false);
      loadLoyaltyPrograms();
    } catch (error) {
      console.error('Program submit error', error);
      toast({ title: 'خطأ', description: 'فشل حفظ البرنامج', variant: 'destructive' });
    }
  };

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch customers from API
      const data = await coreApi.get('/dashboard/customers', { requireAuth: true });
      setCustomers(Array.isArray(data) ? data : (data.customers || []));
    } catch (error) {
      console.error('Failed to load customers:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحميل بيانات العملاء',
        variant: 'destructive',
      });
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadLoyaltyPrograms = useCallback(async () => {
    try {
      // Fetch loyalty programs from API
      const data = await coreApi.get('/dashboard/loyalty-programs', { requireAuth: true });
      setLoyaltyPrograms(Array.isArray(data) ? data : (data.programs || []));
    } catch (error) {
      console.error('Failed to load loyalty programs:', error);
      setLoyaltyPrograms([]);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
    loadLoyaltyPrograms();
  }, [loadCustomers, loadLoyaltyPrograms]);

  const getTierBadge = (tier: string) => {
    const tierConfig: Record<string, { label: string; className: string }> = {
      gold: { label: 'ذهبي', className: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20' },
      silver: { label: 'فضي', className: 'bg-gray-500/10 text-gray-700 border-gray-500/20' },
      bronze: { label: 'برونزي', className: 'bg-orange-500/10 text-orange-700 border-orange-500/20' },
    };

    const config = tierConfig[tier] || tierConfig.bronze;
    return (
      <Badge variant="outline" className={config.className}>
        <Award className="h-3 w-3 ml-1" />
        {config.label}
      </Badge>
    );
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = filterTier === 'all' || customer.loyaltyTier === filterTier;
    return matchesSearch && matchesTier;
  });

  const handleExport = () => {
    const exportData = customers.map(c => ({
      ID: c.id,
      Name: c.name,
      Email: c.email,
      Phone: c.phone,
      TotalOrders: c.totalOrders,
      TotalSpent: c.totalSpent,
      LoyaltyPoints: c.loyaltyPoints,
      LoyaltyTier: c.loyaltyTier,
      CreatedAt: c.createdAt,
      LastOrderDate: c.lastOrderDate
    }));

    const ws = utils.json_to_sheet(exportData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Customers");
    writeFile(wb, "customers_export.xlsx");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(worksheet);

      console.log('Importing customers:', jsonData);
      
      let successCount = 0;
      let failCount = 0;

      // Note: Creating customers usually requires more complex logic (auth, etc.)
      // For now, we'll just log the attempt or call a hypothetical create endpoint if it existed.
      // Since there is no createCustomer endpoint exposed in coreApi for bulk import in the context,
      // I will just show a toast for now to demonstrate functionality.
      
      toast({ 
        title: 'Import Processed', 
        description: `Read ${jsonData.length} records. Bulk import backend implementation required.` 
      });
      
      // Reset file input
      e.target.value = '';
    } catch (error) {
      console.error('Import error:', error);
      toast({ title: 'Error', description: 'Failed to import file', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">العملاء</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة العملاء وبرامج الولاء</p>
        </div>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          إضافة عميل
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="customers" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="customers">العملاء ({customers.length})</TabsTrigger>
          <TabsTrigger value="loyalty">برامج الولاء ({loyaltyPrograms.length})</TabsTrigger>
        </TabsList>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي العملاء</p>
                    <p className="text-2xl font-bold mt-1">{customers.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-yellow-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">عملاء ذهبيين</p>
                    <p className="text-2xl font-bold mt-1">
                      {customers.filter(c => c.loyaltyTier === 'gold').length}
                    </p>
                  </div>
                  <Award className="h-8 w-8 text-yellow-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">متوسط الإنفاق</p>
                    <p className="text-2xl font-bold mt-1">
                      {(customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length || 0).toFixed(0)} ريال
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي النقاط</p>
                    <p className="text-2xl font-bold mt-1">
                      {customers.reduce((sum, c) => sum + c.loyaltyPoints, 0)}
                    </p>
                  </div>
                  <Award className="h-8 w-8 text-purple-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card>
            <CardHeader className="border-b">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="البحث بالاسم أو البريد الإلكتروني..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </div>
                <Select value={filterTier} onValueChange={setFilterTier}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 ml-2" />
                    <SelectValue placeholder="تصفية حسب المستوى" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المستويات</SelectItem>
                    <SelectItem value="gold">ذهبي</SelectItem>
                    <SelectItem value="silver">فضي</SelectItem>
                    <SelectItem value="bronze">برونزي</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button variant="outline" className="gap-2" onClick={handleExport}>
                    <Download className="h-4 w-4" />
                    تصدير
                  </Button>
                  <div className="relative">
                    <Input
                      type="file"
                      accept=".xlsx, .xls"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleImport}
                    />
                    <Button variant="outline" className="gap-2">
                      <Upload className="h-4 w-4" />
                      استيراد
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">لا توجد نتائج</h3>
                  <p className="text-gray-500">لم يتم العثور على عملاء مطابقين للبحث</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>العميل</TableHead>
                      <TableHead>معلومات الاتصال</TableHead>
                      <TableHead>الطلبات</TableHead>
                      <TableHead>إجمالي الإنفاق</TableHead>
                      <TableHead>نقاط الولاء</TableHead>
                      <TableHead>المستوى</TableHead>
                      <TableHead>آخر طلب</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer) => (
                      <TableRow key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${customer.name}`} />
                              <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{customer.name}</p>
                              <p className="text-sm text-gray-500">
                                عضو منذ {new Date(customer.createdAt).toLocaleDateString('ar-SA')}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3 w-3 text-gray-400" />
                              {customer.email}
                            </div>
                            {customer.phone && (
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Phone className="h-3 w-3" />
                                {customer.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{customer.totalOrders} طلب</Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {customer.totalSpent.toFixed(2)} ريال
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-primary" />
                            <span className="font-medium">{customer.loyaltyPoints}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getTierBadge(customer.loyaltyTier)}</TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {customer.lastOrderDate 
                            ? new Date(customer.lastOrderDate).toLocaleDateString('ar-SA')
                            : '-'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Loyalty Programs Tab */}
        <TabsContent value="loyalty" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-gray-500">
              إدارة برامج الولاء والمكافآت للعملاء
            </p>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              إنشاء برنامج جديد
            </Button>
          </div>

          {loyaltyPrograms.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Award className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">لا توجد برامج ولاء</h3>
                <p className="text-gray-500 mb-4">ابدأ بإنشاء برنامج ولاء لعملائك</p>
                <Button>
                  <UserPlus className="h-4 w-4 ml-2" />
                  إنشاء برنامج جديد
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {loyaltyPrograms.map((program) => (
                <Card key={program.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Award className="h-6 w-6 text-primary" />
                      </div>
                      <Badge variant="secondary">{program.members} عضو</Badge>
                    </div>
                    <CardTitle className="mt-4">{program.name}</CardTitle>
                    <CardDescription>{program.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium mb-2">الحد الأدنى من النقاط:</p>
                        <p className="text-2xl font-bold text-primary">{program.minPoints}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">المزايا:</p>
                        <ul className="space-y-1">
                          {program.benefits.map((benefit, index) => (
                            <li key={index} className="text-sm text-gray-500 flex items-center gap-2">
                              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Button variant="outline" className="w-full">
                        تعديل البرنامج
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
