import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  TrendingDown, 
  DollarSign, 
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import StatCard from '@/components/StatCard';
import { 
  calculateMonthlyIncome, 
  calculateMonthlyExpenses, 
  getIncome, 
  getExpenses,
  getProjects,
  getGoals
} from '@/lib/storage';
import { api } from '@/lib/api';
import { getDailyTip } from '@/lib/ai-service';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface Settings {
  currency: string;
}

interface Profile {
  name: string | null;
  age: number | null;
  current_work: string | null;
  description: string | null;
}

const Dashboard = () => {
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [dailyTip, setDailyTip] = useState<string>('');
  const [loadingTip, setLoadingTip] = useState(true);
  const [loading, setLoading] = useState(true);
  const [income, setIncome] = useState<Array<{ amount: number; date: string; category?: string }>>([]);
  const [expenses, setExpenses] = useState<Array<{ amount: number; date: string; category?: string }>>([]);
  const [projects, setProjects] = useState<Array<{ status: string }>>([]);
  const [goals, setGoals] = useState<Array<{ current: number; target: number }>>([]);
  const [accountBalance, setAccountBalance] = useState(0);
  const [currency, setCurrency] = useState('DZD');
  const [userName, setUserName] = useState('User');

  useEffect(() => {
    loadData();
    loadSettings();
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await api.getSettings();
      setCurrency(settings.currency || 'DZD');
    } catch (error) {
      console.error('Error loading settings:', error);
      // Use default currency if settings fail to load
      setCurrency('DZD');
    }
  };

  const loadProfile = async () => {
    try {
      const profile = await api.getProfile();
      if (profile.name) {
        setUserName(profile.name);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [incomeData, expensesData, projectsData, goalsData, incomeTotal, expensesTotal, balance] = await Promise.all([
        getIncome(),
        getExpenses(),
        getProjects(),
        getGoals(),
        calculateMonthlyIncome(),
        calculateMonthlyExpenses(),
        api.getAccountBalance().catch(() => 0), // Fallback to 0 if error
      ]);
      
      setIncome(incomeData);
      setExpenses(expensesData);
      setProjects(projectsData);
      setGoals(goalsData);
      setMonthlyIncome(incomeTotal);
      setMonthlyExpenses(expensesTotal);
      setAccountBalance(balance);
      loadDailyTip();
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error Loading Data',
        description: 'Could not load financial data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDailyTip = async () => {
    try {
      setLoadingTip(true);
      const tip = await getDailyTip();
      setDailyTip(tip);
    } catch (error) {
      console.error('Failed to load daily tip:', error);
      // Don't show error toast for daily tip, just use fallback
      setDailyTip('Track your expenses daily to understand your spending patterns better.');
    } finally {
      setLoadingTip(false);
    }
  };

  // Calculate Net Balance (Monthly Income - Monthly Expenses)
  // Ensure values are numbers
  const incomeNum = typeof monthlyIncome === 'number' ? monthlyIncome : Number(monthlyIncome) || 0;
  const expensesNum = typeof monthlyExpenses === 'number' ? monthlyExpenses : Number(monthlyExpenses) || 0;
  const netBalance = incomeNum - expensesNum;
  
  // Calculate Savings Rate (only if income > 0)
  const savingsRate = incomeNum > 0 
    ? Math.max(0, Math.min(100, Number(((netBalance / incomeNum) * 100).toFixed(1))))
    : 0;

  // Chart data
  const expensesByCategory = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  const expensePieData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name,
    value: Number(value)
  }));

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--success))', 'hsl(var(--warning))'];

  // Recent transactions for line chart
  const incomeChartData = income.slice(0, 7).reverse().map(i => ({
    date: new Date(i.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    amount: i.amount
  }));

  const activeProjects = projects.filter(p => p.status === 'ongoing').length;
  
  const goalsProgress = goals.length > 0 
    ? (goals.reduce((sum, g) => sum + (g.current / g.target), 0) / goals.length * 100).toFixed(0)
    : 0;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl md:text-4xl font-display font-bold mb-1 md:mb-2">
          {t('dashboard.welcome', { name: userName })}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">{t('dashboard.overview')} {new Date().toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : i18n.language === 'fr' ? 'fr-FR' : 'en-US', { month: 'long', year: 'numeric' })}</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6">
        <StatCard
          icon={Wallet}
          label={t('dashboard.monthlyIncome')}
          value={`${incomeNum.toLocaleString()} ${currency}`}
          gradient="success"
        />
        
        <StatCard
          icon={TrendingDown}
          label={t('dashboard.monthlyExpenses')}
          value={`${expensesNum.toLocaleString()} ${currency}`}
          gradient="warning"
        />
        
        <StatCard
          icon={DollarSign}
          label={t('dashboard.netBalance')}
          value={`${netBalance.toLocaleString()} ${currency}`}
          gradient={netBalance >= 0 ? 'primary' : 'warning'}
        >
          <div className="flex items-center gap-2 text-sm">
            {netBalance >= 0 ? (
              <>
                <ArrowUpRight className="w-4 h-4 text-success" />
                <span className="text-success">
                  {incomeNum > 0 ? `${t('dashboard.savings')}: ${savingsRate}%` : t('common.positive')}
                </span>
              </>
            ) : (
              <>
                <ArrowDownRight className="w-4 h-4 text-destructive" />
                <span className="text-destructive">{t('common.deficit')}</span>
              </>
            )}
          </div>
        </StatCard>
        
        <StatCard
          icon={PiggyBank}
          label={t('dashboard.accountBalance')}
          value={`${accountBalance.toLocaleString()} ${currency}`}
          gradient={accountBalance >= 0 ? 'primary' : 'warning'}
        >
          <div className="flex items-center gap-2 text-sm">
            {accountBalance >= 0 ? (
              <ArrowUpRight className="w-4 h-4 text-success" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-destructive" />
            )}
            <span className={accountBalance >= 0 ? 'text-success' : 'text-destructive'}>
              {accountBalance >= 0 ? t('common.positive') : t('common.negative')}
            </span>
          </div>
        </StatCard>
        
        <StatCard
          icon={Sparkles}
          label={t('dashboard.activeProjects')}
          value={activeProjects}
          gradient="accent"
        >
          <div className="text-sm text-muted-foreground">
            {t('dashboard.goalsProgress')}: {goalsProgress}%
          </div>
        </StatCard>
      </div>

      {/* AI Daily Tip Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-xl md:rounded-2xl p-4 md:p-6 gradient-primary relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
            <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <h2 className="text-base md:text-xl font-display font-semibold text-white">{t('dashboard.dailyTip')}</h2>
          </div>
          {loadingTip ? (
            <div className="flex items-center gap-2 text-white/80 text-sm md:text-base">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
              <span>{t('dashboard.loadingInsights')}</span>
            </div>
          ) : (
            <p className="text-white/90 leading-relaxed text-sm md:text-base">{dailyTip}</p>
          )}
        </div>
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Income Trend */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-xl md:rounded-2xl p-4 md:p-6"
        >
          <h3 className="text-lg md:text-xl font-display font-semibold mb-3 md:mb-4">{t('dashboard.incomeTrend')}</h3>
          {incomeChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={incomeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="hsl(var(--success))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--success))', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm px-4">
              <p className="text-center">{t('dashboard.noIncomeData')}</p>
            </div>
          )}
        </motion.div>

        {/* Expense Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-xl md:rounded-2xl p-4 md:p-6"
        >
          <h3 className="text-lg md:text-xl font-display font-semibold mb-3 md:mb-4">{t('dashboard.expenseDistribution')}</h3>
          {expensePieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={expensePieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={60}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {expensePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm px-4">
              <p className="text-center">{t('dashboard.noExpenseData')}</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4"
      >
        <button className="glass-card rounded-xl p-4 md:p-4 text-left active:scale-95 transition-transform touch-manipulation border border-primary/20 min-h-[80px]">
          <h4 className="font-display font-semibold text-primary mb-1 text-sm md:text-base">{t('dashboard.addIncome')}</h4>
          <p className="text-xs md:text-sm text-muted-foreground">{t('dashboard.addIncomeDesc')}</p>
        </button>
        
        <button className="glass-card rounded-xl p-4 md:p-4 text-left active:scale-95 transition-transform touch-manipulation border border-warning/20 min-h-[80px]">
          <h4 className="font-display font-semibold text-warning mb-1 text-sm md:text-base">{t('dashboard.trackExpense')}</h4>
          <p className="text-xs md:text-sm text-muted-foreground">{t('dashboard.trackExpenseDesc')}</p>
        </button>
        
        <button className="glass-card rounded-xl p-4 md:p-4 text-left active:scale-95 transition-transform touch-manipulation border border-accent/20 min-h-[80px]">
          <h4 className="font-display font-semibold text-accent mb-1 text-sm md:text-base">{t('dashboard.askAI')}</h4>
          <p className="text-xs md:text-sm text-muted-foreground">{t('dashboard.askAIDesc')}</p>
        </button>
      </motion.div>
    </div>
  );
};

export default Dashboard;
