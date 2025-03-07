import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Platform 
} from 'react-native';

interface HabitDayIndicatorProps {
  day: string;
  isCompleted: boolean;
  isToday: boolean;
  isSelected?: boolean;
  onPress: () => void;
}

const HabitDayIndicator: React.FC<HabitDayIndicatorProps> = ({
  day,
  isCompleted,
  isToday,
  isSelected = false,
  onPress
}) => {
  return (
    <TouchableOpacity 
      style={[
        styles.container,
        // Order matters here - later styles override earlier ones
        isToday && styles.todayContainer,
        isCompleted && styles.completedContainer,
        isSelected && styles.selectedContainer
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text 
        style={[
          styles.dayText,
          // Order matters here - later styles override earlier ones
          isToday && styles.todayText,
          isCompleted && styles.completedText,
          isSelected && styles.selectedText
        ]}
      >
        {day}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  completedContainer: {
    backgroundColor: '#27ae60',
    // No border when completed
    borderWidth: 0,
  },
  completedText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  todayContainer: {
    borderWidth: 2,
    borderColor: '#3498db',
  },
  todayText: {
    color: '#3498db',
    fontWeight: 'bold',
  },
  selectedContainer: {
    backgroundColor: '#4a90e2',
    borderWidth: 0,
  },
  selectedText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});

export default HabitDayIndicator;