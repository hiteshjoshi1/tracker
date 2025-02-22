import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Platform
} from 'react-native';
import { format, addDays, subDays, isToday, isSameDay, startOfWeek } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

interface DateHeaderProps {
  onDateChange?: (date: Date) => void;
  customStyle?: any;
  progressPercentage?: number; // Optional progress percentage for the progress bar
}

const DateHeader: React.FC<DateHeaderProps> = ({ 
  onDateChange, 
  customStyle,
  progressPercentage 
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  
  // Update week dates when selected date changes
  useEffect(() => {
    const start = startOfWeek(selectedDate);
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(start, i));
    }
    setWeekDates(days);
    
    if (onDateChange) {
      onDateChange(selectedDate);
    }
  }, [selectedDate, onDateChange]);

  const handlePreviousDay = () => {
    setSelectedDate(subDays(selectedDate, 1));
  };

  const handleNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1));
  };

  const handlePreviousWeek = () => {
    setSelectedDate(subDays(selectedDate, 7));
  };

  const handleSelectDay = (date: Date) => {
    setSelectedDate(date);
  };

  // Format date for display
  const getFormattedDate = () => {
    return format(selectedDate, 'MMMM d, yyyy');
  };

  // Format day of week
  const getDayOfWeek = () => {
    return format(selectedDate, 'EEEE');
  };

  // Get day number
  const getDayNumber = (date: Date) => {
    return format(date, 'd');
  };

  // Get day name (3 letters)
  const getDayName = (date: Date) => {
    return format(date, 'EEE');
  };

  // Check if a date is selected
  const isSelected = (date: Date) => {
    return isSameDay(date, selectedDate);
  };

  // Check if a date is today
  const isCurrentDay = (date: Date) => {
    return isToday(date);
  };

  return (
    <LinearGradient
      colors={['#4a90e2', '#357abd']}
      style={[styles.gradientContainer, customStyle]}
    >
      <View style={styles.container}>
        {/* Date header with navigation */}
        <View style={styles.dateNavigator}>
          <TouchableOpacity 
            onPress={handlePreviousDay}
            style={styles.navButton}
          >
            <Text style={styles.navButtonText}>{'<'}</Text>
          </TouchableOpacity>
          
          <View style={styles.dateTextContainer}>
            <Text style={styles.dateText}>{getFormattedDate()}</Text>
            <Text style={styles.dayText}>{getDayOfWeek()}</Text>
          </View>
          
          <TouchableOpacity 
            onPress={handleNextDay}
            style={styles.navButton}
          >
            <Text style={styles.navButtonText}>{'>'}</Text>
          </TouchableOpacity>
        </View>
        
        {/* Week day selector */}
        <View style={styles.weekContainer}>
          <TouchableOpacity 
            onPress={handlePreviousWeek}
            style={styles.weekNavButton}
          >
            <Text style={styles.weekNavButtonText}>{'<'}</Text>
          </TouchableOpacity>
          
          <View style={styles.daysContainer}>
            {weekDates.map((date, index) => (
              <View key={index} style={styles.dayColumn}>
                <Text style={styles.dayNameText}>{getDayName(date)}</Text>
                <TouchableOpacity
                  onPress={() => handleSelectDay(date)}
                  style={[
                    styles.dayNumberContainer,
                    isSelected(date) && styles.selectedDayContainer,
                    isCurrentDay(date) && !isSelected(date) && styles.todayContainer
                  ]}
                >
                  <Text 
                    style={[
                      styles.dayNumberText,
                      isSelected(date) && styles.selectedDayText,
                      isCurrentDay(date) && !isSelected(date) && styles.todayText
                    ]}
                  >
                    {getDayNumber(date)}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
          
          <TouchableOpacity 
            onPress={() => setSelectedDate(addDays(selectedDate, 7))}
            style={styles.weekNavButton}
          >
            <Text style={styles.weekNavButtonText}>{'>'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress bar (conditionally rendered) */}
      {progressPercentage !== undefined && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressPercentage}%` }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(progressPercentage)}% of daily goals completed
          </Text>
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    paddingTop: 40,
    paddingBottom: 20,
    borderBottomLeftRadius: 25, // Slightly increased radius
    borderBottomRightRadius: 25, // Slightly increased radius
    marginBottom: 0,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 4, // Added small vertical margin for better spacing
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
  dateNavigator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    // Add slight shadow for better definition
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  navButtonText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#2c3e50',
  },
  dateTextContainer: {
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 0,
  },
  dateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  dayText: {
    fontSize: 16,
    color: '#2c3e50',
    textAlign: 'center',
    marginTop: 4,
  },
  weekContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekNavButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f4f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekNavButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  daysContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  dayColumn: {
    alignItems: 'center',
  },
  dayNameText: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 6,
  },
  dayNumberContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  selectedDayContainer: {
    backgroundColor: '#4a90e2',
    // Add slight shadow for better prominence
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  todayContainer: {
    borderWidth: 1,
    borderColor: '#4a90e2',
  },
  dayNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  selectedDayText: {
    color: '#fff',
  },
  todayText: {
    color: '#4a90e2',
  },
  // Progress bar styles
  progressContainer: {
    paddingHorizontal: 20,
    marginTop: 12, // Slightly increased from 10
    marginBottom: 4, // Added small bottom margin
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
    marginHorizontal: 2, // Added slight horizontal margin
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  progressText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 5,
    fontSize: 14,
  },
});

export default DateHeader;