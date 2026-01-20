import { useState, useEffect } from 'react';
import { coreApi } from '@/lib/api';
import { Transaction } from '@/services/transaction.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Filter,
  Download,
  Printer,
  ArrowDownRight,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/currency-utils';
import { getAdminApiKey } from '@/lib/admin-config';

export default function TransactionManager() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    loadTransactions();
  }, [page, statusFilter]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const params: any = {
        limit,
        offset: (page - 1) * limit,
      };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      
      // We need a master admin endpoint for all transactions
      // For now, we'll use the existing one but we might need to adjust the backend
      const response = await coreApi.get('/admin/master/transactions', { 
        requireAuth: true, 
        adminApiKey: getAdminApiKey(),
        params 
      });
      
      setTransactions(response.transactions);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load transactions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (transaction: Transaction) => {
    if (!confirm('Are you sure you want to refund this transaction? This will reverse the payment and cannot be undone.')) {
      return;
    }

    try {
      setRefundingId(transaction.id);
      
      // Use the master admin refund endpoint
      await coreApi.post(`/admin/master/transactions/${transaction.id}/refund`, {}, { 
        requireAuth: true, 
        adminApiKey: getAdminApiKey() 
      });
      
      setTransactions(prev => prev.map(t => 
        t.id === transaction.id 
          ? { ...t, status: 'REFUNDED' }
          : t
      ));
      
      toast({
        title: 'Success',
        description: `Transaction ${transaction.orderNumber || transaction.id} has been refunded`,
      });
    } catch (error: any) {
      toast({
        title: 'Refund Failed',
        description: error.response?.data?.message || 'Failed to refund transaction',
        variant: 'destructive',
      });
    } finally {
      setRefundingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pending</Badge>;
      case 'REFUNDED':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Refunded</Badge>;
      case 'FAILED':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Platform Transactions</h2>
          <p className="text-gray-400">Monitor and manage all transactions across the platform</p>
        </div>
        <Button variant="outline" className="gap-2 border-slate-700 text-white hover:bg-slate-800">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by order number or ID..."
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-purple-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] bg-slate-950 border-slate-800 text-white">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-950 border-slate-800 text-white">
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="REFUNDED">Refunded</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-slate-800 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-950">
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">Order #</TableHead>
                  <TableHead className="text-slate-400">Tenant</TableHead>
                  <TableHead className="text-slate-400">Date</TableHead>
                  <TableHead className="text-slate-400">Amount</TableHead>
                  <TableHead className="text-slate-400">Method</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-500" />
                    </TableCell>
                  </TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.id} className="border-slate-800 hover:bg-slate-800/30">
                      <TableCell className="font-medium text-white">
                        {transaction.orderNumber || transaction.id.substring(0, 8)}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {/* Tenant ID or name if available */}
                        <span className="text-xs font-mono opacity-50">{transaction.tenantId}</span>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {format(new Date(transaction.createdAt), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="text-white font-semibold">
                        {formatCurrency(transaction.amount, transaction.currency || 'SAR')}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-3 w-3 opacity-50" />
                          {transaction.paymentMethodType || transaction.paymentProvider}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(transaction.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRefund(transaction)}
                          disabled={refundingId === transaction.id || transaction.status === 'REFUNDED' || transaction.status !== 'COMPLETED'}
                          className={`gap-1 ${transaction.status === 'REFUNDED' ? 'text-slate-500' : 'text-red-400 hover:text-red-300 hover:bg-red-500/10'}`}
                        >
                          <ArrowDownRight className={`h-4 w-4 ${refundingId === transaction.id ? 'animate-pulse' : ''}`} />
                          {transaction.status === 'REFUNDED' ? 'Refunded' : refundingId === transaction.id ? 'Refunding...' : 'Refund'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="border-slate-800 text-white"
              >
                Previous
              </Button>
              <div className="text-slate-400 text-sm">
                Page {page} of {Math.ceil(total / limit)}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(total / limit)}
                className="border-slate-800 text-white"
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper Select components (simplified for this view)
function Select({ children, value, onValueChange }: any) {
  return <div className="relative inline-block w-full">{children}</div>;
}

function SelectTrigger({ children, className }: any) {
  return (
    <button className={`flex items-center justify-between px-3 py-2 rounded-md border text-sm ${className}`}>
      {children}
    </button>
  );
}

function SelectValue({ placeholder }: any) {
  return <span>{placeholder}</span>;
}

function SelectContent({ children, className }: any) {
  return <div className={`absolute z-50 mt-1 w-full rounded-md shadow-lg border ${className}`}>{children}</div>;
}

function SelectItem({ children, value }: any) {
  return <div className="px-3 py-2 hover:bg-slate-800 cursor-pointer text-sm">{children}</div>;
}
