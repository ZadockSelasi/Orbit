import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Note } from '../db';
import { Plus, Trash2, Link as LinkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

export function NotesView() {
  const notes = useLiveQuery(() => db.notes.orderBy('createdAt').reverse().toArray());
  const tasks = useLiveQuery(() => db.tasks.toArray());
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [taskId, setTaskId] = useState<string>('');

  const saveNote = async () => {
    if (!title.trim() && !content.trim()) return;
    
    await db.notes.add({
      id: crypto.randomUUID(),
      title: title || 'Untitled Note',
      content,
      taskId: taskId || undefined,
      createdAt: new Date()
    });
    
    setTitle('');
    setContent('');
    setTaskId('');
    setIsCreating(false);
  };

  const deleteNote = async (id: string) => {
    await db.notes.delete(id);
  };

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Notes</h2>
          <p className="text-gray-400">Capture ideas and link them to tasks.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Note
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        {isCreating && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 mb-6"
          >
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note Title"
              className="w-full bg-transparent text-2xl font-bold text-white mb-4 focus:outline-none placeholder-gray-600"
              autoFocus
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start typing..."
              className="w-full bg-transparent text-gray-300 min-h-[150px] resize-y focus:outline-none placeholder-gray-600 mb-4"
            />
            <div className="flex justify-between items-center border-t border-white/10 pt-4">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-gray-400" />
                <select
                  value={taskId}
                  onChange={(e) => setTaskId(e.target.value)}
                  className="glass-input px-3 py-1.5 text-sm appearance-none bg-transparent"
                >
                  <option value="" className="bg-[#1A1A1A]">No linked task</option>
                  {tasks?.map(t => (
                    <option key={t.id} value={t.id} className="bg-[#1A1A1A]">{t.title}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveNote}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Save Note
                </button>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {notes?.map(note => {
              const linkedTask = tasks?.find(t => t.id === note.taskId);
              return (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="glass-card p-6 flex flex-col relative group"
                >
                  <button 
                    onClick={() => deleteNote(note.id)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <h3 className="text-xl font-bold text-white mb-3 pr-6">{note.title}</h3>
                  <p className="text-gray-300 whitespace-pre-wrap flex-1 mb-4 text-sm line-clamp-6">
                    {note.content}
                  </p>
                  <div className="mt-auto pt-4 border-t border-white/10 flex justify-between items-center">
                    <span className="text-xs text-gray-500">{format(note.createdAt, 'MMM d, yyyy')}</span>
                    {linkedTask && (
                      <div className="flex items-center gap-1 text-xs text-accent bg-accent/10 px-2 py-1 rounded-md border border-accent/20 max-w-[150px]">
                        <LinkIcon className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{linkedTask.title}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        {notes?.length === 0 && !isCreating && (
          <div className="text-center py-20 text-gray-500">
            No notes yet. Create one to capture your thoughts.
          </div>
        )}
      </div>
    </div>
  );
}
