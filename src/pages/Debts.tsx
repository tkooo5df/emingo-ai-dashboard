import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, TrendingUp, TrendingDown, Calendar, DollarSign, X, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

interface Debt {
  id: string;
  type: 'given' | 'received';
  amount: number;
  person_name: string;
  description?: string;
  date: string;
  status: 'pending' | 'paid' | 'received';
}

const Debts = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [formData, setFormData] = useState({
    type: 'given' as 'given' | 'received',
    amount: '',
    person_name: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    status: 'pending' as 'pending' | 'paid' | 'received'
  });

  useEffect(() => {
    loadDebts();
  }, []);

  const loadDebts = async () => {
    try {
      setLoading(true);
      const data = await api.getDebts();
      setDebts(data);
    } catch (error) {
      console.error('Error loading debts:', error);
      toast({
        title: t('common.error'),
        description: t('debts.errorAddingDesc'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.person_name) {
      toast({
        title: t('common.error'),
        description: t('debts.errorAddingDesc'),
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingDebt) {
        await api.updateDebt(editingDebt.id, formData);
        toast({
          title: t('debts.debtUpdated'),
          description: t('debts.debtUpdatedDesc'),
        });
      } else {
        await api.addDebt({
          id: crypto.randomUUID(),
          ...formData,
          amount: parseFloat(formData.amount),
        });
        toast({
          title: t('debts.debtAdded'),
          description: t('debts.debtAddedDesc'),
        });
      }
      
      await loadDebts();
      setShowForm(false);
      setEditingDebt(null);
      setFormData({
        type: 'given',
        amount: '',
        person_name: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        status: 'pending'
      });
    } catch (error) {
      console.error('Error saving debt:', error);
      toast({
        title: t('common.error'),
        description: editingDebt ? t('debts.errorUpdatingDesc') : t('debts.errorAddingDesc'),
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.delete') + '?')) return;
    
    try {
      await api.deleteDebt(id);
      toast({
        title: t('debts.debtDeleted'),
        description: t('debts.debtDeletedDesc'),
      });
      await loadDebts();
    } catch (error) {
      console.error('Error deleting debt:', error);
      toast({
        title: t('common.error'),
        description: t('debts.errorDeletingDesc'),
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (debt: Debt) => {
    setEditingDebt(debt);
    setFormData({
      type: debt.type,
      amount: debt.amount.toString(),
      person_name: debt.person_name,
      description: debt.description || '',
      date: debt.date,
      status: debt.status
    });
    setShowForm(true);
  };

  const handleStatusChange = async (debt: Debt, newStatus: 'pending' | 'paid' | 'received') => {
    try {
      await api.updateDebt(debt.id, { status: newStatus });
      toast({
        title: t('debts.debtUpdated'),
        description: t('debts.debtUpdatedDesc'),
      });
      await loadDebts();
    } catch (error) {
      console.error('Error updating debt status:', error);
      toast({
        title: t('common.error'),
        description: t('debts.errorUpdatingDesc'),
        variant: 'destructive',
      });
    }
  };

  const totalGiven = debts.filter(d => d.type === 'given').reduce((sum, d) => sum + d.amount, 0);
  const totalReceived = debts.filter(d => d.type === 'received').reduce((sum, d) => sum + d.amount, 0);
  const pendingGiven = debts.filter(d => d.type === 'given' && d.status === 'pending').reduce((sum, d) => sum + d.amount, 0);
  const pendingReceived = debts.filter(d => d.type === 'received' && d.status === 'pending').reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-4xl font-display font-bold mb-1 md:mb-2">{t('debts.title')}</h1>
          <p className="text-xs md:text-base text-muted-foreground">{t('debts.subtitle')}</p>
        </div>
        <Button 
          onClick={() => {
            setShowForm(!showForm);
            setEditingDebt(null);
            setFormData({
              type: 'given',
              amount: '',
              person_name: '',
              description: '',
              date: format(new Date(), 'yyyy-MM-dd'),
              status: 'pending'
            });
          }}
          className="gradient-primary text-white h-9 px-3 text-xs md:text-sm shrink-0"
          size="sm"
        >
          <Plus className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
          <span className="hidden sm:inline">{t('debts.addDebt')}</span>
          <span className="sm:hidden">+</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <Card className="glass-card p-3 md:p-6">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="p-2 md:p-4 rounded-lg md:rounded-xl gradient-warning">
              <TrendingUp className="w-4 h-4 md:w-8 md:h-8 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">{t('debts.totalGiven')}</p>
              <p className="text-lg md:text-3xl font-display font-bold truncate">{totalGiven.toLocaleString()} DZD</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-3 md:p-6">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="p-2 md:p-4 rounded-lg md:rounded-xl gradient-success">
              <TrendingDown className="w-4 h-4 md:w-8 md:h-8 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">{t('debts.totalReceived')}</p>
              <p className="text-lg md:text-3xl font-display font-bold truncate">{totalReceived.toLocaleString()} DZD</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-3 md:p-6">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="p-2 md:p-4 rounded-lg md:rounded-xl bg-warning/20">
              <Clock className="w-4 h-4 md:w-8 md:h-8 text-warning" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">{t('debts.pendingGiven')}</p>
              <p className="text-lg md:text-3xl font-display font-bold truncate">{pendingGiven.toLocaleString()} DZD</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-3 md:p-6">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="p-2 md:p-4 rounded-lg md:rounded-xl bg-success/20">
              <Clock className="w-4 h-4 md:w-8 md:h-8 text-success" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">{t('debts.pendingReceived')}</p>
              <p className="text-lg md:text-3xl font-display font-bold truncate">{pendingReceived.toLocaleString()} DZD</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass-card p-4 md:p-6">
            <h3 className="text-lg md:text-xl font-display font-semibold mb-3 md:mb-4">
              {editingDebt ? t('common.edit') : t('debts.addDebt')}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <Label htmlFor="type">{t('debts.type')}</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: 'given' | 'received') => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="given">{t('debts.given')}</SelectItem>
                      <SelectItem value="received">{t('debts.received')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="amount">{t('common.amount')} (DZD)</Label>
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
                  <Label htmlFor="person_name">{t('debts.personName')}</Label>
                  <Input
                    id="person_name"
                    required
                    value={formData.person_name}
                    onChange={(e) => setFormData({ ...formData, person_name: e.target.value })}
                    placeholder={t('debts.personNamePlaceholder')}
                  />
                </div>

                <div>
                  <Label htmlFor="date">{t('common.date')}</Label>
                  <Input
                    id="date"
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="status">{t('debts.status')}</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'pending' | 'paid' | 'received') => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">{t('debts.pending')}</SelectItem>
                      <SelectItem value="paid">{t('debts.paid')}</SelectItem>
                      <SelectItem value="received">{t('debts.receivedStatus')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">{t('common.description')}</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t('debts.description')}
                  />
                </div>
              </div>

              <div className="flex gap-2 md:gap-3">
                <Button type="submit" className="gradient-primary text-white h-9 md:h-10 text-xs md:text-sm flex-1">
                  {editingDebt ? t('common.save') : t('debts.addDebt')}
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowForm(false);
                  setEditingDebt(null);
                }} className="h-9 md:h-10 text-xs md:text-sm">
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      )}

      {/* Debts List */}
      <Card className="glass-card p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-display font-semibold mb-3 md:mb-4">{t('debts.title')}</h3>
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4" />
            <p>{t('common.loading')}</p>
          </div>
        ) : debts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{t('debts.noDebts')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {debts.map(debt => (
              <motion.div
                key={debt.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between p-3 md:p-4 rounded-lg md:rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                  <div className={`p-2 md:p-3 rounded-lg ${debt.type === 'given' ? 'gradient-warning' : 'gradient-success'} shrink-0`}>
                    {debt.type === 'given' ? (
                      <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    ) : (
                      <TrendingDown className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm md:text-base truncate">{debt.person_name}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {debt.type === 'given' ? t('debts.given') : t('debts.received')}
                    </p>
                    {debt.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{debt.description}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className={`text-base md:text-xl font-display font-bold ${debt.type === 'given' ? 'text-warning' : 'text-success'}`}>
                      {debt.type === 'given' ? '-' : '+'}{debt.amount.toLocaleString()} DZD
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Calendar className="w-3 h-3" />
                      <span className="hidden sm:inline">{format(new Date(debt.date), 'MMM dd, yyyy')}</span>
                      <span className="sm:hidden">{format(new Date(debt.date), 'MM/dd')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 md:gap-2 ml-2 shrink-0">
                  <Select
                    value={debt.status}
                    onValueChange={(value: 'pending' | 'paid' | 'received') => handleStatusChange(debt, value)}
                  >
                    <SelectTrigger className="w-[100px] md:w-[120px] h-8 md:h-10 text-xs md:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">{t('debts.pending')}</SelectItem>
                      <SelectItem value="paid">{t('debts.paid')}</SelectItem>
                      <SelectItem value="received">{t('debts.receivedStatus')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => handleEdit(debt)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 md:h-10 md:w-10"
                  >
                    <span className="text-xs md:text-sm">{t('common.edit')}</span>
                  </Button>
                  <Button
                    onClick={() => handleDelete(debt.id)}
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive h-8 w-8 md:h-10 md:w-10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Debts;

