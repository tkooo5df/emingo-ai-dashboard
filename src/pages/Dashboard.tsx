import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  TrendingDown, 
  DollarSign, 
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  Plus,
  Minus,
  Settings
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
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';

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
  const [debtsGiven, setDebtsGiven] = useState(0);
  const [debtsReceived, setDebtsReceived] = useState(0);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSubtractDialog, setShowSubtractDialog] = useState(false);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income');
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string; type: 'ccp' | 'cash' | 'creditcard' }>>([]);
  const [incomeCategories, setIncomeCategories] = useState<Array<{ id: string; name: string; icon: string }>>([]);
  const [expenseCategories, setExpenseCategories] = useState<Array<{ id: string; name: string; icon: string }>>([]);
  const [formData, setFormData] = useState({
    amount: '',
    name: '',
    source: '',
    category: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    account_id: '',
    account_type: '' as 'ccp' | 'cash' | 'creditcard' | '',
    note: '',
    description: ''
  });

  useEffect(() => {
    loadData();
    loadSettings();
    loadProfile();
    loadDebts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await api.getSettings();
      setCurrency(settings.currency || 'DZD');
      setAccounts(settings.accounts || []);
      const allCategories = settings.custom_categories || [];
      setIncomeCategories(allCategories.filter((cat: { type?: string }) => !cat.type || cat.type === 'income' || cat.type === 'both'));
      setExpenseCategories(allCategories.filter((cat: { type?: string }) => !cat.type || cat.type === 'expense' || cat.type === 'both'));
    } catch (error) {
      console.error('Error loading settings:', error);
      setCurrency('DZD');
    }
  };

  const loadDebts = async () => {
    try {
      // Try to load debts if API methods exist
      try {
        const [given, received] = await Promise.all([
          (api as any).getTotalDebtsGiven?.() || Promise.resolve(0),
          (api as any).getTotalDebtsReceived?.() || Promise.resolve(0)
        ]);
        setDebtsGiven(given || 0);
        setDebtsReceived(received || 0);
      } catch {
        setDebtsGiven(0);
        setDebtsReceived(0);
      }
    } catch (error) {
      console.error('Error loading debts:', error);
      setDebtsGiven(0);
      setDebtsReceived(0);
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
        api.getAccountBalance().catch(() => 0),
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

  // Generate data for all days of current month
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Create map of income by day
  const incomeByDay = new Map<number, number>();
  income.forEach(i => {
    const date = new Date(i.date);
    if (date.getFullYear() === currentYear && date.getMonth() === currentMonth) {
      const day = date.getDate();
      incomeByDay.set(day, (incomeByDay.get(day) || 0) + i.amount);
    }
  });

  // Create map of expenses by day
  const expensesByDay = new Map<number, number>();
  expenses.forEach(e => {
    const date = new Date(e.date);
    if (date.getFullYear() === currentYear && date.getMonth() === currentMonth) {
      const day = date.getDate();
      expensesByDay.set(day, (expensesByDay.get(day) || 0) + e.amount);
    }
  });

  // Generate chart data for all days of month
  const incomeChartData = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    return {
      date: day.toString(),
      amount: incomeByDay.get(day) || 0
    };
  });

  const expenseChartData = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    return {
      date: day.toString(),
      amount: expensesByDay.get(day) || 0
    };
  });

  const activeProjects = projects.filter(p => p.status === 'ongoing').length;
  
  const goalsProgress = goals.length > 0 
    ? (goals.reduce((sum, g) => sum + (g.current / g.target), 0) / goals.length * 100).toFixed(0)
    : 0;

  return (
    <div className="space-y-3 md:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-xl md:text-4xl font-display font-bold mb-1 md:mb-2">
          {t('dashboard.welcome', { name: userName })}
        </h1>
        <p className="text-xs md:text-base text-muted-foreground">{t('dashboard.overview')} {new Date().toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : i18n.language === 'fr' ? 'fr-FR' : 'en-US', { month: 'long', year: 'numeric' })}</p>
      </motion.div>

      {/* Account Circle */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative mb-6"
      >
        <div className="relative w-48 h-48 md:w-64 md:h-64 mx-auto">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 240 240">
            <circle
              cx="120"
              cy="120"
              r="110"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="8"
            />
            <motion.circle
              cx="120"
              cy="120"
              r="110"
              fill="none"
              stroke={accountBalance >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))"}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 110}`}
              strokeDashoffset={0}
              initial={{ strokeDashoffset: 2 * Math.PI * 110 }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Wallet className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground mb-2" />
            {loading ? (
              <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-2 border-primary border-t-transparent" />
            ) : (
              <>
                <motion.div
                  key={accountBalance}
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-2xl md:text-3xl font-display font-bold text-center px-2"
                >
                  {accountBalance.toLocaleString()} {currency}
                </motion.div>
                <p className="text-xs text-muted-foreground mt-1">{t('dashboard.accountBalance')}</p>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 md:gap-4 justify-center items-center mt-4">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => {
                setTransactionType('income');
                setFormData({
                  ...formData,
                  date: format(new Date(), 'yyyy-MM-dd'),
                });
                setShowAddDialog(true);
              }}
              size="lg"
              className="gradient-success text-white h-10 w-10 md:h-12 md:w-12 rounded-full shadow-lg"
            >
              <Plus className="w-4 h-4 md:w-6 md:h-6" />
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => {
                setTransactionType('expense');
                setFormData({
                  ...formData,
                  date: format(new Date(), 'yyyy-MM-dd'),
                });
                setShowSubtractDialog(true);
              }}
              size="lg"
              className="bg-destructive text-white h-10 w-10 md:h-12 md:w-12 rounded-full shadow-lg"
            >
              <Minus className="w-4 h-4 md:w-6 md:h-6" />
            </Button>
          </motion.div>
        </div>
      </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-6">
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
          <h3 className="text-base md:text-xl font-display font-semibold mb-3 md:mb-4">{t('dashboard.incomeTrend')}</h3>
          {incomeChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={incomeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))" 
                  tick={{ fontSize: 10 }}
                  interval={Math.floor(daysInMonth / 7)}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="hsl(var(--success))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--success))', strokeWidth: 1, r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm px-4">
              <p className="text-center">{t('dashboard.noIncomeData')}</p>
            </div>
          )}
        </motion.div>

        {/* Expense Trend */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-xl md:rounded-2xl p-4 md:p-6"
        >
          <h3 className="text-base md:text-xl font-display font-semibold mb-3 md:mb-4">{t('dashboard.expenseTrend', 'Expense Trend')}</h3>
          {expenseChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={expenseChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))" 
                  tick={{ fontSize: 10 }}
                  interval={Math.floor(daysInMonth / 7)}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--destructive))', strokeWidth: 1, r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm px-4">
              <p className="text-center">{t('dashboard.noExpenseData')}</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Expense Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card rounded-xl md:rounded-2xl p-4 md:p-6"
      >
        <h3 className="text-base md:text-xl font-display font-semibold mb-3 md:mb-4">{t('dashboard.expenseDistribution')}</h3>
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

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('account.addIncome')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">{t('common.amount')} *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="source">{t('account.source')} *</Label>
              <Input
                id="source"
                placeholder="e.g., Client Name, Freelancing"
                value={formData.source || formData.name}
                onChange={(e) => setFormData({ ...formData, source: e.target.value, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="category">{t('common.category')}</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={t('income.selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  {incomeCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date">{t('common.date')}</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="account">{t('account.accountType')}</Label>
              <Select 
                value={formData.account_id} 
                onValueChange={(value) => {
                  const selectedAccount = accounts.find(a => a.id === value);
                  setFormData({ 
                    ...formData, 
                    account_id: value,
                    account_type: selectedAccount?.type || ''
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('account.selectAccount')} />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description">{t('common.description')}</Label>
              <Textarea
                id="description"
                placeholder={t('account.additionalNotes')}
                value={formData.description || formData.note}
                onChange={(e) => setFormData({ ...formData, description: e.target.value, note: e.target.value })}
                rows={3}
              />
            </div>
            <Button 
              onClick={async () => {
                if (!formData.amount || (!formData.name && !formData.source)) {
                  toast({
                    title: t('common.error'),
                    description: t('account.required'),
                    variant: 'destructive',
                  });
                  return;
                }
                try {
                  const amount = parseFloat(formData.amount);
                  const sourceOrName = formData.source || formData.name;
                  const selectedAccount = accounts.find(a => a.id === formData.account_id);
                  await api.addAccountTransaction({
                    type: 'income',
                    amount,
                    name: sourceOrName,
                    category: formData.category || null,
                    date: formData.date,
                    account_type: selectedAccount?.type || null,
                    note: formData.note || null
                  });
                  await loadData();
                  await loadDebts();
                  setShowAddDialog(false);
                  setFormData({
                    amount: '',
                    name: '',
                    source: '',
                    category: '',
                    date: format(new Date(), 'yyyy-MM-dd'),
                    account_id: '',
                    account_type: '',
                    note: '',
                    description: ''
                  });
                  toast({
                    title: t('success.saved'),
                    description: t('account.addIncome') + ` ${amount} ${currency}`,
                  });
                } catch (error) {
                  toast({
                    title: 'Error',
                    description: 'Could not save transaction',
                    variant: 'destructive',
                  });
                }
              }} 
              className="w-full gradient-success"
            >
              {t('account.addIncome')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Subtract Dialog */}
      <Dialog open={showSubtractDialog} onOpenChange={setShowSubtractDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('account.addExpense')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="expense-amount">{t('common.amount')} *</Label>
              <Input
                id="expense-amount"
                type="number"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="expense-description">{t('common.description')} *</Label>
              <Input
                id="expense-description"
                placeholder="e.g., Coffee, Gas, etc..."
                value={formData.description || formData.name}
                onChange={(e) => setFormData({ ...formData, description: e.target.value, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="expense-category">{t('common.category')}</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={t('expenses.selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="expense-date">{t('common.date')}</Label>
              <Input
                id="expense-date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="expense-account">{t('account.accountType')}</Label>
              <Select 
                value={formData.account_id} 
                onValueChange={(value) => {
                  const selectedAccount = accounts.find(a => a.id === value);
                  setFormData({ 
                    ...formData, 
                    account_id: value,
                    account_type: selectedAccount?.type || ''
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('account.selectAccount')} />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="expense-note">{t('account.notes')}</Label>
              <Textarea
                id="expense-note"
                placeholder={t('account.additionalNotes')}
                value={formData.note || formData.description}
                onChange={(e) => setFormData({ ...formData, note: e.target.value, description: e.target.value })}
                rows={3}
              />
            </div>
            <Button 
              onClick={async () => {
                if (!formData.amount || (!formData.name && !formData.description)) {
                  toast({
                    title: t('common.error'),
                    description: t('account.required'),
                    variant: 'destructive',
                  });
                  return;
                }
                try {
                  const amount = parseFloat(formData.amount);
                  const selectedAccount = accounts.find(a => a.id === formData.account_id);
                  await api.addAccountTransaction({
                    type: 'expense',
                    amount,
                    name: formData.description || formData.name,
                    category: formData.category || null,
                    date: formData.date,
                    account_type: selectedAccount?.type || null,
                    note: formData.note || null
                  });
                  await loadData();
                  await loadDebts();
                  setShowSubtractDialog(false);
                  setFormData({
                    amount: '',
                    name: '',
                    source: '',
                    category: '',
                    date: format(new Date(), 'yyyy-MM-dd'),
                    account_id: '',
                    account_type: '',
                    note: '',
                    description: ''
                  });
                  toast({
                    title: t('success.saved'),
                    description: t('account.addExpense') + ` ${amount} ${currency}`,
                  });
                } catch (error) {
                  toast({
                    title: 'Error',
                    description: 'Could not save transaction',
                    variant: 'destructive',
                  });
                }
              }} 
              className="w-full bg-destructive text-white"
            >
              {t('account.addExpense')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
