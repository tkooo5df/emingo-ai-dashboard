import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, TrendingDown, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { getExpenses, addExpense, ExpenseEntry } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { analyzeSpending } from '@/lib/ai-service';

const Expenses = () => {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<ExpenseEntry[]>(getExpenses());
  const [showForm, setShowForm] = useState(false);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    description: ''
  });

  const categories = ['Food', 'Transport', 'Internet', 'Study Costs', 'Work Tools', 'Personal', 'Entertainment', 'Other'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newEntry: ExpenseEntry = {
      id: Date.now().toString(),
      amount: parseFloat(formData.amount),
      category: formData.category,
      date: formData.date,
      description: formData.description
    };

    addExpense(newEntry);
    setExpenses(getExpenses());
    setShowForm(false);
    setFormData({
      amount: '',
      category: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      description: ''
    });

    toast({
      title: 'Expense Recorded',
      description: `Successfully tracked ${newEntry.amount} DZD expense`,
    });
  };

  const loadAIInsights = async () => {
    setLoadingInsights(true);
    try {
      const insights = await analyzeSpending();
      setAiInsights(insights);
    } catch (error) {
      toast({
        title: 'AI Analysis Failed',
        description: 'Could not generate spending insights',
        variant: 'destructive',
      });
    } finally {
      setLoadingInsights(false);
    }
  };

  const totalExpenses = expenses.reduce((sum, entry) => sum + entry.amount, 0);
  const monthlyExpenses = expenses
    .filter(entry => new Date(entry.date).getMonth() === new Date().getMonth())
    .reduce((sum, entry) => sum + entry.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold mb-2">Expense Manager</h1>
          <p className="text-muted-foreground">Track and analyze your spending</p>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)}
          className="gradient-accent text-white"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-card p-6">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl bg-warning">
              <TrendingDown className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Expenses</p>
              <p className="text-3xl font-display font-bold">{monthlyExpenses.toLocaleString()} DZD</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-6">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl bg-destructive">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-3xl font-display font-bold">{totalExpenses.toLocaleString()} DZD</p>
            </div>
          </div>
        </Card>
      </div>

      {/* AI Insights */}
      <Card className="glass-card p-6 border-accent/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-display font-semibold">AI Spending Insights</h3>
          <Button 
            onClick={loadAIInsights} 
            disabled={loadingInsights || expenses.length === 0}
            variant="outline"
            className="border-accent text-accent hover:bg-accent/10"
          >
            {loadingInsights ? 'Analyzing...' : 'Analyze Spending'}
          </Button>
        </div>
        {aiInsights ? (
          <div className="prose prose-sm max-w-none">
            <p className="text-foreground whitespace-pre-line">{aiInsights}</p>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            {expenses.length === 0 
              ? 'Add some expenses to get AI-powered insights on your spending patterns'
              : 'Click "Analyze Spending" to get AI recommendations for reducing expenses'}
          </p>
        )}
      </Card>

      {/* Add Expense Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass-card p-6">
            <h3 className="text-xl font-display font-semibold mb-4">Add New Expense</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount (DZD)</Label>
                  <Input
                    id="amount"
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What was this expense for?"
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="bg-warning text-white hover:bg-warning/90">
                  Add Expense
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      )}

      {/* Expense List */}
      <Card className="glass-card p-6">
        <h3 className="text-xl font-display font-semibold mb-4">Recent Expenses</h3>
        {expenses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <TrendingDown className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No expenses recorded yet. Start tracking your spending!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map(entry => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-warning">
                    <TrendingDown className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold">{entry.category}</p>
                    {entry.description && (
                      <p className="text-sm text-muted-foreground">{entry.description}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-display font-bold text-destructive">
                    -{entry.amount.toLocaleString()} DZD
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(entry.date), 'MMM dd, yyyy')}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Expenses;
