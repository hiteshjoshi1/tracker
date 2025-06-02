// app/(tabs)/journal.tsx
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { isToday, format } from 'date-fns';
import { goodDeedService, reflectionService } from '../../services/firebaseService';
import { useAuth } from '../../context/AuthContext';
import DateHeader from '../../components/DateHeader';
import { ModalConfig } from '@/models/types';

// Types
interface JournalItem {
  id: string;
  text: string;
  timestamp: Date;
  date?: Date;
  type: 'goodDeed' | 'reflection';
}

type TabType = 'goodDeeds' | 'reflections';

export default function JournalScreen() {
  // Get user info from auth context
  const { userInfo } = useAuth();
  
  // State for selected date and active tab
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<TabType>('goodDeeds');
  
  // Data states
  const [goodDeeds, setGoodDeeds] = useState<JournalItem[]>([]);
  const [reflections, setReflections] = useState<JournalItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [modalVisible, setModalVisible] = useState<ModalConfig>({
    isVisible: false,
    initialText: '',
    editId: null
  });
  
  // Input states
  const [inputText, setInputText] = useState('');
  
  // Track if component is mounted
  const isMounted = useRef(true);

  // Component lifecycle
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Fetch data when user or date changes
  useEffect(() => {
    if (userInfo?.uid) {
      fetchDataForDate(selectedDate);
    }
  }, [userInfo, selectedDate]);

  // Function to fetch data for a specific date
  const fetchDataForDate = useCallback(async (date: Date) => {
    if (!userInfo?.uid || !isMounted.current) return;
    
    try {
      setLoading(true);
      
      // Fetch both good deeds and reflections
      const [deedsForDate, reflectionsForDate] = await Promise.all([
        goodDeedService.getItemsByDate(userInfo.uid, date),
        reflectionService.getItemsByDate(userInfo.uid, date)
      ]);
      
      if (isMounted.current) {
        setGoodDeeds(deedsForDate.map(item => ({ ...item, type: 'goodDeed' as const })));
        setReflections(reflectionsForDate.map(item => ({ ...item, type: 'reflection' as const })));
      }
    } catch (error) {
      console.error('Error fetching journal data for date:', error);
    } finally {
      setLoading(false);
    }
  }, [userInfo]);

  // Add new item
  const handleAddItem = async () => {
    if (!userInfo?.uid || !inputText.trim()) return;

    try {
      const service = activeTab === 'goodDeeds' ? goodDeedService : reflectionService;
      const now = new Date();

      if (modalVisible.editId) {
        // Editing existing item
        await service.updateItem(modalVisible.editId, {
          text: inputText.trim()
        });
        
        // Update local state
        if (activeTab === 'goodDeeds') {
          setGoodDeeds(prevItems => 
            prevItems.map(item => 
              item.id === modalVisible.editId
                ? { ...item, text: inputText.trim() }
                : item
            )
          );
        } else {
          setReflections(prevItems => 
            prevItems.map(item => 
              item.id === modalVisible.editId
                ? { ...item, text: inputText.trim() }
                : item
            )
          );
        }
      } else {
        // Adding new item
        const newItemId = await service.addItem(userInfo.uid, {
          text: inputText.trim(),
          timestamp: now
        }, selectedDate);
        
        // Add to local state
        const newItem: JournalItem = {
          id: newItemId,
          text: inputText.trim(),
          timestamp: now,
          date: selectedDate,
          type: activeTab === 'goodDeeds' ? 'goodDeed' : 'reflection'
        };
        
        if (activeTab === 'goodDeeds') {
          setGoodDeeds(prevItems => [...prevItems, newItem]);
        } else {
          setReflections(prevItems => [...prevItems, newItem]);
        }
      }
      
      // Close modal and clear text
      handleCloseModal();
    } catch (error) {
      console.error('Error managing journal item:', error);
    }
  };

  // Open modal for adding or editing
  const handleOpenModal = (itemId?: string) => {
    const currentItems = activeTab === 'goodDeeds' ? goodDeeds : reflections;
    
    if (itemId) {
      const itemToEdit = currentItems.find(item => item.id === itemId);
      setModalVisible({
        isVisible: true,
        initialText: itemToEdit?.text || '',
        editId: itemId
      });
      setInputText(itemToEdit?.text || '');
    } else {
      setModalVisible({
        isVisible: true,
        initialText: '',
        editId: null
      });
      setInputText('');
    }
  };

  // Close modal
  const handleCloseModal = () => {
    setModalVisible({ isVisible: false, initialText: '', editId: null });
    setInputText('');
  };

  // Format time for display
  const formatTime = (date?: Date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get current tab data
  const getCurrentItems = () => {
    return activeTab === 'goodDeeds' ? goodDeeds : reflections;
  };

  // Get tab specific content
  const getTabContent = () => {
    const items = getCurrentItems();
    const isGoodDeeds = activeTab === 'goodDeeds';
    
    if (items.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons 
            name={isGoodDeeds ? "heart-outline" : "book-outline"} 
            size={60} 
            color="#bdc3c7" 
          />
          <Text style={styles.emptyText}>
            {isToday(selectedDate) 
              ? `No ${isGoodDeeds ? 'good deeds' : 'reflections'} yet` 
              : `No ${isGoodDeeds ? 'good deeds' : 'reflections'} recorded for this date`
            }
          </Text>
          <Text style={styles.emptySubtext}>
            Tap + to add {isGoodDeeds ? 'a good deed' : 'a reflection'}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.itemsListContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {isToday(selectedDate) ? 'TODAY\'S' : format(selectedDate, 'MMMM d')} {isGoodDeeds ? 'GOOD DEEDS' : 'REFLECTIONS'}
          </Text>
        </View>
        {items.map(item => (
          <View key={item.id} style={styles.itemRow}>
            <View style={styles.itemIconContainer}>
              <Text style={styles.itemIcon}>{isGoodDeeds ? '🤝' : '💭'}</Text>
            </View>
            <View style={styles.itemContent}>
              <Text style={styles.itemText}>{item.text}</Text>
              <Text style={styles.timestampText}>
                {formatTime(item.timestamp)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => handleOpenModal(item.id)}
            >
              <Text style={styles.editButtonEmoji}>✏️</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  // Reflection prompts
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
    <SafeAreaView style={styles.container}>
      {/* Date Header */}
      <DateHeader 
        onDateChange={setSelectedDate}
        selectedDate={selectedDate}
      />

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'goodDeeds' && styles.activeTab]}
          onPress={() => setActiveTab('goodDeeds')}
        >
          <Ionicons 
            name="heart" 
            size={20} 
            color={activeTab === 'goodDeeds' ? '#3498db' : '#7f8c8d'} 
          />
          <Text style={[styles.tabText, activeTab === 'goodDeeds' && styles.activeTabText]}>
            Good Deeds
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'reflections' && styles.activeTab]}
          onPress={() => setActiveTab('reflections')}
        >
          <Ionicons 
            name="book" 
            size={20} 
            color={activeTab === 'reflections' ? '#3498db' : '#7f8c8d'} 
          />
          <Text style={[styles.tabText, activeTab === 'reflections' && styles.activeTabText]}>
            Reflections
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Reflection Prompt Card - Only show for reflections tab */}
        {activeTab === 'reflections' && (
          <View style={styles.promptCard}>
            <Text style={styles.promptTitle}>Reflection Prompt</Text>
            <Text style={styles.promptText}>{getRandomPrompt()}</Text>
            <TouchableOpacity 
              style={styles.promptAction}
              onPress={() => {
                setInputText(getRandomPrompt());
                handleOpenModal();
              }}
            >
              <Text style={styles.promptActionText}>Try another prompt</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Achievement Card - Only show for good deeds tab */}
        {activeTab === 'goodDeeds' && (
          <View style={styles.achievementCard}>
            <Text style={styles.achievementTitle}>
              {goodDeeds.length > 0 
                ? `You've done ${goodDeeds.length} good deed${goodDeeds.length > 1 ? 's' : ''} today!` 
                : "No good deeds recorded yet"
              }
            </Text>
            <Text style={styles.achievementText}>
              {goodDeeds.length > 0 
                ? "Keep it up, you're making a difference!" 
                : "What good shall you do today?"
              }
            </Text>
            <View style={styles.achievementIcon}>
              <Text style={styles.achievementEmoji}>✨</Text>
            </View>
          </View>
        )}

        {/* Tab Content */}
        {getTabContent()}

        {/* Bottom padding */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity 
        style={styles.floatingAddButton}
        onPress={() => handleOpenModal()}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        visible={modalVisible.isVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleCloseModal}
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
                    {modalVisible.editId 
                      ? `Edit ${activeTab === 'goodDeeds' ? 'Good Deed' : 'Reflection'}` 
                      : `Add ${activeTab === 'goodDeeds' ? 'Good Deed' : 'Reflection'}`
                    }
                  </Text>
                  <TouchableOpacity
                    onPress={handleCloseModal}
                    style={styles.closeButton}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.modalInput}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder={
                    activeTab === 'goodDeeds'
                      ? (isToday(selectedDate)
                          ? "What good will you do today?"
                          : "What good deed did you do on this day?")
                      : "Write your reflection..."
                  }
                  multiline
                  autoFocus
                  placeholderTextColor="#95a5a6"
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={handleCloseModal}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={handleAddItem}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f8fa',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 15,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
  },
  activeTab: {
    backgroundColor: '#e3f2fd',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  activeTabText: {
    color: '#3498db',
  },
  scrollView: {
    flex: 1,
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
  itemsListContainer: {
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
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#e1f5fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemIcon: {
    fontSize: 20,
  },
  itemContent: {
    flex: 1,
  },
  itemText: {
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