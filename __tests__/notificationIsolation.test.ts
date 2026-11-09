function loadService(isEmulator: boolean) {
  jest.resetModules();
  const notifications = {
    setNotificationHandler: jest.fn(),
    getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    requestPermissionsAsync: jest.fn(),
    getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'synthetic-push-token' }),
    setNotificationChannelAsync: jest.fn(),
    scheduleNotificationAsync: jest.fn(),
    cancelScheduledNotificationAsync: jest.fn(),
    cancelAllScheduledNotificationsAsync: jest.fn(),
    addNotificationResponseReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
    AndroidImportance: { MAX: 5 },
  };
  const storage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  };
  jest.doMock('../config/firebase', () => ({ isEmulator }));
  jest.doMock('expo-device', () => ({ isDevice: true }));
  jest.doMock('expo-notifications', () => notifications);
  jest.doMock('expo-constants', () => ({ __esModule: true, default: { expoConfig: { extra: { eas: { projectId: 'synthetic-eas-id' } } } } }));
  jest.doMock('react-native', () => ({ Platform: { OS: 'android' } }));
  jest.doMock('@react-native-async-storage/async-storage', () => ({ __esModule: true, default: storage }));
  return { service: require('../services/notificationService').NotificationService, notifications, storage };
}

test('local emulator operations do not touch personal notifications, storage or push services', async () => {
  const { service, notifications, storage } = loadService(true);
  const habit = { id: 'local-habit', name: 'Local habit', reminderTime: '08:00 AM' };
  expect(await service.registerForPushNotificationsAsync()).toBeNull();
  expect(await service.scheduleHabitNotification(habit)).toBeNull();
  await service.cancelHabitNotifications(habit.id);
  await service.saveNotificationId(habit.id, ['personal-id']);
  await service.rescheduleAllHabitNotifications([habit]);
  service.setNotificationResponseHandler(jest.fn()).remove();
  for (const method of Object.values(notifications)) {
    if (jest.isMockFunction(method)) expect(method).not.toHaveBeenCalled();
  }
  for (const method of Object.values(storage)) expect(method).not.toHaveBeenCalled();
});

test('production mode still delegates registration and scheduling cleanup to the existing adapters', async () => {
  const { service, notifications, storage } = loadService(false);
  expect(notifications.setNotificationHandler).toHaveBeenCalledTimes(1);
  await expect(service.registerForPushNotificationsAsync()).resolves.toEqual({ data: 'synthetic-push-token' });
  expect(notifications.getExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: 'synthetic-eas-id' });
  expect(storage.setItem).toHaveBeenCalledWith('@push_token', 'synthetic-push-token');
  await service.rescheduleAllHabitNotifications([]);
  expect(notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
  expect(storage.setItem).toHaveBeenCalledWith('@notification_ids', '{}');
});
