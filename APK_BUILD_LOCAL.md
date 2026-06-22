# Building Familje Dashboard APK on Your Local Machine

## Overview

The Familje Dashboard Android project is fully configured and ready to build. Since the Android SDK is not available in the sandbox environment, you'll need to build the APK on your local machine using Android Studio or command-line tools.

**What's Included**:
- ✅ Complete web application (built and optimized)
- ✅ Capacitor Android project fully configured
- ✅ All native permissions configured
- ✅ App icons for all densities
- ✅ Splash screen configured
- ✅ Release signing configuration

**Build Time**: ~5-10 minutes on a typical machine

---

## Prerequisites

### 1. Install Android Studio

Download from: https://developer.android.com/studio

**Minimum Requirements**:
- Android SDK Platform 34 (Android 14)
- Android SDK Tools
- Android Emulator (optional, for testing)
- Java 17 JDK (included with Android Studio)

### 2. Verify Installation

```bash
# Check Android SDK is installed
echo $ANDROID_HOME

# Should output something like:
# /Users/username/Library/Android/sdk (macOS)
# C:\Users\username\AppData\Local\Android\sdk (Windows)
# /home/username/Android/sdk (Linux)

# If not set, add to your shell profile:
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

### 3. Accept Android Licenses

```bash
yes | $ANDROID_HOME/tools/bin/sdkmanager --licenses
```

---

## Method 1: Build Using Android Studio (Recommended for First-Time)

### Step 1: Open Project

1. Launch Android Studio
2. Click **File** → **Open**
3. Navigate to `/path/to/familje-dashboard/android`
4. Click **Open**
5. Wait for Gradle sync to complete (2-5 minutes)

### Step 2: Build Debug APK

1. Go to **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Wait for build to complete
3. A notification will appear: "Build successful"
4. Click **locate** in the notification

### Step 3: Find Your APK

The debug APK will be at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Step 4: Install on Device

**Via Android Studio**:
1. Connect Android device via USB
2. Enable USB Debugging on device
3. Go to **Run** → **Run 'app'**
4. Select your device
5. Click **OK**

**Via Command Line**:
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Method 2: Build Using Command Line

### Step 1: Navigate to Project

```bash
cd /path/to/familje-dashboard/android
```

### Step 2: Clean Previous Builds

```bash
./gradlew clean
```

### Step 3: Build Debug APK

```bash
./gradlew assembleDebug
```

**Output**:
```
BUILD SUCCESSFUL in 2m 15s
```

### Step 4: Locate APK

```bash
ls -lh app/build/outputs/apk/debug/app-debug.apk
```

### Step 5: Install on Device

```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

---

## Method 3: Build Release APK (For Testing Before Play Store)

### Step 1: Create Keystore (One-time)

```bash
keytool -genkey -v -keystore ~/.android/familje-dashboard-release.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias familje-dashboard-key \
  -keypass your-key-password \
  -storepass your-keystore-password
```

**Remember your passwords!** You'll need them for Play Store submissions.

### Step 2: Build Release APK

```bash
cd /path/to/familje-dashboard/android

./gradlew assembleRelease \
  -Pandroid.injected.signing.store.file=$HOME/.android/familje-dashboard-release.keystore \
  -Pandroid.injected.signing.store.password=your-keystore-password \
  -Pandroid.injected.signing.key.alias=familje-dashboard-key \
  -Pandroid.injected.signing.key.password=your-key-password
```

### Step 3: Find Release APK

```bash
ls -lh app/build/outputs/apk/release/app-release.apk
```

---

## Troubleshooting

### Error: "SDK location not found"

**Solution**: Set ANDROID_HOME environment variable

```bash
# macOS/Linux
export ANDROID_HOME=$HOME/Library/Android/sdk

# Windows (PowerShell)
$env:ANDROID_HOME = "C:\Users\YourUsername\AppData\Local\Android\sdk"

# Add to shell profile for persistence
# macOS/Linux: ~/.zshrc or ~/.bash_profile
# Windows: System Environment Variables
```

### Error: "Could not find gradle"

**Solution**: Use the included gradle wrapper

```bash
# Instead of: gradle assembleDebug
# Use: ./gradlew assembleDebug (macOS/Linux)
# Use: gradlew.bat assembleDebug (Windows)
```

### Error: "Gradle sync failed"

**Solution**: 
1. In Android Studio: **File** → **Invalidate Caches / Restart**
2. Click **Invalidate and Restart**
3. Wait for Gradle sync to complete

