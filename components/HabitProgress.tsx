import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { format, isSameMonth } from 'date-fns';
import { Habit } from '../models/types';

interface HabitProgressProps {
  habit: Habit;
  dates: Date[];
}

const HabitProgress: React.FC<HabitProgressProps> = ({ habit, dates }) => {
  // Function to get status for a specific date
  const getStatusForDate = (date: Date) => {
    if (!habit.completionHistory) return 'untracked';
    
    const dateStr = format(date, 'yyyy-MM-dd');
    return habit.completionHistory[dateStr] || 'untracked';
  };

  // Function to render status indicator
  const renderStatusIndicator = (status: string) => {
    let backgroundColor = '#E0E0E0'; // Default gray for untracked
    let label = '?';
    
    if (status === 'completed') {
      backgroundColor = '#4CAF50'; // Green for completed
      label = '✓';
    } else if (status === 'failed') {
      backgroundColor = '#F44336'; // Red for failed
      label = '✗';
    } else {
      backgroundColor = '#E0E0E0'; // Gray for untracked
      label = '-';
    }
    
    return (
      <View style={[styles.statusIndicator, { backgroundColor }]}>
        <Text style={styles.statusLabel}>{label}</Text>
      </View>
    );
  };

  // Calculate completion rate
  const calculateCompletionRate = () => {
    if (!habit.completionHistory) return 0;
    
    let completedCount = 0;
    let totalTrackedDays = 0;
    
    dates.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const status = habit.completionHistory ? habit.completionHistory[dateStr] : 'untracked';
      
      if (status === 'completed' || status === 'failed') {
        totalTrackedDays++;
        if (status === 'completed') {
          completedCount++;
        }
      }
    });
    
    return totalTrackedDays > 0 ? Math.round((completedCount / totalTrackedDays) * 100) : 0;
  };

  return (
    <View style={styles.container}>
      {/* Week view */}
      <View style={styles.weekView}>
        {dates.map(day => (
          <View key={format(day, 'yyyy-MM-dd')} style={styles.dayColumn}>
            <Text style={styles.dayText}>{format(day, 'EEE')}</Text>
            <Text style={[
              styles.dateText,
              // Highlight today's date
              format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && styles.todayText,
              // Fade dates from different months
              !isSameMonth(day, new Date()) && styles.otherMonthText
            ]}>
              {format(day, 'd')}
            </Text>
            {renderStatusIndicator(getStatusForDate(day))}
          </View>
        ))}
      </View>
      
      {/* Stats view */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{habit.streak}</Text>
          <Text style={styles.statLabel}>Current Streak</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{habit.longestStreak}</Text>
          <Text style={styles.statLabel}>Longest Streak</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{`${calculateCompletionRate()}%`}</Text>
          <Text style={styles.statLabel}>Completion Rate</Text>
        </View>
      </View>
      
      {/* Description if available */}
      {habit.description && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionLabel}>Description:</Text>
          <Text style={styles.descriptionText}>{habit.description}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  weekView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 15,
    paddingHorizontal: 10,
  },
  dayColumn: {
    alignItems: 'center',
    width: 40,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#757575',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  todayText: {
    color: '#4a90e2',
    fontWeight: 'bold',
  },
  otherMonthText: {
    opacity: 0.6,
  },
  statusIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusLabel: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a90e2',
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
  descriptionContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  descriptionText: {
    fontSize: 14,
    color: '#424242',
  },
});

export default HabitProgress;