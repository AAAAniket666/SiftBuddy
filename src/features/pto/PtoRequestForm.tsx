import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { requestPto } from './ptoService';

const PtoRequestForm = ({ userId }: { userId: string }) => {
  const [dates, setDates] = useState<Date[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);


  const addDate = (event: any, date?: Date) => {
    setShowPicker(false);
    if (date) {
      // Prevent duplicate dates
      if (dates.some(d => d.toDateString() === date.toDateString())) {
        Alert.alert('Date already added');
        return;
      }
      setDates(prev => [...prev, date]);
    }
  };

  const removeDate = (index: number) => {
    Alert.alert(
      'Remove Date',
      'Are you sure you want to remove this date?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => setDates(prev => prev.filter((_, i) => i !== index)),
        },
      ]
    );
  };

  const submit = async () => {
    if (!dates.length) {
      Alert.alert('Select at least one date');
      return;
    }
    setLoading(true);
    try {
      await requestPto(userId, dates);
      setDates([]);
      Alert.alert('PTO request submitted!');
    } catch (e) {
      Alert.alert('Error submitting PTO request');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Request PTO / Time Off</Text>
      <Button title="Add Date" onPress={() => setShowPicker(true)} />
      {showPicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={addDate}
        />
      )}
      <ScrollView horizontal style={styles.datesList} contentContainerStyle={{ alignItems: 'center' }}>
        {dates.map((d, i) => (
          <View key={i} style={styles.dateChip}>
            <Text style={styles.dateText}>{d.toDateString()}</Text>
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => removeDate(i)}
              accessibilityLabel={`Remove ${d.toDateString()}`}
            >
              <Text style={styles.removeBtnText}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      <TouchableOpacity
        style={[styles.submitBtn, loading && { opacity: 0.6 }]}
        onPress={submit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>Submit PTO Request</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 18,
    color: '#0EA5E9',
    alignSelf: 'center',
  },
  datesList: {
    marginVertical: 18,
    minHeight: 48,
    flexDirection: 'row',
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 10,
    marginBottom: 4,
    elevation: 1,
  },
  dateText: {
    fontSize: 15,
    color: '#0369A1',
    marginRight: 6,
  },
  removeBtn: {
    backgroundColor: '#F87171',
    borderRadius: 12,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  removeBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    lineHeight: 18,
  },
  submitBtn: {
    backgroundColor: '#0EA5E9',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});

export default PtoRequestForm;
