/**
 * Biometric Authentication Service for GeoRemind
 * 
 * Supports:
 * - Windows Hello (Face, Fingerprint, PIN)
 * - Apple Face ID / Touch ID
 * - Android Biometric Authentication
 * 
 * SECURITY GUARANTEE:
 * This application NEVER accesses, collects, or stores raw biometric data
 * (fingerprint images, face scans, or templates).
 * Biometric verification is performed exclusively by the operating system's
 * secure enclave / platform authenticator via standard WebAuthn (PublicKeyCredential).
 * The app only stores cryptographic assertion tokens and public credential IDs.
 */

const BIOMETRIC_CREDENTIALS_KEY = 'georemind_biometrics_vault_v1';

// Base64url helpers for WebAuthn ArrayBuffers
function bufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlToBuffer(base64url) {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Detect the friendly name of the biometric system based on OS / device
 */
export function getBiometricTypeName() {
  if (typeof window === 'undefined') return 'Biometrics';
  const ua = window.navigator.userAgent || '';
  if (/Macintosh|iPhone|iPad|iPod/.test(ua)) {
    return 'Face ID / Touch ID';
  }
  if (/Windows/.test(ua)) {
    return 'Windows Hello';
  }
  if (/Android/.test(ua)) {
    return 'Android Biometrics';
  }
  return 'Biometric Authentication';
}

/**
 * Check if the Web Authentication API is supported in the browser/webview
 */
export function isWebAuthnSupported() {
  return (
    typeof window !== 'undefined' &&
    window.PublicKeyCredential !== undefined &&
    typeof window.PublicKeyCredential === 'function' &&
    typeof navigator.credentials !== 'undefined' &&
    typeof navigator.credentials.create === 'function' &&
    typeof navigator.credentials.get === 'function'
  );
}

/**
 * Check if a platform authenticator (Face ID, Windows Hello, Fingerprint) is actually available
 */
export async function isPlatformAuthenticatorAvailable() {
  if (!isWebAuthnSupported()) return false;
  try {
    if (typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return !!available;
    }
    return true;
  } catch (err) {
    console.warn('Biometric platform availability check error:', err);
    return false;
  }
}

/**
 * Retrieve all registered biometric credentials from local storage
 */
export function getRegisteredBiometrics() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(BIOMETRIC_CREDENTIALS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to read biometric credentials vault:', e);
    return [];
  }
}

/**
 * Save biometric credentials to storage
 */
function saveBiometricsVault(list) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BIOMETRIC_CREDENTIALS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save biometric vault:', e);
  }
}

/**
 * Check if biometrics is enrolled and active for a specific user ID
 */
export function isBiometricEnrolled(userId) {
  if (!userId) return false;
  const clean = userId.trim().toLowerCase();
  const list = getRegisteredBiometrics();
  const record = list.find((c) => c.userId.toLowerCase() === clean);
  return !!(record && record.enabled);
}

/**
 * Get enrolled biometric details for a user
 */
export function getEnrolledBiometric(userId) {
  if (!userId) return null;
  const clean = userId.trim().toLowerCase();
  const list = getRegisteredBiometrics();
  return list.find((c) => c.userId.toLowerCase() === clean) || null;
}

/**
 * Enable or disable biometric authentication for a specific user
 */
export function setBiometricEnabled(userId, enabled) {
  if (!userId) return;
  const clean = userId.trim().toLowerCase();
  const list = getRegisteredBiometrics();
  const updated = list.map((item) => {
    if (item.userId.toLowerCase() === clean) {
      return { ...item, enabled: !!enabled, updatedAt: new Date().toISOString() };
    }
    return item;
  });
  saveBiometricsVault(updated);
}

/**
 * Remove/Revoke biometric registration for a user
 */
export function removeBiometricCredential(userId) {
  if (!userId) return;
  const clean = userId.trim().toLowerCase();
  const list = getRegisteredBiometrics();
  const filtered = list.filter((c) => c.userId.toLowerCase() !== clean);
  saveBiometricsVault(filtered);
}

/**
 * Register a biometric credential using native OS biometric prompt
 * Prompts Face ID / Fingerprint / Windows Hello
 */
