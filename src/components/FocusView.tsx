import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useTimer } from '../context/TimerContext';
import { Play, Square, Lock, Search, Plus, X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function FocusView() {
  const { activeTaskId, activeStartTime, elapsedSeconds, targetDuration, startTimer, stopTimer } = useTimer();
  const tasks = useLiveQuery(() => db.tasks.filter(t => !t.completed).toArray());
  const activeTask = tasks?.find(t => t.id === activeTaskId);
  
  const [isLocked, setIsLocked] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null); // null = stopwatch
  const [customMinutes, setCustomMinutes] = useState('');
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedTask = tasks?.find(t => t.id === selectedTaskId);

  // Prevent accidental exit when locked
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isLocked) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isLocked]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTimeBig = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    const pad = (num: number) => num.toString().padStart(2, '0');
    
    if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
    return `${pad(m)}:${pad(s)}`;
  };

  const filteredTasks = tasks?.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase())) || [];
  const exactMatch = tasks?.some(t => t.title.toLowerCase() === searchQuery.trim().toLowerCase());

  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  const handleCreateTask = async () => {
    if (!searchQuery.trim()) return;
    const newId = crypto.randomUUID();
    await db.tasks.add({
      id: newId,
      title: searchQuery.trim(),
      priority: 'Medium',
      completed: false,
      subtasks: [],
      createdAt: new Date()
    });
    setSelectedTaskId(newId);
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  const handleStartTimer = () => {
    if (selectedTaskId) {
      startTimer(selectedTaskId, selectedDuration);
      setSelectedTaskId(null);
    }
  };

  const displaySeconds = activeTaskId 
    ? (targetDuration !== null ? Math.max(0, targetDuration - elapsedSeconds) : elapsedSeconds)
    : (selectedDuration !== null ? selectedDuration : 0);

  const durationOptions = [
    { label: 'Stopwatch', value: null },
    { label: '15m', value: 15 * 60 },
    { label: '25m', value: 25 * 60 },
    { label: '60m', value: 60 * 60 },
  ];

  return (
    <div className="h-full flex flex-col items-center justify-center relative">
      {isLocked && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-md z-0 rounded-3xl" />
      )}
      
      <div className="z-10 flex flex-col items-center max-w-lg w-full">
        <button 
          onClick={() => setIsLocked(!isLocked)}
          className={`mb-12 px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium transition-colors ${
            isLocked ? 'bg-accent text-white shadow-[0_0_20px_rgba(255,111,0,0.4)]' : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
          }`}
        >
          <Lock className="w-4 h-4" />
          {isLocked ? 'Focus Locked' : 'Lock Focus Mode'}
        </button>

        <div className="relative mb-12">
          {/* Pulse animation background */}
          {activeTaskId && (
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.1, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-accent rounded-full blur-3xl -z-10"
            />
          )}
          
          <div className="text-8xl md:text-9xl font-mono font-bold text-white tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] text-center">
            {formatTimeBig(displaySeconds)}
            {activeTaskId && targetDuration !== null && (
              <div className="text-sm font-sans text-gray-400 mt-2 tracking-normal">
                of {formatTimeBig(targetDuration)}
              </div>
            )}
          </div>
        </div>

        {activeTaskId ? (
          <div className="text-center mb-12">
            <p className="text-gray-400 mb-2 uppercase tracking-widest text-sm font-bold">Currently Focusing On</p>
            <h3 className="text-2xl font-bold text-white">{activeTask?.title || 'Unknown Task'}</h3>
          </div>
        ) : selectedTaskId ? (
          <div className="w-full mb-12 flex flex-col items-center">
            <div className="glass-card px-6 py-4 rounded-2xl flex items-center justify-between w-full mb-6">
              <div className="flex-1 truncate pr-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Selected Task</p>
                <p className="text-white font-medium truncate">{selectedTask?.title || 'Unknown Task'}</p>
              </div>
              <button 
                onClick={() => setSelectedTaskId(null)}
                className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full">
              <p className="text-sm text-gray-400 mb-3 text-center flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" /> Timer Duration
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {durationOptions.map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => {
                      setSelectedDuration(opt.value);
                      setCustomMinutes('');
                    }}
                    className={`py-2 px-4 rounded-xl text-sm font-medium transition-all ${
                      selectedDuration === opt.value && customMinutes === ''
                        ? 'bg-accent text-white shadow-[0_0_15px_rgba(255,111,0,0.3)]' 
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="1"
                    value={customMinutes}
                    placeholder="Custom"
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomMinutes(val);
                      const parsed = parseInt(val);
                      if (!isNaN(parsed) && parsed > 0) {
                        setSelectedDuration(parsed * 60);
                      } else {
                        setSelectedDuration(null);
                      }
                    }}
                    className={`w-24 py-2 pl-3 pr-6 rounded-xl text-sm font-medium transition-all focus:outline-none ${
                      customMinutes !== '' 
                        ? 'bg-accent text-white shadow-[0_0_15px_rgba(255,111,0,0.3)] placeholder:text-white/70' 
                        : 'bg-white/5 text-white placeholder:text-gray-400 hover:bg-white/10 focus:bg-white/10'
                    }`}
                  />
                  <span className={`absolute right-3 text-xs pointer-events-none ${customMinutes !== '' ? 'text-white/70' : 'text-gray-400'}`}>m</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full mb-12 relative" ref={dropdownRef}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                onClick={() => setIsDropdownOpen(true)}
                placeholder="Search or create a task to focus on..."
                className="w-full glass-input pl-12 pr-6 py-4 text-lg focus:outline-none"
              />
            </div>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 glass-card overflow-hidden z-50 max-h-60 overflow-y-auto"
                >
                  {filteredTasks.map(t => (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTask(t.id)}
                      className="w-full text-left px-4 py-3 hover:bg-white/10 text-white transition-colors border-b border-white/5 last:border-0"
                    >
                      {t.title}
                    </button>
                  ))}
                  
                  {searchQuery.trim() && !exactMatch && (
                    <button
                      onClick={handleCreateTask}
                      className="w-full text-left px-4 py-3 hover:bg-accent/20 text-accent transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Create "{searchQuery.trim()}"
                    </button>
                  )}

                  {filteredTasks.length === 0 && !searchQuery.trim() && (
                    <div className="px-4 py-3 text-gray-500 text-center">
                      Type to search or create a new task
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="flex gap-6">
          {activeTaskId ? (
            <button 
              onClick={stopTimer}
              className="w-20 h-20 rounded-full bg-red-500/20 text-red-500 border border-red-500/50 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)]"
            >
              <Square className="w-8 h-8 fill-current" />
            </button>
          ) : (
            <button 
              onClick={() => {
                if (selectedTaskId) {
                  handleStartTimer();
                } else if (searchQuery.trim() && !exactMatch) {
                  handleCreateTask();
                } else if (filteredTasks.length > 0) {
                  handleSelectTask(filteredTasks[0].id);
                }
              }}
              disabled={!selectedTaskId && !searchQuery.trim() && (!tasks || tasks.length === 0)}
              className="w-20 h-20 rounded-full bg-accent/20 text-accent border border-accent/50 flex items-center justify-center hover:bg-accent hover:text-white transition-all shadow-[0_0_20px_rgba(255,111,0,0.2)] disabled:opacity-50 disabled:hover:bg-accent/20 disabled:hover:text-accent"
            >
              <Play className="w-8 h-8 ml-2 fill-current" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
