// app/(modals)/goals.tsx
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
import { isToday, isBefore, addDays, subDays, format, isSameDay } from 'date-fns';
import { router } from 'expo-router';
import { goalService } from '../../services/firebaseService';
import { useAuth } from '../../context/AuthContext';
import DateHeader from '../../components/DateHeader'; // Updated import

// Types
interface Goal {
  id: string;
  text: string;
  completed: boolean;
  date?: Date;
  isExpired?: boolean;
}

interface ModalConfig {
  isVisible: boolean;
  initialText: string;
  editId: string | null;
}

export default function GoalsScreen() {
  // Get user info from auth context
  const { userInfo } = useAuth();
  
  // Data states
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [goalModalVisible, setGoalModalVisible] = useState<ModalConfig>({
    isVisible: false,
    initialText: '',
    editId: null
  });
  
  // Input states
  const [newGoalText, setNewGoalText] = useState('');
  
  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);

  // Cleanup mounted flag
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

  // Function to fetch goals for a specific date
  const fetchDataForDate = useCallback(async (date: Date) => {
    if (!userInfo?.uid || !isMounted.current) return;
    
    try {
      setLoading(true);
      // Fetch goals
      const goalsForDate = await goalService.getItemsByDate(userInfo.uid, date);
      
      // Mark expired goals
      if (isBefore(date, new Date()) && !isToday(date)) {
        if (isMounted.current) {
          setGoals(goalsForDate.map(goal => ({
            ...goal,
            isExpired: !goal.completed
          })));
        }
      } else {
        if (isMounted.current) {
          setGoals(goalsForDate);
        }
      }
    } catch (error) {
      console.error('Error fetching goals for date:', error);
    } finally {
      setLoading(false);
    }
  }, [userInfo]);

  // Calculate progress percentage
  const getProgressPercentage = useCallback(() => {
    if (goals.length === 0) return 0;
    const completedGoals = goals.filter(goal => goal.completed).length;
    return (completedGoals / goals.length) * 100;
  }, [goals]);

  // Goal functions
  const toggleGoal = async (id: string) => {
    if (!userInfo?.uid) return;
    
    try {
      const goal = goals.find(g => g.id === id);
      if (goal) {
        await goalService.toggleCompletion(id, !goal.completed);
        
        // Update local state
        setGoals(prevGoals => 
          prevGoals.map(g => 
            g.id === id ? { ...g, completed: !goal.completed } : g
          )
        );
      }
    } catch (error) {
      console.error('Error toggling goal:', error);
    }
  };

  const handleAddGoal = async () => {
    if (!userInfo?.uid || !newGoalText.trim()) return;

    try {
      if (goalModalVisible.editId) {
        // Editing existing goal
        await goalService.updateItem(goalModalVisible.editId, {
          text: newGoalText.trim()
        });
        
        // Update local state
        setGoals(prevGoals => 
          prevGoals.map(goal => 
            goal.id === goalModalVisible.editId
              ? { ...goal, text: newGoalText.trim() }
              : goal
          )
        );
      } else {
        // Adding new goal for the selected date
        const newGoalId = await goalService.addItem(userInfo.uid, {
          text: newGoalText.trim(),
          completed: false
        }, selectedDate);
        
        // Add to local state
        setGoals(prevGoals => [...prevGoals, {
          id: newGoalId,
          text: newGoalText.trim(),
          completed: false,
          date: selectedDate
        }]);
      }
      
      // Close modal and clear text
      handleCloseGoalModal();
    } catch (error) {
      console.error('Error managing goal:', error);
    }
  };

  const handleOpenGoalModal = (itemId?: string) => {
    if (itemId) {
      const goalToEdit = goals.find(goal => goal.id === itemId);
      setGoalModalVisible({
        isVisible: true,
        initialText: goalToEdit?.text || '',
        editId: itemId
      });
      setNewGoalText(goalToEdit?.text || '');
    } else {
      setGoalModalVisible({
        isVisible: true,
        initialText: '',
        editId: null
      });
      setNewGoalText('');
    }
  };

  const handleCloseGoalModal = () => {
    setGoalModalVisible({ isVisible: false, initialText: '', editId: null });
    setNewGoalText('');
  };

  // Filter goals for the segmented UI
  const completedGoals = goals.filter(goal => goal.completed);
  const activeGoals = goals.filter(goal => !goal.completed);

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
      {/* Header with Date Selector */}
      <DateHeader 
        onDateChange={setSelectedDate}
        progressPercentage={getProgressPercentage()}
      />

      <ScrollView style={styles.scrollView}>
        {/* Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {completedGoals.length}/{goals.length} completed ({Math.round(getProgressPercentage())}%)
          </Text>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterText}>All</Text>
          </TouchableOpacity>
        </View>

        {/* Rest of the component remains the same */}
        {/* Completed Goals Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>COMPLETED ({completedGoals.length})</Text>
            <TouchableOpacity>
              <Ionicons name="chevron-down" size={24} color="#95a5a6" />
            </TouchableOpacity>
          </View>
          
          {completedGoals.length > 0 ? (
            completedGoals.map(goal => (
              <View key={goal.id} style={styles.goalItem}>
                <TouchableOpacity
                  style={styles.goalCheckCircle}
                  onPress={() => toggleGoal(goal.id)}
                >
                  <View style={styles.checkedCircle}>
                    <Ionicons name="checkmark" size={20} color="white" />
                  </View>
                </TouchableOpacity>
                <Text style={styles.goalTextCompleted}>{goal.text}</Text>
                <Text style={styles.goalTime}>{formatTime(goal.date)}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>No completed goals for this date</Text>
            </View>
          )}
        </View>

        {/* Active Goals Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ACTIVE ({activeGoals.length})</Text>
            <TouchableOpacity>
              <Ionicons name="chevron-down" size={24} color="#95a5a6" />
            </TouchableOpacity>
          </View>
          
          {activeGoals.length > 0 ? (
            activeGoals.map(goal => (
              <View key={goal.id} style={styles.goalItem}>
                <TouchableOpacity
                  style={styles.goalCheckCircle}
                  onPress={() => toggleGoal(goal.id)}
                >
                  <View style={styles.uncheckedCircle} />
                </TouchableOpacity>
                <Text style={[
                  styles.goalText,
                  goal.isExpired && styles.expiredGoalText
                ]}>
                  {goal.text}
                </Text>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => handleOpenGoalModal(goal.id)}
                >
                  <Text style={styles.editButtonEmoji}>✏️</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>
                {isToday(selectedDate) 
                  ? "No active goals for today" 
                  : "No active goals for this date"
                }
              </Text>
            </View>
          )}
        </View>

        {/* Quick Add Goal - only show for today or future dates */}
        {!isBefore(selectedDate, new Date()) && (
          <View style={styles.quickAddContainer}>
            <View style={styles.quickAddCircle}>
              <Text style={styles.quickAddPlus}>+</Text>
            </View>
            <TextInput 
              style={styles.quickAddInput}
              placeholder="Add a goal..."
              placeholderTextColor="#95a5a6"
              onFocus={() => handleOpenGoalModal()}
            />
          </View>
        )}

        {/* Bottom padding */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Floating Add Button - only show for today or future dates */}
      {!isBefore(selectedDate, new Date()) && (
        <TouchableOpacity 
          style={styles.floatingAddButton}
          onPress={() => handleOpenGoalModal()}
        >
          <Ionicons name="add" size={32} color="white" />
        </TouchableOpacity>
      )}

      {/* Goal Modal - unchanged */}
      <Modal
        visible={goalModalVisible.isVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseGoalModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {goalModalVisible.editId ? 'Edit Goal' : 'Add New Goal'}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={newGoalText}
              onChangeText={setNewGoalText}
              placeholder="Enter your goal"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCloseGoalModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddGoal}
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
    backgroundColor: '#f5f8fa',
  },
  emptySection: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  emptyText: {
    color: '#95a5a6',
    fontSize: 14,
    fontStyle: 'italic',
  },
  expiredGoalText: {
    color: '#e74c3c',
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
  progressBarBackground: {
    height: 8,
    backgroundColor: '#ecf0f1',
    width: '100%',
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#3498db',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 15,
  },
  statsText: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  filterButton: {
    backgroundColor: '#f0f8ff',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  filterText: {
    color: '#3498db',
    fontWeight: 'bold',
  },
  sectionContainer: {
    marginTop: 8,
    backgroundColor: '#f9f9f9',
    marginHorizontal: 16,
    borderRadius: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#95a5a6',
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  goalCheckCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  uncheckedCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#95a5a6',
  },
  checkedCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalText: {
    fontSize: 16,
    color: '#34495e',
    flex: 1,
  },
  goalTextCompleted: {
    fontSize: 16,
    color: '#95a5a6',
    flex: 1,
    textDecorationLine: 'line-through',
  },
  goalTime: {
    fontSize: 14,
    color: '#bdc3c7',
  },
  editButton: {
    marginLeft: 10,
  },
  editButtonEmoji: {
    fontSize: 16,
  },
  quickAddContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 15,
  },
  quickAddCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#95a5a6',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quickAddPlus: {
    fontSize: 18,
    color: '#95a5a6',
  },
  quickAddInput: {
    fontSize: 16,
    color: '#34495e',
    flex: 1,
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
    width: '80%',
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