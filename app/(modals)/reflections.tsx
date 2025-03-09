// app/(modals)/reflections.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
  KeyboardAvoidingView,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { isToday } from 'date-fns';
import { reflectionService } from '../../services/firebaseService';
import { useAuth } from '../../context/AuthContext';
import DateHeader from '../../components/DateHeader'; // Import DateHeader

// Types
interface ReflectionItem {
  id: string;
  text: string;
  timestamp: Date;
  date?: Date;
}

interface ModalConfig {
  isVisible: boolean;
  initialText: string;
  editId: string | null;
}

export default function ReflectionsScreen() {
  // Get user info from auth context
  const { userInfo } = useAuth();
  
  // State for selected date
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Data states
  const [reflectionItems, setReflectionItems] = useState<ReflectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [reflectionModalVisible, setReflectionModalVisible] = useState<ModalConfig>({
    isVisible: false,
    initialText: '',
    editId: null
  });
  
  // Input states
  const [reflectionText, setReflectionText] = useState('');
  
  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);

  // Set up component lifecycle
  useEffect(() => {
    // Set mounted flag
    isMounted.current = true;
    
    // Cleanup
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Fetch data when user or date changes
  useEffect(() => {
    if (userInfo?.uid) {
      // Fetch data for the selected date
      fetchDataForDate(selectedDate);
    }
  }, [userInfo, selectedDate]);

  // Function to fetch reflections for a specific date
  const fetchDataForDate = useCallback(async (date: Date) => {
    if (!userInfo?.uid || !isMounted.current) return;
    
    try {
      setLoading(true);
      // Fetch reflections
      const reflectionsForDate = await reflectionService.getItemsByDate(userInfo.uid, date);
      
      if (isMounted.current) {
        setReflectionItems(reflectionsForDate);
      }
    } catch (error) {
      console.error('Error fetching reflections for date:', error);
    } finally {
      setLoading(false);
    }
  }, [userInfo]);

  // Reflection functions
  const handleAddReflection = async () => {
    if (!userInfo?.uid || !reflectionText.trim()) return;

    try {
      if (reflectionModalVisible.editId) {
        // Editing existing item
        await reflectionService.updateItem(reflectionModalVisible.editId, {
          text: reflectionText.trim()
        });
        
        // Update local state
        setReflectionItems(prevItems => 
          prevItems.map(item => 
            item.id === reflectionModalVisible.editId
              ? { ...item, text: reflectionText.trim() }
              : item
          )
        );
      } else {
        // Adding new item for the selected date
        const now = new Date();
        const newItemId = await reflectionService.addItem(userInfo.uid, {
          text: reflectionText.trim(),
          timestamp: now
        }, selectedDate);
        
        // Add to local state
        setReflectionItems(prevItems => [...prevItems, {
          id: newItemId,
          text: reflectionText.trim(),
          timestamp: now,
          date: selectedDate
        }]);
      }
      
      // Close modal and clear text
      handleCloseReflectionModal();
    } catch (error) {
      console.error('Error managing reflection:', error);
    }
  };

  const handleOpenReflectionModal = (itemId?: string) => {
    if (itemId) {
      const itemToEdit = reflectionItems.find(item => item.id === itemId);
      setReflectionModalVisible({
        isVisible: true,
        initialText: itemToEdit?.text || '',
        editId: itemId
      });
      setReflectionText(itemToEdit?.text || '');
    } else {
      setReflectionModalVisible({
        isVisible: true,
        initialText: '',
        editId: null
      });
      setReflectionText('');
    }
  };

  const handleCloseReflectionModal = () => {
    setReflectionModalVisible({ isVisible: false, initialText: '', editId: null });
    setReflectionText('');
  };

  // Format time for display
  const formatTime = (date?: Date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Prompt suggestions
  const reflectionPrompts = [
    "What went well today?",
    "What are you grateful for today?",
    "What did you learn today?",
    "What would you have done differently?",
    "What made you smile today?"
  ];

  const getRandomPrompt = () => {
    const randomIndex = Math.floor(Math.random() * reflectionPrompts.length);
    return reflectionPrompts[randomIndex];
  };

  return (
    <View style={styles.container}>
      {/* Replace date container with DateHeader */}
      <DateHeader 
        onDateChange={setSelectedDate}
        selectedDate={selectedDate}
      />

      <ScrollView style={styles.scrollView}>
        {/* Prompt Card */}
        <View style={styles.promptCard}>
          <Text style={styles.promptTitle}>Reflection Prompt</Text>
          <Text style={styles.promptText}>{getRandomPrompt()}</Text>
          <TouchableOpacity 
            style={styles.promptAction}
            onPress={() => {
              setReflectionText(getRandomPrompt());
              handleOpenReflectionModal();
            }}
          >
            <Text style={styles.promptActionText}>Try another prompt</Text>
          </TouchableOpacity>
        </View>

        {/* Reflections List */}
        {reflectionItems.length > 0 ? (
          <View style={styles.reflectionsListContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {isToday(selectedDate) ? 'TODAY\'S' : 'YOUR'} REFLECTIONS
              </Text>
            </View>
            {reflectionItems.map(item => (
              <View key={item.id} style={styles.reflectionItem}>
                <View style={styles.reflectionContent}>
                  <Text style={styles.reflectionText}>{item.text}</Text>
                  <Text style={styles.timestampText}>
                    {formatTime(item.timestamp)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleOpenReflectionModal(item.id)}
                >
                  <Text style={styles.editButtonEmoji}>✏️</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={60} color="#bdc3c7" />
            <Text style={styles.emptyText}>
              {isToday(selectedDate) 
                ? "No reflections yet" 
                : "No reflections recorded for this date"
              }
            </Text>
            <Text style={styles.emptySubtext}>
              {isToday(selectedDate)
                ? "Take a moment to reflect on your day"
                : "Tap + to add a reflection"
              }
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity 
        style={styles.floatingAddButton}
        onPress={() => handleOpenReflectionModal()}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>

      {/* Reflection Modal */}
      <Modal
        visible={reflectionModalVisible.isVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseReflectionModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {reflectionModalVisible.editId ? 'Edit Reflection' : 'Add Reflection'}
            </Text>
            <TextInput
              style={[styles.modalInput, { minHeight: 100 }]}
              value={reflectionText}
              onChangeText={setReflectionText}
              placeholder="Write your reflection..."
              multiline
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCloseReflectionModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddReflection}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f8fa',
  },
  header: {
    backgroundColor: '#3498db',
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: 'white',
    borderRadius: 15,
  },
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34495e',
  },
  promptCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  promptTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34495e',
    marginBottom: 8,
  },
  promptText: {
    fontSize: 16,
    color: '#7f8c8d',
    lineHeight: 24,
    marginBottom: 8,
  },
  promptAction: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  promptActionText: {
    color: '#3498db',
    fontSize: 14,
  },
  reflectionsListContainer: {
    marginTop: 8,
    marginHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 15,
    overflow: 'hidden',
  },
  sectionHeader: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#95a5a6',
  },
  reflectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  reflectionContent: {
    flex: 1,
  },
  reflectionText: {
    fontSize: 16,
    color: '#34495e',
    marginBottom: 4,
  },
  timestampText: {
    fontSize: 14,
    color: '#95a5a6',
  },
  editButton: {
    marginLeft: 10,
  },
  editButtonEmoji: {
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34495e',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 8,
    textAlign: 'center',
  },
  floatingAddButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#34495e',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: '#ecf0f1',
  },
  cancelButtonText: {
    color: '#34495e',
  },
  saveButton: {
    backgroundColor: '#3498db',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});