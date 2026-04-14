import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, TextInput, StatusBar, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeStore } from '../../store/themeStore';
import { useProjectStore } from '../../store/projectStore';

const STATUS_FILTERS = ['All', 'Not Started', 'In Progress', 'Completed', 'Payment Pending', 'Overdue'];
const STATUS_COLORS: Record<string, string> = {
  'Not Started': '#9B99B8', 'In Progress': '#6C63FF', 'Completed': '#2ED573',
  'Payment Pending': '#FF8C42', 'Closed': '#9B99B8',
};

export default function Projects() {
  const router = useRouter();
  const { theme, mode } = useThemeStore();
  const { projects, loading, loadProjects } = useProjectStore();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('latest');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { load(); }, [filter, sort]);

  const load = async () => {
    await loadProjects({ status: filter === 'All' ? undefined : filter, search: search || undefined, sort: sort === 'deadline' ? 'deadline' : sort === 'pending' ? 'pending' : undefined });
  };

  const handleRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const filtered = search ? projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.client_name.toLowerCase().includes(search.toLowerCase())) : projects;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.headerBg} />
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Projects</Text>
        <TouchableOpacity onPress={() => router.push('/projects/add')} style={[styles.iconBtn, { backgroundColor: theme.primary }]}>
          <Ionicons name="add" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Ionicons name="search" size={18} color={theme.textSecondary} />
        <TextInput style={[styles.searchInput, { color: theme.text }]} value={search} onChangeText={setSearch}
          onSubmitEditing={load} placeholder="Search projects or clients..." placeholderTextColor={theme.disabled} />
        {search ? <TouchableOpacity onPress={() => { setSearch(''); load(); }}><Ionicons name="close-circle" size={18} color={theme.disabled} /></TouchableOpacity> : null}
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)}
            style={[styles.filterChip, { backgroundColor: filter === f ? theme.primary : theme.surface, borderColor: filter === f ? theme.primary : theme.border }]}>
            <Text style={[styles.filterText, { color: filter === f ? '#FFF' : theme.textSecondary }]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading && !refreshing ? (
        <View style={styles.center}><ActivityIndicator size="large" color={theme.primary} /></View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.primary} colors={[theme.primary]} />}>
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="briefcase-outline" size={56} color={theme.disabled} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No projects found</Text>
              <TouchableOpacity onPress={() => router.push('/projects/add')} style={[styles.addBtn, { backgroundColor: theme.primary }]}>
                <Text style={styles.addBtnText}>Add Project</Text>
              </TouchableOpacity>
            </View>
          ) : filtered.map((p) => (
            <TouchableOpacity key={p.id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => router.push({ pathname: '/projects/[id]', params: { id: p.id } })} activeOpacity={0.8}>
              <View style={styles.cardTop}>
                <View style={styles.cardTitleRow}>
                  <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>{p.name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[p.status] || '#9B99B8') + '20' }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLORS[p.status] || '#9B99B8' }]}>{p.status}</Text>
                  </View>
                </View>
                <Text style={[styles.clientName, { color: theme.textSecondary }]}>{p.client_name}{p.client_company ? ` · ${p.client_company}` : ''}</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <View style={styles.cardBottom}>
                <View style={styles.amountCol}>
                  <Text style={[styles.amountLabel, { color: theme.textSecondary }]}>Total</Text>
                  <Text style={[styles.amountValue, { color: theme.text }]}>₹{p.total_cost?.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.amountCol}>
                  <Text style={[styles.amountLabel, { color: theme.textSecondary }]}>Paid</Text>
                  <Text style={[styles.amountValue, { color: theme.low }]}>₹{(p.total_paid || 0).toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.amountCol}>
                  <Text style={[styles.amountLabel, { color: theme.textSecondary }]}>Pending</Text>
                  <Text style={[styles.amountValue, { color: (p.remaining || 0) > 0 ? theme.high : theme.low }]}>₹{(p.remaining || 0).toLocaleString('en-IN')}</Text>
                </View>
                {p.deadline && (
                  <View style={styles.amountCol}>
                    <Text style={[styles.amountLabel, { color: theme.textSecondary }]}>Deadline</Text>
                    <Text style={[styles.amountValue, { color: (p.overdue_days || 0) > 0 ? theme.high : theme.textSecondary, fontSize: 11 }]}>{p.deadline}</Text>
                  </View>
                )}
              </View>
              {/* Progress bar */}
              <View style={[styles.progressBg, { backgroundColor: theme.border }]}>
                <View style={[styles.progressFill, { backgroundColor: theme.primary, width: `${Math.min(p.payment_pct || 0, 100)}%` as any }]} />
              </View>
              <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>{p.payment_pct || 0}% paid</Text>
            </TouchableOpacity>
          ))}
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
  searchWrap: { flexDirection: 'row', alignItems: 'center', margin: 12, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 10 },
  filterScroll: { maxHeight: 44 },
  filterContent: { paddingHorizontal: 12, gap: 8, alignItems: 'center' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 12, fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 12 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 16 },
  addBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  addBtnText: { color: '#FFF', fontWeight: '700' },
  card: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 12, elevation: 2, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
  cardTop: { gap: 4, marginBottom: 10 },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
  clientName: { fontSize: 13 },
  divider: { height: 1, marginVertical: 10 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  amountCol: { alignItems: 'center', gap: 2 },
  amountLabel: { fontSize: 10, fontWeight: '600' },
  amountValue: { fontSize: 13, fontWeight: '700' },
  progressBg: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },
  progressLabel: { fontSize: 11, marginTop: 4, textAlign: 'right' },
});
