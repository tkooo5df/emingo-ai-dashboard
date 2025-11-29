// AI Service using AgentRouter GPT-5.1
import { getIncome, getExpenses, getProjects, getGoals, getBudget } from './storage';

const API_KEY = import.meta.env.VITE_AGENTROUTER_API_KEY;
const API_ENDPOINT = 'https://api.agentrouter.org/v1/chat/completions';

interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const callAI = async (prompt: string, systemContext?: string): Promise<string> => {
  if (!API_KEY) {
    return "AI service is not configured. Please add your AgentRouter API key.";
  }

  try {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: systemContext || 'You are a helpful AI financial and productivity assistant for EMINGO. Provide clear, actionable advice.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-5.1',
        messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AI API Error:', error);
      return `AI service error: ${response.statusText}`;
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('AI Service Error:', error);
    return 'Failed to get AI response. Please try again.';
  }
};

// Get daily financial tip
export const getDailyTip = async (): Promise<string> => {
  const income = getIncome();
  const expenses = getExpenses();
  
  const prompt = `Based on a user who is a 20-year-old student and freelancer in Algeria, provide ONE practical daily financial tip. Keep it short (2-3 sentences) and actionable. Recent activity: ${income.length} income entries, ${expenses.length} expense entries this month.`;
  
  return await callAI(prompt, 'You are a financial advisor providing daily tips for young professionals.');
};

// Analyze spending patterns
export const analyzeSpending = async (): Promise<string> => {
  const expenses = getExpenses();
  const income = getIncome();
  
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0);
  
  const expensesByCategory = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);
  
  const prompt = `Analyze this spending data for a student/freelancer in Algeria:
  
Total Income: ${totalIncome} DZD
Total Expenses: ${totalExpenses} DZD
Expenses by Category: ${JSON.stringify(expensesByCategory)}

Provide:
1. Key spending insights (2-3 points)
2. One immediate action to reduce expenses
3. One opportunity to optimize spending`;
  
  return await callAI(prompt, 'You are a financial analyst providing spending insights.');
};

// Generate budget plan
export const generateBudgetPlan = async (): Promise<{
  savings: number;
  necessities: number;
  wants: number;
  investments: number;
  recommendation: string;
}> => {
  const income = getIncome();
  const expenses = getExpenses();
  
  const totalIncome = income
    .filter(i => new Date(i.date).getMonth() === new Date().getMonth())
    .reduce((sum, inc) => sum + inc.amount, 0);
  
  const totalExpenses = expenses
    .filter(e => new Date(e.date).getMonth() === new Date().getMonth())
    .reduce((sum, exp) => sum + exp.amount, 0);
  
  const prompt = `Create a monthly budget plan for a 20-year-old student/freelancer in Algeria with:
  
Monthly Income: ${totalIncome} DZD
Average Expenses: ${totalExpenses} DZD

Provide a JSON response with percentages (must sum to 100):
{
  "savings": <percentage>,
  "necessities": <percentage>,
  "wants": <percentage>,
  "investments": <percentage>,
  "recommendation": "<brief explanation of this allocation>"
}`;
  
  const response = await callAI(prompt, 'You are a financial planner. Respond ONLY with valid JSON.');
  
  try {
    const parsed = JSON.parse(response);
    return {
      savings: parsed.savings || 20,
      necessities: parsed.necessities || 50,
      wants: parsed.wants || 20,
      investments: parsed.investments || 10,
      recommendation: parsed.recommendation || 'Balanced budget for students'
    };
  } catch {
    // Fallback budget
    return {
      savings: 20,
      necessities: 50,
      wants: 20,
      investments: 10,
      recommendation: 'Standard student budget: 50-30-20 rule adapted for Algerian context'
    };
  }
};

// Get project prioritization advice
export const getPrioritizationAdvice = async (): Promise<string> => {
  const projects = getProjects();
  
  const projectSummary = projects
    .filter(p => p.status === 'ongoing')
    .map(p => `${p.name} (Due: ${p.deadline}, Expected: ${p.expectedEarnings} DZD)`)
    .join(', ');
  
  const prompt = `Prioritize these ongoing freelance projects:
  
${projectSummary}

Provide:
1. Which project to focus on first and why
2. Time allocation suggestion
3. One productivity tip`;
  
  return await callAI(prompt, 'You are a productivity coach for freelancers.');
};

// Get goal achievement advice
export const getGoalAdvice = async (goal: { title: string; target: number; current: number; deadline: string }): Promise<string> => {
  const prompt = `Goal: ${goal.title}
Target: ${goal.target}
Current: ${goal.current}
Deadline: ${goal.deadline}

Provide:
1. Progress assessment
2. Monthly milestones to reach the goal
3. One specific action to take this week`;
  
  return await callAI(prompt, 'You are a goal-setting coach.');
};

// General assistant query
export const askAssistant = async (question: string): Promise<string> => {
  const income = getIncome();
  const expenses = getExpenses();
  const projects = getProjects();
  const goals = getGoals();
  const budget = getBudget();
  
  const context = `User Context:
- Name: Amine, 20-year-old student and freelancer in Algeria
- Income entries: ${income.length}
- Expense entries: ${expenses.length}
- Active projects: ${projects.filter(p => p.status === 'ongoing').length}
- Goals: ${goals.length}
- Has budget plan: ${budget ? 'Yes' : 'No'}

User Question: ${question}`;
  
  return await callAI(context, 'You are EMINGO AI, a personal financial and productivity assistant for Amine.');
};
