// app/(tabs)/quotes.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Quote } from '../../models/types';
import { quoteService } from '../../services/quoteService';
import QuoteCard from '../../components/QuoteCard';
import EmptyState from '../../components/EmptyState';

export default function QuotesScreen() {
  const { userInfo } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [allCategories, setAllCategories] = useState<string[]>([]);

  // Function to load all quotes
  const loadQuotes = useCallback(async () => {
    if (!userInfo?.uid) return;
    
    try {
      setLoading(true);
      const userQuotes = await quoteService.getUserItems(userInfo.uid, []);
      setQuotes(userQuotes);
      
      // Extract all unique categories
      const categories = new Set<string>();
      userQuotes.forEach(quote => {
        quote.categories.forEach(category => categories.add(category));
      });
      
      setAllCategories(Array.from(categories).sort());
    } catch (error) {
      console.error('Error loading quotes:', error);
      Alert.alert('Error', 'Failed to load quotes. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userInfo?.uid]);

  // Initial load
  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  // Reload when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadQuotes();
    }, [loadQuotes])
  );

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadQuotes();
    setRefreshing(false);
  }, [loadQuotes]);

  // Handle search
  const handleSearch = useCallback(async () => {
    if (!userInfo?.uid) return;
    
    try {
      setLoading(true);
      const results = await quoteService.searchQuotes(userInfo.uid, searchText);
      setQuotes(results);
    } catch (error) {
      console.error('Error searching quotes:', error);
    } finally {
      setLoading(false);
    }
  }, [userInfo?.uid, searchText]);

  // Filter by category
  const filterByCategory = useCallback((category: string | null) => {
    setSelectedCategory(category);
    
    if (!userInfo?.uid) return;
    
    const getFilteredQuotes = async () => {
      try {
        setLoading(true);
        if (!category) {
          await loadQuotes();
        } else {
          const filtered = await quoteService.getQuotesByCategory(userInfo.uid, category);
          setQuotes(filtered);
        }
      } catch (error) {
        console.error('Error filtering quotes:', error);
      } finally {
        setLoading(false);
      }
    };
    
    getFilteredQuotes();
  }, [userInfo?.uid, loadQuotes]);

  // Toggle favorite
  const toggleFavorite = async (quoteId: string, currentStatus: boolean) => {
    try {
      await quoteService.toggleFavorite(quoteId, !currentStatus);
      
      // Update local state
      setQuotes(prevQuotes => 
        prevQuotes.map(quote => 
          quote.id === quoteId 
            ? { ...quote, favorite: !currentStatus } 
            : quote
        )
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status. Please try again.');
    }
  };

  // Handle delete
  const handleDelete = (quote: Quote) => {
    Alert.alert(
      "Delete Quote",
      "Are you sure you want to delete this quote?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Delete", 
          onPress: async () => {
            try {
              await quoteService.deleteItem(quote.id);
              setQuotes(prevQuotes => prevQuotes.filter(q => q.id !== quote.id));
            } catch (error) {
              console.error('Error deleting quote:', error);
              Alert.alert('Error', 'Failed to delete quote. Please try again.');
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  // Navigate to add quote screen
  const navigateToAddQuote = () => {
    router.push('/quote/add');
  };

  // Navigate to edit quote screen
  const navigateToEditQuote = (quote: Quote) => {
    router.push({
      pathname: '/quote/edit',
      params: { quoteId: quote.id }
    });
  };

  // Handle share
  const handleShare = (quote: Quote) => {
    Alert.alert(
      "Share Quote",
      "This feature will be implemented soon!",
      [{ text: "OK" }]
    );
  };

  // Category chips
  const renderCategoryChips = () => (
    <View style={styles.categoryChipsWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryChipsContainer}
      >
        {['All', ...allCategories].map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.categoryChip,
              (selectedCategory === null && item === 'All') || selectedCategory === item 
                ? styles.selectedCategoryChip 
                : null
            ]}
            onPress={() => filterByCategory(item === 'All' ? null : item)}
          >
            <Text 
              style={[
                styles.categoryChipText,
                (selectedCategory === null && item === 'All') || selectedCategory === item 
                  ? styles.selectedCategoryChipText 
                  : null
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search quotes..."
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      {renderCategoryChips()}

      {/* Quotes List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      ) : quotes.length === 0 ? (
        <EmptyState
          icon="chatbubble-ellipses-outline"
          title="No quotes found"
          message="Add your favorite quotes to get started"
          actionText="Add Quote"
          onAction={navigateToAddQuote}
        />
      ) : (
        <FlatList
          data={quotes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <QuoteCard
              quote={item}
              onFavorite={() => toggleFavorite(item.id, item.favorite)}
              onEdit={() => navigateToEditQuote(item)}
              onShare={() => handleShare(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3498db']}
            />
          }
        />
      )}

      {/* FAB for adding a new quote */}
      <TouchableOpacity 
        style={styles.addButton}
        onPress={navigateToAddQuote}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchBarContainer: {
    flexDirection: 'row',
    margin: 16,
    borderRadius: 25,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 25,
    borderBottomRightRadius: 25,
  },
  categoryChipsWrapper: {
    height: 48,
    marginBottom: 10,
  },
  categoryChipsContainer: {
    paddingHorizontal: 16,
    alignItems: 'center',
    height: 48,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#e7e7e7',
    borderRadius: 20,
    marginRight: 8,
    height: 36,
    justifyContent: 'center',
  },
  selectedCategoryChip: {
    backgroundColor: '#3498db',
  },
  categoryChipText: {
    color: '#333',
  },
  selectedCategoryChipText: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80, // Add extra padding for FAB
  },
  addButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
});