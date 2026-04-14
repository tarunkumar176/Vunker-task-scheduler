import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../store/themeStore';
import { Task } from '../services/database';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onToggleComplete, onEdit, onDelete }) => {
  const { theme } = useThemeStore();
  const isCompleted = Boolean(task.completed);

  const priorityConfig = {
    High: { color: theme.high, bg: theme.highBg, icon: 'flame' as const },
    Medium: { color: theme.medium, bg: theme.mediumBg, icon: 'alert-circle' as const },
    Low: { color: theme.low, bg: theme.lowBg, icon: 'checkmark-circle' as const },
  }[task.priority];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          shadowColor: theme.shadow,
          opacity: isCompleted ? 0.65 : 1,
        },
      ]}
    >
      <View style={[styles.accentBar, { backgroundColor: priorityConfig.color }]} />
      <View style={styles.cardInner}>
        <TouchableOpacity onPress={() => onToggleComplete(task.id)} style={styles.checkboxWrap} activeOpacity={0.7}>
          <View
            style={[
              styles.checkbox,
              {
                borderColor: priorityConfig.color,
                backgroundColor: isCompleted ? priorityConfig.color : 'transparent',
              },
            ]}
          >
            {isCompleted && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
          </View>
        </TouchableOpacity>

        <View style={styles.content}>
          <Text
            style={[
              styles.title,
              { color: theme.text, textDecorationLine: isCompleted ? 'line-through' : 'none' },
            ]}
            numberOfLines={1}
          >
            {task.title}
          </Text>
          {task.description ? (
            <Text style={[styles.description, { color: theme.textSecondary }]} numberOfLines={2}>
              {task.description}
            </Text>
          ) : null}
          <View style={styles.meta}>
            <View style={[styles.pill, { backgroundColor: theme.primary + '18' }]}>
              <Ionicons name="time-outline" size={12} color={theme.primary} />
              <Text style={[styles.pillText, { color: theme.primary }]}>{task.time}</Text>
            </View>
            <View style={[styles.pill, { backgroundColor: priorityConfig.bg }]}>
              <Ionicons name={priorityConfig.icon} size={12} color={priorityConfig.color} />
              <Text style={[styles.pillText, { color: priorityConfig.color }]}>{task.priority}</Text>
            </View>
            {task.recurrence !== 'none' && (
              <View style={[styles.pill, { backgroundColor: theme.surface }]}>
                <Ionicons name="repeat" size={12} color={theme.textSecondary} />
                <Text style={[styles.pillText, { color: theme.textSecondary }]}>{task.recurrence}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => onEdit(task)}
            style={[styles.actionBtn, { backgroundColor: theme.primary + '18' }]}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil" size={15} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onDelete(task.id)}
            style={[styles.actionBtn, { backgroundColor: theme.error + '18' }]}
            activeOpacity={0.7}
          >
            <Ionicons name="trash" size={15} color={theme.error} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    flexDirection: 'row',
  },
  accentBar: { width: 4 },
  cardInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  checkboxWrap: { padding: 2 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flex: 1, gap: 4 },
  title: { fontSize: 15, fontWeight: '600' },
  description: { fontSize: 13, lineHeight: 18 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  pillText: { fontSize: 11, fontWeight: '600' },
  actions: { gap: 6 },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TaskCard;
