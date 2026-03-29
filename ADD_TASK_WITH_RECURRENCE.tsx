// This is the new add-task.tsx file with recurrence support
// Copy this to /app/frontend/app/add-task.tsx

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
  const { theme } = useThemeStore();
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
    setSelectedDays(prev =>
      prev.includes(dayIndex)
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex].sort()
    );
  };

  const handleSave = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }
    
    if (recurrence === 'weekly' && selectedDays.length === 0) {
      Alert.alert('Error', 'Please select at least one day for weekly recurrence');
      return;
    }
    
    setLoading(true);
    try {
      const taskDate = format(date, 'yyyy-MM-dd');
      const taskTime = format(time, 'HH:mm');
      
      await addTask({
        title: title.trim(),
        description: description.trim(),
        date: taskDate,
        time: taskTime,
        priority,
        recurrence,
        recurrenceDays: JSON.stringify(selectedDays),
      });
      
      Alert.alert('Success', 'Task created successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create task');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setTime(selectedTime);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Add Task</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
          {/* Title */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.text }]}>Title *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.surface,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter task title"
              placeholderTextColor={theme.disabled}
            />
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.text }]}>Description</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: theme.surface,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter task description"
              placeholderTextColor={theme.disabled}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Date */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.text }]}>Date *</Text>
            <TouchableOpacity
              style={[
                styles.pickerButton,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={theme.primary} />
              <Text style={[styles.pickerText, { color: theme.text }]}>{format(date, 'EEEE, MMMM d, yyyy')}</Text>
            </TouchableOpacity>
          </View>

          {/* Time */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.text }]}>Time *</Text>
            <TouchableOpacity
              style={[
                styles.pickerButton,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time-outline" size={20} color={theme.primary} />
              <Text style={[styles.pickerText, { color: theme.text }]}>{format(time, 'hh:mm a')}</Text>
            </TouchableOpacity>
          </View>

          {/* Priority */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.text }]}>Priority *</Text>
            <View style={styles.priorityContainer}>
              {(['High', 'Medium', 'Low'] as Priority[]).map((p) => {
                const isSelected = priority === p;
                const priorityColor = {
                  High: theme.high,
                  Medium: theme.medium,
                  Low: theme.low,
                }[p];

                return (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityButton,
                      {
                        backgroundColor: isSelected ? priorityColor : theme.surface,
                        borderColor: priorityColor,
                      },
                    ]}
                    onPress={() => setPriority(p)}
                  >
                    <Text
                      style={[
                        styles.priorityButtonText,
                        { color: isSelected ? '#FFFFFF' : priorityColor },
                      ]}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Recurrence */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.text }]}>Repeat</Text>
            <View style={styles.recurrenceContainer}>
              {(['none', 'daily', 'weekly'] as RecurrenceType[]).map((r) => {
                const isSelected = recurrence === r;
                const recurrenceLabel = {
                  none: 'Once',
                  daily: 'Daily',
                  weekly: 'Weekly',
                  monthly: 'Monthly',
                }[r];

                return (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.recurrenceButton,
                      {
                        backgroundColor: isSelected ? theme.primary : theme.surface,
                        borderColor: theme.primary,
                      },
                    ]}
                    onPress={() => {
                      setRecurrence(r);
                      if (r !== 'weekly') setSelectedDays([]);
                    }}
                  >
                    <Text
                      style={[
                        styles.recurrenceButtonText,
                        { color: isSelected ? '#FFFFFF' : theme.primary },
                      ]}
                    >
                      {recurrenceLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Weekly days selection */}
          {recurrence === 'weekly' && (
            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.text }]}>Select Days *</Text>
              <View style={styles.daysContainer}>
                {WEEKDAYS.map((day, index) => {
                  const isSelected = selectedDays.includes(index);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dayButton,
                        {
                          backgroundColor: isSelected ? theme.primary : theme.surface,
                          borderColor: theme.primary,
                        },
                      ]}
                      onPress={() => toggleDay(index)}
                    >
                      <Text
                        style={[
                          styles.dayButtonText,
                          { color: isSelected ? '#FFFFFF' : theme.primary },
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Info */}
          <View style={[styles.infoBox, { backgroundColor: theme.primaryLight + '20', borderColor: theme.primary }]}>
            <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
            <Text style={[styles.infoText, { color: theme.primary }]}>
              {recurrence === 'none' 
                ? 'You\'ll receive reminders 1 hour and 10 minutes before the task time.'
                : recurrence === 'daily'
                ? 'This task will repeat every day at the specified time.'
                : 'This task will repeat on selected days every week.'}
            </Text>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: theme.primary, opacity: loading ? 0.6 : 1 },
            ]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Creating...' : 'Create Task'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={time}
          mode="time"
          display="default"
          onChange={onTimeChange}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  form: {
    flex: 1,
  },
  formContent: {
    padding: 16,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  pickerText: {
    fontSize: 16,
    flex: 1,
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  priorityButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  recurrenceContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  recurrenceButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  recurrenceButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  daysContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  dayButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
