import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parseISO } from 'date-fns';

import { useThemeStore } from '../store/themeStore';
import { useTaskStore } from '../store/taskStore';
import { getTaskById } from '../services/database';
import { Task } from '../services/database';

type Priority = 'High' | 'Medium' | 'Low';

export default function EditTask() {
  const router = useRouter();
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const { theme } = useThemeStore();
  const { updateTask } = useTaskStore();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [task, setTask] = useState<Task | null>(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [priority, setPriority] = useState<Priority>('Medium');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    loadTask();
  }, [taskId]);

  const loadTask = async () => {
    try {
      if (!taskId) {
        Alert.alert('Error', 'Invalid task ID');
        router.back();
        return;
      }
      
      const taskData = await getTaskById(taskId as string);
      if (!taskData) {
        Alert.alert('Error', 'Task not found');
        router.back();
        return;
      }
      
      setTask(taskData);
      setTitle(taskData.title);
      setDescription(taskData.description);
      setPriority(taskData.priority);
      
      // Parse date and time
      const taskDate = parseISO(taskData.date);
      const [hours, minutes] = taskData.time.split(':');
      const taskTime = new Date();
      taskTime.setHours(parseInt(hours, 10), parseInt(minutes, 10));
      
      setDate(taskDate);
      setTime(taskTime);
      setLoading(false);
    } catch (error) {
      console.error('Error loading task:', error);
      Alert.alert('Error', 'Failed to load task');
      router.back();
    }
  };

  const handleSave = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }
    
    if (!task) return;
    
    setSaving(true);
    try {
      const taskDate = format(date, 'yyyy-MM-dd');
      const taskTime = format(time, 'HH:mm');
      
      await updateTask(task.id, {
        title: title.trim(),
        description: description.trim(),
        date: taskDate,
        time: taskTime,
        priority,
      });
      
      Alert.alert('Success', 'Task updated successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update task');
      console.error(error);
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Task</Text>
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
              <Text style={[styles.pickerText, { color: theme.text }]}>
                {format(date, 'EEEE, MMMM d, yyyy')}
              </Text>
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
              <Text style={[styles.pickerText, { color: theme.text }]}>
                {format(time, 'hh:mm a')}
              </Text>
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

          {/* Info */}
          <View style={[styles.infoBox, { backgroundColor: theme.primaryLight + '20', borderColor: theme.primary }]}>
            <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
            <Text style={[styles.infoText, { color: theme.primary }]}>
              Updating the date or time will reschedule your notifications.
            </Text>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: theme.primary, opacity: saving ? 0.6 : 1 },
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Updating...' : 'Update Task'}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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