export async function registerBiometric({ userId, displayName }) {
  if (!isWebAuthnSupported()) {
    throw new Error('Biometric authentication is not supported by this browser or environment.');
  }

  const cleanId = (userId || '').trim().toLowerCase();
  if (!cleanId) {
    throw new Error('User ID is required to register biometric credentials.');
  }

  // 32-byte cryptographic challenge
  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  // User ID as ArrayBuffer
  const encoder = new TextEncoder();
  const userBuffer = encoder.encode(cleanId);

  // Relying Party identifier (domain)
  const rpId = window.location.hostname || 'localhost';

  const createOptions = {
    publicKey: {
      challenge,
      rp: {
        name: 'GeoRemind Location Notes',
        id: rpId === 'localhost' ? 'localhost' : rpId,
      },
      user: {
        id: userBuffer,
        name: cleanId,
        displayName: displayName || cleanId,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },   // ES256 (standard)
        { type: 'public-key', alg: -257 }, // RS256 (Windows Hello fallback)
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Enforce native device platform (Face ID, Fingerprint, Windows Hello)
        userVerification: 'required',        // Require actual biometric verification
        residentKey: 'preferred',
      },
      timeout: 60000,
      attestation: 'none',
    },
  };

  try {
    const credential = await navigator.credentials.create(createOptions);
    if (!credential) {
      throw new Error('Biometric setup was cancelled or failed.');
    }

    const credentialId = bufferToBase64Url(credential.rawId);
    const typeName = getBiometricTypeName();

    const vaultEntry = {
      id: credential.id,
      credentialId,
      userId: cleanId,
      displayName: displayName || cleanId,
      biometricType: typeName,
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      enabled: true,
    };

    const list = getRegisteredBiometrics().filter((c) => c.userId.toLowerCase() !== cleanId);
    list.push(vaultEntry);
    saveBiometricsVault(list);

    return vaultEntry;
  } catch (err) {
    if (err.name === 'NotAllowedError') {
      throw new Error('Biometric authorization was cancelled or timed out.');
    }
    if (err.name === 'SecurityError') {
      throw new Error('Biometric authentication requires HTTPS or localhost.');
    }
    throw err;
  }
}

/**
 * Authenticate using OS native Biometric prompt (Face ID, Touch ID, Windows Hello)
 * If userId is provided, attempts verification for that specific user.
 * If not provided, verifies any previously enrolled account.
 */
export async function verifyBiometric(userId = null) {
  if (!isWebAuthnSupported()) {
    throw new Error('Biometric authentication is not supported on this device.');
  }

  const vault = getRegisteredBiometrics().filter((c) => c.enabled);
  if (vault.length === 0) {
    throw new Error('No biometric credentials are registered yet. Please log in with your password first to enable biometrics.');
  }

  let targetEntry = null;
  if (userId) {
    const clean = userId.trim().toLowerCase();
    targetEntry = vault.find((c) => c.userId.toLowerCase() === clean);
    if (!targetEntry) {
      throw new Error(`Biometric login is not configured for account "${userId}".`);
    }
  } else if (vault.length === 1) {
    targetEntry = vault[0];
  }

  // 32-byte challenge
  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const rpId = window.location.hostname || 'localhost';

  const getOptions = {
    publicKey: {
      challenge,
      rpId: rpId === 'localhost' ? 'localhost' : rpId,
      userVerification: 'required',
      timeout: 60000,
    },
  };

  // If we have enrolled credentials, pass them in allowCredentials
  if (targetEntry) {
    getOptions.publicKey.allowCredentials = [
      {
        id: base64UrlToBuffer(targetEntry.credentialId),
        type: 'public-key',
        transports: ['internal'],
      },
    ];
  } else {
    // Allow any registered credential in vault
    getOptions.publicKey.allowCredentials = vault.map((v) => ({
      id: base64UrlToBuffer(v.credentialId),
      type: 'public-key',
      transports: ['internal'],
    }));
  }

  try {
    const assertion = await navigator.credentials.get(getOptions);
    if (!assertion) {
      throw new Error('Biometric authentication was cancelled.');
    }

    const matchedId = bufferToBase64Url(assertion.rawId);
    const verifiedRecord = vault.find(
      (v) => v.credentialId === matchedId || v.id === assertion.id
    ) || targetEntry || vault[0];

    if (verifiedRecord) {
      verifiedRecord.lastUsedAt = new Date().toISOString();
      saveBiometricsVault(vault);
    }

    return verifiedRecord;
  } catch (err) {
    if (err.name === 'NotAllowedError') {
      throw new Error('Biometric verification cancelled or biometric not recognized.');
    }
    if (err.name === 'SecurityError') {
      throw new Error('Biometric authentication requires HTTPS or localhost.');
    }
    throw err;
  }
}
