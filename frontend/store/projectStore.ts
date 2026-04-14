import { create } from 'zustand';
import { projectsApi, maintenanceApi } from '../services/api';

export interface Project {
  id: string;
  name: string;
  description?: string;
  client_name: string;
  client_phone?: string;
  client_email?: string;
  client_company?: string;
  total_cost: number;
  advance_paid: number;
  start_date?: string;
  deadline?: string;
  milestone_notes?: string;
  status: string;
  total_paid?: number;
  remaining?: number;
  payment_pct?: number;
  overdue_days?: number;
  days_to_deadline?: number;
  payment_count?: number;
  payments?: Payment[];
  timeline_notes?: TimelineNote[];
  maintenance?: MaintenanceContract | null;
  created_at?: string;
}

export interface Payment {
  id: string;
  project_id: string;
  amount: number;
  payment_date: string;
  payment_mode: string;
  note?: string;
}

export interface TimelineNote {
  id: string;
  project_id: string;
  note: string;
  created_at: string;
}

export interface MaintenanceContract {
  id: string;
  project_id: string;
  plan_name: string;
  start_date: string;
  cost: number;
  billing_cycle: string;
  notes?: string;
  status: string;
  next_due_date?: string;
  total_renewals: number;
  days_left?: number;
  overdue_days?: number;
  payments?: MaintenancePayment[];
}

export interface MaintenancePayment {
  id: string;
  contract_id: string;
  amount: number;
  paid_date: string;
  billing_cycle_covered: string;
  payment_mode: string;
  invoice_note?: string;
  next_due_date: string;
}

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;
  loadProjects: (params?: { status?: string; search?: string; sort?: string }) => Promise<void>;
  loadProject: (id: string) => Promise<void>;
  createProject: (data: Partial<Project>) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addPayment: (projectId: string, data: Partial<Payment>) => Promise<void>;
  deletePayment: (projectId: string, paymentId: string) => Promise<void>;
  addNote: (projectId: string, note: string) => Promise<void>;
  createMaintenance: (projectId: string, data: Partial<MaintenanceContract>) => Promise<void>;
  updateMaintenance: (projectId: string, data: Partial<MaintenanceContract>) => Promise<void>;
  addMaintenancePayment: (projectId: string, data: Partial<MaintenancePayment>) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  loading: false,
  error: null,

  loadProjects: async (params) => {
    set({ loading: true, error: null });
    try {
      const data = await projectsApi.getAll(params);
      set({ projects: data, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  loadProject: async (id) => {
    set({ loading: true, error: null });
    try {
      const data = await projectsApi.get(id);
      set({ currentProject: data, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  createProject: async (data) => {
    set({ loading: true, error: null });
    try {
      const project = await projectsApi.create(data);
      await get().loadProjects();
      set({ loading: false });
      return project;
    } catch (e: any) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },

  updateProject: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await projectsApi.update(id, data);
      await get().loadProject(id);
      set({ loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },

  deleteProject: async (id) => {
    set({ loading: true, error: null });
    try {
      await projectsApi.delete(id);
      await get().loadProjects();
      set({ loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },

  addPayment: async (projectId, data) => {
    set({ loading: true, error: null });
    try {
      await projectsApi.addPayment(projectId, data);
      await get().loadProject(projectId);
      set({ loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },

  deletePayment: async (projectId, paymentId) => {
    set({ loading: true, error: null });
    try {
      await projectsApi.deletePayment(projectId, paymentId);
      await get().loadProject(projectId);
      set({ loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },

  addNote: async (projectId, note) => {
    set({ loading: true, error: null });
    try {
      await projectsApi.addNote(projectId, note);
      await get().loadProject(projectId);
      set({ loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },

  createMaintenance: async (projectId, data) => {
    set({ loading: true, error: null });
    try {
      await maintenanceApi.create(projectId, data);
      await get().loadProject(projectId);
      set({ loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },

  updateMaintenance: async (projectId, data) => {
    set({ loading: true, error: null });
    try {
      await maintenanceApi.update(projectId, data);
      await get().loadProject(projectId);
      set({ loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },

  addMaintenancePayment: async (projectId, data) => {
    set({ loading: true, error: null });
    try {
      await maintenanceApi.addPayment(projectId, data);
      await get().loadProject(projectId);
      set({ loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },
}));
