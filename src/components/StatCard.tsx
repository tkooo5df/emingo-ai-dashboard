import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  gradient?: 'primary' | 'accent' | 'success' | 'warning';
  children?: ReactNode;
}

const StatCard = ({ icon: Icon, label, value, trend, gradient = 'primary', children }: StatCardProps) => {
  const gradientClass = gradient === 'primary' ? 'gradient-primary' :
                       gradient === 'accent' ? 'gradient-accent' :
                       gradient === 'success' ? 'gradient-success' :
                       'bg-warning';

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      className="glass-card rounded-xl md:rounded-2xl p-4 md:p-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 active:scale-95 touch-manipulation"
    >
      <div className="flex items-start justify-between mb-2 md:mb-4">
        <div className={`p-1.5 md:p-3 rounded-lg md:rounded-xl ${gradientClass}`}>
          <Icon className="w-4 h-4 md:w-6 md:h-6 text-white" />
        </div>
        {trend && (
          <div className={`px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-semibold ${
            trend.isPositive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
          }`}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </div>
        )}
      </div>
      
      <div>
        <p className="text-[10px] md:text-sm text-muted-foreground mb-1">{label}</p>
        <p className="text-lg md:text-3xl font-display font-bold text-foreground break-words">{value}</p>
      </div>
      
      {children && (
        <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-border/50">
          {children}
        </div>
      )}
    </motion.div>
  );
};

export default StatCard;
