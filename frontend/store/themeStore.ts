import { create } from 'zustand';
import { lightTheme, darkTheme, Theme } from '../theme/colors';

type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'light',
  theme: lightTheme,
  toggleTheme: () =>
    set((state) => ({
      mode: state.mode === 'light' ? 'dark' : 'light',
      theme: state.mode === 'light' ? darkTheme : lightTheme,
    })),
  setTheme: (mode: ThemeMode) =>
    set({
      mode,
      theme: mode === 'light' ? lightTheme : darkTheme,
    }),
}));