// app/(tabs)/dashboard.tsx
import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  TextInput,
  Platform,
  NativeModules 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { goalService, goodDeedService, reflectionService } from '../../services/firebaseService';
import { habitService } from '../../services/habitService';
import { quoteService } from '../../services/quoteService';
import { Quote, Goal, GoodDeed, Reflection, Habit } from '../../models/types';

// Native modules
const { ScreenTime } = NativeModules;

// Device info imports
let DeviceInfo: any = null;
try {
  DeviceInfo = require('react-native-device-info');
} catch (error) {
  console.log('react-native-device-info not installed');
}

export default function Dashboard() {
  const { userInfo } = useAuth();
  const [loading, setLoading] = useState(true);
  const [moodRating, setMoodRating] = useState(7);
  const [stats, setStats] = useState({
    goals: { total: 0, completed: 0 },
    habits: { total: 0, completed: 0, weeklyRate: 0 },
    goodDeeds: { total: 0 },
    reflections: { total: 0 },
    quotes: { total: 0 },
  });
  const [randomQuote, setRandomQuote] = useState<Quote | null>(null);
  const [moodTrend] = useState([6, 7, 5, 8, 7, 6, 7]); // Last 7 days mock data
  const [screenTimeInfo, setScreenTimeInfo] = useState({
    todayScreenTime: 0, // minutes
    weekScreenTime: 0, // minutes
    firstUseToday: null as Date | null,
    lastUseYesterday: null as Date | null,
    hasPermission: false,
  });
  const today = new Date();

  // Load real screen time data from native module
  const loadScreenTimeInfo = useCallback(async () => {
    if (!ScreenTime || Platform.OS !== 'android') return;
    
    try {
      // Check if we have permission
      const hasPermission = await ScreenTime.hasUsageStatsPermission();
      
      if (hasPermission) {
        // Get real screen time data
        const data = await ScreenTime.getScreenTimeData();
        
        setScreenTimeInfo({
          todayScreenTime: Math.round(data.todayScreenTime),
          weekScreenTime: Math.round(data.weekScreenTime),
          firstUseToday: data.firstUseToday > 0 ? new Date(data.firstUseToday) : null,
          lastUseYesterday: data.lastUseYesterday > 0 ? new Date(data.lastUseYesterday) : null,
          hasPermission: true,
        });
      } else {
        setScreenTimeInfo(prev => ({ ...prev, hasPermission: false }));
      }
    } catch (error) {
      console.error('Error loading screen time data:', error);
      setScreenTimeInfo(prev => ({ ...prev, hasPermission: false }));
    }
  }, []);

  // Request screen time permission
  const requestScreenTimePermission = () => {
    if (ScreenTime && Platform.OS === 'android') {
      ScreenTime.requestUsageStatsPermission();
      // Reload data after user potentially grants permission
      setTimeout(() => loadScreenTimeInfo(), 2000);
    }
  };

  // Calculate real active streaks (must be >= 2 days AND completed yesterday)
  const calculateActiveStreaks = (habits: Habit[]): number => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
    
    return habits.filter(habit => {
      // Must have streak >= 2 (at least 2 consecutive days)
      if (habit.streak < 2) return false;
      
      // Must have been completed yesterday to be "active"
      if (!habit.completionHistory) return false;
      
      const yesterdayStatus = habit.completionHistory[yesterdayStr];
      return yesterdayStatus === 'completed';
    }).length;
  };
  const calculateWeeklyHabitCompletion = (habits: Habit[]): number => {
    if (habits.length === 0) return 0;
    
    let totalPossibleCompletions = 0;
    let totalActualCompletions = 0;
    
    // Get last 7 days
    const last7Days: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last7Days.push(date);
    }
    
    habits.forEach(habit => {
      last7Days.forEach(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const status = habit.completionHistory?.[dateStr];
        
        // Count every day for every habit as a possible completion
        totalPossibleCompletions++;
        
        // Only count as completed if explicitly marked as 'completed'
        if (status === 'completed') {
          totalActualCompletions++;
        }
        // All other cases (untracked, failed, undefined) = not completed
      });
    });
    
    return totalPossibleCompletions > 0 
      ? Math.round((totalActualCompletions / totalPossibleCompletions) * 100) 
      : 0;
  };

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    if (!userInfo?.uid) return;

    try {
      setLoading(true);
      
      // Get today's data and all habits for weekly calculation
      let goals: Goal[] = [];
      let allHabits: Habit[] = [];
      let todayHabits: Habit[] = [];
      let goodDeeds: GoodDeed[] = [];
      let reflections: Reflection[] = [];
      let quotes: Quote[] = [];
      
      try {
        goals = await goalService.getItemsByDate(userInfo.uid, today);
        allHabits = await habitService.getUserHabits(userInfo.uid); // Get all habits for weekly calc
        todayHabits = await habitService.getActiveHabitsForToday(userInfo.uid);
        goodDeeds = await goodDeedService.getItemsByDate(userInfo.uid, today);
        reflections = await reflectionService.getItemsByDate(userInfo.uid, today);
        quotes = await quoteService.getUserItems(userInfo.uid);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
      
      const completedGoals = goals.filter(goal => goal.completed);
      const activeStreaks = calculateActiveStreaks(allHabits);
      const weeklyHabitCompletion = calculateWeeklyHabitCompletion(allHabits);
      const randomIndex = quotes.length > 0 ? Math.floor(Math.random() * quotes.length) : null;
      
      setStats({
        goals: { 
          total: goals.length, 
          completed: completedGoals.length 
        },
        habits: {
          total: allHabits.length,
          completed: activeStreaks, // This is now the count of habits with streaks > 0
          weeklyRate: weeklyHabitCompletion
        },
        goodDeeds: { total: goodDeeds.length },
        reflections: { total: reflections.length },
        quotes: { total: quotes.length },
      });
      
      if (randomIndex !== null) {
        setRandomQuote(quotes[randomIndex]);
      }
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [userInfo?.uid, today]);

  const [initialLoadDone, setInitialLoadDone] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      if (!initialLoadDone) {
        loadDashboardData()
          .then(() => loadScreenTimeInfo())
          .catch(err => {
            console.error('Error loading dashboard data:', err);
          })
          .finally(() => {
            setInitialLoadDone(true);
          });
      }
      
      return () => {
        // Optional cleanup if needed
      };
    }, []) // Empty dependency array - only run once
  );

  useEffect(() => {
    if (!initialLoadDone) {
      loadDashboardData()
        .then(() => loadScreenTimeInfo())
        .catch(err => {
          console.error('Error loading dashboard data:', err);
        })
        .finally(() => {
          setInitialLoadDone(true);
        });
    }
  }, []); // Empty dependency array - only run once

  // Save entry functions
  const saveEntry = async (type: string, value: string | number) => {
    if (!userInfo?.uid) return;
    
    try {
      if (type === 'mood') {
        // For now, just log mood - you might want to store this in a separate collection
        console.log(`Saving mood: ${value}`);
      }
    } catch (error) {
      console.error(`Error saving ${type}:`, error);
    }
  };

  // Navigation handlers
  const navigateToGoals = () => {
    router.push('/(modals)/goals');
  };

  const navigateToHabits = () => {
    router.push('/(tabs)/habits');
  };

  const navigateToGoodDeeds = () => {
    router.push('/(modals)/good-deeds');
  };

  const navigateToReflections = () => {
    router.push('/(modals)/reflections');
  };

  const navigateToQuotes = () => {
    router.navigate('/(tabs)/quotes');
  };

  // Mood Selector Component
  const MoodSelector = () => (
    <View style={styles.moodCard}>
      <Text style={styles.moodTitle}>🌟 How I Feel Today</Text>
      <View style={styles.moodContainer}>
        <Text style={styles.moodLabel}>Low</Text>
        <View style={styles.moodButtons}>
          {[1,2,3,4,5,6,7,8,9,10].map(num => (
            <TouchableOpacity
              key={num}
              onPress={() => {
                setMoodRating(num);
                saveEntry('mood', num);
              }}
              style={[
                styles.moodButton,
                moodRating === num && styles.selectedMoodButton
              ]}
            >
              <Text style={[
                styles.moodButtonText,
                moodRating === num && styles.selectedMoodButtonText
              ]}>
                {num}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.moodLabel}>High</Text>
      </View>
      <Text style={styles.currentMoodText}>Currently: {moodRating}/10</Text>
    </View>
  );

  // Journal Question Component
  const JournalQuestion = ({ emoji, question, value, onChange, placeholder }: {
    emoji: string;
    question: string;
    value: string;
    onChange: (text: string) => void;
    placeholder: string;
  }) => (
    <View style={styles.journalCard}>
      <Text style={styles.journalTitle}>{emoji} {question}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        onBlur={() => {
          if (question.includes('good')) {
            saveEntry('goodDeed', value);
          } else {
            saveEntry('reflection', value);
          }
        }}
        placeholder={placeholder}
        style={styles.journalInput}
        multiline
        textAlignVertical="top"
      />
      <Text style={styles.autoSaveText}>Auto-saves when you stop typing</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading your journey...</Text>
      </View>
    );
  }

  const weeklyHabitCompletionRate = stats.habits.weeklyRate;

  return (
    <View style={styles.container}>
      {/* Status Bar Mockup */}
      <View style={styles.statusBar}>
        <Text style={styles.statusTime}>12:17</Text>
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header - More Prominent Date */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{format(today, 'MMMM d, yyyy')}</Text>
          <Text style={styles.headerSubtitle}>{format(today, 'EEEE')}</Text>
        </View>

        {/* Quote of the Day - From DB */}
        {randomQuote && (
          <View style={styles.quoteCard}>
            <View style={styles.quoteIconContainer}>
              <Text style={styles.quoteIcon}>💭</Text>
            </View>
            <Text style={styles.quoteText}>"{randomQuote.text}"</Text>
            <Text style={styles.quoteAuthor}>— {randomQuote.author}</Text>
          </View>
        )}

        {/* Mood Trend */}
        <View style={styles.trendCard}>
          <View style={styles.trendHeader}>
            <Ionicons name="trending-up" size={18} color="#3498db" />
            <Text style={styles.trendTitle}>How You're Feeling This Week</Text>
          </View>
          <View style={styles.moodChart}>
            {moodTrend.map((mood, index) => (
              <View key={index} style={styles.chartColumn}>
                <View 
                  style={[styles.chartBar, { height: mood * 6 }]}
                />
                <Text style={styles.chartLabel}>{mood}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.averageText}>
            Average: 6.6/10 (↗️ +0.4 from last week)
          </Text>
        </View>

        {/* Stats Grid - Real DB Data */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{weeklyHabitCompletionRate}%</Text>
            <Text style={styles.statLabel}>Habits This Week</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.habits.completed}</Text>
            <Text style={styles.statLabel}>Active Streaks</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.goals.completed}</Text>
            <Text style={styles.statLabel}>Goals Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.goals.total - stats.goals.completed}</Text>
            <Text style={styles.statLabel}>Pending Goals</Text>
          </View>
        </View>

        {/* Mood Selector */}
        <MoodSelector />

        {/* Screen Time Insights - Real Native Data */}
        <View style={styles.insightsCard}>
          <Text style={styles.insightsTitle}>📱 Screen Time Insights</Text>
          {ScreenTime && Platform.OS === 'android' ? (
            screenTimeInfo.hasPermission ? (
              <>
                <View style={styles.insightItem}>
                  <Text style={styles.insightLabel}>Screen Time Today:</Text>
                  <Text style={styles.insightValue}>
                    {Math.floor(screenTimeInfo.todayScreenTime / 60)}h {screenTimeInfo.todayScreenTime % 60}m
                    {screenTimeInfo.todayScreenTime > 180 ? ' 📱 High usage' : ' ✅ Moderate'}
                  </Text>
                </View>
                <View style={styles.insightItem}>
                  <Text style={styles.insightLabel}>Screen Time This Week:</Text>
                  <Text style={styles.insightValue}>
                    {Math.floor(screenTimeInfo.weekScreenTime / 60)}h {screenTimeInfo.weekScreenTime % 60}m
                    {screenTimeInfo.weekScreenTime > 1260 ? ' 📱 Very high' : ' ✅ Reasonable'}
                  </Text>
                </View>
                {screenTimeInfo.firstUseToday && (
                  <View style={styles.insightItem}>
                    <Text style={styles.insightLabel}>First Use Today:</Text>
                    <Text style={styles.insightValue}>
                      {format(screenTimeInfo.firstUseToday, 'h:mm a')}
                      {screenTimeInfo.firstUseToday.getHours() < 7 ? ' 🌅 Very early' : ' ☀️ Good'}
                    </Text>
                  </View>
                )}
                {screenTimeInfo.lastUseYesterday && (
                  <View style={styles.insightItem}>
                    <Text style={styles.insightLabel}>Last Use Yesterday:</Text>
                    <Text style={styles.insightValue}>
                      {format(screenTimeInfo.lastUseYesterday, 'h:mm a')}
                      {screenTimeInfo.lastUseYesterday.getHours() > 22 ? ' 🌙 Late night' : ' ✅ Good timing'}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <TouchableOpacity 
                style={styles.permissionButton}
                onPress={requestScreenTimePermission}
              >
                <Text style={styles.permissionButtonText}>
                  📊 Grant Usage Stats Permission
                </Text>
              </TouchableOpacity>
            )
          ) : (
            <Text style={styles.noDataText}>
              Native screen time module not available
            </Text>
          )}
        </View>

        {/* Weekly Analysis - Real Insights */}
        <View style={styles.analysisCard}>
          <Text style={styles.analysisTitle}>📊 This Week's Real Insights</Text>
          <View style={styles.insightItem}>
            <Text style={styles.insightLabel}>Habit Performance:</Text>
            <Text style={styles.insightValue}>
              {weeklyHabitCompletionRate}% completion rate ({weeklyHabitCompletionRate < 50 ? 'Needs improvement' : weeklyHabitCompletionRate < 80 ? 'Good progress' : 'Excellent!'})
            </Text>
          </View>
          <View style={styles.insightItem}>
            <Text style={styles.insightLabel}>Active Streaks:</Text>
            <Text style={styles.insightValue}>
              {stats.habits.completed > 0 ? `${stats.habits.completed} real streaks (2+ days, done yesterday)` : 'No active streaks - need 2+ consecutive days'}
            </Text>
          </View>
          <View style={styles.insightItem}>
            <Text style={styles.insightLabel}>Goal Progress:</Text>
            <Text style={styles.insightValue}>
              {stats.goals.completed}/{stats.goals.total} completed today ({stats.goals.total > 0 ? Math.round((stats.goals.completed/stats.goals.total)*100) : 0}%)
            </Text>
          </View>
        </View>

        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f8fa',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3498db',
  },
  statusTime: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  statusIcons: {
    color: 'white',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f8fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Extra padding for tab bar
  },
  header: {
    backgroundColor: '#3498db',
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  quoteCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  quoteIconContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quoteIcon: {
    fontSize: 16,
  },
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#2c3e50',
    lineHeight: 24,
    marginBottom: 12,
    paddingRight: 40,
  },
  quoteAuthor: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
    textAlign: 'right',
  },
  trendCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  trendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 8,
  },
  moodChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 60,
    marginBottom: 12,
  },
  chartColumn: {
    alignItems: 'center',
    gap: 4,
  },
  chartBar: {
    width: 20,
    backgroundColor: '#3498db',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  chartLabel: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  averageText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#7f8c8d',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  moodCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  moodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  moodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  moodLabel: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  moodButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  moodButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ecf0f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedMoodButton: {
    backgroundColor: '#3498db',
    transform: [{ scale: 1.1 }],
  },
  moodButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  selectedMoodButtonText: {
    color: 'white',
  },
  currentMoodText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#7f8c8d',
  },
  journalCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  journalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  journalInput: {
    borderWidth: 1,
    borderColor: '#ecf0f1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2c3e50',
    minHeight: 80,
    backgroundColor: '#fafafa',
  },
  autoSaveText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 8,
  },
  insightsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  insightItem: {
    marginBottom: 8,
  },
  insightLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  insightValue: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  analysisCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  noDataText: {
    fontSize: 12,
    color: '#95a5a6',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  // Screen Time Card - Completely New UX
  screenTimeCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    marginHorizontal: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  // Hero Section - Big Time Display
  heroContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#667eea',
  },
  heroContent: {
    flex: 1,
  },
  heroLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
    fontWeight: '500',
  },
  heroTimeContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  heroHours: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    lineHeight: 48,
  },
  heroHoursLabel: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    marginRight: 8,
    marginLeft: 2,
  },
  heroMinutes: {
    fontSize: 32,
    fontWeight: '600',
    color: 'white',
    lineHeight: 32,
  },
  heroMinutesLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 2,
  },
  highUsageBar: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  goodUsageBar: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  phoneIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneIcon: {
    fontSize: 28,
  },
  // Quick Stats Grid
  quickStatsGrid: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  // Timeline
  timelineContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  timelineItems: {
    gap: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 16,
  },
  morningDot: {
    backgroundColor: '#fbbf24',
  },
  eveningDot: {
    backgroundColor: '#8b5cf6',
  },
  timelineContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  timelineLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  // Permission State
  permissionContainer: {
    padding: 32,
  },
  permissionContent: {
    alignItems: 'center',
  },
  permissionIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  permissionIconLarge: {
    fontSize: 36,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  enableButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  enableButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingState: {
    padding: 40,
    alignItems: 'center',
  },
  bottomPadding: {
    height: 24,
  },
  permissionButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  }
});