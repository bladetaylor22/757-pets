# Better Auth Testing Guide

## Quick Verification Steps

### 1. Check Environment Variables

Verify these are set correctly:

**Local (.env.local):**
- `NEXT_PUBLIC_CONVEX_URL` - Your Convex cloud URL
- `NEXT_PUBLIC_CONVEX_SITE_URL` - Your Convex site URL (ends in `.site`)
- `NEXT_PUBLIC_SITE_URL` - Your local site URL (`http://localhost:3000`)

**Convex Deployment (via CLI):**
```bash
npx convex env list
```
Should show:
- `BETTER_AUTH_SECRET` - Should be set
- `SITE_URL` - Should be set to `http://localhost:3000` (or your production URL)
- `RESEND_API_KEY` - Resend API key from dashboard (required for email sending)
- `RESEND_FROM` - Sender identity, set to `"757 PETS <hello@757pets.com>"` (required for email sending)

### 2. Verify Convex Types Generated

After running `npx convex dev`, check that:
- `convex/_generated/api.d.ts` exists
- `components.betterAuth` appears in the generated types
- `api.auth.getCurrentUser` is available

### 3. Test Auth Endpoints

Open your browser and test these endpoints:

**Check if auth routes are working:**
```
GET http://localhost:3000/api/auth/session
```
Should return `null` if not authenticated, or session data if authenticated.

**Available endpoints:**
- `POST /api/auth/sign-up/email` - Sign up with email/password
- `POST /api/auth/sign-in/email` - Sign in with email/password
- `POST /api/auth/sign-out` - Sign out
- `GET /api/auth/session` - Get current session

## Manual Testing Checklist

### ✅ Sign Up Flow

1. Navigate to `/sign-up`
2. Fill in the form:
   - Name: "Test User"
   - Email: "test@example.com"
   - Password: "password123" (at least 8 characters)
3. Click "Get started"
4. **Expected:** Redirect to home page, user is signed in
5. **Verify:** Check browser console for any errors
6. **Verify:** Check Network tab - should see successful POST to `/api/auth/sign-up/email`

### ✅ Sign In Flow

1. Navigate to `/sign-in` (or create this page)
2. Enter credentials:
   - Email: "test@example.com"
   - Password: "password123"
3. Click "Sign in"
4. **Expected:** Redirect to home page, user is signed in
5. **Verify:** Session persists after page refresh

### ✅ Sign Out Flow

1. While signed in, click "Sign out" button
2. **Expected:** Redirect to sign-up page
3. **Verify:** Session is cleared (check `/api/auth/session` returns `null`)
4. **Verify:** Cannot access protected routes

### ✅ Protected Routes

1. Try accessing a protected route while logged out
2. **Expected:** Redirect to `/sign-up`
3. Sign in
4. **Expected:** Can now access protected route

### ✅ Session Persistence

1. Sign in
2. Refresh the page
3. **Expected:** Still signed in
4. Close browser and reopen
5. **Expected:** Still signed in (session cookie persists)

### ✅ Multiple Tabs

1. Sign in in one tab
2. Open another tab to the same site
3. **Expected:** Also signed in
4. Sign out in one tab
5. **Expected:** Other tab also reflects sign out

## Browser DevTools Testing

### Check Cookies

1. Open DevTools → Application → Cookies
2. Look for Better Auth cookies (usually `better-auth.session_token`)
3. **Verify:** Cookie exists when signed in
4. **Verify:** Cookie is HTTP-only and Secure (in production)

### Check Network Requests

1. Open DevTools → Network tab
2. Sign up or sign in
3. **Verify:** POST request to `/api/auth/sign-up/email` or `/api/auth/sign-in/email`
4. **Verify:** Response status is 200
5. **Verify:** Response includes session data

### Check Console

1. Open DevTools → Console
2. **Verify:** No errors related to auth
3. **Verify:** No CORS errors
4. **Verify:** No missing environment variable warnings

## Testing with Code

### Test useAuth Hook

