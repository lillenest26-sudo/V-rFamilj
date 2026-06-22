# Google Play Store Compliance Checklist

## Pre-Submission Requirements

### App Information

- [ ] App name is unique and descriptive
- [ ] Package name follows Android naming convention (com.company.app)
- [ ] App version code is set (starts at 1)
- [ ] App version name is set (semantic versioning)
- [ ] Minimum API level is 24 or higher
- [ ] Target API level is 34 or higher
- [ ] App category is appropriate
- [ ] Content rating is accurate

### Store Listing

- [ ] Short description is 80 characters or less
- [ ] Full description is clear and accurate
- [ ] Description does not contain:
  - [ ] Misleading claims
  - [ ] Pricing information (pricing set separately)
  - [ ] Contact information (use dedicated fields)
  - [ ] Promotional codes or links
- [ ] Screenshots are:
  - [ ] 2-8 for phones (required)
  - [ ] 320×569 pixels or larger
  - [ ] Actual app screenshots (not mockups)
  - [ ] In English or target language
  - [ ] Clear and representative
- [ ] Feature graphic is:
  - [ ] 1024×500 pixels
  - [ ] PNG or JPEG format
  - [ ] High quality and professional
- [ ] App icon is:
  - [ ] 512×512 pixels
  - [ ] PNG format with transparency
  - [ ] Clear and recognizable
  - [ ] Not just text

### Graphics & Media

- [ ] All graphics are original or properly licensed
- [ ] No copyrighted material without permission
- [ ] No misleading or deceptive images
- [ ] Graphics are appropriate for all ages
- [ ] No excessive branding or watermarks

### Content Rating

- [ ] Content rating questionnaire completed
- [ ] Rating is accurate for app content
- [ ] No mature content without appropriate rating
- [ ] No hidden content that changes rating

### Privacy & Security

- [ ] Privacy policy is:
  - [ ] Clearly accessible
  - [ ] Specific to the app
  - [ ] Covers all data collection
  - [ ] Explains data usage
  - [ ] Includes contact information
  - [ ] Updated and current
- [ ] Terms of service are:
  - [ ] Clearly accessible
  - [ ] Comprehensive
  - [ ] Include dispute resolution
  - [ ] Updated and current
- [ ] Data collection is:
  - [ ] Minimized and necessary
  - [ ] Disclosed in privacy policy
  - [ ] User-controlled where possible
  - [ ] Securely stored
- [ ] Permissions are:
  - [ ] Justified and necessary
  - [ ] Explained to users
  - [ ] Requested at appropriate times
  - [ ] Not excessive for functionality

### Permissions

- [ ] All requested permissions are necessary
- [ ] No permissions for unused features
- [ ] Permissions are:
  - [ ] Requested at runtime (Android 6.0+)
  - [ ] Explained to users
  - [ ] Revocable by user
  - [ ] Justified in privacy policy

| Permission | Justified | Explained |
|-----------|-----------|-----------|
| CAMERA | [ ] | [ ] |
| READ_EXTERNAL_STORAGE | [ ] | [ ] |
| WRITE_EXTERNAL_STORAGE | [ ] | [ ] |
| ACCESS_FINE_LOCATION | [ ] | [ ] |
| ACCESS_COARSE_LOCATION | [ ] | [ ] |
| POST_NOTIFICATIONS | [ ] | [ ] |

### Functionality & Performance

- [ ] App:
  - [ ] Launches without errors
  - [ ] Runs smoothly without crashes
  - [ ] Responds to user input
  - [ ] Handles errors gracefully
  - [ ] Works on target devices
- [ ] Features:
  - [ ] All advertised features work
  - [ ] No broken links
  - [ ] No unfinished features
  - [ ] No placeholder content
- [ ] Performance:
  - [ ] App loads quickly
  - [ ] No excessive battery drain
  - [ ] No excessive data usage
  - [ ] No memory leaks

### User Experience

- [ ] Navigation is:
  - [ ] Intuitive and clear
  - [ ] Consistent throughout app
  - [ ] Accessible to all users
  - [ ] Follows Android guidelines
- [ ] UI is:
  - [ ] Professional and polished
  - [ ] Responsive and adaptive
  - [ ] Readable text sizes
  - [ ] Accessible colors
  - [ ] Proper spacing and layout
- [ ] Accessibility:
  - [ ] Text is readable
  - [ ] Buttons are tappable (48dp minimum)
  - [ ] Color contrast is sufficient
  - [ ] Supports screen readers
  - [ ] Keyboard navigation works

### Content Policy Compliance

- [ ] No:
  - [ ] Illegal content
  - [ ] Hate speech or discrimination
  - [ ] Violence or weapons
  - [ ] Sexual or adult content
  - [ ] Misleading or deceptive content
  - [ ] Spam or repetitive content
  - [ ] Malware or harmful code
  - [ ] Copyright infringement
  - [ ] Trademark infringement
  - [ ] Impersonation or fraud
  - [ ] Phishing or scams
  - [ ] Gambling or loot boxes
  - [ ] Excessive ads
  - [ ] Unauthorized data collection

### Monetization

- [ ] If free:
  - [ ] No misleading "free" claims
  - [ ] No hidden costs
  - [ ] No forced purchases
- [ ] If paid:
  - [ ] Price is clearly stated
  - [ ] Refund policy is clear
  - [ ] No trial period deception
- [ ] If in-app purchases:
  - [ ] Prices are clearly displayed
  - [ ] Confirmation required for purchase
  - [ ] Easy cancellation method
  - [ ] Refund policy is clear
- [ ] If ads:
  - [ ] Ads are not intrusive
  - [ ] Close button is visible
  - [ ] No misleading ad content
  - [ ] Ad policy complies with guidelines
- [ ] If subscription:
  - [ ] Billing terms are clear
  - [ ] Cancellation is easy
  - [ ] Renewal is transparent
  - [ ] Free trial terms are clear

### Device & API Requirements

- [ ] Minimum API level: 24 (Android 7.0)
- [ ] Target API level: 34 (Android 14)
- [ ] App is:
  - [ ] 64-bit compatible
  - [ ] Tested on multiple devices
  - [ ] Works on tablets
  - [ ] Handles different screen sizes
  - [ ] Supports landscape orientation
  - [ ] Handles configuration changes

### Build & Signing

- [ ] APK/AAB is:
  - [ ] Properly signed
  - [ ] Not debuggable
  - [ ] Optimized for size
  - [ ] Uses proper keystore
- [ ] Build configuration:
  - [ ] Release build type
  - [ ] Proguard/R8 enabled
  - [ ] Resources shrunk
  - [ ] No debug symbols

### Testing

- [ ] App tested on:
  - [ ] Minimum API level device
  - [ ] Target API level device
  - [ ] Multiple screen sizes
  - [ ] Tablet device
  - [ ] Latest Android version
- [ ] Testing includes:
  - [ ] Installation and launch
  - [ ] All features
  - [ ] Permission requests
  - [ ] Error handling
  - [ ] Offline functionality
  - [ ] Network connectivity changes
  - [ ] Battery and data usage
  - [ ] Crash and ANR testing

### Documentation

- [ ] Release notes are:
  - [ ] Clear and informative
  - [ ] Highlight new features
  - [ ] Mention bug fixes
  - [ ] Professional tone
  - [ ] Not misleading
- [ ] Support information:
  - [ ] Support email provided
  - [ ] Support page accessible
  - [ ] Response time reasonable
  - [ ] Contact method clear

### Legal Compliance

- [ ] Privacy policy:
  - [ ] Complies with GDPR (if EU)
  - [ ] Complies with CCPA (if US)
  - [ ] Covers all data practices
  - [ ] Explains user rights
  - [ ] Provides contact info
- [ ] Terms of service:
  - [ ] Covers app usage
  - [ ] Includes liability limitations
  - [ ] Addresses user content
  - [ ] Includes dispute resolution
- [ ] Age restrictions:
  - [ ] Appropriate for rating
  - [ ] Parental controls if needed
  - [ ] No child exploitation
  - [ ] Complies with COPPA (if US)

### Final Checks

- [ ] All required fields filled
- [ ] No placeholder or test content
- [ ] No links to external stores
- [ ] No contact info in description
- [ ] Screenshots are current
- [ ] Graphics are professional
- [ ] Pricing is set correctly
- [ ] Countries selected appropriately
- [ ] Content rating is accurate
- [ ] Privacy policy is accessible
- [ ] Terms of service are accessible
- [ ] Support contact is valid
- [ ] AAB file is ready
- [ ] Version code is correct
- [ ] Version name is correct
- [ ] Minimum API level is 24+
- [ ] Target API level is 34+
- [ ] App is not debuggable
- [ ] All permissions justified
- [ ] No malware or harmful code
- [ ] App functions as described

## Submission Process

1. [ ] Create Google Play Developer account
2. [ ] Pay one-time registration fee ($25)
3. [ ] Accept Developer Agreement
4. [ ] Create new app in Play Console
5. [ ] Fill in store listing
6. [ ] Upload screenshots and graphics
7. [ ] Set content rating
8. [ ] Configure pricing and distribution
9. [ ] Upload AAB file
10. [ ] Review store listing preview
11. [ ] Submit for review
12. [ ] Monitor review status
13. [ ] Address any review issues
14. [ ] App approved and published

## Post-Launch Monitoring

- [ ] Monitor app reviews daily
- [ ] Respond to user feedback
- [ ] Track crash reports
- [ ] Monitor performance metrics
- [ ] Check for policy violations
- [ ] Plan updates based on feedback
- [ ] Maintain regular update schedule
- [ ] Keep privacy policy current
- [ ] Keep terms of service current
- [ ] Monitor competitor apps
- [ ] Track user ratings
- [ ] Analyze user retention

## Common Rejection Reasons

- [ ] Misleading description or screenshots
- [ ] Broken functionality
- [ ] Crashes or ANRs
- [ ] Privacy policy missing or incomplete
- [ ] Excessive permissions
- [ ] Malware or harmful code
- [ ] Copyright or trademark infringement
- [ ] Deceptive practices
- [ ] Inappropriate content
- [ ] Spam or repetitive content
- [ ] Poor user experience
- [ ] Incomplete store listing
- [ ] Outdated target API level
- [ ] Debuggable APK/AAB
- [ ] Unsigned or improperly signed build

---

**Status**: [ ] Ready for Submission

**Submission Date**: _______________

**App ID**: _______________

**Review Status**: _______________

**Approval Date**: _______________
