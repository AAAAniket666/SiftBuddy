import React, { useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import auth from '@react-native-firebase/auth';
import { onSwapsChange, Swap, getUser } from './firestoreHelpers';
import styled from 'styled-components/native';
import { useIsFocused } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';

const Container = styled.View`
  flex: 1;
  background-color: #F5F3EC;
  padding: 16px;
`;

const SwapCard = styled.View`
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

const SwapText = styled.Text`
  color: #44291A;
  font-weight: bold;
  font-size: 15px;
`;

// SwapInboxScreen: Shows all swap requests (incoming/outgoing) for the current user
export default function SwapInboxScreen({ navigation }: any) {
  const user = auth().currentUser;
  // State for all swaps, loading, banner, and filter
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<string | null>(null);
  const isFocused = useIsFocused();
  const [filter, setFilter] = useState<'all' | 'incoming' | 'outgoing'>('all');
  const [userEmails, setUserEmails] = useState<Record<string, string>>({});
  // Only show swaps whose target or requester shift end time is in the future
  const now = new Date();
  const [shiftEndTimes, setShiftEndTimes] = useState<Record<string, string>>({});

  // Listen for real-time swap changes
  useEffect(() => {
    if (!isFocused) return;
    let lastStatuses: Record<string, string> = {};
    const unsubscribe = onSwapsChange(allSwaps => {
      const userSwaps = allSwaps.filter(s => s.requesterId === user?.uid || s.targetUserId === user?.uid);
      setSwaps(userSwaps);
      // Show banner if a swap status changes
      userSwaps.forEach(swap => {
        if (lastStatuses[swap.swapId] && lastStatuses[swap.swapId] !== swap.status) {
          setBanner(`Swap with ${swap.requesterId === user?.uid ? swap.targetUserId : swap.requesterId} is now ${swap.status}`);
          setTimeout(() => setBanner(null), 3000);
        }
        lastStatuses[swap.swapId] = swap.status;
      });
      setLoading(false);
    });
    return unsubscribe;
  }, [user, isFocused]);

  // Set tab badge for pending incoming swaps
  useEffect(() => {
    if (!navigation || !navigation.setOptions) return;
    const pendingIncoming = swaps.filter(s => s.targetUserId === user?.uid && s.status === 'pending').length;
    navigation.setOptions({ tabBarBadge: pendingIncoming > 0 ? pendingIncoming : undefined });
  }, [swaps, user, navigation]);

  // Fetch emails for all users in swaps
  useEffect(() => {
    const fetchEmails = async () => {
      const ids = Array.from(new Set(swaps.flatMap(s => [s.requesterId, s.targetUserId])));
      const emails: Record<string, string> = {};
      await Promise.all(ids.map(async id => {
        if (!userEmails[id]) {
          const doc = await getUser(id);
          emails[id] = doc.data()?.email || id;
        }
      }));
      setUserEmails(prev => ({ ...prev, ...emails }));
    };
    if (swaps.length > 0) fetchEmails();
  }, [swaps]);

  // Fetch shift end times for all swaps
  useEffect(() => {
    const fetchShiftEnds = async () => {
      const ids = Array.from(new Set(swaps.flatMap(s => [s.requesterShiftId, s.targetShiftId])));
      const ends: Record<string, string> = {};
      await Promise.all(ids.map(async id => {
        if (id && !shiftEndTimes[id]) {
          const doc = await firestore().collection('shifts').doc(id).get();
          ends[id] = doc.data()?.end || '';
        }
      }));
      setShiftEndTimes(prev => ({ ...prev, ...ends }));
    };
    if (swaps.length > 0) fetchShiftEnds();
  }, [swaps]);

  // Filter swaps to only show those with future end times
  const filteredSwaps = swaps.filter(s => {
    const requesterEnd = shiftEndTimes[s.requesterShiftId];
    const targetEnd = shiftEndTimes[s.targetShiftId];
    return (requesterEnd && new Date(requesterEnd) > now) || (targetEnd && new Date(targetEnd) > now);
  });

  // Group swaps by recurringParentId
  const groupedSwaps: { [key: string]: Swap[] } = {};
  filteredSwaps.forEach(swap => {
    const groupKey = swap.recurringParentId || swap.swapId;
    if (!groupedSwaps[groupKey]) groupedSwaps[groupKey] = [];
    groupedSwaps[groupKey].push(swap);
  });
  const groupKeys = Object.keys(groupedSwaps).sort((a, b) => {
    // Sort by first swap's createdAt
    const aDate = groupedSwaps[a][0].createdAt;
    const bDate = groupedSwaps[b][0].createdAt;
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} color="#A15C48" />;
  }

  return (
    <Container>
      {/* Banner for real-time swap status updates */}
      {banner && (
        <View style={{ backgroundColor: '#B3A8C9', padding: 12, borderRadius: 12, marginBottom: 8 }}>
          <Text style={{ color: '#000', fontWeight: 'bold', textAlign: 'center' }}>{banner}</Text>
        </View>
      )}
      <Text style={{ fontWeight: 'bold', fontSize: 22, color: '#A15C48', marginBottom: 16, textAlign: 'center' }}>
        Swap Requests
      </Text>
      {/* Filter buttons for All, Incoming, Outgoing */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 12 }}>
        <TouchableOpacity
          onPress={() => setFilter('all')}
          style={{ marginHorizontal: 8, padding: 8, borderRadius: 8, backgroundColor: filter === 'all' ? '#B3A8C9' : '#eee' }}
          accessibilityRole="button"
          accessibilityLabel="Show all swap requests"
        >
          <Text style={{ fontWeight: 'bold', color: filter === 'all' ? '#000' : '#44291A' }}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFilter('incoming')}
          style={{ marginHorizontal: 8, padding: 8, borderRadius: 8, backgroundColor: filter === 'incoming' ? '#92A378' : '#eee' }}
          accessibilityRole="button"
          accessibilityLabel="Show incoming swap requests"
        >
          <Text style={{ fontWeight: 'bold', color: filter === 'incoming' ? '#000' : '#44291A' }}>Incoming</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFilter('outgoing')}
          style={{ marginHorizontal: 8, padding: 8, borderRadius: 8, backgroundColor: filter === 'outgoing' ? '#B3A8C9' : '#eee' }}
          accessibilityRole="button"
          accessibilityLabel="Show outgoing swap requests"
        >
          <Text style={{ fontWeight: 'bold', color: filter === 'outgoing' ? '#000' : '#44291A' }}>Outgoing</Text>
        </TouchableOpacity>
      </View>
      {/* List of swap requests, filtered by type */}
      {groupKeys.length === 0 ? (
        <SwapText>No swap requests yet.</SwapText>
      ) : (
        <FlatList
          data={groupKeys}
          keyExtractor={k => k}
          renderItem={({ item: groupKey }) => {
            const swapsInGroup = groupedSwaps[groupKey];
            const isRecurring = swapsInGroup[0].recurringParentId !== undefined;
            return (
              <View style={{ marginBottom: 16 }}>
                {isRecurring && (
                  <Text style={{ color: '#2D4F4A', fontWeight: 'bold', marginBottom: 4, fontSize: 15 }}>
                    🔁 Recurring Swap Series
                  </Text>
                )}
                {swapsInGroup.sort((a, b) => new Date(a.recurringInstanceDate || a.createdAt).getTime() - new Date(b.recurringInstanceDate || b.createdAt).getTime()).map(item => {
                  const isOutgoing = item.requesterId === user?.uid;
                  const otherUserId = isOutgoing ? item.targetUserId : item.requesterId;
                  const otherUserEmail = userEmails[otherUserId] || otherUserId;
                  return (
                    <TouchableOpacity
                      key={item.swapId}
                      onPress={() => navigation.navigate('SwapDetail', { swapId: item.swapId })}
                      accessibilityRole="button"
                      accessibilityLabel={`View details for ${isOutgoing ? 'outgoing' : 'incoming'} swap with ${otherUserEmail}`}
                    >
                      <SwapCard style={{ borderLeftWidth: 6, borderLeftColor: isOutgoing ? '#B3A8C9' : '#92A378', backgroundColor: isRecurring ? '#F0F7F5' : '#fff' }}>
                        <SwapText>{isOutgoing ? 'Outgoing' : 'Incoming'} Swap</SwapText>
                        <SwapText>Swap with: {otherUserEmail}</SwapText>
                        <SwapText>Status: {item.status}</SwapText>
                        <SwapText>Proposed: {new Date(item.createdAt).toLocaleString()}</SwapText>
                        {isRecurring && (
                          <SwapText style={{ color: '#8DB1A4', fontWeight: 'normal' }}>
                            Instance: {item.recurringInstanceDate ? new Date(item.recurringInstanceDate).toLocaleDateString() : ''}
                          </SwapText>
                        )}
                      </SwapCard>
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          }}
        />
      )}
    </Container>
  );
} 