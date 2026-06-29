import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Task } from '../db';
import { Plus, Check, Play, Square, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import { useTimer } from '../context/TimerContext';
import { format } from 'date-fns';

export function TasksView() {
  const tasks = useLiveQuery(() => db.tasks.orderBy('createdAt').reverse().toArray());
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    await db.tasks.add({
      id: crypto.randomUUID(),
      title: newTaskTitle,
      priority,
      completed: false,
      subtasks: [],
      createdAt: new Date()
    });
    setNewTaskTitle('');
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Tasks</h2>
        <p className="text-gray-400">Manage your to-dos and track time.</p>
      </div>

      <form onSubmit={addTask} className="glass-card p-4 mb-8 flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="What needs to be done?"
          className="glass-input flex-1 px-4 py-3"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as any)}
          className="glass-input px-4 py-3 appearance-none bg-transparent"
        >
          <option value="Low" className="bg-[#1A1A1A]">Low Priority</option>
          <option value="Medium" className="bg-[#1A1A1A]">Medium Priority</option>
          <option value="High" className="bg-[#1A1A1A]">High Priority</option>
        </select>
        <button type="submit" className="bg-accent hover:bg-accent/80 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" />
          Add Task
        </button>
      </form>

      <div className="flex-1 overflow-y-auto pr-2">
        <AnimatePresence>
          {tasks?.map(task => (
            <TaskItem key={task.id} task={task} />
          ))}
        </AnimatePresence>
        {tasks?.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No tasks yet. Add one above!
          </div>
        )}
      </div>
    </div>
  );
}

function TaskItem({ task }: { task: Task }) {
  const { activeTaskId, startTimer, stopTimer, elapsedSeconds } = useTimer();
  const [expanded, setExpanded] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const isActive = activeTaskId === task.id;

  const toggleComplete = async () => {
    await db.tasks.update(task.id, { completed: !task.completed });
  };

  const deleteTask = async () => {
    await db.tasks.delete(task.id);
  };

  const addSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    
    const updatedSubtasks = [...task.subtasks, { id: crypto.randomUUID(), title: newSubtask, completed: false }];
    await db.tasks.update(task.id, { subtasks: updatedSubtasks });
    setNewSubtask('');
  };

  const toggleSubtask = async (subtaskId: string) => {
    const updatedSubtasks = task.subtasks.map(st => 
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    await db.tasks.update(task.id, { subtasks: updatedSubtasks });
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: task.completed ? 0.4 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "glass-card mb-4 overflow-hidden transition-all duration-300 relative",
        task.priority === 'High' && !task.completed && "border-l-4 border-l-accent",
        isActive && "shadow-[0_0_20px_rgba(255,111,0,0.15)] border-accent/50"
      )}
    >
      <div className="p-4 flex items-center gap-4">
        <button 
          onClick={toggleComplete}
          className={cn(
            "w-6 h-6 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors",
            task.completed ? "bg-accent border-accent text-white" : "border-gray-500 text-transparent hover:border-accent"
          )}
        >
          <Check className="w-4 h-4" />
        </button>

        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <h3 className={cn(
            "font-medium text-lg truncate transition-all duration-300 relative inline-block",
            task.completed ? "text-gray-400" : "text-white"
          )}>
            {task.title}
            {task.completed && (
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                className="absolute top-1/2 left-0 h-[2px] bg-gray-400 -translate-y-1/2"
              />
            )}
          </h3>
          <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs border",
              task.priority === 'High' ? "border-accent/50 text-accent" : 
              task.priority === 'Medium' ? "border-yellow-500/50 text-yellow-500" : 
              "border-blue-500/50 text-blue-500"
            )}>
              {task.priority}
            </span>
            {task.subtasks.length > 0 && (
              <span>{task.subtasks.filter(st => st.completed).length}/{task.subtasks.length} subtasks</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isActive ? (
            <div className="flex items-center gap-3 bg-accent/10 px-3 py-1.5 rounded-lg border border-accent/20">
              <span className="text-accent font-mono text-sm">{formatTime(elapsedSeconds)}</span>
              <button onClick={stopTimer} className="text-accent hover:text-white transition-colors">
                <Square className="w-5 h-5 fill-current" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => startTimer(task.id)}
              disabled={task.completed}
              className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-accent hover:bg-accent/10 transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-gray-400"
            >
              <Play className="w-5 h-5 ml-1" />
            </button>
          )}
          
          <button onClick={() => setExpanded(!expanded)} className="p-2 text-gray-400 hover:text-white">
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10 bg-black/20"
          >
            <div className="p-4 pl-14">
              <div className="space-y-2 mb-4">
                {task.subtasks.map(st => (
                  <div key={st.id} className="flex items-center gap-3">
                    <button 
                      onClick={() => toggleSubtask(st.id)}
                      className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                        st.completed ? "bg-gray-500 border-gray-500 text-white" : "border-gray-600 text-transparent"
                      )}
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <span className={cn("text-sm", st.completed ? "text-gray-500 line-through" : "text-gray-300")}>
                      {st.title}
                    </span>
                  </div>
                ))}
              </div>
              
              <form onSubmit={addSubtask} className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  placeholder="Add a subtask..."
                  className="glass-input flex-1 px-3 py-1.5 text-sm"
                />
                <button type="submit" className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors">
                  Add
                </button>
              </form>

              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <span className="text-xs text-gray-500">Created {format(task.createdAt, 'MMM d, yyyy')}</span>
                <button 
                  onClick={deleteTask}
                  className="text-red-400 hover:text-red-300 flex items-center gap-1 text-sm px-2 py-1 rounded hover:bg-red-400/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Delete Task
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
