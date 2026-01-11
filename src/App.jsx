import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useBackendStatus } from './hooks/useBackendStatus';
import { isAuthenticated, logoutUser, getSession } from './utils/auth';
import { isAdminAuthenticated } from './utils/adminAuth';
import LandingPage from './pages/LandingPage';
import AdminLandingPage from './pages/AdminLandingPage';
import AdminDashboard from './pages/AdminDashboard';
import ConnectionPanel from './components/ConnectionPanel';
import SettingsPanel from './components/SettingsPanel';
import BlacklistPanel from './components/BlacklistPanel';
import LogsPanel from './components/LogsPanel';
import Header from './components/Header';
import Toast from './components/Toast';
import './App.css';

// Protected Route Component for Admin
function ProtectedAdminRoute({ children }) {
  const isAuth = isAdminAuthenticated();
  console.log('ProtectedAdminRoute - isAuth:', isAuth);
  console.log('ProtectedAdminRoute - localStorage:', localStorage.getItem('adminSession'));

  if (!isAuth) {
    console.log('Not authenticated, redirecting to /admin');
    return <Navigate to="/admin" replace />;
  }

  console.log('Authenticated, rendering AdminDashboard');
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UserApp />} />
        <Route path="/admin" element={<AdminLandingPage />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          }
        />
      </Routes>
    </Router>
  );
}

