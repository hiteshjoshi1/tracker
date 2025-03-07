import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  Platform,
  Pressable,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Habit } from '../models/types'
import { format } from 'date-fns';

interface AddHabitModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (habitData: Partial<Habit>) => void;
}

const AddHabitModal: React.FC<AddHabitModalProps> = ({ visible, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDays, setSelectedDays] = useState({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: true,
    sunday: true,
  });

  const resetForm = () => {
    setName('');
    setDescription('');
    setReminderTime(new Date());
    setSelectedDays({
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true,
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleAdd = () => {
    if (name.trim()) {
      const formattedTime = format(reminderTime, 'hh:mm a');
      onAdd({
        name: name.trim(),
        description: description.trim() || undefined,
        reminderTime: formattedTime,
        reminderDays: selectedDays,
      });
      resetForm();
      onClose();
    }
  };

  const toggleDay = (day: keyof typeof selectedDays) => {
    setSelectedDays({
      ...selectedDays,
      [day]: !selectedDays[day],
    });
  };

  const DayButton = ({ day, label }: { day: keyof typeof selectedDays; label: string }) => (
    <TouchableOpacity
      style={[
        styles.dayButton,
        selectedDays[day] ? styles.selectedDay : styles.unselectedDay,
      ]}
      onPress={() => toggleDay(day)}
    >
      <Text
        style={[
          styles.dayButtonText,
          selectedDays[day] ? styles.selectedDayText : styles.unselectedDayText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setReminderTime(selectedTime);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Add New Habit</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Habit Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Morning Meditation"
              placeholderTextColor="#95a5a6"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Brief description of your habit"
              placeholderTextColor="#95a5a6"
              multiline
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Reminder Time</Text>
            {Platform.OS === 'ios' ? (
              <DateTimePicker
                value={reminderTime}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
                style={styles.timePicker}
              />
            ) : (
              <>
                <Pressable
                  onPress={() => setShowTimePicker(true)}
                  style={styles.timePickerButton}
                >
                  <Text style={styles.timeText}>
                    {format(reminderTime, 'hh:mm a')}
                  </Text>
                </Pressable>
                {showTimePicker && (
                  <DateTimePicker
                    value={reminderTime}
                    mode="time"
                    display="default"
                    onChange={handleTimeChange}
                  />
                )}
              </>
            )}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Repeat on days</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysContainer}>
              <DayButton day="monday" label="M" />
              <DayButton day="tuesday" label="T" />
              <DayButton day="wednesday" label="W" />
              <DayButton day="thursday" label="T" />
              <DayButton day="friday" label="F" />
              <DayButton day="saturday" label="S" />
              <DayButton day="sunday" label="S" />
            </ScrollView>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.addButton, !name.trim() && styles.disabledButton]} 
              onPress={handleAdd}
              disabled={!name.trim()}
            >
              <Text style={styles.addButtonText}>Add Habit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2c3e50',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  timePicker: {
    height: 120,
    marginTop: -10,
  },
  timePickerButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 8,
    padding: 12,
  },
  timeText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  daysContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDay: {
    backgroundColor: '#3498db',
  },
  unselectedDay: {
    backgroundColor: '#f0f0f0',
  },
  dayButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectedDayText: {
    color: 'white',
  },
  unselectedDayText: {
    color: '#7f8c8d',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dfe6e9',
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#2c3e50',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#95a5a6',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddHabitModal;