# OneSignal Push Notifications Setup - Corrected Guide

## Current Setup Status

✅ **Fixed in your codebase:**
- Environment variables configured (`VITE_ONESIGNAL_APP_ID`, `ONESIGNAL_REST_API_KEY`)
- OneSignal SDK loads on HTTPS only
- OneSignal initializes when users log in
- OneSignalSDKWorker.js created for service worker support

## What You Need to Do - OneSignal Dashboard Configuration

### Step 1: Go to OneSignal Dashboard
1. Visit https://onesignal.com/ and log in
2. Select your app (App ID: `39eb07fa-42bb-4d6d-86bb-87ebbd5e39b9`)

### Step 2: Configure Your Site URL ⭐ MOST IMPORTANT
1. Go to **Settings** → **All Platforms** (or Web section)
2. Find the **"Site URL"** field
3. Enter your domain exactly as users see it in the browser:
   - **For trendx.social:** `https://trendx.social`
   - **For www.trendx.social:** `https://www.trendx.social`

⚠️ **CRITICAL:** The Site URL must match EXACTLY:
- ✅ Include the protocol (`https://`)
- ✅ Match www vs non-www (they're different origins!)
- ✅ Case-sensitive
- ✅ Don't include paths like `/page`

### Step 3: Test the Setup

After configuring in OneSignal:

1. **Publish your app** with the latest code
2. **Visit your published domain** (trendx.social)
3. **Sign in** to your account
4. You should see a **notification permission prompt**
5. **Allow notifications**

### Step 4: Send a Test Notification

To verify everything works:

1. **Open browser console** (Press F12, go to Console tab)
2. **Run this command:**
   ```javascript
   fetch('/api/notifications/test', {
     method: 'POST',
     credentials: 'include'
   }).then(r => r.json()).then(console.log)
   ```
3. You should receive a test notification

## Troubleshooting

### "Notification prompt doesn't appear"
- ✅ Verify you're on HTTPS
- ✅ Check console (F12) for OneSignal errors
- ✅ **Verify Site URL in OneSignal matches your domain exactly** (most common issue)
- ✅ Try a new browser or incognito window

### "Service Worker not registering"
- ✅ Check DevTools → Application → Service Workers
- ✅ Verify OneSignalSDKWorker.js is accessible at `https://yoursite.com/OneSignalSDKWorker.js`

### "Still not working?"
- ✅ Clear browser cache and restart
- ✅ Check OneSignal dashboard → Logs for error messages
- ✅ Ensure `VITE_ONESIGNAL_APP_ID` environment variable is set correctly

## Environment Variables (Already Set)

```
VITE_ONESIGNAL_APP_ID = 39eb07fa-42bb-4d6d-86bb-87ebbd5e39b9  ✅
ONESIGNAL_APP_ID = (in secrets)  ✅
ONESIGNAL_REST_API_KEY = (in secrets)  ✅
```

## Files in Your Codebase

- `client/src/lib/onesignal.ts` - Initialization logic
- `server/onesignal.ts` - Backend notification sending
- `server/notificationService.ts` - Notification service
- `public/OneSignalSDKWorker.js` - Service worker for push notifications
- `client/index.html` - SDK loader script

## Next Steps

1. **Add your Site URL** in OneSignal dashboard Settings (this is the critical step!)
2. **Make sure to use the correct exact format** (https://trendx.social or https://www.trendx.social)
3. **Republish your app**
4. **Test notifications** on your published domain
