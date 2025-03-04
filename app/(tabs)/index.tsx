//app/(tabs)/index.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Platform,
    Modal,
    KeyboardAvoidingView,
    TextInput,
} from 'react-native';
import DateHeader from '../../components/DateHeader';
import { isToday, isBefore, isSameDay } from 'date-fns';

import { goalService, goodDeedService, reflectionService } from '../../services/firebaseService';
import { auth } from '../../config/firebase';
import styles from '../../styles/TodayScreenStyles';

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

interface GoodnessItem {
    id: string;
    text: string;
    timestamp: Date;
    date?: Date;
}

interface ReflectionItem {
    id: string;
    text: string;
    timestamp: Date;
    date?: Date;
}

const TodayScreen: React.FC = () => {
    // State for selected date
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    
    // Data states
    const [goals, setGoals] = useState<Goal[]>([]);
    const [goodnessItems, setGoodnessItems] = useState<GoodnessItem[]>([]);
    const [reflectionItems, setReflectionItems] = useState<ReflectionItem[]>([]);
    
    // Modal states
    const [goalModalVisible, setGoalModalVisible] = useState<ModalConfig>({
        isVisible: false,
        initialText: '',
        editId: null
    });
    const [goodnessModalVisible, setGoodnessModalVisible] = useState<ModalConfig>({
        isVisible: false,
        initialText: '',
        editId: null,
    });
    const [reflectionModalVisible, setReflectionModalVisible] = useState<ModalConfig>({
        isVisible: false,
        initialText: '',
        editId: null,
    });
    
    // Input states
    const [newGoalText, setNewGoalText] = useState('');
    const [goodnessText, setGoodnessText] = useState('');
    const [reflectionText, setReflectionText] = useState('');
    
    // Track if component is mounted to prevent state updates after unmount
    const isMounted = useRef(true);
    
    // Track active user
    const [userId, setUserId] = useState<string | null>(null);

    // Set up authentication listener only once
    useEffect(() => {
        // Set mounted flag
        isMounted.current = true;
        
        // Check if user is logged in
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (isMounted.current) {
                if (user) {
                    setUserId(user.uid);
                } else {
                    setUserId(null);
                }
            }
        });
        
        // Cleanup
        return () => {
            isMounted.current = false;
            unsubscribeAuth();
        };
    }, []);

    // Fetch data when user or date changes
    useEffect(() => {
        if (!userId) return;
        
        // Fetch data for the selected date
        fetchDataForDate(selectedDate);
    }, [userId, selectedDate]);

    // Function to fetch all data for a specific date
    const fetchDataForDate = useCallback(async (date: Date) => {
        if (!userId || !isMounted.current) return;
        
        try {
            // Fetch goals
            const goalsForDate = await goalService.getItemsByDate(userId, date);
            
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
            
            // Fetch good deeds
            const deedsForDate = await goodDeedService.getItemsByDate(userId, date);
            if (isMounted.current) {
                setGoodnessItems(deedsForDate);
            }
            
            // Fetch reflections
            const reflectionsForDate = await reflectionService.getItemsByDate(userId, date);
            if (isMounted.current) {
                setReflectionItems(reflectionsForDate);
            }
        } catch (error) {
            console.error('Error fetching data for date:', error);
        }
    }, [userId]);

    // Handle date change from the DateHeader component
    const handleDateChange = useCallback((date: Date) => {
        setSelectedDate(date);
    }, []);

    // Calculate progress percentage
    const getProgressPercentage = useCallback(() => {
        if (goals.length === 0) return 0;
        const completedGoals = goals.filter(goal => goal.completed).length;
        return (completedGoals / goals.length) * 100;
    }, [goals]);

    // Goal functions
    const toggleGoal = async (id: string) => {
        if (!userId) return;
        
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
        if (!userId || !newGoalText.trim()) return;

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
                const newGoalId = await goalService.addItem(userId, {
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

    // Goodness functions
    const handleAddGoodness = async () => {
        if (!userId || !goodnessText.trim()) return;

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
                const newItemId = await goodDeedService.addItem(userId, {
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

    // Reflection functions
    const handleAddReflection = async () => {
        if (!userId || !reflectionText.trim()) return;

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
                const newItemId = await reflectionService.addItem(userId, {
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

    return (
        <ScrollView style={styles.container}>
            <DateHeader 
    onDateChange={handleDateChange}
    progressPercentage={getProgressPercentage()}
/>

            <View style={styles.content}>
                {/* Goals Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>
                            {isToday(selectedDate) ? "Today's Goals" : `Goals for ${selectedDate.toLocaleDateString()}`}
                        </Text>
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => handleOpenGoalModal()}
                        >
                            <Text style={styles.addButtonText}>+</Text>
                        </TouchableOpacity>
                    </View>
                    {goals.length > 0 ? (
                        goals.map(goal => (
                            <View 
                                key={goal.id} 
                                style={[
                                    styles.goalItem,
                                    goal.isExpired && styles.expiredGoalItem
                                ]}
                            >
                                <TouchableOpacity
                                    style={[
                                        styles.checkboxContainer,
                                        goal.completed && styles.checkboxContainerChecked
                                    ]}
                                    onPress={() => toggleGoal(goal.id)}
                                >
                                    {goal.completed && (
                                        <Text style={styles.checkmark}>✓</Text>
                                    )}
                                </TouchableOpacity>
                                <Text style={[
                                    styles.goalText,
                                    goal.completed && styles.completedGoal,
                                    goal.isExpired && styles.expiredGoalText
                                ]}>
                                    {goal.text}
                                </Text>
                                <TouchableOpacity
                                    style={styles.editItemButton}
                                    onPress={() => handleOpenGoalModal(goal.id)}
                                >
                                    <Text style={styles.editButtonText}>Edit</Text>
                                </TouchableOpacity>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No goals for this date</Text>
                            <Text style={styles.emptySubtext}>Tap + to add a goal</Text>
                        </View>
                    )}
                </View>

                {/* Goodness Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>
                            {isToday(selectedDate) 
                                ? "What good shall I do today?" 
                                : `Good deeds for ${selectedDate.toLocaleDateString()}`
                            }
                        </Text>
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => handleOpenGoodnessModal()}
                        >
                            <Text style={styles.addButtonText}>+</Text>
                        </TouchableOpacity>
                    </View>
                    {goodnessItems.length > 0 ? (
                        <View style={styles.goodnessList}>
                            {goodnessItems.map(item => (
                                <View key={item.id} style={styles.goodnessItem}>
                                    <View style={styles.goodnessContent}>
                                        <Text style={styles.contentText}>{item.text}</Text>
                                        <Text style={styles.timestampText}>
                                            {item.timestamp && new Date(item.timestamp).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.editItemButton}
                                        onPress={() => handleOpenGoodnessModal(item.id)}
                                    >
                                        <Text style={styles.editButtonText}>Edit</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>
                                {isToday(selectedDate) 
                                    ? "What good will you do today?" 
                                    : "No good deeds recorded for this date"
                                }
                            </Text>
                            <Text style={styles.emptySubtext}>Tap + to add a good deed</Text>
                        </View>
                    )}
                </View>

                {/* Reflection Section */}
                <View style={[styles.section, styles.reflectionSection]}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>
                            {isToday(selectedDate) 
                                ? "Today's Reflections" 
                                : `Reflections for ${selectedDate.toLocaleDateString()}`
                            }
                        </Text>
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => handleOpenReflectionModal()}
                        >
                            <Text style={styles.addButtonText}>+</Text>
                        </TouchableOpacity>
                    </View>
                    {reflectionItems.length > 0 ? (
                        <View style={styles.reflectionList}>
                            {reflectionItems.map(item => (
                                <View key={item.id} style={styles.reflectionItem}>
                                    <View style={styles.reflectionContent}>
                                        <Text style={styles.contentText}>{item.text}</Text>
                                        <Text style={styles.timestampText}>
                                            {item.timestamp && new Date(item.timestamp).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.editItemButton}
                                        onPress={() => handleOpenReflectionModal(item.id)}
                                    >
                                        <Text style={styles.editButtonText}>Edit</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyContainer}>
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
                </View>
            </View>

            {/* Modals */}
            {/* Goal Modal */}
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

            {/* Goodness Modal */}
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

                                <View style={styles.modalFooter}>
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
                            placeholder={isToday(selectedDate)
                                ? "Write your reflection..."
                                : `Write your reflection for ${selectedDate.toLocaleDateString()}...`
                            }
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
        </ScrollView>
    );
};

export default TodayScreen;