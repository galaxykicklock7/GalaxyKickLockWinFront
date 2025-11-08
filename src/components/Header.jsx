import React from 'react';
import './Header.css';

const Header = ({ status, connected, loading, error }) => {
  return (
    <header className="header">
      <h1 className="title">GALAXY KICK LOCK 2.0</h1>
      
      <div className="status-bar">
        <div className="status-item">
          <span 
            className={`status-indicator ${
              loading ? 'loading' : connected ? 'connected' : 'disconnected'
            }`}
          />
          <span className="status-text">
            {loading ? 'Connecting...' : connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {status && (
          <>
            <div className="status-item">
              <span className="status-label">WS1:</span>
              <span className={status.websockets?.ws1 ? 'ws-active' : 'ws-inactive'}>
                {status.websockets?.ws1 ? '✓' : '✗'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">WS2:</span>
              <span className={status.websockets?.ws2 ? 'ws-active' : 'ws-inactive'}>
                {status.websockets?.ws2 ? '✓' : '✗'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">WS3:</span>
              <span className={status.websockets?.ws3 ? 'ws-active' : 'ws-inactive'}>
                {status.websockets?.ws3 ? '✓' : '✗'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">WS4:</span>
              <span className={status.websockets?.ws4 ? 'ws-active' : 'ws-inactive'}>
                {status.websockets?.ws4 ? '✓' : '✗'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Kick:</span>
              <span className={status.websockets?.ws5 ? 'ws-active' : 'ws-inactive'}>
                {status.websockets?.ws5 ? '✓' : '✗'}
              </span>
            </div>
          </>
        )}

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
