# Android App Bundle (AAB) Build Guide

## What is an App Bundle?

An Android App Bundle (AAB) is the modern publishing format for Google Play Store. It's smaller than APK, supports dynamic feature delivery, and Google Play automatically generates optimized APKs for each device configuration.

**Benefits of AAB**:
- Smaller file size (30-50% smaller than universal APK)
- Automatic optimization for each device
- Dynamic feature delivery
- Required for new apps on Play Store
- Better user experience

## Prerequisites

Before building an AAB, ensure you have:

1. **Android SDK** installed with API 34
2. **Android Studio** (recommended)
3. **Java 17 JDK** or higher
4. **Gradle 8.0** or higher
5. **Keystore file** for signing (see PLAYSTORE_RELEASE.md)
6. **Web build** completed (`pnpm build`)

## Step 1: Prepare Web Build

```bash
cd /home/ubuntu/familje-dashboard

# Build the web application
pnpm build

# Verify dist folder exists and contains index.html
ls -la dist/
```

## Step 2: Sync Web Assets to Android

```bash
# Copy web build to Android assets
cp -r dist/* android/app/src/main/assets/www/

# Verify files copied
ls -la android/app/src/main/assets/www/
```

## Step 3: Update Version Information

Edit `android/app/build.gradle`:

```gradle
android {
    defaultConfig {
        versionCode 1      // Increment for each release
        versionName "1.0.0" // Update for public releases
    }
}
```

## Step 4: Build Release AAB

### Method 1: Using Gradle Command

```bash
cd /home/ubuntu/familje-dashboard/android

# Set environment variables with your keystore credentials
export KEYSTORE_PATH="/home/ubuntu/.android/familje-dashboard-release.keystore"
export KEYSTORE_PASSWORD="your-keystore-password"
export KEY_PASSWORD="your-key-password"

# Clean previous builds
./gradlew clean

# Build release AAB
./gradlew bundleRelease

# Output location
echo "AAB file: android/app/build/outputs/bundle/release/app-release.aab"
```

### Method 2: Using Android Studio

1. Open Android Studio
2. Open the `android` folder as a project
3. Wait for Gradle sync to complete
4. Go to **Build** → **Generate Signed Bundle / APK**
5. Select **Android App Bundle** and click **Next**
6. Select or create your keystore:
   - **Keystore path**: `/home/ubuntu/.android/familje-dashboard-release.keystore`
   - **Keystore password**: Enter your password
   - **Key alias**: `familje-dashboard-key`
   - **Key password**: Enter your password
7. Select **release** build variant
8. Click **Finish**
9. Wait for build to complete

## Step 5: Verify AAB Build

```bash
# Check if AAB was created
ls -lh android/app/build/outputs/bundle/release/app-release.aab

# Verify AAB file size (should be 20-50 MB)
du -h android/app/build/outputs/bundle/release/app-release.aab

# List contents of AAB
unzip -l android/app/build/outputs/bundle/release/app-release.aab | head -20
```

## Step 6: Test AAB Locally (Optional)

### Using bundletool

```bash
# Download bundletool
wget https://github.com/google/bundletool/releases/latest/download/bundletool-all.jar

# Generate APKs from AAB
java -jar bundletool-all.jar build-apks \
  --bundle=android/app/build/outputs/bundle/release/app-release.aab \
  --output=app.apks \
  --ks=/home/ubuntu/.android/familje-dashboard-release.keystore \
  --ks-pass=pass:your-keystore-password \
  --ks-key-alias=familje-dashboard-key \
  --key-pass=pass:your-key-password

# Install on connected device
java -jar bundletool-all.jar install-apks --apks=app.apks
```

## Step 7: Upload to Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app
3. Go to **Release** → **Production**
4. Click **Create new release**
5. Click **Browse files** and select your AAB file
6. Add release notes
7. Review app details
8. Click **Review release**
9. Click **Start rollout to Production**

## Troubleshooting

### Build Fails: "Keystore not found"

