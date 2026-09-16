/**
 * Local & Cloud Authentication Service for GeoRemind
 * Provides out-of-the-box local user accounts (User ID + Password)
 * with per-user data isolation and optional Supabase cloud synchronization.
 */

const ACCOUNTS_STORAGE_KEY = 'georemind_user_accounts_v2';
const ACTIVE_USER_KEY = 'georemind_active_session_v2';

// Simple client-side hash helper for password storage
function hashPassword(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return 'h_' + Math.abs(hash).toString(36) + '_' + btoa(str.slice(0, 3) + str.length);
}

/**
 * Get all registered local accounts
 */
export function getStoredAccounts() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to read accounts from storage:', err);
    return [];
  }
}

/**
 * Save accounts array
 */
function saveAccounts(accounts) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.error('Failed to persist accounts:', err);
  }
}

/**
 * Get currently logged-in active user session
 */
export function getStoredActiveUser() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ACTIVE_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('Failed to read active user session:', err);
    return null;
  }
}

/**
 * Set active user session
 */
export function persistActiveUser(user) {
  if (typeof window === 'undefined') return;
  try {
    if (!user) {
      localStorage.removeItem(ACTIVE_USER_KEY);
    } else {
      localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(user));
    }
  } catch (err) {
    console.error('Failed to persist active session:', err);
  }
}

/**
 * Register a new user with custom User ID and Password
 */
export function registerLocalAccount({ userId, password, displayName }) {
  const cleanId = (userId || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();
  const cleanName = (displayName || '').trim() || cleanId;

  if (!cleanId) {
    throw new Error('Please enter a User ID or Username.');
  }
  if (cleanId.length < 3) {
    throw new Error('User ID must be at least 3 characters long.');
  }
  if (!cleanPassword || cleanPassword.length < 4) {
    throw new Error('Password must be at least 4 characters long.');
  }

  const accounts = getStoredAccounts();
  const existing = accounts.find(
    (acc) => acc.userId.toLowerCase() === cleanId || (acc.email && acc.email.toLowerCase() === cleanId)
  );

  if (existing) {
    throw new Error(`User ID "${cleanId}" is already registered. Please log in or choose a different ID.`);
  }

  const newAccount = {
    id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    userId: cleanId,
    email: cleanId.includes('@') ? cleanId : `${cleanId}@georemind.local`,
    displayName: cleanName,
    passwordHash: hashPassword(cleanPassword),
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  accounts.push(newAccount);
  saveAccounts(accounts);

  const sessionUser = {
    id: newAccount.id,
    userId: newAccount.userId,
    email: newAccount.email,
    displayName: newAccount.displayName,
    isLocal: true,
  };

  persistActiveUser(sessionUser);
  return sessionUser;
}

/**
 * Log in with existing User ID / Username / Email and Password
 */
export function loginLocalAccount({ userId, password }) {
  const cleanId = (userId || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  if (!cleanId) {
    throw new Error('Please enter your User ID or Email.');
  }
  if (!cleanPassword) {
    throw new Error('Please enter your password.');
  }

  const accounts = getStoredAccounts();
  const account = accounts.find(
    (acc) => acc.userId.toLowerCase() === cleanId || (acc.email && acc.email.toLowerCase() === cleanId)
  );

  if (!account) {
    throw new Error(`No account found for "${cleanId}". Please check your ID or click "Create Account".`);
  }

  const expectedHash = hashPassword(cleanPassword);
  if (account.passwordHash !== expectedHash) {
    throw new Error('Incorrect password. Please try again.');
  }

  // Update last login
  account.lastLoginAt = new Date().toISOString();
  saveAccounts(accounts);

  const sessionUser = {
    id: account.id,
    userId: account.userId,
    email: account.email,
    displayName: account.displayName || account.userId,
    isLocal: true,
  };

  persistActiveUser(sessionUser);
  return sessionUser;
}

/**
 * Log out active user
 */
export function logoutLocalAccount() {
  persistActiveUser(null);
}
