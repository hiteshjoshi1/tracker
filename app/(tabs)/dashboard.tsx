// app/(tabs)/dashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { goalService, goodDeedService, reflectionService } from '../../services/firebaseService';
import { quoteService } from '../../services/quoteService';
import { Quote, Goal, GoodDeed, Reflection } from '../../models/types';
import Card from '../../components/Card';
import ProgressBar from '../../components/ProgressBar';
import TouchableSection from '../../components/TouchableSection';

export default function Dashboard() {
  const { userInfo } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    goals: { total: 0, completed: 0 },
    goodDeeds: { total: 0 },
    reflections: { total: 0 },
    quotes: { total: 0 },
  });
  const [randomQuote, setRandomQuote] = useState<Quote | null>(null);
  const today = new Date();

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    if (!userInfo?.uid) return;

    try {
      setLoading(true);
      
      // Get today's goals
      let goals: Goal[] = [];
      let goodDeeds: GoodDeed[] = [];
      let reflections: Reflection[] = [];
      let quotes: Quote[] = [];
      
      try {
        goals = await goalService.getItemsByDate(userInfo.uid, today);
      } catch (error) {
        console.error('Error loading goals:', error);
        goals = [];
      }
      
      try {
        goodDeeds = await goodDeedService.getItemsByDate(userInfo.uid, today);
      } catch (error) {
        console.error('Error loading good deeds:', error);
        goodDeeds = [];
      }
      
      try {
        reflections = await reflectionService.getItemsByDate(userInfo.uid, today);
      } catch (error) {
        console.error('Error loading reflections:', error);
        reflections = [];
      }
      
      try {
        quotes = await quoteService.getUserItems(userInfo.uid);
      } catch (error) {
        console.error('Error loading quotes:', error);
        quotes = [];
      }
      
      const completedGoals = goals.filter(goal => goal.completed);
      const randomIndex = quotes.length > 0 ? Math.floor(Math.random() * quotes.length) : null;
      
      setStats({
        goals: { 
          total: goals.length, 
          completed: completedGoals.length 
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

  // Track whether initial load has happened
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Load data only when screen comes into focus and initial load hasn't happened
  useFocusEffect(
    React.useCallback(() => {
      // Only load data when focused if initial load hasn't been done
      if (!initialLoadDone) {
        loadDashboardData()
          .catch(err => {
            console.error('Error loading dashboard data:', err);
          })
          .finally(() => {
            setInitialLoadDone(true);
          });
      }
      
      // Cleanup function
      return () => {
        // Optional cleanup if needed
      };
    }, [loadDashboardData, initialLoadDone])
  );

  // Initial load - only happens once
  useEffect(() => {
    if (!initialLoadDone) {
      loadDashboardData()
        .catch(err => {
          console.error('Error loading dashboard data:', err);
        })
        .finally(() => {
          setInitialLoadDone(true);
        });
    }
    
    // No dependency on initialLoadDone to prevent re-running
  }, [loadDashboardData]);

  // Navigation handlers
  const navigateToGoals = () => {
    try {
      // In the future, this should navigate to a dedicated goals screen
      // For now, we'll handle goals in the dashboard temporarily
      router.push('/(modals)/goals');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const navigateToGoodDeeds = () => {
    try {
      router.push('/(modals)/good-deeds');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const navigateToReflections = () => {
    try {
      router.push('/(modals)/reflections');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const navigateToQuotes = () => {
    try {
      router.navigate('/(tabs)/quotes');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  // Calculated values with error handling
  let goalProgress = 0;
  try {
    goalProgress = stats.goals.total > 0 
      ? (stats.goals.completed / stats.goals.total) 
      : 0;
  } catch (error) {
    console.error('Error calculating goalProgress:', error);
  }

  // Render with error handling
  try {
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Journey</Text>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.scrollView}>
          {/* Date card */}
          <Card style={styles.dateCard}>
            <Text style={styles.dateText}>{format(today, 'MMMM d, yyyy')}</Text>
            <Text style={styles.dayText}>{format(today, 'EEEE')}</Text>
          </Card>
          
          {/* Progress overview */}
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Today's Progress</Text>
            <ProgressBar progress={goalProgress} />
            <View style={styles.progressDetails}>
              <Text style={styles.progressText}>
                {stats.goals.completed}/{stats.goals.total} tasks completed
              </Text>
              <Text style={styles.percentText}>
                {Math.round(goalProgress * 100)}%
              </Text>
            </View>
          </Card>
          
          {/* Section Navigation */}
          <Card style={styles.sectionsCard}>
            <TouchableSection 
              title="Goals" 
              count={stats.goals.total} 
              onPress={navigateToGoals}
              icon="checkmark-circle-outline" 
            />
            
            <View style={styles.divider} />
            
            <TouchableSection 
              title="Good Deeds" 
              count={stats.goodDeeds.total} 
              onPress={navigateToGoodDeeds}
              icon="heart-outline" 
            />
            
            <View style={styles.divider} />
            
            <TouchableSection 
              title="Reflections" 
              count={stats.reflections.total} 
              onPress={navigateToReflections}
              icon="book-outline" 
            />
          </Card>
          
          {/* Quote of the day */}
          {randomQuote ? (
            <Card style={styles.quoteCard}>
              <Text style={styles.quoteTitle}>Quote of the Day</Text>
              <Text style={styles.quoteText}>"{randomQuote.text}"</Text>
              <Text style={styles.quoteAuthor}>- {randomQuote.author}</Text>
              <TouchableOpacity 
                style={styles.moreQuotesButton}
                onPress={navigateToQuotes}
              >
                <Text style={styles.moreQuotesText}>More Quotes</Text>
                <Ionicons name="chevron-forward" size={16} color="#3498db" />
              </TouchableOpacity>
            </Card>
          ) : (
            <Card style={styles.quoteCard}>
              <Text style={styles.quoteTitle}>Add Your First Quote</Text>
              <Text style={styles.emptyQuoteText}>
                Save your favorite quotes to get inspired throughout your journey.
              </Text>
              <TouchableOpacity 
                style={styles.addQuoteButton}
                onPress={navigateToQuotes}
              >
                <Text style={styles.addQuoteText}>Add Quote</Text>
              </TouchableOpacity>
            </Card>
          )}
          
          {/* Extra padding for bottom */}
          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>
    );
  } catch (error) {
    console.error('Error rendering Dashboard:', error);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>
          {error instanceof Error ? error.message : 'Unknown error occurred'}
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f8fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
  },
  header: {
    backgroundColor: '#3498db',
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  dateCard: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 16,
  },
  dateText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#34495e',
  },
  dayText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 4,
  },
  card: {
    marginTop: 16,
    padding: 16,
  },
  sectionsCard: {
    marginTop: 16,
    padding: 0, // Remove padding for sections
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34495e',
    marginBottom: 12,
  },
  progressDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  percentText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3498db',
  },
  divider: {
    height: 1,
    backgroundColor: '#ecf0f1',
  },
  quoteCard: {
    marginTop: 16,
    padding: 16,
  },
  quoteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34495e',
    marginBottom: 8,
  },
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#7f8c8d',
    lineHeight: 24,
  },
  quoteAuthor: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#34495e',
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  moreQuotesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 16,
  },
  moreQuotesText: {
    fontSize: 14,
    color: '#3498db',
    marginRight: 4,
  },
  emptyQuoteText: {
    fontSize: 16,
    color: '#7f8c8d',
    lineHeight: 22,
    marginBottom: 16,
  },
  addQuoteButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#3498db',
    borderRadius: 20,
  },
  addQuoteText: {
    color: 'white',
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f8fa',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
});