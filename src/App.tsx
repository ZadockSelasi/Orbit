import { useState } from 'react';
import { Layout } from './components/Layout';
import { TasksView } from './components/TasksView';
import { NotesView } from './components/NotesView';
import { CalendarView } from './components/CalendarView';
import { FocusView } from './components/FocusView';
import { DashboardView } from './components/DashboardView';
import { SettingsView } from './components/SettingsView';
import { TimerProvider } from './context/TimerContext';
import { SettingsProvider } from './context/SettingsContext';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <SettingsProvider>
      <TimerProvider>
        <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
          {activeTab === 'dashboard' && <DashboardView setActiveTab={setActiveTab} />}
          {activeTab === 'tasks' && <TasksView />}
          {activeTab === 'notes' && <NotesView />}
          {activeTab === 'calendar' && <CalendarView />}
          {activeTab === 'focus' && <FocusView />}
          {activeTab === 'settings' && <SettingsView />}
        </Layout>
      </TimerProvider>
    </SettingsProvider>
  );
}
