import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { handleOAuthCallback, getCurrentUser } from '@/lib/auth';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const processAuthCallback = async () => {
      try {
        // Get authorization code from URL
        const code = searchParams.get('code');
        
        if (!code) {
          console.error('No authorization code found');
          toast({
            title: 'Sign In Failed',
            description: 'No authorization code found.',
            variant: 'destructive',
          });
          navigate('/login');
          return;
        }

        // Exchange code for token
        const { user } = await handleOAuthCallback(code);
        
        toast({
          title: 'Sign In Successful',
          description: `Welcome, ${user?.name || user?.email}!`,
        });
        navigate('/');
      } catch (error: any) {
        console.error('Auth callback error:', error);
        toast({
          title: 'Sign In Failed',
          description: error.message || 'Failed to complete authentication. Please try again.',
          variant: 'destructive',
        });
        navigate('/login');
      }
    };

    processAuthCallback();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <Card className="glass-card p-8 text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </Card>
    </div>
  );
};

export default AuthCallback;

