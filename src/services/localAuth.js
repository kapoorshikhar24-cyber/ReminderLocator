/**
 * Local & Cloud Authentication Service for GeoRemind
 * Provides hardened client-side authentication (User ID + Password)
 * with per-user cryptographic salt (PBKDF2-HMAC-SHA-256),
 * per-user data isolation, and optional Supabase cloud synchronization.
 */

const ACCOUNTS_STORAGE_KEY = 'georemind_user_accounts_v2';
const ACTIVE_USER_KEY = 'georemind_active_session_v2';

// Convert Uint8Array to Hex string
function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert Hex string to Uint8Array
function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

// Legacy hash helper (used exclusively to verify and migrate old account records)
function legacyHashPassword(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return 'h_' + Math.abs(hash).toString(36) + '_' + btoa(str.slice(0, 3) + str.length);
}

/**
 * Standard Cryptographic Password KDF using PBKDF2-HMAC-SHA-256 with per-user salt
 */
export async function derivePasswordHash(password, existingSaltHex = null) {
  const iterations = 100000;
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const cryptoObj = (typeof window !== 'undefined' && window.crypto) || (typeof globalThis !== 'undefined' && globalThis.crypto) || null;

  let saltBytes;
  if (existingSaltHex) {
    saltBytes = hexToBytes(existingSaltHex);
  } else {
    saltBytes = new Uint8Array(16);
    if (cryptoObj?.getRandomValues) {
      cryptoObj.getRandomValues(saltBytes);
    } else {
      for (let i = 0; i < 16; i++) {
        saltBytes[i] = Math.floor(Math.random() * 256);
      }
    }
  }

  if (cryptoObj?.subtle) {
    try {
      const keyMaterial = await cryptoObj.subtle.importKey(
        'raw',
        passwordBuffer,
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );

      const derivedKey = await cryptoObj.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: saltBytes,
          iterations,
          hash: 'SHA-256',
        },
        keyMaterial,
        256
      );

      const hashHex = bytesToHex(new Uint8Array(derivedKey));
      const saltHex = bytesToHex(saltBytes);
      return `pbkdf2:${iterations}:${saltHex}:${hashHex}`;
    } catch (err) {
      console.warn('SubtleCrypto PBKDF2 error, using fallback:', err);
    }
  }

  // Fallback if subtle crypto is unavailable
  const saltHex = bytesToHex(saltBytes);
  return `pbkdf2:1:${saltHex}:${legacyHashPassword(password + saltHex)}`;
}

/**
 * Verify a candidate password against stored hash record (with legacy migration support)
 */
export async function verifyPasswordHash(candidatePassword, storedHashRecord) {
  if (!storedHashRecord || !candidatePassword) return false;

  // 1. Standard PBKDF2 hash check
  if (storedHashRecord.startsWith('pbkdf2:')) {
    const parts = storedHashRecord.split(':');
    if (parts.length === 4) {
      const saltHex = parts[2];
      const candidateHashRecord = await derivePasswordHash(candidatePassword, saltHex);
      return candidateHashRecord === storedHashRecord;
    }
  }

  // 2. Legacy hash check (e.g. h_...)
  if (storedHashRecord.startsWith('h_')) {
    const legacyExpected = legacyHashPassword(candidatePassword);
    return storedHashRecord === legacyExpected;
  }

  return false;
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
export async function registerLocalAccount({ userId, password, displayName }) {
  const cleanId = (userId || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();
  const cleanName = (displayName || '').trim() || cleanId;

  if (!cleanId) {
    throw new Error('Please enter a User ID or Username.');
  }
  if (cleanId.length < 3) {
    throw new Error('User ID must be at least 3 characters long.');
  }
  if (!cleanPassword || cleanPassword.length < 8) {
    throw new Error('Password must be at least 8 characters long for security.');
  }

  const accounts = getStoredAccounts();
  const existing = accounts.find(
    (acc) => acc.userId.toLowerCase() === cleanId || (acc.email && acc.email.toLowerCase() === cleanId)
  );

  if (existing) {
    throw new Error(`User ID "${cleanId}" is already registered. Please log in with your existing account.`);
  }

  const passwordHash = await derivePasswordHash(cleanPassword);

  const newAccount = {
    id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    userId: cleanId,
    email: cleanId.includes('@') ? cleanId : `${cleanId}@georemind.local`,
    displayName: cleanName,
    passwordHash,
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
export async function loginLocalAccount({ userId, password }) {
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
    throw new Error(`No account found for "${cleanId}". Please check your credentials or create an account.`);
  }

  const isValid = await verifyPasswordHash(cleanPassword, account.passwordHash);
  if (!isValid) {
    throw new Error('Incorrect password. Please try again.');
  }

  // Automatic Migration: If user was using legacy hash, seamlessly upgrade to PBKDF2
  if (account.passwordHash && account.passwordHash.startsWith('h_')) {
    try {
      account.passwordHash = await derivePasswordHash(cleanPassword);
    } catch (migErr) {
      console.warn('Password hash migration error:', migErr);
    }
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
 * Log in directly by verified User ID (used after successful Biometric Authentication)
 */
export function loginLocalAccountById(userId) {
  const cleanId = (userId || '').trim().toLowerCase();
  if (!cleanId) {
    throw new Error('User ID is required.');
  }

  const accounts = getStoredAccounts();
  const account = accounts.find(
    (acc) => acc.userId.toLowerCase() === cleanId || (acc.email && acc.email.toLowerCase() === cleanId)
  );

  if (!account) {
    throw new Error(`Account "${cleanId}" not found.`);
  }

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
 * Create or resume Guest session with 1-click
 */
export function createGuestSession() {
  const guestUser = {
    id: 'guest_user',
    userId: 'guest',
    email: 'guest@georemind.local',
    displayName: 'Guest Traveler',
    isLocal: true,
    isGuest: true,
  };
  persistActiveUser(guestUser);
  return guestUser;
}

/**
 * Log out active user
 */
export function logoutLocalAccount() {
  persistActiveUser(null);
}

