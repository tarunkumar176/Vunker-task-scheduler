import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useThemeStore } from '../store/themeStore';

export default function RootLayout() {
  const { mode } = useThemeStore();

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="home" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="add-task" />
        <Stack.Screen name="edit-task" />
        <Stack.Screen name="tasks/index" />
        <Stack.Screen name="projects/index" />
        <Stack.Screen name="projects/add" />
        <Stack.Screen name="projects/[id]" />
        <Stack.Screen name="maintenance/index" />
        <Stack.Screen name="maintenance/[id]" />
      </Stack>
    </>
  );
}
