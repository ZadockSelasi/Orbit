import React from 'react';
import { LayoutDashboard, CheckSquare, StickyNote, Calendar as CalendarIcon, Focus, Settings } from 'lucide-react';
import { cn } from '../utils/cn';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
    { id: 'notes', icon: StickyNote, label: 'Notes' },
    { id: 'calendar', icon: CalendarIcon, label: 'Calendar' },
    { id: 'focus', icon: Focus, label: 'Focus Mode' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <nav className="w-20 md:w-64 flex-shrink-0 glass-card m-4 flex flex-col items-center md:items-start py-8">
        <div className="mb-12 px-0 md:px-8">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-[0_0_15px_rgba(255,111,0,0.5)]">
            <CheckSquare className="text-white w-6 h-6" />
          </div>
          <h1 className="hidden md:block text-xl font-bold mt-4 text-white">Orbit</h1>
        </div>
        
        <div className="flex flex-col gap-4 w-full px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex items-center gap-4 p-3 rounded-xl transition-all duration-300",
                  isActive 
                    ? "bg-accent/20 text-accent border border-accent/30 shadow-[0_0_10px_rgba(255,111,0,0.2)]" 
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="w-6 h-6 flex-shrink-0" />
                <span className="hidden md:block font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
