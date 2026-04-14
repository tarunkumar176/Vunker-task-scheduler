import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Task } from './database';
import { subHours, subMinutes, parseISO } from 'date-fns';
import { SchedulableTriggerInputTypes } from 'expo-notifications';

// Check if notifications are available
let notificationsAvailable = true;

// Configure notification handler only if available
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (error) {
  console.log('Notifications not available in Expo Go:', error);
  notificationsAvailable = false;
}

// Request notification permissions
export const requestNotificationPermissions = async (): Promise<boolean> => {
  if (!notificationsAvailable) {
    console.log('Notifications not available - using Expo Go. Build a standalone app for full notification support.');
    return false;
  }
  
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
  if (!notificationsAvailable) {
    console.log('Notifications not available - skipping scheduling');
    return [];
  }
  
  try {
    const notificationIds: string[] = [];
    
    // Parse task date and time
    const taskDateTime = parseISO(`${task.date}T${task.time}:00`);
    const now = new Date();
    
    console.log(`Scheduling notifications for: ${task.title}`);
    console.log(`Task time: ${taskDateTime.toLocaleString()}`);
    console.log(`Current time: ${now.toLocaleString()}`);
    
    // Only schedule future notifications
    if (taskDateTime <= now) {
      console.log('Task time is in the past, skipping notifications');
      return [];
    }
    
    // Calculate notification times
    const oneDayBefore8am = new Date(taskDateTime);
    oneDayBefore8am.setDate(oneDayBefore8am.getDate());
    oneDayBefore8am.setHours(8, 0, 0, 0); // 8 AM on the day of the event
    const oneHourBefore = subHours(taskDateTime, 1);
    const tenMinsBefore = subMinutes(taskDateTime, 10);
    
    // Notification on the day of the event at 8 AM
    if (oneDayBefore8am > now && oneDayBefore8am < taskDateTime) {
      console.log(`Scheduling day-of notification for: ${oneDayBefore8am.toLocaleString()}`);
      const dayOfId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📅 Task today!',
          body: `"${task.title}" is scheduled for ${task.time}`,
          data: { taskId: task.id, type: 'dayof' },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: SchedulableTriggerInputTypes.DATE,
          date: oneDayBefore8am,
          channelId: 'reminders',
        },
      });
      notificationIds.push(dayOfId);
    }

    // Notification 1 hour before
    if (oneHourBefore > now) {
      console.log(`Scheduling 1-hour notification for: ${oneHourBefore.toLocaleString()}`);
      const oneHourId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Task in 1 hour',
          body: task.title,
          data: { taskId: task.id, type: '1hour' },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: SchedulableTriggerInputTypes.DATE,
          date: oneHourBefore,
          channelId: 'reminders',
        },
      });
      notificationIds.push(oneHourId);
    } else {
      console.log('Skipping 1-hour notification (too soon)');
    }

    // Notification 10 minutes before
    if (tenMinsBefore > now) {
      console.log(`Scheduling 10-min notification for: ${tenMinsBefore.toLocaleString()}`);
      const tenMinsId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Task in 10 minutes',
          body: task.title,
          data: { taskId: task.id, type: '10mins' },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: SchedulableTriggerInputTypes.DATE,
          date: tenMinsBefore,
          channelId: 'reminders',
        },
      });
      notificationIds.push(tenMinsId);
    } else {
      console.log('Skipping 10-min notification (too soon)');
    }

    // Notification at task time
    console.log(`Scheduling main notification for: ${taskDateTime.toLocaleString()}`);
    const mainId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔔 Time for your task!',
        body: task.title,
        data: { taskId: task.id, type: 'main' },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: taskDateTime,
        channelId: 'reminders',
      },
    });
    notificationIds.push(mainId);
    
    console.log(`✓ Scheduled ${notificationIds.length} notifications for task: ${task.title}`);
    return notificationIds;
  } catch (error) {
    console.error('Error scheduling notifications:', error);
    return [];
  }
};

// Cancel task notifications
export const cancelTaskNotifications = async (notificationIdsJson: string): Promise<void> => {
  if (!notificationsAvailable) {
    return;
  }
  
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
  if (!notificationsAvailable) {
    return [];
  }
  
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    console.log('Scheduled notifications:', scheduled.length);
    return scheduled;
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
};