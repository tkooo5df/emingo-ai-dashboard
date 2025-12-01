import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, TrendingDown, Calendar, AlertCircle, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { getExpenses, addExpense, ExpenseEntry } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { analyzeSpending } from '@/lib/ai-service';
import { api } from '@/lib/api';
import { Wallet, Banknote, CreditCard, Tag, type LucideIcon } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Account {
  id: string;
  name: string;
  type: 'ccp' | 'cash' | 'creditcard';
}

interface Category {
  id: string;
  name: string;
  icon: string;
  type?: 'income' | 'expense' | 'both';
}

const Expenses = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseEntry | null>(null);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    account_id: '',
    account_type: '' as 'ccp' | 'cash' | 'creditcard' | ''
  });

  useEffect(() => {
    loadExpenses();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await api.getSettings();
      setAccounts(settings.accounts || []);
      // Filter categories for expenses (type: 'expense' or 'both')
      const expenseCategories = (settings.custom_categories || []).filter(
        (cat: Category) => !cat.type || cat.type === 'expense' || cat.type === 'both'
      );
      setCategories(expenseCategories);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const getIconComponent = (iconName: string): LucideIcon => {
    const Icon = (Icons as any)[iconName] as LucideIcon;
    return Icon || Tag;
  };

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const data = await getExpenses();
      setExpenses(data);
    } catch (error) {
      console.error('Error loading expenses:', error);
      toast({
        title: t('expenses.errorLoading'),
        description: t('expenses.errorLoadingDesc'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Categories are now loaded from settings

  const handleEdit = (entry: ExpenseEntry) => {
    setEditingExpense(entry);
    setFormData({
      amount: entry.amount.toString(),
      category: entry.category || '',
      date: entry.date,
      description: entry.description || '',
      account_id: entry.account_id || '',
      account_type: entry.account_type || ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔴 [EXPENSES PAGE] Form submitted');
    console.log('📝 [EXPENSES PAGE] Form data:', {
      amount: formData.amount,
      category: formData.category,
      date: formData.date,
      description: formData.description,
      account_id: formData.account_id,
      account_type: formData.account_type
    });
    
    // Get account type from selected account
    let accountType = formData.account_type;
    if (formData.account_id && !accountType) {
      const selectedAccount = accounts.find(a => a.id === formData.account_id);
      if (selectedAccount) {
        accountType = selectedAccount.type;
        console.log('💳 [EXPENSES PAGE] Found account type from selected account:', accountType);
      }
    }

    try {
      if (editingExpense) {
        // Update existing expense
        console.log('✏️ [EXPENSES PAGE] Updating expense entry:', editingExpense.id);
        await api.updateExpense(editingExpense.id, {
          amount: parseFloat(formData.amount),
          category: formData.category,
          date: formData.date,
          description: formData.description,
          account_id: formData.account_id || undefined,
          account_type: accountType || undefined
        });
        console.log('✅ [EXPENSES PAGE] Expense updated successfully');
        toast({
          title: t('expenses.expenseUpdated'),
          description: t('expenses.expenseUpdatedDesc', { amount: parseFloat(formData.amount) }),
        });
      } else {
        // Add new expense
        const newEntry: ExpenseEntry = {
          id: crypto.randomUUID(),
          amount: parseFloat(formData.amount),
          category: formData.category,
          date: formData.date,
          description: formData.description,
          account_id: formData.account_id || undefined,
          account_type: accountType || undefined
        };

        console.log('📦 [EXPENSES PAGE] Created expense entry object:', newEntry);
        console.log('🚀 [EXPENSES PAGE] Calling addExpense()...');
        await addExpense(newEntry);
        console.log('✅ [EXPENSES PAGE] addExpense() completed successfully');
        
        // Also add to account_transactions for synchronization
        if (formData.account_id && accountType) {
          const transactionData = {
            type: 'expense',
            amount: newEntry.amount,
            name: newEntry.description || newEntry.category || 'Expense',
            category: newEntry.category || null,
            date: newEntry.date,
            account_id: formData.account_id,
            account_type: accountType,
            note: newEntry.description || null
          };
          console.log('💳 [EXPENSES PAGE] Adding account transaction:', transactionData);
          await api.addAccountTransaction(transactionData);
          console.log('✅ [EXPENSES PAGE] Account transaction added');
        } else {
          console.log('⚠️ [EXPENSES PAGE] Skipping account_transactions (no account_id or account_type)');
        }
        toast({
          title: t('expenses.expenseAdded'),
          description: t('expenses.expenseAddedDesc', { amount: newEntry.amount }),
        });
      }
      
      console.log('🔄 [EXPENSES PAGE] Reloading expenses list...');
      await loadExpenses();
      console.log('✅ [EXPENSES PAGE] Expenses list reloaded');
      setShowForm(false);
      setEditingExpense(null);
      setFormData({
        amount: '',
        category: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        description: '',
        account_id: '',
        account_type: ''
      });
    } catch (error) {
      console.error('❌ [EXPENSES PAGE] Error in handleSubmit:', error);
      console.error('❌ [EXPENSES PAGE] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        editingExpense
      });
      toast({
        title: editingExpense ? t('expenses.errorUpdating') : t('expenses.errorAdding'),
        description: editingExpense ? t('expenses.errorUpdatingDesc') : t('expenses.errorAddingDesc'),
        variant: 'destructive',
      });
    }
  };

  const loadAIInsights = async () => {
    setLoadingInsights(true);
    try {
      const insights = await analyzeSpending();
      setAiInsights(insights);
    } catch (error) {
      toast({
        title: t('expenses.aiAnalysisFailed'),
        description: t('expenses.aiAnalysisFailedDesc'),
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
          <h1 className="text-4xl font-display font-bold mb-2">{t('expenses.title')}</h1>
          <p className="text-muted-foreground">{t('expenses.subtitle')}</p>
        </div>
        <Button 
          onClick={() => {
            setShowForm(!showForm);
            setEditingExpense(null);
            setFormData({
              amount: '',
              category: '',
              date: format(new Date(), 'yyyy-MM-dd'),
              description: '',
              account_id: '',
              account_type: ''
            });
          }}
          className="gradient-accent text-white"
        >
          <Plus className="w-5 h-5 mr-2" />
          {t('expenses.addExpense')}
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
              <p className="text-sm text-muted-foreground">{t('expenses.monthlyExpenses')}</p>
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
              <p className="text-sm text-muted-foreground">{t('expenses.totalExpenses')}</p>
              <p className="text-3xl font-display font-bold">{totalExpenses.toLocaleString()} DZD</p>
            </div>
          </div>
        </Card>
      </div>

      {/* AI Insights */}
      <Card className="glass-card p-6 border-accent/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-display font-semibold">{t('expenses.aiInsights')}</h3>
          <Button 
            onClick={loadAIInsights} 
            disabled={loadingInsights || expenses.length === 0}
            variant="outline"
            className="border-accent text-accent hover:bg-accent/10"
          >
            {loadingInsights ? t('expenses.analyzing') : t('expenses.analyzeSpending')}
          </Button>
        </div>
        {aiInsights ? (
          <div className="prose prose-sm max-w-none">
            <p className="text-foreground whitespace-pre-line">{aiInsights}</p>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            {expenses.length === 0 
              ? t('expenses.addExpensesForInsights')
              : t('expenses.clickAnalyze')}
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
            <h3 className="text-xl font-display font-semibold mb-4">
              {editingExpense ? t('common.edit') : t('expenses.addNew')}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">{t('expenses.amount')}</Label>
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
                  <Label htmlFor="category">{t('expenses.category')}</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('expenses.selectCategory')} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => {
                        const Icon = getIconComponent(cat.icon);
                        return (
                          <SelectItem key={cat.id} value={cat.name}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              <span>{cat.name}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                      {categories.length === 0 && (
                        <SelectItem value="none" disabled>
                          {t('expenses.noCategories')}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="date">{t('expenses.date')}</Label>
                  <Input
                    id="date"
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="account">{t('expenses.paymentMethod')} *</Label>
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
                      <SelectValue placeholder={t('expenses.selectAccount')} />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.length > 0 ? (
                        accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            <div className="flex items-center gap-2">
                              {account.type === 'ccp' && <Banknote className="w-4 h-4" />}
                              {account.type === 'cash' && <Wallet className="w-4 h-4" />}
                              {account.type === 'creditcard' && <CreditCard className="w-4 h-4" />}
                              <span>{account.name}</span>
                              <span className="text-xs text-muted-foreground">
                                ({account.type === 'ccp' ? t('expenses.bankAccount') : account.type === 'cash' ? t('expenses.cash') : t('expenses.creditCard')})
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          {t('expenses.noAccounts')}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">{t('expenses.description')}</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('expenses.whatFor')}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="bg-warning text-white hover:bg-warning/90">
                  {editingExpense ? t('common.save') : t('expenses.addExpense')}
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowForm(false);
                  setEditingExpense(null);
                  setFormData({
                    amount: '',
                    category: '',
                    date: format(new Date(), 'yyyy-MM-dd'),
                    description: '',
                    account_id: '',
                    account_type: ''
                  });
                }}>
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      )}

      {/* Expense List */}
      <Card className="glass-card p-6">
        <h3 className="text-xl font-display font-semibold mb-4">{t('expenses.recentExpenses')}</h3>
        {expenses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <TrendingDown className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{t('expenses.noExpenses')}</p>
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
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-3 rounded-lg bg-warning">
                    <TrendingDown className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{entry.description || entry.category}</p>
                    {entry.description && (
                      <p className="text-sm text-muted-foreground">{entry.category}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xl font-display font-bold text-destructive">
                      -{entry.amount.toLocaleString()} DZD
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(entry.date), 'MMM dd, yyyy')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleEdit(entry)}
                      variant="ghost"
                      size="icon"
                      className="text-primary hover:text-primary hover:bg-primary/10"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={async () => {
                        console.log('🗑️  [EXPENSES] Delete button clicked');
                        console.log('🆔 [EXPENSES] Entry ID:', entry.id);
                        console.log('📦 [EXPENSES] Full entry:', entry);
                        
                        if (!entry.id) {
                          console.error('❌ [EXPENSES] Entry ID is missing!');
                          toast({
                            title: t('errors.errorDeleting'),
                            description: 'Entry ID is missing',
                            variant: 'destructive',
                          });
                          return;
                        }
                        
                        if (confirm(t('expenses.confirmDelete'))) {
                          try {
                            console.log('🚀 [EXPENSES] Calling api.deleteExpense with ID:', entry.id);
                            await api.deleteExpense(entry.id);
                            console.log('✅ [EXPENSES] Delete successful, reloading...');
                            await loadExpenses();
                            toast({
                              title: t('success.deleted'),
                              description: t('expenses.expenseDeleted'),
                            });
                          } catch (error) {
                            console.error('❌ [EXPENSES] Error deleting expense:', error);
                            console.error('❌ [EXPENSES] Error details:', {
                              message: error instanceof Error ? error.message : String(error),
                              entryId: entry.id,
                              entry
                            });
                            toast({
                              title: t('errors.errorDeleting'),
                              description: error instanceof Error ? error.message : t('errors.couldNotDelete'),
                              variant: 'destructive',
                            });
                          }
                        }
                      }}
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
