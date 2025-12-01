import { useEffect, useState } from 'react';
import { getCurrentUser, onAuthStateChange } from '@/lib/auth';
import { User } from '@/lib/auth';
import Login from '@/pages/Login';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import i18n from '@/lib/i18n';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial auth state
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        // Load user language from database (priority over localStorage)
        if (currentUser) {
          console.log('🌐 [ProtectedRoute] User authenticated, loading language preferences...');
          const currentI18nLang = i18n.language;
          const currentLocalStorageLang = localStorage.getItem('i18nextLng');
          
          try {
            const settings = await api.getSettings();
            console.log('🌐 [ProtectedRoute] Settings loaded from database:', {
              language: settings.language,
              currentI18n: currentI18nLang,
              currentLocalStorage: currentLocalStorageLang
            });
            
            if (settings.language) {
              // Always use language from database, even if different from localStorage
              console.log('🌐 [ProtectedRoute] Using language from database:', settings.language);
              if (settings.language !== currentI18nLang) {
                console.log('🌐 [ProtectedRoute] Changing i18n language from', currentI18nLang, 'to', settings.language);
                await i18n.changeLanguage(settings.language);
                localStorage.setItem('i18nextLng', settings.language);
                // Update document direction
                document.documentElement.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
                document.documentElement.lang = settings.language;
                console.log('🌐 [ProtectedRoute] Language updated successfully:', {
                  i18n: i18n.language,
                  localStorage: localStorage.getItem('i18nextLng'),
                  documentDir: document.documentElement.dir,
                  documentLang: document.documentElement.lang
                });
              } else {
                console.log('🌐 [ProtectedRoute] Language already matches, no change needed');
              }
            } else {
              // If no language in database, use English as default for new users
              const defaultLang = 'en';
              console.log('🌐 [ProtectedRoute] No language in database, using default English for new user');
              if (defaultLang !== currentI18nLang) {
                console.log('🌐 [ProtectedRoute] Changing i18n language from', currentI18nLang, 'to', defaultLang);
                await i18n.changeLanguage(defaultLang);
                localStorage.setItem('i18nextLng', defaultLang);
                document.documentElement.dir = 'ltr';
                document.documentElement.lang = defaultLang;
                console.log('🌐 [ProtectedRoute] Language set to default English');
              } else {
                console.log('🌐 [ProtectedRoute] Language already matches default English');
              }
            }
          } catch (error) {
            console.error('❌ [ProtectedRoute] Error loading user language from database:', error);
            // Fallback to English as default if database fails
            const defaultLang = 'en';
            console.log('🌐 [ProtectedRoute] Falling back to default English');
            if (defaultLang !== currentI18nLang) {
              await i18n.changeLanguage(defaultLang);
              localStorage.setItem('i18nextLng', defaultLang);
              document.documentElement.dir = 'ltr';
              document.documentElement.lang = defaultLang;
              console.log('🌐 [ProtectedRoute] Language updated to default English (fallback)');
            }
          }
        } else {
          console.log('🌐 [ProtectedRoute] No user authenticated, skipping language load');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen to auth state changes
    const subscription = onAuthStateChange((newUser) => {
      setUser(newUser);
      setLoading(false);
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <>{children}</>;
};

