// app/quote/edit.tsx
import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { quoteService } from '../../services/quoteService';
import { Quote } from '../../models/types';

export default function EditQuoteScreen() {
  const { userInfo } = useAuth();
  const { quoteId } = useLocalSearchParams<{ quoteId: string }>();
  
  const [isLoading, setIsLoading] = useState(true);
  const [quoteText, setQuoteText] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);

  // Load quote data
  useEffect(() => {
    const loadQuote = async () => {
      if (!quoteId) {
        Alert.alert('Error', 'No quote ID provided');
        router.back();
        return;
      }

      try {
        setIsLoading(true);
        const quoteData = await quoteService.getDocById(quoteId);
        
        if (!quoteData) {
          Alert.alert('Error', 'Quote not found');
          router.back();
          return;
        }

        // Check if this quote belongs to the current user
        if (quoteData.userId !== userInfo?.uid) {
          Alert.alert('Error', 'You do not have permission to edit this quote');
          router.back();
          return;
        }

        setQuote(quoteData);
        setQuoteText(quoteData.text);
        setAuthor(quoteData.author);
        setCategories(quoteData.categories || []);
        setIsFavorite(quoteData.favorite || false);
      } catch (error) {
        console.error('Error loading quote:', error);
        Alert.alert('Error', 'Failed to load quote data. Please try again.');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    loadQuote();
  }, [quoteId, userInfo?.uid]);

  useEffect(() => {
    const loadExistingCategories = async () => {
      if (!userInfo?.uid) return;

      try {
        const userCategories = await quoteService.getUserCategories(userInfo.uid);
        setExistingCategories(userCategories);
      } catch (error) {
        console.error('Error loading category suggestions:', error);
      }
    };

    loadExistingCategories();
  }, [userInfo?.uid]);

  // Add a category from typed text or suggestion.
  const addCategoryFromValue = (value: string) => {
    const trimmed = value.trim();
    const normalized = trimmed.toLowerCase();
    const alreadyAdded = categories.some((cat) => cat.toLowerCase() === normalized);

    if (trimmed && !alreadyAdded) {
      setCategories([...categories, trimmed]);
      setCategory('');
    }
  };

  // Add a category
  const addCategory = () => {
    addCategoryFromValue(category);
  };

  // Remove a category
  const removeCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const categorySuggestions = useMemo(() => {
    const search = category.trim().toLowerCase();
    if (search.length < 2) return [];

    return existingCategories
      .filter((existing) => existing.toLowerCase().includes(search))
      .filter(
        (existing) => !categories.some((cat) => cat.toLowerCase() === existing.toLowerCase())
      )
      .slice(0, 6);
  }, [category, existingCategories, categories]);

  // Toggle favorite status
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  // Update the quote
  const updateQuote = async () => {
    if (!quoteText.trim()) {
      Alert.alert('Error', 'Please enter the quote text');
      return;
    }

    if (!author.trim()) {
      Alert.alert('Error', 'Please enter the author name');
      return;
    }

    if (!quoteId || !userInfo?.uid) {
      Alert.alert('Error', 'Missing quote ID or user information');
      return;
    }

    try {
      setIsSubmitting(true);
      
      await quoteService.updateItem(quoteId, {
        text: quoteText.trim(),
        author: author.trim(),
        categories: categories.length > 0 ? categories : ['Uncategorized'],
        favorite: isFavorite,
      });
      
      router.back();
      
    } catch (error) {
      console.error('Error updating quote:', error);
      Alert.alert('Error', 'Failed to update quote. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading quote...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.formContainer}>
          {/* Quote Text */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Quote</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Enter quote text"
              value={quoteText}
              onChangeText={setQuoteText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Author */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Author</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter author name"
              value={author}
              onChangeText={setAuthor}
            />
          </View>

          {/* Favorite */}
          <View style={styles.favoriteContainer}>
            <TouchableOpacity 
              style={styles.favoriteButton} 
              onPress={toggleFavorite}
            >
              <Ionicons 
                name={isFavorite ? "star" : "star-outline"} 
                size={24} 
                color={isFavorite ? "#FFD700" : "#95a5a6"} 
              />
              <Text style={styles.favoriteText}>
                {isFavorite ? "Favorite" : "Add to favorites"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Categories */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Categories</Text>
            <View style={styles.categoryInputContainer}>
              <TextInput
                style={styles.categoryInput}
                placeholder="Add a category"
                value={category}
                onChangeText={setCategory}
                onSubmitEditing={addCategory}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.addCategoryButton} onPress={addCategory}>
                <Ionicons name="add" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {categorySuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {categorySuggestions.map((suggestion) => (
                  <TouchableOpacity
                    key={suggestion}
                    style={styles.suggestionChip}
                    onPress={() => addCategoryFromValue(suggestion)}
                  >
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Category chips */}
            <View style={styles.categoriesContainer}>
              {categories.map((cat, index) => (
                <View key={index} style={styles.categoryChip}>
                  <Text style={styles.categoryText}>{cat}</Text>
                  <TouchableOpacity
                    onPress={() => removeCategory(index)}
                    style={styles.removeCategoryButton}
                  >
                    <Ionicons name="close" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              {categories.length === 0 && (
                <Text style={styles.noCategoriesText}>
                  No categories added. Quote will be saved as "Uncategorized".
                </Text>
              )}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={updateQuote}
            disabled={isSubmitting}
          >
            <Text style={styles.saveButtonText}>
              {isSubmitting ? 'Saving...' : 'Update Quote'}
            </Text>
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
  },
  formContainer: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#34495e',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  favoriteContainer: {
    marginBottom: 20,
  },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  favoriteText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#34495e',
  },
  categoryInputContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  categoryInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRightWidth: 0,
  },
  addCategoryButton: {
    backgroundColor: '#3498db',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  suggestionChip: {
    backgroundColor: '#ecf4ff',
    borderColor: '#3498db',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 4,
  },
  suggestionText: {
    color: '#2c6aa0',
    fontSize: 14,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 4,
  },
  categoryText: {
    color: '#fff',
    marginRight: 4,
  },
  removeCategoryButton: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noCategoriesText: {
    color: '#95a5a6',
    fontStyle: 'italic',
    padding: 8,
  },
  saveButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#ecf0f1',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  cancelButtonText: {
    color: '#34495e',
    fontSize: 16,
  },
});
