export interface Goal {
    id: string;
    text: string;
    completed: boolean;
  }
  
  export interface Habit {
    id: string;
    name: string;
    timeOfDay: 'morning' | 'afternoon' | 'evening';
    completed: boolean;
  }
