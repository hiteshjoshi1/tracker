import React, { useState, useEffect } from 'react';
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
import DateHeader from '../../components/DateHeader';
import AddHabitModal from '../../components/AddHabitModal';
import HabitDayIndicator from '../../components/HabitDayIndicator';
import { habitService } from '../../services/habitService';
import { Habit } from '../../models/types';
import { format, isToday, parseISO, isSameDay, addDays, subDays } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const DAYS_OF_WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const HabitsScreen: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { userInfo } = useAuth(); // Access the current user from auth context

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

  const handleAddHabit = async (habitData: Partial<Habit>) => {
    if (!userInfo?.uid) return;

    try {
      await habitService.addHabit(userInfo.uid, habitData);
      // No need to manually update state as the real-time listener will handle it
    } catch (error) {
      console.error('Error adding habit:', error);
      Alert.alert('Error', 'Failed to add habit. Please try again.');
    }
  };

  const updateHabitStatus = async (
    habit: Habit,
    newStatus: 'completed' | 'failed' | 'untracked',
    date: Date = selectedDate // Use selectedDate as default, allowing custom date parameter
  ) => {
    try {
      await habitService.updateHabitStatusForDate(habit.id, newStatus, date, habit);
    } catch (error) {
      console.error('Error updating habit status:', error);
      Alert.alert('Error', 'Failed to update habit status. Please try again.');
    }
  };

  const isTrackedOnDate = (habit: Habit, date: Date = selectedDate) => {
    // Check completion history first if available
    if (habit.completionHistory) {
      const dateStr = format(date, 'yyyy-MM-dd');
      return habit.completionHistory[dateStr] === 'completed';
    }

    // Fall back to checking lastCompleted
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

    // Show date for non-today completions
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

  // Sort habits by reminder time
  const sortHabitsByReminderTime = (habits: Habit[]): Habit[] => {
    return [...habits].sort((a, b) => {
      // If either habit doesn't have a reminder time, place it at the end
      if (!a.reminderTime) return 1;
      if (!b.reminderTime) return -1;

      // Parse times for comparison (format is "hh:mm a", e.g. "08:30 AM")
      const timeA = parseReminderTime(a.reminderTime);
      const timeB = parseReminderTime(b.reminderTime);

      // Compare the parsed 24-hour time values
      return timeA - timeB;
    });
  };

  // Helper function to parse reminder time strings to comparable values
  const parseReminderTime = (timeString: string): number => {
    try {
      const [time, period] = timeString.split(' ');
      let [hours, minutes] = time.split(':').map(num => parseInt(num, 10));

      // Convert to 24-hour format for proper comparison
      if (period && period.toLowerCase() === 'pm' && hours < 12) {
        hours += 12;
      } else if (period && period.toLowerCase() === 'am' && hours === 12) {
        hours = 0;
      }

      return hours * 60 + minutes; // Convert to minutes for comparison
    } catch (error) {
      console.error('Error parsing time:', timeString, error);
      return 0;
    }
  };

  // Generate a week view for the selected date's week
  const generateWeekDays = () => {
    // Start from Monday of the week containing the selectedDate
    const currentDay = selectedDate.getDay(); // 0 for Sunday, 1 for Monday, etc.
    const startDay = subDays(selectedDate, currentDay === 0 ? 6 : currentDay - 1); // Start from Monday

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

  // Check if a habit was completed on a specific date
  const wasCompletedOnDate = (habit: Habit, date: Date): boolean => {
    if (!habit.completionHistory) {
      // If no completion history exists, fall back to checking lastCompleted
      // Make sure we handle null/undefined properly
      if (!habit.lastCompleted) return false;

      return isSameDay(new Date(habit.lastCompleted), date) && habit.status === 'completed';
    }

    // Otherwise check the completion history
    const dateStr = format(date, 'yyyy-MM-dd');
    return habit.completionHistory[dateStr] === 'completed';
  };

  // Handle date change from DateHeader
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  // Get status for the currently selected date
  const getStatusForSelectedDate = (habit: Habit) => {
    // If checking for today, use the current status property
    if (isToday(selectedDate)) {
      return habit.status;
    }

    // Check completion history if available
    if (habit.completionHistory) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      return habit.completionHistory[dateStr] || 'untracked';
    }

    // Fall back to last completed date 
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
    <ScrollView style={styles.container}>
      {/* Use the DateHeader component */}
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

      {/* Display date information if not today */}
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
            const currentStatus = getStatusForSelectedDate(habit);

            return (
              <View key={habit.id} style={styles.habitCard}>
                <View style={styles.habitHeader}>
                  <View style={styles.habitInfo}>
                    <Text style={styles.habitText}>{habit.name}</Text>
                    {habit.description && (
                      <Text style={styles.habitDescription}>{habit.description}</Text>
                    )}

                    {currentStatus === 'untracked' && (
                      <View style={styles.notTrackedBadge}>
                        <Text style={styles.notTrackedText}>
                          Not tracked {isToday(selectedDate) ? 'today' : 'on this date'}
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
                      onPress={() => updateHabitStatus(habit, 'completed', selectedDate)}
                      style={[
                        styles.habitButton,
                        currentStatus === 'completed' && styles.activeButton,
                        styles.completeButton,
                        isTrackedOnDate(habit, selectedDate) && styles.trackedTodayButton
                      ]}
                    >
                      <Text style={[
                        styles.buttonIcon,
                        currentStatus === 'completed' && styles.activeButtonText
                      ]}>✓</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => updateHabitStatus(habit, 'untracked', selectedDate)}
                      style={[
                        styles.habitButton,
                        currentStatus === 'untracked' && styles.activeButton,
                        styles.untrackedButton
                      ]}
                    >
                      <Text style={[
                        styles.buttonIcon,
                        currentStatus === 'untracked' && styles.activeButtonText
                      ]}>-</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => updateHabitStatus(habit, 'failed', selectedDate)}
                      style={[
                        styles.habitButton,
                        currentStatus === 'failed' && styles.activeButton,
                        styles.failButton
                      ]}
                    >
                      <Text style={[
                        styles.buttonIcon,
                        currentStatus === 'failed' && styles.activeButtonText
                      ]}>✗</Text>
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
                        // Set the selected date to this day and update UI
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
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  buttonIcon: {
    fontSize: 18,
    color: '#95a5a6',
  },
  activeButton: {
    backgroundColor: '#e8f5e9',
    borderColor: '#2c3e50',
  },
  activeButtonText: {
    color: '#2c3e50',
  },
  completeButton: {
    backgroundColor: '#e8f5e9',
  },
  untrackedButton: {
    backgroundColor: '#f5f5f5',
  },
  failButton: {
    backgroundColor: '#ffebee',
  },
  trackedTodayButton: {
    borderColor: '#27ae60',
    borderWidth: 2,
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