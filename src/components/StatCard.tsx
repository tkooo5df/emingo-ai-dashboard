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
      className="glass-card rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${gradientClass}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
            trend.isPositive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
          }`}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </div>
        )}
      </div>
      
      <div>
        <p className="text-sm text-muted-foreground mb-1">{label}</p>
        <p className="text-3xl font-display font-bold text-foreground">{value}</p>
      </div>
      
      {children && (
        <div className="mt-4 pt-4 border-t border-border/50">
          {children}
        </div>
      )}
    </motion.div>
  );
};

export default StatCard;
