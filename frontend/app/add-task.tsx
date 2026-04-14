import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

import { useThemeStore } from '../store/themeStore';
import { useTaskStore } from '../store/taskStore';
import { RecurrenceType } from '../services/database';

type Priority = 'High' | 'Medium' | 'Low';
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AddTask() {
  const router = useRouter();
  const { theme, mode } = useThemeStore();
  const { addTask } = useTaskStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [priority, setPriority] = useState<Priority>('Medium');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleDay = (dayIndex: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayIndex) ? prev.filter((d) => d !== dayIndex) : [...prev, dayIndex].sort()
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a task title');
      return;
    }
    if (recurrence === 'weekly' && selectedDays.length === 0) {
      Alert.alert('Select Days', 'Please select at least one day for weekly recurrence');
      return;
    }
    setLoading(true);
    try {
      await addTask({
        title: title.trim(),
        description: description.trim(),
        date: format(date, 'yyyy-MM-dd'),
        time: format(time, 'HH:mm'),
        priority,
        recurrence,
        recurrenceDays: JSON.stringify(selectedDays),
      });
      Alert.alert('Task Created', 'Your task has been scheduled with reminders.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const priorityConfig = {
    High: { color: theme.high, bg: theme.highBg, icon: 'flame' as const },
    Medium: { color: theme.medium, bg: theme.mediumBg, icon: 'alert-circle' as const },
    Low: { color: theme.low, bg: theme.lowBg, icon: 'checkmark-circle' as const },
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.headerBg} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>New Task</Text>
        <View style={{ width: 38 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>

          {/* Title */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>TASK TITLE *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              value={title}
              onChangeText={setTitle}
              placeholder="What do you need to do?"
              placeholderTextColor={theme.disabled}
            />
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>DESCRIPTION</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add details (optional)"
              placeholderTextColor={theme.disabled}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Date & Time Row */}
          <View style={styles.row}>
            <View style={[styles.field, styles.flex]}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>DATE *</Text>
              <TouchableOpacity
                style={[styles.pickerBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar" size={18} color={theme.primary} />
                <Text style={[styles.pickerText, { color: theme.text }]}>{format(date, 'MMM d, yyyy')}</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.field, styles.flex]}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>TIME *</Text>
              <TouchableOpacity
                style={[styles.pickerBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons name="time" size={18} color={theme.primary} />
                <Text style={[styles.pickerText, { color: theme.text }]}>{format(time, 'hh:mm a')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Priority */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>PRIORITY *</Text>
            <View style={styles.row}>
              {(['High', 'Medium', 'Low'] as Priority[]).map((p) => {
                const cfg = priorityConfig[p];
                const isSelected = priority === p;
                return (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityBtn,
                      styles.flex,
                      {
                        backgroundColor: isSelected ? cfg.color : theme.surface,
                        borderColor: isSelected ? cfg.color : theme.border,
                      },
                    ]}
                    onPress={() => setPriority(p)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={cfg.icon} size={16} color={isSelected ? '#FFFFFF' : cfg.color} />
                    <Text style={[styles.priorityBtnText, { color: isSelected ? '#FFFFFF' : cfg.color }]}>{p}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Recurrence */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>REPEAT</Text>
            <View style={styles.row}>
              {(['none', 'daily', 'weekly'] as RecurrenceType[]).map((r) => {
                const isSelected = recurrence === r;
                const label = { none: 'Once', daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' }[r];
                return (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.recurrenceBtn,
                      styles.flex,
                      {
                        backgroundColor: isSelected ? theme.primary : theme.surface,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                    onPress={() => { setRecurrence(r); if (r !== 'weekly') setSelectedDays([]); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.recurrenceBtnText, { color: isSelected ? '#FFFFFF' : theme.textSecondary }]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Weekly day selector */}
          {recurrence === 'weekly' && (
            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>SELECT DAYS *</Text>
              <View style={styles.daysRow}>
                {WEEKDAYS.map((day, index) => {
                  const isSelected = selectedDays.includes(index);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dayBtn,
                        {
                          backgroundColor: isSelected ? theme.primary : theme.surface,
                          borderColor: isSelected ? theme.primary : theme.border,
                        },
                      ]}
                      onPress={() => toggleDay(index)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.dayBtnText, { color: isSelected ? '#FFFFFF' : theme.textSecondary }]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Notification info */}
          <View style={[styles.infoCard, { backgroundColor: theme.primary + '12', borderColor: theme.primary + '30' }]}>
            <Ionicons name="notifications" size={18} color={theme.primary} />
            <Text style={[styles.infoText, { color: theme.primary }]}>
              You'll get reminders at 8 AM on the day, 1 hour before, 10 minutes before, and at task time.
            </Text>
          </View>

          <View style={{ height: 16 }} />
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: theme.primary, opacity: loading ? 0.6 : 1 }]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
            <Text style={styles.saveBtnText}>{loading ? 'Creating...' : 'Create Task'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {showDatePicker && (
        <DateTimePicker value={date} mode="date" display="default" onChange={(_, d) => { setShowDatePicker(false); if (d) setDate(d); }} minimumDate={new Date()} />
      )}
      {showTimePicker && (
        <DateTimePicker value={time} mode="time" display="default" onChange={(_, t) => { setShowTimePicker(false); if (t) setTime(t); }} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  formContent: { padding: 16 },
  field: { marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 13,
    fontSize: 15,
  },
  textArea: { height: 90 },
  row: { flexDirection: 'row', gap: 10 },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  pickerText: { fontSize: 14, fontWeight: '500', flex: 1 },
  priorityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
  },
  priorityBtnText: { fontSize: 14, fontWeight: '600' },
  recurrenceBtn: {
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  recurrenceBtnText: { fontSize: 13, fontWeight: '600' },
  daysRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  dayBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayBtnText: { fontSize: 11, fontWeight: '700' },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginTop: 4,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 19 },
  footer: { padding: 16, borderTopWidth: 1 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 14,
    gap: 8,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});
