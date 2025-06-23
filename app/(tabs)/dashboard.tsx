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
  Platform,
  NativeModules,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { quoteService } from '../../services/quoteService';
import { analyticsService, PeriodStats } from '../../services/analyticsService';
import { Quote } from '../../models/types';

// Native modules
const { ScreenTime } = NativeModules;
const { width } = Dimensions.get('window');

type ViewPeriod = 'today' | 'week' | 'month';

export default function Dashboard() {
  const { userInfo } = useAuth();
  const [loading, setLoading] = useState(true);
  const [periodLoading, setPeriodLoading] = useState(false);
  const [viewPeriod, setViewPeriod] = useState<ViewPeriod>('today');
  const [todayStats, setTodayStats] = useState<PeriodStats>({
    goals: { total: 0, completed: 0, rate: 0 },
    habits: { completed: 0, rate: 0, totalHabits: 0 },
    goodDeeds: { total: 0 },
    reflections: { total: 0 },
  });
  const [weeklyStats, setWeeklyStats] = useState<PeriodStats | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<PeriodStats | null>(null);
  const [randomQuote, setRandomQuote] = useState<Quote | null>(null);
  const [screenTimeInfo, setScreenTimeInfo] = useState({
    todayScreenTime: 0,
    yesterdayScreenTime: 0,
    weekScreenTime: 0,
    firstUseToday: null as Date | null,
    lastUseYesterday: null as Date | null,
    hasPermission: false,
  });
  const today = new Date();

  // Handle period change with loading
  const handlePeriodChange = async (newPeriod: ViewPeriod) => {
    if (newPeriod === viewPeriod) return;
    
    setViewPeriod(newPeriod);
    
    // If switching to week/month and we don't have that data yet, load it
    if (newPeriod === 'week' && !weeklyStats) {
      setPeriodLoading(true);
      try {
        const stats = await analyticsService.getWeeklyStats(userInfo!.uid);
        setWeeklyStats(stats);
      } catch (error) {
        console.error('Error loading weekly stats:', error);
      } finally {
        setPeriodLoading(false);
      }
    } else if (newPeriod === 'month' && !monthlyStats) {
      setPeriodLoading(true);
      try {
        const stats = await analyticsService.getMonthlyStats(userInfo!.uid);
        setMonthlyStats(stats);
      } catch (error) {
        console.error('Error loading monthly stats:', error);
      } finally {
        setPeriodLoading(false);
      }
    }
  };

  // Fast essential data loading
  const loadEssentialData = async () => {
    if (!userInfo?.uid) return;

    try {
      setLoading(true);

      // Use the analytics service for today's stats
      const [todayStatsData, quotes] = await Promise.all([
        analyticsService.getTodayStats(userInfo.uid),
        quoteService.getUserItems(userInfo.uid).catch(() => [])
      ]);

      // Set today's stats
      setTodayStats(todayStatsData);

      // Set random quote
      if (quotes.length > 0) {
        const randomIndex = Math.floor(Math.random() * quotes.length);
        setRandomQuote(quotes[randomIndex]);
      }

    } catch (error) {
      console.error('Error loading essential data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Screen time functions (needed for Screen Time Card)
  const loadScreenTimeInfo = useCallback(async () => {
    if (!ScreenTime || Platform.OS !== 'android') return;

    try {
      const hasPermission = await ScreenTime.hasUsageStatsPermission();
      if (hasPermission) {
        const data = await ScreenTime.getScreenTimeData();
        setScreenTimeInfo({
          todayScreenTime: Math.round(data.todayScreenTime),
          yesterdayScreenTime: Math.round(data.yesterdayScreenTime || 0),
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

  const requestScreenTimePermission = () => {
    if (ScreenTime && Platform.OS === 'android') {
      ScreenTime.requestUsageStatsPermission();
      setTimeout(() => loadScreenTimeInfo(), 2000);
    }
  };

  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // useFocusEffect(
  //   React.useCallback(() => {
  //     if (!initialLoadDone && userInfo?.uid) {
  //       loadEssentialData()
  //         .then(() => {
  //           setInitialLoadDone(true);
  //           // Load screen time in background
  //           loadScreenTimeInfo();
  //         })
  //         .catch(err => {
  //           console.error('Error loading essential data:', err);
  //           setLoading(false);
  //         });
  //     }
  //   }, [userInfo?.uid])
  // );

  useFocusEffect(
    React.useCallback(() => {
      if (!initialLoadDone && userInfo?.uid) {
        loadEssentialData()
          .then(() => {
            setInitialLoadDone(true);
            loadScreenTimeInfo(); // Initial load
          });
      } else if (initialLoadDone) {
        // Smart update: refresh screen time when returning to dashboard
        loadScreenTimeInfo();
      }
    }, [userInfo?.uid, initialLoadDone])
  );

  // Get current stats based on view period
  const getCurrentStats = (): PeriodStats => {
    if (viewPeriod === 'today') return todayStats;
    if (viewPeriod === 'week') return weeklyStats || todayStats;
    if (viewPeriod === 'month') return monthlyStats || todayStats;
    return todayStats;
  };

  const currentStats = getCurrentStats();

  // Helpers to color code screen time
  const getDailyColor = (minutes: number) => {
    const hours = minutes / 60;
    if (hours <= 2) {
      return '#10b981';
    }
    if (hours < 5) {
      return '#f59e0b';
    }
    return '#ef4444';
  };

  const getWeekColor = (minutes: number) => {
    const hours = minutes / 60;
    if (hours <= 20) {
      return '#10b981';
    }
    if (hours <= 35) {
      return '#f59e0b';
    }
    return '#ef4444';
  };

  // Screen time visualization using updated thresholds
  const getScreenTimeStatus = () => {
    if (screenTimeInfo.todayScreenTime <= 120) {
      return { color: '#10b981', emoji: '🟢', status: 'Great!' };
    }
    if (screenTimeInfo.todayScreenTime < 300) {
      return { color: '#f59e0b', emoji: '🟠', status: 'Moderate' };
    }
    return { color: '#ef4444', emoji: '🔴', status: 'High' };
  };

  const screenTimeStatus = getScreenTimeStatus();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading your journey...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{format(today, 'MMMM d, yyyy')}</Text>
          <Text style={styles.headerSubtitle}>{format(today, 'EEEE')}</Text>
        </View>

        {/* Period Toggle */}
        <View style={styles.periodToggle}>
          <TouchableOpacity 
            style={[styles.periodButton, viewPeriod === 'today' && styles.activePeriodButton]}
            onPress={() => handlePeriodChange('today')}
          >
            <Text style={[styles.periodText, viewPeriod === 'today' && styles.activePeriodText]}>
              Today
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.periodButton, viewPeriod === 'week' && styles.activePeriodButton]}
            onPress={() => handlePeriodChange('week')}
          >
            <Text style={[styles.periodText, viewPeriod === 'week' && styles.activePeriodText]}>
              This Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.periodButton, viewPeriod === 'month' && styles.activePeriodButton]}
            onPress={() => handlePeriodChange('month')}
          >
            <Text style={[styles.periodText, viewPeriod === 'month' && styles.activePeriodText]}>
              This Month
            </Text>
          </TouchableOpacity>
        </View>

        {/* Insights Summary */}
        <View style={styles.insightsCard}>
          <View style={styles.insightsHeader}>
            <Ionicons name="analytics" size={20} color="#3498db" />
            <Text style={styles.insightsTitle}>
              {viewPeriod === 'today' ? 'Today' : viewPeriod === 'week' ? 'Week' : 'Month'} Insights
            </Text>
            {periodLoading && (
              <ActivityIndicator size="small" color="#3498db" style={{ marginLeft: 8 }} />
            )}
          </View>
          
          <View style={styles.insightsGrid}>
            <View style={styles.insightItem}>
              <View style={styles.insightIconContainer}>
                <Ionicons name="checkmark-circle" size={18} color="#10b981" />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightValue}>
                  {currentStats.habits.rate}%
                </Text>
                <Text style={styles.insightLabel}>Habit Success</Text>
              </View>
            </View>

            <View style={styles.insightItem}>
              <View style={styles.insightIconContainer}>
                <Ionicons name="flame" size={18} color="#f59e0b" />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightValue}>{currentStats.habits.completed}</Text>
                <Text style={styles.insightLabel}>Active Streaks</Text>
              </View>
            </View>

            <View style={styles.insightItem}>
              <View style={styles.insightIconContainer}>
                <Ionicons name="flag" size={18} color="#8b5cf6" />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightValue}>
                  {currentStats.goals.completed}/{currentStats.goals.total}
                </Text>
                <Text style={styles.insightLabel}>Goals Done</Text>
              </View>
            </View>

            <View style={styles.insightItem}>
              <View style={styles.insightIconContainer}>
                <Ionicons name="heart" size={18} color="#ec4899" />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightValue}>{currentStats.goodDeeds.total}</Text>
                <Text style={styles.insightLabel}>Good Deeds</Text>
              </View>
            </View>
          </View>

          {/* Progress Summary */}
          <View style={styles.progressSummary}>
            <Text style={styles.progressText}>
              {currentStats.habits.rate > 80 
                ? "🎉 Excellent progress! You're crushing your habits." 
                : currentStats.habits.rate > 60
                ? "💪 Good momentum! Keep pushing forward."
                : "🌱 Every small step counts. You've got this!"}
            </Text>
          </View>
        </View>

        {/* Quote of the Day */}
        {randomQuote && (
          <View style={styles.quoteCard}>
            <View style={styles.quoteHeader}>
              <Ionicons name="chatbubble-ellipses" size={16} color="#3498db" />
              <Text style={styles.quoteHeaderText}>Daily Inspiration</Text>
            </View>
            <Text style={styles.quoteText}>"{randomQuote.text}"</Text>
            <Text style={styles.quoteAuthor}>— {randomQuote.author}</Text>
          </View>
        )}

        {/* Enhanced Screen Time Card */}
        <View style={styles.screenTimeCard}>
          <View style={styles.screenTimeHeader}>
            <View style={styles.screenTimeHeaderLeft}>
              <Ionicons name="phone-portrait" size={20} color="#3498db" />
              <Text style={styles.screenTimeTitle}>Screen Time</Text>
            </View>
            <Text style={styles.screenTimeEmoji}>{screenTimeStatus.emoji}</Text>
          </View>

          {screenTimeInfo.hasPermission ? (
            <>
              {/* Main Screen Time Display */}
              <View style={styles.screenTimeMain}>
                <View style={styles.screenTimeToday}>
                  <Text style={[styles.screenTimeValue, { color: screenTimeStatus.color }]}>
                    {Math.floor(screenTimeInfo.todayScreenTime / 60)}h {screenTimeInfo.todayScreenTime % 60}m
                  </Text>
                  <Text style={styles.screenTimeLabel}>Today</Text>
                  <Text style={[styles.screenTimeStatus, { color: screenTimeStatus.color }]}>
                    {screenTimeStatus.status}
                  </Text>
                </View>

                {/* Comparison Chart */}
                <View style={styles.screenTimeChart}>
                  <View style={styles.chartBar}>
                    <View style={styles.chartLabel}>
                      <Text style={styles.chartDay}>Today</Text>
                    </View>
                    <View style={styles.chartBarContainer}>
                      <View
                        style={[
                          styles.chartBarFill,
                          {
                            height: Math.min((screenTimeInfo.todayScreenTime / 480) * 40, 40),
                            backgroundColor: getDailyColor(screenTimeInfo.todayScreenTime)
                          }
                        ]}
                      />
                    </View>
                    <Text style={[styles.chartValue, { color: getDailyColor(screenTimeInfo.todayScreenTime) }]}>
                      {Math.floor(screenTimeInfo.todayScreenTime / 60)}h
                    </Text>
                  </View>

                  <View style={styles.chartBar}>
                    <View style={styles.chartLabel}>
                      <Text style={styles.chartDay}>Yesterday</Text>
                    </View>
                    <View style={styles.chartBarContainer}>
                      <View
                        style={[
                          styles.chartBarFill,
                          {
                            height: Math.min((screenTimeInfo.yesterdayScreenTime / 480) * 40, 40),
                            backgroundColor: getDailyColor(screenTimeInfo.yesterdayScreenTime)
                          }
                        ]}
                      />
                    </View>
                    <Text style={[styles.chartValue, { color: getDailyColor(screenTimeInfo.yesterdayScreenTime) }]}>
                      {Math.floor(screenTimeInfo.yesterdayScreenTime / 60)}h
                    </Text>
                  </View>

                  <View style={styles.chartBar}>
                    <View style={styles.chartLabel}>
                      <Text style={styles.chartDay}>Week Avg</Text>
                    </View>
                    <View style={styles.chartBarContainer}>
                      <View
                        style={[
                          styles.chartBarFill,
                          {
                            height: Math.min(((screenTimeInfo.weekScreenTime / 7) / 480) * 40, 40),
                            backgroundColor: getWeekColor(screenTimeInfo.weekScreenTime)
                          }
                        ]}
                      />
                    </View>
                    <Text style={[styles.chartValue, { color: getWeekColor(screenTimeInfo.weekScreenTime) }]}>
                      {Math.floor((screenTimeInfo.weekScreenTime / 7) / 60)}h
                    </Text>
                  </View>
                </View>
              </View>

              {/* Usage Timeline */}
              <View style={styles.usageTimeline}>
                <Text style={styles.timelineTitle}>📅 Usage Pattern</Text>
                <View style={styles.timelineGrid}>
                  <View style={styles.timelineItem}>
                    <View style={styles.timelineDot} />
                    <View style={styles.timelineInfo}>
                      <Text style={styles.timelineLabel}>First use today</Text>
                      <Text style={styles.timelineTime}>
                        {screenTimeInfo.firstUseToday
                          ? format(screenTimeInfo.firstUseToday, 'h:mm a')
                          : 'Not tracked'
                        }
                      </Text>
                    </View>
                  </View>

                  <View style={styles.timelineItem}>
                    <View style={[styles.timelineDot, { backgroundColor: '#8b5cf6' }]} />
                    <View style={styles.timelineInfo}>
                      <Text style={styles.timelineLabel}>Last use yesterday</Text>
                      <Text style={styles.timelineTime}>
                        {screenTimeInfo.lastUseYesterday
                          ? format(screenTimeInfo.lastUseYesterday, 'h:mm a')
                          : 'Not tracked'
                        }
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </>
          ) : (
            <TouchableOpacity
              style={styles.enableButton}
              onPress={requestScreenTimePermission}
            >
              <Ionicons name="settings" size={20} color="white" />
              <Text style={styles.enableButtonText}>Enable Screen Time Tracking</Text>
            </TouchableOpacity>
          )}
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
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  scrollView: {
    flex: 1,
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
  // Period Toggle
  periodToggle: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activePeriodButton: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  activePeriodText: {
    color: '#3498db',
  },
  // Insights Card
  insightsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginLeft: 8,
  },
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    flex: 1,
    minWidth: '45%',
  },
  insightIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  insightContent: {
    flex: 1,
  },
  insightValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  insightLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  progressSummary: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#3498db',
  },
  progressText: {
    fontSize: 14,
    color: '#1e293b',
    lineHeight: 20,
  },
  // Quote Card
  quoteCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  quoteHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3498db',
    marginLeft: 6,
  },
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#374151',
    lineHeight: 24,
    marginBottom: 8,
  },
  quoteAuthor: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'right',
  },
  // Screen Time Card
  screenTimeCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  screenTimeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  screenTimeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  screenTimeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginLeft: 8,
  },
  screenTimeEmoji: {
    fontSize: 20,
  },
  screenTimeMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  screenTimeToday: {
    flex: 1,
  },
  screenTimeValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  screenTimeLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  screenTimeStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Screen Time Chart
  screenTimeChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    flex: 1,
  },
  chartBar: {
    alignItems: 'center',
    width: 50,
  },
  chartLabel: {
    marginBottom: 8,
  },
  chartDay: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
  },
  chartBarContainer: {
    height: 40,
    width: 20,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    justifyContent: 'flex-end',
    marginBottom: 6,
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 10,
  },
  chartValue: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  // Usage Timeline
  usageTimeline: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  timelineGrid: {
    gap: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3498db',
    marginRight: 12,
  },
  timelineInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  timelineTime: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  // Enable Button
  enableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3498db',
    borderRadius: 12,
    padding: 16,
  },
  enableButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomPadding: {
    height: 24,
  },
});