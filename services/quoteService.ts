
// services/quoteService.ts
import { db } from '../config/firebase';
import { 
  collection, 
  where,
  orderBy,
  query,
  QueryConstraint
} from 'firebase/firestore';
import { FirebaseService } from './firebaseService';
import { Quote } from '../models/types';

export class QuoteService extends FirebaseService<Quote> {
  constructor() {
    super('quotes');
  }
  
  // Get user's favorite quotes
  async getFavoriteQuotes(userId: string): Promise<Quote[]> {
    const additionalQueries: QueryConstraint[] = [
      where("favorite", "==", true),
      orderBy("createdAt", "desc")
    ];
    
    return this.getUserItems(userId, additionalQueries);
  }
  
  // Search quotes by text or author
  async searchQuotes(userId: string, searchTerm: string): Promise<Quote[]> {
    // Note: Basic Firestore doesn't support text search
    // This is a simple implementation that will need to fetch all quotes and filter client-side
    const quotes = await this.getUserItems(userId);
    
    if (!searchTerm.trim()) {
      return quotes;
    }
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return quotes.filter(quote => 
      quote.text.toLowerCase().includes(lowerSearchTerm) || 
      quote.author.toLowerCase().includes(lowerSearchTerm)
    );
  }
  
  // Toggle favorite status
  async toggleFavorite(quoteId: string, favorite: boolean): Promise<void> {
    await this.updateItem(quoteId, { favorite });
  }
  
  // Get quotes by category
  async getQuotesByCategory(userId: string, category: string): Promise<Quote[]> {
    const quotes = await this.getUserItems(userId);
    
    if (!category.trim()) {
      return quotes;
    }
    
    return quotes.filter(quote => 
      quote.categories.some(cat => cat.toLowerCase() === category.toLowerCase())
    );
  }
}

// Service instance
export const quoteService = new QuoteService();