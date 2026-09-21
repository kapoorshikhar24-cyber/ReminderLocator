package com.georemind.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;

import androidx.core.content.ContextCompat;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * BroadcastReceiver to resurrect GeoRemind background tracking after device restart.
 * Essential for Samsung phones (which frequently auto-restart overnight) and all Android OEM devices.
 */
public class BootCompletedReceiver extends BroadcastReceiver {
    private static final String TAG = "BootReceiver";
    private static final String PREFS_NAME = "GeoRemindBackgroundPrefs";
    private static final String KEY_SAVED_REMINDERS = "saved_reminders";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (context == null || intent == null) return;

        String action = intent.getAction();
        Log.i(TAG, "Received broadcast action: " + action);

        if (Intent.ACTION_BOOT_COMPLETED.equals(action)
                || Intent.ACTION_LOCKED_BOOT_COMPLETED.equals(action)
                || Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)
                || "android.intent.action.QUICKBOOT_POWERON".equals(action)
                || "com.htc.intent.action.QUICKBOOT_POWERON".equals(action)) {

            try {
                SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                String savedJson = prefs.getString(KEY_SAVED_REMINDERS, "[]");

                boolean hasActiveReminders = false;
                if (savedJson != null && !savedJson.trim().isEmpty() && !savedJson.equals("[]")) {
                    JSONArray array = new JSONArray(savedJson);
                    for (int i = 0; i < array.length(); i++) {
                        JSONObject item = array.optJSONObject(i);
                        if (item != null && !item.optBoolean("completed", false) && item.has("location")) {
                            hasActiveReminders = true;
                            break;
                        }
                    }
                }

                if (hasActiveReminders) {
                    Log.i(TAG, "Active reminders found after boot. Resurrecting BackgroundLocationService...");
                    Intent serviceIntent = new Intent(context, BackgroundLocationService.class);
                    serviceIntent.setAction(BackgroundLocationService.ACTION_START);
                    serviceIntent.putExtra(BackgroundLocationService.EXTRA_REMINDERS_JSON, savedJson);

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        ContextCompat.startForegroundService(context, serviceIntent);
                    } else {
                        context.startService(serviceIntent);
                    }
                } else {
                    Log.i(TAG, "No active reminders to track after boot.");
                }
            } catch (Exception e) {
                Log.e(TAG, "Error handling boot broadcast: " + e.getMessage(), e);
            }
        }
    }
}
