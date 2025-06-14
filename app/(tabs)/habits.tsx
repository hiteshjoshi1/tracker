import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import DateHeader from '../../components/DateHeader';
import AddHabitModal from '../../components/AddHabitModal';
import HabitDayIndicator from '../../components/HabitDayIndicator';
import { habitService } from '../../services/habitService';
import { Habit } from '../../models/types';
import { format, isToday, parseISO, isSameDay, addDays, subDays } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

const DAYS_OF_WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const HabitsScreen: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const scrollViewRef = useRef<ScrollView>(null);
  const { habitId } = useLocalSearchParams<{ habitId?: string }>();
  const [highlightHabitId, setHighlightHabitId] = useState<string | null>(null);
  const { userInfo } = useAuth();
  const { scheduleDailyReminder, cancelReminder, rescheduleAllReminders } = useNotifications();

  useEffect(() => {
    if (userInfo?.uid) {
      loadHabits();

      // Set up real-time listener for habit changes
      const unsubscribe = habitService.subscribeToUserItems(
        userInfo.uid,
        (updatedHabits) => {
          setHabits(updatedHabits);
          setIsLoading(false);
        }
      );

      // Clean up listener on unmount
      return () => unsubscribe();
    }
  }, [userInfo]);

  // Highlight a habit when coming from a notification
  useEffect(() => {
    if (habitId) {
      const id = String(habitId);
      setHighlightHabitId(id);

      // Scroll to roughly the position of the habit card
      const index = habits.findIndex(h => h.id === id);
      if (index >= 0 && scrollViewRef.current) {
        const approximateHeight = 230;
        scrollViewRef.current.scrollTo({ y: index * approximateHeight, animated: true });
      }

      const timer = setTimeout(() => setHighlightHabitId(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [habitId, habits]);

  const loadHabits = async () => {
    if (!userInfo?.uid) return;

    try {
      setIsLoading(true);
      const userHabits = await habitService.getUserHabits(userInfo.uid);
      setHabits(userHabits);
    } catch (error) {
      console.error('Error loading habits:', error);
      Alert.alert('Error', 'Failed to load habits. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddHabit = async (habitData: Partial<Habit>): Promise<string> => {
    if (!userInfo?.uid) throw new Error("User not logged in");

    try {
      const habitId = await habitService.addHabit(userInfo.uid, habitData);
      return habitId;
    } catch (error) {
      console.error('Error adding habit:', error);
      Alert.alert('Error', 'Failed to add habit. Please try again.');
      throw error;
    }
  };

  // Simplified habit status toggle - only completed/untracked
  const toggleHabitStatus = async (habit: Habit, date: Date = selectedDate) => {
    try {
      const currentStatus = getStatusForSelectedDate(habit);
      const newStatus = currentStatus === 'completed' ? 'untracked' : 'completed';

      await habitService.updateHabitStatusForDate(habit.id, newStatus, date, habit);
    } catch (error) {
      console.error('Error updating habit status:', error);
      Alert.alert('Error', 'Failed to update habit status. Please try again.');
    }
  };

  const handleEditHabit = async (habitId: string, updates: Partial<Habit>) => {
    try {
      await habitService.updateHabit(habitId, updates);

      if ('reminderTime' in updates || 'reminderDays' in updates) {
        const updatedHabit = habits.find(h => h.id === habitId);
        if (updatedHabit) {
          await cancelReminder(habitId);
          if (updatedHabit.reminderTime) {
            await scheduleDailyReminder(updatedHabit);
          }
        }
      }
    } catch (error) {
      console.error('Error updating habit:', error);
      Alert.alert('Error', 'Failed to update habit. Please try again.');
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    try {
      await cancelReminder(habitId);
      await habitService.deleteHabit(habitId);
    } catch (error) {
      console.error('Error deleting habit:', error);
      Alert.alert('Error', 'Failed to delete habit. Please try again.');
    }
  };

  const isCompletedOnDate = (habit: Habit, date: Date = selectedDate) => {
    if (habit.completionHistory) {
      const dateStr = format(date, 'yyyy-MM-dd');
      return habit.completionHistory[dateStr] === 'completed';
    }

    if (!habit.lastCompleted) return false;
    return isSameDay(new Date(habit.lastCompleted), date) && habit.status === 'completed';
  };

  const getLastTrackedTime = (habit: Habit) => {
    if (!habit.lastCompleted) return '';
    const now = new Date();
    const last = new Date(habit.lastCompleted);

    if (isToday(last)) {
      const hours = last.getHours().toString().padStart(2, '0');
      const minutes = last.getMinutes().toString().padStart(2, '0');
      return `Today at ${hours}:${minutes}`;
    }

    if (isSameDay(last, selectedDate)) {
      const hours = last.getHours().toString().padStart(2, '0');
      const minutes = last.getMinutes().toString().padStart(2, '0');
      return `Tracked at ${hours}:${minutes}`;
    }

    const days = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 10) return '#27ae60';
    if (streak >= 5) return '#2ecc71';
    if (streak >= 3) return '#3498db';
    return '#95a5a6';
  };

  const sortHabitsByReminderTime = (habits: Habit[]): Habit[] => {
    return [...habits].sort((a, b) => {
      if (!a.reminderTime) return 1;
      if (!b.reminderTime) return -1;

      const timeA = parseReminderTime(a.reminderTime);
      const timeB = parseReminderTime(b.reminderTime);

      return timeA - timeB;
    });
  };

  const parseReminderTime = (timeString: string): number => {
    try {
      const [time, period] = timeString.split(' ');
      let [hours, minutes] = time.split(':').map(num => parseInt(num, 10));

      if (period && period.toLowerCase() === 'pm' && hours < 12) {
        hours += 12;
      } else if (period && period.toLowerCase() === 'am' && hours === 12) {
        hours = 0;
      }

      return hours * 60 + minutes;
    } catch (error) {
      console.error('Error parsing time:', timeString, error);
      return 0;
    }
  };

  const generateWeekDays = () => {
    const currentDay = selectedDate.getDay();
    const startDay = subDays(selectedDate, currentDay === 0 ? 6 : currentDay - 1);

    return Array.from({ length: 7 }).map((_, index) => {
      const date = addDays(startDay, index);
      const dayNumber = date.getDate();
      const dayName = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][date.getDay()];

      return {
        date: dayNumber,
        day: dayName,
        fullDate: date,
        isToday: isToday(date),
        isSelected: isSameDay(date, selectedDate)
      };
    });
  };

  const weekDays = generateWeekDays();

  const wasCompletedOnDate = (habit: Habit, date: Date): boolean => {
    if (!habit.completionHistory) {
      if (!habit.lastCompleted) return false;
      return isSameDay(new Date(habit.lastCompleted), date) && habit.status === 'completed';
    }

    const dateStr = format(date, 'yyyy-MM-dd');
    return habit.completionHistory[dateStr] === 'completed';
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const getStatusForSelectedDate = (habit: Habit) => {
    if (isToday(selectedDate)) {
      return habit.status;
    }

    if (habit.completionHistory) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      return habit.completionHistory[dateStr] || 'untracked';
    }

    if (habit.lastCompleted && isSameDay(new Date(habit.lastCompleted), selectedDate)) {
      return 'completed';
    }

    return 'untracked';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading habits...</Text>
      </View>
    );
  }

  return (
    <ScrollView ref={scrollViewRef} style={styles.container}>
      <DateHeader onDateChange={handleDateChange} />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setIsAddingHabit(true)}
      >
        <Text style={styles.addButtonText}>+ Add New Habit</Text>
      </TouchableOpacity>

      <AddHabitModal
        visible={isAddingHabit}
        onClose={() => setIsAddingHabit(false)}
        onAdd={handleAddHabit}
      />

      {!isToday(selectedDate) && (
        <View style={styles.selectedDateInfo}>
          <Text style={styles.selectedDateText}>
            Viewing habits for {format(selectedDate, 'MMMM d, yyyy')}
          </Text>
        </View>
      )}

      {habits.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>
            You don't have any habits yet. Add your first habit to start tracking!
          </Text>
        </View>
      ) : (
        <View style={styles.habitsList}>
          {sortHabitsByReminderTime(habits).map(habit => {
            const isCompleted = isCompletedOnDate(habit, selectedDate);

            return (
              <View key={habit.id} style={[styles.habitCard, highlightHabitId === habit.id && styles.highlightHabit] }>
                <View style={styles.habitHeader}>
                  <View style={styles.habitInfo}>
                    <Text style={styles.habitText}>{habit.name}</Text>
                    {habit.description && (
                      <Text style={styles.habitDescription}>{habit.description}</Text>
                    )}

                    {!isCompleted && !isToday(selectedDate) && (
                      <View style={styles.notTrackedBadge}>
                        <Text style={styles.notTrackedText}>
                          Not done on this date
                        </Text>
                      </View>
                    )}

                    {habit.lastCompleted && (
                      <Text style={styles.lastTrackedText}>
                        Last tracked: {getLastTrackedTime(habit)}
                      </Text>
                    )}
                  </View>

                  <View style={styles.habitControls}>
                    <TouchableOpacity
                      onPress={() => toggleHabitStatus(habit, selectedDate)}
                      style={[
                        styles.habitButton,
                        isCompleted ? styles.completedButton : styles.notCompletedButton
                      ]}
                    >
                      <Text style={[
                        styles.buttonIcon,
                        isCompleted ? styles.completedButtonText : styles.notCompletedButtonText
                      ]}>
                        {isCompleted ? '✓' : '+'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Weekly habit tracker */}
                <View style={styles.weeklyTracker}>
                  {generateWeekDays().map((day, index) => (
                    <HabitDayIndicator
                      key={index}
                      day={day.day}
                      isCompleted={wasCompletedOnDate(habit, day.fullDate)}
                      isToday={day.isToday}
                      isSelected={day.isSelected}
                      onPress={() => {
                        handleDateChange(day.fullDate);
                      }}
                    />
                  ))}
                </View>

                <View style={styles.streakContainer}>
                  <View style={styles.streakBar}>
                    <View
                      style={[
                        styles.streakProgress,
                        {
                          width: `${Math.min((habit.streak * 10), 100)}%`,
                          backgroundColor: getStreakColor(habit.streak)
                        }
                      ]}
                    />
                  </View>
                  <View style={styles.streakInfoContainer}>
                    <Text style={styles.streakText}>
                      {habit.streak} day{habit.streak !== 1 ? 's' : ''} streak
                    </Text>
                    {habit.longestStreak > 0 && (
                      <Text style={styles.longestStreakText}>
                        Longest: {habit.longestStreak} day{habit.longestStreak !== 1 ? 's' : ''}
                      </Text>
                    )}
                  </View>
                </View>

                {habit.reminderTime && (
                  <View style={styles.reminderContainer}>
                    <Text style={styles.reminderText}>
                      Daily reminder: {habit.reminderTime}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#7f8c8d',
  },
  selectedDateInfo: {
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#f0f4f8',
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 16,
  },
  selectedDateText: {
    color: '#2c3e50',
    fontWeight: '500',
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#2c3e50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyStateContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#7f8c8d',
    lineHeight: 24,
  },
  habitsList: {
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  habitCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  highlightHabit: {
    borderWidth: 2,
    borderColor: '#3498db',
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  habitControls: {
    flexDirection: 'row',
    gap: 8,
  },
  habitInfo: {
    flex: 1,
    marginRight: 12,
  },
  habitText: {
    fontSize: 18,
    color: '#2c3e50',
    fontWeight: '600',
    marginBottom: 4,
  },
  habitDescription: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 8,
  },
  habitButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 2,
  },
  completedButton: {
    backgroundColor: '#27ae60',
    borderColor: '#27ae60',
  },
  notCompletedButton: {
    backgroundColor: '#f8f9fa',
    borderColor: '#e9ecef',
  },
  buttonIcon: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  completedButtonText: {
    color: '#fff',
  },
  notCompletedButtonText: {
    color: '#adb5bd',
  },
  notTrackedBadge: {
    backgroundColor: '#fff3e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: 8,
  },
  notTrackedText: {
    color: '#f57c00',
    fontSize: 12,
    fontWeight: '500',
  },
  lastTrackedText: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 4,
  },
  weeklyTracker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  streakContainer: {
    marginTop: 8,
  },
  streakBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  streakProgress: {
    height: '100%',
    borderRadius: 3,
  },
  streakInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  longestStreakText: {
    fontSize: 12,
    color: '#95a5a6',
  },
  reminderContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  reminderText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
});

export default HabitsScreen;