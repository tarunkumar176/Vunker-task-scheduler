import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal,
  TextInput, Alert, ActivityIndicator, StatusBar, RefreshControl, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useThemeStore } from '../../store/themeStore';
import { expensesApi, projectsApi } from '../../services/api';

const CATEGORIES = [
  'Office Rent', 'Salaries', 'Software & Tools', 'Utilities',
  'Travel', 'Marketing', 'Miscellaneous', 'Other',
];
const RECUR_CYCLES = ['Monthly', 'Quarterly', 'Yearly'];
export default function Expenses() {
  const router = useRouter();
  const { theme, mode } = useThemeStore();

  const [expenses, setExpenses] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [monthDate, setMonthDate] = useState(new Date());

  // Form state
  const [fType, setFType] = useState<'income' | 'expense'>('expense');
  const [fCategory, setFCategory] = useState(CATEGORIES[0]);
  const [fCustomCategory, setFCustomCategory] = useState('');
  const [fAmount, setFAmount] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fDate, setFDate] = useState(new Date());
  const [fShowDate, setFShowDate] = useState(false);
  const [fProjectId, setFProjectId] = useState('');
  const [fRecurring, setFRecurring] = useState(false);
  const [fRecurCycle, setFRecurCycle] = useState('Monthly');
  const [editingId, setEditingId] = useState<string | null>(null);

  useFocusEffect(useCallback(() => { load(); }, [selectedMonth]));

  const load = async () => {
    try {
      const [exp, sum, proj] = await Promise.all([
        expensesApi.getAll({ month: selectedMonth }),
        expensesApi.getSummary(selectedMonth),
        projectsApi.getAll(),
      ]);
      setExpenses(exp);
      setSummary(sum);
      setProjects(proj);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const openAdd = () => {
    setEditingId(null);
    setFType('expense'); setFCategory(CATEGORIES[0]); setFCustomCategory(''); setFAmount('');
    setFDesc(''); setFDate(new Date()); setFProjectId('');
    setFRecurring(false); setFRecurCycle('Monthly');
    setShowModal(true);
  };

  const openEdit = (e: any) => {
    setEditingId(e.id);
    setFType(e.type);
    const isKnown = CATEGORIES.includes(e.category);
    setFCategory(isKnown ? e.category : 'Other');
    setFCustomCategory(isKnown ? '' : e.category);
    setFAmount(e.amount.toString());
    setFDesc(e.description || ''); setFDate(new Date(e.date + 'T12:00:00'));
    setFProjectId(e.project_id || ''); setFRecurring(e.is_recurring);
    setFRecurCycle(e.recur_cycle || 'Monthly');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!fAmount || isNaN(Number(fAmount))) { Alert.alert('Error', 'Enter a valid amount'); return; }
    const finalCategory = fCategory === 'Other' && fCustomCategory.trim() ? fCustomCategory.trim() : fCategory;
    setSaving(true);
    try {
      const payload = {
        type: 'expense', // always expense — income comes from project payments
        category: finalCategory, amount: Number(fAmount),
        description: fDesc, date: format(fDate, 'yyyy-MM-dd'),
        project_id: fProjectId || null, is_recurring: fRecurring,
        recur_cycle: fRecurring ? fRecurCycle : '',
      };
      if (editingId) await expensesApi.update(editingId, payload);
      else await expensesApi.create(payload);
      setShowModal(false);
      await load();
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Remove this entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await expensesApi.delete(id); await load(); } },
    ]);
  };

  const filtered = filterType === 'all' ? expenses : expenses.filter(e => e.type === filterType);

  const monthLabel = format(new Date(selectedMonth + '-01'), 'MMMM yyyy');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.headerBg} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Expenses & Income</Text>
        <TouchableOpacity onPress={openAdd} style={[styles.iconBtn, { backgroundColor: theme.primary }]}>
          <Ionicons name="add" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Month selector */}
      <View style={[styles.monthBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => {
          const d = new Date(selectedMonth + '-01');
          d.setMonth(d.getMonth() - 1);
          setSelectedMonth(format(d, 'yyyy-MM'));
          setMonthDate(d);
        }} style={styles.monthArrow}>
          <Ionicons name="chevron-back" size={22} color={theme.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowMonthPicker(true)}>
          <Text style={[styles.monthLabel, { color: theme.text }]}>{monthLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {
          const d = new Date(selectedMonth + '-01');
          d.setMonth(d.getMonth() + 1);
          setSelectedMonth(format(d, 'yyyy-MM'));
          setMonthDate(d);
        }} style={styles.monthArrow}>
          <Ionicons name="chevron-forward" size={22} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={theme.primary} colors={[theme.primary]} />}>

        {/* Summary cards */}
        {summary && (
          <View style={styles.summaryRow}>
            {[
              { label: 'Income', value: summary.total_income, color: theme.low, icon: 'arrow-down-circle' },
              { label: 'Expense', value: summary.total_expense, color: theme.high, icon: 'arrow-up-circle' },
              { label: summary.profit_loss >= 0 ? 'Profit' : 'Loss', value: Math.abs(summary.profit_loss), color: summary.profit_loss >= 0 ? theme.low : theme.high, icon: summary.profit_loss >= 0 ? 'trending-up' : 'trending-down' },
            ].map((s) => (
              <View key={s.label} style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Ionicons name={s.icon as any} size={22} color={s.color} />
                <Text style={[styles.summaryValue, { color: s.color }]}>₹{s.value.toLocaleString('en-IN')}</Text>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Balance */}
        {summary && (
          <View style={[styles.balanceCard, { backgroundColor: theme.primary + '12', borderColor: theme.primary + '30' }]}>
            <Ionicons name="wallet" size={20} color={theme.primary} />
            <Text style={[styles.balanceLabel, { color: theme.primary }]}>Balance</Text>
            <Text style={[styles.balanceValue, { color: theme.primary }]}>₹{summary.balance.toLocaleString('en-IN')}</Text>
          </View>
        )}

        {/* Filter tabs */}
        <View style={[styles.filterRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {(['all', 'income', 'expense'] as const).map((f) => (
            <TouchableOpacity key={f} onPress={() => setFilterType(f)}
              style={[styles.filterTab, { backgroundColor: filterType === f ? theme.primary : 'transparent' }]}>
              <Text style={[styles.filterText, { color: filterType === f ? '#FFF' : theme.textSecondary }]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Entries */}
        {loading ? (
          <ActivityIndicator color={theme.primary} style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="wallet-outline" size={56} color={theme.disabled} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No entries for {monthLabel}</Text>
            <TouchableOpacity onPress={openAdd} style={[styles.addBtn, { backgroundColor: theme.primary }]}>
              <Text style={styles.addBtnText}>Add Entry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filtered.map((e) => (
            <View key={e.id} style={[styles.entryCard, { backgroundColor: theme.card, borderColor: theme.border, borderLeftColor: e.type === 'income' ? theme.low : theme.high }]}>
              <View style={[styles.entryIcon, { backgroundColor: (e.type === 'income' ? theme.low : theme.high) + '18' }]}>
                <Ionicons name={e.type === 'income' ? 'arrow-down-circle' : 'arrow-up-circle'} size={20} color={e.type === 'income' ? theme.low : theme.high} />
              </View>
              <View style={styles.entryInfo}>
                <Text style={[styles.entryCategory, { color: theme.text }]}>{e.category}</Text>
                {e.description ? <Text style={[styles.entryDesc, { color: theme.textSecondary }]} numberOfLines={1}>{e.description}</Text> : null}
                <View style={styles.entryMeta}>
                  <Text style={[styles.entryDate, { color: theme.textSecondary }]}>{e.date}</Text>
                  {e.project_name && <Text style={[styles.entryProject, { color: theme.primary, backgroundColor: theme.primary + '12' }]}>{e.project_name}</Text>}
                  {e.is_recurring && <Text style={[styles.entryRecur, { color: theme.warning, backgroundColor: theme.warning + '12' }]}>↺ {e.recur_cycle}</Text>}
                </View>
              </View>
              <View style={styles.entryRight}>
                <Text style={[styles.entryAmount, { color: e.type === 'income' ? theme.low : theme.high }]}>
                  {e.type === 'income' ? '+' : '-'}₹{e.amount.toLocaleString('en-IN')}
                </Text>
                <View style={styles.entryActions}>
                  <TouchableOpacity onPress={() => openEdit(e)} style={[styles.entryBtn, { backgroundColor: theme.primary + '15' }]}>
                    <Ionicons name="pencil" size={13} color={theme.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(e.id)} style={[styles.entryBtn, { backgroundColor: theme.error + '15' }]}>
                    <Ionicons name="trash" size={13} color={theme.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: theme.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>{editingId ? 'Edit Expense' : 'Add Expense'}</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Ionicons name="close" size={22} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Amount */}
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>AMOUNT (₹) *</Text>
                <TextInput style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  value={fAmount} onChangeText={setFAmount} placeholder="0" placeholderTextColor={theme.disabled} keyboardType="numeric" />

                {/* Category */}
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>CATEGORY</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: fCategory === 'Other' ? 8 : 14 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {CATEGORIES.map((c) => (
                      <TouchableOpacity key={c} onPress={() => setFCategory(c)}
                        style={[styles.catChip, { backgroundColor: fCategory === c ? theme.primary : theme.background, borderColor: fCategory === c ? theme.primary : theme.border }]}>
                        <Text style={{ color: fCategory === c ? '#FFF' : theme.textSecondary, fontSize: 12, fontWeight: '600' }}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
                {fCategory === 'Other' && (
                  <TextInput style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    value={fCustomCategory} onChangeText={setFCustomCategory}
                    placeholder="Enter custom category name" placeholderTextColor={theme.disabled} />
                )}

                {/* Date */}
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>DATE</Text>
                <TouchableOpacity style={[styles.modalInput, { backgroundColor: theme.background, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', gap: 8 }]}
                  onPress={() => setFShowDate(true)}>
                  <Ionicons name="calendar-outline" size={16} color={theme.primary} />
                  <Text style={{ color: theme.text }}>{format(fDate, 'MMMM d, yyyy')}</Text>
                </TouchableOpacity>

                {/* Project link */}
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>LINK TO PROJECT (optional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={() => setFProjectId('')}
                      style={[styles.catChip, { backgroundColor: !fProjectId ? theme.primary : theme.background, borderColor: !fProjectId ? theme.primary : theme.border }]}>
                      <Text style={{ color: !fProjectId ? '#FFF' : theme.textSecondary, fontSize: 12, fontWeight: '600' }}>None</Text>
                    </TouchableOpacity>
                    {projects.map((p: any) => (
                      <TouchableOpacity key={p.id} onPress={() => setFProjectId(p.id)}
                        style={[styles.catChip, { backgroundColor: fProjectId === p.id ? theme.primary : theme.background, borderColor: fProjectId === p.id ? theme.primary : theme.border }]}>
                        <Text style={{ color: fProjectId === p.id ? '#FFF' : theme.textSecondary, fontSize: 12, fontWeight: '600' }} numberOfLines={1}>{p.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                {/* Description */}
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>DESCRIPTION</Text>
                <TextInput style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  value={fDesc} onChangeText={setFDesc} placeholder="Optional note" placeholderTextColor={theme.disabled} />

                {/* Recurring */}
                <View style={styles.recurRow}>
                  <View style={styles.recurLeft}>
                    <Ionicons name="repeat" size={16} color={fRecurring ? theme.primary : theme.textSecondary} />
                    <Text style={[styles.recurLabel, { color: fRecurring ? theme.primary : theme.textSecondary }]}>Recurring</Text>
                  </View>
                  <TouchableOpacity onPress={() => setFRecurring(!fRecurring)}
                    style={[styles.recurToggle, { backgroundColor: fRecurring ? theme.primary : theme.disabled }]}>
                    <View style={[styles.recurThumb, { left: fRecurring ? 18 : 2 }]} />
                  </TouchableOpacity>
                </View>
                {fRecurring && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {RECUR_CYCLES.map((c) => (
                        <TouchableOpacity key={c} onPress={() => setFRecurCycle(c)}
                          style={[styles.catChip, { backgroundColor: fRecurCycle === c ? theme.primary : theme.background, borderColor: fRecurCycle === c ? theme.primary : theme.border }]}>
                          <Text style={{ color: fRecurCycle === c ? '#FFF' : theme.textSecondary, fontSize: 12, fontWeight: '600' }}>{c}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                )}

                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primary, opacity: saving ? 0.6 : 1 }]}
                  onPress={handleSave} disabled={saving} activeOpacity={0.85}>
                  <Text style={styles.saveBtnText}>{saving ? 'Saving...' : editingId ? 'Update' : 'Add Expense'}</Text>
                </TouchableOpacity>
                <View style={{ height: 16 }} />
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {fShowDate && (
        <DateTimePicker value={fDate} mode="date" display="default"
          onChange={(_, d) => { setFShowDate(false); if (d) setFDate(d); }} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  iconBtn: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  monthBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 10, borderBottomWidth: 1 },
  monthArrow: { padding: 8 },
  monthLabel: { fontSize: 16, fontWeight: '700' },
  scroll: { padding: 14 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  summaryCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, alignItems: 'center', gap: 4, elevation: 2, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
  summaryValue: { fontSize: 15, fontWeight: '800' },
  summaryLabel: { fontSize: 11, fontWeight: '600' },
  balanceCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 14, gap: 8 },
  balanceLabel: { fontSize: 15, fontWeight: '700', flex: 1 },
  balanceValue: { fontSize: 20, fontWeight: '900' },
  filterRow: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginBottom: 14 },
  filterTab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  filterText: { fontSize: 13, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 48, gap: 12 },
  emptyText: { fontSize: 15 },
  addBtn: { paddingHorizontal: 24, paddingVertical: 11, borderRadius: 12, marginTop: 4 },
  addBtnText: { color: '#FFF', fontWeight: '700' },
  entryCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, borderLeftWidth: 4, padding: 12, marginBottom: 10, gap: 10, elevation: 1, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  entryIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  entryInfo: { flex: 1 },
  entryCategory: { fontSize: 14, fontWeight: '700' },
  entryDesc: { fontSize: 12, marginTop: 2 },
  entryMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  entryDate: { fontSize: 11 },
  entryProject: { fontSize: 11, fontWeight: '600', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  entryRecur: { fontSize: 11, fontWeight: '600', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  entryRight: { alignItems: 'flex-end', gap: 6 },
  entryAmount: { fontSize: 15, fontWeight: '800' },
  entryActions: { flexDirection: 'row', gap: 6 },
  entryBtn: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  typeToggle: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginBottom: 14 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 11, gap: 6 },
  typeBtnText: { fontSize: 14, fontWeight: '700' },
  fieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 },
  modalInput: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 14 },
  catChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  recurRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  recurLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recurLabel: { fontSize: 14, fontWeight: '600' },
  recurToggle: { width: 42, height: 24, borderRadius: 12, position: 'relative' },
  recurThumb: { position: 'absolute', width: 20, height: 20, backgroundColor: '#FFF', borderRadius: 10, top: 2 },
  saveBtn: { paddingVertical: 15, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
});
