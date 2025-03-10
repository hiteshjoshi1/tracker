// app/(modals)/goals.tsx
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
import { isToday, isBefore, format } from 'date-fns';
import { goalService } from '../../services/firebaseService';
import { useAuth } from '../../context/AuthContext';
import DateHeader from '../../components/DateHeader';
import { ModalConfig } from '@/models/types';


// Types
interface Goal {
  id: string;
  text: string;
  completed: boolean;
  date?: Date;
  isExpired?: boolean;
}

export default function GoalsScreen() {
  // Get user info from auth context
  const { userInfo } = useAuth();
  
  // State management
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
  
  // Track if component is mounted
  const isMounted = useRef(true);

  // Component lifecycle
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Fetch goals when user or date changes
  useEffect(() => {
    if (userInfo?.uid) {
      fetchDataForDate(selectedDate);
    }
  }, [userInfo, selectedDate]);

  // Fetch goals for a specific date
  const fetchDataForDate = useCallback(async (date: Date) => {
    if (!userInfo?.uid || !isMounted.current) return;
    
    try {
      setLoading(true);
      const goalsForDate = await goalService.getItemsByDate(userInfo.uid, date);
      
      // Mark expired goals for past dates
      const processedGoals = goalsForDate.map(goal => ({
        ...goal,
        isExpired: isBefore(date, new Date()) && !goal.completed && !isToday(date)
      }));
      
      if (isMounted.current) {
        setGoals(processedGoals);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  }, [userInfo]);

  // Toggle goal completion
  const toggleGoal = async (id: string) => {
    if (!userInfo?.uid) return;
    
    try {
      const goal = goals.find(g => g.id === id);
      if (goal) {
        await goalService.toggleCompletion(id, !goal.completed);
        
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

  // Add or edit goal
  const handleAddGoal = async () => {
    if (!userInfo?.uid || !newGoalText.trim()) return;

    try {
      if (goalModalVisible.editId) {
        // Editing existing goal
        await goalService.updateItem(goalModalVisible.editId, {
          text: newGoalText.trim()
        });
        
        setGoals(prevGoals => 
          prevGoals.map(goal => 
            goal.id === goalModalVisible.editId
              ? { ...goal, text: newGoalText.trim() }
              : goal
          )
        );
      } else {
        // Adding new goal
        const newGoalId = await goalService.addItem(userInfo.uid, {
          text: newGoalText.trim(),
          completed: false
        }, selectedDate);
        
        setGoals(prevGoals => [...prevGoals, {
          id: newGoalId,
          text: newGoalText.trim(),
          completed: false,
          date: selectedDate
        }]);
      }
      
      // Close modal and reset
      handleCloseGoalModal();
    } catch (error) {
      console.error('Error managing goal:', error);
    }
  };

  // Open goal modal for adding or editing
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

  // Close goal modal
  const handleCloseGoalModal = () => {
    setGoalModalVisible({ isVisible: false, initialText: '', editId: null });
    setNewGoalText('');
  };

  // Calculate progress percentage
  const getProgressPercentage = useCallback(() => {
    if (goals.length === 0) return 0;
    const completedGoals = goals.filter(goal => goal.completed).length;
    return (completedGoals / goals.length) * 100;
  }, [goals]);

  // Separate goals into completed and active
  const completedGoals = goals.filter(goal => goal.completed);
  const activeGoals = goals.filter(goal => !goal.completed);

  return (
    <View style={styles.container}>
      {/* Date Header with Progress */}
      <DateHeader 
        onDateChange={setSelectedDate}
        selectedDate={selectedDate}
        progressPercentage={getProgressPercentage()}
      />

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Goals Summary */}
        <View style={styles.goalsSummaryContainer}>
          <Text style={styles.goalsSummaryText}>Goals Progress</Text>
          <Text style={styles.goalsSummaryText}>
            {completedGoals.length}/{goals.length} Completed
          </Text>
        </View>

        {/* Active Goals Section */}
        <View style={styles.activeGoalsContainer}>
          <View style={styles.activeGoalsHeader}>
            <Text style={styles.activeGoalsTitle}>Active Goals</Text>
            <TouchableOpacity 
              onPress={() => handleOpenGoalModal()}
              style={styles.addGoalButton}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.addGoalButtonText}>Add Goal</Text>
            </TouchableOpacity>
          </View>

          {activeGoals.length === 0 ? (
            <Text style={styles.emptyGoalsText}>
              No active goals for {isToday(selectedDate) ? 'today' : format(selectedDate, 'MMMM d')}
            </Text>
          ) : (
            activeGoals.map(goal => (
              <View 
                key={goal.id} 
                style={styles.goalItem}
              >
                <TouchableOpacity 
                  onPress={() => toggleGoal(goal.id)}
                  style={styles.goalCheckbox}
                />
                <Text style={styles.goalText}>{goal.text}</Text>
                <TouchableOpacity onPress={() => handleOpenGoalModal(goal.id)}>
                  <Ionicons name="create-outline" size={24} color="#3498db" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Completed Goals Section */}
        {completedGoals.length > 0 && (
          <View style={styles.completedGoalsContainer}>
            <Text style={styles.completedGoalsTitle}>
              Completed Goals
            </Text>
            {completedGoals.map(goal => (
              <View 
                key={goal.id} 
                style={styles.completedGoalItem}
              >
                <Ionicons 
                  name="checkmark-circle" 
                  size={24} 
                  color="#2ecc71" 
                  style={{ marginRight: 10 }} 
                />
                <Text style={styles.completedGoalText}>
                  {goal.text}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Goal Modal */}
      <Modal
        visible={goalModalVisible.isVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseGoalModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {goalModalVisible.editId ? 'Edit Goal' : 'New Goal'}
            </Text>
            <TextInput
              value={newGoalText}
              onChangeText={setNewGoalText}
              placeholder="Enter your goal"
              style={styles.modalInput}
              multiline
              autoFocus
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                onPress={handleCloseGoalModal}
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleAddGoal}
                style={styles.modalSaveButton}
              >
                <Text style={styles.modalSaveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f8fa',
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  goalsSummaryContainer: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 16, 
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  goalsSummaryText: {
    color: '#2c3e50',
    fontSize: 16,
  },
  activeGoalsContainer: {
    backgroundColor: 'white', 
    margin: 16, 
    borderRadius: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  activeGoalsHeader: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: 16,
  },
  activeGoalsTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#2c3e50',
  },
  addGoalButton: {
    backgroundColor: '#3498db', 
    borderRadius: 20, 
    paddingHorizontal: 12, 
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addGoalButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 5,
  },
  emptyGoalsText: {
    textAlign: 'center', 
    padding: 16, 
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  goalItem: {
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  goalCheckbox: {
    width: 24, 
    height: 24, 
    borderWidth: 2, 
    borderColor: '#3498db', 
    borderRadius: 12,
    marginRight: 10,
  },
  goalText: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
  },
  completedGoalsContainer: {
    backgroundColor: 'white', 
    margin: 16, 
    borderRadius: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  completedGoalsTitle: {
    fontWeight: 'bold', 
    padding: 16,
    fontSize: 18,
    color: '#2c3e50',
  },
  completedGoalItem: {
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  completedGoalText: {
    flex: 1, 
    textDecorationLine: 'line-through',
    color: '#7f8c8d',
    fontSize: 16,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: '80%', 
    backgroundColor: 'white', 
    borderRadius: 10, 
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalTitle: {
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 15,
    color: '#2c3e50',
  },
  modalInput: {
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 5, 
    padding: 10, 
    marginBottom: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalButtonContainer: {
    flexDirection: 'row', 
    justifyContent: 'flex-end',
  },
  modalCancelButton: {
    marginRight: 15, 
    padding: 10,
  },
  modalCancelButtonText: {
    color: '#3498db',
    fontSize: 16,
  },
  modalSaveButton: {
    backgroundColor: '#3498db', 
    padding: 10, 
    borderRadius: 5,
  },
  modalSaveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});