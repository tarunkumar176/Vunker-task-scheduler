import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeOut, LinearTransition, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useThemeStore } from '../store/themeStore';
import { Task } from '../services/database';

interface TaskCardProps {
  task: Task;
  index: number;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const TaskCard: React.FC<TaskCardProps> = ({ task, index, onToggleComplete, onEdit, onDelete }) => {
  const { theme } = useThemeStore();
  const isCompleted = Boolean(task.completed);
  const scale = useSharedValue(1);

  const priorityConfig = {
    High: { color: theme.high, bg: theme.highBg, icon: 'flame' as const },
    Medium: { color: theme.medium, bg: theme.mediumBg, icon: 'alert-circle' as const },
    Low: { color: theme.low, bg: theme.lowBg, icon: 'checkmark-circle' as const },
  }[task.priority];

  const handlePressIn = () => { scale.value = withSpring(0.97, { damping: 15 }); };
  const handlePressOut = () => { scale.value = withSpring(1, { damping: 15 }); };

  const handleToggle = () => {
    Haptics.impactAsync(isCompleted ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
    onToggleComplete(task.id);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: withTiming(isCompleted ? 0.6 : 1, { duration: 300 }),
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).springify().damping(14)}
      exiting={FadeOut.duration(200)}
      layout={LinearTransition.springify()}
      style={[
        styles.cardContainer,
        animatedStyle,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          shadowColor: theme.shadow,
        },
      ]}
    >
      <View style={[styles.accentBar, { backgroundColor: priorityConfig.color }]} />
      <View style={styles.cardInner}>
        <TouchableOpacity 
          onPress={handleToggle} 
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.checkboxWrap} 
          activeOpacity={0.8}
        >
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
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              onDelete(task.id);
            }}
            style={[styles.actionBtn, { backgroundColor: theme.error + '18' }]}
            activeOpacity={0.7}
          >
            <Ionicons name="trash" size={15} color={theme.error} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    flexDirection: 'row',
  },
  accentBar: { width: 5 },
  cardInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  checkboxWrap: { padding: 4 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flex: 1, gap: 5 },
  title: { fontSize: 16, fontWeight: '700' },
  description: { fontSize: 13, lineHeight: 18 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  pillText: { fontSize: 11, fontWeight: '600' },
  actions: { gap: 8 },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TaskCard;
