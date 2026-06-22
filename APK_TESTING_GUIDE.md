# Familje Dashboard APK Testing Guide

## Version Information

- **App Name**: Familje Dashboard
- **Package Name**: com.familjedashboard.app
- **Version**: 1.0.0
- **Version Code**: 1
- **Minimum Android**: 7.0 (API 24)
- **Target Android**: 14 (API 34)
- **Build Date**: June 22, 2026

---

## Pre-Testing Setup

### Device Requirements

- **Android Phone or Tablet**: Android 7.0 or higher
- **Internet Connection**: For initial login and data sync
- **Storage Space**: ~100 MB free space
- **Camera**: For testing photo capture feature
- **Permissions**: Allow camera, location, storage, notifications

### Installation Steps

1. **Download APK** from your build output
2. **Transfer to Device**: Via USB or email
3. **Enable Installation**: Settings → Security → Unknown Sources
4. **Install**: Tap APK file and follow prompts
5. **Grant Permissions**: Allow all requested permissions
6. **Launch**: Tap "Familje Dashboard" app icon

---

## Testing Checklist

### Phase 1: Basic Functionality (10 minutes)

- [ ] **App Launches**: App opens without crashing
- [ ] **Login Works**: Can sign in with Manus account
- [ ] **Dashboard Loads**: All widgets display correctly
- [ ] **Navigation**: Sidebar menu works smoothly
- [ ] **Theme**: Dark theme displays correctly
- [ ] **Language**: Swedish language loads correctly

**Expected Result**: App fully functional with no crashes

---

### Phase 2: Meal Planning (15 minutes)

#### Test 1: Create Meal with Device Image
1. Go to **Matplan** (Meal Plan)
2. Click **+ Lägg till** (Add)
3. Enter meal name: "Test Breakfast"
4. Select type: **Frukost** (Breakfast)
5. Enter description: "Test meal"
6. Click **Upload Image**
7. Select **Device Upload**
8. Choose image from gallery
9. Verify image preview appears
10. Click **Save**

**Expected Result**: Meal created with image visible in calendar

#### Test 2: Create Meal with Camera
1. Click **+ Lägg till** (Add)
2. Enter meal name: "Test Lunch"
3. Select type: **Lunch**
4. Click **Upload Image**
5. Select **Camera**
6. Take photo
7. Confirm photo
8. Verify image preview
9. Click **Save**

**Expected Result**: Meal created with camera photo

#### Test 3: Create Meal with URL
1. Click **+ Lägg till** (Add)
2. Enter meal name: "Test Dinner"
3. Select type: **Middag** (Dinner)
4. Click **Upload Image**
5. Select **Add URL**
6. Paste image URL: `https://via.placeholder.com/300`
7. Verify image loads
8. Click **Save**

**Expected Result**: Meal created with URL image

#### Test 4: Verify Display
1. Check meal cards show images
2. Verify images display in week grid
3. Check dashboard shows meal images
4. Verify all three meals appear correctly

**Expected Result**: All meal images visible in calendar and dashboard

---

### Phase 3: Shopping List (10 minutes)

- [ ] **Add Item**: Create shopping list item
- [ ] **Add Image**: Upload image for item
- [ ] **Mark Done**: Check off purchased items
- [ ] **Categories**: Items organized by category
- [ ] **Clear Done**: Remove completed items
- [ ] **Persistence**: Items saved after app restart

**Expected Result**: Shopping list fully functional with images

---

### Phase 4: Family Members (15 minutes)

#### Test 1: Add Family Member with Device Photo
1. Go to **Familj** (Family)
2. Click **+ Lägg till** (Add)
3. Enter name: "Test Parent"
4. Select role: **Parent**
5. Click **Upload Image**
6. Select **Device Upload**
7. Choose photo from gallery
8. Verify preview
9. Click **Save**

**Expected Result**: Family member created with photo

#### Test 2: Add Family Member with Camera
1. Click **+ Lägg till** (Add)
2. Enter name: "Test Child"
3. Select role: **Child**
4. Click **Upload Image**
5. Select **Camera**
6. Take selfie
7. Confirm photo
8. Click **Save**

