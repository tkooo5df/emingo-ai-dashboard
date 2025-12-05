import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { User } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { Loader2, ShieldOff } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface AdminRouteProps {
  children: React.ReactNode;
}

const ADMIN_EMAIL = 'aminekerkarr@gmail.com';

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        if (currentUser && currentUser.email && currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <ShieldOff className="w-16 h-16 mx-auto mb-4 text-destructive" />
          <h2 className="text-2xl font-bold mb-2">{t('admin.accessDenied', 'Access Denied')}</h2>
          <p className="text-muted-foreground mb-6">
            {t('admin.adminOnly', 'This page is only accessible to administrators.')}
          </p>
          <Button onClick={() => navigate('/')} variant="default">
            {t('common.backToHome', 'Back to Home')}
          </Button>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};


