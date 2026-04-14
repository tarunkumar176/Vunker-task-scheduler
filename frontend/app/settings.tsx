import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  StatusBar,
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
    Alert.alert('Clear Completed Tasks', 'This will permanently delete all completed tasks.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await clearCompleted();
          Alert.alert('Done', 'Completed tasks have been cleared.');
        },
      },
    ]);
  };

  const handleViewScheduledNotifications = async () => {
    const notifications = await getAllScheduledNotifications();
    Alert.alert(
      'Scheduled Notifications',
      `You have ${notifications.length} scheduled notification${notifications.length !== 1 ? 's' : ''}.`,
      [{ text: 'OK' }]
    );
  };

  const SettingRow = ({
    icon,
    iconColor,
    title,
    subtitle,
    onPress,
    right,
  }: {
    icon: any;
    iconColor: string;
    title: string;
    subtitle: string;
    onPress?: () => void;
    right?: React.ReactNode;
  }) => (
    <TouchableOpacity
      style={[styles.settingRow, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconColor + '18' }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.settingText}>
        <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={theme.disabled} /> : null)}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.headerBg} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>APPEARANCE</Text>
          <SettingRow
            icon={mode === 'light' ? 'moon' : 'sunny'}
            iconColor={mode === 'light' ? '#6C63FF' : '#FFB347'}
            title="Dark Mode"
            subtitle={mode === 'light' ? 'Currently using light theme' : 'Currently using dark theme'}
            right={
              <Switch
                value={mode === 'dark'}
                onValueChange={toggleTheme}
                trackColor={{ false: theme.disabled, true: theme.primary }}
                thumbColor="#FFFFFF"
              />
            }
          />
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>NOTIFICATIONS</Text>
          <SettingRow
            icon="notifications"
            iconColor={theme.primary}
            title="Scheduled Reminders"
            subtitle="View all pending notifications"
            onPress={handleViewScheduledNotifications}
          />
          <View style={[styles.infoCard, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '25' }]}>
            <Ionicons name="information-circle" size={18} color={theme.primary} />
            <Text style={[styles.infoText, { color: theme.primary }]}>
              Each task gets 4 reminders: at 8 AM on the day, 1 hour before, 10 minutes before, and at task time.
            </Text>
          </View>
        </View>

        {/* Data */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>DATA</Text>
          <SettingRow
            icon="trash"
            iconColor={theme.error}
            title="Clear Completed Tasks"
            subtitle="Permanently delete all completed tasks"
            onPress={handleClearCompleted}
          />
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>ABOUT</Text>
          <View style={[styles.aboutCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.appIconWrap, { backgroundColor: theme.primary }]}>
              <Ionicons name="calendar" size={28} color="#FFFFFF" />
            </View>
            <Text style={[styles.aboutAppName, { color: theme.text }]}>Vynker Scheduler</Text>
            <Text style={[styles.aboutVersion, { color: theme.textSecondary }]}>Version 2.0.0</Text>
            <Text style={[styles.aboutDesc, { color: theme.textSecondary }]}>
              All your tasks are stored locally on your device. Your data is private and never leaves your phone.
            </Text>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  content: { flex: 1 },
  section: { paddingHorizontal: 16, paddingTop: 24 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingText: { flex: 1 },
  settingTitle: { fontSize: 15, fontWeight: '600' },
  settingSubtitle: { fontSize: 12, marginTop: 2 },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 10,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 19 },
  aboutCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  appIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  aboutAppName: { fontSize: 18, fontWeight: '700' },
  aboutVersion: { fontSize: 13 },
  aboutDesc: { fontSize: 13, textAlign: 'center', lineHeight: 19, marginTop: 4 },
});
