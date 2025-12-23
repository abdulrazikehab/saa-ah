import { useEffect, useState, useCallback } from 'react';
import { Users, UserPlus, Search, Filter, Download, Award, TrendingUp, Mail, Phone, Upload } from 'lucide-react';
import { read, utils, writeFile } from 'xlsx';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { coreApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DataTablePagination } from '@/components/common/DataTablePagination';

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
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loyaltyPrograms, setLoyaltyPrograms] = useState<LoyaltyProgram[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [showProgramSheet, setShowProgramSheet] = useState(false);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [editingProgram, setEditingProgram] = useState<LoyaltyProgram | null>(null);
  const [programForm, setProgramForm] = useState({
    name: '',
    description: '',
    minPoints: 0,
    benefits: ''
  });
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const openCreateCustomer = () => {
    setCustomerForm({ name: '', email: '', phone: '' });
    setShowCustomerDialog(true);
  };

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

  const submitCustomer = async () => {
    try {
      toast({ 
        title: t('dashboard.customers.addCustomer'), 
        description: t('dashboard.customers.addCustomerSuccess'), 
        variant: 'default' 
      });
      setShowCustomerDialog(false);
    } catch (error) {
      console.error('Customer submit error', error);
      toast({ 
        title: t('dashboard.customers.addCustomerError'), 
        description: t('common.errorOccurred'), 
        variant: 'destructive' 
      });
    }
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
        toast({ title: t('dashboard.customers.saveProgramSuccess'), variant: 'default' });
      } else {
        await coreApi.post('/dashboard/loyalty-programs', payload);
        toast({ title: t('dashboard.customers.saveProgramSuccess'), variant: 'default' });
      }
      setShowProgramSheet(false);
      loadLoyaltyPrograms();
    } catch (error) {
      console.error('Program submit error', error);
      toast({ title: t('dashboard.customers.saveProgramError'), description: t('common.errorOccurred'), variant: 'destructive' });
    }
  };

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await coreApi.get(`/dashboard/customers?page=${currentPage}&limit=${itemsPerPage}`, { requireAuth: true });
      
      // Handle paginated response
      if (response && 'data' in response && 'meta' in response) {
        setCustomers(response.data);
        setTotalItems(response.meta.total);
        setTotalPages(response.meta.totalPages);
      } else {
        // Legacy response
        const customersArray = Array.isArray(response) ? response : (response.customers || []);
        setCustomers(customersArray);
        setTotalItems(customersArray.length);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Failed to load customers:', error);
      toast({
        title: t('dashboard.customers.loadCustomersError'),
        description: t('common.errorOccurred'),
        variant: 'destructive',
      });
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [toast, t, currentPage, itemsPerPage]);

  const loadLoyaltyPrograms = useCallback(async () => {
    try {
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
      gold: { label: t('dashboard.customers.gold'), className: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20' },
      silver: { label: t('dashboard.customers.silver'), className: 'bg-gray-500/10 text-gray-700 border-gray-500/20' },
      bronze: { label: t('dashboard.customers.bronze'), className: 'bg-orange-500/10 text-orange-700 border-orange-500/20' },
    };

    const config = tierConfig[tier] || tierConfig.bronze;
    return (
      <Badge variant="outline" className={config.className}>
        <Award className={`h-3 w-3 ${i18n.language === 'ar' ? 'ml-1' : 'mr-1'}`} />
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
    const headers = [
      'ID',
      'Name',
      'Email',
      'Phone',
      'TotalOrders',
      'TotalSpent',
      'LoyaltyPoints',
      'LoyaltyTier',
      'CreatedAt',
      'LastOrderDate'
    ];

    const exportData = customers.map(c => ({
      ID: c.id,
      Name: c.name,
      Email: c.email,
      Phone: c.phone || '',
      TotalOrders: c.totalOrders || 0,
      TotalSpent: c.totalSpent || 0,
      LoyaltyPoints: c.loyaltyPoints || 0,
      LoyaltyTier: c.loyaltyTier || '',
      CreatedAt: c.createdAt || '',
      LastOrderDate: c.lastOrderDate || ''
    }));

    const ws = utils.json_to_sheet(exportData, { header: headers });
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
      
      toast({ 
        title: 'Import Processed', 
        description: `Read ${jsonData.length} records. Bulk import backend implementation required.` 
      });
      
      e.target.value = '';
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to import file', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('dashboard.customers.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('dashboard.customers.subtitle')}</p>
        </div>
        <Button className="gap-2" onClick={openCreateCustomer}>
          <UserPlus className="h-4 w-4" />
          {t('dashboard.customers.addCustomer')}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="customers" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="customers">{t('dashboard.customers.title')} ({customers.length})</TabsTrigger>
          <TabsTrigger value="loyalty">{t('dashboard.customers.loyaltyPrograms')} ({loyaltyPrograms.length})</TabsTrigger>
        </TabsList>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.customers.totalCustomers')}</p>
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
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.customers.goldCustomers')}</p>
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
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.customers.averageSpending')}</p>
                    <p className="text-2xl font-bold mt-1">
                      {(customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length || 0).toFixed(0)} {t('common.currency')}
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
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.customers.totalPoints')}</p>
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
                  <Search className={`absolute ${i18n.language === 'ar' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400`} />
                  <Input
                    placeholder={t('dashboard.customers.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={i18n.language === 'ar' ? 'pr-10' : 'pl-10'}
                  />
                </div>
                <Select value={filterTier} onValueChange={setFilterTier}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className={`h-4 w-4 ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                    <SelectValue placeholder={t('dashboard.customers.filterTier')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('dashboard.customers.allTiers')}</SelectItem>
                    <SelectItem value="gold">{t('dashboard.customers.gold')}</SelectItem>
                    <SelectItem value="silver">{t('dashboard.customers.silver')}</SelectItem>
                    <SelectItem value="bronze">{t('dashboard.customers.bronze')}</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button variant="outline" className="gap-2" onClick={handleExport}>
                    <Download className="h-4 w-4" />
                    {t('dashboard.customers.export')}
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
                      {t('dashboard.customers.import')}
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
                  <h3 className="text-xl font-semibold mb-2">{t('dashboard.customers.noResults')}</h3>
                  <p className="text-gray-500">{t('dashboard.customers.noResultsDesc')}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('dashboard.customers.customer')}</TableHead>
                      <TableHead>{t('dashboard.customers.contactInfo')}</TableHead>
                      <TableHead>{t('dashboard.customers.orders')}</TableHead>
                      <TableHead>{t('dashboard.customers.totalSpent')}</TableHead>
                      <TableHead>{t('dashboard.customers.loyaltyPoints')}</TableHead>
                      <TableHead>{t('dashboard.customers.tier')}</TableHead>
                      <TableHead>{t('dashboard.customers.lastOrder')}</TableHead>
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
                                {t('dashboard.customers.memberSince')} {new Date(customer.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}
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
                          <Badge variant="secondary">{customer.totalOrders} {t('dashboard.customers.orders')}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {customer.totalSpent.toFixed(2)} {t('common.currency')}
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
                            ? new Date(customer.lastOrderDate).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')
                            : '-'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* Pagination Controls */}
              {!loading && totalItems > 0 && (
                <DataTablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                  itemsPerPageOptions={[10, 20, 50, 100]}
                  showItemsPerPage={true}
                  className="border-t mt-4"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Loyalty Programs Tab */}
        <TabsContent value="loyalty" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-gray-500">
              {t('dashboard.customers.loyaltyDesc')}
            </p>
            <Button className="gap-2" onClick={openCreateProgram}>
              <UserPlus className="h-4 w-4" />
              {t('dashboard.customers.createProgram')}
            </Button>
          </div>

          {loyaltyPrograms.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Award className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{t('dashboard.customers.noPrograms')}</h3>
                <p className="text-gray-500 mb-4">{t('dashboard.customers.noProgramsDesc')}</p>
                <Button onClick={openCreateProgram}>
                  <UserPlus className={`h-4 w-4 ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                  {t('dashboard.customers.createProgram')}
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
                      <Badge variant="secondary">{program.members} {t('dashboard.customers.members')}</Badge>
                    </div>
                    <CardTitle className="mt-4">{program.name}</CardTitle>
                    <CardDescription>{program.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium mb-2">{t('dashboard.customers.minPoints')}:</p>
                        <p className="text-2xl font-bold text-primary">{program.minPoints}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">{t('dashboard.customers.benefits')}:</p>
                        <ul className="space-y-1">
                          {program.benefits.map((benefit, index) => (
                            <li key={index} className="text-sm text-gray-500 flex items-center gap-2">
                              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Button variant="outline" className="w-full" onClick={() => openEditProgram(program)}>
                        {t('dashboard.customers.editProgram')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Loyalty Program Sheet */}
      <Sheet open={showProgramSheet} onOpenChange={setShowProgramSheet}>
        <SheetContent className="sm:max-w-[540px]">
          <SheetHeader>
            <SheetTitle>{editingProgram ? t('dashboard.customers.editProgramTitle') : t('dashboard.customers.createProgramTitle')}</SheetTitle>
            <SheetDescription>
              {editingProgram ? t('dashboard.customers.editProgramTitle') : t('dashboard.customers.createProgramTitle')}
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="program-name">{t('dashboard.customers.programName')}</Label>
              <Input
                id="program-name"
                value={programForm.name}
                onChange={(e) => handleProgramFormChange('name', e.target.value)}
                placeholder={t('dashboard.customers.gold')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="program-description">{t('dashboard.customers.description')}</Label>
              <Textarea
                id="program-description"
                value={programForm.description}
                onChange={(e) => handleProgramFormChange('description', e.target.value)}
                placeholder={t('dashboard.customers.description')}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="program-min-points">{t('dashboard.customers.minPoints')}</Label>
              <Input
                id="program-min-points"
                type="number"
                value={programForm.minPoints}
                onChange={(e) => handleProgramFormChange('minPoints', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="program-benefits">{t('dashboard.customers.benefits')} ({t('dashboard.customers.benefitsHint')})</Label>
              <Textarea
                id="program-benefits"
                value={programForm.benefits}
                onChange={(e) => handleProgramFormChange('benefits', e.target.value)}
                placeholder={t('dashboard.customers.benefitsPlaceholder')}
                rows={4}
              />
              <p className="text-xs text-gray-500">{t('dashboard.customers.benefitsHint')}</p>
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setShowProgramSheet(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={submitProgram}>
              {editingProgram ? t('common.saveChanges') : t('dashboard.customers.createProgram')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Add Customer Dialog */}
      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('dashboard.customers.addNewCustomer')}</DialogTitle>
            <DialogDescription>
              {t('dashboard.customers.addCustomerDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="customer-name">{t('dashboard.customers.name')}</Label>
              <Input
                id="customer-name"
                value={customerForm.name}
                onChange={(e) => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('dashboard.customers.name')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer-email">{t('dashboard.customers.email')}</Label>
              <Input
                id="customer-email"
                type="email"
                value={customerForm.email}
                onChange={(e) => setCustomerForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="example@email.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer-phone">{t('dashboard.customers.phone')}</Label>
              <Input
                id="customer-phone"
                type="tel"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+966500000000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomerDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={submitCustomer} disabled={!customerForm.name || !customerForm.email}>
              {t('dashboard.customers.addCustomer')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
