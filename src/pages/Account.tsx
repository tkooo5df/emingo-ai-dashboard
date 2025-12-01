import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Wallet, Calendar, CreditCard, Banknote, CreditCard as CardIcon, X, Trash2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { Tag, type LucideIcon } from 'lucide-react';
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

interface AccountTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  name: string;
  category?: string;
  date: string;
  account_type?: 'ccp' | 'cash' | 'creditcard';
  note?: string;
}

const Account = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [debtsGiven, setDebtsGiven] = useState(0);
  const [debtsReceived, setDebtsReceived] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSubtractDialog, setShowSubtractDialog] = useState(false);
  const [showAccountsDialog, setShowAccountsDialog] = useState(false);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<Category[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    amount: '',
    name: '',
    source: '', // For income compatibility
    category: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    account_id: '',
    account_type: '' as 'ccp' | 'cash' | 'creditcard' | '',
    note: '',
    description: '' // For income/expense compatibility
  });

  useEffect(() => {
    loadBalance();
    loadSettings();
    loadDebts();
  }, []);

  const loadDebts = async () => {
    try {
      const [given, received] = await Promise.all([
        api.getTotalDebtsGiven(),
        api.getTotalDebtsReceived()
      ]);
      setDebtsGiven(given);
      setDebtsReceived(received);
    } catch (error) {
      console.error('Error loading debts:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const settings = await api.getSettings();
      setAccounts(settings.accounts || []);
      // Filter categories for income and expenses
      const allCategories = settings.custom_categories || [];
      setIncomeCategories(allCategories.filter((cat: Category) => !cat.type || cat.type === 'income' || cat.type === 'both'));
      setExpenseCategories(allCategories.filter((cat: Category) => !cat.type || cat.type === 'expense' || cat.type === 'both'));
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const getIconComponent = (iconName: string): LucideIcon => {
    const Icon = (Icons as any)[iconName] as LucideIcon;
    return Icon || Tag;
  };

  const loadBalance = async () => {
    try {
      setLoading(true);
      const balance = await api.getAccountBalance();
      setBalance(balance);
    } catch (error) {
      console.error('Error loading balance:', error);
      toast({
        title: 'Error',
        description: 'Could not load account balance',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (type: 'income' | 'expense') => {
    console.log(`🟡 [ACCOUNT PAGE] handleSubmit called with type: ${type}`);
    console.log('📝 [ACCOUNT PAGE] Form data:', formData);
    
    if (!formData.amount || (!formData.name && !formData.source)) {
      console.log('❌ [ACCOUNT PAGE] Validation failed: Missing required fields');
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
      const description = formData.note || formData.description || '';

      console.log('📊 [ACCOUNT PAGE] Parsed values:', {
        amount,
        sourceOrName,
        description,
        category: formData.category,
        date: formData.date,
        account_id: formData.account_id,
        account_type: formData.account_type
      });

      // Get account type from selected account
      let accountType = formData.account_type;
      if (formData.account_id && !accountType) {
        const selectedAccount = accounts.find(a => a.id === formData.account_id);
        if (selectedAccount) {
          accountType = selectedAccount.type;
          console.log('💳 [ACCOUNT PAGE] Found account type from selected account:', accountType);
        }
      }

      const transactionData = {
        type,
        amount,
        name: sourceOrName,
        category: formData.category || null,
        date: formData.date,
        account_type: accountType || null,
        note: formData.note || null
      };

      console.log('💳 [ACCOUNT PAGE] Adding account transaction:', transactionData);
      // Add to account_transactions (this will also sync to income/expenses via API automatically)
      // No need to call addIncome/addExpense separately - API handles both tables
      await api.addAccountTransaction(transactionData);
      console.log('✅ [ACCOUNT PAGE] Account transaction added successfully (synced to income/expenses tables)');

      console.log('🔄 [ACCOUNT PAGE] Reloading balance...');
      await loadBalance();
      await loadDebts();
      console.log('✅ [ACCOUNT PAGE] Balance reloaded');
      
      if (type === 'expense') {
        setShowSubtractDialog(false);
      } else {
        setShowAddDialog(false);
      }
      
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
        description: type === 'income' 
          ? t('account.addIncome') + ` ${amount} DZD. ${t('account.goToIncome')}`
          : t('account.addExpense') + ` ${amount} DZD. ${t('account.goToExpenses')}`,
      });
    } catch (error) {
      console.error('❌ [ACCOUNT PAGE] Error in handleSubmit:', error);
      console.error('❌ [ACCOUNT PAGE] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        type,
        formData
      });
      toast({
        title: 'Error',
        description: 'Could not save transaction',
        variant: 'destructive',
      });
    }
  };

  // Categories are now loaded from settings

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-2xl">
        {/* Account Circle */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative mb-6 md:mb-8"
        >
          <div className="relative w-72 h-72 md:w-80 md:h-80 mx-auto">
            {/* Outer Circle */}
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
                stroke={balance >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))"}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 110}`}
                strokeDashoffset={0}
                initial={{ strokeDashoffset: 2 * Math.PI * 110 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            
            {/* Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Wallet className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground mb-2" />
              {loading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
              ) : (
                <>
                  <motion.div
                    key={balance}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-4xl md:text-5xl font-display font-bold text-center px-2"
                  >
                    {balance.toLocaleString()} DZD
                  </motion.div>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">{t('account.currentBalance')}</p>
                  {(debtsGiven > 0 || debtsReceived > 0) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 pt-2 border-t border-border/50"
                    >
                      {debtsGiven > 0 ? (
                        <>
                          <p className="text-lg md:text-xl font-display font-semibold text-center">
                            {(balance + debtsGiven).toLocaleString()} DZD
                          </p>
                          <p className="text-xs text-muted-foreground text-center">
                            {t('account.balanceWithDebts')} (+{debtsGiven.toLocaleString()} DZD)
                          </p>
                        </>
                      ) : debtsReceived > 0 ? (
                        <>
                          <p className="text-lg md:text-xl font-display font-semibold text-center">
                            {(balance - debtsReceived).toLocaleString()} DZD
                          </p>
                          <p className="text-xs text-muted-foreground text-center">
                            {t('account.balanceAfterDebts')} (-{debtsReceived.toLocaleString()} DZD)
                          </p>
                        </>
                      ) : null}
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex gap-4 md:gap-6 justify-center items-center">
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
              className="gradient-success text-white h-14 w-14 md:h-16 md:w-16 rounded-full shadow-lg"
            >
              <Plus className="w-6 h-6 md:w-8 md:h-8" />
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
              className="bg-destructive text-white h-14 w-14 md:h-16 md:w-16 rounded-full shadow-lg"
            >
              <Minus className="w-6 h-6 md:w-8 md:h-8" />
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => setShowAccountsDialog(true)}
              size="lg"
              variant="outline"
              className="h-14 w-14 md:h-16 md:w-16 rounded-full shadow-lg"
            >
              <Settings className="w-6 h-6 md:w-8 md:h-8" />
            </Button>
          </motion.div>
        </div>

        {/* Add Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('account.addIncome')}</DialogTitle>
              <DialogDescription>{t('account.addIncome')}</DialogDescription>
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
                    {incomeCategories.map((cat) => {
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
                    {incomeCategories.length === 0 && (
                      <SelectItem value="none" disabled>
                        No categories. Add them in Settings.
                      </SelectItem>
                    )}
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
                <Label htmlFor="account">{t('account.accountType')} *</Label>
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
                    {accounts.length > 0 ? (
                      accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          <div className="flex items-center gap-2">
                            {account.type === 'ccp' && <Banknote className="w-4 h-4" />}
                            {account.type === 'cash' && <Wallet className="w-4 h-4" />}
                            {account.type === 'creditcard' && <CardIcon className="w-4 h-4" />}
                            <span>{account.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({account.type === 'ccp' ? 'Bank Account' : account.type === 'cash' ? 'Cash' : 'Credit Card'})
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No accounts added. Go to Settings to add accounts.
                      </SelectItem>
                    )}
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
              <div className="flex gap-2">
                <Button onClick={() => handleSubmit('income')} className="flex-1 gradient-success">
                  {t('account.addIncome')}
                </Button>
                <Button 
                  onClick={() => {
                    setShowAddDialog(false);
                    navigate('/income');
                  }} 
                  variant="outline" 
                  className="flex-1"
                >
                  {t('account.goToIncome')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Subtract Dialog */}
        <Dialog open={showSubtractDialog} onOpenChange={setShowSubtractDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('account.addExpense')}</DialogTitle>
              <DialogDescription>{t('account.addExpense')}</DialogDescription>
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
                    {expenseCategories.map((cat) => {
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
                    {expenseCategories.length === 0 && (
                      <SelectItem value="none" disabled>
                        No categories. Add them in Settings.
                      </SelectItem>
                    )}
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
                <Label htmlFor="expense-account">{t('account.accountType')} *</Label>
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
                    <SelectValue placeholder="Select account or payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.length > 0 ? (
                      accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          <div className="flex items-center gap-2">
                            {account.type === 'ccp' && <Banknote className="w-4 h-4" />}
                            {account.type === 'cash' && <Wallet className="w-4 h-4" />}
                            {account.type === 'creditcard' && <CardIcon className="w-4 h-4" />}
                            <span>{account.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({account.type === 'ccp' ? 'Bank Account' : account.type === 'cash' ? 'Cash' : 'Credit Card'})
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No accounts added. Go to Settings to add accounts.
                      </SelectItem>
                    )}
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
              <div className="flex gap-2">
                <Button onClick={() => handleSubmit('expense')} className="flex-1 bg-destructive text-white">
                  {t('account.addExpense')}
                </Button>
                <Button 
                  onClick={() => {
                    setShowSubtractDialog(false);
                    navigate('/expenses');
                  }} 
                  variant="outline" 
                  className="flex-1"
                >
                  {t('account.goToExpenses')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Accounts Management Dialog */}
        <Dialog open={showAccountsDialog} onOpenChange={setShowAccountsDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('account.manageAccounts')}</DialogTitle>
              <DialogDescription>{t('account.manageAccountsDescription')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {accounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{t('account.noAccounts')}</p>
                  <Button
                    onClick={() => {
                      setShowAccountsDialog(false);
                      navigate('/settings');
                    }}
                    className="mt-4"
                    variant="outline"
                  >
                    {t('account.goToSettings')}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {accounts.map((account) => (
                      <motion.div
                        key={account.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {account.type === 'ccp' && <Banknote className="w-5 h-5 text-primary" />}
                          {account.type === 'cash' && <Wallet className="w-5 h-5 text-primary" />}
                          {account.type === 'creditcard' && <CardIcon className="w-5 h-5 text-primary" />}
                          <div>
                            <p className="font-semibold">{account.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {account.type === 'ccp' ? t('account.bankAccount') : account.type === 'cash' ? t('account.cash') : t('account.creditCard')}
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={async () => {
                            if (confirm(t('account.confirmDeleteAccount', { name: account.name }))) {
                              try {
                                await api.deleteAccount(account.id);
                                await loadSettings();
                                toast({
                                  title: t('success.deleted'),
                                  description: t('account.accountDeleted', { name: account.name }),
                                });
                              } catch (error) {
                                console.error('Error deleting account:', error);
                                toast({
                                  title: t('errors.errorDeleting'),
                                  description: t('errors.couldNotDelete'),
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
                      </motion.div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      onClick={async () => {
                        if (confirm(t('account.confirmDeleteAllAccounts'))) {
                          try {
                            await api.deleteAllAccounts();
                            await loadSettings();
                            toast({
                              title: t('success.deleted'),
                              description: t('account.allAccountsDeleted'),
                            });
                          } catch (error) {
                            console.error('Error deleting all accounts:', error);
                            toast({
                              title: t('errors.errorDeleting'),
                              description: t('errors.couldNotDelete'),
                              variant: 'destructive',
                            });
                          }
                        }
                      }}
                      variant="destructive"
                      className="flex-1"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t('account.deleteAll')}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowAccountsDialog(false);
                        navigate('/settings');
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      {t('account.goToSettings')}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Account;

