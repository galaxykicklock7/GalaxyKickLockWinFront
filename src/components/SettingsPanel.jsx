import React from 'react';
import './SettingsPanel.css';

const SettingsPanel = ({ config, onConfigChange }) => {
  return (
    <fieldset className="settings-panel">
      <legend>Additional Settings</legend>
      
      <div className="settings-grid">
        <div className="settings-column">
          <div className="settings-section">
            <span className="section-label">Mode</span>
            <div className="radio-row">
              <label>
                <input
                  type="radio"
                  name="mode"
                  checked={!config.exitting && !config.sleeping}
                  onChange={() => {
                    onConfigChange('exitting', false);
                    onConfigChange('sleeping', false);
                  }}
                />
                Off Mode
              </label>
              <label>
                <input
                  type="radio"
                  name="mode"
                  checked={config.exitting}
                  onChange={() => {
                    onConfigChange('exitting', true);
                    onConfigChange('sleeping', false);
                  }}
                />
                Exit
              </label>
              <label>
                <input
                  type="radio"
                  name="mode"
                  checked={config.sleeping}
                  onChange={() => {
                    onConfigChange('exitting', false);
                    onConfigChange('sleeping', true);
                  }}
                />
                Sleep
              </label>
            </div>
          </div>

          <div className="settings-section">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.autorelease}
                onChange={(e) => onConfigChange('autorelease', e.target.checked)}
              />
              Auto Release
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.smart}
                onChange={(e) => onConfigChange('smart', e.target.checked)}
              />
              Smart Mode
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.lowsecmode}
                onChange={(e) => onConfigChange('lowsecmode', e.target.checked)}
              />
              Low-sec Mode
            </label>
          </div>
        </div>

        <div className="settings-column">
          <div className="settings-section">
            <span className="section-label">Kick Mode</span>
            <div className="kick-mode-grid">
              <div className="radio-row">
                <label>
                  <input
                    type="radio"
                    name="kickModeSelection"
                    checked={config.kickmode && !config.kickall && !config.kickbybl && !config.dadplus}
                    onChange={() => {
                      onConfigChange('kickmode', true);
                      onConfigChange('kickall', false);
                      onConfigChange('kickbybl', false);
                      onConfigChange('dadplus', false);
                    }}
                  />
                  Kick
                </label>
                <label>
                  <input
                    type="radio"
                    name="kickModeSelection"
                    checked={!config.kickmode}
                    onChange={() => {
                      onConfigChange('kickmode', false);
                      onConfigChange('kickall', false);
                      onConfigChange('kickbybl', false);
                      onConfigChange('dadplus', false);
                    }}
                  />
                  N/A
                </label>
              </div>
              <div className="radio-row">
                <label>
                  <input
                    type="radio"
                    name="kickModeSelection"
                    checked={config.kickmode && !config.kickall && !config.kickbybl && !config.dadplus}
                    onChange={() => {
                      onConfigChange('kickmode', true);
                      onConfigChange('kickall', false);
                      onConfigChange('kickbybl', false);
                      onConfigChange('dadplus', false);
                    }}
                  />
                  No Kick
                </label>
                <label>
                  <input
                    type="radio"
                    name="kickModeSelection"
                    checked={config.kickall}
                    onChange={() => {
                      onConfigChange('kickmode', true);
                      onConfigChange('kickall', true);
                      onConfigChange('kickbybl', false);
                      onConfigChange('dadplus', false);
                    }}
                  />
                  Everyone
                </label>
              </div>
              <div className="radio-row">
                <label>
                  <input
                    type="radio"
                    name="kickModeSelection"
                    checked={config.kickbybl}
                    onChange={() => {
                      onConfigChange('kickmode', true);
                      onConfigChange('kickall', false);
                      onConfigChange('kickbybl', true);
                      onConfigChange('dadplus', false);
                    }}
                  />
                  By Blacklist
                </label>
                <label>
                  <input
                    type="radio"
                    name="kickModeSelection"
                    checked={config.dadplus}
                    onChange={() => {
                      onConfigChange('kickmode', true);
                      onConfigChange('kickall', false);
                      onConfigChange('kickbybl', false);
                      onConfigChange('dadplus', true);
                    }}
                  />
                  Dad+
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-section-full">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={config.timershift}
            onChange={(e) => onConfigChange('timershift', e.target.checked)}
          />
          Auto Interval
        </label>
      </div>

      <div className="settings-section-full">
        <span className="section-label">Auto Interval</span>
        <div className="input-row">
          <input
            type="number"
            value={config.incrementvalue}
            onChange={(e) => onConfigChange('incrementvalue', parseInt(e.target.value))}
          />
          <input
            type="number"
            value={config.decrementvalue}
            onChange={(e) => onConfigChange('decrementvalue', parseInt(e.target.value))}
          />
        </div>
      </div>

      <div className="settings-section-full">
        <span className="section-label">Auto Limit Def:</span>
        <div className="input-row">
          <input
            type="number"
            value={config.mindef}
            onChange={(e) => onConfigChange('mindef', parseInt(e.target.value))}
          />
          <input
            type="number"
            value={config.maxdef}
            onChange={(e) => onConfigChange('maxdef', parseInt(e.target.value))}
          />
        </div>
      </div>

      <div className="settings-section-full">
        <span className="section-label">Auto Limit Atk:</span>
        <div className="input-row">
          <input
            type="number"
            value={config.minatk}
            onChange={(e) => onConfigChange('minatk', parseInt(e.target.value))}
          />
          <input
            type="number"
            value={config.maxatk}
            onChange={(e) => onConfigChange('maxatk', parseInt(e.target.value))}
          />
        </div>
      </div>
    </fieldset>
  );
};

export default SettingsPanel;