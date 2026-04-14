import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, StatusBar, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useThemeStore } from '../../store/themeStore';
import { useProjectStore } from '../../store/projectStore';

const PAYMENT_MODES = ['UPI', 'Bank Transfer', 'Cash', 'Card', 'Other'];

export default function MaintenanceDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, mode } = useThemeStore();
  const { currentProject, loading, loadProject, addMaintenancePayment, updateMaintenance } = useProjectStore();
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('Cash');
  const [payInvoice, setPayInvoice] = useState('');
  const [payDate, setPayDate] = useState(new Date());
  const [showPayDate, setShowPayDate] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // id here is the maintenance contract id — we need to find the project
    // The maintenance [id] is the contract id, but we navigate here from project detail
    // We'll use the project store's currentProject if already loaded
  }, [id]);

  const m = currentProject?.maintenance;
  const p = currentProject;

  const handleAddPayment = async () => {
    if (!payAmount || isNaN(Number(payAmount))) { Alert.alert('Error', 'Enter a valid amount'); return; }
    if (!p) return;
    setSaving(true);
    try {
      await addMaintenancePayment(p.id, {
        amount: Number(payAmount), paid_date: format(payDate, 'yyyy-MM-dd'),
        billing_cycle: m?.billing_cycle || 'Monthly', payment_mode: payMode, invoice_note: payInvoice,
      });
      setShowPayModal(false); setPayAmount(''); setPayInvoice(''); setPayMode('Cash');
      Alert.alert('Payment Recorded', `Next due date updated to ${m?.next_due_date}`);
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSaving(false); }
  };

  if (loading || !p || !m) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.center}><ActivityIndicator size="large" color={theme.primary} /></View>
      </SafeAreaView>
    );
  }

  const isOverdue = (m.days_left || 0) < 0;
  const isDueSoon = !isOverdue && (m.days_left || 0) <= 7;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.headerBg} />
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>Maintenance</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Contract Info */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.projectName, { color: theme.text }]}>{p.name}</Text>
          <Text style={[styles.planName, { color: theme.textSecondary }]}>{m.plan_name || 'Maintenance Contract'}</Text>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.infoRow}>
            <View style={styles.infoCol}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>COST</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>₹{m.cost?.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>CYCLE</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{m.billing_cycle}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>RENEWALS</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{m.total_renewals}</Text>
            </View>
          </View>
        </View>

        {/* Next Due */}
        <View style={[styles.card, { backgroundColor: isOverdue ? theme.high + '12' : isDueSoon ? theme.warning + '12' : theme.low + '12', borderColor: isOverdue ? theme.high + '40' : isDueSoon ? theme.warning + '40' : theme.low + '40' }]}>
          <View style={styles.dueRow}>
            <Ionicons name={isOverdue ? 'warning' : 'calendar'} size={24} color={isOverdue ? theme.high : isDueSoon ? theme.warning : theme.low} />
            <View style={styles.dueInfo}>
              <Text style={[styles.dueTitle, { color: isOverdue ? theme.high : isDueSoon ? theme.warning : theme.low }]}>
                {isOverdue ? `${Math.abs(m.days_left || 0)} days overdue` : m.days_left === 0 ? 'Due today!' : `${m.days_left} days until renewal`}
              </Text>
              <Text style={[styles.dueSub, { color: theme.textSecondary }]}>Next due: {m.next_due_date}</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.payBtn, { backgroundColor: isOverdue ? theme.high : theme.primary }]} onPress={() => setShowPayModal(true)}>
            <Ionicons name="cash" size={18} color="#FFF" />
            <Text style={styles.payBtnText}>Record Renewal Payment</Text>
          </TouchableOpacity>
        </View>

        {/* Payment History */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>RENEWAL HISTORY</Text>
          {(!m.payments || m.payments.length === 0) ? (
            <Text style={[styles.emptySmall, { color: theme.disabled }]}>No renewal payments yet</Text>
          ) : [...(m.payments || [])].reverse().map((pay: any) => (
            <View key={pay.id} style={[styles.payRow, { borderBottomColor: theme.border }]}>
              <View style={[styles.payIcon, { backgroundColor: theme.low + '18' }]}>
                <Ionicons name="checkmark-circle" size={18} color={theme.low} />
              </View>
              <View style={styles.payInfo}>
                <Text style={[styles.payAmount, { color: theme.text }]}>₹{pay.amount?.toLocaleString('en-IN')}</Text>
                <Text style={[styles.payMeta, { color: theme.textSecondary }]}>{pay.paid_date} · {pay.payment_mode}</Text>
                <Text style={[styles.payMeta, { color: theme.textSecondary }]}>Next due after: {pay.next_due_date}</Text>
                {pay.invoice_note ? <Text style={[styles.payNote, { color: theme.textSecondary }]}>{pay.invoice_note}</Text> : null}
              </View>
            </View>
          ))}
        </View>

        {m.notes ? (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>SCOPE / NOTES</Text>
            <Text style={[styles.notesText, { color: theme.text }]}>{m.notes}</Text>
          </View>
        ) : null}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Payment Modal */}
      <Modal visible={showPayModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: theme.surface }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Record Renewal Payment</Text>
              <TextInput style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                value={payAmount} onChangeText={setPayAmount} placeholder={`Amount (₹${m.cost?.toLocaleString('en-IN')})`} placeholderTextColor={theme.disabled} keyboardType="numeric" />
              <TouchableOpacity style={[styles.modalInput, { backgroundColor: theme.background, borderColor: theme.border, flexDirection: 'row', alignItems: 'center' }]} onPress={() => setShowPayDate(true)}>
                <Ionicons name="calendar" size={16} color={theme.primary} style={{ marginRight: 8 }} />
                <Text style={{ color: theme.text }}>{format(payDate, 'MMM d, yyyy')}</Text>
              </TouchableOpacity>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {PAYMENT_MODES.map((pm) => (
                    <TouchableOpacity key={pm} onPress={() => setPayMode(pm)}
                      style={[styles.modeChip, { backgroundColor: payMode === pm ? theme.primary : theme.background, borderColor: payMode === pm ? theme.primary : theme.border }]}>
                      <Text style={{ color: payMode === pm ? '#FFF' : theme.textSecondary, fontSize: 12, fontWeight: '600' }}>{pm}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <TextInput style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                value={payInvoice} onChangeText={setPayInvoice} placeholder="Invoice note (optional)" placeholderTextColor={theme.disabled} />
              <View style={styles.modalBtns}>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.border }]} onPress={() => setShowPayModal(false)}>
                  <Text style={{ color: theme.text, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.primary, opacity: saving ? 0.6 : 1 }]} onPress={handleAddPayment} disabled={saving}>
                  <Text style={{ color: '#FFF', fontWeight: '700' }}>{saving ? 'Saving...' : 'Record'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {showPayDate && <DateTimePicker value={payDate} mode="date" display="default" onChange={(_, d) => { setShowPayDate(false); if (d) setPayDate(d); }} />}
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
  card: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 12 },
  projectName: { fontSize: 17, fontWeight: '800', marginBottom: 2 },
  planName: { fontSize: 13, marginBottom: 8 },
  divider: { height: 1, marginVertical: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-around' },
  infoCol: { alignItems: 'center', gap: 4 },
  infoLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  infoValue: { fontSize: 16, fontWeight: '800' },
  dueRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  dueInfo: { flex: 1 },
  dueTitle: { fontSize: 16, fontWeight: '800' },
  dueSub: { fontSize: 13, marginTop: 2 },
  payBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 13, borderRadius: 12, gap: 8 },
  payBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 10 },
  emptySmall: { fontSize: 13, textAlign: 'center', paddingVertical: 12 },
  payRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, gap: 10 },
  payIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  payInfo: { flex: 1 },
  payAmount: { fontSize: 15, fontWeight: '700' },
  payMeta: { fontSize: 12, marginTop: 2 },
  payNote: { fontSize: 12, marginTop: 2, fontStyle: 'italic' },
  notesText: { fontSize: 13, lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  modalInput: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14 },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 4 },
  modalBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  modeChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
});