### Error: "No connected devices"

**Solution**: Enable USB Debugging on your Android device

1. Go to **Settings** → **About Phone**
2. Tap **Build Number** 7 times
3. Go back to **Settings** → **Developer Options**
4. Enable **USB Debugging**
5. Connect device via USB
6. Allow USB Debugging when prompted

### Build Takes Too Long

**Solution**: Increase Gradle memory

Create or edit `gradle.properties`:

```properties
org.gradle.jvmargs=-Xmx4096m
```

---

## Installing APK on Device

### Method 1: Using Android Studio

1. Connect device via USB
2. **Run** → **Run 'app'**
3. Select device
4. Click **OK**

### Method 2: Using ADB Command

```bash
# Install
adb install app/build/outputs/apk/debug/app-debug.apk

# Uninstall (if already installed)
adb uninstall com.familjedashboard.app

# Reinstall
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### Method 3: Manual Installation

1. Copy APK to device
2. Open file manager on device
3. Navigate to APK file
4. Tap to install
5. Grant permissions when prompted

---

## Testing the App

### Features to Test

- [ ] **Login**: Sign in with your Manus account
- [ ] **Dashboard**: View all widgets and data
- [ ] **Meal Plan**: Create a meal with image (device/camera/URL)
- [ ] **Shopping List**: Add items and mark as done
- [ ] **Family Members**: Add family member with photo
- [ ] **Calendar**: Create event with image
- [ ] **Tasks**: Create task with image
- [ ] **Budget**: Add income/expense with receipt image
- [ ] **Reminders**: Create reminder with notification
- [ ] **Diary**: Write entry with mood and image
- [ ] **Camera Access**: Take photo from app
- [ ] **Image Upload**: Upload from device gallery
- [ ] **Image URL**: Add image via URL
- [ ] **Notifications**: Receive test notifications
- [ ] **Offline Mode**: Use app without internet
- [ ] **Theme**: Switch between dark/light theme
- [ ] **Language**: Switch between Swedish/Somali

### Reporting Issues

If you find any issues:

1. Note the exact steps to reproduce
2. Take screenshots
3. Check device logs: `adb logcat`
4. Report with: device model, Android version, app version

---

## APK File Information

**Debug APK**:
- **Location**: `android/app/build/outputs/apk/debug/app-debug.apk`
- **Size**: ~50-70 MB
- **Version**: 1.0.0 (Code: 1)
- **Signing**: Debug key (auto-generated)
- **Purpose**: Testing and development

**Release APK**:
- **Location**: `android/app/build/outputs/apk/release/app-release.apk`
- **Size**: ~40-60 MB (smaller due to minification)
- **Version**: 1.0.0 (Code: 1)
- **Signing**: Your release keystore
- **Purpose**: Play Store submission

---

## Next Steps After Testing

1. **Test all features** on your device
2. **Report any issues** you find
3. **Verify image uploads** work correctly
4. **Test camera access** on your device
5. **Check notifications** are working
6. **Verify offline functionality**
7. **Once satisfied**, proceed to Play Store submission

---

## Building AAB for Play Store

After successful APK testing, build the App Bundle (AAB) for Play Store:

```bash
cd /path/to/familje-dashboard/android

./gradlew bundleRelease \
  -Pandroid.injected.signing.store.file=$HOME/.android/familje-dashboard-release.keystore \
  -Pandroid.injected.signing.store.password=your-keystore-password \
  -Pandroid.injected.signing.key.alias=familje-dashboard-key \
  -Pandroid.injected.signing.key.password=your-key-password
```

**Output**: `android/app/build/outputs/bundle/release/app-release.aab`

---

## Quick Reference

| Task | Command |
|------|---------|
| Build Debug APK | `./gradlew assembleDebug` |
| Build Release APK | `./gradlew assembleRelease` |
| Build AAB | `./gradlew bundleRelease` |
| Clean Build | `./gradlew clean` |
| Install APK | `adb install app-debug.apk` |
| Uninstall App | `adb uninstall com.familjedashboard.app` |
| View Logs | `adb logcat` |
| List Devices | `adb devices` |

---

## Support Resources

- **Android Studio Help**: https://developer.android.com/studio/intro
- **Gradle Documentation**: https://gradle.org/
- **Capacitor Documentation**: https://capacitorjs.com/docs/android
- **Android Development**: https://developer.android.com/

---

**Ready to build?** Follow Method 1 (Android Studio) for the easiest experience!
