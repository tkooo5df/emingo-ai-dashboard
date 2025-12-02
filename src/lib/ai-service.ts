// AI Service using You.com Advanced Agent API (via API server proxy to avoid CORS)
import { getIncome, getExpenses, getProjects, getGoals, getBudget } from './storage';
import { api } from './api';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const callAI = async (prompt: string, systemContext?: string): Promise<string> => {
  try {
    // Combine system context and user prompt
    const fullPrompt = systemContext 
      ? `${systemContext}\n\n${prompt}`
      : prompt;

    const response = await fetch(`${API_BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: fullPrompt
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
      console.error('AI API Error:', errorData);
      return `AI service error: ${errorData.error?.message || errorData.message || response.statusText}`;
    }

    const data = await response.json();
    // The new API returns the response directly in the response body
    return data.response || data.text || data.message || JSON.stringify(data) || 'No response from AI';
  } catch (error: any) {
    console.error('AI Service Error:', error);
    return `Failed to get AI response: ${error.message || 'Unknown error'}`;
  }
};

// Get daily financial tip (global, same for all users, changes every 24 hours)
export const getDailyTip = async (): Promise<string> => {
  try {
    // Get user language from settings
    let userLanguage = 'en';
    try {
      const settings = await api.getSettings();
      userLanguage = settings.language || 'en';
    } catch (e) {
      // Use default language
    }
    
    // Call API endpoint for daily tip (global, cached for 24 hours)
    const response = await fetch(`${API_BASE_URL}/ai/daily-tip?lang=${userLanguage}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch daily tip');
    }
    
    const data = await response.json();
    return data.tip || 'Track your expenses daily to understand your spending patterns better.';
  } catch (error) {
    console.error('Error getting daily tip:', error);
    return 'Track your expenses daily to understand your spending patterns better.';
  }
};

// Analyze spending patterns (brief insights)
export const analyzeSpending = async (): Promise<string> => {
  try {
    const expenses = await getExpenses();
    const income = await getIncome();
    
    // Get user language and profile
    let userLanguage = 'en';
    let profileInfo = { name: 'User', age: null, current_work: null, description: null };
    try {
      const settings = await api.getSettings();
      userLanguage = settings.language || 'en';
      const profile = await api.getProfile();
      profileInfo = {
        name: profile.name || 'User',
        age: profile.age,
        current_work: profile.current_work,
        description: profile.description
      };
    } catch (e) {
      // Use defaults
    }
    
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0);
    
    const expensesByCategory = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);
    
    const topCategory = Object.entries(expensesByCategory)
      .sort(([, a], [, b]) => b - a)[0];
    
    const languagePrompt = userLanguage === 'ar' ? 'بالعربية' : userLanguage === 'fr' ? 'en français' : 'in English';
    const prompt = `User: ${profileInfo.name}${profileInfo.current_work ? `, ${profileInfo.current_work}` : ''}. Answer in ${languagePrompt}. Be brief (2-3 sentences max). No formatting, no asterisks.

Spending Analysis:
Income: ${totalIncome.toLocaleString()} DZD | Expenses: ${totalExpenses.toLocaleString()} DZD | Balance: ${(totalIncome - totalExpenses).toLocaleString()} DZD
Top Category: ${topCategory ? `${topCategory[0]} (${topCategory[1].toLocaleString()} DZD)` : 'N/A'}
Categories: ${Object.keys(expensesByCategory).join(', ')}

Provide brief spending insights based on this data.`;
    
    const systemPrompt = `You are a financial analyst. Answer in ${userLanguage === 'ar' ? 'Arabic' : userLanguage === 'fr' ? 'French' : 'English'}. Be brief and concise. No markdown, no asterisks.`;
    
    const response = await callAI(prompt, systemPrompt);
    
    // Clean response
    return response
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .trim();
  } catch (error) {
    console.error('Error analyzing spending:', error);
    return 'Review your expenses by category to identify areas where you can reduce spending.';
  }
};

