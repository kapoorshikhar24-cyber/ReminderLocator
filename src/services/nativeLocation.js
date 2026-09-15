import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { LocalNotifications } from '@capacitor/local-notifications';
import { sendNotification as sendWebNotification, playArrivalChime, triggerVibration } from './notifications';

/**
 * Check if running inside Capacitor native iOS/Android shell
 */
export function isNative() {
  return typeof window !== 'undefined' && Capacitor.isNativePlatform();
}

/**
 * Request all required native permissions (GPS + Notifications)
 */
export async function requestAllNativePermissions() {
  const result = {
    location: 'prompt',
    notifications: 'prompt',
  };

  if (isNative()) {
    try {
      // 1. Notifications
      const notifStatus = await LocalNotifications.requestPermissions();
      result.notifications = notifStatus.display;

      // 2. Geolocation (Fine + Background)
      const geoStatus = await Geolocation.requestPermissions({
        permissions: ['location', 'coarseLocation'],
      });
      result.location = geoStatus.location;
    } catch (err) {
      console.warn('Native permission request error:', err);
    }
  } else {
    // Browser fallback
    if ('Notification' in window) {
      result.notifications = await Notification.requestPermission();
    }
  }

  return result;
}

/**
 * Get device GPS position (uses native Geolocation when available, browser fallback)
 */
export async function getDevicePosition() {
  if (isNative()) {
    try {
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 10000,
      });
      if (pos?.coords) {
        return { lat: pos.coords.latitude, lng: pos.coords.longitude };
      }
    } catch (err) {
      console.warn('Native Geolocation.getCurrentPosition failed, trying fallback:', err);
    }
  }

  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      return reject(new Error('Geolocation not supported'));
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}

export const BATTERY_MODES = [
  {
    id: 'high',
    name: 'High Precision',
    badge: '🏃 Sports & Walking',
    description: 'Fastest GPS updates (3-5s). Pinpoint accuracy for tight store/entrance geofences (50m-100m).',
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 2000,
  },
  {
    id: 'balanced',
    name: 'Balanced Mode',
    badge: '⚖️ Daily Transit',
    description: 'Standard updates (15-20s). Smooth movement with optimal battery preservation.',
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 10000,
  },
  {
    id: 'saver',
    name: 'Battery Saver',
    badge: '🔋 Ultra Low Drain',
    description: 'Coarse / Wi-Fi & cell tower updates (45-60s). Ideal for highway travel or low battery.',
    enableHighAccuracy: false,
    timeout: 30000,
    maximumAge: 30000,
  },
];

/**
 * Watch device GPS position with live updates across native Android and Web
 */
export async function watchDevicePosition(onLocation, onError, batteryMode = 'balanced') {
  const modeConfig = BATTERY_MODES.find((m) => m.id === batteryMode) || BATTERY_MODES[1];

  const watchOptions = {
    enableHighAccuracy: modeConfig.enableHighAccuracy,
    timeout: modeConfig.timeout,
    maximumAge: modeConfig.maximumAge,
  };

  if (isNative()) {
    try {
      const watchId = await Geolocation.watchPosition(
        watchOptions,
        (position, err) => {
          if (err) {
            onError?.(err);
            return;
          }
          if (position?.coords) {
            onLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          }
        }
      );
      return () => {
        Geolocation.clearWatch({ id: watchId });
      };
    } catch (err) {
      console.warn('Native watchPosition failed, falling back to web:', err);
    }
  }

  // Web fallback
  if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        onLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      onError,
      watchOptions
    );
    return () => navigator.geolocation.clearWatch(id);
  }

  return () => {};
}

/**
 * Send alert notification that pops on lock screen and in pocket
 */
export async function sendArrivalAlert({ title, body, reminderId, soundProfile = 'crystal' }) {
  // Always play audio & trigger vibration
  playArrivalChime(soundProfile);
  triggerVibration([300, 150, 300, 150, 500]);

  if (isNative()) {
    try {
      // Schedule immediate native Android/iOS system notification
      await LocalNotifications.schedule({
        notifications: [
          {
            title: `📍 Location Reached: ${title}`,
            body: body || 'You are inside your reminder geofence!',
            id: Math.abs(hashString(reminderId || title || '1')),
            schedule: { at: new Date(Date.now() + 100) },
            sound: 'beep.wav',
            actionTypeId: '',
            extra: { reminderId },
          },
        ],
      });
      return;
    } catch (err) {
      console.warn('Native local notification failed, falling back:', err);
    }
  }

  // Web Browser fallback
  sendWebNotification(`📍 ${title}`, {
    body: body || 'You are inside your reminder geofence!',
    tag: `arrival-${reminderId}`,
  });
}

/**
 * Simple numeric hash for notification IDs
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

// ==========================================
// Screen Wake Lock API (Keep Active in Pocket / Travel)
// ==========================================

let wakeLockSentinel = null;

export async function requestScreenWakeLock() {
  if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
    try {
      wakeLockSentinel = await navigator.wakeLock.request('screen');
      wakeLockSentinel.addEventListener('release', () => {
        wakeLockSentinel = null;
      });
      return true;
    } catch (err) {
      console.warn('Wake Lock request error:', err);
      return false;
    }
  }
  return false;
}

export async function releaseScreenWakeLock() {
  if (wakeLockSentinel) {
    try {
      await wakeLockSentinel.release();
      wakeLockSentinel = null;
    } catch (err) {
      console.warn('Wake Lock release error:', err);
    }
  }
}

export function isWakeLockActive() {
  return wakeLockSentinel !== null && !wakeLockSentinel.released;
}
