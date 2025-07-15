import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, StyleSheet, Alert } from 'react-native';
import { subscribeToPtoRequests, reviewPtoRequest, PtoRequest } from './ptoService';

// TODO: Replace with real adminId from auth context
const ADMIN_ID = 'admin-demo';

const PtoApprovalScreen = () => {
  const [requests, setRequests] = useState<PtoRequest[]>([]);
  const [loading, setLoading] = useState('');

  useEffect(() => {
    const unsub = subscribeToPtoRequests(setRequests);
    return () => unsub && unsub();
  }, []);

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    setLoading(id + status);
    try {
      await reviewPtoRequest(id, status, ADMIN_ID);
      Alert.alert('Success', `Request ${status}`);
    } catch (e) {
      Alert.alert('Error', 'Failed to update request');
    }
    setLoading('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PTO Approval (Admin)</Text>
      <FlatList
        data={requests}
        keyExtractor={item => item.id || ''}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.dates}>{item.dates.map(d => new Date(d).toDateString()).join(', ')}</Text>
            <Text style={[styles.status, { color: statusColor(item.status) }]}>{item.status.toUpperCase()}</Text>
            {item.status === 'pending' && (
              <View style={styles.actions}>
                <Button
                  title="Approve"
                  color="#22c55e"
                  onPress={() => handleReview(item.id!, 'approved')}
                  disabled={loading === item.id + 'approved'}
                />
                <Button
                  title="Reject"
                  color="#ef4444"
                  onPress={() => handleReview(item.id!, 'rejected')}
                  disabled={loading === item.id + 'rejected'}
                />
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No PTO requests found.</Text>}
      />
    </View>
  );
};

function statusColor(status: string) {
  if (status === 'approved') return '#22c55e';
  if (status === 'rejected') return '#ef4444';
  return '#0EA5E9';
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  item: { padding: 12, borderBottomWidth: 1, borderColor: '#eee' },
  dates: { fontSize: 16, color: '#374151' },
  status: { fontWeight: 'bold', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  empty: { color: '#888', textAlign: 'center', marginTop: 32 },
});

export default PtoApprovalScreen;
