import { StyleSheet, Platform } from 'react-native';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f6fa',
    },
    progressText: {
        color: '#fff',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    content: {
        paddingTop: 16,
        padding: 20,
    },
    section: {
        marginBottom: 20,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
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
    expiredGoalItem: {
        backgroundColor: 'rgba(231, 76, 60, 0.05)', // Light red background for expired goals
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
    expiredGoalText: {
        color: '#e74c3c', // Red text for expired goals
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
    }, 
    reflectionList: {
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
        marginTop: 16,
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

export default styles;