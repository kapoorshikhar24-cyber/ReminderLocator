const STORAGE_KEY = 'georemind_reminders_v1';
const SETTINGS_KEY = 'georemind_settings_v1';
const DEFAULT_LOC_KEY = 'georemind_default_location_v1';

// Default mock center (San Francisco fallback if GPS unavailable)
export const DEFAULT_COORDS = {
  lat: 37.7749,
  lng: -122.4194,
};

/**
 * Get user's saved default startup location
 */
export function getDefaultLocation() {
  if (typeof window === 'undefined') return DEFAULT_COORDS;
  try {
    const raw = localStorage.getItem(DEFAULT_LOC_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading default location from storage:', err);
  }
  return DEFAULT_COORDS;
}

/**
 * Persist user's location as the default startup location
 */
export function saveDefaultLocation(coords) {
  if (typeof window === 'undefined' || !coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
    return;
  }
  try {
    localStorage.setItem(DEFAULT_LOC_KEY, JSON.stringify({
      lat: coords.lat,
      lng: coords.lng,
      name: coords.name || 'My Default Location',
      savedAt: new Date().toISOString(),
    }));
  } catch (err) {
    console.error('Error saving default location to storage:', err);
  }
}

/**
 * Check if the user has a custom saved default location
 */
export function hasCustomDefaultLocation() {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(DEFAULT_LOC_KEY);
}

export const INITIAL_REMINDERS = [
  {
    id: 'rem-1',
    title: 'Pick up organic milk & Greek yogurt',
    notes: 'Check for oat milk discount on aisle 4',
    type: 'location',
    category: 'shopping',
    priority: 'high',
    completed: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    lastTriggeredAt: null,
    location: {
      name: 'Whole Foods Market',
      lat: 37.7758,
      lng: -122.4182,
      radius: 120,
      triggerType: 'enter',
    },
    status: 'active',
  },
  {
    id: 'rem-2',
    title: 'Submit weekly milestone timesheet',
    notes: 'Remember to attach invoice receipts before 5 PM',
    type: 'location',
    category: 'work',
    priority: 'medium',
    completed: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    lastTriggeredAt: null,
    location: {
      name: 'Tech Hub Office Campus',
      lat: 37.7735,
      lng: -122.4215,
      radius: 150,
      triggerType: 'enter',
    },
    status: 'active',
  },
  {
    id: 'rem-3',
    title: 'Check mailbox for courier parcel',
    notes: 'Key is under the small flowerpot',
    type: 'location',
    category: 'home',
    priority: 'low',
    completed: false,
    createdAt: new Date(Date.now() - 12000000).toISOString(),
    lastTriggeredAt: null,
    location: {
      name: 'Home Apartment Complex',
      lat: 37.7772,
      lng: -122.4168,
      radius: 80,
      triggerType: 'enter',
    },
    status: 'active',
  },
  {
    id: 'rem-4',
    title: 'Drink 500ml water and stretch',
    notes: 'Daily posture & hydration goal',
    type: 'time',
    category: 'personal',
    priority: 'low',
    completed: false,
    createdAt: new Date().toISOString(),
    dueTime: new Date(Date.now() + 1800000).toISOString(), // 30m from now
    status: 'active',
  },
];

export function getStoredReminders(userId) {
  if (typeof window === 'undefined') return INITIAL_REMINDERS;
  try {
    const key = userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
    const defaultRaw = localStorage.getItem(STORAGE_KEY);
    if (defaultRaw) {
      return JSON.parse(defaultRaw);
    }
  } catch (err) {
    console.error('Error reading localStorage:', err);
  }
  return INITIAL_REMINDERS;
}

export function sanitizeReminder(r) {
  if (!r || typeof r !== 'object') return null;
  const title = String(r.title || '').trim().slice(0, 250);
  if (!title) return null;

  const notes = r.notes ? String(r.notes).trim().slice(0, 5000) : '';
  const category = ['shopping', 'errand', 'work', 'home', 'personal', 'health'].includes(r.category)
    ? r.category
    : 'shopping';
  const priority = ['low', 'medium', 'high', 'critical'].includes(r.priority) ? r.priority : 'medium';
  const type = ['location', 'time', 'both'].includes(r.type) ? r.type : 'location';

  let location = null;
  if (r.location && typeof r.location === 'object') {
    const lat = Number(r.location.lat);
    const lng = Number(r.location.lng);
    const radius = Number(r.location.radius);
    if (!isNaN(lat) && lat >= -90 && lat <= 90 && !isNaN(lng) && lng >= -180 && lng <= 180) {
      location = {
        name: String(r.location.name || 'Pinned Spot').trim().slice(0, 150),
        lat,
        lng,
        radius: !isNaN(radius) && radius > 0 && radius <= 50000 ? radius : 100,
        triggerType: r.location.triggerType === 'exit' ? 'exit' : 'enter',
      };
    }
  }

  return {
    ...r,
    title,
    notes,
    category,
    priority,
    type,
    location,
    completed: Boolean(r.completed),
    status: r.completed ? 'completed' : 'active',
  };
}

export function saveReminders(reminders, userId) {
  if (typeof window === 'undefined' || !Array.isArray(reminders)) return;
  try {
    const sanitized = reminders.map(sanitizeReminder).filter(Boolean);
    const key = userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;
    localStorage.setItem(key, JSON.stringify(sanitized));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  } catch (err) {
    console.error('Error saving to localStorage:', err);
  }
}

export function getStoredSettings() {
  const defaultSettings = {
    simulationMode: false, // Default to Live GPS so user's actual location is used on startup!
    soundEnabled: true,
    soundProfile: 'crystal', // 'crystal', 'radar', 'marimba', 'subtle'
    batteryMode: 'high', // 'high' (fast 3s updates), 'balanced', 'saver'
    vibrationEnabled: true,
    notificationsEnabled: true, // Default ON for automatic arrival alerts
    backgroundTracking: true, // Default ON for background geofence monitoring
    autoAlerts: true, // Default ON for auto arrival triggers
    theme: 'dark',
    activeTab: 'all', // 'all', 'location', 'time', 'completed'
    categoryFilter: 'all', // 'all', 'shopping', 'errand', 'work', etc.
  };

  if (typeof window === 'undefined') return defaultSettings;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return { ...defaultSettings, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error('Error reading settings:', err);
  }
  return defaultSettings;
}

export function saveSettings(settings) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving settings:', err);
  }
}

