import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Briefcase, Clock, DollarSign, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getProjects, addProject, setProjects, Project } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { getPrioritizationAdvice } from '@/lib/ai-service';

const Projects = () => {
  const { toast } = useToast();
  const [projects, setProjectsState] = useState<Project[]>(getProjects());
  const [showForm, setShowForm] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    deadline: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    expectedEarnings: '',
    status: 'ongoing' as 'ongoing' | 'completed' | 'pending',
    hoursSpent: '0'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newProject: Project = {
      id: Date.now().toString(),
      name: formData.name,
      client: formData.client,
      deadline: formData.deadline,
      expectedEarnings: parseFloat(formData.expectedEarnings),
      status: formData.status,
      hoursSpent: parseFloat(formData.hoursSpent)
    };

    addProject(newProject);
    setProjectsState(getProjects());
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
      title: 'Project Added',
      description: `${newProject.name} has been added to your projects`,
    });
  };

  const loadAIAdvice = async () => {
    setLoadingAdvice(true);
    try {
      const advice = await getPrioritizationAdvice();
      setAiAdvice(advice);
    } catch (error) {
      toast({
        title: 'AI Advice Failed',
        description: 'Could not generate project prioritization advice',
        variant: 'destructive',
      });
    } finally {
      setLoadingAdvice(false);
    }
  };

  const updateProjectStatus = (projectId: string, newStatus: 'ongoing' | 'completed' | 'pending') => {
    const updated = projects.map(p => 
      p.id === projectId ? { ...p, status: newStatus } : p
    );
    setProjects(updated);
    setProjectsState(updated);
    toast({
      title: 'Project Updated',
      description: 'Project status has been changed',
    });
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold mb-2">Project Manager</h1>
          <p className="text-muted-foreground">Track your freelance projects and deadlines</p>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)}
          className="gradient-primary text-white"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Project
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card p-6">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl gradient-primary">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Projects</p>
              <p className="text-3xl font-display font-bold">{ongoingProjects.length}</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-6">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl gradient-success">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expected Earnings</p>
              <p className="text-3xl font-display font-bold">{totalExpectedEarnings.toLocaleString()} DZD</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-6">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl gradient-accent">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Hours</p>
              <p className="text-3xl font-display font-bold">
                {projects.reduce((sum, p) => sum + p.hoursSpent, 0)}h
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* AI Prioritization */}
      {ongoingProjects.length > 0 && (
        <Card className="glass-card p-6 border-accent/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-display font-semibold">AI Project Prioritization</h3>
            <Button 
              onClick={loadAIAdvice} 
              disabled={loadingAdvice}
              variant="outline"
              className="border-accent text-accent hover:bg-accent/10"
            >
              {loadingAdvice ? 'Analyzing...' : 'Get AI Advice'}
            </Button>
          </div>
          {aiAdvice ? (
            <div className="prose prose-sm max-w-none">
              <p className="text-foreground whitespace-pre-line">{aiAdvice}</p>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Get AI-powered advice on which projects to prioritize based on deadlines and earnings
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
          <Card className="glass-card p-6">
            <h3 className="text-xl font-display font-semibold mb-4">Add New Project</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Website Design"
                  />
                </div>

                <div>
                  <Label htmlFor="client">Client</Label>
                  <Input
                    id="client"
                    required
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                    placeholder="Client Name"
                  />
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
                  <Label htmlFor="expectedEarnings">Expected Earnings (DZD)</Label>
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
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="hoursSpent">Hours Spent</Label>
                  <Input
                    id="hoursSpent"
                    type="number"
                    value={formData.hoursSpent}
                    onChange={(e) => setFormData({ ...formData, hoursSpent: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="gradient-primary text-white">
                  Add Project
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      )}

      {/* Projects List */}
      <div className="space-y-4">
        <h3 className="text-xl font-display font-semibold">All Projects</h3>
        {projects.length === 0 ? (
          <Card className="glass-card p-12 text-center">
            <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No projects yet. Add your first freelance project!</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {projects.map(project => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Card className="glass-card p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-display font-semibold">{project.name}</h4>
                      <p className="text-sm text-muted-foreground">{project.client}</p>
                    </div>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>Due: {format(new Date(project.deadline), 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span>{project.expectedEarnings.toLocaleString()} DZD</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{project.hoursSpent} hours logged</span>
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
                        Mark Complete
                      </Button>
                    )}
                    {project.status === 'pending' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updateProjectStatus(project.id, 'ongoing')}
                        className="border-primary text-primary hover:bg-primary/10"
                      >
                        Start Project
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
