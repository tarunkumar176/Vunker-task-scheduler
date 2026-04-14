import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme, Theme } from '../theme/colors';

type ThemeMode = 'light' | 'dark';

const THEME_KEY = 'app_theme_mode';

interface ThemeState {
  mode: ThemeMode;
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  loadSavedTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'light',
  theme: lightTheme,

  loadSavedTheme: async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      if (saved === 'dark') {
        set({ mode: 'dark', theme: darkTheme });
      } else {
        set({ mode: 'light', theme: lightTheme });
      }
    } catch (_) {}
  },

  toggleTheme: () =>
    set((state) => {
      const newMode = state.mode === 'light' ? 'dark' : 'light';
      AsyncStorage.setItem(THEME_KEY, newMode).catch(() => {});
      return { mode: newMode, theme: newMode === 'dark' ? darkTheme : lightTheme };
    }),

  setTheme: (mode: ThemeMode) => {
    AsyncStorage.setItem(THEME_KEY, mode).catch(() => {});
    set({ mode, theme: mode === 'light' ? lightTheme : darkTheme });
  },
}));
