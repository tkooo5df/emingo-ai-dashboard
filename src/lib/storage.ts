// Database storage utilities for EMINGO
import { api } from './api';

export interface IncomeEntry {
  id: string;
  amount: number;
  source: string;
  category: string;
  date: string;
  description?: string;
  account_id?: string;
  account_type?: 'ccp' | 'cash' | 'creditcard';
}

export interface ExpenseEntry {
  id: string;
  amount: number;
  category: string;
  date: string;
  description?: string;
  account_id?: string;
  account_type?: 'ccp' | 'cash' | 'creditcard';
}

export interface Project {
  id: string;
  name: string;
  client: string;
  deadline: string;
  expectedEarnings: number;
  status: 'ongoing' | 'completed' | 'pending';
  hoursSpent: number;
}

export interface Goal {
  id: string;
  title: string;
  type: 'financial' | 'career' | 'education';
  target: number;
  current: number;
  deadline: string;
  description?: string;
}

export interface BudgetPlan {
  savings: number;
  necessities: number;
  wants: number;
  investments: number;
  aiRecommendation?: string;
  generatedAt: string;
}

const STORAGE_KEYS = {
  THEME: 'emingo_theme',
};

// Theme operations (stays in localStorage)
export const getTheme = (): 'light' | 'dark' => {
  try {
    const item = localStorage.getItem(STORAGE_KEYS.THEME);
    return item ? JSON.parse(item) : 'dark';
  } catch (error) {
    return 'dark';
  }
};

export const setTheme = (theme: 'light' | 'dark') => {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, JSON.stringify(theme));
  } catch (error) {
    console.error('Error saving theme:', error);
  }
};

// Income operations
export const getIncome = async (): Promise<IncomeEntry[]> => {
  try {
    return await api.getIncome();
  } catch (error) {
    console.error('Error fetching income:', error);
    return [];
  }
};

export const addIncome = async (entry: IncomeEntry): Promise<void> => {
  try {
    const result = await api.addIncome(entry);

  } catch (error) {
    console.error('❌ [STORAGE] Error adding income:', error);
    console.error('❌ [STORAGE] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      entry
    });
    throw error;
  }
};

// Expense operations
export const getExpenses = async (): Promise<ExpenseEntry[]> => {
  try {
    return await api.getExpenses();
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return [];
  }
};

export const addExpense = async (entry: ExpenseEntry): Promise<void> => {
  try {
    const result = await api.addExpense(entry);

  } catch (error) {
    console.error('❌ [STORAGE] Error adding expense:', error);
    console.error('❌ [STORAGE] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      entry
    });
    throw error;
  }
};

// Project operations
export const getProjects = async (): Promise<Project[]> => {
  try {
    return await api.getProjects();
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
};

export const addProject = async (project: Project): Promise<void> => {
  try {
    await api.addProject(project);
  } catch (error) {
    console.error('Error adding project:', error);
    throw error;
  }
};

export const updateProject = async (projectId: string, updates: Partial<Project>): Promise<void> => {
  try {
    await api.updateProject(projectId, updates);
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};

// Goal operations
export const getGoals = async (): Promise<Goal[]> => {
  try {
    return await api.getGoals();
  } catch (error) {
    console.error('Error fetching goals:', error);
    return [];
  }
};

export const addGoal = async (goal: Goal): Promise<void> => {
  try {
    await api.addGoal(goal);
  } catch (error) {
    console.error('Error adding goal:', error);
    throw error;
  }
};

export const updateGoal = async (goalId: string, updates: Partial<Goal>): Promise<void> => {
  try {
    await api.updateGoal(goalId, updates);
  } catch (error) {
    console.error('Error updating goal:', error);
    throw error;
  }
};

// Budget operations
export const getBudget = async (): Promise<BudgetPlan | null> => {
  try {
    return await api.getBudget();
  } catch (error) {
    console.error('Error fetching budget:', error);
    return null;
  }
};

export const setBudget = async (budget: BudgetPlan): Promise<void> => {
  try {
    await api.setBudget(budget);
  } catch (error) {
    console.error('Error saving budget:', error);
    throw error;
  }
};

// Calculate totals
export const calculateMonthlyIncome = async (): Promise<number> => {
  try {
    return await api.calculateMonthlyIncome();
  } catch (error) {
    console.error('Error calculating monthly income:', error);
    return 0;
  }
};

export const calculateMonthlyExpenses = async (): Promise<number> => {
  try {
    return await api.calculateMonthlyExpenses();
  } catch (error) {
    console.error('Error calculating monthly expenses:', error);
    return 0;
  }
};

// Sync versions for backward compatibility (deprecated - use async versions)
let incomeCache: IncomeEntry[] = [];
let expensesCache: ExpenseEntry[] = [];

export const getIncomeSync = (): IncomeEntry[] => incomeCache;
export const getExpensesSync = (): ExpenseEntry[] => expensesCache;

// Function to update cache
export const refreshCache = async () => {
  incomeCache = await getIncome();
  expensesCache = await getExpenses();
};

// Update cache on load (only if user is authenticated)
if (typeof window !== 'undefined') {
  // Check if user is authenticated before refreshing cache
  const token = localStorage.getItem('auth_token');
  if (token) {
    refreshCache().catch(err => {
      // Silently fail if user is not authenticated or cache refresh fails
    });
  }
}
