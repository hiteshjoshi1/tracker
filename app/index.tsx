import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import DateHeader from '../components/DateHeader';
import { LinearGradient } from 'expo-linear-gradient';

// Types remain the same
interface Goal {
  id: string;
  text: string;
  completed: boolean;
}

interface Habit {
  id: string;
  name: string;
  status: 'completed' | 'failed' | 'untracked';
}

const TodayScreen: React.FC = () => {
  // State management remains the same
  const [goals, setGoals] = useState<Goal[]>([
    { id: '1', text: 'Complete the app design', completed: false },
    { id: '2', text: 'Work out for 30 minutes', completed: false },
  ]);

  const [goodness, setGoodness] = useState<string>('Help someone learn coding');
  const [reflection, setReflection] = useState<string>(
    'Today was productive. I learned something new and helped others.'
  );

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

      {/* Goals Section */}
      <View style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Goals</Text>
            <TouchableOpacity style={styles.addButton}>
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          {goals.length > 0 ? (
            goals.map(goal => (
              <TouchableOpacity
                key={goal.id}
                style={styles.goalItem}
                onPress={() => toggleGoal(goal.id)}
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
                  goal.completed && styles.completedGoal
                ]}>
                  {goal.text}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No goals yet</Text>
              <Text style={styles.emptySubtext}>Tap + to add your first goal</Text>
            </View>
          )}
        </View>

        {/* Goodness Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Act of Kindness</Text>
            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          {goodness ? (
            <View style={styles.cardContent}>
              <Text style={styles.quoteIcon}>"</Text>
              <Text style={styles.contentText}>{goodness}</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>What good will you do today?</Text>
              <Text style={styles.emptySubtext}>Tap to add your intention</Text>
            </View>
          )}
        </View>

        {/* Reflection Section */}
        <View style={[styles.section, styles.reflectionSection]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Reflections</Text>
            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          {reflection ? (
            <View style={styles.cardContent}>
              <Text style={styles.contentText}>{reflection}</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No reflection yet</Text>
              <Text style={styles.emptySubtext}>Take a moment to reflect on your day</Text>
            </View>
          )}
        </View>
      </View>
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
});

export default TodayScreen;
// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
// } from 'react-native';
// import DateHeader from '../components/DateHeader';
// // Types
// interface Goal {
//   id: string;
//   text: string;
//   completed: boolean;
// }

// interface Habit {
//   id: string;
//   name: string;
//   status: 'completed' | 'failed' | 'untracked';
// }

// const TodayScreen: React.FC = () => {
//   // Sample data - In a real app, this would come from your backend/storage
//   const [goals, setGoals] = useState<Goal[]>([
//     { id: '1', text: 'Complete the app design', completed: false },
//     { id: '2', text: 'Work out for 30 minutes', completed: false },
//   ]);

//   const [goodness, setGoodness] = useState<string>('Help someone learn coding');

//   const [habits, setHabits] = useState<Habit[]>([
//     { id: '1', name: 'Morning Meditation', status: 'completed' },
//     { id: '2', name: 'Reading', status: 'failed' },
//     { id: '3', name: 'Exercise', status: 'untracked' },
//   ]);

//   const [reflection, setReflection] = useState<string>(
//     'Today was productive. I learned something new and helped others.'
//   );

//   const toggleGoal = (id: string) => {
//     setGoals(goals.map(goal => 
//       goal.id === id ? { ...goal, completed: !goal.completed } : goal
//     ));
//   };

//   const toggleHabitStatus = (id: string) => {
//     setHabits(habits.map(habit => {
//       if (habit.id === id) {
//         // Cycle through states: untracked -> completed -> failed -> untracked
//         const nextStatus = (() => {
//           switch (habit.status) {
//             case 'untracked': return 'completed';
//             case 'completed': return 'failed';
//             case 'failed': return 'untracked';
//           }
//         })();
//         return { ...habit, status: nextStatus };
//       }
//       return habit;
//     }));
//   };

