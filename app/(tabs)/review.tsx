import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, startOfDay, subDays, addDays } from 'date-fns';
import { Habit } from '../../models/types';
import { habitService } from '../../services/habitService';
import { useAuth } from '../../context/AuthContext';
import DateHeader from '../../components/DateHeader';
import Card from '../../components/Card';
import HabitProgress from '../../components/HabitProgress';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

export default function ReviewScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expandedHabitId, setExpandedHabitId] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const { userInfo } = useAuth();
  
  // Generate array of days based on selected time range
  const getDaysInRange = () => {
    const days = [];
    const today = startOfDay(new Date());
    
    if (timeRange === 'week') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        days.push(subDays(today, i));
      }
    } else if (timeRange === 'month') {
      // Last 30 days
      for (let i = 29; i >= 0; i--) {
        days.push(subDays(today, i));
      }
    }
    
    return days;
  };
  
  const daysInRange = getDaysInRange();
  
  useEffect(() => {
    const fetchHabits = async () => {
      if (!userInfo?.uid) return;
      
      try {
        setLoading(true);
        const userHabits = await habitService.getUserHabits(userInfo.uid);
        setHabits(userHabits);
      } catch (error) {
        console.error('Error fetching habits:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHabits();
  }, [userInfo]);
  
  // Toggle expanded state for a habit
  const toggleExpanded = (habitId: string) => {
    if (expandedHabitId === habitId) {
      setExpandedHabitId(null);
    } else {
      setExpandedHabitId(habitId);
    }
  };
  
  // Calculate stats for all habits in the selected time range
  const calculateStats = () => {
    if (habits.length === 0) return { 
      totalHabits: 0, 
      completedHabits: 0, 
      overallRate: 0,
      bestHabit: null,
      averageStreak: 0
    };
    
    let totalTrackedDays = 0;
    let totalCompletedDays = 0;
    let bestHabitId = '';
    let bestHabitRate = 0;
    let totalStreaks = 0;
    
    // Calculate completion stats
    habits.forEach(habit => {
      if (!habit.completionHistory) return;
      
      let habitCompletedDays = 0;
      let habitTrackedDays = 0;
      
      daysInRange.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const status = habit.completionHistory ? habit.completionHistory[dateStr] : 'untracked';
        
        if (status === 'completed' || status === 'failed') {
          habitTrackedDays++;
          totalTrackedDays++;
          
          if (status === 'completed') {
            habitCompletedDays++;
            totalCompletedDays++;
          }
        }
      });
      
      // Find the best performing habit
      const habitRate = habitTrackedDays > 0 ? (habitCompletedDays / habitTrackedDays) * 100 : 0;
      if (habitRate > bestHabitRate && habitTrackedDays >= 3) { // Minimum 3 tracked days to be considered
        bestHabitRate = habitRate;
        bestHabitId = habit.id;
      }
      
      // Add to total streaks for average calculation
      totalStreaks += habit.streak;
    });
    
    const overallRate = totalTrackedDays > 0 
      ? Math.round((totalCompletedDays / totalTrackedDays) * 100) 
      : 0;
    
    const averageStreak = habits.length > 0 
      ? Math.round(totalStreaks / habits.length) 
      : 0;
    
    // Find the best habit object
    const bestHabit = habits.find(h => h.id === bestHabitId) || null;
    
    return {
      totalHabits: habits.length,
      completedHabits: habits.filter(h => h.streak > 0).length,
      overallRate,
      bestHabit,
      averageStreak
    };
  };
  
  const stats = calculateStats();
  
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
        <Text style={styles.loadingText}>Loading your habits...</Text>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <DateHeader 
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />
      
      <ScrollView style={styles.scrollView}>
        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          <TouchableOpacity 
            style={[
              styles.timeRangeButton, 
              timeRange === 'week' && styles.timeRangeButtonActive
            ]}
            onPress={() => setTimeRange('week')}
          >
            <Text style={[
              styles.timeRangeText,
              timeRange === 'week' && styles.timeRangeTextActive
            ]}>Last 7 Days</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.timeRangeButton, 
              timeRange === 'month' && styles.timeRangeButtonActive
            ]}
            onPress={() => setTimeRange('month')}
          >
            <Text style={[
              styles.timeRangeText,
              timeRange === 'month' && styles.timeRangeTextActive
            ]}>Last 30 Days</Text>
          </TouchableOpacity>
        </View>
        
        {/* Stats Summary Card */}
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>
            {timeRange === 'week' ? '7-Day Overview' : '30-Day Overview'}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.totalHabits}</Text>
              <Text style={styles.statLabel}>Total Habits</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.completedHabits}</Text>
              <Text style={styles.statLabel}>Active Streaks</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{`${stats.overallRate}%`}</Text>
              <Text style={styles.statLabel}>Completion Rate</Text>
            </View>
          </View>
          
          {/* Additional Stats */}
          <View style={styles.additionalStats}>
            <View style={styles.additionalStatRow}>
              <FontAwesome5 name="medal" size={16} color="#4a90e2" style={styles.statIcon} />
              <Text style={styles.additionalStatText}>
                Average Streak: <Text style={styles.additionalStatValue}>{stats.averageStreak} days</Text>
              </Text>
            </View>
            
            {stats.bestHabit && (
              <View style={styles.additionalStatRow}>
                <FontAwesome5 name="trophy" size={16} color="#FFD700" style={styles.statIcon} />
                <Text style={styles.additionalStatText}>
                  Best Habit: <Text style={styles.additionalStatValue}>{stats.bestHabit.name}</Text>
                </Text>
              </View>
            )}
          </View>
        </Card>
        
        {/* Date Range Indicator */}
        <View style={styles.dateRangeContainer}>
          <Text style={styles.dateRangeText}>
            {`${format(daysInRange[0], 'MMM d')} - ${format(daysInRange[daysInRange.length - 1], 'MMM d, yyyy')}`}
          </Text>
        </View>
        
        {habits.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No habits found. Start tracking habits to see your progress here!
            </Text>
          </Card>
        ) : (
          habits.map(habit => (
            <Card key={habit.id} style={styles.habitCard}>
              <TouchableOpacity 
                style={styles.habitHeader}
                onPress={() => toggleExpanded(habit.id)}
                activeOpacity={0.7}
              >
                <View style={styles.habitTitleContainer}>
                  <Text style={styles.habitTitle}>{habit.name}</Text>
                  <Text style={styles.habitSubtitle}>
                    {`Current Streak: ${habit.streak} | Longest: ${habit.longestStreak}`}
                  </Text>
                </View>
                <Ionicons 
                  name={expandedHabitId === habit.id ? 'chevron-up' : 'chevron-down'} 
                  size={24} 
                  color="#4a90e2" 
                />
              </TouchableOpacity>
              
              {expandedHabitId === habit.id && (
                <HabitProgress habit={habit} dates={daysInRange} />
              )}
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4a90e2',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  // Time Range Selector
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  timeRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#EEEEEE',
  },
  timeRangeButtonActive: {
    backgroundColor: '#4a90e2',
  },
  timeRangeText: {
    fontWeight: '500',
    color: '#757575',
  },
  timeRangeTextActive: {
    color: '#FFFFFF',
  },
  // Summary Card
  summaryCard: {
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statBox: {
    alignItems: 'center',
    padding: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4a90e2',
  },
  statLabel: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
  // Additional Stats
  additionalStats: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  additionalStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    marginRight: 8,
  },
  additionalStatText: {
    fontSize: 14,
    color: '#424242',
  },
  additionalStatValue: {
    fontWeight: 'bold',
    color: '#4a90e2',
  },
  // Date Range
  dateRangeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  dateRangeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#424242',
  },
  // Empty State
  emptyCard: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#757575',
  },
  // Habit Cards
  habitCard: {
    marginBottom: 12,
    overflow: 'hidden',
  },
  habitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth:  1,
    borderBottomColor: '#F0F0F0',
  },
  habitTitleContainer: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  habitSubtitle: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
});