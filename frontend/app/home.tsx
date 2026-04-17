import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { useTaskStore } from '../store/taskStore';
import { dashboardApi } from '../services/api';
import { format } from 'date-fns';

const MODULE_CONFIG = [
  { icon: 'calendar', label: 'Task Scheduler', subtitle: 'Reminders & calendar', color: '#5B4FE8', shadow: '#3D33C4', route: '/tasks' },
  { icon: 'briefcase', label: 'Projects', subtitle: 'Finance & payments', color: '#FF3D57', shadow: '#CC1F38', route: '/projects' },
  { icon: 'refresh-circle', label: 'Maintenance', subtitle: 'Renewals & contracts', color: '#00C853', shadow: '#008C3A', route: '/maintenance' },
  { icon: 'wallet', label: 'Expenses', subtitle: 'Income & savings', color: '#FF8C00', shadow: '#CC6E00', route: '/expenses' },
  { icon: 'settings-sharp', label: 'Settings', subtitle: 'Theme & preferences', color: '#7B6FFF', shadow: '#5A52CC', route: '/settings' },
];

const STAT_CONFIG = [
  { key: 'total_projects', label: 'Projects', icon: 'briefcase', color: '#FF3D57' },
  { key: 'active_projects', label: 'Active', icon: 'flash', color: '#5B4FE8' },
  { key: 'pending_tasks_today', label: 'Today', icon: 'checkmark-done', color: '#00C853' },
  { key: 'renewals', label: 'Renewals', icon: 'refresh', color: '#FF8C00' },
];

