// Authentication utilities using Fly.io API Server
import { encryptData, decryptData, clearEncryptionKey } from './encryption';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

// Get token from localStorage (encrypted)
function getToken(): string | null {
  try {
    const encryptedToken = localStorage.getItem('auth_token');
    if (!encryptedToken) return null;
    
    // Try to decrypt (handles both encrypted and legacy unencrypted tokens)
    const decrypted = decryptData(encryptedToken);
    return decrypted || null;
  } catch (error) {
    // If decryption fails, try to read as plain text (legacy support)
    return localStorage.getItem('auth_token');
  }
}

// Set token in localStorage (encrypted)
function setToken(token: string): void {
  try {
    const encrypted = encryptData(token);
    localStorage.setItem('auth_token', encrypted);
  } catch (error) {
    // Fallback to unencrypted if encryption fails
    localStorage.setItem('auth_token', token);
  }
}

// Remove token from localStorage
function removeToken(): void {
  localStorage.removeItem('auth_token');
  clearEncryptionKey();
}

// Get current user from API
export async function getCurrentUser(): Promise<User | null> {
  try {
    const token = getToken();
    if (!token) return null;

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        removeToken();
      }
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Sign in with Google
export async function signInWithGoogle() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/google/url`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        error: 'Unknown error',
        message: 'Failed to get Google OAuth URL'
      }));
      
      console.error('API Error:', response.status, errorData);
      
      // Provide helpful error message
      if (errorData.error === 'Google OAuth not configured') {
        throw new Error('Google OAuth is not configured. Please contact the administrator or use email/password login.');
      }
      
      throw new Error(errorData.message || `Failed to get Google OAuth URL: ${response.status} ${response.statusText}`);
    }

    const { url } = await response.json();
    
    if (!url) {
      throw new Error('No OAuth URL received from server');
    }
    
    // Redirect to Google OAuth
    window.location.href = url;
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
}

// Sign up with email/password
export async function signUp(email: string, password: string, name?: string): Promise<{ token: string; user: User }> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password, name })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    setToken(data.token);
    return data;
  } catch (error: any) {
    console.error('Error signing up:', error);
    throw error;
  }
}

// Sign in with email/password
export async function signIn(email: string, password: string): Promise<{ token: string; user: User }> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    setToken(data.token);
    return data;
  } catch (error: any) {
    console.error('Error signing in:', error);
    throw error;
  }
}

// Sign out
export async function signOut() {
  try {
    removeToken();
    window.location.href = '/login';
  } catch (error: any) {
    console.error('Error signing out:', error);
    throw error;
  }
}

// Get session (check if user is logged in)
export async function getSession() {
  try {
    const user = await getCurrentUser();
    return user ? { user } : null;
  } catch (error: any) {
    console.error('Error getting session:', error);
    return null;
  }
}

// Get access token for API requests
export async function getAccessToken(): Promise<string | null> {
  return getToken();
}

// Handle OAuth callback (exchange code for token)
export async function handleOAuthCallback(code: string): Promise<{ token: string; user: User }> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/google/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        error: 'Unknown error',
        message: `HTTP error! status: ${response.status}`
      }));
      
      // Provide more helpful error messages
      if (error.error === 'Database unavailable' || error.error === 'Authentication failed') {
        const message = error.message || error.hint || 'Failed to complete Google authentication';
        throw new Error(`${message}. Please make sure flyctl proxy is running.`);
      }
      
      throw new Error(error.error || error.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    setToken(data.token);
    return data;
  } catch (error: any) {
    console.error('Error handling OAuth callback:', error);
    throw error;
  }
}

// Listen to auth state changes (simplified - just check token)
export function onAuthStateChange(callback: (user: User | null) => void) {
  // Check auth state periodically
  const checkAuth = async () => {
    const user = await getCurrentUser();
    callback(user);
  };

  // Initial check
  checkAuth();

  // Check every 30 seconds
  const interval = setInterval(checkAuth, 30000);

  // Return subscription-like object
  return {
    unsubscribe: () => {
      clearInterval(interval);
    }
  };
}

