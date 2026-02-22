# OneSignal Deployment Checklist for trendx.social

## Pre-Deployment (Do These Before Publishing)

### OneSignal Dashboard Configuration
- [ ] Go to https://onesignal.com/ and log in
- [ ] Select app with ID: `39eb07fa-42bb-4d6d-86bb-87ebbd5e39b9`
- [ ] Go to **Settings → All Platforms**
- [ ] Set **Site URL** to `https://trendx.social` (or `https://www.trendx.social`)
- [ ] Click **Save**

### Verify Code is Ready
- [ ] OneSignalSDKWorker.js exists in root ✅
- [ ] OneSignalSDKUpdaterWorker.js exists in root ✅
- [ ] index.html has OneSignal SDK script ✅
- [ ] Server has ONESIGNAL_APP_ID set ✅
- [ ] Server has ONESIGNAL_REST_API_KEY set ✅

### Test Locally (Development)
1. Run your app locally
2. Open DevTools (F12)
3. Go to Console tab
4. Refresh page - you should NOT see any OneSignal errors (HTTPS check is normal)

## Deployment (Publishing)

### Step 1: Publish Your App
- Use Replit's "Publish" button to deploy to trendx.social

### Step 2: Post-Deployment Testing
1. Go to https://trendx.social (on HTTPS!)
2. Open DevTools (F12) → Console tab
3. Sign in to your account
4. Look for: `✅ OneSignal Player ID: [uuid]`
5. You should see a notification permission prompt within 5 seconds

### Step 3: Allow Notifications
- Click **Allow** on the notification permission prompt
- Check DevTools → Application → Service Workers
- You should see OneSignal service workers registered

### Step 4: Test Notification
1. Keep DevTools open (Console tab)
2. Run this command:
   ```javascript
   fetch('/api/notifications/test', {
     method: 'POST',
     credentials: 'include'
   }).then(r => r.json()).then(console.log)
   ```
3. **A browser notification should appear!**
4. Check response in console - should show success

### Step 5: Verify in OneSignal Dashboard
1. Go to OneSignal dashboard
2. Click on your app
3. Go to **Audience → All Users**
4. Your browser/device should appear as subscribed with status "Subscribed"

## If It's Not Working

### Check These in Order:

1. **HTTPS?** - Must be https://trendx.social, not http://
   
2. **Domain correct in OneSignal?**
   - Go to Settings → All Platforms
   - Is Site URL exactly `https://trendx.social`?
   - If not, update it and try again

3. **Service Workers loaded?**
   - DevTools → Application → Service Workers
   - Should show active OneSignal workers
   - If not, refresh page

4. **No console errors?**
   - DevTools → Console tab
   - Look for red error messages
   - OneSignal errors will tell you what's wrong

5. **Notifications permission granted?**
   - Look for notification permission in browser UI
   - If denied, click the lock icon in address bar → reset permissions → refresh

6. **Player ID showing?**
   - In DevTools Console, do you see `✅ OneSignal Player ID: ...`?
   - If not, OneSignal SDK didn't load

### Nuclear Option:
1. Clear all browser data (cookies, cache, storage) for trendx.social
2. Close all tabs with trendx.social
3. Open fresh incognito/private window
4. Go to https://trendx.social
5. Open DevTools and test again

## Files Involved

- `OneSignalSDKWorker.js` - Main service worker (root)
- `OneSignalSDKUpdaterWorker.js` - Update worker (root)
- `client/index.html` - OneSignal SDK initialization
- `client/src/lib/onesignal.ts` - User ID setup
- `server/onesignal.ts` - Notification sending
- `server/routes.ts` - Includes `/api/notifications/test` endpoint

## OneSignal API Credentials

These are already configured in your environment:
- App ID: `39eb07fa-42bb-4d6d-86bb-87ebbd5e39b9`
- REST API Key: `[set in ONESIGNAL_REST_API_KEY]`

## Success Indicators

✅ All of these should be true:
1. `✅ OneSignal Player ID: [uuid]` appears in console
2. Browser shows "Allow Notifications" prompt
3. Service workers appear in DevTools
4. Test notification appears when you run the test command
5. Device appears as "Subscribed" in OneSignal dashboard
6. No red errors in DevTools console

## Next Steps After Deployment

1. Test actual notifications by creating a trend or post
2. Have another user follow you and verify they get notified
3. Monitor OneSignal dashboard for delivery stats
4. Check browser console logs if notifications fail
