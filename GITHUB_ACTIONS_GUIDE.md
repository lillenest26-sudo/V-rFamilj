# GitHub Actions APK Build & Download Guide

## Overview

The Familje Dashboard project is now configured with automated APK building via GitHub Actions. Every push to the `main` or `develop` branch will automatically trigger the build workflow.

## Build Workflow Details

**Workflow File:** `.github/workflows/build-apk.yml`

**Triggers:**
- Push to `main` branch
- Push to `develop` branch
- Pull requests to `main` branch

**Build Steps:**
1. Checkout code
2. Set up Node.js 22
3. Install pnpm
4. Install dependencies
5. Build web app
6. Set up Java 17
7. Set up Android SDK
8. Sync Capacitor assets
9. Build debug APK
10. Upload APK artifact (30-day retention)
11. Build release APK (if tagged)
12. Build AAB for Play Store (if tagged with `v*`)

## Monitoring the Build

### Step 1: Navigate to GitHub Actions

1. Go to your repository: https://github.com/lillenest26-sudo/V-rFamilj
2. Click the **Actions** tab
3. You'll see the "Build Android APK" workflow listed

### Step 2: View Build Status

- **In Progress:** Yellow circle with spinning icon
- **Success:** Green checkmark ✅
- **Failed:** Red X ❌

### Step 3: Access Build Artifacts

Once the build completes successfully:

1. Click on the workflow run (shows the commit message)
2. Scroll down to the **Artifacts** section
3. Download the APK:
   - **Debug APK:** `app-debug` (for testing)
   - **Release APK:** `app-release` (if tagged)
   - **App Bundle:** `app-bundle` (for Play Store)

## Downloading the APK

### From GitHub Web Interface

1. Open the workflow run
2. Scroll to **Artifacts**
3. Click **app-debug** to download the APK
4. The file will download as `app-debug.zip`
5. Extract the ZIP to get `app-debug.apk`

### From Command Line (GitHub CLI)

```bash
# List recent workflow runs
gh run list --repo lillenest26-sudo/V-rFamilj

# Download artifacts from a specific run
gh run download <RUN_ID> --repo lillenest26-sudo/V-rFamilj --name app-debug
```

## Installing the APK on Android Device

### Prerequisites

- Android device with USB debugging enabled
- Android SDK Platform Tools installed
- USB cable

### Installation Steps

#### Option 1: Using ADB (Recommended)

```bash
# Connect device via USB
adb devices

# Install the APK
adb install app-debug.apk

# Launch the app
adb shell am start -n com.familjedashboard.app/.MainActivity
```

#### Option 2: Direct Installation

1. Copy `app-debug.apk` to your Android device
2. Open a file manager on the device
3. Navigate to the APK file
4. Tap to install
5. Allow installation from unknown sources if prompted

#### Option 3: Using Android Studio

1. Open Android Studio
2. Go to **Device Manager**
3. Select your device
4. Drag and drop the APK onto the device window

## Testing the APK

### Pre-Testing Checklist

- [ ] Device has internet connection
- [ ] Device has sufficient storage (at least 100 MB)
- [ ] Device is running Android 7.0+ (API 24+)
- [ ] Device has camera and storage permissions enabled

### Key Features to Test

1. **Dashboard**
   - [ ] All widgets load correctly
   - [ ] Pull-to-refresh works
   - [ ] Weather displays correctly
   - [ ] Meal card shows current meal

2. **Meal Plan**
   - [ ] Weekly grid displays meals
   - [ ] Can add new meal with image
   - [ ] Image upload from device works
   - [ ] Image upload from URL works
   - [ ] Camera capture works (Capacitor)

3. **Calendar**
   - [ ] Month view displays events
   - [ ] Can add event with image
   - [ ] Pull-to-refresh works
   - [ ] Event details show correctly

4. **Family Members**
   - [ ] Profile images display
   - [ ] Can add new member with photo
   - [ ] Camera capture works

5. **Shopping List**
   - [ ] Two-section layout works
   - [ ] Can add items with images
   - [ ] Items move between sections

6. **Offline Support**
   - [ ] Service worker caches content
   - [ ] Can view cached pages offline
   - [ ] Data syncs when online

7. **Language Support**
   - [ ] Swedish locale works
   - [ ] Somali locale works
   - [ ] Language switching works

8. **Mobile UX**
   - [ ] Layout is responsive
   - [ ] Touch gestures work
   - [ ] No console errors
   - [ ] Performance is acceptable

### Reporting Issues

If you find any issues:

1. Note the exact steps to reproduce
2. Check the browser console for errors
3. Take a screenshot
4. Create a GitHub Issue with:
   - Device model and Android version
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots/videos if applicable

## Building Releases

### Debug APK (Automatic)

- Built on every push to `main` or `develop`
- Suitable for testing
- Signed with debug key
- Expires after 30 days in artifacts

### Release APK (Manual)

To trigger a release build:

```bash
# Tag a release
git tag v1.0.0
git push origin v1.0.0
```

This will:
- Build release APK (signed with release key)
- Build App Bundle (AAB) for Play Store
- Keep artifacts for 90 days

### Signing Release Builds

**Important:** Before building releases, configure signing keys in GitHub Secrets:

1. Generate a keystore (if not already done):
   ```bash
   keytool -genkey -v -keystore familje-dashboard.keystore \
     -keyalg RSA -keysize 2048 -validity 10000 \
     -alias familje-dashboard
   ```

2. Encode the keystore:
   ```bash
   base64 familje-dashboard.keystore | pbcopy
   ```

3. Add to GitHub Secrets:
   - Go to Settings → Secrets and variables → Actions
   - Add `KEYSTORE_FILE` with the base64-encoded keystore
   - Add `KEYSTORE_PASSWORD`
   - Add `KEY_ALIAS`
   - Add `KEY_PASSWORD`

4. Update the workflow to use these secrets (see `.github/workflows/build-apk.yml`)

## Troubleshooting

### Build Fails with "Node modules not found"

**Solution:** The workflow installs dependencies automatically. If this fails:
- Check that `pnpm-lock.yaml` is committed
- Ensure no circular dependencies in `package.json`

### Build Fails with "Java not found"

**Solution:** The workflow sets up Java 17 automatically. If this fails:
- Check GitHub Actions logs for details
- Verify the Android SDK setup step completed

### Build Fails with "Gradle build error"

**Solution:** Common causes:
- Missing Android SDK components
- Incompatible Gradle version
- Missing native dependencies

**Debug:**
1. Check the full error in the workflow logs
2. Run the build locally to reproduce
3. Update `android/gradle.properties` if needed

### APK Installation Fails

**Solution:** Common causes:
- App already installed (uninstall first: `adb uninstall com.familjedashboard.app`)
- Insufficient storage
- Device running older Android version
- Corrupted APK file

## Next Steps

1. **Monitor the build** on GitHub Actions
2. **Download the APK** once complete
3. **Test on your device** using the checklist above
4. **Report any issues** via GitHub Issues
5. **Prepare for Play Store** using the PLAYSTORE_SUBMISSION_SUMMARY.md guide

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Android Debug Bridge (ADB) Guide](https://developer.android.com/studio/command-line/adb)
- [Google Play Console](https://play.google.com/console)
- [Capacitor Documentation](https://capacitorjs.com/)

## Support

For questions or issues:
1. Check the troubleshooting section above
2. Review GitHub Actions logs
3. Check the project documentation
4. Create a GitHub Issue with detailed information
