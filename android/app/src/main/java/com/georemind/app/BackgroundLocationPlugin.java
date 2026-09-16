package com.georemind.app;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.Location;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import android.util.Log;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

@CapacitorPlugin(
        name = "BackgroundLocation",
        permissions = {
                @Permission(strings = {Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION}, alias = "location"),
                @Permission(strings = {Manifest.permission.POST_NOTIFICATIONS}, alias = "notifications")
        }
)
public class BackgroundLocationPlugin extends Plugin {
    private static final String TAG = "BgLocationPlugin";
    private boolean isRegistered = false;

    @Override
    public void load() {
        super.load();
        setupCallback();
    }

    private void setupCallback() {
        if (isRegistered) return;
        BackgroundLocationService.setLocationCallback(new BackgroundLocationService.LocationCallback() {
            @Override
            public void onLocationReceived(Location location) {
                JSObject data = new JSObject();
                data.put("latitude", location.getLatitude());
                data.put("longitude", location.getLongitude());
                data.put("accuracy", location.getAccuracy());
                data.put("speed", location.getSpeed());
                data.put("altitude", location.getAltitude());
                data.put("time", location.getTime());
                notifyListeners("locationUpdate", data);
            }

            @Override
            public void onGeofenceTriggered(String reminderId, String title, String notes, float distance, String triggerType) {
                JSObject data = new JSObject();
                data.put("reminderId", reminderId);
                data.put("title", title);
                data.put("notes", notes);
                data.put("distance", distance);
                data.put("triggerType", triggerType);
                notifyListeners("geofenceTrigger", data);
            }
        });
        isRegistered = true;
    }

    @PluginMethod
    public void startTracking(PluginCall call) {
        setupCallback();
        Context context = getContext();
        Intent serviceIntent = new Intent(context, BackgroundLocationService.class);
        serviceIntent.setAction(BackgroundLocationService.ACTION_START);

        String remindersJson = call.getString("remindersJson", null);
        if (remindersJson != null) {
            serviceIntent.putExtra(BackgroundLocationService.EXTRA_REMINDERS_JSON, remindersJson);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            ContextCompat.startForegroundService(context, serviceIntent);
        } else {
            context.startService(serviceIntent);
        }

        JSObject ret = new JSObject();
        ret.put("status", "started");
        call.resolve(ret);
    }

    @PluginMethod
    public void stopTracking(PluginCall call) {
        Context context = getContext();
        Intent serviceIntent = new Intent(context, BackgroundLocationService.class);
        serviceIntent.setAction(BackgroundLocationService.ACTION_STOP);
        context.startService(serviceIntent);

        JSObject ret = new JSObject();
        ret.put("status", "stopped");
        call.resolve(ret);
    }

    @PluginMethod
    public void updateReminders(PluginCall call) {
        String remindersJson = call.getString("remindersJson", "[]");
        Context context = getContext();
        Intent serviceIntent = new Intent(context, BackgroundLocationService.class);
        serviceIntent.setAction(BackgroundLocationService.ACTION_UPDATE_REMINDERS);
        serviceIntent.putExtra(BackgroundLocationService.EXTRA_REMINDERS_JSON, remindersJson);
        context.startService(serviceIntent);

        JSObject ret = new JSObject();
        ret.put("status", "updated");
        call.resolve(ret);
    }

    @PluginMethod
    public void requestIgnoreBatteryOptimizations(PluginCall call) {
        Context context = getContext();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            String packageName = context.getPackageName();
            if (pm != null && !pm.isIgnoringBatteryOptimizations(packageName)) {
                try {
                    Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                    intent.setData(Uri.parse("package:" + packageName));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    context.startActivity(intent);

                    JSObject ret = new JSObject();
                    ret.put("prompted", true);
                    call.resolve(ret);
                    return;
                } catch (Exception e) {
                    Log.w(TAG, "Cannot launch direct battery optimization intent: " + e.getMessage());
                }
            }
        }

        JSObject ret = new JSObject();
        ret.put("prompted", false);
        ret.put("alreadyIgnoring", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void checkBackgroundStatus(PluginCall call) {
        Context context = getContext();
        boolean hasFine = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        boolean hasCoarse = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        boolean hasBackground = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            hasBackground = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_BACKGROUND_LOCATION) == PackageManager.PERMISSION_GRANTED;
        }

        boolean isIgnoringBattery = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                isIgnoringBattery = pm.isIgnoringBatteryOptimizations(context.getPackageName());
            }
        }

        JSObject ret = new JSObject();
        ret.put("hasLocationPermission", hasFine || hasCoarse);
        ret.put("hasBackgroundPermission", hasBackground);
        ret.put("isIgnoringBatteryOptimizations", isIgnoringBattery);
        call.resolve(ret);
    }
}
