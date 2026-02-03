
// services/quoteService.ts
import { 
  where,
  orderBy,
  QueryConstraint
} from 'firebase/firestore';
import { FirebaseService } from './firebaseService';
import { Quote } from '../models/types';

export class QuoteService extends FirebaseService<Quote> {
  constructor() {
    super('quotes');
  }

  // Keep quotes ordered at query time: starred first, then newest.
  async getUserItems(userId: string, additionalQueries: QueryConstraint[] = []): Promise<Quote[]> {
    return super.getUserItems(userId, [
      ...additionalQueries,
      orderBy("favorite", "desc"),
      orderBy("createdAt", "desc")
    ]);
  }
  
  // Get user's favorite quotes
  async getFavoriteQuotes(userId: string): Promise<Quote[]> {
    const additionalQueries: QueryConstraint[] = [
      where("favorite", "==", true)
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

  // Get all unique categories the user has used before.
  async getUserCategories(userId: string): Promise<string[]> {
    const quotes = await this.getUserItems(userId);
    const categoryMap = new Map<string, string>();

    quotes.forEach((quote) => {
      quote.categories.forEach((cat) => {
        const trimmed = cat.trim();
        if (!trimmed) return;

        const key = trimmed.toLowerCase();
        if (!categoryMap.has(key)) {
          categoryMap.set(key, trimmed);
        }
      });
    });

    return Array.from(categoryMap.values()).sort((a, b) => a.localeCompare(b));
  }
}

// Service instance
export const quoteService = new QuoteService();
