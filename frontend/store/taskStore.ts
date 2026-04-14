import { create } from 'zustand';
import * as Database from '../services/database';
import * as NotificationService from '../services/notifications';
import { tasksApi } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Task {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
  notificationIds: string;
  recurrence: string;
  recurrenceDays: string;
  createdAt?: string;
}

interface TaskState {
  tasks: Task[];
  selectedDate: string;
  loading: boolean;
  error: string | null;
  loadTasksByDate: (date: string) => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'completed' | 'notificationIds'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  setSelectedDate: (date: string) => void;
  clearCompleted: () => Promise<void>;
  migrateLocalData: () => Promise<{ migrated: number; skipped: number }>;
}

// Map API response (snake_case) to Task (camelCase)
const mapApiTask = (t: any): Task => ({
  id: t.id,
  title: t.title,
  description: t.description || '',
  date: t.date,
  time: t.time,
  priority: t.priority,
  completed: t.completed,
  notificationIds: t.notification_ids || '[]',
  recurrence: t.recurrence || 'none',
  recurrenceDays: t.recurrence_days || '[]',
  createdAt: t.created_at,
});

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  selectedDate: new Date().toISOString().split('T')[0],
  loading: false,
  error: null,

  loadTasksByDate: async (date: string) => {
    set({ loading: true, error: null, selectedDate: date });
    try {
      const data = await tasksApi.getByDate(date);
      set({ tasks: data.map(mapApiTask), loading: false });
    } catch (error) {
      set({ error: 'Failed to load tasks', loading: false });
    }
  },

  addTask: async (taskData) => {
    set({ loading: true, error: null });
    try {
      // Schedule local notifications first (works offline)
      const tempTask: any = { ...taskData, id: 'temp', completed: false, notificationIds: '[]', createdAt: new Date().toISOString() };
      const notificationIds = await NotificationService.scheduleTaskNotifications(tempTask);

      const created = await tasksApi.create({
        title: taskData.title,
        description: taskData.description,
        date: taskData.date,
        time: taskData.time,
        priority: taskData.priority,
        recurrence: taskData.recurrence || 'none',
        recurrence_days: taskData.recurrenceDays || '[]',
        notification_ids: JSON.stringify(notificationIds),
      });

      const { selectedDate } = get();
      await get().loadTasksByDate(selectedDate);
      set({ loading: false });
    } catch (error) {
      set({ error: 'Failed to add task', loading: false });
      throw error;
    }
  },

  updateTask: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const task = get().tasks.find((t) => t.id === id);
      if (!task) throw new Error('Task not found');

      if (updates.date || updates.time) {
        await NotificationService.cancelTaskNotifications(task.notificationIds);
        const updatedTask = { ...task, ...updates };
        const notificationIds = await NotificationService.scheduleTaskNotifications(updatedTask as any);
        updates.notificationIds = JSON.stringify(notificationIds);
      }

      await tasksApi.update(id, {
        title: updates.title,
        description: updates.description,
        date: updates.date,
        time: updates.time,
        priority: updates.priority,
        completed: updates.completed,
        notification_ids: updates.notificationIds,
      });

      const { selectedDate } = get();
      await get().loadTasksByDate(selectedDate);
      set({ loading: false });
    } catch (error) {
      set({ error: 'Failed to update task', loading: false });
      throw error;
    }
  },

  deleteTask: async (id) => {
    set({ loading: true, error: null });
    try {
      const task = get().tasks.find((t) => t.id === id);
      if (task) await NotificationService.cancelTaskNotifications(task.notificationIds);
      await tasksApi.delete(id);
      const { selectedDate } = get();
      await get().loadTasksByDate(selectedDate);
      set({ loading: false });
    } catch (error) {
      set({ error: 'Failed to delete task', loading: false });
    }
  },

  toggleComplete: async (id) => {
    set({ loading: true, error: null });
    try {
      const task = get().tasks.find((t) => t.id === id);
      if (!task) throw new Error('Task not found');
      const newCompleted = !task.completed;
      if (newCompleted) await NotificationService.cancelTaskNotifications(task.notificationIds);
      await tasksApi.update(id, { completed: newCompleted });
      const { selectedDate } = get();
      await get().loadTasksByDate(selectedDate);
      set({ loading: false });
    } catch (error) {
      set({ error: 'Failed to toggle task', loading: false });
    }
  },

  setSelectedDate: (date) => set({ selectedDate: date }),

  clearCompleted: async () => {
    set({ loading: true, error: null });
    try {
      await tasksApi.clearCompleted();
      const { selectedDate } = get();
      await get().loadTasksByDate(selectedDate);
      set({ loading: false });
    } catch (error) {
      set({ error: 'Failed to clear tasks', loading: false });
    }
  },

  migrateLocalData: async () => {
    try {
      const alreadyMigrated = await AsyncStorage.getItem('local_data_migrated');
      if (alreadyMigrated === 'true') return { migrated: 0, skipped: 0 };

      await Database.initDatabase();
      const localTasks = await Database.getTasks();
      if (localTasks.length === 0) {
        await AsyncStorage.setItem('local_data_migrated', 'true');
        return { migrated: 0, skipped: 0 };
      }

      const payload = localTasks.map((t) => ({
        title: t.title,
        description: t.description,
        date: t.date,
        time: t.time,
        priority: t.priority,
        recurrence: t.recurrence,
        recurrence_days: t.recurrenceDays,
        notification_ids: t.notificationIds,
        migrated_local_id: t.id,
      }));

      const result = await tasksApi.migrate(payload);
      await AsyncStorage.setItem('local_data_migrated', 'true');
      return result;
    } catch (e) {
      console.error('Migration failed:', e);
      return { migrated: 0, skipped: 0 };
    }
  },
}));
