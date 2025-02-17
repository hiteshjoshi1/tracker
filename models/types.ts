export interface BaseItem {
    id: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface Goal extends BaseItem {
    text: string;
    completed: boolean;
  }
  
  export interface GoodDeed extends BaseItem {
    text: string;
    timestamp: Date;
  }
  
  export interface Reflection extends BaseItem {
    text: string;
    timestamp: Date;
  }
  
  export type CollectionType = 'goals' | 'goodDeeds' | 'reflections';
  