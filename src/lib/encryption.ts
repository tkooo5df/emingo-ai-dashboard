// Encryption utilities for sensitive data
import CryptoJS from 'crypto-js';

// Get encryption key from environment or generate a default (should be set in production)
const getEncryptionKey = (): string => {
  // In production, this should come from environment variables
  // For now, we'll use a combination of user-specific data
  if (typeof window !== 'undefined') {
    const storedKey = sessionStorage.getItem('encryption_key');
    if (storedKey) {
      return storedKey;
    }
    
    // Generate a key based on user agent and timestamp (not ideal, but better than nothing)
    const userAgent = navigator.userAgent;
    const timestamp = sessionStorage.getItem('session_start') || Date.now().toString();
    sessionStorage.setItem('session_start', timestamp);
    
    // Create a key from user agent hash
    const key = CryptoJS.SHA256(userAgent + timestamp + 'emingo-secure-key-2024').toString();
    sessionStorage.setItem('encryption_key', key);
    return key;
  }
  return 'default-key-change-in-production';
};

/**
 * Encrypt sensitive data before storing in localStorage
 */
export function encryptData(data: string): string {
  try {
    const key = getEncryptionKey();
    const encrypted = CryptoJS.AES.encrypt(data, key).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    return data; // Return unencrypted if encryption fails
  }
}

/**
 * Decrypt sensitive data from localStorage
 */
export function decryptData(encryptedData: string): string {
  try {
    const key = getEncryptionKey();
    const decrypted = CryptoJS.AES.decrypt(encryptedData, key);
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedString) {
      // If decryption fails, return original (might be unencrypted legacy data)
      return encryptedData;
    }
    
    return decryptedString;
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedData; // Return as-is if decryption fails
  }
}

/**
 * Encrypt object data
 */
export function encryptObject<T>(obj: T): string {
  try {
    const jsonString = JSON.stringify(obj);
    return encryptData(jsonString);
  } catch (error) {
    console.error('Object encryption error:', error);
    return JSON.stringify(obj);
  }
}

/**
 * Decrypt object data
 */
export function decryptObject<T>(encryptedData: string): T | null {
  try {
    const decryptedString = decryptData(encryptedData);
    return JSON.parse(decryptedString) as T;
  } catch (error) {
    console.error('Object decryption error:', error);
    return null;
  }
}

/**
 * Clear encryption key on logout
 */
export function clearEncryptionKey(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('encryption_key');
    sessionStorage.removeItem('session_start');
  }
}

