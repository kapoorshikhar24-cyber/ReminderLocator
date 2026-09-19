import { Capacitor, registerPlugin } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { LocalNotifications } from '@capacitor/local-notifications';
import { sendNotification as sendWebNotification, playArrivalChime, triggerVibration } from './notifications';

// Register native custom BackgroundLocation plugin
export const BackgroundLocation = registerPlugin('BackgroundLocation');

/**
 * Check if running inside Capacitor native iOS/Android shell
 */
export function isNative() {
  return typeof window !== 'undefined' && Capacitor.isNativePlatform();
}

/**
 * Request all required native permissions (Fine GPS, Background GPS, Notifications)
 */
export async function requestAllNativePermissions() {
  const result = {
    location: 'prompt',
    notifications: 'prompt',
  };

  if (isNative()) {
    try {
      // 1. Notifications permission & Channel setup
      const notifStatus = await LocalNotifications.requestPermissions();
      result.notifications = notifStatus.display;

      try {
        await LocalNotifications.createChannel({
          id: 'georemind_alerts',
          name: 'GeoRemind Geofence Alerts',
          description: 'Heads-up arrival & departure alerts for location reminders',
          importance: 5, // MAX importance (heads-up banner + sound + vibration)
          visibility: 1, // VISIBILITY_PUBLIC (shows on lock screen)
          vibration: true,
          sound: 'beep.wav',
          lights: true,
          lightColor: '#38bdf8',
        });
      } catch (err) {
        console.warn('Notification channel setup error:', err);
      }

      // 2. Geolocation permissions (Fine + Coarse)
      const geoStatus = await Geolocation.requestPermissions({
        permissions: ['location', 'coarseLocation'],
      });
      result.location = geoStatus.location;

      // 3. Request Background location plugin permissions
      if (BackgroundLocation?.requestPermissions) {
        await BackgroundLocation.requestPermissions();
      }
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
 * Start 24/7 background location tracking & geofencing engine
 */
export async function startBackgroundTracking(reminders = []) {
  if (isNative()) {
    try {
      await requestAllNativePermissions();
      const activeReminders = reminders.filter((r) => !r.completed && r.location?.lat);
      const res = await BackgroundLocation.startTracking({
        remindersJson: JSON.stringify(activeReminders),
      });
      console.log('🚀 Native Background Tracking started:', res);
      return res;
    } catch (err) {
      console.warn('Could not start native background service:', err);
    }
  }

  // Web fallback: request Screen Wake Lock to prevent sleep
  await requestScreenWakeLock();
  return { status: 'web_active' };
}

/**
 * Stop background location tracking service
 */
export async function stopBackgroundTracking() {
  if (isNative()) {
    try {
      const res = await BackgroundLocation.stopTracking();
      return res;
    } catch (err) {
      console.warn('Could not stop native background service:', err);
    }
  }
  await releaseScreenWakeLock();
  return { status: 'stopped' };
}

/**
 * Sync active reminders to the native background service
 * Ensures Android geofence engine checks the latest geofences even if app is asleep
 */
export async function syncRemindersToBackground(reminders = []) {
  if (isNative()) {
    try {
      const activeReminders = reminders.filter((r) => !r.completed && r.location?.lat);
      await BackgroundLocation.updateReminders({
        remindersJson: JSON.stringify(activeReminders),
      });
    } catch (err) {
      console.warn('Error syncing reminders to background service:', err);
    }
  }
}

/**
 * Prompt user to whitelist GeoRemind from Android Battery Optimization / Doze mode
 */
export async function requestBatteryOptimizationExemption() {
  if (isNative()) {
    try {
      const res = await BackgroundLocation.requestIgnoreBatteryOptimizations();
      return res;
    } catch (err) {
      console.warn('Error requesting battery exemption:', err);
    }
  }
  return { prompted: false };
}

/**
 * Check background permissions and battery optimization status
 */
export async function checkBackgroundStatus() {
  if (isNative()) {
    try {
      return await BackgroundLocation.checkBackgroundStatus();
    } catch (err) {
      console.warn('Error checking background status:', err);
    }
  }
  return {
    hasLocationPermission: true,
    hasBackgroundPermission: true,
    isIgnoringBatteryOptimizations: true,
  };
}

/**
 * Listen to live location updates emitted by native background service
 */
export function addBackgroundLocationListener(onLocation) {
  if (isNative() && BackgroundLocation?.addListener) {
    try {
      const handle = BackgroundLocation.addListener('locationUpdate', (data) => {
        if (data?.latitude && data?.longitude) {
          onLocation({
            lat: data.latitude,
            lng: data.longitude,
            accuracy: data.accuracy,
            speed: data.speed,
          });
        }
      });
      return () => {
        handle.then((h) => h.remove?.());
      };
    } catch (err) {
      console.warn('Error adding background location listener:', err);
    }
  }
  return () => {};
}

/**
 * Listen to geofence triggers detected by native background service
 */
export function addBackgroundGeofenceListener(onTrigger) {
  if (isNative() && BackgroundLocation?.addListener) {
    try {
      const handle = BackgroundLocation.addListener('geofenceTrigger', (data) => {
        if (data) {
          onTrigger(data);
        }
      });
      return () => {
        handle.then((h) => h.remove?.());
      };
    } catch (err) {
      console.warn('Error adding background geofence listener:', err);
    }
  }
  return () => {};
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
            channelId: 'georemind_alerts',
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
 * Schedule a native snooze notification that will fire even if the app is closed
 */
export async function scheduleSnoozeNotification({ reminder, minutes = 10 }) {
  if (!reminder) return;
  const triggerTime = new Date(Date.now() + minutes * 60 * 1000);

  if (isNative()) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: `💤 Snooze Over: ${reminder.title}`,
            body: reminder.notes || `Reminder for ${reminder.location?.name || 'your saved spot'}`,
            id: Math.abs(hashString(`snooze-${reminder.id}`)),
            schedule: { 
              at: triggerTime,
              allowWhileIdle: true, // Forces Android OS AlarmManager to fire even in Doze mode / App killed
            },
            sound: 'beep.wav',
            channelId: 'georemind_alerts',
            extra: { reminderId: reminder.id, type: 'snooze' },
          },
        ],
      });
      return;
    } catch (err) {
      console.warn('Could not schedule native snooze notification:', err);
    }
  }

  // On Web / Desktop fallback (if tab is still alive)
  if (typeof window !== 'undefined' && 'Notification' in window) {
    setTimeout(() => {
      sendWebNotification(`💤 Snooze Over: ${reminder.title}`, {
        body: reminder.notes || `Reminder for ${reminder.location?.name || 'your saved spot'}`,
        tag: `snooze-${reminder.id}`,
      });
    }, minutes * 60 * 1000);
  }
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

