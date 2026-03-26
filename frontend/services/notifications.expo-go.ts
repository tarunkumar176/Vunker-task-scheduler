import { Task } from './database';

// Dummy notification service for Expo Go compatibility
// Real notifications require a standalone build

let notificationsAvailable = false;

console.log('⚠️ Notifications disabled in Expo Go. Build a standalone app for full notification support.');

export const requestNotificationPermissions = async (): Promise<boolean> => {
  console.log('Notifications not available in Expo Go');
  return false;
};

export const scheduleTaskNotifications = async (task: Task): Promise<string[]> => {
  console.log('Skipping notification scheduling (Expo Go limitation)');
  return [];
};

export const cancelTaskNotifications = async (notificationIdsJson: string): Promise<void> => {
  // No-op
};

export const getAllScheduledNotifications = async () => {
  return [];
};
