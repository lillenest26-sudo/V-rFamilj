# Familje Dashboard — Capacitor Plugins Guide

This document explains how to use Capacitor plugins for native Android features like Camera, File Upload, Geolocation, and Notifications.

---

## Installed Plugins

The following Capacitor plugins are available and configured:

| Plugin | Purpose | Permissions |
|--------|---------|-------------|
| **Camera** | Take photos and access gallery | `camera`, `photos` |
| **Geolocation** | Access device GPS | `location` |
| **LocalNotifications** | Send push notifications | `notification` |
| **Filesystem** | Read/write device files | `storage` |

---

## Camera Plugin

### Installation

Already included. To add manually:

```bash
npm install @capacitor/camera
npx cap sync android
```

### Usage in React

```tsx
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

async function takePhoto() {
  const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: true,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Camera, // or CameraSource.Photos
  });
  
  console.log('Photo:', image.dataUrl);
  return image.dataUrl;
}
```

### ImageUploadField Integration

The `ImageUploadField` component already supports camera capture. To enhance it:

```tsx
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

// In ImageUploadField.tsx
const handleCameraCapture = async () => {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
    });
    
    setPreview(image.dataUrl);
    onChange(image.dataUrl);
    setMode(null);
  } catch (error) {
    console.error('Camera error:', error);
  }
};
```

---

## Geolocation Plugin

### Installation

```bash
npm install @capacitor/geolocation
npx cap sync android
```

### Usage in React

```tsx
import { Geolocation } from '@capacitor/geolocation';

async function getCurrentLocation() {
  const coordinates = await Geolocation.getCurrentPosition();
  console.log('Latitude:', coordinates.coords.latitude);
  console.log('Longitude:', coordinates.coords.longitude);
  return coordinates;
}

// Watch location changes
const watchId = await Geolocation.watchPosition(
  {},
  (position) => {
    console.log('New position:', position);
  }
);

// Stop watching
await Geolocation.clearWatch({ id: watchId });
```

### Dashboard Integration

The Dashboard already uses `useGeoLocation()` hook for weather. The hook automatically requests permissions.

---

## Local Notifications Plugin

### Installation

```bash
npm install @capacitor/local-notifications
npx cap sync android
```

### Usage in React

```tsx
import { LocalNotifications } from '@capacitor/local-notifications';

async function sendNotification() {
  await LocalNotifications.requestPermissions();
  
  await LocalNotifications.schedule({
    notifications: [
      {
        title: 'Familje Dashboard',
        body: 'Din påminnelse är här!',
        id: 1,
        schedule: { at: new Date(Date.now() + 1000 * 60 * 5) }, // 5 min from now
        smallIcon: 'ic_stat_icon_config_sample',
        iconColor: '#488AFF',
      },
    ],
  });
}

// Listen for notification clicks
LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
  console.log('Notification clicked:', notification);
});
```

---

## Filesystem Plugin

### Installation

```bash
npm install @capacitor/filesystem
npx cap sync android
```

### Usage in React

```tsx
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

// Write file
async function writeFile() {
  const result = await Filesystem.writeFile({
    path: 'myfile.txt',
    data: 'Hello, World!',
    directory: Directory.Documents,
    encoding: Encoding.UTF8,
  });
  console.log('File written:', result);
}

// Read file
async function readFile() {
  const contents = await Filesystem.readFile({
    path: 'myfile.txt',
    directory: Directory.Documents,
    encoding: Encoding.UTF8,
  });
  console.log('File contents:', contents.data);
}
```

---

## Permissions

### Android Manifest

Permissions are declared in `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

### Runtime Permissions

For Android 6+ (API 23+), request permissions at runtime:

```tsx
import { Camera } from '@capacitor/camera';

async function requestCameraPermission() {
  const result = await Camera.requestPermissions();
  console.log('Permission result:', result);
  return result.camera === 'granted';
}
```

---

## Best Practices

### 1. Check Platform

```tsx
import { Capacitor } from '@capacitor/core';

if (Capacitor.isNativePlatform()) {
  // Use native plugins
} else {
  // Use web fallbacks
}
```

### 2. Error Handling

```tsx
try {
  const image = await Camera.getPhoto({...});
} catch (error) {
  if (error.message === 'User cancelled photos app') {
    console.log('User cancelled');
  } else {
    console.error('Camera error:', error);
  }
}
```

### 3. Permissions Check

```tsx
import { Camera } from '@capacitor/camera';

async function checkCameraPermission() {
  const result = await Camera.checkPermissions();
  if (result.camera !== 'granted') {
    await Camera.requestPermissions();
  }
}
```

### 4. Performance

- Use `allowEditing: false` for faster camera capture
- Compress images before uploading
- Use `DataUrl` for small images, `Uri` for large files

---

## Troubleshooting

### Camera Not Working

1. Check permissions in `AndroidManifest.xml`
2. Verify device has camera: `adb shell getprop ro.hardware.camera`
3. Check app logs: `adb logcat | grep Camera`

### Geolocation Timeout

1. Ensure location services are enabled on device
2. Use `timeout: 10000` for longer wait
3. Check GPS signal strength

### Notifications Not Showing

1. Verify `POST_NOTIFICATIONS` permission
2. Check notification channel settings
3. Ensure app is not in Do Not Disturb mode

---

## Advanced: Custom Capacitor Plugin

To create a custom plugin:

```bash
npm install -g @capacitor/create-plugin
capacitor-create-plugin
```

Then add to `capacitor.config.ts`:

```ts
plugins: {
  MyCustomPlugin: {
    // Configuration
  },
}
```

---

## Resources

- [Capacitor Plugins](https://capacitorjs.com/docs/plugins)
- [Camera Plugin Docs](https://capacitorjs.com/docs/apis/camera)
- [Geolocation Plugin Docs](https://capacitorjs.com/docs/apis/geolocation)
- [Local Notifications Docs](https://capacitorjs.com/docs/apis/local-notifications)
- [Filesystem Plugin Docs](https://capacitorjs.com/docs/apis/filesystem)

---

**Generated:** June 22, 2026  
**Project:** Familje Dashboard v1.0  
**Capacitor Version:** 8.4.1
