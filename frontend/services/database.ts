import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export interface Task {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  priority: 'High' | 'Medium' | 'Low';
  completed: number; // 0 or 1 (SQLite boolean)
  notificationIds: string; // JSON array of notification IDs
  createdAt: string;
}

// Initialize database
export const initDatabase = async (): Promise<void> => {
  try {
    db = await SQLite.openDatabaseAsync('reminders.db');
    
    // Create tasks table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        priority TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        notificationIds TEXT,
        createdAt TEXT NOT NULL
      );
    `);
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Create a new task
export const createTask = async (task: Omit<Task, 'id' | 'createdAt'>): Promise<Task> => {
  if (!db) throw new Error('Database not initialized');
  
  const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const createdAt = new Date().toISOString();
  
  const newTask: Task = {
    id,
    ...task,
    createdAt,
  };
  
  await db.runAsync(
    `INSERT INTO tasks (id, title, description, date, time, priority, completed, notificationIds, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, task.title, task.description, task.date, task.time, task.priority, 0, task.notificationIds, createdAt]
  );
  
  return newTask;
};

// Get all tasks
export const getTasks = async (): Promise<Task[]> => {
  if (!db) throw new Error('Database not initialized');
  
  const result = await db.getAllAsync<Task>('SELECT * FROM tasks ORDER BY date, time');
  return result;
};

// Get tasks by date
export const getTasksByDate = async (date: string): Promise<Task[]> => {
  if (!db) throw new Error('Database not initialized');
  
  const result = await db.getAllAsync<Task>(
    'SELECT * FROM tasks WHERE date = ? ORDER BY time',
    [date]
  );
  return result;
};

// Get task by ID
export const getTaskById = async (id: string): Promise<Task | null> => {
  if (!db) throw new Error('Database not initialized');
  
  const result = await db.getFirstAsync<Task>('SELECT * FROM tasks WHERE id = ?', [id]);
  return result || null;
};

// Update task
export const updateTask = async (id: string, updates: Partial<Task>): Promise<void> => {
  if (!db) throw new Error('Database not initialized');
  
  const fields = Object.keys(updates)
    .filter((key) => key !== 'id' && key !== 'createdAt')
    .map((key) => `${key} = ?`)
    .join(', ');
  
  const values = Object.entries(updates)
    .filter(([key]) => key !== 'id' && key !== 'createdAt')
    .map(([, value]) => value);
  
  await db.runAsync(`UPDATE tasks SET ${fields} WHERE id = ?`, [...values, id]);
};

// Delete task
export const deleteTask = async (id: string): Promise<void> => {
  if (!db) throw new Error('Database not initialized');
  await db.runAsync('DELETE FROM tasks WHERE id = ?', [id]);
};

// Mark task as complete/incomplete
export const toggleTaskComplete = async (id: string, completed: boolean): Promise<void> => {
  if (!db) throw new Error('Database not initialized');
  await db.runAsync('UPDATE tasks SET completed = ? WHERE id = ?', [completed ? 1 : 0, id]);
};

// Get tasks with marked dates for calendar
export const getMarkedDates = async (): Promise<{ [key: string]: { marked: boolean; dotColor: string } }> => {
  if (!db) throw new Error('Database not initialized');
  
  const tasks = await getTasks();
  const marked: { [key: string]: { marked: boolean; dotColor: string } } = {};
  
  tasks.forEach((task) => {
    if (!marked[task.date]) {
      marked[task.date] = { marked: true, dotColor: '#2196F3' };
    }
  });
  
  return marked;
};

// Clear all completed tasks
export const clearCompletedTasks = async (): Promise<void> => {
  if (!db) throw new Error('Database not initialized');
  await db.runAsync('DELETE FROM tasks WHERE completed = 1');
};