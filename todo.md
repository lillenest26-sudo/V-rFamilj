# Familje Dashboard — TODO

## Phase 1: Foundation
- [x] Database schema (users, familyMembers, calendarEvents, scheduleBlocks, tasks, reminders, mealPlans, shoppingItems, transactions, savingsGoals, albums, photos, documents, diaryEntries, goals, rewards, chatMessages)
- [x] i18n system with Swedish and Somali translations (full coverage)
- [x] Global CSS design tokens (OKLCH colors, Inter + Playfair Display fonts, shadows, spacing)
- [x] Dark/light mode with persistent toggle
- [x] Language switcher with persistent selection (localStorage)

## Phase 2: Core Layout & Dashboard
- [x] Sidebar navigation with icons, labels, section groupings
- [x] Dashboard home with live clock/date widget
- [x] Weather widget (Open-Meteo API, Stockholm)
- [x] Upcoming events widget
- [x] Tasks summary widget
- [x] Family member avatars widget
- [x] Quick-action shortcuts
- [x] Today's reminders widget
- [x] Weekly goals widget
- [x] Family rules and family message sections

## Phase 3: Calendar & Tasks
- [x] Calendar module (month/week views)
- [x] Event creation dialog with color, category, recurrence
- [x] Weekly schedule grid
- [x] Tasks module with priority, due date, assignee, status filters
- [x] Reminders with type classification (normal/important/urgent)
- [x] Task completion tracking

## Phase 4: Meal Plan & Budget
- [x] Weekly meal plan grid (frukost/lunch/middag/mellanmål)
- [x] Auto-generate shopping list from meal plan
- [x] Shopping list with categories and mark-as-bought
- [x] Budget overview with income/expense logging
- [x] Category breakdown pie chart (Recharts)
- [x] Monthly trend bar chart (Recharts)
- [x] Savings goals with progress bars

## Phase 5: Family & Media
- [x] Family member profiles with avatars and parent/child roles
- [x] Birthday reminders
- [x] Photo album with file upload and album organization
- [x] Documents vault with secure S3 storage and folder organization
- [x] File upload via S3 storage

## Phase 6: Diary, Goals, Rewards & AI
- [x] Personal diary with journal entries and mood tracking
- [x] Family goals with progress tracking and milestones
- [x] Rewards and points system for kids (unlock rewards)
- [x] AI assistant chat interface (family planning Q&A, streaming LLM)

## Phase 7: Polish & Delivery
- [x] React deduplication fix (vite.config.ts dedupe)
- [x] All missing i18n keys added (calendar.subtitle, tasks.addTask, reminders.addReminder, etc.)
- [x] TypeScript clean — zero errors
- [x] PWA manifest.json
- [x] Vitest tests passing
- [x] Checkpoint and delivery


## Phase 8: Tablet-First PWA & Offline (NEW REQUIREMENTS)
- [x] Service worker implementation with offline support
- [x] Install-to-home-screen support (Android + iPad) — manifest.json + meta tags
- [x] Fullscreen mode capability — PWA display standalone
- [x] GPS-based weather (remove Stockholm hardcoding) — useGeoLocation hook + Open-Meteo API
- [x] Calendar: image upload component (device + URL) with preview
- [x] Shopping list: two-section flow (Behöver köpas / Finns hemma) — COMPLETE
- [x] Image support component created (ImageUploadField) — ready for integration
- [x] Tablet-optimized UI — responsive grid, large icons, sidebar navigation
- [x] 100% Swedish/Somali coverage — all UI strings in i18n.ts
- [x] Tablet viewport optimization — PWA manifest, meta tags, responsive design
- [x] Final testing and visual verification — all pages rendering correctly


