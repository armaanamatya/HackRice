import React, { useState, useEffect, useRef } from 'react';
import './SettingsDropdown.css';

const SETTINGS_STORAGE_KEY = 'userSettings';

const SettingsDropdown = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState({
    publicSchedule: false,
  });

  const dropdownRef = useRef(null);

  useEffect(() => {
    const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (storedSettings) {
      setSettings(JSON.parse(storedSettings));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleToggleChange = (settingName) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [settingName]: !prevSettings[settingName],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="settings-dropdown" ref={dropdownRef}>
      <div className="dropdown-header">
        <h3>Settings</h3>
        <button onClick={onClose} className="close-button">×</button>
      </div>
      <div className="dropdown-section">
        <h4>Privacy</h4>
        <div className="setting-item">
          <label htmlFor="publicSchedule">Publicly list my schedule</label>
          <input
            type="checkbox"
            id="publicSchedule"
            checked={settings.publicSchedule}
            onChange={() => handleToggleChange('publicSchedule')}
          />
        </div>
      </div>
    </div>
  );
};

export default SettingsDropdown;
