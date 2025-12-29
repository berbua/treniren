# 📱 Mobile Testing Guide

## Testing on Mobile Device via Local Network

When testing the app on your mobile device using your local IP address (e.g., `http://192.168.1.12:2137`), you need to configure NextAuth and Google OAuth to work with the IP address instead of `localhost`.

## Quick Setup Steps

### 1. Find Your Local IP Address

First, find your computer's local IP address:

**macOS:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}'
```

**Linux:**
```bash
hostname -I | awk '{print $1}'
```

**Windows:**
```cmd
ipconfig | findstr IPv4
```

You should see something like `192.168.1.12` (your actual IP will be different).

### 2. Update Environment Variables

Create or update your `.env.local` file with your local IP address:

```bash
# Use your local IP address instead of localhost
NEXTAUTH_URL="http://192.168.1.12:2137"
```

**Important:** 
- Replace `192.168.1.12` with your actual local IP address from step 1
- Make sure the port (2137) matches your dev server port
- **Restart the dev server** after changing this variable (NextAuth reads it at startup)

### 2. Update Google OAuth Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Select your OAuth 2.0 Client ID
4. **IMPORTANT:** You need to add the redirect URI, NOT the JavaScript origin!
   - Look for **"Authorized redirect URIs"** (Autoryzowane identyfikatory URI przekierowania)
   - **NOT** "Authorized JavaScript origins" (Autoryzowane źródła JavaScriptu)
   
5. Under **Authorized redirect URIs**, click **"+ ADD URI"** and add:
   ```
   http://192.168.1.12:2137/api/auth/callback/google
   ```
   (Replace `192.168.1.12` with your actual IP address)

6. **Also keep** the localhost version for local testing:
   ```
   http://localhost:2137/api/auth/callback/google
   ```

**Note:** You don't need to add anything to "Authorized JavaScript origins" - that field is for client-side JavaScript and doesn't accept IP addresses. Only add to "Authorized redirect URIs".

### 3. Start Development Server for Mobile Testing

**Important:** Use the `dev:network` script which binds to all network interfaces:

```bash
npm run dev:network
```

This will make the server accessible from your local network. You should see:
```
▲ Next.js 15.5.3
- Local:        http://localhost:2137
- Network:      http://0.0.0.0:2137
```

**Note:** `0.0.0.0` is just the bind address (meaning "listen on all interfaces"). To access from mobile, use your **actual IP address** from step 1 (e.g., `http://192.168.1.12:2137`), not `0.0.0.0`.

If you only want to test locally (not on mobile), use:
```bash
npm run dev
```

### 4. Access from Mobile

1. Make sure your mobile device is on the **same Wi-Fi network** as your development machine

2. **Important:** Use your **actual IP address** (from step 1), NOT `0.0.0.0`!

3. Open your mobile browser and navigate to:
   ```
   http://192.168.1.12:2137
   ```
   (Replace `192.168.1.12` with your actual IP address from step 1)

4. Try logging in with Google - it should now redirect correctly!

**Why `0.0.0.0`?** 
- `0.0.0.0` in the terminal output is just the **bind address** (tells the server to listen on all network interfaces)
- It's **not** the URL you use to access the server
- You must use your **actual local IP address** (like `192.168.1.12`) to access from mobile

## Quick Diagnostic

Run this script to check your configuration:

```bash
node check-env.js
```

This will tell you if `NEXTAUTH_URL` is set correctly.

## Troubleshooting

### Issue: "400 invalid request flowName=GeneralOauthFlow"

This error typically means the redirect URI doesn't match what's configured in Google Cloud Console.

**Solution:**
1. **Verify redirect URI in Google Cloud Console:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to **APIs & Services** → **Credentials**
   - Select your OAuth 2.0 Client ID
   - **IMPORTANT:** Make sure you're looking at **"Authorized redirect URIs"** (Autoryzowane identyfikatory URI przekierowania)
   - **NOT** "Authorized JavaScript origins" (Autoryzowane źródła JavaScriptu) - that's a different field!
   - Check **Authorized redirect URIs** - it must **exactly match**:
     ```
     http://YOUR_IP:2137/api/auth/callback/google
     ```
   - Make sure there are no trailing slashes or typos
   - The IP address must match your `NEXTAUTH_URL` in `.env.local`

### Issue: "Nieprawidłowe przekierowanie: musi kończyć się publiczną domeną najwyższego poziomu"

This error appears when Google OAuth rejects your IP address redirect URI. Some Google OAuth configurations don't accept IP addresses.

**Solution - Use ngrok (Recommended):**
1. **Install ngrok:**
   ```bash
   brew install ngrok  # macOS
   ```

2. **Start ngrok:**
   ```bash
   ngrok http 2137
   ```

3. **Copy the ngrok URL** (e.g., `https://abc123.ngrok.io`)

4. **Update `.env.local`:**
   ```bash
   NEXTAUTH_URL="https://abc123.ngrok.io"
   ```

5. **Add to Google OAuth Console:**
   - **Authorized redirect URIs**: `https://abc123.ngrok.io/api/auth/callback/google`
   - (Replace with your actual ngrok URL)

6. **Restart dev server and access from mobile using the ngrok URL**

See the "Alternative: Use ngrok for Testing" section above for detailed instructions.

