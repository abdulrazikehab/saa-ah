import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, UserPlus, Users, User, Shield, Edit2, Trash2, Search, 
  MoreVertical, Check, X, Loader2, Mail, Phone, Lock, Save, AlertCircle
} from 'lucide-react';
import { coreApi } from '@/lib/api';
import { customerEmployeesService, CustomerEmployee, CreateCustomerEmployeeDto } from '@/services/customer-employees.service';
import { useToast } from '@/hooks/use-toast';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";

export default function MobileEmployees() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isRTL = i18n.language === 'ar';
  
  const [activeConfig, setActiveConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [employees, setEmployees] = useState<CustomerEmployee[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // UI State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<CustomerEmployee | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<CreateCustomerEmployeeDto>({
    email: '',
    name: '',
    phone: '',
    password: '',
    permissions: []
  });

  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [configRes, employeesRes, permsRes] = await Promise.all([
        coreApi.get('/app-builder/config').catch(() => ({})),
        customerEmployeesService.getCustomerEmployees().catch(() => ({ data: [] })),
        customerEmployeesService.getAvailablePermissions().catch(() => [])
      ]);

      setActiveConfig(configRes.config || configRes);
      setEmployees(employeesRes.data || []);
      setPermissions(permsRes || []);
    } catch (error) {
       console.error("Failed to load data", error);
       toast({
         title: "Error",
         description: "Failed to load employees data",
         variant: "destructive"
       });
    } finally {
      setIsLoading(false);
    }
  };

  const primaryColor = activeConfig?.primaryColor || '#000000';

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => 
        emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        emp.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || (!selectedEmployee && !formData.password)) {
        toast({ title: "Required", description: "Email and password are required", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    try {
        if (selectedEmployee) {
            // Update logic if API supports it, otherwise we focus on permissions and status
            // For now, let's assume we can create new ones.
            toast({ title: "Coming soon", description: "Full edit functionality is being integrated." });
        } else {
            await customerEmployeesService.createCustomerEmployee(formData);
            toast({ title: "Success", description: "Employee created successfully" });
        }
        setIsAddOpen(false);
        setFormData({ email: '', name: '', phone: '', password: '', permissions: [] });
        loadData();
    } catch (error: any) {
        toast({ 
            title: "Error", 
            description: error.response?.data?.message || "Operation failed", 
            variant: "destructive" 
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEmployee) return;
    setIsSubmitting(true);
    try {
        await customerEmployeesService.deleteCustomerEmployee(selectedEmployee.id);
        toast({ title: "Success", description: "Employee removed" });
        setIsDeleteOpen(false);
        loadData();
    } catch (error: any) {
        toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleUpdatePerms = async () => {
    if (!selectedEmployee) return;
    setIsSubmitting(true);
    try {
        await customerEmployeesService.updatePermissions(selectedEmployee.id, selectedPerms);
        toast({ title: "Success", description: "Permissions updated" });
        setIsPermissionsOpen(false);
        loadData();
    } catch (error) {
        toast({ title: "Error", description: "Failed to update permissions", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  const openPermissions = (emp: CustomerEmployee) => {
    setSelectedEmployee(emp);
    setSelectedPerms(emp.permissions || []);
    setIsPermissionsOpen(true);
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" style={{ color: primaryColor }} />
    </div>
  );

  return (
    <div className="pb-24 bg-background min-h-screen">
      {/* Header */}
      <div className="bg-card p-4 shadow-sm sticky top-0 z-10 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1 rounded-full hover:bg-muted transition-colors text-foreground">
               <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
            </button>
            <h1 className="text-lg font-bold text-foreground">{t('profile.employees', 'Employees')}</h1>
          </div>
          <button 
            onClick={() => { setSelectedEmployee(null); setFormData({ email: '', name: '', phone: '', password: '', permissions: [] }); setIsAddOpen(true); }}
            className="p-2 text-primary hover:bg-primary/5 rounded-full transition-colors" 
            style={{ color: primaryColor }}
          >
            <UserPlus size={22} />
          </button>
      </div>

      <div className="p-4 space-y-4">
          {/* Search Bar */}
          <div className="relative group">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground rtl:right-3 rtl:left-auto group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder={t('common.search', 'Search by name or email...')}
                className="w-full h-11 pl-10 pr-4 rtl:pr-10 rtl:pl-4 rounded-xl border border-border bg-card focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm transition-all text-foreground"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>

          {/* Stats Bar */}
          <div className="flex gap-4 mb-2">
              <div className="flex-1 bg-card p-3.5 rounded-2xl border border-border shadow-sm">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{t('employees.total', 'Total')}</p>
                  <p className="text-xl font-black text-foreground">{employees.length}</p>
              </div>
              <div className="flex-1 bg-card p-3.5 rounded-2xl border border-border shadow-sm">
                  <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">{t('employees.active', 'Active')}</p>
                  <p className="text-xl font-black text-foreground">{employees.filter(e => e.isActive).length}</p>
              </div>
          </div>

          {/* Employee List */}
          <div className="space-y-3">
              {filteredEmployees.length === 0 ? (
                  <div className="text-center py-12 bg-card rounded-3xl border border-dashed border-border">
                      <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground font-medium">{t('employees.noResults', 'No employees found')}</p>
                  </div>
              ) : (
                filteredEmployees.map((emp) => (
                    <div key={emp.id} className="bg-card p-4 rounded-2xl shadow-sm border border-border flex items-center justify-between transition-all active:scale-[0.98]">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary font-bold text-lg border-2 border-background shadow-sm" style={{ color: primaryColor }}>
                                {emp.name?.charAt(0) || emp.email.charAt(0).toUpperCase()}
                            </div>
                            <div className="max-w-[150px]">
                                <p className="text-sm font-bold text-foreground truncate">{emp.name || emp.email.split('@')[0]}</p>
                                <p className="text-[10px] text-muted-foreground truncate mb-1">{emp.email}</p>
                                <div className="flex items-center gap-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${emp.isActive ? 'bg-green-500 animate-pulse' : 'bg-muted'}`}></span>
                                    <p className="text-[10px] text-muted-foreground font-medium">
                                        {emp.permissions?.length || 0} {t('employees.perms', 'Permissions')}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => openPermissions(emp)} className="p-2 text-muted-foreground hover:text-primary transition-colors"><Shield size={18} /></button>
                            <button onClick={() => { setSelectedEmployee(emp); setFormData({ email: emp.email, name: emp.name, phone: emp.phone, permissions: emp.permissions }); setIsAddOpen(true); }} className="p-2 text-muted-foreground hover:text-foreground transition-colors"><Edit2 size={16} /></button>
                            <button onClick={() => { setSelectedEmployee(emp); setIsDeleteOpen(true); }} className="p-2 text-muted-foreground hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                        </div>
                    </div>
                ))
              )}
          </div>
      </div>

      {/* Floating Add Button */}
      <button 
        onClick={() => { setSelectedEmployee(null); setFormData({ email: '', name: '', phone: '', password: '', permissions: [] }); setIsAddOpen(true); }}
        className="fixed bottom-28 right-6 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white transition-all active:scale-90 hover:scale-110 z-20"
        style={{ backgroundColor: primaryColor }}
      >
        <UserPlus size={24} />
      </button>

      {/* Add/Edit Sheet */}
      <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
          <SheetContent side="bottom" className="rounded-t-[32px] p-6 max-h-[90vh] overflow-y-auto no-scrollbar">
              <SheetHeader className="mb-6">
                  <SheetTitle className="text-xl font-bold">
                      {selectedEmployee ? t('employees.edit', 'Edit Employee') : t('employees.addNew', 'Add New Employee')}
                  </SheetTitle>
              </SheetHeader>
              
              <form onSubmit={handleCreateOrUpdate} className="space-y-4">
                  <div className="space-y-2">
                      <Label className="text-xs font-bold text-muted-foreground uppercase">{t('common.name', 'Full Name')}</Label>
                      <div className="relative">
                          <User size={16} className="absolute left-3 top-3 text-muted-foreground" />
                          <Input 
                            className="pl-10 h-12 rounded-xl bg-muted border-none text-foreground" 
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          />
                      </div>
                  </div>

                  <div className="space-y-2">
                      <Label className="text-xs font-bold text-muted-foreground uppercase">{t('common.email', 'Email Address')}</Label>
                      <div className="relative">
                          <Mail size={16} className="absolute left-3 top-3 text-muted-foreground" />
                          <Input 
                            type="email"
                            disabled={!!selectedEmployee}
                            className="pl-10 h-12 rounded-xl bg-muted border-none disabled:opacity-50 text-foreground" 
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          />
                      </div>
                  </div>

                  {!selectedEmployee && (
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground uppercase">{t('common.password', 'Password')}</Label>
                        <div className="relative">
                            <Lock size={16} className="absolute left-3 top-3 text-muted-foreground" />
                            <Input 
                                type="password"
                                className="pl-10 h-12 rounded-xl bg-muted border-none text-foreground" 
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>
                  )}

                  <div className="space-y-2">
                      <Label className="text-xs font-bold text-muted-foreground uppercase">{t('common.phone', 'Phone Number')}</Label>
                      <div className="relative">
                          <Phone size={16} className="absolute left-3 top-3 text-muted-foreground" />
                          <Input 
                            className="pl-10 h-12 rounded-xl bg-muted border-none text-foreground" 
                            placeholder="+966"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          />
                      </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full h-14 rounded-2xl text-lg font-bold mt-4 shadow-lg active:scale-[0.98] text-white" 
                    style={{ backgroundColor: primaryColor }}
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : (selectedEmployee ? t('common.save', 'Save Changes') : t('employees.create', 'Create Employee'))}
                  </Button>
              </form>
          </SheetContent>
      </Sheet>

      {/* Permissions Sheet */}
      <Sheet open={isPermissionsOpen} onOpenChange={setIsPermissionsOpen}>
          <SheetContent side="bottom" className="rounded-t-[32px] p-6 max-h-[80vh] overflow-y-auto no-scrollbar">
              <SheetHeader className="mb-4">
                  <SheetTitle className="text-xl font-bold flex items-center gap-2">
                      <Shield className="text-primary" style={{ color: primaryColor }} />
                      {t('employees.managePerms', 'Manage Permissions')}
                  </SheetTitle>
                  <p className="text-xs text-muted-foreground">{selectedEmployee?.email}</p>
              </SheetHeader>

              <div className="space-y-1 mb-6">
                  {permissions.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground italic">No permissions modules found</div>
                  ) : (
                    permissions.map((perm) => (
                        <div 
                            key={perm} 
                            className="flex items-center justify-between p-4 bg-muted/50 rounded-2xl mb-2 active:bg-muted transition-colors cursor-pointer"
                            onClick={() => {
                                if (selectedPerms.includes(perm)) {
                                    setSelectedPerms(selectedPerms.filter(p => p !== perm));
                                } else {
                                    setSelectedPerms([...selectedPerms, perm]);
                                }
                            }}
                        >
                            <span className="text-sm font-semibold text-foreground capitalize">{perm.replace(/_/g, ' ')}</span>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${selectedPerms.includes(perm) ? 'bg-primary border-primary' : 'border-muted-foreground'}`} style={{ backgroundColor: selectedPerms.includes(perm) ? primaryColor : undefined, borderColor: selectedPerms.includes(perm) ? primaryColor : undefined }}>
                                {selectedPerms.includes(perm) && <Check size={14} className="text-white" />}
                            </div>
                        </div>
                    ))
                  )}
              </div>

              <Button 
                onClick={handleUpdatePerms}
                disabled={isSubmitting}
                className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg text-white" 
                style={{ backgroundColor: primaryColor }}
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : t('common.update', 'Update Permissions')}
              </Button>
          </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent className="rounded-[28px] max-w-[90vw]">
              <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl font-bold">{t('employees.deleteConfirm', 'Are you absolutely sure?')}</AlertDialogTitle>
                  <AlertDialogDescription>
                      {t('employees.deleteWarning', 'This action cannot be undone. This will permanently remove the employee access to this store.')}
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2">
                  <AlertDialogCancel className="rounded-xl border-border h-12 flex-1">{t('common.cancel', 'Cancel')}</AlertDialogCancel>
                  <Button 
                    variant="destructive" 
                    onClick={handleDelete} 
                    disabled={isSubmitting} 
                    className="rounded-xl h-12 flex-1"
                  >
                      {isSubmitting ? <Loader2 className="animate-spin" /> : t('common.delete', 'Delete')}
                  </Button>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
