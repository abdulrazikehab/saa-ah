import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { walletService } from '@/services/wallet.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Wallet, User, DollarSign } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface StaffUser {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role?: string;
}

export default function GiveBalanceToStaff() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffUser | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Check if user is CUSTOMER (customer can give balance to their employees)
  // Also allow STAFF to see this (they might want to see who has balance)
  const canGiveBalance = user?.role === 'CUSTOMER' || user?.type === 'customer';

  useEffect(() => {
    if (canGiveBalance) {
      loadStaffUsers();
    }
  }, [canGiveBalance]);

  const loadStaffUsers = async () => {
    try {
      setLoading(true);
      // Use wallet service endpoint for customers to get staff list
      const response = await walletService.getStaffListForCustomer();
      const staffData = response.data || [];
      setStaffUsers(staffData);
    } catch (error) {
      console.error('Failed to load staff users:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحميل قائمة الموظفين',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGiveBalance = async () => {
    if (!selectedStaff || !amount || Number(amount) <= 0) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال مبلغ صحيح',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      await walletService.giveBalanceToStaff({
        staffId: selectedStaff.id,
        amount: Number(amount),
        description: description || `Balance added by customer`,
        descriptionAr: description || `تم إضافة رصيد بواسطة عميل`,
      });

      toast({
        title: 'نجح',
        description: `تم إضافة ${amount} ر.س إلى رصيد ${selectedStaff.email}`,
      });

      setIsDialogOpen(false);
      setSelectedStaff(null);
      setAmount('');
      setDescription('');
    } catch (error: any) {
      console.error('Failed to give balance:', error);
      toast({
        title: 'خطأ',
        description: error?.message || 'فشل إضافة الرصيد',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStaff = staffUsers.filter((staff) =>
    staff.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!canGiveBalance) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          إضافة رصيد للموظفين
        </CardTitle>
        <CardDescription>
          أضف رصيداً إلى حساب موظف
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث عن موظف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'لا توجد نتائج' : 'لا يوجد موظفين'}
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredStaff.map((staff) => (
                <div
                  key={staff.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => {
                    setSelectedStaff(staff);
                    setIsDialogOpen(true);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {staff.name || staff.email}
                      </p>
                      <p className="text-sm text-muted-foreground">{staff.email}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <DollarSign className="h-4 w-4 ml-2" />
                    إضافة رصيد
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة رصيد</DialogTitle>
              <DialogDescription>
                إضافة رصيد إلى حساب {selectedStaff?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">المبلغ (ر.س)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">الوصف (اختياري)</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="وصف العملية..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleGiveBalance} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري الإضافة...
                  </>
                ) : (
                  'إضافة الرصيد'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

