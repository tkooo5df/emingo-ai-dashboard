// API client using Fly.io API Server
import { getAccessToken } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Helper to make authenticated API requests
async function apiRequest(endpoint: string, options: RequestInit = {}) {

  const token = await getAccessToken();
  
  if (!token) {
    console.error('❌ [API] No authentication token found');
    throw new Error('User not authenticated');
  }

  

  const requestBody = options.body ? JSON.parse(options.body as string) : null;
  if (requestBody) {

  }

  // Add security headers
  const securityHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-Requested-With': 'XMLHttpRequest', // Helps identify AJAX requests
    'X-Client-Version': '1.0.0', // Version tracking
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...securityHeaders,
      ...options.headers,
    },
    // Security: Don't send credentials to untrusted origins
    credentials: 'same-origin',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('❌ [API] Error response:', error);
    console.error('❌ [API] Full error details:', {
      status: response.status,
      statusText: response.statusText,
      error
    });
    throw new Error(error.error || error.message || `HTTP error! status: ${response.status}`);
  }

  const responseData = await response.json();

  if (Array.isArray(responseData)) {

    if (responseData.length > 0) {

    }
    } else if (typeof responseData === 'object') {
      // Handle object response
    }
  return responseData;
}

export const api = {
  // Income
  getIncome: async () => {
    return await apiRequest('/income');
  },
  
  addIncome: async (data: any) => {

    const result = await apiRequest('/income', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return result;
  },

  updateIncome: async (id: string, updates: any) => {
    return await apiRequest(`/income/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  deleteIncome: async (id: string) => {
    return await apiRequest(`/income/${id}`, {
      method: 'DELETE',
    });
  },

  // Expenses
  getExpenses: async () => {
    return await apiRequest('/expenses');
  },
  
  addExpense: async (data: any) => {

    const result = await apiRequest('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return result;
  },

  updateExpense: async (id: string, updates: any) => {
    return await apiRequest(`/expenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  deleteExpense: async (id: string) => {
    return await apiRequest(`/expenses/${id}`, {
      method: 'DELETE',
    });
  },

  // Projects
  getProjects: async () => {
    return await apiRequest('/projects');
  },
  
  addProject: async (data: any) => {
    return await apiRequest('/projects', {
      method: 'POST',
      body: JSON.stringify({
        id: data.id,
        name: data.name,
        client: data.client,
        deadline: data.deadline,
        expectedEarnings: data.expectedEarnings,
        status: data.status,
        hoursSpent: data.hoursSpent,
      }),
    });
  },
  
  updateProject: async (id: string, updates: any) => {
    return await apiRequest(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  // Goals
  getGoals: async () => {
    return await apiRequest('/goals');
  },
  
  addGoal: async (data: any) => {
    return await apiRequest('/goals', {
      method: 'POST',
      body: JSON.stringify({
        id: data.id,
        title: data.title,
        type: data.type,
        target: data.target,
        current: data.current,
        deadline: data.deadline,
        description: data.description,
      }),
    });
  },
  
  updateGoal: async (id: string, updates: any) => {
    return await apiRequest(`/goals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  deleteGoal: async (id: string) => {
    return await apiRequest(`/goals/${id}`, {
      method: 'DELETE',
    });
  },

  // Budget
  getBudget: async () => {
    const data = await apiRequest('/budget');
    if (!data) return null;
    return {
      savings: Number(data.savings || 0),
      necessities: Number(data.necessities || 0),
      wants: Number(data.wants || 0),
      investments: Number(data.investments || 0),
      aiRecommendation: data.ai_recommendation,
      generatedAt: data.generated_at || data.created_at,
    };
  },
  
  setBudget: async (data: any) => {
    return await apiRequest('/budget', {
      method: 'POST',
      body: JSON.stringify({
        savings: data.savings,
        necessities: data.necessities,
        wants: data.wants,
        investments: data.investments,
        aiRecommendation: data.aiRecommendation,
        generatedAt: data.generatedAt || new Date().toISOString(),
      }),
    });
  },

  // Calculations
  calculateMonthlyIncome: async () => {
    const data = await apiRequest('/calculate/monthly-income');
    return Number(data.total || 0);
  },
  
  calculateMonthlyExpenses: async () => {
    const data = await apiRequest('/calculate/monthly-expenses');
    return Number(data.total || 0);
  },

  // Account
  getAccountBalance: async () => {
    const data = await apiRequest('/account/balance');
    return Number(data.balance || 0);
  },
  
  addAccountTransaction: async (data: any) => {

    const transactionPayload = {
      id: data.id,
      type: data.type,
      amount: data.amount,
      name: data.name,
      category: data.category,
      date: data.date,
      account_id: data.account_id,
      account_type: data.account_type,
      note: data.note,
    };

    const result = await apiRequest('/account/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionPayload),
    });

    return result;
  },

  // Settings
  getSettings: async () => {
    return await apiRequest('/settings');
  },
  
  saveSettings: async (data: any) => {
    return await apiRequest('/settings', {
      method: 'POST',
      body: JSON.stringify({
        currency: data.currency,
        language: data.language,
        custom_categories: data.custom_categories,
        accounts: data.accounts,
        analytics_preferences: data.analytics_preferences,
      }),
    });
  },
  
  updateSettings: async (data: any) => {
    return await apiRequest('/settings', {
      method: 'PUT',
      body: JSON.stringify({
        currency: data.currency,
        language: data.language,
        custom_categories: data.custom_categories,
        accounts: data.accounts,
        analytics_preferences: data.analytics_preferences,
      }),
    });
  },

  // Account management
  deleteAccount: async (accountId: string) => {
    const settings = await apiRequest('/settings');
    const updatedAccounts = (settings.accounts || []).filter((acc: any) => acc.id !== accountId);
    return await apiRequest('/settings', {
      method: 'PUT',
      body: JSON.stringify({
        ...settings,
        accounts: updatedAccounts,
      }),
    });
  },

  deleteAllAccounts: async () => {
    const settings = await apiRequest('/settings');
    return await apiRequest('/settings', {
      method: 'PUT',
      body: JSON.stringify({
        ...settings,
        accounts: [],
      }),
    });
  },

  // Profile
  getProfile: async () => {
    return await apiRequest('/profile');
  },
  
  saveProfile: async (data: any) => {
    return await apiRequest('/profile', {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        age: data.age,
        current_work: data.current_work,
        description: data.description,
      }),
    });
  },
  
  updateProfile: async (data: any) => {
    return await apiRequest('/profile', {
      method: 'PUT',
      body: JSON.stringify({
        name: data.name,
        age: data.age,
        current_work: data.current_work,
        description: data.description,
      }),
    });
  },

  // Debts
  getDebts: async () => {
    return await apiRequest('/debts');
  },
  
  addDebt: async (data: any) => {
    return await apiRequest('/debts', {
      method: 'POST',
      body: JSON.stringify({
        id: data.id,
        type: data.type,
        amount: data.amount,
        person_name: data.person_name,
        description: data.description,
        date: data.date,
        status: data.status,
      }),
    });
  },
  
  updateDebt: async (id: string, updates: any) => {
    return await apiRequest(`/debts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },
  
  deleteDebt: async (id: string) => {
    return await apiRequest(`/debts/${id}`, {
      method: 'DELETE',
    });
  },

  // Database
  getDatabaseTables: async () => {
    return await apiRequest('/database/tables');
  },
  
  createDatabaseTables: async () => {
    return await apiRequest('/database/create-tables', {
      method: 'POST',
    });
  },
  
  getTableInfo: async (tableName: string) => {
    return await apiRequest(`/database/table/${tableName}`);
  },

  // AI Conversations
  getAIConversations: async (sessionId?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (sessionId) params.append('session_id', sessionId);
    if (limit) params.append('limit', limit.toString());
    const query = params.toString();
    return await apiRequest(`/ai/conversations${query ? `?${query}` : ''}`);
  },
  
  saveAIConversation: async (sessionId: string, role: 'user' | 'assistant', content: string) => {
    return await apiRequest('/ai/conversations', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, role, content }),
    });
  },
  
  deleteAIConversation: async (sessionId: string) => {
    return await apiRequest(`/ai/conversations/${sessionId}`, {
      method: 'DELETE',
    });
  },

  // Admin
  getAdminData: async () => {
    return await apiRequest('/admin/data');
  },
  
  getUsersList: async () => {
    return await apiRequest('/users/list');
  },
};
