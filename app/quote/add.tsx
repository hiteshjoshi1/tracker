// app/quote/add.tsx
import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { quoteService } from '../../services/quoteService';

export default function AddQuoteScreen() {
  const { userInfo } = useAuth();
  const [quoteText, setQuoteText] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add a category
  const addCategory = () => {
    if (category.trim() && !categories.includes(category.trim())) {
      setCategories([...categories, category.trim()]);
      setCategory('');
    }
  };

  // Remove a category
  const removeCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  // Save the quote
  const saveQuote = async () => {
    if (!quoteText.trim()) {
      Alert.alert('Error', 'Please enter the quote text');
      return;
    }

    if (!author.trim()) {
      Alert.alert('Error', 'Please enter the author name');
      return;
    }

    if (!userInfo?.uid) {
      Alert.alert('Error', 'You need to be logged in to add quotes');
      return;
    }

    try {
      setIsSubmitting(true);
      
      await quoteService.addItem(
        userInfo.uid,
        {
          text: quoteText.trim(),
          author: author.trim(),
          categories: categories.length > 0 ? categories : ['Uncategorized'],
          favorite: false,
        },
        new Date()
      );
      
      router.back();
      
    } catch (error) {
      console.error('Error adding quote:', error);
      Alert.alert('Error', 'Failed to add quote. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            onPress={saveQuote}
            disabled={isSubmitting}
          >
            <Text style={styles.saveButtonText}>
              {isSubmitting ? 'Saving...' : 'Save Quote'}
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