// components/QuoteCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Quote } from '../models/types';

interface QuoteCardProps {
  quote: Quote;
  onFavorite: () => void;
  onEdit: () => void;
  onShare: () => void;
  onDelete: () => void;
}

const QuoteCard: React.FC<QuoteCardProps> = ({ 
  quote, 
  onFavorite, 
  onEdit, 
  onShare, 
  onDelete 
}) => {
  return (
    <View style={styles.card}>
      {/* Quote Text */}
      <View style={styles.quoteContainer}>
        <Text style={styles.quoteMarks}>"</Text>
        <Text style={styles.quoteText}>{quote.text}</Text>
      </View>
      
      {/* Categories */}
      {quote.categories && quote.categories.length > 0 && (
        <View style={styles.categoriesContainer}>
          {quote.categories.map((category, index) => (
            <View key={index} style={styles.categoryChip}>
              <Text style={styles.categoryText} numberOfLines={1}>{category}</Text>
            </View>
          ))}
        </View>
      )}
      
      {/* Author */}
      <Text style={styles.authorText}>{quote.author}</Text>
      
      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={onShare} style={styles.actionButton}>
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
      
      {/* Favorite Button */}
      <TouchableOpacity 
        style={styles.favoriteButton} 
        onPress={onFavorite}
      >
        <Ionicons 
          name={quote.favorite ? "star" : "star-outline"} 
          size={24} 
          color={quote.favorite ? "#FFD700" : "#95a5a6"} 
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quoteContainer: {
    position: 'relative',
    paddingVertical: 8,
  },
  quoteMarks: {
    position: 'absolute',
    top: -5,
    left: -5,
    fontSize: 40,
    color: '#e0e0e0',
    fontFamily: 'serif',
  },
  quoteText: {
    fontSize: 18,
    lineHeight: 26,
    color: '#333',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  authorText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    textAlign: 'right',
    marginTop: 8,
    marginBottom: 12,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginBottom: 4,
  },
  categoryChip: {
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    alignSelf: 'flex-start',  // Prevent stretching
    height: 28,
    justifyContent: 'center',
  },
  categoryText: {
    fontSize: 14,
    color: '#3498db',
  },
  actionsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  actionText: {
    color: '#3498db',
    fontSize: 15,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
});

export default QuoteCard;