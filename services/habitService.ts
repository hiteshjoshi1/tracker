// Enhanced HabitService.ts with review functionality support

import { FirebaseService } from './firebaseService';
import { Habit } from '../models/types';
import { 
  collection, 
  query, 
  where,
  Timestamp,
  orderBy,
  QueryConstraint
} from 'firebase/firestore';
import { 
  startOfDay, 
  endOfDay, 
  isSameDay, 
  format, 
  differenceInDays, 
  addDays, 
  subDays,
  isSameMonth,
  startOfMonth,
  endOfMonth,
  getDay,
  startOfWeek,
  endOfWeek,
  getMonth,
  getYear
} from 'date-fns';
import { NotificationService } from './notificationService';

export class HabitService extends FirebaseService<Habit> {
  constructor() {
    super('habits');
  }

  // Add a new habit with notification support
  async addHabit(userId: string, habitData: Partial<Habit>): Promise<string> {
    const defaultReminderDays = {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true
    };
  
    // Create a new object with only the fields we want to save
    const { description, ...restData } = habitData;
    
    // Get current date
    const now = new Date();
    
    // Basic data without description
    const cleanedData: Partial<Habit> = {
      ...restData,
      streak: 0,
      status: 'untracked' as 'untracked' | 'completed' | 'failed',
      lastCompleted: null,
      longestStreak: 0,
      reminderDays: habitData.reminderDays || defaultReminderDays,
      completionHistory: {}, // Add completion history object
      date: now, // Add date from BaseItem
      createdAt: now,
      updatedAt: now
    };
    
    // Only add description if it has a value
    if (description && description.trim().length > 0) {
      cleanedData.description = description;
    }
    
    // Add the habit to Firestore
    const habitId = await this.addItem(userId, cleanedData);
    
    return habitId;
  }

  // Update habit with notification handling
  async updateHabit(habitId: string, updates: Partial<Habit>): Promise<void> {
    // Handle notifications if the reminder time changes
    if ('reminderTime' in updates || 'reminderDays' in updates) {
      // Get the current habit
      const currentHabit = await this.getItemById(habitId);
      
      // Cancel existing notifications
      await NotificationService.cancelHabitNotifications(habitId);
      
      // Schedule new notifications if there's a reminder time
      if (updates.reminderTime && currentHabit) {
        const updatedHabit = { ...currentHabit, ...updates };
        await NotificationService.scheduleHabitNotification(updatedHabit as Habit);
      }
    }
    
    // Update the habit in Firestore
    await this.updateItem(habitId, updates);
  }

  // Delete habit with notification cleanup
  async deleteHabit(habitId: string): Promise<void> {
    // Cancel any scheduled notifications
    await NotificationService.cancelHabitNotifications(habitId);
    
    // Delete the habit from Firestore
    await this.deleteItem(habitId);
  }

  // Update habit status for a specific date
  async updateHabitStatusForDate(
    habitId: string, 
    status: 'completed' | 'failed' | 'untracked',
    date: Date,
    habit?: Habit
  ): Promise<void> {
    if (!habit) {
      // Fetch habit if not provided and call this method again
      const habitDoc = await this.getItemById(habitId);
      if (habitDoc) {
        await this.updateHabitStatusForDate(habitId, status, date, habitDoc);
      }
      return;
    }

    // Initialize completionHistory if it doesn't exist
    const completionHistory = habit.completionHistory || {};
    
    // Format date as YYYY-MM-DD for storage
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Update completion history
    completionHistory[dateStr] = status;
    
    // Basic updates
    let updates: Partial<Habit> = { 
      completionHistory,
      status: status // Current day status also gets updated
    };
    
    // If marking as completed
    if (status === 'completed') {
      const now = new Date();
      
      // Update lastCompleted if tracking today
      if (isSameDay(date, now)) {
        updates.lastCompleted = now;
      }
      
      // Recalculate streak based on the updated completion history
      updates.streak = this.calculateStreak(completionHistory);
      
      // Update longest streak if current streak exceeds it
      if (updates.streak > habit.longestStreak) {
        updates.longestStreak = updates.streak;
      }
    } 
    // If marking as failed and it's today, reset streak
    else if (status === 'failed' && isSameDay(date, new Date())) {
      updates.streak = 0;
    }
    // If changing a past date, we need to recalculate the streak
    else {
      updates.streak = this.calculateStreak(completionHistory);
      
      // Update longest streak if current streak exceeds it
      if (updates.streak > habit.longestStreak) {
        updates.longestStreak = updates.streak;
      }
    }
    
    await this.updateItem(habitId, updates);
  }

