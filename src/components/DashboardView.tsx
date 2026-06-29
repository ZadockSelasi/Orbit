import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { CheckSquare, Clock, StickyNote, TrendingUp } from 'lucide-react';
import { isToday } from 'date-fns';

export function DashboardView({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  const [timeOffset, setTimeOffset] = useState(0);

  useEffect(() => {
    // Attempt to get the real local time based on IP, in case the device timezone is incorrect
    // Using ipwho.is as it has reliable CORS support
    fetch('https://ipwho.is/')
      .then(res => res.json())
      .then(data => {
        if (data && data.timezone && data.timezone.id) {
          // Get the current time in the user's actual timezone
          const dateInTz = new Date(new Date().toLocaleString("en-US", { timeZone: data.timezone.id }));
          const realHour = dateInTz.getHours();
          const deviceHour = new Date().getHours();
          const offset = realHour - deviceHour;
          setTimeOffset(offset);
        }
      })
      .catch(e => {
        console.error("Time fetch error", e);
        // Fallback to device time if fetch fails
      });
  }, []);

  useEffect(() => {
    const updateHour = () => {
      let hour = new Date().getHours() + timeOffset;
      if (hour >= 24) hour -= 24;
      if (hour < 0) hour += 24;
      setCurrentHour(hour);
    };
    
    updateHour();
    const interval = setInterval(updateHour, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [timeOffset]);

  const tasks = useLiveQuery(() => db.tasks.toArray());
  const notes = useLiveQuery(() => db.notes.toArray());
  const timeLogs = useLiveQuery(() => db.timeLogs.toArray());

  const pendingTasks = tasks?.filter(t => !t.completed) || [];
  const completedTasks = tasks?.filter(t => t.completed) || [];
  const highPriorityTasks = pendingTasks.filter(t => t.priority === 'High');
  
  const todayLogs = timeLogs?.filter(l => isToday(l.startTime)) || [];
  const todaySeconds = todayLogs.reduce((acc, log) => acc + (log.duration || 0), 0);
  
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const greeting = currentHour < 12 ? 'Morning' : currentHour < 18 ? 'Afternoon' : 'Evening';

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Good {greeting}</h2>
        <p className="text-gray-400">Here's your productivity overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Pending Tasks" 
          value={pendingTasks.length.toString()} 
          icon={CheckSquare} 
          color="text-blue-400" 
          bg="bg-blue-400/10" 
          onClick={() => setActiveTab('tasks')}
        />
        <StatCard 
          title="High Priority" 
          value={highPriorityTasks.length.toString()} 
          icon={TrendingUp} 
          color="text-accent" 
          bg="bg-accent/10" 
          onClick={() => setActiveTab('tasks')}
        />
        <StatCard 
          title="Time Today" 
          value={formatTime(todaySeconds)} 
          icon={Clock} 
          color="text-emerald-400" 
          bg="bg-emerald-400/10" 
          onClick={() => setActiveTab('focus')}
        />
        <StatCard 
          title="Total Notes" 
          value={(notes?.length || 0).toString()} 
          icon={StickyNote} 
          color="text-purple-400" 
          bg="bg-purple-400/10" 
          onClick={() => setActiveTab('notes')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0">
        <div className="glass-card p-6 flex flex-col">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-accent" />
            Up Next
          </h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {pendingTasks.slice(0, 5).map(task => (
              <div key={task.id} className="bg-white/5 rounded-xl p-4 border border-white/5 flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer" onClick={() => setActiveTab('tasks')}>
                <div>
                  <h4 className="font-medium text-white">{task.title}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full border mt-2 inline-block ${
                    task.priority === 'High' ? 'border-accent/50 text-accent' : 
                    task.priority === 'Medium' ? 'border-yellow-500/50 text-yellow-500' : 
                    'border-blue-500/50 text-blue-500'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              </div>
            ))}
            {pendingTasks.length === 0 && (
              <div className="text-gray-500 text-center py-8">All caught up!</div>
            )}
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-purple-400" />
            Recent Notes
          </h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {notes?.slice(0, 4).map(note => (
              <div key={note.id} className="bg-white/5 rounded-xl p-4 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer" onClick={() => setActiveTab('notes')}>
                <h4 className="font-medium text-white mb-1 truncate">{note.title}</h4>
                <p className="text-sm text-gray-400 line-clamp-2">{note.content}</p>
              </div>
            ))}
            {notes?.length === 0 && (
              <div className="text-gray-500 text-center py-8">No notes yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bg, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className="glass-card p-6 flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors group"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg} ${color} group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}
