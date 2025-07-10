import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import styled from 'styled-components/native';
import { loadNotificationHistory, InAppNotification } from '../notificationHelper';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Container = styled.View`
  flex: 1;
  background-color: #F5F3EC;
  padding: 16px;
`;
const Title = styled.Text`
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 16px;
  color: #44291A;
`;
const NotifCard = styled.TouchableOpacity<{ read: boolean }>`
  background: ${({ read }) => (read ? '#E6E6E6' : '#FFF8F0')};
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid #A15C48;
`;
const NotifTitle = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: #A15C48;
`;
const NotifMsg = styled.Text`
  font-size: 15px;
  color: #2D4F4A;
  margin-top: 4px;
`;
const NotifTime = styled.Text`
  font-size: 12px;
  color: #888;
  margin-top: 6px;
`;
const DeleteBtn = styled.TouchableOpacity`
  position: absolute;
  right: 16px;
  top: 16px;
`;
const DeleteText = styled.Text`
  color: #d32f2f;
  font-size: 14px;
`;

function formatTime(ts: number) {
  return new Date(ts).toLocaleString();
}

export default function NotificationHistoryScreen() {
  const [history, setHistory] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = async () => {
    setLoading(true);
    const h = await loadNotificationHistory();
    setHistory(h);
    setLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const markAsRead = async (id: string) => {
    const newHistory = history.map(n => n.id === id ? { ...n, read: true } : n);
    setHistory(newHistory);
    await AsyncStorage.setItem('notification_history', JSON.stringify(newHistory));
  };

  const deleteNotif = async (id: string) => {
    const newHistory = history.filter(n => n.id !== id);
    setHistory(newHistory);
    await AsyncStorage.setItem('notification_history', JSON.stringify(newHistory));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <Container>
      <Title>Notification History</Title>
      <FlatList
        data={history}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <NotifCard read={item.read} onPress={() => markAsRead(item.id)}>
            <NotifTitle>{item.title}</NotifTitle>
            <NotifMsg>{item.message}</NotifMsg>
            <NotifTime>{formatTime(item.timestamp)}</NotifTime>
            <DeleteBtn onPress={() => deleteNotif(item.id)}>
              <DeleteText>Delete</DeleteText>
            </DeleteBtn>
          </NotifCard>
        )}
        ListEmptyComponent={<Text style={{ color: '#888', textAlign: 'center', marginTop: 32 }}>No notifications yet.</Text>}
      />
    </Container>
  );
} 