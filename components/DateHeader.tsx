import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface WeekDay {
  date: number;
  day: string;
  isToday: boolean;
}

export const DateHeader: React.FC = () => {
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

  return (
    <View style={styles.weekContainer}>
      {generateWeekDays().map((day, index) => (
        <View 
          key={index}
          style={[
            styles.dayContainer,
            day.isToday && styles.todayContainer
          ]}
        >
          <Text style={[
            styles.dayText,
            day.isToday && styles.todayText
          ]}>
            {day.day}
          </Text>
          <Text style={[
            styles.dateText,
            day.isToday && styles.todayText
          ]}>
            {day.date}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default DateHeader;