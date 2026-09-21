import { createClient } from '@supabase/supabase-js';

const SUPABASE_CONFIG_KEY = 'georemind_supabase_config_v1';

// Read from import.meta.env or localStorage
export function getSupabaseConfig() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  if (envUrl && envKey) {
    return { url: envUrl.trim(), anonKey: envKey.trim(), fromEnv: true };
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(SUPABASE_CONFIG_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.url && parsed.anonKey) {
          return { url: parsed.url.trim(), anonKey: parsed.anonKey.trim(), fromEnv: false };
        }
      }
    } catch (e) {
      console.warn('Error reading stored supabase config:', e);
    }
  }

  return { url: '', anonKey: '', fromEnv: false };
}

export function saveSupabaseConfig({ url, anonKey }) {
  if (typeof window === 'undefined') return;
  try {
    if (!url || !anonKey) {
      localStorage.removeItem(SUPABASE_CONFIG_KEY);
    } else {
      localStorage.setItem(
        SUPABASE_CONFIG_KEY,
        JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() })
      );
    }
    // Reset client instance
    clientInstance = null;
  } catch (e) {
    console.error('Error saving supabase config:', e);
  }
}

let clientInstance = null;

export function getSupabase() {
  if (clientInstance) return clientInstance;

  const config = getSupabaseConfig();
  if (config.url && config.anonKey) {
    try {
      clientInstance = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      return clientInstance;
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return null;
}

export function isSupabaseConfigured() {
  const config = getSupabaseConfig();
  return Boolean(config.url && config.anonKey);
}

// ----------------------------------------------------
// Authentication API
// ----------------------------------------------------

export async function signUpWithEmail(email, password, displayName = '') {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured. Please add your URL and Anon Key.');

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        display_name: displayName || email.split('@')[0],
      },
    },
  });

  if (error) throw error;
  return data;
}

export async function signInWithEmail(email, password) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured. Please add your URL and Anon Key.');

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOutUser() {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetUserPassword(email) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim());
  if (error) throw error;
  return data;
}

// ----------------------------------------------------
// Cross-Device Settings Sync (Google API Key, Default Location, etc.)
// ----------------------------------------------------

/**
 * Fetch synced user settings from Supabase
 */
export async function fetchRemoteUserSettings(userId) {
  const supabase = getSupabase();
  if (!supabase || !userId) return null;

  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Record doesn't exist yet, which is fine for brand new users
        return null;
      }
      console.warn('Could not fetch user_settings:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.warn('Error fetching remote user settings:', err);
    return null;
  }
}

/**
 * Upsert synced user settings to Supabase
 */
export async function saveRemoteUserSettings(userId, settingsData) {
  const supabase = getSupabase();
  if (!supabase || !userId) return null;

  const payload = {
    user_id: userId,
    map_provider: settingsData.mapProvider ?? 'osm',
    default_location: settingsData.defaultLocation ?? null,
    preferences: settingsData.preferences ?? {},
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from('user_settings')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.warn('Could not save user_settings to Supabase:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.warn('Error saving remote user settings:', err);
    return null;
  }
}

// ----------------------------------------------------
// Cross-Device Reminders Sync
// ----------------------------------------------------

/**
 * Fetch all reminders for user from Supabase
 */
export async function fetchRemoteReminders(userId) {
  const supabase = getSupabase();
  if (!supabase || !userId) return [];

  try {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching remote reminders:', error.message);
      return [];
    }

    // Map database snake_case back to app camelCase
    return (data || []).map((r) => ({
      id: r.id,
      title: r.title,
      notes: r.notes || '',
      category: r.category || 'shopping',
      priority: r.priority || 'medium',
      type: r.type || 'location',
      completed: Boolean(r.completed),
      location: r.location,
      dueTime: r.due_time,
      createdAt: r.created_at,
      status: r.status || 'active',
    }));
  } catch (err) {
    console.warn('Remote reminders fetch error:', err);
    return [];
  }
}

/**
 * Sync entire reminders array to Supabase
 */
export async function syncRemindersToCloud(userId, reminders) {
  const supabase = getSupabase();
  if (!supabase || !userId || !Array.isArray(reminders)) return;

  const records = reminders.map((r) => ({
    id: r.id,
    user_id: userId,
    title: r.title,
    notes: r.notes || '',
    category: r.category || 'shopping',
    priority: r.priority || 'medium',
    type: r.type || 'location',
    completed: Boolean(r.completed),
    location: r.location || null,
    due_time: r.dueTime || null,
    created_at: r.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  try {
    if (records.length > 0) {
      const { error } = await supabase
        .from('reminders')
        .upsert(records, { onConflict: 'id' });

      if (error) {
        console.warn('Failed to upsert cloud reminders:', error.message);
      }
    }
  } catch (err) {
    console.warn('Error syncing reminders to cloud:', err);
  }
}

/**
 * Delete reminder from cloud
 */
export async function deleteRemoteReminder(userId, reminderId) {
  const supabase = getSupabase();
  if (!supabase || !userId || !reminderId) return;

  try {
    await supabase
      .from('reminders')
      .delete()
      .eq('id', reminderId)
      .eq('user_id', userId);
  } catch (err) {
    console.warn('Error deleting remote reminder:', err);
  }
}
