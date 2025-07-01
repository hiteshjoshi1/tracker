import { HabitService } from '../services/habitService';
import { NotificationService } from '../services/notificationService';
import { Habit } from '../models/types';

jest.mock('../services/notificationService', () => {
  return {
    NotificationService: {
      cancelHabitNotifications: jest.fn(),
      scheduleHabitNotification: jest.fn()
    },
    __esModule: true,
    default: {
      cancelHabitNotifications: jest.fn(),
      scheduleHabitNotification: jest.fn()
    }
  };
});

const mockHabit: Habit = {
  id: '123',
  userId: 'u1',
  name: 'Test Habit',
  status: 'untracked',
  streak: 0,
  longestStreak: 0,
  lastCompleted: null,
  date: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  completionHistory: {}
};

describe('HabitService.updateHabit', () => {
  const habitService = new HabitService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('schedules notifications when reminderTime changes', async () => {
    jest.spyOn(habitService, 'getItemById').mockResolvedValue(mockHabit);
    jest.spyOn(habitService, 'updateItem').mockResolvedValue();

    const updates = { reminderTime: '08:00 AM' };
    await habitService.updateHabit('123', updates);

    expect(NotificationService.cancelHabitNotifications).toHaveBeenCalledWith('123');
    expect(NotificationService.scheduleHabitNotification).toHaveBeenCalledWith({
      ...mockHabit,
      ...updates
    });
    expect(habitService.updateItem).toHaveBeenCalledWith('123', updates);
  });

  it('does not interact with notifications when no reminder fields', async () => {
    jest.spyOn(habitService, 'updateItem').mockResolvedValue();
    await habitService.updateHabit('123', { name: 'New Name' });

    expect(NotificationService.cancelHabitNotifications).not.toHaveBeenCalled();
    expect(NotificationService.scheduleHabitNotification).not.toHaveBeenCalled();
    expect(habitService.updateItem).toHaveBeenCalledWith('123', { name: 'New Name' });
  });
});
