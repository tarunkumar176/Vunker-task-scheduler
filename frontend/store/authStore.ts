import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../services/api';

interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userStr = await AsyncStorage.getItem('auth_user');
      if (token && userStr) {
        set({ token, user: JSON.parse(userStr), initialized: true });
      } else {
        set({ initialized: true });
      }
    } catch {
      set({ initialized: true });
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const res = await authApi.login(email, password);
      await AsyncStorage.setItem('auth_token', res.access_token);
      const user = { id: res.user_id, name: res.name, email: res.email };
      await AsyncStorage.setItem('auth_user', JSON.stringify(user));
      set({ token: res.access_token, user, loading: false });
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  register: async (name, email, password) => {
    set({ loading: true });
    try {
      const res = await authApi.register(name, email, password);
      await AsyncStorage.setItem('auth_token', res.access_token);
      const user = { id: res.user_id, name: res.name, email: res.email };
      await AsyncStorage.setItem('auth_user', JSON.stringify(user));
      set({ token: res.access_token, user, loading: false });
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('auth_user');
    set({ user: null, token: null });
  },
}));
