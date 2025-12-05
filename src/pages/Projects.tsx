import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Briefcase, Clock, DollarSign, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getProjects, addProject, updateProject, Project } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { getPrioritizationAdvice } from '@/lib/ai-service';
import { useTranslation } from 'react-i18next';

const Projects = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [projects, setProjectsState] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    deadline: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    expectedEarnings: '',
    status: 'ongoing' as 'ongoing' | 'completed' | 'pending',
    hoursSpent: '0'
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await getProjects();
      setProjectsState(data);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast({
        title: t('projects.errorLoading'),
        description: t('projects.errorLoadingDesc'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent double submission
    if (isSubmitting) {
      return;
    }
    
    setIsSubmitting(true);
    
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: formData.name,
      client: formData.client,
      deadline: formData.deadline,
      expectedEarnings: parseFloat(formData.expectedEarnings),
      status: formData.status,
      hoursSpent: parseFloat(formData.hoursSpent)
    };

    try {
      await addProject(newProject);
      await loadProjects();
      setShowForm(false);
      setFormData({
        name: '',
        client: '',
        deadline: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        expectedEarnings: '',
        status: 'ongoing',
        hoursSpent: '0'
      });

      toast({
        title: t('projects.projectAdded'),
        description: t('projects.projectAddedDesc', { name: newProject.name }),
      });
      setIsSubmitting(false);
    } catch (error) {
      toast({
        title: t('projects.errorAdding'),
        description: t('projects.errorAddingDesc'),
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  const loadAIAdvice = async () => {
    setLoadingAdvice(true);
    try {
      const advice = await getPrioritizationAdvice();
      setAiAdvice(advice);
    } catch (error) {
      toast({
        title: t('projects.aiAdviceFailed'),
        description: t('projects.aiAdviceFailedDesc'),
        variant: 'destructive',
      });
    } finally {
      setLoadingAdvice(false);
    }
  };

  const updateProjectStatus = async (projectId: string, newStatus: 'ongoing' | 'completed' | 'pending') => {
    try {
      await updateProject(projectId, { status: newStatus });
      await loadProjects();
      toast({
        title: t('projects.projectUpdated'),
        description: t('projects.projectUpdatedDesc'),
      });
    } catch (error) {
      toast({
        title: t('projects.errorUpdating'),
        description: t('projects.errorUpdatingDesc'),
        variant: 'destructive',
      });
    }
  };

  const ongoingProjects = projects.filter(p => p.status === 'ongoing');
  const totalExpectedEarnings = ongoingProjects.reduce((sum, p) => sum + p.expectedEarnings, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing': return 'bg-primary text-primary-foreground';
      case 'completed': return 'bg-success text-success-foreground';
      case 'pending': return 'bg-warning text-warning-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-4xl font-display font-bold mb-1 md:mb-2">{t('projects.title')}</h1>
          <p className="text-xs md:text-base text-muted-foreground">{t('projects.subtitle')}</p>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)}
          className="gradient-primary text-white h-9 px-3 text-xs md:text-sm shrink-0"
          size="sm"
        >
          <Plus className="w-5 h-5 mr-2" />
          {t('projects.addProject')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
        <Card className="glass-card p-3 md:p-6">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="p-2 md:p-4 rounded-lg md:rounded-xl gradient-primary">
              <Briefcase className="w-5 h-5 md:w-8 md:h-8 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs md:text-sm text-muted-foreground">{t('projects.activeProjects')}</p>
              <p className="text-xl md:text-3xl font-display font-bold">{ongoingProjects.length}</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-3 md:p-6">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="p-2 md:p-4 rounded-lg md:rounded-xl gradient-success">
              <DollarSign className="w-5 h-5 md:w-8 md:h-8 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs md:text-sm text-muted-foreground">{t('projects.totalEarnings')}</p>
              <p className="text-xl md:text-3xl font-display font-bold truncate">{totalExpectedEarnings.toLocaleString()} DZD</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-3 md:p-6">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="p-2 md:p-4 rounded-lg md:rounded-xl gradient-accent">
              <Clock className="w-5 h-5 md:w-8 md:h-8 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs md:text-sm text-muted-foreground">{t('common.hours')}</p>
              <p className="text-xl md:text-3xl font-display font-bold">
                {projects.reduce((sum, p) => sum + p.hoursSpent, 0)}h
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* AI Prioritization */}
      {ongoingProjects.length > 0 && (
        <Card className="glass-card p-4 md:p-6 border-accent/30">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h3 className="text-lg md:text-xl font-display font-semibold">{t('projects.aiAdvice')}</h3>
            <Button 
              onClick={loadAIAdvice} 
              disabled={loadingAdvice}
              variant="outline"
              className="border-accent text-accent hover:bg-accent/10"
            >
              {loadingAdvice ? t('common.loading') : t('projects.getAdvice')}
            </Button>
          </div>
          {aiAdvice ? (
            <div className="prose prose-sm max-w-none">
              <p className="text-foreground whitespace-pre-line">{aiAdvice}</p>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              {t('projects.aiAdviceDesc')}
            </p>
          )}
        </Card>
      )}

      {/* Add Project Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass-card p-4 md:p-6">
            <h3 className="text-lg md:text-xl font-display font-semibold mb-3 md:mb-4">{t('projects.addProject')}</h3>
            <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <Label htmlFor="name">{t('projects.projectName')}</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t('projects.projectName')}
                  />
                </div>

                <div>
                  <Label htmlFor="client">{t('projects.client')}</Label>
                  <Input
                    id="client"
                    required
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                    placeholder={t('projects.client')}
                  />
                </div>

                <div>
                  <Label htmlFor="deadline">{t('projects.deadline')}</Label>
                  <Input
                    id="deadline"
                    type="date"
                    required
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="expectedEarnings">{t('projects.expectedEarnings')}</Label>
                  <Input
                    id="expectedEarnings"
                    type="number"
                    required
                    value={formData.expectedEarnings}
                    onChange={(e) => setFormData({ ...formData, expectedEarnings: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="status">{t('projects.status')}</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">{t('projects.pending')}</SelectItem>
                      <SelectItem value="ongoing">{t('projects.ongoing')}</SelectItem>
                      <SelectItem value="completed">{t('projects.completed')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="hoursSpent">{t('projects.hoursSpent')}</Label>
                  <Input
                    id="hoursSpent"
                    type="number"
                    value={formData.hoursSpent}
                    onChange={(e) => setFormData({ ...formData, hoursSpent: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex gap-2 md:gap-3">
                <Button type="submit" className="gradient-primary text-white h-9 md:h-10 text-xs md:text-sm flex-1" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isSubmitting ? t('common.loading') : t('projects.addProject')}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="h-9 md:h-10 text-xs md:text-sm">
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      )}

      {/* Projects List */}
      <div className="space-y-4">
        <h3 className="text-xl font-display font-semibold">{t('projects.title')}</h3>
        {projects.length === 0 ? (
          <Card className="glass-card p-12 text-center">
            <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">{t('projects.noProjects')}</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {projects.map(project => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Card className="glass-card p-4 md:p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-display font-semibold">{project.name}</h4>
                      <p className="text-sm text-muted-foreground">{project.client}</p>
                    </div>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status === 'ongoing' ? t('projects.ongoing') : 
                       project.status === 'completed' ? t('projects.completed') : 
                       t('projects.pending')}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{t('projects.due')}: {format(new Date(project.deadline), 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span>{project.expectedEarnings.toLocaleString()} DZD</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{project.hoursSpent} {t('projects.hoursLogged')}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {project.status === 'ongoing' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updateProjectStatus(project.id, 'completed')}
                        className="border-success text-success hover:bg-success/10"
                      >
                        {t('projects.markComplete')}
                      </Button>
                    )}
                    {project.status === 'pending' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updateProjectStatus(project.id, 'ongoing')}
                        className="border-primary text-primary hover:bg-primary/10"
                      >
                        {t('projects.startProject')}
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;
