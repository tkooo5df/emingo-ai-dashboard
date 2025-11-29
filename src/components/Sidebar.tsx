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
  Sun
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { getTheme, setTheme as saveTheme } from '@/lib/storage';

const Sidebar = () => {
  const location = useLocation();
  const [theme, setThemeState] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const savedTheme = getTheme();
    setThemeState(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setThemeState(newTheme);
    saveTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/income', icon: TrendingUp, label: 'Income' },
    { path: '/expenses', icon: TrendingDown, label: 'Expenses' },
    { path: '/budget', icon: PieChart, label: 'Budget' },
    { path: '/projects', icon: Briefcase, label: 'Projects' },
    { path: '/goals', icon: Target, label: 'Goals' },
    { path: '/ai-assistant', icon: Bot, label: 'AI Assistant' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 glass-card border-r border-border/50 flex flex-col z-50">
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
            <p className="text-xs text-muted-foreground">Financial Dashboard</p>
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
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>
        
        <div className="px-4 py-3 rounded-xl bg-muted/50">
          <p className="text-sm font-medium">Amine</p>
          <p className="text-xs text-muted-foreground">Student & Freelancer</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
