import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn';

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const tasks = useLiveQuery(() => db.tasks.toArray());
  const timeLogs = useLiveQuery(() => db.timeLogs.toArray());

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // Calculate task density per day
  const getDayStats = (date: Date) => {
    if (!tasks || !timeLogs) return { taskCount: 0, timeSpent: 0 };
    
    const dayTasks = tasks.filter(t => 
      t.isEveryday || 
      isSameDay(t.createdAt, date) || 
      (t.dueDate && isSameDay(t.dueDate, date))
    );
    const dayLogs = timeLogs.filter(l => isSameDay(l.startTime, date));
    
    const timeSpent = dayLogs.reduce((acc, log) => acc + (log.duration || 0), 0);
    
    return {
      taskCount: dayTasks.length,
      timeSpent
    };
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m`;
    return '';
  };

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Planner</h2>
          <p className="text-gray-400">Visualize your productivity density.</p>
        </div>
        <div className="flex items-center gap-4 glass-card px-4 py-2">
          <button onClick={prevMonth} className="p-1 hover:text-white text-gray-400 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-bold text-white min-w-[120px] text-center">
            {format(currentDate, 'MMMM yyyy')}
          </span>
          <button onClick={nextMonth} className="p-1 hover:text-white text-gray-400 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="glass-card p-6 flex-1 overflow-y-auto">
        <div className="grid grid-cols-7 gap-4 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-bold text-gray-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-4">
          {/* Empty cells for start of month offset */}
          {Array.from({ length: startOfMonth(currentDate).getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[100px] rounded-xl bg-white/5 opacity-50" />
          ))}
          
          {daysInMonth.map(date => {
            const stats = getDayStats(date);
            const density = Math.min(stats.taskCount / 5, 1); // Max density at 5 tasks
            
            return (
              <div 
                key={date.toISOString()} 
                className={cn(
                  "min-h-[100px] rounded-xl p-3 flex flex-col relative border transition-all",
                  isToday(date) ? "border-accent bg-accent/5" : "border-white/10 bg-white/5",
                  stats.taskCount > 0 && "hover:border-accent/50 cursor-pointer"
                )}
              >
                {/* Density highlight background */}
                {stats.taskCount > 0 && (
                  <div 
                    className="absolute inset-0 bg-accent rounded-xl opacity-0 transition-opacity"
                    style={{ opacity: density * 0.2 }}
                  />
                )}
                
                <span className={cn(
                  "text-sm font-bold relative z-10",
                  isToday(date) ? "text-accent" : "text-gray-300"
                )}>
                  {format(date, 'd')}
                </span>
                
                <div className="mt-auto relative z-10 flex flex-col gap-1">
                  {stats.taskCount > 0 && (
                    <div className="text-xs bg-white/10 px-2 py-1 rounded text-gray-300">
                      {stats.taskCount} task{stats.taskCount !== 1 ? 's' : ''}
                    </div>
                  )}
                  {stats.timeSpent > 0 && (
                    <div className="text-xs bg-accent/20 text-accent px-2 py-1 rounded border border-accent/20">
                      {formatTime(stats.timeSpent)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
