import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';

import DateHeader from '../components/DateHeader';

interface WeekDay {
  date: number;
  day: string;
  isToday: boolean;
}

const GoalsScreen: React.FC = () => {
  // State for form inputs
  const [newGoal, setNewGoal] = useState('');
  const [goalsList, setGoalsList] = useState<string[]>([]);
  const [goodDeed, setGoodDeed] = useState('');
  const [reflection, setReflection] = useState('');

  // Generate week days
  const generateWeekDays = (): WeekDay[] => {
    const today = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekDays: WeekDay[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - today.getDay() + i);
      
      weekDays.push({
        date: date.getDate(),
        day: days[i],
        isToday: date.toDateString() === today.toDateString()
      });
    }
    
    return weekDays;
  };

  // Handler for adding new goals
  const handleAddGoal = () => {
    if (newGoal.trim()) {
      setGoalsList([...goalsList, newGoal.trim()]);
      setNewGoal('');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Date header Section */}
      <DateHeader />

      {/* Goals Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Goals</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newGoal}
            onChangeText={setNewGoal}
            placeholder="Add a new goal"
            placeholderTextColor="#95a5a6"
          />
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddGoal}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        {goalsList.map((goal, index) => (
          <View key={index} style={styles.goalItem}>
            <Text style={styles.goalText}>• {goal}</Text>
          </View>
        ))}
      </View>

      {/* Good Deed Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What good will I do today?</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={goodDeed}
          onChangeText={setGoodDeed}
          placeholder="Enter your good deed for today"
          placeholderTextColor="#95a5a6"
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Reflection Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Reflection</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={reflection}
          onChangeText={setReflection}
          placeholder="Write your reflection for today"
          placeholderTextColor="#95a5a6"
          multiline
          numberOfLines={4}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
  },
  dayContainer: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    minWidth: 40,
  },
  todayContainer: {
    backgroundColor: '#2c3e50',
  },
  dayText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  dateText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: 'bold',
    marginTop: 4,
  },
  todayText: {
    color: '#fff',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#34495e',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2c3e50',
    borderWidth: 1,
    borderColor: '#dfe6e9',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  addButton: {
    marginLeft: 12,
    backgroundColor: '#2c3e50',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  goalItem: {
    marginBottom: 8,
  },
  goalText: {
    fontSize: 16,
    color: '#2c3e50',
  },
});

export default GoalsScreen;