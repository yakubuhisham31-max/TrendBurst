# OneSignal Web Push Notifications - Complete Setup Guide

## ✅ What's Already Done in Your Code

### 1. **Service Worker Files** (Root Directory)
- ✅ `OneSignalSDKWorker.js` - Main service worker
- ✅ `OneSignalSDKUpdaterWorker.js` - Update service worker
- Both served from: `https://YOUR_DOMAIN/OneSignalSDKWorker.js`

### 2. **index.html Configuration**
```html
<script src="https://cdn.onesignal.com/sdks/OneSignalSDK.js" async></script>
<script>
  window.OneSignal = window.OneSignal || [];
  OneSignal.push(function() {
    OneSignal.init({
      appId: "39eb07fa-42bb-4d6d-86bb-87ebbd5e39b9",
      allowLocalhostAsSecureOrigin: true,
    });
  });
  
  // Get Player ID for verification
  OneSignal.push(function() {
    OneSignal.getUserId(function(id) {
      console.log("✅ OneSignal Player ID:", id);
    });
  });
</script>
```

### 3. **Backend Notification System**
- ✅ `server/onesignal.ts` - Sends notifications via OneSignal REST API
- ✅ `server/notificationService.ts` - Manages notification types
- ✅ Environment variables: `ONESIGNAL_APP_ID`, `ONESIGNAL_REST_API_KEY`

### 4. **Test Endpoint**
- ✅ `POST /api/notifications/test` - Send test notification to yourself

## 🔧 OneSignal Dashboard Setup (Your Action Required)

### Step 1: Access OneSignal Dashboard
1. Go to https://onesignal.com/
2. Log in with your account
3. Select your app (ID: `39eb07fa-42bb-4d6d-86bb-87ebbd5e39b9`)

### Step 2: Configure Your Site URL
1. Navigate to **Settings → All Platforms**
2. Find **"Site URL"** field
3. Enter your domain exactly:
   ```
   https://trendx.social
   ```
   OR
   ```
   https://www.trendx.social
   ```
4. Click **Save**

⚠️ **Critical:** Must match EXACTLY what users see in browser (including www)

### Step 3: Configure Web Push
1. Go to **Settings → Web Push**
2. Verify these fields are set:
   - **Default Notification Title:** `Trendx`
   - **Notification Icon URL:** Point to your icon
   - **Chrome Web Icon:** Point to your icon

### Step 4: Enable Required Platforms
1. Go to **Settings → Platforms**
2. Make sure **Web** platform is enabled
3. Check that **Firebase Cloud Messaging** or another service is configured for Android/Chrome

## 🧪 Testing Notifications

### Test 1: Check OneSignal Initialization
1. **Go to your published domain** (https://trendx.social)
2. **Open browser DevTools** (Press F12)
3. **Go to Console tab**
4. You should see:
   ```
   ✅ OneSignal Player ID: [some-uuid]
   ```

### Test 2: Check Service Worker Registration
1. **Open DevTools** (F12)
2. **Go to Application → Service Workers**
3. You should see service worker registered and **"active and running"**
4. **Go to Application → Storage → Cookies**
5. Look for `onesignal` cookies to confirm OneSignal is active

### Test 3: Check Browser Notifications Permission
1. **Refresh the page**
2. You should see a **notification permission prompt**
3. Click **Allow**
4. In DevTools → Storage, you should see `onesignal-permission-state` set to `granted`

### Test 4: Send Test Notification
1. **Sign in** to your Trendx account
2. **Open DevTools Console** (F12)
3. **Run this command:**
   ```javascript
   fetch('/api/notifications/test', {
     method: 'POST',
     credentials: 'include',
     headers: {'Content-Type': 'application/json'}
   }).then(r => r.json()).then(data => {
     console.log('Test notification response:', data);
   });
   ```
4. **Check your browser** - you should see a notification appear!
5. **Check DevTools Console** - you should see success message
6. **Check OneSignal Dashboard → Audience → All Users** - your device should appear as subscribed

## 🚨 If Notifications Don't Arrive

### Checklist:
- [ ] Domain is configured correctly in OneSignal (must match exactly)
- [ ] You're on HTTPS (not HTTP)
- [ ] You've allowed notification permission (browser prompt)
- [ ] Service worker is registered (check in DevTools)
- [ ] Player ID appears in console (not undefined)
- [ ] OneSignal API Key is correct in environment variables
- [ ] No CORS errors in browser console
- [ ] No "401 Unauthorized" errors in console

### Debug Steps:
1. **Check browser console for errors** (F12 → Console)
2. **Check OneSignal dashboard logs** → navigate to your app settings
3. **Try a different browser or incognito window**
4. **Clear all cookies and cache**, then refresh
5. **Verify Site URL in OneSignal** matches exactly

## 📊 Monitoring Notifications

### OneSignal Dashboard Checks:
1. **Audience → All Users** - See subscribed devices
2. **Dashboard → Deliveries** - View sent notifications
3. **Logs** - Check for any errors

### Browser DevTools Checks:
1. **Console** - Look for OneSignal logs
2. **Network** - Check if OneSignal API calls succeed
3. **Application → Service Workers** - Verify status
4. **Application → Storage → Cookies** - Check `onesignal` entries

## 🎯 What Triggers Notifications

Your app sends notifications when:
- ✅ User creates a new trend → Followers get notified
- ✅ User creates a post → Trend followers get notified
- ✅ Someone votes on user's post → User gets notified
- ✅ Someone comments on user's post → User gets notified
- ✅ Trend ends → Participants get notified
- ✅ User gets new follower → User gets notified
- ✅ More events... (check server/notificationService.ts)

## 📱 Supported Browsers

OneSignal Web Push works on:
- ✅ Chrome (Android & Desktop)
- ✅ Edge
- ✅ Firefox
- ⚠️ Safari (limited support, requires special configuration)

## 🔐 Security Notes

- Never share your `ONESIGNAL_REST_API_KEY`
- External User IDs (your user IDs) are set securely via `setExternalUserId()`
- Notifications only sent to subscribed users
- All communication with OneSignal is encrypted (HTTPS)

## 📝 Final Checklist Before Publishing

- [ ] OneSignal Site URL configured in dashboard
- [ ] Service workers accessible at your domain
- [ ] Test notification works when signed in
- [ ] Browser shows subscribed status in OneSignal dashboard
- [ ] No console errors in DevTools
- [ ] Environment variables set (ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY)
- [ ] Ready to publish!

## 🆘 Need Help?

Check OneSignal documentation: https://documentation.onesignal.com/docs/web-push-quickstart

Or review these files in your project:
- `client/index.html` - SDK initialization
- `client/src/lib/onesignal.ts` - User ID setup
- `server/onesignal.ts` - Notification sending
- `server/notificationService.ts` - Notification logic