//   const getStatusIcon = (status: Habit['status']) => {
//     switch (status) {
//       case 'completed':
//         return '✓';
//       case 'failed':
//         return '✗';
//       default:
//         return ' ';
//     }
//   };

//   return (
//     <ScrollView style={styles.container}>
//     <DateHeader />

//       {/* Goals Section */}
//       <View style={styles.section}>
//         <Text style={styles.sectionTitle}>Today's Goals</Text>
//         {goals.length > 0 ? (
//           goals.map(goal => (
//             <TouchableOpacity
//               key={goal.id}
//               style={styles.goalItem}
//               onPress={() => toggleGoal(goal.id)}
//             >
//               <TouchableOpacity 
//                 style={[
//                   styles.checkboxContainer,
//                   goal.completed && styles.checkboxContainerChecked
//                 ]}
//                 onPress={() => toggleGoal(goal.id)}
//               >
//                 {goal.completed && (
//                   <Text style={styles.checkmark}>✓</Text>
//                 )}
//               </TouchableOpacity>
//               <Text style={[
//                 styles.goalText,
//                 goal.completed && styles.completedGoal
//               ]}>
//                 {goal.text}
//               </Text>
//             </TouchableOpacity>
//           ))
//         ) : (
//           <Text style={styles.emptyText}>No Goals added</Text>
//         )}
//       </View>

//       {/* Goodness Section */}
//       <View style={styles.section}>
//         <Text style={styles.sectionTitle}>What good will I do today?</Text>
//         {goodness ? (
//           <Text style={styles.contentText}>{goodness}</Text>
//         ) : (
//           <Text style={styles.emptyText}>No goodness action added</Text>
//         )}
//       </View>



//       {/* Reflection Section */}
//       <View style={styles.section}>
//         <Text style={styles.sectionTitle}>Today's Reflections</Text>
//         {reflection ? (
//           <Text style={styles.contentText}>{reflection}</Text>
//         ) : (
//           <Text style={styles.emptyText}>No reflection added yet</Text>
//         )}
//       </View>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     padding: 20,
//   },
//   date: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 20,
//     color: '#2c3e50',
//   },
//   section: {
//     marginBottom: 24,
//     backgroundColor: '#f8f9fa',
//     padding: 16,
//     borderRadius: 12,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   sectionTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     marginBottom: 12,
//     color: '#34495e',
//   },
//   goalItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   checkboxContainer: {
//     width: 24,
//     height: 24,
//     borderRadius: 6,
//     borderWidth: 2,
//     borderColor: '#2c3e50',
//     marginRight: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   checkboxContainerChecked: {
//     backgroundColor: '#27ae60',
//     borderColor: '#27ae60',
//   },
//   checkmark: {
//     color: '#ffffff',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   goalText: {
//     fontSize: 16,
//     color: '#2c3e50',
//     flex: 1,
//   },
//   completedGoal: {
//     textDecorationLine: 'line-through',
//     color: '#95a5a6',
//   },
//   habitItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   statusIcon: {
//     fontSize: 20,
//     width: 24,
//     textAlign: 'center',
//     marginRight: 8,
//   },
//   habitStatus: {
//     width: 40,
//     height: 40,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderRadius: 20,
//     backgroundColor: '#f0f0f0',
//     marginRight: 12,
//   },
//   habitText: {
//     fontSize: 16,
//     color: '#2c3e50',
//   },
//   completedIcon: {
//     color: '#27ae60',
//   },
//   failedIcon: {
//     color: '#e74c3c',
//   },
//   contentText: {
//     fontSize: 16,
//     color: '#2c3e50',
//     lineHeight: 24,
//   },
//   emptyText: {
//     fontSize: 16,
//     color: '#95a5a6',
//     fontStyle: 'italic',
//   },
// });

// export default TodayScreen;