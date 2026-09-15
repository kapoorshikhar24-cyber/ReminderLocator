import { 
  fetchRemoteUserSettings, 
  saveRemoteUserSettings, 
  fetchRemoteReminders, 
  syncRemindersToCloud 
} from './supabase';
import { saveDefaultLocation } from './storage';
import { saveMapConfig } from './mapProviders';

/**
 * Handle initial sync when a user logs in on ANY device
 */
export async function handleUserLoginSync(user, currentReminders, currentMapConfig, currentDefaultLoc) {
  if (!user?.id) return null;

  try {
    // 1. Fetch remote settings (Google API Key, Map Provider, Default Location)
    const remoteSettings = await fetchRemoteUserSettings(user.id);

    let updatedMapConfig = { ...currentMapConfig };
    let updatedDefaultLoc = currentDefaultLoc;

    if (remoteSettings) {
      // If remote has a Google API Key, apply it locally!
      if (remoteSettings.google_maps_api_key) {
        updatedMapConfig.googleApiKey = remoteSettings.google_maps_api_key;
        if (remoteSettings.map_provider) {
          updatedMapConfig.providerId = remoteSettings.map_provider;
        }
        saveMapConfig(updatedMapConfig);
      }

      // If remote has a default location, apply it locally!
      if (remoteSettings.default_location) {
        updatedDefaultLoc = remoteSettings.default_location;
        saveDefaultLocation(remoteSettings.default_location);
      }
    } else {
      // First time this user logs in: upload local settings to cloud!
      await saveRemoteUserSettings(user.id, {
        googleMapsApiKey: currentMapConfig?.googleApiKey || '',
        mapProvider: currentMapConfig?.providerId || 'osm',
        defaultLocation: currentDefaultLoc,
      });
    }

    // 2. Fetch remote reminders
    const remoteReminders = await fetchRemoteReminders(user.id);
    let finalReminders = currentReminders;

    if (remoteReminders && remoteReminders.length > 0) {
      // Cloud has reminders for this user: use them!
      finalReminders = remoteReminders;
    } else if (currentReminders && currentReminders.length > 0) {
      // Upload existing local reminders to user's new cloud account
      await syncRemindersToCloud(user.id, currentReminders);
    }

    return {
      mapConfig: updatedMapConfig,
      defaultLoc: updatedDefaultLoc,
      reminders: finalReminders,
    };
  } catch (err) {
    console.error('Login sync error:', err);
    return null;
  }
}

/**
 * Push updated settings to Supabase whenever user edits API key or map settings
 */
export async function pushSettingsToCloud(userId, mapConfig, defaultLoc) {
  if (!userId) return;
  try {
    await saveRemoteUserSettings(userId, {
      googleMapsApiKey: mapConfig.googleApiKey || '',
      mapProvider: mapConfig.providerId || 'osm',
      defaultLocation: defaultLoc,
    });
  } catch (err) {
    console.warn('Failed to push settings to cloud:', err);
  }
}

/**
 * Push reminders array to Supabase whenever user creates, edits, or deletes a reminder
 */
export async function pushRemindersToCloud(userId, reminders) {
  if (!userId || !Array.isArray(reminders)) return;
  try {
    await syncRemindersToCloud(userId, reminders);
  } catch (err) {
    console.warn('Failed to push reminders to cloud:', err);
  }
}
