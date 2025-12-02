import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  Briefcase, 
  Target, 
  Bot,
  Moon,
  Sun,
  Menu,
  X,
  Wallet,
  Settings,
  LogOut,
  HandCoins,
  Shield,
  Zap // Added Zap icon for Analyze
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { getTheme, setTheme as saveTheme } from '@/lib/storage';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { signOut, getCurrentUser } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const UserInfo = () => {
  const [userName, setUserName] = useState('User');
  const [userWork, setUserWork] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profile = await api.getProfile();
      if (profile.name) {
        setUserName(profile.name);
      }
      if (profile.current_work) {
        setUserWork(profile.current_work);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  return (
    <div className="px-4 py-3 rounded-xl bg-muted/50">
      <p className="text-sm font-medium">{userName}</p>
      <p className="text-xs text-muted-foreground">{userWork || 'User'}</p>
    </div>
  );
};

const Sidebar = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [theme, setThemeState] = useState<'light' | 'dark'>('dark');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const savedTheme = getTheme();
    setThemeState(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    
    // Check if user is admin
    const checkAdmin = async () => {
      try {
        const user = await api.getCurrentUser();
        if (user && user.email && user.email.toLowerCase() === 'aminekerkarr@gmail.com') {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };
    checkAdmin();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setThemeState(newTheme);
    saveTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: t('auth.loggedOut'),
        description: t('auth.loggedOutDescription'),
      });
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: 'Error',
        description: 'Failed to log out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: t('common.dashboard') },
    { path: '/account', icon: Wallet, label: t('common.account') },
    { path: '/income', icon: TrendingUp, label: t('common.income') },
    { path: '/expenses', icon: TrendingDown, label: t('common.expenses') },
    { path: '/debts', icon: HandCoins, label: t('common.debts') },
    { path: '/budget', icon: PieChart, label: t('common.budget') },
    { path: '/projects', icon: Briefcase, label: t('common.projects') },
    { path: '/goals', icon: Target, label: t('common.goals') },
    { path: '/analyze', icon: Zap, label: t('common.analyze') }, // Added Analyze link
    { path: '/ai-assistant', icon: Bot, label: t('common.aiAssistant') },
    { path: '/settings', icon: Settings, label: t('common.settings') },
    ...(isAdmin ? [{ path: '/admin', icon: Shield, label: t('common.admin', 'Admin') }] : []),
  ];

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-border/50">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <span className="text-xl font-display font-bold text-white">E</span>
          </div>
          <div>
            <h1 className="text-xl font-display font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              EMINGO
            </h1>
            <p className="text-xs text-muted-foreground">{t('sidebar.financialDashboard')}</p>
          </div>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={item.path}
                onClick={() => isMobile && setMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                    : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Theme Toggle & User Info */}
      <div className="p-4 border-t border-border/50 space-y-3">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-muted hover:bg-accent transition-colors"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
          <span className="font-medium">
            {theme === 'dark' ? t('sidebar.lightMode') : t('sidebar.darkMode')}
          </span>
        </button>
        
        <UserInfo />
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">{t('common.logout')}</span>
        </button>
      </div>
    </>
  );

  // Mobile: Hamburger menu
  if (isMobile) {
    return (
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <div className="fixed top-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border/50 safe-area-inset-top">
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <span className="text-lg font-display font-bold text-white">E</span>
              </div>
              <div>
                <h1 className="text-lg font-display font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  EMINGO
                </h1>
              </div>
            </div>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
          </div>
        </div>
        <SheetContent side="left" className="w-72 p-0">
          <div className="flex flex-col h-full glass-card">
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Fixed sidebar
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 glass-card border-r border-border/50 flex flex-col z-50">
      <SidebarContent />
    </aside>
  );
};

export default Sidebar;
