import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { getIncome, addIncome, IncomeEntry } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const Income = () => {
  const { toast } = useToast();
  const [income, setIncome] = useState<IncomeEntry[]>(getIncome());
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    source: '',
    category: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    description: ''
  });

  const categories = ['Freelancing', 'Digital Services', 'Design Work', 'Consulting', 'Other'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newEntry: IncomeEntry = {
      id: Date.now().toString(),
      amount: parseFloat(formData.amount),
      source: formData.source,
      category: formData.category,
      date: formData.date,
      description: formData.description
    };

    addIncome(newEntry);
    setIncome(getIncome());
    setShowForm(false);
    setFormData({
      amount: '',
      source: '',
      category: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      description: ''
    });

    toast({
      title: 'Income Added',
      description: `Successfully recorded ${newEntry.amount} DZD from ${newEntry.source}`,
    });
  };

  const totalIncome = income.reduce((sum, entry) => sum + entry.amount, 0);
  const monthlyIncome = income
    .filter(entry => new Date(entry.date).getMonth() === new Date().getMonth())
    .reduce((sum, entry) => sum + entry.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold mb-2">Income Manager</h1>
          <p className="text-muted-foreground">Track and manage your income sources</p>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)}
          className="gradient-success text-white"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Income
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-card p-6">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl gradient-success">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Income</p>
              <p className="text-3xl font-display font-bold">{monthlyIncome.toLocaleString()} DZD</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-6">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl gradient-primary">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Income</p>
              <p className="text-3xl font-display font-bold">{totalIncome.toLocaleString()} DZD</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Add Income Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass-card p-6">
            <h3 className="text-xl font-display font-semibold mb-4">Add New Income</h3>
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
                  <Label htmlFor="source">Source</Label>
                  <Input
                    id="source"
                    required
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    placeholder="e.g., Client Name"
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
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="gradient-success text-white">
                  Add Income
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      )}

      {/* Income List */}
      <Card className="glass-card p-6">
        <h3 className="text-xl font-display font-semibold mb-4">Recent Income</h3>
        {income.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No income recorded yet. Add your first entry!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {income.map(entry => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg gradient-success">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold">{entry.source}</p>
                    <p className="text-sm text-muted-foreground">{entry.category}</p>
                    {entry.description && (
                      <p className="text-xs text-muted-foreground mt-1">{entry.description}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-display font-bold text-success">
                    +{entry.amount.toLocaleString()} DZD
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

export default Income;
