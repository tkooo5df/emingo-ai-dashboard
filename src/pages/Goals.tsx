import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Target, TrendingUp, GraduationCap, Briefcase, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { getGoals, addGoal, setGoals, Goal } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { getGoalAdvice } from '@/lib/ai-service';
import { Textarea } from '@/components/ui/textarea';

const Goals = () => {
  const { toast } = useToast();
  const [goals, setGoalsState] = useState<Goal[]>(getGoals());
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newGoal: Goal = {
      id: Date.now().toString(),
      title: formData.title,
      type: formData.type,
      target: parseFloat(formData.target),
      current: parseFloat(formData.current),
      deadline: formData.deadline,
      description: formData.description
    };

    addGoal(newGoal);
    setGoalsState(getGoals());
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
      title: 'Goal Added',
      description: `${newGoal.title} has been added to your goals`,
    });
  };

  const loadGoalAdvice = async (goal: Goal) => {
    setLoadingAdvice(true);
    try {
      const advice = await getGoalAdvice(goal);
      setSelectedGoalAdvice({ id: goal.id, advice });
    } catch (error) {
      toast({
        title: 'AI Advice Failed',
        description: 'Could not generate goal achievement advice',
        variant: 'destructive',
      });
    } finally {
      setLoadingAdvice(false);
    }
  };

  const updateGoalProgress = (goalId: string, newCurrent: number) => {
    const updated = goals.map(g => 
      g.id === goalId ? { ...g, current: newCurrent } : g
    );
    setGoals(updated);
    setGoalsState(updated);
    toast({
      title: 'Progress Updated',
      description: 'Goal progress has been updated',
    });
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
          <h1 className="text-4xl font-display font-bold mb-2">Goals Tracker</h1>
          <p className="text-muted-foreground">Set and achieve your personal and professional goals</p>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)}
          className="gradient-accent text-white"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Goal
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
              <p className="text-sm text-muted-foreground">Total Goals</p>
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
              <p className="text-sm text-muted-foreground">Average Progress</p>
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
              <p className="text-sm text-muted-foreground">Completed</p>
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
            <h3 className="text-xl font-display font-semibold mb-4">Create New Goal</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="title">Goal Title</Label>
                  <Input
                    id="title"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Save for new laptop"
                  />
                </div>

                <div>
                  <Label htmlFor="type">Goal Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="financial">Financial</SelectItem>
                      <SelectItem value="career">Career</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    required
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="target">Target {formData.type === 'financial' ? '(DZD)' : ''}</Label>
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
                  <Label htmlFor="current">Current Progress {formData.type === 'financial' ? '(DZD)' : ''}</Label>
                  <Input
                    id="current"
                    type="number"
                    value={formData.current}
                    onChange={(e) => setFormData({ ...formData, current: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Why is this goal important to you?"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="gradient-accent text-white">
                  Create Goal
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      )}

      {/* Goals List */}
      <div className="space-y-4">
        <h3 className="text-xl font-display font-semibold">Your Goals</h3>
        {goals.length === 0 ? (
          <Card className="glass-card p-12 text-center">
            <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No goals yet. Set your first goal to get started!</p>
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
                        <Badge className="bg-success text-success-foreground">✓ Achieved</Badge>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-semibold">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="flex justify-between text-sm mt-2">
                          <span className="text-muted-foreground">
                            {goal.type === 'financial' ? `${goal.current.toLocaleString()} DZD` : goal.current}
                          </span>
                          <span className="text-muted-foreground">
                            {goal.type === 'financial' ? `${goal.target.toLocaleString()} DZD` : goal.target}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>Due: {format(new Date(goal.deadline), 'MMM dd, yyyy')}</span>
                      </div>

                      <div className="flex gap-2">
                        {!isCompleted && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              const newCurrent = parseFloat(prompt(`Update progress (current: ${goal.current}, target: ${goal.target})`, goal.current.toString()) || goal.current.toString());
                              if (!isNaN(newCurrent) && newCurrent !== goal.current) {
                                updateGoalProgress(goal.id, newCurrent);
                              }
                            }}
                            className="border-primary text-primary hover:bg-primary/10"
                          >
                            Update Progress
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => loadGoalAdvice(goal)}
                          disabled={loadingAdvice}
                          className="border-accent text-accent hover:bg-accent/10"
                        >
                          {loadingAdvice && selectedGoalAdvice?.id === goal.id ? 'Loading...' : 'AI Advice'}
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
