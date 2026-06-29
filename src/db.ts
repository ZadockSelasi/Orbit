import Dexie, { type EntityTable } from 'dexie';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: Date;
  priority: 'Low' | 'Medium' | 'High';
  completed: boolean;
  subtasks: SubTask[];
  createdAt: Date;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  taskId?: string; // Foreign key to Task
  createdAt: Date;
}

export interface TimeLog {
  id: string;
  taskId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in seconds
  createdAt: Date;
}

const db = new Dexie('ProductivitySuiteDB') as Dexie & {
  tasks: EntityTable<Task, 'id'>;
  notes: EntityTable<Note, 'id'>;
  timeLogs: EntityTable<TimeLog, 'id'>;
};

db.version(1).stores({
  tasks: 'id, dueDate, priority, completed, createdAt',
  notes: 'id, taskId, createdAt',
  timeLogs: 'id, taskId, startTime, createdAt'
});

export { db };
