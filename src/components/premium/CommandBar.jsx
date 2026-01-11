import React from 'react';
import { FaAndroid, FaApple, FaGlobe, FaSignOutAlt, FaRocket, FaWifi } from 'react-icons/fa';
import './PremiumLayout.css';

const CommandBar = ({
    config,
    onConfigChange,
    onConnect,
    onDisconnect,
    onReleaseAll,
    onFlyToPlanet,
    connected,
    loading,
    onLogout,
    currentUser
}) => {
    return (
        <div className="command-bar">
            {/* LEFT: ACTION CLUSTER */}
            <div className="action-cluster">
                <button
                    className="hex-btn btn-connect"
                    onClick={onConnect}
                    disabled={connected || loading}
                >
                    {loading ? 'INIT...' : connected ? 'LINKED' : 'CONNECT'}
                </button>
                <button
                    className="hex-btn btn-exit"
                    onClick={onDisconnect}
                    disabled={!connected || loading}
                    style={{ color: '#fff' }}
                >
                    EXIT
                </button>
                <button
                    className="hex-btn btn-release"
                    onClick={onReleaseAll}
                    disabled={!connected}
                    style={{ color: '#fff' }}
                >
                    RELEASE
                </button>
            </div>

            {/* MIDDLE: NAVIGATION DECK */}
            <div className="nav-deck">
                <span style={{ fontSize: '11px', color: '#fff', fontFamily: 'Orbitron', fontWeight: 700 }}>PLANET NAME</span>
                <input
                    type="text"
                    className="nav-input"
                    placeholder="Enter planet name..."
                    value={config.planet}
                    onChange={(e) => onConfigChange('planet', e.target.value)}
                    style={{ width: '220px' }}
                />
                <button
                    className="fly-btn"
                    onClick={onFlyToPlanet}
                    disabled={!connected || !config.planet}
                >
                    <FaRocket /> FLY
                </button>
                
                {/* RECONNECT FIELD */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '15px' }}>
                    <span style={{ fontSize: '11px', color: '#fff', fontFamily: 'Orbitron', fontWeight: 700 }}>RECONNECT</span>
                    <input
                        type="number"
                        className="nav-input"
                        placeholder="ms"
                        value={config.reconnect || ''}
                        onChange={(e) => onConfigChange('reconnect', parseInt(e.target.value) || 0)}
                        title="Reconnect delay in milliseconds"
                        style={{ width: '80px', textAlign: 'center' }}
                    />
                </div>
            </div>

            {/* RIGHT: SYSTEM STATUS */}
            <div className="system-status">
                <div className="device-selector">
                    <FaAndroid
                        className={`dev-icon ${config.device === '312' ? 'active' : ''}`}
                        onClick={() => onConfigChange('device', '312')}
                        title="Android"
                    />
                    <FaApple
                        className={`dev-icon ${config.device === '323' ? 'active' : ''}`}
                        onClick={() => onConfigChange('device', '323')}
                        title="iOS"
                    />
                    <FaGlobe
                        className={`dev-icon ${config.device === '352' ? 'active' : ''}`}
                        onClick={() => onConfigChange('device', '352')}
                        title="Web"
                    />
                </div>

                <div className="user-profile">
                    {currentUser && <span style={{ fontSize: '16px', color: '#00f3ff', fontFamily: 'Orbitron', fontWeight: 700, letterSpacing: '1px', textShadow: '0 0 10px rgba(0, 243, 255, 0.5)' }}>{currentUser.username.toUpperCase()}</span>}
                    <button className="logout-btn-mini" onClick={onLogout} title="Logout">
                        <FaSignOutAlt /> LOGOUT
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CommandBar;
