// services/analyticsService.ts
import { db } from '../config/firebase';
import { 
  collection, 
  query, 
  where,
  getDocs,
  Timestamp,
  orderBy
} from 'firebase/firestore';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, startOfDay, endOfDay } from 'date-fns';
import { habitService } from './habitService';

export interface PeriodStats {
  goals: { total: number; completed: number; rate: number };
  habits: { completed: number; rate: number; totalHabits: number };
  goodDeeds: { total: number };
  reflections: { total: number };
}

export class AnalyticsService {
  
  // Get weekly stats with only 4 Firebase calls total
  async getWeeklyStats(userId: string, date: Date = new Date()): Promise<PeriodStats> {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
    
    try {
      // Make 4 parallel Firebase calls for the entire week
      const [goalsSnapshot, goodDeedsSnapshot, reflectionsSnapshot, allHabits] = await Promise.all([
        this.getRangeData('goals', userId, weekStart, weekEnd),
        this.getRangeData('goodDeeds', userId, weekStart, weekEnd),
        this.getRangeData('reflections', userId, weekStart, weekEnd),
        habitService.getUserHabits(userId) // 1 call gets all habits with completion history
      ]);

      // Process goals
      const goals = goalsSnapshot.docs.map(doc => ({
        id: doc.id,
        completed: doc.data().completed,
        date: doc.data().date?.toDate()
      }));

      const totalGoals = goals.length;
      const completedGoals = goals.filter(g => g.completed).length;
      const goalRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

      // Process good deeds and reflections (just count)
      const totalGoodDeeds = goodDeedsSnapshot.docs.length;
      const totalReflections = reflectionsSnapshot.docs.length;

      // Process habits from completion history (no extra Firebase calls)
      const habitStats = this.calculateHabitStats(allHabits, weekStart, weekEnd);

      return {
        goals: { 
          total: totalGoals, 
          completed: completedGoals, 
          rate: goalRate 
        },
        habits: habitStats,
        goodDeeds: { total: totalGoodDeeds },
        reflections: { total: totalReflections }
      };

    } catch (error) {
      console.error('Error getting weekly stats:', error);
      return this.getEmptyStats();
    }
  }

  // Get monthly stats with only 4 Firebase calls total
  async getMonthlyStats(userId: string, date: Date = new Date()): Promise<PeriodStats> {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    
    try {
      // Make 4 parallel Firebase calls for the entire month
      const [goalsSnapshot, goodDeedsSnapshot, reflectionsSnapshot, allHabits] = await Promise.all([
        this.getRangeData('goals', userId, monthStart, monthEnd),
        this.getRangeData('goodDeeds', userId, monthStart, monthEnd),
        this.getRangeData('reflections', userId, monthStart, monthEnd),
        habitService.getUserHabits(userId) // Reuse if already loaded
      ]);

      // Process goals
      const goals = goalsSnapshot.docs.map(doc => ({
        id: doc.id,
        completed: doc.data().completed,
        date: doc.data().date?.toDate()
      }));

      const totalGoals = goals.length;
      const completedGoals = goals.filter(g => g.completed).length;
      const goalRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

      // Process good deeds and reflections (just count)
      const totalGoodDeeds = goodDeedsSnapshot.docs.length;
      const totalReflections = reflectionsSnapshot.docs.length;

      // Process habits from completion history (no extra Firebase calls)
      const habitStats = this.calculateHabitStats(allHabits, monthStart, monthEnd);

      return {
        goals: { 
          total: totalGoals, 
          completed: completedGoals, 
          rate: goalRate 
        },
        habits: habitStats,
        goodDeeds: { total: totalGoodDeeds },
        reflections: { total: totalReflections }
      };

    } catch (error) {
      console.error('Error getting monthly stats:', error);
      return this.getEmptyStats();
    }
  }

