import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  TrendingDown, 
  DollarSign, 
  Sparkles,
  ArrowUpRight,
  ArrowDownRight
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
import { getDailyTip } from '@/lib/ai-service';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const { toast } = useToast();
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [dailyTip, setDailyTip] = useState<string>('');
  const [loadingTip, setLoadingTip] = useState(true);

  useEffect(() => {
    setMonthlyIncome(calculateMonthlyIncome());
    setMonthlyExpenses(calculateMonthlyExpenses());
    loadDailyTip();
  }, []);

  const loadDailyTip = async () => {
    try {
      const tip = await getDailyTip();
      setDailyTip(tip);
    } catch (error) {
      console.error('Failed to load daily tip:', error);
      toast({
        title: 'AI Tip Unavailable',
        description: 'Could not fetch daily financial tip.',
        variant: 'destructive',
      });
    } finally {
      setLoadingTip(false);
    }
  };

  const netBalance = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? ((netBalance / monthlyIncome) * 100).toFixed(1) : 0;

  // Chart data
  const expenses = getExpenses();
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
  const income = getIncome().slice(0, 7).reverse();
  const incomeChartData = income.map(i => ({
    date: new Date(i.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    amount: i.amount
  }));

  const projects = getProjects();
  const activeProjects = projects.filter(p => p.status === 'ongoing').length;
  
  const goals = getGoals();
  const goalsProgress = goals.length > 0 
    ? (goals.reduce((sum, g) => sum + (g.current / g.target), 0) / goals.length * 100).toFixed(0)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-display font-bold mb-2">
          Welcome back, <span className="gradient-primary bg-clip-text text-transparent">Amine</span>
        </h1>
        <p className="text-muted-foreground">Here's your financial overview for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Wallet}
          label="Monthly Income"
          value={`${monthlyIncome.toLocaleString()} DZD`}
          trend={{ value: 12, isPositive: true }}
          gradient="success"
        />
        
        <StatCard
          icon={TrendingDown}
          label="Monthly Expenses"
          value={`${monthlyExpenses.toLocaleString()} DZD`}
          trend={{ value: 5, isPositive: false }}
          gradient="warning"
        />
        
        <StatCard
          icon={DollarSign}
          label="Net Balance"
          value={`${netBalance.toLocaleString()} DZD`}
          gradient={netBalance >= 0 ? 'primary' : 'warning'}
        >
          <div className="flex items-center gap-2 text-sm">
            {netBalance >= 0 ? (
              <>
                <ArrowUpRight className="w-4 h-4 text-success" />
                <span className="text-success">Savings rate: {savingsRate}%</span>
              </>
            ) : (
              <>
                <ArrowDownRight className="w-4 h-4 text-destructive" />
                <span className="text-destructive">Budget deficit</span>
              </>
            )}
          </div>
        </StatCard>
        
        <StatCard
          icon={Sparkles}
          label="Active Projects"
          value={activeProjects}
          gradient="accent"
        >
          <div className="text-sm text-muted-foreground">
            Goals Progress: {goalsProgress}%
          </div>
        </StatCard>
      </div>

      {/* AI Daily Tip Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-2xl p-6 gradient-primary relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-display font-semibold text-white">Daily AI Financial Tip</h2>
          </div>
          {loadingTip ? (
            <div className="flex items-center gap-2 text-white/80">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
              <span>Loading AI insights...</span>
            </div>
          ) : (
            <p className="text-white/90 leading-relaxed">{dailyTip}</p>
          )}
        </div>
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Trend */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-2xl p-6"
        >
          <h3 className="text-xl font-display font-semibold mb-4">Income Trend</h3>
          {incomeChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
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
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              <p>No income data yet. Add your first income entry!</p>
            </div>
          )}
        </motion.div>

        {/* Expense Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-6"
        >
          <h3 className="text-xl font-display font-semibold mb-4">Expense Distribution</h3>
          {expensePieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={expensePieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
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
                    borderRadius: '12px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              <p>No expense data yet. Track your spending to see insights!</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <button className="glass-card rounded-xl p-4 text-left hover:bg-primary/10 transition-colors border border-primary/20">
          <h4 className="font-display font-semibold text-primary mb-1">Add Income</h4>
          <p className="text-sm text-muted-foreground">Record a new income entry</p>
        </button>
        
        <button className="glass-card rounded-xl p-4 text-left hover:bg-warning/10 transition-colors border border-warning/20">
          <h4 className="font-display font-semibold text-warning mb-1">Track Expense</h4>
          <p className="text-sm text-muted-foreground">Log a new expense</p>
        </button>
        
        <button className="glass-card rounded-xl p-4 text-left hover:bg-accent/10 transition-colors border border-accent/20">
          <h4 className="font-display font-semibold text-accent mb-1">Ask AI</h4>
          <p className="text-sm text-muted-foreground">Get financial advice</p>
        </button>
      </motion.div>
    </div>
  );
};

export default Dashboard;
