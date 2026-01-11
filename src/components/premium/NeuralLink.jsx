import React from 'react';
import { FaFingerprint, FaShieldAlt, FaCrosshairs, FaSkullCrossbones } from 'react-icons/fa';
import './PremiumLayout.css';

const NeuralLink = ({ config, onConfigChange, status }) => {
    return (
        <div className="hud-panel neural-link">
            <div className="panel-header">
                <FaFingerprint className="panel-icon" />
                <span className="panel-title">CONNECTION MATRIX</span>
            </div>

            <div className="neural-grid">
                {[1, 2, 3, 4, 5].map((num) => {
                    // Check both possible status structures
                    const isConnected = status?.websockets?.[`ws${num}`] || status?.wsStatus?.[`ws${num}`];
                    return (
                        <div key={num} className="code-card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                                <div
                                    className={`status-led ${isConnected ? 'active' : 'inactive'}`}
                                    title={isConnected ? 'Connected' : 'Disconnected'}
                                />
                                <span style={{ fontSize: '11px', color: '#fff', fontFamily: 'Orbitron', fontWeight: 700 }}>
                                    CODE {num}
                                </span>
                            </div>

                            <div className="code-inputs">
                                <input
                                    type="text"
                                    maxLength="10"
                                    className="hud-input"
                                    value={config[`rc${num}`]}
                                    onChange={(e) => onConfigChange(`rc${num}`, e.target.value)}
                                    placeholder="PRIMARY"
                                    style={{ color: '#fff' }}
                                />
                                <input
                                    type="text"
                                    maxLength="10"
                                    className="hud-input"
                                    value={config[`rcl${num}`]}
                                    onChange={(e) => onConfigChange(`rcl${num}`, e.target.value)}
                                    placeholder="ALT"
                                    style={{ color: '#fff' }}
                                />
                                <input
                                    type="number"
                                    className="hud-input"
                                    value={config[`waiting${num}`] || ''}
                                    onChange={(e) => onConfigChange(`waiting${num}`, parseInt(e.target.value) || 0)}
                                    placeholder="DEF"
                                    title="Defense"
                                    style={{ color: '#fff' }}
                                />
                                <input
                                    type="number"
                                    className="hud-input"
                                    value={config[`attack${num}`] || ''}
                                    onChange={(e) => onConfigChange(`attack${num}`, parseInt(e.target.value) || 0)}
                                    placeholder="ATK"
                                    title="Attack"
                                    style={{ color: '#fff' }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default NeuralLink;
