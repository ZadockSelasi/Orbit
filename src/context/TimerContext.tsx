import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db } from '../db';
import { useSettings } from './SettingsContext';

interface TimerContextType {
  activeTaskId: string | null;
  activeStartTime: Date | null;
  elapsedSeconds: number;
  targetDuration: number | null;
  startTimer: (taskId: string, duration?: number | null) => void;
  stopTimer: () => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const playNotificationSound = (soundType: string) => {
  if (soundType === 'none') return;
  
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

    if (soundType === 'chime') {
      playTone(523.25, ctx.currentTime, 0.4); // C5
      playTone(659.25, ctx.currentTime + 0.15, 0.4); // E5
      playTone(783.99, ctx.currentTime + 0.3, 0.6); // G5
    } else if (soundType === 'bell') {
      playTone(880, ctx.currentTime, 1.5, 'triangle'); // A5
    } else if (soundType === 'digital') {
      playTone(1000, ctx.currentTime, 0.1, 'square');
      playTone(1200, ctx.currentTime + 0.15, 0.1, 'square');
      playTone(1000, ctx.currentTime + 0.3, 0.1, 'square');
      playTone(1500, ctx.currentTime + 0.45, 0.3, 'square');
    }
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeStartTime, setActiveStartTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [targetDuration, setTargetDuration] = useState<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const { settings } = useSettings();

  useEffect(() => {
    if (activeTaskId && activeStartTime) {
      intervalRef.current = window.setInterval(() => {
        const currentElapsed = Math.floor((new Date().getTime() - activeStartTime.getTime()) / 1000);
        setElapsedSeconds(currentElapsed);
        
        // Auto-stop if target duration is reached
        if (targetDuration !== null && currentElapsed >= targetDuration) {
          stopTimer();
          
          // Play sound and vibrate
          playNotificationSound(settings.timerSound);
          if ('vibrate' in navigator) {
            navigator.vibrate([300, 100, 300, 100, 300]);
          }

          // Optional: Play a sound or show a notification here
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Focus Session Complete!', {
              body: 'Great job! Take a break.',
            });
          }
        }
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setElapsedSeconds(0);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeTaskId, activeStartTime, targetDuration, settings.timerSound]);

  const startTimer = (taskId: string, duration: number | null = null) => {
    if (activeTaskId) {
      stopTimer(); // Stop current before starting new
    }
    setActiveTaskId(taskId);
    setActiveStartTime(new Date());
    setTargetDuration(duration);
    
    // Request notification permission if needed
    if (duration !== null && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const stopTimer = async () => {
    if (activeTaskId && activeStartTime) {
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - activeStartTime.getTime()) / 1000);
      
      await db.timeLogs.add({
        id: crypto.randomUUID(),
        taskId: activeTaskId,
        startTime: activeStartTime,
        endTime,
        duration,
        createdAt: new Date()
      });
    }
    setActiveTaskId(null);
    setActiveStartTime(null);
    setElapsedSeconds(0);
    setTargetDuration(null);
  };

  return (
    <TimerContext.Provider value={{ activeTaskId, activeStartTime, elapsedSeconds, targetDuration, startTimer, stopTimer }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
}
