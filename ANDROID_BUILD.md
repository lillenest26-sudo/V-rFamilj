# Familje Dashboard — Android Build Guide

This guide explains how to build and generate an APK for the Familje Dashboard native Android app using Capacitor.

---

## Prerequisites

### Required Software

1. **Java Development Kit (JDK) 11 or higher**
   ```bash
   java -version
   ```

2. **Android SDK** (via Android Studio or command-line tools)
   - Minimum SDK: API 24 (Android 7.0)
   - Target SDK: API 34 (Android 14)

3. **Android Studio** (recommended)
   - Download: https://developer.android.com/studio
   - Or use command-line tools

4. **Gradle** (included with Android Studio)

### Environment Setup

Set the `ANDROID_SDK_ROOT` environment variable:

```bash
# macOS / Linux
export ANDROID_SDK_ROOT=~/Library/Android/sdk  # macOS
export ANDROID_SDK_ROOT=~/Android/Sdk          # Linux

# Windows
set ANDROID_SDK_ROOT=C:\Users\YourUsername\AppData\Local\Android\sdk
```

Add to your shell profile (`.bashrc`, `.zshrc`, etc.) to persist:

```bash
echo 'export ANDROID_SDK_ROOT=~/Library/Android/sdk' >> ~/.zshrc
source ~/.zshrc
```

---

## Build Process

### Step 1: Prepare the Web Assets

Build the React/Vite frontend for production:

```bash
cd /home/ubuntu/familje-dashboard
pnpm run build
cp dist/public/index.html dist/index.html
```

This creates the optimized web assets in the `dist/` directory.

### Step 2: Sync Capacitor with Android

Update the Android project with the latest web assets and configuration:

```bash
npx cap sync android
```

This copies web assets to `android/app/src/main/assets/public/`.

### Step 3: Open in Android Studio (Recommended)

Open the Android project in Android Studio for a full IDE experience:

```bash
npx cap open android
```

Or manually open:
- File → Open → Select `/home/ubuntu/familje-dashboard/android`

### Step 4: Build the APK

#### Option A: Using Android Studio (GUI)

1. Open Android Studio
2. Wait for Gradle sync to complete
3. Select **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
4. APK will be generated at: `android/app/build/outputs/apk/debug/app-debug.apk`

#### Option B: Using Command Line

**Debug APK** (for testing):

```bash
cd /home/ubuntu/familje-dashboard/android
./gradlew assembleDebug
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

**Release APK** (for distribution):

```bash
cd /home/ubuntu/familje-dashboard/android
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release-unsigned.apk`

> **Note:** Release APKs require signing with a keystore. See "Signing for Release" section below.

---

## Signing for Release

### Generate a Keystore

Create a signing key (one-time setup):

```bash
keytool -genkey -v -keystore familje-dashboard.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias familje-dashboard-key
```

You'll be prompted for:
- Keystore password
- Key password
- Organization details (Country, State, City, Organization, Name)

Save the keystore file securely. You'll need it for future releases.

### Sign the Release APK

```bash
cd /home/ubuntu/familje-dashboard/android

# Build release APK
./gradlew assembleRelease

# Sign the APK
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore ../familje-dashboard.keystore \
  app/build/outputs/apk/release/app-release-unsigned.apk \
  familje-dashboard-key

# Align the APK (optional but recommended)
zipalign -v 4 \
  app/build/outputs/apk/release/app-release-unsigned.apk \
  app/build/outputs/apk/release/app-release.apk
