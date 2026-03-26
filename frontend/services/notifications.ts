import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Task } from './database';
import { format, subHours, subMinutes, parseISO } from 'date-fns';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Request notification permissions
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Notification permissions not granted');
      return false;
    }
    
    // Configure Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Task Reminders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
        lightColor: '#2196F3',
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

// Schedule notifications for a task
export const scheduleTaskNotifications = async (task: Task): Promise<string[]> => {
  try {
    const notificationIds: string[] = [];
    
    // Parse task date and time
    const taskDateTime = parseISO(`${task.date}T${task.time}:00`);
    const now = new Date();
    
    // Only schedule future notifications
    if (taskDateTime <= now) {
      console.log('Task time is in the past, skipping notifications');
      return [];
    }
    
    // Notification at task time
    const mainNotificationTime = taskDateTime;
    if (mainNotificationTime > now) {
      const mainId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Task Reminder',
          body: task.title,
          data: { taskId: task.id, type: 'main' },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          date: mainNotificationTime,
          channelId: 'reminders',
        },
      });
      notificationIds.push(mainId);
    }
    
    // Notification 1 hour before
    const oneHourBefore = subHours(taskDateTime, 1);
    if (oneHourBefore > now) {
      const oneHourId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Task in 1 hour',
          body: task.title,
          data: { taskId: task.id, type: '1hour' },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          date: oneHourBefore,
          channelId: 'reminders',
        },
      });
      notificationIds.push(oneHourId);
    }
    
    // Notification 10 minutes before
    const tenMinsBefore = subMinutes(taskDateTime, 10);
    if (tenMinsBefore > now) {
      const tenMinsId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Task in 10 minutes',
          body: task.title,
          data: { taskId: task.id, type: '10mins' },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          date: tenMinsBefore,
          channelId: 'reminders',
        },
      });
      notificationIds.push(tenMinsId);
    }
    
    console.log(`Scheduled ${notificationIds.length} notifications for task: ${task.title}`);
    return notificationIds;
  } catch (error) {
    console.error('Error scheduling notifications:', error);
    return [];
  }
};

// Cancel task notifications
export const cancelTaskNotifications = async (notificationIdsJson: string): Promise<void> => {
  try {
    if (!notificationIdsJson || notificationIdsJson === '[]') return;
    
    const notificationIds: string[] = JSON.parse(notificationIdsJson);
    
    for (const id of notificationIds) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }
    
    console.log(`Cancelled ${notificationIds.length} notifications`);
  } catch (error) {
    console.error('Error cancelling notifications:', error);
  }
};

// Get all scheduled notifications (for debugging)
export const getAllScheduledNotifications = async () => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  console.log('Scheduled notifications:', scheduled.length);
  return scheduled;
};