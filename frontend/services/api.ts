import AsyncStorage from '@react-native-async-storage/async-storage';

// Production backend on Render
export const API_BASE = 'https://vynker-management-backend.onrender.com';
// For local dev: export const API_BASE = 'http://192.168.x.x:8000';

const getToken = async (): Promise<string | null> => {
  return AsyncStorage.getItem('auth_token');
};

const request = async (method: string, path: string, body?: any, auth = true): Promise<any> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = await getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  // AbortController for timeout — 30 seconds to handle Render cold start
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(`${API_BASE}/api${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Network error' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json();
  } catch (e: any) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') {
      throw new Error('Request timed out. The server may be waking up — please try again in a moment.');
    }
    throw new Error(e.message || 'Network error. Check your internet connection.');
  }
};

export const api = {
  get: (path: string) => request('GET', path),
  post: (path: string, body: any, auth = true) => request('POST', path, body, auth),
  put: (path: string, body: any) => request('PUT', path, body),
  delete: (path: string) => request('DELETE', path),
};

// Auth
export const authApi = {
  register: (name: string, email: string, password: string) =>
    api.post('/auth/register', { name, email, password }, false),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }, false),
  me: () => api.get('/auth/me'),
};

// Tasks
export const tasksApi = {
  getAll: () => api.get('/tasks'),
  getByDate: (date: string) => api.get(`/tasks/date/${date}`),
  create: (task: any) => api.post('/tasks', task),
  update: (id: string, updates: any) => api.put(`/tasks/${id}`, updates),
  delete: (id: string) => api.delete(`/tasks/${id}`),
  clearCompleted: () => api.delete('/tasks/completed/clear'),
  migrate: (tasks: any[]) => api.post('/tasks/migrate', { tasks }),
};

// Projects
export const projectsApi = {
  getAll: (params?: { status?: string; search?: string; sort?: string }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.search) q.set('search', params.search);
    if (params?.sort) q.set('sort', params.sort);
    const qs = q.toString();
    return api.get(`/projects${qs ? '?' + qs : ''}`);
  },
  get: (id: string) => api.get(`/projects/${id}`),
  create: (data: any) => api.post('/projects', data),
  update: (id: string, data: any) => api.put(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  addPayment: (projectId: string, data: any) => api.post(`/projects/${projectId}/payments`, data),
  deletePayment: (projectId: string, paymentId: string) => api.delete(`/projects/${projectId}/payments/${paymentId}`),
  addNote: (projectId: string, note: string) => api.post(`/projects/${projectId}/notes`, { note }),
};

// Maintenance
export const maintenanceApi = {
  create: (projectId: string, data: any) => api.post(`/projects/${projectId}/maintenance`, data),
  get: (projectId: string) => api.get(`/projects/${projectId}/maintenance`),
  update: (projectId: string, data: any) => api.put(`/projects/${projectId}/maintenance`, data),
  addPayment: (projectId: string, data: any) => api.post(`/projects/${projectId}/maintenance/payments`, data),
  getUpcoming: () => api.get('/maintenance/upcoming'),
};

// Expenses
export const expensesApi = {
  getAll: (params?: { month?: string; type?: string; project_id?: string }) => {
    const q = new URLSearchParams();
    if (params?.month) q.set('month', params.month);
    if (params?.type) q.set('type', params.type);
    if (params?.project_id) q.set('project_id', params.project_id);
    const qs = q.toString();
    return api.get(`/expenses${qs ? '?' + qs : ''}`);
  },
  getSummary: (month?: string) => api.get(`/expenses/summary${month ? '?month=' + month : ''}`),
  getMonthlyReport: (year?: string) => api.get(`/expenses/monthly-report${year ? '?year=' + year : ''}`),
  create: (data: any) => api.post('/expenses', data),
  update: (id: string, data: any) => api.put(`/expenses/${id}`, data),
  delete: (id: string) => api.delete(`/expenses/${id}`),
};

// Dashboard
export const dashboardApi = {
  get: () => api.get('/dashboard'),
};
