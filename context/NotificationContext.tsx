import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { NotificationService } from '../services/notificationService';
import { habitService } from '../services/habitService';
import { useAuth } from './AuthContext';
import { router } from 'expo-router';
import { Habit, NotificationContextType, NotificationProviderProps } from '../models/types';

// Create the context
const NotificationContext = createContext<NotificationContextType | null>(null);

// Custom hook to use the notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Provider component
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { userInfo } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  // Initialize notifications when the app starts
  useEffect(() => {
    // Register for push notifications
    NotificationService.registerForPushNotificationsAsync()
      .then(token => {
        if (token) {
          setExpoPushToken(token.data);
        }
      })
      .catch(err => console.error('Failed to get push token:', err));

    // Set up notification listeners
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      // Handle received notification
      console.log('Notification received:', notification);
    });

    // Set up notification response handler
    responseListener.current = NotificationService.setNotificationResponseHandler(
      (habitId) => {
        // Navigate to the habit screen and pass the habit ID when a notification is tapped
        if (habitId) {
          router.push({ pathname: '/(tabs)/habits', params: { habitId } });
        } else {
          router.push('/(tabs)/habits');
        }
      }
    );

    // Handle the case where the app was opened from a notification
    Notifications.getLastNotificationResponseAsync().then((response) => {
      const habitId = response?.notification.request.content.data
        ?.habitId as string | undefined;
      if (habitId) {
        router.push({ pathname: '/(tabs)/habits', params: { habitId } });
      } else if (response) {
        router.push('/(tabs)/habits');
      }
    });

    // Clean up listeners when component unmounts
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Set up user-specific notifications when the user changes
  useEffect(() => {
    if (userInfo?.uid) {
      // Load the user's habits and schedule notifications for them
      habitService.getUserHabits(userInfo.uid)
        .then(habits => {
          NotificationService.rescheduleAllHabitNotifications(habits);
        })
        .catch(err => console.error('Failed to load habits for notifications:', err));
    }
  }, [userInfo]);

  // Function to schedule a daily reminder for a habit
  const scheduleDailyReminder = async (habit: Habit) => {
    return await NotificationService.scheduleHabitNotification(habit);
  };

  // Function to cancel a reminder for a habit
  const cancelReminder = async (habitId: string) => {
    await NotificationService.cancelHabitNotifications(habitId);
  };

  // Function to reschedule all reminders
  const rescheduleAllReminders = async (habits: Habit[]) => {
    await NotificationService.rescheduleAllHabitNotifications(habits);
  };

  return (
    <NotificationContext.Provider
      value={{
        scheduleDailyReminder,
        cancelReminder,
        rescheduleAllReminders,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};