export default function Home() {
  const router = useRouter();
  const { theme, mode, toggleTheme } = useThemeStore();
  const { user, logout } = useAuthStore();
  const { migrateLocalData } = useTaskStore();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => { loadDashboard(); }, []));
  React.useEffect(() => { runMigration(); }, []);

  const loadDashboard = async () => {
    try { const data = await dashboardApi.get(); setDashboard(data); }
    catch (e) { console.log('Dashboard error:', e); }
    finally { setLoading(false); }
  };

  const runMigration = async () => {
    try {
      const result = await migrateLocalData();
      if (result.migrated > 0) Alert.alert('Data Synced', `${result.migrated} local tasks synced to your account.`);
    } catch (_) {}
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await logout(); router.replace('/login' as any); } },
    ]);
  };

  const statValues = dashboard ? [
    dashboard.total_projects,
    dashboard.active_projects,
    dashboard.pending_tasks_today,
    dashboard.upcoming_renewals?.length || 0,
  ] : [0, 0, 0, 0];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.headerBg} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <View style={styles.headerLeft}>
          <View style={styles.logoStack}>
            <View style={[styles.logoShadow, { backgroundColor: theme.primaryDark }]} />
            <View style={[styles.logoFace, { backgroundColor: theme.primary }]}>
              <Ionicons name="grid" size={16} color="#FFF" />
            </View>
          </View>
          <View>
            <Text style={[styles.appName, { color: theme.primary }]}>Vynker</Text>
            <Text style={[styles.greeting, { color: theme.textSecondary }]}>
              Hey {user?.name?.split(' ')[0] || 'there'} 👋
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={toggleTheme} style={[styles.iconBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name={mode === 'light' ? 'moon' : 'sunny'} size={18} color={mode === 'light' ? '#5B4FE8' : '#FFB347'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={[styles.iconBtn, { backgroundColor: theme.error + '15', borderColor: theme.error + '30' }]}>
            <Ionicons name="log-out-outline" size={18} color={theme.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Date banner */}
        <View style={[styles.dateBanner, { backgroundColor: theme.primary + '12', borderColor: theme.primary + '25' }]}>
          <Ionicons name="calendar-outline" size={16} color={theme.primary} />
          <Text style={[styles.dateText, { color: theme.primary }]}>{format(new Date(), 'EEEE, MMMM d, yyyy')}</Text>
        </View>

        {/* Stats row */}
        {loading ? (
          <View style={styles.loadingWrap}><ActivityIndicator color={theme.primary} size="large" /></View>
        ) : (
          <View style={styles.statsRow}>
            {STAT_CONFIG.map((s, i) => (
              <View key={s.key} style={styles.statWrap}>
                <View style={[styles.statShadow, { backgroundColor: s.color + '80' }]} />
                <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={[styles.statIconWrap, { backgroundColor: s.color + '18' }]}>
                    <Ionicons name={s.icon as any} size={20} color={s.color} />
                  </View>
                  <Text style={[styles.statValue, { color: theme.text }]}>{statValues[i]}</Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{s.label}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Renewal alert */}
        {(dashboard?.upcoming_renewals?.length || 0) > 0 && (
          <TouchableOpacity onPress={() => router.push('/maintenance' as any)} activeOpacity={0.85}>
            <View style={styles.alertStack}>
              <View style={[styles.alertShadow, { backgroundColor: '#CC6E00' }]} />
              <View style={[styles.alertCard, { backgroundColor: '#FF8C00', }]}>
                <View style={[styles.alertIconWrap, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Ionicons name="warning" size={20} color="#FFF" />
                </View>
                <View style={styles.alertText}>
                  <Text style={styles.alertTitle}>{dashboard.upcoming_renewals.length} renewal{dashboard.upcoming_renewals.length > 1 ? 's' : ''} due soon</Text>
                  <Text style={styles.alertSub}>Tap to view maintenance →</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Module grid */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Access</Text>
        <View style={styles.grid}>
          {MODULE_CONFIG.map((m) => (
            <TouchableOpacity key={m.label} onPress={() => router.push(m.route as any)} activeOpacity={0.85} style={styles.moduleWrap}>
              <View style={[styles.moduleShadow, { backgroundColor: m.shadow }]} />
              <View style={[styles.moduleCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[styles.moduleIconWrap, { backgroundColor: m.color }]}>
                  <Ionicons name={m.icon as any} size={26} color="#FFF" />
                </View>
                <Text style={[styles.moduleLabel, { color: theme.text }]}>{m.label}</Text>
                <Text style={[styles.moduleSub, { color: theme.textSecondary }]}>{m.subtitle}</Text>
                <View style={[styles.moduleArrow, { backgroundColor: m.color + '18' }]}>
                  <Ionicons name="arrow-forward" size={14} color={m.color} />
                </View>
              </View>
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
  logoStack: { width: 34, height: 34, position: 'relative' },
  logoShadow: { position: 'absolute', width: 34, height: 34, borderRadius: 10, top: 3, left: 3 },
  logoFace: { position: 'absolute', width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', top: 0, left: 0 },
  appName: { fontSize: 17, fontWeight: '900', letterSpacing: 0.5 },
  greeting: { fontSize: 12, marginTop: 1 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16, gap: 16 },
  dateBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  dateText: { fontSize: 13, fontWeight: '600' },
  loadingWrap: { height: 100, justifyContent: 'center', alignItems: 'center' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statWrap: { flex: 1, position: 'relative', height: 100 },
  statShadow: { position: 'absolute', bottom: -4, left: 4, right: -4, height: 100, borderRadius: 16 },
  statCard: { position: 'absolute', top: 0, left: 0, right: 0, height: 100, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 4, elevation: 4, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
  statIconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '900' },
  statLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  alertStack: { position: 'relative', height: 64 },
  alertShadow: { position: 'absolute', bottom: -4, left: 4, right: -4, height: 64, borderRadius: 16 },
  alertCard: { position: 'absolute', top: 0, left: 0, right: 0, height: 64, borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },
  alertIconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  alertText: { flex: 1 },
  alertTitle: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  alertSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: 0.3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  moduleWrap: { width: '47%', position: 'relative', height: 150 },
  moduleShadow: { position: 'absolute', bottom: -5, left: 5, right: -5, height: 150, borderRadius: 20 },
  moduleCard: { position: 'absolute', top: 0, left: 0, right: 0, height: 150, borderRadius: 20, borderWidth: 1, padding: 14, gap: 6, elevation: 6, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 10 },
  moduleIconWrap: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  moduleLabel: { fontSize: 14, fontWeight: '800' },
  moduleSub: { fontSize: 11, flex: 1 },
  moduleArrow: { position: 'absolute', bottom: 12, right: 12, width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
});
