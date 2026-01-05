/**
 * Gas Fee 선택 컴포넌트
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GasFee } from '../types';
import { formatGwei } from '../utils/format';

interface GasFeeSelectorProps {
  gasFees: GasFee;
  selectedSpeed: 'slow' | 'normal' | 'fast';
  onSelect: (speed: 'slow' | 'normal' | 'fast') => void;
}

export const GasFeeSelector: React.FC<GasFeeSelectorProps> = ({
  gasFees,
  selectedSpeed,
  onSelect,
}) => {
  const options: Array<{ key: 'slow' | 'normal' | 'fast'; label: string }> = [
    { key: 'slow', label: 'Slow' },
    { key: 'normal', label: 'Normal' },
    { key: 'fast', label: 'Fast' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Network Fee</Text>

      <View style={styles.options}>
        {options.map((option) => {
          const fee = gasFees[option.key];
          const isSelected = selectedSpeed === option.key;

          return (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.option,
                isSelected && styles.optionSelected,
              ]}
              onPress={() => onSelect(option.key)}
            >
              <Text
                style={[
                  styles.optionLabel,
                  isSelected && styles.optionLabelSelected,
                ]}
              >
                {option.label}
              </Text>
              <Text
                style={[
                  styles.optionGwei,
                  isSelected && styles.optionGweiSelected,
                ]}
              >
                {formatGwei(fee.gasPrice)}
              </Text>
              <Text
                style={[
                  styles.optionTime,
                  isSelected && styles.optionTimeSelected,
                ]}
              >
                {fee.estimatedTime}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  options: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  option: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  optionLabelSelected: {
    color: '#007AFF',
  },
  optionGwei: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  optionGweiSelected: {
    color: '#007AFF',
  },
  optionTime: {
    fontSize: 11,
    color: '#8E8E93',
  },
  optionTimeSelected: {
    color: '#007AFF',
  },
});

export default GasFeeSelector;
