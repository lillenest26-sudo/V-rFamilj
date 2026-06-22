#!/bin/bash

# Familje Dashboard — Quick APK Build Script
# This script automates the APK build process

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANDROID_DIR="$PROJECT_DIR/android"

echo "🚀 Familje Dashboard — APK Build Script"
echo "========================================"
echo ""

# Step 1: Build web assets
echo "📦 Step 1: Building web assets..."
cd "$PROJECT_DIR"
pnpm run build
cp dist/public/index.html dist/index.html
echo "✅ Web assets built successfully"
echo ""

# Step 2: Sync Capacitor
echo "🔄 Step 2: Syncing Capacitor with Android..."
npx cap sync android
echo "✅ Capacitor synced"
echo ""

# Step 3: Build APK
echo "🔨 Step 3: Building APK..."
cd "$ANDROID_DIR"

# Check for build type argument
BUILD_TYPE="${1:-debug}"

if [ "$BUILD_TYPE" = "debug" ]; then
    echo "Building DEBUG APK..."
    ./gradlew assembleDebug
    APK_PATH="$ANDROID_DIR/app/build/outputs/apk/debug/app-debug.apk"
elif [ "$BUILD_TYPE" = "release" ]; then
    echo "Building RELEASE APK..."
    ./gradlew assembleRelease
    APK_PATH="$ANDROID_DIR/app/build/outputs/apk/release/app-release-unsigned.apk"
else
    echo "❌ Invalid build type: $BUILD_TYPE"
    echo "Usage: ./scripts/build-apk.sh [debug|release]"
    exit 1
fi

echo ""
echo "✅ APK built successfully!"
echo ""
echo "📱 APK Location:"
echo "   $APK_PATH"
echo ""
echo "📋 Next steps:"
echo "   1. To install on device: adb install $APK_PATH"
echo "   2. To test on emulator: adb install $APK_PATH"
echo "   3. For release, sign the APK with your keystore"
echo ""
