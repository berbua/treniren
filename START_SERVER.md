# Starting the Development Server

## Quick Start

1. **Open your terminal** and navigate to the project:
   ```bash
   cd /Users/katarzynaberbeka/AIDD/treniren_app
   ```

2. **Make sure your `.env.local` has the correct port**:
   ```bash
   NEXTAUTH_URL="http://localhost:2137"
   ```

3. **Start the server**:
   ```bash
   npm run dev
   ```

4. **Wait for the server to start** - you should see:
   ```
   ▲ Next.js 15.5.3
   - Local:        http://localhost:2137
   - Ready in X.Xs
   ```

5. **Open your browser** to: http://localhost:2137

## Troubleshooting

### If you still get ERR_CONNECTION_REFUSED:

1. **Check if port 2137 is already in use**:
   ```bash
   lsof -ti:2137
   ```
   If it returns a PID, kill it:
   ```bash
   kill -9 <PID>
   ```

2. **Try a different port** (if 2137 is blocked):
   - Edit `package.json` and change `--port 2137` to `--port 3001`
   - Update `.env.local`: `NEXTAUTH_URL="http://localhost:3001"`

3. **Check for errors in the terminal** when starting the server

4. **Verify Node.js and npm are working**:
   ```bash
   node --version
   npm --version
   ```

5. **Reinstall dependencies if needed**:
   ```bash
   rm -rf node_modules
   npm install
   ```

## Current Configuration

- **Port**: 2137
- **Command**: `next dev --turbopack --port 2137`
- **URL**: http://localhost:2137