  // Calculate streak based on completion history
  private calculateStreak(completionHistory: Record<string, string>): number {
    if (!completionHistory) return 0;
    
    // Get today as date string
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    
    // Get all dates from completion history
    const dates = Object.keys(completionHistory)
      .filter(dateStr => completionHistory[dateStr] === 'completed')
      .sort((a, b) => (a < b ? 1 : -1)); // Sort in descending order (newest first)
    
    if (dates.length === 0) return 0;
    
    // Check if today is completed
    const isTodayCompleted = completionHistory[todayStr] === 'completed';
    
    // If today isn't tracked or explicitly failed, start counting from yesterday
    const startDate = isTodayCompleted ? todayStr : format(addDays(new Date(), -1), 'yyyy-MM-dd');
    const startDateIndex = dates.indexOf(startDate);
    
    // If the start date isn't in our completed dates, there's no streak
    if (startDateIndex === -1) return 0;
    
    let streak = 1; // Start with 1 for the start date
    let currentDate = new Date(startDate);
    
    // Loop backwards through dates to count consecutive completed days
    for (let i = 1; i <= 366; i++) { // Check up to a year
      const prevDate = addDays(currentDate, -1);
      const prevDateStr = format(prevDate, 'yyyy-MM-dd');
      
      if (completionHistory[prevDateStr] === 'completed') {
        streak++;
        currentDate = prevDate;
      } else {
        break; // Break on first non-completed day
      }
    }
    
    return streak;
  }

  // Get habits sorted by name
  async getUserHabits(userId: string): Promise<Habit[]> {
    const additionalQueries: QueryConstraint[] = [orderBy('name')];
    return this.getUserItems(userId, additionalQueries);
  }

  // Get active habits for today
  async getActiveHabitsForToday(userId: string): Promise<Habit[]> {
    const habits = await this.getUserHabits(userId);
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ...
    
    // Map day number to day name
    const dayMap: {[key: number]: string} = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday'
    };
    
    const todayName = dayMap[dayOfWeek];
    
