import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  QueryConstraint
} from 'firebase/firestore';
import { BaseItem, Goal, GoodDeed, Reflection, CollectionType } from '../models/types';

export class FirebaseService<T extends BaseItem> {
  private collectionRef;

  constructor(collectionName: CollectionType) {
    this.collectionRef = collection(db, collectionName);
  }

  // Generic add item method
  async addItem(userId: string, data: Partial<T>): Promise<string> {
    const docRef = await addDoc(this.collectionRef, {
      ...data,
      userId,
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
  private convertTimestamps(data: any): any {
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
