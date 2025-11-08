import React from 'react';
import './ConnectionPanel.css';

const ConnectionPanel = ({
  config,
  onConfigChange,
  onConnect,
  onDisconnect,
  onReleaseAll,
  onFlyToPlanet,
  connected,
  loading
}) => {
  return (
    <fieldset className="connection-panel">
      <legend>Connection</legend>

      <div className="codes-grid">
        {[1, 2, 3, 4].map((num) => (
          <div key={num} className="code-row-container">
            <div className="code-labels">
              <span>Code {num}</span>
              <span>Code {num} Alt</span>
              <span>Defense</span>
              <span>Attack</span>
            </div>
            <div className="code-row">
              <input
                type="text"
                maxLength="10"
                value={config[`rc${num}`]}
                onChange={(e) => onConfigChange(`rc${num}`, e.target.value)}
                placeholder={`Code ${num}`}
              />
              <input
                type="text"
                maxLength="10"
                value={config[`rcl${num}`]}
                onChange={(e) => onConfigChange(`rcl${num}`, e.target.value)}
                placeholder="Alt"
              />
              <input
                type="number"
                className="timer-input"
                value={config[`waiting${num}`]}
                onChange={(e) => onConfigChange(`waiting${num}`, parseInt(e.target.value))}
              />
              <input
                type="number"
                className="timer-input"
                value={config[`attack${num}`]}
                onChange={(e) => onConfigChange(`attack${num}`, parseInt(e.target.value))}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="controls">
        <button 
          className="btn btn-primary" 
          onClick={onConnect}
          disabled={connected || loading}
        >
          Connect
        </button>
        <button 
          className="btn btn-danger" 
          onClick={onDisconnect}
          disabled={!connected || loading}
        >
          Exit
        </button>
      </div>

      <div className="connection-grid">
        <div className="connection-column">
          <div className="form-group">
            <label>Planet:</label>
            <input
              type="text"
              value={config.planet}
              onChange={(e) => onConfigChange('planet', e.target.value)}
              placeholder="Enter planet"
            />
          </div>

          <div className="form-group">
            <button 
              className="btn" 
              onClick={onFlyToPlanet}
              disabled={!connected || !config.planet}
            >
              Fly
            </button>
          </div>

          <div className="form-group">
            <label>Reconnect (ms):</label>
            <input
              type="number"
              value={config.reconnect}
              onChange={(e) => onConfigChange('reconnect', parseInt(e.target.value))}
            />
          </div>
        </div>

        <div className="connection-column">
          <div className="form-group">
            <label>Kick Code:</label>
            <input
              type="text"
              maxLength="10"
              value={config.kickrc}
              onChange={(e) => onConfigChange('kickrc', e.target.value)}
              placeholder="Kick Code"
            />
          </div>

          <div className="form-group">
            <button 
              className="btn btn-action" 
              onClick={onReleaseAll}
              disabled={!connected}
            >
              Release All
            </button>
          </div>

          <div className="device-selection">
            <label>
              <input
                type="radio"
                name="device"
                value="312"
                checked={config.device === '312'}
                onChange={(e) => onConfigChange('device', e.target.value)}
              />
              Android
            </label>
            <label>
              <input
                type="radio"
                name="device"
                value="323"
                checked={config.device === '323'}
                onChange={(e) => onConfigChange('device', e.target.value)}
              />
              iOS
            </label>
            <label>
              <input
                type="radio"
                name="device"
                value="352"
                checked={config.device === '352'}
                onChange={(e) => onConfigChange('device', e.target.value)}
              />
              Web
            </label>
          </div>
        </div>
      </div>
    </fieldset>
  );
};

export default ConnectionPanel;