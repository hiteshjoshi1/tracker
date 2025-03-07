//services/firebaseService.ts
import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { BaseItem, Goal, GoodDeed, Reflection, CollectionType } from '../models/types';
import { startOfDay, endOfDay } from 'date-fns';

export class FirebaseService<T extends BaseItem> {
  protected collectionRef;

  constructor(collectionName: CollectionType) {
    this.collectionRef = collection(db, collectionName);
  }

  // Generic add item method with date support
  async addItem(userId: string, data: Partial<T>, date: Date = new Date()): Promise<string> {
    const docRef = await addDoc(this.collectionRef, {
      ...data,
      userId,
      date: Timestamp.fromDate(date),  // Store the specific date for the item
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  }

  // Generic update method
  async updateItem(itemId: string, updates: Partial<T>): Promise<void> {
    const docRef = doc(this.collectionRef, itemId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  // Generic delete method
  async deleteItem(itemId: string): Promise<void> {
    const docRef = doc(this.collectionRef, itemId);
    await deleteDoc(docRef);
  }

   // Get document by ID
   async getDocById(itemId: string): Promise<T | null> {
    const docRef = doc(this.collectionRef, itemId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...this.convertTimestamps(docSnap.data())
      } as T;
    }
    
    return null;
  }


  // Get items for a specific date
  async getItemsByDate(userId: string, date: Date, additionalQueries: QueryConstraint[] = []): Promise<T[]> {
    // Create Firestore timestamps for start and end of the selected day
    const dayStart = Timestamp.fromDate(startOfDay(date));
    const dayEnd = Timestamp.fromDate(endOfDay(date));
    
    // Query for items on the specific date
    const baseQuery = [
      where("userId", "==", userId),
      where("date", ">=", dayStart),
      where("date", "<=", dayEnd)
    ];
    
    const q = query(this.collectionRef, ...baseQuery, ...additionalQueries);
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...this.convertTimestamps(doc.data())
    } as T));
  }

  // Generic get items method with optional additional queries
  async getUserItems(userId: string, additionalQueries: QueryConstraint[] = []): Promise<T[]> {
    const baseQuery = where("userId", "==", userId);
    const q = query(this.collectionRef, baseQuery, ...additionalQueries);
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...this.convertTimestamps(doc.data())
    } as T));
  }

  // Real-time subscription for a specific date
  subscribeToItemsByDate(
    userId: string,
    date: Date,
    onUpdate: (items: T[]) => void,
    additionalQueries: QueryConstraint[] = []
  ): () => void {
    // Create Firestore timestamps for start and end of the selected day
    const dayStart = Timestamp.fromDate(startOfDay(date));
    const dayEnd = Timestamp.fromDate(endOfDay(date));
    
    // Query for items on the specific date
    const baseQuery = [
      where("userId", "==", userId),
      where("date", ">=", dayStart),
      where("date", "<=", dayEnd)
    ];
    
    const q = query(this.collectionRef, ...baseQuery, ...additionalQueries);
    
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...this.convertTimestamps(doc.data())
      } as T));
      onUpdate(items);
    });
  }

  // Generic real-time subscription
  subscribeToUserItems(
    userId: string, 
    onUpdate: (items: T[]) => void,
    additionalQueries: QueryConstraint[] = []
  ): () => void {
    const baseQuery = where("userId", "==", userId);
    const q = query(this.collectionRef, baseQuery, ...additionalQueries);
    
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...this.convertTimestamps(doc.data())
      } as T));
      onUpdate(items);
    });
  }

  // Helper method to convert Firestore Timestamps to Dates
  protected convertTimestamps(data: any): any {
    const converted = { ...data };
    Object.keys(converted).forEach(key => {
      if (converted[key] instanceof Timestamp) {
        converted[key] = converted[key].toDate();
      }
    });
    return converted;
  }
}

// Specific service implementations with type-specific methods
export class GoalService extends FirebaseService<Goal> {
  constructor() {
    super('goals');
  }

  // Goal-specific method
  async toggleCompletion(goalId: string, completed: boolean): Promise<void> {
    await this.updateItem(goalId, { completed });
  }
  
  // Get expired incomplete goals (for highlighting in red)
  async getExpiredGoals(userId: string, currentDate: Date): Promise<Goal[]> {
    // Get all goals that are:
    // 1. Not completed
    // 2. Have a date earlier than the current date
    const yesterday = new Date(currentDate);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);
    
    const expiredTimestamp = Timestamp.fromDate(yesterday);
    
    const q = query(
      this.collectionRef,
      where("userId", "==", userId),
      where("completed", "==", false),
      where("date", "<", expiredTimestamp)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...this.convertTimestamps(doc.data())
    } as Goal));
  }
}

export class GoodDeedService extends FirebaseService<GoodDeed> {
  constructor() {
    super('goodDeeds');
  }
}

export class ReflectionService extends FirebaseService<Reflection> {
  constructor() {
    super('reflections');
  }
}

// Service instances
export const goalService = new GoalService();
export const goodDeedService = new GoodDeedService();
export const reflectionService = new ReflectionService();