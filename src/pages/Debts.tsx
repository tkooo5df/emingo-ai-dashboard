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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold mb-2">{t('debts.title')}</h1>
          <p className="text-muted-foreground">{t('debts.subtitle')}</p>
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
          className="gradient-primary text-white"
        >
          <Plus className="w-5 h-5 mr-2" />
          {t('debts.addDebt')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card p-6">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl gradient-warning">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('debts.totalGiven')}</p>
              <p className="text-3xl font-display font-bold">{totalGiven.toLocaleString()} DZD</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-6">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl gradient-success">
              <TrendingDown className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('debts.totalReceived')}</p>
              <p className="text-3xl font-display font-bold">{totalReceived.toLocaleString()} DZD</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-6">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl bg-warning/20">
              <Clock className="w-8 h-8 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('debts.pendingGiven')}</p>
              <p className="text-3xl font-display font-bold">{pendingGiven.toLocaleString()} DZD</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-6">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl bg-success/20">
              <Clock className="w-8 h-8 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('debts.pendingReceived')}</p>
              <p className="text-3xl font-display font-bold">{pendingReceived.toLocaleString()} DZD</p>
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
          <Card className="glass-card p-6">
            <h3 className="text-xl font-display font-semibold mb-4">
              {editingDebt ? t('common.edit') : t('debts.addDebt')}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="flex gap-3">
                <Button type="submit" className="gradient-primary text-white">
                  {editingDebt ? t('common.save') : t('debts.addDebt')}
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowForm(false);
                  setEditingDebt(null);
                }}>
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      )}

      {/* Debts List */}
      <Card className="glass-card p-6">
        <h3 className="text-xl font-display font-semibold mb-4">{t('debts.title')}</h3>
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
                className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className={`p-3 rounded-lg ${debt.type === 'given' ? 'gradient-warning' : 'gradient-success'}`}>
                    {debt.type === 'given' ? (
                      <TrendingUp className="w-5 h-5 text-white" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{debt.person_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {debt.type === 'given' ? t('debts.given') : t('debts.received')}
                    </p>
                    {debt.description && (
                      <p className="text-xs text-muted-foreground mt-1">{debt.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-display font-bold ${debt.type === 'given' ? 'text-warning' : 'text-success'}`}>
                      {debt.type === 'given' ? '-' : '+'}{debt.amount.toLocaleString()} DZD
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(debt.date), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Select
                    value={debt.status}
                    onValueChange={(value: 'pending' | 'paid' | 'received') => handleStatusChange(debt, value)}
                  >
                    <SelectTrigger className="w-[120px]">
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
                  >
                    <span className="text-sm">{t('common.edit')}</span>
                  </Button>
                  <Button
                    onClick={() => handleDelete(debt.id)}
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
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

