import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';

import { useThemeStore } from '../store/themeStore';
import { useTaskStore } from '../store/taskStore';
import { initDatabase } from '../services/database';
import { requestNotificationPermissions } from '../services/notifications.expo-go';
import TaskCard from '../components/TaskCard';

export default function Index() {
  const router = useRouter();
  const { theme, toggleTheme, mode } = useThemeStore();
  const {
    tasks,
    selectedDate,
    loading,
    loadTasksByDate,
    setSelectedDate,
    toggleComplete,
    deleteTask,
  } = useTaskStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [markedDates, setMarkedDates] = useState<any>({});

  // Initialize app
  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize database
        await initDatabase();
        
        // Request notification permissions (will fail gracefully in Expo Go)
        try {
          const hasPermission = await requestNotificationPermissions();
          if (!hasPermission) {
            console.log('Notifications not available in Expo Go. Build a standalone app for full notification support.');
          }
        } catch (error) {
          console.log('Notifications not supported:', error);
        }
        
        // Load tasks for today
        const today = new Date().toISOString().split('T')[0];
        await loadTasksByDate(today);
      } catch (error) {
        console.error('Initialization error:', error);
        Alert.alert('Error', 'Failed to initialize app');
      }
    };
    
    initialize();
  }, []);

  // Update marked dates when tasks change
  useEffect(() => {
    const marked: any = {};
    
    tasks.forEach((task) => {
      if (!marked[task.date]) {
        marked[task.date] = {
          marked: true,
          dotColor: theme.primary,
        };
      }
    });
    
    // Add selection
    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: theme.primary,
      };
    }
    
    setMarkedDates(marked);
  }, [tasks, selectedDate, theme]);

  const handleDateSelect = async (date: string) => {
    setSelectedDate(date);
    await loadTasksByDate(date);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTasksByDate(selectedDate);
    setRefreshing(false);
  };

  const handleToggleComplete = async (id: string) => {
    await toggleComplete(id);
  };

  const handleDeleteTask = (id: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => await deleteTask(id),
        },
      ]
    );
  };

  const handleEditTask = (task: any) => {
    router.push({
      pathname: '/edit-task',
      params: { taskId: task.id },
    });
  };

  const todayDate = format(new Date(), 'EEEE, MMMM d, yyyy');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Task Reminders</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>{todayDate}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={toggleTheme} style={styles.iconButton}>
            <Ionicons
              name={mode === 'light' ? 'moon-outline' : 'sunny-outline'}
              size={24}
              color={theme.text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/settings')}
            style={styles.iconButton}
          >
            <Ionicons name="settings-outline" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Calendar */}
      <View style={[styles.calendarContainer, { backgroundColor: theme.card }]}>
        <Calendar
          current={selectedDate}
          onDayPress={(day) => handleDateSelect(day.dateString)}
          markedDates={markedDates}
          theme={{
            backgroundColor: theme.card,
            calendarBackground: theme.card,
            textSectionTitleColor: theme.textSecondary,
            selectedDayBackgroundColor: theme.primary,
            selectedDayTextColor: '#FFFFFF',
            todayTextColor: theme.primary,
            dayTextColor: theme.text,
            textDisabledColor: theme.disabled,
            dotColor: theme.primary,
            selectedDotColor: '#FFFFFF',
            arrowColor: theme.primary,
            monthTextColor: theme.text,
            textDayFontWeight: '400',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '500',
          }}
        />
      </View>

      {/* Task List */}
      <View style={styles.taskSection}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Tasks for {selectedDate}</Text>
        
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : tasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={theme.disabled} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No tasks for this date
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.disabled }]}>
              Tap the + button to add a task
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.taskList}
            contentContainerStyle={styles.taskListContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={theme.primary}
              />
            }
          >
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleComplete={handleToggleComplete}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
              />
            ))}
          </ScrollView>
        )}
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => router.push('/add-task')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  calendarContainer: {
    paddingVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  taskSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  taskList: {
    flex: 1,
  },
  taskListContent: {
    paddingBottom: 100,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});