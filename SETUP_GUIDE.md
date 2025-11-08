# Quick Setup Guide

## 🚀 Quick Start (5 minutes)

### Step 1: Install Dependencies

```bash
cd github_frontend
npm install
```

### Step 2: Configure Backend URL

**Option A: Local Backend**
```bash
# Create .env file
echo VITE_BACKEND_URL=http://localhost:3000 > .env
```

**Option B: GitHub Actions Tunnel**
```bash
# After running GitHub Actions workflow, copy the tunnel URL
echo VITE_BACKEND_URL=https://your-tunnel-url.loca.lt > .env
```

### Step 3: Start Development Server

```bash
npm run dev
```

Open http://localhost:5173 in your browser!

---

## 🔧 Full Setup

### 1. Prerequisites

Make sure you have:
- ✅ Node.js 18+ installed
- ✅ Backend running (GitHub Actions or local)
- ✅ Backend API accessible on port 3000

Check Node version:
```bash
node --version  # Should be 18+
npm --version   # Should be 9+
```

### 2. Install Dependencies

```bash
cd github_frontend
npm install
```

This installs:
- React 18
- Vite (fast dev server)
- Axios (API client)
- Crypto-JS (encryption)

### 3. Configure Environment

**Copy example env file:**
```bash
cp .env.example .env
```

**Edit `.env` file:**
```env
VITE_BACKEND_URL=http://localhost:3000
```

For GitHub Actions tunnel, use:
```env
VITE_BACKEND_URL=https://tunnel-url-from-actions.loca.lt
```

### 4. Start Development

```bash
npm run dev
```

Output:
```
VITE v5.0.8  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.1.100:5173/
```

### 5. Access the UI

Open http://localhost:5173 in your browser

---

## 📦 Production Build

### Build

```bash
npm run build
```

Output folder: `dist/`

### Preview Production Build

```bash
npm run preview
```

### Deploy

**Option 1: Vercel**
```bash
npm install -g vercel
vercel
```

**Option 2: Netlify**
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

**Option 3: GitHub Pages**
```bash
npm run build
# Push dist/ folder to gh-pages branch
```

---

## 🎯 Usage

### 1. Fill in Recovery Codes

- **Code 1-4**: Main recovery codes
- **Code 1-4 Alt**: Alternate codes (for rotation)
- **Kick Code**: For kick mode

### 2. Configure Settings

- **Device**: Select Android/iOS/Web
- **Planet**: Target planet name
- **Timers**: Defense and Attack timings
- **Blacklists**: Usernames and clans to target

### 3. Connect

Click **Connect** button

Watch the status indicators:
- 🟢 Green = Connected
- 🔴 Red = Disconnected
- 🟠 Orange = Connecting

### 4. Monitor

- Real-time logs in 4 separate windows
- Connection status for each WebSocket
- Game state (targets, actions, etc.)

### 5. Actions

- **Release All**: Escape from prison (all connections)
- **Fly**: Join specific planet (all connections)
- **Exit**: Disconnect all connections

---

## 🐛 Troubleshooting

### Cannot connect to backend

**Problem**: "Failed to fetch" or CORS error

**Solution**:
1. Check backend is running: `curl http://localhost:3000/api/health`
2. Verify `.env` has correct URL
3. Check backend logs for CORS errors
4. Restart both frontend and backend

### Logs not updating

**Problem**: Logs panel stays empty

**Solution**:
1. Check Network tab in browser DevTools
2. Verify `/api/logs` endpoint returns data
3. Check browser console for errors
4. Increase poll interval in `useBackendStatus.js` if needed

### Configuration not saving

**Problem**: Settings reset after refresh

**Solution**:
1. Click Connect after changing settings (auto-sends config)
2. Check `/api/configure` endpoint in Network tab
3. Verify backend logs show config update
4. Check backend `main.js` has `configure` route

### Port already in use

**Problem**: "Port 5173 is already in use"

**Solution**:
```bash
# Kill process using port 5173
npx kill-port 5173

# Or use different port
npm run dev -- --port 5174
```

---

## 🔗 API Endpoints

All endpoints relative to `VITE_BACKEND_URL`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/status` | GET | Connection status + game state |
| `/api/logs` | GET | All logs from 4 connections |
| `/api/configure` | POST | Update configuration |
| `/api/connect` | POST | Connect all WebSockets |
| `/api/disconnect` | POST | Disconnect all WebSockets |
| `/api/send` | POST | Send command to specific WS |

---

## 📊 Performance Tips

### Reduce Poll Interval

Edit `src/hooks/useBackendStatus.js`:
```javascript
// Change from 2000ms to 5000ms
export const useBackendStatus = (pollInterval = 5000) => {
```

### Disable Auto-Refresh

Comment out the interval in `useBackendStatus.js`:
```javascript
// const interval = setInterval(() => {
//   fetchStatus();
//   fetchLogs();
// }, pollInterval);
```

Then manually refresh using the `refresh()` function.

---

## 🎨 Customization

### Change Theme

Edit `src/index.css` and `src/App.css`

### Change Colors

```css
/* Primary color */
--primary: #2196F3;

/* Success color */
--success: #4caf50;

/* Danger color */
--danger: #f44336;
```

### Change Fonts

Edit `src/index.css`:
```css
font-family: 'Your Font', 'Fallback', sans-serif;
```

---

## 📝 Development Notes

### Adding New Features

1. Create component in `src/components/`
2. Add styles in matching `.css` file
3. Import in `App.jsx`
4. Add to state management if needed

### Adding New API Calls

1. Add method to `src/utils/api.js`
2. Create hook in `src/hooks/` if needed
3. Use in component

### Debugging

Use React DevTools:
```bash
npm install -g react-devtools
react-devtools
```

Check console:
```javascript
console.log('Debug:', data);
```

---

## ✅ Checklist

Before connecting:

- [ ] Backend is running
- [ ] `.env` file configured
- [ ] Dependencies installed (`npm install`)
- [ ] Frontend started (`npm run dev`)
- [ ] Browser open at http://localhost:5173
- [ ] Recovery codes filled in
- [ ] Settings configured
- [ ] Blacklists added (if using)

---

## 📞 Support

- Check README.md for detailed info
- Check backend logs for errors
- Check browser console for errors
- Verify API endpoints are accessible
