// models/types.ts
export type CollectionType = 'goals' | 'goodDeeds' | 'reflections';

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