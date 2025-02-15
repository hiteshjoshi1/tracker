import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
    Dimensions,
    Modal,
    KeyboardAvoidingView,
    TextInput,
} from 'react-native';
import DateHeader from '../components/DateHeader';
import { LinearGradient } from 'expo-linear-gradient';

// Types remain the same
interface Goal {
    id: string;
    text: string;
    completed: boolean;
}

// Add this interface
interface ModalConfig {
    isVisible: boolean;
    initialText: string;
    editId: string | null;
}
interface GoodnessItem {
    id: string;
    text: string;
    timestamp: Date;
}


const TodayScreen: React.FC = () => {

    // goals
    const [goals, setGoals] = useState<Goal[]>([
        { id: '1', text: 'Complete the app design', completed: false },
        { id: '2', text: 'Work out for 30 minutes', completed: false },
    ]);
    const [goalModalVisible, setGoalModalVisible] = useState<ModalConfig>({
        isVisible: false,
        initialText: '',
        editId: null
    });
    const [newGoalText, setNewGoalText] = useState('');


    //goodness
    const [goodnessText, setGoodnessText] = useState('');
    const [goodnessItems, setGoodnessItems] = useState<GoodnessItem[]>([]);

    const [goodnessModalVisible, setGoodnessModalVisible] = useState<ModalConfig>({
        isVisible: false,
        initialText: '',
        editId: null, // Add this to track which item is being edited
    });

    // reflection
    interface ReflectionItem {
        id: string;
        text: string;
        timestamp: Date;
    }

    // Update the state to handle an array of items
    const [reflectionItems, setReflectionItems] = useState<ReflectionItem[]>([]);
    const [reflectionModalVisible, setReflectionModalVisible] = useState<ModalConfig>({
        isVisible: false,
        initialText: '',
        editId: null,
    });
    const [reflectionText, setReflectionText] = useState('');



    // Functions remain the same
    const toggleGoal = (id: string) => {
        setGoals(goals.map(goal =>
            goal.id === id ? { ...goal, completed: !goal.completed } : goal
        ));
    };


    const getProgressPercentage = () => {
        if (goals.length === 0) return 0;
        const completedGoals = goals.filter(goal => goal.completed).length;
        return (completedGoals / goals.length) * 100;
    };


    // goal functions
    const handleAddGoal = () => {
        if (newGoalText.trim()) {
            if (goalModalVisible.editId) {
                // Editing existing goal
                setGoals(goals.map(goal =>
                    goal.id === goalModalVisible.editId
                        ? { ...goal, text: newGoalText.trim() }
                        : goal
                ));
            } else {
                // Adding new goal
                const newGoal: Goal = {
                    id: Date.now().toString(),
                    text: newGoalText.trim(),
                    completed: false,
                };
                setGoals([...goals, newGoal]);
            }
            handleCloseGoalModal();
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

    // goodness function
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

    const handleAddGoodness = () => {
        if (goodnessText.trim()) {
            if (goodnessModalVisible.editId) {
                // Editing existing item
                setGoodnessItems(prevItems =>
                    prevItems.map(item =>
                        item.id === goodnessModalVisible.editId
                            ? { ...item, text: goodnessText.trim() }
                            : item
                    )
                );
            } else {
                // Adding new item
                const newItem = {
                    id: Date.now().toString(),
                    text: goodnessText.trim(),
                    timestamp: new Date(),
                };
                setGoodnessItems(prevItems => [...prevItems, newItem]);
            }
            handleCloseGoodnessModal();
        }
    };

    //reflection functions
    const handleAddReflection = () => {
        if (reflectionText.trim()) {
            if (reflectionModalVisible.editId) {
                // Editing existing item
                setReflectionItems(prevItems =>
                    prevItems.map(item =>
                        item.id === reflectionModalVisible.editId
                            ? { ...item, text: reflectionText.trim() }
                            : item
                    )
                );
            } else {
                // Adding new item
                const newItem: ReflectionItem = {
                    id: Date.now().toString(),
                    text: reflectionText.trim(),
                    timestamp: new Date(),
                };
                setReflectionItems(prevItems => [...prevItems, newItem]);
            }
            handleCloseReflectionModal();
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
            <LinearGradient
                colors={['#4a90e2', '#357abd']}
                style={styles.header}
            >
                <DateHeader />
                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        <View
                            style={[
                                styles.progressFill,
                                { width: `${getProgressPercentage()}%` }
                            ]}
                        />
                    </View>
                    <Text style={styles.progressText}>
                        {Math.round(getProgressPercentage())}% of daily goals completed
                    </Text>
                </View>
            </LinearGradient>


            <View style={styles.content}>
                {/* Goals Section start */}
                {/* What good shall I do today Section */}

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Today's Goals</Text>
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => handleOpenGoalModal()}
                        >
                            <Text style={styles.addButtonText}>+</Text>
                        </TouchableOpacity>
                    </View>
                    {goals.length > 0 ? (
                        goals.map(goal => (
                            <View key={goal.id} style={styles.goalItem}>
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
                                    goal.completed && styles.completedGoal
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
                            <Text style={styles.emptyText}>No goals yet</Text>
                            <Text style={styles.emptySubtext}>Tap + to add your first goal</Text>
                        </View>
                    )}
                </View>

                {/* Goals Section end */}

                {/* Goodness Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>What good shall I do today?</Text>
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
                                            {new Date(item.timestamp).toLocaleTimeString([], {
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
                            <Text style={styles.emptyText}>What good will you do today?</Text>
                            <Text style={styles.emptySubtext}>Tap + to add your first good deed</Text>
                        </View>
                    )}
                </View>
                {/* Goodness Section end */}

                {/* Reflection Section */}
                <View style={[styles.section, styles.reflectionSection]}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Today's Reflections</Text>
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
                                            {new Date(item.timestamp).toLocaleTimeString([], {
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
                            <Text style={styles.emptyText}>No reflections yet</Text>
                            <Text style={styles.emptySubtext}>Take a moment to reflect on your day</Text>
                        </View>
                    )}
                </View>
                {/* Reflection Section end */}

            </View>



            {/* Modals start here        */}
            {/* Goal Modal start here        */}
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
            {/* Goal Modal end here        */}

            {/* Goodness modal         */}

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
                                    placeholder="What good will you do today?"
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
            {/* Goodness modal end */}

            {/* reflection modal */}
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

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f6fa',
    },
    header: {
        padding: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    progressContainer: {
        marginTop: 16,
    },
    progressBar: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#fff',
        borderRadius: 3,
    },
    progressText: {
        color: '#fff',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    content: {
        padding: 20,
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 20,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    addButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#4a90e2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '600',
        marginTop: -2,
    },
    editButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: '#f0f0f0',
    },
    editButtonText: {
        color: '#4a90e2',
        fontSize: 14,
        fontWeight: '500',
    },
    goalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    checkboxContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#4a90e2',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxContainerChecked: {
        backgroundColor: '#4a90e2',
        borderColor: '#4a90e2',
    },
    checkmark: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    goalText: {
        fontSize: 16,
        color: '#1a1a1a',
        flex: 1,
    },
    completedGoal: {
        textDecorationLine: 'line-through',
        color: '#95a5a6',
    },
    cardContent: {
        padding: 16,
    },
    contentText: {
        fontSize: 16,
        color: '#1a1a1a',
        lineHeight: 24,
    },
    quoteIcon: {
        fontSize: 40,
        color: '#4a90e2',
        opacity: 0.2,
        position: 'absolute',
        top: -5,
        left: 10,
    },
    emptyContainer: {
        padding: 24,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#95a5a6',
        marginBottom: 4,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#bdc3c7',
    },
    reflectionSection: {
        backgroundColor: '#fff',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
        color: '#1a1a1a',
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        minHeight: 40,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 16,
        gap: 12,
    },
    modalButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f0f0f0',
    },
    saveButton: {
        backgroundColor: '#4a90e2',
    },
    cancelButtonText: {
        color: '#4a90e2',
        fontWeight: '600',
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    goodnessList: {
        padding: 16,
    },
    goodnessItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    goodnessContent: {
        flex: 1,
        marginRight: 12,
    },
    editItemButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: '#f0f0f0',
    },
    timestampText: {
        fontSize: 12,
        color: '#95a5a6',
        marginTop: 4,
    }, reflectionList: {
        padding: 16,
    },
    reflectionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    reflectionContent: {
        flex: 1,
        marginRight: 12,
    },
    goodnessItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    closeButton: {
        padding: 8,
    },
    closeButtonText: {
        fontSize: 20,
        color: '#95a5a6',
        fontWeight: '500',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    }

});

export default TodayScreen;