    // Filter habits active for today based on reminderDays
    return habits.filter(habit => 
      habit.reminderDays ? habit.reminderDays[todayName as keyof typeof habit.reminderDays] : true
    );
  }

  // NEW: Get habits with data for the last 7 days
  async getHabitsForLastWeek(userId: string): Promise<Habit[]> {
    // Get all habits for the user
    const habits = await this.getUserHabits(userId);
    
    // We'll use the completionHistory field that's already in each habit
    // This field contains the status for each date, so we don't need
    // to query for additional data
    
    return habits;
  }
  
  // NEW: Calculate completion rate for a habit in a date range
  calculateCompletionRate(habit: Habit, startDate: Date, endDate: Date): number {
    if (!habit.completionHistory) return 0;
    
    let completedDays = 0;
    let trackedDays = 0;
    let currentDate = startOfDay(startDate);
    const lastDate = endOfDay(endDate);
    
    while (currentDate <= lastDate) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const status = habit.completionHistory[dateStr];
      
      if (status === 'completed' || status === 'failed') {
        trackedDays++;
        if (status === 'completed') {
          completedDays++;
        }
      }
      
      currentDate = addDays(currentDate, 1);
    }
    
    return trackedDays > 0 ? (completedDays / trackedDays) * 100 : 0;
  }

  // NEW: Get a summary of habits completion by day of week
  getDayOfWeekStats(habit: Habit): { [key: string]: { total: number, completed: number, rate: number } } {
    if (!habit.completionHistory) {
      return {};
    }
    
    // Initialize stats for each day of the week
    const dayStats: { [key: string]: { total: number, completed: number, rate: number } } = {
      'Sunday': { total: 0, completed: 0, rate: 0 },
      'Monday': { total: 0, completed: 0, rate: 0 },
      'Tuesday': { total: 0, completed: 0, rate: 0 },
      'Wednesday': { total: 0, completed: 0, rate: 0 },
      'Thursday': { total: 0, completed: 0, rate: 0 },
      'Friday': { total: 0, completed: 0, rate: 0 },
      'Saturday': { total: 0, completed: 0, rate: 0 }
    };
    
    // Days of the week array for lookup
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Loop through all dates in completion history
    Object.keys(habit.completionHistory).forEach(dateStr => {
      const status = habit.completionHistory ? habit.completionHistory[dateStr] : 'untracked';
      if (status === 'completed' || status === 'failed') {
        // Parse the date and get the day of week
        const date = new Date(dateStr);
        const dayOfWeek = daysOfWeek[getDay(date)];
        
        // Update stats for this day
        dayStats[dayOfWeek].total++;
        if (status === 'completed') {
          dayStats[dayOfWeek].completed++;
        }
      }
    });
    
    // Calculate completion rates for each day
    Object.keys(dayStats).forEach(day => {
      const { total, completed } = dayStats[day];
      dayStats[day].rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    });
    
    return dayStats;
  }
  
  // NEW: Get monthly statistics for a habit
  getMonthlyStats(habit: Habit): { [key: string]: { total: number, completed: number, rate: number } } {
    if (!habit.completionHistory) {
      return {};
    }
    
    const monthStats: { [key: string]: { total: number, completed: number, rate: number } } = {};
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Loop through all dates in completion history
    Object.keys(habit.completionHistory).forEach(dateStr => {
      const status = habit.completionHistory ? habit.completionHistory[dateStr] : 'untracked';
      if (status === 'completed' || status === 'failed') {
        // Parse the date and get the month and year
        const date = new Date(dateStr);
        const month = months[getMonth(date)];
        const year = getYear(date);
        const monthYearKey = `${month} ${year}`;
        
        // Initialize the month stats if not present
        if (!monthStats[monthYearKey]) {
          monthStats[monthYearKey] = { total: 0, completed: 0, rate: 0 };
        }
        
        // Update stats for this month
        monthStats[monthYearKey].total++;
        if (status === 'completed') {
          monthStats[monthYearKey].completed++;
        }
      }
    });
    
    // Calculate completion rates for each month
    Object.keys(monthStats).forEach(monthYear => {
      const { total, completed } = monthStats[monthYear];
      monthStats[monthYear].rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    });
    
    return monthStats;
  }
  
  // NEW: Get streak data for visualization
  getStreakData(habit: Habit): { startDate: string, endDate: string, length: number }[] {
    if (!habit.completionHistory) {
      return [];
    }
    
    const streaks: { startDate: string, endDate: string, length: number }[] = [];
    let currentStreak: { startDate: string | null, endDate: string | null, length: number } = {
      startDate: null,
      endDate: null,
      length: 0
    };
    
    // Sort dates in ascending order
    const sortedDates = Object.keys(habit.completionHistory || {})
    .filter(dateStr => habit.completionHistory && habit.completionHistory[dateStr] === 'completed')
    .sort((a, b) => (a > b ? 1 : -1));


    
    if (sortedDates.length === 0) {
      return [];
    }
    
    // Find consecutive streaks
    let prevDate: Date | null = null;
    
    sortedDates.forEach(dateStr => {
      const currentDate = new Date(dateStr);
      
      // If this is the first date or there's a gap
      if (!prevDate || differenceInDays(currentDate, prevDate) > 1) {
        // Save the previous streak if it exists
        if (currentStreak.startDate && currentStreak.length > 0) {
          streaks.push({
            startDate: currentStreak.startDate,
            endDate: currentStreak.endDate!,
            length: currentStreak.length
          });
        }
        
        // Start a new streak
        currentStreak = {
          startDate: dateStr,
          endDate: dateStr,
          length: 1
        };
      } else if (differenceInDays(currentDate, prevDate) === 1) {
        // Continue the current streak
        currentStreak.endDate = dateStr;
        currentStreak.length++;
      }
      
      prevDate = currentDate;
    });
    
    // Add the last streak
    if (currentStreak.startDate && currentStreak.length > 0) {
      streaks.push({
        startDate: currentStreak.startDate,
        endDate: currentStreak.endDate!,
        length: currentStreak.length
      });
    }
    
    return streaks;
  }

  // Original update habit status method (kept for backward compatibility)
  async updateHabitStatus(
    habitId: string, 
    status: 'completed' | 'failed' | 'untracked',
    habit?: Habit
  ): Promise<void> {
    // Use the new method with today's date
    await this.updateHabitStatusForDate(habitId, status, new Date(), habit);
  }

  // Helper method to get a habit by ID
  async getItemById(habitId: string): Promise<Habit | null> {
    try {
      const habit = await this.getDocById(habitId);
      return habit as Habit;
    } catch (error) {
      console.error("Error getting habit by ID:", error);
      return null;
    }
  }
}
export const habitService = new HabitService();