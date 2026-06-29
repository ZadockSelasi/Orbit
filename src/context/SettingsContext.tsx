import React, { createContext, useContext, useState, useEffect } from 'react';

interface Settings {
  timerSound: string;
  accentColor: string;
  bgStartColor: string;
  bgEndColor: string;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
  timerSound: 'chime',
  accentColor: '#FF6F00',
  bgStartColor: '#121212',
  bgEndColor: '#1A1A1A',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('orbit_settings');
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) };
      } catch (e) {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('orbit_settings', JSON.stringify(settings));
    
    // Apply CSS variables
    const root = document.documentElement;
    root.style.setProperty('--color-accent', settings.accentColor);
    root.style.setProperty('--color-bg-start', settings.bgStartColor);
    root.style.setProperty('--color-bg-end', settings.bgEndColor);
  }, [settings]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
