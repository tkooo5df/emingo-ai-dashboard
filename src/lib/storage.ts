// LocalStorage utilities for EMINGO

export interface IncomeEntry {
  id: string;
  amount: number;
  source: string;
  category: string;
  date: string;
  description?: string;
}

export interface ExpenseEntry {
  id: string;
  amount: number;
  category: string;
  date: string;
  description?: string;
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
  INCOME: 'emingo_income',
  EXPENSES: 'emingo_expenses',
  PROJECTS: 'emingo_projects',
  GOALS: 'emingo_goals',
  BUDGET: 'emingo_budget',
  THEME: 'emingo_theme',
};

// Generic storage functions
export const getStorageItem = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from storage:`, error);
    return defaultValue;
  }
};

export const setStorageItem = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing ${key} to storage:`, error);
  }
};

// Income operations
export const getIncome = (): IncomeEntry[] => getStorageItem(STORAGE_KEYS.INCOME, []);
export const setIncome = (income: IncomeEntry[]) => setStorageItem(STORAGE_KEYS.INCOME, income);
export const addIncome = (entry: IncomeEntry) => {
  const income = getIncome();
  setIncome([entry, ...income]);
};

// Expense operations
export const getExpenses = (): ExpenseEntry[] => getStorageItem(STORAGE_KEYS.EXPENSES, []);
export const setExpenses = (expenses: ExpenseEntry[]) => setStorageItem(STORAGE_KEYS.EXPENSES, expenses);
export const addExpense = (entry: ExpenseEntry) => {
  const expenses = getExpenses();
  setExpenses([entry, ...expenses]);
};

// Project operations
export const getProjects = (): Project[] => getStorageItem(STORAGE_KEYS.PROJECTS, []);
export const setProjects = (projects: Project[]) => setStorageItem(STORAGE_KEYS.PROJECTS, projects);
export const addProject = (project: Project) => {
  const projects = getProjects();
  setProjects([project, ...projects]);
};

// Goal operations
export const getGoals = (): Goal[] => getStorageItem(STORAGE_KEYS.GOALS, []);
export const setGoals = (goals: Goal[]) => setStorageItem(STORAGE_KEYS.GOALS, goals);
export const addGoal = (goal: Goal) => {
  const goals = getGoals();
  setGoals([goal, ...goals]);
};

// Budget operations
export const getBudget = (): BudgetPlan | null => getStorageItem(STORAGE_KEYS.BUDGET, null);
export const setBudget = (budget: BudgetPlan) => setStorageItem(STORAGE_KEYS.BUDGET, budget);

// Theme operations
export const getTheme = (): 'light' | 'dark' => getStorageItem(STORAGE_KEYS.THEME, 'dark');
export const setTheme = (theme: 'light' | 'dark') => setStorageItem(STORAGE_KEYS.THEME, theme);

// Calculate totals
export const calculateMonthlyIncome = (): number => {
  const income = getIncome();
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  return income
    .filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
    })
    .reduce((sum, entry) => sum + entry.amount, 0);
};

export const calculateMonthlyExpenses = (): number => {
  const expenses = getExpenses();
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  return expenses
    .filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
    })
    .reduce((sum, entry) => sum + entry.amount, 0);
};
