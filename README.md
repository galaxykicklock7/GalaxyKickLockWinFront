# BEST Frontend - React Interface

Modern React frontend for BEST (Browser Extension Service Tool) with real-time WebSocket communication to the backend.

## Features

- **Real-time Status Monitoring**: Live connection status for all 4 WebSocket connections + kick mode
- **Configuration Management**: All settings from any.html replicated in React
- **Live Logs**: Real-time log streaming from backend (4 separate log windows)
- **Fast Communication**: HTTP REST API for configuration, polling for status updates
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Clean, dark-themed interface with smooth animations

## Architecture

```
Frontend (React + Vite)
    ↓ HTTP REST API
Backend (Express + Node.js)
    ↓ WebSocket
Game Servers (Galaxy Online)
```

## Setup

### Prerequisites

- Node.js 18+ and npm/yarn
- Backend running on port 3000 (or custom port)

### Installation

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables

Create `.env` file in root:

```env
# Backend URL (default: http://localhost:3000)
VITE_BACKEND_URL=http://localhost:3000

# Or use tunnel URLs from GitHub Actions
# VITE_BACKEND_URL=https://your-tunnel-url.loca.lt
```

## Usage

1. **Start Backend**: Make sure backend is running (GitHub Actions workflow or locally)
2. **Start Frontend**: Run `npm run dev`
3. **Access UI**: Open http://localhost:5173
4. **Configure**: Fill in recovery codes and settings
5. **Connect**: Click "Connect" button
6. **Monitor**: Watch real-time logs and status

## Components

### ConnectionPanel
- 4 recovery codes (with alternates)
- Kick code
- Defense/Attack timers for each connection
- Planet control (fly to specific planet)
- Device selection (Android/iOS/Web)

### SettingsPanel
- Off Mode (Exit/Sleep)
- Auto Release, Smart Mode, Low-sec Mode
- Kick mode settings
- Auto Interval (timer shift)
- Auto limits for attack and defense

### BlacklistPanel
- Imprison blacklist (usernames + clans)
- Kick blacklist (usernames + clans)

### LogsPanel
- 4 separate log windows
- Real-time log streaming
- Auto-scroll to latest logs
- Timestamp for each log entry

## API Endpoints

The frontend communicates with backend via REST API:

- `GET /api/health` - Health check
- `GET /api/status` - Get connection status
- `GET /api/logs` - Get all logs
- `POST /api/configure` - Update configuration
- `POST /api/connect` - Connect all WebSockets
- `POST /api/disconnect` - Disconnect all WebSockets
- `POST /api/send` - Send command to specific WebSocket

## Development

### Project Structure

```
github_frontend/
├── src/
│   ├── components/        # React components
│   │   ├── Header.jsx
│   │   ├── ConnectionPanel.jsx
│   │   ├── SettingsPanel.jsx
│   │   ├── BlacklistPanel.jsx
│   │   └── LogsPanel.jsx
│   ├── hooks/            # Custom React hooks
│   │   └── useBackendStatus.js
│   ├── utils/            # Utilities
│   │   └── api.js        # API client
│   ├── App.jsx           # Main app component
│   ├── App.css           # Main styles
│   ├── index.css         # Global styles
│   └── main.jsx          # Entry point
├── index.html            # HTML template
├── vite.config.js        # Vite configuration
└── package.json          # Dependencies
```

### Tech Stack

- **React 18**: UI library
- **Vite**: Build tool (fast dev server)
- **Axios**: HTTP client
- **CSS3**: Styling (no framework dependencies)

### Build

```bash
# Production build
npm run build

# Output: dist/ folder

# Deploy to static hosting (Vercel, Netlify, GitHub Pages, etc.)
```

## Deployment

### Option 1: Static Hosting (Vercel, Netlify)

```bash
npm run build
# Deploy dist/ folder
```

### Option 2: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview"]
```

### Option 3: GitHub Pages

```bash
npm run build
# Push dist/ to gh-pages branch
```

## Troubleshooting

### Backend not connecting

- Check `VITE_BACKEND_URL` in `.env`
- Verify backend is running on correct port
- Check CORS settings in backend

### Logs not updating

- Check browser console for errors
- Verify `/api/logs` endpoint is accessible
- Increase poll interval if needed (in `useBackendStatus` hook)

### Configuration not saving

- Check `/api/configure` endpoint
- Verify request payload in Network tab
- Check backend logs for errors

## License

Same as BEST backend
