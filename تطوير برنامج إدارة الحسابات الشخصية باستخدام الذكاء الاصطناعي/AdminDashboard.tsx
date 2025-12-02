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

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('🔄 [AdminDashboard] Loading users...');
      const data = await api.getAdminData();
      console.log('📥 [AdminDashboard] Response received:', {
        usersCount: data.users?.length || 0,
        total: data.total,
        returned: data.returned
      });
      
      // Extract only user data from response
      const usersList = (data.users || []).map((u: any) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        avatar_url: u.avatar_url,
        created_at: u.created_at,
        updated_at: u.updated_at
      }));
      
      console.log('✅ [AdminDashboard] Processed users:', usersList.length);
      setUsers(usersList);
      
      // Show warning if counts don't match
      if (data.total && data.total !== usersList.length) {
        console.warn(`⚠️ [AdminDashboard] Mismatch: Total ${data.total} but showing ${usersList.length}`);
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
    } catch (error: any) {
      console.error('❌ [AdminDashboard] Error loading users:', error);
      console.error('❌ [AdminDashboard] Error details:', {
        message: error.message,
        stack: error.stack
      });
      toast({
        title: t('common.error', 'Error'),
        description: error.message || t('admin.failedToLoad', 'Failed to load users'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">