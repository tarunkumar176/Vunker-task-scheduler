import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useThemeStore } from '../store/themeStore';
import { useTaskStore } from '../store/taskStore';
import { getAllScheduledNotifications } from '../services/notifications';

export default function Settings() {
  const router = useRouter();
  const { theme, mode, toggleTheme } = useThemeStore();
  const { clearCompleted } = useTaskStore();

  const handleClearCompleted = () => {
    Alert.alert(
      'Clear Completed Tasks',
      'Are you sure you want to delete all completed tasks?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearCompleted();
            Alert.alert('Success', 'Completed tasks cleared');
          },
        },
      ]
    );
  };

  const handleViewScheduledNotifications = async () => {
    const notifications = await getAllScheduledNotifications();
    Alert.alert(
      'Scheduled Notifications',
      `You have ${notifications.length} scheduled notifications`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>APPEARANCE</Text>
          
          <View style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.settingLeft}>
              <Ionicons
                name={mode === 'light' ? 'sunny' : 'moon'}
                size={24}
                color={theme.primary}
              />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>Dark Mode</Text>
                <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                  {mode === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
                </Text>
              </View>
            </View>
            <Switch
              value={mode === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.disabled, true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>NOTIFICATIONS</Text>
          
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={handleViewScheduledNotifications}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="notifications" size={24} color={theme.primary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>Scheduled Notifications</Text>
                <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                  View all scheduled reminders
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.infoBox, { backgroundColor: theme.primaryLight + '20', borderColor: theme.primary }]}>
            <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
            <Text style={[styles.infoText, { color: theme.primary }]}>
              Each task receives 3 notifications: at task time, 1 hour before, and 10 minutes before.
            </Text>
          </View>
        </View>

        {/* Data Management Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>DATA MANAGEMENT</Text>
          
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={handleClearCompleted}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="trash" size={24} color={theme.error} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.error }]}>Clear Completed Tasks</Text>
                <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                  Delete all completed tasks
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>ABOUT</Text>
          
          <View style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.settingLeft}>
              <Ionicons name="information-circle" size={24} color={theme.primary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>Task Reminder App</Text>
                <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                  Version 1.0.0
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.infoBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              This app stores all your tasks locally on your device. Your data is private and secure.
            </Text>
          </View>
        </View>
      </ScrollView>
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
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
