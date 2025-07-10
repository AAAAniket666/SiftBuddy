import React, { useState, useEffect } from 'react';
import { Button, ActivityIndicator, FlatList, TextInput as RNTextInput, Platform, Modal, ScrollView, Dimensions, View, Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import auth from '@react-native-firebase/auth';
import { addShift, onUserShiftsChange, Shift, updateShift } from './firestoreHelpers';
import DateTimePicker from '@react-native-community/datetimepicker';
import { scheduleShiftReminder } from '../notificationHelper';
import { useNavigation } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';

const Background = styled.View`
  flex: 1;
  background-color: ${props => props.theme.background};
  justify-content: center;
  align-items: center;
`;

const Card = styled.View`
  margin: 24px;
  padding: 32px 24px 24px 24px;
  background: #F5F3EC;
  border-radius: 16px;
  elevation: 4;
  shadow-color: #000;
  shadow-opacity: 0.08;
  shadow-radius: 12px;
  shadow-offset: 0px 2px;
  align-items: center;
  width: 100%;
  max-width: 400px;
`;

const Title = styled.Text`
  color: #000;
  font-size: 24px;
  margin-bottom: 16px;
  text-align: center;
  font-weight: bold;
`;

const InfoText = styled.Text`
  color: #000;
  font-size: 18px;
  margin-bottom: 12px;
  text-align: center;
  font-weight: bold;
`;

const ErrorText = styled.Text`
  color: #d32f2f;
  margin-bottom: 8px;
  text-align: center;
  font-weight: bold;
`;

const ShiftItem = styled.View`
  padding: 14px;
  margin: 8px 0;
  background: #fff;
  border-radius: 8px;
  width: 100%;
  border: 1px solid #2D4F4A;
  shadow-color: #000;
  shadow-opacity: 0.06;
  shadow-radius: 6px;
  shadow-offset: 0px 2px;
  elevation: 1;
`;

const ShiftText = styled.Text`
  color: #000;
  font-weight: bold;
`;

const ShiftValue = styled.Text`
  color: #2D4F4A;
  font-weight: normal;
`;

const StyledButton = styled.TouchableOpacity`
  width: 100%;
  padding: 14px;
  margin-vertical: 8px;
  border-radius: 24px;
  background-color: #B3A8C9;
  align-items: center;
  shadow-color: #000;
  shadow-opacity: 0.08;
  shadow-radius: 8px;
  shadow-offset: 0px 2px;
  elevation: 2;
`;

const ButtonText = styled.Text`
  color: #000;
  font-size: 16px;
  font-weight: bold;
`;

const ModalCard = styled.View`
  background: #F5F3EC;
  border-radius: 16px;
  padding: 24px 16px 16px 16px;
  align-items: center;
  width: 90%;
  max-width: 400px;
  align-self: center;
  elevation: 8;
  shadow-color: #000;
  shadow-opacity: 0.12;
  shadow-radius: 16px;
  shadow-offset: 0px 4px;
`;

const DayPickerRow = styled.View`
  flex-direction: row;
  justify-content: center;
  margin-bottom: 8px;
`;

const DayButton = styled.TouchableOpacity<{selected: boolean}>`
  background-color: ${props => props.selected ? '#2D4F4A' : '#E0E0E0'};
  border-radius: 16px;
  padding: 8px 12px;
  margin: 0 4px;
`;

const DayButtonText = styled.Text<{selected: boolean}>`
  color: ${props => props.selected ? '#fff' : '#2D4F4A'};
  font-weight: bold;
`;

// Helper to expand recurring shifts into instances for the next 30 days
function expandRecurringShifts(shifts: Shift[]): Shift[] {
  const now = new Date();
  const endWindow = new Date(now);
  endWindow.setDate(now.getDate() + 30);
  const result: Shift[] = [];
  const oneTimeIds = new Set<string>();
  // Collect all one-time shift IDs
  for (const s of shifts) {
    if (!s.recurrence || s.recurrence.type === 'none') {
      oneTimeIds.add(s.shiftId);
      result.push(s);
    }
  }
  // Expand recurring shifts
  for (const s of shifts) {
    if (!s.recurrence || s.recurrence.type === 'none') continue;
    const baseStart = new Date(s.start);
    const baseEnd = new Date(s.end);
    if (s.recurrence.type === 'weekly' && s.recurrence.days) {
      for (let d = 0; d <= 30; d++) {
        const day = new Date(now);
        day.setDate(now.getDate() + d);
        if (s.recurrence.days.includes(day.getDay())) {
          const start = new Date(day);
          start.setHours(baseStart.getHours(), baseStart.getMinutes(), 0, 0);
          const end = new Date(day);
          end.setHours(baseEnd.getHours(), baseEnd.getMinutes(), 0, 0);
          const instanceId = `${s.userId}_${start.getTime()}_rec`; // unique per instance
          if (!oneTimeIds.has(instanceId)) {
            result.push({ ...s, shiftId: instanceId, start: start.toISOString(), end: end.toISOString(), _recurring: true });
          }
        }
      }
    } else if (s.recurrence.type === 'monthly' && s.recurrence.date) {
      for (let d = 0; d <= 30; d++) {
        const day = new Date(now);
        day.setDate(now.getDate() + d);
        if (day.getDate() === s.recurrence.date) {
          const start = new Date(day);
          start.setHours(baseStart.getHours(), baseStart.getMinutes(), 0, 0);
          const end = new Date(day);
          end.setHours(baseEnd.getHours(), baseEnd.getMinutes(), 0, 0);
          const instanceId = `${s.userId}_${start.getTime()}_rec`;
          if (!oneTimeIds.has(instanceId)) {
            result.push({ ...s, shiftId: instanceId, start: start.toISOString(), end: end.toISOString(), _recurring: true });
          }
        }
      }
    }
  }
  // Only show future shifts
  return result.filter(s => new Date(s.end) > now).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

// Helper to check for time overlap
function isOverlap(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && endA > startB;
}

export default function ProfileScreen() {
  const theme = useTheme();
  const user = auth().currentUser;
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [prefs, setPrefs] = useState({ reminder1h: true, reminder30m: true });
  const [showAddShift, setShowAddShift] = useState(false);
  const [newStart, setNewStart] = useState<Date | null>(null);
  const [newEnd, setNewEnd] = useState<Date | null>(null);
  const [newLocation, setNewLocation] = useState('');
  const [addShiftLoading, setAddShiftLoading] = useState(false);
  const [addShiftError, setAddShiftError] = useState('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [addShiftSuccess, setAddShiftSuccess] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<'none' | 'weekly' | 'monthly'>('none');
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([]);
  const [recurrenceDate, setRecurrenceDate] = useState<number | null>(null);

  // Firestore real-time listener
  useEffect(() => {
    if (!user) return;
    const unsubscribe = onUserShiftsChange(user.uid, setShifts);
    return unsubscribe;
  }, [user]);

  // Load notification preferences
  useEffect(() => {
    if (!user) return;
    const ref = firestore().collection('users').doc(user.uid);
    ref.get().then(doc => {
      const data = doc.data();
      if (data && data.notificationPreferences) {
        setPrefs({
          reminder1h: data.notificationPreferences.reminder1h ?? true,
          reminder30m: data.notificationPreferences.reminder30m ?? true,
        });
      }
    });
  }, [user]);

  // Schedule local reminders for upcoming shifts
  useEffect(() => {
    const now = new Date();
    shifts.forEach(shift => {
      const start = new Date(shift.start);
      if (start > now) {
        scheduleShiftReminder(
          shift.shiftId,
          shift.location,
          start,
          prefs.reminder1h,
          prefs.reminder30m
        );
      }
    });
  }, [shifts, prefs]);

  // Handle sign out
  const handleSignOut = async () => {
    setLoading(true);
    setError('');
    try {
      await auth().signOut();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Add a real shift
  const handleAddShift = async () => {
    if (!user || !newStart || !newEnd || !newLocation.trim()) {
      setAddShiftError('Please fill all fields.');
      return;
    }
    if (recurrenceType === 'weekly' && recurrenceDays.length === 0) {
      setAddShiftError('Select at least one day for weekly recurrence.');
      return;
    }
    if (recurrenceType === 'monthly' && (recurrenceDate == null || recurrenceDate < 1 || recurrenceDate > 31)) {
      setAddShiftError('Enter a valid date (1-31) for monthly recurrence.');
      return;
    }
    // Conflict detection
    const expandedNewShifts: { start: Date; end: Date }[] = [];
    if (recurrenceType === 'none') {
      expandedNewShifts.push({ start: newStart, end: newEnd });
    } else if (recurrenceType === 'weekly' && recurrenceDays.length > 0) {
      for (let d = 0; d <= 30; d++) {
        const day = new Date(newStart);
        day.setDate(newStart.getDate() + d);
        if (recurrenceDays.includes(day.getDay())) {
          const start = new Date(day);
          start.setHours(newStart.getHours(), newStart.getMinutes(), 0, 0);
          const end = new Date(day);
          end.setHours(newEnd.getHours(), newEnd.getMinutes(), 0, 0);
          expandedNewShifts.push({ start, end });
        }
      }
    } else if (recurrenceType === 'monthly' && recurrenceDate) {
      for (let d = 0; d <= 30; d++) {
        const day = new Date(newStart);
        day.setDate(newStart.getDate() + d);
        if (day.getDate() === recurrenceDate) {
          const start = new Date(day);
          start.setHours(newStart.getHours(), newStart.getMinutes(), 0, 0);
          const end = new Date(day);
          end.setHours(newEnd.getHours(), newEnd.getMinutes(), 0, 0);
          expandedNewShifts.push({ start, end });
        }
      }
    }
    // Check for overlap with any existing or upcoming shift
    const allExisting = expandRecurringShifts(shifts);
    for (const newShift of expandedNewShifts) {
      for (const existing of allExisting) {
        const existStart = new Date(existing.start);
        const existEnd = new Date(existing.end);
        if (isOverlap(newShift.start, newShift.end, existStart, existEnd)) {
          setAddShiftError('Shift conflict detected: overlaps with an existing or recurring shift.');
          return;
        }
      }
    }
    setAddShiftLoading(true);
    setAddShiftError('');
    setAddShiftSuccess(false);
    let didTimeout = false;
    const timeout = setTimeout(() => {
      didTimeout = true;
      setAddShiftLoading(false);
      setAddShiftError('Request timed out. Please check your connection and try again.');
    }, 10000); // 10s timeout
    try {
      const shift = {
        shiftId: `${user.uid}_${newStart.getTime()}`,
        userId: user.uid,
        start: newStart.toISOString(),
        end: newEnd.toISOString(),
        location: newLocation.trim(),
        recurrence: recurrenceType === 'none' ? { type: 'none' } :
          recurrenceType === 'weekly' ? { type: 'weekly', days: recurrenceDays } :
          { type: 'monthly', date: recurrenceDate },
      };
      await addShift(shift);
      if (!didTimeout) {
        clearTimeout(timeout);
        setShowAddShift(false);
        setNewStart(null);
        setNewEnd(null);
        setNewLocation('');
        setRecurrenceType('none');
        setRecurrenceDays([]);
        setRecurrenceDate(null);
        setAddShiftSuccess(true);
        setTimeout(() => setAddShiftSuccess(false), 2500); // Hide success after 2.5s
      }
    } catch (e) {
      console.error('Add Shift error:', e);
      if (!didTimeout) {
        clearTimeout(timeout);
        setAddShiftError(
          e?.message?.includes('PERMISSION_DENIED')
            ? 'You do not have permission to add shifts. Please contact support.'
            : 'Failed to add shift. Please try again.'
        );
      }
    } finally {
      if (!didTimeout) setAddShiftLoading(false);
    }
  };

  // Replace upcomingShifts with expanded shifts
  const upcomingShifts = expandRecurringShifts(shifts);

  // Add navigation button to Notification Preferences
  const handleOpenPreferences = () => {
    navigation.navigate('NotificationPreferences');
  };

  const handleOpenHistory = () => {
    navigation.navigate('NotificationHistory');
  };

  const isAdmin = user?.email?.endsWith('@admin.com');

  return (
    <Background>
      <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 32 }} style={{ width: '100%' }}>
        <Card>
          <Title>Profile</Title>
          {user ? <InfoText>Email: {user.email}</InfoText> : <InfoText>No user info</InfoText>}
          {error ? <ErrorText>{error}</ErrorText> : null}
          <StyledButton onPress={handleSignOut}><ButtonText>Sign Out</ButtonText></StyledButton>
          {!showAddShift && (
            <StyledButton onPress={() => setShowAddShift(true)}><ButtonText>Add Shift</ButtonText></StyledButton>
          )}
          <StyledButton onPress={handleOpenPreferences}>
            <ButtonText>Notification Preferences</ButtonText>
          </StyledButton>
          <StyledButton onPress={handleOpenHistory}>
            <ButtonText>Notification History</ButtonText>
          </StyledButton>
          <StyledButton onPress={() => navigation.navigate('AnalyticsScreen')}>
            <ButtonText>View Analytics</ButtonText>
          </StyledButton>
        </Card>
        <Title style={{ fontSize: 18, marginTop: 8, marginBottom: 8 }}>My Shifts (Realtime)</Title>
        {upcomingShifts.length === 0 ? (
          <InfoText>No shifts found.</InfoText>
        ) : (
          upcomingShifts.map(item => (
            <ShiftItem key={item.shiftId}>
              <ShiftText>Shift ID: <ShiftValue>{item.shiftId}</ShiftValue></ShiftText>
              <ShiftText>User: <ShiftValue>{item.userId}</ShiftValue></ShiftText>
              <ShiftText>Start: <ShiftValue>{new Date(item.start).toLocaleString()}</ShiftValue></ShiftText>
              <ShiftText>End: <ShiftValue>{new Date(item.end).toLocaleString()}</ShiftValue></ShiftText>
              <ShiftText>Location: <ShiftValue>{item.location}</ShiftValue></ShiftText>
              {item._recurring && <ShiftText style={{ color: '#2D4F4A' }}>(Recurring)</ShiftText>}
              {item.status === 'open' && isAdmin && (
                <>
                  <ShiftText style={{ color: '#92A378', fontWeight: 'bold' }}>🟢 Open Shift</ShiftText>
                  {item.bids && item.bids.length > 0 ? (
                    <>
                      <ShiftText style={{ color: '#2D4F4A', fontWeight: 'bold' }}>Bids:</ShiftText>
                      {item.bids.map((bid, idx) => (
                        <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                          <ShiftText style={{ color: '#8DB1A4', fontWeight: 'normal', flex: 1 }}>
                            {bid.userId}{bid.message ? `: ${bid.message}` : ''} ({new Date(bid.timestamp).toLocaleString()})
                          </ShiftText>
                          <StyledButton
                            style={{ backgroundColor: '#92A378', marginVertical: 0, marginLeft: 8, padding: 8, borderRadius: 12, width: 80 }}
                            onPress={async () => {
                              try {
                                await updateShift(item.shiftId, {
                                  userId: bid.userId,
                                  status: 'assigned',
                                  bids: [],
                                });
                                Alert.alert('Shift Assigned', `Shift assigned to ${bid.userId}`);
                              } catch (err) {
                                Alert.alert('Error', 'Failed to assign shift.');
                              }
                            }}
                          >
                            <ButtonText>Assign</ButtonText>
                          </StyledButton>
                        </View>
                      ))}
                    </>
                  ) : (
                    <ShiftText style={{ color: '#aaa', fontWeight: 'normal' }}>No bids yet.</ShiftText>
                  )}
                </>
              )}
            </ShiftItem>
          ))
        )}
        {addShiftSuccess && (
          <InfoText style={{ color: '#2D4F4A', marginBottom: 8, fontSize: 16, fontWeight: 'bold' }}>Shift added successfully!</InfoText>
        )}
      </ScrollView>
      <Modal
        visible={showAddShift}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddShift(false)}
      >
        <Background style={{ backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
            keyboardShouldPersistTaps="handled"
          >
            <ModalCard>
              <Title style={{ fontSize: 20, marginBottom: 12 }}>Add Shift</Title>
              <InfoText style={{ marginBottom: 4, fontSize: 16 }}>Start Time:</InfoText>
              <>
                {Platform.OS === 'android' ? (
                  <>
                    <StyledButton style={{ marginBottom: 8 }} onPress={() => setShowStartDatePicker(true)}>
                      <ButtonText>{newStart ? newStart.toLocaleDateString() : 'Select Start Date'}</ButtonText>
                    </StyledButton>
                    {showStartDatePicker && (
                      <DateTimePicker
                        value={newStart || new Date()}
                        mode="date"
                        display="default"
                        onChange={(event, date) => {
                          setShowStartDatePicker(false);
                          if (event.type === 'set' && date) {
                            const newDate = new Date(date);
                            if (newStart) {
                              newDate.setHours(newStart.getHours());
                              newDate.setMinutes(newStart.getMinutes());
                            }
                            setNewStart(newDate);
                          }
                        }}
                      />
                    )}
                    <StyledButton style={{ marginBottom: 8 }} onPress={() => setShowStartTimePicker(true)}>
                      <ButtonText>{newStart ? newStart.toLocaleTimeString() : 'Select Start Time'}</ButtonText>
                    </StyledButton>
                    {showStartTimePicker && (
                      <DateTimePicker
                        value={newStart || new Date()}
                        mode="time"
                        display="default"
                        onChange={(event, time) => {
                          setShowStartTimePicker(false);
                          if (event.type === 'set' && time) {
                            const newDate = newStart ? new Date(newStart) : new Date();
                            newDate.setHours(time.getHours());
                            newDate.setMinutes(time.getMinutes());
                            setNewStart(newDate);
                          }
                        }}
                      />
                    )}
                  </>
                ) : (
                  <StyledButton style={{ marginBottom: 8 }} onPress={() => setShowStartPicker(true)}>
                    <ButtonText>{newStart ? newStart.toLocaleString() : 'Select Start Time'}</ButtonText>
                  </StyledButton>
                )}
                {Platform.OS === 'ios' && showStartPicker && (
                  <DateTimePicker
                    value={newStart || new Date()}
                    mode="datetime"
                    display="default"
                    onChange={(event, date) => {
                      setShowStartPicker(false);
                      if (event.type === 'set' && date) setNewStart(date);
                    }}
                  />
                )}
              </>
              <InfoText style={{ marginBottom: 4, fontSize: 16, marginTop: 12 }}>End Time:</InfoText>
              <>
                {Platform.OS === 'android' ? (
                  <>
                    <StyledButton style={{ marginBottom: 8 }} onPress={() => setShowEndDatePicker(true)}>
                      <ButtonText>{newEnd ? newEnd.toLocaleDateString() : 'Select End Date'}</ButtonText>
                    </StyledButton>
                    {showEndDatePicker && (
                      <DateTimePicker
                        value={newEnd || new Date()}
                        mode="date"
                        display="default"
                        onChange={(event, date) => {
                          setShowEndDatePicker(false);
                          if (event.type === 'set' && date) {
                            const newDate = new Date(date);
                            if (newEnd) {
                              newDate.setHours(newEnd.getHours());
                              newDate.setMinutes(newEnd.getMinutes());
                            }
                            setNewEnd(newDate);
                          }
                        }}
                      />
                    )}
                    <StyledButton style={{ marginBottom: 8 }} onPress={() => setShowEndTimePicker(true)}>
                      <ButtonText>{newEnd ? newEnd.toLocaleTimeString() : 'Select End Time'}</ButtonText>
                    </StyledButton>
                    {showEndTimePicker && (
                      <DateTimePicker
                        value={newEnd || new Date()}
                        mode="time"
                        display="default"
                        onChange={(event, time) => {
                          setShowEndTimePicker(false);
                          if (event.type === 'set' && time) {
                            const newDate = newEnd ? new Date(newEnd) : new Date();
                            newDate.setHours(time.getHours());
                            newDate.setMinutes(time.getMinutes());
                            setNewEnd(newDate);
                          }
                        }}
                      />
                    )}
                  </>
                ) : (
                  <StyledButton style={{ marginBottom: 8 }} onPress={() => setShowEndPicker(true)}>
                    <ButtonText>{newEnd ? newEnd.toLocaleString() : 'Select End Time'}</ButtonText>
                  </StyledButton>
                )}
                {Platform.OS === 'ios' && showEndPicker && (
                  <DateTimePicker
                    value={newEnd || new Date()}
                    mode="datetime"
                    display="default"
                    onChange={(event, date) => {
                      setShowEndPicker(false);
                      if (event.type === 'set' && date) setNewEnd(date);
                    }}
                  />
                )}
              </>
              <InfoText style={{ marginBottom: 4, fontSize: 16, marginTop: 12 }}>Location:</InfoText>
              <RNTextInput
                value={newLocation}
                onChangeText={setNewLocation}
                placeholder="Enter location"
                style={{ width: '100%', fontSize: 16, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#B3A8C9', marginBottom: 16, backgroundColor: '#fff' }}
                placeholderTextColor="#aaa"
              />
              <InfoText style={{ marginBottom: 4, fontSize: 16, marginTop: 12 }}>Recurrence:</InfoText>
              <StyledButton
                style={{ marginBottom: 8, backgroundColor: recurrenceType === 'none' ? '#8DB1A4' : '#B3A8C9' }}
                onPress={() => setRecurrenceType('none')}
              >
                <ButtonText>None (One-time Shift)</ButtonText>
              </StyledButton>
              <StyledButton
                style={{ marginBottom: 8, backgroundColor: recurrenceType === 'weekly' ? '#8DB1A4' : '#B3A8C9' }}
                onPress={() => setRecurrenceType('weekly')}
              >
                <ButtonText>Weekly</ButtonText>
              </StyledButton>
              <StyledButton
                style={{ marginBottom: 8, backgroundColor: recurrenceType === 'monthly' ? '#8DB1A4' : '#B3A8C9' }}
                onPress={() => setRecurrenceType('monthly')}
              >
                <ButtonText>Monthly</ButtonText>
              </StyledButton>
              {recurrenceType === 'weekly' && (
                <>
                  <InfoText style={{ fontSize: 15, marginBottom: 4 }}>Select days:</InfoText>
                  <DayPickerRow>
                    {[0,1,2,3,4,5,6].map(d => (
                      <DayButton
                        key={d}
                        selected={recurrenceDays.includes(d)}
                        onPress={() => setRecurrenceDays(
                          recurrenceDays.includes(d)
                            ? recurrenceDays.filter(x => x !== d)
                            : [...recurrenceDays, d]
                        )}
                      >
                        <DayButtonText selected={recurrenceDays.includes(d)}>{['S','M','T','W','T','F','S'][d]}</DayButtonText>
                      </DayButton>
                    ))}
                  </DayPickerRow>
                </>
              )}
              {recurrenceType === 'monthly' && (
                <>
                  <InfoText style={{ fontSize: 15, marginBottom: 4 }}>Date of month (1-31):</InfoText>
                  <RNTextInput
                    style={{ borderWidth: 1, borderColor: '#2D4F4A', borderRadius: 8, padding: 8, width: 80, textAlign: 'center', marginBottom: 8 }}
                    keyboardType="number-pad"
                    value={recurrenceDate ? String(recurrenceDate) : ''}
                    onChangeText={txt => setRecurrenceDate(Number(txt.replace(/[^0-9]/g, '')))}
                    placeholder="e.g. 15"
                    maxLength={2}
                  />
                </>
              )}
              {addShiftError ? <ErrorText>{addShiftError}</ErrorText> : null}
              <StyledButton style={{ marginBottom: 8 }} onPress={handleAddShift} disabled={addShiftLoading}>
                <ButtonText>{addShiftLoading ? 'Adding...' : 'Add Shift'}</ButtonText>
              </StyledButton>
              <StyledButton style={{ backgroundColor: '#eee', marginBottom: 0 }} onPress={() => setShowAddShift(false)}>
                <ButtonText>Cancel</ButtonText>
              </StyledButton>
            </ModalCard>
          </ScrollView>
        </Background>
      </Modal>
    </Background>
  );
} 