```typescript
import { useAuth } from "@/hooks/use-auth";

function TestComponent() {
    const { session, user, isAuthenticated, isLoading } = useAuth();
    
    console.log("Session:", session);
    console.log("User:", user);
    console.log("Is Authenticated:", isAuthenticated);
    console.log("Is Loading:", isLoading);
    
    return (
        <div>
            {isLoading && <p>Loading...</p>}
            {isAuthenticated && <p>Welcome, {user?.name}!</p>}
            {!isAuthenticated && <p>Please sign in</p>}
        </div>
    );
}
```

### Test Convex Query

```typescript
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function TestUserQuery() {
    const user = useQuery(api.auth.getCurrentUser);
    
    if (user === undefined) {
        return <div>Loading...</div>;
    }
    
    if (user === null) {
        return <div>Not authenticated</div>;
    }
    
    return <div>User: {user.name} ({user.email})</div>;
}
```

## Common Issues & Solutions

### Issue: "SITE_URL is not set" Error

**Solution:** Set SITE_URL in Convex:
```bash
npx convex env set SITE_URL=http://localhost:3000
```

### Issue: CORS Errors

**Solution:** Verify `NEXT_PUBLIC_CONVEX_SITE_URL` matches your Convex deployment's site URL.

### Issue: Session Not Persisting

**Solution:**
- Check cookie settings in browser
- Verify `NEXT_PUBLIC_SITE_URL` matches actual site URL
- Check browser console for cookie errors
- Ensure cookies aren't blocked

### Issue: "Component not found" Error

**Solution:**
- Verify `convex.config.ts` exports `app.use(betterAuth)`
- Restart `convex dev`
- Check `components.betterAuth` exists in generated types

### Issue: Type Errors

**Solution:**
1. Stop `convex dev`
2. Delete `convex/_generated` folder
3. Restart `convex dev`
4. Wait for type generation

### Issue: "RESEND_FROM environment variable is not set" Error

**Solution:** Set RESEND_FROM in Convex:
```bash
npx convex env set RESEND_FROM="757 PETS <hello@757pets.com>"
```

### Issue: Emails Not Sending

**Solution:**
- Verify `RESEND_API_KEY` is set correctly in Convex
- Check Resend dashboard for API key status
- Verify `testMode` setting matches your use case
- If `testMode: true`, only test addresses (e.g., `delivered@resend.dev`) will work
- Check Resend dashboard logs for delivery status

## Production Testing

Before deploying to production:

1. ✅ Set production `SITE_URL` in Convex:
   ```bash
   npx convex env set SITE_URL=https://yourdomain.com
   ```

2. ✅ Set production environment variables in Vercel:
   - `NEXT_PUBLIC_CONVEX_SITE_URL`
   - `NEXT_PUBLIC_SITE_URL`

3. ✅ Test sign-up flow in production

4. ✅ Test sign-in flow in production

5. ✅ Verify HTTPS cookies are working

6. ✅ Test session persistence across browser restarts

## Email Configuration (Resend)

### Setting Up Resend

1. **Get Resend API Key:**
   - Sign up at [resend.com](https://resend.com)
   - Navigate to API Keys in dashboard
   - Create a new API key
   - Copy the key

2. **Set Environment Variables in Convex:**
   ```bash
   npx convex env set RESEND_API_KEY=re_xxxxxxxxx
   npx convex env set RESEND_FROM="757 PETS <hello@757pets.com>"
   ```

3. **Verify Domain (Production):**
   - Add and verify your domain (`757pets.com`) in Resend dashboard
   - Required for sending emails to real addresses (not test addresses)

4. **Test Mode:**
   - By default, `testMode: true` is enabled in `convex/emails.ts`
   - This only allows sending to test addresses (e.g., `delivered@resend.dev`)
   - Set `testMode: false` when ready for production

### Testing Email Flows

**Email Verification:**
- Sign up a new user
- Check Resend dashboard for sent verification email
- Click verification link to verify email
- User should be automatically signed in after verification

**Password Reset:**
- Request password reset from login page
- Check Resend dashboard for sent reset email
- Click reset link to set new password

## Next Steps

After verifying everything works:

1. ✅ Email verification (configured and working)
2. ✅ Password reset flow (configured and working)
3. Add OAuth providers (Google, GitHub, etc.)
4. Add protected route examples
5. Add user profile management
6. (Optional) Set up Resend webhooks for email status tracking