function UserApp() {
  const [authenticated, setAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [toast, setToast] = useState(null);

  // Load config from localStorage or use defaults
  const getInitialConfig = () => {
    const savedConfig = localStorage.getItem('galaxyKickLockConfig');
    if (savedConfig) {
      try {
        return JSON.parse(savedConfig);
      } catch (err) {
        console.error('Failed to parse saved config:', err);
      }
    }
    // Return default config if nothing saved
    return {
      rc1: '',
      rc2: '',
      rc3: '',
      rc4: '',
      rc5: '',
      kickrc: '',
      rcl1: '',
      rcl2: '',
      rcl3: '',
      rcl4: '',
      rcl5: '',
      planet: '',
      device: '312',
      autorelease: false,
      smart: false,
      lowsecmode: false,
      exitting: true,
      sleeping: false,
      kickmode: true,
      imprisonmode: false,
      blacklist: '',
      gangblacklist: '',
      kblacklist: '',
      kgangblacklist: '',
      attack1: 1940,
      attack2: 1940,
      attack3: 1940,
      attack4: 1940,
      attack5: 1940,
      waiting1: 1910,
      waiting2: 1910,
      waiting3: 1910,
      waiting4: 1910,
      waiting5: 1910,
      timershift: false,
      incrementvalue: 10,
      decrementvalue: 10,
      minatk: 1000,
      maxatk: 3000,
      mindef: 1000,
      maxdef: 3000,
      modena: false,
      kickbybl: false,
      dadplus: false,
      kickall: false,
      reconnect: 5000,
      // AI Mode (backend handles all AI settings with defaults)
      aiMode: false
    };
  };

  const [config, setConfig] = useState(getInitialConfig());

  const {
    status,
    logs,
    loading,
    error,
    connected,
    connect,
    disconnect,
    updateConfig,
    sendCommand
  } = useBackendStatus();

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
  };

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      if (isAuthenticated()) {
        const session = getSession();
        setCurrentUser(session);
        setAuthenticated(true);
      }
      setCheckingAuth(false);
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = (userData) => {
    console.log('handleLoginSuccess called with:', userData);
    setToast(null); // Clear any existing toasts
    setCurrentUser(userData);
    setAuthenticated(true);
    console.log('Authentication state set to true');
  };

  const handleLogout = async () => {
    showToast('Logged out successfully', 'success');

    // Delay redirect to allow user to read the toast message
    setTimeout(async () => {
      await logoutUser();
      setCurrentUser(null);
      setAuthenticated(false);
      disconnect();
    }, 2000);
  };

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className="app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  // Show landing page if not authenticated
  if (!authenticated) {
    console.log('UserApp: Not authenticated, showing LandingPage');
    return <LandingPage onLoginSuccess={handleLoginSuccess} />;
  }

  console.log('UserApp: Authenticated, showing main app');

  const handleConfigChange = (key, value) => {
    setConfig(prev => {
      // Validate RC codes for duplicates
      if (key.startsWith('rc') || key === 'kickrc') {
        const newConfig = { ...prev, [key]: value };

        // Skip validation if value is empty
        if (!value || value.trim() === '') {
          // Auto-save to backend immediately (non-blocking)
          updateConfig(newConfig).then(() => {
            console.log(`Config updated: ${key} = ${value}`);
          }).catch(err => {
            console.error('Failed to update config:', err);
          });
          return newConfig;
        }

        // Collect all RC codes
        const allCodes = [];

        // Main RC codes
        ['rc1', 'rc2', 'rc3', 'rc4', 'rc5'].forEach(rcKey => {
          const codeValue = rcKey === key ? value : newConfig[rcKey];
          if (codeValue && codeValue.trim() !== '') {
            allCodes.push({ key: rcKey, value: codeValue });
          }
        });

        // Alt RC codes
        ['rcl1', 'rcl2', 'rcl3', 'rcl4', 'rcl5'].forEach(rcKey => {
          const codeValue = rcKey === key ? value : newConfig[rcKey];
          if (codeValue && codeValue.trim() !== '') {
            allCodes.push({ key: rcKey, value: codeValue });
          }
        });

        // Kick code
        const kickValue = key === 'kickrc' ? value : newConfig.kickrc;
        if (kickValue && kickValue.trim() !== '') {
          allCodes.push({ key: 'kickrc', value: kickValue });
        }

        // Check for duplicates
        const codeValues = allCodes.map(c => c.value.toLowerCase());
        const duplicates = codeValues.filter((val, idx) => codeValues.indexOf(val) !== idx);

        if (duplicates.length > 0) {
          console.warn(`Duplicate code detected: ${value}. Code not updated.`);
          showToast('This code is already in use. Please use a unique code.', 'error');
          return prev; // Don't update if duplicate
        }
      }

      const newConfig = { ...prev, [key]: value };

      // Debounce backend updates - wait 1 second after user stops typing
      if (window.configUpdateTimer) {
        clearTimeout(window.configUpdateTimer);
      }

      window.configUpdateTimer = setTimeout(() => {
        // Save to localStorage
        localStorage.setItem('galaxyKickLockConfig', JSON.stringify(newConfig));

        // Send to backend
        updateConfig(newConfig).then(() => {
          console.log(`Config updated: ${key} = ${value}`);
        }).catch(err => {
          console.error('Failed to update config:', err);
        });
      }, 1000);

      return newConfig;
    });
  };

  const handleConnect = async () => {
    try {
      console.log('Sending configuration to backend:', config);
      // Update configuration first
      await updateConfig(config);
      console.log('Configuration sent successfully');
      // Then connect
      await connect();
      console.log('Connected successfully');
    } catch (err) {
      console.error('Connection failed:', err);

      // Provide more specific error messages
      let errorMessage = 'Failed to connect to backend';

      if (err.message.includes('fetch') || err.message.includes('Network')) {
        errorMessage = 'Cannot reach backend server. Please check if the server is running.';
      } else if (err.message.includes('timeout')) {
        errorMessage = 'Connection timeout. Server is not responding.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      showToast(errorMessage, 'error');
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (err) {
      console.error('Disconnect failed:', err);

      // Try to extract error message from backend response
      let errorMessage = 'Disconnect failed';
      if (err.response?.data) {
        // If backend returns HTML error page, show generic message
        if (typeof err.response.data === 'string' && err.response.data.includes('<!DOCTYPE')) {
          errorMessage = 'Backend error: The disconnect endpoint crashed. Check backend logs.';
        } else {
          errorMessage = err.response.data.message || err.response.data;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      showToast(errorMessage, 'error');
    }
  };

  const handleReleaseAll = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/release`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'bypass-tunnel-reminder': 'true',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Release command sent successfully:', data);
    } catch (err) {
      console.error('Release failed:', err);
    }
  };

  const handleFlyToPlanet = async () => {
    try {
      if (!config.planet) {
        console.log('Please enter a planet name');
        showToast('Please enter a planet name', 'error');
        return;
      }

      // Check if any websockets are connected
      const wsStatus = status?.wsStatus || {};
      const connectedWs = Object.entries(wsStatus).filter(([key, isConnected]) => isConnected);

      if (connectedWs.length === 0) {
        console.log('No websockets connected');
        showToast('No connections active. Please connect first.', 'error');
        return;
      }

      // Send JOIN command to all connected websockets
      const promises = [];
      if (wsStatus.ws1) promises.push(sendCommand(1, `JOIN ${config.planet}`));
      if (wsStatus.ws2) promises.push(sendCommand(2, `JOIN ${config.planet}`));
      if (wsStatus.ws3) promises.push(sendCommand(3, `JOIN ${config.planet}`));
      if (wsStatus.ws4) promises.push(sendCommand(4, `JOIN ${config.planet}`));
      if (wsStatus.ws5) promises.push(sendCommand(5, `JOIN ${config.planet}`));

      await Promise.all(promises);
      console.log(`Flying to ${config.planet}`);
      showToast(`Flying to ${config.planet}`, 'success');
    } catch (err) {
      console.error('Fly failed:', err);
      showToast(`Fly failed: ${err.message}`, 'error');
    }
  };

  return (
    <div className="app">
      <Header
        status={status}
        connected={connected}
        loading={loading}
        error={error}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <div className="main-container">
        <div className="left-column">
          <ConnectionPanel
            config={config}
            onConfigChange={handleConfigChange}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onReleaseAll={handleReleaseAll}
            onFlyToPlanet={handleFlyToPlanet}
            connected={connected}
            loading={loading}
            status={status}
          />
        </div>

        <div className="middle-column">
          <SettingsPanel
            config={config}
            onConfigChange={handleConfigChange}
          />
        </div>

        <div className="right-column">
          <BlacklistPanel
            config={config}
            onConfigChange={handleConfigChange}
          />
        </div>
      </div>

      <LogsPanel logs={logs} />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <footer className="footer">
        <p>© 2025 | Created by THALA</p>
      </footer>
    </div>
  );
}

export default App;
