# OneSignal Push Notifications - Published App Setup

## What Was Fixed

1. **Removed hardcoded App ID** - OneSignal now uses the environment variable `VITE_ONESIGNAL_APP_ID`
2. **Dynamic initialization** - OneSignal initializes properly when users log in
3. **HTTPS-only loading** - SDK only loads on production (HTTPS)

## Important: OneSignal Dashboard Configuration

For push notifications to work on your published app, you MUST configure your domain in OneSignal:

### Steps:

1. **Go to OneSignal Dashboard**: https://onesignal.com/
2. **Select your app** (App ID: `39eb07fa-42bb-4d6d-86bb-87ebbd5e39b9`)
3. **Settings → All Platforms → Web Push**
4. **Add these domains to "Authorized Origins":**
   - `https://trendx.social`
   - `https://www.trendx.social`
   - `https://trend-burst-rafiqykb99.replit.app` (your Replit domain)

### Verify Configuration:

After adding domains, test on your published app:
1. Sign in to your account
2. You should see a prompt asking to allow notifications
3. Check browser console (F12) for OneSignal logs
4. Send a test notification: Sign in → Open DevTools Console → Run:
   ```javascript
   fetch('/api/notifications/test', {
     method: 'POST',
     credentials: 'include'
   }).then(r => r.json()).then(console.log)
   ```

## Environment Variables (Already Configured)

- ✅ `VITE_ONESIGNAL_APP_ID` = `39eb07fa-42bb-4d6d-86bb-87ebbd5e39b9`
- ✅ `ONESIGNAL_APP_ID` (secret) = Configured for backend
- ✅ `ONESIGNAL_REST_API_KEY` (secret) = Configured for backend

## Troubleshooting

If notifications still don't work after domain configuration:

1. **Check browser console** for errors
2. **Verify HTTPS** - Notifications only work on HTTPS
3. **Clear browser cache** and try again
4. **Check OneSignal dashboard** - View "Audience → All Users" to see if devices are registered

## Test Endpoint

Use this endpoint to test if notifications are working:
```
POST /api/notifications/test
```

This sends a test notification to the logged-in user.