```

The final signed APK: `android/app/build/outputs/apk/release/app-release.apk`

---

## Testing the APK

### On Physical Device

1. **Enable Developer Mode:**
   - Settings → About Phone → Tap "Build Number" 7 times
   - Settings → Developer Options → Enable "USB Debugging"

2. **Connect via USB:**
   ```bash
   adb devices
   ```

3. **Install the APK:**
   ```bash
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```

4. **Launch the app:**
   - Find "Familje Dashboard" in your apps
   - Or use: `adb shell am start -n io.manus.familjedashboard/.MainActivity`

### On Android Emulator

1. **Start the emulator:**
   ```bash
   emulator -avd <emulator_name>
   ```

2. **Install the APK:**
   ```bash
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```

3. **View logs:**
   ```bash
   adb logcat | grep familjedashboard
   ```

---

## Troubleshooting

### Gradle Sync Fails

```bash
cd /home/ubuntu/familje-dashboard/android
./gradlew clean
./gradlew sync
```

### Build Fails with "SDK not found"

Ensure `ANDROID_SDK_ROOT` is set correctly:

```bash
echo $ANDROID_SDK_ROOT
# Should output your SDK path
```

### APK Installation Fails on Device

- Ensure app isn't already installed: `adb uninstall io.manus.familjedashboard`
- Check device has enough storage: `adb shell df /data`
- Verify USB debugging is enabled

### Camera/File Permissions Not Working

Permissions are declared in `android/app/src/main/AndroidManifest.xml`. For runtime permissions (Android 6+), the app requests them when needed via Capacitor.

---

## App Configuration

### App Icon

Replace the default icon:

```
android/app/src/main/res/mipmap-*/ic_launcher.png
android/app/src/main/res/mipmap-*/ic_launcher_round.png
```

Provide icons for all densities:
- `ldpi` (120 dpi)
- `mdpi` (160 dpi)
- `hdpi` (240 dpi)
- `xhdpi` (320 dpi)
- `xxhdpi` (480 dpi)
- `xxxhdpi` (640 dpi)

### Splash Screen

Customize the splash screen in `android/app/src/main/res/values/styles.xml`:

```xml
<style name="AppTheme.NoActionBarLaunch">
    <!-- Customize splash screen here -->
</style>
```

### App Name

Edit `android/app/src/main/res/values/strings.xml`:

```xml
<string name="app_name">Familje Dashboard</string>
```

---

## Continuous Integration

### GitHub Actions Example

```yaml
name: Build Android APK

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up JDK
        uses: actions/setup-java@v3
        with:
          java-version: '11'
          distribution: 'temurin'
      
      - name: Set up Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Build web assets
        run: |
          pnpm install
          pnpm run build
          cp dist/public/index.html dist/index.html
      
      - name: Sync Capacitor
        run: npx cap sync android
      
      - name: Build APK
        run: |
          cd android
          ./gradlew assembleDebug
      
      - name: Upload APK
        uses: actions/upload-artifact@v3
        with:
          name: app-debug.apk
          path: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Distribution

### Google Play Store

1. Create a Google Play Developer account ($25 one-time fee)
2. Create an app entry in Google Play Console
3. Sign the APK with your release keystore
4. Upload to Google Play Console
5. Fill in app details, screenshots, and description
6. Submit for review

### Direct Distribution

Share the signed APK directly via:
- Email
- Cloud storage (Google Drive, Dropbox)
- Website download link

Users can install via:
```bash
adb install app-release.apk
```

Or manually on device:
- Settings → Security → Enable "Unknown Sources"
- Open the APK file from file manager
- Tap "Install"

---

## Useful Commands

```bash
# List connected devices
adb devices

# Clear app data
adb shell pm clear io.manus.familjedashboard

# Uninstall app
adb uninstall io.manus.familjedashboard

# View app logs
adb logcat | grep familjedashboard

# Take a screenshot
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png

# List installed packages
adb shell pm list packages | grep familjedashboard
```

---

## Resources

- [Capacitor Android Documentation](https://capacitorjs.com/docs/android)
- [Android Developer Guide](https://developer.android.com/guide)
- [Android Studio Setup](https://developer.android.com/studio/install)
- [Google Play Console](https://play.google.com/console)

---

## Support

For issues:
1. Check the [Capacitor GitHub Issues](https://github.com/ionic-team/capacitor/issues)
2. Review [Android Logcat](https://developer.android.com/studio/debug/logcat) for error messages
3. Consult the [Capacitor Community Forum](https://forum.ionicframework.com/)

---

**Generated:** June 22, 2026  
**Project:** Familje Dashboard v1.0  
**Capacitor Version:** 8.4.1  
**Android SDK:** API 24-34
