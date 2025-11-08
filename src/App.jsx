import { useState, useEffect } from 'react';
import { useBackendStatus } from './hooks/useBackendStatus';
import ConnectionPanel from './components/ConnectionPanel';
import SettingsPanel from './components/SettingsPanel';
import BlacklistPanel from './components/BlacklistPanel';
import LogsPanel from './components/LogsPanel';
import Header from './components/Header';
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

  const [config, setConfig] = useState({
    rc1: '',
    rc2: '',
    rc3: '',
    rc4: '',
    kickrc: '',
    rcl1: '',
    rcl2: '',
    rcl3: '',
    rcl4: '',
    planet: '',
    device: '312',
    autorelease: false,
    smart: false,
    lowsecmode: false,
    exitting: true,
    sleeping: false,
    kickmode: true,
    blacklist: '',
    gangblacklist: '',
    kblacklist: '',
    kgangblacklist: '',
    attack1: 1940,
    attack2: 1940,
    attack3: 1940,
    attack4: 1940,
    waiting1: 1910,
    waiting2: 1910,
    waiting3: 1910,
    waiting4: 1910,
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
  });

  const handleConfigChange = (key, value) => {
    setConfig(prev => {
      const newConfig = { ...prev, [key]: value };
      
      // Auto-save to backend immediately (non-blocking)
      updateConfig(newConfig).then(() => {
        console.log(`Config updated: ${key} = ${value}`);
      }).catch(err => {
        console.error('Failed to update config:', err);
      });
      
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
      alert(`Connection failed: ${err.message}`);
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
      // Send ACTION 2 to all connected websockets
      const promises = [];
      if (status?.websockets?.ws1) promises.push(sendCommand(1, 'ACTION 2'));
      if (status?.websockets?.ws2) promises.push(sendCommand(2, 'ACTION 2'));
      if (status?.websockets?.ws3) promises.push(sendCommand(3, 'ACTION 2'));
      if (status?.websockets?.ws4) promises.push(sendCommand(4, 'ACTION 2'));
      
      await Promise.all(promises);
      alert('Release command sent to all connections');
    } catch (err) {
      console.error('Release failed:', err);
      alert(`Release failed: ${err.message}`);
    }
  };

  const handleFlyToPlanet = async () => {
    try {
      if (!config.planet) {
        alert('Please enter a planet name');
        return;
      }
      
      // Send JOIN command to all connected websockets
      const promises = [];
      if (status?.websockets?.ws1) promises.push(sendCommand(1, `JOIN ${config.planet}`));
      if (status?.websockets?.ws2) promises.push(sendCommand(2, `JOIN ${config.planet}`));
      if (status?.websockets?.ws3) promises.push(sendCommand(3, `JOIN ${config.planet}`));
      if (status?.websockets?.ws4) promises.push(sendCommand(4, `JOIN ${config.planet}`));
      
      await Promise.all(promises);
      alert(`Flying to ${config.planet}`);
    } catch (err) {
      console.error('Fly failed:', err);
      alert(`Fly failed: ${err.message}`);
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
      
      <footer className="footer">
        <p>© 2025 | Created by THALA</p>
      </footer>
    </div>
  );
}

export default App;