// ==========================================
// Samsung Galaxy & Android Device Optimization
// ==========================================

/**
 * Retrieve hardware and manufacturer info
 */
export async function getDeviceInfo() {
  if (isNative() && BackgroundLocation?.getDeviceInfo) {
    try {
      return await BackgroundLocation.getDeviceInfo();
    } catch (err) {
      console.warn('Error fetching native device info:', err);
    }
  }

  // Browser / Web fallback detection
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
  const isSamsung = ua.includes('samsung') || ua.includes('sm-');
  return {
    manufacturer: isSamsung ? 'Samsung' : 'Standard',
    brand: isSamsung ? 'Samsung' : 'Standard',
    model: isSamsung ? 'Galaxy Device' : 'Standard Device',
    sdkInt: 35,
    isSamsung,
  };
}

/**
 * Open Samsung Device Care Battery settings or direct App Info settings
 */
export async function openSamsungBatterySettings() {
  if (isNative()) {
    if (BackgroundLocation?.openSamsungBatterySettings) {
      try {
        return await BackgroundLocation.openSamsungBatterySettings();
      } catch (err) {
        console.warn('Error calling openSamsungBatterySettings:', err);
      }
    }
    if (BackgroundLocation?.openAppSettings) {
      try {
        return await BackgroundLocation.openAppSettings();
      } catch (err) {
        console.warn('Error calling openAppSettings:', err);
      }
    }
  }
  return { success: false };
}

/**
 * Open standard App Settings for any Android OEM (Pixel, OnePlus, Xiaomi, etc.)
 */
export async function openAppSettings() {
  if (isNative() && BackgroundLocation?.openAppSettings) {
    try {
      return await BackgroundLocation.openAppSettings();
    } catch (err) {
      console.warn('Error opening app settings:', err);
    }
  }
  return { success: false };
}

/**
 * Comprehensive background & battery optimization status check
 */
export async function checkDeviceOptimizationStatus() {
  if (isNative() && BackgroundLocation?.checkBackgroundStatus) {
    try {
      return await BackgroundLocation.checkBackgroundStatus();
    } catch (err) {
      console.warn('Error checking device optimization status:', err);
    }
  }
  return {
    hasLocationPermission: true,
    hasBackgroundPermission: true,
    isIgnoringBatteryOptimizations: true,
    canScheduleExactAlarms: true,
    isSamsung: false,
    manufacturer: 'Browser',
    model: 'Web Client',
  };
}

