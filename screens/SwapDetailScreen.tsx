import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, SafeAreaView, Keyboard, TouchableWithoutFeedback } from 'react-native';
import auth from '@react-native-firebase/auth';
import { getSwap, onSwapMessagesChange, addSwapMessage, acceptSwapAtomic, updateSwap, getUserShifts, getUser, getShift, updateSwapMessageStatus } from './firestoreHelpers';
import styled from 'styled-components/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const Container = styled.View`
  flex: 1;
  background-color: #F5F3EC;
  padding: 16px;
`;

const Card = styled.View`
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  shadow-color: #000;
  shadow-opacity: 0.08;
  shadow-radius: 8px;
  shadow-offset: 0px 2px;
  elevation: 2;
`;

const MessageBubble = styled.View<{ mine: boolean }>`
  background: ${props => (props.mine ? '#B3A8C9' : '#eee')};
  align-self: ${props => (props.mine ? 'flex-end' : 'flex-start')};
  border-radius: 16px;
  margin-vertical: 4px;
  padding: 10px 16px;
  max-width: 80%;
`;

const MessageText = styled.Text`
  color: #000;
  font-size: 15px;
`;

// SwapDetailScreen: Shows details and chat for a specific swap request
export default function SwapDetailScreen({ route, navigation }: any) {
  const { swapId } = route.params;
  const user = auth().currentUser;
  // State for swap, messages, chat input, loading, error, and UI flow
  const [swap, setSwap] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const [counterStep, setCounterStep] = useState(false);
  const [myShifts, setMyShifts] = useState<any[]>([]);
  const [selectedCounterShift, setSelectedCounterShift] = useState<any>(null);
  const [requester, setRequester] = useState<any>(null);
  const [target, setTarget] = useState<any>(null);
  const [requesterShift, setRequesterShift] = useState<any>(null);
  const [targetShift, setTargetShift] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const updatedMessageIds = useRef<Set<string>>(new Set());

  // Load swap details and listen for real-time message updates
  useEffect(() => {
    getSwap(swapId)
      .then(doc => setSwap(doc.data()))
      .catch(err => setLoadError('Failed to load swap details. Please check your connection and try again.'));
    const unsubMsgs = onSwapMessagesChange(swapId, setMessages);
    return () => unsubMsgs();
  }, [swapId]);

  // Fetch user and shift info for display
  useEffect(() => {
    if (swap?.requesterId) {
      getUser(swap.requesterId).then(doc => setRequester(doc.data()));
    }
  }, [swap?.requesterId]);

  useEffect(() => {
    if (swap?.targetUserId) {
      getUser(swap.targetUserId).then(doc => setTarget(doc.data()));
    }
  }, [swap?.targetUserId]);

  useEffect(() => {
    if (swap?.requesterShiftId) {
      getShift(swap.requesterShiftId).then(doc => setRequesterShift(doc.data()));
    }
  }, [swap?.requesterShiftId]);

  useEffect(() => {
    if (swap?.targetShiftId) {
      getShift(swap.targetShiftId).then(doc => setTargetShift(doc.data()));
    }
  }, [swap?.targetShiftId]);

  // Update message statuses to 'delivered' or 'seen' when appropriate
  useEffect(() => {
    if (!messages.length || !user) return;
    messages.forEach(msg => {
      if (updatedMessageIds.current.has(msg.id)) return;
      if (msg.senderId !== user.uid && msg.status !== 'seen') {
        updateSwapMessageStatus(swapId, msg.id, 'seen');
        updatedMessageIds.current.add(msg.id);
      } else if (msg.senderId === user.uid && msg.status === 'sent') {
        updateSwapMessageStatus(swapId, msg.id, 'delivered');
        updatedMessageIds.current.add(msg.id);
      }
    });
  }, [messages, user, swapId]);

  // Send a chat message
  const sendMessage = async () => {
    if (!input.trim()) return;
    setChatLoading(true);
    await addSwapMessage(swapId, {
      senderId: user?.uid,
      text: input,
      timestamp: new Date().toISOString(),
    });
    setInput('');
    setChatLoading(false);
  };

  // Helper to check for time overlap
  function isOverlap(startA: Date, endA: Date, startB: Date, endB: Date) {
    return startA < endB && endA > startB;
  }

  // Accept the swap (atomic transaction)
  const handleAccept = async () => {
    try {
      setActionLoading(true);
      // Conflict detection: fetch all of the user's shifts except the one being swapped
      const userShifts = (await getUserShifts(user?.uid)).filter(s => s.shiftId !== swap.targetShiftId);
      // Expand recurring shifts
      const expandedUserShifts = expandRecurringShifts(userShifts);
      // Get the new shift (the one being swapped in)
      const newShiftDoc = await getShift(swap.requesterShiftId);
      const newShift = newShiftDoc.data();
      if (newShift) {
        const newStart = new Date(newShift.start);
        const newEnd = new Date(newShift.end);
        for (const s of expandedUserShifts) {
          const existStart = new Date(s.start);
          const existEnd = new Date(s.end);
          if (isOverlap(newStart, newEnd, existStart, existEnd)) {
            Alert.alert('Shift Conflict', 'Accepting this swap would create a conflict with one of your existing or recurring shifts.');
            setActionLoading(false);
            return;
          }
        }
      }
      await acceptSwapAtomic(swapId, swap.requesterShiftId, swap.targetShiftId);
      Alert.alert('Swap Accepted', 'You have accepted the swap.');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Failed to accept swap.');
    } finally {
      setActionLoading(false);
    }
  };

  // Reject the swap
  const handleReject = async () => {
    try {
      setActionLoading(true);
      await updateSwap(swapId, { status: 'rejected', updatedAt: new Date().toISOString() });
      Alert.alert('Swap Rejected', 'You have rejected the swap.');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Failed to reject swap.');
    } finally {
      setActionLoading(false);
    }
  };

  // Start counter-proposal flow (fetch user's shifts)
  const handleCounter = async () => {
    setCounterStep(true);
    const shifts = await getUserShifts(user?.uid);
    setMyShifts(shifts);
  };

  // Send a counter-proposal
  const sendCounterProposal = async () => {
    if (!selectedCounterShift) return;
    try {
      setActionLoading(true);
      await updateSwap(swapId, {
        status: 'counter',
        proposedBy: user?.uid === swap.requesterId ? 'A' : 'B',
        targetShiftId: selectedCounterShift.shiftId,
        updatedAt: new Date().toISOString(),
        historyPush: {
          by: user?.uid === swap.requesterId ? 'A' : 'B',
          shiftId: selectedCounterShift.shiftId,
          timestamp: new Date().toISOString(),
        },
      });
      await addSwapMessage(swapId, {
        senderId: user?.uid,
        text: `Counter-proposed shift: ${selectedCounterShift.shiftId}`,
        timestamp: new Date().toISOString(),
      });
      setCounterStep(false);
      setSelectedCounterShift(null);
      Alert.alert('Counter Proposal Sent', 'You have sent a counter-proposal.');
    } catch (err) {
      Alert.alert('Error', 'Failed to send counter-proposal.');
    } finally {
      setActionLoading(false);
    }
  };

  // Error fallback UI for failed swap load
  if (loadError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F3EC' }}>
        <Text style={{ color: '#d32f2f', fontWeight: 'bold', fontSize: 16, marginBottom: 12 }}>{loadError}</Text>
        <TouchableOpacity
          style={{ backgroundColor: '#B3A8C9', borderRadius: 20, padding: 12 }}
          onPress={() => {
            setLoadError(null);
            setSwap(null);
            getSwap(swapId)
              .then(doc => setSwap(doc.data()))
              .catch(err => setLoadError('Failed to load swap details. Please check your connection and try again.'));
          }}
        >
          <Text style={{ color: '#000', fontWeight: 'bold' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!swap) return <Text>Loading...</Text>;

  const renderSwapDetails = () => (
    <View style={{ paddingBottom: 8 }}>
      <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#A15C48', marginBottom: 8 }}>Swap Details</Text>
      <Text style={{ marginBottom: 4 }}>From: {requester?.displayName || swap.requesterId}</Text>
      <Text style={{ marginBottom: 4 }}>To: {target?.displayName || swap.targetUserId}</Text>
      <Text style={{ marginBottom: 4 }}>Requester Shift: {requesterShift ? `${new Date(requesterShift.start).toLocaleString()} - ${new Date(requesterShift.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} @ ${requesterShift.location}` : swap.requesterShiftId}</Text>
      <Text style={{ marginBottom: 4 }}>Target Shift: {targetShift ? `${new Date(targetShift.start).toLocaleString()} - ${new Date(targetShift.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} @ ${targetShift.location}` : swap.targetShiftId}</Text>
      <Text style={{ marginBottom: 4 }}>Message: {swap.message || '—'}</Text>
      {/* Swap history timeline */}
      {swap.history && Array.isArray(swap.history) && swap.history.length > 0 && (
        <View style={{ marginTop: 8, marginBottom: 8 }}>
          <Text style={{ fontWeight: 'bold', color: '#A15C48', marginBottom: 4 }}>History:</Text>
          {swap.history.map((h: any, idx: number) => (
            <Text key={idx} style={{ fontSize: 13, color: '#44291A' }}>
              {h.by}: {h.shiftId} ({new Date(h.timestamp).toLocaleString()})
            </Text>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1, padding: 16, backgroundColor: '#F5F3EC' }}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <MessageBubble mine={item.senderId === user?.uid}>
                <Text style={{ fontWeight: 'bold', fontSize: 13, color: '#A15C48' }}>
                  {item.senderId === requester?.uid ? requester?.displayName : item.senderId === target?.uid ? target?.displayName : item.senderId}
                </Text>
                <MessageText>{item.text}</MessageText>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 2 }}>
                  <Text style={{ fontSize: 11, color: '#888', marginRight: 4 }}>
                    {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </Text>
                  {item.senderId === user?.uid && (
                    item.status === 'sent' ? <MaterialCommunityIcons name="check" size={16} color="#888" /> :
                    item.status === 'delivered' ? <MaterialCommunityIcons name="check-all" size={16} color="#888" /> :
                    item.status === 'seen' ? <MaterialCommunityIcons name="check-all" size={16} color="#2196F3" /> : null
                  )}
                </View>
              </MessageBubble>
            )}
            style={{ marginBottom: 8 }}
            scrollEnabled={true}
            ListHeaderComponent={renderSwapDetails}
          />
          {/* Chat input pinned to bottom */}
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 24, padding: 8, marginTop: 0, marginBottom: 24 }}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Type a message..."
              style={{ flex: 1, fontSize: 16, padding: 8 }}
              placeholderTextColor="#aaa"
              onSubmitEditing={() => { sendMessage(); Keyboard.dismiss(); }}
              returnKeyType="send"
              editable={!chatLoading}
            />
            <TouchableOpacity onPress={() => { sendMessage(); Keyboard.dismiss(); }} style={{ marginLeft: 8 }} disabled={chatLoading}>
              <Text style={{ color: '#A15C48', fontWeight: 'bold', fontSize: 16 }}>Send</Text>
            </TouchableOpacity>
            {chatLoading && <ActivityIndicator color="#A15C48" style={{ marginLeft: 8 }} />}
          </View>
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#44291A', marginBottom: 4 }}>Status: {swap.status.charAt(0).toUpperCase() + swap.status.slice(1)}</Text>
            {swap.status === 'pending' && swap.targetUserId === user?.uid && (
              <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8 }}>
                <TouchableOpacity
                  style={{ backgroundColor: '#92A378', borderRadius: 20, padding: 12, marginHorizontal: 8 }}
                  onPress={handleAccept}
                  disabled={actionLoading}
                  accessibilityRole="button"
                  accessibilityLabel="Accept swap request"
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>{actionLoading ? 'Accepting...' : 'Accept'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ backgroundColor: '#d32f2f', borderRadius: 20, padding: 12, marginHorizontal: 8 }}
                  onPress={handleReject}
                  disabled={actionLoading}
                  accessibilityRole="button"
                  accessibilityLabel="Reject swap request"
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>{actionLoading ? 'Rejecting...' : 'Reject'}</Text>
                </TouchableOpacity>
              </View>
            )}
            {swap.status !== 'pending' && (
              <Text style={{ color: '#2D4F4A', fontWeight: 'bold', marginTop: 8 }}>
                {swap.status === 'accepted' && 'Swap accepted and completed.'}
                {swap.status === 'rejected' && 'Swap was rejected.'}
                {swap.status === 'counter' && 'Counter-proposal sent.'}
              </Text>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
} 