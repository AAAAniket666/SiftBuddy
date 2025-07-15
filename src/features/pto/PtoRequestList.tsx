import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { subscribeToPtoRequests, PtoRequest } from './ptoService';

const PtoRequestList = ({ userId }: { userId: string }) => {
  const [requests, setRequests] = useState<PtoRequest[]>([]);

  useEffect(() => {
    const unsub = subscribeToPtoRequests(setRequests, userId);
    return () => unsub && unsub();
  }, [userId]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My PTO Requests</Text>
      <FlatList
        data={requests}
        keyExtractor={item => item.id || ''}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.dates}>{item.dates.map(d => new Date(d).toDateString()).join(', ')}</Text>
            <Text style={[styles.status, { color: statusColor(item.status) }]}>{item.status.toUpperCase()}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No PTO requests yet.</Text>}
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
  empty: { color: '#888', textAlign: 'center', marginTop: 32 },
});

export default PtoRequestList;
