import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, StatusBar, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeStore } from '../../store/themeStore';
import { maintenanceApi } from '../../services/api';

const CYCLE_COLORS: Record<string, string> = { Monthly: '#6C63FF', Quarterly: '#FF8C42', 'Half Yearly': '#FF6B6B', Yearly: '#2ED573' };

export default function MaintenanceList() {
  const router = useRouter();
  const { theme, mode } = useThemeStore();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');

  const load = async () => {
    try {
      const data = await maintenanceApi.getUpcoming();
      setContracts(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === 'All' ? contracts
    : filter === 'Overdue' ? contracts.filter((c) => c.days_left < 0)
    : filter === 'Due Soon' ? contracts.filter((c) => c.days_left >= 0 && c.days_left <= 7)
    : contracts;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.headerBg} />
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Maintenance</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {['All', 'Due Soon', 'Overdue'].map((f) => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)}
            style={[styles.chip, { backgroundColor: filter === f ? theme.primary : theme.surface, borderColor: filter === f ? theme.primary : theme.border }]}>
            <Text style={[styles.chipText, { color: filter === f ? '#FFF' : theme.textSecondary }]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={theme.primary} /></View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={theme.primary} colors={[theme.primary]} />}>
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="refresh-circle-outline" size={56} color={theme.disabled} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No upcoming renewals</Text>
              <Text style={[styles.emptySub, { color: theme.disabled }]}>Renewals due in the next 30 days appear here</Text>
            </View>
          ) : filtered.map((c) => {
            const isOverdue = c.days_left < 0;
            const isDueSoon = c.days_left >= 0 && c.days_left <= 7;
            const cycleColor = CYCLE_COLORS[c.billing_cycle] || theme.primary;
            return (
              <TouchableOpacity key={c.id} style={[styles.card, { backgroundColor: theme.card, borderColor: isOverdue ? theme.high + '60' : theme.border }]}
                onPress={() => router.push({ pathname: '/maintenance/[id]', params: { id: c.id } })} activeOpacity={0.8}>
                <View style={styles.cardTop}>
                  <View style={styles.cardTitleRow}>
                    <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>{c.project_name}</Text>
                    <View style={[styles.badge, { backgroundColor: isOverdue ? theme.high + '20' : isDueSoon ? theme.warning + '20' : theme.low + '20' }]}>
                      <Text style={[styles.badgeText, { color: isOverdue ? theme.high : isDueSoon ? theme.warning : theme.low }]}>
                        {isOverdue ? `${Math.abs(c.days_left)}d overdue` : c.days_left === 0 ? 'Due today' : `${c.days_left}d left`}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.planName, { color: theme.textSecondary }]}>{c.plan_name || 'Maintenance Contract'}</Text>
                </View>
                <View style={styles.cardBottom}>
                  <View style={[styles.cyclePill, { backgroundColor: cycleColor + '18' }]}>
                    <Ionicons name="repeat" size={12} color={cycleColor} />
                    <Text style={[styles.cycleText, { color: cycleColor }]}>{c.billing_cycle}</Text>
                  </View>
                  <Text style={[styles.cost, { color: theme.text }]}>₹{c.cost?.toLocaleString('en-IN')}</Text>
                  <Text style={[styles.dueDate, { color: theme.textSecondary }]}>Due: {c.next_due_date}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  iconBtn: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  filterScroll: { maxHeight: 48 },
  filterContent: { paddingHorizontal: 12, gap: 8, alignItems: 'center' },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 12 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 16, fontWeight: '600' },
  emptySub: { fontSize: 13, textAlign: 'center', paddingHorizontal: 32 },
  card: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 12, elevation: 2, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
  cardTop: { marginBottom: 10 },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: '700', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  planName: { fontSize: 13 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cyclePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  cycleText: { fontSize: 11, fontWeight: '600' },
  cost: { fontSize: 15, fontWeight: '800', flex: 1 },
  dueDate: { fontSize: 12 },
});
