import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch, StatusBar } from 'react-native';
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
      { text: 'Clear', style: 'destructive', onPress: async () => { await clearCompleted(); Alert.alert('Done', 'Completed tasks cleared.'); } },
    ]);
  };

  const handleViewNotifications = async () => {
    const n = await getAllScheduledNotifications();
    Alert.alert('Scheduled Notifications', `You have ${n.length} scheduled notification${n.length !== 1 ? 's' : ''}.`, [{ text: 'OK' }]);
  };

  const Row = ({ icon, iconColor, title, subtitle, onPress, right }: {
    icon: any; iconColor: string; title: string; subtitle: string; onPress?: () => void; right?: React.ReactNode;
  }) => (
    <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.75 : 1} style={styles.rowWrap}>
      <View style={[styles.rowShadow, { backgroundColor: iconColor + '40' }]} />
      <View style={[styles.rowCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={[styles.rowIcon, { backgroundColor: iconColor }]}>
          <Ionicons name={icon} size={20} color="#FFF" />
        </View>
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.rowSub, { color: theme.textSecondary }]}>{subtitle}</Text>
        </View>
        {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={theme.disabled} /> : null)}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.headerBg} />

      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>APPEARANCE</Text>
        <Row
          icon={mode === 'light' ? 'moon' : 'sunny'}
          iconColor={mode === 'light' ? '#5B4FE8' : '#FFB347'}
          title="Dark Mode"
          subtitle={mode === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
          right={<Switch value={mode === 'dark'} onValueChange={toggleTheme} trackColor={{ false: theme.disabled, true: theme.primary }} thumbColor="#FFF" />}
        />

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>NOTIFICATIONS</Text>
        <Row icon="notifications" iconColor="#5B4FE8" title="Scheduled Reminders" subtitle="View all pending notifications" onPress={handleViewNotifications} />
        <View style={[styles.infoCard, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '25' }]}>
          <Ionicons name="information-circle" size={18} color={theme.primary} />
          <Text style={[styles.infoText, { color: theme.primary }]}>
            Each task gets 4 reminders: 8 AM on the day, 1 hour before, 10 minutes before, and at task time.
          </Text>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>DATA</Text>
        <Row icon="trash" iconColor="#FF3D57" title="Clear Completed Tasks" subtitle="Permanently delete all completed tasks" onPress={handleClearCompleted} />

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>ABOUT</Text>
        <View style={styles.aboutWrap}>
          <View style={[styles.aboutShadow, { backgroundColor: theme.primaryDark }]} />
          <View style={[styles.aboutCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.aboutLogoStack}>
              <View style={[styles.aboutLogoShadow, { backgroundColor: theme.primaryDark }]} />
              <View style={[styles.aboutLogoFace, { backgroundColor: theme.primary }]}>
                <Ionicons name="grid" size={28} color="#FFF" />
              </View>
            </View>
            <Text style={[styles.aboutName, { color: theme.text }]}>Vynker</Text>
            <Text style={[styles.aboutVersion, { color: theme.textSecondary }]}>Version 2.0.0</Text>
            <View style={[styles.aboutDivider, { backgroundColor: theme.border }]} />
            <Text style={[styles.aboutDesc, { color: theme.textSecondary }]}>
              Your data is stored securely in the cloud and synced across sessions. Built for freelancers and small teams.
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  scroll: { padding: 16, gap: 10 },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: 8, marginBottom: 4 },
  rowWrap: { position: 'relative', height: 72, marginBottom: 4 },
  rowShadow: { position: 'absolute', bottom: -4, left: 4, right: -4, height: 72, borderRadius: 16 },
  rowCard: { position: 'absolute', top: 0, left: 0, right: 0, height: 72, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 12, elevation: 4, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8 },
  rowIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '700' },
  rowSub: { fontSize: 12, marginTop: 2 },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', padding: 12, borderRadius: 14, borderWidth: 1, gap: 10, marginBottom: 4 },
  infoText: { flex: 1, fontSize: 13, lineHeight: 19 },
  aboutWrap: { position: 'relative', marginTop: 4 },
  aboutShadow: { position: 'absolute', bottom: -5, left: 5, right: -5, height: '100%', borderRadius: 20 },
  aboutCard: { borderRadius: 20, borderWidth: 1, padding: 24, alignItems: 'center', gap: 8, elevation: 6, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12 },
  aboutLogoStack: { width: 64, height: 64, position: 'relative', marginBottom: 4 },
  aboutLogoShadow: { position: 'absolute', width: 64, height: 64, borderRadius: 18, top: 4, left: 4 },
  aboutLogoFace: { position: 'absolute', width: 64, height: 64, borderRadius: 18, justifyContent: 'center', alignItems: 'center', top: 0, left: 0 },
  aboutName: { fontSize: 22, fontWeight: '900' },
  aboutVersion: { fontSize: 13 },
  aboutDivider: { height: 1, width: '100%', marginVertical: 4 },
  aboutDesc: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