**Alternative - Check OAuth Client Type:**
- Make sure you're using an "Web application" OAuth client (not "Desktop" or "Mobile")
- Some client types have stricter redirect URI requirements

2. **Verify NEXTAUTH_URL matches:**
   ```bash
   # Check what's in your .env.local
   cat .env.local | grep NEXTAUTH_URL
   ```
   Should show: `NEXTAUTH_URL="http://192.168.1.12:2137"` (with your actual IP)

3. **Restart the dev server** after any changes

### Issue: "outgoing request timed out after 3500ms" when trying to sign in with Google

This error occurs when NextAuth can't reach Google's OAuth discovery endpoint.

**Solution:**
1. **Check your internet connection** - the dev server needs to reach Google's servers
2. **Check firewall settings** - make sure outgoing HTTPS connections are allowed
3. **Try again** - sometimes it's a temporary network issue
4. **If persistent:** Check your network/VPN settings that might be blocking Google's servers

### Issue: Still redirects to localhost:3000

**This is the most common issue!** It means NextAuth isn't reading your `NEXTAUTH_URL`.

**Solution:**
1. **Verify `.env.local` exists and has the correct value:**
   ```bash
   cat .env.local | grep NEXTAUTH_URL
   ```
   Should show: `NEXTAUTH_URL="http://192.168.1.12:2137"`

2. **Make sure the file is in the project root** (same directory as `package.json`)

3. **Completely stop and restart the dev server:**
   - Press `Ctrl+C` to stop
   - Wait a few seconds
   - Run `npm run dev` again
   - **Check the terminal output** - you should see:
     ```
     [NextAuth] NEXTAUTH_URL: http://192.168.1.12:2137
     ```

4. **If you still see `localhost:3000` in the debug logs:**
   - The `.env.local` file might not be in the right location
   - Or Next.js isn't loading it (try creating it fresh)
   - Make sure there are no syntax errors (quotes are correct)

**Solution:** 
- Check that `.env.local` has `NEXTAUTH_URL="http://192.168.1.12:2137"` (not localhost, and port 2137 not 3000)
- **CRITICAL:** Make sure you **completely restarted** the dev server after changing the env file (NextAuth reads `NEXTAUTH_URL` at startup)
- Verify the server is running with `npm run dev` (not `dev:local`)
- Check the terminal output - it should show `Network: http://192.168.1.12:2137`
- Clear your browser cache on mobile
- Try accessing the app directly from your computer's browser first to verify the URL is correct

### Issue: Connection refused

**Solution:**
- Make sure your dev server is running
- Check that your firewall allows connections on port 2137
- Verify both devices are on the same Wi-Fi network
- Try accessing `http://192.168.1.12:2137` from your computer's browser first

### Issue: Google OAuth error "redirect_uri_mismatch"

**Solution:**
- Double-check that you added the IP address callback URL in Google Cloud Console
- Make sure the URL exactly matches: `http://YOUR_IP:2137/api/auth/callback/google`
- Wait a few minutes after updating Google OAuth settings (they can take time to propagate)

### Issue: Can't find my IP address

**macOS:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}'
```

**Linux:**
```bash
hostname -I | awk '{print $1}'
```

**Windows:**
```cmd
ipconfig | findstr IPv4
```

## Switching Back to Localhost

When you're done testing on mobile and want to go back to localhost:

1. Update `.env.local`:
   ```bash
   NEXTAUTH_URL="http://localhost:2137"
   ```

2. Restart the dev server

3. You can keep both redirect URIs in Google OAuth Console (localhost and IP address) - they won't conflict

## Security Note

⚠️ **Important:** Never commit your `.env.local` file with your local IP address to version control. The `.env.local` file should already be in `.gitignore`.

## Alternative: Use ngrok for Testing (Recommended for IP Address Issues)

If Google OAuth rejects your IP address redirect URI, use ngrok to get a public domain:

### Why ngrok?
- Google OAuth accepts public domains (like `.ngrok.io`)
- Works from any network (not just local Wi-Fi)
- More reliable for OAuth testing

### Setup Steps:

1. **Install ngrok:**
   ```bash
   # macOS
   brew install ngrok
   
   # Or download from https://ngrok.com/download
   ```

2. **Start your dev server:**
   ```bash
   npm run dev
   ```
   (Use regular `dev`, not `dev:network` - ngrok will handle the network part)

3. **Start ngrok in a new terminal:**
   ```bash
   ngrok http 2137
   ```

4. **Copy the ngrok URL:**
   You'll see something like:
   ```
   Forwarding  https://abc123.ngrok.io -> http://localhost:2137
   ```
   Copy the `https://abc123.ngrok.io` part (your URL will be different)

5. **Update `.env.local`:**
   ```bash
   NEXTAUTH_URL="https://abc123.ngrok.io"
   ```
   (Replace with your actual ngrok URL)

6. **Add to Google OAuth Console:**
   - Go to **Authorized redirect URIs**
   - Add: `https://abc123.ngrok.io/api/auth/callback/google`
   - (Replace with your actual ngrok URL)

7. **Restart your dev server:**
   ```bash
   npm run dev
   ```

8. **Access from mobile:**
   - Use the ngrok URL: `https://abc123.ngrok.io`
   - Works from any network!

**Note:** Free ngrok URLs change each time you restart ngrok. For a stable URL, consider ngrok's paid plan or use the same ngrok session.

