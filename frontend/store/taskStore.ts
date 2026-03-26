import { create } from 'zustand';
import { Task } from '../services/database';
import * as Database from '../services/database';
import * as NotificationService from '../services/notifications';

interface TaskState {
  tasks: Task[];
  selectedDate: string;
  loading: boolean;
  error: string | null;
  
  // Actions
  loadTasks: () => Promise<void>;
  loadTasksByDate: (date: string) => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'completed' | 'notificationIds'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  setSelectedDate: (date: string) => void;
  clearCompleted: () => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  selectedDate: new Date().toISOString().split('T')[0],
  loading: false,
  error: null,
  
  loadTasks: async () => {
    set({ loading: true, error: null });
    try {
      const tasks = await Database.getTasks();
      set({ tasks, loading: false });
    } catch (error) {
      set({ error: 'Failed to load tasks', loading: false });
      console.error(error);
    }
  },
  
  loadTasksByDate: async (date: string) => {
    set({ loading: true, error: null, selectedDate: date });
    try {
      const tasks = await Database.getTasksByDate(date);
      set({ tasks, loading: false });
    } catch (error) {
      set({ error: 'Failed to load tasks', loading: false });
      console.error(error);
    }
  },
  
  addTask: async (taskData) => {
    set({ loading: true, error: null });
    try {
      // Schedule notifications first
      const tempTask: Task = {
        ...taskData,
        id: 'temp',
        completed: false,
        notificationIds: '[]',
        createdAt: new Date().toISOString(),
      };
      
      const notificationIds = await NotificationService.scheduleTaskNotifications(tempTask);
      
      // Create task with notification IDs
      const newTask = await Database.createTask({
        ...taskData,
        notificationIds: JSON.stringify(notificationIds),
      });
      
      // Reload tasks for the selected date
      const { selectedDate } = get();
      await get().loadTasksByDate(selectedDate);
      
      set({ loading: false });
    } catch (error) {
      set({ error: 'Failed to add task', loading: false });
      console.error(error);
    }
  },
  
  updateTask: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const task = await Database.getTaskById(id);
      if (!task) throw new Error('Task not found');
      
      // If date/time changed, reschedule notifications
      if (updates.date || updates.time) {
        // Cancel old notifications
        await NotificationService.cancelTaskNotifications(task.notificationIds);
        
        // Schedule new notifications
        const updatedTask = { ...task, ...updates } as Task;
        const notificationIds = await NotificationService.scheduleTaskNotifications(updatedTask);
        updates.notificationIds = JSON.stringify(notificationIds);
      }
      
      await Database.updateTask(id, updates);
      
      // Reload tasks
      const { selectedDate } = get();
      await get().loadTasksByDate(selectedDate);
      
      set({ loading: false });
    } catch (error) {
      set({ error: 'Failed to update task', loading: false });
      console.error(error);
    }
  },
  
  deleteTask: async (id) => {
    set({ loading: true, error: null });
    try {
      const task = await Database.getTaskById(id);
      if (task) {
        // Cancel notifications
        await NotificationService.cancelTaskNotifications(task.notificationIds);
      }
      
      await Database.deleteTask(id);
      
      // Reload tasks
      const { selectedDate } = get();
      await get().loadTasksByDate(selectedDate);
      
      set({ loading: false });
    } catch (error) {
      set({ error: 'Failed to delete task', loading: false });
      console.error(error);
    }
  },
  
  toggleComplete: async (id) => {
    set({ loading: true, error: null });
    try {
      const task = get().tasks.find((t) => t.id === id);
      if (!task) throw new Error('Task not found');
      
      const newCompleted = !task.completed;
      
      // If marking as complete, cancel notifications
      if (newCompleted) {
        await NotificationService.cancelTaskNotifications(task.notificationIds);
      }
      
      await Database.toggleTaskComplete(id, newCompleted);
      
      // Reload tasks
      const { selectedDate } = get();
      await get().loadTasksByDate(selectedDate);
      
      set({ loading: false });
    } catch (error) {
      set({ error: 'Failed to toggle task', loading: false });
      console.error(error);
    }
  },
  
  setSelectedDate: (date: string) => {
    set({ selectedDate: date });
  },
  
  clearCompleted: async () => {
    set({ loading: true, error: null });
    try {
      await Database.clearCompletedTasks();
      
      // Reload tasks
      const { selectedDate } = get();
      await get().loadTasksByDate(selectedDate);
      
      set({ loading: false });
    } catch (error) {
      set({ error: 'Failed to clear completed tasks', loading: false });
      console.error(error);
    }
  },
}));