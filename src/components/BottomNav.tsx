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
  Wallet
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';

const BottomNav = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: t('common.dashboard') },
    { path: '/income', icon: TrendingUp, label: t('common.income') },
    { path: '/expenses', icon: TrendingDown, label: t('common.expenses') },
    { path: '/budget', icon: PieChart, label: t('common.budget') },
    { path: '/projects', icon: Briefcase, label: t('common.projects') },
    { path: '/goals', icon: Target, label: t('common.goals') },
    { path: '/ai-assistant', icon: Bot, label: t('common.aiAssistant') },
  ];

  // Show only 5 main items on mobile: Dashboard, Income, Expenses, Budget, Projects
  const mainItems = isMobile ? [
    navItems[0], // Dashboard
    navItems[1], // Income
    navItems[2], // Expenses
    navItems[3], // Budget
    navItems[4], // Projects
  ] : [];

  if (!isMobile) return null;

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border/50 safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {mainItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center flex-1 h-full relative group"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-b-full"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <div className={`
                  flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all
                  ${isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground'
                  }
                `}>
                  <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                  <span className="text-[10px] font-medium leading-tight">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
      {/* Spacer for bottom nav */}
      <div className="h-16" />
    </>
  );
};

export default BottomNav;

