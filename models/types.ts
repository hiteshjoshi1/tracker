// models/types.ts
export type CollectionType = 'goals' | 'goodDeeds' | 'reflections' | 'habits';

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