**Expected Result**: Family member created with camera photo

#### Test 3: Verify Display
1. Check member cards show photos
2. Verify no emoji avatars (only real photos)
3. Verify member info displays correctly
4. Check photos persist after app restart

**Expected Result**: All family member photos display correctly

---

### Phase 5: Calendar Events (10 minutes)

- [ ] **Create Event**: Add calendar event
- [ ] **Add Image**: Upload event image
- [ ] **Set Date**: Event appears on correct date
- [ ] **Set Reminder**: Notification reminder works
- [ ] **Edit Event**: Modify event details
- [ ] **Delete Event**: Remove event

**Expected Result**: Calendar fully functional with images

---

### Phase 6: Tasks (10 minutes)

- [ ] **Create Task**: Add new task
- [ ] **Add Image**: Upload task image
- [ ] **Set Priority**: Assign priority level
- [ ] **Assign Member**: Assign to family member
- [ ] **Mark Complete**: Check off task
- [ ] **Delete Task**: Remove task

**Expected Result**: Tasks functional with image support

---

### Phase 7: Budget (15 minutes)

#### Test 1: Add Income with Receipt
1. Go to **Budget**
2. Click **+ Lägg till inkomst** (Add Income)
3. Enter amount: 1000
4. Enter description: "Monthly salary"
5. Click **Upload Image**
6. Upload receipt/document image
7. Click **Save**

**Expected Result**: Income recorded with image

#### Test 2: Add Expense with Receipt
1. Click **+ Lägg till utgift** (Add Expense)
2. Enter amount: 50
3. Select category: **Groceries**
4. Enter description: "Weekly shopping"
5. Upload receipt image
6. Click **Save**

**Expected Result**: Expense recorded with image

#### Test 3: Verify Display
1. Check income/expense list shows images
2. Verify totals calculate correctly
3. Check charts display data
4. Verify images persist

**Expected Result**: Budget tracking fully functional

---

### Phase 8: Camera & Permissions (10 minutes)

- [ ] **Camera Access**: App can access device camera
- [ ] **Photo Capture**: Can take photos in-app
- [ ] **Gallery Access**: Can select from gallery
- [ ] **Storage**: Can save images
- [ ] **Permissions Dialog**: Permissions requested properly
- [ ] **Permissions Revoke**: App handles denied permissions

**Expected Result**: All permissions working correctly

---

### Phase 9: Notifications (5 minutes)

- [ ] **Reminders**: Receive task reminders
- [ ] **Notifications**: Notification badge appears
- [ ] **Sound**: Notification sound plays
- [ ] **Vibration**: Device vibrates on notification
- [ ] **Tap Action**: Tapping notification opens app

**Expected Result**: Notifications working correctly

---

### Phase 10: Offline & Sync (10 minutes)

- [ ] **Offline Mode**: App works without internet
- [ ] **Data Persistence**: Data saved locally
- [ ] **Sync**: Data syncs when online
- [ ] **Conflict Resolution**: Handles sync conflicts
- [ ] **Auto-Save**: Changes saved automatically

**Expected Result**: Offline functionality working

---

### Phase 11: Performance (5 minutes)

- [ ] **App Speed**: App responds quickly
- [ ] **Image Loading**: Images load without lag
- [ ] **Navigation**: Smooth transitions between screens
- [ ] **Memory**: App doesn't consume excessive memory
- [ ] **Battery**: App doesn't drain battery quickly

**Expected Result**: App performs smoothly

---

### Phase 12: Stability (10 minutes)

- [ ] **No Crashes**: App doesn't crash during testing
- [ ] **Error Handling**: Handles errors gracefully
- [ ] **Recovery**: App recovers from errors
- [ ] **Restart**: App works after device restart
- [ ] **Background**: App works when backgrounded

**Expected Result**: App stable and reliable

---

## Issue Reporting Template

If you find issues, please report with this information:

