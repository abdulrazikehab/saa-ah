import { useState, useEffect, useCallback } from 'react';
import { authApi } from '@/lib/api';
import { 
  Users, 
  Edit,
  Search,
  Loader2,
  Building2,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { getAdminApiKey } from '@/lib/admin-config';

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  tenantId?: string;
  tenant?: {
    name: string;
    subdomain: string;
  };
  marketLimit?: number;
  currentMarkets?: number;
}

export default function UserManagement({ adminApiKey }: { adminApiKey?: string }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [marketLimit, setMarketLimit] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const loadUsers = useCallback(async () => {
    if (!adminApiKey) return;
    try {
      setLoading(true);
      // Users endpoint is at /users (not /auth/users) since authApi already includes authUrl
      const response = await authApi.get('/users', { 
        requireAuth: true, 
        adminApiKey: adminApiKey 
      });
      setUsers(response.users || []);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load users'
      });
    } finally {
      setLoading(false);
    }
  }, [toast, adminApiKey]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleEditLimit = (user: User) => {
    setEditingUser(user);
    setMarketLimit(user.marketLimit || 1);
    setIsDialogOpen(true);
  };

  const handleUpdateLimit = async () => {
    if (!editingUser) return;
    
    if (marketLimit < 1) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Market limit must be at least 1'
      });
      return;
    }

    try {
      await authApi.put(`/users/${editingUser.id}/market-limit`, { limit: marketLimit }, { 
        requireAuth: true, 
        adminApiKey: adminApiKey 
      });
      toast({
        title: 'Success',
        description: 'Market limit updated successfully'
      });
      setIsDialogOpen(false);
      setEditingUser(null);
      loadUsers();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update market limit'
      });
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">Manage user market limits</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users by email or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Current Market</TableHead>
              <TableHead>Market Limit</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.name || '-'}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    {user.tenant ? (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>{user.tenant.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No market</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{user.marketLimit || 1}</span>
                      {user.currentMarkets !== undefined && (
                        <span className="text-sm text-muted-foreground">
                          ({user.currentMarkets} used)
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditLimit(user)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Limit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Market Limit</DialogTitle>
            <DialogDescription>
              Set the maximum number of markets this user can create.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="limit">Market Limit</Label>
              <Input
                id="limit"
                type="number"
                min="1"
                value={marketLimit}
                onChange={(e) => setMarketLimit(parseInt(e.target.value) || 1)}
              />
              <p className="text-sm text-muted-foreground">
                Maximum number of markets this user can create
              </p>
            </div>

            {editingUser && editingUser.currentMarkets !== undefined && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    Current Usage
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-300">
                    User currently has {editingUser.currentMarkets} market(s). 
                    {editingUser.currentMarkets > marketLimit && (
                      <span className="font-semibold"> Setting limit below current usage may cause issues.</span>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateLimit}>
              Update Limit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