  // Get today's quick stats (minimal Firebase calls for dashboard load)
  async getTodayStats(userId: string): Promise<PeriodStats> {
    const today = new Date();
    
    try {
      // Just 4 Firebase calls for today's data
      const [todayGoals, todayGoodDeeds, todayReflections, allHabits] = await Promise.all([
        this.getTodayData('goals', userId, today),
        this.getTodayData('goodDeeds', userId, today),
        this.getTodayData('reflections', userId, today),
        habitService.getUserHabits(userId)
      ]);

      // Process today's goals
      const goals = todayGoals.docs.map(doc => ({
        completed: doc.data().completed
      }));

      const totalGoals = goals.length;
      const completedGoals = goals.filter(g => g.completed).length;
      const goalRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

      // Count today's activities
      const totalGoodDeeds = todayGoodDeeds.docs.length;
      const totalReflections = todayReflections.docs.length;

      // Calculate today's habit rate - count ALL habits as daily targets
      const todayStr = format(today, 'yyyy-MM-dd');
      let todayHabitsCompleted = 0;

      allHabits.forEach(habit => {
        if (!habit.completionHistory) return;
        
        const status = habit.completionHistory[todayStr];
        if (status === 'completed') {
          todayHabitsCompleted++;
        }
      });

      // Rate = completed habits / total habits (all habits are daily targets)
      const todayHabitRate = allHabits.length > 0 
        ? Math.round((todayHabitsCompleted / allHabits.length) * 100) 
        : 0;

      // Count active streaks (habits with streak >= 2 and completed yesterday)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

      const activeStreaks = allHabits.filter(habit => {
        if (habit.streak < 2) return false;
        if (!habit.completionHistory) return false;
        return habit.completionHistory[yesterdayStr] === 'completed';
      }).length;

      return {
        goals: { 
          total: totalGoals, 
          completed: completedGoals, 
          rate: goalRate 
        },
        habits: { 
          completed: activeStreaks, 
          rate: todayHabitRate, // ✅ Now calculates actual today's rate
          totalHabits: allHabits.length 
        },
        goodDeeds: { total: totalGoodDeeds },
        reflections: { total: totalReflections }
      };

    } catch (error) {
      console.error('Error getting today stats:', error);
      return this.getEmptyStats();
    }
  }

  // Helper: Get range data with single query
  private async getRangeData(collectionName: string, userId: string, startDate: Date, endDate: Date) {
    const dayStart = Timestamp.fromDate(startOfDay(startDate));
    const dayEnd = Timestamp.fromDate(endOfDay(endDate));
    
    const q = query(
      collection(db, collectionName),
      where("userId", "==", userId),
      where("date", ">=", dayStart),
      where("date", "<=", dayEnd)
    );
    
    return getDocs(q);
  }

  // Helper: Get today's data only
  private async getTodayData(collectionName: string, userId: string, date: Date) {
    const dayStart = Timestamp.fromDate(startOfDay(date));
    const dayEnd = Timestamp.fromDate(endOfDay(date));
    
    const q = query(
      collection(db, collectionName),
      where("userId", "==", userId),
      where("date", ">=", dayStart),
      where("date", "<=", dayEnd)
    );
    
    return getDocs(q);
  }

  // Calculate habit stats from completion history (no Firebase calls)
  private calculateHabitStats(habits: any[], startDate: Date, endDate: Date) {
    let totalCompleted = 0;
    
    // Generate date strings for the period
    const dates: string[] = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dates.push(format(currentDate, 'yyyy-MM-dd'));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate completion rate - count ALL habits as daily targets
    habits.forEach(habit => {
      if (!habit.completionHistory) return;
      
      dates.forEach(dateStr => {
        const status = habit.completionHistory[dateStr];
        if (status === 'completed') {
          totalCompleted++;
        }
      });
    });

    // Total possible completions = all habits × all days in period
    const totalPossible = habits.length * dates.length;

    // Count active streaks (habits with streak >= 2 and completed yesterday)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

    const activeStreaks = habits.filter(habit => {
      if (habit.streak < 2) return false;
      if (!habit.completionHistory) return false;
      return habit.completionHistory[yesterdayStr] === 'completed';
    }).length;

    const habitRate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

    return {
      completed: activeStreaks,
      rate: habitRate,
      totalHabits: habits.length
    };
  }

  // Helper: Return empty stats
  private getEmptyStats(): PeriodStats {
    return {
      goals: { total: 0, completed: 0, rate: 0 },
      habits: { completed: 0, rate: 0, totalHabits: 0 },
      goodDeeds: { total: 0 },
      reflections: { total: 0 }
    };
  }
}

export const analyticsService = new AnalyticsService();