```bash
# Verify keystore exists
ls -la ~/.android/familje-dashboard-release.keystore

# Create new keystore if needed
keytool -genkey -v -keystore ~/.android/familje-dashboard-release.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias familje-dashboard-key
```

### Build Fails: "Wrong password"

```bash
# Verify keystore password
keytool -list -v -keystore ~/.android/familje-dashboard-release.keystore

# Try with escaped special characters
export KEYSTORE_PASSWORD="your-password-with-special-chars"
```

### Build Fails: "Version code must be higher"

```bash
# Check current version code
grep versionCode android/app/build.gradle

# Increment version code
# Edit android/app/build.gradle and increase versionCode
```

### AAB File Too Large

```bash
# Enable minification and resource shrinking
# Edit android/app/build.gradle:

buildTypes {
    release {
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

### Upload Fails: "Invalid AAB"

- Ensure AAB is signed with the same keystore as previous releases
- Verify version code is higher than previous release
- Check that minimum API level is 21 or higher
- Ensure target API level is 34 or higher

## Automated Build Script

Create `scripts/build-aab.sh`:

```bash
#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Familje Dashboard AAB Build Script${NC}"
echo "======================================"

# Check prerequisites
if [ ! -f ~/.android/familje-dashboard-release.keystore ]; then
    echo -e "${RED}Error: Keystore not found at ~/.android/familje-dashboard-release.keystore${NC}"
    exit 1
fi

if [ -z "$KEYSTORE_PASSWORD" ]; then
    echo -e "${RED}Error: KEYSTORE_PASSWORD environment variable not set${NC}"
    exit 1
fi

if [ -z "$KEY_PASSWORD" ]; then
    echo -e "${RED}Error: KEY_PASSWORD environment variable not set${NC}"
    exit 1
fi

# Build web
echo -e "${YELLOW}Building web application...${NC}"
cd /home/ubuntu/familje-dashboard
pnpm build

# Sync to Android
echo -e "${YELLOW}Syncing web assets to Android...${NC}"
cp -r dist/* android/app/src/main/assets/www/

# Build AAB
echo -e "${YELLOW}Building Android App Bundle...${NC}"
cd android
./gradlew clean bundleRelease

# Verify
echo -e "${YELLOW}Verifying AAB...${NC}"
if [ -f app/build/outputs/bundle/release/app-release.aab ]; then
    SIZE=$(du -h app/build/outputs/bundle/release/app-release.aab | cut -f1)
    echo -e "${GREEN}✓ AAB built successfully (Size: $SIZE)${NC}"
    echo -e "${GREEN}Location: android/app/build/outputs/bundle/release/app-release.aab${NC}"
else
    echo -e "${RED}✗ AAB build failed${NC}"
    exit 1
fi

echo -e "${GREEN}======================================"
echo "Build complete! Ready for Play Store upload."
echo "=====================================${NC}"
```

Make executable:

```bash
chmod +x scripts/build-aab.sh
```

Run build:

```bash
export KEYSTORE_PASSWORD="your-password"
export KEY_PASSWORD="your-password"
./scripts/build-aab.sh
```

## Version Management

### Incrementing Versions

**For bug fixes**:
```gradle
versionCode 2
versionName "1.0.1"
```

**For minor features**:
```gradle
versionCode 3
versionName "1.1.0"
```

**For major updates**:
```gradle
versionCode 4
versionName "2.0.0"
```

## Best Practices

1. **Always increment version code** - Never reuse a version code
2. **Use semantic versioning** - MAJOR.MINOR.PATCH format
3. **Test before upload** - Test AAB locally with bundletool
4. **Keep keystore safe** - Back up and secure your keystore
5. **Document changes** - Write clear release notes
6. **Monitor reviews** - Check Play Console for user feedback
7. **Plan updates** - Release updates regularly with improvements

## References

- [Android App Bundle Documentation](https://developer.android.com/guide/app-bundle)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [Bundletool Documentation](https://developer.android.com/studio/command-line/bundletool)
- [Android Signing Documentation](https://developer.android.com/studio/publish/app-signing)
