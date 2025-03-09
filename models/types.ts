// models/types.ts
export type CollectionType = 'goals' | 'goodDeeds' | 'reflections' | 'habits' | 'quotes';

export interface BaseItem {
  id: string;
  userId: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Goal extends BaseItem {
  text: string;
  completed: boolean;
  isExpired?: boolean; // Flag for expired goals
}

export interface GoodDeed extends BaseItem {
  text: string;
  timestamp: Date;
}

export interface Reflection extends BaseItem {
  text: string;
  timestamp: Date;
}

export interface Habit extends BaseItem {
  name: string;
  description?: string;
  status: 'completed' | 'failed' | 'untracked';
  streak: number;
  lastCompleted: Date | null;
  reminderTime?: string;
  reminderDays?: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  longestStreak: number;
  // New field to track completion status for each date
  completionHistory?: Record<string, 'completed' | 'failed' | 'untracked'>;
}

export const PUSH_TOKEN_KEY = '@push_token';
export const NOTIFICATION_IDS_KEY = '@notification_ids';

// Add this interface for the notification context if you don't already have it
// Do not modify your existing Habit interface, as it already has reminderTime and reminderDays
export interface NotificationContextType {
  scheduleDailyReminder: (habit: Habit) => Promise<string | string[] | null>;
  cancelReminder: (habitId: string) => Promise<void>;
  rescheduleAllReminders: (habits: Habit[]) => Promise<void>;
}

// Add this interface for the notification provider props
export interface NotificationProviderProps {
  children: React.ReactNode;
}

export interface Quote extends BaseItem {
  text: string;
  author: string;
  categories: string[];
  favorite: boolean;
}

export interface ModalConfig {
  isVisible: boolean;
  initialText: string;
  editId: string | null;
}
