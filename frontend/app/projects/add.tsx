import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useThemeStore } from '../../store/themeStore';
import { useProjectStore } from '../../store/projectStore';

const STATUSES = ['Not Started', 'In Progress', 'Completed', 'Payment Pending', 'Closed'];

export default function AddProject() {
  const router = useRouter();
  const { theme, mode } = useThemeStore();
  const { createProject } = useProjectStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [advancePaid, setAdvancePaid] = useState('');
  const [status, setStatus] = useState('Not Started');
  const [startDate, setStartDate] = useState(new Date());
  const [deadline, setDeadline] = useState(new Date());
  const [milestoneNotes, setMilestoneNotes] = useState('');
  const [showStart, setShowStart] = useState(false);
  const [showDeadline, setShowDeadline] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Required', 'Project name is required'); return; }
    if (!clientName.trim()) { Alert.alert('Required', 'Client name is required'); return; }
    if (!totalCost || isNaN(Number(totalCost))) { Alert.alert('Required', 'Enter a valid total cost'); return; }
    setLoading(true);
    try {
      const project = await createProject({
        name: name.trim(), description: description.trim(),
        client_name: clientName.trim(), client_phone: clientPhone.trim(),
        client_email: clientEmail.trim(), client_company: clientCompany.trim(),
        total_cost: Number(totalCost), advance_paid: Number(advancePaid) || 0,
        status, start_date: format(startDate, 'yyyy-MM-dd'),
        deadline: format(deadline, 'yyyy-MM-dd'), milestone_notes: milestoneNotes.trim(),
      });
      Alert.alert('Project Created', `"${name}" has been added.`, [
        { text: 'View Project', onPress: () => router.replace({ pathname: '/projects/[id]', params: { id: project.id } }) },
        { text: 'Back to Projects', onPress: () => router.replace('/projects') },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create project. Check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const inp = [styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }] as any;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.headerBg} />
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>New Project</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* keyboardShouldPersistTaps="handled" prevents keyboard dismissal on Android */}
      <ScrollView
        contentContainerStyle={styles.form}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
      >
        <Text style={[styles.section, { color: theme.primary }]}>PROJECT INFO</Text>
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>PROJECT NAME *</Text>
          <TextInput style={inp} value={name} onChangeText={setName} placeholder="e.g. E-commerce Website" placeholderTextColor={theme.disabled} />
        </View>
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>DESCRIPTION</Text>
          <TextInput style={[inp, { height: 80 }]} value={description} onChangeText={setDescription} placeholder="Brief description" placeholderTextColor={theme.disabled} multiline textAlignVertical="top" />
        </View>

        <Text style={[styles.section, { color: theme.primary }]}>CLIENT INFO</Text>
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>CLIENT NAME *</Text>
          <TextInput style={inp} value={clientName} onChangeText={setClientName} placeholder="Client full name" placeholderTextColor={theme.disabled} />
        </View>
        <View style={styles.row}>
          <View style={[styles.field, styles.flex]}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>PHONE</Text>
            <TextInput style={inp} value={clientPhone} onChangeText={setClientPhone} placeholder="+91 XXXXX" placeholderTextColor={theme.disabled} keyboardType="phone-pad" />
          </View>
          <View style={[styles.field, styles.flex]}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>COMPANY</Text>
            <TextInput style={inp} value={clientCompany} onChangeText={setClientCompany} placeholder="Company name" placeholderTextColor={theme.disabled} />
          </View>
        </View>
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>EMAIL</Text>
          <TextInput style={inp} value={clientEmail} onChangeText={setClientEmail} placeholder="client@email.com" placeholderTextColor={theme.disabled} keyboardType="email-address" autoCapitalize="none" />
        </View>

        <Text style={[styles.section, { color: theme.primary }]}>FINANCIALS</Text>
        <View style={styles.row}>
          <View style={[styles.field, styles.flex]}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>TOTAL COST (₹) *</Text>
            <TextInput style={inp} value={totalCost} onChangeText={setTotalCost} placeholder="0" placeholderTextColor={theme.disabled} keyboardType="numeric" />
          </View>
          <View style={[styles.field, styles.flex]}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>ADVANCE PAID (₹)</Text>
            <TextInput style={inp} value={advancePaid} onChangeText={setAdvancePaid} placeholder="0" placeholderTextColor={theme.disabled} keyboardType="numeric" />
          </View>
        </View>

        <Text style={[styles.section, { color: theme.primary }]}>TIMELINE</Text>
        <View style={styles.row}>
          <View style={[styles.field, styles.flex]}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>START DATE</Text>
            <TouchableOpacity style={[styles.pickerBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => setShowStart(true)}>
              <Ionicons name="calendar" size={16} color={theme.primary} />
              <Text style={[styles.pickerText, { color: theme.text }]}>{format(startDate, 'MMM d, yyyy')}</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.field, styles.flex]}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>DEADLINE</Text>
            <TouchableOpacity style={[styles.pickerBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => setShowDeadline(true)}>
              <Ionicons name="flag" size={16} color={theme.high} />
              <Text style={[styles.pickerText, { color: theme.text }]}>{format(deadline, 'MMM d, yyyy')}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>MILESTONE NOTES</Text>
          <TextInput style={[inp, { height: 80 }]} value={milestoneNotes} onChangeText={setMilestoneNotes} placeholder="Key milestones..." placeholderTextColor={theme.disabled} multiline textAlignVertical="top" />
        </View>

        <Text style={[styles.section, { color: theme.primary }]}>STATUS</Text>
        <View style={styles.statusRow}>
          {STATUSES.map((s) => (
            <TouchableOpacity key={s} onPress={() => setStatus(s)}
              style={[styles.statusChip, { backgroundColor: status === s ? theme.primary : theme.surface, borderColor: status === s ? theme.primary : theme.border }]}>
              <Text style={[styles.statusText, { color: status === s ? '#FFF' : theme.textSecondary }]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primary, opacity: loading ? 0.6 : 1, marginTop: 24 }]} onPress={handleSave} disabled={loading} activeOpacity={0.85}>
          <Ionicons name="checkmark-circle" size={22} color="#FFF" />
          <Text style={styles.saveBtnText}>{loading ? 'Creating...' : 'Create Project'}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {showStart && <DateTimePicker value={startDate} mode="date" display="default" onChange={(_, d) => { setShowStart(false); if (d) setStartDate(d); }} />}
      {showDeadline && <DateTimePicker value={deadline} mode="date" display="default" onChange={(_, d) => { setShowDeadline(false); if (d) setDeadline(d); }} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, flex: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  iconBtn: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  form: { padding: 16 },
  section: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 12, marginTop: 8 },
  field: { marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14 },
  row: { flexDirection: 'row', gap: 10 },
  pickerBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 11, gap: 8 },
  pickerText: { fontSize: 13, fontWeight: '500' },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  statusText: { fontSize: 12, fontWeight: '600' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 14, gap: 8 },
  saveBtnText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
});