## Phase 9: FULL IMAGE SUPPORT IN ALL FORMS (CRITICAL)
- [ ] Update schema: add imageUrl to shoppingItems, events, tasks, reminders, albums, familyMembers, diaryEntries, goals, rewards, mealPlans, transactions
- [ ] Update routers: handle imageUrl in all create/update mutations
- [ ] Shopping: device upload + URL + preview in form
- [ ] Calendar: device upload + URL + preview, show image in calendar view
- [ ] Tasks: device upload + URL + preview in form and list
- [ ] Reminders: device upload + URL + preview
- [ ] Family: profile image device upload + URL + preview for each member
- [ ] Family view: show profile images on member cards
- [ ] Photos: cover image device upload + URL + preview
- [ ] Diary: device upload + URL + preview
- [ ] Budget: device upload + URL + preview for transactions
- [ ] Goals: device upload + URL + preview
- [ ] Rewards: device upload + URL + preview
- [ ] Meal Plan: device upload + URL + preview
- [ ] All forms: validate image before save
- [ ] All list views: display images


## Phase 10: CAPACITOR ANDROID NATIVE BUILD (CRITICAL) ✅ COMPLETE
- [x] Meal Plan: integrate ImageUploadField into meal form
- [x] Meal Plan: display images in meal cards on homepage
- [x] Capacitor: install @capacitor/core and @capacitor/cli
- [x] Capacitor: initialize project (npx cap init)
- [x] Capacitor: add Android platform (npx cap add android)
- [x] Capacitor: configure permissions (camera, files, geolocation, notifications)
- [x] Capacitor: configure app icon and splash screen (12 icon densities created)
- [x] Capacitor: build and generate Android project
- [x] Android: verify Android Studio project structure
- [x] Android: create APK build instructions (ANDROID_BUILD.md)
- [x] Android: create build scripts (scripts/build-apk.sh)
- [x] Android: create plugin guide (CAPACITOR_PLUGINS.md)
- [x] Verify: all native permissions in AndroidManifest.xml
- [x] Verify: camera access configured with @capacitor/camera
- [x] Verify: file upload configured
- [x] Verify: GPS functionality configured
- [x] ImageUploadField: Enhanced with native camera support
- [x] Java toolchain: Configured for Android builds (Java 17)
- [x] Gradle: Configured for APK generation


## Phase 11: GOOGLE PLAY STORE PUBLICATION PREPARATION ✅ COMPLETE
- [x] Fix TypeScript compilation errors in Dashboard.tsx and routers.ts
- [x] Verify project builds successfully
- [x] Configure Android release build signing
- [x] Configure App Bundle (AAB) generation
- [x] Set version code and version name
- [x] Create Privacy Policy page (PRIVACY_POLICY.md)
- [x] Create Terms of Use page (TERMS_OF_SERVICE.md)
- [x] Generate Play Store metadata template (PLAYSTORE_METADATA.md)
- [x] Create app information (name, description, support email)
- [x] Create Play Store compliance checklist (PLAYSTORE_CHECKLIST.md)
- [x] Generate build instructions for AAB (AAB_BUILD_GUIDE.md)
- [x] Verify app icon in all required sizes
- [x] Create adaptive icon (foreground + background)
- [x] Verify splash screen assets
- [x] Configure adaptive icon in AndroidManifest.xml
- [x] Create release configuration guide (PLAYSTORE_RELEASE.md)
- [x] Create AAB build automation script (scripts/build-aab.sh)
- [x] Create final Play Store submission package (PLAYSTORE_SUBMISSION_SUMMARY.md)


## Phase 12: PULL-TO-REFRESH GESTURE (Mobile UX) ✅ COMPLETE
- [x] Create PullToRefresh component with gesture detection
- [x] Implement refresh animation and loading state
- [x] Add to Dashboard page with multi-query refresh
- [x] Add to Calendar page with single-query refresh
- [x] Gesture detection (touch start/move/end)
- [x] Visual feedback (pull distance indicator + spinner)
- [x] Smooth animations with CSS transitions
- [x] Swedish/Somali localization for UI text