/**
 * Re-seed sample reminders relative to a new center (e.g. when user shares actual GPS)
 */
export function generateLocalSampleReminders(centerLat, centerLng) {
  return [
    {
      id: 'rem-local-1',
      title: 'Buy fresh groceries & fruits',
      notes: 'Grab avocados, milk, and sourdough bread',
      type: 'location',
      category: 'shopping',
      priority: 'high',
      completed: false,
      createdAt: new Date().toISOString(),
      lastTriggeredAt: null,
      location: {
        name: 'Nearby Supermarket',
        lat: centerLat + 0.0015,
        lng: centerLng + 0.0018,
        radius: 120,
        triggerType: 'enter',
      },
      status: 'active',
    },
    {
      id: 'rem-local-2',
      title: 'Pick up laundry / dry cleaning',
      notes: 'Ticket #492 in wallet',
      type: 'location',
      category: 'errand',
      priority: 'medium',
      completed: false,
      createdAt: new Date().toISOString(),
      lastTriggeredAt: null,
      location: {
        name: 'Express Cleaners',
        lat: centerLat - 0.0012,
        lng: centerLng + 0.002,
        radius: 100,
        triggerType: 'enter',
      },
      status: 'active',
    },
    {
      id: 'rem-local-3',
      title: 'Return books / Check reservation',
      notes: 'Due by Friday',
      type: 'location',
      category: 'personal',
      priority: 'low',
      completed: false,
      createdAt: new Date().toISOString(),
      lastTriggeredAt: null,
      location: {
        name: 'Community Library',
        lat: centerLat + 0.0022,
        lng: centerLng - 0.0015,
        radius: 150,
        triggerType: 'enter',
      },
      status: 'active',
    },
    {
      id: 'rem-local-4',
      title: 'Drink water & take 5-minute break',
      notes: 'Daily wellness reminder',
      type: 'time',
      category: 'personal',
      priority: 'low',
      completed: false,
      createdAt: new Date().toISOString(),
      dueTime: new Date(Date.now() + 1800000).toISOString(),
      status: 'active',
    },
  ];
}
