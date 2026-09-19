# GeoRemind v2 — Security & UX Review

Reviewed package: `GeoRemind-v2.apk` (`com.georemind.app`, version 1.0, target SDK 36)

## Executive summary

The APK is a Capacitor/Hybrid Android application. Its Android manifest is generally better than expected: application backups are disabled, cleartext HTTP is disabled, file providers are not exported, and the background location service is not exported. However, the production APK was built with `android:debuggable="true"`, and the frontend bundle contained a hard-coded Google Maps API key.

The bundled JavaScript also implements local username/password accounts with a custom, unsalted 32-bit hash and previously accepted four-character passwords. In addition, a failed login for a nonexistent local account could silently create a new account. These are security and UX problems.

## Fixes applied to the extracted build

1. Changed compiled manifest `android:debuggable` from `true` to `false`.
2. Removed the embedded Google Maps API key from the frontend bundle.
3. Changed the default map provider from Google Maps to OpenStreetMap, which does not require an API key.
4. Disabled upload of Google Maps API keys into the Supabase `user_settings` record.
5. Disabled restoring Google Maps API keys from Supabase back into local storage.
6. Removed the failed-login path that silently created a local account.
7. Removed the signup path that could behave like a login for an existing account.
8. Raised the local password minimum shown/enforced by the current bundle from 4 to 8 characters.
9. Removed `user-scalable=no` / `maximum-scale=1.0` from the viewport so accessibility zoom is available.
10. Added responsive/mobile UX overrides: larger touch targets, improved focus states, safe-area handling, sticky navigation, improved forms/modals, better card interaction, and reduced-motion support.

## Important remaining security work that requires the original source project

### 1. Replace local password authentication

**Severity: High.** The app still contains the custom `ru()` password hash used by the local-account path. It is not a cryptographic password KDF and should not be treated as secure password storage.

Preferred fix: remove local password authentication and use Supabase Auth only. If offline local authentication is mandatory, use a proven password KDF (Argon2id or PBKDF2-HMAC-SHA-256 with a per-user random salt and an appropriate work factor) and migrate existing local records.

### 2. Bind biometric unlock to a cryptographically verified account

**Severity: Medium/High.** The current local biometric flow stores credential/account mapping metadata in WebView `localStorage` and then maps a successful WebAuthn assertion back to a local user. A more robust Android implementation should use native `BiometricPrompt` plus Android Keystore-backed keys, or server-verified WebAuthn where applicable.

### 3. Encrypt sensitive reminder/location data at rest

**Severity: Medium.** Reminder titles, notes, and location coordinates are persisted in WebView storage. `allowBackup=false` reduces exposure, and disabling debugging also helps, but precise location information is sensitive. For higher assurance, encrypt sensitive fields using a key protected by Android Keystore and store the ciphertext in app-private storage/DataStore/Room.

### 4. Verify Supabase Row Level Security

**Severity: High if RLS is missing.** The frontend directly reads/writes `user_settings` and `reminders`. Both tables should have RLS enabled and policies that only allow an authenticated user to access rows where `user_id = auth.uid()`. The anonymous role should have no write access unless explicitly required.

Example policy shape:

```sql
alter table public.reminders enable row level security;
alter table public.user_settings enable row level security;

create policy "users read own reminders"
on public.reminders for select
to authenticated
using (auth.uid() = user_id);

create policy "users insert own reminders"
on public.reminders for insert
to authenticated
with check (auth.uid() = user_id);

create policy "users update own reminders"
on public.reminders for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users delete own reminders"
on public.reminders for delete
to authenticated
using (auth.uid() = user_id);
```

Create equivalent policies for `user_settings`, and restrict table grants to only required operations.

### 5. Rotate/restrict the previously exposed Google Maps API key

**Severity: High until handled in Google Cloud.** Removing the key from this APK does not invalidate copies already distributed. Rotate or disable the exposed key. Any replacement key must be restricted to only the APIs and application origins/package/signing identity that actually need it.

### 6. Reduce privileged Android permissions

The manifest requests background location plus several special notification/power permissions, including both `SCHEDULE_EXACT_ALARM` and `USE_EXACT_ALARM`, `USE_FULL_SCREEN_INTENT`, `ACCESS_NOTIFICATION_POLICY`, and `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`.

Review each one against actual user-facing functionality. In particular, a location-reminder app normally should not need full-screen intents unless it genuinely implements an alarm-clock-style experience. Remove permissions that are not required.

### 7. Production signing/build pipeline

The patched extracted files in this package are not a substitute for rebuilding the app from the original Android/Capacitor source. Rebuild with Android Gradle Plugin using your real release signing key, APK Signature Scheme v2 or higher, resource alignment, `debuggable=false`, minification/shrinking where appropriate, and automated release checks.

## UX changes included

- Minimum 46px interactive tap targets for primary controls.
- Strong keyboard/focus-visible indicators.
- Safer Android/iPhone display-cutout and bottom-navigation safe-area handling.
- Sticky top navigation and improved mobile bottom navigation.
- Search/forms use 16px input text to avoid unwanted mobile zoom behavior.
- Modal content is constrained to the viewport and scrolls rather than being clipped.
- Reminder cards have clearer press/focus feedback.
- Mobile spacing and card radii are normalized for easier one-handed use.
- Reduced-motion users get near-zero transitions/animations.
- Pinch-to-zoom is no longer disabled.

## Build note

This package contains patched extracted assets plus a reproducible patch script. It intentionally does not claim to be a production-ready rebuilt APK because Android 11+ requires APK Signature Scheme v2 or higher and correct APK resource alignment. Use the original project and normal Gradle/Android signing pipeline for the final installable release.
