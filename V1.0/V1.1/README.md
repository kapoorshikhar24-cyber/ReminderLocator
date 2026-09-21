# GeoRemind Android APK (v2 - Samsung One UI & Universal Android Edition)

This folder contains the compiled, ready-to-install Android APK for **GeoRemind**.

## Files
- **[`GeoRemind-v2.apk`](file:///d:/Location/v2/GeoRemind-v2.apk)** (5.15 MB) — Latest native APK with Samsung Galaxy One UI & Universal Android background optimization.

## What's New in This Build:
- **Samsung One UI Background Optimization**: Direct intent routing to Samsung Device Care / Smart Manager and App Info to configure **Unrestricted** battery mode and bypass Samsung's aggressive 3-day app sleeping policies.
- **Overnight Auto-Restart Resurrection (`BootCompletedReceiver`)**: Samsung phones auto-restart at 3:00 AM by default. GeoRemind now includes a native direct-boot receiver that automatically reloads your active geofences and restarts background tracking as soon as the phone boots up.
- **Samsung Edge Lighting & MAX Alert Channel**: Cyan-accented (`#38BDF8`) high-priority heads-up notification channel that illuminates Samsung screen edges and triggers alarm audio + hardware vibration even on silent mode.
- **Screen-Off GPS Watchdog Pulse & Passive Provider**: Periodically checks location fixes and catches opportunistic fixes from Google Maps / Samsung Health without sensor freeze when the phone is locked in your pocket.
- **Dedicated Samsung Galaxy & Device Assistant**: In-app 1-tap assistant modal and smart warning banner guiding users through One UI settings with real-time status validation.
- **Universal Android Compatibility**: Seamless fallback logic for Google Pixel, OnePlus, Xiaomi/MIUI, Motorola, Vivo, and Oppo devices.
- **Biometric Authentication**: Fingerprint / Face ID login with secure zero-biometric cloud storage.
- **Safe-Area Layout**: Responsive clearances for Samsung Infinity-O centered camera punch holes and gesture navigation bars.

## How to Install on Your Samsung Galaxy or Android Phone

1. **Transfer the APK to your phone**:
   - Send via WhatsApp / Telegram / Quick Share / Google Drive, or
   - Connect phone via USB cable and copy `GeoRemind-v2.apk` into your `Download` folder.
2. **Open the APK on your phone**:
   - Tap `GeoRemind-v2.apk` in the **My Files** app or notification panel.
   - If prompted with *"Install unknown apps"*, toggle **Allow from this source**.
3. **Configure Samsung One UI for Flawless Background Tracking**:
   - Open GeoRemind and tap the **📱 Phone icon** in the top navigation bar (or the top blue banner).
   - Tap **"Open Samsung Battery / App Settings"**:
     - Under **Battery**, select **Unrestricted**.
     - Under **Permissions** → **Location**, select **"Allow all the time"** and ensure **"Use precise location"** is toggled ON.
   - *(Optional One UI Step)*: Phone Settings → **Device Care** → **Battery** → **Background usage limits** → **Never sleeping apps** → tap **(+)** and add **GeoRemind**.
