 
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, StatusBar, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useThemeStore } from '../../store/themeStore';
import { useProjectStore } from '../../store/projectStore';

const STATUS_COLORS: Record<string, string> = {
  'Not Started': '#9B99B8', 'In Progress': '#6C63FF', 'Completed': '#2ED573',
  'Payment Pending': '#FF8C42', 'Closed': '#9B99B8',
};
const PAYMENT_MODES = ['UPI', 'Bank Transfer', 'Cash', 'Card', 'Other'];

export default function ProjectDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, mode } = useThemeStore();
  const { currentProject, loading, loadProject, addPayment, deletePayment, addNote, updateProject, deleteProject, createMaintenance } = useProjectStore();

  const [showPayModal, setShowPayModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('Cash');
  const [payNote, setPayNote] = useState('');
  const [payDate, setPayDate] = useState(new Date());
  const [showPayDate, setShowPayDate] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [mPlanName, setMPlanName] = useState('');
  const [mCost, setMCost] = useState('');
  const [mCycle, setMCycle] = useState('Monthly');
  const [mNotes, setMNotes] = useState('');
  const [mStartDate, setMStartDate] = useState(new Date());
  const [showMStart, setShowMStart] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (id) loadProject(id); }, [id]);

  const p = currentProject;

  const handleAddPayment = async () => {
    if (!payAmount || isNaN(Number(payAmount))) { Alert.alert('Error', 'Enter a valid amount'); return; }
    setSaving(true);
    try {
      await addPayment(id!, { amount: Number(payAmount), payment_date: format(payDate, 'yyyy-MM-dd'), payment_mode: payMode, note: payNote });
      setShowPayModal(false); setPayAmount(''); setPayNote(''); setPayMode('Cash');
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSaving(false); }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setSaving(true);
    try { await addNote(id!, noteText.trim()); setShowNoteModal(false); setNoteText(''); }
    catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSaving(false); }
  };

  const handleCreateMaintenance = async () => {
    if (!mCost || isNaN(Number(mCost))) { Alert.alert('Error', 'Enter a valid cost'); return; }
    setSaving(true);
    try {
      await createMaintenance(id!, { plan_name: mPlanName, start_date: format(mStartDate, 'yyyy-MM-dd'), cost: Number(mCost), billing_cycle: mCycle, notes: mNotes });
      setShowMaintenanceModal(false);
      Alert.alert('Maintenance Setup', 'Maintenance contract created successfully.');
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSaving(false); }
  };

  const handleComplete = () => {
    Alert.alert('Complete Project', 'Mark this project as completed?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Complete', onPress: async () => {
        await updateProject(id!, { status: 'Completed' });
        if (!p?.maintenance) {
          Alert.alert('Setup Maintenance?', 'Would you like to set up a maintenance contract for this project?', [
            { text: 'No', style: 'cancel' },
            { text: 'Yes', onPress: () => setShowMaintenanceModal(true) },
          ]);
        }
      }},
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Project', 'This will permanently delete the project and all its data.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteProject(id!); router.back(); } },
    ]);
  };

  if (loading || !p) {
    return <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}><View style={styles.center}><ActivityIndicator size="large" color={theme.primary} /></View></SafeAreaView>;
  }

  const statusColor = STATUS_COLORS[p.status] || '#9B99B8';
  const remaining = p.remaining || 0;
  const pct = p.payment_pct || 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.headerBg} />
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>{p.name}</Text>
        <TouchableOpacity onPress={handleDelete} style={[styles.iconBtn, { backgroundColor: theme.error + '18', borderColor: theme.error + '30' }]}>
          <Ionicons name="trash" size={18} color={theme.error} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Status + Client */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.rowBetween}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{p.status}</Text>
            </View>
            {p.deadline && (
              <Text style={[styles.deadlineText, { color: (p.overdue_days || 0) > 0 ? theme.high : theme.textSecondary }]}>
                {(p.overdue_days || 0) > 0 ? `${p.overdue_days}d overdue` : p.days_to_deadline !== null ? `${p.days_to_deadline}d left` : p.deadline}
              </Text>
            )}
          </View>
          {p.description ? <Text style={[styles.desc, { color: theme.textSecondary }]}>{p.description}</Text> : null}
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>CLIENT</Text>
          <Text style={[styles.clientName, { color: theme.text }]}>{p.client_name}{p.client_company ? ` · ${p.client_company}` : ''}</Text>
          {p.client_phone ? <Text style={[styles.clientInfo, { color: theme.textSecondary }]}>📞 {p.client_phone}</Text> : null}
          {p.client_email ? <Text style={[styles.clientInfo, { color: theme.textSecondary }]}>✉️ {p.client_email}</Text> : null}
        </View>

        {/* Financials */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>FINANCIALS</Text>
          <View style={styles.finRow}>
            {[
              { label: 'Total', value: p.total_cost, color: theme.text },
              { label: 'Paid', value: p.total_paid || 0, color: theme.low },
              { label: 'Pending', value: remaining, color: remaining > 0 ? theme.high : theme.low },
            ].map((f) => (
              <View key={f.label} style={styles.finCol}>
                <Text style={[styles.finLabel, { color: theme.textSecondary }]}>{f.label}</Text>
                <Text style={[styles.finValue, { color: f.color }]}>₹{f.value.toLocaleString('en-IN')}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.progressBg, { backgroundColor: theme.border }]}>
            <View style={[styles.progressFill, { backgroundColor: theme.primary, width: `${Math.min(pct, 100)}%` as any }]} />
          </View>
          <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>{pct}% paid</Text>
        </View>

        {/* Payments */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.rowBetween}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>PAYMENT HISTORY</Text>
            <TouchableOpacity onPress={() => setShowPayModal(true)} style={[styles.addChip, { backgroundColor: theme.primary + '18' }]}>
              <Ionicons name="add" size={14} color={theme.primary} />
              <Text style={[styles.addChipText, { color: theme.primary }]}>Add</Text>
            </TouchableOpacity>
          </View>
          {(!p.payments || p.payments.length === 0) ? (
            <Text style={[styles.emptySmall, { color: theme.disabled }]}>No payments recorded yet</Text>
          ) : p.payments.map((pay) => (
            <View key={pay.id} style={[styles.payRow, { borderBottomColor: theme.border }]}>
              <View style={[styles.payIcon, { backgroundColor: theme.low + '18' }]}>
                <Ionicons name="cash" size={16} color={theme.low} />
              </View>
              <View style={styles.payInfo}>
                <Text style={[styles.payAmount, { color: theme.text }]}>₹{pay.amount.toLocaleString('en-IN')}</Text>
                <Text style={[styles.payMeta, { color: theme.textSecondary }]}>{pay.payment_date} · {pay.payment_mode}</Text>
                {pay.note ? <Text style={[styles.payNote, { color: theme.textSecondary }]}>{pay.note}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => Alert.alert('Delete Payment', 'Remove this payment?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deletePayment(id!, pay.id) },
              ])}>
                <Ionicons name="close-circle" size={18} color={theme.disabled} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Timeline Notes */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.rowBetween}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>TIMELINE NOTES</Text>
            <TouchableOpacity onPress={() => setShowNoteModal(true)} style={[styles.addChip, { backgroundColor: theme.primary + '18' }]}>
              <Ionicons name="add" size={14} color={theme.primary} />
              <Text style={[styles.addChipText, { color: theme.primary }]}>Add</Text>
            </TouchableOpacity>
          </View>
          {p.milestone_notes ? <Text style={[styles.milestoneText, { color: theme.textSecondary }]}>{p.milestone_notes}</Text> : null}
          {(!p.timeline_notes || p.timeline_notes.length === 0) ? (
            <Text style={[styles.emptySmall, { color: theme.disabled }]}>No notes yet</Text>
          ) : p.timeline_notes.map((n) => (
            <View key={n.id} style={[styles.noteRow, { borderLeftColor: theme.primary }]}>
              <Text style={[styles.noteDate, { color: theme.textSecondary }]}>{n.note_date}</Text>
              <Text style={[styles.noteText, { color: theme.text }]}>{n.note}</Text>
            </View>
          ))}
        </View>

        {/* Maintenance */}
        {p.maintenance ? (
          <TouchableOpacity style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push({ pathname: '/maintenance/[id]', params: { id: p.maintenance!.id } })}>
            <View style={styles.rowBetween}>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>MAINTENANCE</Text>
              <View style={[styles.statusBadge, { backgroundColor: '#2ED57320' }]}>
                <Text style={[styles.statusText, { color: '#2ED573' }]}>{p.maintenance.status}</Text>
              </View>
            </View>
            <Text style={[styles.clientName, { color: theme.text }]}>{p.maintenance.plan_name || 'Maintenance Contract'}</Text>
            <Text style={[styles.clientInfo, { color: theme.textSecondary }]}>₹{p.maintenance.cost?.toLocaleString('en-IN')} / {p.maintenance.billing_cycle}</Text>
            {p.maintenance.next_due_date && (
              <Text style={[styles.clientInfo, { color: (p.maintenance.days_left || 0) < 7 ? theme.high : theme.textSecondary }]}>
                Next due: {p.maintenance.next_due_date} {p.maintenance.days_left !== undefined ? `(${p.maintenance.days_left}d)` : ''}
              </Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.card, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '30' }]} onPress={() => setShowMaintenanceModal(true)}>
            <View style={styles.rowCenter}>
              <Ionicons name="refresh-circle" size={22} color={theme.primary} />
              <Text style={[styles.setupText, { color: theme.primary }]}>Setup Maintenance Contract</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Actions */}
        <View style={styles.actionsRow}>
          {p.status !== 'Completed' && p.status !== 'Closed' && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.low + '18', borderColor: theme.low + '40' }]} onPress={handleComplete}>
              <Ionicons name="checkmark-circle" size={18} color={theme.low} />
              <Text style={[styles.actionBtnText, { color: theme.low }]}>Complete</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.primary + '18', borderColor: theme.primary + '40' }]}
            onPress={() => router.push({ pathname: '/projects/add', params: { editId: id } })}>
            <Ionicons name="pencil" size={18} color={theme.primary} />
            <Text style={[styles.actionBtnText, { color: theme.primary }]}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Add Payment Modal */}
      <Modal visible={showPayModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: theme.surface }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Add Payment</Text>
              <TextInput style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                value={payAmount} onChangeText={setPayAmount} placeholder="Amount (₹)" placeholderTextColor={theme.disabled} keyboardType="numeric" />
              <TouchableOpacity style={[styles.modalInput, { backgroundColor: theme.background, borderColor: theme.border, flexDirection: 'row', alignItems: 'center' }]} onPress={() => setShowPayDate(true)}>
                <Ionicons name="calendar" size={16} color={theme.primary} style={{ marginRight: 8 }} />
                <Text style={{ color: theme.text }}>{format(payDate, 'MMM d, yyyy')}</Text>
              </TouchableOpacity>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {PAYMENT_MODES.map((m) => (
                    <TouchableOpacity key={m} onPress={() => setPayMode(m)}
                      style={[styles.modeChip, { backgroundColor: payMode === m ? theme.primary : theme.background, borderColor: payMode === m ? theme.primary : theme.border }]}>
                      <Text style={{ color: payMode === m ? '#FFF' : theme.textSecondary, fontSize: 12, fontWeight: '600' }}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <TextInput style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                value={payNote} onChangeText={setPayNote} placeholder="Note (optional)" placeholderTextColor={theme.disabled} />
              <View style={styles.modalBtns}>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.border }]} onPress={() => setShowPayModal(false)}>
                  <Text style={{ color: theme.text, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.primary, opacity: saving ? 0.6 : 1 }]} onPress={handleAddPayment} disabled={saving}>
                  <Text style={{ color: '#FFF', fontWeight: '700' }}>{saving ? 'Saving...' : 'Add'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Note Modal */}
      <Modal visible={showNoteModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: theme.surface }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Add Timeline Note</Text>
              <TextInput style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border, height: 100 }]}
                value={noteText} onChangeText={setNoteText} placeholder="Enter note..." placeholderTextColor={theme.disabled} multiline textAlignVertical="top" />
              <View style={styles.modalBtns}>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.border }]} onPress={() => setShowNoteModal(false)}>
                  <Text style={{ color: theme.text, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.primary, opacity: saving ? 0.6 : 1 }]} onPress={handleAddNote} disabled={saving}>
                  <Text style={{ color: '#FFF', fontWeight: '700' }}>{saving ? 'Saving...' : 'Add'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Maintenance Setup Modal */}
      <Modal visible={showMaintenanceModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }} keyboardShouldPersistTaps="handled">
              <View style={[styles.modalCard, { backgroundColor: theme.surface }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Setup Maintenance</Text>
                <TextInput style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  value={mPlanName} onChangeText={setMPlanName} placeholder="Plan name (e.g. Annual Support)" placeholderTextColor={theme.disabled} />
                <TextInput style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  value={mCost} onChangeText={setMCost} placeholder="Cost per cycle (₹)" placeholderTextColor={theme.disabled} keyboardType="numeric" />
                <TouchableOpacity style={[styles.modalInput, { backgroundColor: theme.background, borderColor: theme.border, flexDirection: 'row', alignItems: 'center' }]} onPress={() => setShowMStart(true)}>
                  <Ionicons name="calendar" size={16} color={theme.primary} style={{ marginRight: 8 }} />
                  <Text style={{ color: theme.text }}>Start: {format(mStartDate, 'MMM d, yyyy')}</Text>
                </TouchableOpacity>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {['Monthly', 'Quarterly', 'Half Yearly', 'Yearly'].map((c) => (
                      <TouchableOpacity key={c} onPress={() => setMCycle(c)}
                        style={[styles.modeChip, { backgroundColor: mCycle === c ? theme.primary : theme.background, borderColor: mCycle === c ? theme.primary : theme.border }]}>
                        <Text style={{ color: mCycle === c ? '#FFF' : theme.textSecondary, fontSize: 12, fontWeight: '600' }}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
                <TextInput style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  value={mNotes} onChangeText={setMNotes} placeholder="Scope / notes" placeholderTextColor={theme.disabled} />
                <View style={styles.modalBtns}>
                  <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.border }]} onPress={() => setShowMaintenanceModal(false)}>
                    <Text style={{ color: theme.text, fontWeight: '600' }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.primary, opacity: saving ? 0.6 : 1 }]} onPress={handleCreateMaintenance} disabled={saving}>
                    <Text style={{ color: '#FFF', fontWeight: '700' }}>{saving ? 'Saving...' : 'Create'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {showPayDate && <DateTimePicker value={payDate} mode="date" display="default" onChange={(_, d) => { setShowPayDate(false); if (d) setPayDate(d); }} />}
      {showMStart && <DateTimePicker value={mStartDate} mode="date" display="default" onChange={(_, d) => { setShowMStart(false); if (d) setMStartDate(d); }} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  iconBtn: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  scroll: { padding: 14 },
  card: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 12, elevation: 1, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  rowCenter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '700' },
  deadlineText: { fontSize: 12, fontWeight: '600' },
  desc: { fontSize: 13, lineHeight: 19, marginBottom: 8 },
  divider: { height: 1, marginVertical: 10 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 8 },
  clientName: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  clientInfo: { fontSize: 13, marginBottom: 2 },
  finRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  finCol: { alignItems: 'center', gap: 4 },
  finLabel: { fontSize: 11, fontWeight: '600' },
  finValue: { fontSize: 16, fontWeight: '800' },
  progressBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  progressLabel: { fontSize: 11, marginTop: 4, textAlign: 'right' },
  addChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 4 },
  addChipText: { fontSize: 12, fontWeight: '700' },
  emptySmall: { fontSize: 13, textAlign: 'center', paddingVertical: 12 },
  payRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, gap: 10 },
  payIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  payInfo: { flex: 1 },
  payAmount: { fontSize: 15, fontWeight: '700' },
  payMeta: { fontSize: 12, marginTop: 2 },
  payNote: { fontSize: 12, marginTop: 2, fontStyle: 'italic' },
  noteRow: { borderLeftWidth: 3, paddingLeft: 10, marginBottom: 10 },
  noteDate: { fontSize: 11, marginBottom: 2 },
  noteText: { fontSize: 13 },
  milestoneText: { fontSize: 13, marginBottom: 10, lineHeight: 19 },
  setupText: { fontSize: 15, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 13, borderRadius: 12, borderWidth: 1, gap: 6 },
  actionBtnText: { fontSize: 14, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  modalInput: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14 },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 4 },
  modalBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  modeChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
});
