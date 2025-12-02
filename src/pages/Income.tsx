import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, TrendingUp, Calendar, DollarSign, Wallet, Banknote, CreditCard, Tag, Trash2, Pencil, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { getIncome, addIncome, IncomeEntry } from '@/lib/storage';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import * as Icons from 'lucide-react';

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

const Income = () => {
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [income, setIncome] = useState<IncomeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeEntry | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    amount: '',
    source: '',
    category: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    account_id: '',
    account_type: '' as 'ccp' | 'cash' | 'creditcard' | ''
  });

  useEffect(() => {
    loadIncome();
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await api.getSettings();
      setAccounts(settings.accounts || []);
      // Filter categories for income (type: 'income' or 'both')
      const incomeCategories = (settings.custom_categories || []).filter(
        (cat: Category) => !cat.type || cat.type === 'income' || cat.type === 'both'
      );
      setCategories(incomeCategories);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const getIconComponent = (iconName: string): LucideIcon => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Icon = (Icons as any)[iconName] as LucideIcon;
    return Icon || Tag;
  };

  const loadIncome = async () => {
    try {
      setLoading(true);
      const data = await getIncome();
      setIncome(data);
    } catch (error) {
      console.error('Error loading income:', error);
      toast({
        title: t('income.errorLoading'),
        description: t('income.errorLoadingDesc'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Categories are now loaded from settings

  const handleEdit = (entry: IncomeEntry) => {
    setEditingIncome(entry);
    setFormData({
      amount: entry.amount.toString(),
      source: entry.source || '',
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

    // Get account type from selected account
    let accountType = formData.account_type;
    if (formData.account_id && !accountType) {
      const selectedAccount = accounts.find(a => a.id === formData.account_id);
      if (selectedAccount) {
        accountType = selectedAccount.type;

      }
    }

    try {
      if (editingIncome) {
        // Update existing income

        await api.updateIncome(editingIncome.id, {
          amount: parseFloat(formData.amount),
          source: formData.source,
          category: formData.category,
          date: formData.date,
          description: formData.description,
          account_id: formData.account_id || undefined,
          account_type: accountType || undefined
        });

        toast({
          title: t('income.incomeUpdated'),
          description: t('income.incomeUpdatedDesc', { amount: parseFloat(formData.amount), source: formData.source }),
        });
      } else {
        // Add new income
        const newEntry: IncomeEntry = {
          id: crypto.randomUUID(),
          amount: parseFloat(formData.amount),
          source: formData.source,
          category: formData.category,
          date: formData.date,
          description: formData.description,
          account_id: formData.account_id || undefined,
          account_type: accountType || undefined
        };

        await addIncome(newEntry);
        
        // Also add to account_transactions for synchronization
        if (formData.account_id && accountType) {
          const transactionData = {
            type: 'income',
            amount: newEntry.amount,
            name: newEntry.source,
            category: newEntry.category || null,
            date: newEntry.date,
            account_id: formData.account_id,
            account_type: accountType,
            note: newEntry.description || null
          };

          await api.addAccountTransaction(transactionData);
        }
        toast({
          title: t('income.incomeAdded'),
          description: t('income.incomeAddedDesc', { amount: newEntry.amount, source: newEntry.source }),
        });
      }

      await loadIncome();

      setShowForm(false);
      setEditingIncome(null);
      setFormData({
        amount: '',
        source: '',
        category: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        description: '',
        account_id: '',
        account_type: ''
      });
    } catch (error) {
      console.error('❌ [INCOME PAGE] Error in handleSubmit:', error);
      console.error('❌ [INCOME PAGE] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        editingIncome
      });
      toast({
        title: editingIncome ? t('income.errorUpdating') : t('income.errorAdding'),
        description: editingIncome ? t('income.errorUpdatingDesc') : t('income.errorAddingDesc'),
        variant: 'destructive',
      });
    }
  };

  const totalIncome = income.reduce((sum, entry) => sum + entry.amount, 0);
  const monthlyIncome = income
    .filter(entry => new Date(entry.date).getMonth() === new Date().getMonth())
    .reduce((sum, entry) => sum + entry.amount, 0);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-4xl font-display font-bold mb-1 md:mb-2">{t('income.title')}</h1>
          <p className="text-xs md:text-base text-muted-foreground">{t('income.subtitle')}</p>
        </div>
        <Button 
          onClick={() => {
            setShowForm(!showForm);
            setEditingIncome(null);
            setFormData({
              amount: '',
              source: '',
              category: '',
              date: format(new Date(), 'yyyy-MM-dd'),
              description: '',
              account_id: '',
              account_type: ''
            });
          }}
          className="gradient-success text-white h-9 px-3 text-xs md:text-sm shrink-0"
          size="sm"
        >
          <Plus className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
          <span className="hidden sm:inline">{t('income.addIncome')}</span>
          <span className="sm:hidden">+</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
        <Card className="glass-card p-3 md:p-6">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="p-2 md:p-4 rounded-lg md:rounded-xl gradient-success">
              <TrendingUp className="w-4 h-4 md:w-8 md:h-8 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">{t('income.monthlyIncome')}</p>
              <p className="text-lg md:text-3xl font-display font-bold truncate">{monthlyIncome.toLocaleString()} DZD</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-3 md:p-6">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="p-2 md:p-4 rounded-lg md:rounded-xl gradient-primary">
              <DollarSign className="w-4 h-4 md:w-8 md:h-8 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">{t('income.totalIncome')}</p>
              <p className="text-lg md:text-3xl font-display font-bold truncate">{totalIncome.toLocaleString()} DZD</p>
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
          <Card className="glass-card p-4 md:p-6">
            <h3 className="text-lg md:text-xl font-display font-semibold mb-3 md:mb-4">
              {editingIncome ? t('common.edit') : t('income.addNew')}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <Label htmlFor="amount">{t('income.amount')}</Label>
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
                  <Label htmlFor="source">{t('income.source')}</Label>
                  <Input
                    id="source"
                    required
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    placeholder={t('income.clientName')}
                  />
                </div>

                <div>
                  <Label htmlFor="category">{t('income.category')}</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('income.selectCategory')} />
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
                          {t('income.noCategories')}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="date">{t('income.date')}</Label>
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
                  <Label htmlFor="account">{t('income.paymentMethod')} *</Label>
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
                      <SelectValue placeholder={t('income.selectAccount')} />
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
                                ({account.type === 'ccp' ? t('income.bankAccount') : account.type === 'cash' ? t('income.cash') : t('income.creditCard')})
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          {t('income.noAccounts')}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">{t('income.description')}</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t('income.additionalNotes')}
                  />
                </div>

              <div className="flex gap-3">
                <Button type="submit" className="gradient-success text-white">
                  {editingIncome ? t('common.save') : t('income.addIncome')}
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowForm(false);
                  setEditingIncome(null);
                  setFormData({
                    amount: '',
                    source: '',
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

      {/* Income List */}
      <Card className="glass-card p-4 md:p-6">
        <h3 className="text-xl font-display font-semibold mb-4">{t('income.recentIncome')}</h3>
        {income.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <TrendingUp className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-4 opacity-50" />
            <p>{t('income.noIncome')}</p>
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
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-3 rounded-lg gradient-success">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{entry.source}</p>
                    <p className="text-sm text-muted-foreground">{entry.category}</p>
                    {entry.description && (
                      <p className="text-xs text-muted-foreground mt-1">{entry.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xl font-display font-bold text-success">
                      +{entry.amount.toLocaleString()} DZD
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

                        if (!entry.id) {
                          console.error('❌ [INCOME] Entry ID is missing!');
                          toast({
                            title: t('errors.errorDeleting'),
                            description: 'Entry ID is missing',
                            variant: 'destructive',
                          });
                          return;
                        }
                        
                        if (confirm(t('income.confirmDelete'))) {
                          try {

                            await api.deleteIncome(entry.id);

                            await loadIncome();
                            toast({
                              title: t('success.deleted'),
                              description: t('income.incomeDeleted'),
                            });
                          } catch (error) {
                            console.error('❌ [INCOME] Error deleting income:', error);
                            console.error('❌ [INCOME] Error details:', {
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

export default Income;
