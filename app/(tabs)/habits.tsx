import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import DateHeader from '../../components/DateHeader';

interface WeekDay {
  date: number;
  day: string;
  isToday: boolean;
}

interface Habit {
  id: string;
  name: string;
  status: 'completed' | 'failed' | 'untracked';
  streak: number;
  lastCompleted: Date | null;
}

const HabitsScreen: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([
    {
      id: '1',
      name: 'Morning Meditation',
      status: 'completed',
      streak: 5,
      lastCompleted: new Date(),
    },
    {
      id: '2',
      name: 'Reading',
      status: 'failed',
      streak: 0,
      lastCompleted: null,
    },
    {
      id: '3',
      name: 'Exercise',
      status: 'untracked',
      streak: 3,
      lastCompleted: new Date(),
    },
  ]);

  const [newHabit, setNewHabit] = useState('');
  const [isAddingHabit, setIsAddingHabit] = useState(false);

  const isTrackedToday = (habit: Habit) => {
    if (!habit.lastCompleted) return false;
    const today = new Date();
    const lastCompleted = new Date(habit.lastCompleted);
    return (
      today.getDate() === lastCompleted.getDate() &&
      today.getMonth() === lastCompleted.getMonth() &&
      today.getFullYear() === lastCompleted.getFullYear()
    );
  };

  const getLastTrackedTime = (habit: Habit) => {
    if (!habit.lastCompleted) return '';
    const now = new Date();
    const last = new Date(habit.lastCompleted);
    
    if (isTrackedToday(habit)) {
      const hours = last.getHours().toString().padStart(2, '0');
      const minutes = last.getMinutes().toString().padStart(2, '0');
      return `Today at ${hours}:${minutes}`;
    }
    
    const days = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  };

  const updateHabitStatus = (id: string, newStatus: 'completed' | 'failed' | 'untracked') => {
    setHabits(habits.map(habit => {
      if (habit.id === id) {
        let newStreak = habit.streak;
        let newLastCompleted = habit.lastCompleted;

        if (newStatus === 'completed') {
          newStreak = habit.streak + 1;
          newLastCompleted = new Date();
        } else if (newStatus === 'failed') {
          newStreak = 0;
          newLastCompleted = null;
        }
        // 'untracked' status doesn't change the streak

        return {
          ...habit,
          status: newStatus,
          streak: newStreak,
          lastCompleted: newLastCompleted,
        };
      }
      return habit;
    }));
  };

  const addHabit = () => {
    if (newHabit.trim()) {
      const newHabitItem: Habit = {
        id: Date.now().toString(),
        name: newHabit.trim(),
        status: 'untracked',
        streak: 0,
        lastCompleted: null,
      };
      setHabits([...habits, newHabitItem]);
      setNewHabit('');
      setIsAddingHabit(false);
    }
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 10) return '#27ae60';
    if (streak >= 5) return '#2ecc71';
    if (streak >= 3) return '#3498db';
    return '#95a5a6';
  };

  return (
    <ScrollView style={styles.container}>
      <DateHeader />
      
      {!isAddingHabit ? (
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setIsAddingHabit(true)}
        >
          <Text style={styles.addButtonText}>+ Add New Habit</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.addHabitContainer}>
          <TextInput
            style={styles.input}
            value={newHabit}
            onChangeText={setNewHabit}
            placeholder="Enter new habit name"
            placeholderTextColor="#95a5a6"
          />
          <View style={styles.addHabitButtons}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setIsAddingHabit(false);
                setNewHabit('');
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.saveButton]}
              onPress={addHabit}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.habitsList}>
        {habits.map(habit => (
          <View key={habit.id} style={styles.habitCard}>
            <View style={styles.habitHeader}>
              <View style={styles.habitControls}>
                <TouchableOpacity 
                  onPress={() => updateHabitStatus(habit.id, 'completed')}
                  style={[
                    styles.habitButton,
                    habit.status === 'completed' && styles.activeButton,
                    styles.completeButton,
                    isTrackedToday(habit) && styles.trackedTodayButton
                  ]}
                >
                  <Text style={[
                    styles.buttonIcon,
                    habit.status === 'completed' && styles.activeButtonText
                  ]}>✓</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => updateHabitStatus(habit.id, 'untracked')}
                  style={[
                    styles.habitButton,
                    habit.status === 'untracked' && styles.activeButton,
                    styles.untrackedButton
                  ]}
                >
                  <Text style={[
                    styles.buttonIcon,
                    habit.status === 'untracked' && styles.activeButtonText
                  ]}>-</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => updateHabitStatus(habit.id, 'failed')}
                  style={[
                    styles.habitButton,
                    habit.status === 'failed' && styles.activeButton,
                    styles.failButton
                  ]}
                >
                  <Text style={[
                    styles.buttonIcon,
                    habit.status === 'failed' && styles.activeButtonText
                  ]}>✗</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.habitInfo}>
                <Text style={styles.habitText}>{habit.name}</Text>
                {!isTrackedToday(habit) && (
                  <View style={styles.notTrackedBadge}>
                    <Text style={styles.notTrackedText}>Not tracked today</Text>
                  </View>
                )}
                {habit.lastCompleted && (
                  <Text style={styles.lastTrackedText}>
                    Last tracked: {getLastTrackedTime(habit)}
                  </Text>
                )}
              </View>
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
              <Text style={styles.streakText}>
                {habit.streak} day{habit.streak !== 1 ? 's' : ''} streak
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  addButton: {
    backgroundColor: '#2c3e50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addHabitContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
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
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#dfe6e9',
    marginBottom: 12,
  },
  addHabitButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    padding: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dfe6e9',
  },
  saveButton: {
    backgroundColor: '#2c3e50',
  },
  cancelButtonText: {
    color: '#2c3e50',
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  habitsList: {
    gap: 12,
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  habitControls: {
    flexDirection: 'row',
    gap: 8,
    marginRight: 12,
  },
  habitInfo: {
    flex: 1,
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
  habitText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  notTrackedBadge: {
    backgroundColor: '#fff3e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
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
  streakText: {
    fontSize: 14,
    color: '#95a5a6',
    fontWeight: '500',
  },
});

export default HabitsScreen;