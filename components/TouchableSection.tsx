// components/TouchableSection.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TouchableSectionProps {
  title: string;
  count: number;
  onPress: () => void;
  icon?: string; // Ionicons name
}

const TouchableSection: React.FC<TouchableSectionProps> = ({
  title,
  count,
  onPress,
  icon,
}) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.leftContent}>
        {icon && (
          <Ionicons name={icon as any} size={22} color="#3498db" style={styles.icon} />
        )}
        <Text style={styles.title}>{title}</Text>
      </View>
      
      <View style={styles.rightContent}>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{count}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#95a5a6" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#34495e',
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countBadge: {
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  countText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3498db',
  },
});

export default TouchableSection;