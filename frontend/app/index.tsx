import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { requestNotificationPermissions } from '../services/notifications';
export default function Entry() {
  const router = useRouter();
  const { initialize, user, initialized } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    initialize();
    requestNotificationPermissions().catch(() => {});
    useThemeStore.getState().loadSavedTheme();
  }, []);

  useEffect(() => {
    if (!initialized) return;
    if (user) {
      router.replace('/home');
    } else {
      router.replace('/login');
    }
  }, [initialized, user]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
