import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Target, TrendingUp, GraduationCap, Briefcase, Calendar, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { getGoals, addGoal, updateGoal, Goal } from '@/lib/storage';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { getGoalAdvice } from '@/lib/ai-service';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';

const Goals = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [goals, setGoalsState] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedGoalAdvice, setSelectedGoalAdvice] = useState<{ id: string; advice: string } | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'financial' as 'financial' | 'career' | 'education',
    target: '',
    current: '0',
    deadline: format(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    description: ''
  });

  useEffect(() => {
    loadGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const data = await getGoals();
      setGoalsState(data);
    } catch (error) {
      console.error('Error loading goals:', error);
      toast({
        title: t('goals.errorLoading'),
        description: t('goals.errorLoadingDesc'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newGoal: Goal = {
      id: crypto.randomUUID(),
      title: formData.title,
      type: formData.type,
      target: parseFloat(formData.target),
      current: parseFloat(formData.current),
      deadline: formData.deadline,
      description: formData.description
    };

    try {
      await addGoal(newGoal);
      await loadGoals();
      setShowForm(false);
      setFormData({
        title: '',
        type: 'financial',
        target: '',
        current: '0',
        deadline: format(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        description: ''
      });

      toast({
        title: t('goals.goalAdded'),
        description: t('goals.goalAddedDesc', { title: newGoal.title }),
      });
    } catch (error) {
      toast({
        title: t('goals.errorAdding'),
        description: t('goals.errorAddingDesc'),
        variant: 'destructive',
      });
    }
  };

  const updateGoalProgress = async (goalId: string, newCurrent: number) => {
    try {
      await updateGoal(goalId, { current: newCurrent });
      await loadGoals();
      toast({
        title: t('goals.progressUpdated'),
        description: t('goals.progressUpdatedDesc'),
      });
    } catch (error) {
      toast({
        title: t('goals.errorUpdating'),
        description: t('goals.errorUpdatingDesc'),
        variant: 'destructive',
      });
    }
  };

  const loadGoalAdvice = async (goal: Goal) => {
    setLoadingAdvice(true);
    try {
      const advice = await getGoalAdvice(goal);
      setSelectedGoalAdvice({ id: goal.id, advice });
    } catch (error) {
      toast({
        title: t('goals.aiAdviceFailed'),
        description: t('goals.aiAdviceFailedDesc'),
        variant: 'destructive',
      });
    } finally {
      setLoadingAdvice(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'financial': return TrendingUp;
      case 'career': return Briefcase;
      case 'education': return GraduationCap;
      default: return Target;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'financial': return 'bg-success text-success-foreground';
      case 'career': return 'bg-primary text-primary-foreground';
      case 'education': return 'bg-accent text-accent-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold mb-2">{t('goals.title')}</h1>
          <p className="text-muted-foreground">{t('goals.subtitle')}</p>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)}
          className="gradient-accent text-white"
        >
          <Plus className="w-5 h-5 mr-2" />
          {t('goals.addGoal')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card p-6">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl gradient-primary">
              <Target className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('goals.totalGoals')}</p>
              <p className="text-3xl font-display font-bold">{goals.length}</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-6">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl gradient-success">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('goals.progress')}</p>
              <p className="text-3xl font-display font-bold">
                {goals.length > 0 
                  ? Math.round(goals.reduce((sum, g) => sum + (g.current / g.target * 100), 0) / goals.length)
                  : 0}%
              </p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-6">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl gradient-accent">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('goals.completedGoals')}</p>
              <p className="text-3xl font-display font-bold">
                {goals.filter(g => g.current >= g.target).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Add Goal Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass-card p-6">
            <h3 className="text-xl font-display font-semibold mb-4">{t('goals.createGoal')}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="title">{t('goals.goalTitle')}</Label>
                  <Input
                    id="title"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={t('goals.goalTitle')}
                  />
                </div>

                <div>
                  <Label htmlFor="type">{t('common.type')}</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: 'financial' | 'career' | 'education') => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="financial">{t('goals.financial')}</SelectItem>
                      <SelectItem value="career">{t('goals.career')}</SelectItem>
                      <SelectItem value="education">{t('goals.education')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="deadline">{t('goals.deadline')}</Label>
                  <Input
                    id="deadline"
                    type="date"
                    required
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="target">{t('goals.target')} {formData.type === 'financial' ? '(DZD)' : ''}</Label>
                  <Input
                    id="target"
                    type="number"
                    required
                    value={formData.target}
                    onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                    placeholder="e.g., 50000"
                  />
                </div>

                <div>
                  <Label htmlFor="current">{t('goals.currentProgress')} {formData.type === 'financial' ? '(DZD)' : ''}</Label>
                  <Input
                    id="current"
                    type="number"
                    value={formData.current}
                    onChange={(e) => setFormData({ ...formData, current: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">{t('goals.description')}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t('goals.whyImportant')}
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="gradient-accent text-white">
                  {t('goals.createGoal')}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      )}

      {/* Goals List */}
      <div className="space-y-4">
        <h3 className="text-xl font-display font-semibold">{t('goals.yourGoals')}</h3>
        {goals.length === 0 ? (
          <Card className="glass-card p-12 text-center">
            <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">{t('goals.noGoals')}</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {goals.map(goal => {
              const Icon = getTypeIcon(goal.type);
              const progress = Math.min(Math.round((goal.current / goal.target) * 100), 100);
              const isCompleted = goal.current >= goal.target;

              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Card className="glass-card p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${getTypeColor(goal.type)}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-display font-semibold">{goal.title}</h4>
                          {goal.description && (
                            <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                          )}
                        </div>
                      </div>
                      {isCompleted && (
                        <Badge className="bg-success text-success-foreground">✓ {t('goals.achieved')}</Badge>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">{t('goals.progress')}</span>
                          <span className={`font-semibold ${isCompleted ? 'text-success' : ''}`}>{progress}%</span>
                        </div>
                        <Progress 
                          value={isCompleted ? 100 : progress} 
                          className="h-2"
                          indicatorClassName={isCompleted ? "bg-success" : "bg-primary"}
                        />
                        <div className="flex justify-between text-sm mt-2">
                          <span className={`${isCompleted ? 'text-success font-semibold' : 'text-muted-foreground'}`}>
                            {goal.type === 'financial' ? `${goal.current.toLocaleString()} DZD` : goal.current}
                          </span>
                          <span className="text-muted-foreground">
                            {goal.type === 'financial' ? `${goal.target.toLocaleString()} DZD` : goal.target}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{t('goals.deadline')}: {format(new Date(goal.deadline), 'MMM dd, yyyy')}</span>
                      </div>

                      <div className="flex gap-2">
                        {!isCompleted && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              const newCurrent = parseFloat(prompt(`${t('goals.updateProgress')} (${t('goals.currentProgress')}: ${goal.current}, ${t('goals.target')}: ${goal.target})`, goal.current.toString()) || goal.current.toString());
                              if (!isNaN(newCurrent) && newCurrent !== goal.current) {
                                updateGoalProgress(goal.id, newCurrent);
                              }
                            }}
                            className="border-primary text-primary hover:bg-primary/10"
                          >
                            {t('goals.updateProgress')}
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => loadGoalAdvice(goal)}
                          disabled={loadingAdvice}
                          className="border-accent text-accent hover:bg-accent/10"
                        >
                          {loadingAdvice && selectedGoalAdvice?.id === goal.id ? t('common.loading') : t('goals.getAdvice')}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={async () => {
                            if (confirm(t('goals.confirmDelete', { title: goal.title }))) {
                              try {
                                await api.deleteGoal(goal.id);
                                await loadGoals();
                                toast({
                                  title: t('success.deleted'),
                                  description: t('goals.goalDeleted', { title: goal.title }),
                                });
                              } catch (error) {
                                console.error('Error deleting goal:', error);
                                toast({
                                  title: t('errors.errorDeleting'),
                                  description: t('errors.couldNotDelete'),
                                  variant: 'destructive',
                                });
                              }
                            }
                          }}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {selectedGoalAdvice?.id === goal.id && selectedGoalAdvice.advice && (
                        <Card className="bg-accent/5 border-accent/20 p-4 mt-4">
                          <p className="text-sm text-foreground whitespace-pre-line">{selectedGoalAdvice.advice}</p>
                        </Card>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Goals;
