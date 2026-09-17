package com.georemind.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;

public class BackgroundLocationService extends Service implements LocationListener {
    private static final String TAG = "BgLocationService";
    public static final String ACTION_START = "ACTION_START";
    public static final String ACTION_STOP = "ACTION_STOP";
    public static final String ACTION_UPDATE_REMINDERS = "ACTION_UPDATE_REMINDERS";
    public static final String EXTRA_REMINDERS_JSON = "EXTRA_REMINDERS_JSON";

    private static final String CHANNEL_ID_SERVICE = "georemind_bg_tracking";
    private static final String CHANNEL_ID_ALERTS = "georemind_alerts";
    private static final int NOTIFICATION_ID_SERVICE = 9991;

    private static final String PREFS_NAME = "GeoRemindBackgroundPrefs";
    private static final String KEY_SAVED_REMINDERS = "saved_reminders";

    private LocationManager locationManager;
    private PowerManager.WakeLock wakeLock;
    private boolean isTracking = false;

    // Cooldown map: reminderId -> lastTriggerTimestamp
    private final Map<String, Long> geofenceCooldownMap = new HashMap<>();
    private final Map<String, Boolean> geofenceInsideMap = new HashMap<>();

    public interface LocationCallback {
        void onLocationReceived(Location location);
        void onGeofenceTriggered(String reminderId, String title, String notes, float distance, String triggerType);
    }

    private static LocationCallback staticCallback = null;

    public static void setLocationCallback(LocationCallback callback) {
        staticCallback = callback;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannels();

        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (powerManager != null) {
            wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "GeoRemind:BgLocationWakeLock");
            wakeLock.setReferenceCounted(false);
        }

        locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
            startForegroundServiceNotification();
            startLocationUpdates();
            return START_STICKY;
        }

        String action = intent.getAction();
        if (ACTION_START.equals(action)) {
            startForegroundServiceNotification();
            startLocationUpdates();
            if (intent.hasExtra(EXTRA_REMINDERS_JSON)) {
                saveRemindersJson(intent.getStringExtra(EXTRA_REMINDERS_JSON));
            }
        } else if (ACTION_UPDATE_REMINDERS.equals(action)) {
            if (intent.hasExtra(EXTRA_REMINDERS_JSON)) {
                saveRemindersJson(intent.getStringExtra(EXTRA_REMINDERS_JSON));
            }
        } else if (ACTION_STOP.equals(action)) {
            stopLocationUpdates();
            stopForeground(true);
            stopSelf();
        }

        return START_STICKY;
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager == null) return;

            // 1. Silent Ongoing Channel for Foreground Service
            NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID_SERVICE,
                    "GeoRemind Background Monitoring",
                    NotificationManager.IMPORTANCE_LOW
            );
            serviceChannel.setDescription("Continuous background GPS tracking for active geofenced reminders");
            serviceChannel.setShowBadge(false);
            serviceChannel.enableVibration(false);
            serviceChannel.enableLights(false);
            manager.createNotificationChannel(serviceChannel);

            // 2. High-Priority Channel for Arrival/Departure Geofence Alerts
            NotificationChannel alertChannel = new NotificationChannel(
                    CHANNEL_ID_ALERTS,
                    "GeoRemind Geofence Alerts",
                    NotificationManager.IMPORTANCE_HIGH
            );
            alertChannel.setDescription("High priority sound & vibration alerts when reaching reminder locations");
            alertChannel.enableVibration(true);
            alertChannel.setVibrationPattern(new long[]{0, 300, 150, 300, 150, 500});
            alertChannel.enableLights(true);
            alertChannel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);

            Uri defaultSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION_EVENT)
                    .build();
            alertChannel.setSound(defaultSound, audioAttributes);

            manager.createNotificationChannel(alertChannel);
        }
    }

    private void startForegroundServiceNotification() {
        Intent launchIntent = new Intent(this, MainActivity.class);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                0,
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID_SERVICE)
                .setSmallIcon(android.R.drawable.ic_menu_mylocation)
                .setContentTitle("GeoRemind Active")
                .setContentText("Monitoring your location in the background for arrival reminders")
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setContentIntent(pendingIntent);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID_SERVICE, builder.build(), ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION);
        } else {
            startForeground(NOTIFICATION_ID_SERVICE, builder.build());
        }
    }

    private void startLocationUpdates() {
        if (isTracking) return;

        if (wakeLock != null && !wakeLock.isHeld()) {
            wakeLock.acquire(24 * 60 * 60 * 1000L); // 24hr max
        }

        if (locationManager == null) {
            locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        }

        long minTimeMs = 3000; // 3 seconds
        float minDistanceM = 3.0f; // 3 meters

        try {
            if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, minTimeMs, minDistanceM, this);
            }
            if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                locationManager.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, minTimeMs, minDistanceM, this);
            }
            isTracking = true;
            Log.d(TAG, "Background location tracking started successfully.");
        } catch (SecurityException e) {
            Log.e(TAG, "SecurityException requesting background location updates: " + e.getMessage());
        } catch (Exception e) {
            Log.e(TAG, "Error starting location updates: " + e.getMessage());
        }
    }

    private void stopLocationUpdates() {
        if (locationManager != null) {
            try {
                locationManager.removeUpdates(this);
            } catch (Exception e) {
                Log.e(TAG, "Error removing location updates: " + e.getMessage());
            }
        }

        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }

        isTracking = false;
        Log.d(TAG, "Background location tracking stopped.");
    }

    private void saveRemindersJson(String json) {
        if (json == null) return;
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_SAVED_REMINDERS, json).apply();
    }

    private String getSavedRemindersJson() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        return prefs.getString(KEY_SAVED_REMINDERS, "[]");
    }

    @Override
    public void onLocationChanged(Location location) {
        if (location == null) return;

        // 1. Notify static JS callback if app is active/alive
        if (staticCallback != null) {
            try {
                staticCallback.onLocationReceived(location);
            } catch (Exception e) {
                Log.w(TAG, "Callback error onLocationReceived: " + e.getMessage());
            }
        }

        // 2. Evaluate geofences against stored active reminders
        evaluateGeofences(location);
    }

    private void evaluateGeofences(Location location) {
        String json = getSavedRemindersJson();
        if (json == null || json.trim().isEmpty() || json.equals("[]")) return;

        try {
            JSONArray array = new JSONArray(json);
            long now = System.currentTimeMillis();
            long COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes cooldown

            for (int i = 0; i < array.length(); i++) {
                JSONObject rem = array.getJSONObject(i);
                if (rem.optBoolean("completed", false)) continue;

                // Check if reminder is snoozed
                long snoozedUntil = rem.optLong("snoozedUntil", 0L);
                if (snoozedUntil > now) {
                    continue; // Skip evaluating while snoozed
                }

                JSONObject locObj = rem.optJSONObject("location");

                if (locObj == null) continue;

                double targetLat = locObj.optDouble("lat", Double.NaN);
                double targetLng = locObj.optDouble("lng", Double.NaN);
                if (Double.isNaN(targetLat) || Double.isNaN(targetLng)) continue;

                double radius = locObj.optDouble("radius", 100.0);
                String triggerType = locObj.optString("triggerType", "enter");
                String reminderId = rem.optString("id", String.valueOf(i));
                String title = rem.optString("title", "Reminder");
                String notes = rem.optString("notes", "");

                float[] distanceResult = new float[1];
                Location.distanceBetween(location.getLatitude(), location.getLongitude(), targetLat, targetLng, distanceResult);
                float distance = distanceResult[0];

                boolean isInside = distance <= radius;
                boolean wasInside = geofenceInsideMap.containsKey(reminderId) && Boolean.TRUE.equals(geofenceInsideMap.get(reminderId));
                long lastTrigger = geofenceCooldownMap.containsKey(reminderId) ? geofenceCooldownMap.get(reminderId) : 0L;
                boolean cooldownElapsed = (now - lastTrigger) > COOLDOWN_MS;

                if ("enter".equalsIgnoreCase(triggerType)) {
                    if (isInside && (!wasInside || cooldownElapsed)) {
                        geofenceInsideMap.put(reminderId, true);
                        geofenceCooldownMap.put(reminderId, now);
                        dispatchGeofenceAlert(reminderId, title, notes, distance, "enter");
                    } else if (!isInside) {
                        geofenceInsideMap.put(reminderId, false);
                    }
                } else if ("exit".equalsIgnoreCase(triggerType)) {
                    if (!isInside && wasInside && cooldownElapsed) {
                        geofenceInsideMap.put(reminderId, false);
                        geofenceCooldownMap.put(reminderId, now);
                        dispatchGeofenceAlert(reminderId, title, notes, distance, "exit");
                    } else if (isInside) {
                        geofenceInsideMap.put(reminderId, true);
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error evaluating background geofences: " + e.getMessage());
        }
    }

    private void dispatchGeofenceAlert(String reminderId, String title, String notes, float distance, String triggerType) {
        Log.i(TAG, "GEOFENCE TRIGGERED IN BACKGROUND: " + title + " (Dist: " + Math.round(distance) + "m)");

        // 1. Dispatch Native Heads-up System Notification on lock screen & in pocket
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            Intent launchIntent = new Intent(this, MainActivity.class);
            launchIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            launchIntent.putExtra("triggeredReminderId", reminderId);

            int notifId = Math.abs(reminderId.hashCode());
            PendingIntent pendingIntent = PendingIntent.getActivity(
                    this,
                    notifId,
                    launchIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
            );

            String alertTitle = "enter".equalsIgnoreCase(triggerType)
                    ? "📍 Arrived: " + title
                    : "🚪 Leaving: " + title;

            String alertBody = (notes != null && !notes.trim().isEmpty())
                    ? notes
                    : "You are within " + Math.round(distance) + "m of your destination.";

            NotificationCompat.Builder alertBuilder = new NotificationCompat.Builder(this, CHANNEL_ID_ALERTS)
                    .setSmallIcon(android.R.drawable.ic_dialog_map)
                    .setContentTitle(alertTitle)
                    .setContentText(alertBody)
                    .setStyle(new NotificationCompat.BigTextStyle().bigText(alertBody))
                    .setPriority(NotificationCompat.PRIORITY_MAX)
                    .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                    .setAutoCancel(true)
                    .setVibrate(new long[]{0, 300, 150, 300, 150, 500})
                    .setDefaults(Notification.DEFAULT_ALL)
                    .setContentIntent(pendingIntent);

            manager.notify(notifId, alertBuilder.build());
        }

        // 2. Notify static JS callback if webview is reachable
        if (staticCallback != null) {
            try {
                staticCallback.onGeofenceTriggered(reminderId, title, notes, distance, triggerType);
            } catch (Exception e) {
                Log.w(TAG, "Callback error onGeofenceTriggered: " + e.getMessage());
            }
        }
    }

    @Override
    public void onStatusChanged(String provider, int status, Bundle extras) {}

    @Override
    public void onProviderEnabled(String provider) {}

    @Override
    public void onProviderDisabled(String provider) {}

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        stopLocationUpdates();
        super.onDestroy();
    }
}
