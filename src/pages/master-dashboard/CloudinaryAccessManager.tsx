import { useState, useEffect } from 'react';
import { Cloud, CheckCircle, XCircle, Search, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { coreApi } from '@/lib/api';
import { getAdminApiKeySync } from '@/lib/admin-config';

interface CloudinaryAccessManagerProps {
  adminApiKey?: string;
}

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  hasCloudinaryAccess: boolean;
  grantedAt?: string;
  grantedBy?: string;
}

export default function CloudinaryAccessManager({ adminApiKey }: CloudinaryAccessManagerProps) {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  
  // Use prop first, fallback to cached key
  const effectiveApiKey = adminApiKey || getAdminApiKeySync();

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await coreApi.get('/admin/master/cloudinary-access', {
        requireAuth: true,
        adminApiKey: effectiveApiKey,
      });
      setUsers(response.users || []);
    } catch (error: unknown) {
      console.error('Failed to load users:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: (error as Error).message || 'Failed to load users',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleUser = (userId: string) => {
    setSelectedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    if (selectedUsers.size === 0) {
      toast({
        variant: 'destructive',
        title: 'No Selection',
        description: 'Please select at least one user',
      });
      return;
    }

    try {
      setSaving(true);
      const userIds = Array.from(selectedUsers);
      
      // Grant access to selected users
      await coreApi.post(
        '/admin/master/cloudinary-access',
        { userIds },
        {
          requireAuth: true,
          adminApiKey: effectiveApiKey,
        }
      );

      toast({
        title: 'Success',
        description: `Cloudinary access granted to ${userIds.length} user(s)`,
      });

      // Reload users
      await loadUsers();
      setSelectedUsers(new Set());
    } catch (error: unknown) {
      console.error('Failed to update Cloudinary access:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: (error as Error).message || 'Failed to update Cloudinary access',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (userId: string) => {
    try {
      setSaving(true);
      await coreApi.delete(
        '/admin/master/cloudinary-access',
        {
          requireAuth: true,
          adminApiKey: effectiveApiKey,
          data: { userIds: [userId] },
        }
      );

      toast({
        title: 'Success',
        description: 'Cloudinary access revoked',
      });

      await loadUsers();
    } catch (error: unknown) {
      console.error('Failed to revoke Cloudinary access:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: (error as Error).message || 'Failed to revoke Cloudinary access',
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Cloud className="w-6 h-6" />
            Cloudinary Access Management
          </h2>
          <p className="text-muted-foreground mt-1">
            Select users who can see and use the Cloudinary button
          </p>
        </div>
        {selectedUsers.size > 0 && (
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Grant Access ({selectedUsers.size})
              </>
            )}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={filteredUsers.length > 0 && filteredUsers.every((u) => selectedUsers.has(u.id))}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedUsers(new Set(filteredUsers.map((u) => u.id)));
                    } else {
                      setSelectedUsers(new Set());
                    }
                  }}
                />
              </TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Cloudinary Access</TableHead>
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
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.has(user.id)}
                      onCheckedChange={() => handleToggleUser(user.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.name || '-'}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    {user.hasCloudinaryAccess ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Granted</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <XCircle className="w-4 h-4" />
                        <span className="text-sm">Not Granted</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.hasCloudinaryAccess && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRevoke(user.id)}
                        disabled={saving}
                      >
                        Revoke
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

