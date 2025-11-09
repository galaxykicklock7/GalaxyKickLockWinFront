import { useState, useEffect } from 'react';
import { useBackendStatus } from './hooks/useBackendStatus';
import ConnectionPanel from './components/ConnectionPanel';
import SettingsPanel from './components/SettingsPanel';
import BlacklistPanel from './components/BlacklistPanel';
import LogsPanel from './components/LogsPanel';
import Header from './components/Header';
import Toast from './components/Toast';
import './App.css';

function App() {
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

  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
  };

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
    reconnect: 5000
    };
  };

  const [config, setConfig] = useState(getInitialConfig());

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
      alert(`Disconnect failed: ${err.message}`);
    }
  };

  const handleReleaseAll = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/release`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        return;
      }
      
      // Send JOIN command to all connected websockets
      const promises = [];
      if (status?.websockets?.ws1) promises.push(sendCommand(1, `JOIN ${config.planet}`));
      if (status?.websockets?.ws2) promises.push(sendCommand(2, `JOIN ${config.planet}`));
      if (status?.websockets?.ws3) promises.push(sendCommand(3, `JOIN ${config.planet}`));
      if (status?.websockets?.ws4) promises.push(sendCommand(4, `JOIN ${config.planet}`));
      if (status?.websockets?.ws5) promises.push(sendCommand(5, `JOIN ${config.planet}`));
      
      await Promise.all(promises);
      console.log(`Flying to ${config.planet}`);
    } catch (err) {
      console.error('Fly failed:', err);
    }
  };

  return (
    <div className="app">
      <Header 
        status={status} 
        connected={connected} 
        loading={loading}
        error={error}
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
