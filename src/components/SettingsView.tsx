import React from 'react';
import { useSettings } from '../context/SettingsContext';
import { Palette, Volume2, RefreshCw } from 'lucide-react';

export function SettingsView() {
  const { settings, updateSettings } = useSettings();

  const handleReset = () => {
    updateSettings({
      timerSound: 'chime',
      accentColor: '#FF6F00',
      bgStartColor: '#121212',
      bgEndColor: '#1A1A1A',
    });
  };

  const playSound = (sound: string) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const playTone = (freq: number, startTime: number, duration: number, type: OscillatorType = 'sine') => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      if (sound === 'chime') {
        playTone(523.25, ctx.currentTime, 0.4); // C5
        playTone(659.25, ctx.currentTime + 0.15, 0.4); // E5
        playTone(783.99, ctx.currentTime + 0.3, 0.6); // G5
      } else if (sound === 'bell') {
        playTone(880, ctx.currentTime, 1.5, 'triangle'); // A5
      } else if (sound === 'digital') {
        playTone(1000, ctx.currentTime, 0.1, 'square');
        playTone(1200, ctx.currentTime + 0.15, 0.1, 'square');
        playTone(1000, ctx.currentTime + 0.3, 0.1, 'square');
        playTone(1500, ctx.currentTime + 0.45, 0.3, 'square');
      }
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Settings</h2>
          <p className="text-gray-400">Customize your Orbit experience</p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Reset to Defaults
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Appearance Settings */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-accent/20 text-accent">
              <Palette className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-white">Appearance</h3>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Accent Color</label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={settings.accentColor}
                  onChange={(e) => updateSettings({ accentColor: e.target.value })}
                  className="w-12 h-12 rounded cursor-pointer bg-transparent border-0 p-0"
                />
                <span className="text-white font-mono">{settings.accentColor.toUpperCase()}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Background Gradient Start</label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={settings.bgStartColor}
                  onChange={(e) => updateSettings({ bgStartColor: e.target.value })}
                  className="w-12 h-12 rounded cursor-pointer bg-transparent border-0 p-0"
                />
                <span className="text-white font-mono">{settings.bgStartColor.toUpperCase()}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Background Gradient End</label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={settings.bgEndColor}
                  onChange={(e) => updateSettings({ bgEndColor: e.target.value })}
                  className="w-12 h-12 rounded cursor-pointer bg-transparent border-0 p-0"
                />
                <span className="text-white font-mono">{settings.bgEndColor.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Audio Settings */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-accent/20 text-accent">
              <Volume2 className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-white">Audio & Notifications</h3>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-4">Focus Timer Completion Sound</label>
              <div className="space-y-3">
                {[
                  { id: 'chime', label: 'Classic Chime' },
                  { id: 'bell', label: 'Meditation Bell' },
                  { id: 'digital', label: 'Digital Alarm' },
                  { id: 'none', label: 'None (Silent)' },
                ].map((sound) => (
                  <label key={sound.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="timerSound"
                        value={sound.id}
                        checked={settings.timerSound === sound.id}
                        onChange={(e) => {
                          updateSettings({ timerSound: e.target.value });
                          if (e.target.value !== 'none') {
                            playSound(e.target.value);
                          }
                        }}
                        className="w-4 h-4 text-accent bg-transparent border-gray-400 focus:ring-accent focus:ring-offset-gray-900"
                      />
                      <span className="text-white font-medium">{sound.label}</span>
                    </div>
                    {sound.id !== 'none' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          playSound(sound.id);
                        }}
                        className="text-gray-400 hover:text-accent transition-colors"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
