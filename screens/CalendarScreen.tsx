import React, { useEffect, useState, useMemo, useRef } from 'react';
import { View, FlatList, Alert, Modal, TouchableOpacity, Text, TextInput, ActivityIndicator, Platform } from 'react-native';
import { Calendar } from 'react-native-calendars';
import styled from 'styled-components/native';
import auth from '@react-native-firebase/auth';
import { onShiftsChange, Shift, getAllUsers, User, addSwap, updateShift } from './firestoreHelpers';
import firestore from '@react-native-firebase/firestore';
import { onSwapsChange, Swap } from './firestoreHelpers';

const Background = styled.View`
  flex: 1;
  background-color: #F5F3EC;
  justify-content: center;
  align-items: center;
`;

const ShiftCard = styled.View`
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin: 8px 0;
  width: 340px;
  shadow-color: #000;
  shadow-opacity: 0.08;
  shadow-radius: 8px;
  shadow-offset: 0px 2px;
  elevation: 2;
`;

const ShiftText = styled.Text`
  color: #44291A;
  font-weight: bold;
  font-size: 15px;
`;

// Helper to expand recurring shifts into instances for the next 30 days
function expandRecurringShifts(shifts: Shift[]): Shift[] {
  const now = new Date();
  const endWindow = new Date(now);
  endWindow.setDate(now.getDate() + 30);
  const result: Shift[] = [];
  const oneTimeIds = new Set<string>();
  for (const s of shifts) {
    if (!s.recurrence || s.recurrence.type === 'none') {
      oneTimeIds.add(s.shiftId);
      result.push(s);
    }
  }
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
          const instanceId = `${s.userId}_${start.getTime()}_rec`;
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
  return result.filter(s => new Date(s.end) > now).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

// Helper to check for time overlap
function isOverlap(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && endA > startB;
}

export default function CalendarScreen() {
  const user = auth().currentUser;
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [markedDates, setMarkedDates] = useState<any>({});
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [swapModalVisible, setSwapModalVisible] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [colleagues, setColleagues] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [swapStep, setSwapStep] = useState<'colleague' | 'shift' | 'message'>('colleague');
  const [selectedColleague, setSelectedColleague] = useState<User | null>(null);
  const [colleagueShifts, setColleagueShifts] = useState<Shift[]>([]);
  const [selectedColleagueShift, setSelectedColleagueShift] = useState<Shift | null>(null);
  const [swapMessage, setSwapMessage] = useState('');
  const [colleaguesLoading, setColleaguesLoading] = useState(false);
  const [colleaguesError, setColleaguesError] = useState<string | null>(null);
  const [shiftsLoading, setShiftsLoading] = useState(false);
  const [shiftsError, setShiftsError] = useState<string | null>(null);
  // Add state for recurring swap proposal
  const [proposeAllRecurring, setProposeAllRecurring] = useState(false);
  // Add state for all swaps
  const [allSwaps, setAllSwaps] = useState<Swap[]>([]);
  // Add state for bidding modal
  const [bidModalVisible, setBidModalVisible] = useState(false);
  const [bidMessage, setBidMessage] = useState('');
  const [bidShift, setBidShift] = useState<Shift | null>(null);
  const [bidLoading, setBidLoading] = useState(false);

  useEffect(() => {
    // Listen to all shifts and filter for current user
    const unsubscribe = onShiftsChange(allShifts => {
      const userShifts = allShifts.filter(s => s.userId === user?.uid);
      setShifts(userShifts);
    });
    return unsubscribe;
  }, [user, selectedDate]);

  // Listen for all swaps (for calendar marking)
  useEffect(() => {
    const unsubscribe = onSwapsChange(setAllSwaps);
    return unsubscribe;
  }, []);

  // Fetch colleagues when modal opens
  useEffect(() => {
    if (swapModalVisible) {
      setColleaguesLoading(true);
      setColleaguesError(null);
      getAllUsers()
        .then(users => {
          setColleagues(users.filter(u => u.uid !== user?.uid)); // Exclude self
          setColleaguesLoading(false);
        })
        .catch(() => {
          setColleaguesError('Failed to load colleagues.');
          setColleaguesLoading(false);
        });
    }
  }, [swapModalVisible, user]);

  // Fetch selected colleague's shifts when in shift selection step
  useEffect(() => {
    if (swapModalVisible && swapStep === 'shift' && selectedColleague) {
      setShiftsLoading(true);
      setShiftsError(null);
      onShiftsChange(allShifts => {
        setColleagueShifts(allShifts.filter(s => s.userId === selectedColleague.uid));
        setShiftsLoading(false);
      });
    } else {
      setColleagueShifts([]);
    }
  }, [swapModalVisible, swapStep, selectedColleague]);

  // Memoize allExpandedShifts
  const allExpandedShifts = useMemo(() => expandRecurringShifts(shifts), [shifts]);
  // Memoize marks object
  const recurringSwapDates = useMemo(() => {
    const map: Record<string, boolean> = {};
    allSwaps.forEach(swap => {
      if (swap.recurringParentId && swap.recurringInstanceDate) {
        const date = swap.recurringInstanceDate.split('T')[0];
        map[date] = true;
      }
    });
    return map;
  }, [allSwaps]);
  // Memoize marks object
  const marks = useMemo(() => {
    const m: any = {};
    allExpandedShifts.forEach(shift => {
      const date = shift.start.split('T')[0];
      if (!m[date]) m[date] = { marked: true, dotColor: '#A15C48', dots: [] };
      else m[date].marked = true;
    });
    // Add recurring swap dot
    Object.keys(recurringSwapDates).forEach(date => {
      if (!m[date]) m[date] = { dots: [] };
      m[date].dots = [ ...(m[date].dots || []), { key: 'recurringSwap', color: '#8DB1A4' } ];
    });
    if (m[selectedDate]) {
      m[selectedDate].selected = true;
      m[selectedDate].selectedColor = '#B3A8C9';
    } else {
      m[selectedDate] = { selected: true, selectedColor: '#B3A8C9', dots: m[selectedDate]?.dots || [] };
    }
    return m;
  }, [allExpandedShifts, selectedDate, recurringSwapDates]);
  // Only update markedDates if marks changes
  const prevMarks = useRef<any>(null);
  useEffect(() => {
    if (JSON.stringify(prevMarks.current) !== JSON.stringify(marks)) {
      console.log('Updating markedDates');
      setMarkedDates(marks);
      prevMarks.current = marks;
    }
  }, [marks]);

  // Shifts for the selected date (future only, expanded)
  const now = new Date();
  const shiftsForDate = allExpandedShifts.filter(s => s.start.split('T')[0] === selectedDate && new Date(s.end) > now);

  // Filtered colleagues by search
  const filteredColleagues = colleagues.filter(c =>
    c.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  // In the FlatList renderItem for shiftsForDate, show a label/icon if a recurring swap exists for that shift instance
  const swapsForThisDay = useMemo(() => {
    const date = selectedDate;
    return allSwaps.filter(swap => swap.recurringInstanceDate && swap.recurringInstanceDate.split('T')[0] === date);
  }, [allSwaps, selectedDate]);

  // In the swapStep === 'shift' modal, filter colleagueShifts for conflicts
  const userExpandedShifts = useMemo(() => expandRecurringShifts(shifts), [shifts]);
  const nonConflictingColleagueShifts = useMemo(() => {
    return colleagueShifts.filter(colShift => {
      const colStart = new Date(colShift.start);
      const colEnd = new Date(colShift.end);
      return !userExpandedShifts.some(userShift =>
        isOverlap(colStart, colEnd, new Date(userShift.start), new Date(userShift.end))
      );
    });
  }, [colleagueShifts, userExpandedShifts]);

  // Add isAdmin check
  const isAdmin = user?.email?.endsWith('@admin.com');

  return (
    <Background>
      <Calendar
        style={{ borderRadius: 16, width: 350, elevation: 2 }}
        theme={{
          backgroundColor: '#F5F3EC',
          calendarBackground: '#F5F3EC',
          textSectionTitleColor: '#A15C48',
          selectedDayBackgroundColor: '#B3A8C9',
          selectedDayTextColor: '#000',
          todayTextColor: '#A15C48',
          dayTextColor: '#000',
          textDisabledColor: '#ccc',
          monthTextColor: '#A15C48',
          arrowColor: '#A15C48',
          textDayFontWeight: 'bold',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: 'bold',
        }}
        markedDates={markedDates}
        onDayPress={day => setSelectedDate(day.dateString)}
      />
      <FlatList
        data={shiftsForDate}
        keyExtractor={item => item.shiftId}
        renderItem={({ item }) => (
          <ShiftCard>
            <ShiftText>Shift: {item.shiftId}</ShiftText>
            <ShiftText>Start: {new Date(item.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</ShiftText>
            <ShiftText>End: {new Date(item.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</ShiftText>
            <ShiftText>Location: {item.location}</ShiftText>
            {item.status === 'open' && (
              <ShiftText style={{ color: '#92A378', fontWeight: 'bold' }}>🟢 Open Shift</ShiftText>
            )}
            {item._recurring && <ShiftText style={{ color: '#2D4F4A' }}>(Recurring)</ShiftText>}
            {/* Recurring swap label */}
            {swapsForThisDay.some(s => s.requesterShiftId === item.shiftId || s.targetShiftId === item.shiftId) && (
              <ShiftText style={{ color: '#8DB1A4', fontWeight: 'bold' }}>🔁 Recurring Swap Requested</ShiftText>
            )}
            {/* Show swap status if present */}
            {swapsForThisDay.filter(s => s.requesterShiftId === item.shiftId || s.targetShiftId === item.shiftId).map(swap => (
              <ShiftText key={swap.swapId} style={{ color: swap.status === 'pending' ? '#B3A8C9' : swap.status === 'accepted' ? '#92A378' : swap.status === 'rejected' ? '#d32f2f' : '#44291A', fontWeight: 'normal' }}>
                Status: {swap.status}
              </ShiftText>
            ))}
            {/* Open shift bidding button */}
            {item.status === 'open' && user && (!item.bids || !item.bids.some(b => b.userId === user.uid)) && (
              <TouchableOpacity
                style={{
                  marginTop: 12,
                  backgroundColor: '#92A378',
                  borderRadius: 20,
                  paddingVertical: 10,
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 2,
                }}
                onPress={() => {
                  setBidShift(item);
                  setBidModalVisible(true);
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Bid for this Shift</Text>
              </TouchableOpacity>
            )}
            {/* Only allow swap if shift is in the future and not open */}
            {item.status !== 'open' && new Date(item.end) > now ? (
              <TouchableOpacity
                style={{
                  marginTop: 12,
                  backgroundColor: '#B3A8C9',
                  borderRadius: 20,
                  paddingVertical: 10,
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 2,
                }}
                onPress={() => {
                  setSelectedShift(item);
                  setSwapModalVisible(true);
                }}
              >
                <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 16 }}>Propose Swap</Text>
              </TouchableOpacity>
            ) : item.status !== 'open' ? (
              <ShiftText>Status: Completed</ShiftText>
            ) : null}
            {/* Show bids if present */}
            {item.status === 'open' && item.bids && item.bids.length > 0 && (
              <View style={{ marginTop: 8 }}>
                <ShiftText style={{ color: '#2D4F4A', fontWeight: 'bold' }}>Bids:</ShiftText>
                {item.bids.map((bid, idx) => (
                  <ShiftText key={idx} style={{ color: '#8DB1A4', fontWeight: 'normal' }}>
                    {bid.userId}{bid.message ? `: ${bid.message}` : ''} ({new Date(bid.timestamp).toLocaleString()})
                  </ShiftText>
                ))}
              </View>
            )}
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
                        <TouchableOpacity
                          style={{ backgroundColor: '#92A378', marginVertical: 0, marginLeft: 8, padding: 8, borderRadius: 12, width: 80, alignItems: 'center' }}
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
                          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Assign</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </>
                ) : (
                  <ShiftText style={{ color: '#aaa', fontWeight: 'normal' }}>No bids yet.</ShiftText>
                )}
              </>
            )}
          </ShiftCard>
        )}
        style={{ marginTop: 16, width: 350 }}
        ListEmptyComponent={<ShiftText>No shifts for this day.</ShiftText>}
      />
      {/* Swap Modal: Step 1 - Select Colleague */}
      <Modal
        visible={swapModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setSwapModalVisible(false);
          setSwapStep('colleague');
          setSelectedColleague(null);
        }}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: 340, maxHeight: 500 }}>
            {swapStep === 'colleague' && (
              <>
                {/* Modal header */}
                <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12, color: '#A15C48', textAlign: 'center' }}>
                  Propose Swap: Select Colleague
                </Text>
                {/* Search input */}
                <TextInput
                  placeholder="Search colleagues..."
                  value={search}
                  onChangeText={setSearch}
                  style={{
                    borderWidth: 1,
                    borderColor: '#B3A8C9',
                    borderRadius: 8,
                    padding: 10,
                    marginBottom: 12,
                    fontSize: 16,
                  }}
                  placeholderTextColor="#aaa"
                  accessibilityLabel="Search colleagues"
                />
                {/* Loading, error, or list of colleagues */}
                {colleaguesLoading ? (
                  <ActivityIndicator color="#A15C48" style={{ marginVertical: 20 }} />
                ) : colleaguesError ? (
                  <Text style={{ color: '#d32f2f', textAlign: 'center', marginBottom: 12 }}>{colleaguesError}</Text>
                ) : (
                  <FlatList
                    data={filteredColleagues}
                    keyExtractor={item => item.uid}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee' }}
                        onPress={() => {
                          setSelectedColleague(item);
                          setSwapStep('shift');
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`Select ${item.displayName || item.email} as swap partner`}
                      >
                        <Text style={{ fontSize: 16, color: '#2D4F4A' }}>{item.displayName || item.email}</Text>
                      </TouchableOpacity>
                    )}
                    style={{ maxHeight: 300 }}
                    ListEmptyComponent={<Text style={{ color: '#aaa', textAlign: 'center', marginTop: 20 }}>No colleagues found.</Text>}
                  />
                )}
                {/* Cancel button */}
                <TouchableOpacity
                  style={{ marginTop: 16, alignItems: 'center' }}
                  onPress={() => {
                    setSwapModalVisible(false);
                    setSwapStep('colleague');
                    setSelectedColleague(null);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel swap proposal"
                >
                  <Text style={{ color: '#A15C48', fontWeight: 'bold', fontSize: 16 }}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
            {/* Swap Modal: Step 2 - Select Colleague's Shift */}
            {swapStep === 'shift' && selectedColleague && (
              <>
                <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12, color: '#A15C48', textAlign: 'center' }}>
                  Select a Shift from {selectedColleague.displayName || selectedColleague.email}
                </Text>
                {shiftsLoading ? (
                  <ActivityIndicator color="#A15C48" style={{ marginVertical: 20 }} />
                ) : shiftsError ? (
                  <Text style={{ color: '#d32f2f', textAlign: 'center', marginBottom: 12 }}>{shiftsError}</Text>
                ) : (
                  <FlatList
                    data={nonConflictingColleagueShifts}
                    keyExtractor={item => item.shiftId}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee' }}
                        onPress={() => {
                          setSelectedColleagueShift(item);
                          setSwapStep('message');
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`Select shift ${item.shiftId} for swap`}
                      >
                        <Text style={{ fontSize: 16, color: '#2D4F4A' }}>
                          {new Date(item.start).toLocaleDateString()} {new Date(item.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(item.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        <Text style={{ fontSize: 14, color: '#8DB1A4' }}>{item.location}</Text>
                      </TouchableOpacity>
                    )}
                    style={{ maxHeight: 300 }}
                    ListEmptyComponent={<Text style={{ color: '#d32f2f', textAlign: 'center', marginTop: 20 }}>No non-conflicting shifts found for this colleague.</Text>}
                  />
                )}
                {/* Back button */}
                <TouchableOpacity
                  style={{ marginTop: 16, alignItems: 'center' }}
                  onPress={() => {
                    setSwapStep('colleague');
                    setSelectedColleague(null);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Back to colleague selection"
                >
                  <Text style={{ color: '#A15C48', fontWeight: 'bold', fontSize: 16 }}>Back</Text>
                </TouchableOpacity>
              </>
            )}
            {swapStep === 'message' && selectedColleague && selectedColleagueShift && selectedShift && (
              <>
                <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12, color: '#A15C48', textAlign: 'center' }}>
                  Add a message (optional)
                </Text>
                <TextInput
                  placeholder="Message..."
                  value={swapMessage}
                  onChangeText={setSwapMessage}
                  style={{
                    borderWidth: 1,
                    borderColor: '#B3A8C9',
                    borderRadius: 8,
                    padding: 10,
                    marginBottom: 12,
                    fontSize: 16,
                  }}
                  placeholderTextColor="#aaa"
                  multiline
                />
                {selectedShift._recurring && (
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}
                    onPress={() => setProposeAllRecurring(v => !v)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: proposeAllRecurring }}
                  >
                    <View style={{
                      width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: '#2D4F4A', marginRight: 8,
                      backgroundColor: proposeAllRecurring ? '#8DB1A4' : '#fff', justifyContent: 'center', alignItems: 'center',
                    }}>
                      {proposeAllRecurring && <Text style={{ color: '#fff', fontWeight: 'bold' }}>✓</Text>}
                    </View>
                    <Text style={{ color: '#2D4F4A', fontSize: 15 }}>Propose for all future instances of this recurring shift</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={{
                    backgroundColor: '#B3A8C9',
                    borderRadius: 20,
                    paddingVertical: 12,
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                  onPress={async () => {
                    try {
                      if (proposeAllRecurring && selectedShift._recurring) {
                        // Find all future instances of this recurring shift
                        const recurringInstances = allExpandedShifts.filter(s =>
                          s._recurring &&
                          s.userId === selectedShift.userId &&
                          s.location === selectedShift.location &&
                          s.start >= selectedShift.start // Only future instances
                        );
                        const recurringParentId = firestore().collection('swaps').doc().id;
                        await Promise.all(recurringInstances.map(instance => {
                          const swapId = firestore().collection('swaps').doc().id;
                          return addSwap({
                            swapId,
                            requesterId: user?.uid,
                            requesterShiftId: instance.shiftId,
                            targetUserId: selectedColleague.uid,
                            targetShiftId: selectedColleagueShift.shiftId,
                            status: 'pending',
                            proposedBy: 'A',
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            message: swapMessage,
                            recurringParentId,
                            recurringInstanceDate: instance.start,
                          });
                        }));
                        setSwapModalVisible(false);
                        setSwapStep('colleague');
                        setSelectedColleague(null);
                        setSelectedColleagueShift(null);
                        setSwapMessage('');
                        setProposeAllRecurring(false);
                        Alert.alert('Recurring Swaps Proposed', 'Your swap requests for all future instances have been sent!');
                      } else {
                        const swapId = firestore().collection('swaps').doc().id;
                        await addSwap({
                          swapId,
                          requesterId: user?.uid,
                          requesterShiftId: selectedShift.shiftId,
                          targetUserId: selectedColleague.uid,
                          targetShiftId: selectedColleagueShift.shiftId,
                          status: 'pending',
                          proposedBy: 'A',
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                          message: swapMessage,
                          ...(selectedShift._recurring ? {
                            recurringParentId: undefined,
                            recurringInstanceDate: selectedShift.start,
                          } : {}),
                        });
                        setSwapModalVisible(false);
                        setSwapStep('colleague');
                        setSelectedColleague(null);
                        setSelectedColleagueShift(null);
                        setSwapMessage('');
                        setProposeAllRecurring(false);
                        Alert.alert('Swap Proposed', 'Your swap request has been sent!');
                      }
                    } catch (err) {
                      Alert.alert('Error', 'Failed to propose swap. Please try again.');
                    }
                  }}
                >
                  <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 16 }}>Send Swap Request</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ alignItems: 'center' }}
                  onPress={() => {
                    setSwapStep('shift');
                    setSelectedColleagueShift(null);
                  }}
                >
                  <Text style={{ color: '#A15C48', fontWeight: 'bold', fontSize: 16 }}>Back</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
      {/* Bid Modal */}
      <Modal
        visible={bidModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setBidModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: 340, maxWidth: 400 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12, color: '#A15C48', textAlign: 'center' }}>
              Bid for Shift
            </Text>
            <TextInput
              placeholder="Message (optional)"
              value={bidMessage}
              onChangeText={setBidMessage}
              style={{
                borderWidth: 1,
                borderColor: '#B3A8C9',
                borderRadius: 8,
                padding: 10,
                marginBottom: 12,
                fontSize: 16,
              }}
              placeholderTextColor="#aaa"
              multiline
            />
            <TouchableOpacity
              style={{
                backgroundColor: '#92A378',
                borderRadius: 20,
                paddingVertical: 12,
                alignItems: 'center',
                marginBottom: 8,
              }}
              disabled={bidLoading}
              onPress={async () => {
                if (!bidShift || !user) return;
                setBidLoading(true);
                try {
                  const newBid = { userId: user.uid, message: bidMessage, timestamp: new Date().toISOString() };
                  await updateShift(bidShift.shiftId, {
                    bids: firestore.FieldValue.arrayUnion(newBid),
                  });
                  setBidModalVisible(false);
                  setBidMessage('');
                  setBidShift(null);
                  Alert.alert('Bid Submitted', 'Your bid for the shift has been submitted!');
                } catch (err) {
                  Alert.alert('Error', 'Failed to submit bid. Please try again.');
                } finally {
                  setBidLoading(false);
                }
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{bidLoading ? 'Submitting...' : 'Submit Bid'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ alignItems: 'center' }}
              onPress={() => setBidModalVisible(false)}
            >
              <Text style={{ color: '#A15C48', fontWeight: 'bold', fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Background>
  );
} 