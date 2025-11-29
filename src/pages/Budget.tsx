import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Sparkles, TrendingUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { getBudget, setBudget, BudgetPlan, calculateMonthlyIncome } from '@/lib/storage';
import { generateBudgetPlan } from '@/lib/ai-service';
import { useToast } from '@/hooks/use-toast';

const Budget = () => {
  const { toast } = useToast();
  const [budget, setBudgetState] = useState<BudgetPlan | null>(getBudget());
  const [loading, setLoading] = useState(false);
  const monthlyIncome = calculateMonthlyIncome();

  const generatePlan = async () => {
    setLoading(true);
    try {
      const plan = await generateBudgetPlan();
      const budgetPlan: BudgetPlan = {
        savings: plan.savings,
        necessities: plan.necessities,
        wants: plan.wants,
        investments: plan.investments,
        aiRecommendation: plan.recommendation,
        generatedAt: new Date().toISOString()
      };
      setBudget(budgetPlan);
      setBudgetState(budgetPlan);
      toast({
        title: 'Budget Plan Generated',
        description: 'AI has created your personalized budget plan',
      });
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: 'Could not generate budget plan',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const budgetData = budget ? [
    { name: 'Savings', value: budget.savings, color: 'hsl(var(--success))' },
    { name: 'Necessities', value: budget.necessities, color: 'hsl(var(--primary))' },
    { name: 'Wants', value: budget.wants, color: 'hsl(var(--secondary))' },
    { name: 'Investments', value: budget.investments, color: 'hsl(var(--accent))' }
  ] : [];

  const budgetAmounts = budget && monthlyIncome > 0 ? {
    savings: (monthlyIncome * budget.savings / 100).toFixed(0),
    necessities: (monthlyIncome * budget.necessities / 100).toFixed(0),
    wants: (monthlyIncome * budget.wants / 100).toFixed(0),
    investments: (monthlyIncome * budget.investments / 100).toFixed(0)
  } : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold mb-2">AI Budget Planner</h1>
          <p className="text-muted-foreground">Optimize your spending with AI recommendations</p>
        </div>
        <Button 
          onClick={generatePlan}
          disabled={loading}
          className="gradient-accent text-white"
        >
          {loading ? (
            <>
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              {budget ? 'Regenerate Plan' : 'Generate Plan'}
            </>
          )}
        </Button>
      </div>

      {!budget ? (
        <Card className="glass-card p-12 text-center">
          <div className="max-w-md mx-auto">
            <PieChart className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h3 className="text-2xl font-display font-semibold mb-2">No Budget Plan Yet</h3>
            <p className="text-muted-foreground mb-6">
              Let AI analyze your income and expenses to create a personalized budget plan optimized for your lifestyle as a student and freelancer.
            </p>
            <Button onClick={generatePlan} disabled={loading} className="gradient-primary text-white">
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Budget Plan
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* AI Recommendation */}
          <Card className="glass-card p-6 gradient-primary relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-6 h-6 text-white" />
                <h3 className="text-xl font-display font-semibold text-white">AI Budget Recommendation</h3>
              </div>
              <p className="text-white/90 leading-relaxed">{budget.aiRecommendation}</p>
              <p className="text-white/60 text-sm mt-4">
                Generated on {new Date(budget.generatedAt).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </p>
            </div>
          </Card>

          {/* Budget Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart */}
            <Card className="glass-card p-6">
              <h3 className="text-xl font-display font-semibold mb-4">Budget Allocation</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPie>
                  <Pie
                    data={budgetData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {budgetData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px'
                    }} 
                  />
                </RechartsPie>
              </ResponsiveContainer>
            </Card>

            {/* Breakdown Cards */}
            <div className="space-y-4">
              <h3 className="text-xl font-display font-semibold">Monthly Allocation</h3>
              
              <Card className="glass-card p-4 border-l-4 border-success">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Savings</p>
                    <p className="text-2xl font-display font-bold text-success">{budget.savings}%</p>
                  </div>
                  {budgetAmounts && (
                    <p className="text-xl font-semibold">{budgetAmounts.savings} DZD</p>
                  )}
                </div>
              </Card>

              <Card className="glass-card p-4 border-l-4 border-primary">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Necessities</p>
                    <p className="text-2xl font-display font-bold text-primary">{budget.necessities}%</p>
                  </div>
                  {budgetAmounts && (
                    <p className="text-xl font-semibold">{budgetAmounts.necessities} DZD</p>
                  )}
                </div>
              </Card>

              <Card className="glass-card p-4 border-l-4 border-secondary">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Wants</p>
                    <p className="text-2xl font-display font-bold text-secondary">{budget.wants}%</p>
                  </div>
                  {budgetAmounts && (
                    <p className="text-xl font-semibold">{budgetAmounts.wants} DZD</p>
                  )}
                </div>
              </Card>

              <Card className="glass-card p-4 border-l-4 border-accent">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Investments</p>
                    <p className="text-2xl font-display font-bold text-accent">{budget.investments}%</p>
                  </div>
                  {budgetAmounts && (
                    <p className="text-xl font-semibold">{budgetAmounts.investments} DZD</p>
                  )}
                </div>
              </Card>

              {monthlyIncome === 0 && (
                <Card className="glass-card p-4 bg-warning/10 border-warning">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-warning mt-0.5" />
                    <div>
                      <p className="font-semibold text-warning">Add Income Data</p>
                      <p className="text-sm text-muted-foreground">
                        To see actual amounts, add your monthly income in the Income Manager.
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Budget;