// Generate budget plan
export const generateBudgetPlan = async (): Promise<{
  savings: number;
  necessities: number;
  wants: number;
  investments: number;
  recommendation: string;
}> => {
  try {
    const income = await getIncome();
    const expenses = await getExpenses();
    
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
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : response;
      const parsed = JSON.parse(jsonStr);
      
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
  } catch (error) {
    console.error('Error generating budget plan:', error);
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
  try {
    const projects = await getProjects();
    
    const projectSummary = projects
      .filter(p => p.status === 'ongoing')
      .map(p => `${p.name} (Due: ${p.deadline}, Expected: ${p.expectedEarnings} DZD)`)
      .join(', ');
    
    if (!projectSummary) {
      return 'No ongoing projects to prioritize. Start a new project to get personalized advice!';
    }
    
    const prompt = `Prioritize these ongoing freelance projects:
  
${projectSummary}

Provide:
1. Which project to focus on first and why
2. Time allocation suggestion
3. One productivity tip`;
    
    return await callAI(prompt, 'You are a productivity coach for freelancers.');
  } catch (error) {
    console.error('Error getting prioritization advice:', error);
    return 'Focus on projects with the nearest deadlines and highest expected earnings.';
  }
};

// Get goal achievement advice
export const getGoalAdvice = async (goal: { title: string; target: number; current: number; deadline: string }): Promise<string> => {
  try {
    const progress = goal.target > 0 ? ((goal.current / goal.target) * 100).toFixed(1) : 0;
    const prompt = `Goal: ${goal.title}
Target: ${goal.target}
Current: ${goal.current}
Progress: ${progress}%
Deadline: ${goal.deadline}

Provide:
1. Progress assessment
2. Monthly milestones to reach the goal
3. One specific action to take this week`;
    
    return await callAI(prompt, 'You are a goal-setting coach.');
  } catch (error) {
    console.error('Error getting goal advice:', error);
    return 'Break down your goal into smaller weekly milestones to stay on track.';
  }
};

// Calculate financial statistics
function calculateFinancialStats(income: any[], expenses: any[], projects: any[], goals: any[], budget: any) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Monthly calculations
  const monthlyIncome = income
    .filter(i => {
      const date = new Date(i.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, i) => sum + i.amount, 0);
  
  const monthlyExpenses = expenses
    .filter(e => {
      const date = new Date(e.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + e.amount, 0);
  
  // Total calculations
  const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  // Expenses by category
  const expensesByCategory = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);
  
  const topExpenseCategory = Object.entries(expensesByCategory)
    .sort(([, a], [, b]) => b - a)[0];
  
  // Income by source
  const incomeBySource = income.reduce((acc, inc) => {
    const source = inc.source || inc.category || 'Unknown';
    acc[source] = (acc[source] || 0) + inc.amount;
    return acc;
  }, {} as Record<string, number>);
  
  const topIncomeSource = Object.entries(incomeBySource)
    .sort(([, a], [, b]) => b - a)[0];
  
  // Savings rate
  const savingsRate = monthlyIncome > 0 
    ? ((monthlyIncome - monthlyExpenses) / monthlyIncome * 100).toFixed(1)
    : '0';
  
  // Recent activity (last 7 days)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentIncome = income.filter(i => new Date(i.date) >= sevenDaysAgo).length;
  const recentExpenses = expenses.filter(e => new Date(e.date) >= sevenDaysAgo).length;
  
  // Projects analysis
  const activeProjects = projects.filter(p => p.status === 'ongoing');
  const completedProjects = projects.filter(p => p.status === 'completed');
  const totalExpectedEarnings = activeProjects.reduce((sum, p) => sum + (p.expectedEarnings || 0), 0);
  
  // Goals analysis
  const activeGoals = goals.filter(g => {
    if (!g.deadline) return true;
    return new Date(g.deadline) > now;
  });
  const goalsProgress = activeGoals.map(g => ({
    title: g.title,
    progress: g.target > 0 ? ((g.current / g.target) * 100).toFixed(1) : '0',
    remaining: g.target - g.current
  }));
  
  // Spending trends (compare last month to this month)
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  
  const lastMonthIncome = income
    .filter(i => {
      const date = new Date(i.date);
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
    })
    .reduce((sum, i) => sum + i.amount, 0);
  
  const lastMonthExpenses = expenses
    .filter(e => {
      const date = new Date(e.date);
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
    })
    .reduce((sum, e) => sum + e.amount, 0);
  
  const incomeTrend = lastMonthIncome > 0 
    ? (((monthlyIncome - lastMonthIncome) / lastMonthIncome) * 100).toFixed(1)
    : '0';
  
  const expenseTrend = lastMonthExpenses > 0
    ? (((monthlyExpenses - lastMonthExpenses) / lastMonthExpenses) * 100).toFixed(1)
    : '0';
  
  return {
    monthlyIncome,
    monthlyExpenses,
    totalIncome,
    totalExpenses,
    savingsRate,
    expensesByCategory,
    topExpenseCategory,
    incomeBySource,
    topIncomeSource,
    recentIncome,
    recentExpenses,
    activeProjects: activeProjects.length,
    completedProjects: completedProjects.length,
    totalExpectedEarnings,
    activeGoals: activeGoals.length,
    goalsProgress,
    incomeTrend,
    expenseTrend,
    hasBudget: !!budget,
    budgetAllocation: budget ? {
      savings: budget.savings || 0,
      necessities: budget.necessities || 0,
      wants: budget.wants || 0,
      investments: budget.investments || 0
    } : null
  };
}

// General assistant query with comprehensive context - based on user's current data only
export const askAssistant = async (question: string): Promise<string> => {
  try {
    // Fetch user's current data
    const [income, expenses, projects, goals, budget] = await Promise.all([
      getIncome(),
      getExpenses(),
      getProjects(),
      getGoals(),
      getBudget()
    ]);
    
    // Calculate comprehensive financial statistics from user's actual data
    const stats = calculateFinancialStats(income, expenses, projects, goals, budget);
    const activeProjects = projects.filter(p => p.status === 'ongoing');
    
    // Get user profile for personalized context
    let profileInfo = {
      name: 'User',
      age: null as number | null,
      current_work: null as string | null,
      description: null as string | null
    };
    
    // Get user language from settings
    let userLanguage = 'en';
    try {
      const profile = await api.getProfile();
      profileInfo = {
        name: profile.name || 'User',
        age: profile.age,
        current_work: profile.current_work,
        description: profile.description
      };
      
      const settings = await api.getSettings();
      userLanguage = settings.language || 'en';
    } catch (e) {
      console.error('Error loading profile/settings for AI:', e);
    }
    
    // Build context using ONLY the user's current data
    const context = `You are EMINGO AI, a financial assistant. Answer in ${userLanguage === 'ar' ? 'Arabic' : userLanguage === 'fr' ? 'French' : 'English'}. Be brief and concise. No markdown formatting, no asterisks, no bullet points. Use simple sentences. Base your answer ONLY on the user's actual current data provided below.

USER PROFILE:
Name: ${profileInfo.name}${profileInfo.age ? `, Age: ${profileInfo.age}` : ''}${profileInfo.current_work ? `, Work: ${profileInfo.current_work}` : ''}
${profileInfo.description ? `About: ${profileInfo.description}` : ''}

USER'S CURRENT FINANCIAL DATA:
Monthly Income: ${stats.monthlyIncome.toLocaleString()} DZD | Monthly Expenses: ${stats.monthlyExpenses.toLocaleString()} DZD | Net Balance: ${(stats.monthlyIncome - stats.monthlyExpenses).toLocaleString()} DZD
Savings Rate: ${stats.savingsRate}% | Income Trend: ${parseFloat(stats.incomeTrend) > 0 ? '+' : ''}${stats.incomeTrend}% | Expense Trend: ${parseFloat(stats.expenseTrend) > 0 ? '+' : ''}${stats.expenseTrend}%
Top Expense Category: ${stats.topExpenseCategory ? `${stats.topExpenseCategory[0]} (${stats.topExpenseCategory[1].toLocaleString()} DZD)` : 'N/A'} | Top Income Source: ${stats.topIncomeSource ? `${stats.topIncomeSource[0]} (${stats.topIncomeSource[1].toLocaleString()} DZD)` : 'N/A'}
Active Projects: ${stats.activeProjects} (${stats.totalExpectedEarnings.toLocaleString()} DZD potential) | Active Goals: ${stats.activeGoals}
${stats.monthlyExpenses > stats.monthlyIncome ? 'WARNING: Monthly expenses exceed monthly income' : ''}
${income.length > 0 ? `Total Income Entries: ${income.length}` : 'No income recorded yet'}
${expenses.length > 0 ? `Total Expense Entries: ${expenses.length}` : 'No expenses recorded yet'}

USER'S QUESTION: ${question}

IMPORTANT: Provide advice based ONLY on the user's actual data shown above. Use their real numbers. Do not make assumptions. Be direct and actionable. Maximum 3-4 sentences.`;
    
    const systemPrompt = `You are EMINGO AI, a financial assistant. Answer in ${userLanguage === 'ar' ? 'Arabic' : userLanguage === 'fr' ? 'French' : 'English'}. Be brief, concise, and direct. No markdown, no asterisks, no formatting. Use simple sentences. Provide personalized advice based ONLY on the user's actual current financial data provided. Do not use generic advice - use their specific numbers and situation.`;
    
    const response = await callAI(context, systemPrompt);
    
    // Clean response: remove markdown, asterisks, and excessive formatting
    return response
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`/g, '')
      .trim();
  } catch (error) {
    console.error('Error asking assistant:', error);
    return 'I apologize, but I encountered an error. Please try again.';
  }
};
