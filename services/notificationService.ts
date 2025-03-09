import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, parse, addDays, setHours, setMinutes, setSeconds } from 'date-fns';
import { Habit, PUSH_TOKEN_KEY, NOTIFICATION_IDS_KEY } from '../models/types';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  // Register for push notifications
  static async registerForPushNotificationsAsync() {
    let token;
    
    // Check if the device is a physical device (not an emulator)
    if (Device.isDevice) {
      // Check if we already have permission
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      // If we don't have permission, ask for it
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      // If we still don't have permission, return null
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }
      
      // Get the token if we have permission
      token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
      
      // Save the token to AsyncStorage
      if (token) {
        await AsyncStorage.setItem(PUSH_TOKEN_KEY, token.data);
      }
    } else {
      console.log('Must use physical device for push notifications');
    }

    // Set up special notification channel for Android
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('habit-reminders', {
        name: 'Habit Reminders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  }

  // Schedule a notification for a habit
  static async scheduleHabitNotification(habit: Habit) {
    // Only schedule if the habit has a reminder time
    if (!habit.reminderTime) {
      console.log('No reminder time set for habit:', habit.name);
      return null;
    }

    try {
      // Parse the time (format is "hh:mm a", e.g. "08:30 AM")
      const timeString = habit.reminderTime;
      const parsedTime = parse(timeString, 'hh:mm a', new Date());
      
      const hours = parsedTime.getHours();
      const minutes = parsedTime.getMinutes();
      
      // Calculate upcoming trigger dates for each selected day
      const now = new Date();
      const notificationIds = [];
      const daysToSchedule = [];
      
      // Determine which days to schedule based on reminderDays
      if (!habit.reminderDays || 
         (habit.reminderDays.monday && habit.reminderDays.tuesday && 
          habit.reminderDays.wednesday && habit.reminderDays.thursday && 
          habit.reminderDays.friday && habit.reminderDays.saturday && 
          habit.reminderDays.sunday)) {
        // If all days are selected or no specific days, schedule daily for the next 7 days
        for (let i = 0; i < 7; i++) {
          daysToSchedule.push(i);
        }
      } else {
        // Otherwise, schedule only for selected days
        if (habit.reminderDays?.monday) daysToSchedule.push(1); // Monday
        if (habit.reminderDays?.tuesday) daysToSchedule.push(2); // Tuesday
        if (habit.reminderDays?.wednesday) daysToSchedule.push(3); // Wednesday
        if (habit.reminderDays?.thursday) daysToSchedule.push(4); // Thursday
        if (habit.reminderDays?.friday) daysToSchedule.push(5); // Friday
        if (habit.reminderDays?.saturday) daysToSchedule.push(6); // Saturday
        if (habit.reminderDays?.sunday) daysToSchedule.push(0); // Sunday
      }
      
      // Schedule notifications for each day
      for (const dayOfWeek of daysToSchedule) {
        // Find the next occurrence of this day of the week
        let nextDate = new Date(now);
        
        // Keep advancing the date until we hit the right day of the week
        while (nextDate.getDay() !== dayOfWeek) {
          nextDate = addDays(nextDate, 1);
        }
        
        // Set the time to the habit reminder time
        nextDate = setHours(nextDate, hours);
        nextDate = setMinutes(nextDate, minutes);
        nextDate = setSeconds(nextDate, 0);
        
        // If the time has already passed today, move to next week
        if (nextDate < now) {
          nextDate = addDays(nextDate, 7);
        }
        
        // Calculate seconds until the notification should trigger
        const secondsUntilTrigger = Math.floor((nextDate.getTime() - now.getTime()) / 1000);
        
        // Schedule the notification using seconds as trigger with the correct type
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Habit Reminder',
            body: `Time to complete your habit: ${habit.name}`,
            data: { habitId: habit.id },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: secondsUntilTrigger,
          },
        });
        
        notificationIds.push(notificationId);
      }
      
      // Store all notification IDs with the habit ID
      await this.saveNotificationId(habit.id, notificationIds);
      
      return notificationIds;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  // Cancel all notifications for a habit
  static async cancelHabitNotifications(habitId: string) {
    try {
      // Get all notification IDs for this habit
      const notificationIdsJSON = await AsyncStorage.getItem(NOTIFICATION_IDS_KEY);
      if (!notificationIdsJSON) return;
      
      const allNotificationIds = JSON.parse(notificationIdsJSON);
      const notificationIds = allNotificationIds[habitId];
      
      if (!notificationIds) return;
      
      // Cancel each notification
      if (Array.isArray(notificationIds)) {
        for (const id of notificationIds) {
          await Notifications.cancelScheduledNotificationAsync(id);
        }
      } else {
        await Notifications.cancelScheduledNotificationAsync(notificationIds);
      }
      
      // Remove the notification IDs from storage
      delete allNotificationIds[habitId];
      await AsyncStorage.setItem(NOTIFICATION_IDS_KEY, JSON.stringify(allNotificationIds));
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  }

  // Save notification ID(s) for a habit
  static async saveNotificationId(habitId: string, notificationId: string | string[]) {
    try {
      // Get all existing notification IDs
      const notificationIdsJSON = await AsyncStorage.getItem(NOTIFICATION_IDS_KEY);
      const allNotificationIds = notificationIdsJSON ? JSON.parse(notificationIdsJSON) : {};
      
      // Save the new notification ID(s)
      allNotificationIds[habitId] = notificationId;
      
      // Save back to AsyncStorage
      await AsyncStorage.setItem(NOTIFICATION_IDS_KEY, JSON.stringify(allNotificationIds));
    } catch (error) {
      console.error('Error saving notification ID:', error);
    }
  }

  // Reschedule notifications for all habits
  static async rescheduleAllHabitNotifications(habits: Habit[]) {
    try {
      // Cancel all existing notifications first
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      // Clear notification IDs storage
      await AsyncStorage.setItem(NOTIFICATION_IDS_KEY, JSON.stringify({}));
      
      // Schedule new notifications for each habit
      for (const habit of habits) {
        if (habit.reminderTime) {
          await this.scheduleHabitNotification(habit);
        }
      }
    } catch (error) {
      console.error('Error rescheduling all notifications:', error);
    }
  }

  // Set up notification response handling
  static setNotificationResponseHandler(callback: (habitId: string) => void) {
    // This handles when a user taps on a notification
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const habitId = response.notification.request.content.data?.habitId;
      if (habitId) {
        callback(habitId);
      }
    });
    
    return subscription;
  }
}

export default NotificationService;