// app/(modals)/good-deeds.tsx
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
import { format } from 'date-fns';
import { router } from 'expo-router';
import { goodDeedService } from '../../services/firebaseService';
import { useAuth } from '../../context/AuthContext';
import DateHeader from '../../components/DateHeader'; // Import DateHeader

// Types
interface GoodnessItem {
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

export default function GoodDeedsScreen() {
  // Get user info from auth context
  const { userInfo } = useAuth();
  
  // State for selected date
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Data states
  const [goodnessItems, setGoodnessItems] = useState<GoodnessItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [goodnessModalVisible, setGoodnessModalVisible] = useState<ModalConfig>({
    isVisible: false,
    initialText: '',
    editId: null,
  });
  
  // Input states
  const [goodnessText, setGoodnessText] = useState('');
  
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

  // Function to fetch good deeds for a specific date
  const fetchDataForDate = useCallback(async (date: Date) => {
    if (!userInfo?.uid || !isMounted.current) return;
    
    try {
      setLoading(true);
      // Fetch good deeds
      const deedsForDate = await goodDeedService.getItemsByDate(userInfo.uid, date);
      
      if (isMounted.current) {
        setGoodnessItems(deedsForDate);
      }
    } catch (error) {
      console.error('Error fetching good deeds for date:', error);
    } finally {
      setLoading(false);
    }
  }, [userInfo]);

  // Goodness functions
  const handleAddGoodness = async () => {
    if (!userInfo?.uid || !goodnessText.trim()) return;

    try {
      if (goodnessModalVisible.editId) {
        // Editing existing item
        await goodDeedService.updateItem(goodnessModalVisible.editId, {
          text: goodnessText.trim()
        });
        
        // Update local state
        setGoodnessItems(prevItems => 
          prevItems.map(item => 
            item.id === goodnessModalVisible.editId
              ? { ...item, text: goodnessText.trim() }
              : item
          )
        );
      } else {
        // Adding new item for the selected date
        const now = new Date();
        const newItemId = await goodDeedService.addItem(userInfo.uid, {
          text: goodnessText.trim(),
          timestamp: now
        }, selectedDate);
        
        // Add to local state
        setGoodnessItems(prevItems => [...prevItems, {
          id: newItemId,
          text: goodnessText.trim(),
          timestamp: now,
          date: selectedDate
        }]);
      }
      
      // Close modal and clear text
      handleCloseGoodnessModal();
    } catch (error) {
      console.error('Error managing good deed:', error);
    }
  };

  const handleOpenGoodnessModal = (itemId?: string) => {
    if (itemId) {
      const itemToEdit = goodnessItems.find(item => item.id === itemId);
      setGoodnessModalVisible({
        isVisible: true,
        initialText: itemToEdit?.text || '',
        editId: itemId
      });
      setGoodnessText(itemToEdit?.text || '');
    } else {
      setGoodnessModalVisible({
        isVisible: true,
        initialText: '',
        editId: null
      });
      setGoodnessText('');
    }
  };

  const handleCloseGoodnessModal = () => {
    setGoodnessModalVisible({ isVisible: false, initialText: '', editId: null });
    setGoodnessText('');
  };

  // Format time for display
  const formatTime = (date?: Date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={styles.container}>
      {/* Replace date container with DateHeader */}
      <DateHeader 
        onDateChange={setSelectedDate}
        selectedDate={selectedDate}
      />

      <ScrollView style={styles.scrollView}>
        {/* Achievement Card - with default header */}
        <View style={styles.achievementCard}>
          <Text style={styles.achievementTitle}>
            {goodnessItems.length > 0 
              ? `You've done ${goodnessItems.length} good deed${goodnessItems.length > 1 ? 's' : ''} today!` 
              : "No good deeds recorded yet"
            }
          </Text>
          <Text style={styles.achievementText}>
            {goodnessItems.length > 0 
              ? "Keep it up, you're making a difference!" 
              : "What good shall you do today?"
            }
          </Text>
          <View style={styles.achievementIcon}>
            <Text style={styles.achievementEmoji}>✨</Text>
          </View>
        </View>

        {/* Good Deeds List */}
        {goodnessItems.length > 0 ? (
          <View style={styles.deedsListContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {isToday(selectedDate) ? 'TODAY\'S' : format(selectedDate, 'MMMM d')} GOOD DEEDS
              </Text>
            </View>
            {goodnessItems.map(item => (
              <View key={item.id} style={styles.deedItem}>
                <View style={styles.deedIconContainer}>
                  <Text style={styles.deedIcon}>🤝</Text>
                </View>
                <View style={styles.deedContent}>
                  <Text style={styles.deedText}>{item.text}</Text>
                  <Text style={styles.timestampText}>
                    {formatTime(item.timestamp)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleOpenGoodnessModal(item.id)}
                >
                  <Text style={styles.editButtonEmoji}>✏️</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={60} color="#bdc3c7" />
            <Text style={styles.emptyText}>
              {isToday(selectedDate) 
                ? "What good will you do today?" 
                : "No good deeds recorded for this date"
              }
            </Text>
            <Text style={styles.emptySubtext}>
              Tap + to add a good deed
            </Text>
          </View>
        )}

        {/* Quick Add Input */}
        <View style={styles.quickAddContainer}>
          <TouchableOpacity 
            style={styles.quickAddButton}
            onPress={() => handleOpenGoodnessModal()}
          >
            <Ionicons name="add-circle-outline" size={24} color="#3498db" />
          </TouchableOpacity>
          <TextInput 
            style={styles.quickAddInput}
            placeholder="Add a good deed..."
            placeholderTextColor="#95a5a6"
            onFocus={() => handleOpenGoodnessModal()}
          />
        </View>

        {/* Bottom padding */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity 
        style={styles.floatingAddButton}
        onPress={() => handleOpenGoodnessModal()}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>

      {/* Rest of the Modal remains unchanged */}
      <Modal
        visible={goodnessModalVisible.isVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseGoodnessModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleCloseGoodnessModal}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContainer}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={e => e.stopPropagation()}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {goodnessModalVisible.editId ? 'Edit Good Deed' : 'Add Good Deed'}
                  </Text>
                  <TouchableOpacity
                    onPress={handleCloseGoodnessModal}
                    style={styles.closeButton}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.modalInput}
                  value={goodnessText}
                  onChangeText={setGoodnessText}
                  placeholder={isToday(selectedDate)
                    ? "What good will you do today?"
                    : "What good deed did you do on this day?"
                  }
                  multiline
                  autoFocus
                  placeholderTextColor="#95a5a6"
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={handleCloseGoodnessModal}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={handleAddGoodness}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
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
  achievementCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    position: 'relative',
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34495e',
    marginBottom: 8,
    paddingRight: 40,
  },
  achievementText: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  achievementIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(241, 196, 15, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementEmoji: {
    fontSize: 20,
  },
  deedsListContainer: {
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
  deedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  deedIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#e1f5fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deedIcon: {
    fontSize: 20,
  },
  deedContent: {
    flex: 1,
  },
  deedText: {
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
  quickAddContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 15,
  },
  quickAddButton: {
    marginRight: 12,
  },
  quickAddInput: {
    flex: 1,
    fontSize: 16,
    color: '#34495e',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
    alignItems: 'center',
  },
  modalContent: {
    width: 320,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34495e',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#95a5a6',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    fontSize: 16,
    minHeight: 100,
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