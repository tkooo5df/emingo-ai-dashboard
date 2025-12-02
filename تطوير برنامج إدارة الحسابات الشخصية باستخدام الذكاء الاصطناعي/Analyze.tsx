import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Zap, BarChart3, Target, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Markdown } from '@/components/Markdown';

interface FinancialData {
  amount: number;
  category: string;
  date: string;
}

interface GoalData {
  name: string;
  target: number;
  current: number;
  deadline: string;
}

interface AnalysisData {
  success: boolean;
  income: FinancialData[];
  expenses: FinancialData[];
  goals: GoalData[];
  analysis: string;
}

const Analyze = () => {
  const { t } = useTranslation();
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAnalysis = async () => {
    setLoading(true);
    setAnalysisData(null);
    try {
      const data: AnalysisData = await api.get('/api/analyze');
      setAnalysisData(data);
      toast({
        title: t('analyze.successTitle'),
        description: t('analyze.successDescription'),
      });
    } catch (error) {
      console.error('Error fetching analysis:', error);
      toast({
        title: t('analyze.errorTitle'),
        description: t('analyze.errorDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const renderAnalysisCard = () => {
    if (loading) {
      return (
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {t('analyze.generatingTitle')}
            </CardTitle>
            <CardDescription>{t('analyze.generatingDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-40 flex items-center justify-center text-muted-foreground">
              {t('analyze.aiWorking')}
            </div>
          </CardContent>
        </Card>
      );
    }

    if (!analysisData || !analysisData.analysis) {
      return (
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="mr-2 h-5 w-5" />
              {t('analyze.noDataTitle')}
            </CardTitle>
            <CardDescription>{t('analyze.noDataDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchAnalysis} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('analyze.retryButton')}
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="mr-2 h-6 w-6 text-primary" />
            {t('analyze.aiAnalysisTitle')}
          </CardTitle>
          <CardDescription>{t('analyze.aiAnalysisDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] p-4 border rounded-lg">
            <Markdown content={analysisData.analysis} />
          </ScrollArea>
        </CardContent>
      </Card>
    );
  };

  const renderDataSummary = () => {
    if (!analysisData || loading) return null;

    const totalIncome = analysisData.income.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = analysisData.expenses.reduce((sum, item) => sum + item.amount, 0);
    const netFlow = totalIncome - totalExpenses;
    const currency = t('currency'); // Assuming 'currency' is defined in i18n

    return (
      <Card className="col-span-full lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5" />
            {t('analyze.dataSummaryTitle')}
          </CardTitle>
          <CardDescription>{t('analyze.dataSummaryDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="font-medium">{t('analyze.totalIncome')}</span>
            <span className="text-green-600 font-bold">{totalIncome.toFixed(2)} {currency}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">{t('analyze.totalExpenses')}</span>
            <span className="text-red-600 font-bold">{totalExpenses.toFixed(2)} {currency}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>{t('analyze.netFlow')}</span>
            <span className={netFlow >= 0 ? 'text-green-700' : 'text-red-700'}>
              {netFlow.toFixed(2)} {currency}
            </span>
          </div>
          <Separator />
          <h4 className="text-md font-semibold mt-4">{t('analyze.goalsTitle')}</h4>
          <ul className="space-y-2">
            {analysisData.goals.map((goal, index) => (
              <li key={index} className="flex justify-between items-center text-sm">
                <span className="flex items-center">
                  <Target className="mr-2 h-4 w-4 text-blue-500" />
                  {goal.name}
                </span>
                <span className="text-muted-foreground">
                  {((goal.current / goal.target) * 100).toFixed(0)}%
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">{t('analyze.title')}</h1>
        <Button onClick={fetchAnalysis} disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          {t('analyze.refreshButton')}
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {renderAnalysisCard()}
        {renderDataSummary()}
      </div>
    </div>
  );
};

export default Analyze;
