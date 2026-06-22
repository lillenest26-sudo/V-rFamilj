# Google Play Store Release Configuration

## Overview

This guide provides step-by-step instructions for building and publishing Familje Dashboard to the Google Play Store.

## Prerequisites

- Android SDK installed (API 34+)
- Android Studio installed
- Gradle 8.0+
- Java 17 JDK
- Keystore file for signing (see "Creating a Keystore" section)

## Version Configuration

### Current Version Information

- **App Name**: Familje Dashboard
- **Package Name**: `com.familjedashboard.app`
- **Version Code**: 1 (increment for each release)
- **Version Name**: 1.0.0 (semantic versioning)
- **Minimum API Level**: 24 (Android 7.0)
- **Target API Level**: 34 (Android 14)

### Updating Version Numbers

Edit `android/app/build.gradle`:

```gradle
android {
    defaultConfig {
        versionCode 1      // Increment this for each release
        versionName "1.0.0" // Update for public releases
    }
}
```

## Creating a Keystore

A keystore is required to sign the release APK/AAB. Create it once and reuse for all future releases.

### Generate Keystore

```bash
keytool -genkey -v -keystore familje-dashboard-release.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias familje-dashboard-key
```

**Keystore Details to Provide**:
- **Keystore Password**: Create a strong password (save this!)
- **Key Password**: Same as keystore password or different
- **First and Last Name**: Your name or company name
- **Organizational Unit**: Your department/team
- **Organization**: Your company name
- **City/Locality**: Your city
- **State/Province**: Your state/province
- **Country Code**: Your country (2-letter code, e.g., SE for Sweden)

### Store Keystore Securely

```bash
# Move keystore to secure location
mv familje-dashboard-release.keystore ~/.android/

# Set restrictive permissions
chmod 600 ~/.android/familje-dashboard-release.keystore
```

**IMPORTANT**: Back up this keystore file securely. You'll need it for all future updates.

## Configuring Gradle for Signing

Edit `android/app/build.gradle` to add signing configuration:

```gradle
android {
    signingConfigs {
        release {
            storeFile file(System.getenv("KEYSTORE_PATH") ?: "/path/to/familje-dashboard-release.keystore")
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias System.getenv("KEY_ALIAS") ?: "familje-dashboard-key"
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

## Building Release APK

### Method 1: Using Gradle Command

```bash
cd android

# Set environment variables
export KEYSTORE_PATH="/home/ubuntu/.android/familje-dashboard-release.keystore"
export KEYSTORE_PASSWORD="your-keystore-password"
export KEY_PASSWORD="your-key-password"

# Build release APK
./gradlew assembleRelease

# Output: android/app/build/outputs/apk/release/app-release.apk
```

### Method 2: Using Android Studio

1. Open Android Studio
2. Open the `android` folder as a project
3. Go to **Build** → **Generate Signed Bundle / APK**
4. Select **APK** and click **Next**
5. Select or create your keystore
6. Enter keystore password and key password
7. Select **release** build variant
8. Click **Finish**

## Building Android App Bundle (AAB)

The App Bundle is the recommended format for Play Store submission.

### Using Gradle Command

```bash
cd android

# Set environment variables
export KEYSTORE_PATH="/home/ubuntu/.android/familje-dashboard-release.keystore"
export KEYSTORE_PASSWORD="your-keystore-password"
export KEY_PASSWORD="your-key-password"

# Build release AAB
./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

### Using Android Studio

1. Open Android Studio
2. Open the `android` folder as a project
3. Go to **Build** → **Generate Signed Bundle / APK**
4. Select **Android App Bundle** and click **Next**
5. Select or create your keystore
6. Enter keystore password and key password
7. Select **release** build variant
8. Click **Finish**

## Play Store Metadata

### App Information

- **App Name**: Familje Dashboard
- **Short Description**: Family management app for planning, budgeting, and coordination
- **Full Description**: A comprehensive family management platform for meal planning, budget tracking, task coordination, and family communication
- **Support Email**: support@familjedashboard.app
- **Privacy Policy URL**: https://famdashboard-namgh39r.manus.space/privacy
- **Terms of Service URL**: https://famdashboard-namgh39r.manus.space/terms

### Content Rating

- **Category**: Lifestyle
- **Content Rating**: Everyone (no mature content)

### Permissions

The app requests the following permissions:

- **CAMERA**: For taking photos in the app
- **READ_EXTERNAL_STORAGE**: For selecting images from device
- **WRITE_EXTERNAL_STORAGE**: For saving images
- **ACCESS_FINE_LOCATION**: For location-based weather
- **ACCESS_COARSE_LOCATION**: For location-based weather
- **POST_NOTIFICATIONS**: For push notifications

### Screenshots

Prepare the following screenshots for Play Store listing:

- **Phone Screenshots** (5-8 required):
  - Dashboard overview
  - Meal planning
  - Budget tracking
  - Family members
  - Calendar
  - Tasks
  - Shopping list
  - Diary

- **Tablet Screenshots** (2-8 optional):
  - Tablet dashboard view
  - Tablet layout showcase

### Graphics

- **Feature Graphic** (1024×500 px): Banner image for Play Store listing
- **Icon** (512×512 px): App icon for Play Store
- **Promo Graphic** (180×120 px): Optional promotional image

## Play Store Submission Checklist

- [ ] App name and description finalized
- [ ] Privacy policy page created and accessible
- [ ] Terms of service page created and accessible
- [ ] Support email configured
- [ ] App icon in all required sizes
- [ ] Adaptive icon configured
- [ ] Splash screen configured
- [ ] Screenshots prepared (5-8 for phones)
- [ ] Feature graphic prepared (1024×500 px)
- [ ] Content rating questionnaire completed
- [ ] Target audience identified
- [ ] Permissions reviewed and justified
- [ ] Version code and version name set
- [ ] AAB built and tested
- [ ] AAB file uploaded to Play Console
- [ ] Store listing preview reviewed
- [ ] Pricing set (free or paid)
- [ ] Distribution countries selected
- [ ] Release notes written

## Uploading to Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Create a new app or select existing app
3. Go to **Release** → **Production**
4. Click **Create new release**
5. Upload the AAB file (`app-release.aab`)
6. Add release notes
7. Review and confirm
8. Submit for review

## Post-Submission

- **Review Time**: 2-24 hours typically
- **Monitoring**: Check Play Console for any issues
- **Updates**: Use the same keystore for all future updates
- **Version Code**: Increment for each new release

## Troubleshooting

### Build Fails with "Keystore not found"

Ensure the keystore path is correct and the file exists:

```bash
ls -la ~/.android/familje-dashboard-release.keystore
```

### Build Fails with "Wrong password"

Verify keystore and key passwords are correct:

```bash
keytool -list -v -keystore ~/.android/familje-dashboard-release.keystore
```

### AAB Upload Fails

- Ensure version code is higher than previous release
- Verify app is signed with the same keystore
- Check that minimum API level is 21 or higher

### App Not Appearing in Play Store

- Check that app is approved (review status in Play Console)
- Verify app is not in beta/internal testing
- Ensure distribution countries include your location
- Check that app is not restricted by content rating

## References

- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [Android App Bundle Documentation](https://developer.android.com/guide/app-bundle)
- [Android Signing Documentation](https://developer.android.com/studio/publish/app-signing)
