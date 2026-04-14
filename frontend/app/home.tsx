import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { useTaskStore } from '../store/taskStore';
import { dashboardApi } from '../services/api';
import { format } from 'date-fns';

export default function Home() {
  const router = useRouter();
  const { theme, mode, toggleTheme } = useThemeStore();
  const { user, logout } = useAuthStore();
  const { migrateLocalData } = useTaskStore();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
    runMigration();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await dashboardApi.get();
      setDashboard(data);
    } catch (e) {
      console.log('Dashboard load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const runMigration = async () => {
    try {
      const result = await migrateLocalData();
      if (result.migrated > 0) {
        Alert.alert('Data Migrated', `${result.migrated} local tasks have been synced to your account.`);
      }
    } catch (_) {}
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await logout(); router.replace('/login'); } },
    ]);
  };

  const modules = [
    { icon: 'calendar', label: 'Task Scheduler', subtitle: 'Reminders & calendar', color: '#6C63FF', bg: '#6C63FF18', route: '/tasks/index' },
    { icon: 'briefcase', label: 'Projects', subtitle: 'Finance & payments', color: '#FF6B6B', bg: '#FF6B6B18', route: '/projects/index' },
    { icon: 'refresh-circle', label: 'Maintenance', subtitle: 'Renewals & contracts', color: '#2ED573', bg: '#2ED57318', route: '/maintenance/index' },
    { icon: 'settings', label: 'Settings', subtitle: 'Theme & preferences', color: '#FF8C42', bg: '#FF8C4218', route: '/settings' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.headerBg} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.logoMark, { backgroundColor: theme.primary }]}>
            <Ionicons name="grid" size={18} color="#FFF" />
          </View>
          <View>
            <Text style={[styles.appName, { color: theme.primary }]}>Vynker Scheduler</Text>
            <Text style={[styles.greeting, { color: theme.textSecondary }]}>
              Hello, {user?.name?.split(' ')[0] || 'there'} 👋
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={toggleTheme} style={[styles.iconBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name={mode === 'light' ? 'moon' : 'sunny'} size={20} color={mode === 'light' ? '#6C63FF' : '#FFB347'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={[styles.iconBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="log-out-outline" size={20} color={theme.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Date */}
        <Text style={[styles.dateText, { color: theme.textSecondary }]}>{format(new Date(), 'EEEE, MMMM d, yyyy')}</Text>

        {/* Stats */}
        {loading ? (
          <ActivityIndicator color={theme.primary} style={{ marginVertical: 20 }} />
        ) : dashboard ? (
          <View style={styles.statsRow}>
            {[
              { label: 'Projects', value: dashboard.total_projects, icon: 'briefcase', color: '#FF6B6B' },
              { label: 'Active', value: dashboard.active_projects, icon: 'play-circle', color: '#6C63FF' },
              { label: 'Tasks Today', value: dashboard.pending_tasks_today, icon: 'checkmark-circle', color: '#2ED573' },
              { label: 'Renewals', value: dashboard.upcoming_renewals?.length || 0, icon: 'refresh-circle', color: '#FF8C42' },
            ].map((s) => (
              <View key={s.label} style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[styles.statIcon, { backgroundColor: s.color + '20' }]}>
                  <Ionicons name={s.icon as any} size={18} color={s.color} />
                </View>
                <Text style={[styles.statValue, { color: theme.text }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Upcoming Renewals Alert */}
        {dashboard?.upcoming_renewals?.length > 0 && (
          <TouchableOpacity
            style={[styles.alertCard, { backgroundColor: '#FF8C4215', borderColor: '#FF8C42' }]}
            onPress={() => router.push('/maintenance/index')}
          >
            <Ionicons name="warning" size={20} color="#FF8C42" />
            <View style={styles.alertText}>
              <Text style={[styles.alertTitle, { color: '#FF8C42' }]}>
                {dashboard.upcoming_renewals.length} renewal{dashboard.upcoming_renewals.length > 1 ? 's' : ''} due soon
              </Text>
              <Text style={[styles.alertSub, { color: theme.textSecondary }]}>Tap to view maintenance</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#FF8C42" />
          </TouchableOpacity>
        )}

        {/* Module Grid */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Modules</Text>
        <View style={styles.grid}>
          {modules.map((m) => (
            <TouchableOpacity
              key={m.label}
              style={[styles.moduleCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => router.push(m.route as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.moduleIcon, { backgroundColor: m.bg }]}>
                <Ionicons name={m.icon as any} size={28} color={m.color} />
              </View>
              <Text style={[styles.moduleLabel, { color: theme.text }]}>{m.label}</Text>
              <Text style={[styles.moduleSub, { color: theme.textSecondary }]}>{m.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoMark: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  appName: { fontSize: 16, fontWeight: '700' },
  greeting: { fontSize: 12, marginTop: 1 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16 },
  dateText: { fontSize: 13, marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 10, alignItems: 'center', gap: 4 },
  statIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  alertCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, gap: 12, marginBottom: 20 },
  alertText: { flex: 1 },
  alertTitle: { fontSize: 14, fontWeight: '700' },
  alertSub: { fontSize: 12, marginTop: 2 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  moduleCard: { width: '47%', borderRadius: 16, borderWidth: 1, padding: 16, gap: 8, elevation: 2, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
  moduleIcon: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  moduleLabel: { fontSize: 15, fontWeight: '700' },
  moduleSub: { fontSize: 12 },
});
