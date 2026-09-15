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
 * Send alert notification that pops on lock screen and in pocket
 */
export async function sendArrivalAlert({ title, body, reminderId }) {
  // Always play audio & trigger vibration
  playArrivalChime();
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
