import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, RefreshControl, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { useThemeStore } from '../../store/themeStore';
import { useTaskStore } from '../../store/taskStore';
import TaskCard from '../../components/TaskCard';

export default function Tasks() {
  const router = useRouter();
  const { theme, mode } = useThemeStore();
  const { tasks, selectedDate, loading, loadTasksByDate, setSelectedDate, toggleComplete, deleteTask } = useTaskStore();
  const [refreshing, setRefreshing] = useState(false);
  const [markedDates, setMarkedDates] = useState<any>({});

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    loadTasksByDate(today);
  }, []);

  useEffect(() => {
    const marked: any = {};
    tasks.forEach((task) => {
      if (!marked[task.date]) marked[task.date] = { marked: true, dotColor: theme.primary };
    });
    if (selectedDate) {
      marked[selectedDate] = { ...marked[selectedDate], selected: true, selectedColor: theme.primary };
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

  const handleDelete = (id: string) => {
    Alert.alert('Delete Task', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => await deleteTask(id) },
    ]);
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.headerBg} />
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Task Scheduler</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={[styles.calendarWrapper, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Calendar
          key={mode}
          current={selectedDate}
          onDayPress={(day) => handleDateSelect(day.dateString)}
          markedDates={markedDates}
          theme={{
            backgroundColor: theme.surface, calendarBackground: theme.surface,
            textSectionTitleColor: theme.textSecondary, selectedDayBackgroundColor: theme.primary,
            selectedDayTextColor: '#FFF', todayTextColor: theme.primary, todayBackgroundColor: theme.primary + '25',
            dayTextColor: theme.text, textDisabledColor: theme.disabled, dotColor: theme.primary,
            selectedDotColor: '#FFF', arrowColor: theme.primary, monthTextColor: theme.text,
            textDayFontWeight: '500', textMonthFontWeight: '700', textDayHeaderFontWeight: '600',
            'stylesheet.calendar.header': {
              week: { marginTop: 4, marginBottom: 4, flexDirection: 'row', justifyContent: 'space-around', backgroundColor: theme.surface },
              header: { flexDirection: 'row', justifyContent: 'space-between', paddingLeft: 10, paddingRight: 10, alignItems: 'center', backgroundColor: theme.surface },
            },
            'stylesheet.day.basic': { base: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surface } },
          }}
        />
      </View>

      <View style={styles.taskSection}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{format(new Date(selectedDate + 'T12:00:00'), 'MMMM d, yyyy')}</Text>
            {totalCount > 0 && <Text style={[styles.sectionSub, { color: theme.textSecondary }]}>{completedCount}/{totalCount} completed</Text>}
          </View>
          {totalCount > 0 && (
            <View style={[styles.progressPill, { backgroundColor: theme.primary + '20' }]}>
              <Text style={[styles.progressText, { color: theme.primary }]}>{Math.round((completedCount / totalCount) * 100)}%</Text>
            </View>
          )}
        </View>

        {loading && !refreshing ? (
          <View style={styles.center}><ActivityIndicator size="large" color={theme.primary} /></View>
        ) : tasks.length === 0 ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.primary + '15' }]}>
              <Ionicons name="calendar-outline" size={48} color={theme.primary} />
            </View>
            <Text style={[styles.emptyText, { color: theme.text }]}>No tasks scheduled</Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>Tap + to add a task</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.primary} colors={[theme.primary]} />}>
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task as any} onToggleComplete={toggleComplete} onEdit={(t) => router.push({ pathname: '/edit-task', params: { taskId: t.id } })} onDelete={handleDelete} />
            ))}
          </ScrollView>
        )}
      </View>

      <TouchableOpacity style={[styles.fab, { backgroundColor: theme.primary }]} onPress={() => router.push('/add-task')} activeOpacity={0.85}>
        <Ionicons name="add" size={30} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  iconBtn: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  calendarWrapper: { borderBottomWidth: 1 },
  taskSection: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  sectionSub: { fontSize: 12, marginTop: 2 },
  progressPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  progressText: { fontSize: 13, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80, gap: 12 },
  emptyIcon: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, fontWeight: '700' },
  emptySub: { fontSize: 14 },
  fab: { position: 'absolute', right: 20, bottom: 24, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8 },
});
