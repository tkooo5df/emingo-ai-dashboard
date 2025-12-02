import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  RefreshCw,
  Shield,
  Mail,
  Calendar,
  User as UserIcon
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

const AdminDashboard = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getAdminData();
      // Extract only user data from response
      const usersList = (data.users || []).map((u: {
        id: string;
        email: string;
        name: string | null;
        avatar_url: string | null;
        created_at: string;
        updated_at: string;
      }) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        avatar_url: u.avatar_url,
        created_at: u.created_at,
        updated_at: u.updated_at
      }));
      setUsers(usersList);
      
      // Show warning if counts don't match
      if (data.total && data.total !== usersList.length) {
        toast({
          title: t('admin.warning', 'Warning'),
          description: `${usersList.length} ${t('admin.usersLoaded', 'users loaded')} (${data.total} ${t('admin.totalInDB', 'total in database')})`,
          variant: 'default',
        });
      } else if (usersList.length > 0) {
        toast({
          title: t('common.success', 'Success'),
          description: `${usersList.length} ${t('admin.usersLoaded', 'users loaded')}`,
        });
      }
    } catch (error: unknown) {
      console.error('❌ [AdminDashboard] Error loading users:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error('❌ [AdminDashboard] Error details:', {
        message: errorMessage,
        stack: errorStack
      });
      toast({
        title: t('common.error', 'Error'),
        description: errorMessage || t('admin.failedToLoad', 'Failed to load users'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            {t('admin.title', 'Admin Dashboard')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('admin.subtitle', 'View all users from database')}
          </p>
        </div>
        <Button onClick={loadUsers} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {t('common.refresh', 'Refresh')}
        </Button>
      </div>

      {/* Users List */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">
            {t('admin.users', 'Users')} ({users.length})
          </h2>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <UserIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{t('admin.noUsers', 'No users found')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {user.avatar_url ? (
                      <img 
                        src={user.avatar_url} 
                        alt={user.name || user.email} 
                        className="w-12 h-12 rounded-full object-cover" 
                      />
                    ) : (
                      <Mail className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{user.name || t('admin.noName', 'No Name')}</h3>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(user.created_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminDashboard;