```
ISSUE TITLE: [Brief description]

DEVICE INFO:
- Model: [e.g., Samsung Galaxy S21]
- Android Version: [e.g., 12.0]
- App Version: 1.0.0

STEPS TO REPRODUCE:
1. [First step]
2. [Second step]
3. [Expected result]
4. [Actual result]

SCREENSHOTS:
[Attach if possible]

LOGS:
[Run: adb logcat > logs.txt]
```

---

## Testing Results

### Summary

| Category | Status | Notes |
|----------|--------|-------|
| Basic Functionality | [ ] Pass / [ ] Fail | |
| Meal Planning | [ ] Pass / [ ] Fail | |
| Shopping List | [ ] Pass / [ ] Fail | |
| Family Members | [ ] Pass / [ ] Fail | |
| Calendar | [ ] Pass / [ ] Fail | |
| Tasks | [ ] Pass / [ ] Fail | |
| Budget | [ ] Pass / [ ] Fail | |
| Camera/Permissions | [ ] Pass / [ ] Fail | |
| Notifications | [ ] Pass / [ ] Fail | |
| Offline/Sync | [ ] Pass / [ ] Fail | |
| Performance | [ ] Pass / [ ] Fail | |
| Stability | [ ] Pass / [ ] Fail | |

### Overall Result

- [ ] **PASS**: All tests passed, ready for Play Store
- [ ] **PASS WITH NOTES**: Minor issues found, document them
- [ ] **FAIL**: Critical issues found, needs fixes

---

## Debugging Commands

### View App Logs

```bash
adb logcat | grep familjedashboard
```

### Check App Permissions

```bash
adb shell pm list permissions -g | grep familjedashboard
```

### Clear App Data

```bash
adb shell pm clear com.familjedashboard.app
```

### Uninstall App

```bash
adb uninstall com.familjedashboard.app
```

### Install APK

```bash
adb install app-debug.apk
```

### Reinstall APK

```bash
adb install -r app-debug.apk
```

---

## Common Issues & Solutions

### Issue: App Crashes on Launch

**Solution**:
1. Clear app data: `adb shell pm clear com.familjedashboard.app`
2. Reinstall: `adb uninstall com.familjedashboard.app && adb install app-debug.apk`
3. Check logs: `adb logcat`

### Issue: Camera Not Working

**Solution**:
1. Check permissions in Settings
2. Grant camera permission
3. Restart app
4. Restart device if needed

### Issue: Images Not Displaying

**Solution**:
1. Check storage permission is granted
2. Verify internet connection
3. Clear app cache: `adb shell pm clear com.familjedashboard.app`
4. Check image URLs are valid

### Issue: Notifications Not Working

**Solution**:
1. Check notification permission is granted
2. Verify notifications are enabled in Settings
3. Check volume is not muted
4. Restart app

### Issue: App Too Slow

**Solution**:
1. Close other apps
2. Restart device
3. Clear app cache
4. Check available storage space

---

## After Testing

### If All Tests Pass ✅

1. **Document Results**: Note any minor issues
2. **Take Screenshots**: Capture key features
3. **Prepare for Play Store**: Proceed to AAB build
4. **Create Release Notes**: Document what's included

### If Issues Found ❌

1. **Document Issues**: Detailed description with steps
2. **Collect Logs**: `adb logcat > logs.txt`
3. **Take Screenshots**: Show the problem
4. **Report Issues**: Share findings with development team
5. **Fix Issues**: Resolve before Play Store submission

---

## Next Steps

After successful testing:

1. **Build Release APK** (if not already done)
2. **Build AAB for Play Store** (see AAB_BUILD_GUIDE.md)
3. **Create Play Store Account** (if needed)
4. **Upload AAB to Play Console**
5. **Complete Store Listing**
6. **Submit for Review**
7. **Monitor Approval Status**

---

## Support

For issues or questions:

- **Email**: support@familjedashboard.app
- **Documentation**: See README.md and other guides
- **Logs**: Attach `adb logcat` output

---

**Happy Testing!** 🚀

Please report any issues you find so we can improve the app before Play Store publication.
